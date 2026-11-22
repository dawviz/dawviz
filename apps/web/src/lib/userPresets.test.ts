// T-111 (D-66): nhập bộ preset — trùng tên khác nội dung thì phải hỏi; không bao giờ ghi đè khi chưa được chọn rõ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultScene, createWidget } from '@dawviz/render-core';
import { addUserPreset, applyCollectionImport, planCollectionImport, uniquePresetName, type UserPreset } from './userPresets.ts';

const A = defaultScene('16:9'), B = defaultScene('16:9'); B.widgets.push(createWidget(B, 'TEXT'));
const base = (): UserPreset[] => addUserPreset([], 'Mở đầu', A).list;

test('kế hoạch: mục mới, mục trùng cả tên lẫn nội dung (bỏ qua), mục trùng tên khác nội dung (xung đột)', () => {
  const plan = planCollectionImport(base(), [{ name: 'Mở đầu', scene: A }, { name: 'Điệp khúc', scene: B }, { name: 'Mở đầu', scene: B }]);
  assert.deepEqual(plan.fresh.map((x) => x.name), ['Điệp khúc']); assert.equal(plan.same, 1); assert.deepEqual(plan.conflicts.map((x) => x.name), ['Mở đầu']);
});

test('uniquePresetName: thêm hậu tố (2), (3), giữ trong 60 ký tự', () => {
  assert.equal(uniquePresetName(new Set(['A']), 'A'), 'A (2)'); assert.equal(uniquePresetName(new Set(['A', 'A (2)']), 'A'), 'A (3)');
  const long = 'x'.repeat(60); assert.ok(uniquePresetName(new Set([long]), long).length <= 60);
});

test('áp: ghi đè chỉ khi chọn rõ và giữ nguyên id; đổi tên giữ cả hai; thiếu lựa chọn = đổi tên (không ghi đè thầm lặng)', () => {
  const list = base(), id = list[0].id, plan = planCollectionImport(list, [{ name: 'Mở đầu', scene: B }, { name: 'Mới', scene: B }]);
  const over = applyCollectionImport(list, plan, { 'Mở đầu': 'overwrite' });
  assert.equal(over.list.length, 2); assert.equal(over.list[0].id, id); assert.equal(over.list[0].scene.widgets.length, B.widgets.length); assert.equal(over.overwritten.length, 1);
  const ren = applyCollectionImport(list, plan, { 'Mở đầu': 'rename' });
  assert.deepEqual(ren.list.map((p) => p.name), ['Mở đầu', 'Mới', 'Mở đầu (2)']); assert.equal(ren.list[0].scene.widgets.length, A.widgets.length); // bản cũ còn nguyên
  const none = applyCollectionImport(list, plan, {});
  assert.deepEqual(none.list.map((p) => p.name), ['Mở đầu', 'Mới', 'Mở đầu (2)']);
  assert.equal(list[0].scene.widgets.length, A.widgets.length); // đầu vào không bị sửa
});
