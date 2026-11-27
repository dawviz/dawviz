// T-68: hình học của Editor. Đổi cỡ/đổi neo widget đã xoay giữ đứng yên phần không bị kéo; chọn đúng widget trên cùng.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resizeLayout, snapResize, setAnchor, toCanvas, pointerAngle, hitTest, MIN_SIZE, HANDLES, type Handle, resizeShared, sharedEdges, snapEdge } from './editorGeometry.ts';
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

const SNAP = { others: [] as WidgetLayout[], canvas: { width: 1080, height: 1080 }, grid: { enabled: false, size: 8 }, guides: true, threshold: 5 };
test('snapResize: cạnh đang kéo hút vào mép khung trong ngưỡng, có đường gióng; ngoài ngưỡng thì không', () => {
  const s: WidgetLayout = { x: 100, y: 100, width: 500, height: 400, rotation: 0, anchor: { x: 0.5, y: 0.5 } };
  const r = snapResize(s, 'e', { x: 1077, y: 300 }, {}, SNAP);
  assert.equal(r.layout.x + r.layout.width, 1080); assert.equal(r.layout.x, 100);
  assert.deepEqual(r.guides.map((g) => [g.axis, g.pos, g.with]), [['x', 1080, 'canvas']]);
  const far = snapResize(s, 'e', { x: 1060, y: 300 }, {}, SNAP);
  assert.equal(far.layout.width, 960); assert.equal(far.guides.length, 0);
});
test('snapResize: hút vào cạnh widget khác; góc kéo hút cả hai trục; Ctrl (off) tắt; lưới khi không có đích', () => {
  const s: WidgetLayout = { x: 100, y: 100, width: 300, height: 300, rotation: 0, anchor: { x: 0.5, y: 0.5 } };
  const other: WidgetLayout = { x: 600, y: 700, width: 200, height: 100, rotation: 0, anchor: { x: 0.5, y: 0.5 } };
  const r = snapResize(s, 'se', { x: 597, y: 703 }, {}, { ...SNAP, others: [other] });
  assert.deepEqual([r.layout.x + r.layout.width, r.layout.y + r.layout.height], [600, 700]);
  assert.equal(r.guides.length, 2);
  const off = snapResize(s, 'se', { x: 597, y: 703 }, {}, { ...SNAP, others: [other], off: true });
  assert.deepEqual([off.layout.width, off.layout.height], [497, 603]);
  const grid = snapResize(s, 'se', { x: 503, y: 509 }, {}, { ...SNAP, guides: false, grid: { enabled: true, size: 8 } });
  assert.deepEqual([grid.layout.x + grid.layout.width, grid.layout.y + grid.layout.height], [504, 512]);
});
test('snapResize: xoay 90° vẫn hút đúng trục khung; góc xiên thì không hút', () => {
  // Widget 200×80 xoay 90° quanh tâm: tay nắm "e" đi theo trục y của khung.
  const s: WidgetLayout = { x: 400, y: 300, width: 200, height: 80, rotation: 90, anchor: { x: 0.5, y: 0.5 } };
  const [, ey] = at(s, 1, 0.5);
  const r = snapResize(s, 'e', { x: 440, y: ey + 3 }, {}, { ...SNAP, canvas: { width: 1080, height: ey + 5 } });
  near(at(r.layout, 1, 0.5)[1], ey + 5, 'mép dưới khung', 0.6);
  const tilted = snapResize({ ...s, rotation: 30 }, 'e', { x: 700, y: 400 }, {}, SNAP);
  assert.equal(tilted.guides.length, 0);
});

// ── T-68: căn chỉnh, chia đều, khung chọn ──
import { alignLayouts, distributeLayouts, marqueeHits } from './editorGeometry.ts';
import { rotatedBounds } from '@dawviz/render-core';
const box = (x: number, y: number, w: number, h: number, rotation = 0): WidgetLayout => ({ x, y, width: w, height: h, rotation, anchor: { x: 0.5, y: 0.5 } });

test('căn chỉnh: nhiều widget theo khung bao chung (kể cả widget xoay, theo khung bao đã xoay); một widget theo khung video', () => {
  const items = [{ id: 'a', layout: box(100, 100, 200, 50) }, { id: 'b', layout: box(400, 300, 100, 100) }, { id: 'c', layout: box(250, 500, 100, 40, 90) }];
  const left = alignLayouts(items, 'left', { width: 1080, height: 1080 });
  for (const it of items) near(rotatedBounds({ ...it.layout, ...left[it.id] }).x, 100, `left ${it.id}`, 0.5);
  const right = alignLayouts(items, 'right', { width: 1080, height: 1080 });
  for (const it of items) near(rotatedBounds({ ...it.layout, ...right[it.id] }).x + rotatedBounds(it.layout).width, 500, `right ${it.id}`, 0.5);
  const mid = alignLayouts([items[0]], 'vcenter', { width: 1080, height: 1080 });
  assert.deepEqual(mid.a, { x: 100, y: 515 });
  assert.deepEqual(alignLayouts([items[0]], 'hcenter', { width: 1080, height: 1080 }).a, { x: 440, y: 100 });
});

test('chia đều: hai widget ngoài cùng đứng yên, khoảng trống giữa các widget bằng nhau; dưới 3 widget thì không làm gì', () => {
  const items = [{ id: 'a', layout: box(0, 0, 100, 20) }, { id: 'b', layout: box(130, 0, 50, 20) }, { id: 'c', layout: box(500, 0, 100, 20) }, { id: 'd', layout: box(260, 0, 150, 20) }];
  const out = distributeLayouts(items, 'x');
  assert.deepEqual(Object.keys(out).sort(), ['b', 'd']);
  const xs = items.map((it) => ({ ...it.layout, ...(out[it.id] ?? {}) })).sort((p, q) => p.x - q.x);
  const gaps = xs.slice(1).map((l, i) => l.x - (xs[i].x + xs[i].width));
  for (const g of gaps) near(g, gaps[0], 'gap', 1);
  assert.deepEqual(distributeLayouts(items.slice(0, 2), 'x'), {});
});

test('khung chọn: chọn widget hiện, không khoá, có khung bao giao với khung kéo', () => {
  const ws = [{ id: 'a', visible: true, layout: box(0, 0, 100, 100) }, { id: 'b', visible: false, layout: box(10, 10, 50, 50) }, { id: 'c', visible: true, layout: box(300, 300, 50, 50) }, { id: 'd', visible: true, layout: box(20, 20, 10, 10) }];
  assert.deepEqual(marqueeHits(ws, { x: 50, y: 50, width: 10, height: 10 }, new Set()), ['a']);
  assert.deepEqual(marqueeHits(ws, { x: 0, y: 0, width: 400, height: 400 }, new Set(['d'])), ['a', 'c']);
});

test('khung theo scale: co giãn quanh điểm neo; dời/đổi cỡ trên khung đang thấy đổi ngược về bố cục gốc', async () => {
  const { scaledLayout, unscalePatch } = await import('./editorGeometry.ts');
  const L = { x: 100, y: 100, width: 200, height: 100, rotation: 0, anchor: { x: 0.5, y: 0.5 } };
  const S = scaledLayout(L, 2);
  assert.deepEqual([S.x, S.y, S.width, S.height], [0, 50, 400, 200]); // tâm giữ nguyên (200, 150)
  assert.equal(scaledLayout(L, 1), L); assert.equal(scaledLayout(L, 0), L);
  assert.deepEqual(unscalePatch(S, { x: S.x + 30, y: S.y - 10 }, 2), { x: 130, y: 90 }); // dời: cùng khoảng dời
  const r = unscalePatch(S, { width: 600 }, 2); // kéo khung đang thấy rộng thêm 200 → gốc rộng thêm 100
  assert.equal(r.width, 300); assert.equal(r.x, 150); assert.ok(!('height' in r)); // mép trái khung đang thấy giữ ở 0: scaledLayout(gốc mới).x = 0
  assert.equal(scaledLayout({ ...L, x: r.x!, width: r.width! }, 2).x, 0);
  assert.deepEqual(unscalePatch(L, { x: 5 }, 1), { x: 5 });
});

const lay = (x: number, y: number, width: number, height: number, rotation = 0) => ({ x, y, width, height, rotation, anchor: { x: 0.5, y: 0.5 } });
test('D-79 cạnh chung: tìm cạnh chạm nhau giữa các widget không xoay (cả ngang lẫn dọc), bỏ widget xoay và cạnh không chạm', () => {
  const e = sharedEdges([{ id: 'a', layout: lay(0, 0, 100, 50) }, { id: 'b', layout: lay(100, 10, 80, 100) }, { id: 'c', layout: lay(0, 50, 100, 60) }, { id: 'd', layout: lay(300, 0, 10, 10) }, { id: 'r', layout: lay(180, 0, 10, 10, 30) }]);
  assert.deepEqual(e.map((x) => [x.axis, x.a, x.b, x.pos, x.from, x.to]), [['x', 'a', 'b', 100, 10, 50], ['y', 'a', 'c', 50, 0, 100], ['x', 'c', 'b', 100, 50, 110]]);
  assert.equal(sharedEdges([{ id: 'a', layout: lay(0, 0, 100, 50) }, { id: 'b', layout: lay(103, 0, 50, 50) }]).length, 0); // cách 3 pt: không chung
});
test('D-79 kéo cạnh chung: bên trước đổi cỡ, bên sau dời mép; tổng bề rộng giữ nguyên; mỗi bên còn ít nhất MIN_SIZE', () => {
  const a = lay(0, 0, 100, 50), b = lay(100, 0, 80, 50);
  assert.deepEqual(resizeShared('x', a, b, 130), { a: { width: 130 }, b: { x: 130, width: 50 } });
  assert.deepEqual(resizeShared('x', a, b, -500), { a: { width: 8 }, b: { x: 8, width: 172 } });
  assert.deepEqual(resizeShared('x', a, b, 9999), { a: { width: 172 }, b: { x: 172, width: 8 } });
  const c = lay(0, 50, 100, 60);
  assert.deepEqual(resizeShared('y', a, c, 70.4), { a: { height: 70 }, b: { y: 70, height: 40 } });
});
test('D-79 hút cạnh chung: nửa và mép khung video, mép widget khác (gióng), rồi lưới; Ctrl tắt', () => {
  const o = { others: [lay(500, 0, 50, 50)], canvas: { width: 1000, height: 600 }, grid: { enabled: false, size: 8 }, guides: true, threshold: 5 };
  assert.equal(snapEdge('x', 497, [0, 50], o).pos, 500);          // nửa khung (cũng là mép widget khác)
  assert.equal(snapEdge('x', 3, [0, 50], o).pos, 0);              // mép khung
  assert.equal(snapEdge('y', 303, [0, 50], o).pos, 300);          // nửa chiều cao
  assert.equal(snapEdge('x', 200, [0, 50], o).guide, null);       // xa mọi đích
  assert.equal(snapEdge('x', 497, [0, 50], { ...o, off: true }).pos, 497);
  assert.equal(snapEdge('x', 203, [0, 50], { ...o, guides: false, grid: { enabled: true, size: 8 } }).pos, 200);
  assert.deepEqual(snapEdge('x', 497, [10, 40], o).guide, { axis: 'x', pos: 500, from: 10, to: 40, kind: 'edge', with: 'canvas' });
});
