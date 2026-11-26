// T-129: dải màu hai đầu cho chế độ màu nốt "Theo cao độ" / "Theo cường độ" và dải cao độ toàn phần 0–127 của Piano Roll.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_NOTE_STYLE, DEFAULT_PIANO_ROLL, noteColor, sanitizeStyle, sanitizeScene, defaultScene, layoutKeyboard, pianoRollPitchRange, type NoteStyle } from '../src/index.ts';

const base: NoteStyle = { ...DEFAULT_NOTE_STYLE };
const FROM = '#0000ff', TO = '#ff0000';

test('mặc định: dải màu rỗng, cách tô cũ giữ nguyên (bánh xe sắc theo lớp cao độ, màu track sáng tối theo cường độ)', () => {
  assert.equal(DEFAULT_NOTE_STYLE.gradientFrom, '');
  assert.equal(DEFAULT_NOTE_STYLE.gradientTo, '');
  const pitch = { ...base, colorMode: 'pitch' as const }, vel = { ...base, colorMode: 'velocity' as const };
  // cùng lớp cao độ (C3, C5) → cùng màu, như trước; dải cao độ không ảnh hưởng
  assert.equal(noteColor(pitch, '#808080', 48, 100, [21, 108]), noteColor(pitch, '#808080', 72, 100, [21, 108]));
  assert.equal(noteColor(pitch, '#808080', 60, 100), '#eb4747'); // C: sắc 0°, s 0.8, l 0.6
  assert.equal(noteColor(vel, '#808080', 60, 127, [0, 127]), noteColor(vel, '#808080', 60, 127));
  assert.notEqual(noteColor(vel, '#808080', 60, 20), noteColor(vel, '#808080', 60, 120));
});

test('Theo cao độ + dải màu: nốt thấp nhất / cao nhất của dải đang hiện nằm đúng hai đầu, giữa dải là màu trộn', () => {
  const s = { ...base, colorMode: 'pitch' as const, gradientFrom: FROM, gradientTo: TO };
  assert.equal(noteColor(s, '#808080', 21, 100, [21, 108]), FROM);
  assert.equal(noteColor(s, '#808080', 108, 100, [21, 108]), TO);
  assert.equal(noteColor(s, '#808080', 60, 100, [40, 80]), '#800080');
  // ngoài dải: kẹp về hai đầu; không truyền dải: 0–127
  assert.equal(noteColor(s, '#808080', 10, 100, [21, 108]), FROM);
  assert.equal(noteColor(s, '#808080', 0, 100), FROM);
  assert.equal(noteColor(s, '#808080', 127, 100), TO);
  // dải một nốt: lấy đầu cuối
  assert.equal(noteColor(s, '#808080', 60, 100, [60, 60]), TO);
});

test('Theo cường độ + dải màu: nốt nhẹ nhất (0) / mạnh nhất (127) nằm đúng hai đầu', () => {
  const s = { ...base, colorMode: 'velocity' as const, gradientFrom: FROM, gradientTo: TO };
  assert.equal(noteColor(s, '#808080', 60, 0), FROM);
  assert.equal(noteColor(s, '#808080', 60, 127), TO);
  assert.equal(noteColor(s, '#808080', 60, 200), TO);
  const mid = noteColor(s, '#808080', 60, 64);
  assert.notEqual(mid, FROM); assert.notEqual(mid, TO);
});

test('một đầu rỗng lấy màu track; chế độ Một màu / Theo track bỏ qua dải màu', () => {
  const s = { ...base, colorMode: 'velocity' as const, gradientFrom: '', gradientTo: TO };
  assert.equal(noteColor(s, '#00ff00', 60, 0), '#00ff00');
  assert.equal(noteColor(s, '#00ff00', 60, 127), TO);
  assert.equal(noteColor({ ...s, colorMode: 'track' }, '#00ff00', 60, 0), '#00ff00');
  assert.equal(noteColor({ ...s, colorMode: 'custom', customColor: '#123456' }, '#00ff00', 60, 0), '#123456');
});

test('sanitizeStyle: dải màu nhận mã hex, mã sai hoặc vắng (preset cũ) thành rỗng', () => {
  const ok = sanitizeStyle({ ...base, gradientFrom: '#112233', gradientTo: '#445566cc' });
  assert.equal(ok.gradientFrom, '#112233'); assert.equal(ok.gradientTo, '#445566cc');
  const bad = sanitizeStyle({ ...base, gradientFrom: 'đỏ', gradientTo: 5 as unknown as string });
  assert.equal(bad.gradientFrom, ''); assert.equal(bad.gradientTo, '');
  const { gradientFrom: _a, gradientTo: _b, ...old } = base;
  const s = sanitizeStyle(old as NoteStyle);
  assert.equal(s.gradientFrom, ''); assert.equal(s.gradientTo, '');
});

test('bàn phím: phím đang nhấn lấy màu dải theo dải cao độ đang hiện', () => {
  const track = { id: 'a', name: 'A', color: '#808080', isVisible: true, pitchRange: { min: 21, max: 21 }, notes: [] } as never;
  const note = { id: 'n', pitch: 21, velocity: 100, startTimeSeconds: 0, endTimeSeconds: 1, startTick: 0, durationTick: 960 };
  const index = { duration: 1, tracks: [{ track, notes: [note], prefixMaxEnd: [1] }] } as never;
  const keys = layoutKeyboard(index, 0.5, { height: 880, pitchMin: 21, pitchMax: 108, noteStyle: { base: { ...base, colorMode: 'pitch', gradientFrom: FROM, gradientTo: TO }, tracks: {} } });
  assert.equal(keys.find((k) => k.pitch === 21)?.color, FROM);
});

test('dải cao độ Piano Roll: mặc định 88 phím (21–108); preset nhận toàn dải 0–127, kẹp ngoài miền, đổi chỗ khi thấp > cao', () => {
  assert.equal(DEFAULT_PIANO_ROLL.pitchMin, 21); assert.equal(DEFAULT_PIANO_ROLL.pitchMax, 108);
  const pianoOf = (min: unknown, max: unknown) => {
    const sc = defaultScene() as unknown as { widgets: { type: string; properties: Record<string, unknown> }[] };
    const w = sc.widgets.find((x) => x.type === 'PIANO_ROLL')!;
    w.properties = { ...w.properties, pitchRangeMode: 'CUSTOM', pitchMin: min, pitchMax: max };
    const out = sanitizeScene(sc).scene.widgets.find((x) => x.type === 'PIANO_ROLL')!;
    return out.properties as unknown as { pitchMin: number; pitchMax: number; pitchRangeMode: 'CUSTOM' };
  };
  const full = pianoOf(0, 127);
  assert.deepEqual([full.pitchMin, full.pitchMax], [0, 127]);
  assert.deepEqual(pianoRollPitchRange(full as never, []), [0, 127]);
  const wide = pianoOf(-5, 200);
  assert.deepEqual([wide.pitchMin, wide.pitchMax], [0, 127]);
  const swapped = pianoOf(90, 30);
  assert.deepEqual([swapped.pitchMin, swapped.pitchMax], [30, 90]);
});
