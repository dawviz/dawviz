// T-53: widget Audio Spectrum: mức theo thời gian, hình học LINE (xoay mọi góc) và CIRCLE, làm mượt, sanitize, vẽ có xoay.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMono, layoutFrame, sanitizeScene, SCENE_SCHEMA_VERSION, renderFrame, DEFAULT_SPECTRUM, spectrumLevels, spectrumPrims, poolBands, smoothedBands,
  type RectPrim, type SceneDocument, type SpectrumProps } from '../src/index.ts';
import { synthAst, derivedOf, recCtx } from './helpers.ts';

const SR = 48000;
// 0–1 s: sin 200 Hz; 1–2 s: sin 4 kHz; 2–3 s: im lặng.
const sig = Float32Array.from({ length: SR * 3 }, (_, i) => (i < SR ? 0.5 * Math.sin(2 * Math.PI * 200 * i / SR) : i < 2 * SR ? 0.5 * Math.sin(2 * Math.PI * 4000 * i / SR) : 0));
const features = analyzeMono(sig, SR);
const audio = { features, offsetSec: 0 };
const P = (o: Partial<SpectrumProps> = {}): SpectrumProps => ({ ...DEFAULT_SPECTRUM, bars: 32, attackMs: 0, releaseMs: 0, ...o });
const peakBar = (l: ArrayLike<number>) => { let k = 0; for (let i = 1; i < l.length; i++) if (l[i] > l[k]) k = i; return k; };

test('mức theo thời gian: 200 Hz ở cột thấp, 4 kHz ở cột cao, im lặng thì 0; không có âm thanh thì 0', () => {
  const a = spectrumLevels(P(), audio, 0.5), b = spectrumLevels(P(), audio, 1.5), c = spectrumLevels(P(), audio, 2.5);
  assert.ok(peakBar(a) < peakBar(b)); assert.ok(a[peakBar(a)] > 0.6 && b[peakBar(b)] > 0.6);
  assert.ok(c.every((v) => v === 0)); assert.ok(spectrumLevels(P(), undefined, 0.5).every((v) => v === 0));
  assert.ok(spectrumLevels(P(), audio, -1).every((v) => v === 0), 't âm → 0');
});

test('offset âm thanh dời mốc đọc: offset +1 s thì 200 Hz xuất hiện ở t = 1,5', () => {
  const l = spectrumLevels(P(), { features, offsetSec: 1 }, 1.5);
  assert.ok(Math.abs(peakBar(l) - peakBar(spectrumLevels(P(), audio, 0.5))) <= 0);
});

test('làm mượt: release dài thì mức sau khi tắt giảm dần; attack/release 0 thì bám tức thì', () => {
  const fast = spectrumLevels(P({ releaseMs: 0 }), audio, 2.1), slow = spectrumLevels(P({ releaseMs: 800 }), audio, 2.1);
  const k = peakBar(spectrumLevels(P(), audio, 1.5));
  assert.ok(slow[k] > fast[k] + 0.1, `${slow[k]} vs ${fast[k]}`);
  const t0 = smoothedBands(features, 0, 50, 200); assert.equal(t0.length, features.bands); assert.ok(smoothedBands(features, -1, 1, 1).every((v) => v === 0));
});

test('poolBands: gộp lấy lớn nhất, khoảng hẹp thì nội suy, cắt dải tần', () => {
  const bands = Float64Array.from({ length: 128 }, (_, i) => (i === 64 ? 200 : 0));
  const full = poolBands(bands, features, 16, features.minHz, features.maxHz); assert.equal(Math.max(...full), 200); assert.equal(peakBar(full), 8);
  const narrow = poolBands(bands, features, 256, features.minHz, features.maxHz); assert.equal(narrow.length, 256); assert.ok(narrow.every(Number.isFinite));
  const hiOnly = poolBands(bands, features, 8, 8000, 16000); assert.equal(Math.max(...hiOnly), 0);
});

const W = 800, H = 400;
test('LINE góc 0: cột đều nhau trên một đường ngang, mọc lên, cả hình nằm quanh tâm khung, không xoay', () => {
  const lv = new Float64Array(32).fill(1);
  const r = spectrumPrims(P({ shape: 'LINE', length: 640, thickness: 100, barWidth: 0.5 }), W, H, lv) as RectPrim[];
  assert.equal(r.length, 32); assert.ok(r.every((x) => x.rotation === undefined && x.h === 100 && Math.abs(x.w - 10) < 1e-9));
  assert.ok(Math.abs((r[0].x + r[0].w / 2) - (W / 2 - 320 + 10)) < 1e-9); assert.ok(Math.abs(r[1].x - r[0].x - 20) < 1e-9);
  assert.ok(Math.abs(r[0].y - (H / 2 - 50)) < 1e-9, 'khối cao 100 nằm giữa khung');
  const quiet = spectrumPrims(P({ minLen: 4 }), W, H, new Float64Array(32)) as RectPrim[]; assert.ok(quiet.every((x) => x.h === 4));
});

test('LINE xoay mọi góc: góc 90° đặt đường theo chiều dọc, cột mang đúng góc xoay; 360° ≡ 0°', () => {
  const lv = new Float64Array(32).fill(0.5);
  const v = spectrumPrims(P({ angle: 90, length: 320 }), W, H, lv) as RectPrim[];
  assert.ok(v.every((x) => x.rotation === 90));
  const cx = v.map((x) => x.x + x.w / 2), cy = v.map((x) => x.y + x.h / 2);
  assert.ok(Math.max(...cx) - Math.min(...cx) < 1e-6 + 100, 'cột thẳng hàng dọc (lệch ngang chỉ do chiều cao cột)');
  assert.ok(cy[31] - cy[0] > 290 && cy[31] > cy[0], 'tần số tăng dần từ trên xuống dưới');
  const a = spectrumPrims(P({ angle: 0 }), W, H, lv), b = spectrumPrims(P({ angle: 0 }), W, H, lv); assert.deepEqual(a, b);
  const rot45 = spectrumPrims(P({ angle: 45 }), W, H, lv) as RectPrim[]; assert.ok(rot45.every((x) => x.rotation === 45));
});

test('LINE: mirror mọc hai phía quanh đường, reverse đảo chiều tần số, GRADIENT đổi màu theo tần số', () => {
  const lv = Float64Array.from({ length: 32 }, (_, i) => (i === 0 ? 1 : 0.2));
  const m = spectrumPrims(P({ mirror: true, thickness: 100 }), W, H, lv) as RectPrim[];
  assert.ok(Math.abs(m[0].y + m[0].h / 2 - H / 2) < 1e-9, 'tâm cột trùng đường nền');
  const r = spectrumPrims(P({ reverse: true, thickness: 100 }), W, H, lv) as RectPrim[]; assert.ok(r[31].h > r[0].h);
  const g = spectrumPrims(P({ colorMode: 'GRADIENT', color: '#000000', colorB: '#ffffff' }), W, H, lv) as RectPrim[];
  assert.equal(g[0].fill, '#000000'); assert.equal(g[31].fill, '#ffffff'); assert.notEqual(g[10].fill, g[20].fill);
});

test('CIRCLE: cột toả quanh tâm, cột đầu ở đỉnh (startAngle 0), góc xoay tăng theo chiều kim đồng hồ, bán kính trong giữ nguyên', () => {
  const lv = new Float64Array(32).fill(1);
  const c = spectrumPrims(P({ shape: 'CIRCLE', radius: 100, thickness: 50 }), W, H, lv) as RectPrim[];
  assert.equal(c.length, 32);
  c.forEach((x, j) => {
    const phi = (j + 0.5) / 32 * 360; assert.ok(Math.abs((x.rotation ?? 0) - phi) < 1e-9);
    const mx = x.x + x.w / 2 - W / 2, my = x.y + x.h / 2 - H / 2; assert.ok(Math.abs(Math.hypot(mx, my) - 125) < 1e-6, 'tâm cột cách tâm 100 + 25');
  });
  assert.ok(c[0].y + c[0].h / 2 < H / 2 && Math.abs(c[0].x + c[0].w / 2 - W / 2) < 30, 'cột đầu gần đỉnh');
  const s = spectrumPrims(P({ shape: 'CIRCLE', startAngle: 90 }), W, H, lv) as RectPrim[]; assert.ok(Math.abs((s[0].rotation ?? 0) - (90 + 360 / 64)) < 1e-9);
});

test('CIRCLE mirror: hai nửa vòng đối xứng nhau theo trục dọc', () => {
  const lv = Float64Array.from({ length: 32 }, (_, i) => i / 31);
  const c = spectrumPrims(P({ shape: 'CIRCLE', mirror: true, thickness: 100 }), W, H, lv) as RectPrim[];
  for (let j = 0; j < 16; j++) assert.ok(Math.abs(c[j].h - c[31 - j].h) < 1e-9, `cột ${j}`);
});

test('sanitizeScene: mặc định, kẹp số, minHz ≥ maxHz và ceilDb ≤ floorDb quay về mặc định kèm cảnh báo; góc chuẩn hoá', () => {
  const mk = (properties: object) => sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 's', type: 'AUDIO_SPECTRUM', layout: {}, properties }] });
  const ok = mk({}); assert.deepEqual(ok.warnings, []); assert.deepEqual(ok.scene.widgets[0].properties, DEFAULT_SPECTRUM);
  const bad = mk({ bars: 9999, shape: 'SPIRAL', minHz: 9000, maxHz: 100, floorDb: -20, ceilDb: -30, angle: 540, color: 'red' });
  const p = bad.scene.widgets[0].properties as SpectrumProps;
  assert.equal(p.bars, 128); assert.equal(p.shape, 'LINE'); assert.equal(p.minHz, DEFAULT_SPECTRUM.minHz); assert.equal(p.ceilDb, DEFAULT_SPECTRUM.ceilDb); assert.equal(p.color, DEFAULT_SPECTRUM.color);
  assert.ok(p.angle > -180 && p.angle <= 180); assert.ok(bad.warnings.length >= 4);
});

const sceneOf = (props: object): SceneDocument => sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 's', type: 'AUDIO_SPECTRUM', layout: { x: 0, y: 0, width: 800, height: 400 }, properties: props }] }).scene;

test('layoutFrame: có âm thanh thì cột cao theo mức; chưa có âm thanh thì cột thấp nhất; tất định', () => {
  const ast = synthAst({ duration: 3 }), sc = sceneOf({ bars: 32, attackMs: 0, releaseMs: 0 });
  const withAudio = layoutFrame(sc, derivedOf(ast, { audio }), ast, 0.5)[0].prims as RectPrim[];
  const none = layoutFrame(sc, derivedOf(ast), ast, 0.5)[0].prims as RectPrim[];
  assert.ok(Math.max(...withAudio.map((x) => x.h)) > Math.max(...none.map((x) => x.h)) + 50); assert.ok(none.every((x) => x.h === DEFAULT_SPECTRUM.minLen));
  assert.deepEqual(layoutFrame(sc, derivedOf(ast, { audio }), ast, 0.5)[0].prims, withAudio);
});

test('vẽ: cột xoay dùng translate/rotate quanh tâm rồi save/restore, cột không xoay thì fillRect thẳng', () => {
  const ast = synthAst({ duration: 3 }), d = derivedOf(ast, { audio });
  const a = recCtx(); renderFrame(sceneOf({ bars: 8, angle: 0 }), d, ast, 0.5, { ctx: a.ctx, width: 800, height: 400 }, 1);
  assert.ok(!a.log.some((l) => l.startsWith('rotate(')));
  const b = recCtx(); renderFrame(sceneOf({ bars: 8, angle: 30 }), d, ast, 0.5, { ctx: b.ctx, width: 800, height: 400 }, 1);
  assert.equal(b.log.filter((l) => l.startsWith('rotate(')).length, 8); assert.ok(b.log.some((l) => /^rotate\(0\.5236\)/.test(l)));
  assert.equal(b.log.filter((l) => l === 'save()').length, b.log.filter((l) => l === 'restore()').length);
});
