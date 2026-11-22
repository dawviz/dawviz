import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ADDABLE_WIDGETS, createWidget, defaultScene, sanitizeScene, SCENE_SCHEMA_VERSION } from '@dawviz/render-core';
import { addKey, animFields, keyTimeText, newBinding, newKeyAnimation, removeKey, setKey, sortKeys, staticValue, withSource, SOURCES, SOURCE_RANGE } from './animateFields.ts';

const base = defaultScene('16:9');
test('animFields: bố cục, độ đục rồi thuộc tính của widget; có nhãn và giới hạn; mọi loại widget', () => {
  for (const type of ADDABLE_WIDGETS) {
    const f = animFields(type); assert.deepEqual(f.slice(0, 6).map((x) => x.path), ['layout.x', 'layout.y', 'layout.width', 'layout.height', 'layout.rotation', 'opacity']);
    for (const x of f) { assert.ok(x.min < x.max, `${type}.${x.path}`); assert.ok(['number', 'color', 'bool', 'choice'].includes(x.kind)); }
  }
  const bar = animFields('TIME_BAR'); const len = bar.find((x) => x.path === 'barLength')!; assert.equal(len.kind, 'number'); assert.ok(len.labelKey.startsWith('web.ws.') && len.min === 4 && len.max === 1000);
  assert.equal(bar.find((x) => x.path === 'barColor')!.kind, 'color');
  assert.equal(bar.find((x) => x.path === 'showBars')!.kind, 'bool');
  const fmt = bar.find((x) => x.path === 'time.format')!; assert.equal(fmt.kind, 'choice'); assert.deepEqual(fmt.options, ['grouped', 'clock']); // lựa chọn lấy từ bảng Thiết lập
  assert.ok(animFields('PIANO_ROLL').some((x) => x.path === 'noteStyle.base.glow'));
});

test('hoạt hình mới giữ đúng giá trị hiện tại; binding mới hợp lệ với bộ đọc preset', () => {
  const w = createWidget(base, 'TIME_BAR');
  assert.equal(staticValue(w, 'layout.width'), w.layout.width); assert.equal(staticValue(w, 'barLength'), (w.properties as { barLength: number }).barLength); assert.equal(staticValue(w, 'opacity'), 1);
  const k = newKeyAnimation(w, 'barLength', 1.23456); assert.deepEqual(k, { keys: [{ at: { sec: 1.235 }, value: (w.properties as { barLength: number }).barLength }] });
  const nb = newKeyAnimation(w, 'showBars', 0); assert.equal(nb.kind, 'discrete'); assert.equal(nb.keys[0].value, true); // theo bậc
  for (const f of animFields('TIME_BAR').filter((x) => x.kind === 'number' || x.kind === 'color')) for (const src of SOURCES) {
    const anim = f.kind === 'color' ? newBinding(w, f, src) : newBinding(w, f, src);
    const r = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ ...w, animate: { [f.path]: anim } }] });
    assert.deepEqual(r.warnings, [], `${f.path}/${src}`); assert.ok(r.scene.widgets[0].animate?.[f.path], `${f.path}/${src}`);
  }
  assert.deepEqual(withSource(newBinding(w, animFields('TIME_BAR').find((x) => x.path === 'barLength')!), 'notes.velocity').from, SOURCE_RANGE['notes.velocity']);
});

test('keyframe: thêm theo thứ tự thời gian, trùng mốc thì thay, sửa mốc sắp lại, xoá cái cuối thì bỏ hoạt hình', () => {
  let a = newKeyAnimation(createWidget(base, 'TEXT'), 'layout.x', 0);
  a = addKey(a, 4, 300); a = addKey(a, 2, 100); a = addKey(a, 2.0004, 150);
  assert.deepEqual(a.keys.map((k) => [(k.at as { sec: number }).sec, k.value]), [[0, a.keys[0].value], [2, 150], [4, 300]]);
  a = setKey(a, 0, { at: { sec: 9 } }); assert.equal((a.keys[2].at as { sec: number }).sec, 9);
  a = setKey(a, 0, { ease: 'easeOutQuad' }); assert.equal(a.keys[0].ease, 'easeOutQuad');
  assert.equal(removeKey({ keys: [{ at: { sec: 0 }, value: 1 }] }, 0), null); assert.equal(removeKey(a, 1)!.keys.length, 2);
  assert.equal(keyTimeText({ beat: 4 }), 'beat 4'); assert.equal(keyTimeText({ bar: 3 }), 'bar 3.1'); assert.equal(keyTimeText({ tick: 5 }), 'tick 5'); assert.equal(keyTimeText({ sec: 1 }), '');
  assert.deepEqual(sortKeys([{ at: { beat: 1 }, value: 1 }, { at: { sec: 5 }, value: 2 }, { at: { sec: 1 }, value: 3 }]).map((k) => k.value), [3, 2, 1]);
});
