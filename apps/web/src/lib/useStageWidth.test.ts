// Phép tính cỡ khung xem trước: vừa chiều ngang lẫn chiều dọc; khung hẹp thì thanh phát hai hàng nên chừa thêm chiều cao.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fitStageWidth, TRANSPORT_WRAP, TRANSPORT_WRAP_DURATION } from './useStageWidth.ts';

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

test('khung rất hẹp (< 22,5 rem): độ dài bài xuống dòng thứ ba, chừa thêm TRANSPORT_WRAP_DURATION.extra (T-128)', () => {
  const o = { availW: 2000, availH: 700, aspect: 9 / 16, chrome: 100, extra: 0 };
  const two = Math.floor((700 - 100 - TRANSPORT_WRAP.extra) * (9 / 16));     // 319 < 362 → ba dòng
  assert.ok(two < TRANSPORT_WRAP_DURATION.below);
  assert.equal(fitStageWidth(o), Math.floor((700 - 100 - TRANSPORT_WRAP.extra - TRANSPORT_WRAP_DURATION.extra) * (9 / 16)));
});

test('ngưỡng px khớp container query trong index.css (rem × 16 + 2 px viền hộp); cột thời gian rộng theo nội dung', () => {
  const css = readFileSync(new URL('../index.css', import.meta.url), 'utf8');
  const q = [...css.matchAll(/@container \(max-width: ([\d.]+)rem\)\s*\{([^@]*)/g)].map(([, r, body]) => ({ px: Number(r) * 16 + 2, body }));
  const wrap = q.find((x) => x.body.includes('.tp-in')), dur = q.find((x) => x.body.includes('.tp-dur'));
  assert.equal(wrap?.px, TRANSPORT_WRAP.below); assert.equal(dur?.px, TRANSPORT_WRAP_DURATION.below);
  assert.match(dur!.body, /grid-template-areas: 'clock bar' '\. dur'/);
  assert.match(css, /\.tp-dur\s*\{\s*min-width:\s*max-content/);
});
