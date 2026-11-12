import assert from 'node:assert/strict';
import { parseMidi } from '@dawviz/parser-midi';
import { parseAlp } from '@dawviz/parser-als';
import { parseProject } from '@dawviz/parser';
import { compareAST } from '@dawviz/parser-core';
import { test, smf, tempoEv, sigEv, nameEv, on, off, zip, fx, gz, assertAstInvariants } from './helpers.mjs';

test('MIDI: quy đổi PPQ 480 -> 960, tempo đổi giữa chừng, tên track', async () => {
  const b = smf({ ppq: 480, tracks: [[tempoEv(0, 120), tempoEv(480, 60), sigEv(0, 3, 2)], [nameEv('Lead'), on(0, 60), off(480, 60), on(480, 62), off(960, 62)]] });
  const { ast } = await parseMidi(b);
  assert.equal(ast.meta.sourcePPQ, 480);
  assert.equal(ast.meta.tempoSource, 'file');
  const t = ast.tracks.find((x) => x.name === 'Lead');
  assert.deepEqual(t.notes.map((n) => [n.pitch, n.startTick, n.durationTick]), [[60, 0, 960], [62, 960, 960]]);
  // nốt 1: 1 beat @120 = 0.5s ; nốt 2 bắt đầu 0.5s, dài 1 beat @60 = 1s
  assert.ok(Math.abs(t.notes[1].startTimeSeconds - 0.5) < 1e-6 && Math.abs(t.notes[1].endTimeSeconds - 1.5) < 1e-6);
  assert.deepEqual([ast.tempoMap[0].timeSigNumerator, ast.tempoMap[0].timeSigDenominator], [3, 4]);
  assertAstInvariants(assert, ast);
});

test('MIDI: running status + Note-On vel 0 làm Note-Off', async () => {
  const body = [0, 0x90, 60, 100, 10, 60, 0, 0, 62, 90, 10, 62, 0]; // running status
  const trk = [0x4d, 0x54, 0x72, 0x6b, 0, 0, 0, body.length + 4, ...body, 0, 0xff, 0x2f, 0];
  trk[7] = body.length + 4;
  const head = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0x01, 0xe0];
  const { ast } = await parseMidi(Buffer.from([...head, ...trk]));
  const notes = ast.tracks.flatMap((t) => t.notes);
  assert.deepEqual(notes.map((n) => [n.pitch, n.startTick, n.durationTick]), [[60, 0, 20], [62, 20, 20]]);
});

test('MIDI: format 0 tách theo kênh; thiếu tempo -> midi-default + cảnh báo; override', async () => {
  const b = smf({ format: 0, ppq: 96, tracks: [[on(0, 36, 100, 9), off(96, 36, 9), on(0, 60, 100, 0), off(96, 60, 0)]] });
  const a = await parseMidi(b);
  assert.equal(a.ast.tracks.length, 2);
  assert.ok(a.ast.tracks.some((t) => /drums/.test(t.name)));
  assert.equal(a.ast.meta.tempoSource, 'midi-default');
  assert.ok(a.warnings.some((w) => w.code === 'WARN_TEMPO_MIDI_DEFAULT'));
  const u = await parseMidi(b, { tempoOverride: 90 });
  assert.equal(u.ast.meta.tempoSource, 'user'); assert.equal(u.ast.tempoMap[0].bpm, 90);
});

test('MIDI: nốt treo được kéo dài + cảnh báo; file cụt không làm sập; SMPTE bị từ chối; rác bị từ chối', async () => {
  const hang = smf({ tracks: [[tempoEv(0, 120), on(0, 60), on(100, 62), off(200, 62)]] });
  const r = await parseMidi(hang);
  assert.ok(r.warnings.some((w) => w.code === 'WARN_MIDI_HANGING_NOTES'));
  assert.equal(r.ast.tracks.flatMap((t) => t.notes).length, 2);
  const cut = hang.subarray(0, hang.length - 4);
  await parseMidi(cut); // không throw
  const smpte = Buffer.from(smf({ tracks: [[on(0, 60), off(10, 60)]] })); smpte[12] = 0xe7; smpte[13] = 0x28;
  await assert.rejects(parseMidi(smpte), { code: 'ERR_UNSUPPORTED_FORMAT' });
  await assert.rejects(parseMidi(Buffer.from('not a midi file at all')), (e) => /^ERR_/.test(e.code));
  await assert.rejects(parseMidi(smf({ tracks: [[tempoEv(0, 120)]] })), { code: 'ERR_NO_NOTES' });
});

test('compareAST: MIDI 96 PPQ tham chiếu vs cùng nội dung 960 PPQ -> khớp trong dung sai', async () => {
  const mk = (ppq, k) => smf({ ppq, tracks: [[tempoEv(0, 100)], [on(0, 60), off(ppq, 60), on(ppq, 64), off(2 * ppq, 64), on(3 * ppq / 2 + k, 67), off(2 * ppq + k, 67)]] });
  const a = (await parseMidi(mk(960, 0))).ast, ref = (await parseMidi(mk(96, 0))).ast;
  const res = compareAST(a, ref);
  assert.equal(res.pass ?? res.ok ?? (res.missing === 0 && res.extra === 0), true, JSON.stringify(res).slice(0, 300));
});

// ---------------- .alp
const DEMO = fx('Demo.als');
test('ALP: ZIP chứa .als (Gzip) + wav giả + Backup -> chọn .als chính', async () => {
  const z = zip({ 'Project/Demo.als': DEMO, 'Project/Samples/x.wav': Buffer.alloc(1000, 1), 'Project/Backup/Demo [2020].als': gz('<junk/>'), '__MACOSX/._Demo.als': Buffer.from('x') });
  const r = await parseAlp(z, { title: 'Demo' });
  assert.equal(r.ast.sourceFormat ?? r.ast.meta.sourceFormat, 'alp');
  assert.equal(r.ast.tracks.length, 11);
});

test('ALP: .als dạng XML thuần trong ZIP cũng đọc được', async () => {
  const plain = (await import('node:zlib')).gunzipSync(DEMO);
  const r = await parseAlp(zip({ 'a.als': plain }));
  assert.equal(r.ast.tracks.length, 11);
});

test('ALP: không có .als -> lỗi; zip-slip bị chặn; bom zip bị chặn', async () => {
  await assert.rejects(parseAlp(zip({ 'readme.txt': 'hi' })), (e) => /^ERR_/.test(e.code));
  await assert.rejects(parseAlp(zip({ '../../evil.als': DEMO })), (e) => /^ERR_/.test(e.code));
  const bomb = zip({ 'a.als': Buffer.alloc(60e6, 0x20) });
  await assert.rejects(parseAlp(bomb, { limits: { maxUnzippedBytes: 5e6 } }), { code: 'ERR_ARCHIVE_TOO_LARGE' });
  await assert.rejects(parseAlp(Buffer.from('PK nope')), (e) => /^ERR_/.test(e.code));
});

// ---------------- .alp thật ("pl-a")
import zlibMod from 'node:zlib';
function plA(alsList, { junkGzipMagic = true } = {}) {
  const members = alsList.map(([, xml]) => zlibMod.gzipSync(Buffer.from(xml)));
  const manifest = Buffer.from(JSON.stringify({ original_path: 'P Project', als: alsList.map(([n]) => ({ current_path: n, original_path: n })), creator_id: 0, version: '1.0' }));
  const tail = Buffer.concat([Buffer.from('fLaC\0\0\0"'), junkGzipMagic ? Buffer.from([0x1f, 0x8b, 0x08, 0, 0, 0, 0, 0, 0, 3, 9, 9, 9]) : Buffer.alloc(0), Buffer.alloc(200, 7)]);
  const body = Buffer.concat([...members, manifest, tail]);
  const head = Buffer.alloc(12); head.write('pl-a'); head.writeUInt32LE(body.length, 4);
  return Buffer.concat([head, body]);
}
const aXml = (name, key) => `<?xml version="1.0"?><Ableton Creator="Test Live 9.1" MinorVersion="9.0_305"><LiveSet><Tracks><MidiTrack Id="1"><Name><EffectiveName Value="${name}"/></Name><DeviceChain><Mixer><Speaker><Manual Value="true"/></Speaker></Mixer><MainSequencer><ClipTimeable><ArrangerAutomation><Events><MidiClip Time="0"><CurrentStart Value="0"/><CurrentEnd Value="4"/><Loop><LoopStart Value="0"/><LoopEnd Value="4"/><StartRelative Value="0"/><LoopOn Value="false"/></Loop><Notes><KeyTracks><KeyTrack><Notes><MidiNoteEvent Time="0" Duration="1" Velocity="100" IsEnabled="true"/></Notes><MidiKey Value="${key}"/></KeyTrack></KeyTracks></Notes></MidiClip></Events></ArrangerAutomation></ClipTimeable></MainSequencer></DeviceChain></MidiTrack></Tracks><MasterTrack><DeviceChain><Mixer><Tempo><ArrangerAutomation><Events><FloatEvent Time="-63072000" Value="130"/></Events></ArrangerAutomation><Manual Value="130"/><AutomationTarget Id="8"/></Tempo><TimeSignature><ArrangerAutomation><Events><EnumEvent Time="-63072000" Value="201"/></Events></ArrangerAutomation><Manual Value="201"/><AutomationTarget Id="10"/></TimeSignature></Mixer></DeviceChain></MasterTrack></LiveSet></Ableton>`;

test('ALP thật "pl-a": nhiều .als gzip + manifest JSON + sample; chọn theo alsName/alsIndex; mặc định = file lớn nhất', async () => {
  const pack = plA([['Small.als', aXml('A', 60)], ['Big.als', aXml('B', 62) + '<!--' + 'x'.repeat(5000) + '-->']]);
  const d = await parseAlp(pack);
  assert.equal(d.info.container, 'pl-a'); assert.equal(d.info.alsEntry, 'Big.als');
  assert.equal(d.ast.meta.sourceFormat, 'alp'); assert.equal(d.ast.tracks[0].notes[0].pitch, 62); assert.equal(d.ast.tempoMap[0].bpm, 130);
  assert.ok(d.warnings.some((w) => w.code === 'WARN_ALP_MULTIPLE_ALS'));
  assert.equal((await parseAlp(pack, { alsName: 'Small.als' })).ast.tracks[0].notes[0].pitch, 60);
  assert.equal((await parseAlp(pack, { alsIndex: 0 })).ast.meta.title, 'Small');
  await assert.rejects(parseAlp(pack, { alsName: 'nope.als' }), { code: 'ERR_ARCHIVE_INVALID' });
  assert.equal((await parseProject('x.alp', pack)).format, 'alp');
});

test('ALP "pl-a": hỏng/thiếu manifest/bom bị từ chối', async () => {
  const pack = plA([['A.als', aXml('A', 60)]]);
  await assert.rejects(parseAlp(pack.subarray(0, 12 + 30)), (e) => /^ERR_/.test(e.code));
  const noMan = Buffer.from(pack); noMan.write('{"xx":', noMan.indexOf('{"original_path"')); 
  await assert.rejects(parseAlp(noMan), { code: 'ERR_ARCHIVE_INVALID' });
  await assert.rejects(parseAlp(plA([['A.als', aXml('A', 60) + ' '.repeat(2e6)]]), { limits: { maxUnzippedBytes: 1e6 } }), { code: 'ERR_ARCHIVE_TOO_LARGE' });
});

import { listAlp } from '@dawviz/parser';
test('listAlp: liệt kê các .als trong gói kèm track/nốt/BPM để người dùng chọn; file không nốt có error', async () => {
  const empty = aXml('E', 60).replace(/<MidiClip[\s\S]*<\/MidiClip>/, '');
  const pack = plA([['Small.als', aXml('A', 60)], ['Big.als', aXml('B', 62) + '<!--' + 'x'.repeat(5000) + '-->'], ['Empty.als', empty]]);
  const l = await listAlp(pack);
  assert.equal(l.container, 'pl-a'); assert.equal(l.defaultIndex, 1);
  assert.deepEqual(l.files.map((f) => f.name), ['Small.als', 'Big.als', 'Empty.als']);
  assert.deepEqual(l.files[0].tracks, [{ name: 'A', notes: 1, muted: false }]);
  assert.equal(l.files[0].bpm, 130);
  assert.equal(l.files[2].error, 'ERR_NO_NOTES');
  const z = await listAlp(zip({ 'a/One.als': (await import('node:zlib')).gunzipSync(DEMO), 'x.wav': Buffer.alloc(9) }));
  assert.equal(z.container, 'zip'); assert.equal(z.files[0].tracks.length, 11);
  assert.equal((await parseAlp(zip({ 'One.als': DEMO, 'Two.als': DEMO }), { alsName: 'Two' })).info.alsEntry, 'Two.als');
});
