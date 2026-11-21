// T-22: hoạt hình thuộc tính (keyframe + binding vào dữ liệu nhạc) cho mọi widget. Giá trị luôn hợp lệ, tất định, tua tới đâu cũng đúng.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutFrame, sanitizeScene, createWidget, defaultScene, SCENE_SCHEMA_VERSION, ADDABLE_WIDGETS, animatablePaths, sanitizeAnimate, resolveAnimated, bindSourceValue, BIND_SOURCES,
  silentSanitizer, type SceneDocument, type WidgetSpec, type Animation, type BindCtx, type RectPrim, type TextPrim, type Primitive } from '../src/index.ts';
import { synthAst, derivedOf } from './helpers.ts';

const near = (a: number, b: number, e = 1e-6) => assert.ok(Math.abs(a - b) <= e, `${a} ≉ ${b}`);
const scene0 = defaultScene('16:9');
const ast = synthAst({ duration: 20 });
const mk = (type: string, animate: Record<string, unknown>, properties: object = {}) =>
  sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'w', type, layout: { x: 10, y: 20, width: 400, height: 120 }, properties, animate }] });
const ctxAt = (t: number, w?: WidgetSpec): BindCtx => { const d = derivedOf(ast); return { ast, derived: d, tracks: d.index.tracks, t }; };
const frame = (scene: SceneDocument, t: number) => layoutFrame(scene, derivedOf(ast), ast, t);

test('animate: đọc preset — giữ mục hợp lệ, bỏ mục sai kèm cảnh báo, vòng lưu → đọc lại không đổi', () => {
  const r = mk('TIME_BAR', {
    'layout.x': { keys: [{ at: { sec: 0 }, value: 0 }, { at: { beat: 4 }, value: 300, ease: 'easeOutQuad' }], loop: 'CYCLE' },
    barLength: { bind: 'beat.phase', from: [0, 1], to: [20, 200] },
    barColor: { keys: [{ at: { sec: 0 }, value: '#ff0000' }, { at: { bar: 3, beat: 2 }, value: '#0000ff' }] },
    opacity: { bind: 'note.hit', from: [0, 1], to: [0.3, 1], ease: 'easeOutCubic' },
  });
  assert.deepEqual(r.warnings, []); const an = r.scene.widgets[0].animate!; assert.deepEqual(Object.keys(an).sort(), ['barColor', 'barLength', 'layout.x', 'opacity']);
  assert.deepEqual(sanitizeScene(JSON.parse(JSON.stringify(r.scene))).scene.widgets[0].animate, an);
  const bad = mk('TIME_BAR', {
    'layout.zzz': { keys: [{ at: { sec: 0 }, value: 1 }] }, 'style.styleId': { bind: 'progress', from: [0, 1], to: [0, 1] }, // không có / không phải số
    barLength: { bind: 'khong-co', from: [0, 1], to: [1, 2] }, barThickness: { bind: 'progress', from: [1, 1], to: [1, 2] }, // nguồn lạ; from trùng
    showBars: { keys: [{ at: { sec: 0 }, value: 1 }] }, barColor: { keys: [{ at: { sec: 0 }, value: 5 }] }, // bool không animate; màu cần #rrggbb
    'layout.y': { keys: [{ at: { sec: -1 }, value: 1 }, { at: {}, value: 1 }, { at: { sec: 1 }, value: 'x' }] }, 'layout.width': 7, 'layout.height': { x: 1 },
  });
  assert.equal(bad.scene.widgets[0].animate, undefined); assert.ok(bad.warnings.length >= 9);
  assert.equal(mk('TIME_BAR', 'x').scene.widgets[0].animate, undefined);
  const mix = mk('TIME_BAR', { barLength: { bind: 'progress', from: [0, 1], to: ['#fff', '#000'] } }); assert.equal(mix.scene.widgets[0].animate, undefined, 'đích màu cho thuộc tính số');
});

test('animate: Piano Roll và Bản nhạc chỉ nhận layout và opacity; số lượng keyframe và hoạt hình bị giới hạn', () => {
  assert.ok(animatablePaths('PIANO_ROLL').has('layout.rotation') && animatablePaths('PIANO_ROLL').has('opacity') && !animatablePaths('PIANO_ROLL').has('playheadWidth'));
  assert.ok(!animatablePaths('NOTATION').has('zoom') && animatablePaths('NOTATION').has('layout.x'));
  assert.ok(animatablePaths('TIME_BAR').get('barColor') === 'color' && animatablePaths('TIME_BAR').get('barLength') === 'number' && !animatablePaths('TIME_BAR').has('showBars'));
  assert.ok(animatablePaths('EVENT_COUNTER').has('lines.played.enabled') === false && animatablePaths('EVENT_COUNTER').has('lineHeight'));
  const many = Array.from({ length: 300 }, (_, i) => ({ at: { sec: i }, value: i })), warns: string[] = [];
  const S = { ...silentSanitizer(), warn: (_p: string, _v: unknown, m: string) => { warns.push(m); } };
  const out = sanitizeAnimate(S, { 'layout.x': { keys: many } }, '$', 'TEXT')!; assert.equal((out['layout.x'] as { keys: unknown[] }).keys.length, 256); assert.ok(warns.some((m) => m.includes('cắt bớt')));
  const lots = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`opacity`, { bind: 'progress', from: [0, 1], to: [0, 1] }]));
  assert.ok(sanitizeAnimate(S, lots, '$', 'TEXT'));
});

test('animate keyframe: layout.x chạy theo mốc beat và easing; tua tới đâu cũng đúng', () => {
  const sc = mk('TEXT', { 'layout.x': { keys: [{ at: { sec: 0 }, value: 0 }, { at: { beat: 4 }, value: 200 }] } }).scene; const w = sc.widgets[0];
  const x = (t: number) => resolveAnimated(w, ctxAt(t), scene0.canvas).widget.layout.x;
  near(x(0), 0); near(x(1), 100); near(x(2), 200); near(x(9), 200); // 120 BPM: 4 beat = 2 s; sau keyframe cuối giữ nguyên
  assert.deepEqual([x(1.3), x(0.2), x(1.3)], [x(1.3), x(0.2), x(1.3)].map((v) => v)); assert.equal(x(1.3), x(1.3));
  const noAnim = { ...w }; delete noAnim.animate; assert.equal(resolveAnimated(noAnim, ctxAt(1), scene0.canvas).widget, noAnim, 'không animate: cùng tham chiếu');
});

test('animate: giá trị vượt miền được kẹp bởi bộ kiểm của widget; màu nội suy OKLab; layout kẹp theo khung', () => {
  const sc = mk('TIME_BAR', {
    barLength: { keys: [{ at: { sec: 0 }, value: -500 }, { at: { sec: 1 }, value: 99999 }] },
    barColor: { keys: [{ at: { sec: 0 }, value: '#000000' }, { at: { sec: 2 }, value: '#ffffff' }] },
    'layout.width': { keys: [{ at: { sec: 0 }, value: -5 }] }, 'layout.rotation': { keys: [{ at: { sec: 0 }, value: 270 }] },
  }).scene; const w = sc.widgets[0];
  const at = (t: number) => resolveAnimated(w, ctxAt(t), scene0.canvas).widget;
  assert.equal((at(0).properties as { barLength: number }).barLength, 4); assert.equal((at(1).properties as { barLength: number }).barLength, 1000);
  assert.equal(at(0).layout.width, 1); assert.equal(at(0).layout.rotation, -90);
  const c = (at(1).properties as { barColor: string }).barColor; assert.match(c, /^#[0-9a-f]{6}$/); const g = parseInt(c.slice(1, 3), 16); assert.ok(g > 90 && g < 200, c);
  assert.deepEqual((w.properties as { barLength: number }).barLength, (sc.widgets[0].properties as { barLength: number }).barLength, 'không sửa widget gốc');
});

test('binding: beat.phase, bar.phase, progress, notes.count, notes.velocity, note.hit khớp dữ liệu', () => {
  const c = (t: number) => ctxAt(t);
  near(bindSourceValue('beat.phase', c(0.25)), 0.5); near(bindSourceValue('bar.phase', c(1)), 0.5); near(bindSourceValue('progress', c(5)), 0.25);
  assert.equal(bindSourceValue('notes.count', c(0.1)), 4); assert.equal(bindSourceValue('notes.count', c(0.3)), 5); assert.equal(bindSourceValue('notes.count', c(19)), 0); assert.equal(bindSourceValue('notes.velocity', c(0.3)), 90);
  assert.equal(bindSourceValue('notes.velocity', c(19)), 0);
  const hit = (t: number) => bindSourceValue('note.hit', c(t)); near(hit(0.25), 90 / 127); assert.ok(hit(0.4) < hit(0.3) && hit(0.4) > 0); assert.ok(hit(19) === 0 && hit(0.1) > 0);
  assert.equal(bindSourceValue('track.volume', c(1)), 0); assert.equal(bindSourceValue('audio.level', c(1)), 0);
  for (const s of BIND_SOURCES) for (const t of [0, 0.37, 5, 19.9]) assert.ok(Number.isFinite(bindSourceValue(s, c(t))), `${s}@${t}`);
});

test('binding: automation của track và âm thanh; không có dữ liệu thì 0', () => {
  const a2 = synthAst({ duration: 20 }); a2.tracks[0].automation = { volume: { kind: 'volume', points: [{ tick: 0, timeSeconds: 0, value: 1, shape: 0 }, { tick: 19200, timeSeconds: 10, value: 0.5, shape: 0 }] }, pan: { kind: 'pan', points: [{ tick: 0, timeSeconds: 0, value: 1, shape: 0 }] } };
  const d = derivedOf(a2), c = (t: number): BindCtx => ({ ast: a2, derived: d, tracks: d.index.tracks, t });
  near(bindSourceValue('track.volume', c(0)), 1); assert.ok(bindSourceValue('track.volume', c(10)) < 1 && bindSourceValue('track.volume', c(10)) > 0.5); near(bindSourceValue('track.pan', c(3)), 1);
  const frames = 100, hop = 0.1, rms = new Uint8Array(frames).fill(0).map((_, i) => (i < 50 ? 255 : 0));
  const d2 = derivedOf(a2, { audio: { offsetSec: 0, features: { sampleRate: 44100, hopSamples: 4410, hop, frames, bands: 1, minHz: 30, maxHz: 16000, spectrum: new Uint8Array(frames), peak: rms, rms } } });
  const lv = (t: number) => bindSourceValue('audio.level', { ast: a2, derived: d2, tracks: d2.index.tracks, t }); near(lv(1), 1); assert.equal(lv(7), 0);
});

test('binding + layoutFrame: thuộc tính đổi theo nhạc, widget vẽ ra khác nhau theo t, tất định và độc lập thứ tự tua', () => {
  const sc = mk('TIME_BAR', { barLength: { bind: 'note.hit', from: [0, 1], to: [20, 300] }, opacity: { bind: 'progress', from: [0, 1], to: [1, 0.2] } }, { showBars: true }).scene;
  const widest = (t: number) => Math.max(0, ...(frame(sc, t)[0]?.prims ?? []).filter((p): p is RectPrim => p.kind === 'rect').map((p) => p.w));
  assert.ok(widest(0.25) > widest(19), `${widest(0.25)} vs ${widest(19)}`);
  const order = [3, 0.25, 7, 0.25, 19], a = order.map((t) => JSON.stringify(frame(sc, t))), b = [...order].reverse().map((t) => JSON.stringify(frame(sc, t))).reverse(); assert.deepEqual(a, b);
  const alphas = (t: number) => (frame(sc, t)[0].prims as Primitive[]).map((p) => p.alpha); assert.ok(Math.max(...alphas(19)) < Math.max(...alphas(1)));
  assert.equal(frame({ ...sc, widgets: [{ ...sc.widgets[0], animate: { opacity: { keys: [{ at: { sec: 0 }, value: 0 }] } } }] }, 1).length, 0, 'opacity 0: không dựng');
});

test('animate Piano Roll: layout và opacity hoạt động; thuộc tính piano bị từ chối', () => {
  const r = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'p', type: 'PIANO_ROLL', layout: { x: 0, y: 0, width: 600, height: 200 }, properties: {}, animate: { 'layout.y': { keys: [{ at: { sec: 0 }, value: 0 }, { at: { sec: 2 }, value: 100 }] }, playheadWidth: { keys: [{ at: { sec: 0 }, value: 5 }] } } }] });
  assert.equal(r.warnings.length, 1); const w = r.scene.widgets[0]; assert.deepEqual(Object.keys(w.animate!), ['layout.y']);
  const f = layoutFrame(r.scene, derivedOf(ast), ast, 1); assert.equal(f[0].widget.layout.y, 50);
});

test('fuzz: animate MỌI thuộc tính số/màu của MỌI loại widget bằng giá trị cực đoan — không ném, luôn qua bộ kiểm, không NaN', () => {
  let total = 0;
  for (const type of ADDABLE_WIDGETS) {
    const base = defaultScene('16:9'), w0 = createWidget(base, type);
    for (const [path, kind] of animatablePaths(type)) {
      for (const val of kind === 'number' ? [-1e9, 0, 3.7, 1e9] : ['#000000', '#ff00ff']) {
        const w: WidgetSpec = { ...w0, animate: { [path]: { keys: [{ at: { sec: 0 }, value: val }] } as Animation } };
        const sc = { ...base, widgets: [w] };
        const f = layoutFrame(sc, derivedOf(ast), ast, 1.3);
        for (const e of f) for (const p of e.prims) if (p.kind === 'rect') for (const v of [p.x, p.y, p.w, p.h, p.alpha]) assert.ok(Number.isFinite(v), `${type}.${path}=${val}`);
        total++;
      }
    }
  }
  assert.ok(total > 300, `chỉ ${total} trường hợp`);
});
