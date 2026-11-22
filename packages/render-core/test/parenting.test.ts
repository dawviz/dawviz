// Parenting (ANIMATION-CATALOG §6, 0.7.0): con theo phần thay đổi của cha (dời, xoay, tỉ lệ quanh điểm neo, độ đục); vòng lặp và cha thiếu bị bỏ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apply, deltaMatrix, invert, layoutFrame, mul, renderFrame, resolveParents, sanitizeScene, widgetMatrix, IDENTITY, MAX_PARENT_DEPTH, SCENE_SCHEMA_VERSION, type Mat, type SceneDocument } from '../src/index.ts';
import { synthAst, derivedOf } from './helpers.ts';

const near = (a: number, b: number, e = 1e-6) => assert.ok(Math.abs(a - b) <= e, `${a} ≉ ${b}`);
const ast = synthAst({ duration: 20 });
const box = (id: string, x: number, extra: object = {}) => ({ id, type: 'TEXT', layout: { x, y: 100, width: 200, height: 100 }, properties: {}, ...extra });

test('resolveParents: cha thiếu, tự làm cha, vòng lặp, quá sâu bị bỏ; theo thứ tự tài liệu', () => {
  const r = resolveParents([{ id: 'a', parent: 'b' }, { id: 'b', parent: 'a' }, { id: 'c', parent: 'zz' }, { id: 'd', parent: 'd' }, { id: 'e', parent: 'a' }]);
  assert.deepEqual([...r.parents], [['a', 'b'], ['e', 'a']]);
  assert.deepEqual(r.problems.map((p) => [p.id, p.reason]), [['b', 'cycle'], ['c', 'missing'], ['d', 'cycle']]);
  const deep = Array.from({ length: MAX_PARENT_DEPTH + 3 }, (_, i) => ({ id: `w${i}`, ...(i ? { parent: `w${i - 1}` } : {}) }));
  const rd = resolveParents(deep);
  // w17 vượt độ sâu nên mất cha (thành gốc); w18 treo dưới w17 vẫn hợp lệ
  assert.deepEqual(rd.problems.map((p) => [p.id, p.reason]), [[`w${MAX_PARENT_DEPTH + 1}`, 'depth']]);
  assert.equal(rd.parents.size, MAX_PARENT_DEPTH + 1);
});

test('ma trận: widgetMatrix khớp chuỗi dời–xoay–co giãn quanh neo; delta của tư thế tĩnh là đơn vị; nghịch đảo đúng', () => {
  const L = { x: 100, y: 50, width: 200, height: 100, rotation: 0, anchor: { x: 0.5, y: 0.5 } };
  const m = widgetMatrix(L, 90, { dx: 0, dy: 0, sx: 2, sy: 2 });
  const [cx, cy] = apply(m, 100, 50); near(cx, 200); near(cy, 100); // điểm neo đứng yên
  const [x1, y1] = apply(m, 200, 50); near(x1, 200); near(y1, 300); // +100 theo x cục bộ → xoay 90° và ×2 → +200 theo y
  const d = deltaMatrix(widgetMatrix(L, 0), widgetMatrix(L, 0));
  for (let i = 0; i < 6; i++) near(d[i], IDENTITY[i]);
  const p = mul(m, invert(m)); for (let i = 0; i < 6; i++) near(p[i], IDENTITY[i]);
  assert.deepEqual(invert([0, 0, 0, 0, 1, 1] as Mat), IDENTITY); // tỉ lệ 0: không nổ
});

test('sanitizeScene: đọc parent, bỏ cha thiếu/vòng lặp kèm cảnh báo; vòng lưu → đọc lại giữ parent', () => {
  const r = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [box('a', 0, { parent: 'b' }), box('b', 300, { parent: 'a' }), box('c', 600, { parent: 'nope' }), box('d', 900, { parent: 5 })] });
  assert.deepEqual(r.scene.widgets.map((w) => w.parent), ['b', undefined, undefined, undefined]);
  const codes = r.warnings.map((w) => `${w.details.path}:${w.message}`);
  assert.ok(codes.some((c) => c.startsWith('$.widgets[1].parent') && c.includes('vòng lặp')));
  assert.ok(codes.some((c) => c.startsWith('$.widgets[2].parent') && c.includes('không tồn tại')));
  assert.ok(codes.some((c) => c.startsWith('$.widgets[3].parent')));
  const again = sanitizeScene(JSON.parse(JSON.stringify(r.scene)));
  assert.deepEqual(again.warnings, []); assert.equal(again.scene.widgets[0].parent, 'b');
});

const sceneOf = (widgets: object[]): SceneDocument => sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets }).scene;
const recCtx = () => {
  const log: string[] = [];
  const ctx = new Proxy({}, { get: (_t, k) => (typeof k === 'string' && !['canvas'].includes(k) ? (...a: unknown[]) => { log.push(`${k}(${a.map((x) => (typeof x === 'number' ? Math.round(x * 1000) / 1000 : typeof x)).join(',')})`); return { width: 10 }; } : undefined), set: () => true });
  return { ctx, log };
};

test('con theo cha: dời/xoay/tỉ lệ/độ đục của cha so với tư thế tĩnh; cha đứng yên thì con vẽ y như không có cha; tất định', () => {
  const moving = { 'layout.x': { keys: [{ at: { sec: 0 }, value: 0 }, { at: { sec: 2 }, value: 100 }] }, opacity: { keys: [{ at: { sec: 0 }, value: 1 }, { at: { sec: 2 }, value: 0.5 }] } };
  const sc = sceneOf([box('p', 0, { animate: moving }), box('c', 400, { parent: 'p' })]);
  const lone = sceneOf([box('p', 0, { animate: moving }), box('c', 400)]);
  const d = derivedOf(ast);
  // t = 0: cha ở tư thế tĩnh → không có ma trận, khung giống hệt
  const strip = (f: ReturnType<typeof layoutFrame>) => f.map((e) => ({ prims: e.prims, fx: e.fx, pm: e.pm }));
  assert.deepEqual(strip(layoutFrame(sc, d, ast, 0)), strip(layoutFrame(lone, d, ast, 0)));
  const f = layoutFrame(sc, d, ast, 1), child = f.find((e) => e.widget.id === 'c')!;
  assert.deepEqual(child.pm?.map((v) => Math.round(v * 1000) / 1000), [1, 0, 0, 1, 50, 0]); // cha dời +50
  const alone = layoutFrame(lone, d, ast, 1).find((e) => e.widget.id === 'c')!;
  const alphaOf = (e: typeof child) => e.prims.map((p) => ('alpha' in p ? p.alpha : 1));
  alphaOf(child).forEach((a, i) => near(a, alphaOf(alone)[i] * 0.75)); // độ đục của cha (0.75 lúc 1 s) nhân vào con
  // renderFrame áp ma trận của cha trước biến đổi của con
  const { ctx, log } = recCtx();
  renderFrame(sc, d, ast, 1, { ctx: ctx as never, width: 1920, height: 1080 }, 1);
  assert.ok(log.includes('transform(1,0,0,1,50,0)'), log.filter((l) => l.startsWith('transform')).join(' '));
  assert.deepEqual(layoutFrame(sc, d, ast, 1), layoutFrame(sc, d, ast, 1));
});

test('chuỗi cha cộng dồn; xoay cha quay con quanh điểm neo của cha', () => {
  const spin = { 'layout.rotation': { keys: [{ at: { sec: 0 }, value: 0 }, { at: { sec: 1 }, value: 90 }] } };
  const slide = { 'layout.y': { keys: [{ at: { sec: 0 }, value: 100 }, { at: { sec: 1 }, value: 200 }] } };
  const sc = sceneOf([box('g', 0, { animate: slide }), box('p', 0, { parent: 'g', animate: spin }), box('c', 400, { parent: 'p' })]);
  const f = layoutFrame(sc, derivedOf(ast), ast, 1), child = f.find((e) => e.widget.id === 'c')!;
  // tâm của p ở (100, 150): con ở tâm (500, 150) quay 90° quanh đó → (100, 550), rồi ông dời +100 theo y → (100, 650)
  const [x, y] = apply(child.pm!, 500, 150); near(x, 100, 1e-6); near(y, 650, 1e-6);
});
