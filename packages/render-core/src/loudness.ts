// Số đo âm thanh dạng chữ cho chỗ giữ dùng chung (tham chiếu bảng phân tích nhạc, T-108 phần làm được với một tệp mix):
// mức ngắn hạn (RMS trung bình công suất 400 ms), mức trung bình từ đầu bài tới t, đỉnh lớn nhất tới t, và tỉ lệ năng lượng trầm/trung/cao.
// ĐÂY LÀ dBFS TỪ RMS, KHÔNG PHẢI LUFS (chưa lọc K-weighting, chưa cổng tuyệt đối/tương đối của EBU R128): tài liệu ghi rõ.
// Hàm thuần, chỉ đọc bảng đặc trưng đã phân tích (DerivedAudio); không có âm thanh → null.
import { frameAt, u8ToDb, type AudioFeatures } from './audioFeatures.ts';
import type { DerivedAudio } from './spectrum.ts';

const pow = (u8: number) => 10 ** (u8ToDb(u8) / 10); // công suất tương đối (dB → lần)
const toDb = (p: number) => (p > 1e-12 ? 10 * Math.log10(p) : -Infinity);
/** Tổng tích luỹ công suất RMS và đỉnh lớn nhất tích luỹ theo khung: đệm theo bảng, tính một lần. */
const prefixMemo = new WeakMap<AudioFeatures, { sum: Float64Array; peak: Uint8Array }>();
function prefixOf(ft: AudioFeatures) {
  let m = prefixMemo.get(ft); if (m) return m;
  const sum = new Float64Array(ft.frames + 1), peak = new Uint8Array(ft.frames);
  for (let i = 0; i < ft.frames; i++) { sum[i + 1] = sum[i] + pow(ft.rms[i]); peak[i] = Math.max(i ? peak[i - 1] : 0, ft.peak[i]); }
  prefixMemo.set(ft, (m = { sum, peak })); return m;
}
export interface LevelReading { short: number; average: number; peak: number }
/** Mức tại t (dBFS, −∞ khi im lặng): `short` = trung bình công suất 400 ms gần nhất, `average` = từ đầu tới t, `peak` = đỉnh lớn nhất tới t. */
export function levelsAt(audio: DerivedAudio | undefined, t: number, shortSec = 0.4): LevelReading | null {
  if (!audio) return null;
  const ft = audio.features, f = frameAt(ft, t - audio.offsetSec);
  if (f < 0) return null;
  const { sum, peak } = prefixOf(ft), n = Math.max(1, Math.round(shortSec / ft.hop)), a = Math.max(0, f + 1 - n);
  return { short: toDb((sum[f + 1] - sum[a]) / (f + 1 - a)), average: toDb(sum[f + 1] / (f + 1)), peak: u8ToDb(peak[f]) };
}
/** Biên dải (Hz) cho trầm / trung / cao. */
export const LOW_HZ = 250, HIGH_HZ = 4000;
/** Tỉ lệ công suất (0–1) của dải trầm (< 250 Hz), trung, cao (> 4 kHz) trong 400 ms gần nhất; tổng = 1. Im lặng → cả ba 0. */
export function bandShareAt(audio: DerivedAudio | undefined, t: number, shortSec = 0.4): { low: number; mid: number; high: number } | null {
  if (!audio) return null;
  const ft = audio.features, f = frameAt(ft, t - audio.offsetSec);
  if (f < 0) return null;
  const n = Math.max(1, Math.round(shortSec / ft.hop)), span = Math.log(ft.maxHz / ft.minHz);
  let lo = 0, mid = 0, hi = 0;
  for (let b = 0; b < ft.bands; b++) {
    const hz = ft.minHz * Math.exp(span * (b + 0.5) / ft.bands); let s = 0;
    for (let i = Math.max(0, f + 1 - n); i <= f; i++) { const v = ft.spectrum[i * ft.bands + b]; if (v > 0) s += pow(v); }
    if (hz < LOW_HZ) lo += s; else if (hz > HIGH_HZ) hi += s; else mid += s;
  }
  const tot = lo + mid + hi;
  return tot > 0 ? { low: lo / tot, mid: mid / tot, high: hi / tot } : { low: 0, mid: 0, high: 0 };
}
/** Chữ dB một chữ số thập phân; −∞ khi im lặng. */
export const dbText = (db: number) => (Number.isFinite(db) && db > -120 ? db.toFixed(1) : '-∞');
