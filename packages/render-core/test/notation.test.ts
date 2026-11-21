// D-63 (REQ-NOTATION-01, REQ-WIDGET-09, REQ-GRAPHICS-20): lượng tử hoá để vẽ, cách viết cao độ, widget Bản nhạc (thuần theo t), nét tay tất định.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_NOTATION, auraAt, barsOf, drawPrimitives, estimateKey, keyName, layoutFrame, notationInkFor, notationPrims, pageIndexAt, quantize, renderFrame, roughPathData,
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
  assert.equal(notationInkFor('#ffffff').inkColor, '#16181d'); assert.equal(notationInkFor('#0c0e16').inkColor, DEFAULT_NOTATION.inkColor);
  assert.equal(notationInkFor('#ffffff').auraColor, DEFAULT_NOTATION.activeColor); assert.equal(notationInkFor('#0c0e16').auraColor, '');
});
