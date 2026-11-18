// Bảng khai báo Thiết lập (widgetFields.ts): mọi thiết lập đều có ↺ và khôi phục được. Bắt thiết lập thêm mới mà quên khai báo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ADDABLE_WIDGETS, widgetDefaults, sanitizeScene, SCENE_SCHEMA_VERSION } from '@dawviz/render-core';
import { SETTINGS_EXEMPT, WIDGET_FIELDS, advancedEdited, fieldChanged, getIn, resetPatch, setIn, type FieldDef } from './widgetFields.ts';

type Obj = Record<string, unknown>;
const types = ADDABLE_WIDGETS.filter((t) => t !== 'PIANO_ROLL');

test('mọi thuộc tính của mặc định là một thiết lập trong bảng, hoặc nằm trong danh sách miễn (kiểu chữ, căn lề…)', () => {
  for (const type of types) {
    const defaults = widgetDefaults(type), covered = new Set((WIDGET_FIELDS[type] ?? []).map((f) => f.path[0]));
    const exempt = new Set(SETTINGS_EXEMPT[type] ?? []);
    for (const k of Object.keys(defaults)) assert.ok(covered.has(k) || exempt.has(k), `${type}.${k}: thêm vào WIDGET_FIELDS (để có ↺) hoặc vào SETTINGS_EXEMPT kèm lý do`);
    for (const k of exempt) assert.ok(k in defaults, `${type}: SETTINGS_EXEMPT có "${k}" nhưng mặc định không có`);
    for (const f of WIDGET_FIELDS[type] ?? []) assert.notEqual(getIn(defaults, f.path), undefined, `${type}.${f.path.join('.')} không có trong mặc định`);
  }
});

/** Giá trị khác giá trị hiện tại, hợp lệ với kiểu điều khiển. */
function other(f: FieldDef, v: unknown): unknown {
  switch (f.kind) {
    case 'check': return !v;
    case 'num': return Number(v) + f.num!.step <= f.num!.max ? Number(v) + f.num!.step : Number(v) - f.num!.step;
    case 'choice': case 'select': return f.options!.find((o) => o !== v);
    case 'color': return v === '#123456' ? '#654321' : '#123456';
    case 'colorOpt': return v === '' ? '#123456' : '';
    case 'text': return `${String(v)}x`.slice(0, f.text?.max ?? 200);
  }
}

test('đổi bất kỳ thiết lập nào khỏi mốc thì ↺ hiện; khôi phục trả đúng giá trị, không đụng thiết lập khác', () => {
  for (const type of types) {
    const R = widgetDefaults(type);
    for (const f of WIDGET_FIELDS[type] ?? []) {
      const P0 = structuredClone(R), v = getIn(R, f.path), nv = other(f, v);
      assert.notEqual(nv, v, `${type}.${f.path.join('.')}`);
      assert.equal(fieldChanged(f, P0, R), false);
      const P1 = { ...P0, ...{ [f.path[0]]: setIn(P0, f.path, nv)[f.path[0]] } };
      assert.equal(fieldChanged(f, P1, R), true, `${type}.${f.path.join('.')}`);
      for (const g of WIDGET_FIELDS[type]!) if (g !== f && g.path.join('.') !== f.path.join('.')) assert.equal(fieldChanged(g, P1, R), false, `${f.path.join('.')} làm ${g.path.join('.')} bị coi là đã đổi`);
      const back = { ...P1, ...resetPatch(f, P1, R) };
      assert.deepEqual(back, R, `${type}.${f.path.join('.')}`);
    }
  }
});

test('mỗi khoá cấp trên của bản vá khôi phục giữ nguyên các nhánh anh em (lines.played không làm mất lines.total)', () => {
  const R = widgetDefaults('EVENT_COUNTER') as Obj, f = WIDGET_FIELDS.EVENT_COUNTER!.find((x) => x.path.join('.') === 'lines.total.template')!;
  const P = { ...R, lines: { ...(R.lines as Obj), total: { enabled: true, template: 'khác' }, played: { enabled: false, template: 'cũ' } } };
  const patch = resetPatch(f, P, R);
  assert.deepEqual(Object.keys(patch), ['lines']);
  const lines = patch.lines as Obj;
  assert.deepEqual(lines.total, { enabled: true, template: (R.lines as Obj).total && ((R.lines as Obj).total as Obj).template });
  assert.deepEqual(lines.played, { enabled: false, template: 'cũ' }); // thiết lập khác trong cùng nhánh không bị khôi phục theo
});

test('dấu "đã chỉnh nâng cao": chỉ tính thiết lập nâng cao khác mốc (kể cả khi đang bị ẩn bởi điều kiện) và chọn track tay', () => {
  const R = widgetDefaults('LIVE_TRIGGER') as Obj;
  const w = { type: 'LIVE_TRIGGER' as const, trackMappingMode: 'ALL' as const };
  assert.equal(advancedEdited(w, R, R), false);
  assert.equal(advancedEdited(w, { ...R, tailMs: 1 }, R), true);
  assert.equal(advancedEdited(w, { ...R, mode: 'inline' }, R), false);          // mode là thiết lập Cơ bản
  assert.equal(advancedEdited({ ...w, trackMappingMode: 'MANUAL' }, R, R), true);
  assert.equal(advancedEdited({ type: 'TEXT', trackMappingMode: 'MANUAL' }, widgetDefaults('TEXT'), widgetDefaults('TEXT')), false); // Ô chữ: chọn track ở Cơ bản
  assert.equal(advancedEdited(w, R, undefined), false);                          // không có mốc: không có gì để so
});

test('mặc định của loại qua lược đồ không cảnh báo (mốc ↺ của widget mới hợp lệ)', () => {
  for (const type of types) {
    const { warnings } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'w', type, properties: widgetDefaults(type), layout: { x: 0, y: 0, width: 100, height: 50 } }] });
    assert.deepEqual(warnings, [], type);
  }
});
