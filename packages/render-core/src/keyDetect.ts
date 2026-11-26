// Nhận diện giọng (P-04, Krumhansl–Schmuckler) và nốt chủ dùng để đọc bậc. Tách khỏi insight.ts để chỗ giữ dùng chung (hud.ts)
// và các widget (insight.ts, dashboard.ts) cùng dùng mà không vòng phụ thuộc. Hàm thuần trên chỉ mục nốt.
import { notesInRange, type TrackIndex } from './notes.ts';
import type { Derived } from './prims.ts';

const KS_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], KS_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const corr = (a: readonly number[], b: readonly number[]): number => {
  const ma = a.reduce((x, y) => x + y, 0) / a.length, mb = b.reduce((x, y) => x + y, 0) / b.length; let n = 0, da = 0, db = 0;
  for (let i = 0; i < a.length; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return da > 0 && db > 0 ? n / Math.sqrt(da * db) : 0;
};
/** Giọng tốt nhất của một biểu đồ 12 lớp cao độ (trọng số = độ dài nốt trong cửa sổ). `confidence` = hệ số tương quan Pearson (0–1). null nếu không đủ nốt. */
export function keyFromHistogram(h: readonly number[]): { tonic: number; minor: boolean; confidence: number } | null {
  if (h.filter((x) => x > 0).length < 3) return null;
  let best: { tonic: number; minor: boolean; confidence: number } | null = null;
  for (let tonic = 0; tonic < 12; tonic++) for (const minor of [false, true]) {
    const prof = minor ? KS_MINOR : KS_MAJOR, rot = h.map((_, i) => h[(i + tonic) % 12]), r = corr(rot, prof);
    if (!best || r > best.confidence + 1e-12) best = { tonic, minor, confidence: r };
  }
  return best && { ...best, confidence: Math.max(0, Math.min(1, best.confidence)) };
}
/** Giọng đang chạy tại t: biểu đồ lớp cao độ của các nốt chạm cửa sổ [t − windowSec, t]. */
export function keyAt(tracks: readonly TrackIndex[], t: number, windowSec: number) {
  const h = new Array(12).fill(0), t0 = Math.max(0, t - windowSec);
  for (const ti of tracks) for (const n of notesInRange(ti, t0, t)) {
    if (n.startTimeSeconds > t || (n.channel === 9)) continue;
    const a = Math.max(n.startTimeSeconds, t0), b = Math.min(n.endTimeSeconds, t);
    if (b > a) h[n.pitch % 12] += b - a;
  }
  return keyFromHistogram(h);
}
/** Nốt chủ dùng để đọc bậc: scene.tonic nếu đã đặt, không thì giọng nhận diện trong cửa sổ; chưa đủ nốt thì null. */
export function tonicAt(derived: Derived, tracks: readonly TrackIndex[], t: number, windowSec: number): number | null {
  if (derived.tonic !== undefined) return derived.tonic;
  return keyAt(tracks, t, windowSec)?.tonic ?? null;
}
