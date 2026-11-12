// Standard MIDI File (format 0/1/2). REQ-PARSER-04.
import { fail, warn, resolveLimits, toU8, PPQ, mergeTempoAndSig, buildAST, createPairer, normalizeTempoOverride } from '@dawviz/parser-core';

/**
 * Đọc thô SMF -> { format, division, tempos, sigs, tracks:[{name, notes:[{pitch,channel,startTick,endTick,velocity}]}] } (tick theo PPQ nguồn).
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
  const tempos = [], sigs = [], tracks = [];
  let truncated = false, hanging = 0;
  for (let ti = 0; ti < ntr && p + 8 <= u8.length; ti++) {
    const id = str(p, 4), size = dv.getUint32(p + 4); p += 8;
    const end = Math.min(p + size, u8.length);
    if (p + size > u8.length) truncated = true;
    if (id !== 'MTrk') { p = end; continue; }
    let tick = 0, running = 0, name = '';
    const pairs = createPairer();
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
      }
    }
    hanging += pairs.flush(tick);
    tracks.push({ name, notes: pairs.notes.map((n) => ({ pitch: n.key & 0xff, channel: n.key >> 8, startTick: n.start, endTick: n.end, velocity: n.vel })) });
    p = end;
  }
  if (truncated) warn(warnings, 'WARN_MIDI_TRUNCATED', 'file MIDI bị cắt cụt hoặc có sự kiện lỗi; đọc phần hợp lệ');
  if (hanging) warn(warnings, 'WARN_MIDI_HANGING_NOTES', `${hanging} nốt thiếu Note-Off, đã kéo dài đến cuối track`);
  return { format, division, tempos, sigs, tracks };
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
  if (smf.format === 0 && smf.tracks.length === 1) {
    const byCh = new Map();
    for (const n of smf.tracks[0].notes) { if (!byCh.has(n.channel)) byCh.set(n.channel, []); byCh.get(n.channel).push(n); }
    for (const [ch, list] of [...byCh].sort((a, b) => a[0] - b[0])) tracks.push({ name: `Channel ${ch + 1}${ch === 9 ? ' (drums)' : ''}`, notes: list });
  } else for (const t of smf.tracks) tracks.push(t);
  for (const t of tracks) t.notes = t.notes.map((n) => ({ ...n, startTick: sc(n.startTick), endTick: sc(n.endTick) }));

  const ov = normalizeTempoOverride(options.tempoOverride);
  let tempoPoints, tempoSource = 'file';
  if (ov) { tempoPoints = ov; tempoSource = 'user'; }
  else {
    const T = smf.tempos.map((t) => ({ ...t, tick: sc(t.tick) })), S = smf.sigs.map((s) => ({ ...s, tick: sc(s.tick) }));
    tempoPoints = mergeTempoAndSig(T, S);
    if (!T.length) { tempoSource = 'midi-default'; warn(warnings, 'WARN_TEMPO_MIDI_DEFAULT', 'MIDI không có Set Tempo: theo chuẩn SMF dùng 120 BPM. Nếu sai, truyền options.tempoOverride.'); }
  }
  const { ast } = buildAST({ title: options.title || 'MIDI', sourceFormat: 'mid', sourceVersion: `SMF format ${smf.format}, division ${smf.division}`, sourcePPQ: smf.division, tempoPoints, tempoSource, tracks, warnings }, { maxNotes: limits.maxNotes, showMuted: options.showMuted });
  return { ast, warnings, info: { smfFormat: smf.format, division: smf.division, smfTracks: smf.tracks.length } };
}
