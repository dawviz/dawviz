// T-81: khoảng hiển thị theo thời gian, hiện dần/ẩn dần, phase và chỗ giữ {phase}…. Tất định, tính tay.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutFrame, sanitizeScene, SCENE_SCHEMA_VERSION, visibilityAlpha, phaseInfoAt, type SceneDocument, type TextPrim, type Primitive } from '../src/index.ts';
import { synthAst, derivedOf } from './helpers.ts';

const near = (a: number, b: number, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} ≠ ${b}`);

test('visibilityAlpha: vắng = 1; ngoài khoảng = 0; trong khoảng không fade = 1; mốc cuối ẩn hẳn', () => {
  assert.equal(visibilityAlpha(undefined, 5, 100), 1);
  const v = { ranges: [{ from: 10, to: 20 }], fadeIn: 0, fadeOut: 0 };
  assert.equal(visibilityAlpha(v, 9.999, 100), 0);
  assert.equal(visibilityAlpha(v, 10, 100), 1);
  assert.equal(visibilityAlpha(v, 19.999, 100), 1);
  assert.equal(visibilityAlpha(v, 20, 100), 0);
  assert.equal(visibilityAlpha({ ranges: [], fadeIn: 0, fadeOut: 0 }, 5, 100), 0, 'rỗng = không bao giờ hiện');
});

test('visibilityAlpha: hiện dần/ẩn dần làm mượt, đối xứng, và co lại khi khoảng quá ngắn', () => {
  const v = { ranges: [{ from: 10, to: 20 }], fadeIn: 2, fadeOut: 2 };
  assert.equal(visibilityAlpha(v, 10, 100), 0);
  near(visibilityAlpha(v, 11, 100), 0.5);
  assert.equal(visibilityAlpha(v, 12, 100), 1);
  near(visibilityAlpha(v, 19, 100), 0.5);
  const short = { ranges: [{ from: 0, to: 2 }], fadeIn: 3, fadeOut: 1 }; // tổng 4 > 2: co 1/2 → vào 1,5 s, ra 0,5 s
  near(visibilityAlpha(short, 0.75, 100), 0.5); assert.equal(visibilityAlpha(short, 1.5, 100), 1);
  near(visibilityAlpha(short, 1.75, 100), 0.5);
});

test('visibilityAlpha: to = null là tới hết bài; nhiều khoảng lấy lớn nhất', () => {
  const v = { ranges: [{ from: 50, to: null }, { from: 0, to: 10 }], fadeIn: 0, fadeOut: 0 };
  assert.equal(visibilityAlpha(v, 99, 100), 1); assert.equal(visibilityAlpha(v, 30, 100), 0); assert.equal(visibilityAlpha(v, 5, 100), 1);
});

const PH = [{ name: 'Verse', start: 4 }, { name: 'Chorus', start: 10 }];
test('phaseInfoAt: trước phase đầu, giữa, phase cuối, không có phase', () => {
  assert.deepEqual(phaseInfoAt(PH, 1, 30), { name: '', next: 'Verse', elapsed: 0, remaining: 3, index: 0 });
  assert.deepEqual(phaseInfoAt(PH, 4, 30), { name: 'Verse', next: 'Chorus', elapsed: 0, remaining: 6, index: 1 });
  assert.deepEqual(phaseInfoAt(PH, 12.5, 30), { name: 'Chorus', next: '', elapsed: 2.5, remaining: 17.5, index: 2 });
  assert.deepEqual(phaseInfoAt(undefined, 12, 30), { name: '', next: '', elapsed: 0, remaining: 18, index: 0 });
});

const sceneOf = (extra: object, widget: object = {}): SceneDocument => {
  const { scene, warnings } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, ...extra,
    widgets: [{ id: 'w', type: 'TEXT', layout: { x: 0, y: 0, width: 600, height: 120 }, properties: { text: '{phase} → {next_phase} · {phase_remaining:m:ss} · #{phase_no}' }, ...widget }] });
  assert.deepEqual(warnings, []); return scene;
};
const texts = (p: Primitive[]) => p.filter((x): x is TextPrim => x.kind === 'text').map((x) => x.text);

test('chỗ giữ phase trong chữ, theo scene.phases', () => {
  const ast = synthAst({ duration: 30 }), sc = sceneOf({ phases: PH });
  assert.deepEqual(texts(layoutFrame(sc, derivedOf(ast), ast, 12.5)[0].prims), ['Chorus →  · 0:17 · #2']);
  assert.deepEqual(texts(layoutFrame(sc, derivedOf(ast), ast, 1)[0].prims), [' → Verse · 0:03 · #0']);
});

test('layoutFrame: ngoài khoảng hiển thị thì bỏ widget; đang fade thì nhân độ đục', () => {
  const ast = synthAst({ duration: 30 });
  const sc = sceneOf({}, { visibility: { ranges: [{ from: 10, to: 20 }], fadeIn: 2, fadeOut: 0 } });
  assert.deepEqual(layoutFrame(sc, derivedOf(ast), ast, 5), []);
  const mid = layoutFrame(sc, derivedOf(ast), ast, 11)[0].prims.filter((p): p is TextPrim => p.kind === 'text');
  assert.ok(mid.length && mid.every((p) => Math.abs(p.alpha - 0.5) < 1e-9));
  const full = layoutFrame(sc, derivedOf(ast), ast, 15)[0].prims.filter((p): p is TextPrim => p.kind === 'text');
  assert.ok(full.every((p) => p.alpha === 1));
});

test('sanitizeScene: khoảng/phase sai bị bỏ kèm cảnh báo, phase sắp theo start', () => {
  const { scene, warnings } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {},
    phases: [{ name: 'B', start: 20 }, { name: 'A', start: 5 }, { name: '', start: 7 }, { name: 'dup', start: 20 }, { name: 'neg', start: 200000 }],
    widgets: [{ id: 'w', type: 'TEXT', layout: {}, visibility: { ranges: [{ from: 5, to: 3 }, { from: 1, to: 2 }, { from: 8 }], fadeIn: 99 } }] });
  assert.deepEqual(scene.phases, [{ name: 'A', start: 5 }, { name: 'B', start: 20 }, { name: 'neg', start: 86400 }]); // quá giới hạn: kẹp, không bỏ
  assert.deepEqual(scene.widgets[0].visibility, { ranges: [{ from: 1, to: 2 }, { from: 8, to: null }], fadeIn: 30, fadeOut: 0 });
  assert.ok(warnings.length >= 4);
});
