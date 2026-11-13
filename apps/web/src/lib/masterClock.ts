// Toán đồng hồ chủ (T-08, Technical Design §6.2.2). Hàm thuần, không biết Web Audio, không đọc đồng hồ thật.
// Mô hình: neo + thời gian trôi qua. t = t0 + rate · max(0, s − s0), s là giờ của nguồn (performance.now hoặc giờ NGHE ĐƯỢC của AudioContext).
// Độ trễ thiết bị chỉ xuất hiện ở `heardContextTime`; audioOffsetMs và đường xuất (audioMap.ts) không bao giờ dùng nó.

export interface Anchor { t0: number; s0: number; rate: number }
export interface LoopRange { start: number; end: number }
export interface Reading { t: number; ended: boolean }

/** Vòng lặp chỉ có nghĩa khi đủ dài (tránh vòng lặp vô hạn / lên lịch dày đặc). */
export const MIN_LOOP_SECONDS = 0.05;
export const validLoop = (l: LoopRange | null | undefined, duration: number): l is LoopRange =>
  !!l && Number.isFinite(l.start) && Number.isFinite(l.end) && l.start >= 0 && l.end <= duration + 1e-9 && l.end - l.start >= MIN_LOOP_SECONDS;

/** Điểm bắt đầu hợp lệ: ở/sau cuối vòng lặp thì vào từ đầu vòng. */
export const normalizeStart = (t0: number, duration: number, loop: LoopRange | null): number => {
  const t = Math.min(Math.max(0, t0), duration);
  return loop && t >= loop.end ? loop.start : t;
};

/** Thời gian dự án tại giờ nguồn `s`. Có vòng lặp thì quay lại đầu vòng khi qua cuối; không thì dừng ở `duration` (ended). */
export function readClock(a: Anchor, s: number, duration: number, loop: LoopRange | null): Reading {
  const raw = a.t0 + a.rate * Math.max(0, s - a.s0);
  if (loop) {
    if (raw < loop.end) return { t: raw, ended: false };
    const len = loop.end - loop.start;
    return { t: loop.start + ((raw - loop.end) % len), ended: false };
  }
  return raw >= duration ? { t: duration, ended: true } : { t: raw, ended: false };
}

/** Neo lại tại đúng t đang đọc: hình không nhảy; `sNew` là giờ nguồn của mốc neo mới. */
export const rebase = (a: Anchor, sNow: number, duration: number, loop: LoopRange | null, sNew: number): Anchor =>
  ({ t0: readClock(a, sNow, duration, loop).t, s0: sNew, rate: a.rate });

// ── giờ nghe được trên trục AudioContext ──
export interface OutputStamp { contextTime?: number; performanceTime?: number }
export interface CtxSample {
  currentTime: number;
  running: boolean;
  baseLatency?: number;
  outputLatency?: number;
  /** Kết quả getOutputTimestamp() của khung này (nếu có hàm). */
  stamp?: OutputStamp | null;
}
export const MAX_LATENCY = 0.5;
/** Độ trễ ước lượng (giây): baseLatency + outputLatency; thiếu thì coi là 0; kẹp [0; 0,5]. Chỉ lấy mẫu khi neo, không đọc mỗi khung. */
export function deviceLatency(c: Pick<CtxSample, 'baseLatency' | 'outputLatency'>): number {
  const v = (Number.isFinite(c.baseLatency) ? c.baseLatency! : 0) + (Number.isFinite(c.outputLatency) ? c.outputLatency! : 0);
  return Math.min(MAX_LATENCY, Math.max(0, v));
}
export const validStamp = (s: OutputStamp | null | undefined): s is Required<OutputStamp> =>
  !!s && Number.isFinite(s.contextTime) && Number.isFinite(s.performanceTime) && s.performanceTime! > 0 && s.contextTime! >= 0;

/**
 * Giờ (trên trục AudioContext) của mẫu đang được NGHE tại khung vẽ `frameMs` (performance.now, mili giây).
 * Có getOutputTimestamp hợp lệ: nội suy mượt theo khung; contextTime của nó đã tính độ trễ đầu ra nên KHÔNG trừ `latency` nữa.
 * Dự phòng: currentTime − latency.
 */
export function heardContextTime(c: CtxSample, frameMs: number, latency: number): number {
  if (c.running && validStamp(c.stamp)) return c.stamp.contextTime + (frameMs - c.stamp.performanceTime) / 1000;
  return c.currentTime - latency;
}
