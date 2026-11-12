import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DEFAULT_NOTE_STYLE, STYLE_PRESETS, sanitizeStyle } from '../src/index.ts';

const dir = new URL('../../../presets/note-style/', import.meta.url);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

test('presets/note-style: tệp hợp lệ, tên slug, nhỏ, có giấy phép, giá trị đã nằm trong miền hợp lệ', () => {
  assert.ok(files.length >= 4);
  for (const f of files) {
    assert.match(f, /^[a-z0-9-]+\.json$/, f);
    const raw = fs.readFileSync(new URL(f, dir), 'utf8'); assert.ok(raw.length < 16 * 1024, `${f} quá lớn`);
    const p = JSON.parse(raw);
    assert.equal(p.kind, 'note-style', f); assert.match(p.schemaVersion, /^\d+\.\d+\.\d+$/, f);
    assert.ok(p.name && p.license, `${f}: thiếu name/license`);
    const merged = { ...DEFAULT_NOTE_STYLE, ...p.style };
    for (const k of Object.keys(p.style)) assert.ok(k in DEFAULT_NOTE_STYLE, `${f}: trường lạ ${k}`);
    // "đã hợp lệ" = kẹp không đổi gì (trừ cornerRadius rất lớn vẫn nằm trong 0..999)
    assert.deepEqual(sanitizeStyle(merged), merged, `${f}: có giá trị ngoài miền`);
  }
});

test('presets: bộ dựng sẵn của giao diện (STYLE_PRESETS) khớp tệp trong presets/note-style', () => {
  const byName: Record<string, any> = { neon: 'neon', soft: 'soft-bars', flat: 'flat', outline: 'outline' };
  for (const [k, slug] of Object.entries(byName)) {
    const p = JSON.parse(fs.readFileSync(new URL(`${slug}.json`, dir), 'utf8'));
    assert.deepEqual(p.style, (STYLE_PRESETS as any)[k], `${slug} lệch STYLE_PRESETS.${k}`);
  }
});
