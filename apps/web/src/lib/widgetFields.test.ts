// Bảng khai báo Thiết lập (widgetFields.ts): mọi thiết lập đều có ↺ và khôi phục được. Bắt thiết lập thêm mới mà quên khai báo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ADDABLE_WIDGETS, widgetDefaults, sanitizeScene, SCENE_SCHEMA_VERSION } from '@dawviz/render-core';
import { SETTINGS_EXEMPT, WIDGET_FIELDS, WIDGET_SECTIONS, fieldGroups, sectionOn, advancedEdited, fieldChanged, getIn, resetPatch, setIn, withNestedDefaults, type FieldDef } from './widgetFields.ts';

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

test('Piano Roll (T-58/T-51/T-59, lưới ô nhịp): mọi thiết lập có trong mặc định, ↺ hiện khi đổi và khôi phục đúng; mặc định qua lược đồ không cảnh báo', () => {
  const R = widgetDefaults('PIANO_ROLL'), fields = WIDGET_FIELDS.PIANO_ROLL!;
  for (const k of ['flowAngle', 'playheadStyle', 'playheadHit', 'grid', 'keyboard']) assert.ok(fields.some((f) => f.path[0] === k), k);
  for (const f of fields) {
    const v = getIn(R, f.path), nv = other(f, v);
    assert.notEqual(v, undefined, f.path.join('.'));
    const P1 = { ...R, ...{ [f.path[0]]: setIn(R, f.path, nv)[f.path[0]] } };
    assert.equal(fieldChanged(f, P1, R), true, f.path.join('.'));
    for (const g of fields) if (g.path.join('.') !== f.path.join('.')) assert.equal(fieldChanged(g, P1, R), false, `${f.path.join('.')} làm ${g.path.join('.')} bị coi là đã đổi`);
    assert.deepEqual({ ...P1, ...resetPatch(f, P1, R) }, R, f.path.join('.'));
  }
  const { warnings } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'w', type: 'PIANO_ROLL', properties: R, layout: { x: 0, y: 0, width: 100, height: 50 } }] });
  assert.deepEqual(warnings, []);
  // tài liệu cũ thiếu trường mới: bảng Thiết lập đọc trên bản đã điền mặc định
  const old = { ...R } as Obj; delete old.grid; delete old.flowAngle;
  const P = withNestedDefaults('PIANO_ROLL', old);
  assert.equal(getIn(P, ['grid', 'opacity']), (R.grid as Obj).opacity); assert.equal(P.flowAngle, 0);
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

test('nhóm thiết lập (D-71): đường dẫn của nhóm có thật, không ô nào ở hai nhóm, ô tiêu đề là công tắc hoặc danh sách', () => {
  for (const [type, secs] of Object.entries(WIDGET_SECTIONS)) {
    const paths = new Set((WIDGET_FIELDS[type as keyof typeof WIDGET_FIELDS] ?? []).map((f) => f.path.join('.')));
    const seen = new Set<string>();
    for (const s of secs ?? []) {
      for (const p of s.fields) { assert.ok(paths.has(p), `${type}.${s.id}: "${p}" không có trong WIDGET_FIELDS`); assert.ok(!seen.has(p), `${type}: "${p}" ở hai nhóm`); seen.add(p); }
      if (s.head) {
        assert.ok(s.fields.includes(s.head), `${type}.${s.id}: ô tiêu đề phải thuộc nhóm`);
        const f = WIDGET_FIELDS[type as keyof typeof WIDGET_FIELDS]!.find((x) => x.path.join('.') === s.head)!;
        assert.ok(f.kind === 'check' || f.kind === 'choice' || f.kind === 'select', `${type}.${s.id}: ô tiêu đề là ${f.kind}`);
        assert.ok(f.kind === 'check' || !!s.on, `${type}.${s.id}: danh sách ở tiêu đề cần \`on\` (giá trị nào là tắt)`);
      }
    }
    const groups = fieldGroups(type as keyof typeof WIDGET_FIELDS);
    assert.equal(groups.reduce((n, g) => n + g.fields.length + (g.head ? 1 : 0), 0), paths.size + (WIDGET_FIELDS[type as keyof typeof WIDGET_FIELDS]!.length - paths.size), `${type}: chia nhóm làm mất hoặc lặp ô`);
  }
});

test('nhóm có công tắc: sectionOn theo ô tiêu đề; danh sách có "Tắt" theo \`on\`', () => {
  const curve = WIDGET_SECTIONS.TEMPO_INFO!.find((s) => s.id === 'curve')!;
  assert.equal(sectionOn(curve, { showCurve: true }), true);
  assert.equal(sectionOn(curve, { showCurve: false }), false);
  const aura = WIDGET_SECTIONS.NOTATION!.find((s) => s.id === 'aura')!;
  assert.equal(sectionOn(aura, { aura: 'OFF' }), false);
  assert.equal(sectionOn(aura, { aura: 'BEAT' }), true);
  for (const [id, off, on] of [['reveal', 'NONE', 'WRITE'], ['erase', 'NONE', 'RANDOM']] as const) { // T-132
    const s = WIDGET_SECTIONS.NOTATION!.find((x) => x.id === id)!;
    assert.equal(s.head, id); assert.equal(sectionOn(s, { [id]: off }), false); assert.equal(sectionOn(s, { [id]: on }), true);
  }
  const glow = WIDGET_SECTIONS.NOTATION!.find((s) => s.id === 'glow')!;
  assert.equal(sectionOn(glow, {}), true, 'nhóm không có công tắc luôn bật (0 là tắt nằm ở chính ô số, D-71 quy tắc 1)');
});

test('quy tắc 2 (D-71): ô phụ của phát sáng/phóng to Bản nhạc ẩn khi ô chính là 0 hoặc 1', () => {
  const nt = WIDGET_FIELDS.NOTATION!, at = (p: string) => nt.find((f) => f.path.join('.') === p)!;
  const P = withNestedDefaults('NOTATION', widgetDefaults('NOTATION') as Obj);
  assert.equal(at('glowSize').when!({ ...P, glow: 0 }), false);
  assert.equal(at('glowSize').when!({ ...P, glow: 0.5 }), true);
  assert.equal(at('zoomMode').when!({ ...P, zoom: 1 }), false);
  assert.equal(at('zoomMode').when!({ ...P, zoom: 1.4 }), true);
  // T-132: ô phụ viết tay/xoá theo lựa chọn ở tiêu đề nhóm; tỉ lệ và seed chỉ cho Ngẫu nhiên
  assert.equal(at('writeMs').when!({ ...P, reveal: 'NONE' }), false); assert.equal(at('writeMs').when!({ ...P, reveal: 'WRITE' }), true);
  assert.equal(at('eraseAfterBars').when!({ ...P, erase: 'NONE' }), false); assert.equal(at('eraseAfterBars').when!({ ...P, erase: 'AFTER' }), true);
  assert.equal(at('eraseAmount').when!({ ...P, erase: 'AFTER' }), false); assert.equal(at('eraseSeed').when!({ ...P, erase: 'RANDOM' }), true);
});

test('T-130 Phổ tần: ô của nhóm Đỉnh chỉ hiện khi kiểu Cột/Chấm và công tắc Chấm đỉnh bật (D-71)', () => {
  const R = widgetDefaults('AUDIO_SPECTRUM') as Obj, peak = ['capFall', 'peakStyle', 'peakHold', 'peakGravity', 'peakColor'];
  const shown = (P: Obj) => (WIDGET_FIELDS.AUDIO_SPECTRUM ?? []).filter((f) => f.when?.(P) ?? true).map((f) => f.path[0]);
  for (const k of peak) {
    assert.ok(!shown(R).includes(k), `${k} ẩn khi tắt`);
    assert.ok(shown({ ...R, peakCap: true }).includes(k) && shown({ ...R, style: 'DOTS', peakCap: true }).includes(k), `${k} hiện khi bật`);
    assert.ok(!shown({ ...R, style: 'AREA', peakCap: true }).includes(k), `${k} ẩn với kiểu Vùng`);
  }
  assert.ok(shown(R).includes('peakCap'));
});

test('T-125: mọi loại có hơn 6 ô đều chia nhóm (D-71); loại ít ô để phẳng', () => {
  // Thanh tiến độ: 7 ô, Cơ bản chỉ thấy 5, một cặp bật/tắt (Hiện thời gian + mẫu, ô mẫu đã ẩn khi tắt): để phẳng.
  const FLAT = new Set(['PROGRESS_BAR']);
  for (const [type, fields] of Object.entries(WIDGET_FIELDS)) {
    if ((fields ?? []).length > 6 && !FLAT.has(type)) assert.ok(WIDGET_SECTIONS[type as keyof typeof WIDGET_SECTIONS]?.length, `${type}: ${fields!.length} ô mà chưa có nhóm`);
  }
});

test('T-125: Piano Roll có công tắc Vạch phát và Bàn phím ở tiêu đề nhóm (ghi đúng thuộc tính bool sẵn có)', () => {
  const secs = WIDGET_SECTIONS.PIANO_ROLL!, R = widgetDefaults('PIANO_ROLL') as Obj;
  assert.equal(secs.find((s) => s.id === 'playhead')!.head, 'playheadVisible');
  assert.equal(secs.find((s) => s.id === 'keyboard')!.head, 'keyboard.enabled');
  const kb = secs.find((s) => s.id === 'keyboard')!;
  assert.equal(sectionOn(kb, R), true);
  assert.equal(sectionOn(kb, { ...R, keyboard: { ...(R.keyboard as Obj), enabled: false } }), false);
  const groups = fieldGroups('PIANO_ROLL');
  assert.equal(groups.find((g) => g.sec?.id === 'playhead')!.head!.path.join('.'), 'playheadVisible');
});

/** Ô hiện theo điều kiện `when` với thuộc tính mặc định + phần ghi đè (D-72; chứng minh không đổi hình ở packages/render-core/test/inert-props.test.ts). */
const visible = (type: keyof typeof WIDGET_FIELDS, path: string, over: Obj): boolean => {
  const f = WIDGET_FIELDS[type]!.find((x) => x.path.join('.') === path)!;
  const P = { ...(withNestedDefaults(type, widgetDefaults(type) as Obj)), ...over };
  return f.when?.(P) ?? true;
};
test('T-125 (D-72): ô không có tác dụng với kiểu đang chọn thì ẩn, có tác dụng thì hiện', () => {
  const cases: [keyof typeof WIDGET_FIELDS, string, Obj[], Obj[]][] = [
    ['AUDIO_SPECTRUM', 'shape', [{ style: 'METER' }], [{}]],
    ['AUDIO_SPECTRUM', 'radius', [{ style: 'METER', shape: 'CIRCLE' }, { shape: 'LINE' }], [{ shape: 'CIRCLE' }]],
    ['AUDIO_SPECTRUM', 'startAngle', [{ style: 'METER', shape: 'CIRCLE' }], [{ shape: 'CIRCLE' }]],
    ['AUDIO_SPECTRUM', 'angle', [{ shape: 'CIRCLE' }], [{}, { style: 'METER', shape: 'CIRCLE' }]],
    ['AUDIO_SPECTRUM', 'length', [{ shape: 'CIRCLE' }], [{}, { style: 'METER', shape: 'CIRCLE' }]],
    ['AUDIO_SPECTRUM', 'mirror', [{ style: 'METER' }, { style: 'DOTS', shape: 'CIRCLE' }, { style: 'WAVEFORM', shape: 'CIRCLE' }], [{ shape: 'CIRCLE' }, { style: 'AREA' }]],
    ['AUDIO_SPECTRUM', 'reverse', [{ style: 'OSCILLOSCOPE' }, { style: 'WAVEFORM' }, { style: 'METER' }], [{}, { style: 'LINE' }]],
    ['AUDIO_SPECTRUM', 'colorMode', [{ style: 'AREA' }, { style: 'LINE' }, { style: 'OSCILLOSCOPE' }, { style: 'WAVEFORM' }], [{}, { style: 'DOTS' }, { style: 'METER' }]],
    ['AUDIO_SPECTRUM', 'colorB', [{ style: 'AREA', colorMode: 'GRADIENT' }, { colorMode: 'SOLID' }], [{ colorMode: 'GRADIENT' }]],
    ['AUDIO_SPECTRUM', 'barWidth', [{ style: 'AREA' }, { style: 'METER' }], [{}, { style: 'LINE' }]],
    ['AUDIO_SPECTRUM', 'roundness', [{ style: 'AREA' }, { style: 'LINE' }, { style: 'DOTS' }, { style: 'OSCILLOSCOPE' }], [{}, { style: 'WAVEFORM' }, { style: 'METER' }]],
    ['AUDIO_SPECTRUM', 'minLen', [{ style: 'OSCILLOSCOPE' }, { style: 'METER' }], [{}]],
    ...(['attackMs', 'releaseMs', 'minHz', 'maxHz'] as const).map((p): [keyof typeof WIDGET_FIELDS, string, Obj[], Obj[]] => ['AUDIO_SPECTRUM', p, [{ style: 'OSCILLOSCOPE' }, { style: 'WAVEFORM' }, { style: 'METER' }], [{}]]),
    ['AUDIO_SPECTRUM', 'floorDb', [{ style: 'OSCILLOSCOPE' }, { style: 'WAVEFORM' }], [{}, { style: 'METER' }]],
    ['AUDIO_SPECTRUM', 'ceilDb', [{ style: 'OSCILLOSCOPE' }, { style: 'WAVEFORM' }], [{}, { style: 'METER' }]],
    ['VELOCITY', 'colorMode', [{ mode: 'HISTOGRAM' }], [{ mode: 'LEVEL' }]],
    ['VELOCITY', 'gap', [{ mode: 'LEVEL', perTrack: false }], [{ mode: 'LEVEL', perTrack: true }, { mode: 'HISTOGRAM' }]],
    ['VELOCITY', 'color', [{ mode: 'LEVEL', perTrack: true, colorMode: 'TRACK' }], [{ mode: 'LEVEL', perTrack: false, colorMode: 'TRACK' }, { mode: 'HISTOGRAM' }]],
    ['DEGREE', 'labelSticky', [{ labelAlign: 'END' }], [{ labelAlign: 'START' }, { labelAlign: 'CENTER' }]],
    ['CHORD_DETECTION', 'notesTemplate', [{ alwaysShowNotes: false, unrecognized: 'nc' }], [{ alwaysShowNotes: true }, { alwaysShowNotes: false, unrecognized: 'notes' }]],
    ['EVENT_COUNTER', 'lineHeight', [{ lines: { played: { enabled: true }, total: { enabled: false }, progress: { enabled: false }, tempo: { enabled: false } } }],
      [{ lines: { played: { enabled: true }, total: { enabled: true }, progress: { enabled: false }, tempo: { enabled: false } } }]],
    // Lưới nốt (D-77)
    ...(['grid', 'playheadRatio', 'beatLines', 'smooth'] as const).map((p): [keyof typeof WIDGET_FIELDS, string, Obj[], Obj[]] => ['NOTE_GRID', p, [{ span: 'SONG' }], [{ span: 'WINDOW' }]]),
    ['NOTE_GRID', 'pitchRangeMode', [{ rows: 'TRACK' }], [{ rows: 'PITCH' }]],
    ...(['pitchMin', 'pitchMax'] as const).map((p): [keyof typeof WIDGET_FIELDS, string, Obj[], Obj[]] => ['NOTE_GRID', p, [{ rows: 'TRACK', pitchRangeMode: 'CUSTOM' }, { rows: 'PITCH', pitchRangeMode: 'FIT_CONTENT' }], [{ rows: 'PITCH', pitchRangeMode: 'CUSTOM' }]]),
    ['NOTE_GRID', 'dotSize', [{ shape: 'FILL' }], [{ shape: 'ROUND' }, { shape: 'SQUARE' }, { shape: 'BAR' }]],
    ['NOTE_GRID', 'cellGap', [{ shape: 'ROUND' }, { shape: 'SQUARE' }], [{ shape: 'FILL' }, { shape: 'BAR' }]],
    ...(['activeScale', 'velocitySize'] as const).map((p): [keyof typeof WIDGET_FIELDS, string, Obj[], Obj[]] => ['NOTE_GRID', p, [{ shape: 'FILL' }, { shape: 'BAR' }], [{ shape: 'ROUND' }, { shape: 'SQUARE' }]]),
    ['NOTE_GRID', 'velocityMin', [{ shape: 'ROUND', velocitySize: false }, { shape: 'FILL', velocitySize: true }], [{ shape: 'ROUND', velocitySize: true }]],
    ['NOTE_GRID', 'color', [{ rows: 'TRACK', colorMode: 'TRACK' }], [{ colorMode: 'SOLID' }, { rows: 'PITCH', colorMode: 'TRACK' }]],
    ['NOTE_GRID', 'minAlpha', [{ light: 'NOTES' }], [{ light: 'DENSITY' }, { light: 'VELOCITY' }]],
    ['NOTE_GRID', 'emptyColorB', [{ emptyColor: '' }], [{ emptyColor: '#123456' }]],
    ...(['playheadMark', 'playheadWidth'] as const).map((p): [keyof typeof WIDGET_FIELDS, string, Obj[], Obj[]] => ['NOTE_GRID', p, [{ playheadColor: '' }], [{ playheadColor: '#ffffff' }]]),
    ['NOTE_GRID', 'polyTemplate', [{ showPolyphony: false }], [{ showPolyphony: true }]],
  ];
  for (const [type, path, hidden, shown] of cases) {
    for (const h of hidden) assert.equal(visible(type, path, h), false, `${type}.${path} phải ẩn khi ${JSON.stringify(h)}`);
    for (const s of shown) assert.equal(visible(type, path, s), true, `${type}.${path} phải hiện khi ${JSON.stringify(s)}`);
  }
});
