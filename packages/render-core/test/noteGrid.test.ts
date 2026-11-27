// Lưới nốt (NOTE_GRID, D-77, T-139): đổi preset cũ (DENSITY, ARRANGEMENT, DOTS) khi đọc, và các tổ hợp mới (cao độ trên cả bài, track quanh vạch phát,
// cường độ, thanh liền, nhãn track). Hình cũ đã được so từng primitive với renderer cũ trước khi gỡ (WIDGET-REVAMP §5b).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutFrame, sanitizeScene, SCENE_SCHEMA_VERSION, legacyGridProps, DEFAULT_NOTE_GRID, ADDABLE_WIDGETS, WIDGET_TYPES,
  type NoteGridProps, type Primitive, type RectPrim, type PolyPrim, type TextPrim, type UnifiedProjectAST } from '../src/index.ts';
import { synthAst, derivedOf } from './helpers.ts';

const lay = { x: 0, y: 0, width: 600, height: 200 };
const ast: UnifiedProjectAST = synthAst({ duration: 8, tracks: [
  { name: 'Keys', color: '#4488ff', notes: [[60, 0, 2, 30], [64, 0, 2, 90], [67, 2, 2, 127], [72, 4, 1, 60]] },
  { name: 'Bass', color: '#ff8844', notes: [[36, 0, 1, 100], [36, 1, 1, 100], [43, 2, 4, 50]] },
] });
const read = (w: object, extra: object = {}) => sanitizeScene({ schemaVersion: '0.8.0', canvas: {}, widgets: [w], ...extra });
const grid = (props: Partial<NoteGridProps>) => {
  const { scene, warnings } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'g', type: 'NOTE_GRID', layout: lay, properties: props }] });
  assert.deepEqual(warnings, []); return scene;
};
const at = (props: Partial<NoteGridProps>, t: number) => layoutFrame(grid(props), derivedOf(ast, { measure: (s: string, _f: string, size: number) => s.length * size * 0.6 }), ast, t)[0]?.prims ?? [];
const rects = (p: Primitive[]) => p.filter((x): x is RectPrim => x.kind === 'rect');
const finite = (p: Primitive[]) => { for (const x of p) for (const v of Object.values(x)) if (typeof v === 'number') assert.ok(Number.isFinite(v), JSON.stringify(x).slice(0, 120)); };

test('loại cũ không còn trong danh sách loại và menu Thêm; Lưới nốt có', () => {
  for (const t of ['DENSITY', 'ARRANGEMENT', 'DOTS']) { assert.ok(!(WIDGET_TYPES as readonly string[]).includes(t), t); assert.ok(!(ADDABLE_WIDGETS as readonly string[]).includes(t), t); }
  assert.ok((ADDABLE_WIDGETS as readonly string[]).includes('NOTE_GRID'));
  assert.equal(SCENE_SCHEMA_VERSION, '0.9.0');
});

test('đọc preset cũ: DENSITY / ARRANGEMENT / DOTS thành NOTE_GRID với lựa chọn tương ứng, mặc định cũ cho khoá vắng, không cảnh báo lạ', () => {
  const codes = (r: ReturnType<typeof read>) => r.warnings.map((w) => w.code).filter((c) => c !== 'WARN_PRESET_MIGRATED');
  const d = read({ id: 'd', type: 'DENSITY', layout: lay, properties: { minAlpha: 0.2 } });
  assert.deepEqual(codes(d), []);
  const dp = d.scene.widgets[0].properties as NoteGridProps;
  assert.equal(d.scene.widgets[0].type, 'NOTE_GRID'); assert.equal(d.scene.schemaVersion, '0.9.0');
  assert.deepEqual([dp.rows, dp.span, dp.light, dp.shape, dp.maxRows, dp.cols, dp.cellGap, dp.upcomingAlpha, dp.emptyColor, dp.emptyAlpha, dp.showPolyphony, dp.playheadMark, dp.playheadWidth],
    ['TRACK', 'SONG', 'DENSITY', 'FILL', 24, 96, 1, 1, '', 0.1, true, 'LINE', 1.5]);
  const a = read({ id: 'a', type: 'ARRANGEMENT', layout: lay, properties: { upcomingAlpha: 0.2, cols: 9999 } });
  const ap = a.scene.widgets[0].properties as NoteGridProps;
  assert.deepEqual([ap.rows, ap.span, ap.light, ap.shape, ap.maxRows, ap.cols, ap.cellGap, ap.upcomingAlpha, ap.emptyAlpha, ap.showPolyphony, ap.playheadWidth], ['TRACK', 'SONG', 'NOTES', 'FILL', 32, 600, 0.5, 0.2, 0, false, 2]);
  const o = read({ id: 'o', type: 'DOTS', layout: lay, properties: { cols: 300, shape: 'SQUARE' } });
  const op = o.scene.widgets[0].properties as NoteGridProps;
  assert.deepEqual([op.rows, op.span, op.light, op.shape, op.cols, op.colorMode, op.color, op.emptyColor, op.rowGap, op.playheadMark, op.playheadColor, op.grid],
    ['PITCH', 'WINDOW', 'NOTES', 'SQUARE', 256, 'SOLID', '#ff3d8b', '#c7a3bb', 0, 'COLUMN', '#333344', 16]);
  // Bỏ qua khoá loại cũ không có (vd. rows ghi nhầm vào preset cũ) để hình như cũ.
  assert.equal(legacyGridProps('ARRANGEMENT', { rows: 'PITCH' }).rows, 'TRACK');
});

test('đọc preset cũ: id mặc định giữ tên loại cũ, comp cũng được đổi, keyframe theo tên thuộc tính cũ vẫn chạy, lưu → đọc lại không đổi', () => {
  const keys = { keys: [{ at: { sec: 0 }, value: 0.1 }, { at: { sec: 4 }, value: 0.9 }] };
  const r = read({ type: 'DOTS', layout: lay, animate: { dotSize: keys } }, { comps: { k: { name: 'K', widgets: [{ id: 'in', type: 'DENSITY', layout: lay, animate: { minAlpha: keys } }] } } });
  assert.deepEqual(r.warnings.map((w) => w.code).filter((c) => c !== 'WARN_PRESET_MIGRATED'), []);
  const w = r.scene.widgets[0];
  assert.equal(w.id, 'dots-0'); assert.equal(w.type, 'NOTE_GRID'); assert.deepEqual(Object.keys(w.animate ?? {}), ['dotSize']);
  const inner = r.scene.comps!.k.widgets[0];
  assert.equal(inner.type, 'NOTE_GRID'); assert.deepEqual(Object.keys(inner.animate ?? {}), ['minAlpha']);
  const again = sanitizeScene(JSON.parse(JSON.stringify(r.scene)));
  assert.deepEqual(again.warnings, []); assert.deepEqual(again.scene, r.scene);
});

test('hàng theo cao độ trên cả bài: mỗi cao độ một hàng, ô sáng ở cột nốt bắt đầu, nốt trống bị bỏ', () => {
  const p = at({ rows: 'PITCH', span: 'SONG', cols: 8, rowGap: 0, playheadColor: '', pitchRangeMode: 'CUSTOM', pitchMin: 60, pitchMax: 67 }, 3);
  finite(p);
  const r = rects(p), rh = 200 / 8, cw = 600 / 8;
  // Nốt (giây = phách × 0,5): C4 và E4 bắt đầu ở 0 s (cột 0), G4 ở 1 s (cột 1, hàng trên cùng); C5 nằm ngoài dải, Bass dưới dải.
  assert.ok(r.some((x) => Math.abs(x.y - 7 * rh) < 1e-9 && Math.abs(x.x) < 1e-9 && x.fill === '#4488ff'));
  const g4 = () => r.find((x) => Math.abs(x.y) < 1e-9)!;
  assert.ok(Math.abs(g4().x - cw) < 1e-9);
  assert.equal(r.length, 3);
  assert.equal(g4().alpha, 1); // cột 1 đã phát xong lúc t = 3
  const early = rects(at({ rows: 'PITCH', span: 'SONG', cols: 8, rowGap: 0, playheadColor: '', pitchRangeMode: 'CUSTOM', pitchMin: 60, pitchMax: 67 }, 0.5));
  assert.equal(early.find((x) => Math.abs(x.y) < 1e-9)!.alpha, DEFAULT_NOTE_GRID.upcomingAlpha); // chưa tới: mờ
});

test('track quanh vạch phát: mỗi track một hàng, ô sáng suốt độ dài nốt, khung cột đứng yên', () => {
  const xs = new Set<number>();
  for (const t of [1.1, 1.7, 2.3, 3.05]) {
    const p = at({ rows: 'TRACK', span: 'WINDOW', grid: 4, cols: 8, playheadRatio: 0.5, playheadMark: 'COLUMN', rowGap: 0 }, t);
    finite(p);
    const frame = p.filter((x): x is PolyPrim => x.kind === 'poly'); assert.equal(frame.length, 1); xs.add(frame[0].pts[0]);
    assert.ok(rects(p).every((x) => x.y < 100 + 1e-9 ? true : x.fill === '#ff8844'), 'hàng 2 là Bass');
  }
  assert.equal(xs.size, 1);
});

test('Ô sáng theo Cường độ: độ đục đi từ minAlpha tới 1 theo cường độ lớn nhất của ô', () => {
  const p = rects(at({ rows: 'PITCH', span: 'SONG', cols: 8, light: 'VELOCITY', minAlpha: 0, upcomingAlpha: 1, playheadColor: '', pitchRangeMode: 'CUSTOM', pitchMin: 60, pitchMax: 67, rowGap: 0 }, 0));
  const rh = 200 / 8, byRow = (pitch: number) => p.find((x) => Math.abs(x.y - (67 - pitch) * rh) < 1e-9)!;
  assert.ok(Math.abs(byRow(60).alpha - 30 / 127) < 1e-9);
  assert.ok(Math.abs(byRow(64).alpha - 90 / 127) < 1e-9);
  assert.ok(Math.abs(byRow(67).alpha - 1) < 1e-9);
});

test('Thanh liền: ô sáng liền nhau cùng màu, cùng độ đục gộp thành một thanh bo tròn', () => {
  const base: Partial<NoteGridProps> = { rows: 'TRACK', span: 'WINDOW', grid: 4, cols: 16, playheadRatio: 1, playheadColor: '', upcomingAlpha: 1, rowGap: 0 };
  const fill = rects(at({ ...base, shape: 'FILL' }, 7.9)), bar = rects(at({ ...base, shape: 'BAR', dotSize: 0.5 }, 7.9));
  assert.ok(bar.length > 0 && bar.length < fill.length, `${bar.length} < ${fill.length}`);
  const cw = 600 / 16;
  for (const b of bar) { assert.ok(Math.abs(b.h - 50) < 1e-9); assert.ok(Math.abs(b.radius - Math.min(25, cw, b.w / 2)) < 1e-9, String(b.radius)); }
  // Tổng bề rộng gần bằng tổng bề rộng ô đầy (khác nhau chỉ ở khe giữa các ô).
  const sum = (r: RectPrim[]) => r.reduce((n, x) => n + x.w, 0);
  assert.ok(sum(bar) >= sum(fill) - 1e-9);
});

test('nhãn hàng theo track: tên track ở cột trái, lưới lùi sang phải; tắt thì không có chữ', () => {
  const on = at({ rowLabels: true, playheadColor: '' }, 2), off = at({ rowLabels: false, playheadColor: '' }, 2);
  const names = on.filter((x): x is TextPrim => x.kind === 'text').map((x) => x.text);
  assert.deepEqual(names, ['Keys', 'Bass']);
  assert.ok(Math.min(...rects(on).map((x) => x.x)) > 0); assert.equal(Math.min(...rects(off).map((x) => x.x)), 0);
  assert.equal(off.filter((x) => x.kind === 'text').length, 0);
});

test('vạch phát Khung cột trên cả bài, dòng số giọng, trần số ô; mặc định tất định', () => {
  const p = at({ playheadMark: 'COLUMN', showPolyphony: true }, 1.5);
  finite(p);
  assert.equal(p.filter((x) => x.kind === 'poly').length, 1);
  assert.ok(p.some((x) => x.kind === 'text' && /Voices: 2/.test((x as TextPrim).text)), JSON.stringify(p.filter((x) => x.kind === 'text')));
  const many = rects(at({ rows: 'PITCH', span: 'WINDOW', cols: 600, maxRows: 128, pitchRangeMode: 'CUSTOM', pitchMin: 0, pitchMax: 127, emptyAlpha: 1, playheadColor: '' }, 2));
  assert.ok(many.length <= 6000, String(many.length));
  assert.deepEqual(at({}, 2.2), at({}, 2.2));
});
