// T-66 (lane automation tổng quát: MIDI CC, pitch bend, binding track.automation.<id>), T-06 (Chord chọn track hoà âm), T-52 (đổi tập track theo đoạn).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutFrame, sanitizeScene, SCENE_SCHEMA_VERSION, bindSourceValue, isBindSource, laneNorm, laneUnit, laneValueText, tracksFor, firstMelodicTrack, createWidget, defaultScene,
  buildSceneHud, chordKey, trackRangeAt, mapWidgetTime, type SceneDocument, type TextPrim, type Primitive, type UnifiedProjectAST, type AutomationLane } from '../src/index.ts';
import { synthAst, derivedOf } from './helpers.ts';

const pt = (sec: number, value: number, shape = 1) => ({ tick: Math.round(sec * 2 * 960), timeSeconds: sec, value, shape });
const cc1: AutomationLane = { kind: 'midi-cc', name: 'Mod Wheel (CC1)', range: { min: 0, max: 127 }, points: [pt(0, 0), pt(1, 127), pt(2, 64)] };
const bend: AutomationLane = { kind: 'pitch-bend', name: 'Pitch Bend', range: { min: -8192, max: 8191 }, points: [pt(0, 0), pt(1, 8191), pt(2, -4096)] };
const withLanes = (): UnifiedProjectAST => { const ast = synthAst({ duration: 10 }); ast.tracks[1].automation = { cc1, pitchBend: bend }; return ast; };
const sceneOf = (widgets: object[], extra: object = {}) => { const r = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets, ...extra }); return r; };
const texts = (p: Primitive[]) => p.filter((x): x is TextPrim => x.kind === 'text').map((x) => x.text).join('|');

test('laneNorm: chuẩn hoá theo loại lane và range (REQ-AST-02)', () => {
  assert.equal(laneNorm(cc1, 127), 1); assert.equal(laneNorm(cc1, 0), 0); assert.ok(Math.abs(laneNorm(cc1, 64) - 64 / 127) < 1e-12);
  assert.equal(laneNorm(bend, -8192), 0); assert.equal(laneNorm(bend, 8191), 1);
  assert.equal(laneNorm({ kind: 'pan' }, -1), 0); assert.equal(laneNorm({ kind: 'pan' }, 1), 1);
  assert.equal(laneNorm({ kind: 'volume' }, 1), 1); assert.equal(laneNorm({ kind: 'volume' }, 1, { floorDb: -36, ceilDb: 6 }), 36 / 42);
  assert.equal(laneNorm({ kind: 'plugin', range: { min: 20, max: 20000 } }, 20000), 1);
  assert.equal(laneNorm({ kind: 'midi-cc' }, 127), 1); // thiếu range: CC vẫn theo /127
  assert.equal(laneValueText(cc1, 100.4), '100'); assert.equal(laneValueText(bend, 8191), '+1.00'); assert.equal(laneValueText(bend, -4096), '−0.50'); assert.equal(laneValueText(bend, 0), '0');
  assert.equal(laneValueText({ kind: 'plugin', range: { min: 0, max: 2 } }, 1), '50%');
});

test('AUTOMATION chọn lane theo id (cc1, pitchBend): vẽ track có lane đó, giá trị hiện tại đúng loại; id sai về volume + cảnh báo', () => {
  const ast = withLanes(), d = derivedOf(ast);
  const sc = (lane: string) => sceneOf([{ id: 'a', type: 'AUTOMATION', layout: { x: 0, y: 0, width: 600, height: 200 }, properties: { lane, windowSec: 0 } }]);
  const r = sc('cc1'); assert.deepEqual(r.warnings, []); assert.equal((r.scene.widgets[0].properties as { lane: string }).lane, 'cc1');
  assert.equal(texts(layoutFrame(r.scene, d, ast, 1.5)[0].prims), '127'); // bậc thang: giữ 127 tới điểm kế
  assert.equal(texts(layoutFrame(sc('pitchBend').scene, d, ast, 2.5)[0].prims), '−0.50');
  const bad = sc('bad lane!');
  assert.equal((bad.scene.widgets[0].properties as { lane: string }).lane, 'volume'); assert.ok(bad.warnings.some((w) => /lane$/.test(String(w.details?.path))));
});

test('binding track.automation.<id>: nguồn 0..1 theo lane, kiểm khi đọc preset, track không có lane → 0', () => {
  const ast = withLanes(), derived = derivedOf(ast), tracks = derived.index.tracks;
  assert.ok(isBindSource('track.automation.cc1')); assert.ok(isBindSource('track.volume')); assert.ok(!isBindSource('track.automation.')); assert.ok(!isBindSource('track.automation.a b'));
  assert.equal(bindSourceValue('track.automation.cc1', { ast, derived, tracks, t: 1.2 }), 1);
  assert.equal(bindSourceValue('track.automation.pitchBend', { ast, derived, tracks, t: 0.5 }), laneUnit(ast.tracks[1], 'pitchBend', ast.tempoMap, 0.5));
  assert.equal(bindSourceValue('track.automation.cc11', { ast, derived, tracks, t: 1 }), 0);
  const ok = sceneOf([{ id: 'x', type: 'TEXT', layout: { x: 0, y: 0, width: 100, height: 50 }, animate: { opacity: { bind: 'track.automation.cc1', from: [0, 1], to: [0, 1] } } }]);
  assert.deepEqual(ok.warnings, []); assert.equal((ok.scene.widgets[0].animate!.opacity as { bind: string }).bind, 'track.automation.cc1');
  const no = sceneOf([{ id: 'x', type: 'TEXT', layout: { x: 0, y: 0, width: 100, height: 50 }, animate: { opacity: { bind: 'track.automation.<bad>', from: [0, 1], to: [0, 1] } } }]);
  assert.equal(no.scene.widgets[0].animate, undefined); assert.ok(no.warnings.length >= 1);
});

test('T-06: AUTO_ASSIGN_FIRST_MELODIC bỏ track trống; Chord Detection chọn trước track tên Piano/Keys/Guitar; Chord mới mặc định chế độ này', () => {
  const ast = synthAst({ tracks: [
    { name: 'Drums', color: '#111111', notes: [[36, 0, 1, 100]] }, { name: 'Lead Synth', color: '#222222', notes: [[72, 0, 1, 90]] },
    { name: 'Grand Piano', color: '#333333', notes: [[60, 0, 4, 80], [64, 0, 4, 80], [67, 0, 4, 80]] }, { name: 'Ac. Guitar', color: '#444444', notes: [[52, 0, 4, 80]] },
  ] });
  const index = derivedOf(ast).index;
  assert.equal(firstMelodicTrack(index.tracks)?.track.name, 'Lead Synth');
  assert.equal(firstMelodicTrack(index.tracks, true)?.track.name, 'Grand Piano');
  const chord = createWidget(defaultScene(), 'CHORD_DETECTION');
  assert.equal(chord.trackMappingMode, 'AUTO_ASSIGN_FIRST_MELODIC');
  assert.deepEqual(tracksFor(chord, index).map((t) => t.track.name), ['Grand Piano']);
  assert.deepEqual(tracksFor({ ...chord, type: 'TEXT' }, index).map((t) => t.track.name), ['Lead Synth']);
  assert.equal(createWidget(defaultScene(), 'TEXT').trackMappingMode, 'ALL');
  // chỉ có track trống: vẫn chọn track đầu có nốt (không bỏ trống widget)
  const drumsOnly = derivedOf(synthAst({ tracks: [{ name: 'Kit', color: '#111111', notes: [[36, 0, 1, 100]] }] })).index;
  assert.equal(firstMelodicTrack(drumsOnly.tracks, true)?.track.name, 'Kit');
  // track kênh 10 (GM) bị coi là trống dù tên không nói
  const ch10 = synthAst({ tracks: [{ name: 'Track 1', color: '#111111', notes: [[36, 0, 1, 100]] }, { name: 'Track 2', color: '#222222', notes: [[60, 0, 1, 100]] }] });
  ch10.tracks[0].notes.forEach((n) => { n.channel = 9; });
  assert.equal(firstMelodicTrack(derivedOf(ch10).index.tracks)?.track.name, 'Track 2');
});

test('T-52: trackRanges đổi tập track theo đoạn (tất định), đọc preset kiểm/sắp, dời theo precomp; hợp âm dựng sẵn cho từng tập', () => {
  const ast = synthAst({ duration: 10 }), index = derivedOf(ast).index;
  const r = sceneOf([{ id: 'c', type: 'CHORD_DETECTION', layout: { x: 0, y: 0, width: 300, height: 100 }, trackRanges: [{ from: 4, to: null, tracks: [1, 1, 0] }, { from: 1, to: 4, tracks: [1] }, { from: 5, to: 3, tracks: [0] }, { from: 'x', tracks: [] }] }]);
  const w = r.scene.widgets[0];
  assert.deepEqual(w.trackRanges, [{ from: 1, to: 4, tracks: [1] }, { from: 4, to: null, tracks: [0, 1] }]);
  assert.equal(r.warnings.length, 3); // to <= from (1) + from không phải số (2)
  assert.deepEqual(tracksFor(w, index, 0.5).map((t) => t.track.index), [0, 1]); // ngoài đoạn: theo trackMappingMode (ALL)
  assert.deepEqual(tracksFor(w, index, 2).map((t) => t.track.index), [1]);
  assert.deepEqual(tracksFor(w, index, 9).map((t) => t.track.index), [0, 1]);
  assert.deepEqual(tracksFor(w, index).map((t) => t.track.index), [0, 1]); // không có t: bỏ qua đoạn
  assert.equal(trackRangeAt(w, 4)?.from, 4);
  const hud = buildSceneHud(r.scene, ast, index);
  assert.ok(hud.chords.has(chordKey(tracksFor(w, index, 2), 'sustained')));
  assert.deepEqual(mapWidgetTime(w, { a: 1, b: 2 }).trackRanges, [{ from: 3, to: 6, tracks: [1] }, { from: 6, to: null, tracks: [0, 1] }]);
  // vẽ hai lần cùng t → cùng kết quả
  const d = derivedOf(ast);
  assert.deepEqual(layoutFrame(r.scene, d, ast, 2), layoutFrame(r.scene, d, ast, 2));
  assert.equal(sceneOf([{ id: 'c', type: 'TEXT', layout: { x: 0, y: 0, width: 300, height: 100 } }]).scene.widgets[0].trackRanges, undefined);
});
