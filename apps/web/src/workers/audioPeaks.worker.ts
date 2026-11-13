// Worker tính đỉnh sóng âm (T-08, §6.2.5): nhận PCM mono theo khối, chỉ cộng dồn (min, max) theo ô 512 mẫu, không giữ PCM.
import { createPeaksAccumulator } from '../lib/audioPeaks.ts';

export type PeaksIn = { type: 'chunk'; data: Float32Array } | { type: 'end' };
export type PeaksOut = { type: 'ack' } | { type: 'done'; peaks: Float32Array };

let acc = createPeaksAccumulator();
self.onmessage = (e: MessageEvent<PeaksIn>) => {
  if (e.data.type === 'chunk') { acc.push(e.data.data); (self as unknown as Worker).postMessage({ type: 'ack' } satisfies PeaksOut); return; }
  const peaks = acc.finish(); acc = createPeaksAccumulator();
  (self as unknown as Worker).postMessage({ type: 'done', peaks } satisfies PeaksOut, [peaks.buffer]);
};
