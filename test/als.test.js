import assert from 'node:assert/strict';
import zlib from 'node:zlib';
import { parseAls, decodeAbletonTimeSig, alsInventory } from '@dawviz/parser-als';
import { parseXml, kid, kids, at, val, num } from '@dawviz/parser-core';
import { test, fx, gz, assertAstInvariants } from './helpers.mjs';

const DEMO = fx('Demo.als');

test('Demo.als thật (Live 12.4.16, Gzip XML): cấu trúc, tempo, số nốt', async () => {
  const r = await parseAls(DEMO, { title: 'Demo' });
  const { ast } = r;
  assert.equal(r.info.container, 'gzip');
  assert.match(ast.meta.sourceVersion, /Live 12\.4\.16/);
  assert.equal(ast.meta.tempoSource, 'file');
  assert.equal(ast.tempoMap.length, 1);
  assert.equal(ast.tempoMap[0].bpm, 167);
  assert.deepEqual([ast.tempoMap[0].timeSigNumerator, ast.tempoMap[0].timeSigDenominator], [4, 4]);
  assert.deepEqual(ast.tracks.map((t) => [t.name, t.notes.length]), [
    ['Coffee Leaf', 69], ['Strum', 604], ['Drums', 760], ['The Beat Of History', 95], ['Mello', 35], ['Rose Bass', 147],
    ['Sub Sub Bass', 38], ['Guit Layter', 70], ['Transform Seed', 7600], ['Vacuum', 175], ['Rainstorm', 12]]);
  assert.equal(r.info.arrangementClips, 55);
  assert.equal(r.info.sessionClipsIgnored, 69);
  assert.ok(r.warnings.some((w) => w.code === 'WARN_SESSION_CLIPS_IGNORED'));
  assertAstInvariants(assert, ast);
});

test('XML thuần và Gzip cho kết quả giống hệt nhau', async () => {
  const plain = zlib.gunzipSync(DEMO);
  assert.equal(plain[0], 0x3c); // '<'
  const a = await parseAls(plain, { title: 'x' }), b = await parseAls(DEMO, { title: 'x' });
  assert.equal(a.info.container, 'plain-xml');
  assert.deepEqual(a.ast, b.ast);
});

test('Đối chứng độc lập: công thức clip (không loop) khớp từng nốt của file thật', async () => {
  const { ast } = await parseAls(DEMO, {});
  const root = parseXml(zlib.gunzipSync(DEMO).toString('utf8'), { skip: new Set(['Devices', 'AudioTrack', 'ReturnTrack', 'PreHearTrack', 'ClipSlotList', 'WarpMarkers', 'SampleRef', 'Scenes', 'AudioClip']) });
  const tracks = kids(kid(kid(root, 'LiveSet'), 'Tracks'), 'MidiTrack');
  let checked = 0;
  tracks.forEach((tr, ti) => {
    const expect = [];
    for (const c of kids(at(tr, 'DeviceChain/MainSequencer/ClipTimeable/ArrangerAutomation/Events'), 'MidiClip')) {
      assert.equal(val(c, 'Loop/LoopOn'), 'false'); // file này không có clip lặp: công thức đơn giản đủ làm oracle
      const cs = num(c, 'CurrentStart'), ce = num(c, 'CurrentEnd'), L0 = num(c, 'Loop/LoopStart'), L1 = num(c, 'Loop/LoopEnd');
      for (const kt of kids(at(c, 'Notes/KeyTracks'), 'KeyTrack')) for (const n of kids(kid(kt, 'Notes'), 'MidiNoteEvent')) { if (n.a.IsEnabled === 'false') continue;
        const t = +n.a.Time; if (t < L0 || t >= L1) continue;
        const s = cs + (t - L0); if (s >= ce) continue;
        const e = Math.min(s + +n.a.Duration, ce, cs + (L1 - L0));
        expect.push(`${val(kt, 'MidiKey')}@${Math.round(s * 960)}+${Math.max(1, Math.round(e * 960) - Math.round(s * 960))}`);
      }
    }
    const got = ast.tracks[ti].notes.map((n) => `${n.pitch}@${n.startTick}+${n.durationTick}`);
    assert.deepEqual(got.sort(), expect.sort(), `track ${ti}`);
    checked += got.length;
  });
  assert.equal(checked, 9605);
});

// ---------- dữ liệu tổng hợp cho các nhánh mà file thật không chạm tới
const clip = (cs, ce, L0, L1, SR, loop, notes) => `<MidiClip Time="${cs}"><CurrentStart Value="${cs}"/><CurrentEnd Value="${ce}"/><Loop><LoopStart Value="${L0}"/><LoopEnd Value="${L1}"/><StartRelative Value="${SR}"/><LoopOn Value="${loop}"/></Loop><Notes><KeyTracks>${notes.map(([k, t, d]) => `<KeyTrack><Notes><MidiNoteEvent Time="${t}" Duration="${d}" Velocity="100" IsEnabled="true"/></Notes><MidiKey Value="${k}"/></KeyTrack>`).join('')}</KeyTracks></Notes></MidiClip>`;
const track = (name, speaker, clips) => `<MidiTrack Id="1"><Name><EffectiveName Value="${name}"/></Name><DeviceChain><Mixer><Speaker><Manual Value="${speaker}"/></Speaker></Mixer><MainSequencer><ClipTimeable><ArrangerAutomation><Events>${clips}</Events></ArrangerAutomation></ClipTimeable></MainSequencer></DeviceChain></MidiTrack>`;
const master = (tempoEvents, sigEvents, base = 100) => `<MasterTrack><DeviceChain><Mixer><Tempo><ArrangerAutomation><Events>${tempoEvents}</Events></ArrangerAutomation><Manual Value="${base}"/><AutomationTarget Id="8"/></Tempo><TimeSignature><ArrangerAutomation><Events>${sigEvents}</Events></ArrangerAutomation><Manual Value="201"/><AutomationTarget Id="10"/></TimeSignature></Mixer></DeviceChain></MasterTrack>`;
const live = (m, tracks) => `<?xml version="1.0"?><Ableton Creator="Test Live" MinorVersion="x"><LiveSet><Tracks>${tracks}</Tracks>${m}</LiveSet></Ableton>`;
const simpleMaster = master('<FloatEvent Time="-63072000" Value="120"/>', '<EnumEvent Time="-63072000" Value="201"/>', 120);

test('Clip lặp: start-marker = LoopStart + StartRelative, lặp đến CurrentEnd, cắt nốt ở LoopEnd/CurrentEnd', async () => {
  const x = live(simpleMaster, track('T', 'true', clip(0, 10, 0, 4, 1, 'true', [[60, 0, 1], [62, 1.5, 2]])));
  const { ast } = await parseAls(Buffer.from(x));
  const got = ast.tracks[0].notes.map((n) => [n.pitch, n.startTick, n.endTick]);
  assert.deepEqual(got, [[62, 480, 2400], [60, 2880, 3840], [62, 4320, 6240], [60, 6720, 7680], [62, 8160, 9600]]);
});

test('Clip không lặp: bỏ nốt trước start-marker và nốt sau LoopEnd (giống file thật)', async () => {
  const x = live(simpleMaster, track('T', 'true', clip(44, 54, 4, 14, 0, 'false', [[60, 3, 1], [61, 4.5, 1], [62, 13.9, 5], [63, 14, 1]])));
  const { ast } = await parseAls(Buffer.from(x));
  assert.deepEqual(ast.tracks[0].notes.map((n) => [n.pitch, n.startTick]), [[61, Math.round(44.5 * 960)], [62, Math.round(53.9 * 960)]]);
  assert.equal(ast.tracks[0].notes[1].endTick, 54 * 960); // cắt tại CurrentEnd
});

test('Track tắt tiếng: giữ trong AST nhưng ẩn; chỉ có track tắt tiếng -> ERR_NO_NOTES, showMuted cứu được', async () => {
  const both = live(simpleMaster, track('A', 'true', clip(0, 4, 0, 4, 0, 'false', [[60, 0, 1]])) + track('B', 'false', clip(0, 4, 0, 4, 0, 'false', [[61, 0, 1]])));
  const { ast } = await parseAls(Buffer.from(both));
  assert.deepEqual(ast.tracks.map((t) => [t.name, t.isMuted, t.isVisible]), [['A', false, true], ['B', true, false]]);
  const only = live(simpleMaster, track('B', 'false', clip(0, 4, 0, 4, 0, 'false', [[61, 0, 1]])));
  await assert.rejects(parseAls(Buffer.from(only)), { code: 'ERR_NO_NOTES' });
  const ok = await parseAls(Buffer.from(only), { showMuted: true });
  assert.equal(ok.ast.tracks[0].isVisible, true);
});

test('Tempo automation dốc tuyến tính + đổi nhịp 6/8 bằng EnumEvent', async () => {
  const m = master('<FloatEvent Time="-63072000" Value="100"/><FloatEvent Time="4" Value="100"/><FloatEvent Time="8" Value="200"/>', '<EnumEvent Time="-63072000" Value="201"/><EnumEvent Time="16" Value="302"/>');
  const { ast, warnings } = await parseAls(Buffer.from(live(m, track('T', 'true', clip(0, 4, 0, 4, 0, 'false', [[60, 0, 1]])))));
  const tm = ast.tempoMap;
  assert.equal(tm[0].bpm, 100);
  const ramp = tm.filter((p) => p.tick >= 3840 && p.tick < 7680);
  assert.ok(ramp.length >= 4);
  assert.ok(ramp.every((p, i) => i === 0 || p.bpm > ramp[i - 1].bpm), 'bpm phải tăng dần trên đoạn dốc');
  const last = tm.find((p) => p.tick === 7680); assert.equal(last.bpm, 200);
  const avg = ramp.reduce((s, p, i) => { const nx = (ramp[i + 1]?.tick ?? 7680); return s + p.bpm * (nx - p.tick); }, 0) / 3840;
  assert.ok(Math.abs(avg - 150) < 1, `bpm trung bình ${avg}`);
  const sig = tm.find((p) => p.tick === 16 * 960);
  assert.deepEqual([sig.timeSigNumerator, sig.timeSigDenominator], [6, 8]);
  assert.ok(warnings.some((w) => w.code === 'WARN_TEMPO_RAMP'));
  assert.deepEqual([decodeAbletonTimeSig(201), decodeAbletonTimeSig(200)], [{ num: 4, den: 4 }, { num: 3, den: 4 }]);
});

test('Không có tempo: cờ fallback + cảnh báo; tempoOverride thay thế', async () => {
  const x = live('<MasterTrack/>', track('T', 'true', clip(0, 4, 0, 4, 0, 'false', [[60, 0, 1]])));
  const a = await parseAls(Buffer.from(x));
  assert.equal(a.ast.meta.tempoSource, 'fallback');
  assert.ok(a.warnings.some((w) => w.code === 'WARN_TEMPO_FALLBACK'));
  const b = await parseAls(Buffer.from(x), { tempoOverride: 90 });
  assert.equal(b.ast.meta.tempoSource, 'user'); assert.equal(b.ast.tempoMap[0].bpm, 90);
});

test('An toàn: DOCTYPE/entity không bị mở rộng; Gzip bom bị chặn; rác bị từ chối', async () => {
  const xxe = '<?xml version="1.0"?><!DOCTYPE a [<!ENTITY x SYSTEM "file:///etc/passwd">]><Ableton><LiveSet><Tracks>' + track('&x;', 'true', clip(0, 4, 0, 4, 0, 'false', [[60, 0, 1]])) + '</Tracks>' + simpleMaster + '</LiveSet></Ableton>';
  const r = await parseAls(Buffer.from(xxe));
  assert.equal(r.ast.tracks[0].name, '&x;');
  const bomb = gz(Buffer.alloc(40e6));
  await assert.rejects(parseAls(bomb), { code: 'ERR_ARCHIVE_TOO_LARGE' });
  await assert.rejects(parseAls(gz(Buffer.alloc(5e6)), { limits: { maxUnzippedBytes: 1e6 } }), { code: 'ERR_ARCHIVE_TOO_LARGE' });
  await assert.rejects(parseAls(Buffer.from('hello world')), { code: 'ERR_UNSUPPORTED_FORMAT' });
  await assert.rejects(parseAls(Buffer.from('<?xml version="1.0"?><Other/>')), { code: 'ERR_AST_INVALID' });
});

test('alsInventory liệt kê đường dẫn thật của file (dùng để đối chiếu [VERIFY])', async () => {
  const inv = await alsInventory(DEMO, { maxDepth: 40 });
  const p = inv.find((r) => r.path === '/Ableton/LiveSet/Tracks/MidiTrack/DeviceChain/MainSequencer/ClipTimeable/ArrangerAutomation/Events/MidiClip');
  assert.equal(p.count, 55);
  assert.ok(inv.some((r) => r.path.startsWith('/Ableton/LiveSet/MainTrack/DeviceChain/Mixer/Tempo')));
});

import { normalizeTempoOverride } from '@dawviz/parser-core';
test('tempoOverride theo mốc: tick / beat / timeSeconds (đổi tuần tự qua bản đồ tempo), tự thêm điểm 0, lỗi rõ ràng', () => {
  assert.deepEqual(normalizeTempoOverride(90), [{ tick: 0, bpm: 90, num: 4, den: 4 }]);
  // 120 BPM tới 2s (= 4 beat = 3840 tick), sau đó 60 BPM tới 3s (+1 beat), rồi 240
  const g = normalizeTempoOverride([{ timeSeconds: 0, bpm: 120 }, { timeSeconds: 2, bpm: 60 }, { timeSeconds: 3, bpm: 240 }]);
  assert.deepEqual(g.map((p) => [p.tick, p.bpm]), [[0, 120], [3840, 60], [4800, 240]]);
  assert.deepEqual(normalizeTempoOverride([{ beat: 8, bpm: 100 }, { beat: 0, bpm: 140 }]).map((p) => [p.tick, p.bpm]), [[0, 140], [7680, 100]]);
  assert.deepEqual(normalizeTempoOverride([{ timeSeconds: 1, bpm: 120 }]).map((p) => [p.tick, p.bpm]), [[0, 120], [1920, 120]]); // điểm đầu không ở 0 -> thêm điểm 0
  assert.deepEqual(normalizeTempoOverride([{ tick: 0, bpm: 100 }, { tick: 0, bpm: 110 }]).map((p) => p.bpm), [110]); // trùng vị trí: điểm sau thắng
  for (const bad of [0, 9, 1001, NaN, [], [{ bpm: 0 }], [{ bpm: 100, tick: 1, beat: 1 }], [{ bpm: 100, tick: -1 }], [{ bpm: 100, tick: 0 }, { bpm: 90, timeSeconds: 2 }], 'abc']) assert.throws(() => normalizeTempoOverride(bad), { code: 'ERR_AST_INVALID' });
});

test('parsePositionText: đọc vị trí theo cách DAW hiển thị', async () => {
  const { parsePositionText: p } = await import('@dawviz/parser-core');
  assert.deepEqual(p('0:00.000'), { timeSeconds: 0 });
  assert.deepEqual(p('90.5'), { timeSeconds: 90.5 });
  assert.deepEqual(p('1:30.250'), { timeSeconds: 90.25 });
  assert.deepEqual(p('1:02:03.5'), { timeSeconds: 3723.5 });
  assert.deepEqual(p('1.1.00', { unit: 'reaper' }), { beat: 0 });
  assert.deepEqual(p('5.3.50', { unit: 'reaper' }), { beat: 16 + 2 + 0.5 });
  assert.deepEqual(p('3.2', { unit: 'reaper', numerator: 3 }), { beat: 7 });
  assert.deepEqual(p('1.1.1', { unit: 'sixteenth' }), { beat: 0 });
  assert.deepEqual(p('2.3.4:00', { unit: 'sixteenth' }), { beat: 4 + 2 + 0.75 });
  for (const [x, o] of [['', {}], ['abc', {}], ['1:75', {}], ['0.1.1', { unit: 'sixteenth' }], ['1.5.1', { unit: 'sixteenth' }], ['1.1.5', { unit: 'sixteenth' }], ['1.1.00', { unit: 'lạ' }]])
    assert.throws(() => p(x, o), { code: 'ERR_AST_INVALID' }, x);
});

test('parseTimeSignature + resolveTempoRows: đổi nhịp 4/4 → 3/4 → 12/8 theo bar.beat', async () => {
  const { parseTimeSignature: ts, resolveTempoRows: rr, parsePositionText: pp } = await import('@dawviz/parser-core');
  assert.deepEqual(ts('3/4'), { num: 3, den: 4 }); assert.deepEqual(ts(' 12 / 8 '), { num: 12, den: 8 });
  for (const x of ['', '4', '0/4', '4/3', '65/4', 'a/b', '4/64']) assert.throws(() => ts(x), { code: 'ERR_AST_INVALID' }, x);
  // 12/8: beat DAW = nốt móc đơn = 0.5 nốt đen
  assert.deepEqual(pp('2.1.00', { unit: 'reaper', numerator: 12, denominator: 8 }), { beat: 6 });
  // 4/4 bar 1-3 (8 beat) → 3/4 từ bar 3 (bar 3.1 = beat 8) → 12/8 từ bar 5 (3/4: 2 bar × 3 = 6 → beat 14)
  const pts = rr([
    { pos: '1.1.00', bpm: 120 },
    { pos: '3.1.00', bpm: 120, sig: '3/4' },
    { pos: '5.1.00', bpm: 90, sig: '12/8' },
    { pos: '6.1.00', bpm: 90 },
  ], { unit: 'reaper' });
  assert.deepEqual(pts.map((p) => p.beat), [0, 8, 14, 14 + 6]);
  assert.deepEqual(pts.map((p) => `${p.num}/${p.den}`), ['4/4', '3/4', '12/8', '12/8']);
  // theo thời gian: sig chỉ gắn nhịp, vị trí là giây
  const t = rr([{ pos: '0:00.000', bpm: 100, sig: '3/4' }, { pos: '0:10', bpm: 140 }], { unit: 'time' });
  assert.deepEqual(t.map((p) => p.timeSeconds), [0, 10]); assert.equal(t[1].num, 3);
});

test('Reaper đếm beat theo mẫu số: 12/8 @120 BPM, con trỏ 1.12.68 = 0:02.920 (đối chiếu giao diện Reaper)', async () => {
  const { parsePositionText: pp } = await import('@dawviz/parser-core');
  const { beat } = pp('1.12.68', { unit: 'reaper', numerator: 12, denominator: 8 });
  assert.ok(Math.abs(beat - 5.84) < 1e-9);
  assert.ok(Math.abs(beat * 60 / 120 - 2.92) < 1e-9); // 5,84 nốt đen × 0,5 s
  assert.throws(() => pp('1.13.00', { unit: 'reaper', numerator: 12, denominator: 8 }), { code: 'ERR_AST_INVALID' });
});

test('Automation: sampleLane theo hình dạng, volumeToUnit', async () => {
  const { sampleLane, gainToDb, dbToGain, volumeToUnit, shapeCurve } = await import('@dawviz/parser-core');
  const P = (tick, value, shape = 0, tension) => ({ tick, timeSeconds: tick / 1920, value, shape, ...(tension !== undefined ? { tension } : {}) });
  const pan = { kind: 'pan', points: [P(0, -1), P(1000, 1)] };
  assert.equal(sampleLane(pan, -5), -1); assert.equal(sampleLane(pan, 500), 0); assert.equal(sampleLane(pan, 5000), 1);
  const sq = { kind: 'mute', points: [P(0, 0, 1), P(1000, 1)] };
  assert.equal(sampleLane(sq, 999), 0); assert.equal(sampleLane(sq, 1000), 1); // bậc thang giữ giá trị tới điểm kế
  const vol = { kind: 'volume', points: [P(0, 1), P(1000, dbToGain(-24))] };
  assert.ok(Math.abs(gainToDb(sampleLane(vol, 500)) - -9.97) < 0.05); // nội suy trong không gian fader, không phải dB tuyến tính (-12) cũng không phải biên độ tuyến tính (-6,0)
  assert.equal(sampleLane({ kind: 'volume', points: [] }, 5), undefined);
  assert.ok(shapeCurve(0.5, 4) < 0.5 && shapeCurve(0.5, 3) > 0.5 && shapeCurve(0.5, 2) === 0.5);
  assert.equal(volumeToUnit(1), 1); assert.equal(volumeToUnit(dbToGain(-36)), 0); assert.equal(volumeToUnit(0), 0);
  assert.ok(Math.abs(volumeToUnit(dbToGain(-18)) - 0.5) < 1e-9);
  assert.ok(Math.abs(volumeToUnit(dbToGain(-12), { floorDb: -24, ceilDb: 0 }) - 0.5) < 1e-9);
  assert.equal(volumeToUnit(dbToGain(6)), 1);
});
