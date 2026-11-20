// Phép tính cỡ khung xem trước: vừa chiều ngang lẫn chiều dọc; khung hẹp thì thanh phát hai hàng nên chừa thêm chiều cao.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fitStageWidth, TRANSPORT_WRAP } from './useStageWidth.ts';

test('khung rộng (≥ ngưỡng): không chừa thêm cho hàng thứ hai của thanh phát', () => {
  const o = { availW: 2000, availH: 900, aspect: 1, chrome: 100, extra: 0 };
  assert.equal(fitStageWidth(o), 800); // giới hạn bởi chiều cao: (900 − 100) × 1
});

test('khung hẹp (9:16): thanh phát hai hàng, chừa thêm TRANSPORT_WRAP.extra theo chiều cao', () => {
  const o = { availW: 2000, availH: 900, aspect: 9 / 16, chrome: 100, extra: 0 };
  const plain = Math.floor((900 - 100) * (9 / 16));            // 450 < ngưỡng → hẹp
  assert.ok(plain < TRANSPORT_WRAP.below);
  assert.equal(fitStageWidth(o), Math.floor((900 - 100 - TRANSPORT_WRAP.extra) * (9 / 16)));
});

test('chỉ thu nhỏ, không phóng to; không nhỏ hơn mức tối thiểu', () => {
  assert.ok(fitStageWidth({ availW: 300, availH: 900, aspect: 1, chrome: 100, extra: 0 }) <= 300 || fitStageWidth({ availW: 300, availH: 900, aspect: 1, chrome: 100, extra: 0 }) === 280);
  assert.equal(fitStageWidth({ availW: 100, availH: 100, aspect: 1, chrome: 100, extra: 0 }), 280);
});
