// Client sóng âm (T-08, §6.2.5): gửi PCM mono sang Worker theo khối, mỗi lần một khối (chờ ack) nên bộ nhớ tạm chỉ ~4 MB.
// Có bộ đệm theo định danh tệp (SHA-256). Worker tiêm vào để test.
import { createPeaksAccumulator, downmixMono } from './audioPeaks.ts';
import type { PcmBuffer } from './audioAsset.ts';

export const CHUNK_SAMPLES = 1 << 20;
export interface PeaksWorkerLike {
  postMessage(msg: unknown, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((e: { data: { type: 'ack' } | { type: 'done'; peaks: Float32Array } }) => void) | null;
  onerror: ((e: unknown) => void) | null;
}

export function computePeaksViaWorker(buf: PcmBuffer, makeWorker: () => PeaksWorkerLike, chunk = CHUNK_SAMPLES): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const w = makeWorker();
    const channels = Array.from({ length: buf.numberOfChannels }, (_, c) => buf.getChannelData(c));
    let pos = 0;
    const next = () => {
      if (pos >= buf.length) { w.postMessage({ type: 'end' }); return; }
      const end = Math.min(buf.length, pos + chunk);
      const data = downmixMono(channels, pos, end); pos = end;
      w.postMessage({ type: 'chunk', data }, [data.buffer]);
    };
    w.onmessage = (e) => {
      if (e.data.type === 'ack') next();
      else { w.terminate(); resolve(e.data.peaks); }
    };
    w.onerror = (e) => { w.terminate(); reject(e instanceof Error ? e : new Error('peaks worker failed')); };
    next();
  });
}

/** Cùng kết quả, chạy ngay trên luồng gọi (test và so sánh bit). */
export function computePeaksSync(buf: PcmBuffer, chunk = CHUNK_SAMPLES): Float32Array {
  const channels = Array.from({ length: buf.numberOfChannels }, (_, c) => buf.getChannelData(c));
  const acc = createPeaksAccumulator();
  for (let p = 0; p < buf.length; p += chunk) acc.push(downmixMono(channels, p, Math.min(buf.length, p + chunk)));
  return acc.finish();
}

const cache = new Map<string, Float32Array>();
/** Bộ đệm ≤ 1 tệp (≈ 0,9 MB cho 20 phút). */
export async function peaksFor(id: string, buf: PcmBuffer, makeWorker: () => PeaksWorkerLike): Promise<Float32Array> {
  const hit = cache.get(id);
  if (hit) return hit;
  const peaks = await computePeaksViaWorker(buf, makeWorker);
  cache.clear(); cache.set(id, peaks);
  return peaks;
}
