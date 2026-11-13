// Đồng hồ phát: hàm thuần, kiểm thử được không cần DOM. Thời gian chỉ là số `t` (giây); khung hình là hàm của t (ARC-01).
export interface ClockState { t: number; playing: boolean; rate: number }
export const initialClock: ClockState = { t: 0, playing: false, rate: 1 };

/** `loop`: true = lặp cả bài; { start, end } = lặp một đoạn (T-08, qua `validLoop`). */
export function advance(s: ClockState, dtSeconds: number, duration: number, loop: boolean | { start: number; end: number } = false): ClockState {
  if (!s.playing || dtSeconds <= 0) return s;
  let t = s.t + dtSeconds * s.rate;
  if (typeof loop === 'object') {
    const len = loop.end - loop.start;
    if (t >= loop.end && len > 0) t = loop.start + ((t - loop.end) % len);
    else if (t >= duration) return { ...s, t: duration, playing: false };
  } else if (t >= duration) {
    if (loop && duration > 0) t = t % duration;
    else return { ...s, t: duration, playing: false };
  }
  return { ...s, t };
}
export const seek = (s: ClockState, t: number, duration: number): ClockState => ({ ...s, t: Math.min(Math.max(0, t), duration) });
export const togglePlay = (s: ClockState, duration: number): ClockState =>
  s.playing ? { ...s, playing: false } : { ...s, t: s.t >= duration ? 0 : s.t, playing: true };
