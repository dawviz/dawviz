// Chuyển động cấp widget (mọi loại widget) và chuyển cảnh nốt bốn pha + morph.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutFrame, renderFrame, sanitizeScene, createWidget, SCENE_SCHEMA_VERSION, WIDGET_TYPES, ADDABLE_WIDGETS, widgetFxAt, activeRange, loopPhase, NEUTRAL_WFX, WIDGET_EFFECT_NAMES, LOOP_EFFECT_NAMES,
  NOTE_TRANSITIONS, NOTE_TRANSITION_NAMES, noteFxAt, applyNoteFx, morphRoundRect, resamplePolygon, morphPolygon, layoutPianoRoll, buildIndex, defaultScene,
  type SceneDocument, type WidgetMotion, type RectPrim, type Primitive } from '../src/index.ts';
import { synthAst, derivedOf, recCtx } from './helpers.ts';

const tempo = synthAst().tempoMap;
const mo = (o: Partial<WidgetMotion>): WidgetMotion => ({ enter: null, exit: null, loop: null, ...o });
const near = (a: number, b: number, e = 1e-6) => assert.ok(Math.abs(a - b) <= e, `${a} ≉ ${b}`);

test('chuyển động widget: hiệu ứng vào chạy từ đầu khoảng hiển thị, ra chạy ở cuối, loop theo nhịp', () => {
  const vis = { ranges: [{ from: 10, to: 20 }], fadeIn: 0, fadeOut: 0 };
  const m = mo({ enter: { effect: 'slide-from-left', sec: 2, ease: 'linear' }, exit: { effect: 'fade', sec: 2, ease: 'linear' } });
  const at = (t: number) => widgetFxAt(m, activeRange(vis, t, 100), t, tempo);
  near(at(10).dx, -0.6); near(at(10).alpha, 0); near(at(11).dx, -0.3); near(at(11).alpha, 0.5); assert.deepEqual(at(13), NEUTRAL_WFX); near(at(19).alpha, 0.5); near(at(19.999).alpha, 0, 1e-3);
  assert.deepEqual(widgetFxAt(m, null, 5, tempo), NEUTRAL_WFX);
  const whole = widgetFxAt(m, activeRange(undefined, 0, 30), 0, tempo); near(whole.dx, -0.6, 1e-9); // không có khoảng hiển thị: vào ở đầu bài
  const L = (effect: (typeof LOOP_EFFECT_NAMES)[number]) => mo({ loop: { effect, amount: 1, every: 1, unit: 'BEATS' } });
  near(loopPhase(L('pulse').loop!, 0.25, tempo), 0.5); // 120 BPM: 1 beat = 0,5 s
  near(widgetFxAt(L('pulse'), null, 0, tempo).sx, 2); near(widgetFxAt(L('pulse'), null, 0.4999, tempo).sx, 1, 1e-3);
  near(widgetFxAt(L('breathe'), null, 0.125, tempo).sx, 1.5); near(widgetFxAt(L('sway'), null, 0.125, tempo).rot, 30); near(widgetFxAt(L('float'), null, 0.125, tempo).dy, 0.25);
  assert.ok(widgetFxAt(L('blink'), null, 0.4, tempo).alpha < 1 && widgetFxAt(L('blink'), null, 0.1, tempo).alpha === 1);
  const slowTempo = [{ ...tempo[0], bpm: 60 }]; near(loopPhase(L('pulse').loop!, 0.25, slowTempo), 0.25); // đổi tempo thì vẫn theo nhịp
  for (const e of WIDGET_EFFECT_NAMES) for (const t of [0, 0.3, 1]) { const f = widgetFxAt(mo({ enter: { effect: e, sec: 1, ease: 'easeOutBack' } }, ), { from: 0, to: 9 }, t, tempo); for (const v of Object.values(f)) assert.ok(Number.isFinite(v), e); }
});

test('chuyển động widget: áp được cho MỌI loại widget qua layoutFrame; không có motion thì không thêm gì', () => {
  const ast = synthAst({ duration: 20 });
  let checked = 0;
  for (const type of ADDABLE_WIDGETS) {
    const base = defaultScene('1:1'); const w = createWidget(base, type); assert.ok(WIDGET_TYPES.includes(type));
    const scene: SceneDocument = { ...base, widgets: [{ ...w, motion: mo({ enter: { effect: 'fade', sec: 4, ease: 'linear' } }) }] };
    const plain: SceneDocument = { ...base, widgets: [w] };
    const d = derivedOf(ast);
    const a = layoutFrame(scene, d, ast, 2, undefined), b = layoutFrame(plain, d, ast, 2, undefined);
    if (!b.length || !b[0].prims.length) continue; // loại này không vẽ gì ở t này (ví dụ cần dữ liệu)
    checked++; assert.ok(a[0].fx && Math.abs(a[0].fx.alpha - 0.5) < 1e-9, type);
    assert.equal(b[0].fx, undefined, `${type}: không motion thì không có fx`);
    const alphaOf = (p: Primitive) => p.alpha; // fadePrim nhân độ đục
    assert.ok(a[0].prims.every((p, i) => Math.abs(alphaOf(p) - alphaOf(b[0].prims[i]) * 0.5) < 1e-9), `${type}: độ đục ×0,5`);
  }
  assert.ok(checked >= 12, `chỉ ${checked} loại widget được kiểm`);
});

test('chuyển động widget: renderFrame dời/co giãn quanh điểm neo; ẩn hẳn thì không vẽ; không motion thì chuỗi lệnh như cũ', () => {
  const ast = synthAst({ duration: 20 }), base = defaultScene('1:1'), w = createWidget(base, 'TIME_BAR');
  const run = (scene: SceneDocument, t: number) => { const { ctx, log } = recCtx(); renderFrame(scene, derivedOf(ast), ast, t, { ctx, width: 1000, height: 1000 } as never, 1); return log; };
  const plain = run({ ...base, widgets: [w] }, 1);
  const moved = run({ ...base, widgets: [{ ...w, motion: mo({ enter: { effect: 'pop', sec: 2, ease: 'linear' } }) }] }, 1);
  assert.ok(!plain.some((l) => l.startsWith('scale(')) && moved.some((l) => l.startsWith('scale(0.5,0.5)')));
  const gone = run({ ...base, widgets: [{ ...w, motion: mo({ enter: { effect: 'fade', sec: 2, ease: 'linear' } }) }] }, 0);
  assert.ok(!gone.some((l) => l.startsWith('fillText') || l.startsWith('clip')), 'alpha 0: widget không được vẽ');
  const after = run({ ...base, widgets: [{ ...w, motion: mo({ enter: { effect: 'pop', sec: 2, ease: 'linear' } }) }] }, 5);
  assert.deepEqual(after, run({ ...base, widgets: [w] }, 5)); assert.ok(!after.some((l) => l.startsWith('scale(')), 'hết pha vào: chuỗi lệnh y như không có motion');
});

test('chuyển động widget: đọc preset — hiệu ứng lạ về mặc định kèm cảnh báo, trống thì bỏ, vòng lưu → đọc lại không đổi', () => {
  const wd = (motion: unknown) => ({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'w', type: 'TEXT', layout: { x: 0, y: 0, width: 100, height: 50 }, properties: {}, motion }] });
  const ok = sanitizeScene(wd({ enter: { effect: 'zoom', sec: 1.5, ease: { cubicBezier: [0.2, 0, 0.2, 1] } }, loop: { effect: 'sway', amount: 0.3, every: 2, unit: 'BEATS' } }));
  assert.deepEqual(ok.warnings, []); assert.equal(ok.scene.widgets[0].motion?.enter?.effect, 'zoom'); assert.equal(ok.scene.widgets[0].motion?.exit, null);
  assert.deepEqual(sanitizeScene(JSON.parse(JSON.stringify(ok.scene))).scene.widgets[0].motion, ok.scene.widgets[0].motion);
  const bad = sanitizeScene(wd({ enter: { effect: 'khong-co', sec: 99, ease: 'lạ' }, loop: { effect: 'x', amount: 9, every: 0, unit: 'Y' } }));
  assert.ok(bad.warnings.length >= 6); assert.equal(bad.scene.widgets[0].motion?.enter?.effect, 'fade'); assert.equal(bad.scene.widgets[0].motion?.enter?.sec, 30); assert.equal(bad.scene.widgets[0].motion?.loop?.amount, 1);
  assert.equal(sanitizeScene(wd({ enter: null, exit: null, loop: null })).scene.widgets[0].motion, undefined);
  assert.equal(sanitizeScene(wd('x')).scene.widgets[0].motion, undefined); assert.equal(sanitizeScene(wd(undefined)).scene.widgets[0].motion, undefined);
});

test('chuyển cảnh nốt: bốn pha enter/hit/sustain/exit, trung tính ngoài các pha, tất định', () => {
  const pop = NOTE_TRANSITIONS['pop-in']; // lead 0,25 s, nốt từ 1 đến 2 s
  assert.equal(noteFxAt(pop, 1, 2, 0.5).fx.sx, 0, 'xa hơn `lead`: nốt còn ở điểm ẩn của pha enter'); assert.equal(noteFxAt(pop, 1, 2, 0.75).fx.sx, 0); assert.ok(noteFxAt(pop, 1, 2, 0.9).fx.sx > 0.5);
  assert.equal(noteFxAt(pop, 1, 2, 1).fx.sx, 1); assert.equal(noteFxAt(pop, 1, 2, 1.5).fx.sx, 1);
  const pulse = NOTE_TRANSITIONS.pulse; assert.equal(noteFxAt(pulse, 1, 2, 1).fx.sy, 1.6); assert.equal(noteFxAt(pulse, 1, 2, 1.25).fx.sy, 1, 'hết pha hit; thở ở beatPhase 0 → sin 0 = 0');
  near(noteFxAt(pulse, 1, 2, 1.5, 0.25).fx.sy, 1.08); // thở: sin(2π·0,25) = 1
  const shat = NOTE_TRANSITIONS.shatter; assert.equal(noteFxAt(shat, 1, 2, 2).fx.alpha, 1); assert.equal(noteFxAt(shat, 1, 2, 2.35).fx.alpha, 0); assert.ok(noteFxAt(shat, 1, 2, 2.1).fx.sy > 1);
  const mor = NOTE_TRANSITIONS.morph; assert.equal(noteFxAt(mor, 1, 2, 0.5).morph, 0); assert.equal(noteFxAt(mor, 1, 2, 1).morph, 1); assert.equal(noteFxAt(mor, 1, 2, 2.35).morph, 0);
  for (const name of NOTE_TRANSITION_NAMES) for (const t of [0, 0.6, 0.9, 1, 1.4, 2, 2.2, 5]) { const r = noteFxAt(NOTE_TRANSITIONS[name], 1, 2, t, 0.3); assert.deepEqual(r, noteFxAt(NOTE_TRANSITIONS[name], 1, 2, t, 0.3)); for (const v of Object.values(r.fx)) assert.ok(Number.isFinite(v), name); }
  assert.equal(NOTE_TRANSITIONS.none.lead, 0);
});

test('chuyển cảnh nốt: applyNoteFx co giãn quanh tâm, dời theo chiều cao, morph giữ mép trái và bo hết cỡ', () => {
  const r = { x: 100, y: 50, w: 200, h: 20, radius: 3, opacity: 1, glow: 0.2 };
  assert.deepEqual(applyNoteFx(r, { dx: 0, dy: 0, sx: 1, sy: 1, alpha: 1, glow: 0 }, 1), r);
  const s = applyNoteFx(r, { dx: 0, dy: 0, sx: 0.5, sy: 2, alpha: 0.5, glow: 1 }, 1); assert.deepEqual([s.x, s.w, s.y, s.h, s.opacity, s.glow], [150, 100, 40, 40, 0.5, 1]);
  const d = applyNoteFx(r, { dx: 1, dy: -2, sx: 1, sy: 1, alpha: 1, glow: 0 }, 1); assert.deepEqual([d.x, d.y], [120, 10]);
  const m = applyNoteFx(r, { dx: 0, dy: 0, sx: 1, sy: 1, alpha: 1, glow: 0 }, 0); assert.deepEqual([m.x, m.w, m.radius], [100, 20, 10]); // viên tròn: dài = cao, bo hết cỡ
  const m2 = applyNoteFx(r, { dx: 0, dy: 0, sx: 1, sy: 1, alpha: 1, glow: 0 }, 0.5); assert.deepEqual([m2.w, m2.radius], [110, 6.5]);
  assert.deepEqual(r, { x: 100, y: 50, w: 200, h: 20, radius: 3, opacity: 1, glow: 0.2 }, 'không sửa bản vào');
});

test('morph cùng họ: chữ nhật bo góc ↔ viên thuốc ↔ tròn; đa giác lấy mẫu lại cùng số đỉnh rồi nội suy', () => {
  const rect = { w: 100, h: 40, radius: 4 }, pill = { w: 100, h: 40, radius: 20 }, circle = { w: 40, h: 40, radius: 20 };
  assert.deepEqual(morphRoundRect(rect, pill, 0), rect); assert.deepEqual(morphRoundRect(rect, pill, 1), pill); assert.equal(morphRoundRect(rect, pill, 0.5).radius, 12);
  assert.deepEqual(morphRoundRect(pill, circle, 1), circle); assert.ok(morphRoundRect({ w: 10, h: 10, radius: 0 }, { w: 10, h: 10, radius: 99 }, 1).radius <= 5, 'bán kính không vượt nửa cạnh ngắn');
  const sq: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]], tri: [number, number][] = [[0, 0], [10, 0], [5, 10]];
  const r = resamplePolygon(sq, 8); assert.equal(r.length, 8); assert.deepEqual(r[0], [0, 0]); assert.deepEqual(r[2], [10, 0]); assert.deepEqual(r[1], [5, 0]);
  const mid = morphPolygon(sq, tri, 0.5); assert.equal(mid.length, 4); assert.deepEqual(morphPolygon(sq, tri, 0), resamplePolygon(sq, 4)); assert.deepEqual(morphPolygon(sq, tri, 1), resamplePolygon(tri, 4));
  assert.equal(resamplePolygon([[1, 1]], 5).length, 5); assert.equal(resamplePolygon([], 3).length, 3);
  for (const p of morphPolygon(tri, sq, 0.3)) for (const v of p) assert.ok(Number.isFinite(v));
});

test('Piano Roll: template chuyển cảnh biến đổi hình nốt, none giữ nguyên; scene nhận tên template, tên lạ về none kèm cảnh báo', () => {
  const ast = synthAst(), index = buildIndex(ast.tracks, 10);
  const o = { width: 600, height: 200, windowSeconds: 4, playheadRatio: 0.3, pitchMin: 40, pitchMax: 90 };
  const base = layoutPianoRoll(index, ast.tempoMap, 0.3, o), none = layoutPianoRoll(index, ast.tempoMap, 0.3, { ...o, transition: { spec: NOTE_TRANSITIONS.none, beatPhase: 0 } });
  assert.deepEqual(none, base);
  const pop = layoutPianoRoll(index, ast.tempoMap, 0.3, { ...o, transition: { spec: NOTE_TRANSITIONS['pop-in'], beatPhase: 0 } });
  const first = (rs: typeof base) => rs.find((r) => r.id === 't1n1')!; // nốt Lead thứ hai bắt đầu 0,75 s, xa hơn `lead` so với t = 0,3: còn ở điểm ẩn
  assert.ok(first(pop).w < first(base).w && first(pop).h < first(base).h);
  const wd = (transition: unknown) => ({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'p', type: 'PIANO_ROLL', layout: { x: 0, y: 0, width: 600, height: 200 }, properties: { transition } }] });
  assert.deepEqual(sanitizeScene(wd('drop-bounce')).warnings, []); assert.equal((sanitizeScene(wd('drop-bounce')).scene.widgets[0].properties as { transition: string }).transition, 'drop-bounce');
  const bad = sanitizeScene(wd('khong-co')); assert.equal((bad.scene.widgets[0].properties as { transition: string }).transition, 'none'); assert.ok(bad.warnings.length >= 1);
  assert.equal((sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'p', type: 'PIANO_ROLL', layout: { x: 0, y: 0, width: 600, height: 200 }, properties: {} }] }).scene.widgets[0].properties as { transition: string }).transition, 'none');
});
