import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseBinaryWithSchema, validateSchema, readBinary, matchSchema } from '@dawviz/parser-binary';
import { assertAstInvariants } from './helpers.mjs';

const schema = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../schemas/demo-dbin.schema.json'), 'utf8'));

function dbin({ ppq = 480, title = 'Song', tempos = [[0, 140]], tracks }) {
  const parts = [Buffer.from('DBIN')];
  const u16 = (n) => { const b = Buffer.alloc(2); b.writeUInt16BE(n); return b; };
  const u32 = (n) => { const b = Buffer.alloc(4); b.writeUInt32BE(n); return b; };
  const f32 = (n) => { const b = Buffer.alloc(4); b.writeFloatBE(n); return b; };
  parts.push(u16(1), u16(ppq), Buffer.from([Buffer.byteLength(title)]), Buffer.from(title), u16(tempos.length));
  for (const [t, b] of tempos) parts.push(u32(t), f32(b));
  parts.push(u16(tracks.length));
  for (const tr of tracks) {
    parts.push(Buffer.from([Buffer.byteLength(tr.name)]), Buffer.from(tr.name), Buffer.from([tr.muted ? 1 : 0]), u32(tr.notes.length));
    for (const [p, v, s, d] of tr.notes) parts.push(Buffer.from([p, v]), u32(s), u32(d));
  }
  return Buffer.concat(parts);
}

test('schema demo hợp lệ và parse đúng nội dung', async () => {
  validateSchema(schema);
  const b = dbin({ tracks: [{ name: 'Piano', notes: [[60, 100, 0, 480], [64, 80, 480, 240]] }, { name: 'Mute', muted: true, notes: [[40, 90, 0, 480]] }] });
  const { ast } = await parseBinaryWithSchema(b, schema);
  assert.equal(ast.meta.title, 'Song'); assert.equal(ast.meta.sourceFormat, 'custom_binary'); assert.equal(ast.meta.sourcePPQ, 480);
  assert.equal(ast.meta.tempoSource, 'file'); assert.equal(ast.tempoMap[0].bpm, 140);
  const p = ast.tracks.find((t) => t.name === 'Piano');
  assert.deepEqual(p.notes.map((n) => [n.pitch, n.startTick, n.durationTick, n.velocity]), [[60, 0, 960, 100], [64, 960, 480, 80]]);
  assert.equal(ast.tracks.find((t) => t.name === 'Mute').isMuted, true);
  assertAstInvariants(assert, ast);
  assert.equal(matchSchema('x.DBIN', b, [schema]), schema);
  assert.equal(matchSchema('x.dbin', Buffer.from('NOPE....'), [schema]), null);
});

test('Không có tempo trong file: fallback có cờ; tempoOverride thay thế', async () => {
  const b = dbin({ tempos: [], tracks: [{ name: 'A', notes: [[60, 100, 0, 480]] }] });
  const a = await parseBinaryWithSchema(b, schema);
  assert.equal(a.ast.meta.tempoSource, 'fallback');
  assert.ok(a.warnings.some((w) => w.code === 'WARN_TEMPO_FALLBACK'), 'phải có cảnh báo fallback');
  const u = await parseBinaryWithSchema(b, schema, { tempoOverride: 77 });
  assert.equal(u.ast.meta.tempoSource, 'user'); assert.equal(u.ast.tempoMap[0].bpm, 77);
});

test('File hỏng/cụt: lỗi có mã, không đọc ngoài vùng', async () => {
  const b = dbin({ tracks: [{ name: 'A', notes: [[60, 100, 0, 480], [62, 100, 480, 480]] }] });
  await assert.rejects(parseBinaryWithSchema(b.subarray(0, b.length - 5), schema), { code: 'ERR_AST_INVALID' });
  await assert.rejects(parseBinaryWithSchema(Buffer.from('XXXX' + 'a'.repeat(30)), schema), { code: 'ERR_UNSUPPORTED_FORMAT' });
  const bad = Buffer.from(b); bad.writeUInt16BE(9, 4); // version sai
  await assert.rejects(parseBinaryWithSchema(bad, schema), { code: 'ERR_AST_INVALID' });
});

test('count khổng lồ trong file không gây cấp phát/treo', async () => {
  const b = dbin({ tracks: [{ name: 'A', notes: [[60, 100, 0, 1]] }] });
  const noteCountOff = b.length - 10 - 4; b.writeUInt32BE(0xffffffff, noteCountOff);
  await assert.rejects(parseBinaryWithSchema(b, schema), (e) => ['ERR_AST_INVALID', 'ERR_AST_TOO_LARGE'].includes(e.code));
});

test('Schema độc hại/sai bị từ chối: tên cấm, hàm lạ, truy cập prototype, kiểu lạ', async () => {
  const mk = (patch) => structuredClone({ ...schema, ...patch });
  assert.throws(() => validateSchema(mk({ schemaVersion: 2 })), { code: 'ERR_SCHEMA_INVALID' });
  const evil = mk({}); evil.root.fields.push({ name: '__proto__', type: 'u8' });
  assert.throws(() => validateSchema(evil), { code: 'ERR_SCHEMA_INVALID' });
  const t = mk({}); t.root.fields.push({ name: 'x', type: 'nonexistent' });
  assert.throws(() => validateSchema(t), { code: 'ERR_SCHEMA_INVALID' });
  for (const expr of ['process.exit(1)', 'constructor.constructor("return 1")()', 'eval("1")', '__proto__']) {
    const s = mk({}); s.ast.title = expr;
    let threw = false;
    try { validateSchema(s); await parseBinaryWithSchema(dbin({ tracks: [{ name: 'A', notes: [[60, 100, 0, 480]] }] }), s); } catch (e) { threw = true; assert.match(e.code, /^ERR_/); }
    assert.ok(threw, `biểu thức phải bị từ chối: ${expr}`);
  }
  const noAst = mk({}); delete noAst.ast;
  await assert.rejects(parseBinaryWithSchema(dbin({ tracks: [{ name: 'A', notes: [[60, 100, 0, 1]] }] }), noAst), { code: 'ERR_SCHEMA_INVALID' });
});

test('Giới hạn nốt và vòng lặp vô hạn', async () => {
  const b = dbin({ tracks: [{ name: 'A', notes: Array.from({ length: 50 }, (_, i) => [60, 100, i * 10, 5]) }] });
  await assert.rejects(parseBinaryWithSchema(b, schema, { limits: { maxNotes: 10 } }), { code: 'ERR_AST_TOO_LARGE' });
  const loop = { schemaVersion: 1, root: { fields: [{ name: 'a', type: 'array', of: { type: 'skip', length: '0' }, until: 'end' }] } };
  assert.throws(() => readBinary(Buffer.from([1, 2, 3]), loop), { code: 'ERR_AST_INVALID' });
});

test('Công cụ cấu trúc: switch/when/offset/peek/vlq trên schema SMF header', () => {
  const smfSchema = { schemaVersion: 1, root: { fields: [
    { name: 'tag', type: 'ascii', length: '4' }, { name: 'len', type: 'u32' }, { name: 'fmt', type: 'u16' }, { name: 'n', type: 'u16' }, { name: 'div', type: 'u16' },
    { name: 'smpte', type: 'computed', expr: 'div >= 32768' },
    { name: 'peekTag', type: 'ascii', length: '4', offset: '0', peek: true },
    { name: 'kind', type: 'switch', on: 'fmt', cases: { '0': { type: 'computed', expr: "'single'" }, '1': { type: 'computed', expr: "'multi'" } }, default: { type: 'computed', expr: "'other'" } },
    { name: 'extra', type: 'u8', when: 'fmt == 7' },
  ] } };
  const hdr = Buffer.from([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, 2, 0x01, 0xe0]);
  const { root } = readBinary(hdr, smfSchema);
  assert.deepEqual([root.tag, root.len, root.fmt, root.n, root.div, root.smpte, root.peekTag, root.kind, root.extra], ['MThd', 6, 1, 2, 480, false, 'MThd', 'multi', undefined]);
});
