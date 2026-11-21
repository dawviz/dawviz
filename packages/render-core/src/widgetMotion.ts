// Chuyển động cấp widget (T-34 phần v1.0, CUSTOMIZATION §3): MỌI loại widget có thể có hiệu ứng vào, hiệu ứng ra và một chuyển động lặp theo nhịp.
// Lớp này bọc ngoài widget trong layoutFrame/renderFrame nên không phụ thuộc loại widget (Piano Roll, chữ, phổ, hạt, bản nhạc, widget phân tích…).
// Thuần và tất định: biến đổi là hàm của (motion, khoảng hiển thị, t, tempo). Không có `motion` thì chuỗi lệnh vẽ giữ NGUYÊN như trước.
// Dời tính theo phần của rộng/cao widget; tỉ lệ và xoay quanh điểm neo của widget (REQ-GRAPHICS-03).
import { secToTick } from '@dawviz/parser-core';
import { parseEase, type EaseFn, type EaseSpec } from './motion.ts';
import type { TempoPoint } from './types.ts';
import type { WidgetVisibility } from './visibility.ts';

export interface WidgetFx { dx: number; dy: number; sx: number; sy: number; rot: number; alpha: number }
export const NEUTRAL_WFX: Readonly<WidgetFx> = Object.freeze({ dx: 0, dy: 0, sx: 1, sy: 1, rot: 0, alpha: 1 });

/** Hiệu ứng vào/ra: giá trị ở ĐIỂM ẨN (đầu hiệu ứng vào, cuối hiệu ứng ra), nội suy về trung tính. */
export const WIDGET_EFFECTS: Readonly<Record<string, Partial<WidgetFx>>> = Object.freeze({
  fade: { alpha: 0 },
  'slide-from-left': { dx: -0.6, alpha: 0 }, 'slide-from-right': { dx: 0.6, alpha: 0 }, 'slide-from-top': { dy: -0.6, alpha: 0 }, 'slide-from-bottom': { dy: 0.6, alpha: 0 },
  pop: { sx: 0, sy: 0 }, zoom: { sx: 1.6, sy: 1.6, alpha: 0 }, drop: { dy: -1, alpha: 0 }, spin: { rot: -180, sx: 0.3, sy: 0.3, alpha: 0 },
});
export const WIDGET_EFFECT_NAMES: readonly string[] = Object.freeze(Object.keys(WIDGET_EFFECTS));
/** Chuyển động lặp. `amount` 0..1 là biên độ (nhân với cỡ riêng của từng hiệu ứng). */
export const LOOP_EFFECT_NAMES = ['breathe', 'float', 'sway', 'pulse', 'blink', 'wobble'] as const;
export type LoopEffect = typeof LOOP_EFFECT_NAMES[number];

export interface MotionPhase { effect: string; sec: number; ease: EaseSpec }
export interface MotionLoop { effect: LoopEffect; amount: number; every: number; unit: 'BEATS' | 'SECONDS' }
export interface WidgetMotion { enter: MotionPhase | null; exit: MotionPhase | null; loop: MotionLoop | null }
export const DEFAULT_PHASE: Readonly<MotionPhase> = Object.freeze({ effect: 'fade', sec: 0.5, ease: 'easeOutCubic' });
export const DEFAULT_LOOP: Readonly<MotionLoop> = Object.freeze({ effect: 'breathe', amount: 0.1, every: 1, unit: 'BEATS' });
export const hasMotion = (m: WidgetMotion | undefined): m is WidgetMotion => !!m && !!(m.enter || m.exit || m.loop);

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const full = (p: Partial<WidgetFx>): WidgetFx => ({ ...NEUTRAL_WFX, ...p });
const mix = (a: WidgetFx, b: WidgetFx, k: number): WidgetFx => ({ dx: a.dx + (b.dx - a.dx) * k, dy: a.dy + (b.dy - a.dy) * k, sx: a.sx + (b.sx - a.sx) * k, sy: a.sy + (b.sy - a.sy) * k, rot: a.rot + (b.rot - a.rot) * k, alpha: a.alpha + (b.alpha - a.alpha) * k });
const comb = (a: WidgetFx, b: WidgetFx): WidgetFx => ({ dx: a.dx + b.dx, dy: a.dy + b.dy, sx: a.sx * b.sx, sy: a.sy * b.sy, rot: a.rot + b.rot, alpha: a.alpha * b.alpha });

/** Khoảng đang hiển thị chứa t: [bắt đầu, kết thúc). Không có `visibility` thì cả bài. Ngoài mọi khoảng → null. */
export function activeRange(v: WidgetVisibility | undefined, t: number, duration: number): { from: number; to: number } | null {
  if (!v) return { from: 0, to: Math.max(duration, 0) };
  for (const r of v.ranges) { const to = r.to ?? Math.max(duration, r.from); if (t >= r.from && t < to) return { from: r.from, to }; }
  return null;
}
const easeCache = new Map<string, EaseFn>();
const easeOf = (e: EaseSpec): EaseFn => { const k = typeof e === 'string' ? e : JSON.stringify(e); let f = easeCache.get(k); if (!f) { f = parseEase(e).fn; if (easeCache.size < 256) easeCache.set(k, f); } return f; };

/** Pha của chuyển động lặp, 0 ≤ φ < 1. BEATS theo tempo thật của bài (đổi tempo thì vẫn khớp nhịp). */
export function loopPhase(l: MotionLoop, t: number, tempoMap: readonly TempoPoint[]): number {
  const every = Math.max(0.05, l.every), x = l.unit === 'BEATS' ? secToTick(tempoMap as never, Math.max(0, t)) / 960 / every : Math.max(0, t) / every;
  return x - Math.floor(x);
}
const loopFx = (l: MotionLoop, phi: number): WidgetFx => {
  const a = Math.max(0, Math.min(1, l.amount)), s = Math.sin(2 * Math.PI * phi);
  switch (l.effect) {
    case 'breathe': return full({ sx: 1 + a * 0.5 * s, sy: 1 + a * 0.5 * s });
    case 'float': return full({ dy: a * 0.25 * s });
    case 'sway': return full({ rot: a * 30 * s });
    case 'pulse': { const d = (1 - phi) ** 3; return full({ sx: 1 + a * d, sy: 1 + a * d }); }
    case 'blink': return full({ alpha: phi < 0.5 ? 1 : 1 - Math.min(0.95, a * 3) });
    case 'wobble': return full({ rot: a * 20 * Math.sin(4 * Math.PI * phi), sx: 1 + a * 0.2 * Math.abs(s), sy: 1 - a * 0.2 * Math.abs(s) });
  }
};

/** Biến đổi của widget tại t. `range` = khoảng hiển thị đang chứa t (activeRange). */
export function widgetFxAt(m: WidgetMotion, range: { from: number; to: number } | null, t: number, tempoMap: readonly TempoPoint[]): WidgetFx {
  let fx: WidgetFx = { ...NEUTRAL_WFX };
  if (range && m.enter && m.enter.sec > 0 && t < range.from + m.enter.sec) {
    const hid = full(WIDGET_EFFECTS[m.enter.effect] ?? {}); fx = comb(fx, mix(hid, NEUTRAL_WFX, easeOf(m.enter.ease)(clamp01((t - range.from) / m.enter.sec))));
  }
  if (range && m.exit && m.exit.sec > 0 && t > range.to - m.exit.sec) {
    const hid = full(WIDGET_EFFECTS[m.exit.effect] ?? {}); fx = comb(fx, mix(NEUTRAL_WFX, hid, easeOf(m.exit.ease)(clamp01((t - (range.to - m.exit.sec)) / m.exit.sec))));
  }
  if (m.loop) fx = comb(fx, loopFx(m.loop, loopPhase(m.loop, t, tempoMap)));
  return { ...fx, alpha: clamp01(fx.alpha) };
}
