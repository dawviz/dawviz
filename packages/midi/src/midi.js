// Standard MIDI File (format 0/1/2). REQ-PARSER-04.
import { fail, warn, resolveLimits, toU8, PPQ, mergeTempoAndSig, buildAST, createPairer, normalizeTempoOverride } from '@dawviz/parser-core';

/**
 * Đọc thô SMF -> { format, division, tempos, sigs, tracks:[{name, notes:[{pitch,channel,startTick,endTick,velocity}], controllers:[{tick,ch,cc,value}]}] } (tick theo PPQ nguồn).
 * `controllers`: Control Change (cc 0–127, value 0–127) và Pitch Bend (cc = PITCH_BEND, value −8192..8191), theo thứ tự trong tệp.
 * Dùng chung cho Reaper (nguồn MIDI ngoài).
 */
export function readSmf(u8, warnings = []) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const str = (o, n) => String.fromCharCode(...u8.subarray(o, o + n));
  if (u8.length < 14 || str(0, 4) !== 'MThd') fail('ERR_AST_INVALID', 'thiếu chunk MThd');
  const hl = dv.getUint32(4), format = dv.getUint16(8), ntr = dv.getUint16(10), division = dv.getUint16(12);
  if (division & 0x8000) fail('ERR_UNSUPPORTED_FORMAT', 'MIDI division kiểu SMPTE chưa hỗ trợ');
  if (division === 0) fail('ERR_AST_INVALID', 'division = 0');
  let p = 8 + hl;
  const tempos = [], sigs = [], tracks = [], markers = [], lyrics = [], texts = [];
  let truncated = false, hanging = 0;
  for (let ti = 0; ti < ntr && p + 8 <= u8.length; ti++) {
    const id = str(p, 4), size = dv.getUint32(p + 4); p += 8;
    const end = Math.min(p + size, u8.length);
    if (p + size > u8.length) truncated = true;
    if (id !== 'MTrk') { p = end; continue; }
    let tick = 0, running = 0, name = '';
    const pairs = createPairer(), ctl = [];
    const vlq = () => { let v = 0, n = 0, b; do { if (p >= end || n++ >= 4) { p = end + 1; return 0; } b = u8[p++]; v = (v << 7) | (b & 0x7f); } while (b & 0x80); return v; };
    while (p < end) {
      tick += vlq(); if (p > end) { truncated = true; break; }
      let st = u8[p];
      if (st < 0x80) { if (!running) { truncated = true; break; } st = running; } else p++;
      if (st === 0xff) {
        const type = u8[p++], len = vlq();
        if (p + len > end) { truncated = true; break; }
        if (type === 0x51 && len === 3) tempos.push({ tick, bpm: 60000000 / ((u8[p] << 16) | (u8[p + 1] << 8) | u8[p + 2]) });
        else if (type === 0x58 && len >= 2) sigs.push({ tick, num: u8[p], den: 2 ** u8[p + 1] });
        else if ((type === 0x06 || type === 0x05 || type === 0x01) && len > 0) {
          const text = new TextDecoder().decode(u8.subarray(p, p + len)).replace(/\0+$/, '');
          if (type === 0x06) markers.push({ tick, name: text }); else if (type === 0x05) lyrics.push({ tick, text }); else texts.push({ tick, text });
        }
        else if (type === 0x03 && !name) name = new TextDecoder().decode(u8.subarray(p, p + len)).replace(/\0+$/, '');
        p += len;
        if (type === 0x2f) break;
      } else if (st === 0xf0 || st === 0xf7) { const len = vlq(); p += len; }
      else {
        running = st;
        const hi = st & 0xf0, ch = st & 0x0f;
        const d1 = u8[p++]; const d2 = hi === 0xc0 || hi === 0xd0 ? 0 : u8[p++];
        if (hi === 0x90 && d2 > 0) pairs.on((ch << 8) | d1, tick, d2);
        else if (hi === 0x80 || (hi === 0x90 && d2 === 0)) pairs.off((ch << 8) | d1, tick);
        else if (hi === 0xb0 && d1 < 0x80 && d2 < 0x80) ctl.push({ tick, ch, cc: d1, value: d2 }); // Control Change (T-66)
        else if (hi === 0xe0 && d1 < 0x80 && d2 < 0x80) ctl.push({ tick, ch, cc: PITCH_BEND, value: ((d2 << 7) | d1) - 8192 }); // Pitch Bend 14 bit, tâm 0
      }
    }
    hanging += pairs.flush(tick);
    tracks.push({ name, notes: pairs.notes.map((n) => ({ pitch: n.key & 0xff, channel: n.key >> 8, startTick: n.start, endTick: n.end, velocity: n.vel })), controllers: ctl });
    p = end;
  }
  if (truncated) warn(warnings, 'WARN_MIDI_TRUNCATED', 'file MIDI bị cắt cụt hoặc có sự kiện lỗi; đọc phần hợp lệ');
  if (hanging) warn(warnings, 'WARN_MIDI_HANGING_NOTES', `${hanging} nốt thiếu Note-Off, đã kéo dài đến cuối track`);
  // Lời: Lyric (0x05); không có thì lấy Text (0x01) kiểu karaoke, bỏ dòng tiêu đề của .kar (bắt đầu bằng @) và dòng điều khiển (\\ /).
  const kar = texts.filter((x) => !/^[@]/.test(x.text));
  return { format, division, tempos, sigs, tracks, markers, lyrics: lyrics.length ? lyrics : kar.length >= 3 ? kar : [] };
}

// ───────────── automation từ MIDI CC / pitch bend (T-66, REQ-AST-02) ─────────────
export const PITCH_BEND = -1;
/** Tên chuẩn của các CC hay dùng (MIDI 1.0). CC khác: "CC<n>". */
export const CC_NAMES = Object.freeze({
  1: 'Mod Wheel', 2: 'Breath', 4: 'Foot Pedal', 5: 'Portamento Time', 7: 'Volume', 8: 'Balance', 10: 'Pan', 11: 'Expression', 12: 'Effect 1', 13: 'Effect 2',
  64: 'Sustain', 65: 'Portamento', 66: 'Sostenuto', 67: 'Soft Pedal', 68: 'Legato', 69: 'Hold 2', 71: 'Resonance', 72: 'Release', 73: 'Attack', 74: 'Cutoff',
  91: 'Reverb', 92: 'Tremolo', 93: 'Chorus', 94: 'Detune', 95: 'Phaser',
});
/**
 * CC không phải đường automation mà là lệnh cài đặt: Bank Select (0, 32), Data Entry (6, 38), Data Inc/Dec + NRPN/RPN (96–101),
 * Channel Mode (120–127). Không thành lane và không cảnh báo (tệp MIDI nào cũng có; không phải dữ liệu vẽ được).
 */
export const CC_NOT_AUTOMATION = new Set([0, 32, 6, 38, 96, 97, 98, 99, 100, 101, 120, 121, 122, 123, 124, 125, 126, 127]);
export const ccLaneName = (cc) => (cc === PITCH_BEND ? 'Pitch Bend' : CC_NAMES[cc] ? `${CC_NAMES[cc]} (CC${cc})` : `CC${cc}`);

/**
 * Sự kiện điều khiển của một track → lane automation `{ ccN | pitchBend }` (giá trị thô: CC 0–127, pitch bend −8192..8191, kèm `range`;
 * chuẩn hoá về 0..1 ở Render Core). Điểm dạng bậc thang (shape 1) vì MIDI CC giữ giá trị tới sự kiện kế; cùng tick thì sự kiện sau thắng;
 * giá trị lặp lại liền nhau bị gộp. Một controller xuất hiện ở nhiều kênh trong cùng track: lấy kênh `mainCh` (kênh có nhiều nốt nhất),
 * không có thì kênh nhỏ nhất; kênh khác bị bỏ và đếm vào `stats.otherChannels`.
 * @param {Array<{tick:number,ch:number,cc:number,value:number}>} ctl tick đã quy về 960
 */
export function controllerLanes(ctl, mainCh, stats = { otherChannels: 0, setup: 0 }) {
  const by = new Map();
  for (const e of ctl) {
    if (e.cc !== PITCH_BEND && CC_NOT_AUTOMATION.has(e.cc)) { stats.setup++; continue; }
    let chs = by.get(e.cc); if (!chs) by.set(e.cc, (chs = new Map()));
    let list = chs.get(e.ch); if (!list) chs.set(e.ch, (list = []));
    list.push(e);
  }
  const out = {};
  for (const cc of [...by.keys()].sort((a, b) => a - b)) {
    const chs = by.get(cc), ch = chs.has(mainCh) ? mainCh : Math.min(...chs.keys());
    for (const [c, l] of chs) if (c !== ch) stats.otherChannels += l.length;
    const evs = chs.get(ch).slice().sort((a, b) => a.tick - b.tick); // sắp ổn định: cùng tick giữ thứ tự trong tệp
    const points = [];
    for (const e of evs) {
      const last = points[points.length - 1];
      if (last && last.tick === e.tick) { last.value = e.value; continue; }
      points.push({ tick: e.tick, value: e.value, shape: 1 });
    }
    const pts = points.filter((p, i) => i === 0 || p.value !== points[i - 1].value);
    const pb = cc === PITCH_BEND;
    out[pb ? 'pitchBend' : `cc${cc}`] = pb
      ? { kind: 'pitch-bend', name: ccLaneName(cc), range: { min: -8192, max: 8191 }, points: pts }
      : { kind: 'midi-cc', name: ccLaneName(cc), param: { name: `CC${cc}`, index: cc }, range: { min: 0, max: 127 }, points: pts };
  }
  return out;
}

export async function parseMidi(buffer, options = {}) {
  const limits = resolveLimits(options.limits);
  const u8 = toU8(buffer);
  if (u8.length > limits.maxFileBytes) fail('ERR_FILE_TOO_LARGE', `${u8.length} byte`);
  const warnings = [];
  const smf = readSmf(u8, warnings);
  const k = PPQ / smf.division;
  const sc = (t) => Math.round(t * k);
  const tracks = [];
  const stats = { otherChannels: 0, setup: 0 };
  // Kênh chính của một danh sách nốt: kênh có nhiều nốt nhất (hoà thì kênh nhỏ hơn); không có nốt → -1.
  const mainChannel = (notes) => { const c = new Map(); for (const n of notes) c.set(n.channel, (c.get(n.channel) || 0) + 1); let best = -1, k = 0; for (const [ch, v] of c) if (v > k || (v === k && ch < best)) { best = ch; k = v; } return best; };
  const withLanes = (t, ctl, ch) => {
    const automation = controllerLanes(ctl.map((e) => ({ ...e, tick: sc(e.tick) })), ch, stats);
    return Object.keys(automation).length ? { ...t, automation } : t;
  };
  if (smf.format === 0 && smf.tracks.length === 1) {
    const byCh = new Map(), src = smf.tracks[0];
    for (const n of src.notes) { if (!byCh.has(n.channel)) byCh.set(n.channel, []); byCh.get(n.channel).push(n); }
    for (const [ch, list] of [...byCh].sort((a, b) => a[0] - b[0])) tracks.push(withLanes({ name: `Channel ${ch + 1}${ch === 9 ? ' (drums)' : ''}`, notes: list }, src.controllers.filter((e) => e.ch === ch), ch));
  } else for (const t of smf.tracks) tracks.push(withLanes({ name: t.name, notes: t.notes }, t.controllers, mainChannel(t.notes)));
  for (const t of tracks) t.notes = t.notes.map((n) => ({ ...n, startTick: sc(n.startTick), endTick: sc(n.endTick) }));
  if (stats.otherChannels) warn(warnings, 'WARN_MIDI_CC_CHANNELS', `${stats.otherChannels} sự kiện CC/pitch bend ở kênh khác kênh chính của track bị bỏ qua`, { events: stats.otherChannels });

  const ov = normalizeTempoOverride(options.tempoOverride);
  let tempoPoints, tempoSource = 'file';
  if (ov) { tempoPoints = ov; tempoSource = 'user'; }
  else {
    const T = smf.tempos.map((t) => ({ ...t, tick: sc(t.tick) })), S = smf.sigs.map((s) => ({ ...s, tick: sc(s.tick) }));
    tempoPoints = mergeTempoAndSig(T, S);
    if (!T.length) { tempoSource = 'midi-default'; warn(warnings, 'WARN_TEMPO_MIDI_DEFAULT', 'MIDI không có Set Tempo: theo chuẩn SMF dùng 120 BPM. Nếu sai, truyền options.tempoOverride.'); }
  }
  const { ast } = buildAST({ title: options.title || 'MIDI', sourceFormat: 'mid', sourceVersion: `SMF format ${smf.format}, division ${smf.division}`, sourcePPQ: smf.division, tempoPoints, tempoSource, tracks, warnings, markers: smf.markers.map((m) => ({ ...m, tick: sc(m.tick) })), lyrics: smf.lyrics.map((l) => ({ ...l, tick: sc(l.tick) })) }, { maxNotes: limits.maxNotes, showMuted: options.showMuted });
  return { ast, warnings, info: { smfFormat: smf.format, division: smf.division, smfTracks: smf.tracks.length } };
}
