// Thống kê khi xuất cho ngăn "Chi tiết kỹ thuật" và báo cáo chẩn đoán (T-09). Thuần, không biết gì về trình duyệt: Worker bấm giờ rồi
// đưa số vào đây. Chỉ ghi những gì đo được thật: không có độ dài hàng đợi mã hoá (Mediabunny không công khai) và không có bộ nhớ
// (`performance.memory` không có trong Worker của Chrome, và vốn không đo bộ nhớ của bộ mã hoá).

export interface ExportStats {
  /** trung bình (ms) của 30 khung vẽ gần nhất */
  drawMs: number;
  /** trung bình (ms) của 30 khung mã hoá gần nhất (gồm cả thời gian chờ encoder còn chỗ) */
  encodeMs: number;
  /** trung bình (ms) của 30 khung vẽ đầu tiên; null khi chưa đủ */
  drawFirstMs: number | null;
  /** vẽ đang chậm dần rõ rệt so với lúc đầu (dấu hiệu lỗi Firefox với nhiều mặt phông, docs/design/FIREFOX-FONT-SLOWDOWN.md) */
  slowing: boolean;
  fontFaces: number;
  container: string;
  videoCodec: string;
  audioCodec: string | null;
}
/** Báo cáo cuối lần xuất: số liệu cuối + đường cong thời gian vẽ theo khung để thấy xu hướng (không chỉ trung bình). */
export interface ExportReport {
  stats: ExportStats;
  /** [số khung đã xong, trung bình ms vẽ 30 khung gần nhất], tối đa ~24 điểm đều nhau */
  series: Array<[number, number]>;
  frames: number;
  fps: number;
  width: number;
  height: number;
  totalMs: number;
  bytes: number;
  style?: string;
}

export const STATS_WINDOW = 30;
/** Chậm dần: từ khung 300, vẽ gấp ≥ 3 lần lúc đầu và hơn lúc đầu ≥ 6 ms (tránh báo nhầm khi cảnh đầu quá nhẹ). */
export const SLOWING_MIN_FRAME = 300;
export const isSlowing = (frame: number, first: number | null, now: number): boolean =>
  first !== null && frame >= SLOWING_MIN_FRAME && now > Math.max(first * 3, first + 6);

export function createStats(window = STATS_WINDOW) {
  const draws: number[] = [], encs: number[] = [], firstDraws: number[] = [];
  const points: Array<[number, number]> = [];
  const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const push = (a: number[], v: number) => { a.push(v); if (a.length > window) a.shift(); };
  return {
    addDraw(ms: number) { push(draws, ms); if (firstDraws.length < window) firstDraws.push(ms); },
    addEncode(ms: number) { push(encs, ms); },
    /** Gọi mỗi lần báo tiến độ (vài lần/giây): lấy ảnh chụp số liệu và ghi một điểm vào đường cong. */
    snapshot(frame: number): { drawMs: number; encodeMs: number; drawFirstMs: number | null; slowing: boolean } {
      const drawMs = avg(draws), first = firstDraws.length >= window ? avg(firstDraws) : null;
      if (draws.length) points.push([frame, drawMs]);
      return { drawMs, encodeMs: avg(encs), drawFirstMs: first, slowing: isSlowing(frame, first, drawMs) };
    },
    series(max = 24): Array<[number, number]> { return downsample(points, max); },
  };
}
const round1 = (n: number) => Math.round(n * 10) / 10;
/** Rút gọn xuống tối đa `max` điểm đều nhau (giữ điểm đầu và cuối), làm tròn 0,1 ms. */
export function downsample(points: ReadonlyArray<readonly [number, number]>, max = 24): Array<[number, number]> {
  if (points.length <= max) return points.map(([f, v]) => [f, round1(v)]);
  return Array.from({ length: max }, (_, i) => points[Math.round((i * (points.length - 1)) / (max - 1))]).map(([f, v]) => [f, round1(v)] as [number, number]);
}

/** Đoạn văn bản ngắn để người thử dán vào GitHub Issue: không có tên tệp hay nội dung dự án. */
export function formatExportReport(r: ExportReport, env: { userAgent: string; cores: number | null; appVersion: string }): string {
  const s = r.stats, ms = (n: number) => `${round1(n)} ms`;
  const first = s.drawFirstMs === null ? 'n/a' : ms(s.drawFirstMs);
  const mid = r.series.length ? r.series[Math.floor(r.series.length / 2)] : null, last = r.series.length ? r.series[r.series.length - 1] : null;
  return [
    `DAW Visualizer ${env.appVersion} — export report`,
    `User agent: ${env.userAgent}`,
    `Cores: ${env.cores ?? 'n/a'}`,
    `Output: ${r.width}x${r.height} @ ${r.fps} fps · ${s.container.toUpperCase()} · video ${s.videoCodec} · audio ${s.audioCodec ?? 'none'}${r.style ? ` · style ${r.style}` : ''}`,
    `Frames: ${r.frames} · total ${(r.totalMs / 1000).toFixed(1)} s · ${(r.frames / (r.totalMs / 1000)).toFixed(1)} fps (${(r.frames / (r.totalMs / 1000) / r.fps).toFixed(2)}x realtime) · ${(r.bytes / 1e6).toFixed(1)} MB`,
    `Draw time per frame (avg of 30 frames): start ${first} · middle ${mid ? `${ms(mid[1])} @ frame ${mid[0]}` : 'n/a'} · end ${last ? `${ms(last[1])} @ frame ${last[0]}` : 'n/a'}`,
    `Encode wait per frame (last 30): ${ms(s.encodeMs)}`,
    `Draw slowing down over time: ${s.slowing ? 'YES' : 'no'}`,
    `Font faces loaded in worker: ${s.fontFaces}`,
    `Draw curve [frame, ms]: ${r.series.map(([f, v]) => `${f}:${v}`).join(' ')}`,
  ].join('\n');
}
