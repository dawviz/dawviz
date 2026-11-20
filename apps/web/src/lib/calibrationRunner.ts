// Chạy bài đo độ trễ thiết bị (T-82): lên lịch tiếng trên một AudioContext riêng, ghi lần gõ theo "giờ nghe được", tính kết quả.
// Toán nằm ở latencyCalibration.ts; ở đây chỉ nối với Web Audio qua giao diện nhỏ để thử bằng bản giả. Không chạm đồng hồ chủ của Xem trước.
import { BAR_SEC, buildSchedule, matchTaps, summarize, CAL, type CalibrationResult } from './latencyCalibration.ts';
import { synthKick, synthSnare } from './calibrationSounds.ts';
import { deviceLatency, heardContextTime, type OutputStamp } from './masterClock.ts';

export interface CalBuffer { getChannelData(ch: number): Float32Array }
export interface CalSource { buffer: unknown; connect(n: unknown): unknown; disconnect(): void; start(when: number): void; stop(when?: number): void }
export interface CalCtx {
  readonly currentTime: number; readonly state: string; readonly sampleRate: number; readonly destination: unknown;
  readonly baseLatency?: number; readonly outputLatency?: number;
  getOutputTimestamp?(): OutputStamp;
  resume(): Promise<void>; close?(): Promise<void>;
  createBuffer(channels: number, length: number, sampleRate: number): CalBuffer;
  createBufferSource(): CalSource;
}
export interface CalDeps { createContext(): CalCtx; /** performance.now() (ms), cùng gốc với `event.timeStamp`. */ now(): number }

/** Đệm từ lúc resume tới tiếng đầu tiên (giây). */
export const LEAD = 0.8;
export type CalPhase = 'idle' | 'starting' | 'running' | 'done' | 'failed';
export interface CalStatus {
  phase: CalPhase;
  /** Chỉ số ô đang phát (0…3 khi không có ô khởi động); −1 khi chưa tới tiếng đầu hoặc không chạy. */
  bar: number;
  /** Số lần gõ đã ghi (kể cả ngoài cửa sổ). */
  taps: number;
}
export interface Calibration {
  /** Gọi TRONG sự kiện người dùng (resume AudioContext). Đã chạy rồi thì bỏ qua. */
  start(): Promise<void>;
  /** Ghi một lần gõ; `perfMs` là `event.timeStamp`. Trả false nếu chưa chạy hoặc đã xong. */
  tap(perfMs: number): boolean;
  status(): CalStatus;
  /** Gọi định kỳ khi đang chạy: hết bài thì tính kết quả và đóng AudioContext. */
  poll(): CalibrationResult | null;
  result(): CalibrationResult | null;
  /** Dừng giữa chừng, không có kết quả. */
  abort(): void;
}

export function createCalibration(deps: CalDeps): Calibration {
  let ctx: CalCtx | null = null, phase: CalPhase = 'idle', taps: number[] = [], snares: number[] = [], t0 = 0, endTime = 0, res: CalibrationResult | null = null;
  const sources: CalSource[] = [];
  const close = () => { for (const s of sources) { try { s.stop(); s.disconnect(); } catch { /* đã dừng */ } } sources.length = 0; void ctx?.close?.().catch(() => {}); ctx = null; };

  /** Giờ (trục AudioContext) của mẫu đang được nghe tại thời điểm `perfMs` của sự kiện; sự kiện cũ hơn lúc xử lý nên bù phần chênh. */
  const heardAt = (perfMs: number): number => {
    const c = ctx!, running = c.state === 'running', lag = Math.max(0, (deps.now() - perfMs) / 1000);
    const stamp = running && c.getOutputTimestamp ? c.getOutputTimestamp() : null;
    return heardContextTime({ currentTime: c.currentTime - lag, running, baseLatency: c.baseLatency, outputLatency: c.outputLatency, stamp }, perfMs, deviceLatency(c));
  };

  return {
    async start() {
      if (phase !== 'idle') return;
      phase = 'starting';
      try {
        ctx = deps.createContext();
        await ctx.resume();
        const c = ctx, sr = c.sampleRate;
        const mk = (data: Float32Array) => { const b = c.createBuffer(1, data.length, sr); b.getChannelData(0).set(data); return b; };
        const kick = mk(synthKick(sr)), snare = mk(synthSnare(sr));
        t0 = c.currentTime + LEAD;
        const sched = buildSchedule(t0);
        snares = sched.snares; endTime = sched.end;
        for (const e of sched.events) {
          const src = c.createBufferSource(); src.buffer = e.kind === 'kick' ? kick : snare; src.connect(c.destination); src.start(e.time); sources.push(src);
        }
        taps = []; res = null; phase = 'running';
      } catch { phase = 'failed'; close(); }
    },
    tap(perfMs) {
      if (phase !== 'running' || !ctx) return false;
      const h = heardAt(perfMs);
      if (h < t0 - 0.5 || !Number.isFinite(h)) return false; // gõ trước khi bài bắt đầu: bỏ
      taps.push(h); return true;
    },
    status() {
      if (phase !== 'running' || !ctx) return { phase, bar: -1, taps: taps.length };
      const idx = Math.floor((ctx.currentTime - t0) / BAR_SEC); // −1 trong đệm trước tiếng đầu
      return { phase, bar: Math.min(CAL.warmupBars + CAL.measuredBars - 1, Math.max(-1, idx)), taps: taps.length };
    },
    poll() {
      if (phase !== 'running' || !ctx || ctx.currentTime < endTime) return null;
      res = summarize(matchTaps(snares, taps)); phase = 'done'; close(); return res;
    },
    result: () => res,
    abort() { if (phase === 'running' || phase === 'starting') { phase = 'idle'; close(); taps = []; } },
  };
}
