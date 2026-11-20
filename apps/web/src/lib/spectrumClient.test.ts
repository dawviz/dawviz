// T-53: client phân tích phổ: kết quả qua Worker giả bằng đúng kết quả tính thẳng, mọi cách chia khối; lỗi Worker được báo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSpectralAccumulator, type AudioFeatures } from '@dawviz/render-core';
import { computeSpectrumSync, computeSpectrumViaWorker, spectrumFor, type SpectrumWorkerLike } from './spectrumClient.ts';
import type { PcmBuffer } from './audioAsset.ts';

const SR = 48000;
const stereo = (sec: number): PcmBuffer => {
  const n = Math.round(SR * sec), l = new Float32Array(n), r = new Float32Array(n);
  for (let i = 0; i < n; i++) { l[i] = 0.6 * Math.sin(2 * Math.PI * 330 * i / SR); r[i] = 0.2 * Math.sin(2 * Math.PI * 330 * i / SR); }
  return { duration: sec, sampleRate: SR, numberOfChannels: 2, length: n, getChannelData: (c) => (c ? r : l) };
};
/** Worker giả chạy đúng giao thức của spectrum.worker.ts, đồng bộ trong cùng luồng. */
function fakeWorker(fail = false): SpectrumWorkerLike & { chunks: number; terminated: boolean } {
  let acc: ReturnType<typeof createSpectralAccumulator> | null = null;
  const w = { chunks: 0, terminated: false, onmessage: null as SpectrumWorkerLike['onmessage'], onerror: null as SpectrumWorkerLike['onerror'],
    terminate() { w.terminated = true; },
    postMessage(m: { type: string; sampleRate?: number; data?: Float32Array }) {
      queueMicrotask(() => {
        if (fail) { w.onerror?.(new Error('boom')); return; }
        if (m.type === 'init') { acc = createSpectralAccumulator(m.sampleRate!); w.onmessage?.({ data: { type: 'ack' } }); }
        else if (m.type === 'chunk') { w.chunks++; acc!.push(m.data!); w.onmessage?.({ data: { type: 'ack' } }); }
        else w.onmessage?.({ data: { type: 'done', features: acc!.finish() } });
      });
    } };
  return w;
}
const same = (a: AudioFeatures, b: AudioFeatures) => { assert.equal(a.frames, b.frames); assert.deepEqual(a.spectrum, b.spectrum); assert.deepEqual(a.peak, b.peak); assert.deepEqual(a.rms, b.rms); };

test('qua Worker (chia nhiều khối) = tính thẳng, bit-by-bit; Worker được đóng', async () => {
  const buf = stereo(1.2), want = computeSpectrumSync(buf);
  for (const chunk of [777, 20000, 1 << 20]) { const w = fakeWorker(); same(await computeSpectrumViaWorker(buf, () => w, chunk), want); assert.ok(w.terminated); }
  const w = fakeWorker(); await computeSpectrumViaWorker(buf, () => w, 10000); assert.equal(w.chunks, Math.ceil(buf.length / 10000));
});
test('trộn stereo thành mono trước khi phân tích: biên độ ≈ (0,6 + 0,2)/2 = 0,4 → ≈ −8 dBFS đỉnh', () => {
  const f = computeSpectrumSync(stereo(0.5)); assert.ok(f.peak[25] > 0 && Math.abs(f.peak[25] / 255 * 80 - 80 - -7.96) < 0.6);
});
test('lỗi Worker → từ chối, không treo', async () => {
  const w = fakeWorker(true); await assert.rejects(computeSpectrumViaWorker(stereo(0.1), () => w)); assert.ok(w.terminated);
});
test('bộ đệm theo id: lần hai không tạo Worker mới', async () => {
  let made = 0; const buf = stereo(0.2);
  const a = await spectrumFor('x', buf, () => { made++; return fakeWorker(); }), b = await spectrumFor('x', buf, () => { made++; return fakeWorker(); });
  assert.equal(made, 1); assert.equal(a, b);
});
