// Client phân tích phổ (T-53): gửi PCM mono sang Worker từng khối (chờ ack, bộ nhớ tạm ~4 MB), có bộ đệm theo định danh tệp (SHA-256).
// Worker tiêm vào để test. Kết quả là `AudioFeatures` của Render Core; cùng một bảng dùng cho Xem trước và Export.
import { analyzeMono, type AudioFeatures } from '@dawviz/render-core';
import { downmixMono } from './audioPeaks.ts';
import type { PcmBuffer } from './audioAsset.ts';
import { CHUNK_SAMPLES } from './peaksClient.ts';

export interface SpectrumWorkerLike {
  postMessage(msg: unknown, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((e: { data: { type: 'ack' } | { type: 'done'; features: AudioFeatures } }) => void) | null;
  onerror: ((e: unknown) => void) | null;
}

export function computeSpectrumViaWorker(buf: PcmBuffer, makeWorker: () => SpectrumWorkerLike, chunk = CHUNK_SAMPLES): Promise<AudioFeatures> {
  return new Promise((resolve, reject) => {
    const w = makeWorker();
    const channels = Array.from({ length: buf.numberOfChannels }, (_, c) => buf.getChannelData(c));
    let pos = 0, started = false;
    const next = () => {
      if (!started) { started = true; w.postMessage({ type: 'init', sampleRate: buf.sampleRate }); return; }
      if (pos >= buf.length) { w.postMessage({ type: 'end' }); return; }
      const end = Math.min(buf.length, pos + chunk), data = downmixMono(channels, pos, end); pos = end;
      w.postMessage({ type: 'chunk', data }, [data.buffer]);
    };
    w.onmessage = (e) => { if (e.data.type === 'ack') next(); else { w.terminate(); resolve(e.data.features); } };
    w.onerror = (e) => { w.terminate(); reject(e instanceof Error ? e : new Error('spectrum worker failed')); };
    next();
  });
}

/** Cùng kết quả, chạy ngay trên luồng gọi (test). */
export function computeSpectrumSync(buf: PcmBuffer): AudioFeatures {
  const channels = Array.from({ length: buf.numberOfChannels }, (_, c) => buf.getChannelData(c));
  return analyzeMono(downmixMono(channels, 0, buf.length), buf.sampleRate);
}

const cache = new Map<string, AudioFeatures>();
/** Bộ đệm một tệp (≈ 3 MB cho 5 phút: 100 khung/s × 128 dải). */
export async function spectrumFor(id: string, buf: PcmBuffer, makeWorker: () => SpectrumWorkerLike): Promise<AudioFeatures> {
  const hit = cache.get(id);
  if (hit) return hit;
  const f = await computeSpectrumViaWorker(buf, makeWorker);
  cache.clear(); cache.set(id, f);
  return f;
}
