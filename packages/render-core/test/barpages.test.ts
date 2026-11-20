// T-84: chế độ trang canh theo ô nhịp (theo tempo và nhịp của bài) và chỉ hiện nốt sắp tới.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { barPageAt, barStartSec, buildBarGrid, layoutFrame, layoutPianoRoll, pianoRollGeometry, pianoRollWidget, defaultScene, sanitizeScene, SCENE_SCHEMA_VERSION, buildIndex, type RectPrim } from '../src/index.ts';
import { derivedOf, synthAst } from './helpers.ts';

const tp = (tick: number, timeSeconds: number, bpm: number, n = 4, d = 4) => ({ tick, timeSeconds, bpm, timeSigNumerator: n, timeSigDenominator: d });
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

test('barStartSec: 120 BPM 4/4 → 2 s mỗi ô; đổi tempo giữa bài; đổi nhịp 3/4', () => {
  const a = buildBarGrid([tp(0, 0, 120)]);
  [0, 2, 4, 6, 8].forEach((s, i) => near(barStartSec(a, i), s)); near(barStartSec(a, -3), 0);
  const slow = buildBarGrid([tp(0, 0, 120), tp(7680, 4, 60)]);     // từ ô 3 (4 s) tempo 60: mỗi ô 4 s
  [0, 2, 4, 8, 12].forEach((s, i) => near(barStartSec(slow, i), s));
  const waltz = buildBarGrid([tp(0, 0, 120), tp(7680, 4, 120, 3, 4)]); // từ ô 3: nhịp 3/4 = 1,5 s
  [0, 2, 4, 5.5, 7].forEach((s, i) => near(barStartSec(waltz, i), s));
});

test('barPageAt: trang n ô nhịp liền nhau; đúng biên thì thuộc trang sau; tempo đổi thì độ dài trang đổi', () => {
  const a = buildBarGrid([tp(0, 0, 120)]);
  assert.deepEqual(barPageAt(a, 2, 0), { start: 0, end: 4 }); assert.deepEqual(barPageAt(a, 2, 3.999), { start: 0, end: 4 });
  assert.deepEqual(barPageAt(a, 2, 4), { start: 4, end: 8 }); assert.deepEqual(barPageAt(a, 2, 11), { start: 8, end: 12 });
  assert.deepEqual(barPageAt(a, 1, 2.5), { start: 2, end: 4 }); assert.deepEqual(barPageAt(a, 4, 2.5), { start: 0, end: 8 });
  assert.deepEqual(barPageAt(a, 2, -5), { start: 0, end: 4 });
  const slow = buildBarGrid([tp(0, 0, 120), tp(7680, 4, 60)]);
  assert.deepEqual(barPageAt(slow, 2, 5), { start: 4, end: 12 });
});

test('pianoRollGeometry với trang cho trước: tỉ lệ theo độ dài trang, vạch phát chạy trong trang', () => {
  const props = { keyboard: { enabled: false, width: 0 } as never, playheadPositionRatio: 0.3, visibleSeconds: 4, scrollMode: 'PAGE' as const };
  const g = pianoRollGeometry(props, 1000, 5, { start: 4, end: 8 });
  assert.equal(g.pageStart, 4); assert.equal(g.pxPerSec, 250); assert.equal(g.playX, 250); assert.equal(g.windowSeconds, 4);
  assert.equal(pianoRollGeometry(props, 1000, 5, { start: 4, end: 12 }).pxPerSec, 125);
  assert.equal(pianoRollGeometry(props, 1000, 5).pageStart, 4, 'không truyền trang: như trước (visibleSeconds)');
});

test('revealAhead: chỉ hiện nốt đã phát hoặc sắp phát trong N giây; 0/vắng thì hiện cả trang', () => {
  const index = buildIndex(synthAst({ tracks: [{ name: 'a', color: '#f00', notes: [[60, 0, 1, 90], [62, 2, 1, 90], [64, 4, 1, 90], [65, 6, 1, 90]] }], duration: 8 }).tracks, 8);
  const o = { width: 800, height: 100, windowSeconds: 8, playheadRatio: 0, pitchMin: 60, pitchMax: 65, pageStart: 0 };
  const ids = (t: number, reveal?: number) => layoutPianoRoll(index, [{ tick: 0, bpm: 120 } as never], t, { ...o, revealAhead: reveal }).map((r) => r.pitch).sort();
  // 120 BPM: nốt bắt đầu ở 0, 1, 2, 3 giây
  assert.deepEqual(ids(0.5), [60, 62, 64, 65]); assert.deepEqual(ids(0.5, 0), [60]);   // 0 ở lớp bố cục = chỉ nốt đã bắt đầu
  assert.deepEqual(ids(0.5, 1), [60, 62]); assert.deepEqual(ids(1.5, 1), [60, 62, 64]); assert.deepEqual(ids(1.5, 0.4), [60, 62]);
});

const widgetFor = (props: object) => {
  const sc = defaultScene(); sc.widgets = [pianoRollWidget({ x: 0, y: 0, width: 1000, height: 200, rotation: 0 }, props as never)];
  return sanitizeScene({ ...sc, schemaVersion: SCENE_SCHEMA_VERSION }).scene;
};
test('Piano Roll trang theo ô nhịp: nốt ở ô 3 nằm đầu trang 2 (2 ô/trang = 4 s ở 120 BPM); revealAhead qua renderer', () => {
  const ast = synthAst({ tracks: [{ name: 'a', color: '#f00', notes: [[60, 0, 1, 90], [60, 8, 1, 90], [60, 14, 1, 90]] }], duration: 12 });
  const d = derivedOf(ast), base = { scrollMode: 'PAGE', pageUnit: 'BARS', pageBars: 2, keyboard: { enabled: false }, pitchRangeMode: 'CUSTOM', pitchMin: 55, pitchMax: 65 };
  const xs = (t: number, extra = {}) => (layoutFrame(widgetFor({ ...base, ...extra }), d, ast, t)[0].prims.filter((p) => p.kind === 'rect' && p.w < 900 && p.w > 3) as RectPrim[]).map((p) => Math.round(p.x)).sort((a, b) => a - b);
  // nốt ở 0 s, 4 s, 7 s; trang 2 ô = 4 s → trang 2 là 4–8 s, mỗi giây 250 px (nốt dài 0,5 s = 125 px)
  assert.deepEqual(xs(4.2), [0, 750]); assert.deepEqual(xs(0.2), [0]);
  assert.deepEqual(xs(4.2, { revealAhead: 1 }), [0], 'nốt ở 7 s chưa tới lúc hiện');
  assert.deepEqual(xs(6.2, { revealAhead: 1 }), [0, 750]);
  assert.deepEqual(xs(0.2, { pageUnit: 'SECONDS', visibleSeconds: 8, revealAhead: 1 }), [0]);
});
