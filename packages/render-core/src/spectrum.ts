// Widget Audio Spectrum (T-53, REQ-WIDGET-07): MỘT widget, hai hình dạng — LINE (cột xếp thẳng theo một đường, xoay mọi góc 0–360°)
// và CIRCLE (cột toả quanh tâm). Mỗi hình có kích thước riêng (LINE: chiều dài đường + độ cao cột; CIRCLE: bán kính trong + độ dài cột).
// Layout là hàm thuần của (props, t, bảng đặc trưng): không FFT lúc vẽ. Chưa có âm thanh thì vẽ cột thấp nhất, để thấy chỗ đặt widget.
import type { Derived, LayoutCtx, Primitive, RectPrim, WidgetRenderer } from './prims.ts';
import type { WidgetSpec } from './scene.ts';
import { frameAt, u8ToDb, type AudioFeatures } from './audioFeatures.ts';

export interface SpectrumProps {
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
  shape: 'LINE', bars: 48, minHz: 40, maxHz: 14000, reverse: false, mirror: false, angle: 0, length: 800, radius: 120, startAngle: 0,
  thickness: 160, minLen: 2, barWidth: 0.6, roundness: 0, attackMs: 15, releaseMs: 180, floorDb: -70, ceilDb: -25,
  colorMode: 'SOLID', color: '#e6e6e6', colorB: '#7aa2ff', opacity: 1, glow: 0,
});

/** Bảng đặc trưng trong `Derived` + offset (giây; dương = âm thanh trễ so với dự án, như audioOffsetMs). */
export interface DerivedAudio { features: AudioFeatures; offsetSec: number }

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
function mix(a: string, b: string, k: number): string {
  const p = (h: string, s: number) => parseInt(h.slice(s, s + 2), 16);
  const c = (s: number) => Math.round(lerp(p(a, s), p(b, s), k)).toString(16).padStart(2, '0');
  return `#${c(1)}${c(3)}${c(5)}`;
}

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
export function poolBands(bands: Float64Array, ft: Pick<AudioFeatures, 'minHz' | 'maxHz' | 'bands'>, n: number, minHz: number, maxHz: number): Float64Array {
  const B = ft.bands, span = Math.log(ft.maxHz / ft.minHz);
  const pos = (hz: number) => Math.min(B, Math.max(0, Math.log(Math.max(hz, 1e-6) / ft.minHz) / span * B));
  const p0 = pos(minHz), p1 = Math.max(p0 + 1e-6, pos(maxHz)), out = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    const a = p0 + (p1 - p0) * j / n, b = p0 + (p1 - p0) * (j + 1) / n;
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
  const pooled = poolBands(smoothedBands(ft, f, p.attackMs, p.releaseMs), ft, p.bars, p.minHz, p.maxHz);
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

export const spectrumRenderer: WidgetRenderer<SpectrumProps> = {
  type: 'AUDIO_SPECTRUM',
  layout({ derived }: LayoutCtx, spec: WidgetSpec<SpectrumProps>, t: number) {
    return spectrumPrims(spec.properties, spec.layout.width, spec.layout.height, spectrumLevels(spec.properties, derived.audio, t));
  },
};
