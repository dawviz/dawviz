// Timeline lớp (tầng 1, D-69, T-112): mỗi lớp (widget) là một hàng, mỗi khoảng hiển thị là một thanh. Phép thuần trên danh sách widget của khung
// nhìn đang mở (lib/compLens.ts): dời thanh (keyframe đi theo, như After Effects), cắt mép (keyframe đứng yên), tách lớp tại vạch phát (Ctrl+K: thành
// hai lớp, mỗi lớp giữ keyframe riêng), gom các lớp đang chọn thành precomp. Không DOM; test ở layerTimeline.test.ts.
import { COMP_SEP, DEFAULT_ANCHOR, MAX_FADE, MAX_RANGES, apply, compOf, compTimeMap, deltaMatrix, invertTime, isKeyAnim, mapWidgetTime, newWidgetId, normalizeAngle, shiftWidgetTime, widgetMatrix, widgetNameKey, type CompSpec, type SceneDocument, type TimeMap, type TimeRange, type TempoPoint, type WidgetSpec, type WidgetVisibility } from '@dawviz/render-core';
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
 * Gom các lớp `ids` thành một precomp (Ctrl+G). `frame` = phép đổi thời gian của comp đang mở sang thời gian toàn bài (khung nhìn dùng thời gian toàn bài):
 * nội dung comp mới lưu theo thời gian của comp nên keyframe và khoảng hiển thị không đổi chỗ trên timeline. Lớp COMP mới phủ cả khung, nằm ở vị trí
 * của lớp trên cùng trong nhóm, thanh khớp phần có nội dung, và mang tên `name`. Cha nằm ngoài nhóm bị bỏ (con trong comp không thấy được cha ở ngoài); lớp ngoài nhóm có cha bị
 * gom thì cũng thôi có cha.
 */
export function precompose(scene: SceneDocument, ids: readonly string[], frame: TimeMap, compId: string, name: string): { widgets: WidgetSpec[]; comps: Record<string, CompSpec>; layer: WidgetSpec } | null {
  const set = new Set(ids.filter((id) => scene.widgets.some((w) => w.id === id)));
  if (!set.size || compId.includes(COMP_SEP) || scene.comps?.[compId]) return null;
  const picked = scene.widgets.filter((w) => set.has(w.id));
  const content = picked.map((w) => {
    const x = mapWidgetTime(w, invertTime(frame));
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
    // trong khung nhìn (thời gian toàn bài): giây 0 của comp mới trùng giây 0 của comp đang mở, cùng tốc độ → khi ghi lại: start 0, tốc độ 1
    properties: { comp: compId, start: r6(frame.b), ...(frame.a !== 1 ? { speed: r6(1 / frame.a) } : {}) }, ...(span ? { visibility: span } : {}),
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

// ── bắt dính theo độ dài, cắt mép nhiều lớp, hiện dần/ẩn dần ──
/**
 * Đích bắt dính theo **độ dài** khi cắt mép (D-69): mép đang kéo dính vào chỗ làm thanh dài bằng một thanh khác. `anchor` = mép đứng yên của thanh
 * đang cắt (đầu thanh khi kéo cuối, cuối thanh khi kéo đầu). Mỗi đích kèm id lớp và độ dài để hiện nhãn "= <lớp> (<độ dài>)".
 */
export function lengthTargets(widgets: readonly WidgetSpec[], skip: ReadonlySet<string>, duration: number, anchor: number, edge: 'in' | 'out'): { t: number; id: string; len: number }[] {
  const out: { t: number; id: string; len: number }[] = [];
  for (const w of widgets) {
    if (skip.has(w.id)) continue;
    for (const c of clipsOf(w, duration)) {
      const len = c.to - c.from; if (len < MIN_CLIP) continue;
      const t = edge === 'out' ? anchor + len : anchor - len;
      if (t >= 0 && t <= duration + 1e-9) out.push({ t: r6(t), id: w.id, len: r6(len) });
    }
  }
  return out;
}

/**
 * Cắt mép nhiều lớp cùng lúc: lớp `primary` cắt thanh `clip` tới `t`; mọi lớp khác trong `ids` dời cùng mép đó thêm đúng chừng ấy (thanh của chúng
 * có mép cùng phía gần mép cũ của lớp chính nhất). Kẹp riêng từng lớp như `trimLayer`.
 */
export function trimMany(widgets: readonly WidgetSpec[], ids: readonly string[], primary: { id: string; clip: number }, edge: 'in' | 'out', t: number, duration: number): WidgetSpec[] {
  const p = widgets.find((w) => w.id === primary.id); if (!p) return [...widgets];
  const pc = clipsOf(p, duration)[primary.clip]; if (!pc) return [...widgets];
  const old = edge === 'in' ? pc.from : pc.to, delta = t - old, set = new Set(ids);
  return widgets.map((w) => {
    if (w.id === primary.id) return trimLayer(w, primary.clip, edge, t, duration);
    if (!set.has(w.id)) return w;
    const cs = clipsOf(w, duration);
    let best = 0;
    cs.forEach((c, i) => { const e = edge === 'in' ? c.from : c.to, b = edge === 'in' ? cs[best].from : cs[best].to; if (Math.abs(e - old) < Math.abs(b - old)) best = i; });
    const c = cs[best]; if (!c) return w;
    return trimLayer(w, best, edge, (edge === 'in' ? c.from : c.to) + delta, duration);
  });
}

/** Đặt thời gian hiện dần (`in`) hoặc ẩn dần (`out`) của lớp, giây; kẹp 0..MAX_FADE và không dài hơn thanh ngắn nhất. Lớp suốt bài được cho khoảng trước. */
export function setFade(w: WidgetSpec, which: 'in' | 'out', sec: number, duration: number): WidgetSpec {
  const v = w.visibility ?? ALWAYS;
  const shortest = Math.min(...clipsOf({ visibility: v }, duration).map((c) => c.to - c.from));
  const f = r6(Math.max(0, Math.min(MAX_FADE, shortest, Math.round(sec * 100) / 100)));
  const next = { ...v, ranges: v.ranges.map((r) => ({ ...r })), [which === 'in' ? 'fadeIn' : 'fadeOut']: f };
  if (w.visibility && next.fadeIn === w.visibility.fadeIn && next.fadeOut === w.visibility.fadeOut) return w;
  return { ...w, visibility: next };
}

/** Giao của hai danh sách khoảng (thời gian toàn bài; `to = null` = hết bài). */
function intersect(a: readonly TimeRange[], b: readonly TimeRange[], duration: number): TimeRange[] {
  const end = (r: TimeRange) => r.to ?? Math.max(duration, r.from) + 1e9;
  const out: TimeRange[] = [];
  for (const x of a) for (const y of b) {
    const from = Math.max(x.from, y.from), to = Math.min(end(x), end(y));
    if (to - from >= MIN_CLIP) out.push({ from: r6(from), to: x.to === null && y.to === null ? null : r6(to) });
  }
  return out.sort((p, q) => p.from - q.from).slice(0, MAX_RANGES);
}

/**
 * Gỡ precomp (ngược của gom): thay lớp COMP `layerId` bằng các lớp bên trong comp của nó, đúng chỗ trong thứ tự lớp. Thời gian theo điểm bắt đầu và
 * tốc độ của lớp; vị trí và góc tĩnh của lớp COMP được cộng vào từng lớp; lớp chỉ hiện trong khoảng mà lớp COMP hiện. Id/tên trùng với lớp khác
 * được đổi/bỏ; cha của lớp COMP thành cha của các lớp ở cấp đầu. Hoạt hình, chuyển động, tỉ lệ và hiện dần/ẩn dần của chính lớp COMP không giữ được:
 * `lost = true` để báo. Comp vẫn ở lại trong sổ (lớp COMP khác có thể đang dùng). `refs`: khoá mốc ↺ cũ (`<comp>/<id>`) → id mới.
 */
export function uncompose(scene: SceneDocument, layerId: string, duration: number): { widgets: WidgetSpec[]; added: string[]; refs: [string, string][]; lost: boolean } | null {
  const L = scene.widgets.find((w) => w.id === layerId), c = L && compOf(L), spec = c && scene.comps?.[c.comp];
  if (!L || !c || !spec) return null;
  const m = compTimeMap(c), { designWidth: W, designHeight: H } = scene.canvas;
  const D = deltaMatrix(widgetMatrix(L.layout, normalizeAngle(L.layout.rotation)), widgetMatrix({ ...L.layout, x: 0, y: 0, width: W, height: H, rotation: 0 }, 0));
  const lost = !!(L.animate && Object.keys(L.animate).length) || !!L.motion || (L.visibility ? L.visibility.fadeIn > 0 || L.visibility.fadeOut > 0 : false);
  const rest = scene.widgets.filter((w) => w.id !== layerId);
  const taken = { scene: { ...scene, widgets: rest } as SceneDocument };
  const names = new Set(rest.flatMap((w) => (w.name ? [widgetNameKey(w.name)] : [])));
  const idMap = new Map<string, string>();
  for (const w of spec.widgets) {
    const id = rest.some((x) => x.id === w.id) || [...idMap.values()].includes(w.id) ? newWidgetId(taken.scene, w.type) : w.id;
    idMap.set(w.id, id);
    taken.scene = { ...taken.scene, widgets: [...taken.scene.widgets, { ...w, id }] };
  }
  const inner = new Set(spec.widgets.map((w) => w.id));
  const range = L.visibility?.ranges;
  const kids = spec.widgets.map((w0): WidgetSpec => {
    const w = mapWidgetTime(w0, m);
    const l = w.layout, rot = normalizeAngle(l.rotation);
    const [px, py] = apply(D, l.x + l.anchor.x * l.width, l.y + l.anchor.y * l.height);
    const rotD = Math.atan2(D[1], D[0]) * 180 / Math.PI;
    const out: WidgetSpec = { ...w, id: idMap.get(w0.id)!, visible: w.visible && L.visible,
      layout: { ...l, x: r6(px - l.anchor.x * l.width), y: r6(py - l.anchor.y * l.height), rotation: normalizeAngle(rot + rotD) } };
    if (w0.parent && inner.has(w0.parent)) out.parent = idMap.get(w0.parent)!;
    else if (L.parent) out.parent = L.parent; else delete out.parent;
    if (w.name && names.has(widgetNameKey(w.name))) delete out.name; else if (w.name) names.add(widgetNameKey(w.name));
    if (range) { const v = w.visibility ?? ALWAYS; out.visibility = { ...v, ranges: intersect(v.ranges, range, duration) }; }
    return out;
  });
  // thứ tự lớp: các lớp con thế chỗ lớp COMP (trên cùng của comp ở trên), rồi đánh lại zIndex cho cả danh sách
  const order = layerOrder(scene), at = order.indexOf(layerId);
  const kidOrder = layerOrder({ ...scene, widgets: kids });
  order.splice(at, 1, ...kidOrder);
  const z = new Map(order.map((x, i) => [x, order.length - 1 - i]));
  const first = scene.widgets.findIndex((w) => w.id === layerId);
  const widgets = [...rest.slice(0, first), ...kids, ...rest.slice(first)].map((w) => (w.zIndex === z.get(w.id) ? w : { ...w, zIndex: z.get(w.id)! }));
  return { widgets, added: kids.map((w) => w.id), refs: spec.widgets.map((w) => [`${c.comp}${COMP_SEP}${w.id}`, idMap.get(w.id)!]), lost };
}
