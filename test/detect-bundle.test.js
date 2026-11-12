import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { parseProject, detectFormat, SUPPORTED } from '@dawviz/parser';
import { test, smf, tempoEv, on, off, zip, fx } from './helpers.mjs';

const mid = smf({ tracks: [[tempoEv(0, 100), on(0, 60), off(480, 60)]] });

test('detectFormat: theo đuôi + magic; hướng dẫn rõ cho .flp/.bwproject', () => {
  assert.equal(detectFormat('a.als', fx('Demo.als')).format, 'als');
  assert.equal(detectFormat('a.ALS', zlib.gunzipSync(fx('Demo.als'))).format, 'als');
  assert.equal(detectFormat('a.mid', mid).format, 'mid');
  assert.equal(detectFormat('a.rpp', fx('ode_to_zb.RPP')).format, 'rpp');
  assert.equal(detectFormat('a.alp', zip({ 'a.als': 'x' })).format, 'alp');
  assert.equal(detectFormat('weird.bin', zip({ 'project.xml': '<Project/>' })).format, 'dawproject');
  assert.throws(() => detectFormat('a.flp', mid), (e) => e.code === 'ERR_UNSUPPORTED_FORMAT' && /MIDI/.test(e.message));
  assert.throws(() => detectFormat('a.bwproject', mid), (e) => e.code === 'ERR_UNSUPPORTED_FORMAT' && /dawproject/i.test(e.message));
  assert.throws(() => detectFormat('a.mid', fx('Demo.als')), { code: 'ERR_UNSUPPORTED_FORMAT' });
  assert.throws(() => detectFormat('a.rpp', mid), { code: 'ERR_UNSUPPORTED_FORMAT' });
  assert.ok(SUPPORTED.length >= 6);
});

test('parseProject điều phối đúng parser; binary theo schema đăng ký qua options.schemas', async () => {
  assert.equal((await parseProject('x.mid', mid)).format, 'mid');
  const r = await parseProject('Demo.als', fx('Demo.als'));
  assert.equal(r.format, 'als'); assert.equal(r.ast.meta.title, 'Demo');
  const schema = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../schemas/demo-dbin.schema.json'), 'utf8'));
  await assert.rejects(parseProject('x.dbin', Buffer.from('DBIN')), { code: 'ERR_UNSUPPORTED_FORMAT' });
  await assert.rejects(parseProject('x.dbin', Buffer.from('DBIN'), { schemas: [schema] }), (e) => /^ERR_/.test(e.code));
});

test('Bundle một file chạy được và cho kết quả giống hệt bản nguồn', async () => {
  execFileSync(process.execPath, [path.join(import.meta.dirname, '../scripts/bundle.mjs')], { stdio: 'pipe' });
  // import() cần URL file:// (trên Windows, đường dẫn C:\... bị từ chối với ERR_UNSUPPORTED_ESM_URL_SCHEME)
  const b = await import(pathToFileURL(path.join(import.meta.dirname, '../dist/dawviz-parser.bundle.js')).href + '?t=' + Date.now());
  const a = await parseProject('Demo.als', fx('Demo.als')), c = await b.parseProject('Demo.als', fx('Demo.als'));
  assert.deepEqual(c.ast, a.ast);
  assert.equal((await b.parseProject('x.mid', mid)).ast.tracks[0].notes.length, 1);
  assert.ok(typeof b.compareAST === 'function' && typeof b.detectFormat === 'function');
});

test('probeProject: chỉ báo cần .mid ngoài / schema khi thật sự cần', async () => {
  const { probeProject } = await import('@dawviz/parser');
  const { fx } = await import('./helpers.mjs');
  assert.deepEqual(probeProject('BigProject3.rpp', fx('BigProject3.rpp')), { format: 'rpp', needs: { externalMidi: ['Oboe MIDI 001.mid'], schema: false } });
  assert.deepEqual(probeProject('BigProjectDemo2.rpp', fx('BigProjectDemo2.rpp')).needs, { externalMidi: [], schema: false });
  assert.deepEqual(probeProject('Demo.als', fx('Demo.als')).needs, { externalMidi: [], schema: false });
  const bw = probeProject('x.bwproject', Buffer.from('BtWgxxxx'));
  assert.equal(bw.format, null); assert.equal(bw.needs.schema, true); assert.match(bw.message, /chưa hỗ trợ/);
  assert.equal(probeProject('x.flp', Buffer.from('FLhd')).needs.schema, true);
  const bad = probeProject('x.als', Buffer.from('PK\x03\x04zzzz')); // đuôi đã biết nhưng nội dung sai: không mời nạp schema
  assert.equal(bad.needs.schema, false);
});
