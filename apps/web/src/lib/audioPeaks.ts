// Sóng âm cho thanh tua (T-08, §6.2.5). Hàm thuần, tất định: ô cơ sở cố định 512 mẫu theo vị trí tuyệt đối trong tệp,
// nên kết quả không phụ thuộc cách chia khối khi gửi sang Worker và không phụ thuộc kích thước thanh tua.

export const PEAK_BUCKET = 512;

/** Trộn mono (L+R)/2 ở độ chính xác Float32, thứ tự cố định. Một kênh thì trả nguyên. */
export function downmixMono(channels: readonly Float32Array[], start: number, end: number): Float32Array {
  const n = Math.max(0, end - start);
  const out = new Float32Array(n);
  if (channels.length === 1) { out.set(channels[0].subarray(start, end)); return out; }
  const l = channels[0], r = channels[1];
  for (let i = 0; i < n; i++) out[i] = (l[start + i] + r[start + i]) * 0.5;
  return out;
}

export interface PeaksAccumulator { push(mono: Float32Array): void; finish(): Float32Array }

/** Cộng dồn (min, max) theo ô 512 mẫu. Không giữ PCM. `finish` trả [min0, max0, min1, max1, …] (ô cuối có thể ngắn hơn). */
export function createPeaksAccumulator(): PeaksAccumulator {
  let out = new Float32Array(1024), n = 0, fill = 0, lo = Infinity, hi = -Infinity;
  const flush = () => {
    if (n + 2 > out.length) { const g = new Float32Array(out.length * 2); g.set(out); out = g; }
    out[n++] = lo; out[n++] = hi; fill = 0; lo = Infinity; hi = -Infinity;
  };
  return {
    push(mono) {
      for (let i = 0; i < mono.length; i++) {
        const v = mono[i];
        if (v < lo) lo = v;
        if (v > hi) hi = v;
        if (++fill === PEAK_BUCKET) flush();
      }
    },
    finish() { if (fill > 0) flush(); return out.slice(0, n); },
  };
}

/** Rút gọn mức cơ sở về `columns` cột: min/max theo nhóm ô, không nội suy. Trả cả đỉnh tuyệt đối để chuẩn hoá khi vẽ. */
export function reducePeaks(base: Float32Array, columns: number): { data: Float32Array; peak: number } {
  const buckets = base.length / 2, cols = Math.max(0, Math.floor(columns));
  const data = new Float32Array(cols * 2);
  let peak = 0;
  if (!buckets || !cols) return { data, peak };
  for (let c = 0; c < cols; c++) {
    const a = Math.floor((c * buckets) / cols);
    const b = Math.max(a + 1, Math.floor(((c + 1) * buckets) / cols));
    let lo = Infinity, hi = -Infinity;
    for (let k = a; k < Math.min(b, buckets); k++) { if (base[2 * k] < lo) lo = base[2 * k]; if (base[2 * k + 1] > hi) hi = base[2 * k + 1]; }
    data[2 * c] = lo; data[2 * c + 1] = hi;
    peak = Math.max(peak, Math.abs(lo), Math.abs(hi));
  }
  return { data, peak };
}

/** Đường SVG (các vạch dọc) cho viewBox rộng `cols`, cao `height`, tâm ở giữa. Chuẩn hoá theo đỉnh; im lặng hoàn toàn → vạch mỏng ở tâm. */
export function peaksPath(p: { data: Float32Array; peak: number }, height: number): string {
  const cols = p.data.length / 2, mid = height / 2, k = p.peak > 0 ? (mid - 0.5) / p.peak : 0;
  let d = '';
  for (let c = 0; c < cols; c++) {
    const y1 = (mid - p.data[2 * c + 1] * k), y2 = (mid - p.data[2 * c] * k);
    const a = Math.min(y1, mid - 0.5), b = Math.max(y2, mid + 0.5);
    d += `M${c + 0.5} ${a.toFixed(1)}V${b.toFixed(1)}`;
  }
  return d;
}

/**
 * Sóng âm đặt lên trục thời gian của dự án: tệp dài `audioDur` giây, bắt đầu ở `offsetSec` (âm thì phần trước mốc 0 bị cắt),
 * trục dài `duration` giây, `cols` cột. Cột ngoài tệp = 0. Thuần, tất định.
 */
export function placePeaks(base: Float32Array, audioDur: number, offsetSec: number, duration: number, cols: number): { data: Float32Array; peak: number } {
  const out = new Float32Array(cols * 2);
  if (!(duration > 0) || !(audioDur > 0) || cols <= 0) return { data: out, peak: 0 };
  const k = Math.max(1, Math.round((cols * audioDur) / duration));
  const r = reducePeaks(base, k);
  const start = Math.round((offsetSec / duration) * cols);
  for (let i = 0; i < k; i++) {
    const c = start + i;
    if (c < 0 || c >= cols) continue;
    out[2 * c] = r.data[2 * i]; out[2 * c + 1] = r.data[2 * i + 1];
  }
  return { data: out, peak: r.peak };
}
