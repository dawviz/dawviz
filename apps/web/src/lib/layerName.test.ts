import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkLayerName } from './layerName.ts';

const names: Record<string, string> = { a: 'Chord', b: 'Time & bar', c: 'Tiêu đề' };
const ids = Object.keys(names), display = (id: string) => names[id];

test('tên hợp lệ: bỏ khoảng trắng thừa, nhận tên có dấu', () => {
  assert.deepEqual(checkLayerName('  Hợp  âm   chính ', 'a', ids, display), { ok: true, value: 'Hợp âm chính' });
  assert.deepEqual(checkLayerName('Chord', 'a', ids, display), { ok: true, value: 'Chord' }); // đúng tên hiện tại của chính nó: không phải trùng
});
test('trống hoặc chỉ khoảng trắng → xoá tên riêng (về tên theo loại)', () => {
  assert.deepEqual(checkLayerName('', 'a', ids, display), { ok: true, value: null });
  assert.deepEqual(checkLayerName(' \t ', 'a', ids, display), { ok: true, value: null });
});
test('trùng tên lớp khác (không phân biệt hoa/thường, khoảng trắng) → không nhận', () => {
  assert.deepEqual(checkLayerName('time & BAR', 'a', ids, display), { ok: false, reason: 'duplicate', name: 'time & BAR' });
  assert.deepEqual(checkLayerName('TIÊU  ĐỀ', 'a', ids, display), { ok: false, reason: 'duplicate', name: 'TIÊU ĐỀ' });
});
test('quá dài → không nhận; ký tự điều khiển bị bỏ', () => {
  assert.equal(checkLayerName('x'.repeat(61), 'a', ids, display).ok, false);
  assert.equal(checkLayerName('x'.repeat(60), 'a', ids, display).ok, true);
  assert.deepEqual(checkLayerName('A\u0000B\nC', 'a', ids, display), { ok: true, value: 'A B C' });
});
