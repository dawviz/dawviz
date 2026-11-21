// Bộ máy keyframe (T-32, CUSTOMIZATION §3.1): một thuộc tính số, góc hoặc màu là một Track gồm các keyframe, mốc theo giây, beat, bar.beat hoặc tick.
// Hàm thuần của (track đã biên dịch, t): cùng đầu vào luôn cùng đầu ra, tua tới đâu cũng đúng. Mốc nhạc đổi ra giây MỘT lần lúc biên dịch (qua TempoMap).
// Trước keyframe đầu và sau keyframe cuối giữ nguyên giá trị, trừ khi bật lặp (CYCLE, PINGPONG, OFFSET).
import { tickToSec } from '@dawviz/parser-core';
import { buildBarGrid, type BarGrid } from './hud.ts';
import { parseEase, type EaseFn, type EaseSpec } from './motion.ts';
import type { TempoPoint } from './types.ts';

export type KeyTime = { sec: number } | { beat: number } | { tick: number } | { bar: number; beat?: number };
export type InterpMode = 'linear' | 'hold' | 'smooth';
/** `ease` của keyframe áp cho đoạn ĐI TỚI keyframe đó (như After Effects); `interp` của keyframe là cách đi từ nó tới keyframe kế. */
export interface Key<V = number | string> { at: KeyTime; value: V; ease?: EaseSpec; interp?: InterpMode }
export type LoopMode = 'NONE' | 'CYCLE' | 'PINGPONG' | 'OFFSET';
export type ValueKind = 'number' | 'angle' | 'color';
export interface TrackSpec<V = number | string> { keys: Key<V>[]; kind?: ValueKind; loop?: LoopMode }
export interface TimeCtx { tempoMap: readonly TempoPoint[]; grid?: BarGrid }

const PPQ = 960;
/** Tick của `bar.beat` (cả hai đếm từ 1) theo lưới ô nhịp: đúng cả khi đổi dấu nhịp giữa bài. */
export function barBeatToTick(g: BarGrid, bar: number, beat = 1): number {
  const b0 = Math.max(0, bar - 1); let sg = g.sigs[0];
  for (const s of g.sigs) if (s.barStart <= b0) sg = s; else break;
  const perBeat = g.ppq * 4 / sg.den;
  return sg.tick + (b0 - sg.barStart) * perBeat * sg.num + (beat - 1) * perBeat;
}
/** Giây của một mốc. Mốc không hợp lệ → NaN (biên dịch sẽ bỏ keyframe đó và cảnh báo). */
export function keyTimeSec(at: KeyTime, ctx: TimeCtx): number {
  const map = ctx.tempoMap as never;
  if ('sec' in at) return at.sec;
  if ('tick' in at) return tickToSec(map, at.tick);
  if ('beat' in at && !('bar' in at)) return tickToSec(map, at.beat * PPQ);
  const a = at as { bar: number; beat?: number };
  return tickToSec(map, barBeatToTick(ctx.grid ?? buildBarGrid(ctx.tempoMap as TempoPoint[]), a.bar, a.beat ?? 1));
}

// ───────────── màu trong OKLab ─────────────
interface Lab { L: number; a: number; b: number; alpha: number }
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLin = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
/** `#rgb`, `#rrggbb`, `#rrggbbaa` → OKLab (+ alpha). Sai định dạng → null. */
export function hexToLab(hex: string): Lab | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex.trim()); if (!m) return null;
  let h = m[1]; if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = toLin(parseInt(h.slice(0, 2), 16) / 255), g = toLin(parseInt(h.slice(2, 4), 16) / 255), b = toLin(parseInt(h.slice(4, 6), 16) / 255), alpha = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), mm = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return { L: 0.2104542553 * l + 0.793617785 * mm - 0.0040720468 * s, a: 1.9779984951 * l - 2.428592205 * mm + 0.4505937099 * s, b: 0.0259040371 * l + 0.7827717662 * mm - 0.808675766 * s, alpha };
}
export function labToHex(c: Lab): string {
  const l = (c.L + 0.3963377774 * c.a + 0.2158037573 * c.b) ** 3, m = (c.L - 0.1055613458 * c.a - 0.0638541728 * c.b) ** 3, s = (c.L - 0.0894841775 * c.a - 1.291485548 * c.b) ** 3;
  const ch = (v: number) => Math.round(Math.min(1, Math.max(0, fromLin(Math.min(1, Math.max(0, v))))) * 255).toString(16).padStart(2, '0');
  const hex = `#${ch(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)}${ch(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)}${ch(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)}`;
  return c.alpha < 0.999 ? hex + Math.round(Math.max(0, c.alpha) * 255).toString(16).padStart(2, '0') : hex;
}
const mixLab = (a: Lab, b: Lab, k: number): Lab => ({ L: a.L + (b.L - a.L) * k, a: a.a + (b.a - a.a) * k, b: a.b + (b.b - a.b) * k, alpha: a.alpha + (b.alpha - a.alpha) * k });
/** Nội suy màu trong OKLab (màu không bị xỉn ở giữa). Màu sai định dạng giữ `a`. */
export function mixColor(a: string, b: string, k: number): string {
  const x = hexToLab(a), y = hexToLab(b); if (!x || !y) return a;
  return labToHex(mixLab(x, y, k));
}
/** Nội suy góc (độ) theo đường ngắn nhất, kết quả trong (−180, 180] cộng với góc đầu (không bó lại: giữ liên tục). */
export const mixAngle = (a: number, b: number, k: number): number => { let d = (b - a) % 360; if (d > 180) d -= 360; else if (d < -180) d += 360; return a + d * k; };

// ───────────── biên dịch và lấy mẫu ─────────────
export interface CompiledTrack {
  kind: ValueKind; loop: LoopMode; times: number[]; values: (number | Lab)[]; eases: EaseFn[]; interps: InterpMode[]; tangents: number[]; warnings: string[];
}
const EMPTY = (kind: ValueKind): CompiledTrack => ({ kind, loop: 'NONE', times: [], values: [], eases: [], interps: [], tangents: [], warnings: [] });

export function compileTrack(spec: TrackSpec, ctx: TimeCtx): CompiledTrack {
  const keys = Array.isArray(spec?.keys) ? spec.keys.slice(0, 4096) : [];
  const kind: ValueKind = spec?.kind ?? (typeof keys[0]?.value === 'string' ? 'color' : 'number');
  const out = EMPTY(kind), loop = spec?.loop;
  out.loop = loop === 'CYCLE' || loop === 'PINGPONG' || loop === 'OFFSET' ? loop : 'NONE';
  const rows: { t: number; v: number | Lab; ease: EaseFn; interp: InterpMode; i: number }[] = [];
  keys.forEach((k, i) => {
    const t = k && k.at ? keyTimeSec(k.at, ctx) : NaN;
    if (!Number.isFinite(t) || t < 0) { out.warnings.push(`keyframe ${i}: mốc không hợp lệ; bỏ qua`); return; }
    let v: number | Lab | null;
    if (kind === 'color') v = typeof k.value === 'string' ? hexToLab(k.value) : null; else v = typeof k.value === 'number' && Number.isFinite(k.value) ? k.value : null;
    if (v === null) { out.warnings.push(`keyframe ${i}: giá trị không hợp lệ; bỏ qua`); return; }
    const pe = parseEase(k.ease); if (!pe.ok) out.warnings.push(`keyframe ${i}: easing lạ; dùng linear`);
    rows.push({ t, v, ease: pe.fn, interp: k.interp === 'hold' || k.interp === 'smooth' ? k.interp : 'linear', i });
  });
  rows.sort((a, b) => a.t - b.t || a.i - b.i);
  out.times = rows.map((r) => r.t); out.values = rows.map((r) => r.v); out.eases = rows.map((r) => r.ease); out.interps = rows.map((r) => r.interp);
  if (kind !== 'color') { // tiếp tuyến đơn điệu (Fritsch–Carlson) cho đoạn `smooth`
    const n = rows.length, v = out.values as number[], t = out.times, d = new Array<number>(n).fill(0), sl: number[] = [];
    for (let i = 0; i < n - 1; i++) sl.push(t[i + 1] > t[i] ? (v[i + 1] - v[i]) / (t[i + 1] - t[i]) : 0);
    if (n > 1) { d[0] = sl[0]; d[n - 1] = sl[n - 2]; }
    for (let i = 1; i < n - 1; i++) d[i] = sl[i - 1] * sl[i] <= 0 ? 0 : (sl[i - 1] + sl[i]) / 2;
    for (let i = 0; i < n - 1; i++) {
      if (sl[i] === 0) { d[i] = 0; d[i + 1] = 0; continue; }
      const a = d[i] / sl[i], b = d[i + 1] / sl[i], h = a * a + b * b;
      if (h > 9) { const tau = 3 / Math.sqrt(h); d[i] = tau * a * sl[i]; d[i + 1] = tau * b * sl[i]; }
    }
    out.tangents = d;
  }
  return out;
}

const upper = (a: readonly number[], t: number) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] <= t) lo = m + 1; else hi = m; } return lo; };
/** Giá trị tại t. Track rỗng → 0 (hoặc `#000000` với màu). */
export function sampleTrack(ct: CompiledTrack, t: number): number | string {
  const n = ct.times.length;
  if (n === 0) return ct.kind === 'color' ? '#000000' : 0;
  const t0 = ct.times[0], t1 = ct.times[n - 1], T = t1 - t0;
  let tt = Number.isFinite(t) ? t : 0, offset = 0;
  if (ct.loop !== 'NONE' && T > 0 && tt > t1) {
    const cycles = Math.floor((tt - t0) / T), m = (tt - t0) - cycles * T;
    if (ct.loop === 'PINGPONG') { const m2 = (tt - t0) % (2 * T); tt = t0 + (m2 <= T ? m2 : 2 * T - m2); }
    else { tt = t0 + m; if (ct.loop === 'OFFSET' && ct.kind !== 'color') offset = cycles * ((ct.values[n - 1] as number) - (ct.values[0] as number)); }
  }
  const i = upper(ct.times, tt) - 1;
  const at = (k: number): number | string => (ct.kind === 'color' ? labToHex(ct.values[k] as Lab) : (ct.values[k] as number) + offset);
  if (i < 0) return at(0);
  if (i >= n - 1) return at(n - 1);
  const a = ct.times[i], b = ct.times[i + 1], u = (tt - a) / (b - a), mode = ct.interps[i];
  if (mode === 'hold') return at(i);
  if (ct.kind === 'color') return labToHex(mixLab(ct.values[i] as Lab, ct.values[i + 1] as Lab, ct.eases[i + 1](u)));
  const va = ct.values[i] as number, vb = ct.values[i + 1] as number;
  if (ct.kind === 'angle') return mixAngle(va, vb, ct.eases[i + 1](u)) + offset;
  if (mode === 'smooth') {
    const h = b - a, s2 = u * u, s3 = s2 * u;
    return (2 * s3 - 3 * s2 + 1) * va + (s3 - 2 * s2 + u) * h * ct.tangents[i] + (-2 * s3 + 3 * s2) * vb + (s3 - s2) * h * ct.tangents[i + 1] + offset;
  }
  return va + (vb - va) * ct.eases[i + 1](u) + offset;
}
/** Tốc độ thay đổi (đơn vị/giây) tại t, sai phân trung tâm: dữ liệu cho đồ thị tốc độ (speed graph) của Graph Editor. Chỉ cho track số hoặc góc. */
export function trackSpeed(ct: CompiledTrack, t: number, dt = 1 / 240): number {
  if (ct.kind === 'color' || !ct.times.length) return 0;
  return ((sampleTrack(ct, t + dt) as number) - (sampleTrack(ct, Math.max(0, t - dt)) as number)) / (t - Math.max(0, t - dt) + dt);
}
