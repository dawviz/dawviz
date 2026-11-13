// T-68: widget xoay quanh điểm neo trong renderFrame (SRS REQ-GRAPHICS-03, REQ-GRAPHICS-05).
// Ctx giả theo dõi ma trận biến đổi: kiểm hình vẽ ra (toạ độ thiết bị) khớp hình học của rotatedBounds/toWidgetLocal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderFrame, sanitizeScene, rotatedBounds, toWidgetLocal, pointInWidget, type SceneDocument } from '../src/index.ts';
import { synthAst, derivedOf, recCtx } from './helpers.ts';

type M = [number, number, number, number, number, number]; // a b c d e f
const mul = (m: M, n: M): M => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const apply = (m: M, x: number, y: number) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
/** Ctx giả: ghi mọi điểm của fillRect đã đổi sang toạ độ thiết bị, và đường cắt (rect) cuối cùng. */
function matCtx() {
  let m: M = [1, 0, 0, 1, 0, 0]; const stack: M[] = []; const fills: { pts: number[][]; style: unknown }[] = []; const clips: number[][][] = [];
  const st: Record<string, unknown> = { globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1, shadowColor: '', shadowBlur: 0 };
  const corners = (x: number, y: number, w: number, h: number) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(([px, py]) => apply(m, px, py));
  const fns: Record<string, (...a: any[]) => void> = {
    setTransform: (a, b, c, d, e, f) => { m = [a, b, c, d, e, f]; }, save: () => { stack.push(m); }, restore: () => { m = stack.pop()!; },
    translate: (x, y) => { m = mul(m, [1, 0, 0, 1, x, y]); }, rotate: (r) => { m = mul(m, [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]); },
    fillRect: (x, y, w, h) => { fills.push({ pts: corners(x, y, w, h), style: st.fillStyle }); }, rect: (x, y, w, h) => { clips.push(corners(x, y, w, h)); },
  };
  const ctx: any = new Proxy({}, { get: (_, k: string) => (k in st ? st[k] : fns[k] ?? (() => {})), set: (_, k: string, v) => { st[k] = v; return true; } });
  return { ctx, fills, clips };
}
const sceneRot = (rotation: number, anchor = { x: 0.5, y: 0.5 }): SceneDocument => {
  const { scene, warnings } = sanitizeScene({ schemaVersion: '0.4.0', canvas: { designWidth: 1920, designHeight: 1080, backgroundColor: '#000000' },
    widgets: [{ id: 'pb', type: 'PROGRESS_BAR', layout: { x: 600, y: 400, width: 500, height: 40, rotation, anchor }, properties: { thickness: 40, progressColor: '#ff0000', trackColor: '#00ff00', showTime: false } }] });
  assert.deepEqual(warnings, []); return scene;
};
const near = (a: number, b: number, m = '', eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${m}: ${a} ≠ ${b}`);
const ast = synthAst({ duration: 10 });

for (const rot of [0, 15, 37, 90, -120, 180]) {
  for (const anchor of [{ x: 0.5, y: 0.5 }, { x: 0, y: 0 }, { x: 1, y: 0.25 }]) {
    test(`renderFrame xoay ${rot}° neo (${anchor.x}, ${anchor.y}): rãnh nền phủ đúng hình đã xoay; khung cắt trùng hình đó; điểm neo đứng yên`, () => {
      const scene = sceneRot(rot, anchor), L = scene.widgets[0].layout;
      const { ctx, fills, clips } = matCtx();
      renderFrame(scene, derivedOf(ast), ast, 5, { ctx, width: 1920, height: 1080 }, 1);
      const track = fills.find((f) => f.style === '#00ff00')!; // rãnh nền phủ cả widget (0,0)-(500,40)
      const b = rotatedBounds(L);
      const xs = track.pts.map((p) => p[0]), ys = track.pts.map((p) => p[1]);
      near(Math.min(...xs), b.x, 'minX'); near(Math.max(...xs), b.x + b.width, 'maxX'); near(Math.min(...ys), b.y, 'minY'); near(Math.max(...ys), b.y + b.height, 'maxY');
      assert.deepEqual(clips.at(-1)!.map((p) => p.map((v) => +v.toFixed(6))), track.pts.map((p) => p.map((v) => +v.toFixed(6))));
      // góc trên trái nội dung về lại (0,0) trong toạ độ widget; điểm neo trên canvas không đổi khi xoay
      const q = toWidgetLocal(L, track.pts[0][0], track.pts[0][1]); near(q.x, 0, 'local x'); near(q.y, 0, 'local y');
      const pivot = [L.x + anchor.x * L.width, L.y + anchor.y * L.height], q2 = toWidgetLocal(L, pivot[0], pivot[1]);
      near(q2.x, anchor.x * L.width, 'pivot x'); near(q2.y, anchor.y * L.height, 'pivot y');
      // tiến độ 50%: nửa trái thanh, nội dung không bị co theo khung bao thẳng trục
      const prog = fills.find((f) => f.style === '#ff0000')!;
      near(Math.hypot(prog.pts[1][0] - prog.pts[0][0], prog.pts[1][1] - prog.pts[0][1]), 250, 'độ dài thanh');
    });
  }
}

test('Preview ↔ Export: scale 2 cho đúng hình gấp đôi ở mọi góc (cùng chuỗi lệnh, chỉ khác tỉ lệ)', () => {
  for (const rot of [0, 15, 37, 90]) {
    const scene = sceneRot(rot), d = derivedOf(ast);
    const a = matCtx(), b = matCtx();
    renderFrame(scene, d, ast, 3, { ctx: a.ctx, width: 1920, height: 1080 }, 1);
    renderFrame(scene, d, ast, 3, { ctx: b.ctx, width: 3840, height: 2160 }, 2);
    assert.equal(a.fills.length, b.fills.length);
    a.fills.forEach((f, i) => f.pts.forEach((p, k) => { near(b.fills[i].pts[k][0], 2 * p[0], `rot ${rot}`); near(b.fills[i].pts[k][1], 2 * p[1], `rot ${rot}`); }));
  }
});

test('góc 0: chuỗi lệnh giữ đúng như trước T-68 (không có rotate, một translate)', () => {
  const { ctx, log } = recCtx();
  renderFrame(sceneRot(0), derivedOf(ast), ast, 3, { ctx, width: 1920, height: 1080 }, 1);
  assert.ok(!log.some((l) => l.startsWith('rotate(')));
  assert.equal(log.filter((l) => l.startsWith('translate(')).join(), 'translate(600,400)');
  const r = recCtx(); renderFrame(sceneRot(37), derivedOf(ast), ast, 3, { ctx: r.ctx, width: 1920, height: 1080 }, 1);
  assert.equal(r.log.filter((l) => l.startsWith('rotate(')).length, 1);
  // tất định: cùng (scene, t) cho cùng chuỗi lệnh
  const again = recCtx(); renderFrame(sceneRot(37), derivedOf(ast), ast, 3, { ctx: again.ctx, width: 1920, height: 1080 }, 1);
  assert.deepEqual(again.log, r.log);
});

test('pointInWidget: nhấp trong hình đã xoay, không phải khung bao thẳng trục', () => {
  const L = { x: 0, y: 0, width: 200, height: 20, rotation: 45 };
  assert.ok(pointInWidget(L, 100, 10));                 // tâm
  const b = rotatedBounds(L);
  assert.ok(!pointInWidget(L, b.x + 2, b.y + 2));       // góc khung bao: nằm ngoài hình xoay
  assert.ok(pointInWidget({ ...L, rotation: 0 }, 0, 0) && pointInWidget({ ...L, rotation: 0 }, 200, 20));
  assert.ok(!pointInWidget({ ...L, rotation: 0 }, 201, 10));
  assert.ok(pointInWidget({ ...L, rotation: 90 }, 100, 100) && !pointInWidget({ ...L, rotation: 90 }, 100 + 50, 10)); // xoay 90° quanh tâm (100,10): dọc x=90..110, y=-90..110
});
