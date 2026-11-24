// Timeline lớp và precomp (D-69, T-112): phép thuần trên thanh lớp, khung nhìn comp của store (lib/compLens.ts) và hoàn tác qua khung nhìn.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCENE_SCHEMA_VERSION, compView, flattenScene, sanitizeScene, shiftWidgetTime, type SceneDocument, type WidgetSpec } from '@dawviz/render-core';
import { clipAt, clipsOf, lengthTargets, moveLayers, newCompName, precompose, setFade, splitLayer, trimLayer, trimMany, uncompose } from './layerTimeline.ts';
import { compAt, liftCmd, putView, refKey, viewDoc } from './compLens.ts';
import { createStore } from './store.ts';
import * as C from './commands.ts';

const tm = [{ tick: 0, bpm: 120, timeSeconds: 0 }] as never;
const base = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [] }).scene;
const text = (id: string, extra: Partial<WidgetSpec> = {}): WidgetSpec => ({ ...sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id, type: 'TEXT' }] }).scene.widgets[0], ...extra });
const op = (sec: number) => ({ keys: [{ at: { sec }, value: 0 }, { at: { sec: sec + 1 }, value: 1 }] });
const vis = (from: number, to: number | null, fadeIn = 0, fadeOut = 0) => ({ ranges: [{ from, to }], fadeIn, fadeOut });
const sc = (widgets: WidgetSpec[], comps?: SceneDocument['comps']): SceneDocument => ({ ...base, widgets, ...(comps ? { comps } : {}) });

test('clipsOf/clipAt: không có khoảng = một thanh suốt bài; thanh mở chạy tới hết bài', () => {
  assert.deepEqual(clipsOf(text('a'), 30), [{ i: 0, from: 0, to: 30, open: true }]);
  const w = text('a', { visibility: { ranges: [{ from: 2, to: 5 }, { from: 8, to: null }], fadeIn: 0, fadeOut: 0 } });
  assert.deepEqual(clipsOf(w, 30).map((c) => [c.from, c.to, c.open]), [[2, 5, false], [8, 30, true]]);
  assert.equal(clipAt(w, 4.9, 30), 0); assert.equal(clipAt(w, 5, 30), -1); assert.equal(clipAt(w, 29, 30), 1);
});

test('moveLayers: keyframe đi theo thanh; kẹp không cho mốc nào sang trước 0; lớp suốt bài được cho khoảng trước khi dời', () => {
  const a = text('a', { visibility: vis(2, 6), animate: { opacity: op(3) } }), b = text('b');
  const r = moveLayers([a, b], ['a'], 1.5, tm);
  assert.equal(r.dt, 1.5);
  assert.deepEqual(r.widgets[0].visibility!.ranges, [{ from: 3.5, to: 7.5 }]);
  assert.deepEqual((r.widgets[0].animate!.opacity as { keys: { at: object }[] }).keys.map((k) => k.at), [{ sec: 4.5 }, { sec: 5.5 }]);
  assert.equal(r.widgets[1], b);
  assert.equal(moveLayers([a], ['a'], -10, tm).dt, -2, 'đầu thanh dừng ở 0');
  const early = text('e', { visibility: vis(2, 6), animate: { opacity: op(1) } });
  assert.equal(moveLayers([early], ['e'], -10, tm).dt, -1, 'keyframe sớm hơn thanh cũng không sang trước 0');
  const whole = moveLayers([b], ['b'], 4, tm).widgets[0];
  assert.deepEqual(whole.visibility!.ranges, [{ from: 4, to: null }]);
  assert.equal(moveLayers([b], ['b'], -4, tm).dt, 0);
});

test('trimLayer: cắt mép không dời keyframe; kẹp giữa hai thanh kề, dài ít nhất một khung; kéo cuối tới hết bài = chạy tới hết bài', () => {
  const w = text('a', { visibility: { ranges: [{ from: 2, to: 5 }, { from: 8, to: 12 }], fadeIn: 0, fadeOut: 0 }, animate: { opacity: op(3) } });
  assert.deepEqual(trimLayer(w, 0, 'in', 3, 30).visibility!.ranges[0], { from: 3, to: 5 });
  assert.equal(trimLayer(w, 0, 'in', 3, 30).animate, w.animate);
  assert.deepEqual(trimLayer(w, 0, 'out', 10, 30).visibility!.ranges[0], { from: 2, to: 8 }, 'không lấn thanh sau');
  assert.deepEqual(trimLayer(w, 1, 'in', 1, 30).visibility!.ranges[1], { from: 5, to: 12 }, 'không lấn thanh trước');
  assert.ok(trimLayer(w, 0, 'in', 9, 30).visibility!.ranges[0].from < 5);
  assert.equal(trimLayer(w, 1, 'out', 30, 30).visibility!.ranges[1].to, null);
  assert.equal(trimLayer(w, 0, 'in', 2, 30), w, 'không đổi gì → trả nguyên widget');
});

test('splitLayer: lớp gốc giữ phần trước, bản sao ngay trên giữ phần sau; keyframe giữ nguyên; chỗ cắt không hiện dần/ẩn dần', () => {
  const a = text('text-1', { zIndex: 1, visibility: vis(2, 10, 0.5, 0.7), animate: { opacity: op(3) } }), top = text('top', { zIndex: 2 });
  const r = splitLayer(sc([a, top]), 'text-1', 6, 30)!;
  const o = r.widgets.find((w) => w.id === 'text-1')!, c = r.widgets.find((w) => w.id === r.copy.id)!;
  assert.deepEqual(o.visibility, { ranges: [{ from: 2, to: 6 }], fadeIn: 0.5, fadeOut: 0 });
  assert.deepEqual(c.visibility, { ranges: [{ from: 6, to: 10 }], fadeIn: 0, fadeOut: 0.7 });
  assert.deepEqual(c.animate, a.animate); assert.equal(c.name, undefined);
  assert.notEqual(c.id, a.id);
  assert.deepEqual(C.layerOrder({ ...base, widgets: r.widgets }), ['top', c.id, 'text-1']);
  assert.equal(splitLayer(sc([a]), 'text-1', 1, 30), null, 'vạch phát ngoài thanh');
  assert.equal(splitLayer(sc([a]), 'text-1', 2, 30), null, 'đúng mép thanh');
  // lớp suốt bài: tách được, bản sao chạy tới hết bài
  const w = splitLayer(sc([text('w')]), 'w', 4, 30)!;
  assert.deepEqual(w.copy.visibility!.ranges, [{ from: 4, to: null }]);
});

test('precompose: gom lớp vào comp mới (giữ thứ tự, thời gian lưu theo comp), lớp COMP phủ khung ở chỗ lớp trên cùng; cha ngoài nhóm bị bỏ', () => {
  const s = sc([text('a', { zIndex: 1 }), text('b', { zIndex: 3, parent: 'z', visibility: vis(12, 14) }), text('z', { zIndex: 2 }), text('c', { zIndex: 4, parent: 'b' })]);
  const r = precompose(s, ['b', 'c'], { a: 1, b: 10 }, 'comp-1', 'Precomp 1')!;
  assert.deepEqual(r.widgets.map((w) => w.id), ['a', r.layer.id, 'z']);
  assert.equal(r.layer.zIndex, 4); assert.deepEqual(r.layer.properties, { comp: 'comp-1', start: 10 });
  assert.equal(r.layer.visibility, undefined, 'có lớp suốt bài trong nhóm → precomp suốt bài');
  assert.deepEqual(precompose(s, ['b'], { a: 1, b: 0 }, 'comp-2', 'Q')!.layer.visibility!.ranges, [{ from: 12, to: 14 }], 'thanh precomp khớp nội dung');
  assert.deepEqual([r.layer.layout.width, r.layer.layout.height], [s.canvas.designWidth, s.canvas.designHeight]);
  const k = r.comps['comp-1'];
  assert.deepEqual(k.widgets.map((w) => [w.id, w.parent]), [['b', undefined], ['c', 'b']]);
  assert.deepEqual(k.widgets[0].visibility!.ranges, [{ from: 2, to: 4 }], 'lưu theo thời gian của comp');
  // trải phẳng: đúng chỗ cũ trên timeline toàn bài
  const flat = flattenScene({ ...s, widgets: r.widgets, comps: r.comps });
  assert.deepEqual(flat.widgets.find((w) => w.id.endsWith('/b'))!.visibility!.ranges, [{ from: 12, to: 14 }]);
  assert.equal(precompose(s, ['nope'], { a: 1, b: 0 }, 'comp-1', 'x'), null);
  assert.equal(newCompName({ ...s, comps: r.comps }, 'Precomp', ['Precomp 2']), 'Precomp 3');
});

test('compLens: khung nhìn của comp đổi tiền tố mốc ↺, thời gian theo toàn bài; lệnh sẵn có nâng lên Doc thật và hoàn tác đúng', () => {
  const comps = { k: { name: 'K', widgets: [text('a', { visibility: vis(1, 3) })] } };
  const layer: WidgetSpec = { ...text('L'), type: 'COMP', properties: { comp: 'k', start: 10 }, layout: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0, anchor: { x: 0.5, y: 0.5 } } };
  const d0: C.Doc = { ...C.initialDoc('default'), scene: sc([layer, text('a')], comps), layoutRef: { a: text('a').layout, [refKey('k', 'a')]: { ...text('a').layout, x: 9 } }, propsRef: {} };
  assert.equal(compAt(d0, ['L']), 'k'); assert.equal(compAt(d0, []), null);
  const v = viewDoc(d0, ['L']);
  assert.deepEqual(v.scene.widgets.map((w) => w.id), ['a']);
  assert.deepEqual(v.scene.widgets[0].visibility!.ranges, [{ from: 11, to: 13 }]);
  assert.equal(v.layoutRef.a.x, 9, 'khoá của comp không tiền tố trong khung nhìn');
  assert.equal(putView(d0, ['L'], v).scene.comps!.k, d0.scene.comps!.k, 'ghi lại khung nhìn không đổi → giữ nguyên comp');
  const s = createStore(d0);
  s.dispatch(liftCmd(C.patchLayout(viewDoc(s.get(), ['L']), 'a', { x: 42 }), ['L']));
  assert.equal(s.get().scene.comps!.k.widgets[0].layout.x, 42);
  assert.equal(s.get().scene.widgets[1].layout.x, d0.scene.widgets[1].layout.x, 'lớp cùng id ở gốc không bị đụng');
  const moved = moveLayers(viewDoc(s.get(), ['L']).scene.widgets, ['a'], 2, tm).widgets;
  s.dispatch(liftCmd(C.setLayers(viewDoc(s.get(), ['L']), 'moveClips', { widgets: moved }), ['L']));
  assert.deepEqual(s.get().scene.comps!.k.widgets[0].visibility!.ranges, [{ from: 3, to: 5 }]);
  s.undo(); s.undo();
  assert.deepEqual(s.get().scene, d0.scene);
  // mergeKey mang đường dẫn: kéo cùng ô ở gốc và trong comp không gộp nhầm
  assert.notEqual(liftCmd(C.patchLayout(v, 'a', { x: 1 }), ['L'])!.mergeKey, C.patchLayout(d0, 'a', { x: 1 })!.mergeKey);
  assert.equal(liftCmd(null, ['L']), null);
});

test('precompose qua lệnh: mốc ↺ chuyển sang khoá của comp mới; hoàn tác trả đúng scene và mốc', () => {
  const d0: C.Doc = { ...C.initialDoc('default'), scene: sc([text('a'), text('b')]), layoutRef: { a: text('a').layout }, propsRef: { a: { x: 1 } } };
  const r = precompose(d0.scene, ['a'], { a: 1, b: 0 }, 'comp-1', 'P')!;
  const s = createStore(d0);
  s.dispatch(C.setLayers(s.get(), 'precompose', { widgets: r.widgets, comps: r.comps, layoutRef: { [refKey('comp-1', 'a')]: d0.layoutRef.a }, propsRef: { [refKey('comp-1', 'a')]: { x: 1 } } }));
  assert.ok(s.get().scene.comps!['comp-1']);
  assert.deepEqual(Object.keys(viewDoc(s.get(), [r.layer.id]).propsRef), ['a']);
  s.undo();
  assert.deepEqual(s.get().scene, d0.scene); assert.deepEqual(s.get().propsRef, d0.propsRef);
  assert.equal(s.get().scene.comps, undefined);
});

test('setCanvasSize co giãn cả widget trong precomp; applySceneToComp thay nội dung comp và mốc ↺ của nó', () => {
  const layer: WidgetSpec = { ...text('L'), type: 'COMP', properties: { comp: 'k', start: 0 }, layout: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0, anchor: { x: 0.5, y: 0.5 } } };
  const d0: C.Doc = { ...C.initialDoc('default'), scene: sc([layer], { k: { name: 'K', widgets: [text('a', { layout: { x: 960, y: 540, width: 100, height: 100, rotation: 0, anchor: { x: 0.5, y: 0.5 } } })] } }) };
  const d1 = C.setCanvasSize(d0, 1080, 1080)!.redo(d0);
  assert.equal(d1.scene.comps!.k.widgets[0].layout.x, 540);
  assert.equal(d1.scene.widgets[0].layout.width, 1080);
  const src = C.initialDoc('default').scene;
  const cmd = C.applySceneToComp(d0, 'k', src)!, d2 = cmd.redo(d0);
  assert.deepEqual(d2.scene.comps!.k.widgets.map((w) => w.id), src.widgets.map((w) => w.id));
  assert.ok(src.widgets.every((w) => `k/${w.id}` in d2.propsRef && `k/${w.id}` in d2.layoutRef));
  assert.equal(d2.videoStyle, C.CUSTOM_STYLE);
  assert.deepEqual(cmd.undo(d2).scene, d0.scene);
  assert.equal(compView(d2.scene, ['L']).widgets.length, src.widgets.length);
  assert.equal(C.applySceneToComp(d0, 'nope', src), null);
  assert.deepEqual(shiftWidgetTime(d2.scene.comps!.k.widgets[0], 0), d2.scene.comps!.k.widgets[0]);
});

test('lengthTargets/trimMany: cắt mép dính độ dài bằng thanh khác; cắt mép nhiều lớp cùng lúc dời cùng một khoảng', () => {
  const a = text('a', { visibility: vis(2, 5) }), b = text('b', { visibility: vis(10, 14) }), c = text('c', { visibility: vis(1, 4) });
  const t = lengthTargets([a, b, c], new Set(['a']), 30, 2, 'out');
  assert.deepEqual(t.map((x) => [x.id, x.t, x.len]), [['b', 6, 4], ['c', 5, 3]]);
  assert.deepEqual(lengthTargets([a, b], new Set(['b']), 30, 14, 'in').map((x) => x.t), [11]);
  const ws = trimMany([a, b, c], ['a', 'c'], { id: 'a', clip: 0 }, 'out', 6, 30);
  assert.deepEqual(ws.map((w) => w.visibility!.ranges[0]), [{ from: 2, to: 6 }, { from: 10, to: 14 }, { from: 1, to: 5 }]);
});

test('setFade: hiện dần/ẩn dần kẹp 0..30 s và không dài hơn thanh ngắn nhất; lớp suốt bài được cho khoảng', () => {
  const w = text('a', { visibility: { ranges: [{ from: 0, to: 2 }, { from: 5, to: 20 }], fadeIn: 0, fadeOut: 0 } });
  assert.equal(setFade(w, 'in', 0.5, 30).visibility!.fadeIn, 0.5);
  assert.equal(setFade(w, 'out', 9, 30).visibility!.fadeOut, 2);
  assert.equal(setFade(w, 'in', -1, 30).visibility!.fadeIn, 0);
  assert.equal(setFade(w, 'in', 0, 30), w);
  assert.deepEqual(setFade(text('b'), 'in', 1, 60).visibility, { ranges: [{ from: 0, to: null }], fadeIn: 1, fadeOut: 0 });
});

test('uncompose: lớp trong precomp ra lại đúng chỗ (vị trí, góc của lớp COMP cộng vào), đúng thời gian (điểm bắt đầu, tốc độ), trong khoảng lớp COMP hiện', () => {
  const inner = text('a', { layout: { x: 100, y: 100, width: 200, height: 100, rotation: 0, anchor: { x: 0.5, y: 0.5 } }, visibility: vis(0, 10), animate: { opacity: op(2) } });
  const L: WidgetSpec = { ...text('L', { zIndex: 5 }), type: 'COMP', name: 'P', properties: { comp: 'k', start: 4, speed: 2 }, visibility: vis(4, 7),
    layout: { x: 50, y: -20, width: 1920, height: 1080, rotation: 0, anchor: { x: 0.5, y: 0.5 } } };
  const s0 = sc([text('a', { zIndex: 1 }), L, text('top', { zIndex: 9 })], { k: { name: 'K', widgets: [inner, text('b', { parent: 'a' })] } });
  const r = uncompose(s0, 'L', 60)!;
  assert.equal(r.lost, false);
  const out = r.widgets.find((w) => w.id === r.added[0])!;
  assert.notEqual(out.id, 'a', 'id trùng với lớp ở ngoài được đổi');
  assert.deepEqual([out.layout.x, out.layout.y], [150, 80]);
  assert.deepEqual(out.visibility!.ranges, [{ from: 4, to: 7 }], 'giao của [4, 9] (sau tốc độ ×2) với lúc lớp COMP hiện');
  assert.deepEqual((out.animate!.opacity as { keys: { at: object }[] }).keys.map((k) => k.at), [{ sec: 5 }, { sec: 5.5 }]);
  assert.equal(r.widgets.find((w) => w.id === r.added[1])!.parent, out.id, 'cha bên trong comp được nối lại theo id mới');
  assert.deepEqual(C.layerOrder({ ...base, widgets: r.widgets })[0], 'top');
  assert.deepEqual(r.refs.map(([k]) => k), ['k/a', 'k/b']);
  assert.equal(uncompose(s0, 'a', 60), null);
  assert.equal(uncompose({ ...s0, widgets: s0.widgets.map((w) => (w.id === 'L' ? { ...w, animate: { opacity: op(1) } } : w)) }, 'L', 60)!.lost, true);
});

test('pianoPathAt: Piano Roll ở gốc → []; không có thì precomp trên cùng đang hiện ở vạch phát có Piano Roll (đi sâu theo thời gian của comp)', async () => {
  const { pianoPathAt } = await import('./compLens.ts');
  const roll: WidgetSpec = { ...text('p'), type: 'PIANO_ROLL', properties: {} };
  const L = (id: string, comp: string, from: number, to: number, start = 0, z = 1): WidgetSpec => ({ ...text(id, { zIndex: z }), type: 'COMP', properties: { comp, start }, visibility: vis(from, to) });
  assert.deepEqual(pianoPathAt(sc([roll]), 5), []);
  const s1 = sc([L('A', 'a', 0, 10), L('B', 'b', 5, 20, 5, 2)], { a: { name: 'A', widgets: [roll] }, b: { name: 'B', widgets: [L('N', 'n', 0, 3)] }, n: { name: 'N', widgets: [roll] } });
  assert.deepEqual(pianoPathAt(s1, 2), ['A']);
  assert.deepEqual(pianoPathAt(s1, 6), ['B', 'N'], 'B ở trên; giây 1 của B nằm trong N');
  assert.deepEqual(pianoPathAt(s1, 12), [], 'B không còn Piano Roll ở giây 7 của nó, A đã hết');
});
