// `scale` animate được (%, quanh điểm neo): co giãn cả widget như Scale của After Effects, gộp với chuyển động cấp widget; không đổi khung bố cục.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutFrame, sanitizeScene, SCENE_SCHEMA_VERSION, animatablePaths, resolveAnimated, ADDABLE_WIDGETS, MAX_SCALE, type BindCtx } from '../src/index.ts';
import { synthAst, derivedOf } from './helpers.ts';

const ast = synthAst({ duration: 20 });
const mk = (animate: Record<string, unknown>, extra: object = {}) =>
  sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'w', type: 'TIME_BAR', layout: { x: 10, y: 20, width: 400, height: 120 }, properties: {}, animate, ...extra }] });
const ctx = (t: number): BindCtx => { const d = derivedOf(ast); return { ast, derived: d, tracks: d.index.tracks, t }; };

test('scale: animate được ở mọi loại widget (kể cả Piano Roll), đọc preset giữ nguyên', () => {
  for (const t of [...ADDABLE_WIDGETS, 'PIANO_ROLL' as const]) assert.ok(animatablePaths(t).has('scale'), t);
  const r = mk({ scale: { keys: [{ at: { sec: 0 }, value: 100 }, { at: { sec: 2 }, value: 200 }] } });
  assert.deepEqual(r.warnings, []);
  assert.ok(r.scene.widgets[0].animate!.scale);
});

test('scale: nội suy theo %, kẹp [0, MAX_SCALE], không đổi layout', () => {
  const w = mk({ scale: { keys: [{ at: { sec: 0 }, value: 100 }, { at: { sec: 2 }, value: 300 }] } }).scene.widgets[0];
  const r = resolveAnimated(w, ctx(1), { designWidth: 1920, designHeight: 1080 } as never);
  assert.equal(r.scale, 2);
  assert.deepEqual(r.widget.layout, w.layout);
  const big = mk({ scale: { bind: 'progress', from: [0, 1], to: [1e6, 1e6] } }).scene.widgets[0];
  assert.equal(resolveAnimated(big, ctx(1), { designWidth: 1920, designHeight: 1080 } as never).scale, MAX_SCALE / 100);
});

test('scale + layoutFrame: khung hình mang phép co giãn (fx.sx/sy), 100% thì không; 0% thì không vẽ', () => {
  const sc = (v: number) => mk({ scale: { keys: [{ at: { sec: 0 }, value: v }] } }).scene;
  const f150 = layoutFrame(sc(150), derivedOf(ast), ast, 1)[0];
  assert.ok(f150.fx && Math.abs(f150.fx.sx - 1.5) < 1e-9 && Math.abs(f150.fx.sy - 1.5) < 1e-9);
  assert.equal(layoutFrame(sc(100), derivedOf(ast), ast, 1)[0].fx, undefined);
  assert.equal(layoutFrame(sc(0), derivedOf(ast), ast, 1).length, 0);
  // gộp với chuyển động lặp theo nhịp (co giãn nhân với nhau)
  const withMotion = mk({ scale: { keys: [{ at: { sec: 0 }, value: 200 }] } }, { motion: { loop: { kind: 'pulse', amount: 0.1 } } }).scene;
  const f = layoutFrame(withMotion, derivedOf(ast), ast, 1)[0];
  assert.ok(f.fx && f.fx.sx >= 2 * 0.89 && f.fx.sx <= 2 * 1.11);
});
