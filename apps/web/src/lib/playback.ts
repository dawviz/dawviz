// Kho đồng hồ phát nằm ngoài state của React (T-70): vòng requestAnimationFrame chỉ cập nhật kho này, và chỉ các phần
// thực sự cần `t` (canvas, thanh phát, số đo trên sân khấu, độ sáng hiện tại của track) đăng ký theo dõi nó.
// Nhờ vậy thanh trên, cột Video styles và inspector không vẽ lại mỗi khung hình. Logic thời gian vẫn là hàm thuần ở clock.ts.
import { useSyncExternalStore } from 'react';
import { advance, initialClock, seek, togglePlay, type ClockState } from './clock.ts';

export interface Playback {
  get(): ClockState;
  subscribe(fn: () => void): () => void;
  toggle(): void;
  seek(t: number): void;
  /** Lùi/tới một khoảng (giây), kẹp trong [0, thời lượng]. */
  nudge(dt: number): void;
  /** Nạp dự án mới: đặt thời lượng và quay về đầu, dừng phát. */
  reset(duration: number): void;
  dispose(): void;
}

type Frame = { request(cb: (now: number) => void): number; cancel(id: number): void; now(): number };
const browserFrame: Frame = {
  request: (cb) => requestAnimationFrame(cb),
  cancel: (id) => cancelAnimationFrame(id),
  now: () => performance.now(),
};

export function createPlayback(frame: Frame = browserFrame): Playback {
  let state = initialClock, duration = 0, raf = 0, last = 0;
  const subs = new Set<() => void>();
  const set = (next: ClockState) => {
    if (next === state || (next.t === state.t && next.playing === state.playing && next.rate === state.rate)) return;
    const wasPlaying = state.playing;
    state = next;
    subs.forEach((fn) => fn());
    if (state.playing && !wasPlaying) start();
    if (!state.playing && raf) { frame.cancel(raf); raf = 0; }
  };
  const tick = (now: number) => {
    const dt = (now - last) / 1000; last = now;
    raf = 0;
    set(advance(state, dt, duration));
    if (state.playing && !raf) raf = frame.request(tick);
  };
  const start = () => { last = frame.now(); raf = frame.request(tick); };
  return {
    get: () => state,
    subscribe(fn) { subs.add(fn); return () => { subs.delete(fn); }; },
    toggle: () => set(togglePlay(state, duration)),
    seek: (t) => set(seek(state, t, duration)),
    nudge: (dt) => set(seek(state, state.t + dt, duration)),
    reset(d) { duration = d; set({ ...initialClock }); },
    dispose() { if (raf) frame.cancel(raf); raf = 0; subs.clear(); },
  };
}

/** Theo dõi một phần của đồng hồ; chọn giá trị nguyên thuỷ (số, boolean) để chỉ vẽ lại khi nó đổi. */
export function usePlayback<T>(p: Playback, select: (s: ClockState) => T): T {
  return useSyncExternalStore(p.subscribe, () => select(p.get()), () => select(p.get()));
}
