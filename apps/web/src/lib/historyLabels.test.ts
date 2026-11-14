// T-07 bước 2b: nhãn danh sách lịch sử dựng lúc hiển thị từ loại lệnh + tham số, qua locales/; đổi ngôn ngữ thì nhãn đổi theo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createI18n } from '@dawviz/i18n';
import { DEFAULT_BRIGHTNESS, defaultScene } from '@dawviz/render-core';
import { createStore } from './store.ts';
import * as C from './commands.ts';
import { describeCommand, historyItems } from './historyLabels.ts';
import { videoStyleBase, sceneForStyle, noteStylePreset } from './videoScenes.ts';

const cat = (c: string) => JSON.parse(fs.readFileSync(new URL(`../../../../locales/${c}.json`, import.meta.url), 'utf8'));
const i18n = createI18n({ locale: 'en', fallback: 'en', catalogs: { en: cat('en'), vi: cat('vi') } });
const names: Record<string, string> = { a: 'Lead', b: 'Bass' };
const ctx = { i18n, trackName: (id: string) => names[id] ?? id };
const doc = (): C.Doc => ({ videoStyle: 'paper', scene: sceneForStyle('paper', { base: videoStyleBase('paper'), tracks: {} }, {}), brightness: { a: { ...DEFAULT_BRIGHTNESS } }, order: ['a', 'b'], hidden: [], solo: [] });
const base = (d: C.Doc) => C.pianoOf(d.scene)!.properties.noteStyle.base;

test('nhãn kiểu "trước → sau" theo ngôn ngữ: Opacity 0.70 → 0.85 / Độ đục 0,70 → 0,85', () => {
  let t = 0; const s = createStore<C.Doc>(doc(), { now: () => (t += 5000) }); // cách nhau > 600 ms nên không gộp
  s.dispatch(C.patchNoteStyle(s.get(), { ...base(s.get()), opacity: 0.7 }));
  s.dispatch(C.patchNoteStyle(s.get(), { ...base(s.get()), opacity: 0.85 }));
  const [first, second] = s.state().history.timeline;
  i18n.setLocale('en');
  assert.equal(describeCommand(first, ctx), 'Opacity 1 → 0.70'); // số nguyên không thêm .00
  assert.equal(describeCommand(second, ctx), 'Opacity 0.70 → 0.85');
  i18n.setLocale('vi');
  assert.equal(describeCommand(second, ctx), 'Độ đục 0,70 → 0,85');
  i18n.setLocale('en');
});

test('mọi loại lệnh có nhãn đã dịch (en và vi), không lộ khoá thô, không "undefined"', () => {
  const s = createStore<C.Doc>(doc());
  const go = (f: (d: C.Doc) => C.Cmd | null) => s.dispatch(f(s.get()));
  go((d) => C.patchNoteStyle(d, { ...base(d), opacity: 0.5, glow: 0.2 }));            // nhiều trường
  go((d) => C.patchNoteStyle(d, { ...base(d), colorMode: 'pitch' }));                  // giá trị chữ dịch được
  go((d) => C.applyNotePreset(d, noteStylePreset('neon'), 'neon'));
  go((d) => C.patchKeyboard(d, { ...C.pianoOf(d.scene)!.properties.keyboard, enabled: true }));
  go((d) => C.patchTrackStyle(d, 'a', { opacity: 0.4 })); go((d) => C.patchTrackStyle(d, 'a', null));
  go((d) => C.patchBrightness(d, 'a', { ...d.brightness.a, source: 'volume' } as any));
  go((d) => C.toggleHidden(d, 'a')); go((d) => C.toggleHidden(d, 'a')); go((d) => C.toggleSolo(d, 'b')); go((d) => C.toggleSolo(d, 'b'));
  go((d) => C.setAllHidden(d, true)); go((d) => C.setAllHidden(d, false)); go((d) => C.moveTrack(d, 'a', 1));
  go((d) => C.setVideoStyle(d, 'default')); go((d) => C.loadPreset(d, defaultScene('9:16'))); go((d) => C.setVideoStyle(d, 'paper'));
  go((d) => C.patchLayout(d, 'piano-roll', { x: 100, width: 300 })); go((d) => C.patchLayout(d, 'piano-roll', { x: 120 }));
  go((d) => C.patchWidgetProps(d, 'piano-roll', { lookaheadSeconds: 5 })); go((d) => C.setWidgetVisible(d, 'track-info', false)); go((d) => C.reorderZ(d, 'piano-roll', 'front'));
  go((d) => C.moveLayer(d, C.layerOrder(d.scene).at(-1)!, 0)); go((d) => C.toggleSolo(d, 'b')); go((d) => C.clearSolo(d));
  go((d) => C.toggleAllWidgetsVisible(d)); go((d) => C.toggleAllWidgetsVisible(d));
  go((d) => C.patchSnapping(d, { gridSize: 16 }));
  const tl = s.state().history.timeline;
  assert.ok(tl.length >= 22);
  const en: string[] = [], vi: string[] = [];
  for (const c of tl) { i18n.setLocale('en'); en.push(describeCommand(c, ctx)); i18n.setLocale('vi'); vi.push(describeCommand(c, ctx)); }
  i18n.setLocale('en');
  for (const [i, c] of tl.entries()) for (const [loc, text] of [['en', en[i]], ['vi', vi[i]]]) {
    assert.ok(text && !/undefined|\{|\}|\bweb\.|\bNaN\b/.test(text), `${c.type}/${loc}: "${text}"`);
  }
  assert.equal(en[0], 'Note style: 2 changes'); assert.equal(vi[0], 'Kiểu nốt: 2 thay đổi');
  assert.match(en[1], /^Color pitch|^Colour|^Color/i); assert.notEqual(en[1], vi[1]);
  assert.equal(en[2], 'Note style set: Neon');
  assert.equal(en.find((t) => /Lead/.test(t) && /Hide/.test(t)), 'Hide Lead'); assert.ok(vi.includes('Ẩn Lead'));
  assert.ok(en.includes('Move Lead: position 1 → 2'));
  assert.ok(en.some((t) => /^Video style: Paper → Dark$|^Video style: .+ → .+$/.test(t)));
  const differing = en.filter((t, i) => t !== vi[i]).length;
  assert.ok(differing >= en.length - 4, `chỉ ${differing}/${en.length} nhãn đổi theo ngôn ngữ`);
});

test('danh sách: mới nhất ở trên, mốc đầu "Mở dự án" ở cuối, các bước làm lại đánh dấu mờ', () => {
  const s = createStore<C.Doc>(doc());
  for (const id of ['a', 'b', 'a']) s.dispatch(C.toggleHidden(s.get(), id));
  s.jumpTo(1);
  const h = s.state().history;
  const items = historyItems(h, (i) => describeCommand(h.timeline[i], ctx), i18n.t('web.hist.origin'));
  assert.deepEqual(items.map((i) => [i.position, i.redo]), [[3, true], [2, true], [1, false], [0, false]]);
  assert.deepEqual(items.map((i) => i.label), ['Show Lead', 'Hide Bass', 'Hide Lead', 'Open project']);
  i18n.setLocale('vi');
  assert.equal(historyItems(h, (i) => describeCommand(h.timeline[i], ctx), i18n.t('web.hist.origin')).at(-1)!.label, 'Mở dự án');
  i18n.setLocale('en');
});

test('vạch phát (T-71): kẹp 0,05–0,95, kéo liên tiếp gộp một bước, nhãn theo phần trăm', () => {
  let t = 0; const s = createStore<C.Doc>(doc(), { now: () => (t += 100) }); // cách nhau < 600 ms: gộp
  s.dispatch(C.setPlayheadRatio(s.get(), 0.4));
  s.dispatch(C.setPlayheadRatio(s.get(), 2));
  assert.equal(C.pianoOf(s.get().scene)!.properties.playheadPositionRatio, 0.95);
  assert.equal(C.setPlayheadRatio(s.get(), 0.95), null); // không đổi → không ghi lịch sử
  const items = s.state().history.timeline;
  assert.equal(items.length, 1);
  const before = Math.round(C.pianoOf(doc().scene)!.properties.playheadPositionRatio * 100);
  i18n.setLocale('en'); assert.equal(describeCommand(items[0], ctx), `Playhead position (%) ${before}% → 95%`);
  i18n.setLocale('vi'); assert.equal(describeCommand(items[0], ctx), `Vị trí vạch phát (%) ${before}% → 95%`);
  i18n.setLocale('en');
  s.undo(); assert.equal(C.pianoOf(s.get().scene)!.properties.playheadPositionRatio, before / 100);
});

test('ẩn/hiện vạch phát: một bước hoàn tác, nhãn bật/tắt theo ngôn ngữ', () => {
  const s = createStore<C.Doc>(doc());
  assert.equal(C.setPlayheadVisible(s.get(), true), null); // mặc định đang hiện
  s.dispatch(C.setPlayheadVisible(s.get(), false));
  assert.equal(C.pianoOf(s.get().scene)!.properties.playheadVisible, false);
  const [item] = s.state().history.timeline;
  i18n.setLocale('vi'); assert.match(describeCommand(item, ctx), /^Hiện vạch phát .+ → .+$/);
  i18n.setLocale('en'); assert.match(describeCommand(item, ctx), /^Show playhead .+ → .+$/);
  s.undo(); assert.equal(C.pianoOf(s.get().scene)!.properties.playheadVisible, true);
});

test('patchLayouts: nhãn theo thao tác (dời, đổi cỡ, xoay, điểm neo tên chuẩn), tên widget theo ngôn ngữ, không JSON', () => {
  let t = 0; const s = createStore<C.Doc>(doc(), { now: () => (t += 5000) });
  const id = C.pianoOf(s.get().scene)!.id, L = () => C.pianoOf(s.get().scene)!.layout;
  const wctx = { ...ctx, widgetName: (w: string) => (w === id ? 'Piano roll' : w) };
  s.dispatch(C.patchLayouts(s.get(), { [id]: { x: 130, y: 168 } }));
  s.dispatch(C.patchLayouts(s.get(), { [id]: { width: 690, height: 400 } }));
  s.dispatch(C.patchLayouts(s.get(), { [id]: { rotation: 30 } }));
  s.dispatch(C.patchLayouts(s.get(), { [id]: { anchor: { x: 0, y: 0.5 }, x: L().x + 3 } }));
  s.dispatch(C.patchLayouts(s.get(), { [id]: { anchor: { x: 0.25, y: 0.5 } } }));
  const other = s.get().scene.widgets.find((w) => w.id !== id);
  if (other) s.dispatch(C.patchLayouts(s.get(), { [id]: { rotation: 45 }, [other.id]: { rotation: 15 } }));
  const tl = s.state().history.timeline;
  i18n.setLocale('en');
  const en = tl.map((c) => describeCommand(c, wctx));
  assert.deepEqual(en.slice(0, 5), ['Move Piano roll to 130, 168', 'Resize Piano roll to 690 × 400', 'Rotate Piano roll 0° → 30°', 'Anchor of Piano roll: Middle left', 'Anchor of Piano roll: 25% · 50%']);
  if (other) assert.equal(en[5], 'Rotate 2 widgets');
  i18n.setLocale('vi');
  assert.equal(describeCommand(tl[0], wctx), 'Dời Piano roll tới 130, 168');
  assert.equal(describeCommand(tl[3], wctx), 'Điểm neo của Piano roll: Giữa trái');
  i18n.setLocale('en');
  // một lệnh cho nhiều widget là MỘT bước hoàn tác
  if (other) { const before = s.state().history.position; s.undo(); assert.equal(s.state().history.position, before - 1); }
});
