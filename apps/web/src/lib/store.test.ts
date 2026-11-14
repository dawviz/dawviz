// T-07: store có hoàn tác. Từng lệnh hoàn tác/làm lại đúng; gộp thao tác kéo; giới hạn lịch sử; nạp dự án mới xoá lịch sử.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_BRIGHTNESS, DEFAULT_NOTE_STYLE, STYLE_PRESETS, defaultScene, type NoteStyle } from '@dawviz/render-core';
import { createStore, HISTORY_LIMIT, MERGE_WINDOW_MS, type Store } from './store.ts';
import * as C from './commands.ts';
import { sceneForStyle, videoStyleBase, noteStylePreset } from './videoScenes.ts';

const initial = (): C.Doc => ({
  videoStyle: 'paper', scene: sceneForStyle('paper', { base: videoStyleBase('paper'), tracks: {} }, {}),
  brightness: { a: { ...DEFAULT_BRIGHTNESS }, b: { ...DEFAULT_BRIGHTNESS } }, order: ['a', 'b', 'c'], hidden: [], solo: ['a'], audioOffsetMs: 0, lookRef: videoStyleBase('paper'), layoutRef: {},
});
const mk = (now = () => 0) => createStore<C.Doc>(initial(), { now });
const run = (s: Store<C.Doc>, f: (d: C.Doc) => C.Cmd | null) => s.dispatch(f(s.get()));
const base = (d: C.Doc) => C.pianoOf(d.scene)!.properties.noteStyle.base;
const snapshot = (d: C.Doc) => JSON.stringify(d);

/** Mỗi lệnh: áp → khác; hoàn tác → đúng bản cũ (từng byte); làm lại → đúng bản mới; hoàn tác lần nữa → bản cũ. */
function roundTrip(name: string, make: (d: C.Doc) => C.Cmd | null) {
  test(`lệnh ${name}: hoàn tác/làm lại trả đúng trạng thái`, () => {
    const s = mk(); const before = snapshot(s.get());
    run(s, make); const after = snapshot(s.get());
    assert.notEqual(after, before, 'lệnh không đổi gì');
    assert.equal(s.state().history.canUndo, true);
    s.undo(); assert.equal(snapshot(s.get()), before); assert.equal(s.state().history.canRedo, true);
    s.redo(); assert.equal(snapshot(s.get()), after);
    s.undo(); assert.equal(snapshot(s.get()), before); assert.equal(s.state().history.canUndo, false);
  });
}
roundTrip('patchNoteStyle', (d) => C.patchNoteStyle(d, { ...base(d), opacity: 0.4, cornerRadius: 9 }));
roundTrip('applyNotePreset', (d) => C.applyNotePreset(d, noteStylePreset('neon')));
roundTrip('patchKeyboard', (d) => C.patchKeyboard(d, { ...C.pianoOf(d.scene)!.properties.keyboard, enabled: true, width: 120 }));
roundTrip('patchTrackStyle (đặt)', (d) => C.patchTrackStyle(d, 'a', { customColor: '#112233', colorMode: 'custom' }));
roundTrip('setVideoStyle', (d) => C.setVideoStyle(d, 'default'));
roundTrip('loadPreset', (d) => C.loadPreset(d, defaultScene('9:16')));
roundTrip('patchBrightness', (d) => C.patchBrightness(d, 'a', { ...d.brightness.a, source: 'velocity' } as any));
roundTrip('toggleHidden', (d) => C.toggleHidden(d, 'b'));
roundTrip('toggleSolo', (d) => C.toggleSolo(d, 'a'));
roundTrip('setAllHidden', (d) => C.setAllHidden(d, true));
roundTrip('moveTrack', (d) => C.moveTrack(d, 'a', 2));
roundTrip('patchLayout', (d) => C.patchLayout(d, 'piano-roll', { x: 100, y: 120, width: 400, rotation: 37, anchor: { x: 0, y: 0 } }));
roundTrip('patchWidgetProps', (d) => C.patchWidgetProps(d, 'piano-roll', { lookaheadSeconds: 5 }));
roundTrip('setWidgetVisible', (d) => C.setWidgetVisible(d, 'track-info', false));
roundTrip('reorderZ (front)', (d) => C.reorderZ(d, 'piano-roll', 'front'));
roundTrip('reorderZ (back)', (d) => C.reorderZ(d, 'track-info', 'back'));
roundTrip('clearSolo', (d) => C.clearSolo(d));
roundTrip('toggleAllHidden', (d) => C.toggleAllHidden(d));
roundTrip('moveLayer (lên trên cùng)', (d) => C.moveLayer(d, C.layerOrder(d.scene).at(-1)!, 0));
roundTrip('moveLayer (xuống một bậc)', (d) => C.moveLayer(d, C.layerOrder(d.scene)[0], 1));
roundTrip('toggleAllWidgetsVisible', (d) => C.toggleAllWidgetsVisible(d));
roundTrip('patchSnapping', (d) => C.patchSnapping(d, { gridSize: 16, smartGuidesEnabled: false }));

test('patchTrackStyle: bỏ ghi đè (null) hoàn tác được; không đổi thì không ghi mục', () => {
  const s = mk();
  run(s, (d) => C.patchTrackStyle(d, 'a', { opacity: 0.3 }));
  const withOverride = snapshot(s.get());
  run(s, (d) => C.patchTrackStyle(d, 'a', null));
  assert.equal(C.pianoOf(s.get().scene)!.properties.noteStyle.tracks.a, undefined);
  s.undo(); assert.equal(snapshot(s.get()), withOverride);
  const n = s.state().history.undoCount;
  run(s, (d) => C.patchTrackStyle(d, 'zzz', null)); run(s, (d) => C.toggleHidden(d, 'b')); run(s, (d) => C.toggleHidden(d, 'b'));
  assert.equal(s.state().history.undoCount, n + 2); // hai lần toggle là hai mục; xoá override không có thì không thêm
});

test('lệnh không đổi gì trả null và không ghi lịch sử', () => {
  const s = mk();
  run(s, (d) => C.patchNoteStyle(d, base(d))); run(s, (d) => C.moveTrack(d, 'a', 0)); run(s, (d) => C.patchLayout(d, 'không-có', { x: 1 }));
  run(s, (d) => C.patchSnapping(d, {})); run(s, (d) => C.setVideoStyle(d, 'paper'));
  assert.equal(s.state().history.undoCount, 0);
});

test('chọn bộ "Neon" sau khi chỉnh tay, Ctrl+Z trả lại đủ các chỉnh tay', () => {
  const s = mk();
  // chỉnh tay bằng ba lần chỉnh khác nhau (mỗi lần một thanh trượt/ô khác)
  run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: 0.55 }));
  run(s, (d) => C.patchNoteStyle(d, { ...base(d), cornerRadius: 12 }));
  run(s, (d) => C.patchNoteStyle(d, { ...base(d), glow: 0.7, glowRadius: 20 }));
  const hand = base(s.get());
  run(s, (d) => C.applyNotePreset(d, noteStylePreset('neon')));
  assert.deepEqual(base(s.get()), noteStylePreset('neon'));
  assert.notDeepEqual(base(s.get()), hand);
  s.undo();
  assert.deepEqual(base(s.get()), hand, 'các chỉnh tay phải trở lại đủ');
  assert.deepEqual([base(s.get()).opacity, base(s.get()).cornerRadius, base(s.get()).glow, base(s.get()).glowRadius], [0.55, 12, 0.7, 20]);
  s.redo(); assert.deepEqual(base(s.get()), noteStylePreset('neon'));
});

test('đổi phong cách video thay cả scene, giữ ghi đè theo track; hoàn tác trả scene cũ cùng chỉnh tay và bố cục', () => {
  const s = mk();
  run(s, (d) => C.patchTrackStyle(d, 'a', { customColor: '#abcdef' }));
  run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: 0.5 }));
  run(s, (d) => C.patchLayout(d, 'piano-roll', { x: 333 }));
  const hand = snapshot(s.get());
  assert.equal(C.handEdited(s.get()), true);
  run(s, (d) => C.setVideoStyle(d, 'default'));
  const d = s.get();
  assert.equal(d.videoStyle, 'default');
  assert.equal(C.pianoOf(d.scene)!.properties.noteStyle.tracks.a?.customColor, '#abcdef', 'ghi đè theo track được giữ');
  assert.deepEqual(base(d), videoStyleBase('default'));
  assert.equal(C.handEdited(d), false, 'vừa đổi xong thì không còn chỉnh tay');
  s.undo(); assert.equal(snapshot(s.get()), hand);
});

test('handEdited: scene nguyên bản → false; đổi kiểu nốt, bố cục, bàn phím, hoặc scene từ preset → true', () => {
  const s = mk();
  assert.equal(C.handEdited(s.get()), false);
  run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: 0.2 })); assert.equal(C.handEdited(s.get()), true); s.undo();
  run(s, (d) => C.patchLayout(d, 'piano-roll', { y: 999 })); assert.equal(C.handEdited(s.get()), true); s.undo();
  run(s, (d) => C.patchKeyboard(d, { ...C.pianoOf(d.scene)!.properties.keyboard, enabled: true })); assert.equal(C.handEdited(s.get()), true); s.undo();
  run(s, (d) => C.patchTrackStyle(d, 'a', { opacity: 0.1 })); assert.equal(C.handEdited(s.get()), false, 'ghi đè theo track được giữ nên không tính là mất');
  run(s, (d) => C.loadPreset(d, defaultScene())); assert.equal(C.handEdited(s.get()), true);
});

test('gộp cử chỉ kéo: pointerdown → nhiều lần đổi → pointerup là MỘT bước hoàn tác', () => {
  const s = mk();
  const start = snapshot(s.get());
  s.beginGesture();
  for (const v of [0.9, 0.8, 0.7, 0.6, 0.5]) run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: v }));
  s.endGesture();
  assert.equal(s.state().history.undoCount, 1);
  assert.equal(base(s.get()).opacity, 0.5);
  s.undo(); assert.equal(snapshot(s.get()), start);
  s.redo(); assert.equal(base(s.get()).opacity, 0.5);
});

test('gộp chỉ theo cùng mergeKey: kéo hai thanh trượt khác nhau trong một cử chỉ là hai mục; hai cử chỉ liên tiếp là hai mục', () => {
  const s = mk();
  s.beginGesture();
  run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: 0.5 })); run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: 0.4 }));
  run(s, (d) => C.patchNoteStyle(d, { ...base(d), glow: 0.5 }));
  s.endGesture();
  assert.equal(s.state().history.undoCount, 2);
  s.beginGesture(); run(s, (d) => C.patchNoteStyle(d, { ...base(d), glow: 0.9 })); s.endGesture();
  assert.equal(s.state().history.undoCount, 3);
  s.undo(); assert.equal(base(s.get()).glow, 0.5);
  s.undo(); assert.equal(base(s.get()).glow, videoStyleBase('paper').glow); assert.equal(base(s.get()).opacity, 0.4);
});

test('kéo ra rồi kéo về đúng giá trị cũ: không để lại mục no-op', () => {
  const s = mk(); const o = base(s.get()).opacity;
  s.beginGesture();
  run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: 0.2 })); run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: o }));
  s.endGesture();
  assert.equal(s.state().history.undoCount, 0);
});

test('ngoài cử chỉ: phím mũi tên trên thanh trượt gộp trong 600 ms; quá 600 ms hoặc khác trường thì tách; ô nhập số = một bước', () => {
  let t = 0; const s = mk(() => t);
  for (const v of [0.95, 0.9, 0.85]) { run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: v })); t += MERGE_WINDOW_MS - 100; }
  assert.equal(s.state().history.undoCount, 1);
  t += MERGE_WINDOW_MS + 1; run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: 0.5 }));
  assert.equal(s.state().history.undoCount, 2);
  run(s, (d) => C.patchNoteStyle(d, { ...base(d), glow: 0.5 }));
  assert.equal(s.state().history.undoCount, 3);
  // gõ vào ô số rồi Enter: đúng một lệnh → một bước
  t += 5000; run(s, (d) => C.patchNoteStyle(d, { ...base(d), cornerRadius: 17 }));
  assert.equal(s.state().history.undoCount, 4);
  s.undo(); assert.equal(base(s.get()).cornerRadius, videoStyleBase('paper').cornerRadius);
});

test('lệnh không có mergeKey (đổi phong cách, bộ nốt, ẩn/hiện) không bao giờ bị gộp, kể cả trong cử chỉ', () => {
  const s = mk();
  s.beginGesture();
  run(s, (d) => C.toggleHidden(d, 'a')); run(s, (d) => C.toggleHidden(d, 'b'));
  s.endGesture();
  assert.equal(s.state().history.undoCount, 2);
});

test('làm lại bị xoá khi có lệnh mới; Redo không gộp vào cử chỉ', () => {
  const s = mk();
  run(s, (d) => C.toggleHidden(d, 'a')); run(s, (d) => C.toggleHidden(d, 'b'));
  s.undo(); assert.equal(s.state().history.canRedo, true);
  run(s, (d) => C.toggleSolo(d, 'c'));
  assert.equal(s.state().history.canRedo, false);
  s.redo(); assert.deepEqual(s.get().hidden, ['a']); // không có gì để làm lại
});

test('hoàn tác giữa cử chỉ đang mở: đóng cử chỉ trước, rồi hoàn tác cả cử chỉ', () => {
  const s = mk(); const start = snapshot(s.get());
  s.beginGesture(); run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: 0.3 }));
  s.undo();
  assert.equal(snapshot(s.get()), start);
  run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: 0.2 }));
  assert.equal(s.state().history.undoCount, 1);
});

test(`lịch sử giới hạn ${HISTORY_LIMIT} bước: bỏ mục cũ nhất; một cử chỉ kéo chỉ tốn một mục`, () => {
  const s = mk(); assert.equal(HISTORY_LIMIT, 100);
  for (let i = 0; i < 130; i++) run(s, (d) => C.toggleSolo(d, i % 2 ? 'a' : 'b'));
  assert.equal(s.state().history.undoCount, 100);
  for (let i = 0; i < 100; i++) s.undo();
  assert.equal(s.state().history.canUndo, false);
  // còn lại trạng thái sau 30 lệnh đầu: không về được trạng thái gốc
  assert.notDeepEqual(s.get().solo, initial().solo);
  s.reset(initial());
  s.beginGesture(); for (let i = 0; i < 500; i++) run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: (i % 100) / 100 })); s.endGesture();
  assert.ok(s.state().history.undoCount <= 1);
});

test('nạp dự án mới: reset đặt tài liệu mới và xoá lịch sử (cả làm lại); thiết lập đã lưu (scene) vẫn nằm trong store', () => {
  const s = mk();
  run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: 0.35 })); run(s, (d) => C.toggleHidden(d, 'a')); s.undo();
  assert.equal(s.state().history.canUndo, true); assert.equal(s.state().history.canRedo, true);
  const kept = s.get().scene;
  let notified = 0; const off = s.subscribe(() => notified++);
  s.reset({ ...s.get(), brightness: { x: { ...DEFAULT_BRIGHTNESS } }, order: ['x', 'y'], hidden: [], solo: [] });
  assert.equal(notified, 1); off();
  assert.deepEqual(s.state().history, { canUndo: false, canRedo: false, undoLabel: undefined, redoLabel: undefined, undoCount: 0, redoCount: 0, timeline: [], position: 0 });
  assert.deepEqual(s.get().order, ['x', 'y']);
  assert.equal(s.get().scene, kept, 'scene (kiểu nốt đã lưu) giữ nguyên');
  s.undo(); s.redo(); assert.deepEqual(s.get().order, ['x', 'y'], 'không còn gì để hoàn tác sau khi nạp');
});

test('state() ổn định giữa các lần đọc khi không có thay đổi; đổi tham chiếu khi có thay đổi; subscribe/unsubscribe', () => {
  const s = mk(); const a = s.state(); assert.equal(s.state(), a);
  let n = 0; const off = s.subscribe(() => n++);
  run(s, (d) => C.toggleHidden(d, 'a')); assert.notEqual(s.state(), a); assert.equal(n, 1);
  s.undo(); s.redo(); assert.equal(n, 3);
  off(); run(s, (d) => C.toggleHidden(d, 'b')); assert.equal(n, 3);
  assert.equal(s.state().history.undoLabel, 'web.cmd.hide');
});

test('jumpTo: lùi 5 bước rồi tới 3 bước cho đúng trạng thái (và về mốc đầu / bước mới nhất)', () => {
  const s = mk(); const states = [snapshot(s.get())];
  for (let i = 0; i < 8; i++) { run(s, (d) => C.patchNoteStyle(d, { ...base(d), cornerRadius: 10 + i })); s.endGesture(); states.push(snapshot(s.get())); s.dispatch(null); run(s, (d) => C.toggleSolo(d, i % 2 ? 'a' : 'b')); states.push(snapshot(s.get())); }
  const total = states.length - 1; // 16 bước, bước k ứng với states[k]
  assert.equal(s.state().history.timeline.length, total); assert.equal(s.state().history.position, total);
  s.jumpTo(total - 5);
  assert.equal(snapshot(s.get()), states[total - 5]); assert.equal(s.state().history.position, total - 5);
  assert.equal(s.state().history.timeline.length, total, 'các bước làm lại vẫn còn trong dòng thời gian');
  assert.equal(s.state().history.redoCount, 5);
  s.jumpTo(total - 5 + 3);
  assert.equal(snapshot(s.get()), states[total - 2]); assert.equal(s.state().history.position, total - 2);
  s.jumpTo(0); assert.equal(snapshot(s.get()), states[0]); assert.equal(s.state().history.canUndo, false);
  s.jumpTo(999); assert.equal(snapshot(s.get()), states[total]); assert.equal(s.state().history.canRedo, false);
  s.jumpTo(-4); assert.equal(s.state().history.position, 0);
  let n = 0; s.subscribe(() => n++); s.jumpTo(7); assert.equal(n, 1, 'một lần cập nhật cho cả bước nhảy'); s.jumpTo(7); assert.equal(n, 1, 'nhảy tới chính nó không làm gì');
});

test('lịch sử một nhánh: làm thao tác mới sau khi lùi thì bỏ các bước làm lại', () => {
  const s = mk();
  for (const id of ['a', 'b', 'c', 'a', 'b']) run(s, (d) => C.toggleHidden(d, id));
  s.jumpTo(2);
  assert.deepEqual(s.state().history.timeline.map((c) => (c.params as any).track), ['a', 'b', 'c', 'a', 'b']);
  run(s, (d) => C.toggleSolo(d, 'c'));
  const h = s.state().history;
  assert.equal(h.timeline.length, 3); assert.equal(h.position, 3); assert.equal(h.canRedo, false);
  assert.deepEqual(h.timeline.map((c) => c.type), ['toggleHidden', 'toggleHidden', 'toggleSolo']);
  s.jumpTo(99); assert.equal(s.state().history.position, 3);
});

test('offset âm thanh: hoàn tác/làm lại, gộp ± liên tiếp, kẹp ±10 s, nhãn lịch sử', () => {
  let t = 0; const s = mk(() => t);
  run(s, (d) => C.setAudioOffset(d, 1)); t += 100; run(s, (d) => C.setAudioOffset(d, 2)); t += 100; run(s, (d) => C.setAudioOffset(d, 3));
  assert.equal(s.get().audioOffsetMs, 3); assert.equal(s.state().history.undoCount, 1, 'gộp thành một bước');
  s.undo(); assert.equal(s.get().audioOffsetMs, 0); s.redo(); assert.equal(s.get().audioOffsetMs, 3);
  run(s, (d) => C.setAudioOffset(d, 99999)); assert.equal(s.get().audioOffsetMs, 10000);
  run(s, (d) => C.setAudioOffset(d, -99999)); assert.equal(s.get().audioOffsetMs, -10000);
  assert.equal(C.setAudioOffset(s.get(), -10000), null, 'không đổi thì không có mục lịch sử');
  s.undo(); s.undo(); assert.ok(s.get().audioOffsetMs !== -10000);
});

test('moveLayer: đổi đúng thứ tự danh sách Lớp, đánh lại zIndex liền mạch; ra ngoài hai đầu thì kẹp, đứng yên thì null', () => {
  const d = initial(), order = C.layerOrder(d.scene);
  assert.ok(order.length >= 3);
  const moved = C.moveLayer(d, order[2], 0)!.redo(d);
  assert.deepEqual(C.layerOrder(moved.scene), [order[2], order[0], order[1], ...order.slice(3)]);
  assert.deepEqual(moved.scene.widgets.map((w) => w.zIndex).sort((a, b) => a - b), order.map((_, i) => i));
  assert.equal(C.moveLayer(d, order[0], -5), null);
  assert.deepEqual(C.layerOrder(C.moveLayer(d, order[0], 99)!.redo(d).scene).at(-1), order[0]);
});

test('lookRef: áp bộ kiểu nốt đổi tham chiếu của nút ↺; hoàn tác trả tham chiếu cũ; chỉnh tay không đổi tham chiếu', () => {
  const s = mk(); const ref0 = s.get().lookRef;
  run(s, (d) => C.patchNoteStyle(d, { ...base(d), opacity: 0.2 }));
  assert.deepEqual(s.get().lookRef, ref0);
  run(s, (d) => C.applyNotePreset(d, noteStylePreset('neon'), 'neon'));
  assert.deepEqual(s.get().lookRef, noteStylePreset('neon'));
  s.undo(); assert.deepEqual(s.get().lookRef, ref0);
  run(s, (d) => C.setVideoStyle(d, 'default'));
  assert.deepEqual(s.get().lookRef, videoStyleBase('default'));
});

test('toggleAllHidden: còn track ẩn thì hiện hết trước, hiện hết rồi mới ẩn hết', () => {
  const d = { ...initial(), hidden: ['a'] };
  assert.deepEqual(C.toggleAllHidden(d)!.redo(d).hidden, []);
  const none = initial();
  assert.deepEqual(C.toggleAllHidden(none)!.redo(none).hidden, ['a', 'b', 'c']);
});

test('toggleAllWidgetsVisible: còn lớp ẩn thì hiện hết trước, hiện hết rồi mới ẩn hết', () => {
  const d0 = initial(), id = d0.scene.widgets[0].id;
  const one = C.setWidgetVisible(d0, id, false)!.redo(d0);
  assert.ok(C.toggleAllWidgetsVisible(one)!.redo(one).scene.widgets.every((w) => w.visible));
  assert.ok(C.toggleAllWidgetsVisible(d0)!.redo(d0).scene.widgets.every((w) => !w.visible));
});

test('layoutRef: đổi phong cách / mở preset đặt bố cục tham chiếu cho nút ↺; hoàn tác trả lại', () => {
  const s = mk(); const ref0 = s.get().layoutRef;
  run(s, (d) => C.setVideoStyle(d, 'default'));
  assert.deepEqual(s.get().layoutRef, Object.fromEntries(s.get().scene.widgets.map((w) => [w.id, w.layout])));
  s.undo(); assert.deepEqual(s.get().layoutRef, ref0);
  assert.ok(Object.keys(C.initialDoc('paper').layoutRef).length > 0);
});
