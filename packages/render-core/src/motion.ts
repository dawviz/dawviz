// Easing và nội suy tất định (T-15/T-17, AD-09, CUSTOMIZATION §4). Mọi easing là hàm thuần `f: [0,1] → ℝ` với f(0) = 0 và f(1) = 1
// (back, elastic, bounce và spring được phép vượt biên ở giữa). Không Date, không Math.random: cùng đầu vào luôn cùng đầu ra.
export type EaseFn = (t: number) => number;

const PI = Math.PI;
const c1 = 1.70158, c2 = c1 * 1.525, c3 = c1 + 1, c4 = (2 * PI) / 3, c5 = (2 * PI) / 4.5;
const bounceOut = (x: number): number => {
  const n1 = 7.5625, d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
};
const edge = (f: EaseFn): EaseFn => (x) => (x <= 0 ? 0 : x >= 1 ? 1 : f(x)); // đúng 0 và 1 ở hai đầu, không sai số phép tính
const poly = (p: number): [EaseFn, EaseFn, EaseFn] => [
  (x) => x ** p, (x) => 1 - (1 - x) ** p, (x) => (x < 0.5 ? 2 ** (p - 1) * x ** p : 1 - (-2 * x + 2) ** p / 2),
];
const [inQuad, outQuad, inOutQuad] = poly(2), [inCubic, outCubic, inOutCubic] = poly(3), [inQuart, outQuart, inOutQuart] = poly(4), [inQuint, outQuint, inOutQuint] = poly(5);

/** 30 hàm Penner + `linear` + hai hàm elastic của osu!. Tên theo easings.net. */
export const EASINGS: Readonly<Record<string, EaseFn>> = Object.freeze(Object.fromEntries(Object.entries({
  linear: (x: number) => x,
  easeInSine: (x: number) => 1 - Math.cos((x * PI) / 2), easeOutSine: (x: number) => Math.sin((x * PI) / 2), easeInOutSine: (x: number) => -(Math.cos(PI * x) - 1) / 2,
  easeInQuad: inQuad, easeOutQuad: outQuad, easeInOutQuad: inOutQuad,
  easeInCubic: inCubic, easeOutCubic: outCubic, easeInOutCubic: inOutCubic,
  easeInQuart: inQuart, easeOutQuart: outQuart, easeInOutQuart: inOutQuart,
  easeInQuint: inQuint, easeOutQuint: outQuint, easeInOutQuint: inOutQuint,
  easeInExpo: (x: number) => 2 ** (10 * x - 10), easeOutExpo: (x: number) => 1 - 2 ** (-10 * x),
  easeInOutExpo: (x: number) => (x < 0.5 ? 2 ** (20 * x - 10) / 2 : (2 - 2 ** (-20 * x + 10)) / 2),
  easeInCirc: (x: number) => 1 - Math.sqrt(1 - x * x), easeOutCirc: (x: number) => Math.sqrt(1 - (x - 1) ** 2),
  easeInOutCirc: (x: number) => (x < 0.5 ? (1 - Math.sqrt(1 - (2 * x) ** 2)) / 2 : (Math.sqrt(1 - (-2 * x + 2) ** 2) + 1) / 2),
  easeInBack: (x: number) => c3 * x * x * x - c1 * x * x, easeOutBack: (x: number) => 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2,
  easeInOutBack: (x: number) => (x < 0.5 ? ((2 * x) ** 2 * ((c2 + 1) * 2 * x - c2)) / 2 : ((2 * x - 2) ** 2 * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2),
  easeInElastic: (x: number) => -(2 ** (10 * x - 10)) * Math.sin((x * 10 - 10.75) * c4),
  easeOutElastic: (x: number) => 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1,
  easeInOutElastic: (x: number) => (x < 0.5 ? -(2 ** (20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2 : (2 ** (-20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1),
  easeInBounce: (x: number) => 1 - bounceOut(1 - x), easeOutBounce: bounceOut,
  easeInOutBounce: (x: number) => (x < 0.5 ? (1 - bounceOut(1 - 2 * x)) / 2 : (1 + bounceOut(2 * x - 1)) / 2),
  // osu!: elastic ngắn (nửa và một phần tư số dao động)
  easeOutElasticHalf: (x: number) => 2 ** (-10 * x) * Math.sin(((0.5 * x - 0.075) * (2 * PI)) / 0.3) + 1,
  easeOutElasticQuarter: (x: number) => 2 ** (-10 * x) * Math.sin(((0.25 * x - 0.075) * (2 * PI)) / 0.3) + 1,
}).map(([k, f]) => [k, edge(f as EaseFn)])));
export const EASING_NAMES: readonly string[] = Object.freeze(Object.keys(EASINGS));

/** `hold`: giữ giá trị đầu cho đến hết đoạn rồi nhảy (đoạn bậc thang). */
export const hold: EaseFn = (x) => (x >= 1 ? 1 : 0);
/** `steps(n, 'end')`: n bậc, nhảy ở cuối mỗi bậc; `'start'`: nhảy ở đầu. */
export function steps(n: number, at: 'start' | 'end' = 'end'): EaseFn {
  const k = Math.max(1, Math.min(1000, Math.round(n)));
  return (x) => (x <= 0 ? 0 : x >= 1 ? 1 : at === 'start' ? Math.min(1, Math.ceil(x * k) / k) : Math.floor(x * k) / k);
}

/** CSS cubic-bezier. Giải x(s) = t bằng 8 vòng Newton, không hội tụ thì chia đôi đúng 40 vòng: số vòng cố định nên kết quả tất định. x1, x2 kẹp về [0, 1]. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): EaseFn {
  const ax = Math.min(1, Math.max(0, x1)), bx = Math.min(1, Math.max(0, x2));
  const cx = 3 * ax, bb = 3 * (bx - ax) - cx, aa = 1 - cx - bb, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (s: number) => ((aa * s + bb) * s + cx) * s, Y = (s: number) => ((ay * s + by) * s + cy) * s, dX = (s: number) => (3 * aa * s + 2 * bb) * s + cx;
  return edge((t) => {
    let s = t;
    for (let i = 0; i < 8; i++) { const e = X(s) - t, d = dX(s); if (Math.abs(e) < 1e-7) return Y(s); if (Math.abs(d) < 1e-6) break; s -= e / d; }
    let lo = 0, hi = 1; s = t;
    for (let i = 0; i < 40; i++) { const e = X(s); if (e < t) lo = s; else hi = s; s = (lo + hi) / 2; }
    return Y(s);
  });
}

export interface SpringSpec { stiffness: number; damping: number; mass: number }
export const DEFAULT_SPRING: Readonly<SpringSpec> = Object.freeze({ stiffness: 100, damping: 10, mass: 1 });
/** Lò xo dạng công thức đóng (dưới tắt, tắt tới hạn, quá tắt), co giãn thời gian để đạt 1% quanh đích rồi trừ nốt phần dư tuyến tính: f(1) = 1 đúng. */
export function spring(spec: Partial<SpringSpec> = {}): EaseFn {
  const k = Math.max(1, spec.stiffness ?? DEFAULT_SPRING.stiffness), c = Math.max(0, spec.damping ?? DEFAULT_SPRING.damping), m = Math.max(0.01, spec.mass ?? DEFAULT_SPRING.mass);
  const w0 = Math.sqrt(k / m), z = c / (2 * Math.sqrt(k * m));
  const x = (s: number): number => {
    if (z < 1 - 1e-9) { const wd = w0 * Math.sqrt(1 - z * z); return 1 - Math.exp(-z * w0 * s) * (Math.cos(wd * s) + ((z * w0) / wd) * Math.sin(wd * s)); }
    if (z <= 1 + 1e-9) return 1 - Math.exp(-w0 * s) * (1 + w0 * s);
    const r = w0 * Math.sqrt(z * z - 1), s1 = -z * w0 + r, s2 = -z * w0 - r;
    return 1 - (s2 * Math.exp(s1 * s) - s1 * Math.exp(s2 * s)) / (s2 - s1);
  };
  const decay = z < 1 ? z * w0 : z === 1 ? w0 : w0 * (z - Math.sqrt(z * z - 1)), T = Math.min(30, 6.9 / Math.max(decay, 1e-3)), resid = 1 - x(T);
  return edge((u) => x(u * T) + resid * u);
}

/** Đường cong tự vẽ: các điểm (x, y) với x tăng dần trong [0, 1]; nội suy Hermite đơn điệu (Fritsch–Carlson) nên không vọt quá giữa hai điểm cùng chiều. Thiếu điểm đầu/cuối thì thêm (0,0) và (1,1). */
export function curve(points: readonly (readonly [number, number])[]): EaseFn {
  const p = points.filter((q) => Number.isFinite(q[0]) && Number.isFinite(q[1])).map((q) => [Math.min(1, Math.max(0, q[0])), q[1]] as [number, number]).sort((a, b) => a[0] - b[0]);
  if (!p.length || p[0][0] > 0) p.unshift([0, 0]);
  if (p[p.length - 1][0] < 1) p.push([1, 1]);
  const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]), n = xs.length, d = new Array<number>(n).fill(0), sl: number[] = [];
  for (let i = 0; i < n - 1; i++) sl.push((ys[i + 1] - ys[i]) / Math.max(1e-9, xs[i + 1] - xs[i]));
  d[0] = sl[0]; d[n - 1] = sl[n - 2];
  for (let i = 1; i < n - 1; i++) d[i] = sl[i - 1] * sl[i] <= 0 ? 0 : (sl[i - 1] + sl[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (sl[i] === 0) { d[i] = 0; d[i + 1] = 0; continue; }
    const a = d[i] / sl[i], b = d[i + 1] / sl[i], h = a * a + b * b;
    if (h > 9) { const tau = 3 / Math.sqrt(h); d[i] = tau * a * sl[i]; d[i + 1] = tau * b * sl[i]; }
  }
  return (t) => {
    if (t <= xs[0]) return ys[0]; if (t >= xs[n - 1]) return ys[n - 1];
    let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (xs[m] <= t) lo = m; else hi = m; }
    const h = xs[hi] - xs[lo], s = (t - xs[lo]) / h, s2 = s * s, s3 = s2 * s;
    return (2 * s3 - 3 * s2 + 1) * ys[lo] + (s3 - 2 * s2 + s) * h * d[lo] + (-2 * s3 + 3 * s2) * ys[hi] + (s3 - s2) * h * d[hi];
  };
}

/** Easing trong dữ liệu: tên, hoặc đối tượng một khoá. */
export type EaseSpec =
  | string
  | { cubicBezier: [number, number, number, number] }
  | { steps: [number, 'start' | 'end'] | number }
  | { spring: Partial<SpringSpec> }
  | { curve: [number, number][] };
const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v);
/** Đọc một easing từ dữ liệu. Sai thì trả `linear` và `ok: false` (để nơi gọi cảnh báo, không bao giờ ném). */
export function parseEase(spec: unknown): { fn: EaseFn; ok: boolean } {
  const bad = { fn: EASINGS.linear, ok: false };
  if (spec === undefined || spec === null) return { fn: EASINGS.linear, ok: true };
  if (typeof spec === 'string') return spec === 'hold' ? { fn: hold, ok: true } : EASINGS[spec] ? { fn: EASINGS[spec], ok: true } : bad;
  if (typeof spec !== 'object') return bad;
  const o = spec as Record<string, unknown>;
  if (Array.isArray(o.cubicBezier) && o.cubicBezier.length === 4 && o.cubicBezier.every(num)) { const [a, b, c, d] = o.cubicBezier as number[]; return { fn: cubicBezier(a, b, c, d), ok: true }; }
  if (o.steps !== undefined) {
    if (num(o.steps)) return { fn: steps(o.steps as number), ok: true };
    if (Array.isArray(o.steps) && num(o.steps[0])) return { fn: steps(o.steps[0] as number, o.steps[1] === 'start' ? 'start' : 'end'), ok: true };
  }
  if (o.spring && typeof o.spring === 'object') { const s = o.spring as Record<string, unknown>; return { fn: spring({ stiffness: num(s.stiffness) ? (s.stiffness as number) : undefined, damping: num(s.damping) ? (s.damping as number) : undefined, mass: num(s.mass) ? (s.mass as number) : undefined }), ok: true }; }
  if (Array.isArray(o.curve) && o.curve.length <= 64 && o.curve.every((q) => Array.isArray(q) && q.length === 2 && num(q[0]) && num(q[1]))) return { fn: curve(o.curve as [number, number][]), ok: true };
  return bad;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export interface InterpolateOptions { ease?: EaseSpec | EaseFn; extrapolateLeft?: 'clamp' | 'extend'; extrapolateRight?: 'clamp' | 'extend' }
/** Kiểu Remotion: ánh xạ `x` từ các mốc `input` (tăng dần) sang `output`, easing áp lên từng đoạn. Mặc định kẹp ngoài biên. */
export function interpolate(x: number, input: readonly number[], output: readonly number[], opt: InterpolateOptions = {}): number {
  const n = Math.min(input.length, output.length);
  if (n === 0 || !Number.isFinite(x)) return 0;
  if (n === 1) return output[0];
  const ease = typeof opt.ease === 'function' ? opt.ease : parseEase(opt.ease).fn;
  if (x <= input[0]) return opt.extrapolateLeft === 'extend' ? output[0] + (x - input[0]) * ((output[1] - output[0]) / Math.max(1e-12, input[1] - input[0])) : output[0];
  if (x >= input[n - 1]) return opt.extrapolateRight === 'extend' ? output[n - 1] + (x - input[n - 1]) * ((output[n - 1] - output[n - 2]) / Math.max(1e-12, input[n - 1] - input[n - 2])) : output[n - 1];
  let i = 0; while (i < n - 2 && x >= input[i + 1]) i++;
  const span = input[i + 1] - input[i];
  return lerp(output[i], output[i + 1], ease(span > 0 ? (x - input[i]) / span : 1));
}
