// Phân tích nhạc từ nốt (T-83): nhóm nhịp tính bằng móc kép (16 ghi), bậc của nốt bass so với nốt chủ, độ dài theo phân số nốt đen, tên cao độ.
// Hàm thuần trên dữ liệu nốt (tick), không cần phân tích âm thanh. Nhạc lệch lưới thì giữ số lẻ, không làm tròn thầm lặng.
import type { TrackIndex } from './notes.ts';

export const RECENT_ONSETS = 8;
/** Một thời điểm có nốt bắt đầu (các nốt cùng tick gộp một): nốt thấp nhất và độ dài lớn nhất (tick). */
export interface Onset { tick: number; time: number; bass: number; len: number }

const upper = (arr: { startTimeSeconds: number }[], t: number): number => {
  let lo = 0, hi = arr.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m].startTimeSeconds <= t) lo = m + 1; else hi = m; }
  return lo;
};

/** Tối đa `count` thời điểm có nốt bắt đầu gần nhất tại hoặc trước `t`, thứ tự thời gian tăng dần. Gộp mọi track được đưa vào. */
export function recentOnsets(tracks: readonly TrackIndex[], t: number, count = RECENT_ONSETS + 1): Onset[] {
  const byTick = new Map<number, Onset>();
  for (const ti of tracks) {
    const hi = upper(ti.notes, t);
    // mỗi track chỉ cần `count` thời điểm gần nhất; lấy dư số nốt vì hợp âm có nhiều nốt cùng tick
    let seen = 0, lastTick = NaN;
    for (let i = hi - 1; i >= 0; i--) {
      const n = ti.notes[i];
      if (n.startTick !== lastTick) { if (++seen > count) break; lastTick = n.startTick; }
      const len = n.endTick - n.startTick, o = byTick.get(n.startTick);
      if (!o) byTick.set(n.startTick, { tick: n.startTick, time: n.startTimeSeconds, bass: n.pitch, len });
      else { if (n.pitch < o.bass) o.bass = n.pitch; if (len > o.len) o.len = len; }
    }
  }
  return [...byTick.values()].sort((a, b) => a.tick - b.tick).slice(-count);
}

/** Khoảng cách giữa các thời điểm liên tiếp, đơn vị móc kép (1/16 ô nhịp 4/4 = ppq/4 tick). Rỗng nếu dưới 2 thời điểm. */
export const ioiSixteenths = (onsets: readonly Onset[], ppq: number): number[] =>
  onsets.slice(1).map((o, i) => (o.tick - onsets[i].tick) / (ppq / 4));
/** Số móc kép dạng chữ: nguyên khi khớp lưới (sai số < 0,05), còn lại một chữ số thập phân (nhạc lệch lưới). */
export const formatUnits = (u: number): string => (Math.abs(u - Math.round(u)) < 0.05 ? String(Math.round(u)) : (Math.round(u * 10) / 10).toFixed(1));

const DEGREES = ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7'] as const;
export const PITCH_CLASSES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'] as const;
/** Bậc của `pitch` (MIDI) so với nốt chủ `tonic` (0 = C … 11 = B): 1, ♭2, 2, ♭3, 3, 4, ♭5, 5, ♭6, 6, ♭7, 7. */
export const degreeName = (pitch: number, tonic: number): string => DEGREES[(((pitch - tonic) % 12) + 12) % 12];
export const pitchClassName = (pitch: number): string => PITCH_CLASSES[((pitch % 12) + 12) % 12];

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
const DENOMS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32] as const;
/** Độ dài `ticks` theo phân số nốt đen: "1/2", "3/4", "1", "3/2", "1/3"; không biểu diễn đúng bằng mẫu số thường dùng thì số thập phân 2 chữ số. */
export function quarterFraction(ticks: number, ppq: number): string {
  if (!(ticks > 0) || !(ppq > 0)) return '0';
  const q = ticks / ppq;
  for (const d of DENOMS) {
    const n = Math.round(q * d);
    if (n > 0 && Math.abs(q * d - n) < 1e-6 * d) { const g = gcd(n, d); return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`; }
  }
  return (Math.round(q * 100) / 100).toFixed(2);
}
