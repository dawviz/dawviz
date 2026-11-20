// Worker phân tích phổ (T-53): nhận PCM mono theo khối, cộng dồn bảng đặc trưng (FFT 2048, dải log) rồi trả về một lần. Không giữ PCM.
import { createSpectralAccumulator, type AudioFeatures } from '@dawviz/render-core';

export type SpectrumIn = { type: 'init'; sampleRate: number } | { type: 'chunk'; data: Float32Array } | { type: 'end' };
export type SpectrumOut = { type: 'ack' } | { type: 'done'; features: AudioFeatures };

let acc: ReturnType<typeof createSpectralAccumulator> | null = null;
self.onmessage = (e: MessageEvent<SpectrumIn>) => {
  const post = (m: SpectrumOut, tr: Transferable[] = []) => (self as unknown as Worker).postMessage(m, tr);
  const m = e.data;
  if (m.type === 'init') { acc = createSpectralAccumulator(m.sampleRate); post({ type: 'ack' }); return; }
  if (m.type === 'chunk') { acc?.push(m.data); post({ type: 'ack' }); return; }
  const f = acc!.finish(); acc = null;
  post({ type: 'done', features: f }, [f.spectrum.buffer, f.peak.buffer, f.rms.buffer]);
};
