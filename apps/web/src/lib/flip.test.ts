import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FLIP_MS, flipDeltas, flipFrames } from './flip.ts';

test('flipDeltas: độ dời = cũ − mới; bỏ hàng mới, hàng mất và hàng đứng yên', () => {
  const before = new Map([['a', 0], ['b', 24], ['c', 48], ['gone', 72]]);
  const after = new Map([['b', 0], ['a', 24], ['c', 48.2], ['new', 72]]);
  assert.deepEqual([...flipDeltas(before, after)], [['b', 24], ['a', -24]]);
});

test('flipDeltas: không đổi gì thì không có hàng nào trượt', () => {
  const m = new Map([['a', 0], ['b', 20]]);
  assert.equal(flipDeltas(m, new Map(m)).size, 0);
});

test('flipFrames: từ chỗ cũ về 0 trong 150 ms', () => {
  assert.equal(FLIP_MS, 150);
  assert.deepEqual(flipFrames(-20), [{ transform: 'translateY(-20px)' }, { transform: 'translateY(0)' }]);
});
