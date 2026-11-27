// D-72 (T-125): mục Thiết lập ẩn hẳn ô không có tác dụng với lựa chọn hiện tại. Mỗi điều kiện ẩn ở apps/web/src/lib/widgetFields.ts có một dòng ở đây:
// trong trường hợp bị ẩn, đổi giá trị thuộc tính KHÔNG làm đổi chuỗi hình của layoutFrame (ở nhiều thời điểm, có âm thanh và nốt);
// và trong một trường hợp được hiện, đổi giá trị CÓ làm đổi chuỗi hình (để test không đúng một cách vô nghĩa).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMono, layoutFrame, sanitizeScene, SCENE_SCHEMA_VERSION, type UnifiedProjectAST } from '../src/index.ts';
import { synthAst, derivedOf } from './helpers.ts';

type Obj = Record<string, unknown>;
const run = (n: number, base: number, step: number, len: number): [number, number, number, number][] =>
  Array.from({ length: n }, (_, i) => [base + ((i * 5) % 12), i * step, len, 40 + ((i * 37) % 80)]);
const ast: UnifiedProjectAST = synthAst({
  duration: 20,
  tracks: [
    { name: 'Chords', color: '#4488ff', notes: [...run(10, 48, 4, 4), ...run(10, 55, 4, 4), ...run(10, 60, 4, 3)] },
    { name: 'Lead', color: '#ff8844', notes: run(70, 72, 0.5, 0.4) },
    { name: 'Drums', color: '#44ff88', notes: Array.from({ length: 70 }, (_, i) => [[36, 38, 42, 46][i % 4], i * 0.5, 0.25, 100] as [number, number, number, number]) },
  ],
  tempoMap: [{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }, { tick: 9600, timeSeconds: 5, bpm: 90, timeSigNumerator: 3, timeSigDenominator: 4 }],
});
// Âm thanh tổng hợp: 200 Hz và 3 kHz xen kẽ mỗi giây, biên độ lên xuống (đủ để cột, đỉnh, sóng âm và đồng hồ đều thay đổi).
const SR = 16000;
const sig = Float32Array.from({ length: SR * 8 }, (_, i) => { const s = i / SR; return (s % 2 < 1 ? Math.sin(2 * Math.PI * 200 * s) : Math.sin(2 * Math.PI * 3000 * s)) * 0.5 * (0.3 + 0.7 * Math.abs(Math.sin(s * 3))); });
const derived = derivedOf(ast, { audio: { features: analyzeMono(sig, SR), offsetSec: 0 } });
const TIMES = [0.31, 1.13, 2.05, 3.52, 5.21, 7.73, 11.4, 15.3];

/** Chuỗi hình của một widget ở các thời điểm (bỏ phần đặc tả widget, chỉ giữ primitive và hiệu ứng). */
function frames(type: string, properties: Obj): string {
  const { scene, warnings } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'w', type, layout: { x: 0, y: 0, width: 600, height: 300 }, properties }] });
  assert.deepEqual(warnings, [], JSON.stringify(properties));
  return JSON.stringify(TIMES.map((t) => layoutFrame(scene, derived, ast, t).map((x) => [x.prims, x.fx])));
}

interface Case { type: string; prop: string; values: unknown[]; hidden: Obj[]; shown: Obj }
const NUM = (...v: number[]) => v;
const CASES: Case[] = [
  // Phổ tần: đồng hồ (METER) luôn vẽ theo đường thẳng
  { type: 'AUDIO_SPECTRUM', prop: 'shape', values: ['LINE', 'CIRCLE'], hidden: [{ style: 'METER' }], shown: {} },
  { type: 'AUDIO_SPECTRUM', prop: 'radius', values: NUM(40, 200), hidden: [{ style: 'METER', shape: 'CIRCLE' }, { shape: 'LINE' }], shown: { shape: 'CIRCLE' } },
  { type: 'AUDIO_SPECTRUM', prop: 'startAngle', values: NUM(0, 45), hidden: [{ style: 'METER', shape: 'CIRCLE' }, { shape: 'LINE' }], shown: { shape: 'CIRCLE' } },
  // soi gương: Tròn chỉ có tác dụng với kiểu Cột; Đồng hồ luôn đối xứng
  { type: 'AUDIO_SPECTRUM', prop: 'mirror', values: [false, true], shown: { shape: 'CIRCLE' },
    hidden: [{ style: 'METER' }, ...['DOTS', 'AREA', 'LINE', 'OSCILLOSCOPE', 'WAVEFORM'].map((style) => ({ style, shape: 'CIRCLE' })), { style: 'DOTS', shape: 'CIRCLE', peakCap: true }] },
  { type: 'AUDIO_SPECTRUM', prop: 'reverse', values: [false, true], hidden: ['OSCILLOSCOPE', 'WAVEFORM', 'METER'].map((style) => ({ style })), shown: {} },
  // dải màu hai đầu: Vùng, Đường, Dao động ký, Sóng âm chỉ tô một màu
  { type: 'AUDIO_SPECTRUM', prop: 'colorMode', values: ['SOLID', 'GRADIENT'], hidden: ['AREA', 'LINE', 'OSCILLOSCOPE', 'WAVEFORM'].map((style) => ({ style, colorB: '#ff0000' })), shown: { colorB: '#ff0000' } },
  { type: 'AUDIO_SPECTRUM', prop: 'colorB', values: ['#7aa2ff', '#ff0000'], hidden: ['AREA', 'LINE', 'OSCILLOSCOPE', 'WAVEFORM'].map((style) => ({ style, colorMode: 'GRADIENT' })), shown: { colorMode: 'GRADIENT' } },
  { type: 'AUDIO_SPECTRUM', prop: 'barWidth', values: NUM(0.3, 0.9), hidden: [{ style: 'AREA' }, { style: 'METER' }], shown: {} },
  { type: 'AUDIO_SPECTRUM', prop: 'roundness', values: NUM(0, 0.5, 1), hidden: ['AREA', 'LINE', 'DOTS', 'OSCILLOSCOPE'].map((style) => ({ style })), shown: {} },
  { type: 'AUDIO_SPECTRUM', prop: 'minLen', values: NUM(0, 10), hidden: [{ style: 'OSCILLOSCOPE' }, { style: 'METER' }], shown: {} },
  // dải tần, thang và làm mượt chỉ dùng khi đọc phổ (Cột/Vùng/Đường/Chấm)
  ...['attackMs', 'releaseMs'].map((prop): Case => ({ type: 'AUDIO_SPECTRUM', prop, values: NUM(0, 400), hidden: ['OSCILLOSCOPE', 'WAVEFORM', 'METER'].map((style) => ({ style })), shown: {} })),
  { type: 'AUDIO_SPECTRUM', prop: 'minHz', values: NUM(40, 1000), hidden: ['OSCILLOSCOPE', 'WAVEFORM', 'METER'].map((style) => ({ style })), shown: {} },
  { type: 'AUDIO_SPECTRUM', prop: 'maxHz', values: NUM(14000, 2000), hidden: ['OSCILLOSCOPE', 'WAVEFORM', 'METER'].map((style) => ({ style })), shown: {} },
  { type: 'AUDIO_SPECTRUM', prop: 'floorDb', values: NUM(-70, -40), hidden: [{ style: 'OSCILLOSCOPE' }, { style: 'WAVEFORM' }], shown: {} },
  { type: 'AUDIO_SPECTRUM', prop: 'ceilDb', values: NUM(-25, -50), hidden: [{ style: 'OSCILLOSCOPE' }, { style: 'WAVEFORM' }], shown: {} },
  // Cường độ: biểu đồ phân bố một màu; một cột chung không có khe
  { type: 'VELOCITY', prop: 'colorMode', values: ['TRACK', 'SOLID'], hidden: [{ mode: 'HISTOGRAM' }], shown: { mode: 'LEVEL', perTrack: true } },
  { type: 'VELOCITY', prop: 'gap', values: NUM(0, 12), hidden: [{ mode: 'LEVEL', perTrack: false }], shown: { mode: 'LEVEL', perTrack: true } },
  // Bậc hợp âm: chữ Cuối luôn bám mép phải của khối
  { type: 'DEGREE', prop: 'labelSticky', values: [true, false], hidden: [{ labelAlign: 'END' }], shown: { labelAlign: 'START' } },
  // Hợp âm: mẫu dòng nốt chỉ dùng khi hiện dòng nốt
  { type: 'CHORD_DETECTION', prop: 'notesTemplate', values: ['Notes: {notes}', 'x {notes} y'], hidden: [{ alwaysShowNotes: false, unrecognized: 'nc' }], shown: { alwaysShowNotes: true } },
  // Đếm sự kiện: khoảng cách dòng chỉ có tác dụng từ hai dòng
  { type: 'EVENT_COUNTER', prop: 'lineHeight', values: NUM(1.2, 2.5),
    hidden: [{ lines: { played: { enabled: true }, total: { enabled: false }, progress: { enabled: false }, tempo: { enabled: false } } }, { lines: { played: { enabled: false }, total: { enabled: false }, progress: { enabled: true }, tempo: { enabled: false } } }],
    shown: { lines: { played: { enabled: true }, total: { enabled: true }, progress: { enabled: false }, tempo: { enabled: false } } } },
  // Lưới nốt (D-77): ô của Quanh vạch phát, của hàng theo cao độ, của chấm, của thanh/ô đầy; màu khi tô theo track; vạch phát rỗng; dòng số giọng tắt
  ...(['grid', 'playheadRatio', 'beatLines'] as const).map((prop): Case => ({ type: 'NOTE_GRID', prop, values: prop === 'grid' ? [8, 16] : prop === 'beatLines' ? [false, true] : NUM(0.3, 0.9), hidden: [{ span: 'SONG' }, { span: 'SONG', rows: 'PITCH', shape: 'ROUND' }], shown: { span: 'WINDOW' } })),
  { type: 'NOTE_GRID', prop: 'pitchRangeMode', values: ['FIT_CONTENT', 'CUSTOM'], hidden: [{ rows: 'TRACK' }, { rows: 'TRACK', span: 'WINDOW' }], shown: { rows: 'PITCH' } },
  ...(['pitchMin', 'pitchMax'] as const).map((prop): Case => ({ type: 'NOTE_GRID', prop, values: prop === 'pitchMin' ? NUM(30, 60) : NUM(80, 100), hidden: [{ rows: 'TRACK', pitchRangeMode: 'CUSTOM' }, { rows: 'PITCH', pitchRangeMode: 'FIT_CONTENT' }], shown: { rows: 'PITCH', pitchRangeMode: 'CUSTOM' } })),
  { type: 'NOTE_GRID', prop: 'dotSize', values: NUM(0.3, 0.8), hidden: [{ shape: 'FILL' }, { shape: 'FILL', span: 'WINDOW', rows: 'PITCH' }], shown: { shape: 'ROUND' } },
  { type: 'NOTE_GRID', prop: 'cellGap', values: NUM(0, 3), hidden: [{ shape: 'ROUND' }, { shape: 'SQUARE', span: 'WINDOW' }], shown: { shape: 'FILL' } },
  { type: 'NOTE_GRID', prop: 'activeScale', values: NUM(1, 2.5), hidden: [{ shape: 'FILL', span: 'WINDOW' }, { shape: 'BAR', span: 'WINDOW' }], shown: { shape: 'ROUND', span: 'WINDOW' } },
  { type: 'NOTE_GRID', prop: 'velocitySize', values: [false, true], hidden: [{ shape: 'FILL' }, { shape: 'BAR' }], shown: { shape: 'ROUND' } },
  { type: 'NOTE_GRID', prop: 'velocityMin', values: NUM(0.2, 0.6), hidden: [{ shape: 'ROUND', velocitySize: false }, { shape: 'FILL', velocitySize: true }], shown: { shape: 'ROUND', velocitySize: true } },
  { type: 'NOTE_GRID', prop: 'color', values: ['#ff0000', '#00ff00'], hidden: [{ rows: 'TRACK', colorMode: 'TRACK', emptyAlpha: 0.5 }, { rows: 'TRACK', colorMode: 'TRACK', span: 'WINDOW', beatLines: true, emptyAlpha: 0.5 }], shown: { colorMode: 'SOLID' } },
  { type: 'NOTE_GRID', prop: 'minAlpha', values: NUM(0.1, 0.5), hidden: [{ light: 'NOTES', emptyAlpha: 0.3 }, { light: 'NOTES', span: 'WINDOW', rows: 'PITCH' }], shown: { light: 'VELOCITY' } },
  { type: 'NOTE_GRID', prop: 'emptyColorB', values: ['#ff0000', '#00ff00'], hidden: [{ emptyColor: '', emptyAlpha: 0.5 }, { emptyColor: '', emptyAlpha: 0.5, rows: 'PITCH', span: 'WINDOW' }], shown: { emptyColor: '#123456', emptyAlpha: 0.5 } },
  ...(['playheadMark', 'playheadWidth'] as const).map((prop): Case => ({ type: 'NOTE_GRID', prop, values: prop === 'playheadMark' ? ['LINE', 'COLUMN'] : NUM(1, 4), hidden: [{ playheadColor: '' }, { playheadColor: '', span: 'WINDOW' }], shown: {} })),
  { type: 'NOTE_GRID', prop: 'polyTemplate', values: ['A {poly}', 'B {poly}'], hidden: [{ showPolyphony: false }], shown: { showPolyphony: true } },
  // Vòng quãng năm: màu phát sáng chỉ dùng khi có phát sáng
  { type: 'PITCH_WHEEL', prop: 'glowColor', values: ['#ff0000', '#00ff00'], hidden: [{ glow: 0 }], shown: { glow: 0.5 } },
];

for (const c of CASES) {
  test(`D-72 ${c.type}.${c.prop}: ẩn khi ${c.hidden.map((h) => JSON.stringify(h)).join(' | ')} vì không đổi hình; hiện khi ${JSON.stringify(c.shown)}`, () => {
    for (const h of c.hidden) {
      const outs = new Set(c.values.map((v) => frames(c.type, { ...h, [c.prop]: v })));
      assert.equal(outs.size, 1, `${c.type}.${c.prop} vẫn đổi hình khi ${JSON.stringify(h)}: không được ẩn`);
    }
    const live = new Set(c.values.map((v) => frames(c.type, { ...c.shown, [c.prop]: v })));
    assert.equal(live.size, c.values.length, `${c.type}.${c.prop} không đổi hình khi ${JSON.stringify(c.shown)}: dữ liệu thử chưa đủ`);
  });
}

test('D-72 Phổ tần: Đồng hồ dùng góc và chiều dài kể cả khi đang chọn Tròn (nên hai ô này vẫn hiện)', () => {
  for (const [prop, values] of [['angle', [0, 30]], ['length', [400, 700]]] as const) {
    const outs = new Set(values.map((v) => frames('AUDIO_SPECTRUM', { style: 'METER', shape: 'CIRCLE', [prop]: v })));
    assert.equal(outs.size, values.length, prop);
  }
});

test('D-72 Cường độ: một cột chung nhiều track dùng Màu riêng kể cả khi chọn Theo track (nên ô Màu vẫn hiện)', () => {
  const outs = new Set(['#ff0000', '#00ff00'].map((color) => frames('VELOCITY', { mode: 'LEVEL', perTrack: false, colorMode: 'TRACK', color })));
  assert.equal(outs.size, 2);
});
