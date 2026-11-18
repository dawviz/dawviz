// FL Studio (.flp): schema JSON dựng sẵn schemas/flp.schema.json chạy trên engine nhị phân (D-62).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseProject, detectFormat, probeProject, BUILTIN_SCHEMAS, validateSchema, SUPPORTED } from '@dawviz/parser';
import { test, flp, flpEv, flpNote, flpClip, flpAuto, flpRemote, flpChanClip, zip, fx, assertAstInvariants } from './helpers.mjs';

// Dự án tối thiểu: 2 kênh (Lead, Bass), 2 pattern; Lead có pattern 1 xếp ở tick 0 và 768 (clip thứ hai bị cắt còn 96 tick).
function project(extra = []) {
  return flp({ events: [
    flpEv(199, '12.3.0.72'), flpEv(156, 140000), flpEv(17, 4), flpEv(18, 4), flpEv(194, 'Bài thử'),
    flpEv(64, 0), flpEv(21, 2), flpEv(0, 1), flpEv(203, 'Lead'),
    flpEv(64, 1), flpEv(21, 2), flpEv(0, 0), flpEv(203, 'Bass'), // Bass bị tắt
    flpEv(65, 1), flpEv(224, Buffer.concat([flpNote({ pos: 0, rack: 0, key: 60, dur: 48 }), flpNote({ pos: 96, rack: 0, key: 64, dur: 200 }), flpNote({ pos: 0, rack: 1, key: 36, dur: 96, vel: 90 })])),
    flpEv(233, Buffer.concat([flpClip({ pos: 0, len: 384, pat: 1 }), flpClip({ pos: 768, len: 192, pat: 1, so: 0 }), flpClip({ pos: 1152, len: 384, pat: 1, flags: 64 | 4096 })])),
    flpEv(236, Buffer.alloc(12)), flpEv(203, 'Slot FX'), // sau 236 là mixer: tên này KHÔNG được đè tên kênh
    ...extra,
  ] });
}

test('FLP: nhận dạng và ánh xạ nốt Pattern lên Playlist (tick @96 → @960)', async () => {
  assert.equal(detectFormat('a.flp', project()).format, 'flp');
  const r = await parseProject('Song.flp', project(), { showMuted: true });
  assert.equal(r.format, 'flp');
  const { ast } = r;
  assert.equal(ast.meta.sourceFormat, 'flp'); assert.equal(ast.meta.sourceVersion, '12.3.0.72'); assert.equal(ast.meta.sourcePPQ, 96);
  assert.equal(ast.tempoMap[0].bpm, 140); assert.equal(ast.meta.tempoSource, 'file');
  const lead = ast.tracks.find((t) => t.name === 'Lead');
  // clip 1 (0..384): cả 2 nốt giữ nguyên; clip 2 (768, len 192): nốt tại 0 và 96, nốt sau bị cắt dur 200 → 96; clip 3 bị tắt tiếng nên bỏ
  assert.deepEqual(lead.notes.map((n) => [n.pitch, n.startTick, n.durationTick]), [[60, 0, 480], [64, 960, 2000], [60, 7680, 480], [64, 8640, 960]]);
  assert.equal(lead.isMuted, false);
  const bass = ast.tracks.find((t) => t.name === 'Bass');
  assert.equal(bass.isMuted, true); assert.equal(bass.notes.length, 2);
  assert.ok(!ast.tracks.some((t) => t.name === 'Slot FX'));
  assertAstInvariants(assert, ast);
  assert.equal((await parseProject('Song.flp', project())).ast.tracks.find((t) => t.name === 'Bass').isVisible, false, 'kênh tắt bị ẩn khi không showMuted');
});

test('FLP: startoffset của clip dời nốt; nốt trước điểm bắt đầu bị bỏ', async () => {
  const b = flp({ events: [
    flpEv(199, '12.3.0.72'), flpEv(156, 120000), flpEv(64, 0), flpEv(21, 2), flpEv(203, 'A'),
    flpEv(65, 1), flpEv(224, Buffer.concat([flpNote({ pos: 0, key: 50 }), flpNote({ pos: 96, key: 52, dur: 24 })])),
    flpEv(233, flpClip({ pos: 384, len: 192, so: 96 })),
  ] });
  const t = (await parseProject('a.flp', b)).ast.tracks[0];
  assert.deepEqual(t.notes.map((n) => [n.pitch, n.startTick]), [[52, 3840]]);
});

test('FLP: clip âm thanh/automation bị bỏ kèm cảnh báo; tên dự phòng khi kênh không có tên', async () => {
  const audioClip = Buffer.alloc(32); audioClip.writeUInt16LE(20480, 4); audioClip.writeUInt16LE(3, 6); audioClip.writeUInt32LE(384, 8);
  const r = await parseProject('a.flp', flp({ events: [
    flpEv(199, '21.0.3.3517'), flpEv(156, 100000), flpEv(64, 0), flpEv(21, 0), flpEv(196, 'C:\\Samples\\Kick 01.wav'),
    flpEv(65, 1), flpEv(224, flpNote({ pos: 0, key: 36 })),
    flpEv(233, Buffer.concat([flpClip({ pos: 0 }), audioClip].map((x) => Buffer.concat([x, Buffer.alloc(28)])))), // FL ≥ 20.99 có 28 byte phụ mỗi clip (ở đây 21.0 → 60 byte)
  ] }));
  assert.equal(r.ast.tracks[0].name, 'Kick 01');
  assert.ok(r.warnings.some((w) => w.code === 'WARN_FLP_CLIPS_SKIPPED'));
});

test('FLP: phiên bản < 12, tệp cụt, độ dài khai khống → lỗi có mã, không treo', async () => {
  await assert.rejects(parseProject('a.flp', flp({ events: [flpEv(199, '11.0.0.1'), flpEv(156, 120000)] })), (e) => e.code === 'ERR_AST_INVALID' && /12/.test(e.message));
  const good = project();
  await assert.rejects(parseProject('a.flp', good.subarray(0, good.length - 7)), (e) => /^ERR_/.test(e.code));
  const lie = flp({ events: [flpEv(199, '12.0.0.1'), Buffer.from([0xe0, 0xff, 0xff, 0xff, 0x7f])] }); // blob khai 2^35 byte
  await assert.rejects(parseProject('a.flp', lie), (e) => /^ERR_/.test(e.code));
  await assert.rejects(parseProject('a.flp', Buffer.from('MThd....')), { code: 'ERR_UNSUPPORTED_FORMAT' });
  await assert.rejects(parseProject('a.flp', flp({ events: [flpEv(199, '12.0.0.1'), flpEv(156, 120000)] })), { code: 'ERR_NO_NOTES' });
});

test('FLP: .flp dạng ZIP (zipped loop package) lấy .flp bên trong', async () => {
  const z = zip({ 'Song/samples/kick.wav': 'RIFF', 'Song/Song.flp': project() });
  const r = await parseProject('Song.flp', z);
  assert.equal(r.format, 'flp'); assert.equal(r.ast.tracks[0].name, 'Lead');
  assert.throws(() => detectFormat('x.flp', zip({ 'a.txt': 'x' })), { code: 'ERR_UNSUPPORTED_FORMAT' });
});

test('FLP: probeProject không mời nạp schema; schema người dùng nạp thắng schema dựng sẵn', async () => {
  assert.deepEqual(probeProject('a.flp', project()), { format: 'flp', needs: { externalMidi: [], schema: false } });
  assert.ok(SUPPORTED.some((s) => s.format === 'flp'));
  const mine = { ...BUILTIN_SCHEMAS[0], id: 'mine' };
  assert.equal(detectFormat('a.flp', project(), { schemas: [mine] }).schema.id, 'mine');
});

test('FLP: module schema dựng sẵn khớp tệp schemas/flp.schema.json và hợp lệ', () => {
  const json = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../schemas/flp.schema.json'), 'utf8'));
  assert.deepEqual(BUILTIN_SCHEMAS.find((s) => s.id === 'flp'), json, 'chạy: node scripts/gen-builtin-schemas.mjs');
  validateSchema(json);
});

test('FLP tệp thật big roar.flp: 128 BPM, 7 kênh, 2150 nốt, nhanh', async () => {
  const buf = fx('big roar.flp');
  const t0 = performance.now();
  const r = await parseProject('big roar.flp', buf, { showMuted: true });
  const ms = performance.now() - t0;
  assert.equal(r.ast.meta.sourceVersion, '12.3.0.72'); assert.equal(r.ast.tempoMap[0].bpm, 128);
  assert.deepEqual(r.ast.tracks.map((t) => [t.name, t.notes.length]), [['Massive', 790], ['Massive #3', 44], ['Massive #2', 32], ['Massive #6', 410], ['Serum', 302], ['Massive #8', 410], ['Adieu Snare 6', 162]]);
  assert.ok(r.warnings.some((w) => w.code === 'WARN_FLP_CLIPS_SKIPPED'));
  assertAstInvariants(assert, r.ast);
  assert.ok(ms < 2000, `parse ${ms.toFixed(0)} ms`);
});

test('FLP FL 25: sự kiện 172 dài 3 byte và clip Playlist 80 byte', async () => {
  const clip = (c) => Buffer.concat([flpClip(c), Buffer.alloc(48)]);
  const r = await parseProject('a.flp', flp({ events: [
    flpEv(199, '25.2.5.5319'), Buffer.from([172, 1, 1, 0]), flpEv(156, 140000), flpEv(64, 0), flpEv(21, 2), flpEv(203, 'Lead'),
    flpEv(65, 1), flpEv(224, flpNote({ pos: 0, key: 60 })),
    flpEv(233, Buffer.concat([clip({ pos: 0, len: 384 }), clip({ pos: 384, len: 384 })])),
  ] }));
  assert.deepEqual(r.ast.tracks[0].notes.map((n) => n.startTick), [0, 3840]);
});

test('FLP tệp thật FL 25.2 (11-7-26 ambient vocal.flp): 140 BPM, 18 track, 1361 nốt', async () => {
  const r = await parseProject('11-7-26 ambient vocal.flp', fx('11-7-26 ambient vocal.flp'), { showMuted: true });
  assert.equal(r.ast.meta.sourceVersion, '25.2.5.5319'); assert.equal(r.ast.tempoMap[0].bpm, 140);
  assert.equal(r.ast.tracks.length, 18); assert.equal(r.ast.tracks.reduce((s, t) => s + t.notes.length, 0), 1361);
  assertAstInvariants(assert, r.ast);
});

test('FLP: yawwapsy.zip (FL 10 trong ZIP kèm sample) được mở ZIP rồi báo rõ cần FL ≥ 12', async () => {
  await assert.rejects(parseProject('yawwapsy.zip', fx('yawwapsy.zip')), (e) => e.code === 'ERR_AST_INVALID' && /12/.test(e.message));
});

// ---- automation: lane volume/pan của track từ clip automation trên Playlist
const g = (fxn) => (fxn + 128) << 6; // nhóm đích "insert fxn" (FL ≤ 24)
function autoProject({ remote, channelFx = 1, version = '12.3.0.72', extraEv = [] }) {
  return flp({ events: [
    flpEv(199, version), flpEv(156, 120000),
    flpEv(64, 0), flpEv(21, 2), flpEv(203, 'Lead'), ...(channelFx === null ? [] : [flpEv(22, channelFx)]),
    flpEv(64, 5), flpEv(21, 5), flpEv(203, 'Auto'), flpEv(234, flpAuto([[0, 0.2], [2, 0.8], [1, 0.4]])), flpEv(227, remote),
    flpEv(65, 1), flpEv(224, flpNote({ pos: 0 })),
    flpEv(233, Buffer.concat([flpClip({ pos: 0, len: 384 }), flpChanClip({ pos: 384, len: 384, chan: 5 })])),
    ...extraEv,
  ] });
}

test('FLP automation: volume insert của kênh → lane volume (gain = (v/0,8)³), tick @960, điểm cộng dồn theo beat', async () => {
  const b = autoProject({ remote: flpRemote(5, g(1), 0x1fc0) });
  const lead = (await parseProject('a.flp', b)).ast.tracks.find((t) => t.name === 'Lead');
  const lane = lead.automation.volume;
  assert.equal(lane.kind, 'volume');
  // clip tại tick 384 (@96); điểm tại beat 0, 2, 3 → 384, 576, 672 (@96) → ×10
  assert.deepEqual(lane.points.map((p) => p.tick), [3840, 5760, 6720]);
  assert.ok(Math.abs(lane.points[0].value - (0.2 / 0.8) ** 3) < 1e-9 && Math.abs(lane.points[1].value - (0.8 / 0.8) ** 3) < 1e-9);
  assert.ok(lane.points.every((p) => Number.isFinite(p.timeSeconds)) && lane.points[1].timeSeconds > lane.points[0].timeSeconds);
  assert.equal(lead.automation.pan, undefined);
  assertAstInvariants(assert, (await parseProject('a.flp', b)).ast);
});

test('FLP automation: pan và volume của chính kênh; insert khác bị bỏ và có cảnh báo', async () => {
  const pan = (await parseProject('a.flp', autoProject({ remote: flpRemote(5, 0, 1) }))).ast.tracks.find((t) => t.name === 'Lead');
  assert.equal(pan.automation.pan.points[0].value, 0.2 * 2 - 1);
  const vol = (await parseProject('a.flp', autoProject({ remote: flpRemote(5, 0, 0) }))).ast.tracks.find((t) => t.name === 'Lead');
  assert.ok(vol.automation.volume);
  const other = await parseProject('a.flp', autoProject({ remote: flpRemote(5, g(3), 0x1fc0) })); // kênh Lead đi insert 1, đích là insert 3
  assert.equal(other.ast.tracks.find((t) => t.name === 'Lead').automation, undefined);
  const plugin = await parseProject('a.flp', autoProject({ remote: flpRemote(5, 0, 0x8001) })); // tham số plugin: chưa đọc
  assert.equal(plugin.ast.tracks[0].automation, undefined);
  assert.ok(plugin.warnings.some((w) => w.code === 'WARN_FLP_CLIPS_SKIPPED'));
});

test('FLP FL 25: nhóm insert 0x7000+ và insert gắn theo tên khi không có sự kiện 22', async () => {
  const b = flp({ events: [
    flpEv(199, '25.2.5.5319'), Buffer.from([172, 1, 1, 0]), flpEv(156, 120000),
    flpEv(64, 0), flpEv(21, 2), flpEv(203, 'Serum'),
    flpEv(64, 5), flpEv(21, 5), flpEv(203, 'Auto'), flpEv(234, flpAuto([[0, 0.5]])), flpEv(227, flpRemote(5, 0x7000 + 64, 0x1fc0)),
    flpEv(65, 1), flpEv(224, flpNote({ pos: 0 })),
    flpEv(233, Buffer.concat([Buffer.concat([flpClip({ pos: 0, len: 384 }), Buffer.alloc(48)]), Buffer.concat([flpChanClip({ pos: 0, len: 384, chan: 5 }), Buffer.alloc(48)])])),
    flpEv(236, Buffer.alloc(12)), flpEv(204, 'Serum'), flpEv(236, Buffer.alloc(12)), // insert 0 (master) rồi tên "Serum" đứng trước insert 1
  ] });
  // tên insert (204) đứng trước 236 của chính nó; ở đây 204 nằm sau 236 đầu (master) nên thuộc insert 1
  const r = await parseProject('a.flp', b);
  assert.ok(r.ast.tracks.find((t) => t.name === 'Serum').automation.volume);
});

test('FLP tệp thật FL 25.2: track "Serum 2" có lane volume 48 điểm (16 clip automation × 3 điểm)', async () => {
  const r = await parseProject('11-7-26 ambient vocal.flp', fx('11-7-26 ambient vocal.flp'), { showMuted: true });
  const s = r.ast.tracks.find((t) => t.name === 'Serum 2');
  assert.equal(s.automation.volume.points.length, 48);
  assert.equal(s.automation.volume.points[0].tick, 0);
  assert.ok(r.ast.tracks.filter((t) => t.automation).length === 1);
});

test('FLP FL 26: clip Playlist 88 byte', async () => {
  const clip = (c) => Buffer.concat([flpClip(c), Buffer.alloc(56)]);
  const r = await parseProject('a.flp', flp({ events: [
    flpEv(199, '26.1.7.5654'), Buffer.from([172, 1, 1, 0]), flpEv(156, 122000), flpEv(64, 0), flpEv(21, 2), flpEv(203, 'Lead'),
    flpEv(65, 1), flpEv(224, flpNote({ pos: 0, key: 60 })),
    flpEv(233, Buffer.concat([clip({ pos: 0, len: 384 }), clip({ pos: 384, len: 384 })])),
  ] }));
  assert.deepEqual(r.ast.tracks[0].notes.map((n) => n.startTick), [0, 3840]);
});

// Tệp thật đã thử (không commit): [tên, phiên bản, BPM, số track, số nốt]
const REAL = [
  ['TS404 Template_v20.8.flp', '20.8.3.2293', 140, 1, 17],
  ['TRANCECRAFTER_37.flp', '21.2.1.3859', 141.998, 28, 33487],
  ['Promise.flp', '24.1.2.4394', 86.991, 13, 8201],
  ['fun song.flp', '25.2.3.5171', 128, 7, 2286],
  ['3x OSC Abuse.flp', '26.1.6.5639', 165, 5, 1331],
  ['Ction_35.flp', '26.1.99.5789', 120, 6, 320],
  ['HOUSE, TRANCE (SB, KS10, SIR)_21_NEW.flp', '26.1.7.5654', 122, 9, 1618],
];
for (const [name, ver, bpm, tracks, notes] of REAL) {
  // tên tệp nằm trong biến nên test() không tự nhận ra: bỏ qua tường minh khi thiếu tệp bên thứ ba (CI không có)
  test(`FLP tệp thật FL ${ver} (${name})`, { skip: fx(name).length === 0 && 'thiếu tệp mẫu bên thứ ba (test/fixtures/third-party/)' }, async () => {
    const r = await parseProject(name, fx(name), { showMuted: true });
    assert.equal(r.ast.meta.sourceVersion, ver); assert.equal(r.ast.tempoMap[0].bpm, bpm);
    assert.equal(r.ast.tracks.length, tracks); assert.equal(r.ast.tracks.reduce((s, t) => s + t.notes.length, 0), notes);
    assertAstInvariants(assert, r.ast);
  });
}
