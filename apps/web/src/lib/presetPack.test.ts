import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';
import { defaultScene, createWidget } from '@dawviz/render-core';
import { PRESET_LICENSES, PresetPackError, buildCollectionPack, buildPresetPack, presetFileName, readCollectionPack, readPresetPack, COLLECTION_MAX_PRESETS } from './presetPack.ts';
import { ALLOWED_LICENSES } from '../../../../scripts/preset-check/check.mjs';

const info = { name: 'Neon dọc', author: 'An', license: 'CC-BY-4.0', description: 'Thử' };
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const code = async (p: Promise<unknown>) => { try { await p; return 'ok'; } catch (e) { assert.ok(e instanceof PresetPackError, String(e)); return (e as PresetPackError).code; } };

test('tên tệp gói: slug không dấu + .dawviz-preset.zip', () => {
  assert.equal(presetFileName('Neon dọc: Đêm!'), 'neon-doc-dem.dawviz-preset.zip');
  assert.equal(presetFileName('***'), 'preset.dawviz-preset.zip');
});

test('scene: đóng gói kèm tài nguyên (băm), đọc lại đúng scene, tài nguyên và thông tin; nạp trùng tài nguyên chỉ một tệp', async () => {
  const sc = defaultScene('9:16'); sc.widgets.push({ ...createWidget(sc, 'TEXT') });
  const zip = await buildPresetPack(info, { kind: 'scene', scene: sc }, [{ name: 'logo.png', bytes: png }, { name: 'logo-copy.png', bytes: png }], new Date('2026-11-22T00:00:00Z'));
  const files = unzipSync(zip);
  assert.deepEqual(Object.keys(files).sort().map((f) => f.replace(/[0-9a-f]{16}/, 'H')), ['assets/asset-H-logo.png', 'preset.json']);
  const doc = JSON.parse(strFromU8(files['preset.json']));
  const schema = JSON.parse(fs.readFileSync(new URL('../../../../presets/schema/preset-pack.schema.json', import.meta.url), 'utf8'));
  for (const k of schema.required) assert.ok(k in doc, `thiếu ${k} theo preset-pack.schema.json`);
  assert.deepEqual(schema.properties.kind.enum, ['scene', 'note-style', 'easing', 'particle', 'collection']);
  assert.deepEqual(schema.properties.license.enum, [...PRESET_LICENSES]);
  const r = await readPresetPack(zip);
  assert.equal(r.info.name, 'Neon dọc'); assert.equal(r.payload.kind, 'scene');
  assert.deepEqual(r.payload.kind === 'scene' && r.payload.scene.widgets.map((w) => w.type), sc.widgets.map((w) => w.type));
  assert.deepEqual(r.assets.map((a) => [a.name, [...a.bytes]]), [['logo.png', [...png]]]);
  assert.deepEqual(r.warnings, []);
});

test('loại khác: kiểu nốt (kẹp, bỏ trường lạ), easing (bezier), hạt (qua bộ kiểm widget Hạt)', async () => {
  const ns = await readPresetPack(await buildPresetPack(info, { kind: 'note-style', style: { glow: 5, nope: 1 } as never }));
  assert.deepEqual(ns.payload, { kind: 'note-style', style: { glow: 1 } });
  const ez = await readPresetPack(await buildPresetPack(info, { kind: 'easing', bezier: [2, 9, 0.5, 1] }));
  assert.deepEqual(ez.payload, { kind: 'easing', bezier: [1, 2, 0.5, 1] });
  const pt = await readPresetPack(await buildPresetPack(info, { kind: 'particle', properties: { perNote: 9999, shape: 'SQUARE' } }));
  assert.equal(pt.payload.kind, 'particle'); assert.equal((pt.payload as { properties: { shape: string } }).properties.shape, 'SQUARE');
});

test('từ chối: giấy phép ngoài danh sách, thiếu tên/tác giả, sai băm, thiếu tài nguyên, không phải zip, loại lạ, bản mới hơn, đường dẫn ..', async () => {
  assert.equal(await code(buildPresetPack({ ...info, license: 'GPL-3.0' }, { kind: 'easing', bezier: [0, 0, 1, 1] })), 'ERR_PRESET_LICENSE');
  assert.equal(await code(buildPresetPack({ ...info, author: ' ' }, { kind: 'easing', bezier: [0, 0, 1, 1] })), 'ERR_PRESET_INVALID');
  const good = unzipSync(await buildPresetPack(info, { kind: 'scene', scene: defaultScene() }, [{ name: 'a.png', bytes: png }]));
  const asset = Object.keys(good).find((f) => f.startsWith('assets/'))!;
  assert.equal(await code(readPresetPack(zipSync({ ...good, [asset]: new Uint8Array([...png, 9]) }))), 'ERR_PRESET_HASH');
  const { [asset]: _gone, ...noAsset } = good;
  assert.equal(await code(readPresetPack(zipSync(noAsset))), 'ERR_PRESET_INVALID');
  assert.equal(await code(readPresetPack(strToU8('{}'))), 'ERR_PRESET_INVALID');
  const mk = (patch: object) => zipSync({ 'preset.json': strToU8(JSON.stringify({ ...JSON.parse(strFromU8(good['preset.json'])), ...patch })) });
  assert.equal(await code(readPresetPack(mk({ kind: 'virus', assets: [] }))), 'ERR_PRESET_INVALID');
  assert.equal(await code(readPresetPack(mk({ formatVersion: 99, assets: [] }))), 'ERR_PRESET_INVALID');
  assert.equal(await code(readPresetPack(mk({ license: 'Proprietary', assets: [] }))), 'ERR_PRESET_LICENSE');
  assert.equal(await code(readPresetPack(zipSync({ ...good, '../evil.txt': strToU8('x') }))), 'ERR_PRESET_INVALID');
  assert.equal(await code(readPresetPack(new Uint8Array(70 * 1024 * 1024))), 'ERR_PRESET_TOO_LARGE');
});

test('danh sách giấy phép trùng với script kiểm preset cộng đồng', () => {
  assert.deepEqual([...PRESET_LICENSES], [...ALLOWED_LICENSES]);
});

test('bộ preset (T-111, D-66 A): nhiều scene, không mốc thời gian; tài nguyên dùng chung khử trùng; đọc lại đúng từng scene', async () => {
  const a = defaultScene('16:9'), b = defaultScene('16:9'); b.widgets.push({ ...createWidget(b, 'TEXT') });
  const zip = await buildCollectionPack(info, [{ name: 'Mở đầu', description: 'đoạn mở, nền tối', scene: a }, { name: 'Điệp khúc', description: '', scene: b }], [{ name: 'logo.png', bytes: png }, { name: 'copy.png', bytes: png }]);
  const files = unzipSync(zip), doc = JSON.parse(strFromU8(files['preset.json']));
  assert.equal(doc.kind, 'collection'); assert.equal(Object.keys(files).filter((f) => f.startsWith('assets/')).length, 1);
  assert.ok(!('sequence' in doc.payload) && !('cues' in doc.payload)); // không kèm kịch bản thời gian
  const schema = JSON.parse(fs.readFileSync(new URL('../../../../presets/schema/preset-pack.schema.json', import.meta.url), 'utf8'));
  assert.ok(schema.properties.kind.enum.includes('collection') && schema.properties.payload.properties.presets);
  const r = await readCollectionPack(zip);
  assert.deepEqual(r.items.map((i) => [i.name, i.description]), [['Mở đầu', 'đoạn mở, nền tối'], ['Điệp khúc', '']]);
  assert.equal(r.items[1].scene.widgets.length, b.widgets.length); assert.equal(r.assets.length, 1); assert.equal(r.info.name, info.name);
});

test('bộ preset: gói lẻ và bộ không đọc nhầm nhau; rỗng, trùng tên, quá trần, sai giấy phép đều bị từ chối bằng mã', async () => {
  const sc = defaultScene('16:9');
  const one = await buildPresetPack(info, { kind: 'scene', scene: sc }), many = await buildCollectionPack(info, [{ name: 'A', description: '', scene: sc }]);
  assert.equal(await code(readCollectionPack(one)), 'ERR_PRESET_INVALID');
  assert.equal(await code(readPresetPack(many)), 'ERR_PRESET_INVALID'); // bản cũ/đọc lẻ: từ chối rõ, không bỏ qua thầm lặng
  assert.equal(await code(buildCollectionPack(info, [])), 'ERR_PRESET_INVALID');
  assert.equal(await code(buildCollectionPack(info, [{ name: 'A', description: '', scene: sc }, { name: 'A', description: '', scene: sc }])), 'ERR_PRESET_INVALID');
  assert.equal(await code(buildCollectionPack(info, Array.from({ length: COLLECTION_MAX_PRESETS + 1 }, (_, i) => ({ name: `P${i}`, description: '', scene: sc })))), 'ERR_PRESET_TOO_LARGE');
  assert.equal(await code(buildCollectionPack({ ...info, license: 'GPL-3.0' }, [{ name: 'A', description: '', scene: sc }])), 'ERR_PRESET_LICENSE');
  const bad = unzipSync(many), d = JSON.parse(strFromU8(bad['preset.json'])); d.payload.presets[0].kind = 'easing';
  assert.equal(await code(readCollectionPack(zipSync({ 'preset.json': strToU8(JSON.stringify(d)) }))), 'ERR_PRESET_INVALID');
});
