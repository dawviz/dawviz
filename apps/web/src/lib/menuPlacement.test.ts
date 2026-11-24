// T-114: menu thả xuống lật lên khi thiếu chỗ phía dưới và luôn nằm trong cửa sổ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { placeMenu } from './useMenuPlacement.ts';

test('đủ chỗ phía dưới: mở xuống, không giới hạn chiều cao', () => {
  assert.deepEqual(placeMenu(300, 500, 100), { up: false, maxHeight: undefined });
});
test('thiếu chỗ dưới mà trên rộng hơn: lật lên (ca thực: menu Thêm cao 328 px, dưới còn 155 px, trên 600 px)', () => {
  assert.deepEqual(placeMenu(328, 155, 600), { up: true, maxHeight: undefined });
});
test('cả hai phía đều thiếu: chọn phía rộng hơn và giới hạn chiều cao để cuộn trong khung', () => {
  const r = placeMenu(500, 120, 200); assert.equal(r.up, true); assert.equal(r.maxHeight, 188);
  const d = placeMenu(500, 250, 100); assert.equal(d.up, false); assert.equal(d.maxHeight, 238);
});
test('phía trên không rộng hơn phía dưới: giữ mở xuống dù thiếu chỗ', () => {
  assert.equal(placeMenu(400, 200, 150).up, false);
});
