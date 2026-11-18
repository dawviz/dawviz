// T-73 (REQ-GRAPHICS-19, D-60, OI-18): chỗ giữ dùng chung, định dạng {tên:định_dạng}, ô chữ TEXT.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutFrame, sanitizeScene, SCENE_SCHEMA_VERSION, createWidget, defaultScene, templateSpans, formatValue, parseTemplate, checkTemplate, numV, timeV, listV,
  GLOBAL_KEYS, type SceneDocument, type TextPrim, type Primitive } from '../src/index.ts';
import { synthAst, derivedOf } from './helpers.ts';

const sceneWith = (type: string, properties: object, extra: object = {}): { scene: SceneDocument; warnings: { code: string; details: { path: string } }[] } => {
  const { scene, warnings } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'w', type, layout: { x: 0, y: 0, width: 600, height: 300 }, properties, ...extra }] });
  return { scene, warnings };
};
const lines = (scene: SceneDocument, t: number, ast = synthAst()) => layoutFrame(scene, derivedOf(ast), ast, t)[0].prims
  .filter((x: Primitive): x is TextPrim => x.kind === 'text').map((x) => x.text);
const text = (s: string, t: number, ast = synthAst()) => { const r = sceneWith('TEXT', { text: s }); assert.deepEqual(r.warnings, [], s); return lines(r.scene, t, ast); };
const plain = (s: string, vals: Record<string, never | string | number | ReturnType<typeof numV>> = {}) => templateSpans(s, vals as never).map((x) => x.text).join('');

test('định dạng số: 0.0, đệm 000, làm tròn; sai kiểu hoặc sai mẫu → null', () => {
  assert.equal(formatValue(numV(120.456), '0.0'), '120.5');
  assert.equal(formatValue(numV(120.456), '0'), '120');
  assert.equal(formatValue(numV(7), '000'), '007');
  assert.equal(formatValue(7, '000.00'), '007.00');
  assert.equal(formatValue(numV(1234), '000'), '1234'); // số lớn không bị cắt
  assert.equal(formatValue(numV(120.5), undefined), '120.5');
  for (const bad of ['', '1', '0.', '.0', '0.00000', 'm:ss', 'abc']) assert.equal(formatValue(numV(1), bad), null, bad);
  assert.equal(formatValue('Song', '0'), null); // chữ trơn không nhận định dạng
});

test('định dạng thời gian: m:ss, mm:ss, m:ss.SSS, h:mm:ss; mặc định m:ss', () => {
  const v = timeV(125.789);
  assert.equal(formatValue(v), '2:05');
  assert.equal(formatValue(v, 'm:ss'), '2:05');
  assert.equal(formatValue(v, 'mm:ss'), '02:05');
  assert.equal(formatValue(v, 'm:ss.SSS'), '2:05.789');
  assert.equal(formatValue(v, 'm:ss.S'), '2:05.7'); // cắt, không làm tròn: giống đồng hồ DAW
  assert.equal(formatValue(timeV(3725), 'h:mm:ss'), '1:02:05');
  assert.equal(formatValue(timeV(-3), 'm:ss'), '0:00');
  for (const bad of ['0.0', 'ss', 'm:s', 'm:ss.SSSS', 'x']) assert.equal(formatValue(v, bad), null, bad);
});

test('danh sách: nối bằng khoảng trắng; {notes:, } đổi dấu phân cách', () => {
  const v = listV(['C4', 'E4', 'G4']);
  assert.equal(formatValue(v), 'C4 E4 G4');
  assert.equal(formatValue(v, ', '), 'C4, E4, G4');
  assert.equal(formatValue(v, ''), 'C4E4G4');
  assert.equal(formatValue(listV([]), ', '), '');
  assert.equal(formatValue(v, 'x'.repeat(17)), null);
});

test('parseTemplate: {{ ra {, tách ở dấu : đầu tiên, tên có gạch dưới', () => {
  assert.deepEqual(parseTemplate('a {{ b {total_time:m:ss} c'), [{ kind: 'text', text: 'a { b ' }, { kind: 'ph', raw: '{total_time:m:ss}', name: 'total_time', fmt: 'm:ss' }, { kind: 'text', text: ' c' }]);
  assert.equal(plain('{{bpm}', { bpm: 1 }), '{bpm}');           // viết dấu { nguyên chữ
  assert.equal(plain('{bpm} {x} {bpm:zz}', { bpm: 120 }), '120 {x} {bpm:zz}'); // lạ / định dạng sai: giữ nguyên chữ
  assert.equal(plain('{a}{b}', { a: 1, b: 2 }), '12');
});

test('checkTemplate: chỗ giữ lạ và định dạng sai (theo kiểu của từng tên)', () => {
  const k = [...GLOBAL_KEYS];
  assert.deepEqual(checkTemplate('{bpm:0.0} {time:m:ss.SSS} {notes:, } {title}', k), { unknown: [], badFormat: [] });
  assert.deepEqual(checkTemplate('{nope} {bpm:m:ss} {time:0.0} {title:0}', k), { unknown: ['nope'], badFormat: ['{bpm:m:ss}', '{time:0.0}', '{title:0}'] });
  assert.deepEqual(checkTemplate('{total:0} {total:m:ss}', k), { unknown: [], badFormat: [] }); // {total}: số nốt hoặc thời lượng
});

test('ô chữ TEXT: chỗ giữ chung theo t (đúng như các widget có sẵn)', () => {
  const ast = synthAst({ title: 'Demo Song', artist: 'Demo Artist' }); // 120 BPM, 4/4
  assert.deepEqual(text('{title} - {artist}', 0, ast), ['Demo Song - Demo Artist']);
  assert.deepEqual(text('{bpm} BPM, {sig}', 0, ast), ['120 BPM, 4/4']);
  assert.deepEqual(text('{bpm:0.00}', 0, ast), ['120.00']);
  assert.deepEqual(text('{time}', 95.4, ast), ['1:35']);
  assert.deepEqual(text('{time:m:ss.SSS}', 1.25, ast), ['0:01.250']);
  assert.deepEqual(text('{elapsed:mm:ss} / {total_time:mm:ss}', 2, ast), [`00:02 / ${formatValue(timeV(ast.meta.totalDurationSeconds), 'mm:ss')}`]);
  assert.deepEqual(text('{bar}.{beat}', 2.75, ast), ['2.2']);               // cùng số với widget Time & Bar: bar 2, beat 2
  assert.deepEqual(text('{bar:000}', 2.75, ast), ['002']);
  const all = ast.tracks.flatMap((t) => t.notes), t = 1.2, played = all.filter((n) => n.startTimeSeconds <= t).length;
  assert.deepEqual(text('{played}/{total} {pct}%', t, ast), [`${played}/${all.length} ${Math.round(played / all.length * 100)}%`]);
});

test('ô chữ TEXT: {notes} là mọi nốt đang vang, thấp → cao; {chord}', () => {
  const ast = synthAst({ tracks: [{ name: 'k', color: '#fff', notes: [[44, 0, 4, 80], [52, 0, 4, 80], [62, 0, 4, 80], [64, 0, 4, 80], [68, 0, 4, 80], [71, 0, 4, 80], [60, 4, 2, 80]] }] });
  assert.deepEqual(text('{notes}', 0.2, ast), ['G#2 E3 D4 E4 G#4 B4']);
  assert.deepEqual(text('{notes:, }', 0.2, ast), ['G#2, E3, D4, E4, G#4, B4']);
  assert.deepEqual(text('[{notes}]', 9, ast), ['[]']);                      // hết nốt: rỗng
  assert.deepEqual(text('{chord}', 0.2, ast), ['E7/G#']);
  assert.deepEqual(text('{chord}', 9, ast), []);                            // không có chữ nào thì không vẽ gì
});

test('ô chữ TEXT: nhiều dòng, dòng trống chiếm một dòng, {{ ra {', () => {
  const r = sceneWith('TEXT', { text: 'a\n\nb {{x}' }), ast = synthAst();
  const prims = layoutFrame(r.scene, derivedOf(ast), ast, 0)[0].prims.filter((x): x is TextPrim => x.kind === 'text');
  assert.deepEqual(prims.map((p) => p.text), ['a', 'b {x}']);
  const two = layoutFrame(sceneWith('TEXT', { text: 'a\nb' }).scene, derivedOf(ast), ast, 0)[0].prims.filter((x): x is TextPrim => x.kind === 'text');
  const step = two[1].y - two[0].y;
  assert.ok(Math.abs(prims[1].y - prims[0].y - 2 * step) < 1e-9, 'dòng trống chiếm đúng một dòng');
});

test('chỗ giữ chung dùng được ở mọi widget; chỗ giữ riêng che chỗ chung cùng tên', () => {
  const ast = synthAst({ title: 'Demo Song' });
  const ec = sceneWith('EVENT_COUNTER', { lines: { played: { enabled: true, template: '{title} @ {bpm:0.0} [{time}]' } } });
  assert.deepEqual(ec.warnings, []);
  assert.deepEqual(lines(ec.scene, 3, ast), ['Demo Song @ 120.0 [0:03]']);
  // {total} của Thanh tiến độ là thời lượng (m:ss), không phải số nốt như chỗ giữ chung
  const pb = sceneWith('PROGRESS_BAR', { timeTemplate: '{elapsed}/{total}/{pct}' }), dur = ast.meta.totalDurationSeconds;
  assert.deepEqual(lines(pb.scene, dur / 2, ast), [`${formatValue(timeV(dur / 2))}/${formatValue(timeV(dur))}/50%`]);
  // định dạng áp được lên chỗ giữ riêng: {pct:0.0} của bộ đếm là số trần
  const e2 = sceneWith('EVENT_COUNTER', { lines: { played: { enabled: true, template: '{pct}|{pct:0.0}' } } });
  const all = ast.tracks.flatMap((t) => t.notes), played = all.filter((n) => n.startTimeSeconds <= 1.2).length, share = played / all.length * 100;
  assert.deepEqual(lines(e2.scene, 1.2, ast), [`${share.toFixed(2)}%|${share.toFixed(1)}`]);
  // nhãn của Time & Bar, tên bài/nghệ sĩ của Track Info, "N.C." của Chord đều là mẫu
  const tb = sceneWith('TIME_BAR', { time: { enabled: true, label: 'at {bpm}' }, beat: { enabled: false } });
  assert.ok(lines(tb.scene, 0, ast).includes('at 120'));
  const ti = sceneWith('TRACK_INFO', { titleText: '{title}!', artistText: '' });
  assert.deepEqual(lines(ti.scene, 0, ast)[0], 'Demo Song!');
});

test('tất định: cùng (scene, t) cho cùng danh sách; chỗ giữ không dùng thì không đụng tới dữ liệu', () => {
  const r = sceneWith('TEXT', { text: '{bpm} {notes} {chord} {time:m:ss.SSS} {played}/{total}' }), ast = synthAst();
  const a = lines(r.scene, 1.7, ast); lines(r.scene, 0.1, ast);
  assert.deepEqual(lines(r.scene, 1.7, ast), a);
});

test('đọc preset: chỗ giữ lạ / định dạng sai → cảnh báo, chữ giữ nguyên; ô chữ mặc định và createWidget không cảnh báo', () => {
  const bad = sceneWith('TEXT', { text: '{nope} {bpm:m:ss} {title}' });
  assert.deepEqual(bad.warnings.map((w) => [w.code, w.details.path]), [['WARN_PRESET_VALUE', '$.widgets[0].properties.text'], ['WARN_PRESET_VALUE', '$.widgets[0].properties.text']]);
  assert.deepEqual(lines(bad.scene, 0), ['{nope} {bpm:m:ss} Demo Song']);
  assert.deepEqual(sceneWith('TEXT', {}).warnings, []);
  const sc = defaultScene(), w = createWidget(sc, 'TEXT');
  assert.equal(w.id, 'text-1');
  assert.deepEqual(sanitizeScene({ ...sc, widgets: [...sc.widgets, w] }).warnings, []);
  assert.equal(sceneWith('TEXT', { text: 'x'.repeat(2001) }).warnings.length, 1); // quá 2000 ký tự: về mặc định
});

test('{tempo} là tên cũ của {bpm}: cùng giá trị, vẫn đọc được nhưng không nằm trong danh sách gợi ý', () => {
  const ast = synthAst({ tempoMap: [{ tick: 0, timeSeconds: 0, bpm: 120.456, timeSigNumerator: 4, timeSigDenominator: 4 }] });
  assert.deepEqual(text('{bpm} = {tempo}', 0, ast), ['120.46 = 120.46']);
  assert.deepEqual(text('{tempo:0.0}', 0, ast), ['120.5']);
  assert.ok(!(GLOBAL_KEYS as readonly string[]).includes('tempo'));
  assert.deepEqual(sceneWith('TEXT', { text: '{tempo}' }).warnings, []);
});

test('chọn track riêng cho widget (MANUAL): {notes}, {played}, {total}, {chord} chỉ đọc các track đó', () => {
  const ast = synthAst(); // track 0 = Chords (hợp âm 0–2 s), track 1 = Lead
  const mk = (idx: number[]) => {
    const { scene } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'w', type: 'TEXT', trackMappingMode: 'MANUAL', assignedTrackIndices: idx, layout: { x: 0, y: 0, width: 600, height: 300 }, properties: { text: '{notes}|{played}/{total}' } }] });
    return lines(scene, 0.3, ast);
  };
  const names = (i: number) => text('{notes}', 0.3, { ...ast, tracks: [ast.tracks[i]] })[0];
  assert.deepEqual(mk([1]), [`${names(1)}|1/5`]);          // chỉ Lead: nốt 76 đang vang, 5 nốt
  assert.deepEqual(mk([0]), [`${names(0)}|4/7`]);          // chỉ Chords
  assert.deepEqual(mk([]), ['|0/0']);                      // không chọn track nào
});
