import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseProject } from '@dawviz/parser';
import { buildIndex, activeNotes, notesInRange, trackBrightness, layoutPianoRoll, drawPianoRoll, DEFAULT_BRIGHTNESS,
  DEFAULT_NOTE_STYLE, resolveNoteStyle, sanitizeStyle, noteColor, layoutKeyboard, drawKeyboard } from '../src/index.ts';

const fixtures = new URL('../../../test/fixtures/', import.meta.url);
const load = (n: string) => fs.readFileSync(new URL(n, fixtures));

const mk = (notes: [number, number, number][], extra = {}) => ({
  id: 't0', index: 0, name: 'T', color: '#ff0000', isMuted: false, isVisible: true, pitchRange: { min: 0, max: 127 },
  notes: notes.map(([s, e, p], i) => ({ id: `n${i}`, pitch: p, startTick: 0, endTick: 0, startTimeSeconds: s, endTimeSeconds: e, velocity: 100 })), ...extra,
});

test('activeNotes: biên [start, end) và nốt dài bắt đầu rất sớm', () => {
  const ti = buildIndex([mk([[0, 10, 60], [1, 2, 62], [3, 4, 64]])], 10).tracks[0];
  assert.deepEqual(activeNotes(ti, 1.5).map((n) => n.pitch).sort(), [60, 62]);
  assert.deepEqual(activeNotes(ti, 2).map((n) => n.pitch), [60]);        // end là biên mở
  assert.deepEqual(activeNotes(ti, 3).map((n) => n.pitch).sort(), [60, 64]); // start là biên đóng
  assert.equal(notesInRange(ti, 5, 6).length, 1);
});

test('trackBrightness: không có dữ liệu → 1; static/volume/invert/off', () => {
  const tm = [{ tick: 0, timeSeconds: 0, bpm: 120 }];
  const none = mk([[0, 1, 60]]);
  assert.equal(trackBrightness(none, tm, 0), 1);
  const lane = { kind: 'volume' as const, points: [
    { tick: 0, timeSeconds: 0, value: 1, shape: 0 }, { tick: 1920, timeSeconds: 2, value: 10 ** (-36 / 20), shape: 0 }] };
  const tr = mk([[0, 1, 60]], { automation: { volume: lane } });
  assert.equal(trackBrightness(tr, tm, 0), 1);                 // 0 dB → sáng nhất
  assert.ok(Math.abs(trackBrightness(tr, tm, 2) - 0.25) < 1e-9); // -36 dB → minBrightness
  assert.ok(Math.abs(trackBrightness(tr, tm, 2, { ...DEFAULT_BRIGHTNESS, invert: true }) - 1) < 1e-9);
  assert.equal(trackBrightness(tr, tm, 2, { ...DEFAULT_BRIGHTNESS, source: 'off' }), 1);
  const st = mk([[0, 1, 60]], { mix: { volumeDb: -18, pan: 0 } });
  assert.ok(Math.abs(trackBrightness(st, tm, 0, { ...DEFAULT_BRIGHTNESS, source: 'static' }) - 0.625) < 1e-9); // unit .5 → .25+.75*.5
});

test('layoutPianoRoll: tất định, chỉ nốt trong cửa sổ, active đúng', () => {
  const tm = [{ tick: 0, timeSeconds: 0, bpm: 120 }];
  const idx = buildIndex([mk([[0, 1, 60], [5, 6, 62], [20, 21, 64]])], 21);
  const o = { width: 1000, height: 100, windowSeconds: 10, playheadRatio: 0.2, pitchMin: 60, pitchMax: 69 };
  const a = layoutPianoRoll(idx, tm, 5.5, o), b = layoutPianoRoll(idx, tm, 5.5, o);
  assert.deepEqual(a, b);
  assert.equal(a.length, 1);                     // cửa sổ [3.5, 13.5]: chỉ nốt 5-6 (0-1 và 20-21 nằm ngoài)
  assert.equal(a[0].active, true);               // t=5.5 nằm trong [5,6)
  assert.equal(layoutPianoRoll(idx, tm, 6.5, o)[0].active, false);
});

test('Reaper BigProject4b: độ sáng đổi theo envelope volume, bám đúng số đo (2.92 s ≈ −25.3 dB)', async () => {
  const { ast } = await parseProject('BigProject4b.rpp', load('BigProject4b.rpp'), {});
  const tr = ast.tracks.find((t: any) => t.automation?.volume);
  assert.ok(tr, 'cần có track có envelope volume');
  const b0 = trackBrightness(tr, ast.tempoMap, 0), b3 = trackBrightness(tr, ast.tempoMap, 3);
  assert.equal(b0, 1);
  assert.ok(b3 < b0 && b3 > 0.25);
  // −25.36 dB → unit (36−25.36)/36 = 0.2956 → 0.25 + 0.75*0.2956 ≈ 0.4717 tại 2.92 s
  assert.ok(Math.abs(trackBrightness(tr, ast.tempoMap, 2.92) - 0.4717) < 0.01);
});

const fakeCtx = () => {
  const calls: string[] = []; let alpha = 1;
  const ctx: any = { fillStyle: '', strokeStyle: '', lineWidth: 1, shadowColor: '', shadowBlur: 0,
    set globalAlpha(v: number) { alpha = v; }, get globalAlpha() { return alpha },
    clearRect() { }, beginPath() { calls.push('begin'); }, moveTo() { }, arcTo() { }, closePath() { }, fill() { calls.push(`fill@${alpha.toFixed(2)}`); },
    stroke() { calls.push('stroke'); }, fillRect(...a: number[]) { calls.push(`rect:${a.join(',')}@${alpha.toFixed(2)}`); } };
  return { ctx, calls };
};
const rectOf = (over = {}) => ({ id: 'n', trackId: 't', x: 1, y: 2, w: 30, h: 8, color: '#ffffff', brightness: 0.5, active: false, velocity: 90, pitch: 60,
  opacity: 0.85, radius: 0, glow: 0, glowRadius: 0, borderWidth: 0, borderColor: '#fff', ...over });

test('drawPianoRoll: nền, nốt vuông, playhead; alpha = độ sáng × độ đục', () => {
  const { ctx, calls } = fakeCtx();
  drawPianoRoll(ctx, [rectOf()], { width: 100, height: 10, background: '#000', playheadX: 2 });
  assert.equal(calls.length, 3);
  assert.equal(calls[1], 'rect:1,2,30,8@0.42'); // 0.5 × 0.85
});

test('drawPianoRoll: bo góc dùng path; phát sáng đặt shadowBlur rồi tắt lại; viền stroke', () => {
  const blur: number[] = []; const { ctx, calls } = fakeCtx();
  Object.defineProperty(ctx, 'shadowBlur', { get: () => blur.at(-1) ?? 0, set: (v: number) => { blur.push(v); } });
  drawPianoRoll(ctx, [rectOf({ radius: 4, glow: 1, glowRadius: 20, borderWidth: 2, brightness: 1, opacity: 1 })], { width: 100, height: 10, background: '#000', playheadX: 2 });
  assert.ok(calls.includes('fill@1.00') && calls.includes('stroke') && calls.includes('begin'));
  assert.ok(blur.includes(20), 'glow tối đa = glowRadius × glow'); assert.equal(blur.at(-1), 0, 'shadowBlur phải được trả về 0');
});

test('drawPianoRoll: nốt trong suốt hoàn toàn bị bỏ qua', () => {
  const { ctx, calls } = fakeCtx();
  drawPianoRoll(ctx, [rectOf({ opacity: 0 })], { width: 100, height: 10, background: '#000', playheadX: 2 });
  assert.equal(calls.length, 2);
});

test('style: ghi đè theo track, kẹp giá trị, màu theo chế độ', () => {
  const cfg = { base: { ...DEFAULT_NOTE_STYLE, opacity: 0.8 }, tracks: { a: { colorMode: 'custom' as const, customColor: '#00ff00', glow: 5, cornerRadius: -3 } } };
  const a = resolveNoteStyle(cfg, 'a'), b = resolveNoteStyle(cfg, 'b');
  assert.equal(a.opacity, 0.8); assert.equal(a.glow, 1); assert.equal(a.cornerRadius, 0); assert.equal(b.colorMode, 'track');
  assert.equal(noteColor(a, '#ff0000', 60, 100), '#00ff00');
  assert.equal(noteColor(b, '#ff0000', 60, 100), '#ff0000');
  assert.notEqual(noteColor({ ...b, colorMode: 'pitch' }, '#ff0000', 61, 100), noteColor({ ...b, colorMode: 'pitch' }, '#ff0000', 62, 100));
  assert.notEqual(noteColor({ ...b, colorMode: 'velocity' }, '#808080', 60, 120), noteColor({ ...b, colorMode: 'velocity' }, '#808080', 60, 20));
  assert.equal(sanitizeStyle({ ...b, customColor: 'đỏ' as any }).customColor, DEFAULT_NOTE_STYLE.customColor);
});

test('layoutPianoRoll: kiểu dáng ảnh hưởng hình học (độ dày, bo góc) và chừa chỗ bàn phím', () => {
  const tm = [{ tick: 0, timeSeconds: 0, bpm: 120 }];
  const idx = buildIndex([mk([[1, 2, 60]])], 3);
  const o = { width: 1064, height: 100, windowSeconds: 10, playheadRatio: 0, pitchMin: 60, pitchMax: 69, left: 64 };
  const flat = layoutPianoRoll(idx, tm, 0, { ...o, style: { base: { ...DEFAULT_NOTE_STYLE, heightScale: 1, cornerRadius: 0 }, tracks: {} } })[0];
  const thin = layoutPianoRoll(idx, tm, 0, { ...o, style: { base: { ...DEFAULT_NOTE_STYLE, heightScale: 0.5, cornerRadius: 999 }, tracks: {} } })[0];
  assert.equal(flat.h, 10); assert.equal(thin.h, 5); assert.equal(thin.y - flat.y, 2.5); // căn giữa hàng
  assert.equal(thin.radius, 2.5);                                                          // kẹp ở nửa chiều cao
  assert.equal(flat.x, 64 + 1 * 100);                                                      // left + (start - t0) × px/giây
});

test('layoutKeyboard + drawKeyboard: phím đang phát lấy màu track; phím đen đúng cao độ', () => {
  const idx = buildIndex([mk([[0, 2, 61], [0, 2, 62]])], 3);
  const keys = layoutKeyboard(idx, 1, { height: 120, pitchMin: 60, pitchMax: 71 });
  assert.equal(keys.length, 12);
  assert.deepEqual(keys.filter((k) => k.black).map((k) => k.pitch), [61, 63, 66, 68, 70]);
  assert.deepEqual(keys.filter((k) => k.active).map((k) => k.pitch).sort(), [61, 62]);
  assert.equal(keys.find((k) => k.pitch === 62)!.color, '#ff0000');
  assert.equal(layoutKeyboard(idx, 5, { height: 120, pitchMin: 60, pitchMax: 71 }).some((k) => k.active), false);
  const { ctx, calls } = fakeCtx(); drawKeyboard(ctx, keys, { width: 64, height: 120, whiteColor: '#fff' });
  assert.equal(calls.length, 7 + 5 * 2 + 1); // 7 phím trắng + 5 × (nền + phím đen) + đường kẻ
});
