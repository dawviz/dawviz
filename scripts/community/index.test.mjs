// Test của build-index.mjs (T-16): preset hiện có hợp lệ, băm đúng; tài nguyên sai quy tắc bị báo.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { buildIndex } from './build-index.mjs';

const repoRoot = path.join(import.meta.dirname, '..', '..');

test('repo hiện tại: mọi preset hợp lệ, có băm đúng', () => {
  const { index, errors } = buildIndex(repoRoot);
  assert.deepEqual(errors, []);
  assert.ok(index.entries.length >= 5);
  const e = index.entries.find((x) => x.path === 'presets/note-style/neon.json');
  assert.equal(e.sha256, crypto.createHash('sha256').update(fs.readFileSync(path.join(repoRoot, e.path))).digest('hex'));
  assert.equal(e.license, 'Apache-2.0');
});

test('tài nguyên thiếu meta.json, giấy phép lạ, tên không phải slug đều bị báo', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'dvz-'));
  const mk = (p, c) => { fs.mkdirSync(path.dirname(path.join(d, p)), { recursive: true }); fs.writeFileSync(path.join(d, p), c); };
  mk('assets/fonts/ok-font/meta.json', JSON.stringify({ name: 'Ok', author: 'A', source: 'https://x', license: 'OFL-1.1' }));
  mk('assets/fonts/ok-font/a.woff2', 'x');
  mk('assets/fonts/no-meta/a.woff2', 'x');
  mk('assets/backgrounds/Bad_Name/meta.json', JSON.stringify({ author: 'A', source: 's', license: 'All-Rights-Reserved' }));
  mk('assets/backgrounds/Bad_Name/a.png', 'x');
  const { index, errors } = buildIndex(d);
  assert.equal(index.entries.filter((e) => e.path.includes('ok-font')).length, 1);
  assert.ok(errors.some((e) => e.includes('no-meta') && e.includes('meta.json')));
  assert.ok(errors.some((e) => e.includes('All-Rights-Reserved')));
  assert.ok(errors.some((e) => e.includes('Bad_Name') && e.includes('slug')));
});
