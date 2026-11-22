// T-110 (D-66): chuỗi cảnh — manifest, thời gian cục bộ của cue, hiện dần/ẩn dần, id có tiền tố, vẽ chồng tất định.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeManifest, activeCues, cueAlpha, cueScene, sequenceLayers, renderSequenceFrame, layoutFrame, sanitizeScene, SCENE_SCHEMA_VERSION, type SceneCue, type SequenceManifest, type SequenceSource, type SceneDocument } from '../src/index.ts';
import { synthAst, derivedOf, recCtx } from './helpers.ts';

const near = (a: number, b: number, e = 1e-6) => assert.ok(Math.abs(a - b) <= e, `${a} ≉ ${b}`);
const ast = synthAst({ duration: 100 });
const mkScene = (color: string, extra: object = {}): SceneDocument => sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: { backgroundColor: color }, widgets: [
  { id: 'bar', type: 'TIME_BAR', layout: { x: 0, y: 0, width: 400, height: 100 }, animate: { 'layout.x': { keys: [{ at: { sec: 0 }, value: 0 }, { at: { sec: 10 }, value: 100 }] } }, ...extra }] }).scene;
const cue = (id: string, scene: string, from: number, to: number | null, fadeIn = 0, fadeOut = 0): SceneCue => ({ id, scene, from, to, fadeIn, fadeOut });

test('manifest: đọc hợp lệ; bỏ mục sai kèm cảnh báo; kẹp số; sắp theo from; id trùng bị bỏ', () => {
  const r = sanitizeManifest({ version: 1, global: 'hud', cues: [
    { id: 'b', scene: 's2', from: 30, to: null, fadeIn: 99 }, { id: 'a', scene: 's1', from: 0, to: 30 },
    { id: 'a', scene: 's3', from: 1 }, { id: 'x/y', scene: 's1', from: 0 }, { id: 'c', scene: 's1', from: -1 }, { id: 'd', scene: 's1', from: 5, to: 5 }, 'rác',
  ] });
  assert.deepEqual(r.manifest.cues.map((c) => c.id), ['a', 'b']);
  assert.equal(r.manifest.cues[1].fadeIn, 30); assert.equal(r.manifest.global, 'hud');
  assert.equal(r.warnings.length, 6); assert.ok(r.warnings.every((w) => w.code === 'WARN_SEQUENCE_VALUE'));
  assert.deepEqual(sanitizeManifest(undefined).manifest.cues, []); assert.equal(sanitizeManifest(5).warnings.length, 1);
  assert.deepEqual(sanitizeManifest(JSON.parse(JSON.stringify(r.manifest))).manifest, r.manifest); // vòng lưu → đọc lại không đổi
});

test('cue: hiện trong [from, to), mờ dần ở biên, to = null tới hết bài', () => {
  const c = cue('a', 's', 10, 20, 2, 2);
  assert.equal(cueAlpha(c, 9.9, 100), 0); assert.equal(cueAlpha(c, 10, 100), 0);
  near(cueAlpha(c, 11, 100), 0.5); assert.equal(cueAlpha(c, 15, 100), 1); near(cueAlpha(c, 19, 100), 0.5); assert.equal(cueAlpha(c, 20, 100), 0);
  assert.equal(cueAlpha(cue('b', 's', 50, null), 99.9, 100), 1);
  const m: SequenceManifest = { version: 1, cues: [cue('a', 's', 0, 30, 0, 4), cue('b', 's', 26, null, 4, 0)] };
  assert.deepEqual(activeCues(m, 28, 100).map((x) => x.cue.id), ['a', 'b']); // chồng nhau ở chỗ chuyển cảnh
  near(activeCues(m, 28, 100).reduce((s, x) => s + x.alpha, 0), 1.0, 1e-6); // smoothstep đối xứng: hai bên cộng lại = 1
});

test('cueScene: keyframe mốc giây và khoảng hiển thị tính từ lúc cue bắt đầu; id có tiền tố; cùng cue → cùng đối tượng', () => {
  const s = mkScene('#000000', { visibility: { ranges: [{ from: 0, to: null }], fadeIn: 0, fadeOut: 0 } });
  const c = cue('c1', 's', 40, 60), cs = cueScene(s, c);
  assert.equal(cs.widgets[0].id, 'c1/bar'); assert.equal(cueScene(s, c), cs);
  assert.deepEqual(cs.widgets[0].visibility!.ranges, [{ from: 40, to: 60 }]);
  const x = (t: number) => layoutFrame(cs, derivedOf(ast), ast, t).map((e) => e.widget.layout.x)[0];
  near(x(40), 0); near(x(45), 50); near(x(50), 100);
  assert.equal(layoutFrame(cs, derivedOf(ast), ast, 39).length, 0); assert.equal(layoutFrame(cs, derivedOf(ast), ast, 61).length, 0);
  assert.equal(s.widgets[0].id, 'bar'); // scene gốc không bị sửa
  // hai cue cùng scene, mốc khác nhau: chạy độc lập
  const c2 = cueScene(s, cue('c2', 's', 70, null));
  near(layoutFrame(c2, derivedOf(ast), ast, 75).map((e) => e.widget.layout.x)[0], 50);
});

test('cueScene: preset dài ngắn khác nhau dùng lại được — cùng preset ở cue 20 s và 5 s chạy từ giây 0 của cue', () => {
  const s = mkScene('#000000');
  const at = (from: number, t: number) => layoutFrame(cueScene(s, cue(`k${from}`, 's', from, null)), derivedOf(ast), ast, t).map((e) => e.widget.layout.x)[0];
  near(at(20, 25), at(5, 10)); // cùng 5 s sau lúc bắt đầu
});

test('sequenceLayers: thứ tự cue rồi scene chung trên cùng; thiếu scene bị bỏ; khác khung thiết kế bị bỏ', () => {
  const A = mkScene('#111111'), B = mkScene('#222222'), HUD = mkScene('#333333');
  const wide = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: { aspectRatio: '1:1', designWidth: 1080, designHeight: 1080 }, widgets: [] }).scene;
  const lib: Record<string, SceneDocument> = { A, B, HUD, wide };
  const src: SequenceSource = { scene: (k) => lib[k], derived: () => derivedOf(ast) };
  const m: SequenceManifest = { version: 1, global: 'HUD', cues: [cue('1', 'A', 0, 50), cue('2', 'B', 40, null), cue('3', 'thieu', 0, null), cue('4', 'wide', 0, null)] };
  const L = sequenceLayers(m, src, 45, 100);
  assert.deepEqual(L.map((l) => l.cue?.id ?? 'global'), ['1', '2', 'global']);
  assert.equal(L[0].scene.canvas.backgroundColor, '#111111');
});

test('renderSequenceFrame: vẽ chồng tất định; cue sau không xoá cue trước; hết cue thì tô nền dự phòng', () => {
  const A = mkScene('#aa0000'), B = mkScene('#00bb00'), lib: Record<string, SceneDocument> = { A, B };
  const src: SequenceSource = { scene: (k) => lib[k], derived: () => derivedOf(ast) };
  const m: SequenceManifest = { version: 1, cues: [cue('1', 'A', 0, 50, 0, 10), cue('2', 'B', 40, null, 10, 0)] };
  const run = (t: number) => { const r = recCtx(); renderSequenceFrame(m, src, A, ast, t, { ctx: r.ctx, width: 1920, height: 1080 }, 1); return r.log; };
  const l45 = run(45);
  assert.equal(l45.filter((x) => x.startsWith('clearRect')).length, 1); // chỉ xoá một lần
  assert.ok(l45.indexOf('fillStyle=#aa0000') < l45.indexOf('fillStyle=#00bb00')); // A trước, B đè
  assert.deepEqual(run(45), l45); // tất định
  assert.ok(run(60).includes('fillStyle=#00bb00') && !run(60).includes('fillStyle=#aa0000'));
  const empty: SequenceManifest = { version: 1, cues: [cue('1', 'A', 90, null)] };
  const r = recCtx(); renderSequenceFrame(empty, src, A, ast, 10, { ctx: r.ctx, width: 1920, height: 1080 }, 1);
  assert.ok(r.log.includes('fillStyle=#aa0000')); // nền dự phòng
});
