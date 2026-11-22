import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compileTrack, sampleTrack, type KeyAnimation } from '@dawviz/render-core';
import {
  addSavedEase, applyEase, bezierFromHandle, easeClipboard, easeOfKeys, graphable, handlePoints, keyVelocity, nextEaseName, niceTicks,
  parseEaseLibrary, sampleGraph, segments, setVelocity, snapValue, valueRange, MAX_SAVED_EASES,
} from './graphEditor.ts';

const TM = [{ tick: 0, bpm: 120, num: 4, den: 4 }] as never;
const A: KeyAnimation = { keys: [{ at: { sec: 0 }, value: 0 }, { at: { sec: 2 }, value: 100 }, { at: { sec: 4 }, value: 100 }] };
const near = (a: number, b: number, eps = 1e-3) => assert.ok(Math.abs(a - b) <= eps, `${a} ≈ ${b}`);

test('sampleGraph: giá trị đúng như Render Core; tốc độ đều = dv/h; đồ thị chỉ cho số', () => {
  const v = sampleGraph(A, TM, 0, 4, 8, 'value');
  assert.equal(v.length, 9);
  const ct = compileTrack(A, { tempoMap: TM });
  for (const [t, y] of v) near(y, sampleTrack(ct, t) as number);
  const s = sampleGraph(A, TM, 0.5, 1.5, 4, 'speed');
  for (const [, y] of s) near(y, 50, 1e-6);
  assert.ok(graphable(A));
  assert.ok(!graphable({ keys: [{ at: { sec: 0 }, value: '#ffffff' }], kind: 'color' }));
});

test('segments: theo thứ tự thời gian kể cả khi mảng keys lộn xộn', () => {
  const m: KeyAnimation = { keys: [{ at: { sec: 3 }, value: 3 }, { at: { sec: 1 }, value: 1 }, { at: { sec: 2 }, value: 2 }] };
  assert.deepEqual(segments(m, TM).map((s) => [s.a, s.b]), [[1, 2], [2, 0]]);
});

test('vận tốc/ảnh hưởng ⇄ bezier: đặt rồi đọc lại khớp; đoạn đều có vận tốc = dv/h, ảnh hưởng 33%', () => {
  const lin = keyVelocity(A, TM, 1);
  assert.equal(lin.inInf, 0); assert.equal(lin.inVel, 50); // linear: ảnh hưởng 0, vận tốc = dv/h
  const a1 = setVelocity(A, TM, 0, 'out', 0, 0.5); // ease-out kiểu AE: bắt đầu đứng yên
  assert.deepEqual((a1.keys[1].ease as { cubicBezier: number[] }).cubicBezier.slice(0, 2), [0.5, 0]);
  const v1 = keyVelocity(a1, TM, 0);
  assert.equal(v1.outVel, 0); assert.equal(v1.outInf, 0.5);
  const a2 = setVelocity(a1, TM, 1, 'in', 25, 0.4);
  const v2 = keyVelocity(a2, TM, 1);
  near(v2.inVel!, 25); near(v2.inInf!, 0.4);
  // vận tốc ra của keyframe 1 thuộc đoạn 1 → 2 (dv = 0): không biểu diễn được tốc độ khác 0, ảnh hưởng vẫn đặt được
  const a3 = setVelocity(a2, TM, 1, 'out', 30, 0.7);
  const v3 = keyVelocity(a3, TM, 1);
  assert.equal(v3.outVel, 0); assert.equal(v3.outInf, 0.7);
  // không có đoạn phía đó: trả nguyên
  assert.equal(setVelocity(A, TM, 0, 'in', 5, 0.5), A);
});

test('setVelocity trên đoạn giữ/cong mượt: chuyển sang "đều" + bezier', () => {
  const h: KeyAnimation = { keys: [{ at: { sec: 0 }, value: 0, interp: 'hold' }, { at: { sec: 1 }, value: 10, ease: 'easeOutBounce' }] };
  assert.deepEqual(keyVelocity(h, TM, 0), { inVel: null, inInf: null, outVel: null, outInf: null });
  const r = setVelocity(h, TM, 0, 'out', 0, 0.6);
  assert.equal(r.keys[0].interp, undefined);
  assert.ok(typeof r.keys[1].ease === 'object' && 'cubicBezier' in r.keys[1].ease!);
});

test('tay cầm trên đồ thị giá trị: toạ độ ↔ bezier khứ hồi', () => {
  const s = segments(A, TM)[0], bz: [number, number, number, number] = [0.25, 0.1, 0.25, 1];
  const [p1, p2] = handlePoints(s, bz);
  assert.deepEqual(p1, [0.5, 10]); assert.deepEqual(p2, [0.5, 100]);
  assert.deepEqual(bezierFromHandle(bz, s, 0, p1[0], p1[1]), bz);
  assert.deepEqual(bezierFromHandle(bz, s, 1, 1.5, 50), [0.25, 0.1, 0.75, 0.5]);
  // x kẹp trong 0..1, y kẹp miền cho phép
  assert.deepEqual(bezierFromHandle(bz, s, 0, -5, 1e6), [0, 2, 0.25, 1]);
});

test('khung nhìn, vạch chia, bắt dính giá trị tròn', () => {
  assert.deepEqual(valueRange([[0, 5], [1, 5]]), [4, 6]);
  const [lo, hi] = valueRange([[0, 0], [1, 100]]);
  assert.ok(lo < 0 && hi > 100);
  assert.deepEqual(niceTicks(0, 100, 5), [0, 20, 40, 60, 80, 100]);
  assert.deepEqual(niceTicks(-0.3, 0.3, 3), [-0.2, 0, 0.2]);
  assert.deepEqual(snapValue(41, 20, 2), { v: 40, snapped: true });
  assert.deepEqual(snapValue(29, 20, 2), { v: 30, snapped: true }); // nửa bước
  assert.equal(snapValue(35, 20, 2).snapped, false);
});

test('dán easing: áp cho đoạn kết thúc ở keyframe chọn; keyframe đầu thôi giữ; sao chép đọc easing chung', () => {
  const h: KeyAnimation = { keys: [{ at: { sec: 0 }, value: 0, interp: 'hold' }, { at: { sec: 1 }, value: 10 }, { at: { sec: 2 }, value: 20, ease: 'easeInQuad' }] };
  const r = applyEase(h, TM, [1, 2], { cubicBezier: [0.1, 0.2, 0.3, 0.4] });
  assert.equal(r.keys[0].interp, undefined);
  assert.deepEqual(r.keys[1].ease, { cubicBezier: [0.1, 0.2, 0.3, 0.4] });
  assert.deepEqual(r.keys[2].ease, { cubicBezier: [0.1, 0.2, 0.3, 0.4] });
  assert.equal('ease' in applyEase(r, TM, [1], 'linear').keys[1], false); // linear = bỏ trường
  assert.equal(easeOfKeys(h, TM, [1, 2]), 'mixed');
  assert.equal(easeOfKeys(h, TM, [2]), 'easeInQuad');
  assert.equal(easeOfKeys(h, TM, [0]), undefined); // keyframe đầu không kết thúc đoạn nào
  easeClipboard.set({ cubicBezier: [0, 0, 1, 1] });
  assert.deepEqual(easeClipboard.get(), { cubicBezier: [0, 0, 1, 1] });
  easeClipboard.set(undefined); assert.equal(easeClipboard.get(), 'linear');
  easeClipboard.clear(); assert.equal(easeClipboard.get(), null);
});

test('thư viện easing: đọc an toàn dữ liệu hỏng, thay cùng tên, giới hạn số lượng', () => {
  assert.deepEqual(parseEaseLibrary('{oops'), []);
  assert.deepEqual(parseEaseLibrary(JSON.stringify([{ name: ' A\u0007  b ', bezier: [0, 0, 1, 1] }, { name: 'x', bezier: [0, 'a', 1, 1] }, { name: 'A b', bezier: [1, 1, 1, 1] }])), [{ name: 'A b', bezier: [0, 0, 1, 1] }]);
  let lib = addSavedEase([], 'Mềm', [0.2, 0, 0.2, 1]);
  lib = addSavedEase(lib, 'Mềm', [0.3, 0, 0.3, 1]);
  assert.deepEqual(lib, [{ name: 'Mềm', bezier: [0.3, 0, 0.3, 1] }]);
  for (let i = 0; i < 40; i++) lib = addSavedEase(lib, `c${i}`, [0, 0, 1, 1]);
  assert.equal(lib.length, MAX_SAVED_EASES);
  assert.equal(nextEaseName([{ name: 'Curve 1', bezier: [0, 0, 1, 1] }], 'Curve'), 'Curve 2');
});
