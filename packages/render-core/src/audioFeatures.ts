// Phân tích âm thanh cho widget phổ (T-53, REQ-WIDGET-07). Hàm thuần, không DOM, không Web Audio: nhận PCM mono, trả bảng đặc trưng
// theo khung. Render Core chỉ ĐỌC bảng này theo `t` (không tự tính FFT trong lúc vẽ), nên Preview và Export dùng đúng cùng một bảng.
//
// Bảng: mỗi khung cách nhau `hop` giây; mỗi khung có `bands` dải tần chia đều theo thang LOG giữa `minHz` và `maxHz` (giá trị đã đổi sang dB
// rồi lượng tử 0..255 ứng với −80..0 dBFS) cùng đỉnh và RMS (cùng thang). Cửa sổ Hann 2048 mẫu, FFT cơ số 2 tự cài.

export const FFT_SIZE = 2048;
export const DB_FLOOR = -80;
export interface AudioFeatures {
  sampleRate: number;
  /** Số mẫu mỗi bước giữa hai khung và độ dài bước (giây). */
  hopSamples: number; hop: number;
  frames: number; bands: number;
  minHz: number; maxHz: number;
  /** frames × bands, 0..255 ↔ −80..0 dBFS; hàng `i` bắt đầu ở `i * bands`. */
  spectrum: Uint8Array;
  /** Đỉnh và RMS mỗi khung, cùng thang. */
  peak: Uint8Array; rms: Uint8Array;
  /** Dạng sóng thu nhỏ cho Oscilloscope (T-53): trung bình mỗi `scopeStep` mẫu, −127…127 (≈ 4 kHz). Vắng ở bảng cũ. */
  scope?: Int8Array; scopeRate?: number;
}
/** Tốc độ mẫu (Hz) xấp xỉ của bảng dạng sóng thu nhỏ. */
export const SCOPE_RATE = 4000;
export interface AnalysisOptions { bands?: number; minHz?: number; maxHz?: number; hopSamples?: number }
export const DEFAULT_ANALYSIS = Object.freeze({ bands: 128, minHz: 30, maxHz: 16000 });

/** dBFS → 0..255 (kẹp). */
export const dbToU8 = (db: number): number => Math.round(Math.min(1, Math.max(0, (db - DB_FLOOR) / -DB_FLOOR)) * 255);
export const u8ToDb = (v: number): number => DB_FLOOR + (v / 255) * -DB_FLOOR;
const toDb = (amp: number) => (amp > 1e-9 ? 20 * Math.log10(amp) : -200);

/** Bảng dùng lại cho mỗi cỡ FFT: hoán vị đảo bit và hệ số xoay cos/sin (tính trực tiếp, không truy hồi, nên chính xác hơn và không phụ thuộc thứ tự lặp). */
interface FftPlan { rev: Uint32Array; cos: Float64Array; sin: Float64Array }
const plans = new Map<number, FftPlan>();
function planFor(n: number): FftPlan {
  let p = plans.get(n);
  if (p) return p;
  const rev = new Uint32Array(n), bits = Math.log2(n);
  for (let i = 0; i < n; i++) { let r = 0; for (let b = 0, x = i; b < bits; b++, x >>= 1) r = (r << 1) | (x & 1); rev[i] = r; }
  const half = n >> 1, cos = new Float64Array(half), sin = new Float64Array(half);
  for (let k = 0; k < half; k++) { cos[k] = Math.cos(-2 * Math.PI * k / n); sin[k] = Math.sin(-2 * Math.PI * k / n); }
  plans.set(n, p = { rev, cos, sin });
  return p;
}

/** FFT cơ số 2 tại chỗ (re, im cùng độ dài, luỹ thừa của 2). */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length, { rev, cos, sin } = planFor(n);
  for (let i = 1; i < n; i++) { // đảo bit
    const j = rev[i];
    if (i < j) { const a = re[i]; re[i] = re[j]; re[j] = a; const b = im[i]; im[i] = im[j]; im[j] = b; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1, step = n / len; // hệ số xoay của tầng = bảng cỡ n lấy cách `step`
    for (let i = 0; i < n; i += len) {
      for (let k = 0, w = 0; k < half; k++, w += step) {
        const a = i + k, b = a + half, cr = cos[w], ci = sin[w];
        const xr = re[b] * cr - im[b] * ci, xi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - xr; im[b] = im[a] - xi; re[a] += xr; im[a] += xi;
      }
    }
  }
}

export interface SpectralAccumulator { push(mono: Float32Array): void; finish(): AudioFeatures }

/**
 * Bộ cộng dồn theo khối: kết quả KHÔNG phụ thuộc cách chia khối (khung `i` luôn dùng mẫu [i·hop − N/2, i·hop + N/2), ngoài tệp là 0),
 * nên gửi sang Worker từng khối 1 triệu mẫu hay cả bài đều cho cùng bảng.
 */
export function createSpectralAccumulator(sampleRate: number, opt: AnalysisOptions = {}): SpectralAccumulator {
  const bands = opt.bands ?? DEFAULT_ANALYSIS.bands, minHz = opt.minHz ?? DEFAULT_ANALYSIS.minHz;
  const nyquist = sampleRate / 2, maxHz = Math.min(opt.maxHz ?? DEFAULT_ANALYSIS.maxHz, nyquist * 0.98);
  const hopSamples = opt.hopSamples ?? Math.max(1, Math.round(sampleRate / 100)), N = FFT_SIZE, H = N / 2;
  const win = new Float64Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
  // Dải → khoảng bin [lo, hi] (thực): biên log giữa minHz và maxHz.
  const edges = Array.from({ length: bands + 1 }, (_, b) => minHz * Math.pow(maxHz / minHz, b / bands));
  const binHz = sampleRate / N;
  // FFT thực cỡ N qua FFT phức cỡ N/2: z[k] = x[2k] + i·x[2k+1], rồi tách phổ chẵn/lẻ (một nửa khối lượng so với FFT phức cỡ N).
  const zr = new Float64Array(H), zi = new Float64Array(H), mag = new Float64Array(H + 1), { cos: twr, sin: twi } = planFor(N);

  let spec = new Uint8Array(bands * 1024), pk = new Uint8Array(1024), rm = new Uint8Array(1024), frames = 0;
  let buf = new Float32Array(N * 4), base = 0, len = 0; // buf[0] là mẫu tuyệt đối `base`; `len` mẫu đang giữ
  let total = 0;
  // Dạng sóng thu nhỏ: trung bình từng nhóm `scopeStep` mẫu theo vị trí TUYỆT ĐỐI (không phụ thuộc cách chia khối).
  const scopeStep = Math.max(1, Math.round(sampleRate / SCOPE_RATE));
  let scope = new Int8Array(4096), sn = 0, sacc = 0, scnt = 0;
  const scopePush = (mono: Float32Array) => {
    for (let i = 0; i < mono.length; i++) {
      sacc += mono[i];
      if (++scnt === scopeStep) {
        if (sn === scope.length) { const g = new Int8Array(scope.length * 2); g.set(scope); scope = g; }
        scope[sn++] = Math.max(-127, Math.min(127, Math.round((sacc / scopeStep) * 127))); sacc = 0; scnt = 0;
      }
    }
  };
  const grow = () => {
    if (frames < pk.length) return;
    const n = pk.length * 2, s2 = new Uint8Array(bands * n); s2.set(spec); spec = s2;
    const p2 = new Uint8Array(n); p2.set(pk); pk = p2; const r2 = new Uint8Array(n); r2.set(rm); rm = r2;
  };
  const at = (abs: number) => { const k = abs - base; return k >= 0 && k < len ? buf[k] : 0; };
  const frame = () => {
    grow();
    const centre = frames * hopSamples, start = centre - H;
    // Chép cửa sổ (mẫu ngoài tệp là 0) thẳng vào z: chẵn → phần thực, lẻ → phần ảo. Cùng giá trị với at(start + i) · win[i].
    const k0 = start - base;
    for (let k = 0; k < H; k++) {
      const i = 2 * k, a = k0 + i, b = a + 1;
      zr[k] = a >= 0 && a < len ? buf[a] * win[i] : 0;
      zi[k] = b >= 0 && b < len ? buf[b] * win[i + 1] : 0;
    }
    fft(zr, zi);
    for (let k = 0; k <= H; k++) {
      const p = k === H ? 0 : k, q = k === 0 ? 0 : H - k; // Z[k mod H] và Z[(H − k) mod H]
      const er = (zr[p] + zr[q]) / 2, ei = (zi[p] - zi[q]) / 2, or = (zi[p] + zi[q]) / 2, oi = -(zr[p] - zr[q]) / 2;
      const wr = k === H ? -1 : twr[k], wi = k === H ? 0 : twi[k];
      const xr = er + wr * or - wi * oi, xi = ei + wr * oi + wi * or;
      mag[k] = 4 * Math.sqrt(xr * xr + xi * xi) / N; // sin đầy thang → ≈ 1
    }
    const row = frames * bands;
    for (let b = 0; b < bands; b++) {
      const lo = edges[b] / binHz, hi = edges[b + 1] / binHz;
      let m = 0;
      if (hi - lo < 1) { // dải hẹp hơn một bin: nội suy tuyến tính giữa hai bin quanh tâm dải
        const c = (lo + hi) / 2, i0 = Math.min(H - 1, Math.floor(c)), f = c - i0;
        m = mag[i0] * (1 - f) + mag[i0 + 1] * f;
      } else for (let k = Math.max(0, Math.ceil(lo)); k <= Math.min(H, Math.floor(hi)); k++) if (mag[k] > m) m = mag[k];
      spec[row + b] = dbToU8(toDb(m));
    }
    let p = 0, sq = 0, cnt = 0;
    const a = centre - (hopSamples >> 1), z = a + hopSamples;
    for (let i = a; i < z; i++) { const v = at(i); const av = Math.abs(v); if (av > p) p = av; sq += v * v; cnt++; }
    pk[frames] = dbToU8(toDb(p)); rm[frames] = dbToU8(toDb(Math.sqrt(sq / Math.max(1, cnt))));
    frames++;
  };
  /** Bỏ mẫu không còn cần cho khung kế (và các khung sau). */
  const trim = () => {
    const keepFrom = Math.min(frames * hopSamples - H, frames * hopSamples - (hopSamples >> 1)); // khung kế cần từ đây
    const drop = Math.max(0, Math.min(len, keepFrom - base));
    // Chỉ dồn khi phần bỏ đi ≥ nửa phần đang giữ: mỗi mẫu bị chép O(1) lần. Trước đây dồn sau MỖI khung (chép lại cả khối còn lại),
    // nên khối 1 triệu mẫu tốn ~O(n²) và chiếm 75% thời gian phân tích. Mẫu giữ lâu hơn không đổi kết quả (at/frame đọc theo `base`).
    if (drop > 0 && drop * 2 >= len) { buf.copyWithin(0, drop, len); base += drop; len -= drop; }
  };
  const drain = (final: boolean) => {
    for (;;) {
      const needEnd = frames * hopSamples + H;            // mẫu tuyệt đối cuối (không gồm) mà khung kế cần
      if (final ? total === 0 || frames * hopSamples >= total + 1 : needEnd > total) break;
      frame(); trim();
    }
  };
  return {
    push(mono) {
      if (len + mono.length > buf.length) { const g = new Float32Array(Math.max(buf.length * 2, len + mono.length)); g.set(buf.subarray(0, len)); buf = g; }
      buf.set(mono, len); len += mono.length; total += mono.length;
      scopePush(mono);
      drain(false);
    },
    finish() {
      drain(true);
      return { sampleRate, hopSamples, hop: hopSamples / sampleRate, frames, bands, minHz, maxHz,
        spectrum: spec.slice(0, frames * bands), peak: pk.slice(0, frames), rms: rm.slice(0, frames),
        scope: scope.slice(0, sn), scopeRate: sampleRate / scopeStep };
    },
  };
}

/** Chạy một lần trên cả bài (test, so sánh bit). */
export const analyzeMono = (mono: Float32Array, sampleRate: number, opt?: AnalysisOptions): AudioFeatures => {
  const a = createSpectralAccumulator(sampleRate, opt); a.push(mono); return a.finish();
};

/** Chỉ số khung ứng với thời điểm `sec` của TỆP ÂM THANH (kẹp trong bảng); −1 khi `sec` < 0 hoặc bảng rỗng. */
export const frameAt = (f: AudioFeatures, sec: number): number => (f.frames === 0 || sec < 0 ? -1 : Math.min(f.frames - 1, Math.floor(sec / f.hop + 1e-9)));
