import assert from 'node:assert/strict';
import { parseRpp, parseRppText, inspectRpp } from '@dawviz/parser-rpp';
import { test, smf, tempoEv, on, off, fx, assertAstInvariants } from './helpers.mjs';

const item = (pos, len, src, extra = '') => `<ITEM\n POSITION ${pos}\n LENGTH ${len}\n ${extra}\n${src}\n>`;
const midiSrc = (events, extra = '') => `<SOURCE MIDI\n ${extra}\n HASDATA 1 960 QN\n${events.map((e) => ` E ${e}`).join('\n')}\n>`;
const rpp = ({ head = 'TEMPO 120 4 4', env = '', tracks }) => `<REAPER_PROJECT 0.1 "7.0/x64" 1\n ${head}\n${env}\n${tracks.map((t) => `<TRACK\n NAME "${t.name || 'T'}"\n MUTESOLO ${t.mute ? 1 : 0} 0 0\n${t.items.join('\n')}\n>`).join('\n')}\n>\n`;
const NOTE_A = ['0 90 3c 64', '960 80 3c 00'];

test('Template thật: inspect không ném lỗi và đọc đúng tempo/envelope', () => {
  const info = Object.fromEntries(['ode_to_zb.RPP', 'prutypils.rpp', 'tmf-small.RPP', 'youdreamarked-midi.RPP', 'siderite_oneD-8.RPP'].map((f) => [f, inspectRpp(fx(f))]));
  assert.equal(info['siderite_oneD-8.RPP'].baseTempo.bpm, 180);
  assert.equal(info['tmf-small.RPP'].tempoEnvelope.points, 39);
  assert.equal(info['ode_to_zb.RPP'].tempoEnvelope.points, 0);
  assert.ok(info['youdreamarked-midi.RPP'].tracks.some((t) => t.name === 'midi kick'));
});

test('Template thật chỉ có audio/MIDI ngoài: ERR_NO_NOTES, liệt kê file MIDI thiếu; cấp file qua options.files thì đọc được', async () => {
  const f = fx('youdreamarked-midi.RPP');
  let err; try { await parseRpp(f); } catch (e) { err = e; }
  assert.equal(err.code, 'ERR_NO_NOTES'); assert.match(err.message, /03-mididr-00\.mid/);
  const mid = smf({ ppq: 480, tracks: [[tempoEv(0, 120), on(0, 36), off(480, 36), on(960, 36), off(1440, 36)]] });
  const files = { '03-mididr-00.mid': mid };
  const r = await parseRpp(f, { files });
  assert.ok(r.ast.tracks.flatMap((t) => t.notes).length >= 2);
  const kick = r.ast.tracks.find((t) => t.name === 'midi kick');
  assert.equal(kick.notes[0].durationTick, 960);
  assert.equal(r.ast.tracks.length >= 1, true);
  assertAstInvariants(assert, r.ast);
});

test('MIDI nhúng: tick = delta cộng dồn, chuyển đúng sang 960 PPQ; vị trí item tính bằng giây', async () => {
  const t = rpp({ tracks: [{ items: [item(1, 4, midiSrc(['0 90 3c 64', '960 80 3c 00', '0 90 3e 50', '480 80 3e 00']))] }] });
  const { ast } = await parseRppText(t);
  // 120 BPM: 1 giây = 2 beat = 1920 tick
  assert.deepEqual(ast.tracks[0].notes.map((n) => [n.pitch, n.startTick, n.durationTick, n.velocity]), [[60, 1920, 960, 100], [62, 2880, 480, 80]]);
  assert.equal(ast.meta.tempoSource, 'file');
});

test('Item LOOP nhân bản theo độ dài nguồn; cắt ở cuối item', async () => {
  const src = midiSrc(['0 90 3c 64', '960 80 3c 00', '0 90 3e 64', '960 80 3e 00']); // dài 2 beat (delta cộng dồn)
  const t = rpp({ tracks: [{ items: [item(0, 3, src, 'LOOP 1')] }] }); // 3s = 6 beat
  const { ast, warnings } = await parseRppText(t);
  assert.deepEqual(ast.tracks[0].notes.filter((n) => n.pitch === 60).map((n) => n.startTick), [0, 1920, 3840]);
  assert.ok(warnings.some((w) => w.code === 'WARN_RPP_LOOPED_ITEMS'));
  const t2 = rpp({ tracks: [{ items: [item(0, 3, src, 'LOOP 0')] }] });
  assert.equal((await parseRppText(t2)).ast.tracks[0].notes.length, 2);
});

test('Nhiều take: dùng take đang chọn (TAKE SEL)', async () => {
  const body = `<ITEM\n POSITION 0\n LENGTH 4\n${midiSrc(NOTE_A)}\nTAKE SEL\n${midiSrc(['0 90 3e 64', '960 80 3e 00'])}\n>`;
  const { ast } = await parseRppText(rpp({ tracks: [{ items: [body] }] }));
  assert.deepEqual(ast.tracks[0].notes.map((n) => n.pitch), [62]);
});

test('Item MUTE bị bỏ; track mute ẩn; chỉ có track mute -> ERR_NO_NOTES', async () => {
  const mi = item(0, 4, midiSrc(NOTE_A), 'MUTE 1');
  const t = rpp({ tracks: [{ name: 'A', items: [item(0, 4, midiSrc(NOTE_A))] }, { name: 'B', items: [mi] }, { name: 'C', mute: true, items: [item(0, 4, midiSrc(NOTE_A))] }] });
  const { ast, warnings } = await parseRppText(t);
  assert.deepEqual(ast.tracks.filter((x) => x.isVisible).map((x) => x.name), ['A']);
  assert.ok(warnings.some((w) => w.code === 'WARN_RPP_MUTED_ITEMS'));
  await assert.rejects(parseRppText(rpp({ tracks: [{ mute: true, items: [item(0, 4, midiSrc(NOTE_A))] }] })), { code: 'ERR_NO_NOTES' });
});

test('POOLEDEVTS: item thứ hai dùng lại sự kiện của item đầu', async () => {
  const g = '{11111111-2222-3333-4444-555555555555}';
  const full = item(0, 2, midiSrc(NOTE_A, `POOLEDEVTS ${g}`));
  const ref = item(4, 2, `<SOURCE MIDI\n HASDATA 1 960 QN\n POOLEDEVTS ${g}\n>`);
  const { ast } = await parseRppText(rpp({ tracks: [{ items: [full, ref] }] }));
  assert.deepEqual(ast.tracks[0].notes.map((n) => n.startTick), [0, 7680]);
});

test('Tempo envelope: giữ (shape 1) rồi đổi tempo; vị trí giây quy đổi qua bản đồ tempo', async () => {
  const env = '<TEMPOENVEX\n ACT 1 -1\n PT 0 120 1\n PT 2 60 1\n>';
  const { ast } = await parseRppText(rpp({ env, tracks: [{ items: [item(3, 4, midiSrc(NOTE_A))] }] }));
  // 0-2s @120 = 4 beat; 2-3s @60 = 1 beat -> 5 beat = 4800 tick
  assert.equal(ast.tracks[0].notes[0].startTick, 4800);
  assert.ok(Math.abs(ast.tracks[0].notes[0].startTimeSeconds - 3) < 1e-3);
});

test('Không có tempo: fallback có cờ + cảnh báo; tempoOverride thay thế', async () => {
  const t = rpp({ head: '', tracks: [{ items: [item(0, 4, midiSrc(NOTE_A))] }] });
  const a = await parseRppText(t);
  assert.equal(a.ast.meta.tempoSource, 'fallback'); assert.ok(a.warnings.some((w) => w.code === 'WARN_TEMPO_FALLBACK'));
  const b = await parseRppText(t, { tempoOverride: 60 });
  assert.equal(b.ast.meta.tempoSource, 'user'); assert.equal(b.ast.tracks[0].notes[0].durationTick, 960);
  assert.ok(Math.abs(b.ast.tracks[0].notes[0].endTimeSeconds - 1) < 1e-6);
});

test('Gốc sai / rác bị từ chối', async () => {
  await assert.rejects(parseRppText('<OTHER\n>\n'), { code: 'ERR_AST_INVALID' });
  await assert.rejects(parseRpp(Buffer.from('xxx')), (e) => /^ERR_/.test(e.code));
});

test('Dự án Reaper thật (BigProjectDemo2): MIDI nhúng, 1 item pooled, 3147 nốt khớp số Note-On thô', async () => {
  const r = await parseRpp(fx('BigProjectDemo2.rpp'));
  assert.equal(r.ast.tracks.length, 1); assert.equal(r.ast.tracks[0].name, 'Oboe');
  assert.equal(r.ast.tracks[0].notes.length, 3147);
  assert.match(r.ast.meta.sourceVersion, /7\.85/);
  assertAstInvariants(assert, r.ast);
});

test('BigProject3 thật: tham chiếu .mid ngoài; đối chiếu với nốt của Oboe_MIDI_001.mid', async () => {
  const { parseMidi } = await import('@dawviz/parser-midi');
  const f = fx('BigProject3.rpp');
  let err; try { await parseRpp(f); } catch (e) { err = e; }
  assert.equal(err.code, 'ERR_NO_NOTES'); assert.deepEqual(err.details.missingFiles, ['Oboe MIDI 001.mid']);
  // tên bị đổi khoảng trắng → gạch dưới khi tải lên vẫn khớp
  const r = await parseRpp(f, { files: { 'Oboe_MIDI_001.mid': fx('Oboe_MIDI_001.mid') } });
  const direct = await parseMidi(fx('Oboe_MIDI_001.mid'), { tempoOverride: 120 });
  const n = (a) => a.tracks.flatMap((t) => t.notes).length;
  assert.equal(n(r.ast), 3147); assert.equal(n(direct.ast), 3147);
  assert.equal(r.ast.meta.tempoSource, 'file');
  assert.ok(Math.abs(r.ast.meta.totalDurationSeconds - direct.ast.meta.totalDurationSeconds) < 0.01, 'cùng thời lượng');
  assertAstInvariants(assert, r.ast);
});

// Mẫu IGNTEMPO lấy từ trang tài liệu "Interactive Project Map" của Reaper (nguồn MIDI POOLEDEVTS, IGNTEMPO 1 116 4 4), dựng lại đúng cú pháp .rpp
const ignProj = (projBpm, ign) => `<REAPER_PROJECT 0.1 "7.48/macOS-arm64" 1766225573\n  TEMPO ${projBpm} 4 4 0\n  <TRACK\n    NAME t\n    <ITEM\n      POSITION 4.138\n      LENGTH 39.311\n      LOOP 0\n      SOFFS 0\n      <SOURCE MIDI\n        HASDATA 1 960 QN\n        POOLEDEVTS {B8B6F3A4-D7F2-014F-980A-6185DA688A2B}\n        e 3840 90 3e 31\n        e 5760 80 3e 00\n        E 960 90 41 66\n        E 7680 80 41 00\n        E 0 90 3c 49\n        E 6720 80 3c 00\n        E 48001 b0 7b 00\n        IGNTEMPO ${ign}\n      >\n    >\n  >\n>\n`;
test('IGNTEMPO 1 116: nguồn chạy theo BPM riêng (giây tuyệt đối), IGNTEMPO 0: theo tempo dự án', async () => {
  const at = async (proj, ign) => (await parseRppText(ignProj(proj, ign))).ast.tracks[0].notes.map((n) => [n.pitch, +n.startTimeSeconds.toFixed(3), +n.durationSeconds.toFixed(3)]);
  const want = [[62, 6.207, 3.103], [65, 9.828, 4.138], [60, 13.966, 3.621]]; // 4.138 + 3840/960 × 60/116 = 6.207 …
  const a = await at(116, '1 116 4 4'), b = await at(120, '1 116 4 4'); // đổi tempo dự án không làm đổi giây khi IGNTEMPO=1
  for (const got of [a, b]) got.forEach((g, i) => { assert.equal(g[0], want[i][0]); assert.ok(Math.abs(g[1] - want[i][1]) < 0.002 && Math.abs(g[2] - want[i][2]) < 0.002, JSON.stringify(got)); });
  const c = await at(120, '0 120 4 4'); // theo tempo dự án 120: 4.138 + 4×0.5 = 6.138
  assert.ok(Math.abs(c[0][1] - 6.138) < 0.002 && Math.abs(c[0][2] - 3.0) < 0.002, JSON.stringify(c));
});

test('Trang tài liệu Reaper (không phải .rpp thật) bị từ chối gọn, không treo', async () => {
  const { parseProject } = await import('@dawviz/parser');
  await assert.rejects(parseProject('doc.rpp', fx('reaper-doc-sample.txt')), (e) => ['ERR_UNSUPPORTED_FORMAT', 'ERR_AST_INVALID', 'ERR_NO_NOTES'].includes(e.code));
});

test('HASDATA: PPQ đọc động (480 thật, 1920); đơn vị khác QN không đoán → bỏ nguồn + cảnh báo; thiếu đơn vị coi là QN', async () => {
  // BigProject4 thật: HASDATA 1 480 QN, cùng bản nhạc Oboe với BigProjectDemo2 (960) → cùng số nốt và thời lượng
  const r4 = await parseRpp(fx('BigProject4.rpp'));
  assert.equal(r4.ast.tracks.flatMap((t) => t.notes).length, 3147);
  assert.ok(Math.abs(r4.ast.meta.totalDurationSeconds - 165.88) < 0.05);
  const mk = (has, extra = '') => rpp({ tracks: [{ items: [item(0, 4, `<SOURCE MIDI\n ${has}\n E 0 90 3c 64\n E ${extra || 1920} 80 3c 00\n>`)] }] });
  const n1 = async (has, extra) => (await parseRppText(mk(has, extra))).ast.tracks[0].notes[0];
  assert.equal((await n1('HASDATA 1 1920 QN', 1920)).durationTick, 960); // 1920 tick @1920 PPQ = 1 beat = 960 tick
  assert.equal((await n1('HASDATA 1 480 QN', 480)).durationTick, 960);
  assert.equal((await n1('HASDATA 1 960', 960)).durationTick, 960); // thiếu đơn vị: coi là QN
  // đơn vị lạ: bỏ nguồn đó, không đoán; còn nguồn QN thì vẫn đọc
  const mixed = rpp({ tracks: [{ items: [item(0, 4, `<SOURCE MIDI\n HASDATA 1 960 SECONDS\n E 0 90 3c 64\n E 960 80 3c 00\n>`), item(4, 4, midiSrc(NOTE_A))] }] });
  const rm = await parseRppText(mixed);
  assert.equal(rm.ast.tracks[0].notes.length, 1);
  const w = rm.warnings.find((x) => x.code === 'WARN_RPP_SRC_UNIT'); assert.ok(w); assert.equal(w.details.unit, 'SECONDS'); assert.match(w.message, /Reaper bản mới/);
  // chỉ có nguồn không hỗ trợ → ERR_NO_NOTES nêu rõ lý do; PPQ vô lý cũng không đoán
  const only = rpp({ tracks: [{ items: [item(0, 4, `<SOURCE MIDI\n HASDATA 1 960 SECONDS\n E 0 90 3c 64\n E 960 80 3c 00\n>`)] }] });
  await assert.rejects(parseRppText(only), (e) => e.code === 'ERR_NO_NOTES' && /timebase chưa hỗ trợ/.test(e.message) && e.details.unsupportedSources.length === 1);
  await assert.rejects(parseRppText(mk('HASDATA 1 0 QN')), (e) => e.code === 'ERR_NO_NOTES' && e.details.unsupportedSources[0].ppq === '0');
});

test('BigProject4b thật: nhịp 12/8, IGNTEMPO 1 180, envelope âm lượng (chưa đọc, có cảnh báo), tempo envelope rỗng', async () => {
  const r = await parseRpp(fx('BigProject4b.rpp'));
  const p0 = r.ast.tempoMap[0];
  assert.deepEqual([p0.bpm, p0.timeSigNumerator, p0.timeSigDenominator], [120, 12, 8]); // ô nhịp 12/8 ở 120 BPM = 3 s (khớp thước kẻ trong Reaper: 1.1 → 2.1 = 0:03.000)
  assert.equal(r.info.tempoEnvelopePoints, 0);
  const notes = r.ast.tracks[0].notes;
  assert.equal(notes.length, 3147);
  // IGNTEMPO 1 180: cùng bản nhạc ở 120 BPM dài 165.9 s → ở 180 BPM là 110.6 s, bất kể tempo dự án
  assert.ok(Math.abs(r.ast.meta.totalDurationSeconds - 165.88 * 120 / 180) < 0.1, r.ast.meta.totalDurationSeconds);
  assert.ok(Math.abs(notes[1].startTimeSeconds - 1 / 6) < 0.01); // nốt đô thứ hai cách 1/6 s (móc đơn ở 180 BPM)
  // envelope âm lượng của track được đọc vào AST (không còn bị bỏ qua): 3 điểm 0 s=0 dB, 3 s=-26,4 dB (bezier tension 0,6 tới điểm sau), 4,5 s=+3 dB
  const { sampleLane, gainToDb } = await import('@dawviz/parser-core');
  const lane = r.ast.tracks[0].automation.volume;
  assert.deepEqual(lane.points.map((x) => [x.tick, x.shape]), [[0, 0], [5760, 5], [8640, 0]]);
  assert.equal(lane.points[1].tension, 0.6);
  assert.deepEqual(r.ast.tracks[0].mix, { volumeDb: 0, pan: 0 });
  assert.ok(!r.warnings.some((x) => x.code === 'WARN_RPP_ENVELOPES_IGNORED'));
  assert.ok(r.warnings.some((x) => x.code === 'WARN_RPP_ENVELOPE_SHAPE_APPROX'));
  // đối chiếu với số đọc từ giao diện Reaper: con trỏ 0:02.920 → -25.3 dB; con trỏ ≈1.98 s → -15.3 dB (vị trí ước lượng từ ảnh)
  const dbAt = (sec) => gainToDb(sampleLane(lane, Math.round(sec * 2 * 960)));
  assert.ok(Math.abs(dbAt(2.92) - -25.3) < 0.3, dbAt(2.92));
  assert.ok(Math.abs(dbAt(1.98) - -15.3) < 0.5, dbAt(1.98));
  assert.ok(Math.abs(dbAt(0)) < 1e-9 && Math.abs(dbAt(4.5) - 3.0) < 0.01 && Math.abs(dbAt(99) - 3.0) < 0.01);
  assert.equal((await parseRpp(fx('BigProject3.rpp'), { files: { 'Oboe MIDI 001.mid': fx('Oboe_MIDI_001.mid') } })).warnings.some((x) => x.code === 'WARN_RPP_ENVELOPES_IGNORED'), false);
});

test('Envelope: ACT 0 không đọc; envelope item/WIDTHENV/bản trùng loại được đếm ở cảnh báo; pan/mute lưu giá trị thô; điểm trùng vị trí: điểm sau thắng', async () => {
  const env = (name, act, pts) => `<${name}\n ACT ${act} -1\n${pts.map((p) => ` PT ${p}`).join('\n')}\n>`;
  const track = (extra, itemEnv = '') => `<TRACK\n NAME T\n VOLPAN 0.5 0.25 -1 -1 1\n${extra}\n<ITEM\n POSITION 0\n LENGTH 4\n LOOP 0\n${itemEnv}\n${midiSrc(NOTE_A)}\n>\n>`;
  const proj = (t) => `<REAPER_PROJECT 0.1 "7.0/x64" 1\n TEMPO 120 4 4 0\n${t}\n>\n`;
  const r = await parseRppText(proj(track([
    env('VOLENV2', 1, ['0 1 0', '2 0.5 1', '2 0.25 0']),         // điểm trùng ở 2 s: điểm sau thắng
    env('VOLENV', 1, ['0 1 0']),                                    // trùng loại với VOLENV2: không đọc
    env('PANENV2', 1, ['0 -0.5 0', '4 0.5 0']),
    env('MUTEENV', 0, ['0 1 0']),                                   // ACT 0: không đọc
    env('WIDTHENV2', 1, ['0 1 0']),                                 // chưa đọc
  ].join('\n'), env('VOLENV', 1, ['0 1 0']))));
  const a = r.ast.tracks[0].automation;
  assert.deepEqual(Object.keys(a).sort(), ['pan', 'volume']);
  assert.deepEqual(a.volume.points.map((p) => [p.tick, p.value]), [[0, 1], [3840, 0.25]]);
  assert.deepEqual(a.pan.points.map((p) => p.value), [-0.5, 0.5]);
  assert.equal(r.ast.tracks[0].mix.pan, 0.25); assert.ok(Math.abs(r.ast.tracks[0].mix.volumeDb - -6.02) < 0.01);
  const w = r.warnings.find((x) => x.code === 'WARN_RPP_ENVELOPES_IGNORED');
  assert.deepEqual([w.details.ignored, w.details.read], [3, 2]); // VOLENV trùng loại, WIDTHENV2, VOLENV của item
});
