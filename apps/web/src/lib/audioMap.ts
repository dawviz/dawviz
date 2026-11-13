// Ánh xạ thời gian dự án ↔ vị trí trong tệp âm thanh (T-08, Technical Design §6.2.3). Hàm thuần.
// Cố ý KHÔNG biết gì về độ trễ thiết bị: Preview và đường xuất video dùng chung các hàm này, độ trễ chỉ có ở đồng hồ xem trước
// (lib/masterClock.ts). Test audioMap.test.ts khoá điều đó.

/** Giới hạn offset (REQ-WIDGET-07): ±10 s, bước 1 ms. */
export const OFFSET_LIMIT_MS = 10_000;
export const clampOffsetMs = (ms: number): number => (Number.isFinite(ms) ? Math.min(OFFSET_LIMIT_MS, Math.max(-OFFSET_LIMIT_MS, Math.round(ms))) : 0);

/**
 * Vị trí trong buffer (giây) ứng với thời gian dự án `t`. `offsetMs > 0`: âm thanh trễ (đầu tệp rơi vào t = offset);
 * `< 0`: âm thanh sớm, phần tệp trước mốc t = 0 bị cắt. Kết quả < 0 nghĩa là chưa tới đầu tệp.
 */
export const mapToBuffer = (t: number, offsetMs: number): number => t - offsetMs / 1000;

export interface Segment {
  /** Số giây sau thời điểm bắt đầu đoạn thì tiếng mới vào (offset dương hoặc t0 trước đầu tệp). */
  delay: number;
  /** Vị trí bắt đầu đọc trong buffer (giây). */
  bufferStart: number;
  /** Số giây đọc từ buffer. */
  length: number;
}

/** Đoạn phát từ thời gian dự án `t0` tới `tEnd`. Trả null nếu trong khoảng đó không có âm thanh (trước đầu hoặc sau cuối tệp). */
export function planSegment(t0: number, tEnd: number, offsetMs: number, bufferDuration: number): Segment | null {
  const off = offsetMs / 1000;
  const soundStart = Math.max(t0, off);
  const soundEnd = Math.min(tEnd, off + bufferDuration);
  const length = soundEnd - soundStart;
  if (!(length > 1e-9)) return null;
  return { delay: soundStart - t0, bufferStart: soundStart - off, length };
}

export type ExportSegment =
  | { kind: 'silence'; /** giây tính từ đầu khoảng xuất */ at: number; length: number }
  | { kind: 'audio'; at: number; length: number; bufferStart: number };

/**
 * Kế hoạch cắt âm thanh cho một khoảng xuất [rangeStart, rangeEnd] (REQ-EXPORT-03): im lặng ở phần thiếu, âm thanh ở phần có,
 * phần thừa (kể cả trước mốc 0 khi offset âm) bị cắt. Dùng cùng `planSegment` với Preview nên hai nơi không thể lệch nhau.
 */
export function exportSegments(rangeStart: number, rangeEnd: number, offsetMs: number, bufferDuration: number): ExportSegment[] {
  const total = rangeEnd - rangeStart;
  if (!(total > 0)) return [];
  const seg = planSegment(rangeStart, rangeEnd, offsetMs, bufferDuration);
  if (!seg) return [{ kind: 'silence', at: 0, length: total }];
  const out: ExportSegment[] = [];
  if (seg.delay > 0) out.push({ kind: 'silence', at: 0, length: seg.delay });
  out.push({ kind: 'audio', at: seg.delay, length: seg.length, bufferStart: seg.bufferStart });
  const tail = total - seg.delay - seg.length;
  if (tail > 1e-9) out.push({ kind: 'silence', at: seg.delay + seg.length, length: tail });
  return out;
}
