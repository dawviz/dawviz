// Cổng vào duy nhất cho ứng dụng: parseProject(fileName, buffer, options).
import { fail, resolveLimits, toU8, sniff, readZipDirectory, extractEntry, findEntry } from '@dawviz/parser-core';
import { parseMidi } from '@dawviz/parser-midi';
import { parseAls, parseAlp } from '@dawviz/parser-als';
import { parseRpp, listExternalMidi } from '@dawviz/parser-rpp';
import { parseDawproject } from '@dawviz/parser-dawproject';
import { parseBinaryWithSchema, matchSchema, BUILTIN_SCHEMAS } from '@dawviz/parser-binary';

export * from '@dawviz/parser-core';
export { parseMidi, parseAls, parseAlp, parseRpp, parseDawproject, parseBinaryWithSchema, matchSchema, BUILTIN_SCHEMAS };
export { inspectRpp } from '@dawviz/parser-rpp';
export { listExternalMidi };
export { externalMidiKey } from '@dawviz/parser-rpp';
export { alsInventory, listAlp } from '@dawviz/parser-als';
export { dawprojectInventory } from '@dawviz/parser-dawproject';
export { validateSchema, readBinary } from '@dawviz/parser-binary';

export const SUPPORTED = [
  { format: 'als', ext: ['.als'], note: 'Ableton Live: XML thuần hoặc Gzip XML; chỉ đọc Arrangement' },
  { format: 'alp', ext: ['.alp'], note: 'Ableton Live Pack (định dạng "pl-a": các .als gzip + manifest JSON + sample; cũng nhận ZIP)' },
  { format: 'flp', ext: ['.flp'], note: 'FL Studio 12 trở lên: chỉ nốt trong Pattern đặt lên Playlist (schema JSON dựng sẵn, schemas/flp.schema.json)' },
  { format: 'rpp', ext: ['.rpp'], note: 'Reaper; MIDI nhúng hoặc file .mid đi kèm' },
  { format: 'dawproject', ext: ['.dawproject'], note: 'Bitwig Studio, Studio One, Cubase...' },
  { format: 'mid', ext: ['.mid', '.midi', '.kar'], note: 'Standard MIDI File (mọi DAW xuất được MIDI); .kar là MIDI karaoke, cùng định dạng, lời nằm trong sự kiện Text/Lyric' },
  { format: 'binary', ext: ['(theo schema)'], note: 'Binary + JSON schema (ví dụ .bwproject khi đã có schema)' },
];

const extOf = (name) => (name.split('.').pop() || '').toLowerCase();

/** Nhận dạng theo phần mở rộng + magic bytes (REQ-UI-01). Trả { format, schema? } hoặc ném ERR_UNSUPPORTED_FORMAT. */
export function detectFormat(name, buffer, options = {}) {
  const u8 = toU8(buffer);
  const ext = extOf(name), kind = sniff(u8);
  const schema = matchSchema(name, u8, options.schemas || []); // schema người dùng nạp được ưu tiên
  if (schema) return { format: 'binary', schema };
  const builtin = matchSchema(name, u8, BUILTIN_SCHEMAS);
  if (builtin) return { format: builtin.id, schema: builtin };
  const bad = (msg) => fail('ERR_UNSUPPORTED_FORMAT', msg, { ext, kind });
  switch (ext) {
    case 'flp': { // FL Studio có thể lưu "Zipped loop package" (.flp thực chất là ZIP chứa .flp + sample): lấy .flp bên trong
      if (kind === 'zip') { const e = readZipDirectory(u8, resolveLimits(options.limits)).find((x) => !x.isDir && /\.flp$/i.test(x.name)); if (e) return { format: 'flp', zipEntry: e, schema: BUILTIN_SCHEMAS.find((x) => x.id === 'flp') }; }
      return bad(`nội dung không bắt đầu bằng FLhd (nhận dạng: ${kind})`);
    }
    case 'bwproject': return bad('.bwproject (Bitwig, nhị phân) chưa hỗ trợ trực tiếp vì chưa có schema: hãy xuất .dawproject (File > Export > DAWproject), hoặc nạp một schema nhị phân qua options.schemas');
    case 'als':
      if (kind === 'gzip' || kind === 'xml') return { format: 'als' };
      if (kind === 'zip') return bad('file .als có nội dung ZIP: nếu là Live Pack hãy dùng đuôi .alp');
      return bad(`nội dung không phải XML/Gzip (nhận dạng: ${kind})`);
    case 'alp': return kind === 'zip' || kind === 'alp-pack' ? { format: 'alp' } : bad(`.alp phải là gói Ableton "pl-a" hoặc ZIP (nhận dạng: ${kind})`);
    case 'rpp': return kind === 'rpp' ? { format: 'rpp' } : bad(`nội dung không bắt đầu bằng <REAPER_PROJECT (nhận dạng: ${kind})`);
    case 'dawproject': return kind === 'zip' ? { format: 'dawproject' } : bad(`.dawproject phải là ZIP (nhận dạng: ${kind})`);
    case 'mid': case 'midi': case 'kar': return kind === 'midi' ? { format: 'mid' } : bad(`nội dung không bắt đầu bằng MThd (nhận dạng: ${kind})`);
    default: {
      if (kind === 'zip') { // đuôi lạ: dò nội dung ZIP
        try { const e = readZipDirectory(u8, resolveLimits(options.limits)); if (findEntry(e, 'project.xml')) return { format: 'dawproject' }; if (e.some((x) => /\.als$/i.test(x.name))) return { format: 'alp' }; const f = e.find((x) => !x.isDir && /\.flp$/i.test(x.name)); if (f) return { format: 'flp', zipEntry: f, schema: BUILTIN_SCHEMAS.find((x) => x.id === 'flp') }; } catch { /* rơi xuống lỗi chung */ }
      }
      return bad(`định dạng .${ext} chưa được hỗ trợ`);
    }
  }
}

const KNOWN_EXT = new Set(['als', 'alp', 'rpp', 'flp', 'dawproject', 'mid', 'midi', 'kar']);

/**
 * Dò nhanh xem file cần thêm đầu vào nào để giao diện chỉ hiện ô nạp khi thật sự cần (REQ-UI-08):
 *  - needs.externalMidi: danh sách file .mid ngoài mà dự án Reaper tham chiếu;
 *  - needs.schema: định dạng nhị phân/chưa hỗ trợ trực tiếp, người dùng có thể nạp schema JSON.
 * Không ném lỗi: trả { format|null, needs, message? }.
 */
export function probeProject(name, buffer, options = {}) {
  const u8 = toU8(buffer);
  const needs = { externalMidi: [], schema: false };
  try {
    const d = detectFormat(name, u8, options);
    if (d.format === 'rpp') { try { needs.externalMidi = listExternalMidi(u8, options); } catch { /* parseProject sẽ báo lỗi chi tiết */ } }
    return { format: d.format, needs };
  } catch (e) {
    needs.schema = !KNOWN_EXT.has(extOf(name)); // .flp, .bwproject, đuôi lạ: có thể nạp schema nhị phân
    return { format: null, needs, code: e.code, message: e.message };
  }
}

/**
 * @param {string} name tên file (để lấy phần mở rộng)
 * @param {ArrayBuffer|Uint8Array} buffer
 * @param {object} [options] title, showMuted, tempoOverride (số BPM hoặc [{tick,bpm,num,den}]), limits, schemas, files/resolveFile (Reaper tham chiếu .mid ngoài)
 * @returns {Promise<{ast, warnings, info, format}>}
 */
export async function parseProject(name, buffer, options = {}) {
  const u8 = toU8(buffer);
  const limits = resolveLimits(options.limits);
  if (u8.length > limits.maxFileBytes) fail('ERR_FILE_TOO_LARGE', `${u8.length} byte > ${limits.maxFileBytes}`);
  const d = detectFormat(name, u8, options);
  const o = { ...options, title: options.title || name.replace(/\.[^.]+$/, ''), limits };
  let r;
  switch (d.format) {
    case 'als': r = await parseAls(u8, o); break;
    case 'alp': r = await parseAlp(u8, o); break;
    case 'rpp': r = await parseRpp(u8, o); break;
    case 'dawproject': r = await parseDawproject(u8, o); break;
    case 'mid': r = await parseMidi(u8, o); break;
    case 'flp': r = await parseBinaryWithSchema(d.zipEntry ? await extractEntry(u8, d.zipEntry, limits) : u8, d.schema, o); break;
    default: r = await parseBinaryWithSchema(u8, d.schema, o);
  }
  return { ...r, format: d.format };
}
