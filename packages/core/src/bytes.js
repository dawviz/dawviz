// Tiện ích byte: ép về Uint8Array, nhận dạng magic bytes, giải nén có trần (chống zip bomb), giải mã UTF-8.
import { fail } from './errors.js';

export const toU8 = (b) => (b instanceof Uint8Array ? b : b instanceof ArrayBuffer ? new Uint8Array(b) : ArrayBuffer.isView(b) ? new Uint8Array(b.buffer, b.byteOffset, b.byteLength) : fail('ERR_AST_INVALID', 'đầu vào phải là ArrayBuffer/Uint8Array'));

const startsWith = (u8, ...bytes) => bytes.every((b, i) => u8[i] === b);

// Nhận dạng theo magic bytes (REQ-UI-01).
export function sniff(u8) {
  if (startsWith(u8, 0x1f, 0x8b)) return 'gzip';
  if (startsWith(u8, 0x50, 0x4b, 0x03, 0x04) || startsWith(u8, 0x50, 0x4b, 0x05, 0x06)) return 'zip';
  if (startsWith(u8, 0x4d, 0x54, 0x68, 0x64)) return 'midi';
  if (startsWith(u8, 0x70, 0x6c, 0x2d, 0x61)) return 'alp-pack'; // "pl-a": Ableton Live Pack thật (không phải ZIP)
  // văn bản: bỏ BOM + khoảng trắng đầu
  let i = 0;
  if (u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) i = 3;
  while (i < 64 && (u8[i] === 0x20 || u8[i] === 0x0a || u8[i] === 0x0d || u8[i] === 0x09)) i++;
  const head = new TextDecoder('latin1').decode(u8.subarray(i, i + 40));
  if (head.startsWith('<REAPER_PROJECT')) return 'rpp';
  if (head.startsWith('<?xml') || head.startsWith('<Ableton') || head.startsWith('<Project')) return 'xml';
  return 'unknown';
}

// Giải nén streaming, đếm byte thực tế (không tin header) — chống zip-bomb.
export async function inflateLimited(u8, format, limits, label = 'dữ liệu') {
  if (typeof DecompressionStream === 'undefined') fail('ERR_NO_SUPPORTED_ENV', 'môi trường không có DecompressionStream (cần Chrome 103+/Node 18+)');
  const cap = Math.min(limits.maxUnzippedBytes, limits.maxRatio * u8.length + 1e6);
  const stream = new ReadableStream({ start(c) { c.enqueue(u8); c.close(); } }).pipeThrough(new DecompressionStream(format));
  const reader = stream.getReader();
  const chunks = []; let total = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > cap) { await reader.cancel().catch(() => {}); fail('ERR_ARCHIVE_TOO_LARGE', `${label} giải nén vượt giới hạn (${total} > ${Math.floor(cap)} byte; tỉ lệ tối đa ${limits.maxRatio}:1)`, { total, cap }); }
      chunks.push(value);
    }
  } catch (e) {
    if (e && e.code) throw e;
    fail('ERR_ARCHIVE_INVALID', `${label} hỏng hoặc không giải nén được (${e && e.message})`);
  }
  const out = new Uint8Array(total); let p = 0;
  for (const c of chunks) { out.set(c, p); p += c.length; }
  return out;
}

export function decodeUtf8(u8) {
  let s = 0;
  if (u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) s = 3;
  return new TextDecoder('utf-8').decode(s ? u8.subarray(s) : u8);
}
