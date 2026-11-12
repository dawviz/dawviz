// Ableton Live (.als): XML thuần HOẶC XML nén Gzip. Nhận dạng bằng magic bytes, không dựa vào phần mở rộng.
// Chỉ đọc Arrangement (REQ-PARSER-01). Đối chiếu với file thật: Live 9.1 (MinorVersion 9.0_305) và Live 12.4.16 (12.0_12402) — xem test/als.test.js.
import { fail, warn, resolveLimits, toU8, sniff, inflateLimited, decodeUtf8, parseXml, kid, kids, at, val, num, PPQ, mergeTempoAndSig, rampToSteps, buildAST, normalizeTempoOverride, pathInventory } from '@dawviz/parser-core';

// Bỏ cả cây con không cần: giảm bộ nhớ/thời gian cho file hàng chục MB.
const SKIP = new Set(['Devices', 'AudioTrack', 'ReturnTrack', 'PreHearTrack', 'ClipSlotList', 'WarpMarkers', 'SampleRef', 'Scenes', 'AudioClip']);
const EPS = 1e-9;

export async function parseAls(buffer, options = {}) {
  const limits = resolveLimits(options.limits);
  const u8 = toU8(buffer);
  if (u8.length > limits.maxFileBytes) fail('ERR_FILE_TOO_LARGE', `${u8.length} byte > ${limits.maxFileBytes}`);
  const kind = sniff(u8);
  let xml;
  if (kind === 'gzip') xml = await inflateLimited(u8, 'gzip', limits, '.als');
  else if (kind === 'xml') xml = u8;
  else fail('ERR_UNSUPPORTED_FORMAT', `.als phải là XML thuần hoặc Gzip XML (nhận dạng: ${kind})`);
  const r = parseAlsText(decodeUtf8(xml), { ...options, limits });
  r.info.container = kind === 'gzip' ? 'gzip' : 'plain-xml';
  return r;
}

/** Enum nhịp của Live: 201 = 4/4. numerator = v%99 + 1; denominator = 2^floor(v/99) [VERIFY: suy từ 1 mẫu + công thức đã biết]. */
export const decodeAbletonTimeSig = (v) => ({ num: (v % 99) + 1, den: 2 ** Math.floor(v / 99) });

function collectEvents(node, evName) { return kids(node, evName).map((e) => ({ t: parseFloat(e.a.Time), v: parseFloat(e.a.Value) })).filter((e) => Number.isFinite(e.t) && Number.isFinite(e.v)); }

function automationEvents(master, paramNode, evName) {
  // Kiểu cũ (Live 9): <Param><ArrangerAutomation><Events>
  let ev = collectEvents(at(paramNode, 'ArrangerAutomation/Events'), evName);
  // Kiểu mới (Live 10+): <AutomationEnvelopes> trỏ tới AutomationTarget Id
  const id = kid(paramNode, 'AutomationTarget')?.a.Id;
  if (id !== undefined) {
    for (const env of kids(at(master, 'AutomationEnvelopes/Envelopes'), 'AutomationEnvelope'))
      if (val(env, 'EnvelopeTarget/PointeeId') === id) ev = ev.concat(collectEvents(at(env, 'Automation/Events'), evName));
  }
  return ev.sort((a, b) => a.t - b.t);
}

function readTimeline(master, warnings, ctx) {
  const mixer = at(master, 'DeviceChain/Mixer');
  const tempoNode = kid(mixer, 'Tempo');
  const tempos = [], sigs = [];
  let haveTempo = false;
  if (tempoNode) {
    const manual = num(tempoNode, 'Manual', NaN);
    const ev = automationEvents(master, tempoNode, 'FloatEvent');
    const initial = ev.filter((e) => e.t < 0).pop();
    const bps = ev.filter((e) => e.t >= 0);
    const base = initial ? initial.v : Number.isFinite(manual) ? manual : bps.length ? bps[0].v : NaN;
    if (Number.isFinite(base)) {
      haveTempo = true;
      const pts = [{ t: 0, v: base, hold: true }, ...bps];
      for (let i = 0; i < pts.length; i++) {
        const p = pts[i], nx = pts[i + 1];
        if (!nx) tempos.push({ tick: Math.round(p.t * PPQ), bpm: p.v });
        else if (nx.t === p.t) continue;                       // bậc nhảy: điểm sau thắng
        else if (p.hold || p.v === nx.v) tempos.push({ tick: Math.round(p.t * PPQ), bpm: p.v });
        else tempos.push(...rampToSteps(Math.round(p.t * PPQ), p.v, Math.round(nx.t * PPQ), nx.v));
      }
      if (bps.some((e, i) => i > 0 && e.v !== bps[i - 1].v)) { ctx.tempoAutomation = bps.length; warn(warnings, 'WARN_TEMPO_RAMP', `tempo automation ${bps.length} điểm: nội suy tuyến tính theo beat [VERIFY SOI-06]`); }
    }
  }
  const sigNode = kid(mixer, 'TimeSignature');
  if (sigNode) {
    const manual = num(sigNode, 'Manual', NaN);
    const ev = automationEvents(master, sigNode, 'EnumEvent');
    const initial = ev.filter((e) => e.t < 0).pop();
    const base = initial ? initial.v : manual;
    if (Number.isFinite(base)) { const s = decodeAbletonTimeSig(base); sigs.push({ tick: 0, num: s.num, den: s.den }); }
    for (const e of ev.filter((x) => x.t >= 0)) { const s = decodeAbletonTimeSig(e.v); sigs.push({ tick: Math.round(e.t * PPQ), num: s.num, den: s.den }); }
  } else warn(warnings, 'WARN_TIMESIG_DEFAULT', 'không thấy time signature, mặc định 4/4');
  return { tempos, sigs, haveTempo };
}

function clipNotes(clip, out, counter, maxNotes, warnings, trackName) {
  const cs = num(clip, 'CurrentStart', NaN), ce = num(clip, 'CurrentEnd', NaN);
  const L0 = num(clip, 'Loop/LoopStart', 0), L1 = num(clip, 'Loop/LoopEnd', NaN);
  const SR = num(clip, 'Loop/StartRelative', 0);
  const loopOn = val(clip, 'Loop/LoopOn', 'false') === 'true';
  if (![cs, ce, L1].every(Number.isFinite) || ce <= cs || L1 <= L0) { warn(warnings, 'WARN_CLIP_SKIPPED', `clip trên "${trackName}" có thông số vòng lặp không hợp lệ`); return; }
  const notes = [];
  for (const kt of kids(at(clip, 'Notes/KeyTracks'), 'KeyTrack')) {
    const key = parseInt(val(kt, 'MidiKey', '-1'), 10);
    for (const ne of kids(kid(kt, 'Notes'), 'MidiNoteEvent')) {
      if (ne.a.IsEnabled === 'false') continue;
      notes.push({ key, t: parseFloat(ne.a.Time), d: parseFloat(ne.a.Duration), v: parseFloat(ne.a.Velocity) });
    }
  }
  // Mô hình phát: bắt đầu tại start-marker (= LoopStart + StartRelative); hết LoopEnd thì (nếu bật loop) nhảy về LoopStart, lặp đến CurrentEnd.
  let passBase = cs, passFrom = L0 + SR, guard = 0;
  for (;;) {
    const passLen = L1 - passFrom;
    const passEnd = Math.min(passBase + passLen, ce);
    for (const n of notes) {
      if (n.t < passFrom - EPS || n.t >= L1 - EPS) continue;
      const s = passBase + (n.t - passFrom);
      if (s >= ce - EPS) continue;
      const e = Math.min(s + n.d, passEnd);
      const st = Math.round(s * PPQ);
      out.push({ pitch: n.key, startTick: st, endTick: Math.round(e * PPQ), velocity: n.v });
      if (++counter.n > maxNotes) fail('ERR_AST_TOO_LARGE', `vượt ${maxNotes} nốt khi mở rộng loop`);
    }
    if (!loopOn) break;
    passBase += passLen; passFrom = L0;
    if (passBase >= ce - EPS || ++guard > 1e6) break;
  }
}

export function parseAlsText(text, options = {}) {
  const limits = resolveLimits(options.limits);
  const warnings = [];
  let sessionClips = 0;
  const root = parseXml(text, {
    maxDepth: limits.maxXmlDepth, maxNodes: limits.maxXmlNodes, skip: SKIP,
    onSkipped(name, s, e) { if (name === 'ClipSlotList') { let p = s; for (;;) { p = text.indexOf('<MidiClip', p); if (p < 0 || p >= e) break; sessionClips++; p += 9; } } },
  });
  if (root.n !== 'Ableton') fail('ERR_AST_INVALID', `gốc XML là <${root.n}>, cần <Ableton>`);
  const live = kid(root, 'LiveSet');
  if (!live) fail('ERR_AST_INVALID', 'thiếu <LiveSet>');
  const sourceVersion = `${root.a.Creator || 'Ableton Live'} (MinorVersion ${root.a.MinorVersion || '?'})`;
  const master = kid(live, 'MasterTrack') || kid(live, 'MainTrack'); // Live 12 đổi tên thành MainTrack [VERIFY]
  const ctx = {};
  let tempoPoints, tempoSource = 'file';
  const ov = normalizeTempoOverride(options.tempoOverride);
  const tl = master ? readTimeline(master, warnings, ctx) : { tempos: [], sigs: [], haveTempo: false };
  if (ov) { tempoPoints = ov; tempoSource = 'user'; }
  else if (tl.haveTempo) tempoPoints = mergeTempoAndSig(tl.tempos, tl.sigs);
  else { tempoPoints = [{ tick: 0, bpm: 120, num: 4, den: 4 }]; tempoSource = 'fallback'; }

  const tracks = [], counter = { n: 0 };
  let arrangementClips = 0;
  for (const tr of kids(kid(live, 'Tracks'), 'MidiTrack')) {
    const name = val(tr, 'Name/EffectiveName', val(tr, 'Name/UserName', 'MIDI Track'));
    const muted = val(tr, 'DeviceChain/Mixer/Speaker/Manual', 'true') === 'false';
    const events = at(tr, 'DeviceChain/MainSequencer/ClipTimeable/ArrangerAutomation/Events');
    const notes = [];
    for (const clip of kids(events, 'MidiClip')) {
      if (val(clip, 'Disabled', 'false') === 'true') continue;
      arrangementClips++;
      clipNotes(clip, notes, counter, limits.maxNotes, warnings, name);
    }
    tracks.push({ name, muted, notes, sourceId: tr.a.Id });
  }
  if (sessionClips) warn(warnings, 'WARN_SESSION_CLIPS_IGNORED', `${sessionClips} clip MIDI ở Session View bị bỏ qua (chỉ đọc Arrangement)`, { count: sessionClips });

  let built;
  try {
    built = buildAST({ title: options.title || 'Ableton project', sourceFormat: 'als', sourceVersion, tempoPoints, tempoSource, sourcePPQ: PPQ, tracks, warnings }, { maxNotes: limits.maxNotes, showMuted: options.showMuted });
  } catch (e) {
    if (e.code === 'ERR_NO_NOTES' && sessionClips > 0) fail('ERR_NO_NOTES', `Arrangement không có nốt, nhưng có ${sessionClips} clip MIDI ở Session View (chưa hỗ trợ đọc Session). Hãy kéo clip vào Arrangement trong Live rồi lưu lại.`, { sessionClips });
    throw e;
  }
  const { ast } = built;
  return { ast, warnings, info: { arrangementClips, sessionClipsIgnored: sessionClips, tempoAutomationPoints: ctx.tempoAutomation || 0 } };
}

/** Kiểm kê đường dẫn XML của file .als (đã bỏ Devices/AudioTrack...): dùng để đối chiếu [VERIFY] với file thật. */
export async function alsInventory(buffer, options = {}) {
  const limits = resolveLimits(options.limits);
  const u8 = toU8(buffer);
  const xml = sniff(u8) === 'gzip' ? await inflateLimited(u8, 'gzip', limits, '.als') : u8;
  const root = parseXml(decodeUtf8(xml), { maxDepth: limits.maxXmlDepth, maxNodes: limits.maxXmlNodes, skip: SKIP });
  return pathInventory(root, { maxDepth: options.maxDepth ?? 30 });
}
