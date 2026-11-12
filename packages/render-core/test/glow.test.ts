// REQ-GRAPHICS-17: phát sáng đều nhau (mặc định) và phát sáng động khi chạm theo velocity/pitch/pan/fade/automation.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { glowAmount, glowSourceValue, laneUnit, layoutPianoRoll, buildIndex, DEFAULT_NOTE_STYLE, sanitizeStyle, type NoteStyle } from '../src/index.ts';

const tm = [{ tick: 0, timeSeconds: 0, bpm: 120 }]; // 960 tick = 0.5 s
const note = (s: number, e: number, pitch = 60, velocity = 100) => ({ id: 'n', pitch, startTick: 0, endTick: 0, startTimeSeconds: s, endTimeSeconds: e, velocity });
const track = (extra = {}) => ({ id: 't', index: 0, name: 'T', color: '#ff0000', isMuted: false, isVisible: true, pitchRange: { min: 48, max: 72 }, notes: [], ...extra }) as any;
const st = (o: Partial<NoteStyle> = {}): NoteStyle => sanitizeStyle({ ...DEFAULT_NOTE_STYLE, ...o });
const ctx = (n: any, t: number, tr = track()) => ({ track: tr, note: n, t, tempoMap: tm, pitchMin: 48, pitchMax: 72 });

test('mặc định đều nhau: mọi nốt đang phát cùng cường độ, bất kể velocity/cao độ; nốt chờ không sáng', () => {
  const s = st();
  assert.equal(s.glowMode, 'uniform');
  assert.equal(glowAmount(s, ctx(note(0, 1, 50, 10), 0.5)), 1);
  assert.equal(glowAmount(s, ctx(note(0, 1, 70, 127), 0.5)), 1);
  assert.equal(glowAmount(s, ctx(note(2, 3), 0.5)), 0);
  assert.equal(glowAmount(st({ glowActiveOnly: false }), ctx(note(2, 3), 0.5)), 1);
});
test('tắt dần sau nốt (glowRelease) tuyến tính về 0', () => {
  const s = st({ glowRelease: 0.4 });
  assert.equal(glowAmount(s, ctx(note(0, 1), 1)), 1);
  assert.ok(Math.abs(glowAmount(s, ctx(note(0, 1), 1.2)) - 0.5) < 1e-9);
  assert.equal(glowAmount(s, ctx(note(0, 1), 1.4)), 0);
});
test('động theo velocity, cao độ (trong tầm của widget), đảo chiều, min/max', () => {
  const v = st({ glowMode: 'dynamic', glowSource: 'velocity', glowMin: 0.2, glowMax: 1 });
  assert.ok(Math.abs(glowAmount(v, ctx(note(0, 1, 60, 127), 0.5)) - 1) < 1e-9);
  assert.ok(Math.abs(glowAmount(v, ctx(note(0, 1, 60, 0), 0.5)) - 0.2) < 1e-9);
  const p = st({ glowMode: 'dynamic', glowSource: 'pitch', glowMin: 0, glowMax: 1 });
  assert.equal(glowAmount(p, ctx(note(0, 1, 60), 0.5)), 0.5);           // 60 giữa 48..72
  assert.equal(glowAmount({ ...p, glowInvert: true }, ctx(note(0, 1, 72), 0.5)), 0);
});
test('fade: sáng nhất lúc chạm, tắt dần tới cuối nốt', () => {
  const f = st({ glowMode: 'dynamic', glowSource: 'fade', glowMin: 0, glowMax: 1 });
  assert.equal(glowAmount(f, ctx(note(0, 2), 0)), 1);
  assert.equal(glowAmount(f, ctx(note(0, 2), 1)), 0.5);
});
test('pan và automation: theo lane tại thời điểm; thiếu dữ liệu → như đều nhau', () => {
  const pan = { kind: 'pan', points: [{ tick: 0, timeSeconds: 0, value: -1, shape: 0 }, { tick: 1920, timeSeconds: 1, value: 1, shape: 0 }] };
  const vol = { kind: 'volume', points: [{ tick: 0, timeSeconds: 0, value: 1, shape: 0 }, { tick: 1920, timeSeconds: 1, value: 10 ** (-36 / 20), shape: 0 }] };
  const tr = track({ automation: { pan, volume: vol } });
  assert.equal(laneUnit(tr, 'pan', tm, 0), 0); assert.equal(laneUnit(tr, 'pan', tm, 1), 1);
  assert.equal(laneUnit(tr, 'nope', tm, 0), undefined);
  const a = st({ glowMode: 'dynamic', glowSource: 'automation', glowLane: 'volume', glowMin: 0, glowMax: 1 });
  assert.ok(glowAmount(a, ctx(note(0, 2), 0, tr)) > 0.99);              // 0 dB
  assert.ok(glowAmount(a, ctx(note(0, 2), 1, tr)) < 0.01);              // -36 dB, lane đọc tại t (không phải đầu nốt)
  const pn = st({ glowMode: 'dynamic', glowSource: 'pan', glowMin: 0, glowMax: 1 });
  assert.equal(glowSourceValue(pn, ctx(note(1, 2), 1.5, tr)), 1);       // pan lấy lúc nốt bắt đầu
  assert.equal(glowSourceValue(pn, ctx(note(0, 1), 0.5, track())), undefined);
  assert.equal(glowAmount(pn, ctx(note(0, 1), 0.5, track())), 1);
});
test('layoutPianoRoll áp phát sáng động vào NoteRect.glow; tuỳ chọn cũ thiếu trường mới vẫn hợp lệ', () => {
  const tr = track({ notes: [note(0, 1, 60, 127), { ...note(0, 1, 61, 32), id: 'm' }] });
  const o = { width: 100, height: 100, windowSeconds: 4, playheadRatio: 0.25, pitchMin: 48, pitchMax: 72,
    style: { base: { ...DEFAULT_NOTE_STYLE, glowMode: 'dynamic' as const, glowSource: 'velocity' as const, glowMin: 0, glowMax: 1 }, tracks: {} } };
  const r = layoutPianoRoll(buildIndex([tr], 1), tm, 0.5, o);
  const g = Object.fromEntries(r.map((x) => [x.velocity, x.glow]));
  assert.ok(Math.abs(g[127] - 0.5) < 1e-9 && Math.abs(g[32] - 0.5 * 32 / 127) < 1e-9);
  const legacy: any = { ...DEFAULT_NOTE_STYLE }; for (const k of ['glowMode', 'glowSource', 'glowLane', 'glowMin', 'glowMax', 'glowInvert', 'glowRelease']) delete legacy[k];
  const s = sanitizeStyle(legacy);
  assert.equal(s.glowMode, 'uniform'); assert.equal(s.glowMin, DEFAULT_NOTE_STYLE.glowMin); assert.equal(s.glowRelease, 0);
});

test('laneUnit chuẩn hoá theo loại lane (REQ-AST-02): MIDI CC, pitch bend, tham số có range', () => {
  const lane = (kind: string, value: number, range?: any) => ({ kind, range, points: [{ tick: 0, timeSeconds: 0, value, shape: 0 }] });
  const tr = track({ automation: { cc1: lane('midi-cc', 64), pb: lane('pitch-bend', 0), cut: lane('plugin', 5000, { min: 20, max: 20000, unit: 'Hz' }), raw: lane('plugin', 0.3) } });
  assert.ok(Math.abs(laneUnit(tr, 'cc1', tm, 0)! - 64 / 127) < 1e-9);
  assert.ok(Math.abs(laneUnit(tr, 'pb', tm, 0)! - 8192 / 16383) < 1e-9);
  assert.ok(Math.abs(laneUnit(tr, 'cut', tm, 0)! - (4980 / 19980)) < 1e-9);
  assert.equal(laneUnit(tr, 'raw', tm, 0), 0.3);
});

test('pan hai kiểu: trái→phải (mặc định) và càng lệch khỏi giữa càng sáng; áp cả cho lane pan khi nguồn là automation', () => {
  const mk = (pan: number) => track({ mix: { volumeDb: 0, pan } });
  const lr = st({ glowMode: 'dynamic', glowSource: 'pan', glowMin: 0, glowMax: 1 });
  const sp = st({ glowMode: 'dynamic', glowSource: 'pan', glowPanMode: 'spread', glowMin: 0, glowMax: 1 });
  assert.equal(lr.glowPanMode, 'lr');
  assert.deepEqual([-1, 0, 1].map((p) => glowSourceValue(lr, ctx(note(0, 1), 0.5, mk(p)))), [0, 0.5, 1]);
  assert.deepEqual([-1, -0.5, 0, 0.5, 1].map((p) => glowSourceValue(sp, ctx(note(0, 1), 0.5, mk(p)))), [1, 0.5, 0, 0.5, 1]);
  const pan = { kind: 'pan', points: [{ tick: 0, timeSeconds: 0, value: -1, shape: 0 }] };
  const auto = st({ glowMode: 'dynamic', glowSource: 'automation', glowLane: 'pan', glowPanMode: 'spread', glowMin: 0, glowMax: 1 });
  assert.equal(glowSourceValue(auto, ctx(note(0, 1), 0.5, track({ automation: { pan } }))), 1);
});
