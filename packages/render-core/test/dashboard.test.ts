// Bảng phân tích nhạc (REFERENCE-VIDEOS video 3, T-107; video 2 dải lớp cao độ, T-109): bậc hợp âm, Vòng quãng năm nâng cấp,
// Khung ô, Degree, Dots, Dải lớp cao độ, chỗ giữ mới và primitive poly. Kết quả khớp tính tay, tất định, không NaN.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutFrame, renderFrame, sanitizeScene, SCENE_SCHEMA_VERSION, chordDegree, chordFunction, parseChordName, romanOf, levelsAt, bandShareAt, arcPts, DEFAULT_PITCH_WHEEL, DEFAULT_PANEL,
  type SceneDocument, type TextPrim, type RectPrim, type PolyPrim, type Primitive, type UnifiedProjectAST, type AudioFeatures } from '../src/index.ts';
import { synthAst, derivedOf, recCtx } from './helpers.ts';

const sceneWith = (type: string, properties: object = {}, extra: object = {}, layout = { x: 0, y: 0, width: 600, height: 200 }): SceneDocument => {
  const { scene, warnings } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'w', type, layout, properties }], ...extra });
  assert.deepEqual(warnings, []); return scene;
};
const prims = (scene: SceneDocument, t: number, ast: UnifiedProjectAST = synthAst(), extra = {}) => layoutFrame(scene, derivedOf(ast, extra), ast, t)[0]?.prims ?? [];
const textsOf = (p: Primitive[]) => p.filter((x): x is TextPrim => x.kind === 'text');
const texts = (p: Primitive[]) => textsOf(p).map((x) => x.text).join('|');
const rects = (p: Primitive[]) => p.filter((x): x is RectPrim => x.kind === 'rect');
const polys = (p: Primitive[]) => p.filter((x): x is PolyPrim => x.kind === 'poly');
const finite = (p: Primitive[]) => { for (const x of p) for (const v of Object.values(x)) if (typeof v === 'number') assert.ok(Number.isFinite(v), JSON.stringify(x).slice(0, 120)); };

test('bậc hợp âm: gốc, chất lượng, bass theo bậc; kiểu SUFFIX và CASE; chức năng T/SD/D', () => {
  assert.equal(chordDegree('D#maj7', 3), 'Imaj7'); assert.equal(chordDegree('Cm7', 3), 'VIm7'); assert.equal(chordDegree('Cm7', 3, 'CASE'), 'vi7');
  assert.equal(chordDegree('A#sus4', 3), 'Vsus4'); assert.equal(chordDegree('D#Madd9', 3), 'Iadd9'); assert.equal(chordDegree('C#', 3), '♭VII');
  assert.equal(chordDegree('Eb/G', 3), 'I/III'); assert.equal(chordDegree('Bdim', 0, 'CASE'), 'vii°'); assert.equal(chordDegree('???', 0), '???');
  assert.deepEqual(parseChordName('C#m7b5/G'), { root: 1, quality: 'm7b5', bass: 7 });
  assert.equal(romanOf(6, 0), '♯IV');
  assert.deepEqual(['C', 'F', 'G', 'Am', 'Dm', 'Bb'].map((c) => chordFunction(c, 0)), ['T', 'SD', 'D', 'T', 'SD', 'SD']);
});

test('poly: cung tròn đi theo chiều kim đồng hồ từ đỉnh; renderFrame vẽ lineTo/fill/stroke và nét đứt', () => {
  const a = arcPts(0, 0, 10, 0, 90, 4);
  assert.deepEqual(a.map((v) => Math.round(v * 1000) / 1000 + 0), [0, -10, 10, 0]);
  const sc = sceneWith('PITCH_WHEEL', { nodeShape: 'CIRCLE', polygon: true, progress: 'BAR' }, {}, { x: 0, y: 0, width: 320, height: 320 });
  const { ctx, log } = recCtx(); const ast = synthAst();
  renderFrame(sc, derivedOf(ast), ast, 0.6, { ctx, width: 320, height: 320 }, 1);
  assert.ok(log.some((l) => l.startsWith('lineTo(')) && log.includes('stroke()') && log.includes('fill()'));
});

test('Vòng quãng năm: mặc định vẽ như cũ (không poly); bậc La Mã theo scene.tonic, đa giác nối nốt, cung tiến độ, số phách, bậc ở giữa', () => {
  const ast = synthAst(), lay = { x: 0, y: 0, width: 320, height: 320 };
  const old = prims(sceneWith('PITCH_WHEEL', {}, {}, lay), 0.6, ast);
  assert.equal(polys(old).length, 0); assert.equal(rects(old).length, 12);
  const sc = sceneWith('PITCH_WHEEL', { order: 'FIFTHS', labels: 'DEGREES', nodeShape: 'CIRCLE', polygon: true, progress: 'BAR', beatMarks: true, rootColor: '#2ec4b6', outlineColor: '#cccccc', chordAs: 'DEGREE', subTemplate: 'BAR {bar}' }, { tonic: 9 }, lay);
  const p = prims(sc, 0.6, ast, { tonic: 9 }); finite(p);
  const tx = texts(p);
  for (const r of ['I', 'V', 'II', 'VI', 'III', 'VII', '♯IV', '♭II', '♭VI', '♭III', '♭VII', 'IV']) assert.ok(tx.split('|').includes(r), r);
  assert.ok(tx.includes('V7'), tx);                                   // E G# B D trong giọng A
  assert.ok(tx.includes('BAR 1'));
  for (const n of ['1', '2', '3', '4']) assert.ok(tx.split('|').includes(n));
  const fill = polys(p).filter((q) => q.closed && q.fill === DEFAULT_PITCH_WHEEL.litColor && q.fillAlpha < 1);
  assert.equal(fill.length, 1); assert.ok(fill[0].pts.length >= 6);   // đa giác ≥ 3 đỉnh
  assert.ok(polys(p).some((q) => !q.closed && q.width === 4));       // cung tiến độ
  assert.ok(polys(p).some((q) => q.stroke === '#2ec4b6'));           // vòng nốt bass
  assert.deepEqual(prims(sc, 0.6, ast, { tonic: 9 }), p);            // tất định
});

test('Khung ô: số + tiêu đề, khung nội dung, hàng số liệu theo chỗ giữ; cột rỗng bị bỏ', () => {
  const sc = sceneWith('PANEL', { number: '03', title: 'NOTES', stats: [{ label: 'BAR', value: '{bar}.{beat}' }, { label: 'TEMPO', value: '{bpm:0.0}' }, { label: 'SOUNDING', value: '{notes}' }] });
  const p = prims(sc, 0.6); finite(p);
  const tx = textsOf(p).map((x) => x.text);
  assert.deepEqual(tx.slice(0, 2), ['03', 'NOTES']);
  assert.ok(tx.includes('BAR') && tx.includes('1.2') && tx.includes('120.0') && tx.includes('SOUNDING'));
  assert.equal(textsOf(p).find((x) => x.text === '03')!.color.toLowerCase(), DEFAULT_PANEL.numberColor);
  assert.equal(polys(p).filter((q) => q.closed).length, 1);
  const cols = textsOf(p).filter((x) => ['BAR', 'TEMPO', 'SOUNDING'].includes(x.text)).map((x) => x.x);
  assert.deepEqual(cols, [0, 200, 400]);                               // 3 cột chia đều 600 pt
  const bad = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'w', type: 'PANEL', layout: { x: 0, y: 0, width: 10, height: 10 }, properties: { stats: Array(9).fill({ label: 'a', value: 'b' }) } }] });
  assert.ok(bad.warnings.length >= 1); assert.equal((bad.scene.widgets[0].properties as { stats: unknown[] }).stats.length, 6);
});

test('Degree: khối bậc theo hợp âm, khối hiện tại tô màu nhấn, dải chức năng, số ô nhịp, vạch phát', () => {
  const ast = synthAst({ duration: 6 });
  const sc = sceneWith('DEGREE', {}, { tonic: 9 }, { x: 0, y: 0, width: 800, height: 150 });
  const p = prims(sc, 0.6, ast, { tonic: 9 }); finite(p);
  const tx = texts(p);
  assert.ok(tx.includes('V7'), tx);
  assert.ok(rects(p).some((r) => r.fill === '#ff3d8b' && r.h > 20));  // khối hiện tại
  assert.ok(tx.split('|').includes('D'));                             // chức năng át
  assert.ok(tx.split('|').includes('1') && tx.split('|').includes('2'));
  assert.ok(polys(p).some((q) => q.closed && q.fill === '#222222'));  // mũi tên vạch phát
  assert.deepEqual(prims(sc, 0.6, ast, { tonic: 9 }), p);
});

test('Dots: lưới cột × hàng, chấm có nốt sáng, nốt sắp tới mờ, khung vạch phát; ngoài dải cao độ bỏ qua', () => {
  const ast = synthAst();
  const sc = sceneWith('DOTS', { cols: 16, pitchRangeMode: 'CUSTOM', pitchMin: 72, pitchMax: 84, playheadRatio: 0.5 }, {}, { x: 0, y: 0, width: 320, height: 130 });
  const p = prims(sc, 1, ast); finite(p);
  const rs = rects(p);
  assert.equal(rs.length, 16 * 13);
  assert.ok(rs.some((r) => r.fill === '#ff3d8b' && r.alpha === 1));
  assert.ok(rs.some((r) => r.fill === '#ff3d8b' && r.alpha < 1));     // nốt 84 ở phách 4,5 còn ở phía trước
  assert.equal(polys(p).length, 1);
  const bad = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'w', type: 'DOTS', layout: { x: 0, y: 0, width: 10, height: 10 }, properties: { grid: 12 } }] });
  assert.equal((bad.scene.widgets[0].properties as { grid: number }).grid, 16); assert.ok(bad.warnings.length === 1);
});

test('Dải lớp cao độ: 12 ô cố định, chỉ lớp đang vang hiện chữ, vị trí không đổi theo số nốt', () => {
  const ast = synthAst();
  const sc = sceneWith('PITCH_STRIP', {}, {}, { x: 0, y: 0, width: 640, height: 60 });
  const a = textsOf(prims(sc, 0.1, ast)), b = textsOf(prims(sc, 1.0, ast));
  assert.ok(a.some((x) => x.text === '[') && a.some((x) => x.text === ']'));
  const xOf = (arr: TextPrim[], n: string) => arr.find((x) => x.text === n)?.x;
  assert.ok(xOf(a, 'E') !== undefined && xOf(a, 'E') === xOf(b, 'E'));
  assert.ok(!a.some((x) => x.text === 'F') && !a.some((x) => x.text === 'C') && b.some((x) => x.text === 'C'));
  const dim = textsOf(prims(sceneWith('PITCH_STRIP', { dimAlpha: 0.3 }, {}, { x: 0, y: 0, width: 640, height: 60 }), 0.1, ast));
  assert.equal(dim.filter((x) => x.text !== '[' && x.text !== ']').length, 12);
});

test('chỗ giữ mới: {degree} {next_chord} {next_degree} {chord_count} {key}; không có âm thanh thì {lows} {level} là —', () => {
  const ast = synthAst();
  const chordsOnly = (props: object, extra: object) => { const { scene, warnings } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, ...extra,
    widgets: [{ id: 'w', type: 'TEXT', trackMappingMode: 'MANUAL', assignedTrackIndices: [0], layout: { x: 0, y: 0, width: 900, height: 100 }, properties: props }] }); assert.deepEqual(warnings, []); return scene; };
  const sc = chordsOnly({ text: '{degree}|{next_chord}|{next_degree}|{chord_count}|{key}|{lows}|{level}' }, { tonic: 9 });
  assert.equal(texts(prims(sc, 0.6, ast, { tonic: 9 })), 'V7|C5|♭III5|1|A|—|—');
  assert.equal(texts(prims(sc, 2.2, ast, { tonic: 9 })), '♭III5|||2|A|—|—');                  // hợp âm cuối: không có hợp âm kế tiếp
  const ascii = chordsOnly({ text: '{next_degree}' }, { tonic: 9, noteNaming: { system: 'LETTER', accidental: 'SHARP', ascii: true, middleC: 4 } });
  assert.equal(texts(prims(ascii, 0.6, ast, { tonic: 9, naming: ascii.noteNaming })), 'bIII5');
  const noTonic = chordsOnly({ text: '{key}' }, {});
  assert.equal(texts(prims(noTonic, 1.9, ast)).length > 0, true);                               // giọng nhận diện khi chưa đặt nốt chủ
});

test('mức âm và tỉ lệ dải: đọc từ bảng đặc trưng, tất định', () => {
  const frames = 100, bands = 8, spectrum = new Uint8Array(frames * bands);
  for (let i = 0; i < frames; i++) { spectrum[i * bands] = 230; spectrum[i * bands + 7] = 200; }
  const ft = { sampleRate: 48000, hopSamples: 480, hop: 0.01, frames, bands, minHz: 30, maxHz: 16000, spectrum, peak: new Uint8Array(frames).fill(204), rms: new Uint8Array(frames).fill(153) } as AudioFeatures;
  const lv = levelsAt({ features: ft, offsetSec: 0 }, 0.5)!;
  assert.ok(Math.abs(lv.short - (-32)) < 0.01 && Math.abs(lv.average - (-32)) < 0.01 && Math.abs(lv.peak - (-16)) < 0.01);
  const s = bandShareAt({ features: ft, offsetSec: 0 }, 0.5)!;
  assert.ok(s.low > s.high && s.mid === 0 && Math.abs(s.low + s.high - 1) < 1e-9);
  assert.equal(levelsAt(undefined, 1), null);
});
