// Khung nhìn của một precomp cho Editor (D-69, T-112). Editor luôn làm việc trên một Doc "như scene gốc": ở timeline gốc là chính Doc; khi mở một
// precomp, `viewDoc` trả Doc có `scene.widgets` = widget của comp đó (mốc thời gian đã dời sang thời gian toàn bài, render-core `compView`) và mốc ↺
// (`layoutRef`/`propsRef`) của comp đó với khoá không tiền tố. Mọi lệnh sẵn có (lib/commands.ts) chạy nguyên vẹn trên khung nhìn; `liftCmd` bọc lệnh
// để redo/undo đọc khung nhìn từ Doc thật rồi ghi lại (`setCompView`). Hàm thuần.
//
// Khoá mốc ↺ trong Doc thật: widget ở gốc dùng id; widget trong comp dùng `<id comp>/<id widget>` (COMP_SEP). Trong khung nhìn của comp X, khoá của X
// không tiền tố; khoá của comp khác giữ nguyên dạng có tiền tố (lệnh gom precomp ghi khoá cho comp mới theo dạng này); khoá gốc bị ẩn.
import { COMP_SEP, MAX_COMP_DEPTH, compOf, compTimeMap, compView, resolveCompPath, setCompView, type CompPath, type SceneDocument, type WidgetSpec } from '@dawviz/render-core';
import type { Cmd, Doc } from './commands.ts';

type Refs<V> = Record<string, V>;
/** Khoá mốc ↺ đầy đủ của widget `id` trong comp `comp` (null = gốc). */
export const refKey = (comp: string | null, id: string): string => (comp ? `${comp}${COMP_SEP}${id}` : id);

function viewRefs<V>(refs: Refs<V>, comp: string): Refs<V> {
  const pre = comp + COMP_SEP, out: Refs<V> = {};
  for (const [k, v] of Object.entries(refs)) {
    if (k.startsWith(pre)) out[k.slice(pre.length)] = v;
    else if (k.includes(COMP_SEP)) out[k] = v;
  }
  return out;
}
function backRefs<V>(base: Refs<V>, view: Refs<V>, comp: string): Refs<V> {
  const pre = comp + COMP_SEP, out: Refs<V> = {};
  for (const [k, v] of Object.entries(base)) if (!k.includes(COMP_SEP)) out[k] = v; // gốc: không đụng tới
  for (const [k, v] of Object.entries(view)) out[k.includes(COMP_SEP) ? k : pre + k] = v;
  return out;
}

/** Comp đang mở ở cuối đường dẫn (null = gốc hoặc đường dẫn không còn hợp lệ). */
export const compAt = (d: Doc, path: CompPath): string | null => resolveCompPath(d.scene, path).at(-1)?.comp ?? null;

/** Doc như Editor thấy khi mở `path`. `path = []` → chính `d`. */
export function viewDoc(d: Doc, path: CompPath): Doc {
  const comp = compAt(d, path);
  if (!comp) return d;
  return { ...d, scene: compView(d.scene, path), layoutRef: viewRefs(d.layoutRef, comp), propsRef: viewRefs(d.propsRef, comp) };
}
/** Ghi khung nhìn đã sửa về Doc thật. */
export function putView(d: Doc, path: CompPath, v: Doc): Doc {
  const comp = compAt(d, path);
  if (!comp) return v;
  return { ...v, scene: setCompView(d.scene, path, v.scene), layoutRef: backRefs(d.layoutRef, v.layoutRef, comp), propsRef: backRefs(d.propsRef, v.propsRef, comp) };
}

/**
 * Lệnh dựng trên khung nhìn của `path` → lệnh trên Doc thật. Khoá gộp mang theo đường dẫn (kéo cùng ô ở hai comp khác nhau không gộp nhầm),
 * tham số nhãn lịch sử thêm `comp` (tên hiển thị do lớp nhãn tự tra).
 */
export function liftCmd(cmd: Cmd | null, path: CompPath): Cmd | null {
  if (!cmd || !path.length) return cmd;
  const at = [...path];
  return {
    ...cmd,
    mergeKey: cmd.mergeKey && `${at.join(COMP_SEP)}|${cmd.mergeKey}`,
    params: { ...(cmd.params ?? {}), compPath: at.join(COMP_SEP) },
    redo: (x) => putView(x, at, cmd.redo(viewDoc(x, at))),
    undo: (x) => putView(x, at, cmd.undo(viewDoc(x, at))),
  };
}

/**
 * Đường dẫn tới Piano Roll mà thẻ Xem trước chỉnh nhanh (D-69): Piano Roll ở gốc thì `[]`; không có thì precomp trên cùng đang hiện ở `t` (đi sâu
 * tối đa MAX_COMP_DEPTH cấp) có Piano Roll. Không tìm thấy → `[]` (inspector báo không có Piano Roll như trước).
 */
export function pianoPathAt(scene: SceneDocument, t: number): string[] {
  const has = (ws: readonly WidgetSpec[]) => ws.some((w) => w.type === 'PIANO_ROLL');
  if (has(scene.widgets)) return [];
  const on = (w: WidgetSpec, at: number) => w.visible && (!w.visibility || w.visibility.ranges.some((r) => at >= r.from && (r.to === null || at < r.to)));
  const walk = (ws: readonly WidgetSpec[], at: number, depth: number, seen: readonly string[]): string[] | null => {
    if (depth > MAX_COMP_DEPTH) return null;
    const layers = ws.map((w, i) => ({ w, i })).filter(({ w }) => compOf(w) && on(w, at)).sort((a, b) => b.w.zIndex - a.w.zIndex || b.i - a.i);
    for (const { w } of layers) {
      const c = compOf(w)!, spec = scene.comps?.[c.comp]; if (!spec || seen.includes(c.comp)) continue;
      const m = compTimeMap(c), inner = (at - m.b) / m.a;
      if (has(spec.widgets)) return [w.id];
      const deeper = walk(spec.widgets, inner, depth + 1, [...seen, c.comp]);
      if (deeper) return [w.id, ...deeper];
    }
    return null;
  };
  return walk(scene.widgets, t, 1, []) ?? [];
}
