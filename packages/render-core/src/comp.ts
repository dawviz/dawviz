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

/** Thuộc tính của lớp COMP: `comp` = khoá trong `scene.comps`; `start` = giây (theo comp cha) mà giây 0 của comp bắt đầu. */
export interface CompProps { comp: string; start: number }
/** Một comp: tên hiển thị và danh sách widget (cùng dạng `scene.widgets`). */
export interface CompSpec { name: string; widgets: WidgetSpec[] }

export const isCompLayer = (w: Pick<WidgetSpec, 'type'>): boolean => w.type === 'COMP';
export const compOf = (w: WidgetSpec): CompProps | null => (w.type === 'COMP' ? (w.properties as CompProps) : null);
/** Id lớp gốc (cấp scene) của một id đã trải phẳng. */
export const rootIdOf = (flatId: string): string => { const i = flatId.indexOf(COMP_SEP); return i < 0 ? flatId : flatId.slice(0, i); };

const r6 = (v: number) => Math.round(v * 1e6) / 1e6;
const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/** Dời mốc giây của một hoạt hình thêm `dt` (keyframe mốc `sec`; mốc nhạc, binding, biểu thức giữ nguyên). */
export function shiftAnimation(a: Animation, dt: number): Animation {
  if (!dt || !Array.isArray((a as { keys?: unknown }).keys)) return a;
  const k = a as { keys: { at: object }[] };
  if (!k.keys.some((x) => 'sec' in x.at)) return a;
  return { ...a, keys: k.keys.map((x) => ('sec' in x.at ? { ...x, at: { sec: r6((x.at as { sec: number }).sec + dt) } } : x)) } as Animation;
}
const shiftVisibility = (v: WidgetVisibility, dt: number): WidgetVisibility =>
  ({ ...v, ranges: v.ranges.map((r) => ({ from: r6(r.from + dt), to: r.to === null ? null : r6(r.to + dt) })) });

/**
 * Dời mọi mốc thời gian dàn dựng của widget thêm `dt` giây: keyframe mốc giây, khoảng hiển thị, và (lớp COMP) điểm bắt đầu của comp con.
 * Đây là phép "kéo thanh lớp trên timeline": keyframe đi theo lớp như After Effects. `dt = 0` trả nguyên widget.
 */
export function shiftWidgetTime(w: WidgetSpec, dt: number): WidgetSpec {
  if (!dt) return w;
  const out: WidgetSpec = { ...w };
  if (w.animate) out.animate = Object.fromEntries(Object.entries(w.animate).map(([p, a]) => [p, shiftAnimation(a, dt)]));
  if (w.visibility) out.visibility = shiftVisibility(w.visibility, dt);
  const c = compOf(w); if (c) out.properties = { ...c, start: r6(c.start + dt) };
  return out;
}

/**
 * Ngược của `shiftWidgetTime` khi sửa trong khung nhìn của một comp (Editor hiện mốc theo thời gian toàn bài): phần nào không đổi so với bản đã dời
 * của `orig` thì giữ đúng giá trị gốc (không trôi số do cộng trừ số thực), phần đã đổi thì dời ngược `dt`.
 */
export function unshiftWidgetTime(orig: WidgetSpec | undefined, edited: WidgetSpec, dt: number): WidgetSpec {
  if (!dt) return edited;
  if (!orig) return shiftWidgetTime(edited, -dt);
  const view = shiftWidgetTime(orig, dt);
  if (view === edited || same(view, edited)) return orig;
  const out: WidgetSpec = { ...edited };
  if (edited.animate) {
    out.animate = Object.fromEntries(Object.entries(edited.animate).map(([p, a]) => [p, view.animate && same(view.animate[p], a) && orig.animate ? orig.animate[p] : shiftAnimation(a, -dt)]));
  }
  if (edited.visibility) out.visibility = view.visibility && same(view.visibility, edited.visibility) && orig.visibility ? orig.visibility : shiftVisibility(edited.visibility, -dt);
  const c = compOf(edited);
  if (c) { const vc = compOf(view), oc = compOf(orig); out.properties = { ...c, start: vc && oc && vc.start === c.start ? oc.start : r6(c.start - dt) }; }
  return out;
}

// ───────────────────────────── đường dẫn comp (Editor) ─────────────────────────────
/** Đường dẫn tới một comp đang mở: danh sách id lớp COMP từ gốc vào trong. `[]` = timeline gốc. */
export type CompPath = readonly string[];
export interface CompFrame { layer: WidgetSpec; comp: string; spec: CompSpec; /** Giây toàn bài của giây 0 trong comp này. */ offset: number }

/** Đi theo đường dẫn: các cấp hợp lệ (dừng ở cấp đầu tiên sai: lớp không còn, không phải COMP, comp không có). */
export function resolveCompPath(scene: SceneDocument, path: CompPath): CompFrame[] {
  const out: CompFrame[] = [];
  let widgets = scene.widgets, offset = 0;
  for (const id of path) {
    const layer = widgets.find((w) => w.id === id), c = layer && compOf(layer), spec = c && scene.comps?.[c.comp];
    if (!layer || !c || !spec) break;
    offset = r6(offset + c.start);
    out.push({ layer, comp: c.comp, spec, offset });
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
  return { ...scene, widgets: f.spec.widgets.map((w) => shiftWidgetTime(w, f.offset)) };
}
/**
 * Ghi khung nhìn đã sửa (`edited`, cùng dạng `compView`) vào lại scene gốc `base`: widget của comp ở cuối `path` lấy từ `edited.widgets` (dời ngược
 * về thời gian của comp); các trường khác của scene (kể cả sổ comp, vd. vừa tạo comp con) lấy từ `edited`.
 */
export function setCompView(base: SceneDocument, path: CompPath, edited: SceneDocument): SceneDocument {
  const f = resolveCompPath(base, path).at(-1);
  if (!f) return edited;
  const prev = new Map(f.spec.widgets.map((w) => [w.id, w]));
  const widgets = edited.widgets.map((w) => unshiftWidgetTime(prev.get(w.id), w, f.offset));
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
  const walk = (ws: readonly WidgetSpec[], prefix: string, offset: number, parentLayer: string | null, stack: readonly string[]) => {
    const ids = new Set(ws.map((w) => w.id));
    for (const w0 of byZ(ws)) {
      if (out.length >= MAX_FLAT_WIDGETS) return;
      const id = prefix + w0.id;
      const w = shiftWidgetTime({ ...w0, id }, offset);
      if (prefix) {
        if (w0.parent && ids.has(w0.parent)) w.parent = prefix + w0.parent;
        else if (parentLayer) w.parent = parentLayer; else delete w.parent;
      }
      out.push(w);
      const c = compOf(w0), spec = c && scene.comps?.[c.comp];
      if (c && spec && !stack.includes(c.comp) && stack.length < MAX_COMP_DEPTH) walk(spec.widgets, id + COMP_SEP, r6(offset + c.start), id, [...stack, c.comp]);
    }
  };
  walk(scene.widgets, '', 0, null, []);
  const flat: SceneDocument = { ...scene, widgets: out.map((w, i) => (w.zIndex === i ? w : { ...w, zIndex: i })) };
  delete flat.comps;
  flatMemo.set(scene, flat);
  return flat;
}
