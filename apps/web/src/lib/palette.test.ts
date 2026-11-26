// T-49 (REQ-UI-11): đọc bảng màu (danh sách dán, .gpl, JSON, biến CSS), gán lần lượt cho track (một bước hoàn tác), lưu, màu gần đây.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePalette, assignPalette, pushRecent, sanitizePalettes, upsertPalette, MAX_PALETTE_COLORS } from './palette.ts';
import { applyTrackPalette, initialDoc, pianoOf } from './commands.ts';
import { createStore } from './store.ts';

test('danh sách dán vào: phẩy, khoảng trắng, xuống dòng, có/không #, hàm màu có phẩy bên trong, mục sai bị đếm', () => {
  const p = parsePalette('#ff0000, 00ff00 0000FF\nrgb(255, 136, 0)\n  hsl(0 0% 50%) ; red  khongphaimau  #12');
  assert.equal(p.format, 'list');
  assert.deepEqual(p.colors, ['#ff0000', '#00ff00', '#0000ff', '#ff8800', '#808080', '#ff0000']);
  assert.equal(p.skipped, 2);
  assert.deepEqual(parsePalette('255, 0, 0\n0 0 255').colors, ['#ff0000', '#0000ff'], 'mỗi dòng là một bộ số');
  assert.deepEqual(parsePalette('112233 445566').colors, ['#112233', '#445566']);
  assert.deepEqual(parsePalette('').colors, []);
});

test('tệp GIMP .gpl: tên, Columns, chú thích, dòng hỏng; GIMP 3 có kênh alpha', () => {
  const gpl = 'GIMP Palette\nName: Hoàng hôn\nColumns: 4\n#\n# chú thích\n255   0   0\tĐỏ\n  0 255   0 Lục\n0 0 255\n300 0 0 sai\nkhông phải dòng màu\n';
  const p = parsePalette(gpl);
  assert.equal(p.format, 'gpl'); assert.equal(p.name, 'Hoàng hôn');
  assert.deepEqual(p.colors, ['#ff0000', '#00ff00', '#0000ff']); assert.equal(p.skipped, 2);
  const g3 = parsePalette('GIMP Palette\r\nChannels: RGBA\r\n255 0 0 128 Đỏ mờ\r\n');
  assert.deepEqual(g3.colors, ['#ff000080']);
});

test('JSON: mảng mã, {name, colors}, mảng đối tượng {hex}; JSON hỏng thì đọc như danh sách', () => {
  assert.deepEqual(parsePalette('["#ff0000", "00ff00", "blue", 5]').colors, ['#ff0000', '#00ff00', '#0000ff']);
  assert.equal(parsePalette('["#ff0000", 5]').skipped, 1);
  const o = parsePalette('{ "name": "Neon", "colors": ["#ff00ff", "#00ffff80"] }');
  assert.equal(o.format, 'json'); assert.equal(o.name, 'Neon'); assert.deepEqual(o.colors, ['#ff00ff', '#00ffff80']);
  assert.deepEqual(parsePalette('[{"hex":"#111111"},{"color":"#222222"},{"x":1}]').colors, ['#111111', '#222222']);
  assert.equal(parsePalette('[#ff0000, #00ff00').format, 'list');
});

test('biến CSS: --x: #…; kể cả hàm màu, !important, dòng khác bị bỏ qua', () => {
  const css = ':root {\n  --primary: #FF6A2B;\n  --bg: rgb(21 22 23);\n  --x: oklch(1 0 0) !important;\n  --bad: 12px;\n  color: red;\n}';
  const p = parsePalette(css);
  assert.equal(p.format, 'css'); assert.deepEqual(p.colors, ['#ff6a2b', '#151617', '#ffffff']); assert.equal(p.skipped, 1);
});

test('giới hạn số màu', () => {
  const p = parsePalette(Array.from({ length: MAX_PALETTE_COLORS + 10 }, () => '#000000').join(' '));
  assert.equal(p.colors.length, MAX_PALETTE_COLORS); assert.equal(p.skipped, 10);
});

test('assignPalette: gán theo thứ tự track, ít màu thì quay vòng, không màu thì rỗng', () => {
  assert.deepEqual(assignPalette(['a', 'b', 'c'], ['#111111', '#222222']), { a: '#111111', b: '#222222', c: '#111111' });
  assert.deepEqual(assignPalette(['a'], ['#111111', '#222222']), { a: '#111111' });
  assert.deepEqual(assignPalette(['a'], []), {});
});

test('applyTrackPalette: mỗi track thành màu tuỳ chỉnh, giữ ghi đè khác; một bước hoàn tác', () => {
  const d0 = initialDoc('paper');
  const store = createStore(d0, { now: () => 0 });
  store.dispatch({ ...applyTrackPalette(store.get(), { t0: '#123456' })!, mergeKey: undefined });
  const withGlow = { ...pianoOf(store.get().scene)!.properties.noteStyle.tracks };
  assert.equal(withGlow.t0.customColor, '#123456');
  // Ghi đè khác của track (vd. độ đục) được giữ khi áp bảng màu.
  const d1 = store.get();
  const piano = pianoOf(d1.scene)!;
  piano.properties.noteStyle.tracks.t0 = { ...piano.properties.noteStyle.tracks.t0, opacity: 0.4 };
  const cmd = applyTrackPalette(d1, assignPalette(['t0', 't1', 't2'], ['#ff0000', '#00ff0080']))!;
  assert.equal(cmd.type, 'applyTrackPalette'); assert.deepEqual(cmd.params, { n: 3 });
  store.dispatch(cmd);
  const tracks = pianoOf(store.get().scene)!.properties.noteStyle.tracks;
  assert.deepEqual(tracks.t0, { colorMode: 'custom', customColor: '#ff0000', opacity: 0.4 });
  assert.deepEqual(tracks.t1, { colorMode: 'custom', customColor: '#00ff0080' });
  assert.deepEqual(tracks.t2, { colorMode: 'custom', customColor: '#ff0000' });
  store.undo();
  assert.equal(pianoOf(store.get().scene)!.properties.noteStyle.tracks.t1, undefined, 'một lần hoàn tác trả lại cả bảng');
  assert.equal(applyTrackPalette(store.get(), {}), null);
  assert.equal(applyTrackPalette(store.get(), { t0: pianoOf(store.get().scene)!.properties.noteStyle.tracks.t0.customColor! }), null, 'không đổi gì → không ghi lịch sử');
});

test('màu gần đây: lên đầu, bỏ trùng, tối đa 12, mã sai bỏ qua', () => {
  let r: string[] = [];
  for (let i = 0; i < 14; i++) r = pushRecent(r, `#0000${i.toString(16).padStart(2, '0')}`);
  assert.equal(r.length, 12); assert.equal(r[0], '#00000d');
  r = pushRecent(r, '#00000A'); assert.equal(r[0], '#00000a'); assert.equal(r.filter((x) => x === '#00000a').length, 1);
  assert.deepEqual(pushRecent(r, 'không'), r);
});

test('bảng màu đã lưu: lọc mục hỏng, tên trùng, thay theo tên', () => {
  const list = sanitizePalettes([{ name: ' A ', colors: ['#FF0000', 'x'] }, { name: 'A', colors: ['#000000'] }, { name: '', colors: ['#000000'] }, { name: 'B', colors: [] }, null, 'x']);
  assert.deepEqual(list, [{ name: 'A', colors: ['#ff0000'] }]);
  assert.deepEqual(sanitizePalettes('x'), []);
  const up = upsertPalette(list, { name: 'A', colors: ['#00ff00'] });
  assert.deepEqual(up, [{ name: 'A', colors: ['#00ff00'] }]);
  assert.deepEqual(upsertPalette(up, { name: 'C', colors: ['#0000ff'] }).map((p) => p.name), ['C', 'A']);
});
