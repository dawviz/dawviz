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

// ---- mở rộng engine cho định dạng dạng dòng sự kiện (D-62): $last, ast.index, inner, warnings, splitNum/basename
const evSchema = (over = {}) => ({
  schemaVersion: 1, id: 'ev', extensions: ['ev'], magic: { ascii: 'EV' }, endian: 'little',
  root: { fields: [
    { type: 'skip', length: '2' }, { name: 'n', type: 'u8' },
    { name: 'events', type: 'array', of: 'E', count: 'n' },
  ] },
  types: { E: { fields: [
    { name: 'kind', type: 'u8' }, { name: 'val', type: 'u8' },
    { name: 'cur', type: 'computed', expr: 'kind == 1 ? val : ($last.cur || 0)' }, // "trạng thái chạy": kind 1 đặt nhóm hiện tại
  ] } },
  ast: {
    sourceFormat: 'evx', sourceVersion: "splitNum('7.2.9', '.', 1) + basename('C:\\\\a\\\\song.wav')",
    ppq: '960', timeUnit: 'ticks',
    index: {
      byGroup: { each: 'events', as: 'e', filter: 'e.kind == 2', collect: true, key: 'e.cur', value: 'e.val' },
      groups: { each: 'events', as: 'e', filter: 'e.kind == 1', list: true, value: 'e.val' },
    },
    tempo: { bpm: '120' },
    tracks: { each: 'groups', as: 'g', name: "'G' + g", notes: { each: 'groups', as: 'h', filter: 'h == g', inner: { each: 'byGroup[g]', as: 'p' }, pitch: 'p', startTick: '$index * 10', durationTick: '5' } },
    warnings: [{ when: 'len(groups) > 1', code: 'WARN_TEST_MULTI', message: 'hai nhóm' }],
    ...over,
  },
});
const evBin = (events) => Buffer.from([0x45, 0x56, events.length, ...events.flat()]);

test('engine: $last mang trạng thái, index collect/list, inner, warnings, hàm splitNum/basename', async () => {
  const s = evSchema();
  const b = evBin([[1, 7], [2, 60], [2, 62], [1, 9], [2, 70]]);
  const r = await parseBinaryWithSchema(b, s);
  assert.equal(r.ast.meta.sourceFormat, 'evx'); assert.equal(r.ast.meta.sourceVersion, '2song');
  assert.deepEqual(r.ast.tracks.map((t) => [t.name, t.notes.map((n) => n.pitch)]), [['G7', [60, 62]], ['G9', [70]]]);
  assert.deepEqual(r.warnings.map((w) => w.code), ['WARN_TEST_MULTI']);
  assert.equal(readBinary(b, s).root.events[4].cur, 9);
});

test('engine: ast.index/warnings sai → ERR_SCHEMA_INVALID; inner không phải mảng = rỗng', async () => {
  assert.throws(() => validateSchema(evSchema({ index: { x: { each: 'events', value: 'e' } } })), { code: 'ERR_SCHEMA_INVALID' });
  assert.throws(() => validateSchema(evSchema({ warnings: [{ when: 'true', code: 'oops' }] })), { code: 'ERR_SCHEMA_INVALID' });
  assert.throws(() => validateSchema(evSchema({ index: { constructor: { each: 'events', list: true, value: '1' } } })), { code: 'ERR_SCHEMA_INVALID' });
  const r = await parseBinaryWithSchema(evBin([[1, 3], [2, 50], [1, 4]]), evSchema()); // nhóm 4 không có nốt → track rỗng bị bỏ
  assert.deepEqual(r.ast.tracks.map((t) => t.name), ['G3']);
});

test('engine: tracks.let và tracks.automation → lane {kind, points} đã sắp theo tick; kind sai → ERR_SCHEMA_INVALID', async () => {
  const lane = (kind) => ({ kind, each: 'groups', as: 'h', filter: 'h == g', inner: { each: 'byGroup[g]', as: 'p' }, tick: '(5 - $index) * 10', value: 'p / 100' });
  const s = evSchema(); s.ast.tracks = { ...s.ast.tracks, let: { two: 'g * 2' }, name: "'G' + two", automation: [lane('volume')] };
  const r = await parseBinaryWithSchema(evBin([[1, 7], [2, 60], [2, 62], [1, 9], [2, 70]]), s);
  const t = r.ast.tracks[0];
  assert.equal(t.name, 'G14'); assert.deepEqual(t.automation.volume.points.map((p) => [p.tick, p.value]), [[40, 0.62], [50, 0.6]]);
  assert.ok(Number.isFinite(t.automation.volume.points[0].timeSeconds) && t.automation.volume.points[0].shape === 0);
  s.ast.tracks.automation = [lane('tempo')];
  assert.throws(() => validateSchema(s), { code: 'ERR_SCHEMA_INVALID' });
});
