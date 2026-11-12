// DAWproject (.dawproject = ZIP + project.xml + metadata.xml; do Bitwig, Studio One, Cubase... xuất). REQ-PARSER-03.
// Cấu trúc đối chiếu với ví dụ project.xml chính thức (Bitwig Studio 5.0) trong tài liệu DAWproject. Chưa thử với file .dawproject thật (OI-01).
import { fail, warn, resolveLimits, toU8, decodeUtf8, readZipDirectory, extractEntry, findEntry, parseXml, kid, kids, at, descendants, PPQ, makeTempoMap, tickToSec, secToTick, mergeTempoAndSig, rampToSteps, buildAST, normalizeTempoOverride, pathInventory } from '@dawviz/parser-core';

const SKIP = new Set(['Devices', 'Warps', 'Audio', 'Video', 'Scenes']);
const f = (v, d = 0) => { const x = parseFloat(v); return Number.isFinite(x) ? x : d; };
const meta = (xml, tag) => { const m = new RegExp(`<${tag}>([^<]*)</${tag}>`).exec(xml); return m ? m[1].trim() : ''; };

export async function parseDawproject(buffer, options = {}) {
  const limits = resolveLimits(options.limits);
  const u8 = toU8(buffer);
  if (u8.length > limits.maxFileBytes) fail('ERR_FILE_TOO_LARGE', `${u8.length} byte`);
  const entries = readZipDirectory(u8, limits);
  const pe = findEntry(entries, 'project.xml');
  if (!pe) fail('ERR_ARCHIVE_INVALID', 'thiếu project.xml trong .dawproject');
  const warnings = [];
  const me = findEntry(entries, 'metadata.xml');
  let title = options.title || '', artist = '';
  if (me) { const m = decodeUtf8(await extractEntry(u8, me, limits)); title = title || meta(m, 'Title'); artist = meta(m, 'Artist'); }
  else warn(warnings, 'WARN_DAWPROJECT_NO_METADATA', 'thiếu metadata.xml');
  const r = parseDawprojectXml(decodeUtf8(await extractEntry(u8, pe, limits)), { ...options, title: title || 'DAWproject', artist, limits, warnings });
  return r;
}

export function parseDawprojectXml(xmlText, options = {}) {
  const limits = resolveLimits(options.limits);
  const warnings = options.warnings || [];
  const root = parseXml(xmlText, { maxDepth: limits.maxXmlDepth, maxNodes: limits.maxXmlNodes, skip: SKIP });
  if (root.n !== 'Project') fail('ERR_AST_INVALID', `gốc XML là <${root.n}>, cần <Project>`);
  const app = kid(root, 'Application');
  const sourceVersion = `DAWproject ${root.a.version || '?'}${app ? ` (${app.a.name || ''} ${app.a.version || ''})`.replace(/ \)/, ')') : ''}`;

  // ---- transport
  const tr = kid(root, 'Transport');
  const tempoEl = kid(tr, 'Tempo'), sigEl = kid(tr, 'TimeSignature');
  const baseBpm = tempoEl ? f(tempoEl.a.value, NaN) : NaN;
  const baseNum = sigEl ? parseInt(sigEl.a.numerator, 10) || 4 : 4, baseDen = sigEl ? parseInt(sigEl.a.denominator, 10) || 4 : 4;
  const arr = kid(root, 'Arrangement');
  const tempos = [], sigs = [{ tick: 0, num: baseNum, den: baseDen }];
  if (Number.isFinite(baseBpm)) tempos.push({ tick: 0, bpm: baseBpm });

  // tempo / nhịp automation (Arrangement/TempoAutomation, TimeSignatureAutomation) [VERIFY]
  if (arr) {
    for (const ta of descendants(arr, 'TempoAutomation')) {
      const unit = ta.a.timeUnit || 'beats';
      const pts = [...descendants(ta, 'RealPoint')].map((p) => ({ t: f(p.a.time), v: f(p.a.value, NaN), lin: p.a.interpolation === 'linear' })).filter((p) => Number.isFinite(p.v)).sort((a, b) => a.t - b.t);
      if (!pts.length) continue;
      if (unit !== 'beats') { warn(warnings, 'WARN_TEMPO_AUTOMATION_SECONDS', 'tempo automation tính bằng giây chưa hỗ trợ, bỏ qua [VERIFY]'); continue; }
      tempos.length = 0;
      pts.forEach((p, i) => { const nx = pts[i + 1]; if (nx && p.lin && nx.v !== p.v) tempos.push(...rampToSteps(Math.round(p.t * PPQ), p.v, Math.round(nx.t * PPQ), nx.v)); else tempos.push({ tick: Math.round(p.t * PPQ), bpm: p.v }); });
      warn(warnings, 'WARN_TEMPO_AUTOMATION', `tempo automation ${pts.length} điểm [VERIFY SOI-06]`);
    }
    for (const sa of descendants(arr, 'TimeSignatureAutomation'))
      for (const p of descendants(sa, 'TimeSignaturePoint')) sigs.push({ tick: Math.round(f(p.a.time) * PPQ), num: parseInt(p.a.numerator, 10) || 4, den: parseInt(p.a.denominator, 10) || 4 });
  }

  const ov = normalizeTempoOverride(options.tempoOverride);
  let tempoPoints, tempoSource = 'file';
  if (ov) { tempoPoints = ov; tempoSource = 'user'; }
  else if (tempos.length) tempoPoints = mergeTempoAndSig(tempos, sigs);
  else { tempoPoints = [{ tick: 0, bpm: 120, num: baseNum, den: baseDen }]; tempoSource = 'fallback'; }
  const map = makeTempoMap(tempoPoints);

  // ---- track chứa nốt (contentType có "notes")
  const trackDefs = new Map(), order = [];
  const collect = (n) => { for (const t of kids(n, 'Track')) { if (/\bnotes\b/.test(t.a.contentType || '') && (kid(t, 'Channel')?.a.role !== 'master')) { trackDefs.set(t.a.id, { name: t.a.name || 'Track', color: t.a.color, muted: at(t, 'Channel/Mute')?.a.value === 'true', notes: [], sourceId: t.a.id }); order.push(t.a.id); } collect(t); } };
  collect(kid(root, 'Structure') || root);
  if (!trackDefs.size) warn(warnings, 'WARN_DAWPROJECT_NO_NOTE_TRACKS', 'không có track nào có contentType chứa "notes"');

  // ---- chuyển đơn vị thời gian
  const conv = (delta, unit, atTick) => (unit === 'seconds' ? secToTick(map, tickToSec(map, atTick) + delta) - atTick : delta * PPQ);
  let mixedUnits = false, total = 0;

  const emitNotes = (notesNode, ctx, from, to) => {
    const tdef = trackDefs.get(ctx.trackId);
    if (!tdef) return;
    for (const nt of kids(notesNode, 'Note')) {
      const t = f(nt.a.time), d = f(nt.a.duration);
      if (from !== undefined && t < from - 1e-9) continue;
      if (to !== undefined && t >= to - 1e-9) continue;
      const s = ctx.origin + conv(t, ctx.unit, ctx.origin), e = ctx.origin + conv(t + d, ctx.unit, ctx.origin);
      if (s < ctx.lo - 0.5 || s >= ctx.hi - 0.5) continue;
      const vel = f(nt.a.vel, 0.8);
      tdef.notes.push({ pitch: parseInt(nt.a.key, 10), channel: parseInt(nt.a.channel || '0', 10), startTick: Math.round(s), endTick: Math.round(Math.min(e, ctx.hi)), velocity: vel <= 1 ? vel * 127 : vel });
      if (++total > limits.maxNotes) fail('ERR_AST_TOO_LARGE', `vượt ${limits.maxNotes} nốt`);
    }
  };

  const placeClip = (clip, ctx) => {
    const cUnit = clip.a.contentTimeUnit || ctx.unit;
    if (cUnit !== ctx.unit) mixedUnits = true;
    const time = f(clip.a.time), dur = f(clip.a.duration, NaN), playStart = f(clip.a.playStart);
    if (!Number.isFinite(dur)) return;
    const startAbs = ctx.origin + conv(time, ctx.unit, ctx.origin), endAbs = ctx.origin + conv(time + dur, ctx.unit, ctx.origin);
    const lo = Math.max(startAbs, ctx.lo), hi = Math.min(endAbs, ctx.hi);
    if (!(hi > lo)) return;
    const L0 = clip.a.loopStart !== undefined ? f(clip.a.loopStart) : NaN, L1 = clip.a.loopEnd !== undefined ? f(clip.a.loopEnd) : NaN;
    const loopOn = Number.isFinite(L0) && Number.isFinite(L1) && L1 > L0;
    let passFrom = playStart, passStart = startAbs, guard = 0;
    for (;;) {
      const passLen = loopOn ? conv(L1 - passFrom, cUnit, passStart) : hi - passStart;
      if (!(passLen > 0)) break;
      const passEnd = Math.min(passStart + passLen, hi);
      const sub = { ...ctx, origin: passStart - conv(passFrom, cUnit, passStart), unit: cUnit, lo: Math.max(passStart, lo), hi: passEnd };
      for (const ch of clip.c) {
        if (ch.n === 'Notes') emitNotes(ch, sub, passFrom, loopOn ? L1 : undefined);
        else if (ch.n === 'Clips') for (const c2 of kids(ch, 'Clip')) placeClip(c2, sub);
        else if (ch.n === 'Lanes') walk(ch, sub);
      }
      if (!loopOn) break;
      passStart += passLen; passFrom = L0;
      if (passStart >= hi - 0.5 || ++guard > 100000) break;
    }
  };

  const walk = (node, ctx) => {
    for (const ch of node.c) {
      if (ch.n === 'Lanes') walk(ch, { ...ctx, trackId: ch.a.track || ctx.trackId, unit: ch.a.timeUnit || ctx.unit });
      else if (ch.n === 'Clips') for (const c of kids(ch, 'Clip')) placeClip(c, ctx);
      else if (ch.n === 'Notes') emitNotes(ch, ctx, undefined, undefined);
    }
  };
  if (arr) walk(arr, { origin: 0, unit: kid(arr, 'Lanes')?.a.timeUnit || 'beats', lo: 0, hi: Infinity, trackId: undefined });
  else warn(warnings, 'WARN_DAWPROJECT_NO_ARRANGEMENT', 'không thấy <Arrangement>');
  if (mixedUnits) warn(warnings, 'WARN_TIME_UNIT_MIXED', 'clip có contentTimeUnit khác timeUnit: quy đổi bằng tempo tại điểm bắt đầu clip (xấp xỉ) [VERIFY]');

  const tracks = order.map((id) => trackDefs.get(id));
  const { ast } = buildAST({ title: options.title || 'DAWproject', artist: options.artist || '', sourceFormat: 'dawproject', sourceVersion, sourcePPQ: PPQ, tempoPoints, tempoSource, tracks, warnings }, { maxNotes: limits.maxNotes, showMuted: options.showMuted });
  return { ast, warnings, info: { noteTracks: order.length } };
}

/** Kiểm kê đường dẫn XML của project.xml trong .dawproject (đối chiếu [VERIFY] với file thật). */
export async function dawprojectInventory(buffer, options = {}) {
  const limits = resolveLimits(options.limits);
  const u8 = toU8(buffer);
  const e = findEntry(readZipDirectory(u8, limits), 'project.xml');
  if (!e) fail('ERR_ARCHIVE_INVALID', 'thiếu project.xml');
  const root = parseXml(decodeUtf8(await extractEntry(u8, e, limits)), { maxDepth: limits.maxXmlDepth, maxNodes: limits.maxXmlNodes, skip: SKIP });
  return pathInventory(root, { maxDepth: options.maxDepth ?? 30 });
}
