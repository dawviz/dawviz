// Kho đồng hồ phát nằm ngoài state của React (T-70): vòng requestAnimationFrame chỉ cập nhật kho này, và chỉ các phần
// thực sự cần `t` (canvas, thanh phát, số đo trên sân khấu, độ sáng hiện tại của track) đăng ký theo dõi nó.
// Nhờ vậy thanh trên, cột Video styles và inspector không vẽ lại mỗi khung hình. Logic thời gian vẫn là hàm thuần ở clock.ts.
import { useSyncExternalStore } from 'react';
import { advance, initialClock, seek, togglePlay, type ClockState } from './clock.ts';
import { createAudioEngine, browserEngineDeps, type AudioEngine, type BufferLike } from './audioEngine.ts';
import { validLoop, type LoopRange } from './masterClock.ts';

export interface Playback {
  get(): ClockState;
  subscribe(fn: () => void): () => void;
  toggle(): void;
  seek(t: number): void;
  /** Lùi/tới một khoảng (giây), kẹp trong [0, thời lượng]. */
  nudge(dt: number): void;
  /** Nạp dự án mới: đặt thời lượng và quay về đầu, dừng phát. */
  reset(duration: number): void;
  /** Đổi thời lượng mà giữ vị trí (kẹp lại nếu vượt). Dùng khi âm thanh dài hơn dự án (T-08). */
  setDuration(duration: number): void;
  /** Lặp: 'all' = cả bài, { start, end } = một đoạn, null = tắt. */
  setLoop(loop: LoopRange | 'all' | null): void;
  isLooping(): boolean;
  /** Cấu hình lặp đang đặt (tham chiếu ổn định): 'all', một đoạn, hoặc null. */
  getLoop(): LoopRange | 'all' | null;
  /** Gắn/gỡ âm thanh (null = gỡ). Đang phát thì chuyển đồng hồ chủ tại đúng t hiện tại, không nhảy. */
  attachAudio(buffer: BufferLike | null): void;
  /** Đổi offset âm thanh (ms); đang phát thì neo lại tại t hiện tại. */
  setAudioOffset(ms: number): void;
  dispose(): void;
}

type Frame = { request(cb: (now: number) => void): number; cancel(id: number): void; now(): number };
const browserFrame: Frame = {
  request: (cb) => requestAnimationFrame(cb),
  cancel: (id) => cancelAnimationFrame(id),
  now: () => performance.now(),
};

/**
 * Không có âm thanh: t tiến theo dt giữa các khung (performance.now). Có âm thanh: t đọc từ đồng hồ chủ AudioContext
 * (lib/audioEngine.ts, lib/masterClock.ts); Render Core vẫn chỉ nhận t.
 */
export function createPlayback(frame: Frame = browserFrame, engine: AudioEngine = createAudioEngine(browserEngineDeps)): Playback {
  let state = initialClock, duration = 0, raf = 0, last = 0;
  let loopSpec: LoopRange | 'all' | null = null;
  const subs = new Set<() => void>();
  const notify = () => subs.forEach((fn) => fn());
  const loopRange = (): LoopRange | null => {
    const l = loopSpec === 'all' ? (duration > 0 ? { start: 0, end: duration } : null) : loopSpec;
    return validLoop(l, duration) ? l : null;
  };
  const restartAudio = () => { if (state.playing && engine.active) engine.start(state.t, duration, loopRange()); };
  /** Đưa t về đúng vị trí đang nghe (trước khi dừng/đổi nguồn). */
  const syncFromAudio = (now: number) => {
    if (!engine.active) return;
    const r = engine.read(now, duration, loopRange());
    if (r && !r.ended) state = { ...state, t: r.t };
  };
  const set = (next: ClockState) => {
    if (next === state || (next.t === state.t && next.playing === state.playing && next.rate === state.rate)) return;
    const wasPlaying = state.playing;
    state = next;
    notify();
    if (state.playing && !wasPlaying) begin();
    if (!state.playing) { if (raf) { frame.cancel(raf); raf = 0; } engine.stop(); }
  };
  const tick = (now: number) => {
    raf = 0;
    if (engine.active) {
      const r = engine.read(now, duration, loopRange());
      if (r?.ended) { engine.stop(); set({ ...state, t: duration, playing: false }); return; }
      if (r) set({ ...state, t: r.t });
    } else {
      set(advance(state, (now - last) / 1000, duration, loopRange() ?? false));
    }
    last = now;
    if (state.playing && !raf) raf = frame.request(tick);
  };
  const begin = () => {
    last = frame.now();
    if (engine.hasBuffer) engine.start(state.t, duration, loopRange()); // gọi trong sự kiện người dùng (autoplay)
    raf = frame.request(tick);
  };
  engine.onInterrupted(() => { syncFromAudio(frame.now()); set({ ...state, playing: false }); });
  const seekTo = (t: number) => {
    const before = state.t;
    set(seek(state, t, duration));
    if (state.t !== before) restartAudio();
  };
  return {
    get: () => state,
    subscribe(fn) { subs.add(fn); return () => { subs.delete(fn); }; },
    toggle() { if (state.playing) syncFromAudio(frame.now()); set(togglePlay(state, duration)); },
    seek: seekTo,
    nudge: (dt) => seekTo(state.t + dt),
    reset(d) { duration = d; engine.stop(); set({ ...initialClock }); },
    setDuration(d) {
      if (d === duration) return;
      duration = d;
      if (state.t > d) set(seek(state, d, d));
      if (loopSpec === 'all') restartAudio();
    },
    setLoop(l) { loopSpec = l; notify(); restartAudio(); },
    isLooping: () => loopSpec !== null,
    getLoop: () => loopSpec,
    attachAudio(b) {
      const now = frame.now();
      syncFromAudio(now);
      engine.setBuffer(b);
      if (b) restartAudio();
      last = now;
      notify();
    },
    setAudioOffset(ms) { engine.setOffset(ms); if (engine.active) engine.rearm(frame.now(), duration, loopRange()); },
    dispose() { if (raf) frame.cancel(raf); raf = 0; subs.clear(); engine.dispose(); },
  };
}

/** Theo dõi một phần của đồng hồ; chọn giá trị nguyên thuỷ (số, boolean) để chỉ vẽ lại khi nó đổi. */
export function usePlayback<T>(p: Playback, select: (s: ClockState) => T): T {
  return useSyncExternalStore(p.subscribe, () => select(p.get()), () => select(p.get()));
}

/** Có đang lặp không (cho nút Lặp trên thanh phát). */
export function usePlaybackLoop(p: Playback): boolean {
  return useSyncExternalStore(p.subscribe, () => p.isLooping(), () => p.isLooping());
}
