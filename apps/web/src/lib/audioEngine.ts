// Điều khiển AudioContext cho đồng hồ chủ (T-08, §6.2.2). Toán thời gian nằm ở masterClock.ts/audioMap.ts; ở đây chỉ lên lịch nút nguồn
// và lấy mẫu AudioContext qua giao diện `AudioContextLike` (test dùng bản giả).
import { planSegment } from './audioMap.ts';
import { deviceLatency, heardContextTime, normalizeStart, readClock, validLoop, type Anchor, type LoopRange, type OutputStamp, type Reading } from './masterClock.ts';

export interface ParamLike { setValueAtTime(v: number, t: number): unknown; linearRampToValueAtTime(v: number, t: number): unknown }
export interface GainLike { gain: ParamLike; connect(n: unknown): unknown; disconnect(): void }
export interface SourceLike {
  buffer: unknown; onended: (() => void) | null;
  connect(n: unknown): unknown; disconnect(): void;
  start(when: number, offset: number, duration: number): void; stop(when?: number): void;
}
export interface AudioContextLike {
  readonly currentTime: number; readonly state: string; readonly destination: unknown;
  readonly baseLatency?: number; readonly outputLatency?: number;
  getOutputTimestamp?(): OutputStamp;
  resume(): Promise<void>;
  createBufferSource(): SourceLike; createGain(): GainLike;
  addEventListener(type: string, fn: () => void): void; removeEventListener(type: string, fn: () => void): void;
}
export interface EngineDeps {
  createContext(): AudioContextLike;
  setInterval(fn: () => void, ms: number): unknown; clearInterval(id: unknown): void;
  /** Đăng ký sự kiện đổi thiết bị âm thanh của hệ thống; trả hàm huỷ. */
  onDeviceChange(fn: () => void): () => void;
  /** performance.now() (ms), cùng gốc với mốc thời gian của khung requestAnimationFrame. */
  now(): number;
}
export interface BufferLike { duration: number }

export const START_LEAD = 0.03;      // đệm khởi động (giây)
export const LOOKAHEAD = 2;          // đặt trước các vòng lặp (giây)
export const PUMP_MS = 250;
export const FADE = 0.005;           // hạ gain trước khi dừng nguồn (tránh tiếng "tách")

export interface AudioEngine {
  readonly hasBuffer: boolean;
  /** Đang phát (có nguồn chạy). */
  readonly active: boolean;
  setBuffer(b: BufferLike | null): void;
  setOffset(ms: number): void;
  /** Phải gọi trong sự kiện người dùng (lần đầu tạo/resume AudioContext). */
  start(t0: number, duration: number, loop: LoopRange | null): void;
  stop(): void;
  /** Đọc thời gian dự án tại khung `frameMs`; null nếu không đang phát. */
  read(frameMs: number, duration: number, loop: LoopRange | null): Reading | null;
  /** Lấy mẫu lại độ trễ và neo lại tại đúng t đang đọc (hình không nhảy). Đang dừng thì chỉ lấy lại độ trễ. */
  rearm(frameMs: number, duration: number, loop: LoopRange | null): void;
  /** Đăng ký: AudioContext bị hệ thống treo khi đang phát → người dùng cần bấm Phát lại. */
  onInterrupted(fn: () => void): void;
  dispose(): void;
}

export function createAudioEngine(deps: EngineDeps): AudioEngine {
  let ctx: AudioContextLike | null = null, buffer: BufferLike | null = null, offsetMs = 0;
  let playing = false, anchor: Anchor = { t0: 0, s0: 0, rate: 1 }, latency = 0, last = 0;
  let cur = { duration: 0, loop: null as LoopRange | null };
  let timer: unknown = null, unDevice: (() => void) | null = null, wasRunning = false, interrupted: (() => void) | null = null;
  const frameNow = () => deps.now();
  // Con trỏ lên lịch: đoạn kế bắt đầu ở thời gian dự án `ct` và giờ ngữ cảnh `cs`.
  let ct = 0, cs = 0;
  const live = new Set<{ src: SourceLike; gain: GainLike }>();

  const killAll = (fade: boolean) => {
    if (!ctx) { live.clear(); return; }
    const now = ctx.currentTime;
    for (const n of live) {
      try {
        if (fade) { n.gain.gain.setValueAtTime(1, now); n.gain.gain.linearRampToValueAtTime(0, now + FADE); n.src.stop(now + FADE + 0.001); }
        else n.src.stop();
      } catch { /* nguồn chưa start hoặc đã dừng */ }
      n.src.onended = () => { n.src.disconnect(); n.gain.disconnect(); };
    }
    live.clear();
  };

  const schedule = () => {
    if (!ctx || !buffer || !playing) return;
    const end = cur.loop ? cur.loop.end : cur.duration;
    let guard = 0;
    // Không lặp: một đoạn tới hết bài. Lặp: đặt trước các vòng cho tới khi đủ LOOKAHEAD.
    while (guard++ < 64) {
      const seg = planSegment(ct, end, offsetMs, buffer.duration);
      if (seg) {
        const src = ctx.createBufferSource(), gain = ctx.createGain();
        src.buffer = buffer; src.connect(gain); gain.connect(ctx.destination);
        src.start(cs + seg.delay, seg.bufferStart, seg.length);
        const n = { src, gain }; live.add(n);
        src.onended = () => { live.delete(n); src.disconnect(); gain.disconnect(); };
      }
      if (!cur.loop) { ct = Infinity; return; }
      cs += end - ct; ct = cur.loop.start;
      if (cs > ctx.currentTime + LOOKAHEAD) return;
    }
  };

  const sample = (frameMs: number) => {
    const c = ctx!;
    const stamp = c.state === 'running' && c.getOutputTimestamp ? c.getOutputTimestamp() : null;
    return heardContextTime({ currentTime: c.currentTime, running: c.state === 'running', baseLatency: c.baseLatency, outputLatency: c.outputLatency, stamp }, frameMs, latency);
  };

  const ensureContext = () => {
    if (ctx) return;
    ctx = deps.createContext();
    const onState = () => {
      if (!ctx) return;
      if (ctx.state === 'running') { wasRunning = true; if (playing) self.rearm(frameNow(), cur.duration, cur.loop); }
      else if (wasRunning && playing) { wasRunning = false; interrupted?.(); }
    };
    const onSink = () => self.rearm(frameNow(), cur.duration, cur.loop);
    ctx.addEventListener('statechange', onState); ctx.addEventListener('sinkchange', onSink);
    unDevice = deps.onDeviceChange(onSink);
    dispose2 = () => { ctx?.removeEventListener('statechange', onState); ctx?.removeEventListener('sinkchange', onSink); };
  };
  let dispose2 = () => {};

  const self: AudioEngine = {
    get hasBuffer() { return !!buffer; },
    get active() { return playing; },
    setBuffer(b) { killAll(true); buffer = b; if (!b) self.stop(); },
    setOffset(ms) { offsetMs = ms; },
    start(t0, duration, loop) {
      if (!buffer) return;
      ensureContext();
      const c = ctx!;
      if (c.state !== 'running') void c.resume().catch(() => {});
      killAll(true);
      latency = deviceLatency(c);
      const lp = validLoop(loop, duration) ? loop : null;
      cur = { duration, loop: lp };
      const t = normalizeStart(t0, duration, lp);
      const when = c.currentTime + START_LEAD;
      anchor = { t0: t, s0: when, rate: 1 };
      ct = t; cs = when; last = t; playing = true; wasRunning = c.state === 'running';
      schedule();
      if (timer === null) timer = deps.setInterval(() => schedule2(), PUMP_MS);
    },
    stop() {
      killAll(true);
      playing = false;
      if (timer !== null) { deps.clearInterval(timer); timer = null; }
    },
    read(frameMs, duration, loop) {
      if (!playing || !ctx) return null;
      const r = readClock(anchor, sample(frameMs), duration, validLoop(loop, duration) ? loop : null);
      // Trong một đoạn liên tục t không lùi (nhiễu của cặp mốc thời gian); chỉ vòng lặp mới được lùi.
      if (!cur.loop && !r.ended && r.t < last && last - r.t < 0.05) r.t = last;
      last = r.t;
      return r;
    },
    rearm(frameMs, duration, loop) {
      if (!ctx) return;
      if (!playing) { latency = deviceLatency(ctx); return; }
      const r = self.read(frameMs, duration, loop);
      if (r && !r.ended) self.start(r.t, duration, loop);
    },
    onInterrupted(fn) { interrupted = fn; },
    dispose() {
      self.stop(); dispose2(); unDevice?.(); unDevice = null; ctx = null;
    },
  };
  const schedule2 = () => { if (cur.loop && ctx && ctx.currentTime + LOOKAHEAD > cs) schedule(); };
  return self;
}

/** Phụ thuộc thật: AudioContext 48 kHz (không hỗ trợ thì mặc định, trình duyệt tự đổi tần số), timer của cửa sổ, sự kiện đổi thiết bị. */
export const browserEngineDeps: EngineDeps = {
  createContext() {
    try { return new AudioContext({ sampleRate: 48_000, latencyHint: 'interactive' }) as unknown as AudioContextLike; }
    catch { return new AudioContext() as unknown as AudioContextLike; }
  },
  setInterval: (fn, ms) => window.setInterval(fn, ms),
  clearInterval: (id) => window.clearInterval(id as number),
  onDeviceChange(fn) {
    const md = typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;
    md?.addEventListener('devicechange', fn);
    return () => md?.removeEventListener('devicechange', fn);
  },
  now: () => performance.now(),
};
