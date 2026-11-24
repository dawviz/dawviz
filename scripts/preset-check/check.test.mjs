// Test của checkPreset (T-31): preset dựng sẵn và preset cộng đồng hợp lệ đạt; giấy phép, URL ngoài, biểu thức lỗi, khoá nguy hiểm, tên tệp bị chặn.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { checkPreset, checkPresetPack } from './check.mjs';

const enc = (o) => new TextEncoder().encode(typeof o === 'string' ? o : JSON.stringify(o));
const scene = (extra = {}, widgets = []) => ({ schemaVersion: '0.8.0', license: 'CC0-1.0', canvas: {}, widgets, ...extra });
const text = (animate) => ({ id: 'a', type: 'TEXT', layout: { x: 0, y: 0, width: 100, height: 50 }, properties: {}, animate });

test('preset dựng sẵn qua kiểm (không cần license); preset cộng đồng hợp lệ qua', () => {
  for (const f of ['presets/scene/paper-16x9.json', 'presets/note-style/neon.json']) assert.equal(checkPreset(f, fs.readFileSync(f)).ok, true, f);
  const r = checkPreset('glow-dance.json', enc(scene({}, [text({ opacity: { expr: '0.5 + 0.5 * sin(beat.phase * TAU)' } })])), { community: true });
  assert.deepEqual(r.errors, []); assert.equal(r.stats.expressions, 1);
});

test('chặn: thiếu/sai giấy phép, URL ngoài, biểu thức lỗi, khoá nguy hiểm, tên tệp, JSON hỏng, quá cỡ', () => {
  const has = (r, s) => r.errors.some((e) => e.includes(s));
  assert.ok(has(checkPreset('a.json', enc(scene({ license: undefined })), { community: true }), 'license'));
  assert.ok(has(checkPreset('a.json', enc(scene({ license: 'GPL-3.0' })), { community: true }), 'GPL-3.0'));
  assert.ok(has(checkPreset('a.json', enc(scene({ presetName: 'https://evil.example/x' }))), 'URL'));
  assert.ok(has(checkPreset('a.json', enc(scene({}, [text({ opacity: { expr: 'window.alert' } })]))), 'ERR_EXPR_UNKNOWN_NAME'));
  assert.ok(has(checkPreset('a.json', enc('{"schemaVersion":"0.8.0","canvas":{},"widgets":[],"__proto__":{"x":1}}')), 'WARN_PRESET_UNSAFE_KEY'));
  assert.ok(has(checkPreset('Bad Name.json', enc(scene()), { community: true }), 'slug'));
  assert.equal(checkPreset('a.json', enc('{oops')).ok, false);
  assert.ok(has(checkPreset('a.json', enc({ kind: 'note-style', license: 'MIT', style: { glow: 1 }, pad: 'x'.repeat(20000) })), 'vượt'));
  assert.ok(has(checkPreset('a.json', enc({ schemaVersion: '9.0.0', canvas: {}, widgets: [] })), 'ERR_SCHEMA_NEWER'));
});

test('cảnh báo (không chặn): giá trị ngoài miền của kiểu nốt; đo thời gian khung khi có đồng hồ', () => {
  const r = checkPreset('a.json', enc({ kind: 'note-style', license: 'MIT', style: { glow: 5, nope: 1 } }));
  assert.equal(r.ok, true); assert.ok(r.warnings.some((w) => w.includes('style.glow')) && r.warnings.some((w) => w.includes('style.nope')));
  let clock = 0;
  const s = checkPreset('a.json', enc(scene()), { now: () => (clock += 5), frames: 4 });
  assert.equal(s.stats.worstFrameMs, 5);
});

test('gói .dawviz-preset.zip: gói hợp lệ đạt; sai băm/giấy phép bị chặn', async () => {
  const { buildPresetPack } = await import('../../apps/web/src/lib/presetPack.ts');
  const { defaultScene } = await import('../../packages/render-core/src/index.ts');
  const { unzipSync, zipSync } = await import('fflate');
  const zip = await buildPresetPack({ name: 'Glow', author: 'A', license: 'MIT', description: '' }, { kind: 'scene', scene: defaultScene('9:16') });
  const ok = await checkPresetPack('glow.dawviz-preset.zip', zip, { community: true });
  assert.deepEqual(ok.errors, []); assert.equal(ok.stats.widgets, 1);
  const files = unzipSync(zip), doc = JSON.parse(new TextDecoder().decode(files['preset.json']));
  const bad = await checkPresetPack('x.zip', zipSync({ 'preset.json': new TextEncoder().encode(JSON.stringify({ ...doc, license: 'WTFPL' })) }));
  assert.equal(bad.ok, false); assert.ok(bad.errors[0].includes('ERR_PRESET_LICENSE'));
});
