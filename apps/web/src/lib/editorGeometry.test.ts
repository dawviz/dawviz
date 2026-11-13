// T-68: hình học của Editor. Đổi cỡ/đổi neo widget đã xoay giữ đứng yên phần không bị kéo; chọn đúng widget trên cùng.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resizeLayout, setAnchor, toCanvas, pointerAngle, hitTest, MIN_SIZE, HANDLES, type Handle } from './editorGeometry.ts';
import type { WidgetLayout } from '@dawviz/render-core';

const near = (a: number, b: number, m = '', eps = 1) => assert.ok(Math.abs(a - b) <= eps, `${m}: ${a} ≠ ${b}`);
const L = (rotation: number, anchor = { x: 0.5, y: 0.5 }): WidgetLayout => ({ x: 400, y: 300, width: 200, height: 80, rotation, anchor });
/** Góc đối diện của tay nắm (toạ độ widget, theo tỉ lệ). */
const opposite: Record<Handle, [number, number]> = { nw: [1, 1], n: [0.5, 1], ne: [0, 1], e: [0, 0.5], se: [0, 0], s: [0.5, 0], sw: [1, 0], w: [1, 0.5] };
const at = (l: WidgetLayout, fx: number, fy: number) => toCanvas(l, fx * l.width, fy * l.height);

for (const rot of [0, 15, 37, 90, -135]) for (const anchor of [{ x: 0.5, y: 0.5 }, { x: 0, y: 0 }, { x: 1, y: 0.3 }]) {
  test(`resizeLayout ${rot}° neo (${anchor.x},${anchor.y}): điểm đối diện đứng yên, tay nắm tới con trỏ`, () => {
    const s = L(rot, anchor);
    for (const h of HANDLES) {
      // kéo tay nắm ra xa thêm 30 pt theo hướng của chính widget
      const fx = h.includes('w') ? 0 : h.includes('e') ? 1 : 0.5, fy = h.includes('n') ? 0 : h.includes('s') ? 1 : 0.5;
      const [px, py] = toCanvas(s, fx * s.width + (h.includes('w') ? -30 : h.includes('e') ? 30 : 0), fy * s.height + (h.includes('n') ? -30 : h.includes('s') ? 30 : 0));
      const r = resizeLayout(s, h, { x: px, y: py });
      const [ox, oy] = opposite[h], before = at(s, ox, oy), after = at(r, ox, oy);
      near(after[0], before[0], `${h} x`); near(after[1], before[1], `${h} y`);
      const tip = at(r, fx, fy);
      if (h.length === 2) { near(tip[0], px, `${h} tip x`); near(tip[1], py, `${h} tip y`); }
      assert.equal(r.rotation, s.rotation); assert.deepEqual(r.anchor, s.anchor);
      if (h === 'e' || h === 'w') { near(r.width, 230, h); near(r.height, 80, h); }
      if (h === 'n' || h === 's') { near(r.width, 200, h); near(r.height, 110, h); }
    }
  });
}

test('resizeLayout: không nhỏ hơn MIN_SIZE; Shift giữ tỉ lệ; Alt đối xứng quanh tâm', () => {
  const s = L(0);
  const tiny = resizeLayout(s, 'se', { x: 300, y: 200 }); assert.equal(tiny.width, MIN_SIZE); assert.equal(tiny.height, MIN_SIZE);
  const sh = resizeLayout(s, 'se', { x: 800, y: 390 }, { shift: true }); near(sh.width / sh.height, 200 / 80, 'tỉ lệ'); near(sh.width, 400, 'w');
  const alt = resizeLayout(s, 'e', { x: 650, y: 340 }, { alt: true });
  near(alt.width, 300, 'alt w'); near(alt.x + alt.width / 2, 500, 'tâm giữ nguyên');
});

test('setAnchor: đổi neo widget đã xoay không làm widget nhảy chỗ', () => {
  for (const rot of [0, 30, 90, -170]) {
    const s = L(rot), r = setAnchor(s, { x: 0, y: 1 });
    assert.deepEqual(r.anchor, { x: 0, y: 1 });
    for (const [fx, fy] of [[0, 0], [1, 0], [1, 1], [0.3, 0.7]]) { const a = at(s, fx, fy), b = at(r, fx, fy); near(b[0], a[0], `${rot}`); near(b[1], a[1], `${rot}`); }
    assert.deepEqual(setAnchor(s, { x: 2, y: -1 }).anchor, { x: 1, y: 0 }); // kẹp 0..1
  }
});

test('pointerAngle: 0° phía trên tâm, 90° bên phải', () => {
  near(pointerAngle([0, 0], { x: 0, y: -10 }), 0); near(pointerAngle([0, 0], { x: 10, y: 0 }), 90); near(pointerAngle([0, 0], { x: 0, y: 10 }), 180);
});

test('hitTest: widget trên cùng theo zIndex rồi thứ tự; bỏ widget ẩn/khoá; theo hình đã xoay', () => {
  const w = (id: string, z: number, layout: WidgetLayout, visible = true) => ({ id, zIndex: z, visible, layout });
  const ws = [w('a', 10, L(0)), w('b', 20, L(0)), w('c', 20, { ...L(0), x: 0, y: 0 }), w('d', 99, L(0), false)];
  assert.equal(hitTest(ws, { x: 500, y: 340 })?.id, 'b');
  assert.equal(hitTest(ws, { x: 500, y: 340 }, new Set(['b']))?.id, 'a');
  assert.equal(hitTest(ws, { x: 5, y: 5 })?.id, 'c');
  assert.equal(hitTest(ws, { x: 1000, y: 1000 }), null);
  // thanh dài xoay 90°: góc khung bao thẳng trục không trúng
  const bar = [w('r', 1, { x: 0, y: 0, width: 200, height: 20, rotation: 90, anchor: { x: 0.5, y: 0.5 } })];
  assert.equal(hitTest(bar, { x: 100, y: 100 })?.id, 'r'); assert.equal(hitTest(bar, { x: 20, y: 10 }), null);
});

test('outsideFrame / intoFrame: chỉ báo khi khung bao không còn giao khung; đưa về bằng dịch nhỏ nhất', async () => {
  const { outsideFrame, intoFrame } = await import('./editorGeometry.ts');
  const l = (x: number, y: number, rotation = 0): WidgetLayout => ({ x, y, width: 200, height: 80, rotation, anchor: { x: 0.5, y: 0.5 } });
  assert.equal(outsideFrame(l(100, 100), 1080, 1080), false);
  assert.equal(outsideFrame(l(1000, 100), 1080, 1080), false);  // một phần trong khung: không báo
  assert.equal(outsideFrame(l(1080, 100), 1080, 1080), true);   // chạm mép ngoài: không còn phần nào trong khung
  assert.equal(outsideFrame(l(100, -80), 1080, 1080), true);
  assert.deepEqual(intoFrame(l(1200, 1110), 1080, 1080), { x: 880, y: 1000 });
  assert.deepEqual(intoFrame(l(-300, 50), 1080, 1080), { x: 0, y: 50 });
  // xoay 90°: khung bao 80 × 200 quanh tâm (x + 100, y + 40)
  const r = intoFrame(l(1100, 500, 90), 1080, 1080), b = { x: r.x + 100 - 40, w: 80 };
  assert.equal(b.x + b.w, 1080);
});
