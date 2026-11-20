// T-21: nạp ảnh nền: kiểm trước khi giải mã, thu nhỏ ảnh quá lớn, lỗi có mã.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BackgroundError, MAX_BACKGROUND_BYTES, hasImageExtension, imageExt, loadBackground, targetSize, type BitmapLike, type DecodeDeps } from './backgroundImage.ts';

const file = (name: string, size = 10) => ({ name, size }) as File;
const deps = (w: number, h: number, log: string[] = []): DecodeDeps => ({ async decode(_f, s) { log.push(s ? `${s.width}x${s.height}` : 'full'); return { width: s?.width ?? w, height: s?.height ?? h, close() { log.push('close'); } } as BitmapLike; } });

test('đuôi tệp và tên đuôi chuẩn', () => {
  assert.ok(hasImageExtension('a.PNG') && hasImageExtension('b.jpeg') && hasImageExtension('c.webp') && !hasImageExtension('d.svg') && !hasImageExtension('e'));
  assert.equal(imageExt('a.JPEG'), 'jpg'); assert.equal(imageExt('x.webp'), 'webp'); assert.equal(imageExt('lạ'), 'png');
});
test('targetSize: giữ tỉ lệ, cạnh dài ≤ 4096, không phóng to', () => {
  assert.deepEqual(targetSize(8192, 4096), { width: 4096, height: 2048 }); assert.deepEqual(targetSize(1920, 1080), { width: 1920, height: 1080 }); assert.deepEqual(targetSize(1000, 20000, 4000), { width: 200, height: 4000 });
});
test('ảnh vừa: giải mã một lần', async () => { const log: string[] = []; const b = await loadBackground(file('a.png'), deps(1920, 1080, log)); assert.equal(b.width, 1920); assert.deepEqual(log, ['full']); });
test('ảnh quá lớn về điểm ảnh: đóng bản đầu, giải mã lại đã thu nhỏ', async () => {
  const log: string[] = []; const b = await loadBackground(file('a.jpg'), deps(8000, 4000, log));
  assert.deepEqual([b.width, b.height], [4096, 2048]); assert.deepEqual(log, ['full', 'close', '4096x2048']);
});
test('lỗi có mã: quá lớn, sai đuôi, rỗng, giải mã hỏng; kiểm trước khi giải mã', async () => {
  const log: string[] = [];
  await assert.rejects(loadBackground(file('a.png', MAX_BACKGROUND_BYTES + 1), deps(1, 1, log)), (e: BackgroundError) => e.code === 'ERR_ASSET_TOO_LARGE');
  await assert.rejects(loadBackground(file('a.svg'), deps(1, 1, log)), (e: BackgroundError) => e.code === 'ERR_ASSET_DECODE' && e.details.reason === 'format');
  await assert.rejects(loadBackground(file('a.png', 0), deps(1, 1, log)), (e: BackgroundError) => e.details.reason === 'empty');
  assert.deepEqual(log, [], 'chưa giải mã gì');
  await assert.rejects(loadBackground(file('a.png'), { decode: async () => { throw new Error('x'); } }), (e: BackgroundError) => e.code === 'ERR_ASSET_DECODE' && e.details.reason === 'decode');
});
