// Timeline lớp (tầng 1, D-69, T-112): mỗi lớp (widget) là một hàng, mỗi khoảng hiển thị là một thanh. Phép thuần trên danh sách widget của khung
// nhìn đang mở (lib/compLens.ts): dời thanh (keyframe đi theo, như After Effects), cắt mép (keyframe đứng yên), tách lớp tại vạch phát (Ctrl+K: thành
// hai lớp, mỗi lớp giữ keyframe riêng), gom các lớp đang chọn thành precomp. Không DOM; test ở layerTimeline.test.ts.
import { COMP_SEP, DEFAULT_ANCHOR, MAX_RANGES, compOf, isKeyAnim, newWidgetId, shiftWidgetTime, type CompSpec, type SceneDocument, type TimeRange, type TempoPoint, type WidgetSpec, type WidgetVisibility } from '@dawviz/render-core';
import { layerOrder } from './commands.ts';
import { keySecs } from './timeline.ts';

/** Thanh ngắn nhất (giây): một khung hình ở 30 fps. */
export const MIN_CLIP = 1 / 30;
const r6 = (v: number) => Math.round(v * 1e6) / 1e6;
const ALWAYS: WidgetVisibility = { ranges: [{ from: 0, to: null }], fadeIn: 0, fadeOut: 0 };

/** Một thanh trên hàng của lớp: khoảng thứ `i` của khoảng hiển thị; `to` đã thay `null` (tới hết bài) bằng `duration`. `open` = chạy tới hết bài. */
export interface Clip { i: number; from: number; to: number; open: boolean }
export function clipsOf(w: Pick<WidgetSpec, 'visibility'>, duration: number): Clip[] {
  const v = w.visibility ?? ALWAYS;
  return v.ranges.map((r, i) => ({ i, from: r.from, to: r.to ?? Math.max(duration, r.from), open: r.to === null }));
}
/** Thanh chứa `t` (đầu thanh tính, cuối thanh không), hoặc -1. */
export const clipAt = (w: Pick<WidgetSpec, 'visibility'>, t: number, duration: number): number => clipsOf(w, duration).findIndex((c) => t >= c.from && t < c.to);

/** Mốc giây sớm nhất của widget (đầu thanh, keyframe mốc giây): dời sang trái không được qua 0. */
function earliest(w: WidgetSpec, tempoMap: readonly TempoPoint[]): number {
  let m = Math.min(...(w.visibility ?? ALWAYS).ranges.map((r) => r.from));
  for (const a of Object.values(w.animate ?? {})) {
    if (!isKeyAnim(a)) continue;
    const secs = a.keys.filter((k) => 'sec' in k.at);
    if (secs.length) m = Math.min(m, ...keySecs({ ...a, keys: secs }, tempoMap));
  }
  const c = compOf(w); if (c) m = Math.min(m, Math.max(0, c.start)); // comp bắt đầu trước 0 vẫn được; chỉ không đẩy thêm
  return m;
}

/**
 * Dời thanh của các lớp `ids` thêm `dt` giây (keyframe mốc giây và comp con dời theo). Kẹp để không mốc nào sang trước 0. Lớp đang hiện suốt bài
 * được cho một khoảng `[0, hết bài]` trước khi dời. Trả danh sách mới và `dt` thật đã dùng.
 */
export function moveLayers(widgets: readonly WidgetSpec[], ids: readonly string[], dt: number, tempoMap: readonly TempoPoint[]): { widgets: WidgetSpec[]; dt: number } {
  const set = new Set(ids), moving = widgets.filter((w) => set.has(w.id));
  if (!moving.length || !dt) return { widgets: [...widgets], dt: 0 };
  const lo = -Math.min(...moving.map((w) => earliest(w, tempoMap)));
  const d = r6(Math.max(lo, dt));
  if (!d) return { widgets: [...widgets], dt: 0 };
  return { widgets: widgets.map((w) => (set.has(w.id) ? shiftWidgetTime(w.visibility ? w : { ...w, visibility: { ...ALWAYS } }, d) : w)), dt: d };
}

/**
 * Cắt mép thanh `i` của lớp: `in` = đầu thanh, `out` = cuối thanh, tới thời điểm `t` (keyframe đứng yên). Kẹp trong khoảng giữa hai thanh kề và giữ
 * thanh dài ít nhất MIN_CLIP; kéo cuối thanh tới hết bài thì thanh chạy tới hết bài (`to = null`).
 */
export function trimLayer(w: WidgetSpec, i: number, edge: 'in' | 'out', t: number, duration: number): WidgetSpec {
  const v = w.visibility ?? ALWAYS, rs = v.ranges;
  const r = rs[i]; if (!r) return w;
  const end = r.to ?? Math.max(duration, r.from);
  const ranges = rs.slice();
  if (edge === 'in') {
    const lo = i > 0 ? (rs[i - 1].to ?? 0) : 0;
    ranges[i] = { ...r, from: r6(Math.min(end - MIN_CLIP, Math.max(lo, t))) };
  } else {
    const hi = i + 1 < rs.length ? rs[i + 1].from : Infinity;
    const to = Math.min(hi, Math.max(r.from + MIN_CLIP, t));
    ranges[i] = { ...r, to: hi === Infinity && to >= duration - 1e-6 ? null : r6(to) };
  }
  if (ranges[i].from === r.from && ranges[i].to === r.to) return w;
  return { ...w, visibility: { ...v, ranges } };
}

/**
 * Tách lớp `id` tại `t` (Ctrl+K, kiểu After Effects): lớp gốc giữ phần trước `t`, bản sao (id mới, ngay trên lớp gốc) giữ phần từ `t`. Cả hai giữ
 * nguyên keyframe nên chuyển động liền mạch; chỗ cắt không có hiện dần/ẩn dần. Lớp COMP: bản sao dùng cùng comp. `t` không nằm giữa một thanh → null.
 */
export function splitLayer(scene: SceneDocument, id: string, t: number, duration: number): { widgets: WidgetSpec[]; copy: WidgetSpec } | null {
  const w = scene.widgets.find((x) => x.id === id); if (!w) return null;
  const v = w.visibility ?? ALWAYS;
  const k = v.ranges.findIndex((r) => t > r.from + MIN_CLIP / 2 && t < (r.to ?? Math.max(duration, r.from)) - MIN_CLIP / 2);
  if (k < 0) return null;
  const cut = r6(t), r = v.ranges[k];
  const left: TimeRange[] = [...v.ranges.slice(0, k), { from: r.from, to: cut }];
  const right: TimeRange[] = [{ from: cut, to: r.to }, ...v.ranges.slice(k + 1)];
  const { name: _n, ...rest } = JSON.parse(JSON.stringify(w)) as WidgetSpec;
  const copy: WidgetSpec = { ...rest, id: newWidgetId(scene, w.type), visibility: { ...v, ranges: right, fadeIn: 0 } };
  const orig: WidgetSpec = { ...w, visibility: { ...v, ranges: left, fadeOut: k === v.ranges.length - 1 ? 0 : v.fadeOut } };
  // thứ tự lớp: bản sao ngay trên lớp gốc; đánh lại zIndex theo danh sách Lớp (trên cùng = lớn nhất)
  const order = layerOrder(scene), at = order.indexOf(id);
  order.splice(at, 0, copy.id);
  const z = new Map(order.map((x, i) => [x, order.length - 1 - i]));
  const widgets = [...scene.widgets.map((x) => (x.id === id ? orig : x)), copy].map((x) => (x.zIndex === z.get(x.id) ? x : { ...x, zIndex: z.get(x.id)! }));
  return { widgets, copy: { ...copy, zIndex: z.get(copy.id)! } };
}

/**
 * Gom các lớp `ids` thành một precomp (Ctrl+Shift+C). `offset` = giây toàn bài của giây 0 trong comp đang mở (khung nhìn dùng thời gian toàn bài):
 * nội dung comp mới lưu theo thời gian của comp nên keyframe và khoảng hiển thị không đổi chỗ trên timeline. Lớp COMP mới phủ cả khung, nằm ở vị trí
 * của lớp trên cùng trong nhóm, thanh khớp phần có nội dung, và mang tên `name`. Cha nằm ngoài nhóm bị bỏ (con trong comp không thấy được cha ở ngoài); lớp ngoài nhóm có cha bị
 * gom thì cũng thôi có cha.
 */
export function precompose(scene: SceneDocument, ids: readonly string[], offset: number, compId: string, name: string): { widgets: WidgetSpec[]; comps: Record<string, CompSpec>; layer: WidgetSpec } | null {
  const set = new Set(ids.filter((id) => scene.widgets.some((w) => w.id === id)));
  if (!set.size || compId.includes(COMP_SEP) || scene.comps?.[compId]) return null;
  const picked = scene.widgets.filter((w) => set.has(w.id));
  const content = picked.map((w) => {
    const x = shiftWidgetTime(w, -offset);
    if (x.parent && !set.has(x.parent)) { const { parent: _p, ...rest } = x; return rest as WidgetSpec; }
    return x;
  });
  const { designWidth: W, designHeight: H } = scene.canvas;
  // Thanh của lớp precomp khớp phần nội dung: từ đầu thanh sớm nhất tới cuối thanh muộn nhất (lớp suốt bài → precomp suốt bài).
  const spans = picked.map((w) => (w.visibility ?? ALWAYS).ranges);
  const lo = Math.min(...spans.flat().map((r) => r.from)), open = spans.some((rs) => rs.some((r) => r.to === null));
  const hi = open ? null : Math.max(...spans.flat().map((r) => r.to as number));
  const span: WidgetVisibility | undefined = lo > 0 || hi !== null ? { ranges: [{ from: r6(lo), to: hi === null ? null : r6(hi) }], fadeIn: 0, fadeOut: 0 } : undefined;
  const layer: WidgetSpec = {
    id: newWidgetId(scene, 'COMP'), type: 'COMP', name, zIndex: Math.max(...picked.map((w) => w.zIndex)), visible: true,
    layout: { x: 0, y: 0, width: W, height: H, rotation: 0, anchor: { ...DEFAULT_ANCHOR } }, trackMappingMode: 'ALL', assignedTrackIndices: [],
    properties: { comp: compId, start: r6(offset) }, ...(span ? { visibility: span } : {}),
  };
  const kept = scene.widgets.filter((w) => !set.has(w.id)).map((w) => {
    if (!w.parent || !set.has(w.parent)) return w;
    const { parent: _p, ...rest } = w; return rest as WidgetSpec;
  });
  // vị trí của lớp COMP trong tài liệu: chỗ của lớp đầu tiên bị gom (giữ thứ tự vẽ khi cùng zIndex)
  const first = scene.widgets.findIndex((w) => set.has(w.id));
  const before = scene.widgets.slice(0, first).filter((w) => !set.has(w.id)).length;
  const widgets = [...kept.slice(0, before), layer, ...kept.slice(before)];
  return { widgets, comps: { ...(scene.comps ?? {}), [compId]: { name, widgets: content } }, layer };
}

/** Tên precomp mới không trùng tên lớp nào trong khung nhìn và tên comp nào: "<gốc> <n>". */
export function newCompName(scene: SceneDocument, base: string, layerNames: readonly string[]): string {
  const taken = new Set([...layerNames, ...Object.values(scene.comps ?? {}).map((c) => c.name)].map((s) => s.toLocaleLowerCase()));
  let n = 1; while (taken.has(`${base} ${n}`.toLocaleLowerCase())) n++;
  return `${base} ${n}`;
}

/** Ranh giới để bắt dính khi kéo thanh: đầu/cuối mọi thanh khác (không thuộc các lớp đang kéo). */
export function clipEdges(widgets: readonly WidgetSpec[], skip: ReadonlySet<string>, duration: number): number[] {
  const out: number[] = [];
  for (const w of widgets) if (!skip.has(w.id)) for (const c of clipsOf(w, duration)) out.push(c.from, c.to);
  return out;
}
/** Còn thêm được khoảng hiển thị không (MAX_RANGES). */
export const canAddRange = (w: WidgetSpec): boolean => (w.visibility?.ranges.length ?? 1) < MAX_RANGES;
