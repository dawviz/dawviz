// Mã màu HEX dùng chung của Render Core (T-49, REQ-UI-11). Màu lưu `#rrggbb` hoặc `#rrggbbaa` (alpha); canvas nhận thẳng cả hai dạng,
// nên chỉ chỗ tự tách kênh màu (trộn, làm sáng/tối, chuỗi rgba()) mới cần các hàm ở đây. Preset cũ (`#rrggbb`) không đổi hình.
// Hàm thuần, tất định.

/** `#rrggbb` hoặc `#rrggbbaa` (không phân biệt hoa thường). */
export const HEX_COLOR = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;
/** Chỉ `#rrggbb` (màu không alpha, vd. nền khung hình). */
export const HEX_OPAQUE = /^#[0-9a-f]{6}$/i;
export const isHexColor = (c: unknown): c is string => typeof c === 'string' && HEX_COLOR.test(c);

/** `#rrggbb` / `#rrggbbaa` (có hoặc không `#`) → [r, g, b, a] với r, g, b 0..255, a 0..1. Sai định dạng → null. */
export function parseHexRgba(c: string): [number, number, number, number] | null {
  const m = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(c.trim()); if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, m[2] ? parseInt(m[2], 16) / 255 : 1];
}
/** Alpha của mã màu (0..1); mã không có alpha hoặc sai định dạng → 1. */
export const hexAlpha = (c: string): number => parseHexRgba(c)?.[3] ?? 1;
const h2 = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0');
/** Đuôi alpha của mã (`''` khi đục hẳn) để giữ alpha khi tính lại phần RGB. */
export const alphaSuffix = (a: number): string => (a >= 1 ? '' : h2(a * 255));
/** Chuỗi `rgba(…)` cho canvas, alpha = alpha của mã × `mul` (kẹp 0..1). Mã sai → trắng. */
export function rgbaOf(c: string, mul = 1): string {
  const [r, g, b, a] = parseHexRgba(c) ?? [255, 255, 255, 1];
  return `rgba(${r},${g},${b},${Math.min(1, Math.max(0, a * mul))})`;
}
/** Trộn tuyến tính trong sRGB (kể cả alpha) giữa hai mã; kết quả có alpha chỉ khi một trong hai có alpha. */
export function mixHexRgb(a: string, b: string, k: number): string {
  const x = parseHexRgba(a) ?? [255, 255, 255, 1], y = parseHexRgba(b) ?? [255, 255, 255, 1];
  const l = (i: number) => x[i] + (y[i] - x[i]) * k;
  const al = x[3] + (y[3] - x[3]) * k;
  return `#${h2(l(0))}${h2(l(1))}${h2(l(2))}${x[3] < 1 || y[3] < 1 ? h2(al * 255) : ''}`;
}
