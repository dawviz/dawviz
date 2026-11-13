// T-07: mở/lưu preset. Cỡ tệp kiểm trước khi đọc; JSON hỏng; preset độc hại; vòng lưu → mở; paper-1x1 qua lược đồ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PRESET_LIMITS, defaultScene } from '@dawviz/render-core';
import { parsePresetText, readPresetFile, serializePreset, presetFileName } from './presetFile.ts';
import { PAPER_SCENE } from './videoScenes.ts';

const file = (text: string, size = text.length, name = 'x.json') => ({ name, size, text: async () => { read++; return text; } });
let read = 0;

test('paper-1x1 (T-69) qua được lược đồ không cảnh báo; lưu → mở lại cho đúng scene đó', async () => {
  const raw = fs.readFileSync(new URL('../../../../presets/scene/paper-1x1.json', import.meta.url), 'utf8');
  const r = parsePresetText(raw);
  assert.deepEqual(r.warnings, []);
  assert.deepEqual(r.scene, PAPER_SCENE);
  const again = await readPresetFile(file(serializePreset(r.scene)));
  assert.deepEqual(again.scene, r.scene); assert.deepEqual(again.warnings, []);
});

test('tệp quá lớn bị từ chối TRƯỚC khi đọc nội dung', async () => {
  read = 0;
  await assert.rejects(readPresetFile(file('{}', PRESET_LIMITS.maxBytes + 1)), (e: any) => e.code === 'ERR_PRESET_TOO_LARGE' && e.details.max === PRESET_LIMITS.maxBytes);
  assert.equal(read, 0, 'không được gọi file.text()');
  assert.throws(() => parsePresetText('x'.repeat(PRESET_LIMITS.maxBytes + 1)), (e: any) => e.code === 'ERR_PRESET_TOO_LARGE');
});

test('preset hỏng: JSON sai, không phải đối tượng, thiếu trường → ERR_PRESET_INVALID; mới hơn → ERR_SCHEMA_NEWER', async () => {
  for (const t of ['', '{', 'null', '[]', '"x"', '{"schemaVersion":"0.4.0"}', '\u0000\u0001']) await assert.rejects(readPresetFile(file(t)), (e: any) => e.code === 'ERR_PRESET_INVALID', JSON.stringify(t));
  await assert.rejects(readPresetFile(file('{"schemaVersion":"0.9.0","canvas":{}}')), (e: any) => e.code === 'ERR_SCHEMA_NEWER');
  assert.equal(parsePresetText('﻿' + JSON.stringify(defaultScene())).scene.widgets.length, 1); // BOM được bỏ
});

test('preset độc hại đọc từ chuỗi JSON thật: __proto__ không làm bẩn prototype, được báo cảnh báo', async () => {
  const text = '{"schemaVersion":"0.4.0","canvas":{},"widgets":[{"type":"PIANO_ROLL","id":"p","properties":{"noteStyle":{"tracks":{"__proto__":{"polluted":true},"ok":{"opacity":0.5}}}}}],"__proto__":{"polluted":true},"constructor":{"prototype":{"polluted":true}}}';
  const r = await readPresetFile(file(text));
  assert.equal(({} as any).polluted, undefined);
  assert.equal(r.warnings.filter((w) => w.code === 'WARN_PRESET_UNSAFE_KEY').length, 3);
  assert.deepEqual(Object.keys((r.scene.widgets[0].properties as any).noteStyle.tracks), ['ok']);
});

test('presetFileName: tên tệp an toàn, bỏ dấu tiếng Việt, không ký tự đường dẫn', () => {
  assert.equal(presetFileName('Bản in thử Đẹp!'), 'ban-in-thu-dep.json');
  assert.equal(presetFileName('../../etc/passwd'), 'etc-passwd.json');
  assert.equal(presetFileName(''), 'preset.json'); assert.equal(presetFileName('😀'), 'preset.json');
  assert.ok(presetFileName('a'.repeat(500)).length <= 65);
});
