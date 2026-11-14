// T-72: ghi đè kiểu chữ trong mục "Chữ": đặt/bỏ theo đường dẫn, chỗ chữ của từng widget, kiểu tham chiếu của dòng và đoạn; lệnh hoàn tác.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_TEXT_STYLES, saveAsTextStyle } from '@dawviz/render-core';
import { clearOverride, getOverride, isOverridden, newStyleId, overrideCount, setOverride, slotStyles, textSlots } from './textRef.ts';
import { initialDoc, patchTextRef, setTextStyles } from './commands.ts';

test('đặt/bỏ ghi đè: thuộc tính thường và thuộc tính con; đối tượng con rỗng thì bỏ hẳn', () => {
  let r = setOverride({ styleId: 'title' }, 'size', 40);
  r = setOverride(r, 'stroke.width', 2);
  assert.deepEqual(r, { styleId: 'title', size: 40, stroke: { width: 2 } });
  assert.equal(getOverride(r, 'stroke.width'), 2); assert.ok(isOverridden(r, 'size')); assert.ok(!isOverridden(r, 'stroke.color'));
  assert.equal(overrideCount(r), 2);
  assert.deepEqual(clearOverride(r, 'stroke.width'), { styleId: 'title', size: 40 });
  assert.deepEqual(clearOverride(clearOverride(r, 'stroke.width'), 'size'), { styleId: 'title' });
});

test('chỗ chữ theo widget: dòng có kiểu mặc định, đoạn trỏ về dòng chứa nó; widget không chữ thì rỗng', () => {
  assert.deepEqual(textSlots('TRACK_INFO').map((s) => [s.field, s.fallbackId]), [['titleStyle', 'title'], ['artistStyle', 'subtitle']]);
  assert.deepEqual(textSlots('CHORD_DETECTION').map((s) => [s.field, s.parent ?? '']), [['nameStyle', ''], ['bassStyle', 'nameStyle'], ['notesStyle', ''], ['notesValueStyle', 'notesStyle']]);
  assert.deepEqual(textSlots('PIANO_ROLL'), []);
});

test('kiểu tham chiếu (đích ↺): dòng = kiểu không ghi đè; đoạn = kiểu thật của dòng cha', () => {
  const props = { nameStyle: { styleId: 'heading', color: '#FF0000' }, bassStyle: { size: 20 } };
  const [name, bass] = textSlots('CHORD_DETECTION');
  const a = slotStyles(props, name, DEFAULT_TEXT_STYLES);
  assert.deepEqual([a.base.color, a.resolved.color], ['#111111', '#FF0000']);
  const b = slotStyles(props, bass, DEFAULT_TEXT_STYLES);
  assert.deepEqual([b.base.color, b.base.size, b.resolved.size, b.resolved.color], ['#FF0000', 34, 20, '#FF0000']);
});

test('lệnh: đổi cùng thuộc tính gộp một bước, khác thuộc tính là bước mới; hoàn tác trả ghi đè cũ; lưu kiểu đổi cả bộ kiểu và chữ', () => {
  const d = initialDoc('paper');
  const w = d.scene.widgets.find((x) => x.type === 'TRACK_INFO')!;
  const c1 = patchTextRef(d, w.id, 'titleStyle', { styleId: 'title', size: 50 }, 'size')!;
  const d1 = c1.redo(d);
  assert.deepEqual((d1.scene.widgets.find((x) => x.id === w.id)!.properties as any).titleStyle, { styleId: 'title', size: 50 });
  assert.deepEqual((c1.undo(d1).scene.widgets.find((x) => x.id === w.id)!.properties as any).titleStyle, (w.properties as any).titleStyle);
  const c2 = patchTextRef(d1, w.id, 'titleStyle', { styleId: 'title', size: 50, italic: true }, 'italic')!;
  assert.notEqual(c1.mergeKey, c2.mergeKey);
  assert.equal(c1.mergeKey, patchTextRef(d, w.id, 'titleStyle', { size: 60 }, 'size')!.mergeKey);
  assert.equal(patchTextRef(d, w.id, 'titleStyle', (w.properties as any).titleStyle, 'size'), null); // không đổi gì: không ghi bước
  const set0 = d1.scene.textStyles!;
  const s = saveAsTextStyle(set0, { styleId: 'title', size: 50 }, 'title', 'big', 'Big');
  const c3 = setTextStyles(d1, s.set, w.id, 'titleStyle', s.ref, 'save')!;
  const d3 = c3.redo(d1);
  assert.equal(d3.scene.textStyles!.big.size, 50);
  assert.deepEqual((d3.scene.widgets.find((x) => x.id === w.id)!.properties as any).titleStyle, { styleId: 'big' });
  assert.equal(c3.undo(d3).scene.textStyles!.big, undefined);
});

test('id kiểu mới từ tên: bỏ dấu, không trùng', () => {
  assert.equal(newStyleId(DEFAULT_TEXT_STYLES, 'Tiêu đề lớn'), 'tieu-de-lon');
  assert.equal(newStyleId(DEFAULT_TEXT_STYLES, 'Title'), 'title-2');
  assert.equal(newStyleId(DEFAULT_TEXT_STYLES, '123'), 'style');
});
