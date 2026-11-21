// Logic thuần của đồ thị đường cong trong Animation Inspector (DESIGN.md "Animation Inspector"): cubic-bezier tương đương của các
// easing có tên (theo easings.net), kẹp tay nắm, lấy mẫu đường cong thật để vẽ, miền trục y. Không DOM; test ở easeCurve.test.ts.
import { parseEase, type EaseSpec } from '@dawviz/render-core';

export type Bezier = [number, number, number, number];
export const LINEAR: Bezier = [0, 0, 1, 1];
/** Điểm xuất phát khi người dùng bắt đầu kéo tay nắm từ một đường cong không có bezier tương đương (elastic, bounce, giữ…). */
export const DEFAULT_BEZIER: Bezier = [0.25, 0.1, 0.25, 1];
/** Cubic-bezier tương đương (gần đúng) của các easing Penner có thể biểu diễn bằng một bezier (easings.net). */
export const EASE_BEZIER: Readonly<Record<string, Bezier>> = {
  linear: LINEAR,
  easeInSine: [0.12, 0, 0.39, 0], easeOutSine: [0.61, 1, 0.88, 1], easeInOutSine: [0.37, 0, 0.63, 1],
  easeInQuad: [0.11, 0, 0.5, 0], easeOutQuad: [0.5, 1, 0.89, 1], easeInOutQuad: [0.45, 0, 0.55, 1],
  easeInCubic: [0.32, 0, 0.67, 0], easeOutCubic: [0.33, 1, 0.68, 1], easeInOutCubic: [0.65, 0, 0.35, 1],
  easeInQuart: [0.5, 0, 0.75, 0], easeOutQuart: [0.25, 1, 0.5, 1], easeInOutQuart: [0.76, 0, 0.24, 1],
  easeInQuint: [0.64, 0, 0.78, 0], easeOutQuint: [0.22, 1, 0.36, 1], easeInOutQuint: [0.83, 0, 0.17, 1],
  easeInExpo: [0.7, 0, 0.84, 0], easeOutExpo: [0.16, 1, 0.3, 1], easeInOutExpo: [0.87, 0, 0.13, 1],
  easeInCirc: [0.55, 0, 1, 0.45], easeOutCirc: [0, 0.55, 0.45, 1], easeInOutCirc: [0.85, 0, 0.15, 1],
  easeInBack: [0.36, 0, 0.66, -0.56], easeOutBack: [0.34, 1.56, 0.64, 1], easeInOutBack: [0.68, -0.6, 0.32, 1.6],
};
/** Giới hạn tay nắm: x trong [0, 1] (bắt buộc để đường cong là hàm của thời gian), y trong [-1, 2] (cho phép vượt đà). */
export const Y_RANGE: readonly [number, number] = [-1, 2];

const r3 = (x: number) => Math.round(x * 1000) / 1000;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const clampBezier = (b: readonly number[]): Bezier => [r3(clamp(b[0], 0, 1)), r3(clamp(b[1], Y_RANGE[0], Y_RANGE[1])), r3(clamp(b[2], 0, 1)), r3(clamp(b[3], Y_RANGE[0], Y_RANGE[1]))];

/** Bezier của một easing: chưa đặt = đều; tên có trong bảng; `{cubicBezier}`. Không biểu diễn được (elastic, bounce, giữ, steps…) → null. */
export function bezierOf(ease: EaseSpec | undefined): Bezier | null {
  if (ease === undefined) return LINEAR;
  if (typeof ease === 'string') return EASE_BEZIER[ease] ?? null;
  if (ease && typeof ease === 'object' && 'cubicBezier' in ease && Array.isArray(ease.cubicBezier) && ease.cubicBezier.length === 4) return clampBezier(ease.cubicBezier);
  return null;
}
/** Tên để hiện trong ô chọn: tên easing, `hold`, hoặc `custom` (bezier riêng và mọi dạng đối tượng khác). */
export const easeName = (ease: EaseSpec | undefined): string => (ease === undefined ? 'linear' : typeof ease === 'string' ? ease : 'custom');
/** Hai easing giống nhau (so sánh theo nội dung). */
export const sameEase = (a: EaseSpec | undefined, b: EaseSpec | undefined): boolean => JSON.stringify(a ?? 'linear') === JSON.stringify(b ?? 'linear');

/** Lấy mẫu đường cong thật (đúng hàm Render Core dùng), n + 1 điểm [x, y] trên [0, 1]. */
export function easeSamples(ease: EaseSpec | undefined, n = 64): [number, number][] {
  const f = parseEase(ease).fn;
  return Array.from({ length: n + 1 }, (_, i) => { const x = i / n; return [x, f(x)] as [number, number]; });
}
/** Miền trục y của đồ thị: luôn chứa [0, 1], nới theo đường cong và tay nắm, thêm lề 8%. */
export function graphRange(samples: readonly [number, number][], bez: Bezier | null): [number, number] {
  let lo = 0, hi = 1;
  for (const [, y] of samples) { if (y < lo) lo = y; if (y > hi) hi = y; }
  if (bez) { lo = Math.min(lo, bez[1], bez[3]); hi = Math.max(hi, bez[1], bez[3]); }
  const pad = (hi - lo) * 0.08;
  return [lo - pad, hi + pad];
}
/** Giá trị chung của nhiều phần tử: giống nhau hết → giá trị đó; khác nhau → 'mixed'; rỗng → undefined. */
export function common<T>(xs: readonly T[], eq: (a: T, b: T) => boolean = (a, b) => a === b): T | 'mixed' | undefined {
  if (!xs.length) return undefined;
  return xs.every((x) => eq(x, xs[0])) ? xs[0] : 'mixed';
}
