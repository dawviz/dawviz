// Precomp (D-69, T-112): một scene có thể chứa các "comp" (bố cục con, như precomposition của After Effects). Comp nằm trong sổ `scene.comps`
// (khoá = id comp) và được đặt lên timeline bằng một lớp loại `COMP` (`properties = { comp, start }`). Comp chứa comp khác được, sâu tối đa
// MAX_COMP_DEPTH cấp, không vòng lặp. Cùng một comp có thể đặt ở nhiều lớp (sửa comp là mọi lớp đó đổi theo).
//
// Thời gian (D-69): mọi mốc của một widget (keyframe mốc giây, khoảng hiển thị) tính theo "thời gian của comp chứa nó". Lớp COMP có `start`:
// thời điểm (theo comp cha) mà giây 0 của comp con bắt đầu. Mốc nhạc của keyframe (bar/beat/tick), dữ liệu nốt, biểu thức và binding vẫn theo
// thời gian toàn bài (như D-66): chỉ phần dàn dựng dời theo lớp.
//
// Vẽ: `flattenScene` trải cây comp thành một danh sách widget phẳng TRƯỚC khi dựng khung (đệm theo scene). Con của một lớp COMP có id
// `<id lớp>/<id con>`, mốc giây cộng thêm độ lệch của comp, và lấy lớp COMP làm cha (parenting) nên dời/xoay/tỉ lệ/độ đục/chuyển động của lớp
// COMP áp lên cả comp. Lớp COMP không tự vẽ gì. Hàm thuần, tất định theo scene; scene không có comp nào thì trả nguyên scene.
import type { Animation } from './animation.ts';
import type { SceneDocument, WidgetSpec } from './scene.ts';
import type { WidgetVisibility } from './visibility.ts';

export const MAX_COMP_DEPTH = 4;
export const MAX_COMPS = 32;
/** Tổng số widget sau khi trải phẳng (mỗi lần đặt một comp tính lại các widget của nó). */
export const MAX_FLAT_WIDGETS = 512;
export const MAX_COMP_ID = 64;
export const MAX_COMP_NAME = 60;
/** Dấu nối id lớp COMP với id con khi trải phẳng. Id widget không được chứa ký tự này. */
export const COMP_SEP = '/';

/** Thuộc tính của lớp COMP: `comp` = khoá trong `scene.comps`; `start` = giây (theo comp cha) mà giây 0 của comp bắt đầu; `speed` = tốc độ phát. */
export interface CompProps { comp: string; start: number; /** Tốc độ phát nội dung (1 = thường, 2 = nhanh gấp đôi), 0,1–10. Vắng = 1. */ speed?: number }
/** Một comp: tên hiển thị và danh sách widget (cùng dạng `scene.widgets`). */
export interface CompSpec { name: string; widgets: WidgetSpec[] }

export const isCompLayer = (w: Pick<WidgetSpec, 'type'>): boolean => w.type === 'COMP';
export const compOf = (w: WidgetSpec): CompProps | null => (w.type === 'COMP' ? (w.properties as CompProps) : null);
/** Id lớp gốc (cấp scene) của một id đã trải phẳng. */
export const rootIdOf = (flatId: string): string => { const i = flatId.indexOf(COMP_SEP); return i < 0 ? flatId : flatId.slice(0, i); };

const r6 = (v: number) => Math.round(v * 1e6) / 1e6;
const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/** Phép đổi thời gian tuyến tính: giây ngoài = `a` × giây trong + `b` (precomp: `b` = điểm bắt đầu, `a` = 1 / tốc độ). */
export interface TimeMap { a: number; b: number }
export const IDENTITY_TIME: TimeMap = Object.freeze({ a: 1, b: 0 });
const isId = (m: TimeMap) => m.a === 1 && m.b === 0;
/** Phép ngược của `m`. */
export const invertTime = (m: TimeMap): TimeMap => ({ a: 1 / m.a, b: -m.b / m.a });
/** Ghép: thời gian trong `inner` → thời gian ngoài của `outer` (outer ∘ inner). */
export const composeTime = (outer: TimeMap, inner: TimeMap): TimeMap => ({ a: outer.a * inner.a, b: outer.a * inner.b + outer.b });
/** Phép đổi thời gian của nội dung lớp COMP (theo thời gian comp cha): giây 0 của comp ở `start`, chạy nhanh gấp `speed`. */
export const compTimeMap = (c: CompProps): TimeMap => ({ a: 1 / (c.speed ?? 1), b: c.start });
const mt = (m: TimeMap, t: number) => r6(m.a * t + m.b);

/** Đổi mốc giây của một hoạt hình theo `m` (keyframe mốc `sec`; mốc nhạc, binding, biểu thức giữ nguyên). */
export function mapAnimation(a: Animation, m: TimeMap): Animation {
  if (isId(m) || !Array.isArray((a as { keys?: unknown }).keys)) return a;
  const k = a as { keys: { at: object }[] };
  if (!k.keys.some((x) => 'sec' in x.at)) return a;
  return { ...a, keys: k.keys.map((x) => ('sec' in x.at ? { ...x, at: { sec: mt(m, (x.at as { sec: number }).sec) } } : x)) } as Animation;
}
/** Dời mốc giây của một hoạt hình thêm `dt`. */
export const shiftAnimation = (a: Animation, dt: number): Animation => mapAnimation(a, { a: 1, b: dt });
const mapVisibility = (v: WidgetVisibility, m: TimeMap): WidgetVisibility => ({
  ranges: v.ranges.map((r) => ({ from: mt(m, r.from), to: r.to === null ? null : mt(m, r.to) })),
  fadeIn: m.a === 1 ? v.fadeIn : r6(v.fadeIn * m.a), fadeOut: m.a === 1 ? v.fadeOut : r6(v.fadeOut * m.a),
});
const mapCompProps = (c: CompProps, m: TimeMap): CompProps => {
  const speed = r6((c.speed ?? 1) / m.a);
  const { speed: _s, ...rest } = c;
  return { ...rest, start: mt(m, c.start), ...(speed !== 1 ? { speed } : {}) };
};

/**
 * Đổi mọi mốc thời gian dàn dựng của widget theo `m`: keyframe mốc giây, khoảng hiển thị (và thời gian hiện dần/ẩn dần co theo `a`), và (lớp COMP)
 * điểm bắt đầu, tốc độ của comp con. Dùng để trải precomp và để hiện comp theo thời gian toàn bài trong Editor. `m` đơn vị → trả nguyên widget.
 */
export function mapWidgetTime(w: WidgetSpec, m: TimeMap): WidgetSpec {
  if (isId(m)) return w;
  const out: WidgetSpec = { ...w };
  if (w.animate) out.animate = Object.fromEntries(Object.entries(w.animate).map(([p, a]) => [p, mapAnimation(a, m)]));
  if (w.visibility) out.visibility = mapVisibility(w.visibility, m);
  const c = compOf(w); if (c) out.properties = mapCompProps(c, m);
  return out;
}
/**
 * Dời mọi mốc thời gian dàn dựng của widget thêm `dt` giây: keyframe mốc giây, khoảng hiển thị, và (lớp COMP) điểm bắt đầu của comp con.
 * Đây là phép "kéo thanh lớp trên timeline": keyframe đi theo lớp như After Effects. `dt = 0` trả nguyên widget.
 */
export const shiftWidgetTime = (w: WidgetSpec, dt: number): WidgetSpec => mapWidgetTime(w, { a: 1, b: dt });

/**
 * Ngược của `mapWidgetTime` khi sửa trong khung nhìn của một comp (Editor hiện mốc theo thời gian toàn bài): phần nào không đổi so với bản đã đổi
 * của `orig` thì giữ đúng giá trị gốc (không trôi số do tính số thực), phần đã đổi thì đổi ngược.
 */
export function unmapWidgetTime(orig: WidgetSpec | undefined, edited: WidgetSpec, m: TimeMap): WidgetSpec {
  if (isId(m)) return edited;
  const inv = invertTime(m);
  if (!orig) return mapWidgetTime(edited, inv);
  const view = mapWidgetTime(orig, m);
  if (view === edited || same(view, edited)) return orig;
  const out: WidgetSpec = { ...edited };
  if (edited.animate) {
    out.animate = Object.fromEntries(Object.entries(edited.animate).map(([p, a]) => [p, view.animate && same(view.animate[p], a) && orig.animate ? orig.animate[p] : mapAnimation(a, inv)]));
  }
  if (edited.visibility) out.visibility = view.visibility && same(view.visibility, edited.visibility) && orig.visibility ? orig.visibility : mapVisibility(edited.visibility, inv);
  const c = compOf(edited);
  if (c) { const vc = compOf(view), oc = compOf(orig); out.properties = vc && oc && same(vc, c) ? oc : mapCompProps(c, inv); }
  return out;
}
/** Ngược của `shiftWidgetTime`. */
export const unshiftWidgetTime = (orig: WidgetSpec | undefined, edited: WidgetSpec, dt: number): WidgetSpec => unmapWidgetTime(orig, edited, { a: 1, b: dt });

// ───────────────────────────── đường dẫn comp (Editor) ─────────────────────────────
/** Đường dẫn tới một comp đang mở: danh sách id lớp COMP từ gốc vào trong. `[]` = timeline gốc. */
export type CompPath = readonly string[];
export interface CompFrame { layer: WidgetSpec; comp: string; spec: CompSpec; /** Giây toàn bài của giây 0 trong comp này. */ offset: number; /** Thời gian trong comp này → thời gian toàn bài. */ map: TimeMap }

/** Đi theo đường dẫn: các cấp hợp lệ (dừng ở cấp đầu tiên sai: lớp không còn, không phải COMP, comp không có). */
export function resolveCompPath(scene: SceneDocument, path: CompPath): CompFrame[] {
  const out: CompFrame[] = [];
  let widgets = scene.widgets, map = IDENTITY_TIME;
  for (const id of path) {
    const layer = widgets.find((w) => w.id === id), c = layer && compOf(layer), spec = c && scene.comps?.[c.comp];
    if (!layer || !c || !spec) break;
    map = composeTime(map, compTimeMap(c));
    out.push({ layer, comp: c.comp, spec, offset: r6(map.b), map });
    widgets = spec.widgets;
  }
  return out;
}
/** Đường dẫn còn hợp lệ (cắt phần sai, vd. sau khi hoàn tác xoá lớp COMP). */
export const validCompPath = (scene: SceneDocument, path: CompPath): string[] => resolveCompPath(scene, path).map((f) => f.layer.id);
/** Giây toàn bài của giây 0 trong comp ở cuối đường dẫn (0 ở gốc). */
export const compPathOffset = (scene: SceneDocument, path: CompPath): number => resolveCompPath(scene, path).at(-1)?.offset ?? 0;

/**
 * Khung nhìn của comp ở cuối `path` dưới dạng một scene: `widgets` = widget của comp đó với mốc thời gian đã dời sang thời gian toàn bài
 * (Editor, timeline và Render Core dùng thẳng như scene gốc). Các trường khác (khung, kiểu chữ, phase, sổ comp) là của scene gốc.
 */
export function compView(scene: SceneDocument, path: CompPath): SceneDocument {
  const f = resolveCompPath(scene, path).at(-1);
  if (!f) return scene;
  return { ...scene, widgets: f.spec.widgets.map((w) => mapWidgetTime(w, f.map)) };
}
/**
 * Ghi khung nhìn đã sửa (`edited`, cùng dạng `compView`) vào lại scene gốc `base`: widget của comp ở cuối `path` lấy từ `edited.widgets` (dời ngược
 * về thời gian của comp); các trường khác của scene (kể cả sổ comp, vd. vừa tạo comp con) lấy từ `edited`.
 */
export function setCompView(base: SceneDocument, path: CompPath, edited: SceneDocument): SceneDocument {
  const f = resolveCompPath(base, path).at(-1);
  if (!f) return edited;
  const prev = new Map(f.spec.widgets.map((w) => [w.id, w]));
  const widgets = edited.widgets.map((w) => unmapWidgetTime(prev.get(w.id), w, f.map));
  const comps = { ...(edited.comps ?? base.comps ?? {}) };
  const cur = comps[f.comp] ?? f.spec;
  comps[f.comp] = same(cur.widgets, widgets) ? cur : { ...cur, widgets };
  return { ...edited, widgets: base.widgets, comps };
}

/** Id comp mới không trùng: `comp-<n>`. */
export function newCompId(scene: SceneDocument): string {
  const ids = new Set(Object.keys(scene.comps ?? {}));
  let n = 1; while (ids.has(`comp-${n}`)) n++;
  return `comp-${n}`;
}

/**
 * Nhân bản ĐỘC LẬP một comp (T-122, Ctrl+D trên lớp COMP): sao chép sâu comp `rootId` và mọi comp nó chứa (lớp COMP bên trong trỏ sang bản sao
 * mới), id mới `comp-<n>`, tên mới "<tên> 2…" không trùng tên comp nào (so không phân biệt hoa thường). Trả sổ comp mới (chỉ các bản sao) và id
 * của bản sao gốc; `null` nếu vượt MAX_COMPS hoặc comp không tồn tại. Hàm thuần: không đổi `scene`.
 */
export function cloneCompTree(scene: SceneDocument, rootId: string): { root: string; comps: Record<string, CompSpec> } | null {
  const have = scene.comps ?? {};
  if (!have[rootId]) return null;
  const order: string[] = [];
  const walk = (id: string, seen: ReadonlySet<string>) => { if (order.includes(id) || seen.has(id) || !have[id]) return; order.push(id); for (const c of childComps(have[id])) walk(c, new Set(seen).add(id)); };
  walk(rootId, new Set());
  if (Object.keys(have).length + order.length > MAX_COMPS) return null;
  const ids = new Set(Object.keys(have)), names = new Set(Object.values(have).map((c) => c.name.toLocaleLowerCase()));
  const map = new Map<string, string>();
  for (const id of order) { let n = 1; while (ids.has(`comp-${n}`)) n++; ids.add(`comp-${n}`); map.set(id, `comp-${n}`); }
  const out: Record<string, CompSpec> = {};
  for (const id of order) {
    const src = have[id], base = src.name.replace(/ \d+$/, '');
    let k = 2, name = '';
    do { name = `${base} ${k++}`.slice(-MAX_COMP_NAME); } while (names.has(name.toLocaleLowerCase()));
    names.add(name.toLocaleLowerCase());
    const widgets = (JSON.parse(JSON.stringify(src.widgets)) as WidgetSpec[]).map((w) => {
      const c = compOf(w);
      return c && map.has(c.comp) ? { ...w, properties: { ...(w.properties as CompProps), comp: map.get(c.comp)! } } as WidgetSpec : w;
    });
    out[map.get(id)!] = { name, widgets };
  }
  return { root: map.get(rootId)!, comps: out };
}

// ───────────────────────────── kiểm tra cây comp ─────────────────────────────
/** Comp mà comp `id` dùng trực tiếp (qua lớp COMP của nó). */
const childComps = (spec: CompSpec | undefined): string[] => (spec ? spec.widgets.flatMap((w) => { const c = compOf(w); return c ? [c.comp] : []; }) : []);

/** Độ sâu lồng của comp `id` (1 = comp chỉ chứa widget thường); `Infinity` nếu có vòng lặp. */
export function compDepth(comps: Readonly<Record<string, CompSpec>>, id: string, seen: ReadonlySet<string> = new Set()): number {
  if (seen.has(id)) return Infinity;
  const spec = comps[id]; if (!spec) return 0;
  const next = new Set(seen).add(id);
  let d = 0;
  for (const c of childComps(spec)) d = Math.max(d, compDepth(comps, c, next));
  return d + 1;
}
/** Đặt comp `id` vào comp/scene đang ở độ sâu `atDepth` (0 = gốc) có hợp lệ không: không vòng lặp, không vượt MAX_COMP_DEPTH. `inside` = các comp
 *  bao quanh chỗ đặt (đường dẫn đang mở), để chặn đặt comp vào chính nó. */
export function canPlaceComp(comps: Readonly<Record<string, CompSpec>>, id: string, inside: readonly string[]): boolean {
  if (!comps[id] || inside.includes(id)) return false;
  const d = compDepth(comps, id);
  if (!Number.isFinite(d)) return false;
  // comp được đặt không được chứa (gián tiếp) comp đang bao quanh chỗ đặt: sẽ thành vòng lặp
  const contains = (from: string, target: string, seen: ReadonlySet<string>): boolean =>
    childComps(comps[from]).some((c) => c === target || (!seen.has(c) && contains(c, target, new Set(seen).add(c))));
  if (inside.some((c) => contains(id, c, new Set([id])))) return false;
  return inside.length + d <= MAX_COMP_DEPTH;
}
/** Số widget sau khi trải phẳng (để chặn vượt MAX_FLAT_WIDGETS khi thêm hoặc nhân bản lớp COMP). */
export function flatCount(scene: SceneDocument): number {
  const size = (id: string, depth: number, stack: readonly string[]): number => {
    const spec = scene.comps?.[id];
    if (!spec || depth > MAX_COMP_DEPTH || stack.includes(id)) return 0;
    return spec.widgets.reduce((s, w) => { const c = compOf(w); return s + 1 + (c ? size(c.comp, depth + 1, [...stack, id]) : 0); }, 0);
  };
  return scene.widgets.reduce((s, w) => { const c = compOf(w); return s + 1 + (c ? size(c.comp, 1, []) : 0); }, 0);
}

// ───────────────────────────── trải phẳng để vẽ ─────────────────────────────
const flatMemo = new WeakMap<SceneDocument, SceneDocument>();
/** Có gì để trải không: cần cả sổ comp lẫn lớp COMP (scene đã trải phẳng không còn `comps`, nên trải lại là không làm gì). */
const hasComps = (s: SceneDocument) => !!s.comps && s.widgets.some(isCompLayer);

/**
 * Scene phẳng để dựng khung: lớp COMP được thay bằng chính nó (làm cha, không vẽ) và ngay sau nó, theo thứ tự lớp, mọi widget trong comp (đệ quy,
 * id có tiền tố, mốc giây đã dời, cha = lớp COMP nếu không có cha riêng). `zIndex` được đánh lại theo thứ tự vẽ cuối cùng. Comp thiếu, vòng lặp,
 * quá MAX_COMP_DEPTH cấp hoặc vượt MAX_FLAT_WIDGETS: phần đó bị bỏ qua (bộ đọc preset đã cảnh báo). Không có lớp COMP → trả nguyên `scene`.
 */
export function flattenScene(scene: SceneDocument): SceneDocument {
  if (!hasComps(scene)) return scene;
  const hit = flatMemo.get(scene); if (hit) return hit;
  const out: WidgetSpec[] = [];
  const byZ = (ws: readonly WidgetSpec[]) => ws.map((w, i) => ({ w, i })).sort((a, b) => a.w.zIndex - b.w.zIndex || a.i - b.i).map(({ w }) => w);
  const walk = (ws: readonly WidgetSpec[], prefix: string, map: TimeMap, parentLayer: string | null, stack: readonly string[]) => {
    const ids = new Set(ws.map((w) => w.id));
    for (const w0 of byZ(ws)) {
      if (out.length >= MAX_FLAT_WIDGETS) return;
      const id = prefix + w0.id;
      const w = mapWidgetTime({ ...w0, id }, map);
      if (prefix) {
        if (w0.parent && ids.has(w0.parent)) w.parent = prefix + w0.parent;
        else if (parentLayer) w.parent = parentLayer; else delete w.parent;
      }
      out.push(w);
      const c = compOf(w0), spec = c && scene.comps?.[c.comp];
      if (c && spec && !stack.includes(c.comp) && stack.length < MAX_COMP_DEPTH) walk(spec.widgets, id + COMP_SEP, composeTime(map, compTimeMap(c)), id, [...stack, c.comp]);
    }
  };
  walk(scene.widgets, '', IDENTITY_TIME, null, []);
  const flat: SceneDocument = { ...scene, widgets: out.map((w, i) => (w.zIndex === i ? w : { ...w, zIndex: i })) };
  delete flat.comps;
  flatMemo.set(scene, flat);
  return flat;
}
