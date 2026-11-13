// Định dạng thời gian kiểu đồng hồ DAW cho thanh phát và sân khấu (hàm thuần).
// AST chưa có dấu nhịp nên chưa hiện được Bar.Beat (không đoán 4/4, D-24/D-29); dùng m:ss.mmm và BPM tại vị trí phát.
import type { TempoPoint } from '@dawviz/render-core';

/** `m:ss.mmm`, ví dụ 95.0834 → "1:35.083". Số âm hoặc không hữu hạn → "0:00.000". */
export function formatClock(sec: number): string {
  const ms = Number.isFinite(sec) && sec > 0 ? Math.floor(sec * 1000 + 1e-6) : 0;
  const m = Math.floor(ms / 60000), s = Math.floor((ms % 60000) / 1000), r = ms % 1000;
  return `${m}:${String(s).padStart(2, '0')}.${String(r).padStart(3, '0')}`;
}

/** BPM đang có hiệu lực tại thời điểm t (mốc tempo cuối cùng có timeSeconds ≤ t); không có mốc → null. */
export function bpmAt(tempoMap: readonly TempoPoint[], t: number): number | null {
  let bpm: number | null = null;
  for (const p of tempoMap) { if (p.timeSeconds <= t + 1e-9) bpm = p.bpm; else break; }
  return bpm ?? tempoMap[0]?.bpm ?? null;
}
