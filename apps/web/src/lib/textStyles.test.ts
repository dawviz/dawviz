// T-126: kiểu chữ dùng chung — đếm chỗ dùng, đổi tên, xoá kiểu (chỗ dùng về kiểu gốc), Thư viện của tôi, lệnh có hoàn tác.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_TEXT_STYLES, BASE_TEXT_STYLE, type SceneDocument, type TextStyleSet, type WidgetSpec } from '@dawviz/render-core';
import { MAX_LIBRARY, addToLibrary, copyFromLibrary, deleteTextStyle, isBuiltinStyle, loadLibrary, removeFromLibrary, renameTextStyle, sanitizeLibrary, saveLibrary, styleUseCounts, type LibraryStyle } from './textStyles.ts';
import { deleteTextStyle as deleteCmd, renameTextStyle as renameCmd, setTextStyles, type Doc } from './commands.ts';
import { describeCommand } from './historyLabels.ts';

const mine = { ...BASE_TEXT_STYLE, size: 40, name: 'Lớn' };
const styles: TextStyleSet = { ...DEFAULT_TEXT_STYLES, big: mine };
const w = (id: string, type: string, properties: Record<string, unknown>) => ({ id, type, properties }) as unknown as WidgetSpec;
const scene = {
  textStyles: styles,
  widgets: [
    w('info', 'TRACK_INFO', { titleStyle: { styleId: 'big', italic: true }, artistStyle: {} }),
    w('txt', 'TEXT', { style: { styleId: 'big' }, valueStyle: { size: 9 } }),
    w('pr', 'PIANO_ROLL', {}),
  ],
  comps: { c1: { name: 'Comp', widgets: [w('t2', 'TEXT', { style: { styleId: 'big' } }), w('t3', 'TEXT', { style: { styleId: 'gone' } })] } },
} as unknown as SceneDocument;

test('styleUseCounts: đếm ở gốc và trong precomp; chỗ chưa chọn kiểu tính cho kiểu gốc; kiểu không tồn tại về kiểu gốc', () => {
  const c = styleUseCounts(scene);
  assert.equal(c.big, 3);        // tiêu đề TRACK_INFO, TEXT ở gốc, TEXT trong comp
  assert.equal(c.subtitle, 1);   // artistStyle chưa chọn kiểu → kiểu gốc 'subtitle'
  assert.equal(c.body, 1);       // t3 trỏ kiểu đã mất → kiểu gốc 'body'
  assert.equal(c.title, undefined);
});

test('renameTextStyle: đổi tên, cắt 60 ký tự; tên rỗng/không đổi/không có kiểu → null', () => {
  assert.equal(renameTextStyle(styles, 'big', '  To  ')!.big.name, 'To');
  assert.equal(renameTextStyle(styles, 'big', 'x'.repeat(80))!.big.name.length, 60);
  assert.equal(renameTextStyle(styles, 'big', '   '), null);
  assert.equal(renameTextStyle(styles, 'big', 'Lớn'), null);
  assert.equal(renameTextStyle(styles, 'nope', 'A'), null);
  assert.equal(renameTextStyle(styles, 'title', 'Đầu đề')!.title.name, 'Đầu đề'); // kiểu dựng sẵn đổi tên được
});

test('deleteTextStyle: bỏ kiểu, mọi chỗ dùng (gốc + precomp) bỏ styleId nhưng giữ ghi đè; kiểu dựng sẵn không xoá được', () => {
  assert.ok(isBuiltinStyle('title') && !isBuiltinStyle('big'));
  assert.equal(deleteTextStyle(scene, 'title'), null);
  assert.equal(deleteTextStyle(scene, 'nope'), null);
  const r = deleteTextStyle(scene, 'big')!;
  assert.equal(r.textStyles!.big, undefined);
  assert.ok(r.textStyles!.title);
  assert.deepEqual((r.widgets[0].properties as any).titleStyle, { italic: true });
  assert.deepEqual((r.widgets[1].properties as any).style, {});
  assert.deepEqual((r.widgets[1].properties as any).valueStyle, { size: 9 });
  assert.equal(r.widgets[2], scene.widgets[2]); // widget không đổi giữ nguyên đối tượng
  assert.deepEqual((r.comps!.c1.widgets[0].properties as any).style, {});
  assert.deepEqual((r.comps!.c1.widgets[1].properties as any).style, { styleId: 'gone' });
  assert.equal(styleUseCounts({ ...scene, ...r } as SceneDocument).big, undefined);
});

test('Thư viện: thêm, cùng tên thì thay, xoá, giới hạn 64', () => {
  let lib: LibraryStyle[] = addToLibrary([], 'Tiêu đề lớn', { ...mine })!;
  assert.equal(lib.length, 1); assert.equal(lib[0].name, 'Tiêu đề lớn'); assert.equal(lib[0].style.size, 40);
  assert.equal((lib[0].style as any).name, undefined);
  lib = addToLibrary(lib, 'Tiêu đề lớn', { ...mine, size: 50 })!;
  assert.equal(lib.length, 1); assert.equal(lib[0].style.size, 50);
  lib = addToLibrary(lib, 'Tiêu đề lớn 2', mine)!;
  assert.equal(lib.length, 2); assert.notEqual(lib[0].id, lib[1].id);
  assert.equal(addToLibrary(lib, '  ', mine), null);
  assert.deepEqual(removeFromLibrary(lib, lib[0].id).map((x) => x.name), ['Tiêu đề lớn 2']);
  let full: LibraryStyle[] = [];
  for (let i = 0; i < MAX_LIBRARY; i++) full = addToLibrary(full, `Kiểu ${i}`, mine)!;
  assert.equal(full.length, 64); assert.equal(new Set(full.map((x) => x.id)).size, 64);
  assert.equal(addToLibrary(full, 'Thêm', mine), null);           // đầy
  assert.equal(addToLibrary(full, 'Kiểu 3', mine)!.length, 64);   // cùng tên vẫn thay được
});

test('Thư viện: đọc từ localStorage hỏng thì bỏ mục sai, trường sai loại theo kiểu nền; lưu rồi đọc lại', () => {
  const lib = sanitizeLibrary([{ id: 'a', name: 'A', style: { size: 'to', color: '#FF0000', stroke: { width: 3, color: 1 }, bogus: 1 } }, { id: 'a', name: 'trùng' }, null, { id: 'b', name: '' }, 5]);
  assert.equal(lib.length, 1);
  assert.equal(lib[0].style.size, BASE_TEXT_STYLE.size);
  assert.equal(lib[0].style.color, '#FF0000');
  assert.equal(lib[0].style.stroke.width, 3); assert.equal(lib[0].style.stroke.color, BASE_TEXT_STYLE.stroke.color);
  assert.equal((lib[0].style as any).bogus, undefined);
  assert.equal(sanitizeLibrary(Array.from({ length: 70 }, (_, i) => ({ id: `s${i}`, name: `S${i}`, style: {} }))).length, 64);
  const mem = new Map<string, string>();
  (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  try {
    assert.deepEqual(loadLibrary(), []);
    saveLibrary(lib); assert.deepEqual(loadLibrary(), lib);
  } finally { delete (globalThis as any).localStorage; }
});

test('copyFromLibrary: id mới không trùng, giữ tên; dự án đủ 64 kiểu → null', () => {
  const item: LibraryStyle = { id: 'big', name: 'Lớn', style: { ...BASE_TEXT_STYLE, size: 33 } };
  const r = copyFromLibrary(styles, item)!;
  assert.notEqual(r.id, 'big'); assert.ok(!styles[r.id]);
  assert.equal(r.set[r.id].name, 'Lớn'); assert.equal(r.set[r.id].size, 33);
  assert.equal(r.set.big, styles.big);
  const many = Object.fromEntries(Array.from({ length: 64 }, (_, i) => [`s${i}`, mine])) as TextStyleSet;
  assert.equal(copyFromLibrary(many, item), null);
});

const doc = (s: SceneDocument) => ({ videoStyle: 'custom', scene: s, brightness: {}, order: [], hidden: [], solo: [], audioOffsetMs: 0, lookRef: {}, layoutRef: {}, propsRef: {} }) as unknown as Doc;
const ctx = { i18n: { t: (k: string, p?: Record<string, unknown>) => `${k}${p ? JSON.stringify(p) : ''}`, has: () => true, number: (n: number) => String(n) }, trackName: (id: string) => id, widgetName: (id: string) => id };

test('lệnh: xoá kiểu một bước hoàn tác (cả precomp), đổi tên, chép từ thư viện; nhãn lịch sử', () => {
  const d = doc(scene);
  const del = deleteCmd(d, 'big')!;
  const after = del.redo(d);
  assert.equal(after.scene.textStyles!.big, undefined);
  assert.deepEqual((after.scene.comps!.c1.widgets[0].properties as any).style, {});
  assert.deepEqual(del.undo(after).scene, scene);
  assert.equal(deleteCmd(d, 'title'), null);
  assert.match(describeCommand(del, ctx as never), /web\.hist\.textStyleDelete.*Lớn/);
  const noComps = { ...scene } as SceneDocument; delete (noComps as { comps?: unknown }).comps;
  const d2 = doc(noComps), c2 = deleteCmd(d2, 'big')!;
  assert.ok(!('comps' in c2.redo(d2).scene));

  const ren = renameCmd(d, 'big', 'Rất lớn')!;
  assert.equal(ren.redo(d).scene.textStyles!.big.name, 'Rất lớn');
  assert.equal(ren.undo(ren.redo(d)).scene.textStyles!.big.name, 'Lớn');
  assert.equal(renameCmd(d, 'big', 'Lớn'), null);
  assert.match(describeCommand(ren, ctx as never), /textStyleRename.*"from":"Lớn".*"name":"Rất lớn"/);

  const r = copyFromLibrary(styles, { id: 'x', name: 'Từ thư viện', style: BASE_TEXT_STYLE })!;
  const lib = setTextStyles(d, r.set, 'txt', 'style', { styleId: r.id }, 'library')!;
  const d3 = lib.redo(d);
  assert.equal((d3.scene.widgets[1].properties as any).style.styleId, r.id);
  assert.equal(d3.scene.textStyles![r.id].name, 'Từ thư viện');
  assert.deepEqual(lib.undo(d3).scene, scene);
  assert.equal(lib.label, 'web.cmd.textStyleLibrary');
  assert.match(describeCommand(lib, ctx as never), /textStyleLibrary/);
});
