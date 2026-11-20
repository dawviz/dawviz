// Widget Particles (T-20, AD-10): hạt KHÔNG TRẠNG THÁI. Mỗi nốt bắt đầu trong `life` giây gần nhất sinh `perNote` hạt; vị trí và độ đục của mỗi hạt là
// hàm đóng của tuổi `age = t − start` và các số "ngẫu nhiên" băm từ (seed, nốt, chỉ số hạt), nên đặt `t` ở đâu cũng ra cùng khung hình
// như chạy liên tục từ đầu (tua, xuất từ giữa bài, xem trước đều khớp). Không Math.random, không trạng thái tích luỹ.
import { notesInRange } from './notes.ts';
import type { LayoutCtx, Primitive, RectPrim, WidgetRenderer } from './prims.ts';
import type { WidgetSpec } from './scene.ts';
import type { ASTNote } from './types.ts';

export interface ParticleProps {
  /** Hạt sinh ra mỗi nốt (1–24); `velocityScale` thì nốt mạnh hơn sinh nhiều hơn. */
  perNote: number; velocityScale: boolean;
  /** Tuổi thọ (giây). */
  life: number;
  /** Tốc độ ban đầu (pt/giây) và độ biến thiên (0–1 = ±phần trăm của tốc độ). */
  speed: number; speedSpread: number;
  /** Hướng bay (độ; 0 = lên trên, theo chiều kim đồng hồ) và độ toả (độ, tổng góc quạt). */
  angle: number; spread: number;
  /** Gia tốc dọc (pt/giây², dương = rơi xuống). */
  gravity: number;
  sizeStart: number; sizeEnd: number;
  shape: 'CIRCLE' | 'SQUARE';
  colorMode: 'TRACK' | 'SOLID'; color: string;
  opacity: number; fade: boolean; glow: number;
  /** Nơi hạt sinh ra: theo cao độ nốt trải trên bề rộng widget, giữa widget, rải đều ngẫu nhiên, hoặc `NOTE` = tại điểm nốt chạm vạch phát của Piano Roll
   * (cao độ theo hàng của nốt, ngang theo vạch phát lúc nốt bắt đầu; không có Piano Roll thì như CENTER); độ cao theo tỉ lệ chiều cao (0 = trên, 1 = dưới). */
  originX: 'PITCH' | 'CENTER' | 'SPREAD' | 'NOTE'; originY: number;
  pitchMin: number; pitchMax: number;
  seed: number; maxParticles: number;
}
export const DEFAULT_PARTICLES: Readonly<ParticleProps> = Object.freeze({
  perNote: 6, velocityScale: true, life: 1.6, speed: 220, speedSpread: 0.5, angle: 0, spread: 60, gravity: 160, sizeStart: 8, sizeEnd: 2,
  shape: 'CIRCLE', colorMode: 'TRACK', color: '#ffffff', opacity: 0.9, fade: true, glow: 0.3,
  originX: 'PITCH', originY: 1, pitchMin: 21, pitchMax: 108, seed: 1, maxParticles: 1500,
});

/** Băm 32 bit (kiểu murmur/xorshift-multiply), thuần số nguyên nên giống nhau ở mọi trình duyệt. */
export function hash32(a: number, b: number, c: number): number {
  let h = Math.imul(a | 0, 0x9e3779b1) ^ Math.imul(b | 0, 0x85ebca6b) ^ Math.imul(c | 0, 0xc2b2ae35);
  h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
  return h >>> 0;
}
/** Số "ngẫu nhiên" ổn định trong [0, 1). */
export const unit = (a: number, b: number, c: number): number => hash32(a, b, c) / 4294967296;
/** FNV-1a của chuỗi (định danh nốt → số). */
export function strHash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const countFor = (p: ParticleProps, n: ASTNote) => Math.max(1, Math.round(p.perNote * (p.velocityScale ? 0.3 + 0.7 * Math.min(1, Math.max(0, n.velocity / 127)) : 1)));

/** `emitter`: (cao độ, giây) → điểm xuất phát, hoặc null khi nốt nằm ngoài tầm của Piano Roll (không sinh hạt). Toạ độ theo widget; riêng `NOTE` theo KHUNG VIDEO. */
export type ParticleEmitter = (pitch: number, startSec: number) => { x: number; y: number } | null;

export function particlePrims(p: ParticleProps, W: number, H: number, t: number, tracks: LayoutCtx['tracks'], emitter?: ParticleEmitter): Primitive[] {
  const out: RectPrim[] = [];
  if (t < 0) return out;
  if (p.originX === 'NOTE' && !emitter) return out; // không có Piano Roll để chạm: không có hạt
  const born: { n: ASTNote; color: string }[] = [];
  for (const ti of tracks) {
    if (!ti.track.isVisible) continue;
    for (const n of notesInRange(ti, t - p.life, t)) if (n.startTimeSeconds <= t && n.startTimeSeconds > t - p.life) born.push({ n, color: ti.track.color });
  }
  born.sort((a, b) => b.n.startTimeSeconds - a.n.startTimeSeconds || (a.n.id < b.n.id ? -1 : 1)); // mới nhất trước: vượt giới hạn thì bỏ hạt cũ nhất
  let budget = p.maxParticles;
  const span = Math.max(1, p.pitchMax - p.pitchMin), rad = Math.PI / 180;
  for (const { n, color } of born) {
    if (budget <= 0) break;
    const at = p.originX === 'NOTE' && emitter ? emitter(n.pitch, n.startTimeSeconds) : undefined;
    if (at === null) continue; // nốt ngoài tầm Piano Roll: không có điểm chạm
    const cnt = Math.min(budget, countFor(p, n)); budget -= cnt;
    const nid = strHash(n.id), age = t - n.startTimeSeconds, u = age / p.life;
    const size = lerp(p.sizeStart, p.sizeEnd, u), alpha = p.opacity * (p.fade ? 1 - u : 1);
    if (size < 0.3 || alpha < 0.004) continue;
    const x0 = at ? at.x : p.originX === 'CENTER' || p.originX === 'NOTE' ? W / 2 : p.originX === 'PITCH' ? Math.min(1, Math.max(0, (n.pitch - p.pitchMin) / span)) * W : -1, y0 = at ? at.y : p.originY * H;
    const fill = p.colorMode === 'TRACK' ? color : p.color;
    for (let k = 0; k < cnt; k++) {
      const th = (p.angle + (unit(p.seed, nid, k * 4) - 0.5) * p.spread) * rad, sp = p.speed * (1 + (unit(p.seed, nid, k * 4 + 1) - 0.5) * 2 * p.speedSpread);
      const ox = x0 < 0 ? unit(p.seed, nid, k * 4 + 2) * W : x0;
      const px = ox + Math.sin(th) * sp * age, py = y0 - Math.cos(th) * sp * age + 0.5 * p.gravity * age * age;
      out.push({ kind: 'rect', x: px - size / 2, y: py - size / 2, w: size, h: size, fill, alpha, radius: p.shape === 'CIRCLE' ? size / 2 : 0,
        glowColor: fill, glowBlur: p.glow > 0 ? p.glow * size * 2 : 0, stroke: '', strokeWidth: 0 });
    }
  }
  return out;
}

export const particleRenderer: WidgetRenderer<ParticleProps> = {
  type: 'PARTICLES',
  layout({ tracks, emitter }: LayoutCtx, spec: WidgetSpec<ParticleProps>, t: number) {
    // `NOTE`: điểm chạm và hạt đều ở toạ độ khung video (renderFrame không dời/xoay/cắt theo khung widget); khung widget chỉ để sắp xếp.
    return particlePrims(spec.properties, spec.layout.width, spec.layout.height, t, tracks, emitter);
  },
};

/** Hạt `NOTE` vẽ thẳng trong toạ độ khung video: không dời, không xoay, không cắt theo khung widget. */
export const particlesInCanvasSpace = (w: { type: string; properties: unknown }): boolean => w.type === 'PARTICLES' && (w.properties as ParticleProps).originX === 'NOTE';
