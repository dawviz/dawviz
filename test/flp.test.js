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
  assert.equal(r.ast.meta.sourceVersion, '12.3.0.72'); assert.ok(Math.abs(r.ast.tempoMap[0].bpm - 128) < 1e-3);
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

test('FLP automation: volume insert của kênh → lane volume (gain insert = (e^(3v) − 1)/(e^2,4 − 1)), tick @960, điểm cộng dồn theo beat', async () => {
  const b = autoProject({ remote: flpRemote(5, g(1), 0x1fc0) });
  const lead = (await parseProject('a.flp', b)).ast.tracks.find((t) => t.name === 'Lead');
  const lane = lead.automation.volume;
  assert.equal(lane.kind, 'volume');
  // clip tại tick 384 (@96); điểm tại beat 0, 2, 3 → 384, 576, 672 (@96) → ×10
  assert.deepEqual(lane.points.map((p) => p.tick), [3840, 5760, 6720]);
  const fader = (v) => (Math.exp(3 * v) - 1) / (Math.exp(2.4) - 1);
  assert.ok(Math.abs(lane.points[0].value - fader(0.2)) < 1e-9 && Math.abs(lane.points[1].value - 1) < 1e-9);
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
    assert.equal(r.ast.meta.sourceVersion, ver); assert.ok(Math.abs(r.ast.tempoMap[0].bpm - bpm) < 1e-3);
    assert.equal(r.ast.tracks.length, tracks); assert.equal(r.ast.tracks.reduce((s, t) => s + t.notes.length, 0), notes);
    assertAstInvariants(assert, r.ast);
  });
}

// Tệp tự tạo (FL 25.2.5): clip automation volume dài 4 bar, điểm đầu −30 dB, điểm cuối +5 dB nằm đúng cuối clip.
test('FLP thật: lane volume giữ điểm đúng tại cuối clip (mixer_vol_auto.flp)', { skip: fx('mixer_vol_auto.flp').length === 0 && 'thiếu tệp mẫu bên thứ ba (test/fixtures/third-party/)' }, async () => {
  const r = await parseProject('mixer_vol_auto.flp', fx('mixer_vol_auto.flp'), {});
  const pts = (r.ast ?? r).tracks[0].automation.volume.points;
  assert.equal(pts.length, 2);
  assert.equal(pts[0].tick, 0);
  assert.equal(pts[1].tick, 4 * 4 * 960);
  assert.ok(Math.abs(20 * Math.log10(pts[1].value) - 5) < 0.5, 'điểm cuối ≈ +5 dB');
});

// Ảnh Playlist của FL cho thấy nốt chỉ ở bar 1 (clip 4 bar, một nhãn, không vạch lặp), nên KHÔNG lặp: giữ đúng 4 nốt.
// Độ dài pattern không suy được từ nốt cuối (đã thử, sai so với FL); xem SPIKE-3 FLP-L1.
test('FLP thật: clip 4 bar, nốt chỉ ở bar 1 → không lặp (looped_pattern.flp)', { skip: fx('looped_pattern.flp').length === 0 && 'thiếu tệp mẫu bên thứ ba (test/fixtures/third-party/)' }, async () => {
  const r = await parseProject('looped_pattern.flp', fx('looped_pattern.flp'), {});
  assert.deepEqual((r.ast ?? r).tracks[0].notes.map((n) => [n.pitch, n.startTick]), [[67, 0], [69, 960], [71, 1920], [72, 2880]]);
});

// Cặp tệp chỉ khác độ dài nốt/pattern (FL 25.2.5; cùng clip 4 bar): chỉ khác sự kiện nốt 224, `167` và dấu thời gian `237`.
// FL không lặp ở tệp 1 bar (ảnh Playlist), nên parser giữ nguyên độ dài nốt, không lặp.
for (const [name, dur] of [['1barpattern.flp', 3840], ['4barpattern.flp', 15360]]) {
  test(`FLP thật: ${name} → một nốt dài ${dur / 3840} bar, không lặp`, { skip: fx(name).length === 0 && 'thiếu tệp mẫu bên thứ ba (test/fixtures/third-party/)' }, async () => {
    const r = await parseProject(name, fx(name), {});
    assert.deepEqual((r.ast ?? r).tracks[0].notes.map((n) => [n.pitch, n.startTick, n.endTick - n.startTick]), [[60, 0, dur]]);
  });
}

// Đường cong fader insert: 6 điểm biết trước (−30 → 0 → −∞ → −10 → −20 → +5 dB, beat 0/4/8/10/12/16), sai số ≤ 0,05 dB.
// Tệp lưu dt dạng float32 (2,000000238…) nên điểm cuối cộng dồn thành 16,0000005 beat: phải vẫn nằm trong clip.
test('FLP thật: đường cong volume insert khớp các mức dB đã đặt (mixer_vol_auto2.flp)', { skip: fx('mixer_vol_auto2.flp').length === 0 && 'thiếu tệp mẫu bên thứ ba (test/fixtures/third-party/)' }, async () => {
  const r = await parseProject('mixer_vol_auto2.flp', fx('mixer_vol_auto2.flp'), {});
  const pts = (r.ast ?? r).tracks[0].automation.volume.points;
  assert.deepEqual(pts.map((p) => p.tick), [0, 3840, 7680, 9600, 11520, 15360]);
  const db = pts.map((p) => 20 * Math.log10(p.value));
  [-30, 0, -Infinity, -10, -20, 5].forEach((want, i) => assert.ok(want === -Infinity ? db[i] === -Infinity : Math.abs(db[i] - want) < 0.05, `điểm ${i}: ${db[i]} dB, mong ${want} dB`));
});

// ---- automation tempo (đích 0x4000/5): bpm = 60 + 120·v; dốc lấy mẫu mỗi nửa beat (giá trị giữa đoạn, như dawproject), giữ = bậc thang
const tempoProject = (pts, extra = []) => flp({ events: [
  flpEv(199, '25.2.5.5319'), flpEv(156, 120000), flpEv(17, 4), flpEv(18, 4),
  flpEv(64, 0), flpEv(21, 2), flpEv(203, 'Lead'),
  flpEv(64, 5), flpEv(21, 5), flpEv(203, 'Tempo'), flpEv(234, flpAuto(pts)), flpEv(227, flpRemote(5, 0x4000, 5)),
  flpEv(65, 1), flpEv(224, flpNote({ pos: 0 })),
  flpEv(233, Buffer.concat([flpClip({ pos: 0, len: 384 }), flpChanClip({ pos: 384, len: 384, chan: 5, stride: 80 })].map((x) => (x.length === 32 ? Buffer.concat([x, Buffer.alloc(48)]) : x)))),
  ...extra,
] });
const at = (m, tick) => m.find((p) => p.tick === tick);

test('FLP automation tempo: đoạn dốc → các bậc nhỏ, điểm cuối đúng giá trị, bpm = 60 + 120·v; cảnh báo WARN_TEMPO_RAMP', async () => {
  // clip tại tick 384 (@96) = 3840 (@960), dài 384 → 3840; điểm 0,5 (120 BPM) rồi sau 4 beat 0,75 (150 BPM)
  const r = await parseProject('t.flp', tempoProject([[0, 0.5], [4, 0.75]]));
  const m = r.ast.tempoMap;
  assert.equal(m[0].tick, 0); assert.ok(Math.abs(m[0].bpm - 120) < 1e-9, 'tempo dự án trước clip');
  // 8 bậc nửa beat (480 tick); bậc đầu ở giá trị giữa đoạn: 120 + 30 · (0,5/8)
  assert.ok(Math.abs(at(m, 3840).bpm - (120 + 30 * (0.5 / 8))) < 1e-9);
  assert.ok(Math.abs(at(m, 7680).bpm - 150) < 1e-9, 'giá trị cuối clip được giữ');
  assert.equal(m.length, 1 + 8 + 1);
  assert.ok(r.warnings.some((w) => w.code === 'WARN_TEMPO_RAMP'));
  assert.ok(!r.warnings.some((w) => w.code === 'WARN_FLP_CLIPS_SKIPPED'), 'clip tempo không còn bị coi là bỏ qua');
  assertAstInvariants(assert, r.ast);
});

test('FLP automation tempo: đoạn "giữ" giữ giá trị cũ rồi nhảy bậc; đoạn cong xấp xỉ thẳng kèm WARN_TEMPO_SHAPE', async () => {
  const hold = await parseProject('t.flp', tempoProject([[0, 0.5], [2, 0.75, 'hold'], [2, 0.25, 'linear']]));
  const m = hold.ast.tempoMap;
  assert.ok(Math.abs(at(m, 3840).bpm - 120) < 1e-9, 'giá trị đầu giữ đến điểm kế');
  assert.ok(!m.some((p) => p.tick > 3840 && p.tick < 3840 + 1920), 'không có mẫu nào giữa hai điểm của đoạn giữ');
  // tại điểm giữ: nhảy lên 150, nhưng đoạn dốc kế tiếp (150 → 90, 4 bậc) ghi đè bằng giá trị giữa bậc đầu = 60 + 120·(0,75 − 0,5·0,125)
  assert.ok(Math.abs(at(m, 3840 + 1920).bpm - (60 + 120 * (0.75 - 0.5 * 0.125))) < 1e-9, 'nhảy bậc tại điểm giữ');
  assert.ok(!hold.warnings.some((w) => w.code === 'WARN_TEMPO_SHAPE'));
  const curve = await parseProject('t.flp', tempoProject([[0, 0.5], [4, 0.75, 'curve']]));
  assert.ok(curve.warnings.some((w) => w.code === 'WARN_TEMPO_SHAPE'));
});

test('FLP automation tempo: tempo ngoài [10, 1000] BPM bị từ chối bằng mã lỗi (không treo, không NaN)', async () => {
  await assert.rejects(parseProject('t.flp', tempoProject([[0, 20], [4, 20]])), (e) => e.code === 'ERR_AST_INVALID');
});

// Tệp thật (FL 25.2.5, tự tạo): tempo dự án 70; clip tempo 4 bar: 70 → 160 (cong) → 150 → giữ → 96 → 80,57 BPM ở beat 0/4/8/10/16.
test('FLP thật: tempo automation (tempo_auto_2.flp) khớp các giá trị đã đặt', { skip: fx('tempo_auto_2.flp').length === 0 && 'thiếu tệp mẫu bên thứ ba (test/fixtures/third-party/)' }, async () => {
  const r = await parseProject('tempo_auto_2.flp', fx('tempo_auto_2.flp'), {});
  const m = r.ast.tempoMap;
  assert.ok(Math.abs(at(m, 7680).bpm - 150) < 0.01, 'điểm beat 8 = 150 BPM');
  assert.ok(Math.abs(at(m, 15360).bpm - 80.5714) < 0.01, 'điểm cuối beat 16 = 80,57 BPM');
  assert.ok(m.every((p) => p.bpm >= 60 && p.bpm <= 160.01));
  assert.ok(!m.some((p) => p.tick > 7680 && p.tick < 9600), 'đoạn giữ 150 BPM từ beat 8 đến 10');
  assert.ok(r.warnings.some((w) => w.code === 'WARN_TEMPO_SHAPE') && r.warnings.some((w) => w.code === 'WARN_TEMPO_RAMP'));
});

// big roar.flp (FL 12.3): 4 clip tempo phẳng, mọi giá trị = 128 BPM = tempo dự án (công thức cũ 10 + 512·v cho 300 BPM nên sai).
test('FLP thật: big roar.flp có 4 clip tempo phẳng đúng 128 BPM', { skip: fx('big roar.flp').length === 0 && 'thiếu tệp mẫu bên thứ ba (test/fixtures/third-party/)' }, async () => {
  const r = await parseProject('big roar.flp', fx('big roar.flp'), { showMuted: true });
  assert.equal(r.ast.tempoMap.length, 4);
  assert.ok(r.ast.tempoMap.every((p) => Math.abs(p.bpm - 128) < 1e-3));
});
