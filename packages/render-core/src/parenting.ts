// Parenting (ANIMATION-CATALOG §6, v1.0): `WidgetSpec.parent` = id widget cha. Mỗi khung, con nhận thêm phần THAY ĐỔI của cha so với tư thế tĩnh
// (bố cục trong tài liệu, không motion, tỉ lệ 1): dời, xoay và tỉ lệ quanh điểm neo của cha, nhân độ đục. Nhờ vậy gán cha không làm con nhảy chỗ,
// toạ độ của con vẫn là toạ độ trên khung, và preset không có `parent` vẽ y như trước. Cha của cha cộng dồn.
// Thuần và tất định: ma trận affine 2D từ (bố cục, góc, tỉ lệ, motion) của khung hiện tại.
import type { WidgetLayout } from './scene.ts';
import type { WidgetFx } from './widgetMotion.ts';

/** Sâu tối đa của chuỗi cha (chặn dữ liệu bệnh lý). */
export const MAX_PARENT_DEPTH = 16;
export type ParentProblem = { id: string; parent: string; reason: 'missing' | 'cycle' | 'depth' };

/**
 * Cha hợp lệ của từng widget (id → id cha), xét theo thứ tự trong tài liệu: bỏ cha không tồn tại, cạnh tạo vòng lặp (kể cả tự làm cha mình)
 * và chuỗi sâu hơn MAX_PARENT_DEPTH. Trả kèm danh sách vấn đề để bộ đọc preset cảnh báo.
 */
export function resolveParents(widgets: readonly { id: string; parent?: string }[]): { parents: Map<string, string>; problems: ParentProblem[] } {
  const ids = new Set(widgets.map((w) => w.id)), parents = new Map<string, string>(), problems: ParentProblem[] = [];
  const depthOf = (id: string) => { let d = 0; for (let c = parents.get(id); c !== undefined && d <= MAX_PARENT_DEPTH; c = parents.get(c)) d++; return d; };
  for (const w of widgets) {
    const p = w.parent; if (p === undefined) continue;
    if (!ids.has(p)) { problems.push({ id: w.id, parent: p, reason: 'missing' }); continue; }
    let cyc = p === w.id;
    for (let c: string | undefined = p, n = 0; !cyc && c !== undefined && n <= MAX_PARENT_DEPTH + 1; c = parents.get(c), n++) if (c === w.id) cyc = true;
    if (cyc) { problems.push({ id: w.id, parent: p, reason: 'cycle' }); continue; }
    // độ sâu mới: chuỗi phía trên cha + 1 + chuỗi con đã treo dưới w
    let below = 0; for (const [c] of parents) { let d = 0, x: string | undefined = c; while (x !== undefined && x !== w.id && d <= MAX_PARENT_DEPTH) { x = parents.get(x); d++; } if (x === w.id) below = Math.max(below, d); }
    if (depthOf(p) + 1 + below > MAX_PARENT_DEPTH) { problems.push({ id: w.id, parent: p, reason: 'depth' }); continue; }
    parents.set(w.id, p);
  }
  return { parents, problems };
}

/** Ma trận affine 2D [a, b, c, d, e, f]: x' = a·x + c·y + e, y' = b·x + d·y + f (như CanvasRenderingContext2D.transform). */
export type Mat = readonly [number, number, number, number, number, number];
export const IDENTITY: Mat = [1, 0, 0, 1, 0, 0];
export const mul = (m: Mat, n: Mat): Mat => [
  m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5],
];
export function invert(m: Mat): Mat {
  const det = m[0] * m[3] - m[1] * m[2];
  if (Math.abs(det) < 1e-12) return IDENTITY; // tỉ lệ 0: không có nghịch đảo; coi như không đổi
  const a = m[3] / det, b = -m[1] / det, c = -m[2] / det, d = m[0] / det;
  return [a, b, c, d, -(a * m[4] + c * m[5]), -(b * m[4] + d * m[5])];
}
export const apply = (m: Mat, x: number, y: number): [number, number] => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

/**
 * Toạ độ trong widget (góc trái trên = 0,0) → toạ độ khung, đúng chuỗi phép của renderFrame: dời tới điểm neo (cộng dời của motion theo bề rộng/cao),
 * xoay (độ, chiều kim đồng hồ), co giãn, dời ngược.
 */
export function widgetMatrix(L: WidgetLayout, rotDeg: number, fx?: Pick<WidgetFx, 'dx' | 'dy' | 'sx' | 'sy'>): Mat {
  const ax = (L.anchor?.x ?? 0.5) * L.width, ay = (L.anchor?.y ?? 0.5) * L.height, r = (rotDeg * Math.PI) / 180, cs = Math.cos(r), sn = Math.sin(r);
  const sx = fx?.sx ?? 1, sy = fx?.sy ?? 1, tx = L.x + ax + (fx?.dx ?? 0) * L.width, ty = L.y + ay + (fx?.dy ?? 0) * L.height;
  // T(tx,ty) · R · S · T(−ax,−ay)
  return [cs * sx, sn * sx, -sn * sy, cs * sy, tx - (cs * sx * ax - sn * sy * ay), ty - (sn * sx * ax + cs * sy * ay)];
}
/** Phần thay đổi của một widget so với tư thế tĩnh: hiện tại · tĩnh⁻¹ (toạ độ khung → toạ độ khung). */
export const deltaMatrix = (current: Mat, rest: Mat): Mat => mul(current, invert(rest));
