// T-07: đọc preset .json an toàn (REQ-STORAGE-02, REQ-STORAGE-04, NFR-SEC-04): hợp lệ, hỏng, độc hại, di trú 0.3 → 0.4.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { sanitizeScene, migrateScene, SCENE_SCHEMA_VERSION, PRESET_LIMITS, defaultScene } from '../src/index.ts';

const dir = new URL('../../../presets/scene/', import.meta.url);
const read = (u: URL) => JSON.parse(fs.readFileSync(u, 'utf8'));
const V03 = () => read(new URL('./fixtures/paper-1x1.v0.3.0.json', import.meta.url));

test('preset dựng sẵn (presets/scene/*.json) qua lược đồ: 0.4.0, không cảnh báo, mỗi layout có anchor, khớp scene.schema.json', () => {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
  assert.ok(files.includes('paper-1x1.json') && files.includes('paper-16x9.json'));
  const schema = read(new URL('../../../presets/schema/scene.schema.json', import.meta.url));
  const layoutProps = schema.properties.widgets.items.properties.layout.properties;
  for (const f of files) {
    const raw = read(new URL(f, dir));
    assert.equal(raw.schemaVersion, '0.4.0', f);
    assert.match(raw.schemaVersion, new RegExp(schema.properties.schemaVersion.pattern), f);
    assert.ok(fs.statSync(new URL(f, dir)).size < PRESET_LIMITS.maxBytes, f);
    const { scene, warnings } = sanitizeScene(raw);
    assert.deepEqual(warnings, [], f);
    for (const w of scene.widgets) assert.deepEqual(w.layout.anchor, { x: 0.5, y: 0.5 }, `${f}/${w.id}`);
    for (const w of raw.widgets) for (const k of Object.keys(w.layout)) assert.ok(k in layoutProps, `${f}: layout.${k} không có trong scene.schema.json`);
    assert.deepEqual(sanitizeScene(JSON.parse(JSON.stringify(scene))).scene, scene, f);
  }
});

test('di trú 0.3.0 → 0.4.0: thêm anchor = tâm, báo WARN_PRESET_MIGRATED, không sửa đối tượng vào; kết quả giống bản 0.4.0 dựng sẵn', () => {
  const old = V03();
  const frozen = JSON.stringify(old);
  const m = migrateScene(old);
  assert.equal(JSON.stringify(old), frozen, 'migrateScene không được sửa đối tượng vào');
  assert.equal(m.from, '0.3.0'); assert.equal(m.raw.schemaVersion, '0.4.0');
  assert.ok((m.raw.widgets as any[]).every((w) => w.layout.anchor.x === 0.5 && w.layout.anchor.y === 0.5));
  const { scene, warnings } = sanitizeScene(old);
  assert.equal(scene.schemaVersion, SCENE_SCHEMA_VERSION);
  assert.deepEqual(warnings.map((w) => [w.code, w.details.from, w.details.to]), [['WARN_PRESET_MIGRATED', '0.3.0', '0.4.0']]);
  assert.deepEqual(scene, sanitizeScene(read(new URL('paper-1x1.json', dir))).scene);
  // bản vá 0.3.x cũng di trú; giữ anchor đã có
  const p = V03(); p.schemaVersion = '0.3.7'; p.widgets[0].layout.anchor = { x: 0, y: 1 };
  const r = sanitizeScene(p);
  assert.deepEqual(r.scene.widgets[0].layout.anchor, { x: 0, y: 1 });
  assert.equal(r.warnings[0].details.from, '0.3.7');
});

test('phiên bản: mới hơn → ERR_SCHEMA_NEWER; quá cũ/sai dạng → ERR_PRESET_INVALID; khác bản vá 0.4.x → WARN_PRESET_VERSION', () => {
  const base = { canvas: {}, widgets: [] };
  for (const v of ['0.5.0', '1.0.0', '2.3.1']) assert.throws(() => sanitizeScene({ ...base, schemaVersion: v }), (e: any) => e.code === 'ERR_SCHEMA_NEWER' && e.details.found === v, v);
  for (const v of ['0.2.9', '0.0.1', 'abc', '0.3', '0.4.0-beta', '']) assert.throws(() => sanitizeScene({ ...base, schemaVersion: v }), (e: any) => e.code === 'ERR_PRESET_INVALID', v);
  assert.throws(() => sanitizeScene({ ...base, schemaVersion: 4 }), (e: any) => e.code === 'ERR_PRESET_INVALID');
  const r = sanitizeScene({ ...base, schemaVersion: '0.4.3' });
  assert.deepEqual(r.warnings.map((w) => w.code), ['WARN_PRESET_VERSION']);
});

test('preset hỏng: không phải đối tượng, thiếu trường, kiểu sai → ERR_PRESET_INVALID hoặc về mặc định kèm cảnh báo, không bao giờ văng lỗi lạ', () => {
  for (const raw of [null, 1, 'x', [], {}, { schemaVersion: '0.4.0' }, { schemaVersion: '0.4.0', canvas: 5 }])
    assert.throws(() => sanitizeScene(raw), (e: any) => e.code === 'ERR_PRESET_INVALID', JSON.stringify(raw));
  const r = sanitizeScene({ schemaVersion: '0.4.0', canvas: { designWidth: 'rộng', backgroundColor: 5 }, widgets: [
    { type: 'PIANO_ROLL', layout: { x: 'a', width: -5, anchor: { x: 7, y: 'b' } }, visible: 'yes' }, 42, { type: 'NOPE' }] });
  assert.equal(r.scene.canvas.designWidth, 1920);
  const l = r.scene.widgets[0].layout;
  assert.deepEqual([l.x, l.width, l.anchor], [0, 1, { x: 1, y: 0.5 }]);
  const codes = r.warnings.map((w) => w.code);
  assert.ok(codes.includes('WARN_PRESET_VALUE') && codes.includes('WARN_PRESET_WIDGET_UNKNOWN'));
  assert.equal(r.scene.widgets[0].visible, true);
});

test('rotation: chuẩn hoá về (−180, 180] rồi đưa về 0 kèm WARN_PRESET_UNSUPPORTED cho tới T-68; anchor ngoài 0..1 bị kẹp', () => {
  for (const rot of [15, 37, 90, 190, -270, 360]) {
    const s = defaultScene() as any; s.widgets[0].layout.rotation = rot;
    const r = sanitizeScene(JSON.parse(JSON.stringify(s)));
    assert.equal(r.scene.widgets[0].layout.rotation, 0, `rotation ${rot}`);
    assert.equal(r.warnings.some((w) => w.code === 'WARN_PRESET_UNSUPPORTED' && w.details.path === '$.widgets[0].layout.rotation'), rot % 360 !== 0, `rotation ${rot}`);
  }
});

test('preset độc hại: __proto__, constructor, prototype bị bỏ ở mọi độ sâu kèm WARN_PRESET_UNSAFE_KEY; không làm bẩn Object.prototype', () => {
  const text = `{"schemaVersion":"0.4.0","__proto__":{"polluted":1},"presetName":"x",
    "canvas":{"constructor":{"prototype":{"polluted":2}}},
    "widgets":[{"type":"PIANO_ROLL","id":"a","__proto__":{"polluted":3},
      "properties":{"noteStyle":{"base":{"__proto__":{"polluted":4}},"tracks":{"__proto__":{"opacity":0},"t1":{"opacity":0.5}}}}},
      {"type":"AUDIO_SPECTRUM","properties":{"bars":8,"__proto__":{"polluted":5},"deep":{"constructor":{"x":1}}}}]}`;
  const r = sanitizeScene(JSON.parse(text));
  assert.equal(({} as any).polluted, undefined);
  assert.equal((Object.prototype as any).polluted, undefined);
  const paths = r.warnings.filter((w) => w.code === 'WARN_PRESET_UNSAFE_KEY').map((w) => w.details.path);
  for (const p of ['$.__proto__', '$.canvas.constructor', '$.widgets[0].__proto__', '$.widgets[0].properties.noteStyle.base.__proto__', '$.widgets[0].properties.noteStyle.tracks.__proto__', '$.widgets[1].properties.__proto__', '$.widgets[1].properties.deep.constructor'])
    assert.ok(paths.includes(p), p);
  const pr: any = r.scene.widgets[0].properties;
  assert.deepEqual(Object.keys(pr.noteStyle.tracks), ['t1']);
  assert.deepEqual(r.scene.widgets[1].properties, { bars: 8, deep: {} });
  assert.equal(Object.getPrototypeOf(r.scene.widgets[1].properties), Object.prototype);
  assert.ok(!JSON.stringify(r.scene).includes('polluted'));
});

test('giới hạn: lồng quá sâu, quá nhiều nút/widget, chuỗi/mảng quá dài → ERR_PRESET_INVALID kèm đường dẫn', () => {
  const ok = { schemaVersion: '0.4.0', canvas: {}, widgets: [] as unknown[] };
  const deep: any = {}; let cur = deep; for (let i = 0; i < PRESET_LIMITS.maxDepth + 2; i++) { cur.n = {}; cur = cur.n; }
  const cases: [string, any][] = [
    ['sâu', { ...ok, widgets: [{ type: 'AUDIO_SPECTRUM', properties: deep }] }],
    ['widget', { ...ok, widgets: Array.from({ length: PRESET_LIMITS.maxWidgets + 1 }, (_, i) => ({ type: 'AUDIO_SPECTRUM', id: `w${i}` })) }],
    ['chuỗi', { ...ok, presetName: 'x'.repeat(PRESET_LIMITS.maxString + 1) }],
    ['mảng', { ...ok, widgets: [{ type: 'AUDIO_SPECTRUM', properties: { a: new Array(PRESET_LIMITS.maxArray + 1).fill(0) } }] }],
    ['nút', { ...ok, widgets: Array.from({ length: 40 }, () => ({ type: 'AUDIO_SPECTRUM', properties: { a: Array.from({ length: 900 }, () => 1) } })).slice(0, 63) }],
  ];
  for (const [name, raw] of cases) assert.throws(() => sanitizeScene(raw), (e: any) => e.code === 'ERR_PRESET_INVALID' && typeof e.details.path === 'string', name);
});
