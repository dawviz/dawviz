// Text animator cơ bản (T-35, ANIMATION-CATALOG §13, v1.0): áp hiệu ứng cho từng ký tự / từ / dòng của Ô chữ, lệch thời gian theo thứ tự
// (xuôi, ngược, từ giữa ra, ngẫu nhiên tất định) — tương đương một "range selector" quét qua các phần tử theo thời gian. Có sẵn: Gõ chữ (typewriter),
// Hiện dần, Trồi lên, Bật ra; Tuỳ chỉnh = tự đặt trạng thái "từ" (độ đục, dời, tỉ lệ, màu). "Đếm số" (counter): số trong chữ chạy từ 0 tới giá trị.
// Mỗi phần tử được dàn bằng đúng textPrims (giữ tracking, gradient, viền…), rồi biến đổi primitive của phần tử đó. Thuần, tất định: hàm của (props, t).
import { EASINGS } from './motion.ts';
import { mixColor } from './keyframes.ts';
import { isHexColor } from './color.ts';
import { hash32 } from './particles.ts';
import { clusters, type TextSpan } from './typography.ts';
import type { Primitive, TextPrim } from './prims.ts';

export type AnimUnit = 'char' | 'word' | 'line';
export type AnimOrder = 'forward' | 'backward' | 'center' | 'random';
export type AnimEffect = 'typewriter' | 'fade' | 'rise' | 'pop' | 'custom';
export interface TextAnimator {
  enabled: boolean;
  effect: AnimEffect;
  unit: AnimUnit;
  order: AnimOrder;
  /** 'in' = từ trạng thái "từ" về chữ bình thường; 'out' = ngược lại. */
  direction: 'in' | 'out';
  /** Giây, tính từ đầu khoảng hiển thị của widget (vắng khoảng = đầu bài). */
  start: number;
  /** Giây mỗi phần tử đi hết hiệu ứng (0 = bật ngay, như gõ chữ). */
  duration: number;
  /** Giây lệch giữa hai phần tử liên tiếp. */
  stagger: number;
  ease: string;
  /** Trạng thái "từ" (chỉ dùng khi effect = custom). dx/dy pt, scale hệ số, color '' = giữ màu. */
  fromOpacity: number; fromX: number; fromY: number; fromScale: number; fromColor: string;
  /** Đếm số: mọi số trong chữ chạy từ 0 tới giá trị theo tiến độ chung của hiệu ứng. */
  countUp: boolean;
  seed: number;
}
export const DEFAULT_TEXT_ANIMATOR: Readonly<TextAnimator> = Object.freeze({
  enabled: false, effect: 'fade', unit: 'char', order: 'forward', direction: 'in', start: 0, duration: 0.4, stagger: 0.05, ease: 'easeOutCubic',
  fromOpacity: 0, fromX: 0, fromY: 24, fromScale: 1, fromColor: '', countUp: false, seed: 1,
});
export const ANIM_UNITS: readonly AnimUnit[] = ['char', 'word', 'line'];
export const ANIM_ORDERS: readonly AnimOrder[] = ['forward', 'backward', 'center', 'random'];
export const ANIM_EFFECTS: readonly AnimEffect[] = ['typewriter', 'fade', 'rise', 'pop', 'custom'];
export const MAX_ANIM_ELEMENTS = 2000;

interface From { opacity: number; x: number; y: number; scale: number; color: string }
/** Trạng thái "từ" của hiệu ứng (bộ dựng sẵn) và thời lượng thật (gõ chữ: bật ngay). */
export function effectFrom(a: TextAnimator): { from: From; duration: number } {
  switch (a.effect) {
    case 'typewriter': return { from: { opacity: 0, x: 0, y: 0, scale: 1, color: '' }, duration: 0 };
    case 'fade': return { from: { opacity: 0, x: 0, y: 0, scale: 1, color: '' }, duration: a.duration };
    case 'rise': return { from: { opacity: 0, x: 0, y: 24, scale: 1, color: '' }, duration: a.duration };
    case 'pop': return { from: { opacity: 0, x: 0, y: 0, scale: 0.2, color: '' }, duration: a.duration };
    default: return { from: { opacity: a.fromOpacity, x: a.fromX, y: a.fromY, scale: a.fromScale, color: a.fromColor }, duration: a.duration };
  }
}

/** Phần tử của một dòng: đoạn chữ (giữ kiểu của từng đoạn) và đoạn đứng trước nó (để đo vị trí). `visible` = không chỉ là khoảng trắng. */
export interface Element { spans: TextSpan[]; before: TextSpan[]; visible: boolean }
/** Cắt một dòng (đã thay chỗ giữ) thành phần tử theo đơn vị. Ký tự theo cụm NFC (dấu tiếng Việt không rời chữ); từ giữ khoảng trắng phía sau. */
export function splitLine(spans: readonly TextSpan[], unit: AnimUnit): Element[] {
  if (unit === 'line') return [{ spans: [...spans], before: [], visible: spans.some((s) => s.text.trim() !== '') }];
  const pieces: { text: string; style: TextSpan['style'] }[] = [];
  for (const s of spans) {
    if (unit === 'char') for (const c of clusters(s.text)) pieces.push({ text: c, style: s.style });
    else for (const w of s.text.match(/\S+\s*|\s+/g) ?? []) pieces.push({ text: w, style: s.style });
  }
  const out: Element[] = [], before: TextSpan[] = [];
  for (const p of pieces) {
    const sp: TextSpan = p.style ? { text: p.text, style: p.style } : { text: p.text };
    out.push({ spans: [sp], before: before.map((b) => ({ ...b })), visible: p.text.trim() !== '' });
    const last = before[before.length - 1];
    if (last && last.style === p.style) last.text += p.text; else before.push({ ...sp });
  }
  return out;
}

/** Thứ tự xuất hiện của n phần tử (rank[i] = lượt của phần tử i). Ngẫu nhiên: hoán vị tất định theo `seed`. */
export function ranks(n: number, order: AnimOrder, seed: number): number[] {
  const idx = Array.from({ length: n }, (_, i) => i);
  if (order === 'backward') return idx.map((i) => n - 1 - i);
  if (order === 'center') { const mid = (n - 1) / 2; const sorted = [...idx].sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b); const r = new Array<number>(n); sorted.forEach((i, k) => { r[i] = k; }); return r; }
  if (order === 'random') { const sorted = [...idx].sort((a, b) => hash32(seed, a, 77) - hash32(seed, b, 77) || a - b); const r = new Array<number>(n); sorted.forEach((i, k) => { r[i] = k; }); return r; }
  return idx;
}

/** Tiến độ (0..1, đã easing) của phần tử có lượt `rank` tại thời điểm tương đối `tt` (giây từ lúc bắt đầu hiệu ứng). */
export function elementProgress(tt: number, rank: number, duration: number, stagger: number, ease: string): number {
  const t0 = rank * stagger;
  if (duration <= 0) return tt >= t0 ? 1 : 0;
  const p = Math.min(1, Math.max(0, (tt - t0) / duration));
  return (EASINGS[ease] ?? EASINGS.linear)(p);
}

/** Đếm số: mọi số trong chuỗi (có thể có phần thập phân) nhân với k, giữ số chữ số thập phân. */
export function countUpText(s: string, k: number): string {
  return s.replace(/\d+(?:[.,]\d+)?/g, (m) => {
    const sep = m.includes(',') ? ',' : '.', dec = m.includes(sep) ? m.length - m.indexOf(sep) - 1 : 0;
    const v = Number(m.replace(',', '.')) * Math.min(1, Math.max(0, k));
    const out = v.toFixed(dec);
    return sep === ',' ? out.replace('.', ',') : out;
  });
}

/** Biến đổi các primitive chữ của một phần tử: tỉ lệ quanh (cx, cy), dời (dx, dy), nhân độ đục, pha màu về `color` theo `mix`. */
export function transformText(prims: Primitive[], cx: number, cy: number, dx: number, dy: number, s: number, alpha: number, color: string, mix: number): void {
  const X = (x: number) => cx + (x - cx) * s + dx, Y = (y: number) => cy + (y - cy) * s + dy;
  const tint = (c: string) => (color && mix > 0 && isHexColor(c) ? mixColor(c, color, mix) : c);
  for (let i = 0; i < prims.length; i++) {
    const p = prims[i]; if (p.kind !== 'text') continue;
    const q: TextPrim = { ...p, x: X(p.x), y: Y(p.y), size: p.size * s, alpha: p.alpha * alpha, color: tint(p.color) };
    if (p.rich) {
      const r = p.rich;
      q.rich = { ...r, left: X(r.left), width: r.width * s, ascent: r.ascent * s, descent: r.descent * s, opacity: r.opacity * alpha,
        runs: r.runs.map((u) => ({ ...u, dx: u.dx * s, width: u.width * s, size: u.size * s, shift: u.shift * s, decoThickness: u.decoThickness * s, stroke: { ...u.stroke, width: u.stroke.width * s },
          ...(u.xs ? { xs: u.xs.map((x) => x * s) } : {}), color: tint(u.color) })) };
    }
    prims[i] = q;
  }
}
