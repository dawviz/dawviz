// Hàng trượt khi đổi thứ tự (FLIP: First, Last, Invert, Play), phần thuần. Hook React ở lib/useFlip.ts.
// Đo vị trí dọc của từng hàng trước và sau khi đổi thứ tự; hàng nào dời chỗ thì dịch ngược về chỗ cũ (translateY) rồi trượt về 0.

/** Thời gian trượt (ms), như các chuyển động nhỏ khác của giao diện (mũi tên gấp/mở 150 ms). */
export const FLIP_MS = 150;
/** Đường cong trượt: nhanh lúc đầu, êm lúc cuối (ease-out). */
export const FLIP_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

/**
 * Độ dời cần bù cho từng hàng: vị trí cũ trừ vị trí mới (px). Bỏ hàng mới xuất hiện (không có vị trí cũ),
 * hàng đã mất và hàng gần như đứng yên (|độ dời| < 0,5 px).
 */
export function flipDeltas(before: ReadonlyMap<string, number>, after: ReadonlyMap<string, number>): Map<string, number> {
  const out = new Map<string, number>();
  for (const [id, y] of after) {
    const y0 = before.get(id);
    if (y0 === undefined) continue;
    const d = y0 - y;
    if (Math.abs(d) >= 0.5) out.set(id, d);
  }
  return out;
}

/** Khung hình của hoạt hình trượt một hàng: từ chỗ cũ (dịch `dy` px) về chỗ mới. */
export const flipFrames = (dy: number): Keyframe[] => [{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }];
