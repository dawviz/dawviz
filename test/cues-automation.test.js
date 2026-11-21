// P-10 marker, P-11 lời, P-13 automation (SOI-18): MIDI, Reaper, Ableton, DAWproject.
import assert from 'node:assert/strict';
import { parseMidi } from '@dawviz/parser-midi';
import { parseRppText } from '@dawviz/parser-rpp';
import { parseAlsText } from '@dawviz/parser-als';
import { parseDawprojectXml } from '@dawviz/parser-dawproject';
import { buildAST } from '@dawviz/parser-core';
import { test, assertAstInvariants } from './helpers.mjs';

const str = (s) => [...Buffer.from(s, 'utf8')];
const meta = (delta, type, text) => [delta, 0xff, type, text.length, ...str(text)];
const smf = (events) => {
  const trk = [...events, 0, 0xff, 0x2f, 0];
  return Buffer.from([...str('MThd'), 0, 0, 0, 6, 0, 0, 0, 1, 0x01, 0xe0, ...str('MTrk'), 0, 0, (trk.length >> 8) & 255, trk.length & 255, ...trk]);
};

test('buildAST: marker/lời được chuẩn hoá, sắp theo tick, bỏ chữ rỗng, có giờ theo TempoMap', () => {
  const { ast } = buildAST({ title: 't', sourcePPQ: 960, tempoPoints: [{ tick: 0, bpm: 120 }], markers: [{ tick: 1920, name: '  Verse  ' }, { tick: 0, name: 'Intro' }, { tick: 5, name: '' }], lyrics: [{ tick: 960, text: 'la' }],
    tracks: [{ name: 'a', notes: [{ pitch: 60, startTick: 0, endTick: 960, velocity: 90 }] }] });
  assert.deepEqual(ast.meta.markers.map((m) => [m.name, m.tick, m.timeSeconds]), [['Intro', 0, 0], ['Verse', 1920, 1]]);
  assert.equal(ast.meta.lyrics[0].text, 'la'); assert.equal(ast.meta.lyrics[0].timeSeconds, 0.5);
  const none = buildAST({ title: 't', tempoPoints: [{ tick: 0, bpm: 120 }], tracks: [{ name: 'a', notes: [{ pitch: 60, startTick: 0, endTick: 960, velocity: 90 }] }] }).ast;
  assert.equal(none.meta.markers, undefined); assert.equal(none.meta.lyrics, undefined);
});

test('MIDI: marker (0x06) và lời (0x05) quy về tick 960', async () => {
  const buf = smf([...meta(0, 0x06, 'Intro'), ...meta(0, 0x05, 'La'), 0, 0x90, 60, 100, 0x83, 0x60, 0x80, 60, 0, ...meta(0, 0x05, 'la-')]);
  const { ast } = await parseMidi(buf);
  assert.equal(ast.meta.markers[0].name, 'Intro');
  assert.deepEqual(ast.meta.lyrics.map((l) => l.text), ['La', 'la-']);
  assertAstInvariants(assert, ast);
});

test('MIDI: không có Lyric thì không lấy Text lẻ tẻ làm lời (cần ≥ 3 dòng Text, bỏ @ của .kar)', async () => {
  const buf = smf([...meta(0, 0x01, '@KMIDI KARAOKE FILE'), 0, 0x90, 60, 100, 0x60, 0x80, 60, 0]);
  const { ast } = await parseMidi(buf);
  assert.equal(ast.meta.lyrics, undefined);
});

const RPP = `<REAPER_PROJECT 0.1 "6.0"
  TEMPO 120 4 4
  MARKER 1 0.000000 "Intro" 0
  MARKER 2 4.000000 "Verse 1" 0
  MARKER 3 8.000000 "" 0
  <TRACK
    NAME "a"
    <ITEM
      POSITION 0
      LENGTH 2
      <SOURCE MIDI
        HASDATA 1 960 QN
        E 0 90 3c 60
        E 960 80 3c 00
      >
    >
  >
>`;
test('Reaper: MARKER → meta.markers (giây → tick theo tempo), bỏ marker không tên', async () => {
  const { ast } = await parseRppText(RPP);
  assert.deepEqual(ast.meta.markers.map((m) => [m.name, m.timeSeconds]), [['Intro', 0], ['Verse 1', 4]]);
  assert.equal(ast.meta.markers[1].tick, 7680); // 4 s × 2 beat/s × 960
});

const ALS = `<?xml version="1.0"?><Ableton Creator="x" MinorVersion="1"><LiveSet>
<MasterTrack><DeviceChain><Mixer><Tempo><Manual Value="120"/></Tempo></Mixer></DeviceChain></MasterTrack>
<Locators><Locators><Locator Id="0"><Time Value="0"/><Name Value="Intro"/></Locator><Locator Id="1"><Time Value="8"/><Name Value="Drop"/></Locator></Locators></Locators>
<Tracks><MidiTrack Id="5"><Name><EffectiveName Value="Lead"/></Name>
<AutomationEnvelopes><Envelopes>
<AutomationEnvelope Id="0"><EnvelopeTarget><PointeeId Value="77"/></EnvelopeTarget><Automation><Events>
<FloatEvent Id="0" Time="-63072000" Value="1"/><FloatEvent Id="1" Time="4" Value="1"/><FloatEvent Id="2" Time="8" Value="0.5" CurveControl1X="0.3" CurveControl1Y="0" CurveControl2X="0.7" CurveControl2Y="1"/>
</Events></Automation></AutomationEnvelope></Envelopes></AutomationEnvelopes>
<DeviceChain><Mixer><Volume><Manual Value="1"/><AutomationTarget Id="77"/></Volume><Pan><Manual Value="0"/><AutomationTarget Id="78"/></Pan></Mixer>
<MainSequencer><ClipTimeable><ArrangerAutomation><Events><MidiClip Id="0"><CurrentStart Value="0"/><CurrentEnd Value="4"/><Loop><LoopStart Value="0"/><LoopEnd Value="4"/><StartRelative Value="0"/><LoopOn Value="false"/></Loop>
<Notes><KeyTracks><KeyTrack Id="0"><Notes><MidiNoteEvent Time="0" Duration="1" Velocity="100" IsEnabled="true"/></Notes><MidiKey Value="60"/></KeyTrack></KeyTracks></Notes></MidiClip></Events></ArrangerAutomation></ClipTimeable></MainSequencer></DeviceChain></MidiTrack></Tracks></LiveSet></Ableton>`;
test('Ableton: Locators → marker; automation Volume của track (Time là beat, giá trị khởi đầu Time < 0, đoạn cong xấp xỉ)', () => {
  const { ast, warnings } = parseAlsText(ALS);
  assert.deepEqual(ast.meta.markers.map((m) => [m.name, m.tick]), [['Intro', 0], ['Drop', 7680]]);
  const lane = ast.tracks[0].automation?.volume;
  assert.ok(lane, 'có lane volume');
  assert.deepEqual(lane.points.map((p) => [p.tick, p.value, p.shape]), [[0, 1, 0], [3840, 1, 2], [7680, 0.5, 0]]);
  assert.equal(ast.tracks[0].automation.pan, undefined, 'pan không có envelope');
  assert.ok(warnings.some((w) => w.code === 'WARN_RPP_ENVELOPE_SHAPE_APPROX'));
});

const DP = `<?xml version="1.0"?><Project version="1.0"><Application name="x" version="1"/><Transport><Tempo value="120" unit="bpm"/><TimeSignature numerator="4" denominator="4"/></Transport>
<Structure><Track id="t1" name="Lead" contentType="notes"><Channel role="regular"><Volume id="v1" value="1" unit="linear"/><Pan id="p1" value="0.5" unit="normalized"/><Mute value="false"/></Channel></Track></Structure>
<Arrangement><Markers timeUnit="beats"><Marker time="0" name="Intro"/><Marker time="8" name="Verse"/></Markers>
<Lanes timeUnit="beats"><Lanes track="t1"><Clips><Clip time="0" playStart="0" playStop="4"><Notes><Note time="0" duration="1" key="60" vel="0.5"/></Notes></Clip>
<Clip time="4" duration="4" enable="false"><Notes><Note time="0" duration="1" key="62" vel="0.5"/></Notes></Clip></Clips></Lanes>
<Points track="t1" unit="linear"><Target parameter="v1"/><RealPoint time="0" value="1" interpolation="linear"/><RealPoint time="4" value="0.5" interpolation="linear"/></Points>
<Points track="t1" unit="normalized"><Target expression="pan"/><RealPoint time="0" value="0.25"/><RealPoint time="2" value="1"/></Points></Lanes></Arrangement></Project>`;
test('DAWproject: Markers, clip thiếu duration (suy từ playStop), clip enable=false, automation Volume/Pan qua Target', () => {
  const { ast } = parseDawprojectXml(DP);
  assert.deepEqual(ast.meta.markers.map((m) => [m.name, m.tick]), [['Intro', 0], ['Verse', 7680]]);
  assert.equal(ast.tracks[0].notes.length, 1, 'clip tắt bị bỏ; clip thiếu duration vẫn phát');
  const a = ast.tracks[0].automation;
  assert.deepEqual(a.volume.points.map((p) => [p.tick, p.value, p.shape]), [[0, 1, 0], [3840, 0.5, 0]]);
  assert.deepEqual(a.pan.points.map((p) => [p.tick, p.value, p.shape]), [[0, -0.5, 1], [1920, 1, 1]]);
});
test('DAWproject: Markers tính bằng giây theo tempo', () => {
  const { ast } = parseDawprojectXml(DP.replace('<Markers timeUnit="beats"><Marker time="0" name="Intro"/><Marker time="8" name="Verse"/>', '<Markers timeUnit="seconds"><Marker time="1" name="A"/>'));
  assert.equal(ast.meta.markers[0].tick, 1920);
});
