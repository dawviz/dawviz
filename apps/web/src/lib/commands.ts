// Tài liệu có hoàn tác và các lệnh (T-07, Technical Design §6.4). Hàm dựng lệnh nhận `doc` hiện tại để lấy giá trị "trước";
// trả null khi không có gì đổi (không ghi mục lịch sử rỗng). `redo`/`undo` là hàm thuần trên Doc bất biến.
import type { Animation, BrightnessConfig, CompSpec, NoteNaming, WidgetMotion, NoteStyle, KeyboardStyle, PianoRollProps, Phase, SceneDocument, TextRef, TextStyleSet, WidgetLayout, WidgetSpec, WidgetVisibility } from '@dawviz/render-core';
import { ASPECTS, DEFAULT_BACKGROUND, hasMotion, widgetDefaults, type BackgroundImageSpec } from '@dawviz/render-core';
import type { Command } from './store.ts';
import { clampOffsetMs } from './audioMap.ts';
import { sceneForStyle, videoStyleBase, videoStyleKeyboard, withTrackOverrides } from './videoScenes.ts';

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
  /**
   * Thuộc tính (mục Thiết lập) của từng widget trong phong cách/preset áp gần nhất: nút ↺ của mọi thiết lập đưa về đây.
   * Widget không có mặt (thêm mới) dùng mặc định của loại. Đổi cùng lệnh đổi phong cách/mở preset/thêm widget.
   */
  propsRef: Record<string, Record<string, unknown>>;
}
const layoutsOf = (s: SceneDocument): Record<string, WidgetLayout> => Object.fromEntries(s.widgets.map((w) => [w.id, w.layout]));
const propsOf = (s: SceneDocument): Record<string, Record<string, unknown>> => Object.fromEntries(s.widgets.map((w) => [w.id, w.properties as Record<string, unknown>]));
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
/** Dải cao độ của Piano Roll: Fit content hoặc Custom (pitchMin/pitchMax là số MIDI, min ≤ max). Gõ liên tiếp gộp một bước. */
export interface PitchRange { mode: 'FIT_CONTENT' | 'CUSTOM'; min: number; max: number }
export const pitchRangeOf = (p: PianoRollProps): PitchRange => ({ mode: p.pitchRangeMode, min: p.pitchMin, max: p.pitchMax });
export const setPitchRange = (d: Doc, next: PitchRange): Cmd | null => {
  if (!pianoOf(d.scene)) return null;
  const lo = Math.max(0, Math.min(127, Math.round(Math.min(next.min, next.max)))), hi = Math.max(0, Math.min(127, Math.round(Math.max(next.min, next.max))));
  return slice(d, 'setPitchRange', 'web.cmd.pitchRange', (x) => pitchRangeOf(pianoOf(x.scene)!.properties),
    (x, v) => withPiano(x, (p) => ({ ...p, pitchRangeMode: v.mode, pitchMin: v.min, pitchMax: v.max })), { mode: next.mode, min: lo, max: hi }, 'pitch.range');
};
/** Cách nốt chạy: cuộn qua vạch cố định (SCROLL) hoặc theo trang với vạch phát chạy ngang (PAGE). */
export const setScrollMode = (d: Doc, mode: PianoRollProps['scrollMode']): Cmd | null => {
  if (!pianoOf(d.scene)) return null;
  return slice(d, 'setScrollMode', 'web.cmd.scrollMode', (x) => pianoOf(x.scene)!.properties.scrollMode, (x, v) => withPiano(x, (p) => ({ ...p, scrollMode: v })), mode);
};
/** Số giây trải trên bề rộng Piano Roll: tỉ lệ thời gian ở chế độ cuộn, độ dài một trang ở chế độ trang. Kéo liên tiếp gộp một bước. */
export const setVisibleSeconds = (d: Doc, sec: number): Cmd | null => {
  if (!pianoOf(d.scene)) return null;
  const v = Math.round(Math.min(60, Math.max(0.5, sec)) * 100) / 100;
  return slice(d, 'setVisibleSeconds', 'web.cmd.visibleSeconds', (x) => pianoOf(x.scene)!.properties.visibleSeconds, (x, r) => withPiano(x, (p) => ({ ...p, visibleSeconds: r })), v, 'visible.seconds');
};
/** Thuộc tính của chế độ trang (T-84): đơn vị trang, số ô nhịp mỗi trang, thời gian nốt hiện trước. Kéo liên tiếp cùng một thuộc tính gộp một bước. */
export type PageKey = 'pageUnit' | 'pageBars' | 'revealAhead';
export const setPageProp = <K extends PageKey>(d: Doc, key: K, value: PianoRollProps[K]): Cmd | null => {
  if (!pianoOf(d.scene)) return null;
  const v = (key === 'revealAhead' ? Math.round(Math.min(30, Math.max(0, Number(value))) * 10) / 10 : key === 'pageBars' ? Math.round(Math.min(32, Math.max(1, Number(value)))) : value) as PianoRollProps[K];
  return slice(d, 'setPageProp', 'web.cmd.pageProp', (x) => pianoOf(x.scene)!.properties[key], (x, r) => withPiano(x, (p) => ({ ...p, [key]: r })), v, `page:${key}`, { key });
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
export const setVideoStyle = (d: Doc, id: string, working?: SceneDocument): Cmd | null => {
  const tracks = pianoOf(d.scene)?.properties.noteStyle.tracks ?? {};
  // `working`: bản đã chỉnh dở của phong cách này (lúc rời đi được giữ lại); ghi đè theo track vẫn là của hiện tại. Nút ↺ vẫn về gốc của phong cách.
  const orig = sceneForStyle(id, { base: videoStyleBase(id), tracks }, {});
  const scene = working ? withTrackOverrides(working, tracks) : orig;
  const before = { videoStyle: d.videoStyle, scene: d.scene, lookRef: d.lookRef, layoutRef: d.layoutRef, propsRef: d.propsRef }, after = { videoStyle: id, scene, lookRef: videoStyleBase(id), layoutRef: layoutsOf(orig), propsRef: propsOf(orig) };
  if (d.videoStyle === id && same(before.scene, scene)) return null;
  return { type: 'setVideoStyle', label: 'web.cmd.videoStyle', before, after, redo: (x) => ({ ...x, ...after }), undo: (x) => ({ ...x, ...before }) };
};
/** Mở preset: thay scene (và đánh dấu phong cách 'custom'). Một bước hoàn tác. `working`: bản đã chỉnh dở của preset này; nút ↺ vẫn về bản gốc `scene`. */
export const loadPreset = (d: Doc, scene: SceneDocument, working?: SceneDocument): Cmd | null => {
  const base = pianoOf(scene)?.properties.noteStyle.base;
  const before = { videoStyle: d.videoStyle, scene: d.scene, lookRef: d.lookRef, layoutRef: d.layoutRef, propsRef: d.propsRef }, after = { videoStyle: CUSTOM_STYLE, scene: working ?? scene, lookRef: base ? { ...base } : d.lookRef, layoutRef: layoutsOf(scene), propsRef: propsOf(scene) };
  return { type: 'loadPreset', label: 'web.cmd.loadPreset', before, after, redo: (x) => ({ ...x, ...after }), undo: (x) => ({ ...x, ...before }) };
};

// ── độ sáng nền theo track ──
export const patchBrightness = (d: Doc, id: TrackId, next: BrightnessConfig): Cmd | null =>
  slice(d, 'patchBrightness', 'web.cmd.brightness', (x) => x.brightness[id], (x, v) => ({ ...x, brightness: { ...x.brightness, [id]: v } }), next, `bright:${id}:${keysChanged(d.brightness[id] ?? {}, next).join(',')}`, { track: id });

// ── ẩn/hiện, solo, thứ tự track ──
const toggled = (list: readonly string[], id: string) => list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
export const toggleHidden = (d: Doc, id: TrackId): Cmd | null => slice(d, 'toggleHidden', 'web.cmd.hide', (x) => x.hidden, (x, v) => ({ ...x, hidden: v }), toggled(d.hidden, id), undefined, { track: id, on: !d.hidden.includes(id) });
export const toggleSolo = (d: Doc, id: TrackId): Cmd | null => slice(d, 'toggleSolo', 'web.cmd.solo', (x) => x.solo, (x, v) => ({ ...x, solo: v }), toggled(d.solo, id), undefined, { track: id, on: !d.solo.includes(id) });
/** Kéo qua các mắt/S để ẩn hay solo nhanh: đặt thẳng giá trị cho một track (không đảo). Gộp trong một cử chỉ kéo thành một bước hoàn tác. */
const withId = (list: readonly string[], id: string, on: boolean) => (list.includes(id) === on ? [...list] : on ? [...list, id] : list.filter((x) => x !== id));
export const setHiddenOf = (d: Doc, id: TrackId, on: boolean): Cmd | null => slice(d, 'toggleHidden', 'web.cmd.hide', (x) => x.hidden, (x, v) => ({ ...x, hidden: v }), withId(d.hidden, id, on), 'paint:hide', { track: id, on });
export const setSoloOf = (d: Doc, id: TrackId, on: boolean): Cmd | null => slice(d, 'toggleSolo', 'web.cmd.solo', (x) => x.solo, (x, v) => ({ ...x, solo: v }), withId(d.solo, id, on), 'paint:solo', { track: id, on });
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
/** Đổi tên lớp (widget). `name` null = bỏ tên riêng, dùng tên theo loại. Kiểm trùng tên làm ở `lib/layerName.ts` trước khi gọi. */
export const renameWidget = (d: Doc, widgetId: string, name: string | null): Cmd | null => {
  if (!d.scene.widgets.some((x) => x.id === widgetId)) return null;
  const get = (x: Doc): string | null => x.scene.widgets.find((q) => q.id === widgetId)!.name ?? null;
  const set = (x: Doc, v: string | null) => withWidget(x, widgetId, (q) => { const { name: _n, ...rest } = q; return v === null ? rest : { ...rest, name: v }; });
  return slice(d, 'renameWidget', 'web.cmd.widgetRename', get, set, name, undefined, { widget: widgetId, name });
};
/** Chọn track cho một widget (T-73): `ALL` = mọi track đang hiện, `MANUAL` = chỉ các track có chỉ số trong `indices`. Hoàn tác được. */
export const setWidgetTracks = (d: Doc, widgetId: string, mode: 'ALL' | 'MANUAL', indices: number[]): Cmd | null => {
  if (!d.scene.widgets.some((x) => x.id === widgetId)) return null;
  type TM = { trackMappingMode: WidgetSpec['trackMappingMode']; assignedTrackIndices: number[] };
  const get = (x: Doc): TM => { const q = x.scene.widgets.find((y) => y.id === widgetId)!; return { trackMappingMode: q.trackMappingMode, assignedTrackIndices: q.assignedTrackIndices }; };
  const after: TM = { trackMappingMode: mode, assignedTrackIndices: mode === 'MANUAL' ? [...new Set(indices)].sort((a, b) => a - b) : [] };
  return slice(d, 'setWidgetTracks', 'web.cmd.widgetTracks', get, (x, v) => withWidget(x, widgetId, (q) => ({ ...q, ...v })), after, undefined, { widget: widgetId });
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
  // Cùng lệnh ghi mốc ↺ của widget mới = thuộc tính mặc định của nó (id từng dùng cho widget đã xoá không được thừa mốc cũ).
  const get = (x: Doc) => ({ widgets: x.scene.widgets, propsRef: x.propsRef });
  const set = (x: Doc, v: { widgets: WidgetSpec[]; propsRef: Doc['propsRef'] }): Doc => ({ ...x, scene: { ...x.scene, widgets: v.widgets }, propsRef: v.propsRef });
  return slice(d, 'addWidget', 'web.cmd.addWidget', get, set, { widgets: [...d.scene.widgets, w], propsRef: { ...d.propsRef, [w.id]: widgetDefaults(w.type) } }, undefined, { widget: w.id, type: w.type });
};
/** Thêm nhiều widget một lúc (nhân bản vùng chọn). */
export const addWidgets = (d: Doc, ws: WidgetSpec[], refs: Doc['propsRef'] = {}): Cmd | null => {
  if (!ws.length) return null;
  // `refs`: mốc ↺ của từng bản sao (lấy từ bản gốc); thiếu thì dùng mặc định của loại.
  const get = (x: Doc) => ({ widgets: x.scene.widgets, propsRef: x.propsRef });
  const set = (x: Doc, v: { widgets: WidgetSpec[]; propsRef: Doc['propsRef'] }): Doc => ({ ...x, scene: { ...x.scene, widgets: v.widgets }, propsRef: v.propsRef });
  const after = { widgets: [...d.scene.widgets, ...ws], propsRef: { ...d.propsRef, ...Object.fromEntries(ws.map((w) => [w.id, refs[w.id] ?? widgetDefaults(w.type)])) } };
  return slice(d, 'duplicateWidgets', 'web.cmd.duplicate', get, set, after, undefined, { n: ws.length, ...(ws.length === 1 ? { widget: ws[0].id } : {}) });
};
/** Xoá widget (T-68). Hoàn tác trả widget về đúng chỗ trong tài liệu (giữ thứ tự và zIndex). Con của widget bị xoá thôi có cha (cùng một bước). */
export const removeWidgets = (d: Doc, ids: readonly string[]): Cmd | null => {
  const del = new Set(ids.filter((id) => d.scene.widgets.some((w) => w.id === id)));
  if (!del.size) return null;
  const get = (x: Doc) => x.scene.widgets;
  const set = (x: Doc, v: WidgetSpec[]) => ({ ...x, scene: { ...x.scene, widgets: v } });
  const kept = d.scene.widgets.filter((w) => !del.has(w.id)).map((w) => { if (!w.parent || !del.has(w.parent)) return w; const { parent: _p, ...rest } = w; return rest; });
  return slice(d, 'removeWidgets', 'web.cmd.removeWidget', get, set, kept, undefined, { n: del.size, names: [...del] });
};
/** Widget có thể làm cha của `id`: mọi widget khác trừ chính nó và con cháu của nó (tránh vòng lặp). */
export function parentCandidates(scene: SceneDocument, id: string): string[] {
  const kids = new Map<string, string[]>();
  for (const w of scene.widgets) if (w.parent) kids.set(w.parent, [...(kids.get(w.parent) ?? []), w.id]);
  const below = new Set<string>([id]);
  for (const q = [id]; q.length;) for (const c of kids.get(q.pop()!) ?? []) if (!below.has(c)) { below.add(c); q.push(c); }
  return scene.widgets.filter((w) => !below.has(w.id)).map((w) => w.id);
}
/** Đặt (hoặc bỏ, `null`) widget cha (parenting, 0.7.0). Cha tạo vòng lặp hoặc không tồn tại → không làm gì. Hoàn tác được. */
export const setWidgetParent = (d: Doc, widgetId: string, parent: string | null): Cmd | null => {
  const w = d.scene.widgets.find((x) => x.id === widgetId);
  if (!w || (parent !== null && !parentCandidates(d.scene, widgetId).includes(parent))) return null;
  const get = (x: Doc): string | null => x.scene.widgets.find((q) => q.id === widgetId)!.parent ?? null;
  const set = (x: Doc, v: string | null) => withWidget(x, widgetId, (q) => { const { parent: _p, ...rest } = q; return v === null ? rest : { ...rest, parent: v }; });
  return slice(d, 'setWidgetParent', 'web.cmd.widgetParent', get, set, parent, undefined, { widget: widgetId, parent });
};
export const setWidgetVisible = (d: Doc, widgetId: string, visible: boolean): Cmd | null => {
  const w = d.scene.widgets.find((x) => x.id === widgetId);
  return w ? slice(d, 'setWidgetVisible', 'web.cmd.widgetVisible', (x) => x.scene.widgets.find((q) => q.id === widgetId)!.visible, (x, v) => withWidget(x, widgetId, (q) => ({ ...q, visible: v })), visible, undefined, { widget: widgetId }) : null;
};
/** Kéo qua các mắt của danh sách Lớp: đặt thẳng giá trị (không đảo). Lệnh nắm toàn bộ bảng hiện/ẩn nên gộp cả lần kéo thành một bước hoàn tác. */
export const paintWidgetVisible = (d: Doc, widgetId: string, visible: boolean): Cmd | null => {
  const get = (x: Doc) => Object.fromEntries(x.scene.widgets.map((w) => [w.id, w.visible])) as Record<string, boolean>;
  const set = (x: Doc, v: Record<string, boolean>): Doc => ({ ...x, scene: { ...x.scene, widgets: x.scene.widgets.map((w) => (w.id in v && w.visible !== v[w.id] ? { ...w, visible: v[w.id] } : w)) } });
  if (!d.scene.widgets.some((w) => w.id === widgetId)) return null;
  return slice(d, 'setWidgetVisible', 'web.cmd.widgetVisible', get, set, { ...get(d), [widgetId]: visible }, 'paint:wvis', { widget: widgetId });
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
/**
 * Đặt khoảng hiển thị theo thời gian của widget (REQ-GRAPHICS-14); `null` = bỏ (hiện suốt bài). `key` gộp các lần gõ/kéo liên tiếp
 * cùng một ô (vd. thời gian hiện dần) thành một bước hoàn tác.
 */
export const setWidgetVisibility = (d: Doc, widgetId: string, next: WidgetVisibility | null, key?: string): Cmd | null => {
  if (!d.scene.widgets.some((x) => x.id === widgetId)) return null;
  const get = (x: Doc): WidgetVisibility | null => x.scene.widgets.find((q) => q.id === widgetId)!.visibility ?? null;
  const set = (x: Doc, v: WidgetVisibility | null) => withWidget(x, widgetId, (q) => { const { visibility: _v, ...rest } = q; return v ? { ...rest, visibility: v } : rest; });
  return slice(d, 'setWidgetVisibility', 'web.cmd.visibility', get, set, next, key ? `vis:${widgetId}:${key}` : undefined, { widget: widgetId });
};
/** Đặt hoạt hình của MỘT thuộc tính widget (T-22); `null` = bỏ. `key` gộp các lần chỉnh liên tiếp một ô thành một bước hoàn tác. */
export const setWidgetAnimate = (d: Doc, widgetId: string, path: string, next: Animation | null, key?: string): Cmd | null => {
  if (!d.scene.widgets.some((x) => x.id === widgetId)) return null;
  const get = (x: Doc): Animation | null => x.scene.widgets.find((q) => q.id === widgetId)!.animate?.[path] ?? null;
  const set = (x: Doc, v: Animation | null) => withWidget(x, widgetId, (q) => {
    const an = { ...(q.animate ?? {}) }; if (v) an[path] = v; else delete an[path];
    const { animate: _a, ...rest } = q; return Object.keys(an).length ? { ...rest, animate: an } : rest;
  });
  return slice(d, 'setWidgetAnimate', 'web.cmd.animate', get, set, next, key ? `anim:${widgetId}:${path}:${key}` : undefined, { widget: widgetId, property: path });
};
/** Một lần sửa gồm bố cục tĩnh và/hoặc nhiều hoạt hình của một widget (`null` = bỏ hoạt hình đường dẫn đó). */
export interface AnimEdit { layout?: Partial<WidgetLayout>; animate?: Record<string, Animation | null> }
/**
 * Sửa bố cục và nhiều hoạt hình của một hay nhiều widget trong MỘT lệnh (D-64): kéo hình thoi Vị trí (x + y), kéo nhiều keyframe của nhiều
 * thuộc tính, hay kéo widget trên khung khi thuộc tính đang có keyframe (đặt keyframe tại vạch phát). Một lệnh mỗi lần → trong một cử chỉ
 * các lần cùng `key` gộp thành một bước hoàn tác (store chỉ gộp các lệnh liên tiếp cùng mergeKey).
 */
export const editWidgetAnimation = (d: Doc, edits: Record<string, AnimEdit>, key?: string): Cmd | null => {
  const ids = Object.keys(edits).filter((id) => d.scene.widgets.some((w) => w.id === id)).sort();
  if (!ids.length) return null;
  type V = Record<string, { layout: WidgetLayout; animate?: Record<string, Animation> }>;
  const get = (x: Doc): V => Object.fromEntries(ids.map((id) => { const q = x.scene.widgets.find((w) => w.id === id)!; return [id, { layout: q.layout, ...(q.animate ? { animate: q.animate } : {}) }]; }));
  const set = (x: Doc, v: V) => ids.reduce((acc, id) => withWidget(acc, id, (q) => { const { animate: _a, ...rest } = q; return { ...rest, layout: v[id].layout, ...(v[id].animate ? { animate: v[id].animate } : {}) }; }), x);
  const cur = get(d);
  const after: V = Object.fromEntries(ids.map((id) => {
    const e = edits[id], an: Record<string, Animation> = { ...(cur[id].animate ?? {}) };
    for (const [p, v] of Object.entries(e.animate ?? {})) { if (v) an[p] = v; else delete an[p]; }
    return [id, { layout: { ...cur[id].layout, ...(e.layout ?? {}) }, ...(Object.keys(an).length ? { animate: an } : {}) }];
  }));
  return slice(d, 'editWidgetAnimation', 'web.cmd.animate', get, set, after, key ? `animedit:${ids.join('|')}:${key}` : undefined, { widgets: ids, ...(ids.length === 1 ? { widget: ids[0] } : {}) });
};
/** Đặt chuyển động của widget (vào, ra, lặp theo nhịp; mọi loại widget); `null` = bỏ. `key` gộp các lần chỉnh liên tiếp một ô thành một bước hoàn tác. */
export const setWidgetMotion = (d: Doc, widgetId: string, next: WidgetMotion | null, key?: string): Cmd | null => {
  if (!d.scene.widgets.some((x) => x.id === widgetId)) return null;
  const get = (x: Doc): WidgetMotion | null => x.scene.widgets.find((q) => q.id === widgetId)!.motion ?? null;
  const set = (x: Doc, v: WidgetMotion | null) => withWidget(x, widgetId, (q) => { const { motion: _m, ...rest } = q; return v && hasMotion(v) ? { ...rest, motion: v } : rest; });
  return slice(d, 'setWidgetMotion', 'web.cmd.motion', get, set, next && hasMotion(next) ? next : null, key ? `motion:${widgetId}:${key}` : undefined, { widget: widgetId });
};
/** Đặt danh sách phase của bài (đã sắp theo `start`, tên không rỗng). Rỗng = bỏ hết. */
export const setPhases = (d: Doc, phases: Phase[], key?: string): Cmd | null =>
  slice(d, 'setPhases', 'web.cmd.phases', (x) => x.scene.phases ?? [], (x, v) => { const { phases: _p, ...rest } = x.scene; return { ...x, scene: v.length ? { ...rest, phases: v } : rest }; }, phases, key ? `phases:${key}` : undefined, { n: phases.length });
/** Đặt nốt chủ của bài (0 = C … 11 = B); `null` = bỏ (chỗ giữ `{bass}` hiện tên nốt thay vì bậc). */
export const setTonic = (d: Doc, tonic: number | null): Cmd | null =>
  slice(d, 'setTonic', 'web.cmd.tonic', (x) => x.scene.tonic ?? null, (x, v) => { const { tonic: _t, ...rest } = x.scene; return { ...x, scene: v === null ? rest : { ...rest, tonic: v } }; }, tonic, undefined, {});
/** Cách ghi tên nốt/hợp âm của cả scene (P-12); `null` = cách ghi cũ (C♯, C4 = 60). */
export const setNoteNaming = (d: Doc, naming: NoteNaming | null): Cmd | null =>
  slice(d, 'setNoteNaming', 'web.cmd.noteNaming', (x) => x.scene.noteNaming ?? null, (x, v) => { const { noteNaming: _n, ...rest } = x.scene; return { ...x, scene: v === null ? rest : { ...rest, noteNaming: v } }; }, naming, undefined, { system: naming?.system ?? '' });
/** Cách đặt ảnh nền (vừa khung, độ đục, làm tối). Ảnh là tài nguyên của phiên, không nằm trong scene. Kéo liên tiếp cùng một thuộc tính gộp một bước. */
export const setBackgroundSpec = (d: Doc, patch: Partial<BackgroundImageSpec>): Cmd | null =>
  slice(d, 'setBackgroundSpec', 'web.cmd.background', (x) => x.scene.canvas.backgroundImage ?? DEFAULT_BACKGROUND, (x, v) => ({ ...x, scene: { ...x.scene, canvas: { ...x.scene.canvas, backgroundImage: v } } }),
    { ...(d.scene.canvas.backgroundImage ?? DEFAULT_BACKGROUND), ...patch }, `bg:${Object.keys(patch).join(',')}`, { keys: Object.keys(patch) });
/**
 * Đổi cỡ khung thiết kế (256–4096 pt mỗi cạnh; tỉ lệ dựng sẵn 9:16 / 1:1 / 16:9 qua `setAspect`): mọi widget co giãn theo tỉ lệ tương đối
 * (x, rộng nhân bề rộng mới / cũ; y, cao nhân chiều cao mới / cũ; góc xoay và điểm neo giữ nguyên). Bố cục tham chiếu của ↺ co giãn cùng,
 * nên ↺ về đúng bố cục dựng sẵn ở tỉ lệ mới. Một bước hoàn tác. Tỉ lệ không biết hoặc đang đúng tỉ lệ đó thì không làm gì.
 */
export const setCanvasSize = (d: Doc, width: number, height: number): Cmd | null => {
  const w = Math.round(Math.min(4096, Math.max(256, width))), h = Math.round(Math.min(4096, Math.max(256, height)));
  if (!Number.isFinite(w) || !Number.isFinite(h) || (w === d.scene.canvas.designWidth && h === d.scene.canvas.designHeight)) return null;
  const sx = w / d.scene.canvas.designWidth, sy = h / d.scene.canvas.designHeight;
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const scale = (l: WidgetLayout): WidgetLayout => ({ ...l, x: r2(l.x * sx), y: r2(l.y * sy), width: r2(l.width * sx), height: r2(l.height * sy) });
  type S = { canvas: Pick<SceneDocument['canvas'], 'aspectRatio' | 'designWidth' | 'designHeight'>; layouts: Record<string, WidgetLayout>; ref: Record<string, WidgetLayout> };
  const allLayouts = (s: SceneDocument) => ({ ...layoutsOf(s), ...Object.fromEntries(Object.entries(s.comps ?? {}).flatMap(([c, spec]) => spec.widgets.map((q) => [`${c}/${q.id}`, q.layout]))) });
  const get = (x: Doc): S => ({ canvas: { aspectRatio: x.scene.canvas.aspectRatio, designWidth: x.scene.canvas.designWidth, designHeight: x.scene.canvas.designHeight }, layouts: allLayouts(x.scene), ref: x.layoutRef });
  // Widget trong precomp (D-69) co giãn cùng: khoá bố cục của chúng là `<comp>/<id>` (lib/compLens.ts refKey).
  const set = (x: Doc, v: S): Doc => ({
    ...x, layoutRef: v.ref,
    scene: {
      ...x.scene, canvas: { ...x.scene.canvas, ...v.canvas }, widgets: x.scene.widgets.map((q) => (v.layouts[q.id] ? { ...q, layout: v.layouts[q.id] } : q)),
      ...(x.scene.comps ? { comps: Object.fromEntries(Object.entries(x.scene.comps).map(([c, spec]) => [c, { ...spec, widgets: spec.widgets.map((q) => { const l = v.layouts[`${c}/${q.id}`]; return l ? { ...q, layout: l } : q; }) }])) } : {}),
    },
  });
  const g = gcd(w, h), ratio = `${w / g}:${h / g}`;
  const after: S = {
    canvas: { aspectRatio: ratio, designWidth: w, designHeight: h },
    layouts: Object.fromEntries(Object.entries(allLayouts(d.scene)).map(([id, l]) => [id, scale(l)])),
    ref: Object.fromEntries(Object.entries(d.layoutRef).map(([id, l]) => [id, scale(l)])),
  };
  return slice(d, 'setAspect', 'web.cmd.aspect', get, set, after, undefined, { from: d.scene.canvas.aspectRatio, to: ratio, size: `${w} × ${h}` });
};
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
/** Đổi sang một tỉ lệ dựng sẵn (9:16 / 1:1 / 16:9); tỉ lệ không biết hoặc đang đúng tỉ lệ đó thì không làm gì. */
export const setAspect = (d: Doc, aspect: string): Cmd | null => {
  const dims = ASPECTS[aspect];
  return dims && d.scene.canvas.aspectRatio !== aspect ? setCanvasSize(d, dims[0], dims[1]) : null;
};
export const patchSnapping = (d: Doc, patch: Partial<SceneDocument['canvas']['snapping']>): Cmd | null =>
  slice(d, 'patchSnapping', 'web.cmd.snapping', (x) => x.scene.canvas.snapping, (x, v) => ({ ...x, scene: { ...x.scene, canvas: { ...x.scene.canvas, snapping: v } } }), { ...d.scene.canvas.snapping, ...patch }, `snap:${Object.keys(patch).join(',')}`);

// ── timeline lớp và precomp (D-69, T-112) ──
/** Loại thao tác trên timeline lớp (tên lệnh và nhãn lịch sử). */
export type LayerEdit = 'moveClips' | 'trimClip' | 'fadeClip' | 'splitLayer' | 'precompose' | 'uncompose' | 'compSpeed';
const LAYER_LABEL: Record<LayerEdit, string> = { moveClips: 'web.cmd.moveClips', trimClip: 'web.cmd.trimClip', fadeClip: 'web.cmd.fadeClip', splitLayer: 'web.cmd.splitLayer', precompose: 'web.cmd.precompose', uncompose: 'web.cmd.uncompose', compSpeed: 'web.cmd.compSpeed' };
type LayerState = { widgets: WidgetSpec[]; comps: Record<string, CompSpec> | null; layoutRef: Doc['layoutRef']; propsRef: Doc['propsRef'] };
/**
 * Thay danh sách lớp (và sổ comp, mốc ↺ nếu có) trong MỘT lệnh: dời/cắt mép/tách thanh, gom precomp (lib/layerTimeline.ts tính danh sách mới).
 * `mergeKey` gộp cả lần kéo một thanh thành một bước hoàn tác.
 */
export const setLayers = (d: Doc, kind: LayerEdit, next: { widgets: WidgetSpec[]; comps?: Record<string, CompSpec>; layoutRef?: Doc['layoutRef']; propsRef?: Doc['propsRef'] }, mergeKey?: string, params?: Cmd['params']): Cmd | null => {
  const get = (x: Doc): LayerState => ({ widgets: x.scene.widgets, comps: x.scene.comps ?? null, layoutRef: x.layoutRef, propsRef: x.propsRef });
  const set = (x: Doc, v: LayerState): Doc => {
    const { comps: _c, ...rest } = x.scene;
    return { ...x, layoutRef: v.layoutRef, propsRef: v.propsRef, scene: { ...rest, widgets: v.widgets, ...(v.comps && Object.keys(v.comps).length ? { comps: v.comps } : {}) } };
  };
  const cur = get(d);
  // Nhãn lịch sử: lớp đầu tiên bị đổi (tên hiện ở "Cắt mép Hợp âm"), số lớp đổi; gom precomp: tên lớp precomp mới.
  const before = new Map(cur.widgets.map((w) => [w.id, w]));
  const changed = next.widgets.filter((w) => before.get(w.id) !== w), fresh = next.widgets.filter((w) => !before.has(w.id));
  const comp = kind === 'precompose' ? fresh.find((w) => w.type === 'COMP') : undefined;
  const auto: Record<string, unknown> = { n: kind === 'precompose' ? cur.widgets.length - next.widgets.length + 1 : Math.max(1, changed.length) };
  if (changed[0]) auto.widget = (kind === 'uncompose' ? cur.widgets.find((w) => !next.widgets.some((x) => x.id === w.id)) ?? changed[0] : changed[0]).id;
  if (comp) auto.name = comp.name ?? '';
  return slice(d, kind, LAYER_LABEL[kind], get, set, { widgets: next.widgets, comps: next.comps ?? cur.comps, layoutRef: next.layoutRef ?? cur.layoutRef, propsRef: next.propsRef ?? cur.propsRef }, mergeKey, { ...auto, ...(params ?? {}) });
};
/** Đổi tên một precomp (tên comp và tên các lớp COMP đang trỏ tới nó ở cùng khung nhìn không đổi theo: lớp có tên riêng). */
export const renameComp = (d: Doc, comp: string, name: string): Cmd | null => {
  if (!d.scene.comps?.[comp]) return null;
  return slice(d, 'renameComp', 'web.cmd.renameComp', (x) => x.scene.comps?.[comp]?.name ?? '', (x, v) => ({ ...x, scene: { ...x.scene, comps: { ...x.scene.comps, [comp]: { ...x.scene.comps![comp], name: v } } } }), name, undefined, { comp, name });
};
/**
 * Áp một scene dựng sẵn (phong cách video, preset) vào nội dung của precomp `comp` (thẻ Xem trước, D-69: precomp tại vạch phát). Keyframe của scene
 * tính từ giây 0 của comp. Mốc ↺ của widget trong comp lấy theo scene đó. Doc chuyển sang 'custom' (scene không còn trùng một phong cách nào).
 */
export const applySceneToComp = (d: Doc, comp: string, src: SceneDocument): Cmd | null => {
  const spec = d.scene.comps?.[comp]; if (!spec) return null;
  const pre = `${comp}/`;
  const strip = <V,>(r: Record<string, V>) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith(pre)));
  type V = { videoStyle: string; widgets: WidgetSpec[]; layoutRef: Doc['layoutRef']; propsRef: Doc['propsRef'] };
  const get = (x: Doc): V => ({ videoStyle: x.videoStyle, widgets: x.scene.comps?.[comp]?.widgets ?? [], layoutRef: x.layoutRef, propsRef: x.propsRef });
  const set = (x: Doc, v: V): Doc => ({ ...x, videoStyle: v.videoStyle, layoutRef: v.layoutRef, propsRef: v.propsRef, scene: { ...x.scene, comps: { ...x.scene.comps, [comp]: { ...x.scene.comps![comp], widgets: v.widgets } } } });
  const widgets = src.widgets.filter((w) => w.type !== 'COMP').map((w) => JSON.parse(JSON.stringify(w)) as WidgetSpec);
  const after: V = {
    videoStyle: CUSTOM_STYLE, widgets,
    layoutRef: { ...strip(d.layoutRef), ...Object.fromEntries(widgets.map((w) => [pre + w.id, w.layout])) },
    propsRef: { ...strip(d.propsRef), ...Object.fromEntries(widgets.map((w) => [pre + w.id, w.properties as Record<string, unknown>])) },
  };
  return slice(d, 'applySceneToComp', 'web.cmd.styleToComp', get, set, after, undefined, { comp, name: spec.name });
};

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
  return { videoStyle, scene, brightness: {}, order: [], hidden: [], solo: [], audioOffsetMs: 0, lookRef: videoStyleBase(videoStyle), layoutRef: layoutsOf(sceneForStyle(videoStyle, { base: videoStyleBase(videoStyle), tracks: {} })), propsRef: propsOf(sceneForStyle(videoStyle, { base: videoStyleBase(videoStyle), tracks: {} })) };
}
