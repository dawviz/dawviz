// Tài liệu có hoàn tác và các lệnh (T-07, Technical Design §6.4). Hàm dựng lệnh nhận `doc` hiện tại để lấy giá trị "trước";
// trả null khi không có gì đổi (không ghi mục lịch sử rỗng). `redo`/`undo` là hàm thuần trên Doc bất biến.
import type { BrightnessConfig, NoteStyle, KeyboardStyle, PianoRollProps, SceneDocument, TextRef, TextStyleSet, WidgetLayout, WidgetSpec } from '@dawviz/render-core';
import type { Command } from './store.ts';
import { clampOffsetMs } from './audioMap.ts';
import { sceneForStyle, videoStyleBase, videoStyleKeyboard } from './videoScenes.ts';

export type TrackId = string;
export interface Doc {
  /** Id phong cách video đang chọn, hoặc 'custom' khi scene đến từ một preset mở từ tệp. */
  videoStyle: string;
  scene: SceneDocument;
  brightness: Record<TrackId, BrightnessConfig>;
  order: TrackId[];
  hidden: TrackId[];
  solo: TrackId[];
  /** Offset âm thanh so với dự án (ms; dương = âm thanh trễ, âm = sớm và cắt phần trước mốc 0). Thuộc dự án, không thuộc tệp (T-08). */
  audioOffsetMs: number;
  /**
   * Kiểu nốt của bộ dựng sẵn áp gần nhất (phong cách video, bộ kiểu nốt, hoặc preset mở từ tệp): nút ↺ cạnh mỗi thông số
   * đưa về giá trị này (D-57). Đổi cùng lệnh áp bộ dựng sẵn nên hoàn tác trả cả tham chiếu cũ.
   */
  lookRef: NoteStyle;
  /** Bố cục từng widget của phong cách/preset áp gần nhất: nút ↺ của X, Y, W, H đưa về đây. Đổi cùng lệnh đổi phong cách/mở preset. */
  layoutRef: Record<string, WidgetLayout>;
}
const layoutsOf = (s: SceneDocument): Record<string, WidgetLayout> => Object.fromEntries(s.widgets.map((w) => [w.id, w.layout]));
export type Cmd = Command<Doc>;
export const CUSTOM_STYLE = 'custom';

const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);
const keysChanged = (a: object, b: object) => Object.keys({ ...a, ...b }).filter((k) => !same((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));

/** Piano Roll đầu tiên của scene (hiện scene chỉ có một). */
export const pianoIndex = (s: SceneDocument) => s.widgets.findIndex((w) => w.type === 'PIANO_ROLL');
export const pianoOf = (s: SceneDocument): WidgetSpec<PianoRollProps> | undefined => s.widgets[pianoIndex(s)] as WidgetSpec<PianoRollProps> | undefined;

/** Dựng lệnh "đặt một phần của Doc": `get`/`set` chọn phần đó, `before` lấy từ doc hiện tại. */
function slice<V>(d: Doc, type: string, label: string, get: (d: Doc) => V, set: (d: Doc, v: V) => Doc, after: V, mergeKey?: string, params?: Cmd['params']): Cmd | null {
  const before = get(d);
  if (same(before, after)) return null;
  return { type, label, mergeKey, before, after, params, redo: (x) => set(x, after), undo: (x) => set(x, before) };
}

function withPiano(d: Doc, fn: (p: PianoRollProps) => PianoRollProps): Doc {
  const i = pianoIndex(d.scene);
  if (i < 0) return d;
  const w = d.scene.widgets[i] as WidgetSpec<PianoRollProps>;
  const widgets = d.scene.widgets.slice(); widgets[i] = { ...w, properties: fn(w.properties) };
  return { ...d, scene: { ...d.scene, widgets } };
}
const withWidget = (d: Doc, id: string, fn: (w: WidgetSpec) => WidgetSpec): Doc => {
  const i = d.scene.widgets.findIndex((w) => w.id === id);
  if (i < 0) return d;
  const widgets = d.scene.widgets.slice(); widgets[i] = fn(widgets[i]);
  return { ...d, scene: { ...d.scene, widgets } };
};

// ── kiểu nốt, bàn phím, ghi đè theo track ──
/** Đổi kiểu nốt toàn cục. Gộp theo trường đổi (kéo một thanh trượt = một bước). */
export const patchNoteStyle = (d: Doc, next: NoteStyle): Cmd | null => {
  const cur = pianoOf(d.scene)?.properties.noteStyle.base;
  if (!cur) return null;
  return slice(d, 'patchNoteStyle', 'web.cmd.noteStyle', (x) => pianoOf(x.scene)!.properties.noteStyle.base, (x, v) => withPiano(x, (p) => ({ ...p, noteStyle: { ...p.noteStyle, base: v } })), next, `note:${keysChanged(cur, next).join(',')}`);
};
/** Chọn bộ kiểu nốt dựng sẵn: thay cả `base`; hoàn tác trả lại đủ các chỉnh tay trước đó. Không gộp. */
export const applyNotePreset = (d: Doc, base: NoteStyle, presetId?: string): Cmd | null => {
  if (!pianoOf(d.scene)) return null;
  return slice(d, 'applyNotePreset', 'web.cmd.notePreset', (x) => ({ base: pianoOf(x.scene)!.properties.noteStyle.base, ref: x.lookRef }),
    (x, v) => ({ ...withPiano(x, (p) => ({ ...p, noteStyle: { ...p.noteStyle, base: v.base } })), lookRef: v.ref }), { base, ref: base }, undefined, { preset: presetId });
};
export const patchKeyboard = (d: Doc, next: KeyboardStyle): Cmd | null => {
  const cur = pianoOf(d.scene)?.properties.keyboard;
  if (!cur) return null;
  return slice(d, 'patchKeyboard', 'web.cmd.keyboard', (x) => pianoOf(x.scene)!.properties.keyboard, (x, v) => withPiano(x, (p) => ({ ...p, keyboard: v })), next, `kbd:${keysChanged(cur, next).join(',')}`);
};
/** Vị trí vạch phát của Piano Roll (0,05–0,95 bề rộng, REQ-GRAPHICS-16). Kéo/gõ liên tiếp gộp thành một bước. Khi bàn phím bật, Render Core bỏ qua giá trị này (T-71). */
export const setPlayheadRatio = (d: Doc, ratio: number): Cmd | null => {
  if (!pianoOf(d.scene)) return null;
  const v = Math.round(Math.min(0.95, Math.max(0.05, ratio)) * 100) / 100;
  return slice(d, 'setPlayheadRatio', 'web.cmd.playhead', (x) => pianoOf(x.scene)!.properties.playheadPositionRatio, (x, r) => withPiano(x, (p) => ({ ...p, playheadPositionRatio: r })), v, 'playhead.ratio');
};
/** Hiện/ẩn vạch phát (REQ-GRAPHICS-16). Ẩn chỉ bỏ nét vẽ; nốt vẫn phát tại vị trí vạch. */
export const setPlayheadVisible = (d: Doc, visible: boolean): Cmd | null => {
  if (!pianoOf(d.scene)) return null;
  return slice(d, 'setPlayheadVisible', 'web.cmd.playheadVisible', (x) => pianoOf(x.scene)!.properties.playheadVisible, (x, v) => withPiano(x, (p) => ({ ...p, playheadVisible: v })), visible);
};
/** Ghi đè kiểu nốt của một track (`patch` = null: bỏ ghi đè). */
export const patchTrackStyle = (d: Doc, id: TrackId, patch: Partial<NoteStyle> | null): Cmd | null => {
  const cur = pianoOf(d.scene)?.properties.noteStyle.tracks[id];
  const next = patch === null ? undefined : { ...cur, ...patch };
  const get = (x: Doc) => pianoOf(x.scene)!.properties.noteStyle.tracks[id];
  const set = (x: Doc, v: Partial<NoteStyle> | undefined) => withPiano(x, (p) => {
    const tracks = { ...p.noteStyle.tracks };
    if (v === undefined) delete tracks[id]; else tracks[id] = v;
    return { ...p, noteStyle: { ...p.noteStyle, tracks } };
  });
  if (!pianoOf(d.scene)) return null;
  return slice(d, 'patchTrackStyle', patch === null ? 'web.cmd.trackStyleClear' : 'web.cmd.trackStyle', get, set, next,
    patch === null ? undefined : `track:${id}:${keysChanged(cur ?? {}, next ?? {}).join(',')}`, { track: id });
};

// ── phong cách video ──
/** Thay cả scene bằng scene của phong cách `id`, giữ ghi đè theo track (hành vi cũ). Kiểu nốt tay chỉnh và bố cục widget cũ nằm trong lịch sử. */
export const setVideoStyle = (d: Doc, id: string): Cmd | null => {
  const tracks = pianoOf(d.scene)?.properties.noteStyle.tracks ?? {};
  const scene = sceneForStyle(id, { base: videoStyleBase(id), tracks }, {});
  const before = { videoStyle: d.videoStyle, scene: d.scene, lookRef: d.lookRef, layoutRef: d.layoutRef }, after = { videoStyle: id, scene, lookRef: videoStyleBase(id), layoutRef: layoutsOf(scene) };
  if (d.videoStyle === id && same(before.scene, scene)) return null;
  return { type: 'setVideoStyle', label: 'web.cmd.videoStyle', before, after, redo: (x) => ({ ...x, ...after }), undo: (x) => ({ ...x, ...before }) };
};
/** Mở preset: thay scene (và đánh dấu phong cách 'custom'). Một bước hoàn tác. */
export const loadPreset = (d: Doc, scene: SceneDocument): Cmd | null => {
  const base = pianoOf(scene)?.properties.noteStyle.base;
  const before = { videoStyle: d.videoStyle, scene: d.scene, lookRef: d.lookRef, layoutRef: d.layoutRef }, after = { videoStyle: CUSTOM_STYLE, scene, lookRef: base ? { ...base } : d.lookRef, layoutRef: layoutsOf(scene) };
  return { type: 'loadPreset', label: 'web.cmd.loadPreset', before, after, redo: (x) => ({ ...x, ...after }), undo: (x) => ({ ...x, ...before }) };
};

// ── độ sáng nền theo track ──
export const patchBrightness = (d: Doc, id: TrackId, next: BrightnessConfig): Cmd | null =>
  slice(d, 'patchBrightness', 'web.cmd.brightness', (x) => x.brightness[id], (x, v) => ({ ...x, brightness: { ...x.brightness, [id]: v } }), next, `bright:${id}:${keysChanged(d.brightness[id] ?? {}, next).join(',')}`, { track: id });

// ── ẩn/hiện, solo, thứ tự track ──
const toggled = (list: readonly string[], id: string) => list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
export const toggleHidden = (d: Doc, id: TrackId): Cmd | null => slice(d, 'toggleHidden', 'web.cmd.hide', (x) => x.hidden, (x, v) => ({ ...x, hidden: v }), toggled(d.hidden, id), undefined, { track: id, on: !d.hidden.includes(id) });
export const toggleSolo = (d: Doc, id: TrackId): Cmd | null => slice(d, 'toggleSolo', 'web.cmd.solo', (x) => x.solo, (x, v) => ({ ...x, solo: v }), toggled(d.solo, id), undefined, { track: id, on: !d.solo.includes(id) });
export const setAllHidden = (d: Doc, hidden: boolean): Cmd | null => slice(d, 'setAllHidden', 'web.cmd.hide', (x) => x.hidden, (x, v) => ({ ...x, hidden: v }), hidden ? [...d.order] : [], undefined, { hidden });
/** Ô "bật/tắt tất cả" của cột mắt: đang có track ẩn thì hiện hết trước; đã hiện hết thì ẩn hết. */
export const toggleAllHidden = (d: Doc): Cmd | null => setAllHidden(d, d.hidden.length === 0);
/** Ô "bỏ solo tất cả" của cột S. */
export const clearSolo = (d: Doc): Cmd | null => slice(d, 'clearSolo', 'web.cmd.solo', (x) => x.solo, (x, v) => ({ ...x, solo: v }), [], undefined, { n: d.solo.length });
export const moveTrack = (d: Doc, id: TrackId, to: number): Cmd | null => {
  const from = d.order.indexOf(id), dest = Math.max(0, Math.min(d.order.length - 1, to));
  if (from < 0 || from === dest) return null;
  const next = [...d.order]; next.splice(from, 1); next.splice(dest, 0, id);
  return slice(d, 'moveTrack', 'web.cmd.moveTrack', (x) => x.order, (x, v) => ({ ...x, order: v }), next, undefined, { track: id, from: from + 1, to: dest + 1 });
};

// ── âm thanh (T-08) ──
/** Đặt offset âm thanh (ms). Gõ/bấm ± liên tiếp gộp thành một bước. Kẹp ±10 s, làm tròn 1 ms. */
export const setAudioOffset = (d: Doc, ms: number): Cmd | null =>
  slice(d, 'setAudioOffset', 'web.cmd.audioOffset', (x) => x.audioOffsetMs, (x, v) => ({ ...x, audioOffsetMs: v }), clampOffsetMs(ms), 'audio.offset');

// ── bố cục widget (giao diện kéo thả ở T-68; lệnh làm ở đây để hoàn tác dùng chung) ──
/** Đổi layout widget (x, y, width, height, rotation, anchor). Gộp theo widget: kéo/đổi cỡ/xoay trong một cử chỉ là một bước. */
export const patchLayout = (d: Doc, widgetId: string, patch: Partial<WidgetLayout>): Cmd | null => {
  const w = d.scene.widgets.find((x) => x.id === widgetId);
  if (!w) return null;
  return slice(d, 'patchLayout', 'web.cmd.layout', (x) => x.scene.widgets.find((q) => q.id === widgetId)!.layout, (x, v) => withWidget(x, widgetId, (q) => ({ ...q, layout: v })), { ...w.layout, ...patch }, `layout:${widgetId}`, { widget: widgetId });
};
/**
 * Đổi layout của một hoặc nhiều widget trong MỘT lệnh (Editor: kéo, đổi cỡ, xoay, xoay nhóm). Gộp theo tập widget:
 * một cử chỉ kéo trên khung là một bước hoàn tác dù di chuyển mấy widget.
 */
export const patchLayouts = (d: Doc, patches: Record<string, Partial<WidgetLayout>>): Cmd | null => {
  const ids = Object.keys(patches).filter((id) => d.scene.widgets.some((w) => w.id === id)).sort();
  if (!ids.length) return null;
  const get = (x: Doc) => Object.fromEntries(ids.map((id) => [id, x.scene.widgets.find((q) => q.id === id)!.layout]));
  const set = (x: Doc, v: Record<string, WidgetLayout>) => ids.reduce((acc, id) => withWidget(acc, id, (q) => ({ ...q, layout: v[id] })), x);
  const after = Object.fromEntries(ids.map((id) => [id, { ...d.scene.widgets.find((q) => q.id === id)!.layout, ...patches[id] }]));
  return slice(d, 'patchLayouts', 'web.cmd.layout', get, set, after, `layouts:${ids.join('|')}`, { widgets: ids, ...(ids.length === 1 ? { widget: ids[0] } : {}) });
};
/** Đổi một số thuộc tính (`properties`) của widget. */
export const patchWidgetProps = (d: Doc, widgetId: string, patch: Record<string, unknown>): Cmd | null => {
  const w = d.scene.widgets.find((x) => x.id === widgetId);
  if (!w) return null;
  const get = (x: Doc) => x.scene.widgets.find((q) => q.id === widgetId)!.properties;
  return slice(d, 'patchWidgetProps', 'web.cmd.widgetProps', get, (x, v) => withWidget(x, widgetId, (q) => ({ ...q, properties: v })), { ...(w.properties as object), ...patch }, `prop:${widgetId}:${Object.keys(patch).join(',')}`, { widget: widgetId });
};
/**
 * Đổi ghi đè kiểu chữ của một chỗ chữ (T-72). `path` là thuộc tính vừa đổi: kéo/gõ liên tiếp cùng thuộc tính gộp một bước,
 * đổi thuộc tính khác là bước mới.
 */
export const patchTextRef = (d: Doc, widgetId: string, field: string, next: TextRef, path: string): Cmd | null => {
  const w = d.scene.widgets.find((x) => x.id === widgetId);
  if (!w) return null;
  const get = (x: Doc) => (x.scene.widgets.find((q) => q.id === widgetId)!.properties as Record<string, unknown>)[field] as TextRef;
  const set = (x: Doc, v: TextRef) => withWidget(x, widgetId, (q) => ({ ...q, properties: { ...(q.properties as object), [field]: v } }));
  return slice(d, 'patchTextRef', 'web.cmd.text', get, set, next, `text:${widgetId}:${field}:${path}`, { widget: widgetId, field });
};
/** Đổi bộ kiểu chữ của scene ("Lưu thành kiểu mới", "Cập nhật kiểu"), kèm ghi đè mới của chỗ chữ vừa dùng. Một bước, không gộp. */
export const setTextStyles = (d: Doc, styles: TextStyleSet, widgetId: string, field: string, ref: TextRef, kind: 'save' | 'update'): Cmd | null => {
  if (!d.scene.widgets.some((x) => x.id === widgetId)) return null;
  const get = (x: Doc) => ({ styles: x.scene.textStyles, ref: (x.scene.widgets.find((q) => q.id === widgetId)!.properties as Record<string, unknown>)[field] as TextRef });
  const set = (x: Doc, v: { styles: TextStyleSet | undefined; ref: TextRef }) => {
    const y = withWidget(x, widgetId, (q) => ({ ...q, properties: { ...(q.properties as object), [field]: v.ref } }));
    return { ...y, scene: { ...y.scene, textStyles: v.styles } };
  };
  return slice(d, 'setTextStyles', kind === 'save' ? 'web.cmd.textStyleSave' : 'web.cmd.textStyleUpdate', get, set, { styles, ref }, undefined, { widget: widgetId, field, kind });
};
/** Thêm widget (T-68). Một bước hoàn tác. */
export const addWidget = (d: Doc, w: WidgetSpec): Cmd | null => {
  if (d.scene.widgets.some((x) => x.id === w.id)) return null;
  const get = (x: Doc) => x.scene.widgets;
  const set = (x: Doc, v: WidgetSpec[]) => ({ ...x, scene: { ...x.scene, widgets: v } });
  return slice(d, 'addWidget', 'web.cmd.addWidget', get, set, [...d.scene.widgets, w], undefined, { widget: w.id, type: w.type });
};
/** Thêm nhiều widget một lúc (nhân bản vùng chọn). */
export const addWidgets = (d: Doc, ws: WidgetSpec[]): Cmd | null => {
  if (!ws.length) return null;
  const get = (x: Doc) => x.scene.widgets;
  const set = (x: Doc, v: WidgetSpec[]) => ({ ...x, scene: { ...x.scene, widgets: v } });
  return slice(d, 'duplicateWidgets', 'web.cmd.duplicate', get, set, [...d.scene.widgets, ...ws], undefined, { n: ws.length, ...(ws.length === 1 ? { widget: ws[0].id } : {}) });
};
/** Xoá widget (T-68). Hoàn tác trả widget về đúng chỗ trong tài liệu (giữ thứ tự và zIndex). */
export const removeWidgets = (d: Doc, ids: readonly string[]): Cmd | null => {
  const del = new Set(ids.filter((id) => d.scene.widgets.some((w) => w.id === id)));
  if (!del.size) return null;
  const get = (x: Doc) => x.scene.widgets;
  const set = (x: Doc, v: WidgetSpec[]) => ({ ...x, scene: { ...x.scene, widgets: v } });
  return slice(d, 'removeWidgets', 'web.cmd.removeWidget', get, set, d.scene.widgets.filter((w) => !del.has(w.id)), undefined, { n: del.size, names: [...del] });
};
export const setWidgetVisible = (d: Doc, widgetId: string, visible: boolean): Cmd | null => {
  const w = d.scene.widgets.find((x) => x.id === widgetId);
  return w ? slice(d, 'setWidgetVisible', 'web.cmd.widgetVisible', (x) => x.scene.widgets.find((q) => q.id === widgetId)!.visible, (x, v) => withWidget(x, widgetId, (q) => ({ ...q, visible: v })), visible, undefined, { widget: widgetId }) : null;
};
/** Ô mắt ở hàng đầu danh sách Lớp: còn lớp ẩn thì hiện hết trước, đã hiện hết thì ẩn hết. Một bước hoàn tác. */
export const toggleAllWidgetsVisible = (d: Doc): Cmd | null => {
  const show = d.scene.widgets.some((w) => !w.visible);
  const get = (x: Doc) => Object.fromEntries(x.scene.widgets.map((w) => [w.id, w.visible]));
  const set = (x: Doc, v: Record<string, boolean>) => ({ ...x, scene: { ...x.scene, widgets: x.scene.widgets.map((w) => (w.id in v && w.visible !== v[w.id] ? { ...w, visible: v[w.id] } : w)) } });
  return slice(d, 'setAllWidgetsVisible', 'web.cmd.widgetVisible', get, set, Object.fromEntries(d.scene.widgets.map((w) => [w.id, show])), undefined, { visible: show });
};
/** Đưa widget lên trên cùng / xuống dưới cùng bằng cách đổi zIndex của nó. */
export const reorderZ = (d: Doc, widgetId: string, where: 'front' | 'back'): Cmd | null => {
  const others = d.scene.widgets.filter((w) => w.id !== widgetId).map((w) => w.zIndex);
  if (!d.scene.widgets.some((w) => w.id === widgetId)) return null;
  const z = where === 'front' ? Math.max(-Infinity, ...others) + 1 : Math.min(Infinity, ...others) - 1;
  if (!Number.isFinite(z)) return null;
  return slice(d, 'reorderZ', where === 'front' ? 'web.cmd.toFront' : 'web.cmd.toBack', (x) => x.scene.widgets.find((q) => q.id === widgetId)!.zIndex, (x, v) => withWidget(x, widgetId, (q) => ({ ...q, zIndex: v })), z, undefined, { widget: widgetId });
};
/**
 * Thứ tự lớp như danh sách Lớp hiển thị: trên cùng trước (zIndex giảm dần; cùng zIndex thì widget đứng sau trong tài liệu
 * được vẽ sau, nên đứng trước ở đây). Render Core vẽ theo zIndex tăng dần, cùng zIndex theo thứ tự tài liệu.
 */
export const layerOrder = (s: SceneDocument): string[] =>
  s.widgets.map((w, i) => ({ w, i })).sort((a, b) => b.w.zIndex - a.w.zIndex || b.i - a.i).map(({ w }) => w.id);
/**
 * Đưa lớp `widgetId` tới vị trí `to` trong danh sách Lớp (0 = trên cùng): kéo thả, lên/xuống một bậc, lên trên/xuống dưới cùng
 * (REQ-GRAPHICS-01). Đánh lại zIndex 0…n−1 theo thứ tự mới, một bước hoàn tác.
 */
export const moveLayer = (d: Doc, widgetId: string, to: number): Cmd | null => {
  const order = layerOrder(d.scene), from = order.indexOf(widgetId);
  if (from < 0) return null;
  const dest = Math.max(0, Math.min(order.length - 1, Math.round(to)));
  if (dest === from) return null;
  order.splice(from, 1); order.splice(dest, 0, widgetId);
  const z = Object.fromEntries(order.map((id, i) => [id, order.length - 1 - i]));
  const get = (x: Doc) => Object.fromEntries(x.scene.widgets.map((w) => [w.id, w.zIndex]));
  const set = (x: Doc, v: Record<string, number>) => ({ ...x, scene: { ...x.scene, widgets: x.scene.widgets.map((w) => (w.id in v && w.zIndex !== v[w.id] ? { ...w, zIndex: v[w.id] } : w)) } });
  return slice(d, 'moveLayer', 'web.cmd.moveLayer', get, set, z, undefined, { widget: widgetId, from: from + 1, to: dest + 1 });
};
export const patchSnapping = (d: Doc, patch: Partial<SceneDocument['canvas']['snapping']>): Cmd | null =>
  slice(d, 'patchSnapping', 'web.cmd.snapping', (x) => x.scene.canvas.snapping, (x, v) => ({ ...x, scene: { ...x.scene, canvas: { ...x.scene.canvas, snapping: v } } }), { ...d.scene.canvas.snapping, ...patch }, `snap:${Object.keys(patch).join(',')}`);

/** Chỉnh tay (kiểu nốt hoặc bố cục) có bị mất nếu đổi sang phong cách khác không? Dùng để hiện thông báo nhỏ sau khi đổi. */
export function handEdited(d: Doc): boolean {
  if (d.videoStyle === CUSTOM_STYLE) return true;
  const piano = pianoOf(d.scene);
  if (!piano) return false;
  const tracks = piano.properties.noteStyle.tracks;
  const ref = sceneForStyle(d.videoStyle, { base: videoStyleBase(d.videoStyle), tracks }, {});
  const geo = (s: SceneDocument) => JSON.stringify([s.canvas, s.widgets.map((w) => [w.id, w.layout, w.zIndex, w.visible])]);
  const refPiano = pianoOf(ref)!;
  return geo(d.scene) !== geo(ref) || !same(piano.properties.noteStyle.base, refPiano.properties.noteStyle.base) || piano.properties.keyboard.enabled !== refPiano.properties.keyboard.enabled;
}

/** Tài liệu ban đầu từ thiết lập đã lưu (localStorage): phong cách video, kiểu nốt, ghi đè theo track, bàn phím bật/tắt. Lịch sử bắt đầu trống. */
export function initialDoc(videoStyle: string, saved: { style?: Partial<{ base: Partial<NoteStyle>; tracks: Record<string, Partial<NoteStyle>> }>; keyboard?: Partial<KeyboardStyle> } = {}): Doc {
  const kbOn = typeof saved.keyboard?.enabled === 'boolean' ? saved.keyboard.enabled : videoStyleKeyboard(videoStyle);
  const scene = sceneForStyle(videoStyle, { base: { ...videoStyleBase(videoStyle), ...(saved.style?.base ?? {}) }, tracks: saved.style?.tracks ?? {} }, { enabled: kbOn });
  return { videoStyle, scene, brightness: {}, order: [], hidden: [], solo: [], audioOffsetMs: 0, lookRef: videoStyleBase(videoStyle), layoutRef: layoutsOf(sceneForStyle(videoStyle, { base: videoStyleBase(videoStyle), tracks: {} })) };
}
