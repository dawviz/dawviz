// Cockos Reaper (.rpp). REQ-PARSER-02. Đã kiểm bằng 3 dự án thật (MIDI nhúng, nhiều take/loop/pooled, và một dự án tham chiếu .mid ngoài) + 5 template.
// Mọi chỗ còn [VERIFY] (SOFFS độc lập, IGNTEMPO=1 trong dự án thật, envelope cong). HASDATA: chỉ nhận QN (PPQ đọc động); đơn vị khác bị bỏ qua có cảnh báo, không đoán. cần mẫu thật có giá trị đó.
import { fail, warn, gainToDb, resolveLimits, toU8, decodeUtf8, PPQ, makeTempoMap, secToTick, buildAST, createPairer, normalizeTempoOverride } from '@dawviz/parser-core';
import { readSmf } from '@dawviz/parser-midi';

const TOK = /"([^"]*)"|'([^']*)'|`([^`]*)`|(\S+)/g;
export const tokenize = (line) => { const o = []; let m; TOK.lastIndex = 0; while ((m = TOK.exec(line))) o.push(m[1] ?? m[2] ?? m[3] ?? m[4]); return o; };

/** Cây khối: { name, args, lines:[raw], kids:[{...,after}] } — `after` = số dòng thuộc tính đứng trước khối (giữ thứ tự TAKE/SOURCE). */
export function parseRppTree(text, limits) {
  const root = { name: '#root', args: [], lines: [], kids: [], after: 0 };
  const stack = [root];
  const lines = text.split(/\r?\n/);
  if (lines.length > limits.maxRppLines) fail('ERR_AST_TOO_LARGE', `.rpp có ${lines.length} dòng`);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const top = stack[stack.length - 1];
    if (line.charCodeAt(0) === 60) { // '<'
      const t = tokenize(line.slice(1));
      const node = { name: t[0] || '', args: t.slice(1), lines: [], kids: [], after: top.lines.length };
      top.kids.push(node); stack.push(node);
      if (stack.length > limits.maxXmlDepth + 1) fail('ERR_AST_INVALID', `.rpp lồng quá ${limits.maxXmlDepth} cấp`);
    } else if (line === '>') { if (stack.length > 1) stack.pop(); }
    else top.lines.push(line);
  }
  if (stack.length > 1) fail('ERR_AST_INVALID', '.rpp thiếu dấu ">" đóng khối (file bị cắt cụt?)');
  return root;
}

const prop = (node, key) => { for (const l of node.lines) if (l.startsWith(key) && (l.length === key.length || l.charCodeAt(key.length) === 32)) return tokenize(l); return null; };

// ---- tempo: điểm theo giây -> điểm theo tick (tích phân chính xác)
function buildTempo(baseBpm, baseNum, baseDen, env, warnings) {
  const pts = [], sigs = [{ tick: 0, num: baseNum, den: baseDen }];
  if (!env.length) return { points: [{ tick: 0, bpm: baseBpm }], sigs };
  const E = env.slice().sort((a, b) => a.t - b.t);
  if (E[0].t > 0) E.unshift({ ...E[0], t: 0, num: 0, den: 0 });
  let tick = 0, warnedShape = false;
  for (let i = 0; i < E.length; i++) {
    const p = E[i], nx = E[i + 1];
    if (p.num && p.den) sigs.push({ tick: Math.round(tick), num: p.num, den: p.den });
    if (!nx) { pts.push({ tick: Math.round(tick), bpm: p.bpm }); break; }
    const seg = nx.t - p.t;
    if (seg <= 0) continue;
    const ramp = p.shape !== 1 && p.bpm !== nx.bpm;
    if (p.shape > 1 && !warnedShape) { warnedShape = true; warn(warnings, 'WARN_TEMPO_SHAPE', `tempo envelope có dạng điểm ${p.shape} (cong): xấp xỉ bằng dốc tuyến tính [VERIFY SOI-06]`); }
    if (!ramp) { pts.push({ tick: Math.round(tick), bpm: p.bpm }); tick += (seg * p.bpm / 60) * PPQ; continue; }
    const n = Math.max(2, Math.min(256, Math.ceil(seg / (30 / Math.max(p.bpm, nx.bpm)))));
    for (let k = 0; k < n; k++) {
      const ta = (seg * k) / n, tb = (seg * (k + 1)) / n;
      const mid = p.bpm + (nx.bpm - p.bpm) * ((ta + tb) / 2 / seg);
      pts.push({ tick: Math.round(tick), bpm: mid });
      tick += ((tb - ta) * mid / 60) * PPQ;
    }
  }
  return { points: pts, sigs };
}

const unpackSig = (v) => { const num = v & 0xffff, den = v >>> 16; return [1, 2, 4, 8, 16, 32, 64].includes(den) && num >= 1 && num <= 64 ? { num, den } : null; };

// ---- nguồn MIDI nhúng: HASDATA + E
function readEmbeddedSource(src, warnings) {
  let ppq = 960, tick = 0, guid = null, ign = null, muted = 0, noEvents = true;
  const pairs = createPairer();
  for (const l of src.lines) {
    const c0 = l.charCodeAt(0);
    if (c0 === 69 || c0 === 101) { // 'E' | 'e'
      const t = tokenize(l);
      if (!/^[Ee]m?$/.test(t[0])) continue;
      noEvents = false;
      tick += parseInt(t[1], 10) || 0;
      if (t[0].endsWith('m')) { muted++; continue; } // [VERIFY] cờ muted
      const st = parseInt(t[2], 16), d1 = parseInt(t[3], 16), d2 = parseInt(t[4], 16), hi = st & 0xf0, ch = st & 0x0f;
      if (hi === 0x90 && d2 > 0) pairs.on((ch << 8) | d1, tick, d2);
      else if (hi === 0x80 || (hi === 0x90 && d2 === 0)) pairs.off((ch << 8) | d1, tick);
    } else if (l.startsWith('HASDATA')) {
      // Guard clause: chỉ xử lý nguồn tính theo QN (thiếu tham số thứ 3 vẫn coi là QN vì cấu trúc khớp chuẩn). Đơn vị lạ thì KHÔNG đoán (đoán sai sẽ lệch thời gian mà không ai biết): bỏ nguồn này và báo rõ.
      const t = tokenize(l), unit = t[3], p = Number(t[2]);
      if (unit && unit.toUpperCase() !== 'QN') return { unsupported: { unit, ppq: t[2] } };
      if (!Number.isInteger(p) || p < 1 || p > 65535) return { unsupported: { unit: unit || 'QN', ppq: t[2] } }; // PPQ đọc động (480, 960, 1920...) nhưng phải là số nguyên hợp lý
      ppq = p;
    }
    else if (l.startsWith('POOLEDEVTS')) guid = tokenize(l)[1];
    else if (l.startsWith('IGNTEMPO')) { const t = tokenize(l); if (t[1] === '1') ign = parseFloat(t[2]) || 120; }
  }
  const hang = pairs.flush(tick);
  return { ppq, length: tick, notes: pairs.notes, guid, ignTempoBpm: ign, noEvents, hanging: hang, muted };
}

async function loadExternal(path, options, warnings) {
  const base = path.replace(/^.*[\\/]/, '');
  let buf = null;
  if (options.resolveFile) buf = await options.resolveFile(path, base);
  else if (options.files) {
    const entries = options.files instanceof Map ? [...options.files.entries()] : Object.entries(options.files);
    const norm = (n) => String(n).replace(/^.*[\\/]/, '').toLowerCase().replace(/[\s_]+/g, '_'); // tên có thể bị đổi khoảng trắng/gạch dưới khi tải lên
    const hit = entries.find(([k]) => k === base || k === path) || entries.find(([k]) => norm(k) === norm(base));
    buf = hit ? hit[1] : null;
  }
  if (!buf) { warn(warnings, 'WARN_RPP_EXTERNAL_MIDI', `item tham chiếu file MIDI ngoài chưa được cung cấp: ${base}`, { file: base }); return null; }
  const smf = readSmf(toU8(buf), warnings);
  const notes = smf.tracks.flatMap((t) => t.notes.map((n) => ({ key: (n.channel << 8) | n.pitch, start: n.startTick, end: n.endTick, vel: n.velocity })));
  return { ppq: smf.division, length: 0, notes, guid: null, ignTempoBpm: null, external: true };
}

function splitTakes(item) {
  const takes = [{ sel: false, lines: [], src: null }];
  let cur = takes[0], ki = 0;
  for (let li = 0; li <= item.lines.length; li++) {
    while (ki < item.kids.length && item.kids[ki].after === li) { if (item.kids[ki].name === 'SOURCE') cur.src = item.kids[ki]; ki++; }
    if (li === item.lines.length) break;
    const l = item.lines[li];
    if (l === 'TAKE' || l.startsWith('TAKE ')) { cur = { sel: tokenize(l)[1] === 'SEL', lines: [], src: null }; takes.push(cur); }
    else cur.lines.push(l);
  }
  return takes;
}
const takeProp = (lines, key) => { for (const l of lines) if (l.startsWith(key) && (l.length === key.length || l.charCodeAt(key.length) === 32)) return tokenize(l); return null; };

export async function parseRpp(buffer, options = {}) {
  const limits = resolveLimits(options.limits);
  const u8 = toU8(buffer);
  if (u8.length > limits.maxFileBytes) fail('ERR_FILE_TOO_LARGE', `${u8.length} byte`);
  return parseRppText(decodeUtf8(u8), { ...options, limits });
}

const ENV_KIND = { VOLENV2: 'volume', VOLENV: 'volume', PANENV2: 'pan', PANENV: 'pan', MUTEENV: 'mute' };
/** Đọc envelope bật (ACT ≠ 0, có điểm PT) trực tiếp dưới <TRACK> thành lane. VOLENV2 (âm lượng sau FX, là "Volume" ở giao diện) được ưu tiên hơn VOLENV; envelope còn lại không đọc và được đếm ở WARN_RPP_ENVELOPES_IGNORED. */
function readTrackLanes(tn, map, warnings, stats) {
  const out = {};
  for (const name of ['VOLENV2', 'VOLENV', 'PANENV2', 'PANENV', 'MUTEENV']) {
    const k = ENV_KIND[name];
    const node = tn.kids.find((x) => x.name === name);
    if (!node || out[k]) continue;
    const act = prop(node, 'ACT');
    if (act && act[1] === '0') continue;
    const pts = [];
    for (const l of node.lines) {
      if (!l.startsWith('PT ')) continue;
      const t = tokenize(l), time = parseFloat(t[1]), value = parseFloat(t[2]), shape = parseInt(t[3] || '0', 10) || 0;
      if (!Number.isFinite(time) || !Number.isFinite(value) || time < 0) continue;
      const p = { tick: Math.round(secToTick(map, time)), timeSeconds: time, value, shape };
      if (shape === 5) { const ten = parseFloat(t[7] ?? t[4]); if (Number.isFinite(ten)) p.tension = ten; }
      if (shape >= 2) stats.shapeApprox = true;
      if (pts.length && p.tick <= pts[pts.length - 1].tick) { pts[pts.length - 1] = p; continue; } // trùng vị trí: điểm sau thắng
      pts.push(p);
    }
    if (pts.length) { out[k] = { kind: k, points: pts }; stats.read++; node.read = true; }
  }
  return Object.keys(out).length ? out : null;
}

export async function parseRppText(text, options = {}) {
  const limits = resolveLimits(options.limits);
  const warnings = [];
  const tree = parseRppTree(text, limits);
  const proj = tree.kids[0];
  if (!proj || proj.name !== 'REAPER_PROJECT') fail('ERR_AST_INVALID', 'gốc không phải <REAPER_PROJECT>');
  const sourceVersion = proj.args.join(' ');

  // tempo gốc + envelope
  const tl = prop(proj, 'TEMPO');
  let baseBpm = tl ? parseFloat(tl[1]) : NaN, baseNum = tl ? parseInt(tl[2] || '4', 10) : 4, baseDen = tl ? parseInt(tl[3] || '4', 10) : 4;
  if (!Number.isFinite(baseBpm)) baseBpm = NaN;
  const envNode = proj.kids.find((k) => /^TEMPOENV/.test(k.name));
  const env = [];
  if (envNode) {
    const act = prop(envNode, 'ACT');
    if (!act || act[1] !== '0') for (const l of envNode.lines) if (l.startsWith('PT ')) {
      const t = tokenize(l), bpm = parseFloat(t[2]);
      if (!Number.isFinite(bpm) || !Number.isFinite(parseFloat(t[1]))) continue;
      const sig = t[4] && parseInt(t[4], 10) > 0 ? unpackSig(parseInt(t[4], 10)) : null;
      env.push({ t: parseFloat(t[1]), bpm, shape: parseInt(t[3] || '0', 10), num: sig ? sig.num : 0, den: sig ? sig.den : 0 });
    }
  }
  const po = prop(proj, 'PROJOFFS');
  if (po && parseFloat(po[1]) !== 0) warn(warnings, 'WARN_RPP_PROJOFFS', `PROJOFFS=${po[1]} (offset bắt đầu dự án) chưa được áp dụng`);

  const ov = normalizeTempoOverride(options.tempoOverride);
  let tempoPoints, sigs = [], tempoSource = 'file';
  if (ov) {
    if (env.length || tl) warn(warnings, 'WARN_TEMPO_OVERRIDDEN', 'tempo của file bị thay bằng tempoOverride; vị trí item (tính bằng giây) vẫn theo tempo đã chọn');
    tempoPoints = ov; tempoSource = 'user';
  } else if (Number.isFinite(baseBpm) || env.length) {
    const b = buildTempo(Number.isFinite(baseBpm) ? baseBpm : env[0].bpm, baseNum, baseDen, env, warnings);
    tempoPoints = b.points; sigs = b.sigs;
  } else { tempoPoints = [{ tick: 0, bpm: 120 }]; tempoSource = 'fallback'; }
  // gộp nhịp
  const sigPts = sigs.length ? sigs : [{ tick: 0, num: baseNum, den: baseDen }];
  const ticks = [...new Set([...tempoPoints.map((p) => p.tick), ...sigPts.map((s) => s.tick)])].sort((a, b) => a - b);
  const at = (arr, tk) => { let r = arr[0]; for (const x of arr) { if (x.tick <= tk) r = x; else break; } return r; };
  const merged = ov ? ov : ticks.map((tk) => { const t = at(tempoPoints, tk), s = at(sigPts, tk); return { tick: tk, bpm: t.bpm, num: s.num || t.num || 4, den: s.den || t.den || 4 }; });
  const map = makeTempoMap(merged);

  const pool = new Map();
  const tracks = [];
  let items = 0, mutedItems = 0, loopedItems = 0, srcLenWarn = false, soffsWarn = false;
  const unsupportedSrc = [], unitWarned = new Set(), laneStats = { read: 0, shapeApprox: false };
  for (const tn of proj.kids.filter((k) => k.name === 'TRACK')) {
    const nameP = prop(tn, 'NAME'), ms = prop(tn, 'MUTESOLO');
    const name = nameP ? nameP[1] || '' : 'Track';
    const muted = !!ms && ms[1] !== '0' && ms[1] !== undefined;
    const notes = [];
    for (const it of tn.kids.filter((k) => k.name === 'ITEM')) {
      items++;
      const takes = splitTakes(it);
      const active = takes.find((t) => t.sel) || takes[0];
      const hdr = takes[0].lines;
      if (takeProp(hdr, 'MUTE')?.[1] === '1') { mutedItems++; continue; }
      const src = active.src;
      if (!src || !/^MIDI/.test(src.args[0] || '')) continue;
      const pos = parseFloat(takeProp(hdr, 'POSITION')?.[1] ?? '0'), len = parseFloat(takeProp(hdr, 'LENGTH')?.[1] ?? '0');
      const loop = takeProp(hdr, 'LOOP')?.[1] === '1';
      const soffs = parseFloat(takeProp(active.lines, 'SOFFS')?.[1] ?? '0') || 0;

      let s = readEmbeddedSource(src, warnings);
      if (s.unsupported) {
        unsupportedSrc.push(s.unsupported);
        if (!unitWarned.has(s.unsupported.unit)) { unitWarned.add(s.unsupported.unit); warn(warnings, 'WARN_RPP_SRC_UNIT', `nguồn MIDI có HASDATA "${s.unsupported.ppq} ${s.unsupported.unit}": timebase không phải QN (hoặc PPQ không hợp lệ) chưa được hỗ trợ nên item bị bỏ qua; hãy lưu lại dự án bằng Reaper bản mới`, { unit: s.unsupported.unit, ppq: s.unsupported.ppq }); }
        continue;
      }
      if (s.guid) { if (!s.noEvents) pool.set(s.guid, s); else if (pool.has(s.guid)) s = pool.get(s.guid); }
      if (s.noEvents && !s.guid) {
        const f = prop(src, 'FILE') || takeProp(src.lines, 'FILE');
        if (f && f[1]) { const ext = await loadExternal(f[1], options, warnings); if (ext) s = ext; else continue; } else continue;
      }
      if (s.hanging) warn(warnings, 'WARN_RPP_HANGING_NOTES', `${s.hanging} nốt không có Note-Off trong item của "${name}"`);
      const k = PPQ / s.ppq;
      const itemStart = Math.round(secToTick(map, pos)), itemEnd = Math.round(secToTick(map, pos + len));
      const itemLen = itemEnd - itemStart;
      const srcLen = s.length * k;
      if (soffs && !soffsWarn) { soffsWarn = true; warn(warnings, 'WARN_RPP_SOFFS', `item MIDI có SOFFS=${soffs}: coi là quarter-note [VERIFY]`); }
      const off = Math.round(soffs * PPQ);
      const passes = loop && srcLen > 0 && itemLen > srcLen + 1 ? Math.min(100000, Math.ceil((itemLen + off) / srcLen)) : 1;
      if (passes > 1) loopedItems++;
      if (loop && srcLen === 0 && !srcLenWarn && s.external) { srcLenWarn = true; warn(warnings, 'WARN_RPP_LOOP_UNKNOWN_LEN', 'item loop dùng file MIDI ngoài: chưa biết độ dài nguồn nên không nhân bản loop'); }
      for (let pass = 0; pass < passes; pass++) {
        for (const n of s.notes) {
          let st, en;
          if (s.ignTempoBpm) { // nguồn bỏ qua tempo dự án: thời gian tuyệt đối theo giây
            const qn = (x) => (x / s.ppq) * 60 / s.ignTempoBpm;
            st = Math.round(secToTick(map, pos + qn(n.start))) - itemStart; en = Math.round(secToTick(map, pos + qn(n.end))) - itemStart;
          } else { st = Math.round(n.start * k) + pass * srcLen - off; en = Math.round(n.end * k) + pass * srcLen - off; }
          if (st < 0 || st >= itemLen) continue;
          if (en > itemLen) en = itemLen;
          notes.push({ pitch: n.key & 0xff, channel: n.key >> 8, startTick: itemStart + st, endTick: itemStart + en, velocity: n.vel });
          if (notes.length > limits.maxNotes) fail('ERR_AST_TOO_LARGE', `vượt ${limits.maxNotes} nốt`);
        }
      }
    }
    const mixP = prop(tn, 'VOLPAN');
    const mix = mixP && Number.isFinite(parseFloat(mixP[1])) ? { volumeDb: +gainToDb(parseFloat(mixP[1])).toFixed(2), pan: parseFloat(mixP[2]) || 0 } : undefined;
    const automation = readTrackLanes(tn, map, warnings, laneStats);
    tracks.push({ name, muted, notes, ...(mix ? { mix } : {}), ...(automation ? { automation } : {}) });
  }
  // Envelope bật nhưng không đọc (item/take, trước FX, độ rộng stereo, bản trùng loại): báo số lượng. Envelope track đã đọc nằm ở track.automation.
  let ignoredEnv = 0;
  const walkEnv = (n) => {
    for (const k of n.kids) {
      if (/^(VOLENV|PANENV|WIDTHENV|MUTEENV)/.test(k.name)) {
        const act = prop(k, 'ACT'), pts = k.lines.filter((l) => l.startsWith('PT ')).length;
        if (pts && !(act && act[1] === '0') && !k.read) ignoredEnv++;
      } else if (k.name !== 'FXCHAIN' && k.name !== 'SOURCE') walkEnv(k);
    }
  };
  walkEnv(proj);
  if (ignoredEnv) warn(warnings, 'WARN_RPP_ENVELOPES_IGNORED', `${ignoredEnv} envelope tự động hoá (item/take, trước FX, độ rộng...) chưa được đọc`, { ignored: ignoredEnv, read: laneStats.read });
  if (laneStats.shapeApprox) warn(warnings, 'WARN_RPP_ENVELOPE_SHAPE_APPROX', 'envelope có đoạn cong (slow/fast/bezier) được xấp xỉ bằng đường cong mượt [VERIFY]');
  if (mutedItems) warn(warnings, 'WARN_RPP_MUTED_ITEMS', `${mutedItems} item bị tắt (MUTE) nên bị bỏ qua`);
  if (loopedItems) warn(warnings, 'WARN_RPP_LOOPED_ITEMS', `${loopedItems} item MIDI lặp được nhân bản theo độ dài nguồn [VERIFY]`);

  let built;
  try {
    built = buildAST({ title: options.title || 'Reaper project', sourceFormat: 'rpp', sourceVersion, sourcePPQ: 960, tempoPoints: merged, tempoSource, tracks, warnings }, { maxNotes: limits.maxNotes, showMuted: options.showMuted });
  } catch (e) {
    const missing = [...new Set(warnings.filter((w) => w.code === 'WARN_RPP_EXTERNAL_MIDI').map((w) => w.details.file))];
    if (e.code === 'ERR_NO_NOTES' && unsupportedSrc.length && !missing.length) fail('ERR_NO_NOTES', `dự án chỉ có ${unsupportedSrc.length} nguồn MIDI dùng timebase chưa hỗ trợ (${[...new Set(unsupportedSrc.map((u) => `${u.ppq} ${u.unit}`))].join(', ')}): hãy lưu lại dự án bằng Reaper bản mới`, { unsupportedSources: unsupportedSrc });
    if (e.code === 'ERR_NO_NOTES' && missing.length) fail('ERR_NO_NOTES', `dự án chỉ tham chiếu ${missing.length} file MIDI ngoài chưa được cung cấp (options.files / resolveFile): ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`, { missingFiles: missing });
    throw e;
  }
  return { ast: built.ast, warnings, info: { items, tempoEnvelopePoints: env.length } };
}

/** Danh sách file .mid ngoài mà dự án tham chiếu (tên file, không trùng). Dùng để giao diện chỉ hiện ô nạp .mid khi thật sự cần. */
export function listExternalMidi(input, options = {}) {
  const limits = resolveLimits(options.limits);
  const text = typeof input === 'string' ? input : new TextDecoder('utf-8').decode(toU8(input));
  const out = new Set();
  const walk = (n) => {
    if (n.name === 'SOURCE' && (n.args[0] || '').toUpperCase() === 'MIDI') { const f = prop(n, 'FILE'); if (f && f[1]) out.add(f[1].replace(/^.*[\\/]/, '')); }
    for (const k of n.kids) walk(k);
  };
  walk(parseRppTree(text, limits));
  return [...out];
}

/**
 * Soi cấu trúc .rpp mà KHÔNG cần có nốt (khác parseRpp vốn ném ERR_NO_NOTES nếu dự án không có MIDI).
 * Dùng để kiểm chứng [VERIFY] với file mẫu/template: tempo, envelope, track, item, take, loại nguồn.
 */
export function inspectRpp(input, options = {}) {
  const limits = resolveLimits(options.limits);
  const text = typeof input === 'string' ? input : decodeUtf8(toU8(input));
  const proj = parseRppTree(text, limits).kids[0];
  if (!proj || proj.name !== 'REAPER_PROJECT') fail('ERR_AST_INVALID', 'gốc không phải <REAPER_PROJECT>');
  const tl = prop(proj, 'TEMPO');
  const envNode = proj.kids.find((k) => /^TEMPOENV/.test(k.name));
  const ptLines = envNode ? envNode.lines.filter((l) => l.startsWith('PT ')) : [];
  const out = {
    version: proj.args.join(' '),
    baseTempo: tl ? { bpm: parseFloat(tl[1]), num: parseInt(tl[2] || '4', 10), den: parseInt(tl[3] || '4', 10) } : null,
    tempoEnvelope: envNode ? { tag: envNode.name, active: prop(envNode, 'ACT')?.[1] !== '0', points: ptLines.length, firstPoints: ptLines.slice(0, 3) } : null,
    markers: proj.lines.filter((l) => l.startsWith('MARKER ')).length,
    tracks: [],
  };
  for (const tn of proj.kids.filter((k) => k.name === 'TRACK')) {
    const ms = prop(tn, 'MUTESOLO');
    const tr = { name: prop(tn, 'NAME')?.[1] ?? '', muted: !!ms && ms[1] === '1', items: [] };
    for (const it of tn.kids.filter((k) => k.name === 'ITEM')) {
      const takes = splitTakes(it), hdr = takes[0].lines;
      tr.items.push({
        position: parseFloat(takeProp(hdr, 'POSITION')?.[1] ?? '0'), length: parseFloat(takeProp(hdr, 'LENGTH')?.[1] ?? '0'),
        loop: takeProp(hdr, 'LOOP')?.[1] === '1', muted: takeProp(hdr, 'MUTE')?.[1] === '1',
        takes: takes.map((t) => {
          const s = t.src; if (!s) return { selected: t.sel, sourceType: null };
          const events = s.lines.reduce((n, l) => n + (l.charCodeAt(0) === 69 || l.charCodeAt(0) === 101 ? 1 : 0), 0);
          const f = prop(s, 'FILE');
          return { selected: t.sel, sourceType: s.args[0] || '', file: f ? f[1] : undefined, embeddedEvents: events, pooled: prop(s, 'POOLEDEVTS')?.[1] };
        }),
      });
    }
    out.tracks.push(tr);
  }
  return out;
}
