// Bảng phân tích nhạc (REFERENCE-VIDEOS video 3, T-107): bậc hợp âm, Vòng quãng năm nâng cấp,
// Khung ô, Degree, Dots, chỗ giữ mới và primitive poly. Kết quả khớp tính tay, tất định, không NaN.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutFrame, renderFrame, sanitizeScene, SCENE_SCHEMA_VERSION, degreeLabelPos, DEFAULT_DEGREE, chordDegree, chordFunction, parseChordName, romanOf, levelsAt, bandShareAt, arcPts, DEFAULT_PITCH_WHEEL, DEFAULT_PANEL,
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

test('Degree: chữ trong khối căn Đầu/Giữa/Cuối; dính mép trái khi khối bị cắt; bị đẩy ra ở cuối khối (T-131)', () => {
  assert.equal(DEFAULT_DEGREE.labelAlign, 'CENTER'); assert.equal(DEFAULT_DEGREE.labelSticky, true);
  // Hàm thuần: khối [10, 110], chữ rộng 20, lề 3.
  assert.deepEqual(degreeLabelPos('START', false, 10, 110, 20), { x: 13, align: 'left' });
  assert.deepEqual(degreeLabelPos('CENTER', false, 10, 110, 20), { x: 60, align: 'center' });
  assert.deepEqual(degreeLabelPos('END', false, 10, 110, 20), { x: 107, align: 'right' });
  for (const a of ['START', 'CENTER', 'END'] as const) assert.deepEqual(degreeLabelPos(a, true, 10, 110, 20), degreeLabelPos(a, false, 10, 110, 20), a); // không bị cắt: dính không đổi gì
  // Bị cắt bên trái (khối [-50, 50]): dính mép trái vùng thấy; Giữa = giữa phần đang thấy; Cuối không đổi.
  assert.deepEqual(degreeLabelPos('START', true, -50, 50, 20), { x: 3, align: 'left' });
  assert.deepEqual(degreeLabelPos('START', false, -50, 50, 20), { x: -47, align: 'left' });
  assert.deepEqual(degreeLabelPos('CENTER', true, -50, 50, 20), { x: 25, align: 'center' });
  assert.deepEqual(degreeLabelPos('CENTER', false, -50, 50, 20), { x: 0, align: 'center' });
  assert.deepEqual(degreeLabelPos('END', true, -50, 50, 20), { x: 47, align: 'right' });
  // Gần cuối khối (còn thấy 16 px < chữ): chữ bị đẩy ra, mép phải chữ nằm ở cuối khối trừ lề.
  assert.deepEqual(degreeLabelPos('START', true, -84, 16, 20), { x: -7, align: 'left' });
  assert.deepEqual(degreeLabelPos('CENTER', true, -84, 16, 20), { x: 3, align: 'center' });

  // Qua renderer: một hàng chính, 1 ô nhịp trên 200 px, vạch phát gần mép trái nên khối hiện tại bị cắt bên trái.
  const ast = synthAst({ duration: 6 }), lay = { x: 0, y: 0, width: 200, height: 80 }, measure = (s: string, _f: string, size: number) => s.length * size * 0.6;
  const base = { windowBars: 1, showDetail: false, showFunction: false, showBars: false, playheadColor: '' };
  const raw = (props: object, t: number) => layoutFrame(sceneWith('DEGREE', { ...base, ...props }, { tonic: 9 }, lay), derivedOf(ast, { tonic: 9, measure }), ast, t)[0]?.prims ?? [];
  const at = (props: object, t: number) => {
    const p = raw(props, t);
    const r = rects(p).find((x) => x.fill === DEFAULT_DEGREE.accentColor)!, tx = textsOf(p).find((x) => x.text === 'V7')!;
    assert.ok(r && tx, texts(p)); return { x0: r.x, x1: r.x + r.w, tx, p };
  };
  // Không bị cắt: ba kiểu căn đúng chỗ.
  const s = at({ playheadRatio: 0.9, labelAlign: 'START' }, 0.4), c = at({ playheadRatio: 0.9 }, 0.4), e = at({ playheadRatio: 0.9, labelAlign: 'END' }, 0.4);
  assert.ok(s.x0 > 0);
  assert.equal(s.tx.align, 'left'); assert.ok(Math.abs(s.tx.x - (s.x0 + 3)) < 1e-9);
  assert.equal(c.tx.align, 'center'); assert.ok(Math.abs(c.tx.x - (c.x0 + c.x1) / 2) < 1e-9);
  assert.equal(e.tx.align, 'right'); assert.ok(Math.abs(e.tx.x - (e.x1 - 3)) < 1e-9);
  // Bị cắt bên trái: dính ở x = 3; tắt dính thì chữ ra ngoài cùng khối.
  const st = at({ playheadRatio: 0.5, labelAlign: 'START' }, 1.6), off = at({ playheadRatio: 0.5, labelAlign: 'START', labelSticky: false }, 1.6);
  assert.ok(st.x0 < 0); assert.ok(Math.abs(st.tx.x - 3) < 1e-9); assert.ok(Math.abs(off.tx.x - (off.x0 + 3)) < 1e-9);
  const cs = at({ playheadRatio: 0.5 }, 1.6);
  assert.ok(Math.abs(cs.tx.x - (3 + cs.x1 - 3) / 2) < 1e-9);
  // Gần cuối khối: bị đẩy ra cùng khối (khoảng cách mép phải khối → chữ không đổi giữa hai khung).
  const p1 = at({ playheadRatio: 0.05, labelAlign: 'START' }, 1.96), p2 = at({ playheadRatio: 0.05, labelAlign: 'START' }, 1.98);
  assert.ok(p1.tx.x < 3 && p2.tx.x < p1.tx.x, `${p1.tx.x} ${p2.tx.x}`);
  assert.ok(Math.abs((p1.x1 - p1.tx.x) - (p2.x1 - p2.tx.x)) < 1e-9);
  // Tua tới/lui: cùng t cho cùng kết quả, không phụ thuộc khung trước.
  const props = { playheadRatio: 0.05, labelAlign: 'START' };
  const first = raw(props, 1.96); raw(props, 0.2); raw(props, 5); raw(props, 1.98);
  assert.deepEqual(raw(props, 1.96), first);
  // Lược đồ: giá trị lạ bị thay bằng mặc định kèm cảnh báo.
  const bad = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'w', type: 'DEGREE', layout: lay, properties: { labelAlign: 'LEFT', labelSticky: 'yes' } }] });
  const bp = bad.scene.widgets[0].properties as { labelAlign: string; labelSticky: boolean };
  assert.equal(bp.labelAlign, 'CENTER'); assert.equal(bp.labelSticky, true); assert.equal(bad.warnings.length, 2);
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

test('T-133 Degree: khối hai tầng (bậc to, tên hợp âm nhỏ) chỉ khi bật; mặc định không đổi', () => {
  const ast = synthAst({ duration: 6 }), lay = { x: 0, y: 0, width: 800, height: 150 };
  const off = prims(sceneWith('DEGREE', {}, { tonic: 9 }, lay), 0.6, ast, { tonic: 9 });
  const on = prims(sceneWith('DEGREE', { showChordName: true }, { tonic: 9 }, lay), 0.6, ast, { tonic: 9 }); finite(on);
  assert.ok(texts(on).split('|').includes('V7') && texts(on).split('|').includes('E7'), texts(on));
  assert.ok(!texts(off).split('|').includes('E7'));
  const deg = textsOf(on).find((x) => x.text === 'V7')!, nm = textsOf(on).find((x) => x.text === 'E7')!;
  assert.ok(nm.y > deg.y, 'tên hợp âm nằm dưới bậc');
});

test('T-133 Dots: cỡ chấm theo cường độ, vạch phách mảnh, nhãn hàng ngoài khung; mặc định không đổi', () => {
  const ast = synthAst(), lay = { x: 0, y: 0, width: 320, height: 130 };
  const base = { cols: 16, pitchRangeMode: 'CUSTOM', pitchMin: 72, pitchMax: 84, playheadRatio: 0.5 };
  const plain = prims(sceneWith('DOTS', base, {}, lay), 1, ast);
  assert.deepEqual(prims(sceneWith('DOTS', { ...base, velocitySize: false, beatLines: false, rowLabels: false }, {}, lay), 1, ast), plain);
  const vs = prims(sceneWith('DOTS', { ...base, velocitySize: true, velocityMin: 0.2 }, {}, lay), 1, ast); finite(vs);
  const sizes = (p: Primitive[]) => rects(p).filter((r) => r.fill === '#ff3d8b').map((r) => r.w);
  assert.equal(vs.length, plain.length);
  assert.ok(sizes(vs).every((s, i) => s <= sizes(plain)[i] + 1e-9) && sizes(vs).some((s, i) => s < sizes(plain)[i]), 'ít nhất một chấm nhỏ đi theo cường độ');
  const bl = prims(sceneWith('DOTS', { ...base, beatLines: true }, {}, lay), 1, ast);
  assert.ok(bl.length > plain.length && rects(bl).some((r) => r.h === 130 && r.w < 1));
  const rl = prims(sceneWith('DOTS', { ...base, rowLabels: true }, {}, lay), 1, ast); finite(rl);
  const lab = textsOf(rl); assert.ok(lab.some((x) => x.text.startsWith('C')), lab.map((x) => x.text).join('|'));
  const gx = Math.min(...rects(rl).filter((r) => r.w < 20).map((r) => r.x)); assert.ok(gx > 10, 'lưới chấm bắt đầu sau cột nhãn');
  assert.ok(lab.every((x) => x.x < gx), 'nhãn nằm ngoài khung chấm');
  assert.deepEqual(prims(sceneWith('DOTS', { ...base, velocitySize: true, beatLines: true, rowLabels: true }, {}, lay), 1, ast), prims(sceneWith('DOTS', { ...base, velocitySize: true, beatLines: true, rowLabels: true }, {}, lay), 1, ast));
});

test('bậc hợp âm: số ô nhịp chỉ hiện từ 1 trở lên (trước đầu bài chỉ còn vạch)', () => {
  const ast = synthAst({ duration: 8 }), lay = { x: 0, y: 0, width: 400, height: 80 }, measure = (s: string, _f: string, size: number) => s.length * size * 0.6;
  const nums = (t: number) => textsOf(layoutFrame(sceneWith('DEGREE', { windowBars: 4, playheadRatio: 0.75, showDetail: false, showFunction: false, showBars: true, playheadColor: '' }, { tonic: 9 }, lay), derivedOf(ast, { tonic: 9, measure }), ast, t)[0]?.prims ?? [])
    .map((x) => x.text).filter((s) => /^-?\d+$/.test(s));
  assert.deepEqual(nums(0), ['1', '2']); // ô nhịp -2, -1, 0 nằm trước đầu bài: không có số
  assert.ok(!nums(0.3).some((s) => Number(s) < 1));
});

test('Vòng quãng năm: Glow chỉ đổ vào nút đang sáng (TILE và CIRCLE), màu glow rỗng = màu sáng; mặc định không đổi', () => {
  const ast = synthAst(), lay = { x: 0, y: 0, width: 320, height: 320 };
  for (const nodeShape of ['TILE', 'CIRCLE']) {
    const rectsGlow = (props: object) => rects(prims(sceneWith('PITCH_WHEEL', { nodeShape, ...props }, {}, lay), 0.6, ast)).filter((r) => r.glowBlur > 0);
    assert.equal(rectsGlow({}).length, 0, nodeShape);
    const on = rectsGlow({ glow: 0.5, litColor: '#ffd166' }), custom = rectsGlow({ glow: 0.5, glowColor: '#ff0000' });
    assert.ok(on.length > 0 && on.length < 12, nodeShape);
    assert.ok(on.every((r) => r.glowColor === '#ffd166' && Math.abs(r.glowBlur - 12) < 1e-9 && r.fill === '#ffd166'), nodeShape);
    assert.ok(custom.every((r) => r.glowColor === '#ff0000'), nodeShape);
  }
});

const DEFAULT_DOTS_PLAYHEAD = '#333344';
test('Dots: khung vạch phát đứng yên một cột khi nhạc chạy (không nhảy qua lại ở mép phải), chấm đang phát luôn ở trong khung', () => {
  const ast = synthAst({ duration: 30 }), lay = { x: 0, y: 0, width: 640, height: 160 };
  const sc = sceneWith('DOTS', { cols: 64, playheadRatio: 0.96, grid: 16 }, {}, lay);
  const xs = new Set<number>();
  for (let t = 4; t < 12; t += 0.013) {
    const frame = polys(prims(sc, t, ast)).filter((x) => x.closed && x.stroke === DEFAULT_DOTS_PLAYHEAD);
    assert.equal(frame.length, 1, String(t)); xs.add(Math.round(frame[0].pts[0] * 1000));
  }
  assert.equal(xs.size, 1, [...xs].join(','));
});
