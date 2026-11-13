// T-07: snap() thuần: lưới, Smart Guides (cạnh, tâm, mép canvas), widget xoay 0°/15°/37°/90° dùng khung bao thẳng trục.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { snap, rotatedBounds, normalizeAngle, type SnapLayout } from '../src/index.ts';

const near = (a: number, b: number, m = '') => assert.ok(Math.abs(a - b) < 1e-9, `${m} ${a} ≠ ${b}`);
const canvas = { width: 1920, height: 1080 };
const W = (x: number, y: number, width: number, height: number, rotation = 0, anchor?: { x: number; y: number }): SnapLayout => ({ x, y, width, height, rotation, ...(anchor ? { anchor } : {}) });
const base = { others: [] as SnapLayout[], canvas, grid: { enabled: false, size: 8 }, guides: false };

test('normalizeAngle: về (−180, 180]', () => {
  assert.deepEqual([0, 180, -180, 181, -181, 360, 720, 15, -270, 90].map(normalizeAngle), [0, 180, 180, -179, 179, 0, 0, 15, 90, 90]);
  assert.equal(normalizeAngle(NaN), 0);
});

test('rotatedBounds: 0° là chính khung; 90° hoán đổi rộng/cao quanh tâm; 15° và 37° theo công thức; neo khác tâm', () => {
  assert.deepEqual(rotatedBounds(W(10, 20, 200, 100)), { x: 10, y: 20, width: 200, height: 100 });
  const r90 = rotatedBounds(W(100, 100, 200, 100, 90)); // tâm (200,150)
  near(r90.x, 150); near(r90.y, 50); near(r90.width, 100); near(r90.height, 200);
  for (const deg of [15, 37]) {
    const a = (deg * Math.PI) / 180, w = 200, h = 100;
    const r = rotatedBounds(W(100, 100, w, h, deg));
    near(r.width, w * Math.cos(a) + h * Math.sin(a), `rộng ${deg}`); near(r.height, w * Math.sin(a) + h * Math.cos(a), `cao ${deg}`);
    near(r.x + r.width / 2, 200, `tâm x ${deg}`); near(r.y + r.height / 2, 150, `tâm y ${deg}`);
    // góc âm đối xứng
    const n = rotatedBounds(W(100, 100, w, h, -deg)); near(n.width, r.width); near(n.height, r.height);
  }
  // xoay 90° quanh góc trên-trái: hình đi sang trái (x giảm), chiều kim đồng hồ
  const corner = rotatedBounds(W(100, 100, 200, 100, 90, { x: 0, y: 0 }));
  near(corner.x, 0); near(corner.y, 100); near(corner.width, 100); near(corner.height, 200);
});

test('lưới: làm tròn cạnh trái/trên về bội số ô; tắt lưới thì giữ nguyên', () => {
  const g = { ...base, grid: { enabled: true, size: 8 } };
  let r = snap({ ...g, moving: W(0, 0, 100, 50), to: { x: 13, y: 19 } });
  assert.deepEqual([r.x, r.y, r.guides.length], [16, 16, 0]);
  r = snap({ ...g, moving: W(0, 0, 100, 50), to: { x: 11.9, y: 20 }, grid: { enabled: true, size: 16 } });
  assert.deepEqual([r.x, r.y], [16, 16]);
  r = snap({ ...base, moving: W(0, 0, 100, 50), to: { x: 13, y: 19 } });
  assert.deepEqual([r.x, r.y], [13, 19]);
});

test('Smart Guides theo cạnh: trong ngưỡng 5 thì hút và trả đường gióng; ngoài ngưỡng thì không', () => {
  const o = W(500, 300, 200, 100); // trái 500, phải 700, trên 300, dưới 400
  const s = { ...base, guides: true, others: [o] };
  let r = snap({ ...s, moving: W(0, 0, 120, 60), to: { x: 504, y: 100 } }); // trái ↔ trái o (500)
  assert.equal(r.x, 500);
  const gx = r.guides.find((g) => g.axis === 'x' && g.pos === 500)!;
  assert.ok(gx && gx.kind === 'edge' && gx.with === 0);
  r = snap({ ...s, moving: W(0, 0, 120, 60), to: { x: 585, y: 100 } }); // phải của nó = 705 ↔ phải o (700)
  assert.equal(r.x, 580); // 700 − 120
  r = snap({ ...s, moving: W(0, 0, 120, 60), to: { x: 506, y: 100 } }); // lệch 6: ngoài ngưỡng
  assert.deepEqual(r.guides.filter((g) => g.axis === 'x' && g.pos === 500), []); assert.equal(r.x, 506);
  r = snap({ ...s, moving: W(0, 0, 120, 60), to: { x: 100, y: 342 } }); // dưới nó = 402 ↔ dưới o (400)
  assert.equal(r.y, 340);
  // đường gióng phủ cả hai đối tượng
  r = snap({ ...s, moving: W(0, 0, 120, 60), to: { x: 502, y: 700 } });
  const g = r.guides.find((q) => q.axis === 'x')!; assert.equal(g.from, 300); assert.equal(g.to, 760);
});

test('Smart Guides theo tâm: tâm ↔ tâm widget khác; tâm ↔ tâm canvas; cạnh ↔ mép canvas', () => {
  const o = W(500, 300, 200, 100); // tâm (600, 350)
  let r = snap({ ...base, guides: true, others: [o], moving: W(0, 0, 100, 40), to: { x: 553, y: 100 } }); // tâm x = 603
  assert.equal(r.x, 550);
  assert.ok(r.guides.some((g) => g.axis === 'x' && g.pos === 600 && g.kind === 'center'));
  r = snap({ ...base, guides: true, others: [], moving: W(0, 0, 400, 200), to: { x: 758, y: 441 } }); // tâm canvas (960, 540)
  assert.deepEqual([r.x, r.y], [760, 440]);
  assert.ok(r.guides.every((g) => g.with === 'canvas' && g.kind === 'center'));
  r = snap({ ...base, guides: true, others: [], moving: W(0, 0, 400, 200), to: { x: 3, y: 878 } }); // trái ↔ 0; dưới 1078 ↔ 1080
  assert.deepEqual([r.x, r.y], [0, 880]);
  r = snap({ ...base, guides: true, others: [], moving: W(0, 0, 400, 200), to: { x: 1518, y: 0 } }); // phải 1918 ↔ 1920
  assert.equal(r.x, 1520);
});

test('Smart Guides thắng lưới; trục không có guide thì dùng lưới; guides tắt thì chỉ còn lưới', () => {
  const o = W(503, 0, 50, 300);
  const g = { ...base, grid: { enabled: true, size: 8 }, others: [o] };
  let r = snap({ ...g, guides: true, moving: W(0, 0, 60, 60), to: { x: 506, y: 21 } });
  assert.equal(r.x, 503); assert.equal(r.y, 24);
  r = snap({ ...g, guides: false, moving: W(0, 0, 60, 60), to: { x: 506, y: 21 } });
  assert.deepEqual([r.x, r.y, r.guides.length], [504, 24, 0]);
});

test('Alt tắt bắt dính; Shift khoá trục theo vị trí lúc bắt đầu kéo', () => {
  const s = { ...base, guides: true, grid: { enabled: true, size: 8 }, others: [W(500, 300, 200, 100)] };
  const a = snap({ ...s, alt: true, moving: W(0, 0, 120, 60), to: { x: 503, y: 301 } });
  assert.deepEqual([a.x, a.y, a.guides.length], [503, 301, 0]);
  const h = snap({ ...s, shift: true, from: { x: 100, y: 200 }, moving: W(100, 200, 120, 60), to: { x: 250, y: 207 } });
  assert.equal(h.y, 200); assert.equal(h.x, 248);
  const v = snap({ ...s, shift: true, from: { x: 100, y: 200 }, moving: W(100, 200, 120, 60), to: { x: 105, y: 400 } });
  assert.equal(v.x, 100); assert.equal(v.y, 400);
});

for (const deg of [0, 15, 37, 90]) {
  test(`widget xoay ${deg}°: lưới và guide bắt khung bao thẳng trục; tâm khung bao là tâm hình`, () => {
    const mv = W(0, 0, 200, 100, deg);
    const size = rotatedBounds({ ...mv, x: 0, y: 0 });
    // Lưới: cạnh trái/trên của KHUNG BAO nằm trên bội số 8.
    const g = snap({ ...base, grid: { enabled: true, size: 8 }, moving: mv, to: { x: 333, y: 217 } });
    near(Math.round(g.bounds.x / 8) * 8, g.bounds.x, `lưới x ${deg}`); near(Math.round(g.bounds.y / 8) * 8, g.bounds.y, `lưới y ${deg}`);
    // Guide cạnh: khung bao (không phải layout.x) chạm cạnh trái của widget khác.
    const o = W(600, 100, 100, 100);
    const e = snap({ ...base, guides: true, others: [o], moving: mv, to: { x: 600 - size.x + 3, y: 700 } });
    near(e.bounds.x, 600, `cạnh ${deg}`);
    assert.ok(e.guides.some((q) => q.axis === 'x' && q.pos === 600 && q.kind === 'edge' && q.with === 0));
    // Guide tâm: tâm khung bao ↔ tâm canvas.
    const c = snap({ ...base, guides: true, moving: mv, to: { x: 960 - 100 + 2, y: 540 - 50 - 3 } });
    near(c.bounds.x + c.bounds.width / 2, 960, `tâm x ${deg}`); near(c.bounds.y + c.bounds.height / 2, 540, `tâm y ${deg}`);
    assert.ok(c.guides.filter((q) => q.kind === 'center').length >= 2);
    // layout.x/y trả về dịch đúng bằng độ lệch của khung bao (không phải toạ độ khung bao).
    const to = { x: 960 - 100 + 2, y: 540 - 50 - 3 }, before = rotatedBounds({ ...mv, ...to });
    near(c.x - to.x, c.bounds.x - before.x, `dịch x ${deg}`); near(c.y - to.y, c.bounds.y - before.y, `dịch y ${deg}`);
  });
}

test('widget khác đã xoay cũng được gióng theo khung bao của nó', () => {
  const other = W(400, 100, 200, 100, 37);
  const ob = rotatedBounds(other);
  const r = snap({ ...base, guides: true, others: [other], moving: W(0, 0, 80, 80), to: { x: ob.x + ob.width + 2, y: 900 } });
  near(r.x, ob.x + ob.width);
  assert.ok(r.guides.some((g) => g.axis === 'x' && Math.abs(g.pos - (ob.x + ob.width)) < 1e-9 && g.with === 0));
});

test('tất định: cùng đầu vào cho cùng kết quả; đầu vào không bị sửa', () => {
  const inp = { ...base, guides: true, grid: { enabled: true, size: 8 }, others: [W(500, 300, 200, 100, 15)], moving: W(0, 0, 120, 60, 37), to: { x: 421, y: 333 } };
  const frozen = JSON.stringify(inp);
  assert.deepEqual(snap(inp), snap(inp)); assert.equal(JSON.stringify(inp), frozen);
});
