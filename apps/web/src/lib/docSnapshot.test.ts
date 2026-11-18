import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialDoc } from './commands.ts';
import { toWorkspaceJson, applyWorkspace } from './docSnapshot.ts';

const base = () => initialDoc('paper');

test('docSnapshot: ghi rồi nạp lại giữ ẩn/solo/thứ tự/độ sáng/offset và scene', () => {
  const d = { ...base(), order: ['b', 'a'], hidden: ['a'], solo: ['b'], audioOffsetMs: -25, brightness: { a: { source: 'static', floorDb: -40, ceilDb: 0, minBrightness: 0.2, maxBrightness: 0.9, invert: true }, b: { source: 'off', floorDb: -60, ceilDb: 6, minBrightness: 0.3, maxBrightness: 1, invert: false } } } as ReturnType<typeof base>;
  const json = JSON.parse(JSON.stringify(toWorkspaceJson(d, { unit: 'reaper', rows: [{ pos: '1.1.00', bpm: '120', sig: '' }] })));
  const r = applyWorkspace(base(), JSON.parse(JSON.stringify(d.scene)), json, ['a', 'b']);
  assert.deepEqual(r.doc.order, ['b', 'a']); assert.deepEqual(r.doc.hidden, ['a']); assert.deepEqual(r.doc.solo, ['b']);
  assert.equal(r.doc.audioOffsetMs, -25);
  assert.equal(r.doc.brightness.a.source, 'static'); assert.equal(r.doc.brightness.a.invert, true);
  assert.equal(r.doc.scene.widgets.length, d.scene.widgets.length);
  assert.equal(r.tempoDraft?.unit, 'reaper');
});

test('docSnapshot: id track không còn trong dự án bị bỏ; track mới được thêm vào cuối', () => {
  const r = applyWorkspace(base(), base().scene, { order: ['gone', 'b'], hidden: ['gone', 'a'], solo: ['gone'], brightness: { gone: {} } }, ['a', 'b', 'c']);
  assert.deepEqual(r.doc.order, ['b', 'a', 'c']); assert.deepEqual(r.doc.hidden, ['a']); assert.deepEqual(r.doc.solo, []);
  assert.deepEqual(Object.keys(r.doc.brightness).sort(), ['a', 'b', 'c']);
});

test('docSnapshot: dữ liệu hỏng/độc hại không làm sập; giá trị sai về mặc định', () => {
  const r = applyWorkspace(base(), base().scene, { order: 'x', hidden: [1, null], audioOffsetMs: 1e12, videoStyle: 5, brightness: { a: { source: 'evil', floorDb: 'x', minBrightness: 9 } }, lookRef: { radius: 'x', __proto__: { x: 1 } }, tempoDraft: 'zzz' }, ['a']);
  assert.deepEqual(r.doc.order, ['a']); assert.deepEqual(r.doc.hidden, []);
  assert.equal(r.doc.audioOffsetMs, 60000); assert.equal(r.doc.videoStyle, 'custom');
  assert.ok(['volume', 'pan', 'mute', 'static', 'off'].includes(r.doc.brightness.a.source));
  assert.ok(r.doc.brightness.a.minBrightness <= 1);
  assert.deepEqual(r.doc.lookRef, base().lookRef);
  assert.equal(({} as { x?: number }).x, undefined);
  assert.throws(() => applyWorkspace(base(), 'không phải scene', {}, []), /./);
});
