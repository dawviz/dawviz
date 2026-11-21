// Chuyển cảnh nốt bốn pha (T-18, CUSTOMIZATION §3.2) và morph cùng họ hình (T-19, AD-11).
// Mỗi nốt có bốn pha: `enter` (trước khi nốt bắt đầu một khoảng `lead`), `hit` (lúc chạm vạch phát), `sustain` (trong lúc kêu), `exit` (sau khi tắt).
// Hiệu ứng của mỗi pha là giá trị ở ĐIỂM CỰC của pha (đầu enter, đỉnh hit, cuối exit) nội suy về trạng thái trung tính bằng easing: một hàm thuần của (nốt, t),
// nên tua tới đâu cũng đúng và Preview = Export. Khoảng dời tính theo chiều cao nốt (không phụ thuộc độ phóng). Hướng cuộn trái/phải/lên/xuống: xoay widget (REQ-GRAPHICS-03).
import { parseEase, type EaseFn, type EaseSpec } from './motion.ts';

/** Trạng thái biến đổi của một nốt. Trung tính: dời 0, tỉ lệ 1, độ đục ×1, phát sáng +0. */
export interface NoteFx { dx: number; dy: number; sx: number; sy: number; alpha: number; glow: number }
export const NEUTRAL_FX: Readonly<NoteFx> = Object.freeze({ dx: 0, dy: 0, sx: 1, sy: 1, alpha: 1, glow: 0 });
export interface NoteTransitionSpec {
  /** Giây trước khi nốt bắt đầu mà pha `enter` chạy. */
  lead: number; enter: Partial<NoteFx>; enterEase: EaseSpec;
  /** Giây sau khi nốt bắt đầu mà pha `hit` chạy. */
  hitSec: number; hit: Partial<NoteFx>; hitEase: EaseSpec;
  /** Pha kêu: nốt "thở" theo nhịp, biên độ là phần của kích thước (0 = tắt). */
  breathe: number;
  /** Giây sau khi nốt tắt mà pha `exit` chạy. */
  exitSec: number; exit: Partial<NoteFx>; exitEase: EaseSpec;
  /** Morph (AD-11): nốt chờ là viên tròn (dài = cao, bo hết cỡ) rồi duỗi thành thanh khi bắt đầu; `exit` thu lại thành viên tròn. */
  morphEnter: boolean; morphExit: boolean;
}
const T = (o: Partial<NoteTransitionSpec>): NoteTransitionSpec => ({
  lead: 0, enter: {}, enterEase: 'easeOutCubic', hitSec: 0, hit: {}, hitEase: 'easeOutCubic', breathe: 0, exitSec: 0, exit: {}, exitEase: 'easeOutCubic', morphEnter: false, morphExit: false, ...o,
});
/** Template dựng sẵn. `none` = Piano Roll thường (nốt trôi ngang, không biến đổi). */
export const NOTE_TRANSITIONS: Readonly<Record<string, NoteTransitionSpec>> = Object.freeze({
  none: T({}),
  'pop-in': T({ lead: 0.25, enter: { sx: 0, sy: 0 }, enterEase: 'easeOutBack' }),
  'fade-scale': T({ lead: 0.3, enter: { alpha: 0, sx: 0.8, sy: 0.8 }, enterEase: 'easeOutQuad', exitSec: 0.4, exit: { alpha: 0.15, sx: 0.9, sy: 0.9 }, exitEase: 'easeOutQuad' }),
  'drop-bounce': T({ lead: 0.45, enter: { dy: -4, alpha: 0 }, enterEase: 'easeOutBounce', hitSec: 0.2, hit: { sy: 1.25 } }),
  'rise-up': T({ lead: 0.35, enter: { dy: 4, alpha: 0 }, enterEase: 'easeOutCubic' }),
  morph: T({ lead: 0.5, enterEase: 'easeOutQuad', exitSec: 0.35, exitEase: 'easeInQuad', morphEnter: true, morphExit: true }),
  shatter: T({ hitSec: 0.2, hit: { glow: 0.6 }, exitSec: 0.35, exit: { sx: 1.6, sy: 2.2, alpha: 0 }, exitEase: 'easeOutExpo' }),
  pulse: T({ hitSec: 0.25, hit: { sy: 1.6, glow: 0.5 }, hitEase: 'easeOutCubic', breathe: 0.08 }),
});
export const NOTE_TRANSITION_NAMES: readonly string[] = Object.freeze(Object.keys(NOTE_TRANSITIONS));

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const mix = (from: NoteFx, to: NoteFx, k: number): NoteFx => ({ dx: from.dx + (to.dx - from.dx) * k, dy: from.dy + (to.dy - from.dy) * k, sx: from.sx + (to.sx - from.sx) * k, sy: from.sy + (to.sy - from.sy) * k, alpha: from.alpha + (to.alpha - from.alpha) * k, glow: from.glow + (to.glow - from.glow) * k });
const full = (p: Partial<NoteFx>): NoteFx => ({ ...NEUTRAL_FX, ...p });
const easeMemo = new WeakMap<object, Record<string, EaseFn>>();
const easeOf = (spec: NoteTransitionSpec, key: 'enterEase' | 'hitEase' | 'exitEase'): EaseFn => {
  let m = easeMemo.get(spec); if (!m) easeMemo.set(spec, (m = {}));
  return (m[key] ??= parseEase(spec[key]).fn);
};

/** Biến đổi của một nốt tại `t` và mức morph (0 = viên tròn, 1 = thanh đầy đủ). `beatPhase`: 0..1 trong nhịp, cho pha kêu. */
export function noteFxAt(spec: NoteTransitionSpec, start: number, end: number, t: number, beatPhase = 0): { fx: NoteFx; morph: number } {
  let fx: NoteFx = { ...NEUTRAL_FX }, morph = 1;
  const enterF = easeOf(spec, 'enterEase');
  if (spec.lead > 0 && t < start) {
    const k = enterF(clamp01((t - (start - spec.lead)) / spec.lead));
    fx = mix(full(spec.enter), NEUTRAL_FX, k);
    if (spec.morphEnter) morph = k;
  }
  if (spec.hitSec > 0 && t >= start && t < start + spec.hitSec) {
    const h = mix(full(spec.hit), NEUTRAL_FX, easeOf(spec, 'hitEase')(clamp01((t - start) / spec.hitSec)));
    fx = { dx: fx.dx + h.dx, dy: fx.dy + h.dy, sx: fx.sx * h.sx, sy: fx.sy * h.sy, alpha: fx.alpha * h.alpha, glow: fx.glow + h.glow };
  }
  if (spec.breathe > 0 && t >= start && t < end) {
    const b = 1 + spec.breathe * Math.sin(2 * Math.PI * beatPhase);
    fx = { ...fx, sx: fx.sx, sy: fx.sy * b };
  }
  if (spec.exitSec > 0 && t >= end) {
    const k = easeOf(spec, 'exitEase')(clamp01((t - end) / spec.exitSec)), e = mix(NEUTRAL_FX, full(spec.exit), k);
    fx = { dx: fx.dx + e.dx, dy: fx.dy + e.dy, sx: fx.sx * e.sx, sy: fx.sy * e.sy, alpha: fx.alpha * e.alpha, glow: fx.glow + e.glow };
    if (spec.morphExit) morph = 1 - k;
  }
  return { fx, morph };
}

export interface BoxLike { x: number; y: number; w: number; h: number; radius: number; opacity: number; glow: number }
/** Áp biến đổi lên một hình chữ nhật nốt: morph độ dài (giữ mép trái) và bo góc, rồi co giãn quanh tâm, dời theo chiều cao. Trả bản mới (không sửa bản vào). */
export function applyNoteFx<B extends BoxLike>(r: B, fx: NoteFx, morph: number, restRadius = r.radius): B {
  const m = clamp01(morph);
  const w0 = r.h + (r.w - r.h) * m, radius = (r.h / 2) + (restRadius - r.h / 2) * m;
  const w = Math.max(0.5, w0 * fx.sx), h = Math.max(0.5, r.h * fx.sy), cx = r.x + w0 / 2, cy = r.y + r.h / 2;
  return { ...r, x: cx - w / 2 + fx.dx * r.h, y: cy - h / 2 + fx.dy * r.h, w, h, radius: Math.min(radius, h / 2, w / 2), opacity: r.opacity * Math.max(0, Math.min(1, fx.alpha)), glow: Math.min(1, Math.max(0, r.glow + fx.glow)) };
}

// ───────────── morph cùng họ (AD-11) ─────────────
/** Morph chữ nhật bo góc ↔ viên thuốc ↔ tròn: nội suy kích thước và bán kính bo. `k` 0..1. Bán kính tối đa luôn là nửa cạnh ngắn. */
export function morphRoundRect(a: { w: number; h: number; radius: number }, b: { w: number; h: number; radius: number }, k: number): { w: number; h: number; radius: number } {
  const w = a.w + (b.w - a.w) * k, h = a.h + (b.h - a.h) * k, r = a.radius + (b.radius - a.radius) * k;
  return { w, h, radius: Math.max(0, Math.min(r, Math.min(w, h) / 2)) };
}
export type Pt = readonly [number, number];
/** Lấy mẫu lại một đa giác kín về đúng `n` đỉnh, cách đều theo chu vi, bắt đầu từ đỉnh đầu: điều kiện để morph đa giác ↔ đa giác. */
export function resamplePolygon(poly: readonly Pt[], n: number): Pt[] {
  const m = Math.max(3, Math.min(512, Math.round(n)));
  if (poly.length < 2) return Array.from({ length: m }, () => (poly[0] ?? [0, 0]) as Pt);
  const pts = [...poly, poly[0]], seg: number[] = []; let total = 0;
  for (let i = 0; i < pts.length - 1; i++) { const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); seg.push(d); total += d; }
  if (total === 0) return Array.from({ length: m }, () => pts[0]);
  const out: Pt[] = []; let i = 0, acc = 0;
  for (let k = 0; k < m; k++) {
    const target = (k / m) * total;
    while (i < seg.length - 1 && acc + seg[i] < target) { acc += seg[i]; i++; }
    const u = seg[i] > 0 ? (target - acc) / seg[i] : 0;
    out.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u]);
  }
  return out;
}
/** Morph hai đa giác bất kỳ: cùng lấy mẫu về cùng số đỉnh (lớn hơn trong hai, tối thiểu 3) rồi nội suy từng đỉnh. */
export function morphPolygon(a: readonly Pt[], b: readonly Pt[], k: number): Pt[] {
  const n = Math.max(3, a.length, b.length), A = resamplePolygon(a, n), B = resamplePolygon(b, n);
  return A.map((p, i) => [p[0] + (B[i][0] - p[0]) * k, p[1] + (B[i][1] - p[1]) * k] as Pt);
}
