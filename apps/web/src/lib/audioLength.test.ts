import { test } from 'node:test';
import assert from 'node:assert/strict';
import { audioLengthCheck } from './audioLength.ts';

test('lệch độ dài: ngưỡng không đối xứng, tính cả offset, nêu tỉ lệ', () => {
  assert.equal(audioLengthCheck(200, 200).kind, 'ok');
  assert.equal(audioLengthCheck(205, 200).kind, 'ok', 'đuôi vang vài giây là bình thường');
  assert.equal(audioLengthCheck(190, 200).kind, 'shorter');
  assert.equal(audioLengthCheck(197, 200).kind, 'ok', '3 s < max(1 s; 2 % = 4 s)');
  assert.equal(audioLengthCheck(120, 100).kind, 'longer', '20 s > max(10 s; 10 s)');
  assert.equal(audioLengthCheck(108, 100).kind, 'ok');
  assert.equal(audioLengthCheck(100, 100, 15).kind, 'longer', 'offset đẩy cuối âm thanh ra xa');
  assert.equal(audioLengthCheck(100, 100, -15).kind, 'shorter');
  assert.ok(Math.abs(audioLengthCheck(94, 100).ratio - 0.94) < 1e-12);
  assert.equal(audioLengthCheck(0, 100).kind, 'ok'); assert.equal(audioLengthCheck(10, 0).kind, 'ok');
});
