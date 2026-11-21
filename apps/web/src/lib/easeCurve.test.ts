import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EASING_NAMES, parseEase } from '@dawviz/render-core';
import { DEFAULT_BEZIER, EASE_BEZIER, LINEAR, bezierOf, clampBezier, common, easeName, easeSamples, graphRange, sameEase } from './easeCurve.ts';

test('bezierOf: chưa đặt = đều; tên trong bảng; cubicBezier; không biểu diễn được → null', () => {
  assert.deepEqual(bezierOf(undefined), LINEAR);
  assert.deepEqual(bezierOf('easeOutCubic'), [0.33, 1, 0.68, 1]);
  assert.deepEqual(bezierOf({ cubicBezier: [2, 5, -1, 0.5] }), [1, 2, 0, 0.5], 'kẹp x [0,1], y [-1,2]');
  assert.equal(bezierOf('easeOutBounce'), null);
  assert.equal(bezierOf('hold'), null);
  assert.equal(bezierOf({ steps: 4 }), null);
  for (const k of Object.keys(EASE_BEZIER)) assert.ok(EASING_NAMES.includes(k), `${k} là easing có tên của Render Core`);
});

test('bezier tương đương bám sát hàm thật (sai lệch ≤ 0,08)', () => {
  for (const [name, b] of Object.entries(EASE_BEZIER)) {
    const real = parseEase(name).fn, approx = parseEase({ cubicBezier: b }).fn;
    let worst = 0; for (let i = 0; i <= 50; i++) worst = Math.max(worst, Math.abs(real(i / 50) - approx(i / 50)));
    assert.ok(worst <= 0.08, `${name}: ${worst}`);
  }
});

test('clampBezier làm tròn 3 chữ số; easeName; sameEase', () => {
  assert.deepEqual(clampBezier([0.12345, 0.5, 0.98765, 1]), [0.123, 0.5, 0.988, 1]);
  assert.equal(easeName(undefined), 'linear');
  assert.equal(easeName('hold'), 'hold');
  assert.equal(easeName({ cubicBezier: DEFAULT_BEZIER }), 'custom');
  assert.ok(sameEase(undefined, 'linear'));
  assert.ok(sameEase({ cubicBezier: [0, 0, 1, 1] }, { cubicBezier: [0, 0, 1, 1] }));
  assert.ok(!sameEase('easeInQuad', 'easeOutQuad'));
});

test('lấy mẫu và miền trục y: chứa [0,1], nới theo vượt đà và tay nắm', () => {
  const s = easeSamples('linear', 4);
  assert.deepEqual(s.map(([x]) => x), [0, 0.25, 0.5, 0.75, 1]);
  const [lo, hi] = graphRange(s, LINEAR);
  assert.ok(lo < 0 && hi > 1 && lo > -0.1 && hi < 1.1);
  const back = graphRange(easeSamples('easeOutBack'), EASE_BEZIER.easeOutBack);
  assert.ok(back[1] >= 1.56, 'tay nắm y = 1,56 nằm trong miền');
});

test('common: giống hết → giá trị; khác → mixed; rỗng → undefined', () => {
  assert.equal(common([1, 1]), 1);
  assert.equal(common([1, 2]), 'mixed');
  assert.equal(common([]), undefined);
  assert.equal(common<unknown>([{ a: 1 }, { a: 1 }], (a, b) => JSON.stringify(a) === JSON.stringify(b)) !== 'mixed', true);
});
