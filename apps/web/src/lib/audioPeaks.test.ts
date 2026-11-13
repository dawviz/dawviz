// T-08: sóng âm tất định (không phụ thuộc cách chia khối), rút gọn, đặt lên trục có offset, client Worker.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PEAK_BUCKET, createPeaksAccumulator, downmixMono, peaksPath, placePeaks, reducePeaks } from './audioPeaks.ts';
import { computePeaksSync, computePeaksViaWorker, type PeaksWorkerLike } from './peaksClient.ts';
import type { PcmBuffer } from './audioAsset.ts';

function synth(n: number, channels = 2): PcmBuffer {
  let seed = 12345; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1; // LCG có seed
  const data = Array.from({ length: channels }, () => Float32Array.from({ length: n }, () => rnd() * 0.8));
  return { duration: n / 48000, sampleRate: 48000, numberOfChannels: channels, length: n, getChannelData: (c) => data[c] };
}
const bits = (a: Float32Array) => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('hex');

test('đỉnh: ô cố định 512 mẫu; (min, max) đúng; ô cuối ngắn vẫn được tính', () => {
  const acc = createPeaksAccumulator(); const d = new Float32Array(PEAK_BUCKET * 2 + 10);
  d[3] = -0.5; d[600] = 0.9; d[PEAK_BUCKET * 2 + 4] = 0.25;
  acc.push(d); const p = acc.finish();
  assert.equal(p.length, 6);
  assert.deepEqual([...p], [-0.5, 0, 0, 0.9, 0, 0.25].map(Math.fround));
});
test('tất định: cùng PCM, chia khối kiểu nào cũng cho kết quả giống từng bit; chạy lại giống từng bit', () => {
  const b = synth(PEAK_BUCKET * 37 + 123);
  const ref = bits(computePeaksSync(b, 1 << 20));
  for (const chunk of [1, 7, 511, 512, 513, 1000, 4096, 99999]) assert.equal(bits(computePeaksSync(b, chunk)), ref, `chunk=${chunk}`);
  assert.equal(bits(computePeaksSync(b)), ref);
});
test('downmix: (L+R)/2; mono giữ nguyên', () => {
  const l = Float32Array.of(1, 0.5), r = Float32Array.of(0, -0.5);
  assert.deepEqual([...downmixMono([l, r], 0, 2)], [0.5, 0]);
  assert.deepEqual([...downmixMono([l], 0, 2)], [1, 0.5]);
});
test('reducePeaks: min/max theo nhóm, không nội suy; nhiều cột hơn ô thì lặp ô; chuẩn hoá theo đỉnh', () => {
  const base = Float32Array.of(-1, 0.5, -0.2, 0.2, -0.3, 0.9, 0, 0.1); // 4 ô
  const r = reducePeaks(base, 2); assert.deepEqual([...r.data].map((v) => +v.toFixed(2)), [-1, 0.5, -0.3, 0.9]); assert.equal(r.peak, 1);
  const wide = reducePeaks(base, 8); assert.equal(wide.data.length, 16);
  assert.equal(reducePeaks(new Float32Array(0), 5).peak, 0);
  assert.equal(bits(reducePeaks(base, 3).data), bits(reducePeaks(base, 3).data));
});
test('placePeaks: offset dương dời sóng sang phải (phần đầu im), offset âm cắt phần trước mốc 0', () => {
  const base = new Float32Array(200).fill(0).map((_, i) => (i % 2 ? 0.5 : -0.5)); // 100 ô, đều
  const pos = placePeaks(base, 10, 2, 10, 100); // tệp 10 s trên trục 10 s, trễ 2 s
  assert.equal(pos.data[2 * 10], 0); assert.equal(pos.data[2 * 19 + 1], 0, 'cột 0–19 im lặng');
  assert.ok(pos.data[2 * 25 + 1] > 0);
  const neg = placePeaks(base, 10, -2, 10, 100);
  assert.ok(neg.data[2 * 0 + 1] > 0 && neg.data[2 * 79 + 1] > 0); assert.equal(neg.data[2 * 85 + 1], 0, 'phần sau hết tệp im lặng');
  assert.equal(placePeaks(base, 10, 0, 0, 100).peak, 0);
});
test('peaksPath: dựng đường SVG hữu hạn, im lặng → vạch mỏng ở tâm', () => {
  const p = peaksPath({ data: new Float32Array(6), peak: 0 }, 24);
  assert.match(p, /^(M[\d.]+ [\d.]+V[\d.]+)+$/); assert.ok(!/NaN|Infinity/.test(p));
});
test('client Worker: gửi theo khối có chờ ack, kết quả khớp bản đồng bộ, Worker được đóng', async () => {
  const b = synth(PEAK_BUCKET * 9 + 5);
  const acc = createPeaksAccumulator(); let terminated = false, chunks = 0, inflight = 0, maxInflight = 0;
  const w: PeaksWorkerLike = {
    onmessage: null, onerror: null, terminate() { terminated = true; },
    postMessage(m: unknown) {
      const msg = m as { type: string; data?: Float32Array };
      queueMicrotask(() => {
        if (msg.type === 'chunk') { inflight++; maxInflight = Math.max(maxInflight, inflight); chunks++; acc.push(msg.data!); inflight--; w.onmessage?.({ data: { type: 'ack' } }); }
        else w.onmessage?.({ data: { type: 'done', peaks: acc.finish() } });
      });
    },
  };
  const got = await computePeaksViaWorker(b, () => w, 1000);
  assert.equal(bits(got), bits(computePeaksSync(b))); assert.ok(terminated); assert.equal(chunks, Math.ceil(b.length / 1000)); assert.equal(maxInflight, 1);
});
