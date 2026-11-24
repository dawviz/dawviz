// Precomp (D-69, T-112): sổ comp, lớp COMP, trải phẳng để vẽ, thời gian cục bộ, khung nhìn của Editor và đọc preset.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMP_SEP, MAX_COMP_DEPTH, SCENE_SCHEMA_VERSION, canPlaceComp, compDepth, compPathOffset, compView, flatCount, flattenScene, layoutFrame, resolveCompPath, sanitizeScene,
  setCompView, shiftWidgetTime, unshiftWidgetTime, validCompPath, type SceneDocument, type WidgetSpec,
} from '../src/index.ts';
import { synthAst, derivedOf } from './helpers.ts';

const ast = synthAst({ duration: 60 });
const text = (id: string, extra: Partial<WidgetSpec> = {}): WidgetSpec => ({
  id, type: 'TEXT', zIndex: 1, visible: true, layout: { x: 100, y: 100, width: 200, height: 100, rotation: 0, anchor: { x: 0.5, y: 0.5 } },
  trackMappingMode: 'ALL', assignedTrackIndices: [], properties: sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'x', type: 'TEXT' }] }).scene.widgets[0].properties, ...extra,
});
const compLayer = (id: string, comp: string, start = 0, extra: Partial<WidgetSpec> = {}): WidgetSpec => ({
  id, type: 'COMP', zIndex: 5, visible: true, layout: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0, anchor: { x: 0.5, y: 0.5 } },
  trackMappingMode: 'ALL', assignedTrackIndices: [], properties: { comp, start }, ...extra,
});
const base = (widgets: WidgetSpec[], comps: SceneDocument['comps']): SceneDocument => ({ ...sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [] }).scene, widgets, comps });
const op = (a: { sec: number }) => ({ keys: [{ at: a, value: 0.5 }, { at: { sec: a.sec + 1 }, value: 1 }, { at: { bar: 2 }, value: 1 }] });

test('shiftWidgetTime: dời keyframe mốc giây, khoảng hiển thị và điểm bắt đầu của lớp COMP; mốc nhạc giữ nguyên; unshift trả đúng giá trị gốc', () => {
  const w = text('t', { animate: { opacity: op({ sec: 2 }) }, visibility: { ranges: [{ from: 1, to: 5 }, { from: 8, to: null }], fadeIn: 0.5, fadeOut: 0 } });
  const s = shiftWidgetTime(w, 0.1);
  assert.deepEqual((s.animate!.opacity as { keys: { at: object }[] }).keys.map((k) => k.at), [{ sec: 2.1 }, { sec: 3.1 }, { bar: 2 }]);
  assert.deepEqual(s.visibility!.ranges, [{ from: 1.1, to: 5.1 }, { from: 8.1, to: null }]);
  assert.equal(shiftWidgetTime(w, 0), w);
  assert.deepEqual((shiftWidgetTime(compLayer('c', 'k', 3), 2).properties as { start: number }).start, 5);
  // không trôi số: phần không sửa trả đúng tham chiếu gốc; phần đã sửa dời ngược
  assert.equal(unshiftWidgetTime(w, s, 0.1), w);
  const edited = { ...s, layout: { ...s.layout, x: 7 } };
  const back = unshiftWidgetTime(w, edited, 0.1);
  assert.equal(back.animate!.opacity, w.animate!.opacity); assert.equal(back.visibility, w.visibility); assert.equal(back.layout.x, 7);
  const moved = shiftWidgetTime(s, 1); // kéo thanh thêm 1 s trong khung nhìn
  assert.deepEqual((unshiftWidgetTime(w, moved, 0.1).animate!.opacity as { keys: { at: object }[] }).keys[0].at, { sec: 3 });
});

test('flattenScene: con của lớp COMP có id tiền tố, nằm ngay sau lớp đó theo thứ tự vẽ, mốc giây cộng điểm bắt đầu, cha = lớp COMP; không có comp thì giữ nguyên scene', () => {
  const plain = base([text('a')], undefined);
  assert.equal(flattenScene(plain), plain);
  const sc = base([text('under', { zIndex: 0 }), compLayer('L', 'k', 10, { zIndex: 1 }), text('over', { zIndex: 2 })], {
    k: { name: 'K', widgets: [text('b', { zIndex: 2, animate: { opacity: op({ sec: 1 }) } }), text('a', { zIndex: 1, visibility: { ranges: [{ from: 0, to: 4 }], fadeIn: 0, fadeOut: 0 } }), text('c', { zIndex: 3, parent: 'a' })] },
  });
  const f = flattenScene(sc);
  assert.equal(flattenScene(sc), f, 'đệm theo scene');
  assert.deepEqual(f.widgets.map((w) => w.id), ['under', 'L', `L${COMP_SEP}a`, `L${COMP_SEP}b`, `L${COMP_SEP}c`, 'over']);
  assert.deepEqual(f.widgets.map((w) => w.zIndex), [0, 1, 2, 3, 4, 5]);
  const byId = new Map(f.widgets.map((w) => [w.id, w]));
  assert.equal(byId.get('L/a')!.parent, 'L'); assert.equal(byId.get('L/c')!.parent, 'L/a');
  assert.deepEqual(byId.get('L/a')!.visibility!.ranges, [{ from: 10, to: 14 }]);
  assert.deepEqual((byId.get('L/b')!.animate!.opacity as { keys: { at: object }[] }).keys.map((k) => k.at), [{ sec: 11 }, { sec: 12 }, { bar: 2 }]);
  assert.equal(f.comps, undefined); assert.equal(flattenScene(f), f, 'trải lại scene phẳng: không làm gì');
});

test('flattenScene: lồng nhiều cấp cộng dồn điểm bắt đầu; vòng lặp và cấp vượt MAX_COMP_DEPTH bị bỏ', () => {
  const comps: SceneDocument['comps'] = {};
  for (let i = 1; i <= MAX_COMP_DEPTH + 1; i++) comps[`c${i}`] = { name: `C${i}`, widgets: [text(`t${i}`, { visibility: { ranges: [{ from: 0, to: 1 }], fadeIn: 0, fadeOut: 0 } }), ...(i <= MAX_COMP_DEPTH ? [compLayer(`l${i + 1}`, `c${i + 1}`, 1)] : [])] };
  const f = flattenScene(base([compLayer('l1', 'c1', 1)], comps));
  const texts = f.widgets.filter((w) => w.type === 'TEXT');
  assert.equal(texts.length, MAX_COMP_DEPTH, 'cấp thứ 5 không trải');
  assert.deepEqual(texts.map((w) => w.visibility!.ranges[0].from), [1, 2, 3, 4]);
  assert.equal(texts.at(-1)!.id, ['l1', 'l2', 'l3', 'l4', 't4'].join(COMP_SEP));
  const loop = flattenScene(base([compLayer('l', 'a')], { a: { name: 'A', widgets: [text('x'), compLayer('m', 'b')] }, b: { name: 'B', widgets: [compLayer('n', 'a')] } }));
  assert.deepEqual(loop.widgets.map((w) => w.id).sort(), ['l', 'l/m', 'l/m/n', 'l/x']);
  assert.ok(!loop.widgets.some((w) => w.id.startsWith('l/m/n/')), 'không vòng vô hạn');
});

test('layoutFrame: lớp COMP truyền khoảng hiển thị, nút mắt, dời và độ đục cho cả comp; tự nó không vẽ', () => {
  const comps = { k: { name: 'K', widgets: [text('a')] } };
  const at = (L: WidgetSpec, t: number) => layoutFrame(base([L], comps), derivedOf(ast), ast, t).map((o) => ({ id: o.widget.id, pm: o.pm, n: o.prims.length }));
  const vis = { ranges: [{ from: 2, to: 6 }], fadeIn: 0, fadeOut: 0 };
  assert.deepEqual(at(compLayer('L', 'k', 0, { visibility: vis }), 1), []);
  assert.deepEqual(at(compLayer('L', 'k', 0, { visibility: vis }), 3).map((o) => o.id), ['L/a']);
  assert.deepEqual(at(compLayer('L', 'k', 0, { visible: false }), 3), []);
  const moved = at(compLayer('L', 'k', 0, { layout: { x: 50, y: -20, width: 1920, height: 1080, rotation: 0, anchor: { x: 0.5, y: 0.5 } } }), 3)[0];
  assert.deepEqual(moved.pm!.map((v) => Math.round(v * 1e6) / 1e6), [1, 0, 0, 1, 50, -20], 'vị trí tĩnh của lớp COMP dời cả comp');
  assert.equal(at(compLayer('L', 'k'), 3)[0].pm, undefined, 'đặt đúng khung: không biến đổi');
  const half = layoutFrame(base([compLayer('L', 'k', 0, { animate: { opacity: { keys: [{ at: { sec: 0 }, value: 0.5 }] } } })], comps), derivedOf(ast), ast, 3);
  const full = layoutFrame(base([compLayer('L', 'k')], comps), derivedOf(ast), ast, 3);
  const alpha = (o: typeof half) => o[0].prims.map((p) => (p as { alpha: number }).alpha);
  assert.deepEqual(alpha(half), alpha(full).map((a) => a * 0.5));
});

test('compView/setCompView: Editor sửa comp theo thời gian toàn bài, ghi lại theo thời gian của comp; đường dẫn sai bị cắt', () => {
  const sc = base([compLayer('L', 'k', 10), compLayer('M', 'k', 20)], { k: { name: 'K', widgets: [text('a', { visibility: { ranges: [{ from: 1, to: 2 }], fadeIn: 0, fadeOut: 0 } }), compLayer('N', 'j', 5)] }, j: { name: 'J', widgets: [text('z')] } });
  assert.deepEqual(resolveCompPath(sc, ['L', 'N']).map((f) => f.offset), [10, 15]);
  assert.equal(compPathOffset(sc, ['M']), 20); assert.equal(compPathOffset(sc, []), 0);
  assert.deepEqual(validCompPath(sc, ['L', 'gone', 'x']), ['L']);
  const v = compView(sc, ['L']);
  assert.deepEqual(v.widgets[0].visibility!.ranges, [{ from: 11, to: 12 }]);
  assert.equal((v.widgets[1].properties as { start: number }).start, 15);
  const ed = { ...v, widgets: [shiftWidgetTime(v.widgets[0], 3), v.widgets[1]] };
  const back = setCompView(sc, ['L'], ed);
  assert.equal(back.widgets, sc.widgets);
  assert.deepEqual(back.comps!.k.widgets[0].visibility!.ranges, [{ from: 4, to: 5 }]);
  assert.equal(back.comps!.k.widgets[1], sc.comps!.k.widgets[1], 'lớp không sửa giữ nguyên tham chiếu');
  assert.equal(compView(sc, []), sc);
});

test('canPlaceComp/compDepth/flatCount: chặn vòng lặp và lồng quá sâu, đếm widget sau khi trải', () => {
  const comps = { a: { name: 'A', widgets: [text('x'), compLayer('l', 'b')] }, b: { name: 'B', widgets: [text('y')] }, c: { name: 'C', widgets: [compLayer('m', 'a')] } };
  assert.equal(compDepth(comps, 'a'), 2); assert.equal(compDepth(comps, 'c'), 3);
  assert.ok(canPlaceComp(comps, 'a', []));
  assert.ok(!canPlaceComp(comps, 'a', ['b']), 'a chứa b: đặt a vào trong b là vòng lặp');
  assert.ok(!canPlaceComp(comps, 'b', ['b']));
  assert.ok(canPlaceComp(comps, 'c', ['x1']), '1 + 3 = 4: vừa đủ');
  assert.ok(!canPlaceComp(comps, 'c', ['q', 'r']), '2 + 3 > 4');
  assert.equal(flatCount(base([compLayer('L', 'c'), text('t')], comps)), 6);
});

test('sanitizeScene: đọc sổ comp và lớp COMP; bỏ lớp trỏ comp thiếu, vòng lặp; id có "/" bị đổi; vòng lưu → đọc giữ nguyên', () => {
  const raw = {
    schemaVersion: SCENE_SCHEMA_VERSION, canvas: {},
    widgets: [compLayer('L', 'k', 2.5), compLayer('bad', 'nope'), { ...text('a/b'), zIndex: 0 }],
    comps: { k: { name: '  Mở  đầu ', widgets: [text('x'), compLayer('self', 'k')] }, 'x/y': { name: 'sai', widgets: [] } },
  };
  const r = sanitizeScene(raw);
  assert.deepEqual(r.scene.widgets.map((w) => w.id), ['L', 'a-b']);
  assert.deepEqual(Object.keys(r.scene.comps!), ['k']);
  assert.equal(r.scene.comps!.k.name, 'Mở đầu');
  assert.deepEqual(r.scene.comps!.k.widgets.map((w) => w.id), ['x']);
  assert.deepEqual(r.scene.widgets[0].properties, { comp: 'k', start: 2.5 });
  const paths = r.warnings.map((w) => String(w.details?.path));
  for (const p of ['$.widgets[1].properties.comp', '$.comps.k.widgets[1].properties.comp', '$.comps.x/y', '$.widgets[2].id']) assert.ok(paths.includes(p), p);
  const again = sanitizeScene(JSON.parse(JSON.stringify(r.scene)));
  assert.deepEqual(again.scene, r.scene); assert.deepEqual(again.warnings, []);
  // preset 0.7.0 cũ: đọc được, không có comps
  const old = sanitizeScene({ schemaVersion: '0.7.0', canvas: {}, widgets: [text('a')] });
  assert.equal(old.scene.comps, undefined); assert.equal(old.scene.schemaVersion, SCENE_SCHEMA_VERSION);
});
