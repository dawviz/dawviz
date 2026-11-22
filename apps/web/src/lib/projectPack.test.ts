import { test } from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { buildPack, readPack, safeName, isSafePackPath, PackError, PACK_SCHEMA_VERSION } from './projectPack.ts';

const now = new Date('2026-11-18T10:00:00Z');
const base = () => ({
  title: 'Bài thử', author: 'x', now, scene: { schemaVersion: '0.6.0', widgets: [] }, workspace: { order: ['a', 'b'], hidden: ['b'] },
  source: { name: 'song.rpp', bytes: strToU8('<REAPER_PROJECT 0.1 "7.0"\n>\n') },
});
const code = async (p: Promise<unknown>) => { try { await p; } catch (e) { return (e as PackError).code; } return null; };

test('pack: ghi rồi đọc lại nguyên vẹn (dự án, âm thanh, tài nguyên, tempo, JSON)', async () => {
  const bytes = await buildPack({ ...base(), tempoOverride: 128, audio: { name: 'mix.wav', bytes: new Uint8Array([1, 2, 3, 4]), offsetMs: -40 }, assets: [{ name: 'bg.png', bytes: new Uint8Array([9, 9]) }] });
  const r = await readPack(bytes);
  assert.equal(r.manifest.schemaVersion, PACK_SCHEMA_VERSION);
  assert.equal(r.manifest.title, 'Bài thử');
  assert.equal(r.manifest.tempoOverride, 128);
  assert.equal(strFromU8(r.source.bytes), '<REAPER_PROJECT 0.1 "7.0"\n>\n');
  assert.deepEqual([...r.audio!.bytes], [1, 2, 3, 4]);
  assert.equal(r.audio!.offsetMs, -40);
  assert.deepEqual(r.assets.map((a) => a.name), ['bg.png']);
  assert.deepEqual(r.workspace, { order: ['a', 'b'], hidden: ['b'] });
  assert.deepEqual(r.overrides, {});
  assert.deepEqual(r.warnings, []);
});

test('pack: tên tệp độc hại được chuẩn hoá, tên trùng được đánh số', async () => {
  assert.equal(safeName('../../etc/passwd', 'x'), 'passwd');
  assert.equal(safeName('..\\a:b.png', 'x'), 'a_b.png');
  assert.equal(safeName('', 'x'), 'x');
  assert.ok(isSafePackPath('assets/a.png'));
  for (const p of ['../a', '/a', 'a/../b', 'C:/a', 'a\\b', 'a/./b', '']) assert.equal(isSafePackPath(p), false, p);
  const r = await readPack(await buildPack({ ...base(), source: { name: '../x/song.rpp', bytes: strToU8('a') }, assets: [{ name: 'a.png', bytes: new Uint8Array([1]) }, { name: 'A.png', bytes: new Uint8Array([2]) }] }));
  assert.equal(r.source.name, 'song.rpp');
  assert.deepEqual(r.assets.map((a) => a.name).sort(), ['A-2.png', 'a.png']);
});

test('pack: sửa một byte thì ERR_PACK_HASH', async () => {
  const files = unzipSync(await buildPack(base()));
  files['source/song.rpp'] = strToU8('đã bị sửa');
  assert.equal(await code(readPack(zipSync(files))), 'ERR_PACK_HASH');
});

test('pack: thiếu manifest, thiếu nguồn, không phải ZIP, ZIP hỏng', async () => {
  const files = unzipSync(await buildPack(base()));
  const { 'manifest.json': _m, ...noManifest } = files;
  assert.equal(await code(readPack(zipSync(noManifest))), 'ERR_PACK_INVALID');
  const man = JSON.parse(strFromU8(files['manifest.json']));
  man.source.name = 'nope.rpp';
  assert.equal(await code(readPack(zipSync({ ...files, 'manifest.json': strToU8(JSON.stringify(man)) }))), 'ERR_PACK_INVALID');
  assert.equal(await code(readPack(strToU8('hello world'))), 'ERR_ARCHIVE_INVALID');
  assert.equal(await code(readPack(new Uint8Array([0x50, 0x4b, 3, 4, 1, 2, 3]))), 'ERR_ARCHIVE_INVALID');
});

test('pack: đường dẫn ra ngoài (zip-slip) bị từ chối, kể cả khi manifest nêu', async () => {
  const files = unzipSync(await buildPack(base()));
  assert.equal(await code(readPack(zipSync({ ...files, '../evil.txt': strToU8('x') }))), 'ERR_ARCHIVE_INVALID');
  const man = JSON.parse(strFromU8(files['manifest.json']));
  man.files.push({ path: 'assets/../../x', size: 1, sha256: 'a', role: 'asset' });
  assert.equal(await code(readPack(zipSync({ ...files, 'manifest.json': strToU8(JSON.stringify(man)) }))), 'ERR_ARCHIVE_INVALID');
});

test('pack: phiên bản — chính mới hơn bị chặn, phụ mới hơn chỉ cảnh báo, sai dạng bị từ chối', async () => {
  const files = unzipSync(await buildPack(base()));
  const withVer = (v: unknown) => { const m = JSON.parse(strFromU8(files['manifest.json'])); m.schemaVersion = v; return zipSync({ ...files, 'manifest.json': strToU8(JSON.stringify(m)) }); };
  assert.equal(await code(readPack(withVer('2.0.0'))), 'ERR_SCHEMA_NEWER');
  const r = await readPack(withVer('1.3.0'));
  assert.deepEqual(r.warnings.map((w) => w.code), ['WARN_PACK_NEWER_MINOR']);
  assert.equal(await code(readPack(withVer('abc'))), 'ERR_PACK_INVALID');
  assert.equal(await code(readPack(withVer(1))), 'ERR_PACK_INVALID');
});

test('pack: giới hạn entry, kích thước khai báo và tỉ lệ giải nén', async () => {
  const bytes = await buildPack(base());
  assert.equal(await code(readPack(bytes, { maxEntries: 3 })), 'ERR_ARCHIVE_TOO_LARGE');
  assert.equal(await code(readPack(bytes, { maxFileBytes: 100 })), 'ERR_ARCHIVE_TOO_LARGE');
  assert.equal(await code(readPack(bytes, { maxUnzippedBytes: 50 })), 'ERR_ARCHIVE_TOO_LARGE');
  // "bom": 5 MB số 0 nén còn vài KB → tỉ lệ rất cao
  const bomb = await buildPack({ ...base(), source: { name: 'a.mid', bytes: new Uint8Array(5e6) } });
  assert.equal(await code(readPack(bomb, { maxRatio: 30 })), 'ERR_ARCHIVE_TOO_LARGE');
});

test('pack: tệp thừa ngoài manifest bị bỏ và báo; âm thanh thiếu báo nhưng vẫn mở được', async () => {
  const files = unzipSync(await buildPack({ ...base(), audio: { name: 'm.wav', bytes: new Uint8Array([1]), offsetMs: 0 } }));
  const { 'audio/m.wav': _a, ...rest } = files;
  const man = JSON.parse(strFromU8(files['manifest.json']));
  man.files = man.files.filter((f: { path: string }) => f.path !== 'audio/m.wav');
  const r = await readPack(zipSync({ ...rest, 'manifest.json': strToU8(JSON.stringify(man)), 'extra.bin': new Uint8Array([1]) }));
  assert.equal(r.audio, undefined);
  assert.deepEqual(r.warnings.map((w) => w.code).sort(), ['WARN_PACK_AUDIO_MISSING', 'WARN_PACK_UNLISTED_FILE']);
});

test('Project Pack mang chuỗi cảnh (T-110/T-111 kiểu C): manifest mốc thời gian + scene đã dùng; pack cũ không có thì không có sequence', async () => {
  const base = { title: 'Bài', now: new Date('2026-11-22T00:00:00Z'), scene: { a: 1 }, workspace: {}, source: { name: 'bai.mid', bytes: new Uint8Array([1, 2, 3]) } };
  const seq = { manifest: { version: 1, cues: [{ id: 'c1', scene: 'mo-dau', from: 0, to: 30 }] }, scenes: { 'mo-dau': { presetName: 'Mở đầu' } } };
  const r = await readPack(await buildPack({ ...base, sequence: seq }));
  assert.deepEqual(r.sequence, seq); assert.ok(r.manifest.files.some((f) => f.path === 'sequence.json')); assert.deepEqual(r.warnings, []);
  assert.equal((await readPack(await buildPack(base))).sequence, undefined);
});
