// Widget Audio Spectrum (T-53, REQ-WIDGET-07): MỘT widget, hai hình dạng — LINE (cột xếp thẳng theo một đường, xoay mọi góc 0–360°)
// và CIRCLE (cột toả quanh tâm). Mỗi hình có kích thước riêng (LINE: chiều dài đường + độ cao cột; CIRCLE: bán kính trong + độ dài cột).
// Layout là hàm thuần của (props, t, bảng đặc trưng): không FFT lúc vẽ. Chưa có âm thanh thì vẽ cột thấp nhất, để thấy chỗ đặt widget.
import type { Derived, LayoutCtx, PathPrim, Primitive, RectPrim, WidgetRenderer } from './prims.ts';
import type { WidgetSpec } from './scene.ts';
import { frameAt, u8ToDb, type AudioFeatures } from './audioFeatures.ts';
import { mixHexRgb } from './color.ts';

/** Kiểu hiển thị (REQ-WIDGET-07, T-53): cột, vùng, đường, chấm (phổ tại t); dao động ký (sóng tức thời); sóng âm cả bài; đồng hồ đỉnh/RMS. */
export type SpectrumStyle = 'BARS' | 'AREA' | 'LINE' | 'DOTS' | 'OSCILLOSCOPE' | 'WAVEFORM' | 'METER';
export const SPECTRUM_STYLES: readonly SpectrumStyle[] = ['BARS', 'AREA', 'LINE', 'DOTS', 'OSCILLOSCOPE', 'WAVEFORM', 'METER'];
/** Hình chấm đỉnh (T-130). */
export type PeakStyle = 'LINE' | 'DOT';
export const PEAK_STYLES: readonly PeakStyle[] = ['LINE', 'DOT'];
/** Thang tần số của trục cột. */
export type FreqScale = 'LOG' | 'LINEAR' | 'MEL';
export interface SpectrumProps {
  style: SpectrumStyle;
  scale: FreqScale;
  /** Chấm đỉnh rơi chậm trên mỗi cột (BARS/DOTS). */
  peakCap: boolean;
  /** Tốc độ rơi của chấm đỉnh (phần thang mỗi giây). */
  capFall: number;
  /** Hình đỉnh (T-130): vạch mảnh ngang bề rộng cột (mặc định, như trước) hoặc chấm tròn lơ lửng. */
  peakStyle: PeakStyle;
  /** Số giây đỉnh đứng yên trước khi rơi (0 = rơi ngay, như trước). */
  peakHold: number;
  /** Gia tốc rơi (phần thang mỗi giây²; 0 = rơi đều theo `capFall`, như trước). */
  peakGravity: number;
  /** Màu đỉnh; rỗng = theo màu cột. */
  peakColor: string;
  /** Oscilloscope: cửa sổ thời gian hiển thị (ms). */
  scopeMs: number;
  /** Waveform: màu phần đã phát. */
  playedColor: string;
  shape: 'LINE' | 'CIRCLE';
  /** Số cột 8–128 (nội suy/gộp từ bảng 128 dải log). */
  bars: number;
  /** Dải tần hiển thị (Hz), thang log; ngoài dải của bảng thì kẹp. */
  minHz: number; maxHz: number;
  /** Đảo chiều trục tần số. */
  reverse: boolean;
  /** LINE: cột mọc về hai phía của đường. CIRCLE: đối xứng trái–phải (tần thấp ở đỉnh, cao ở đáy). */
  mirror: boolean;
  /** LINE: hướng của đường (độ, 0 = ngang từ trái sang phải, quay theo chiều kim đồng hồ). Cột mọc về phía "trên" của đường. */
  angle: number;
  /** LINE: chiều dài đường (pt). */
  length: number;
  /** CIRCLE: bán kính vòng trong (pt) và góc đặt cột đầu tiên (độ, 0 = đỉnh, theo chiều kim đồng hồ). */
  radius: number; startAngle: number;
  /** Độ cao tối đa của cột (LINE) / độ dài tối đa của cột (CIRCLE), pt. */
  thickness: number;
  /** Độ cao tối thiểu khi im lặng (pt). */
  minLen: number;
  /** Phần của ô cột mà cột chiếm (0.1–1; 1 = liền nhau). */
  barWidth: number;
  /** Bo góc (0–1 của nửa bề rộng cột). */
  roundness: number;
  attackMs: number; releaseMs: number;
  /** Thang mức: dưới `floorDb` là 0, trên `ceilDb` là đầy. */
  floorDb: number; ceilDb: number;
  colorMode: 'SOLID' | 'GRADIENT';
  color: string; colorB: string;
  opacity: number;
  /** 0 = không phát sáng. */
  glow: number;
}
export const DEFAULT_SPECTRUM: Readonly<SpectrumProps> = Object.freeze({
  style: 'BARS', scale: 'LOG', peakCap: false, capFall: 0.6, peakStyle: 'LINE', peakHold: 0, peakGravity: 0, peakColor: '', scopeMs: 30, playedColor: '#7aa2ff',
  shape: 'LINE', bars: 48, minHz: 40, maxHz: 14000, reverse: false, mirror: false, angle: 0, length: 800, radius: 120, startAngle: 0,
  thickness: 160, minLen: 2, barWidth: 0.6, roundness: 0, attackMs: 15, releaseMs: 180, floorDb: -70, ceilDb: -25,
  colorMode: 'SOLID', color: '#e6e6e6', colorB: '#7aa2ff', opacity: 1, glow: 0,
});

/** Bảng đặc trưng trong `Derived` + offset (giây; dương = âm thanh trễ so với dự án, như audioOffsetMs). */
export interface DerivedAudio { features: AudioFeatures; offsetSec: number }

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
/** Gradient của cột: trộn sRGB (như trước), giữ alpha khi mã có `#rrggbbaa`. */
const mix = (a: string, b: string, k: number): string => mixHexRgb(a, b, k);

/** Giá trị mượt (0..255, kiểu số thực) của mọi dải tại khung `f`: bám lên theo attack, xuống theo release; đọc ngược tối đa ~6 hằng số thời gian. */
export function smoothedBands(ft: AudioFeatures, f: number, attackMs: number, releaseMs: number): Float64Array {
  const out = new Float64Array(ft.bands);
  if (f < 0) return out;
  const hopMs = ft.hop * 1000, tau = Math.max(attackMs, releaseMs, hopMs);
  const K = Math.min(f, Math.min(400, Math.ceil(6 * tau / hopMs)));
  const aA = attackMs <= 0 ? 1 : 1 - Math.exp(-hopMs / attackMs), aR = releaseMs <= 0 ? 1 : 1 - Math.exp(-hopMs / releaseMs);
  const first = (f - K) * ft.bands;
  for (let b = 0; b < ft.bands; b++) {
    let y = ft.spectrum[first + b];
    for (let i = f - K + 1; i <= f; i++) { const x = ft.spectrum[i * ft.bands + b]; y += (x - y) * (x > y ? aA : aR); }
    out[b] = y;
  }
  return out;
}

/** Gộp các dải log của bảng thành `n` cột trong [minHz, maxHz]: lấy lớn nhất trong khoảng; khoảng hẹp hơn một dải thì nội suy tuyến tính. */
const mel = (hz: number) => 2595 * Math.log10(1 + hz / 700), melHz = (m: number) => 700 * (10 ** (m / 2595) - 1);
/** Biên tần số (Hz) thứ `k`/`n` giữa minHz và maxHz theo thang. */
export function scaleEdge(scale: FreqScale, minHz: number, maxHz: number, k: number, n: number): number {
  const u = k / n;
  if (scale === 'LINEAR') return minHz + (maxHz - minHz) * u;
  if (scale === 'MEL') return melHz(mel(minHz) + (mel(maxHz) - mel(minHz)) * u);
  return minHz * Math.pow(maxHz / minHz, u);
}
export function poolBands(bands: Float64Array, ft: Pick<AudioFeatures, 'minHz' | 'maxHz' | 'bands'>, n: number, minHz: number, maxHz: number, scale: FreqScale = 'LOG'): Float64Array {
  const B = ft.bands, span = Math.log(ft.maxHz / ft.minHz);
  const pos = (hz: number) => Math.min(B, Math.max(0, Math.log(Math.max(hz, 1e-6) / ft.minHz) / span * B));
  const out = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    const a = pos(scaleEdge(scale, minHz, maxHz, j, n)), b = Math.max(a + 1e-6, pos(scaleEdge(scale, minHz, maxHz, j + 1, n)));
    if (b - a < 1) { // nội suy giữa tâm các dải
      const c = (a + b) / 2 - 0.5, i0 = Math.min(B - 1, Math.max(0, Math.floor(c))), i1 = Math.min(B - 1, i0 + 1), k = clamp01(c - i0);
      out[j] = lerp(bands[i0], bands[i1], k);
    } else {
      let m = 0;
      for (let i = Math.floor(a); i < Math.min(B, Math.ceil(b)); i++) if (bands[i] > m) m = bands[i];
      out[j] = m;
    }
  }
  return out;
}

/** Mức 0..1 của từng cột tại `t` (trục thời gian dự án). Không có âm thanh → toàn 0. */
export function spectrumLevels(p: SpectrumProps, audio: Derived['audio'], t: number): Float64Array {
  const out = new Float64Array(p.bars);
  if (!audio) return out;
  const ft = audio.features, f = frameAt(ft, t - audio.offsetSec);
  if (f < 0) return out;
  const pooled = poolBands(smoothedBands(ft, f, p.attackMs, p.releaseMs), ft, p.bars, p.minHz, p.maxHz, p.scale);
  const lo = p.floorDb, hi = Math.max(p.ceilDb, lo + 1);
  for (let j = 0; j < p.bars; j++) out[j] = pooled[j] <= 0 ? 0 : clamp01((u8ToDb(pooled[j]) - lo) / (hi - lo));
  return out;
}

function bar(cx: number, cy: number, w: number, h: number, rot: number, fill: string, p: SpectrumProps): RectPrim {
  const r = p.roundness > 0 ? p.roundness * Math.min(w, h) / 2 : 0;
  const prim: RectPrim = { kind: 'rect', x: cx - w / 2, y: cy - h / 2, w, h, fill, alpha: p.opacity, radius: r, glowColor: fill, glowBlur: p.glow > 0 ? p.glow * 24 : 0, stroke: '', strokeWidth: 0 };
  if (rot !== 0) prim.rotation = rot;
  return prim;
}

export function spectrumPrims(p: SpectrumProps, W: number, H: number, levels: ArrayLike<number>): Primitive[] {
  const out: Primitive[] = [], N = p.bars, cx = W / 2, cy = H / 2, rad = Math.PI / 180;
  const lenOf = (v: number) => p.minLen + v * Math.max(0, p.thickness - p.minLen);
  const colorOf = (j: number) => (p.colorMode === 'GRADIENT' ? mix(p.color, p.colorB, N > 1 ? j / (N - 1) : 0) : p.color);
  if (p.shape === 'LINE') {
    const th = p.angle * rad, ux = Math.cos(th), uy = Math.sin(th), gx = Math.sin(th), gy = -Math.cos(th); // u: dọc đường; g: phía cột mọc
    const pitch = p.length / N, w = Math.max(0.5, pitch * p.barWidth);
    const base = p.mirror ? 0 : p.thickness / 2; // đặt cả hình quanh tâm khung: khi cột chỉ mọc một phía, đường nền lùi nửa độ cao về phía ngược chiều mọc
    for (let j = 0; j < N; j++) {
      const k = p.reverse ? N - 1 - j : j, s = -p.length / 2 + (j + 0.5) * pitch, L = lenOf(levels[k]);
      const along = p.mirror ? 0 : L / 2;
      out.push(bar(cx + ux * s - gx * base + gx * along, cy + uy * s - gy * base + gy * along, w, L, p.angle, colorOf(k), p));
    }
  } else {
    const w = Math.max(0.5, 2 * Math.PI * Math.max(1, p.radius) / N * p.barWidth);
    for (let j = 0; j < N; j++) {
      const frac = (j + 0.5) / N; // vị trí quanh vòng
      const idx = p.mirror ? Math.min(N - 1, Math.floor((frac < 0.5 ? frac * 2 : (1 - frac) * 2) * N)) : j;
      const k = p.reverse ? N - 1 - idx : idx, L = lenOf(levels[k]);
      const phi = p.startAngle + frac * 360, dx = Math.sin(phi * rad), dy = -Math.cos(phi * rad), mid = p.radius + L / 2;
      out.push(bar(cx + dx * mid, cy + dy * mid, w, L, phi, colorOf(k), p));
    }
  }
  return out;
}

// ───────────── kiểu hiển thị khác (T-53) ─────────────
const MAX_SCOPE_POINTS = 512, HOLD_SEC = 1.5;
/** Điểm trên hình: LINE = vị trí `frac` dọc đường, lệch `out` (pt) về phía cột mọc; CIRCLE = góc `frac` quanh vòng, cách tâm radius + out. */
function placer(p: SpectrumProps, W: number, H: number) {
  const cx = W / 2, cy = H / 2, rad = Math.PI / 180;
  if (p.shape === 'CIRCLE') return (frac: number, out: number): [number, number] => { const phi = (p.startAngle + frac * 360) * rad; return [cx + Math.sin(phi) * (p.radius + out), cy - Math.cos(phi) * (p.radius + out)]; };
  const th = p.angle * rad, ux = Math.cos(th), uy = Math.sin(th), gx = Math.sin(th), gy = -Math.cos(th), base = p.mirror ? 0 : p.thickness / 2;
  return (frac: number, out: number): [number, number] => { const sAl = -p.length / 2 + frac * p.length; return [cx + ux * sAl - gx * base + gx * out, cy + uy * sAl - gy * base + gy * out]; };
}
/** Đường/vùng bằng PathPrim (cùng primitive với Bản nhạc): k = 0 tô, 1 nét. */
function poly(pts: [number, number][], closed: boolean, fill: boolean, color: string, p: SpectrumProps, lw = 2): PathPrim {
  const d: number[] = [];
  pts.forEach(([x, y], i) => d.push(i ? 1 : 0, x, y));
  if (closed) d.push(4);
  const prim: PathPrim = { kind: 'path', item: { o: -1, k: fill ? 0 : 1, d, lw, cap: 1 }, glyphs: [], color, alpha: p.opacity, tx: 0, ty: 0, s: 1 };
  if (p.glow > 0) prim.glow = { mode: 'SOFT', color, width: p.glow * 24, alpha: 0.8 };
  return prim;
}
/** Quãng đỉnh đã rơi (phần thang) sau `dt` giây kể từ khi đạt: đứng yên `peakHold` giây, rồi rơi với vận tốc đầu `capFall` và gia tốc `peakGravity`. */
export function peakDrop(p: Pick<SpectrumProps, 'capFall' | 'peakHold' | 'peakGravity'>, dt: number): number {
  const s = dt - Math.max(0, p.peakHold || 0);
  return s <= 0 ? 0 : p.capFall * s + 0.5 * Math.max(0, p.peakGravity || 0) * s * s;
}
/** Chấm đỉnh rơi chậm (tất định, không giữ trạng thái giữa các khung): đỉnh của từng cột là lớn nhất của (mức thô tại khung trước đó − quãng đã rơi từ khung đó tới t),
 *  xét trong cửa sổ ~1,5 s + `peakHold` trước t. Dùng mức thô (không làm mượt) của từng khung. Mặc định (giữ 0, gia tốc 0) đúng như trước T-130. */
export function peakCaps(p: SpectrumProps, audio: Derived['audio'], t: number): Float64Array {
  const out = new Float64Array(p.bars);
  if (!audio) return out;
  const ft = audio.features, f = frameAt(ft, t - audio.offsetSec);
  if (f < 0) return out;
  const plain = !(p.peakHold > 0) && !(p.peakGravity > 0);
  const K = Math.min(f, Math.round((HOLD_SEC + Math.max(0, p.peakHold || 0)) / ft.hop)), lo = p.floorDb, hi = Math.max(p.ceilDb, lo + 1), row = new Float64Array(ft.bands);
  for (let k = 0; k <= K; k++) {
    const drop = plain ? p.capFall * k * ft.hop : peakDrop(p, k * ft.hop); // rơi đều không giữ: cùng thứ tự phép nhân như trước T-130 (khớp từng bit)
    if (drop >= 1) break; // mức ≤ 1 nên mọi khung xa hơn chỉ cho giá trị ≤ 0 (quãng rơi tăng dần theo k)
    const g = f - k;
    for (let b = 0; b < ft.bands; b++) row[b] = ft.spectrum[g * ft.bands + b];
    const pooled = poolBands(row, ft, p.bars, p.minHz, p.maxHz, p.scale);
    for (let j = 0; j < p.bars; j++) { const v = (pooled[j] <= 0 ? 0 : clamp01((u8ToDb(pooled[j]) - lo) / (hi - lo))) - drop; if (v > out[j]) out[j] = v; }
  }
  return out;
}
/** Mẫu dạng sóng (−1…1) trong cửa sổ `scopeMs` kết thúc tại t; bảng cũ không có `scope` → rỗng. */
export function scopeSamples(p: SpectrumProps, audio: Derived['audio'], t: number): Float64Array {
  const ft = audio?.features;
  if (!ft?.scope || !ft.scopeRate) return new Float64Array(0);
  const rate = ft.scopeRate, end = Math.floor((t - audio!.offsetSec) * rate), n = Math.max(2, Math.round((p.scopeMs / 1000) * rate)), m = Math.min(MAX_SCOPE_POINTS, n);
  const out = new Float64Array(m);
  for (let i = 0; i < m; i++) { const k = end - n + Math.floor((i * n) / m); out[i] = k >= 0 && k < ft.scope.length ? ft.scope[k] / 127 : 0; }
  return out;
}
const waveCache = new WeakMap<AudioFeatures, Map<number, Float64Array>>();
/** Bao sóng cả bài chia `n` cột (biên độ tuyến tính 0..1 từ đỉnh mỗi khung), đệm theo bảng đặc trưng. */
export function waveformColumns(ft: AudioFeatures, n: number): Float64Array {
  let m = waveCache.get(ft); if (!m) waveCache.set(ft, m = new Map());
  const hit = m.get(n); if (hit) return hit;
  const out = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    const a = Math.floor((j * ft.frames) / n), b = Math.max(a + 1, Math.floor(((j + 1) * ft.frames) / n));
    let v = 0; for (let f = a; f < Math.min(b, ft.frames); f++) if (ft.peak[f] > v) v = ft.peak[f];
    out[j] = v <= 0 ? 0 : Math.pow(10, u8ToDb(v) / 20);
  }
  m.set(n, out);
  return out;
}
/** Đồng hồ: đỉnh, RMS (0..1 theo sàn/trần dB) tại t và đỉnh giữ trong ~1,5 s. */
export function meterLevels(p: SpectrumProps, audio: Derived['audio'], t: number): { peak: number; rms: number; hold: number } {
  if (!audio) return { peak: 0, rms: 0, hold: 0 };
  const ft = audio.features, f = frameAt(ft, t - audio.offsetSec);
  if (f < 0) return { peak: 0, rms: 0, hold: 0 };
  const lo = p.floorDb, hi = Math.max(p.ceilDb, lo + 1), lv = (u: number) => (u <= 0 ? 0 : clamp01((u8ToDb(u) - lo) / (hi - lo)));
  let hold = 0; for (let k = 0, K = Math.min(f, Math.round(HOLD_SEC / ft.hop)); k <= K; k++) hold = Math.max(hold, lv(ft.peak[f - k]));
  return { peak: lv(ft.peak[f]), rms: lv(ft.rms[f]), hold };
}

/** Chấm đỉnh của kiểu Cột/Chấm (cả hình Thẳng lẫn Tròn): LINE = vạch dày 2 pt ngang bề rộng cột, nằm ngay trên đỉnh;
 *  DOT = chấm tròn đường kính bằng bề rộng cột, lơ lửng trên đỉnh. Màu `peakColor`, rỗng thì theo màu cột. */
function capPrims(p: SpectrumProps, audio: Derived['audio'], t: number, at: ReturnType<typeof placer>, lenOf: (v: number) => number, colorOf: (j: number) => string): RectPrim[] {
  const N = p.bars, caps = peakCaps(p, audio, t), out: RectPrim[] = [];
  const pitch = p.shape === 'CIRCLE' ? (2 * Math.PI * Math.max(1, p.radius)) / N : p.length / N, w = Math.max(0.5, pitch * p.barWidth), dot = p.peakStyle === 'DOT';
  const ring = p.shape === 'CIRCLE' && p.mirror && p.style === 'BARS'; // khớp cách spectrumPrims soi gương cột quanh vòng
  for (let j = 0; j < N; j++) {
    const f0 = (j + 0.5) / N, idx = ring ? Math.min(N - 1, Math.floor((f0 < 0.5 ? f0 * 2 : (1 - f0) * 2) * N)) : j, k = p.reverse ? N - 1 - idx : idx;
    if (caps[k] <= 0) continue;
    const fr = f0, [x, y] = at(fr, lenOf(caps[k]) + (dot ? w / 2 + 2 : 2)), fill = p.peakColor || colorOf(k);
    out.push(dot ? bar(x, y, w, w, 0, fill, { ...p, roundness: 1 }) : bar(x, y, w, 2, p.shape === 'CIRCLE' ? p.startAngle + fr * 360 : p.angle, fill, { ...p, roundness: 0 }));
  }
  return out;
}

export function styledPrims(p: SpectrumProps, W: number, H: number, audio: Derived['audio'], t: number): Primitive[] {
  const N = p.bars, at = placer(p, W, H), lenOf = (v: number) => p.minLen + v * Math.max(0, p.thickness - p.minLen);
  const colorOf = (j: number) => (p.colorMode === 'GRADIENT' ? mix(p.color, p.colorB, N > 1 ? j / (N - 1) : 0) : p.color);
  const frac = (j: number) => (p.reverse ? 1 - (j + 0.5) / N : (j + 0.5) / N);
  const lw = Math.max(1, p.barWidth * 4);
  switch (p.style) {
    case 'AREA': case 'LINE': case 'DOTS': {
      const lv = spectrumLevels(p, audio, t), out: Primitive[] = [];
      const pts: [number, number][] = Array.from({ length: N }, (_, j) => at(frac(j), lenOf(lv[j])));
      if (p.style === 'DOTS') {
        const pitch = p.shape === 'CIRCLE' ? (2 * Math.PI * Math.max(1, p.radius)) / N : p.length / N, d = Math.max(1, pitch * p.barWidth);
        pts.forEach(([x, y], j) => out.push(bar(x, y, d, d, 0, colorOf(j), { ...p, roundness: 1 })));
        if (p.mirror && p.shape === 'LINE') lv.forEach((v, j) => { const [x, y] = at(frac(j), -lenOf(v)); out.push(bar(x, y, d, d, 0, colorOf(j), { ...p, roundness: 1 })); });
        if (p.peakCap) out.push(...capPrims(p, audio, t, at, lenOf, colorOf));
      } else if (p.style === 'LINE') {
        out.push(poly(pts, p.shape === 'CIRCLE', false, p.color, p, lw));
        if (p.mirror && p.shape === 'LINE') out.push(poly(Array.from(lv, (v, j) => at(frac(j), -lenOf(v))), false, false, p.color, p, lw));
      } else if (p.shape === 'CIRCLE') {
        const inner = Array.from({ length: N }, (_, j) => at(frac(N - 1 - j), 0));
        out.push(poly([...pts, pts[0], inner[0], ...inner], true, true, p.color, p));
      } else {
        // đường nền: từ đầu tới cuối theo thứ tự các điểm (đảo chiều thì từ phải sang trái); đối xứng thì đáy là các điểm soi gương
        const start = at(p.reverse ? 1 : 0, 0), end = at(p.reverse ? 0 : 1, 0);
        const low: [number, number][] = p.mirror ? Array.from(lv, (v, j) => at(frac(j), -lenOf(v))).reverse() : [end];
        out.push(poly(p.mirror ? [...pts, ...low] : [start, ...pts, ...low], true, true, p.color, p));
      }
      return out;
    }
    case 'OSCILLOSCOPE': {
      const sm = scopeSamples(p, audio, t), half = p.thickness / 2;
      if (!sm.length) return [poly([at(0, 0), at(1, 0)], p.shape === 'CIRCLE', false, p.color, p, lw)];
      const pts = Array.from(sm, (v, i) => at(sm.length > 1 ? i / (sm.length - 1) : 0, (p.shape === 'CIRCLE' || p.mirror ? 0 : half) + v * half));
      return [poly(pts, p.shape === 'CIRCLE', false, p.color, p, lw)];
    }
    case 'WAVEFORM': {
      const ft = audio?.features, out: Primitive[] = [];
      if (!ft || !ft.frames) return out;
      const cols = waveformColumns(ft, N), audioDur = ft.frames * ft.hop, playedFrac = clamp01((t - audio!.offsetSec) / Math.max(audioDur, 1e-6));
      const pitch = p.shape === 'CIRCLE' ? (2 * Math.PI * Math.max(1, p.radius)) / N : p.length / N, w = Math.max(0.5, pitch * p.barWidth);
      for (let j = 0; j < N; j++) {
        const fr = (j + 0.5) / N, L = lenOf(cols[j]), played = fr <= playedFrac;
        const [x, y] = at(fr, p.mirror || p.shape === 'CIRCLE' ? 0 : L / 2);
        const rot = p.shape === 'CIRCLE' ? p.startAngle + fr * 360 : p.angle;
        const [cx2, cy2] = p.shape === 'CIRCLE' ? at(fr, L / 2) : [x, y];
        out.push(bar(cx2, cy2, w, p.mirror && p.shape === 'LINE' ? L * 2 : L, rot, played ? p.playedColor : p.color, p));
      }
      if (p.shape === 'LINE') { const [x, y] = at(playedFrac, p.mirror ? 0 : p.thickness / 2); out.push(bar(x, y, 2, p.mirror ? p.thickness * 2 : p.thickness, p.angle, p.playedColor, { ...p, glow: 0, roundness: 0 })); }
      return out;
    }
    case 'METER': {
      // Hai thanh song song dọc đường (đồng hồ luôn theo hình LINE): đỉnh ở nửa trên, RMS ở nửa dưới; vạch giữ đỉnh màu `playedColor`.
      const m = meterLevels(p, audio, t), half = Math.max(1, p.thickness / 2 - 2), out: Primitive[] = [];
      const on = placer({ ...p, shape: 'LINE', mirror: true }, W, H);
      const seg = (v: number, off: number, color: string) => { if (v <= 0) return; const [x, y] = on(v / 2, off); out.push(bar(x, y, v * p.length, half, p.angle, color, p)); };
      seg(m.peak, p.thickness / 4, colorOf(N - 1));
      seg(m.rms, -p.thickness / 4, colorOf(0));
      if (m.hold > 0) { const [x, y] = on(m.hold, p.thickness / 4); out.push(bar(x, y, 2, half, p.angle, p.playedColor, { ...p, glow: 0, roundness: 0 })); }
      return out;
    }
    default: {
      const lv = spectrumLevels(p, audio, t), out = spectrumPrims(p, W, H, lv);
      if (p.peakCap) out.push(...capPrims(p, audio, t, at, lenOf, colorOf));
      return out;
    }
  }
}

export const spectrumRenderer: WidgetRenderer<SpectrumProps> = {
  type: 'AUDIO_SPECTRUM',
  layout({ derived }: LayoutCtx, spec: WidgetSpec<SpectrumProps>, t: number) {
    return styledPrims({ ...DEFAULT_SPECTRUM, ...spec.properties }, spec.layout.width, spec.layout.height, derived.audio, t);
  },
};
