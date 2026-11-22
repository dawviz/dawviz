// T-53: FFT, dải log, đỉnh/RMS; kết quả không phụ thuộc cách chia khối.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMono, createSpectralAccumulator, fft, frameAt, u8ToDb, dbToU8, DEFAULT_ANALYSIS, type AudioFeatures } from '../src/index.ts';

const SR = 48000;
const sine = (hz: number, sec: number, amp = 0.5) => Float32Array.from({ length: Math.round(SR * sec) }, (_, i) => amp * Math.sin(2 * Math.PI * hz * i / SR));
const bandOf = (f: AudioFeatures, hz: number) => Math.round(Math.log(hz / f.minHz) / Math.log(f.maxHz / f.minHz) * f.bands - 0.5);
const argmax = (f: AudioFeatures, frame: number) => { let best = 0; for (let b = 1; b < f.bands; b++) if (f.spectrum[frame * f.bands + b] > f.spectrum[frame * f.bands + best]) best = b; return best; };

test('FFT: sin đúng bin cho đỉnh đúng bin; năng lượng khớp Parseval', () => {
  const n = 256, re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < n; i++) re[i] = Math.sin(2 * Math.PI * 8 * i / n);
  const e0 = re.reduce((s, x) => s + x * x, 0); fft(re, im);
  let k = 0; for (let i = 1; i < n / 2; i++) if (Math.hypot(re[i], im[i]) > Math.hypot(re[k], im[k])) k = i;
  assert.equal(k, 8);
  const e1 = re.reduce((s, x, i) => s + x * x + im[i] * im[i], 0) / n; assert.ok(Math.abs(e0 - e1) < 1e-6);
});

test('thang dB: 0..255 ↔ −80..0, kẹp hai đầu', () => {
  assert.equal(dbToU8(0), 255); assert.equal(dbToU8(-80), 0); assert.equal(dbToU8(-200), 0); assert.equal(dbToU8(6), 255);
  assert.ok(Math.abs(u8ToDb(dbToU8(-20)) - -20) < 0.2);
});

test('sin 1 kHz: dải mạnh nhất nằm đúng quanh 1 kHz, mức ≈ biên độ (−6 dBFS cho 0,5)', () => {
  const f = analyzeMono(sine(1000, 1), SR);
  assert.equal(f.bands, DEFAULT_ANALYSIS.bands); assert.equal(f.hopSamples, 480); assert.equal(f.frames, 101); // 1 s / 10 ms + khung 0
  const mid = 50, b = argmax(f, mid), target = bandOf(f, 1000);
  assert.ok(Math.abs(b - target) <= 1, `dải ${b} vs ${target}`);
  const db = u8ToDb(f.spectrum[mid * f.bands + b]); assert.ok(db > -9 && db < -3, `${db} dB`);
  assert.ok(Math.abs(u8ToDb(f.peak[mid]) - -6.02) < 0.5); assert.ok(Math.abs(u8ToDb(f.rms[mid]) - -9.03) < 0.5);
  // xa 1 kHz thì yếu: dải ~ 8 kHz thấp hơn ít nhất 40 dB
  assert.ok(u8ToDb(f.spectrum[mid * f.bands + b]) - u8ToDb(f.spectrum[mid * f.bands + bandOf(f, 8000)]) > 40);
});

test('hai tần số khác nhau cho hai dải khác nhau theo đúng thứ tự (thang log)', () => {
  const lo = analyzeMono(sine(100, 0.5), SR), hi = analyzeMono(sine(5000, 0.5), SR);
  assert.ok(argmax(lo, 20) < argmax(hi, 20)); assert.ok(Math.abs(argmax(lo, 20) - bandOf(lo, 100)) <= 2);
});

test('im lặng → 0 ở mọi nơi; khung đầu và cuối có dữ liệu hữu hạn', () => {
  const f = analyzeMono(new Float32Array(SR / 2), SR);
  assert.ok(f.spectrum.every((v) => v === 0) && f.peak.every((v) => v === 0) && f.rms.every((v) => v === 0));
});

test('kết quả không phụ thuộc cách chia khối', () => {
  const x = sine(440, 1.3, 0.7); for (let i = 0; i < x.length; i += 97) x[i] += 0.1 * Math.sin(i);
  const whole = analyzeMono(x, SR);
  for (const chunk of [1, 333, 4096, 100000]) {
    const a = createSpectralAccumulator(SR);
    for (let p = 0; p < x.length; p += chunk) a.push(x.subarray(p, Math.min(x.length, p + chunk)));
    const r = a.finish();
    assert.equal(r.frames, whole.frames, `chunk ${chunk}`); assert.deepEqual(r.spectrum, whole.spectrum); assert.deepEqual(r.peak, whole.peak); assert.deepEqual(r.rms, whole.rms);
  }
});

test('bảng rỗng (không mẫu) và frameAt', () => {
  const e = analyzeMono(new Float32Array(0), SR); assert.equal(frameAt(e, 1), -1);
  const f = analyzeMono(sine(440, 1), SR);
  assert.equal(frameAt(f, -0.1), -1); assert.equal(frameAt(f, 0), 0); assert.equal(frameAt(f, 0.5), 50); assert.equal(frameAt(f, 99), f.frames - 1);
});

test('FFT thực (N/2 phức) + dồn bộ đệm thưa: bảng giống hệt cách tính tham chiếu (FFT phức cỡ N, hypot), mọi cách chia khối', () => {
  const sr = 8000, n = sr * 3, x = new Float32Array(n);
  let s = 7; const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296 - 0.5);
  for (let i = 0; i < n; i++) x[i] = Math.sin(i * 0.21) * 0.4 + Math.sin(i * 0.013) * 0.2 + rnd() * 0.3;
  const f = analyzeMono(x, sr);
  // tham chiếu: khung i dùng mẫu [i·hop − N/2, i·hop + N/2), cửa sổ Hann, FFT phức cỡ N, |X| = hypot
  const N = 2048, H = N / 2, binHz = sr / N, edges = Array.from({ length: f.bands + 1 }, (_, b) => f.minHz * Math.pow(f.maxHz / f.minHz, b / f.bands));
  for (const i of [0, 1, 7, Math.floor(f.frames / 2), f.frames - 1]) {
    const re = new Float64Array(N), im = new Float64Array(N);
    for (let j = 0; j < N; j++) { const a = i * f.hopSamples - H + j; re[j] = (a >= 0 && a < n ? x[a] : 0) * (0.5 - 0.5 * Math.cos(2 * Math.PI * j / N)); }
    fft(re, im);
    const mag = Array.from({ length: H + 1 }, (_, k) => 4 * Math.hypot(re[k], im[k]) / N);
    for (let b = 0; b < f.bands; b++) {
      const lo = edges[b] / binHz, hi = edges[b + 1] / binHz;
      let m = 0;
      if (hi - lo < 1) { const c = (lo + hi) / 2, i0 = Math.min(H - 1, Math.floor(c)), fr = c - i0; m = mag[i0] * (1 - fr) + mag[i0 + 1] * fr; }
      else for (let k = Math.max(0, Math.ceil(lo)); k <= Math.min(H, Math.floor(hi)); k++) if (mag[k] > m) m = mag[k];
      assert.ok(Math.abs(f.spectrum[i * f.bands + b] - dbToU8(m > 1e-9 ? 20 * Math.log10(m) : -200)) <= 1, `khung ${i} dải ${b}`);
    }
  }
  for (const chunk of [1, 333, 4096, 50_000]) {
    const acc = createSpectralAccumulator(sr);
    for (let i = 0; i < n; i += chunk) acc.push(x.subarray(i, Math.min(n, i + chunk)));
    const g = acc.finish();
    assert.deepEqual([g.frames, Buffer.compare(g.spectrum, f.spectrum), Buffer.compare(g.peak, f.peak), Buffer.compare(g.rms, f.rms), Buffer.compare(Buffer.from(g.scope!.buffer), Buffer.from(f.scope!.buffer))], [f.frames, 0, 0, 0, 0], `khối ${chunk}`);
  }
});
