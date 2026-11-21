import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Animation } from '@dawviz/render-core';
import { diffAnimate } from './animDiff.ts';

const ka = (...ks: [number, number, object?][]): Animation => ({ keys: ks.map(([s, v, e]) => ({ at: { sec: s }, value: v, ...(e ?? {}) })) });

test('diffAnimate: bật/tắt, thêm, xoá, dời, đổi giá trị, đường cong, cách đi tiếp, lặp', () => {
  assert.deepEqual(diffAnimate({}, { x: ka([0, 1]) }), [{ kind: 'start', path: 'x' }]);
  assert.deepEqual(diffAnimate({ x: ka([0, 1]) }, {}), [{ kind: 'stop', path: 'x' }]);
  assert.deepEqual(diffAnimate({ x: ka([0, 1]) }, { x: ka([0, 1], [2, 5]) }), [{ kind: 'add', path: 'x', at: { sec: 2 }, value: 5 }]);
  assert.deepEqual(diffAnimate({ x: ka([0, 1], [2, 5]) }, { x: ka([0, 1]) }), [{ kind: 'remove', path: 'x', at: { sec: 2 }, value: 5 }]);
  assert.deepEqual(diffAnimate({ x: ka([0, 1], [2, 5]) }, { x: ka([0, 1], [3, 5]) }), [{ kind: 'move', path: 'x', at: { sec: 2 }, to: { sec: 3 } }]);
  assert.deepEqual(diffAnimate({ x: ka([0, 1], [2, 5]) }, { x: ka([0, 1], [2, 7]) }), [{ kind: 'value', path: 'x', at: { sec: 2 }, from: 5, to: 7 }]);
  assert.deepEqual(diffAnimate({ x: ka([0, 1], [2, 5]) }, { x: ka([0, 1], [2, 5, { ease: 'easeInQuad' }]) }), [{ kind: 'curve', path: 'x', at: { sec: 2 } }]);
  assert.deepEqual(diffAnimate({ x: ka([0, 1], [2, 5]) }, { x: ka([0, 1], [2, 5, { interp: 'hold' }]) }), [{ kind: 'interp', path: 'x', at: { sec: 2 } }]);
  const loop: Animation = { ...(ka([0, 1]) as object), loop: 'CYCLE' } as Animation;
  assert.deepEqual(diffAnimate({ x: ka([0, 1]) }, { x: loop }), [{ kind: 'loop', path: 'x' }]);
  const bind: Animation = { bind: 'progress', from: [0, 1], to: [0, 1] };
  assert.deepEqual(diffAnimate({ x: ka([0, 1]) }, { x: bind }), [{ kind: 'toBind', path: 'x' }]);
  assert.deepEqual(diffAnimate({ x: bind }, { x: ka([0, 1]) }), [{ kind: 'toKeys', path: 'x' }]);
  assert.deepEqual(diffAnimate({ x: ka([0, 1]) }, { x: ka([0, 1]) }), []);
});

test('diffAnimate: nhiều đường dẫn theo thứ tự (Vị trí = x + y cùng thêm keyframe)', () => {
  const r = diffAnimate({ 'layout.x': ka([0, 1]), 'layout.y': ka([0, 2]) }, { 'layout.x': ka([0, 1], [2, 9]), 'layout.y': ka([0, 2], [2, 8]) });
  assert.deepEqual(r.map((c) => c.path), ['layout.x', 'layout.y']);
});
