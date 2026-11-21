// P-02…P-13 (AT-23) và P-12 (cách ghi tên nốt): kết quả khớp tính tay, tất định, không NaN.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutFrame, sanitizeScene, SCENE_SCHEMA_VERSION, keyFromHistogram, keyAt, lyricLines, sectionsOf, buildIndex, pitchClassNameFor, noteNameFor, chordNameFor, DEFAULT_NAMING,
  INSIGHT_TYPES, type SceneDocument, type TextPrim, type RectPrim, type Primitive, type UnifiedProjectAST } from '../src/index.ts';
import { synthAst, derivedOf } from './helpers.ts';

const sceneWith = (type: string, properties: object = {}, extra: object = {}, layout = { x: 0, y: 0, width: 600, height: 200 }): SceneDocument => {
  const { scene, warnings } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'w', type, layout, properties }], ...extra });
  assert.deepEqual(warnings, []); return scene;
};
const prims = (scene: SceneDocument, t: number, ast: UnifiedProjectAST = synthAst()) => layoutFrame(scene, derivedOf(ast, { naming: scene.noteNaming, phases: scene.phases }), ast, t)[0]?.prims ?? [];
const texts = (p: Primitive[]) => p.filter((x): x is TextPrim => x.kind === 'text').map((x) => x.text).join('|');
const rects = (p: Primitive[]) => p.filter((x): x is RectPrim => x.kind === 'rect');

test('P-12: tên lớp cao độ, tên nốt, tên hợp âm theo hệ ghi', () => {
  const N = DEFAULT_NAMING;
  assert.equal(pitchClassNameFor(1, N), 'C♯'); assert.equal(pitchClassNameFor(1, { ...N, accidental: 'FLAT' }), 'D♭'); assert.equal(pitchClassNameFor(1, { ...N, ascii: true }), 'C#');
  assert.equal(pitchClassNameFor(11, { ...N, system: 'GERMAN' }), 'H'); assert.equal(pitchClassNameFor(10, { ...N, system: 'GERMAN', accidental: 'FLAT' }), 'B'); assert.equal(pitchClassNameFor(10, { ...N, system: 'GERMAN' }), 'Ais');
  assert.equal(pitchClassNameFor(7, { ...N, system: 'SOLFEGE' }), 'Sol');
  assert.equal(noteNameFor(60, N), 'C4'); assert.equal(noteNameFor(60, { ...N, middleC: 3 }), 'C3'); assert.equal(noteNameFor(200, N), '?');
  assert.equal(chordNameFor('Cmaj7', { ...N, system: 'SOLFEGE' }), 'Domaj7'); assert.equal(chordNameFor('E7/G#', { ...N, system: 'SOLFEGE' }), 'Mi7/Sol♯');
  assert.equal(chordNameFor('Bm', { ...N, system: 'GERMAN' }), 'Hm'); assert.equal(chordNameFor('Bbm', { ...N, accidental: 'FLAT' }), 'B♭m'); assert.equal(chordNameFor('???', N), '???');
});

test('P-12: scene.noteNaming đổi tên trong mọi widget chữ; vắng thì giữ cách ghi cũ; giá trị sai về mặc định kèm cảnh báo', () => {
  const ast = synthAst();
  const withNaming = sceneWith('CHORD_DETECTION', { alwaysShowNotes: true }, { noteNaming: { system: 'SOLFEGE', accidental: 'SHARP', ascii: false, middleC: 4 } });
  const t = prims(withNaming, 0.1, ast).length ? texts(prims(withNaming, 0.1, ast)) : '';
  assert.match(t, /Mi|Sol|Si|Re/); assert.doesNotMatch(t, /\bE7\b/);
  assert.ok(texts(prims(sceneWith('CHORD_DETECTION', { alwaysShowNotes: true }), 0.1, ast)).includes('E'));
  const bad = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [], noteNaming: { system: 'KANA', accidental: 'X', middleC: 9 } });
  assert.equal(bad.scene.noteNaming?.system, 'LETTER'); assert.equal(bad.scene.noteNaming?.middleC, 4); assert.ok(bad.warnings.length >= 2);
  assert.equal(sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [] }).scene.noteNaming, undefined);
});

test('P-02 Tempo & nhịp: chữ "120 BPM  4/4", đường cong có cột, tempo đổi thì nền nháy rồi tắt', () => {
  const ast = synthAst({ duration: 20, tempoMap: [{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }, { tick: 9600, timeSeconds: 5, bpm: 90, timeSigNumerator: 3, timeSigDenominator: 4 }] });
  const sc = sceneWith('TEMPO_INFO');
  assert.equal(texts(prims(sc, 1, ast)), '120 BPM  4/4'); assert.equal(texts(prims(sc, 6, ast)), '90 BPM  3/4');
  const bars = (t: number) => rects(prims(sc, t, ast)).filter((r) => r.fill === '#8aa4ff');
  assert.ok(bars(1).length >= 20);
  const flash = (t: number) => rects(prims(sc, t, ast)).some((r) => r.fill === '#ffd166');
  assert.ok(!flash(1) && flash(5.2) && !flash(7));
});

test('P-03 Bar & Beat: "002.2.50" ở 2,75 s; chấm beat đúng số và chấm hiện tại sáng', () => {
  const sc = sceneWith('BAR_BEAT');
  const p = prims(sc, 2.75);
  assert.equal(texts(p), '002.2.50');
  const dots = rects(p).filter((r) => r.fill === '#3a4060' || r.fill === '#ffd166');
  assert.equal(dots.length, 4); assert.equal(dots.filter((r) => r.fill === '#ffd166').length, 1);
  assert.equal(texts(prims(sceneWith('BAR_BEAT', { format: 'SIXTEENTH' }), 2.75)), '002.2.3');
});

test('P-04 Giọng: Krumhansl–Schmuckler nhận C trưởng và A thứ; ít nốt thì không đoán', () => {
  const C = [6, 0, 3, 0, 4, 3, 0, 5, 0, 3, 0, 2]; // trọng số gần hồ sơ C trưởng
  const k = keyFromHistogram(C); assert.deepEqual([k?.tonic, k?.minor], [0, false]);
  const Am = [4, 0, 2, 3, 3, 0, 0, 4, 0, 5, 0, 1]; // A thứ: A C D E G
  const a = keyFromHistogram([4, 0, 2, 0, 4, 3, 0, 3, 0, 6, 0, 0].map((v, i) => (i === 3 ? 0 : v) + Am[i] * 0.1)); assert.equal(a?.tonic, 9); assert.equal(a?.minor, true);
  assert.equal(keyFromHistogram([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), null);
  const scale = [60, 62, 64, 65, 67, 69, 71, 72].map((p, i) => [p, i, 1, 90] as [number, number, number, number]);
  const ast = synthAst({ tracks: [{ name: 'm', color: '#fff', notes: [...scale, ...scale.map((n): [number, number, number, number] => [n[0], n[1] + 8, 1, 90])] }] });
  const idx = buildIndex(ast.tracks, 20);
  assert.equal(keyAt(idx.tracks, 8, 16)?.tonic, 0);
  assert.equal(texts(prims(sceneWith('KEY_SCALE', {}), 8, ast)).startsWith('C major'), true);
  assert.equal(texts(prims(sceneWith('KEY_SCALE', {}), 0, ast)), '—'); // chưa có nốt nào trong cửa sổ
});

test('P-05 Velocity: mức mỗi track bật lên đúng lúc nốt và tắt dần; histogram đếm nốt trong cửa sổ', () => {
  const sc = sceneWith('VELOCITY', { trackColor: '' });
  const h = (t: number) => Math.max(0, ...rects(prims(sc, t)).map((r) => r.h));
  assert.ok(h(0.5) > 0 && h(0.5) > h(0.7)); assert.equal(h(30), 0);
  const hist = rects(prims(sceneWith('VELOCITY', { mode: 'HISTOGRAM', bins: 4 }), 3));
  assert.ok(hist.length > 0 && hist.length <= 4);
});

test('P-06 Mật độ: một hàng mỗi track, ô đậm hơn nơi nhiều nốt; có số giọng đang vang', () => {
  const ast = synthAst();
  const p = prims(sceneWith('DENSITY', { cols: 16 }), 1, ast);
  assert.match(texts(p), /^Voices: \d+$/);
  assert.ok(rects(p).length >= 2 * 16);
  assert.equal(texts(prims(sceneWith('DENSITY', { showPolyphony: false }), 1, ast)), '');
});

test('P-07 Vòng cao độ: 12 ô, ô của lớp cao độ đang vang sáng; vòng quãng năm đổi thứ tự; hợp âm ở giữa', () => {
  const ast = synthAst({ tracks: [{ name: 'c', color: '#fff', notes: [[60, 0, 4, 90], [64, 0, 4, 90], [67, 0, 4, 90]] }] });
  const lit = (sc: SceneDocument) => rects(prims(sc, 0.2, ast)).filter((r) => r.fill === '#ffd166').length;
  assert.equal(lit(sceneWith('PITCH_WHEEL')), 3);
  const p = prims(sceneWith('PITCH_WHEEL'), 0.2, ast);
  assert.equal(rects(p).length, 12); assert.match(texts(p), /C\|/); assert.ok(texts(p).endsWith('C'));
  const fifths = texts(prims(sceneWith('PITCH_WHEEL', { order: 'FIFTHS', showChord: false }), 0.2, ast)).split('|');
  assert.deepEqual(fifths.slice(0, 3), ['C', 'G', 'D']);
});

test('P-08 Tổng quan bản phối: ô đã qua đậm, ô sắp tới nhạt, có vạch phát', () => {
  const ast = synthAst({ duration: 10 });
  const r = rects(prims(sceneWith('ARRANGEMENT', { cols: 20 }), 1, ast));
  assert.ok(r.some((x) => x.alpha === 1) && r.some((x) => Math.abs(x.alpha - 0.4) < 1e-9) && r.some((x) => x.fill === '#ffffff'));
});

test('P-09 Drum pad: chỉ lấy track trống (kênh 10), pad sáng khi nốt chạm rồi tắt dần, nhãn GM', () => {
  const ast = synthAst({ tracks: [{ name: 'Drums', color: '#f00', notes: [[36, 0, 0.25, 100], [38, 1, 0.25, 100], [42, 1, 0.25, 100]] }, { name: 'Lead', color: '#0f0', notes: [[72, 0, 1, 90]] }] });
  for (const n of ast.tracks[0].notes) n.channel = 9;
  const sc = sceneWith('DRUM_PAD');
  assert.equal(texts(prims(sc, 0, ast)), 'Kick|Snare|HH Closed');
  const hit = (t: number) => rects(prims(sc, t, ast)).filter((r) => r.fill === '#ffb74d' && r.alpha > 0).length;
  assert.equal(hit(0.05), 1); assert.equal(hit(2.9), 0);
  assert.equal(texts(prims(sceneWith('DRUM_PAD', { source: 'ALL' }), 0, ast)).split('|').length, 4);
});

test('P-10 Tên đoạn: theo marker của dự án; không có marker thì theo phase của scene', () => {
  const ast = synthAst({ duration: 20 }); ast.meta.markers = [{ tick: 0, timeSeconds: 0, name: 'Intro' }, { tick: 9600, timeSeconds: 5, name: 'Verse' }];
  const sc = sceneWith('SECTION');
  assert.equal(texts(prims(sc, 1, ast)), 'Intro|Next: Verse in 0:04'); assert.equal(texts(prims(sc, 6, ast)), 'Verse');
  const ph = sceneWith('SECTION', {}, { phases: [{ name: 'Chorus', start: 2 }] });
  assert.equal(texts(prims(ph, 3)), 'Chorus');
  assert.deepEqual(sectionsOf({ ...derivedOf(synthAst()) }, []), []);
});

test('P-11 Lời: gom dòng theo "/" và khoảng nghỉ; âm tiết đã hát khác kiểu; dòng tắt sau hideAfterSec', () => {
  const ly = [{ timeSeconds: 0, text: 'Hel-' }, { timeSeconds: 0.5, text: 'lo ' }, { timeSeconds: 1, text: 'world' }, { timeSeconds: 1.5, text: '/Next ' }, { timeSeconds: 2, text: 'line' }, { timeSeconds: 10, text: 'Far' }];
  const lines = lyricLines(ly, 2.5, 60);
  assert.deepEqual(lines.map((l) => l.parts.map((q) => q.text).join('')), ['Hel-lo world', 'Next line', 'Far']);
  const ast = synthAst({ duration: 20 }); ast.meta.lyrics = ly.map((l) => ({ ...l, tick: 0 }));
  const sc = sceneWith('LYRICS');
  const p = prims(sc, 0.6, ast);
  assert.match(texts(p), /Hel-lo/); assert.match(texts(p), /Next line/); // dòng tiếp theo hiện nhỏ phía dưới
  assert.equal(texts(prims(sceneWith('LYRICS', { showNext: false }), 8, ast)), ''); // quá hideAfterSec
});

test('P-13 Automation: đường âm lượng theo thời gian, giá trị hiện tại bằng dB, pan "L/R"', () => {
  const ast = synthAst({ duration: 10 });
  ast.tracks[0].automation = { volume: { kind: 'volume', points: [{ tick: 0, timeSeconds: 0, value: 1, shape: 0 }, { tick: 9600, timeSeconds: 5, value: 0.5, shape: 0 }] }, pan: { kind: 'pan', points: [{ tick: 0, timeSeconds: 0, value: -0.5, shape: 0 }] } };
  const sc = sceneWith('AUTOMATION', { windowSec: 0 });
  const p = prims(sc, 0, ast);
  assert.equal(texts(p), '0.0 dB'); assert.ok(rects(p).length > 40);
  assert.equal(texts(prims(sc, 5, ast)), '-6.0 dB');
  assert.equal(texts(prims(sceneWith('AUTOMATION', { lane: 'pan', windowSec: 0 }), 1, ast)), 'L50');
  assert.equal(prims(sceneWith('AUTOMATION', {}), 1, synthAst()).length, 0); // không track nào có lane: không vẽ gì
});

test('mọi widget phân tích: tất định, không NaN, đọc preset không cảnh báo', () => {
  const ast = synthAst({ duration: 12 }); ast.meta.markers = [{ tick: 0, timeSeconds: 0, name: 'A' }]; ast.meta.lyrics = [{ tick: 0, timeSeconds: 1, text: 'la' }];
  for (const type of INSIGHT_TYPES) {
    const sc = sceneWith(type);
    for (const t of [0, 1.3, 11]) {
      const a = prims(sc, t, ast), b = prims(sc, t, ast);
      assert.deepEqual(a, b, `${type} @${t}`);
      for (const p of a) if (p.kind === 'rect') for (const v of [p.x, p.y, p.w, p.h, p.alpha]) assert.ok(Number.isFinite(v), `${type}: ${JSON.stringify(p)}`);
    }
  }
});
