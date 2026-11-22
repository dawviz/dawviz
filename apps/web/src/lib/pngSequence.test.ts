import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
import { dirSink, estimatePngBytes, pngName, safeBase, vp9AlphaSupported, wavBytes, zipSink } from './pngSequence.ts';

test('tên tệp: đếm từ 1, đủ chữ số (tối thiểu 6); tên gốc an toàn', () => {
  assert.equal(pngName('bai', 0, 10), 'bai_000001.png');
  assert.equal(pngName('bai', 1233999, 1234567), 'bai_1234000.png');
  assert.equal(safeBase('My: song/v2*.als'), 'My_ song_v2_');
  assert.equal(safeBase(''), 'dawviz');
});

test('ước tính dung lượng: PNG theo điểm ảnh × số khung, cộng WAV', () => {
  assert.equal(estimatePngBytes({ width: 100, height: 100, frames: 10 }), 30000);
  assert.equal(estimatePngBytes({ width: 0, height: 0, frames: 0, wavSeconds: 1, sampleRate: 1000, channels: 2 }), 44 + 4000);
});

test('WAV 16 bit: đầu tệp đúng, mẫu xen kẽ kênh, kẹp −1…1', () => {
  const w = wavBytes([Float32Array.from([0, 1, -1, 2]), Float32Array.from([0.5, -0.5, 0, -3])], 8000), v = new DataView(w.buffer);
  assert.equal(strFromU8(w.subarray(0, 4)), 'RIFF'); assert.equal(strFromU8(w.subarray(8, 12)), 'WAVE');
  assert.equal(v.getUint16(22, true), 2); assert.equal(v.getUint32(24, true), 8000); assert.equal(v.getUint32(40, true), 16);
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7].map((i) => v.getInt16(44 + i * 2, true)), [0, 16384, 32767, -16384, -32768, 0, 32767, -32768]);
});

test('đích zip: lưu nguyên (passthrough), đọc lại đúng từng tệp; đích thư mục ghi từng tệp', async () => {
  const z = zipSink();
  await z.write('a_000001.png', new Uint8Array([137, 80, 78, 71, 1, 2]));
  await z.write('a.wav', new Uint8Array([9, 9]));
  const blob = (await z.finish())!;
  const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
  assert.deepEqual(Object.keys(files).sort(), ['a.wav', 'a_000001.png']);
  assert.deepEqual([...files['a_000001.png']], [137, 80, 78, 71, 1, 2]);
  assert.ok(z.bytes() > 0);
  const written = new Map<string, Uint8Array>();
  const dir = { async getFileHandle(name: string) { return { async createWritable() { return { async write(d: Uint8Array) { written.set(name, d); }, async close() {} }; } }; } };
  const d = dirSink(dir);
  await d.write('x.png', new Uint8Array([1, 2, 3]));
  assert.equal(await d.finish(), null); assert.deepEqual([...written.get('x.png')!], [1, 2, 3]); assert.equal(d.bytes(), 3);
});

test('phát hiện VP9 alpha: theo isConfigSupported; không có VideoEncoder hoặc lỗi → false', async () => {
  assert.equal(await vp9AlphaSupported(1920, 1080, { isConfigSupported: async (c) => ({ supported: (c as { alpha?: string }).alpha === 'keep' }) }), true);
  assert.equal(await vp9AlphaSupported(1920, 1080, { isConfigSupported: async () => { throw new Error('x'); } }), false);
  assert.equal(await vp9AlphaSupported(1920, 1080, { isConfigSupported: async () => ({}) }), false);
});
