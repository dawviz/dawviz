// D-63 (REQ-NOTATION-01, REQ-WIDGET-09, REQ-GRAPHICS-20): lượng tử hoá để vẽ, cách viết cao độ, widget Bản nhạc (thuần theo t), nét tay tất định.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_NOTATION, auraAt, barsAfter, barsOf, buildBarGrid, eraseAt, erasePicked, itemSpanX, writeAt, drawPrimitives, estimateKey, keyName, layoutFrame, notationInkFor, notationPrims, pageIndexAt, quantize, renderFrame, roughPathData,
  sanitizeScene, SCENE_SCHEMA_VERSION, spellingTable, systemX, validateScore, vexKey, zoomAt,
  type ASTNote, type NotationLayout, type NotationProps, type PathPrim, type TempoPoint,
} from '../src/index.ts';
import { derivedOf, recCtx, synthAst } from './helpers.ts';

const Q = 960;
const T44: TempoPoint[] = [{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }];
let seq = 0;
/** Nốt theo phách (đen): [cao độ, phách bắt đầu, số phách]. */
const N = (pitch: number, beat: number, len: number): ASTNote => ({ id: `n${seq++}`, pitch, velocity: 90, startTick: Math.round(beat * Q), endTick: Math.round((beat + len) * Q), startTimeSeconds: beat / 2, endTimeSeconds: (beat + len) / 2 });

test('barsOf: ô nhịp theo dấu nhịp, đổi nhịp bắt đầu ô mới', () => {
  assert.deepEqual(barsOf(T44, 3 * 4 * Q).map((b) => b.startTick), [0, 3840, 7680]);
  const tm: TempoPoint[] = [{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 6, timeSigDenominator: 4 }, { tick: 2 * 6 * Q, timeSeconds: 6, bpm: 120, timeSigNumerator: 3, timeSigDenominator: 4 }];
  const b = barsOf(tm, 2 * 6 * Q + 3 * Q * 2);
  assert.deepEqual(b.map((x) => [x.num, x.endTick - x.startTick]), [[6, 5760], [6, 5760], [3, 2880], [3, 2880]]);
});

test('quantize: nốt đúng lưới giữ nguyên; mọi giọng mọi ô đủ độ dài; nốt qua vạch nhịp thành hai nốt nối', () => {
  const notes = [N(72, 0, 0.5), N(74, 0.5, 0.5), N(76, 1, 1), N(77, 2, 1), N(79, 3, 2), N(72, 5, 1)];
  const sm = quantize({ notes, tempoMap: T44 });
  assert.deepEqual(validateScore(sm), []);
  assert.equal(sm.stats.exactOnsets, notes.length);
  const tied = sm.measures.flatMap((m) => m.staves[0].voices[0].events).filter((e) => e.notes.some((n) => n.noteId === notes[4].id));
  assert.equal(tied.length, 2, 'nốt dài 2 phách từ phách 4 bị cắt ở vạch nhịp');
  assert.ok(tied[0].notes[0].tieStart && !tied[0].notes[0].tieEnd && tied[1].notes[0].tieEnd);
});

test('quantize: nốt lệch nhẹ về lưới gần nhất; liên ba nhận ra theo phách; tắt liên ba thì không', () => {
  const swing = [N(72, 0, 1 / 3), N(74, 1 / 3, 1 / 3), N(76, 2 / 3, 1 / 3), N(77, 1.02, 0.5), N(79, 1.49, 0.5)];
  const sm = quantize({ notes: swing, tempoMap: T44 });
  assert.deepEqual(validateScore(sm), []);
  const ev = sm.measures[0].staves[0].voices[0].events.filter((e) => !e.rest);
  assert.ok(ev.slice(0, 3).every((e) => e.value.triplet && e.tuplet === 0), 'ba nốt đầu là liên ba');
  assert.deepEqual(ev.slice(3).map((e) => e.pos), [Q, 1.5 * Q], 'nốt lệch 0,02 phách về đúng lưới');
  const no = quantize({ notes: swing, tempoMap: T44 }, { triplets: false });
  assert.deepEqual(validateScore(no), []);
  assert.ok(no.measures[0].staves[0].voices[0].events.every((e) => !e.value.triplet));
});

test('quantize: hai tay theo splitPitch; nốt giữ dài dưới giai điệu thành giọng 2; nhịp 6/4 và ô trống là lặng cả ô', () => {
  const tm: TempoPoint[] = [{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 6, timeSigDenominator: 4 }];
  const notes = [N(72, 0, 1), N(74, 1, 1), N(76, 2, 1), N(64, 0, 3), N(48, 0, 6), N(72, 12, 1)];
  const sm = quantize({ notes, tempoMap: tm });
  assert.deepEqual(validateScore(sm), []);
  const m0 = sm.measures[0];
  assert.equal(m0.staves[0].voices.length, 2, 'E4 giữ 3 phách dưới giai điệu → giọng 2');
  assert.ok(m0.staves[1].voices[0].events.some((e) => e.notes.some((n) => n.pitch === 48)), 'C3 ở khuông Fa');
  const empty = sm.measures[1];
  assert.equal(empty.staves[0].voices[0].events.length, 1);
  assert.ok(empty.staves[0].voices[0].events[0].rest && empty.staves[0].voices[0].events[0].dur === 6 * Q);
});

test('quantize: tất định (cùng đầu vào → cùng kết quả, không phụ thuộc thứ tự nốt)', () => {
  const notes = [N(60, 0, 1), N(64, 0, 1), N(67, 0.5, 0.25), N(72, 1.1, 0.4), N(50, 2, 2)];
  const a = JSON.stringify(quantize({ notes, tempoMap: T44 })), b = JSON.stringify(quantize({ notes: [...notes].reverse(), tempoMap: T44 }));
  assert.equal(a, b);
});

test('estimateKey: âm giai Đô trưởng, Mi giáng trưởng, La thứ', () => {
  const scale = (root: number, steps: number[]) => steps.map((s, i) => N(root + s, i, 1));
  assert.deepEqual(pick(estimateKey(scale(60, [0, 2, 4, 5, 7, 9, 11, 12, 7, 4, 0, 7, 0]))), { fifths: 0, mode: 'major' });
  assert.deepEqual(pick(estimateKey(scale(63, [0, 2, 4, 5, 7, 9, 11, 12, 7, 4, 0, 7, 0]))), { fifths: -3, mode: 'major' });
  assert.deepEqual(pick(estimateKey(scale(57, [0, 2, 3, 5, 7, 8, 11, 12, 7, 3, 0, 7, 0, 11, 0]))), { fifths: 0, mode: 'minor' });
});
const pick = (k: { fifths: number; mode: string }) => ({ fifths: k.fifths, mode: k.mode });

test('spellingTable: mọi giọng phủ đủ 12 cao độ đúng âm; bậc 7 nâng của giọng thứ; quãng tám của Si thăng/Đô giáng', () => {
  for (let f = -7; f <= 7; f++) for (const mode of ['major', 'minor'] as const) {
    const t = spellingTable(f, mode);
    t.forEach((s, pc) => assert.equal(((([0, 2, 4, 5, 7, 9, 11][s.letter] + s.acc) % 12) + 12) % 12, pc, `${keyName(f, mode)} pc ${pc}`));
  }
  assert.equal(vexKey(61, spellingTable(-1, 'minor')), 'c#/4', 'Rê thứ: Đô thăng');
  assert.equal(vexKey(66, spellingTable(-2, 'minor')), 'f#/4', 'Son thứ: Fa thăng');
  assert.equal(vexKey(70, spellingTable(-1, 'major')), 'bb/4');
  assert.equal(vexKey(60, spellingTable(4, 'minor')), 'b#/3', 'Đô thăng thứ: Si thăng 3 = Đô 4');
  assert.equal(vexKey(67, spellingTable(5, 'minor')), 'f##/4', 'Son thăng thứ: Fa kép');
  assert.equal(keyName(-3, 'major'), 'Eb'); assert.equal(keyName(4, 'minor'), 'C#m');
});

// ───────────────────────── widget ─────────────────────────
/** Layout giả: 2 trang, mỗi trang 1 hàng; trang 0 có hai nốt (chủ 0, 1) và một dòng kẻ tĩnh. */
function fakeLayout(): NotationLayout {
  const line = { o: -1, k: 0 as const, d: [0, 0, 50, 1, 1000, 50, 1, 1000, 51, 1, 0, 51, 4] };
  const head = (o: number, x: number) => ({ o, k: 2 as const, g: [0, x, 60, 40] });
  const stem = (o: number, x: number) => ({ o, k: 1 as const, d: [0, x, 60, 1, x, 30], lw: 1.5 });
  return {
    version: 1, width: 1000, maxHeight: 200, owners: [
      { notes: ['a'], on: 0, off: 1, head: true, cx: 100, cy: 60, track: 0 },
      { notes: ['b'], on: 1, off: 2, head: true, cx: 300, cy: 60, track: 1 },
      { notes: ['c'], on: 2, off: 3, head: true, cx: 100, cy: 60, track: 0 },
    ],
    glyphs: [[0, 0, 0, 1, 0.3, 0, 1, 0.3, 0.2, 1, 0, 0.2, 4]],
    pages: [
      { start: 0, end: 2, height: 150, firstBar: 0, lastBar: 0, items: [line, head(0, 100), stem(0, 110), head(1, 300)], systems: [{ y0: 20, y1: 120, start: 0, end: 2, at: [0, 1, 2], ax: [80, 300, 900] }] },
      { start: 2, end: 3, height: 200, firstBar: 1, lastBar: 1, items: [line, head(2, 100)], systems: [{ y0: 20, y1: 120, start: 2, end: 3, at: [2, 3], ax: [80, 900] }] },
    ],
    key: { fifths: 0, mode: 'major', confidence: 1, estimated: false }, stats: { measures: 2, notes: 3, exactOnsets: 3, meanOnsetErr: 0, engraveMs: 0 }, warnings: [],
  };
}
const P = (o: Partial<NotationProps> = {}): NotationProps => ({ ...DEFAULT_NOTATION, ...o });
const paths = (prims: ReturnType<typeof notationPrims>) => prims.filter((p): p is PathPrim => p.kind === 'path');

test('pageIndexAt, systemX: trang theo start, vạch phát nội suy giữa các mốc', () => {
  const L = fakeLayout();
  assert.equal(pageIndexAt(L, -1), 0); assert.equal(pageIndexAt(L, 1.99), 0); assert.equal(pageIndexAt(L, 2), 1);
  const s = L.pages[0].systems[0];
  assert.equal(systemX(s, 0.5), 190); assert.equal(systemX(s, 1.5), 600); assert.equal(systemX(s, 9), 900);
});

test('notationPrims: nốt sắp tới màu mực, đang ngân màu sáng + phóng to (vẽ sau cùng), đã qua màu nốt đã phát', () => {
  const L = fakeLayout(), p = P({ glow: 0, inkColor: '#111111', activeColor: '#ff0000', playedColor: '#888888', pageFadeMs: 0 });
  const at05 = paths(notationPrims(L, p, 1000, 200, 0.05, () => undefined));
  const last = at05.slice(-2);
  assert.ok(last.every((x) => x.color === '#ff0000' && x.item.o === 0), 'hai phần tử của nốt đang ngân vẽ sau cùng');
  assert.ok(last[0].zoom && last[0].zoom.k > 1 && last[0].zoom.cx === 100);
  assert.equal(at05.find((x) => x.item.o === 1)!.color, '#111111');
  const at15 = paths(notationPrims(L, p, 1000, 200, 1.5, () => undefined));
  assert.equal(at15.find((x) => x.item.o === 0)!.color, '#888888');
  assert.equal(at15.find((x) => x.item.o === 1)!.color, '#ff0000');
  assert.equal(at15.find((x) => x.item.o === -1)!.color, '#111111');
});

test('notationPrims: màu theo track, quầng sáng, vạch phát, mờ dần khi sang trang, tất định theo t', () => {
  const L = fakeLayout();
  const tr = paths(notationPrims(L, P({ colorMode: 'TRACK' }), 1000, 200, 1.2, (k) => (k === 1 ? '#00ff00' : undefined)));
  assert.equal(tr.find((x) => x.item.o === 1)!.color, '#00ff00');
  assert.ok(tr.find((x) => x.item.o === 1)!.glow, 'có quầng sáng khi glow > 0');
  const ph = notationPrims(L, P({ playhead: 'LINE', playheadWidth: 2 }), 1000, 200, 0.5, () => undefined).find((x) => x.kind === 'rect');
  assert.ok(ph && ph.kind === 'rect' && Math.abs(ph.x + 1 - 190 * Math.min(1, 200 / 200)) < 1e-6);
  const fade = paths(notationPrims(L, P({ pageFadeMs: 500 }), 1000, 200, 2.1, () => undefined));
  assert.ok(fade.every((x) => x.alpha < 1), 'trang mới đang hiện dần');
  assert.equal(JSON.stringify(notationPrims(L, P(), 1000, 200, 1.37, () => undefined)), JSON.stringify(notationPrims(L, P(), 1000, 200, 1.37, () => undefined)));
});

test('auraAt: tắt / luôn sáng / thở / loé / bật tắt; theo phách, ô nhịp, giây; mức thấp nhất', () => {
  const A = (o: Partial<NotationProps>, t: number, beats?: number) => auraAt(P({ auraGlow: 0.8, ...o }), t, beats === undefined ? undefined : { beats, bars: beats / 4 });
  assert.equal(A({ aura: 'OFF' }, 1), 0); assert.equal(A({ aura: 'STEADY' }, 1.3), 0.8); assert.equal(A({ aura: 'STEADY', auraGlow: 0 }, 1), 0);
  const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
  // Thở: sáng nhất ở đầu phách, tắt ở giữa phách, lặp lại
  close(A({ aura: 'BEAT' }, 0, 3), 0.8); close(A({ aura: 'BEAT' }, 0, 3.5), 0); close(A({ aura: 'BEAT' }, 0, 7), 0.8);
  // Mỗi 2 phách; theo ô nhịp dùng bars
  close(A({ aura: 'BEAT', auraEvery: 2 }, 0, 3), 0); close(A({ aura: 'BAR' }, 0, 6), 0);
  // Loé: đầu chu kỳ sáng nhất, giảm dần, cuối chu kỳ về 0
  const f = [0, 0.25, 0.5, 0.999].map((b) => A({ aura: 'BEAT', auraShape: 'FLASH' }, 0, b));
  close(f[0], 0.8); assert.ok(f[1] < f[0] && f[2] < f[1] && f[3] < 0.01);
  // Bật tắt: nửa đầu sáng, nửa sau tắt
  close(A({ aura: 'TIME', auraShape: 'BLINK', auraEvery: 2 }, 0.5), 0.8); close(A({ aura: 'TIME', auraShape: 'BLINK', auraEvery: 2 }, 1.5), 0);
  // Mức thấp nhất
  close(A({ aura: 'BEAT', auraMin: 0.25 }, 0, 0.5), 0.2);
  // Thiếu vị trí nhạc: coi như 120 BPM (phách 0,5 s)
  close(A({ aura: 'BEAT' }, 0.25), 0);
});

test('notationPrims: sáng cả bản nhạc phủ mọi nét (kể cả dòng kẻ) theo nhịp; lúc tắt không thêm quầng', () => {
  const L = fakeLayout(), on = P({ glow: 0, aura: 'BEAT', auraGlow: 0.6, pageFadeMs: 0 });
  const peak = paths(notationPrims(L, on, 1000, 200, 0.05, () => undefined, { beats: 0, bars: 0 }));
  assert.ok(peak.every((x) => x.glow && x.glow.mode === 'HALO' && Math.abs(x.glow.alpha - 0.6) < 1e-9), 'đầu phách: mọi nét có quầng');
  assert.equal(peak.find((x) => x.item.o === -1)!.glow!.color, on.inkColor, 'màu quầng theo màu nét');
  const off = paths(notationPrims(L, on, 1000, 200, 0.05, () => undefined, { beats: 0.5, bars: 0.125 }));
  assert.ok(off.every((x) => !x.glow), 'giữa phách: tắt hẳn, không tốn vẽ');
  const col = paths(notationPrims(L, P({ aura: 'STEADY', auraColor: '#00ffff' }), 1000, 200, 0.05, () => undefined));
  assert.ok(col.filter((x) => x.item.o !== 0).every((x) => x.glow?.color === '#00ffff'));
  assert.equal(col.find((x) => x.item.o === 0)!.glow!.color, DEFAULT_NOTATION.activeColor, 'nốt đang ngân giữ quầng riêng');
});

test('notationPrims: độ đục chung nhân cho tất cả (kể cả quầng và vạch phát); độ đục nét tĩnh chỉ ảnh hưởng khuông/ký hiệu', () => {
  const L = fakeLayout(), base = P({ pageFadeMs: 0, playhead: 'LINE', playheadWidth: 2, glow: 0.5 });
  const a = (o: Partial<NotationProps>, t = 1.2) => notationPrims(L, { ...base, ...o }, 1000, 200, t, () => undefined);
  const st = paths(a({ staticOpacity: 0.3 })), line = st.find((x) => x.item.o === -1)!, note = st.find((x) => x.item.o === 0)!;
  assert.equal(line.alpha, 0.3); assert.equal(note.alpha, DEFAULT_NOTATION.playedOpacity);
  const o = a({ opacity: 0.5 }); const ps = paths(o);
  assert.equal(ps.find((x) => x.item.o === -1)!.alpha, 0.5); assert.equal(ps.find((x) => x.item.o === 1)!.alpha, 0.5);
  const ph = o.find((x) => x.kind === 'rect'); assert.ok(ph && ph.kind === 'rect' && ph.alpha === 0.5);
  assert.equal(a({ opacity: 0 }).length, 0, 'đục 0 thì không vẽ gì');
});

test('zoomAt: PULSE nhấp rồi về 1; HOLD giữ trong lúc ngân; đoạn nối tiếp (head=false) không phóng', () => {
  const p = { zoom: 1.5, zoomMode: 'PULSE' as const, zoomMs: 300 };
  assert.equal(zoomAt(p, true, 1, 3, 0.9), 1);
  assert.ok(zoomAt(p, true, 1, 3, 1.05) > 1.3);
  assert.equal(zoomAt(p, true, 1, 3, 1.5), 1);
  assert.equal(zoomAt(p, false, 1, 3, 1.05), 1);
  assert.ok(Math.abs(zoomAt({ ...p, zoomMode: 'HOLD' }, true, 1, 3, 1.5) - 1.5) < 1e-9);
});

test('nét tay: tất định theo (id, bước, seed), đổi bước thì đổi nét, amp 0 không đổi hình', () => {
  const d = [0, 0, 0, 1, 400, 0, 2, 10, 10, 20, 20, 30, 30, 4];
  assert.deepEqual(roughPathData(d, 5, 3, 1, 2), roughPathData(d, 5, 3, 1, 2));
  assert.notDeepEqual(roughPathData(d, 5, 3, 1, 2), roughPathData(d, 5, 4, 1, 2));
  assert.equal(roughPathData(d, 5, 3, 1, 2)[3], 2, 'đoạn thẳng dài thành đường cong');
  assert.deepEqual(roughPathData([0, 1, 2, 1, 3, 4, 4], 1, 1, 1, 0), [0, 1, 2, 1, 3, 4, 4]);
  const L = fakeLayout();
  const a = paths(notationPrims(L, P({ rough: 2, boilFps: 8 }), 1000, 200, 0.1, () => undefined))[0].rough!;
  const b = paths(notationPrims(L, P({ rough: 2, boilFps: 8 }), 1000, 200, 0.3, () => undefined))[0].rough!;
  assert.equal(a.step, 0); assert.equal(b.step, 2);
});

// ───────────────────────── viết tay / xoá (T-132) ─────────────────────────
/** Layout một trang: dòng kẻ tĩnh, nốt 0 (đầu + thân), nốt 1 (đầu), dấu lặng (chủ 3), gạch nối móc gắn thời gian với nốt 1 (w = 1). */
function writeLayout(): NotationLayout {
  const L = fakeLayout();
  L.owners.push({ notes: [], on: 1.5, off: 2, head: false, rest: true, cx: 500, cy: 60, track: 0 });
  L.pages[0].items.push({ o: 3, k: 2, g: [0, 500, 60, 40] }, { o: -1, w: 1, k: 0, d: [0, 110, 30, 1, 300, 30, 1, 300, 34, 1, 110, 34, 4] });
  return L;
}
const at = (L: NotationLayout, o: Partial<NotationProps>, t: number, after?: (t: number, n: number) => number) =>
  paths(notationPrims(L, P({ pageFadeMs: 0, ...o }), 1000, 200, t, () => undefined, undefined, after));
const ofOwner = (ps: PathPrim[], o: number) => ps.filter((x) => (x.item.o >= 0 ? x.item.o : x.item.w ?? -1) === o);

test('T-132 mặc định: không viết tay, không xoá → chuỗi hình không đổi, không vùng cắt; dấu lặng vẽ như phần tĩnh', () => {
  const L = writeLayout();
  for (const t of [0, 0.5, 1.2, 1.7, 1.99]) {
    const a = notationPrims(L, P(), 1000, 200, t, () => undefined), b = notationPrims(L, P({ writeMs: 900, eraseMs: 30, eraseAmount: 1, eraseSeed: 7 }), 1000, 200, t, () => undefined);
    assert.equal(JSON.stringify(a), JSON.stringify(b));
    assert.ok(paths(a).every((x) => x.clipX === undefined));
    const { ctx, log } = recCtx();
    drawPrimitives(ctx, a, { scale: 1, rotation: 0 });
    assert.ok(!log.includes('clip()'), 'không cắt khi tắt viết tay');
  }
  const rest = paths(notationPrims(L, P({ pageFadeMs: 0, staticOpacity: 0.4 }), 1000, 200, 1.7, () => undefined)).find((x) => x.item.o === 3)!;
  assert.equal(rest.color, DEFAULT_NOTATION.inkColor); assert.equal(rest.alpha, 0.4); assert.ok(!rest.zoom && !rest.glow, 'dấu lặng không sáng, không phóng to');
});

test('T-132 viết tay: trước lượt không vẽ; trong writeMs cắt đúng tỉ lệ trên hộp bao; sau đó vẽ đủ; khuông luôn có', () => {
  const L = writeLayout(), o = { reveal: 'WRITE' as const, writeMs: 400 };
  const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
  assert.equal(writeAt(o, 1, 0.79), 0); near(writeAt(o, 1, 1), 0.5); assert.equal(writeAt(o, 1, 1.2), 1); assert.equal(writeAt({ reveal: 'NONE', writeMs: 400 }, 1, 0), 1);
  // nốt 1 vang lúc 1 s, viết từ 0,8 s tới 1,2 s
  assert.equal(ofOwner(at(L, o, 0.79), 1).length, 0, 'chưa tới lượt: cả đầu nốt lẫn gạch nối móc đều chưa vẽ');
  assert.ok(at(L, o, 0.79).some((x) => x.item.o === -1 && x.item.w === undefined), 'dòng kẻ khuông vẽ như cũ');
  const mid = ofOwner(at(L, o, 0.9), 1);
  assert.equal(mid.length, 2);
  for (const x of mid) { const [x0, x1] = itemSpanX(x.item, L.glyphs); assert.ok(Math.abs(x.clipX! - (x0 + (x1 - x0) * 0.25)) < 1e-9, 'cắt ở 1/4 hộp bao'); }
  const head = mid.find((x) => x.item.o === 1)!, [hx0, hx1] = itemSpanX(head.item, L.glyphs);
  assert.ok(hx0 < 300 && hx1 > 300 + 0.3 * 40 - 1e-9, 'hộp bao glyph theo cỡ và vị trí');
  assert.ok(ofOwner(at(L, o, 1.21), 1).every((x) => x.clipX === undefined), 'viết xong: vẽ đủ');
  assert.ok(ofOwner(at(L, o, 1.21), 3).length === 0 && ofOwner(at(L, o, 1.31), 3).length === 1, 'dấu lặng viết theo giây của nó');
  // đang ngân và đang viết: vẫn phóng to, vùng cắt đi theo
  const act = ofOwner(at(L, o, 1.05), 1).find((x) => x.item.o === 1)!;
  assert.ok(act.zoom && act.clipX !== undefined);
  const { ctx, log } = recCtx();
  drawPrimitives(ctx, at(L, { ...o, rough: 1 }, 0.9), { scale: 1, rotation: 0 });
  assert.ok(log.includes('clip()') && log.some((l) => l.startsWith('rect(-1000000,')), 'vùng cắt hình chữ nhật, kết hợp nét tay');
  assert.equal(log.filter((l) => l === 'save()').length, log.filter((l) => l === 'restore()').length);
});

test('T-132 xoá sau N ô nhịp: mờ dần hoặc lau phải → trái; xoá xong không vẽ; theo lưới ô nhịp của bài', () => {
  const L = writeLayout(), after = (t: number, n: number) => t + n; // 1 ô = 1 s cho dễ đọc
  const o = { erase: 'AFTER' as const, eraseAfterBars: 0.5, eraseMs: 200 };
  // nốt 0 kết thúc 1 s → xoá từ 1,5 s tới 1,7 s
  const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
  assert.equal(eraseAt(o, 1, 1.5, after), 0); near(eraseAt(o, 1, 1.6, after), 0.5); assert.equal(eraseAt(o, 1, 1.71, after), 1);
  assert.equal(eraseAt(o, 1, 1.9), 0, 'thiếu lưới: 2 giây một ô');
  const full = ofOwner(at(L, o, 1.45, after), 0);
  assert.equal(full.length, 2); assert.ok(full.every((x) => x.alpha === DEFAULT_NOTATION.playedOpacity));
  const half = ofOwner(at(L, o, 1.6, after), 0);
  assert.ok(half.every((x) => Math.abs(x.alpha - DEFAULT_NOTATION.playedOpacity * 0.5) < 1e-9 && x.clipX === undefined), 'FADE: mờ còn một nửa');
  assert.equal(ofOwner(at(L, o, 1.71, after), 0).length, 0, 'xoá xong');
  assert.equal(ofOwner(at(L, o, 1.71, after), 1).length, 2, 'nốt chưa tới hạn vẫn còn');
  const wipe = ofOwner(at(L, { ...o, eraseStyle: 'WIPE' }, 1.6, after), 0);
  for (const x of wipe) { const [x0, x1] = itemSpanX(x.item, L.glyphs); assert.ok(Math.abs(x.clipX! - (x1 - (x1 - x0) * 0.5)) < 1e-9 && x.alpha === DEFAULT_NOTATION.playedOpacity); }
  // lưới thật: 120 BPM 4/4 = 2 s một ô; đổi tempo giữa bài
  const g = buildBarGrid(T44, Q);
  near(barsAfter(g, 1, 1), 3); near(barsAfter(g, 1, 0.5), 2);
  const g2 = buildBarGrid([...T44, { tick: 4 * Q, timeSeconds: 2, bpm: 60, timeSigNumerator: 4, timeSigDenominator: 4 }], Q);
  near(barsAfter(g2, 1, 1), 2 + 2, 'nửa ô đầu ở 120 BPM (1 s), nửa ô sau ở 60 BPM (2 s)');
});

test('T-132 xoá ngẫu nhiên: đúng tỉ lệ, cùng seed cùng tập nốt, đổi seed đổi tập; 0 không xoá, 1 xoá hết', () => {
  const owners = Array.from({ length: 400 }, (_, i) => ({ notes: [`note-${i}`], on: i, off: i + 1, head: true, cx: 0, cy: 0, track: 0 }));
  const pick = (amount: number, seed: number) => owners.map((o, i) => (erasePicked({ erase: 'RANDOM', eraseAmount: amount, eraseSeed: seed }, o, i) ? 1 : 0)).join('');
  const a = pick(0.3, 1), n = [...a].filter((c) => c === '1').length;
  assert.ok(n > 400 * 0.3 - 40 && n < 400 * 0.3 + 40, `khoảng 30% (được ${n})`);
  assert.equal(pick(0.3, 1), a, 'cùng seed cùng tập');
  assert.notEqual(pick(0.3, 2), a, 'đổi seed đổi tập');
  assert.ok(!pick(0, 1).includes('1') && !pick(1, 1).includes('0'));
  assert.ok([...pick(0.2, 1)].every((c, i) => c === '0' || a[i] === '1'), 'tăng tỉ lệ chỉ thêm nốt, không đổi nốt đã chọn');
  assert.ok(owners.every((o, i) => erasePicked({ erase: 'AFTER', eraseAmount: 0, eraseSeed: 1 }, o, i)));
  assert.ok(owners.every((o, i) => !erasePicked({ erase: 'NONE', eraseAmount: 1, eraseSeed: 1 }, o, i)));
  // theo id nốt, không theo vị trí: dàn trang lại (đổi thứ tự chủ) vẫn chọn đúng các nốt đó
  const rev = [...owners].reverse().map((o, i) => (erasePicked({ erase: 'RANDOM', eraseAmount: 0.3, eraseSeed: 1 }, { ...o }, i) ? 1 : 0)).reverse().join('');
  assert.equal(rev, a);
});

test('T-132 tua tới/lui cùng kết quả: hình chỉ phụ thuộc t', () => {
  const L = writeLayout(), o = { reveal: 'WRITE' as const, writeMs: 300, erase: 'RANDOM' as const, eraseAmount: 0.6, eraseAfterBars: 0.25, eraseMs: 150, eraseStyle: 'WIPE' as const, eraseSeed: 3, rough: 1, boilFps: 8 };
  const ts = [0, 0.3, 0.85, 0.95, 1.05, 1.3, 1.55, 1.62, 1.8, 1.99];
  const fwd = ts.map((t) => JSON.stringify(at(L, o, t))), back = [...ts].reverse().map((t) => JSON.stringify(at(writeLayout(), o, t))).reverse();
  assert.deepEqual(fwd, back);
});

test('vẽ PathPrim không có Path2D (Node): phát lại lệnh đường lên ctx, trả trạng thái về', () => {
  const L = fakeLayout(), { ctx, log } = recCtx();
  drawPrimitives(ctx, notationPrims(L, P({ rough: 1.5 }), 1000, 200, 0.05, () => undefined), { scale: 1, rotation: 0 });
  assert.ok(log.includes('fill()') && log.includes('stroke()'));
  assert.equal(log.filter((l) => l === 'save()').length, log.filter((l) => l === 'restore()').length);
});

test('renderFrame/layoutFrame: widget Bản nhạc vẽ từ derived.notation; thiếu bản dựng thì không vẽ gì', () => {
  const ast = synthAst();
  const scene = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, presetName: 'x', author: '', canvas: { aspectRatio: '16:9', designWidth: 1920, designHeight: 1080, backgroundColor: '#ffffff', backgroundImageData: null, snapping: { gridEnabled: false, gridSize: 8, smartGuidesEnabled: false } },
    widgets: [{ id: 'nt', type: 'NOTATION', zIndex: 1, visible: true, layout: { x: 0, y: 0, width: 1000, height: 200, rotation: 0 }, trackMappingMode: 'ALL', assignedTrackIndices: [], properties: {} }] }).scene;
  assert.equal(layoutFrame(scene, derivedOf(ast), ast, 0.1)[0].prims.length, 0);
  const d = derivedOf(ast, { notation: new Map([['nt', fakeLayout()]]) });
  assert.ok(layoutFrame(scene, d, ast, 0.1)[0].prims.length > 0);
  const { ctx } = recCtx();
  renderFrame(scene, d, ast, 0.5, { ctx, width: 1920, height: 1080 }, 1);
});

test('sanitizeScene NOTATION: giá trị sai về mặc định kèm cảnh báo; notationInkFor theo nền', () => {
  const r = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, presetName: 'x', author: '', canvas: { aspectRatio: '16:9', designWidth: 1920, designHeight: 1080, backgroundColor: '#000000', backgroundImageData: null, snapping: { gridEnabled: false, gridSize: 8, smartGuidesEnabled: false } },
    widgets: [{ id: 'nt', type: 'NOTATION', zIndex: 1, visible: true, layout: { x: 0, y: 0, width: 100, height: 100, rotation: 0 }, trackMappingMode: 'ALL', assignedTrackIndices: [], properties: { division: 12, voices: 3, zoom: 9, musicFont: 'X', inkColor: 'red', barsPerSystem: 3 } }] });
  const p = r.scene.widgets[0].properties as NotationProps;
  assert.equal(p.division, 16); assert.equal(p.voices, 2); assert.equal(p.zoom, 3); assert.equal(p.musicFont, 'BRAVURA'); assert.equal(p.inkColor, DEFAULT_NOTATION.inkColor); assert.equal(p.barsPerSystem, 3);
  assert.ok(r.warnings.length >= 4);
  const a = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, presetName: 'x', author: '', canvas: { aspectRatio: '16:9', designWidth: 1920, designHeight: 1080, backgroundColor: '#000000', backgroundImageData: null, snapping: { gridEnabled: false, gridSize: 8, smartGuidesEnabled: false } },
    widgets: [{ id: 'nt', type: 'NOTATION', zIndex: 1, visible: true, layout: { x: 0, y: 0, width: 100, height: 100, rotation: 0 }, trackMappingMode: 'ALL', assignedTrackIndices: [], properties: { aura: 'X', auraShape: 'FLASH', auraEvery: 0, auraColor: 'blue' } }] }).scene.widgets[0].properties as NotationProps;
  assert.equal(a.aura, 'OFF'); assert.equal(a.auraShape, 'FLASH'); assert.equal(a.auraEvery, 0.25); assert.equal(a.auraColor, '');
  const w = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, presetName: 'x', author: '', canvas: { aspectRatio: '16:9', designWidth: 1920, designHeight: 1080, backgroundColor: '#000000', backgroundImageData: null, snapping: { gridEnabled: false, gridSize: 8, smartGuidesEnabled: false } },
    widgets: [{ id: 'nt', type: 'NOTATION', zIndex: 1, visible: true, layout: { x: 0, y: 0, width: 100, height: 100, rotation: 0 }, trackMappingMode: 'ALL', assignedTrackIndices: [], properties: { reveal: 'TYPE', writeMs: 1, erase: 'RANDOM', eraseAfterBars: -2, eraseAmount: 3, eraseMs: 600, eraseStyle: 'SMUDGE', eraseSeed: 4.6 } }] });
  const q = w.scene.widgets[0].properties as NotationProps;
  assert.equal(q.reveal, 'NONE'); assert.equal(q.writeMs, 20); assert.equal(q.erase, 'RANDOM'); assert.equal(q.eraseAfterBars, 0); assert.equal(q.eraseAmount, 1);
  assert.equal(q.eraseMs, 600); assert.equal(q.eraseStyle, 'FADE'); assert.equal(q.eraseSeed, 5);
  assert.ok(w.warnings.length >= 5);
  assert.equal(notationInkFor('#ffffff').inkColor, '#16181d'); assert.equal(notationInkFor('#0c0e16').inkColor, DEFAULT_NOTATION.inkColor);
  assert.equal(notationInkFor('#ffffff').auraColor, DEFAULT_NOTATION.activeColor); assert.equal(notationInkFor('#0c0e16').auraColor, '');
});
