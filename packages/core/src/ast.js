// Dựng + xác thực UnifiedProjectAST (REQ-AST-01). Mọi parser đều đi qua buildAST.
import { fail, warn } from './errors.js';
import { PPQ, makeTempoMap, tickToSec } from './tempo.js';

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const pitchName = (p) => NAMES[p % 12] + (Math.floor(p / 12) - 1);
const PALETTE = ['#4aa3ff', '#ff9a3c', '#6fdc8c', '#ff6b9d', '#b08cff', '#ffd166', '#4fd1c5', '#f56565', '#90cdf4', '#fbb6ce', '#c6f6d5', '#faf089'];

/** Ghép cặp Note-On/Off theo FIFO cho mỗi khóa (REQ-PARSER-04). Dùng cho MIDI và Reaper. */
export function createPairer() {
  const open = new Map(), out = [];
  return {
    on(key, tick, vel) { let q = open.get(key); if (!q) open.set(key, (q = [])); q.push({ tick, vel }); },
    off(key, tick) { const q = open.get(key); if (q && q.length) { const o = q.shift(); out.push({ key, start: o.tick, end: tick, vel: o.vel }); return true; } return false; },
    /** Đóng nốt treo ở endTick. Trả số nốt treo. */
    flush(endTick) { let n = 0; for (const [k, q] of open) for (const o of q) { out.push({ key: k, start: o.tick, end: Math.max(endTick, o.tick + 1), vel: o.vel }); n++; } open.clear(); return n; },
    notes: out,
  };
}

/**
 * @param {object} inp
 *  title, artist, sourceFormat, sourceVersion, sourcePPQ,
 *  tempoPoints:[{tick,bpm,num,den}], tempoSource:'file'|'midi-default'|'fallback'|'user',
 *  tracks:[{name,muted,sourceId,mix?:{volumeDb,pan},automation?:{volume?,pan?,mute?}(Lane, xem automation.js),notes:[{pitch,startTick,endTick,velocity,channel?}]}]
 * @param {{maxNotes?:number, showMuted?:boolean, warnings?:Array}} opts
 */
export function buildAST(inp, opts = {}) {
  const warnings = inp.warnings || [];
  const maxNotes = opts.maxNotes ?? 500000;
  if (!inp.tempoPoints || !inp.tempoPoints.length) fail('ERR_AST_INVALID', 'không có điểm tempo');
  const tempoMap = makeTempoMap(inp.tempoPoints);
  for (const p of tempoMap) if (!(p.bpm >= 10 && p.bpm <= 1000) || !Number.isFinite(p.timeSeconds)) fail('ERR_AST_INVALID', `tempo ngoài 10-1000 BPM tại tick ${p.tick}: ${p.bpm}`, { tick: p.tick });

  let maxTick = 0, total = 0, visibleNotes = 0, hiddenNotes = 0, id = 0, zeroLen = 0;
  const tracks = [];
  (inp.tracks || []).forEach((rt, srcIndex) => {
    const notes = [];
    for (const n of rt.notes) {
      const startTick = Math.round(n.startTick);
      const dur = n.durationTick !== undefined ? n.durationTick : n.endTick - n.startTick;
      if (Math.round(dur) < 1) zeroLen++;
      const durationTick = Math.max(1, Math.round(dur)), endTick = startTick + durationTick;
      const pitch = n.pitch;
      const velocity = Math.min(127, Math.max(1, Math.round(n.velocity)));
      if (!Number.isInteger(pitch) || pitch < 0 || pitch > 127 || !Number.isFinite(startTick) || startTick < 0 || !Number.isFinite(durationTick))
        fail('ERR_AST_INVALID', `nốt sai ở track "${rt.name}": pitch=${pitch} startTick=${n.startTick} duration=${dur}`, { track: rt.name, note: n });
      const s = tickToSec(tempoMap, startTick), e = tickToSec(tempoMap, endTick);
      const note = { id: `n${id++}`, pitch, pitchName: pitchName(pitch), startTick, durationTick, endTick, startTimeSeconds: s, durationSeconds: e - s, endTimeSeconds: e, velocity };
      if (n.channel !== undefined) note.channel = n.channel;
      notes.push(note);
      if (endTick > maxTick) maxTick = endTick;
    }
    if (!notes.length) return;
    total += notes.length;
    if (total > maxNotes) fail('ERR_AST_TOO_LARGE', `vượt ${maxNotes} nốt`);
    notes.sort((a, b) => a.startTick - b.startTick || a.pitch - b.pitch);
    let min = 127, max = 0; for (const n of notes) { if (n.pitch < min) min = n.pitch; if (n.pitch > max) max = n.pitch; }
    const muted = !!rt.muted;
    const visible = !muted || !!opts.showMuted;
    (visible ? (visibleNotes += notes.length) : (hiddenNotes += notes.length));
    const index = tracks.length;
    tracks.push({ id: `t${index}`, index, name: rt.name || `Track ${srcIndex + 1}`, color: rt.color || PALETTE[index % PALETTE.length], isMuted: muted, isVisible: visible, notes, pitchRange: { min, max }, ...(rt.sourceId !== undefined ? { sourceId: String(rt.sourceId) } : {}), ...(rt.mix ? { mix: rt.mix } : {}), ...(rt.automation && Object.keys(rt.automation).length ? { automation: rt.automation } : {}) });
  });
  if (!visibleNotes) fail('ERR_NO_NOTES', hiddenNotes ? `chỉ có nốt ở track tắt tiếng (${hiddenNotes} nốt); bật showMuted để hiển thị` : 'không có nốt nào sau khi lọc', { hiddenNotes });
  if (zeroLen) warn(warnings, 'WARN_ZERO_LENGTH_NOTES', `${zeroLen} nốt có độ dài 0 được nâng lên 1 tick`);
  if (inp.tempoSource === 'fallback') warn(warnings, 'WARN_TEMPO_FALLBACK', 'không đọc được tempo từ file: tạm dùng 120 BPM. Hãy truyền options.tempoOverride (hoặc nhập BPM thủ công) rồi phân tích lại.');

  const ast = {
    meta: {
      title: inp.title || 'Untitled', artist: inp.artist || '', sourceFormat: inp.sourceFormat, sourceVersion: inp.sourceVersion || '',
      sourcePPQ: inp.sourcePPQ || PPQ, internalPPQ: PPQ, tempoSource: inp.tempoSource || 'file',
      totalTicks: maxTick, totalDurationSeconds: tickToSec(tempoMap, maxTick),
    },
    tempoMap, tracks, chordTimeline: [],
  };
  return { ast, warnings };
}

/** Chuẩn hóa options.tempoOverride -> điểm tempo. Nhận số (BPM) hoặc mảng [{tick,bpm,num,den}]. */
/**
 * tempoOverride: số BPM, hoặc mảng điểm tempo. Mỗi điểm: { bpm (10..1000), num?, den? } cùng MỘT trong ba cách đặt vị trí:
 *   tick (@960) | beat (số beat) | timeSeconds (giây tính theo chính bản đồ tempo do các điểm trước tạo ra).
 * Điểm được sắp theo vị trí; nếu điểm đầu không ở 0 thì thêm điểm 0 cùng BPM với điểm đầu; vị trí trùng thì điểm sau thắng.
 */
/**
 * Đọc vị trí người dùng gõ theo cách các DAW hiển thị, trả { timeSeconds } hoặc { beat } (dùng cho tempoOverride).
 *  - 'time'      : giây (`90`, `90.5`) hoặc `m:ss`, `m:ss.mmm`, `h:mm:ss.mmm` (đồng hồ thời gian của mọi DAW; Reaper hiện `0:00.000`)
 *  - 'reaper'    : `bar.beat.hundredths`, ví dụ `1.1.00`, `5.3.50` (Reaper mặc định; phần thứ ba là phần trăm của beat)
 *  - 'sixteenth' : `bar.beat.sixteenth` đếm từ 1, ví dụ `1.1.1`, `5.3.2` (Ableton, Bitwig, Cubase; dấu `:` cuối nếu có tick thì bỏ qua)
 * Bar/beat quy đổi bằng `numerator`/`denominator` của nhịp (mặc định 4/4): một "beat" của DAW là một nốt theo mẫu số (4/4: nốt đen; 6/8, 12/8: nốt móc đơn),
 * kết quả `beat` luôn tính theo nốt đen (quarter note) = beat × 4/denominator. Chỉ đúng khi nhịp không đổi từ đầu đến mốc đó (dùng resolveTempoRows nếu có đổi nhịp).
 * Ném ERR_AST_INVALID nếu sai định dạng.
 */
export function parsePositionText(text, { unit = 'time', numerator = 4, denominator = 4 } = {}) {
  const t = String(text ?? '').trim();
  const bad = (why) => fail('ERR_AST_INVALID', `vị trí "${t}" không hợp lệ (${why})`, { text: t, unit });
  if (!t) bad('trống');
  if (unit === 'time') {
    if (/^\d+(\.\d+)?$/.test(t)) return { timeSeconds: parseFloat(t) };
    const m = /^(?:(\d+):)?(\d+):(\d{1,2}(?:\.\d+)?)$/.exec(t) || /^()(\d+):(\d{1,2}(?:\.\d+)?)$/.exec(t);
    if (!m) bad('dùng giây hoặc m:ss.mmm');
    const sec = (m[1] ? parseInt(m[1], 10) * 3600 : 0) + parseInt(m[2], 10) * 60 + parseFloat(m[3]);
    if (parseFloat(m[3]) >= 60) bad('giây phải < 60');
    if (m[1] && parseInt(m[2], 10) >= 60) bad('phút phải < 60');
    return { timeSeconds: sec };
  }
  if (unit !== 'reaper' && unit !== 'sixteenth') bad(`đơn vị lạ: ${unit}`);
  const m = /^(\d+)\.(\d+)(?:\.(\d+))?(?::\d+)?$/.exec(t);
  if (!m) bad(unit === 'reaper' ? 'dùng bar.beat.phần_trăm, ví dụ 5.3.50' : 'dùng bar.beat.sixteenth, ví dụ 5.3.2');
  const bar = parseInt(m[1], 10), beat = parseInt(m[2], 10);
  if (bar < 1 || beat < 1) bad('bar và beat đếm từ 1');
  if (beat > numerator) bad(`beat ${beat} vượt số beat mỗi ô nhịp (${numerator})`);
  let frac = 0;
  if (m[3] !== undefined) {
    if (unit === 'reaper') frac = parseInt(m[3], 10) / 10 ** m[3].length;
    else { const sx = parseInt(m[3], 10); if (sx < 1 || sx > 4) bad('sixteenth từ 1 đến 4'); frac = (sx - 1) / 4; }
  }
  return { beat: ((bar - 1) * numerator + (beat - 1) + frac) * 4 / denominator };
}

/** Đọc dấu nhịp dạng "4/4", "3/4", "6/8", "12/8", "7/8", "5/4". Tử 1–64, mẫu số ∈ {1,2,4,8,16,32}. Trả { num, den }. */
export function parseTimeSignature(text) {
  const t = String(text ?? '').trim();
  const m = /^(\d{1,2})\s*\/\s*(\d{1,2})$/.exec(t);
  const num = m ? parseInt(m[1], 10) : NaN, den = m ? parseInt(m[2], 10) : NaN;
  if (!m || num < 1 || num > 64 || ![1, 2, 4, 8, 16, 32].includes(den)) fail('ERR_AST_INVALID', `dấu nhịp "${t}" không hợp lệ (ví dụ 4/4, 3/4, 6/8, 12/8)`, { text: t });
  return { num, den };
}

/**
 * Đổi các dòng người dùng nhập thành điểm cho tempoOverride.
 * rows: [{ pos, bpm, sig? }]; pos theo `unit` (xem parsePositionText); sig = "3/4"... (bỏ trống = giữ nhịp trước đó, điểm đầu lấy `base`).
 * Với unit 'reaper'/'sixteenth', số beat mỗi ô nhịp thay đổi theo nhịp hiệu lực từ mỗi dòng, nên vị trí bar.beat được cộng dồn theo từng đoạn.
 * Giả định: đổi nhịp xảy ra ở đầu ô nhịp (như DAW). Kết quả: [{ bpm, num, den, beat | timeSeconds }].
 */
export function resolveTempoRows(rows, { unit = 'time', base = { num: 4, den: 4 } } = {}) {
  const out = [];
  let sig = { num: base.num || 4, den: base.den || 4 };
  const segs = []; // đoạn nhịp: { bar, beats (tính theo nốt đen tại đầu đoạn), num, den }
  rows.forEach((r, i) => {
    if (r.sig) sig = parseTimeSignature(r.sig);
    const text = r.pos === '' || r.pos == null ? (unit === 'time' ? '0' : '1.1') : r.pos;
    let p;
    if (unit === 'time') p = parsePositionText(text, { unit });
    else {
      const m = /^(\d+)\./.exec(String(text).trim());
      const bar = m ? parseInt(m[1], 10) : NaN;
      // đoạn nhịp đang hiệu lực tại vị trí này = đoạn cuối có bar bắt đầu <= bar (nhịp mới của chính dòng này áp dụng từ bar đó)
      const seg = [...segs].reverse().find((x) => x.bar <= bar) || { bar: 1, beats: 0, num: sig.num, den: sig.den };
      const q = parsePositionText(text, { unit, numerator: seg.num, denominator: seg.den }); // vị trí của dòng đổi nhịp được đọc theo nhịp TRƯỚC nó
      p = { beat: seg.beats + (q.beat - ((seg.bar - 1) * seg.num * 4 / seg.den)) };
      if (!Number.isFinite(p.beat)) fail('ERR_AST_INVALID', `vị trí "${text}" không hợp lệ`, { text });
      segs.push({ bar: Number.isFinite(bar) ? bar : 1, beats: p.beat, num: sig.num, den: sig.den });
    }
    out.push({ bpm: Number(r.bpm), num: sig.num, den: sig.den, ...p });
  });
  return out;
}

export function normalizeTempoOverride(o) {
  if (o === undefined || o === null) return null;
  const okBpm = (b) => typeof b === 'number' && Number.isFinite(b) && b >= 10 && b <= 1000;
  if (typeof o === 'number') { if (!okBpm(o)) fail('ERR_AST_INVALID', `tempoOverride: BPM phải trong 10..1000 (nhận ${o})`); return [{ tick: 0, bpm: o, num: 4, den: 4 }]; }
  if (!Array.isArray(o) || !o.length) fail('ERR_AST_INVALID', 'tempoOverride phải là số BPM hoặc mảng {bpm, tick|beat|timeSeconds, num?, den?}');
  const pts = o.map((p, k) => {
    if (!p || !okBpm(p.bpm)) fail('ERR_AST_INVALID', `tempoOverride[${k}]: BPM phải trong 10..1000`);
    const keys = ['tick', 'beat', 'timeSeconds'].filter((x) => p[x] !== undefined && p[x] !== null && p[x] !== '');
    if (keys.length > 1) fail('ERR_AST_INVALID', `tempoOverride[${k}]: chỉ dùng một trong tick | beat | timeSeconds`);
    const key = keys[0] || 'tick', v = Number(p[key] ?? 0);
    if (!Number.isFinite(v) || v < 0) fail('ERR_AST_INVALID', `tempoOverride[${k}]: ${key} phải là số ≥ 0`);
    return { key, v, bpm: p.bpm, num: p.num || 4, den: p.den || 4 };
  });
  // thứ tự: tick/beat so sánh trực tiếp; giây phải đổi tuần tự nên sắp theo (đơn vị, giá trị) rồi đổi khi duyệt
  const asBeat = (p) => (p.key === 'beat' ? p.v : p.key === 'tick' ? p.v / PPQ : null);
  if (pts.every((p) => p.key === 'timeSeconds')) pts.sort((a, b) => a.v - b.v);
  else if (pts.some((p) => p.key === 'timeSeconds')) fail('ERR_AST_INVALID', 'tempoOverride: không trộn timeSeconds với tick/beat trong cùng một mảng');
  else pts.sort((a, b) => asBeat(a) - asBeat(b));
  const out = [];
  let prev = null; // { tick, sec, bpm }
  for (const p of pts) {
    let tick;
    if (p.key === 'tick') tick = Math.round(p.v);
    else if (p.key === 'beat') tick = Math.round(p.v * PPQ);
    else {
      const first = prev || { tick: 0, sec: 0, bpm: p.bpm };
      tick = Math.round(first.tick + ((p.v - first.sec) * first.bpm / 60) * PPQ);
    }
    if (!out.length && tick > 0) out.push({ tick: 0, bpm: p.bpm, num: p.num, den: p.den });
    if (out.length && out[out.length - 1].tick === tick) out.pop();
    out.push({ tick, bpm: p.bpm, num: p.num, den: p.den });
    prev = { tick, sec: p.key === 'timeSeconds' ? p.v : 0, bpm: p.bpm };
  }
  return out;
}
