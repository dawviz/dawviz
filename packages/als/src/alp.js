// Ableton Live Pack (.alp).
// Định dạng thật (quan sát trên Live 9.1 pack, REQ-ALP-01):
//   [0..3]  "pl-a"   [4..7] u32 LE (kích thước phần còn lại)   [8..11] u32 = 0
//   rồi N luồng gzip nối liền nhau, mỗi luồng là MỘT file .als (XML)
//   rồi manifest JSON {"original_path","als":[{"current_path","original_path"}...],"creator_id","version"} (N phần tử, đúng thứ tự)
//   rồi dữ liệu sample (FLAC/...) — KHÔNG đọc.
// Vẫn nhận gói ZIP (chứa .als) để phòng biến thể khác.
import { fail, warn, resolveLimits, toU8, sniff, inflateLimited, readZipDirectory, extractEntry } from '@dawviz/parser-core';
import { parseAls } from './als.js';

const isAls = (n) => /\.als$/i.test(n) && !/(^|\/)(Backup|__MACOSX)\//i.test(n) && !/(^|\/)\._/.test(n);
const baseName = (n) => n.replace(/^.*[\\/]/, '').replace(/\.als$/i, '');

/** Chọn file .als chính trong ZIP: ưu tiên ngoài cùng (ít thư mục nhất), rồi lớn nhất. */
export function pickMainAls(entries) {
  const c = entries.filter((e) => !e.isDir && isAls(e.name));
  c.sort((a, b) => a.name.split('/').length - b.name.split('/').length || b.uncompressedSize - a.uncompressedSize);
  return { main: c[0], candidates: c };
}

const MANIFEST = [...'{"original_path"'].map((c) => c.charCodeAt(0));
function indexOfBytes(u8, pat, from) {
  const first = pat[0], last = u8.length - pat.length;
  outer: for (let i = u8.indexOf(first, from); i >= 0 && i <= last; i = u8.indexOf(first, i + 1)) {
    for (let k = 1; k < pat.length; k++) if (u8[i + k] !== pat[k]) continue outer;
    return i;
  }
  return -1;
}
/** Đọc object JSON bắt đầu tại `at` bằng đếm ngoặc (tôn trọng chuỗi), tối đa 1 MB. */
function readJsonObject(u8, at) {
  let depth = 0, inStr = false, esc = false;
  const end = Math.min(u8.length, at + 1e6);
  for (let i = at; i < end; i++) {
    const c = u8[i];
    if (inStr) { if (esc) esc = false; else if (c === 0x5c) esc = true; else if (c === 0x22) inStr = false; continue; }
    if (c === 0x22) inStr = true;
    else if (c === 0x7b) depth++;
    else if (c === 0x7d && --depth === 0) { try { return { obj: JSON.parse(new TextDecoder().decode(u8.subarray(at, i + 1))), end: i + 1 }; } catch { return null; } }
  }
  return null;
}

/** Tách các luồng gzip liên tiếp trong [from, to): thử từng ứng viên kết thúc cho đến khi giải nén hợp lệ + khớp ISIZE. */
async function readGzipMembers(u8, from, to, expected, limits) {
  const starts = [];
  for (let i = u8.indexOf(0x1f, from); i >= 0 && i + 2 < to; i = u8.indexOf(0x1f, i + 1)) if (u8[i + 1] === 0x8b && u8[i + 2] === 0x08) starts.push(i);
  const members = [];
  let pos = from, budget = limits.maxUnzippedBytes;
  while (members.length < expected && pos < to) {
    if (!(u8[pos] === 0x1f && u8[pos + 1] === 0x8b && u8[pos + 2] === 0x08)) fail('ERR_ARCHIVE_INVALID', `gói .alp: mong đợi luồng gzip tại byte ${pos}`);
    const cands = starts.filter((s) => s > pos).concat([to]);
    let ok = null;
    for (const c of cands) {
      const slice = u8.subarray(pos, c);
      if (slice.length < 18) continue;
      let xml;
      try { xml = await inflateLimited(slice, 'gzip', { ...limits, maxUnzippedBytes: budget }, '.als trong .alp'); } catch (e) { if (e.code === 'ERR_ARCHIVE_TOO_LARGE') throw e; continue; }
      const isize = (slice[slice.length - 4] | (slice[slice.length - 3] << 8) | (slice[slice.length - 2] << 16) | (slice[slice.length - 1] << 24)) >>> 0;
      if (isize !== (xml.length >>> 0)) continue;
      ok = { xml, end: c }; break;
    }
    if (!ok) fail('ERR_ARCHIVE_INVALID', `gói .alp: không xác định được ranh giới luồng gzip thứ ${members.length + 1} (byte ${pos})`);
    budget -= ok.xml.length;
    members.push({ start: pos, end: ok.end, xml: ok.xml });
    pos = ok.end;
  }
  return members;
}

/** Mở gói .alp (pl-a hoặc ZIP) -> { kind, names, bytesOf(i) } mà chưa phân tích nốt. */
async function openPack(u8, limits) {
  if (sniff(u8) === 'alp-pack') {
    const jsonAt = indexOfBytes(u8, MANIFEST, 12);
    if (jsonAt < 0) fail('ERR_ARCHIVE_INVALID', 'gói .alp "pl-a": không thấy manifest JSON');
    const man = readJsonObject(u8, jsonAt);
    if (!man || !Array.isArray(man.obj.als) || !man.obj.als.length) fail('ERR_ARCHIVE_INVALID', 'gói .alp "pl-a": manifest JSON không hợp lệ hoặc không có danh sách .als');
    const names = man.obj.als.map((a) => a.current_path || a.original_path || '');
    const members = await readGzipMembers(u8, 12, jsonAt, names.length, limits);
    if (members.length !== names.length) fail('ERR_ARCHIVE_INVALID', `gói .alp: manifest nêu ${names.length} file .als nhưng chỉ đọc được ${members.length}`);
    return { kind: 'pl-a', names, bytesOf: async (i) => members[i].xml, sizes: members.map((m) => m.xml.length),
      info: { container: 'pl-a', packOriginalPath: man.obj.original_path, packBytesAfterAls: u8.length - man.end } };
  }
  const entries = readZipDirectory(u8, limits);
  const { candidates } = pickMainAls(entries);
  if (!candidates.length) fail('ERR_ARCHIVE_INVALID', `gói .alp không chứa file .als (${entries.length} entry)`, { entries: entries.slice(0, 20).map((e) => e.name) });
  return { kind: 'zip', names: candidates.map((c) => c.name), sizes: candidates.map((c) => c.uncompressedSize), bytesOf: (i) => extractEntry(u8, candidates[i], limits),
    info: { container: 'zip', packEntries: entries.length, samples: entries.filter((e) => /\.(wav|aif|aiff|mp3|flac|ogg|m4a)$/i.test(e.name)).length } };
}

function chooseIndex(pack, options) {
  const { names } = pack;
  let idx;
  if (options.alsName !== undefined) idx = names.findIndex((n) => n === options.alsName || baseName(n) === baseName(String(options.alsName)));
  else if (options.alsIndex !== undefined) idx = Number(options.alsIndex);
  else idx = pack.sizes.reduce((best, z, i) => (z > pack.sizes[best] ? i : best), 0); // mặc định: file .als lớn nhất
  if (!Number.isInteger(idx) || idx < 0 || idx >= names.length) fail('ERR_ARCHIVE_INVALID', `không chọn được file .als trong gói (alsName/alsIndex không khớp). Có: ${names.join(' | ')}`, { candidates: names });
  return idx;
}

/**
 * Liệt kê các file .als trong gói để người dùng chọn (không dựng AST đầy đủ).
 * Trả { container, files:[{index, name, bytes, bpm, tracks:[{name, notes, muted}], error?}], defaultIndex }.
 * Mỗi .als được phân tích thử; file không có nốt (ERR_NO_NOTES) vẫn được liệt kê kèm `error`.
 */
export async function listAlp(buffer, options = {}) {
  const limits = resolveLimits(options.limits);
  const u8 = toU8(buffer);
  if (u8.length > limits.maxFileBytes) fail('ERR_FILE_TOO_LARGE', `${u8.length} byte > ${limits.maxFileBytes}`);
  const pack = await openPack(u8, limits);
  const files = [];
  for (let i = 0; i < pack.names.length; i++) {
    const f = { index: i, name: pack.names[i], bytes: pack.sizes[i], tracks: [] };
    try {
      const r = await parseAls(await pack.bytesOf(i), { showMuted: true, limits });
      f.bpm = r.ast.tempoMap[0].bpm; f.tempoSource = r.ast.meta.tempoSource;
      f.tracks = r.ast.tracks.map((t) => ({ name: t.name, notes: t.notes.length, muted: t.isMuted }));
    } catch (e) { f.error = e.code || 'ERR_UNKNOWN'; f.message = e.message; }
    files.push(f);
  }
  return { container: pack.kind, files, defaultIndex: chooseIndex(pack, {}), ...pack.info };
}

export async function parseAlp(buffer, options = {}) {
  const limits = resolveLimits(options.limits);
  const u8 = toU8(buffer);
  if (u8.length > limits.maxFileBytes) fail('ERR_FILE_TOO_LARGE', `${u8.length} byte > ${limits.maxFileBytes} (gói có sample audio thường lớn: nâng options.limits.maxFileBytes nếu cần)`);
  const pack = await openPack(u8, limits);
  const idx = chooseIndex(pack, options);
  const r = await parseAls(await pack.bytesOf(idx), { ...options, title: options.title || baseName(pack.names[idx]), limits });
  r.ast.meta.sourceFormat = 'alp';
  if (pack.names.length > 1) warn(r.warnings, 'WARN_ALP_MULTIPLE_ALS', `gói có ${pack.names.length} file .als, đã chọn "${pack.names[idx]}" (đổi bằng options.alsName hoặc alsIndex)`, { candidates: pack.names, chosen: idx });
  Object.assign(r.info, pack.info, { container: pack.kind === 'zip' ? `zip(${r.info.container})` : 'pl-a', alsEntry: pack.names[idx], alsCandidates: pack.names });
  return r;
}
