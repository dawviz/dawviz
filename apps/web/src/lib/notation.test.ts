// D-63: engraver Bản nhạc (VexFlow ngoài DOM, bảng glyph sinh sẵn), dựng bản nhạc, độ phủ glyph, cảnh báo, khoá đệm, client Worker.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_NOTATION, type NotationLayout, type NotationProps, type TempoPoint } from '@dawviz/render-core';
import { glyphPath, layoutText, measureText, parseCssFont } from './notation/glyphTable.ts';
import { buildNotation, notationKey, tickToSecFn, type NotationNote } from './notation/buildNotation.ts';
import { createNotationClient, type NotationWorkerLike } from './notation/notationClient.ts';

const Q = 960;
const T: TempoPoint[] = [{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }];
let seq = 0;
const N = (pitch: number, beat: number, len: number, track = 0, tempo = T): NotationNote => {
  const toSec = tickToSecFn(tempo), s = Math.round(beat * Q), e = Math.round((beat + len) * Q);
  return { id: `n${seq++}`, pitch, startTick: s, endTick: e, startTimeSeconds: toSec(s), endTimeSeconds: toSec(e), velocity: 90, track };
};
const props = (o: Partial<NotationProps> = {}) => {
  const p = { ...DEFAULT_NOTATION, ...o };
  return { division: p.division, triplets: p.triplets, simplify: p.simplify, splitPitch: p.splitPitch, voices: p.voices, keyMode: p.keyMode, keyFifths: p.keyFifths, keyMinor: p.keyMinor, barsPerSystem: p.barsPerSystem, systemsPerPage: p.systemsPerPage, musicFont: p.musicFont, measureNumbers: p.measureNumbers, measureNumberSize: p.measureNumberSize, tempoMark: p.tempoMark };
};
const strip = (l: NotationLayout) => JSON.stringify({ ...l, stats: { ...l.stats, engraveMs: 0 } });

test('glyphTable: đọc chuỗi font, đo và bố trí theo bảng, giải mã đường viền', () => {
  assert.deepEqual(parseCssFont('italic bold 30pt Bravura,Academico'), { style: 'italic', weight: 'bold', sizePx: 40, families: ['Bravura', 'Academico'] });
  const m = measureText('30pt Bravura,Academico', ''); // noteheadBlack
  assert.ok(m.width > 10 && m.width < 20 && m.actualBoundingBoxAscent > 0);
  const g = layoutText('12pt Academico', '12', 5, 7);
  assert.equal(g.length, 2); assert.equal(g[0].x, 5); assert.ok(g[1].x > 5);
  const d = glyphPath('Bravura', 0xe0a4);
  assert.ok(d.length > 10 && d[0] === 0 && d.some((v) => v !== 0 && Math.abs(v) < 2), 'đường viền theo đơn vị em');
  const miss = new Set<number>(); layoutText('12pt Academico', '中', 0, 0, miss); assert.ok(miss.has(0x4e2d));
});

test('buildNotation: cỡ số ô nhịp đổi cỡ glyph chữ số, khoá đệm đổi theo', () => {
  const notes = [N(72, 0, 4), N(74, 4, 4), N(76, 8, 4)];
  const sizes = (sc: number) => { const l = buildNotation({ notes, tempoMap: T, props: props({ barsPerSystem: 1, systemsPerPage: 3, measureNumberSize: sc }) }); const s = new Set<number>(); for (const it of l.pages[0].items) if (it.g) for (let j = 0; j < it.g.length; j += 4) s.add(it.g[j + 3]); return s; };
  const a = sizes(1), b = sizes(2);
  assert.ok([...b].some((v) => !a.has(v)), 'có glyph cỡ mới');
  assert.notEqual(notationKey('p', [0], { ...DEFAULT_NOTATION, measureNumberSize: 1 }), notationKey('p', [0], { ...DEFAULT_NOTATION, measureNumberSize: 2 }));
});

test('buildNotation: chủ nốt truy về nốt AST, giây thật, glyph hợp lệ, tất định', () => {
  const notes = [N(72, 0, 0.5), N(74, 0.5, 0.5), N(76, 1, 1), N(77, 2, 1 / 3), N(79, 2 + 1 / 3, 1 / 3), N(77, 2 + 2 / 3, 1 / 3), N(76, 3, 2), N(48, 0, 4, 1), N(55, 4, 4, 1)];
  const req = { notes, tempoMap: T, props: props({ barsPerSystem: 2 }) };
  const a = buildNotation(req), b = buildNotation(req);
  assert.equal(strip(a), strip(b), 'cùng đầu vào → cùng bản dựng');
  assert.equal(a.pages.length, 1); assert.ok(a.pages[0].systems[0].at.length > 3);
  const ids = new Set(a.owners.flatMap((o) => o.notes));
  for (const n of notes) assert.ok(ids.has(n.id), `nốt ${n.id} có chủ`);
  const o = a.owners.find((x) => x.notes.includes(notes[2].id))!;
  assert.equal(o.on, 0.5); assert.equal(o.off, 1); assert.equal(o.track, 0);
  assert.equal(a.owners.find((x) => x.notes.includes(notes[7].id))!.track, 1);
  for (const it of a.pages[0].items) if (it.g) for (let j = 0; j < it.g.length; j += 4) assert.ok(a.glyphs[it.g[j]]?.length, 'glyph có đường viền');
  assert.deepEqual(a.warnings, []);
  const sec = a.pages[0].systems[0];
  for (let i = 1; i < sec.at.length; i++) assert.ok(sec.at[i] >= sec.at[i - 1] && sec.ax[i] >= sec.ax[i - 1], 'mốc vạch phát đơn điệu');
});

test('độ phủ glyph: mọi giá trị nốt/lặng, chấm, liên ba, dấu hoá, đổi nhịp, cả ba phông, hai chiều hoá biểu: không thiếu glyph', () => {
  const tm: TempoPoint[] = [
    { tick: 0, timeSeconds: 0, bpm: 90, timeSigNumerator: 4, timeSigDenominator: 4 },
    { tick: 4 * 4 * Q, timeSeconds: 10.667, bpm: 90, timeSigNumerator: 3, timeSigDenominator: 4 },
    { tick: 4 * 4 * Q + 3 * Q, timeSeconds: 12.667, bpm: 90, timeSigNumerator: 6, timeSigDenominator: 8 },
  ];
  const notes: NotationNote[] = [];
  const at = (p: number, b: number, l: number) => notes.push(N(p, b, l, 0, tm));
  at(60, 0, 4); // tròn
  at(61, 4, 2); at(63, 6, 1.5); at(66, 7.5, 0.5); // trắng, đen chấm, móc đơn
  at(70, 8, 0.25); at(68, 8.25, 0.125); at(67, 8.375, 0.125); at(65, 9, 0.75); at(64, 9.75, 0.25); // móc kép, móc ba, móc đơn chấm
  at(72, 10, 1 / 3); at(73, 10 + 1 / 3, 1 / 3); at(75, 10 + 2 / 3, 1 / 3); at(77, 11.5, 0.5); // liên ba, lặng
  at(40, 12, 1); at(43, 13, 3); at(84, 16, 1); at(86, 17.5, 1); at(62, 19, 0.5); at(64, 19.5, 1.5);
  for (const font of ['BRAVURA', 'PETALUMA', 'GONVILLE'] as const) for (const [f, minor] of [[-6, false], [5, true], [0, false]] as const) {
    const l = buildNotation({ notes, tempoMap: tm, props: props({ musicFont: font, division: 32, keyMode: 'MANUAL', keyFifths: f, keyMinor: minor, barsPerSystem: 0, systemsPerPage: 2 }) });
    assert.ok(!l.warnings.some((w) => w.code === 'WARN_NOTATION_GLYPH'), `${font} ${f}: ${JSON.stringify(l.warnings)}`);
    assert.ok(l.pages.length >= 1);
  }
});

test('cảnh báo: không có nốt; nhịp tự do (lệch lưới); giọng không chắc', () => {
  assert.ok(buildNotation({ notes: [], tempoMap: T, props: props() }).warnings.some((w) => w.code === 'WARN_NOTATION_EMPTY'));
  const free: NotationNote[] = [];
  for (let i = 0; i < 80; i++) free.push(N(60 + ((i * 7) % 12), i * 0.537 + 0.011, 0.4)); // không trùng lưới
  const w = buildNotation({ notes: free, tempoMap: T, props: props() }).warnings;
  assert.ok(w.some((x) => x.code === 'WARN_NOTATION_OFFGRID' && typeof x.details?.onGridPct === 'number'));
  const chroma: NotationNote[] = Array.from({ length: 24 }, (_, i) => N(60 + (i % 12), i, 1));
  assert.ok(buildNotation({ notes: chroma, tempoMap: T, props: props() }).warnings.some((x) => x.code === 'WARN_NOTATION_KEY_GUESS'));
});

test('notationKey: chỉ đổi theo thuộc tính ảnh hưởng bản dựng, tập track (không thứ tự) và dự án', () => {
  const p = { ...DEFAULT_NOTATION };
  const k = notationKey('proj', [1, 0], p);
  assert.equal(k, notationKey('proj', [0, 1], { ...p, inkColor: '#123456', zoom: 2, rough: 3 }));
  assert.notEqual(k, notationKey('proj', [0, 1], { ...p, division: 32 }));
  assert.notEqual(k, notationKey('proj', [0], p));
  assert.notEqual(k, notationKey('other', [0, 1], p));
});

test('notationClient: cùng khoá dùng lại; Worker hỏng thì từ chối yêu cầu đang chờ và lần sau tạo Worker mới', async () => {
  const made: FakeWorker[] = [];
  class FakeWorker implements NotationWorkerLike {
    onmessage: NotationWorkerLike['onmessage'] = null; onerror: NotationWorkerLike['onerror'] = null; sent: { id: number }[] = []; dead = false;
    constructor() { made.push(this); }
    postMessage(m: unknown) { this.sent.push(m as { id: number }); }
    terminate() { this.dead = true; }
  }
  const c = createNotationClient(() => new FakeWorker());
  const req = { notes: [], tempoMap: T, props: props() };
  const p1 = c.get('a', req), p2 = c.get('a', req);
  assert.equal(p1, p2); assert.equal(made[0].sent.length, 1);
  const lay = { version: 1 } as NotationLayout;
  made[0].onmessage!({ data: { id: made[0].sent[0].id, layout: lay } });
  assert.equal(await p1, lay);
  const p3 = c.get('b', req);
  made[0].onerror!(new Error('boom'));
  await assert.rejects(p3, /ERR_WORKER_CRASHED/);
  assert.ok(made[0].dead);
  void c.get('c', req); assert.equal(made.length, 2, 'Worker mới');
  c.dispose();
});
