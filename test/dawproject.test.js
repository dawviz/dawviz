import assert from 'node:assert/strict';
import { parseDawproject, parseDawprojectXml, dawprojectInventory } from '@dawviz/parser-dawproject';
import { test, fx, zip, assertAstInvariants } from './helpers.mjs';

const BITWIG = fx('bitwig-5.0-example.project.xml').toString('utf8');

test('Ví dụ chính thức Bitwig 5.0: tempo 149, 1 track nốt (bỏ audio + master), 9 nốt', async () => {
  const { ast } = parseDawprojectXml(BITWIG);
  assert.equal(ast.meta.sourceFormat, 'dawproject');
  assert.equal(ast.tempoMap[0].bpm, 149); assert.equal(ast.meta.tempoSource, 'file');
  assert.equal(ast.tracks.length, 1); assert.equal(ast.tracks[0].name, 'Bass');
  const n = ast.tracks[0].notes;
  assert.equal(n.length, 9);
  assert.ok(n.every((x) => x.velocity === 100));
  const long = n.find((x) => x.startTick === 1440); assert.equal(long.durationTick, 2400); assert.equal(long.pitch, 53);
  assertAstInvariants(assert, ast);
});

test('Đọc trong container ZIP (project.xml + metadata.xml), kèm inventory', async () => {
  const z = zip({ 'project.xml': BITWIG, 'metadata.xml': '<MetaData><Title>Hello</Title><Artist>Me</Artist></MetaData>', 'audio/x.wav': Buffer.alloc(100) });
  const { ast } = await parseDawproject(z);
  assert.equal(ast.meta.title, 'Hello'); assert.equal(ast.meta.artist, 'Me');
  const inv = await dawprojectInventory(z);
  assert.ok(inv.some((r) => r.path.endsWith('/Note') && r.count === 9));
  await assert.rejects(parseDawproject(zip({ 'x.txt': 'a' })), { code: 'ERR_ARCHIVE_INVALID' });
});

const proj = ({ tempo = '<Tempo value="120" unit="bpm"/>', mute = 'false', unit = 'beats', clips }) => `<?xml version="1.0"?><Project version="1.0"><Transport>${tempo}<TimeSignature numerator="4" denominator="4"/></Transport><Structure><Track contentType="notes" id="t1" name="T"><Channel role="regular"><Mute value="${mute}"/></Channel></Track></Structure><Arrangement><Lanes timeUnit="${unit}"><Lanes track="t1">${clips}</Lanes></Lanes></Arrangement></Project>`;
const note = (t, d, k = 60) => `<Note time="${t}" duration="${d}" key="${k}" vel="0.5" channel="0"/>`;

test('Clip lặp (loopStart/loopEnd) nhân bản đến hết clip', () => {
  const x = proj({ clips: `<Clips><Clip time="0" duration="8" loopStart="0" loopEnd="2"><Notes>${note(0.5, 1)}</Notes></Clip></Clips>` });
  const { ast } = parseDawprojectXml(x);
  assert.deepEqual(ast.tracks[0].notes.map((n) => n.startTick), [480, 2400, 4320, 6240]);
});

test('playStart bỏ nốt trước điểm bắt đầu và dịch phần còn lại', () => {
  const x = proj({ clips: `<Clips><Clip time="4" duration="4" playStart="1"><Notes>${note(0.5, 0.25)}${note(1.5, 0.5, 62)}</Notes></Clip></Clips>` });
  const { ast } = parseDawprojectXml(x);
  assert.deepEqual(ast.tracks[0].notes.map((n) => [n.pitch, n.startTick]), [[62, 4320]]);
});

test('timeUnit=seconds quy đổi qua tempo (120 BPM: 1 giây = 2 beat)', () => {
  const x = proj({ unit: 'seconds', clips: `<Clips><Clip time="0" duration="10"><Notes>${note(1, 0.5)}</Notes></Clip></Clips>` });
  const { ast } = parseDawprojectXml(x);
  assert.equal(ast.tracks[0].notes[0].startTick, 1920); assert.equal(ast.tracks[0].notes[0].durationTick, 960);
});

test('Track tắt tiếng; thiếu tempo -> fallback có cờ; tempoOverride', () => {
  const clips = `<Clips><Clip time="0" duration="4"><Notes>${note(0, 1)}</Notes></Clip></Clips>`;
  assert.throws(() => parseDawprojectXml(proj({ mute: 'true', clips })), { code: 'ERR_NO_NOTES' });
  assert.equal(parseDawprojectXml(proj({ mute: 'true', clips }), { showMuted: true }).ast.tracks[0].isVisible, true);
  const nt = parseDawprojectXml(proj({ tempo: '', clips }));
  assert.equal(nt.ast.meta.tempoSource, 'fallback'); assert.ok(nt.warnings.some((w) => w.code === 'WARN_TEMPO_FALLBACK'));
  const ov = parseDawprojectXml(proj({ tempo: '', clips }), { tempoOverride: 95 });
  assert.equal(ov.ast.meta.tempoSource, 'user'); assert.equal(ov.ast.tempoMap[0].bpm, 95);
});

test('Gốc XML sai bị từ chối', () => {
  assert.throws(() => parseDawprojectXml('<Other/>'), { code: 'ERR_AST_INVALID' });
});
