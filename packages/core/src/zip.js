// Đọc ZIP tối thiểu, không phụ thuộc. Chỉ giải nén entry được yêu cầu (gói .alp có thể chứa hàng trăm MB sample).
import { fail } from './errors.js';
import { inflateLimited } from './bytes.js';

const SIG_EOCD = 0x06054b50, SIG_CEN = 0x02014b50, SIG_LOC = 0x04034b50;

function checkName(name) {
  if (/(^|[\\/])\.\.([\\/]|$)/.test(name) || name.startsWith('/') || name.startsWith('\\') || /^[a-zA-Z]:/.test(name) || /[\x00-\x1f]/.test(name))
    fail('ERR_ARCHIVE_INVALID', `đường dẫn không hợp lệ trong ZIP: ${JSON.stringify(name)}`);
}

export function readZipDirectory(u8, limits) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  let e = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 22 - 65535); i--) if (dv.getUint32(i, true) === SIG_EOCD) { e = i; break; }
  if (e < 0) fail('ERR_ARCHIVE_INVALID', 'không thấy End-Of-Central-Directory (không phải ZIP hoặc bị cắt cụt)');
  const total = dv.getUint16(e + 10, true), cenSize = dv.getUint32(e + 12, true), cenOff = dv.getUint32(e + 16, true);
  if (total === 0xffff || cenSize === 0xffffffff || cenOff === 0xffffffff) fail('ERR_ARCHIVE_INVALID', 'ZIP64 chưa được hỗ trợ');
  if (total > limits.maxZipEntries) fail('ERR_ARCHIVE_TOO_LARGE', `ZIP có ${total} entry (> ${limits.maxZipEntries})`);
  if (cenOff + cenSize > u8.length) fail('ERR_ARCHIVE_INVALID', 'central directory vượt quá kích thước file');
  const entries = []; let p = cenOff;
  for (let i = 0; i < total; i++) {
    if (p + 46 > u8.length || dv.getUint32(p, true) !== SIG_CEN) fail('ERR_ARCHIVE_INVALID', 'central directory hỏng');
    const flags = dv.getUint16(p + 8, true), method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
    const nl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true);
    const off = dv.getUint32(p + 42, true);
    if (csize === 0xffffffff || usize === 0xffffffff || off === 0xffffffff) fail('ERR_ARCHIVE_INVALID', 'ZIP64 chưa được hỗ trợ');
    const raw = u8.subarray(p + 46, p + 46 + nl);
    const name = new TextDecoder(flags & 0x800 ? 'utf-8' : 'latin1').decode(raw);
    checkName(name);
    entries.push({ name, method, flags, compressedSize: csize, uncompressedSize: usize, offset: off, isDir: name.endsWith('/') });
    p += 46 + nl + xl + cl;
  }
  return entries;
}

export async function extractEntry(u8, entry, limits) {
  if (entry.flags & 1) fail('ERR_ARCHIVE_INVALID', `entry mã hoá không được hỗ trợ: ${entry.name}`);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  const o = entry.offset;
  if (o + 30 > u8.length || dv.getUint32(o, true) !== SIG_LOC) fail('ERR_ARCHIVE_INVALID', `local header hỏng: ${entry.name}`);
  const start = o + 30 + dv.getUint16(o + 26, true) + dv.getUint16(o + 28, true);
  const data = u8.subarray(start, start + entry.compressedSize);
  if (data.length !== entry.compressedSize) fail('ERR_ARCHIVE_INVALID', `dữ liệu entry bị cắt cụt: ${entry.name}`);
  if (entry.method === 0) {
    if (data.length > limits.maxUnzippedBytes) fail('ERR_ARCHIVE_TOO_LARGE', `entry quá lớn: ${entry.name}`);
    return data;
  }
  if (entry.method !== 8) fail('ERR_ARCHIVE_INVALID', `phương thức nén ${entry.method} chưa hỗ trợ: ${entry.name}`);
  return inflateLimited(data, 'deflate-raw', limits, `entry "${entry.name}"`);
}

export const findEntry = (entries, name) => entries.find((e) => e.name === name) || entries.find((e) => e.name.toLowerCase() === name.toLowerCase());
