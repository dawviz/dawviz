// Vẽ PathPrim (phần tử bản nhạc) lên Canvas 2D. Path2D được đệm theo phần tử/glyph (không dựng lại mỗi khung);
// nét tay (REQ-GRAPHICS-20) là nhiễu băm tất định của (id phần tử, đỉnh, bước boil, seed): không Math.random.
// Môi trường không có Path2D (test Node) thì phát lại lệnh đường lên ctx: cùng hình, chậm hơn.
import type { PathPrim } from '../prims.ts';
import type { RenderCtx } from '../render.ts';
import type { PathData } from './types.ts';

/** Băm 32 bit → [-1, 1). Thuần số nguyên nên giống nhau ở mọi trình duyệt. */
export function hashSigned(a: number, b: number, c: number, d: number): number {
  let h = Math.imul(a | 0, 0x9e3779b1) ^ Math.imul(b | 0, 0x85ebca77) ^ Math.imul(c | 0, 0xc2b2ae3d) ^ Math.imul(d | 0, 0x27d4eb2f);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); h ^= h >>> 16;
  return ((h >>> 0) / 4294967296) * 2 - 1;
}

/**
 * Làm rung một đường (đơn vị trang; amp 1 ≈ 1/10 khoảng dòng kẻ). Đoạn thẳng dài thành một đường cong bậc ba lượn nhẹ vuông góc
 * (dòng kẻ khuông như kẻ tay); điểm điều khiển của đường cong lệch nhẹ; điểm đầu/cuối lệch nửa biên độ.
 */
export function roughPathData(d: PathData, id: number, step: number, seed: number, amp: number): PathData {
  const out: number[] = [];
  let px = 0, py = 0, v = 0;
  const n = (k: number) => hashSigned(id, v * 7 + k, step, seed) * amp;
  for (let i = 0; i < d.length;) {
    const op = d[i]; v++;
    if (op === 0) { px = d[i + 1] + n(1) * 0.5; py = d[i + 2] + n(2) * 0.5; out.push(0, px, py); i += 3; }
    else if (op === 1) {
      const x = d[i + 1] + n(1) * 0.5, y = d[i + 2] + n(2) * 0.5, dx = x - px, dy = y - py, len = Math.hypot(dx, dy);
      if (len >= 40) {
        const nx = -dy / len, ny = dx / len, w = Math.min(1.5, len / 80), o1 = n(3) * w, o2 = n(4) * w;
        out.push(2, px + dx / 3 + nx * o1, py + dy / 3 + ny * o1, px + (2 * dx) / 3 + nx * o2, py + (2 * dy) / 3 + ny * o2, x, y);
      } else out.push(1, x, y);
      px = x; py = y; i += 3;
    } else if (op === 2) { out.push(2, d[i + 1] + n(1), d[i + 2] + n(2), d[i + 3] + n(3), d[i + 4] + n(4), d[i + 5] + n(5) * 0.5, d[i + 6] + n(6) * 0.5); px = d[i + 5]; py = d[i + 6]; i += 7; }
    else if (op === 3) { out.push(3, d[i + 1] + n(1), d[i + 2] + n(2), d[i + 3] + n(3) * 0.5, d[i + 4] + n(4) * 0.5); px = d[i + 3]; py = d[i + 4]; i += 5; }
    else if (op === 4) { out.push(4); i += 1; }
    else { out.push(5, d[i + 1], d[i + 2], d[i + 3], d[i + 4], d[i + 5], d[i + 6]); i += 7; }
  }
  return out;
}

/** Lệch nhỏ cho từng glyph (dời, xoay, co giãn) theo nét tay. */
export function roughGlyph(id: number, gi: number, step: number, seed: number, amp: number) {
  return { dx: hashSigned(id, gi * 5 + 1, step, seed) * amp * 0.6, dy: hashSigned(id, gi * 5 + 2, step, seed) * amp * 0.6,
    rot: hashSigned(id, gi * 5 + 3, step, seed) * amp * 0.035, sc: 1 + hashSigned(id, gi * 5 + 4, step, seed) * amp * 0.025 };
}

interface PathSink { moveTo(x: number, y: number): void; lineTo(x: number, y: number): void; bezierCurveTo(a: number, b: number, c: number, d: number, x: number, y: number): void;
  quadraticCurveTo(a: number, b: number, x: number, y: number): void; arc(x: number, y: number, r: number, a0: number, a1: number, ccw?: boolean): void; closePath(): void }
function trace(sink: PathSink, d: PathData): void {
  for (let i = 0; i < d.length;) {
    switch (d[i]) {
      case 0: sink.moveTo(d[i + 1], d[i + 2]); i += 3; break;
      case 1: sink.lineTo(d[i + 1], d[i + 2]); i += 3; break;
      case 2: sink.bezierCurveTo(d[i + 1], d[i + 2], d[i + 3], d[i + 4], d[i + 5], d[i + 6]); i += 7; break;
      case 3: sink.quadraticCurveTo(d[i + 1], d[i + 2], d[i + 3], d[i + 4]); i += 5; break;
      case 4: sink.closePath(); i += 1; break;
      default: sink.arc(d[i + 1], d[i + 2], d[i + 3], d[i + 4], d[i + 5], !!d[i + 6]); i += 7;
    }
  }
}

type P2D = PathSink & object;
const P2DCtor = (globalThis as { Path2D?: new () => P2D }).Path2D;
const glyphCache = new WeakMap<readonly PathData[], (P2D | undefined)[]>();
const itemCache = new WeakMap<object, { key: string; path: P2D }>();
function glyphPath(table: readonly PathData[], gi: number): P2D | undefined {
  if (!P2DCtor) return undefined;
  let arr = glyphCache.get(table);
  if (!arr) glyphCache.set(table, (arr = []));
  let p = arr[gi];
  if (!p) { p = new P2DCtor(); trace(p, table[gi] ?? []); arr[gi] = p; }
  return p;
}
function itemPath(item: object, d: PathData, key: string, make: () => PathData): P2D | undefined {
  if (!P2DCtor) return undefined;
  const c = itemCache.get(item);
  if (c && c.key === key) return c.path;
  const p = new P2DCtor(); trace(p, key === '' ? d : make());
  itemCache.set(item, { key, path: p });
  return p;
}

type G = RenderCtx & { lineTo(x: number, y: number): void; bezierCurveTo(a: number, b: number, c: number, d: number, x: number, y: number): void; quadraticCurveTo(a: number, b: number, x: number, y: number): void;
  arc(x: number, y: number, r: number, a0: number, a1: number, ccw?: boolean): void; lineCap: string; setLineDash?(d: number[]): void };
const CAPS = ['butt', 'round', 'square'];

/** Vẽ một PathPrim. `devScale` = điểm ảnh thiết bị / pt (cho độ mờ SOFT). Trả mọi trạng thái ctx về như trước. */
export function drawPathPrim(g0: RenderCtx, p: PathPrim, devScale: number): void {
  const g = g0 as G, it = p.item;
  if (!(p.alpha > 0.004)) return;
  g.save();
  g.translate(p.tx, p.ty); g.scale(p.s, p.s);
  if (p.zoom && p.zoom.k !== 1) { g.translate(p.zoom.cx, p.zoom.cy); g.scale(p.zoom.k, p.zoom.k); g.translate(-p.zoom.cx, -p.zoom.cy); }
  if (p.clipX !== undefined) { g.beginPath(); g.rect(-1e6, -1e6, p.clipX + 1e6, 2e6); g.clip(); } // viết tay / lau (T-132): vùng cắt bên trái clipX
  const r = p.rough, glow = p.glow;
  const fill = (path: P2D | undefined, d: PathData) => { if (path) (g.fill as (x: unknown) => void)(path); else { g.beginPath(); trace(g, d); g.fill(); } };
  const stroke = (path: P2D | undefined, d: PathData) => { if (path) (g.stroke as (x: unknown) => void)(path); else { g.beginPath(); trace(g, d); g.stroke(); } };
  g.lineJoin = 'round';
  if (it.k === 2) {
    const gl = it.g ?? [];
    const each = (fn: (path: P2D | undefined, d: PathData, unitScale: number) => void) => {
      for (let j = 0; j + 3 < gl.length; j += 4) {
        const gi = gl[j], size = gl[j + 3];
        g.save();
        if (r) { const q = roughGlyph(r.id, j >> 2, r.step, r.seed, r.amp); g.translate(gl[j + 1] + q.dx, gl[j + 2] + q.dy); g.rotate(q.rot); g.scale(size * q.sc, size * q.sc); }
        else { g.translate(gl[j + 1], gl[j + 2]); g.scale(size, size); }
        fn(glyphPath(p.glyphs, gi), p.glyphs[gi] ?? [], size);
        g.restore();
      }
    };
    if (glow) paintGlow(g, glow, p.alpha, devScale * p.s, (lw) => each((path, d, size) => { g.lineWidth = lw / size; stroke(path, d); }), () => each((path, d) => fill(path, d)));
    g.globalAlpha = p.alpha; g.fillStyle = p.color;
    each((path, d) => fill(path, d));
  } else {
    const d = it.d ?? [];
    const key = r ? `${r.step}|${r.amp}|${r.seed}` : '';
    const path = itemPath(it, d, key, () => roughPathData(d, r!.id, r!.step, r!.seed, r!.amp));
    const dd = r && !path ? roughPathData(d, r.id, r.step, r.seed, r.amp) : d;
    const lw = it.lw ?? 1;
    if (glow) paintGlow(g, glow, p.alpha, devScale * p.s, (w) => { g.lineWidth = (it.k === 1 ? lw : 0) + w; stroke(path, dd); }, () => (it.k === 0 ? fill(path, dd) : stroke(path, dd)));
    g.globalAlpha = p.alpha;
    if (it.k === 0) { g.fillStyle = p.color; fill(path, dd); }
    else { g.strokeStyle = p.color; g.lineWidth = r ? lw * 1.15 : lw; g.lineCap = r ? 'round' : CAPS[it.cap ?? 0]; stroke(path, dd); }
  }
  g.restore();
}

/** Quầng sáng: HALO = viền dày mờ vẽ trước (rẻ, đều mọi trình duyệt); SOFT = shadowBlur (mềm hơn, chậm hơn trên Firefox). */
function paintGlow(g: G, glow: NonNullable<PathPrim['glow']>, alpha: number, pxPerUnit: number, haloStroke: (width: number) => void, softFill: () => void): void {
  if (!(glow.alpha > 0) || !(glow.width > 0)) return;
  if (glow.mode === 'SOFT') {
    g.globalAlpha = alpha * glow.alpha; g.fillStyle = glow.color; g.strokeStyle = glow.color;
    g.shadowColor = glow.color; g.shadowBlur = glow.width * 2 * pxPerUnit;
    softFill();
    g.shadowBlur = 0; g.shadowColor = 'rgba(0,0,0,0)';
    return;
  }
  g.strokeStyle = glow.color; g.lineCap = 'round';
  g.globalAlpha = alpha * glow.alpha * 0.35; haloStroke(glow.width * 2);
  g.globalAlpha = alpha * glow.alpha * 0.6; haloStroke(glow.width);
}
