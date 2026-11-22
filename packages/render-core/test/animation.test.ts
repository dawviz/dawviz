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

test('animate: Piano Roll nhận danh sách đường dẫn riêng, Bản nhạc chỉ thuộc tính hình vẽ (không có thuộc tính dựng); bật-tắt và lựa chọn theo bậc; giới hạn số lượng', () => {
  const pr = animatablePaths('PIANO_ROLL');
  assert.ok(pr.has('layout.rotation') && pr.has('opacity') && pr.get('playheadWidth') === 'number' && pr.get('noteStyle.base.glow') === 'number' && pr.get('playheadColor') === 'color' && pr.get('keyboard.enabled') === 'bool');
  assert.ok(!pr.has('pitchMin') && !pr.has('scrollMode') && !pr.has('noteStyle.tracks')); // cấu trúc: không animate
  const nt = animatablePaths('NOTATION');
  assert.ok(nt.get('activeColor') === 'color' && nt.get('auraColor') === 'color' && nt.get('glow') === 'number' && nt.get('glowMode') === 'choice' && nt.has('layout.x'));
  assert.ok(!nt.has('musicFont') && !nt.has('division') && !nt.has('barsPerSystem')); // thuộc tính dựng: không animate
  assert.ok(animatablePaths('TIME_BAR').get('barColor') === 'color' && animatablePaths('TIME_BAR').get('barLength') === 'number' && animatablePaths('TIME_BAR').get('showBars') === 'bool');
  assert.ok(animatablePaths('EVENT_COUNTER').get('lines.played.enabled') === 'bool' && animatablePaths('EVENT_COUNTER').has('lineHeight'));
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

test('animate Piano Roll: layout, tỉ lệ thời gian, vạch phát, kiểu nốt; giá trị kẹp theo bộ kiểm; dải cao độ bị từ chối', () => {
  const r = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'p', type: 'PIANO_ROLL', layout: { x: 0, y: 0, width: 600, height: 200 }, properties: {}, animate: {
    'layout.y': { keys: [{ at: { sec: 0 }, value: 0 }, { at: { sec: 2 }, value: 100 }] },
    visibleSeconds: { keys: [{ at: { sec: 0 }, value: 2 }, { at: { sec: 2 }, value: 1e6 }] },
    'noteStyle.base.glow': { keys: [{ at: { sec: 0 }, value: -5 }] },
    playheadVisible: { keys: [{ at: { sec: 0 }, value: true }, { at: { sec: 1.5 }, value: false }] },
    pitchMin: { keys: [{ at: { sec: 0 }, value: 10 }] } } }] });
  assert.equal(r.warnings.length, 1); const w = r.scene.widgets[0];
  assert.deepEqual(Object.keys(w.animate!).sort(), ['layout.y', 'noteStyle.base.glow', 'playheadVisible', 'visibleSeconds']);
  assert.equal((w.animate!.playheadVisible as { kind?: string }).kind, 'discrete');
  const at = (t: number) => layoutFrame(r.scene, derivedOf(ast), ast, t)[0].widget as WidgetSpec<{ visibleSeconds: number; playheadVisible: boolean; noteStyle: { base: { glow: number } } }>;
  assert.equal(at(1).layout.y, 50);
  assert.equal(at(3).properties.visibleSeconds, 60); // kẹp
  assert.equal(at(1).properties.noteStyle.base.glow, 0);
  assert.equal(at(1.49).properties.playheadVisible, true); assert.equal(at(1.5).properties.playheadVisible, false); // theo bậc: đổi đúng tại keyframe
});

test('animate theo bậc: bật/tắt và lựa chọn giữ rồi đổi tại keyframe, không nội suy; binding bị từ chối; giá trị sai kiểu bị bỏ', () => {
  const warns: string[] = [];
  const S = { ...silentSanitizer(), warn: (_p: string, _v: unknown, m: string) => { warns.push(m); } };
  const out = sanitizeAnimate(S, {
    showBars: { keys: [{ at: { sec: 0 }, value: true }, { at: { sec: 2 }, value: 'yes' }, { at: { sec: 4 }, value: false }] },
    barColor: { keys: [{ at: { sec: 0 }, value: '#ff0000' }] },
    'time.enabled': { bind: 'progress', from: [0, 1], to: [0, 1] },
  }, '$', 'TIME_BAR')!;
  assert.deepEqual(Object.keys(out).sort(), ['barColor', 'showBars']);
  assert.equal((out.showBars as { keys: unknown[] }).keys.length, 2);
  assert.ok(warns.some((m) => m.includes('theo bậc')));
  const sc = mk('TIME_BAR', { showBars: { keys: [{ at: { sec: 0 }, value: true }, { at: { sec: 4 }, value: false }] } }).scene;
  const vals = [0, 2, 3.99, 4, 9].map((t) => (frame(sc, t)[0].widget.properties as { showBars: boolean }).showBars);
  assert.deepEqual(vals, [true, true, true, false, false]);
});

test('fuzz: animate MỌI thuộc tính số/màu của MỌI loại widget bằng giá trị cực đoan — không ném, luôn qua bộ kiểm, không NaN', () => {
  let total = 0;
  for (const type of ADDABLE_WIDGETS) {
    const base = defaultScene('16:9'), w0 = createWidget(base, type);
    for (const [path, kind] of animatablePaths(type)) {
      const vals = kind === 'number' ? [-1e9, 0, 3.7, 1e9] : kind === 'color' ? ['#000000', '#ff00ff'] : [true, false, '', 'x'.repeat(300), 42, '#00ff00'];
      for (const val of vals) {
        const keys = [{ at: { sec: 0 }, value: val }, { at: { sec: 1 }, value: kind === 'bool' ? !val : val }];
        const w: WidgetSpec = { ...w0, animate: { [path]: { keys, ...(kind === 'bool' || kind === 'choice' ? { kind: 'discrete' } : {}) } as Animation } };
        const sc = { ...base, widgets: [w] };
        const f = layoutFrame(sc, derivedOf(ast), ast, 1.3);
        for (const e of f) for (const p of e.prims) if (p.kind === 'rect') for (const v of [p.x, p.y, p.w, p.h, p.alpha]) assert.ok(Number.isFinite(v), `${type}.${path}=${val}`);
        assert.deepEqual(layoutFrame(sc, derivedOf(ast), ast, 1.3).map((e) => e.prims.length), f.map((e) => e.prims.length), `tất định ${type}.${path}`);
        total++;
      }
    }
  }
  assert.ok(total > 1000, `chỉ ${total} trường hợp`);
});

test('T-18 ripple: vòng gợn toả từ đầu nốt trong 0,6 s rồi tắt; tất định; template khác không có vòng', async () => {
  const { rippleAt, NOTE_TRANSITIONS: NT, pianoRollWidget } = await import('../src/index.ts');
  const sp = NT.ripple;
  assert.equal(rippleAt(sp, 1, 0.9, 10), null); assert.equal(rippleAt(sp, 1, 1.6, 10), null);
  const a = rippleAt(sp, 1, 1.1, 10)!, b = rippleAt(sp, 1, 1.4, 10)!;
  assert.ok(b.r > a.r && b.alpha < a.alpha);
  assert.equal(rippleAt(NT.pulse, 1, 1.1, 10), null);
  const sc = { ...defaultScene('16:9'), widgets: [pianoRollWidget({ x: 0, y: 0, width: 1920, height: 1080, rotation: 0 }, { transition: 'ripple' })] };
  const rings = (t: number) => frame(sc, t)[0].prims.filter((p) => p.kind === 'rect' && p.fill === '#00000000');
  const n0 = ast.tracks[0].notes[0].startTimeSeconds;
  assert.ok(rings(n0 + 0.1).length > 0); assert.deepEqual(rings(n0 + 0.1), rings(n0 + 0.1));
});

test('animate: Bản nhạc — màu mực/nốt đang ngân/quầng sáng đổi theo keyframe, giá trị luôn hợp lệ', () => {
  const r = mk('NOTATION', {
    activeColor: { keys: [{ at: { sec: 0 }, value: '#ff0000' }, { at: { sec: 10 }, value: '#0000ff' }] },
    auraColor: { keys: [{ at: { sec: 0 }, value: '#00ff00' }, { at: { sec: 10 }, value: '#ffffff' }] },
    glow: { keys: [{ at: { sec: 0 }, value: 0 }, { at: { sec: 10 }, value: 1 }] },
    glowMode: { kind: 'discrete', keys: [{ at: { sec: 0 }, value: 'HALO' }, { at: { sec: 5 }, value: 'SOFT' }] },
    musicFont: { kind: 'discrete', keys: [{ at: { sec: 0 }, value: 'PETALUMA' }] }, // thuộc tính dựng: bị bỏ
  });
  assert.equal(r.warnings.length > 0, true);
  const w = r.scene.widgets[0], at = (t: number) => resolveAnimated(w, ctxAt(t), r.scene.canvas).widget.properties as unknown as Record<string, unknown>;
  assert.deepEqual(Object.keys(w.animate!).sort(), ['activeColor', 'auraColor', 'glow', 'glowMode']);
  assert.equal(at(0).activeColor, '#ff0000'); assert.equal(at(10).activeColor, '#0000ff');
  const mid = String(at(5).activeColor); assert.match(mid, /^#[0-9a-f]{6}$/i); assert.notEqual(mid, '#ff0000');
  near(Number(at(5).glow), 0.5); assert.equal(at(2).glowMode, 'HALO'); assert.equal(at(6).glowMode, 'SOFT');
});
