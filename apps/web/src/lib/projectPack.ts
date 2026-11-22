// Project Pack `.zip` (T-10, REQ-STORAGE-03/04): đóng gói và mở lại một phiên làm việc.
// Phần thuần (không DOM, không IndexedDB): build/read nhận và trả `Uint8Array`, chạy được dưới `node --test`.
// Nhập pack đi qua giới hạn giải nén (REQ-PARSER-00): đếm entry, kích thước khai báo TRƯỚC khi giải nén, tỉ lệ, đường dẫn an toàn, băm SHA-256.
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';

export const PACK_SCHEMA_VERSION = '1.0.0';
/** Giới hạn khi nhập pack [PROVISIONAL]; lấy theo REQ-PARSER-00 nhưng chặt hơn vì pack do ứng dụng tạo. */
export const PACK_LIMITS = Object.freeze({ maxFileBytes: 400e6, maxUnzippedBytes: 600e6, maxEntries: 400, maxJsonBytes: 20e6, maxRatio: 60 });
export type PackLimits = typeof PACK_LIMITS;

export type PackErrorCode = 'ERR_PACK_INVALID' | 'ERR_PACK_HASH' | 'ERR_ARCHIVE_INVALID' | 'ERR_ARCHIVE_TOO_LARGE' | 'ERR_SCHEMA_NEWER';
export class PackError extends Error {
  code: PackErrorCode;
  details?: Record<string, unknown>;
  constructor(code: PackErrorCode, message: string, details?: Record<string, unknown>) {
    super(`${code}: ${message}`);
    this.name = 'PackError';
    this.code = code;
    this.details = details;
  }
}

export type PackRole = 'source' | 'audio' | 'asset' | 'json';
export interface PackFileEntry { path: string; size: number; sha256: string; role: PackRole }
export interface PackManifest {
  schemaVersion: string;
  generator: string;
  createdAt: string;
  title: string;
  author?: string;
  /** Tên tệp dự án gốc (đường dẫn trong pack là `source/<name>`). */
  source: { name: string };
  /** Ghi đè tempo của người dùng: số BPM hoặc danh sách điểm đổi tempo. Không có = dùng tempo trong tệp. */
  tempoOverride?: number | { tick: number; bpm: number; num?: number; den?: number }[];
  audio?: { name: string; offsetMs: number };
  files: PackFileEntry[];
}

export interface PackInput {
  title: string;
  author?: string;
  now: Date;
  /** `SceneDocument` (đã kiểm schema khi nhập lại bằng `sanitizeScene` ở nơi gọi). */
  scene: unknown;
  /** Phần còn lại của tài liệu (độ sáng, thứ tự/ẩn/solo track, offset âm thanh, phong cách video): JSON tuỳ ý, kiểm khi nạp. */
  workspace: unknown;
  /** Hợp âm sửa tay (chưa có tính năng; ghi `{}` để giữ chỗ cho M5). */
  overrides?: unknown;
  source: { name: string; bytes: Uint8Array };
  tempoOverride?: PackManifest['tempoOverride'];
  audio?: { name: string; bytes: Uint8Array; offsetMs: number };
  assets?: { name: string; bytes: Uint8Array }[];
  /** Chuỗi cảnh (T-110, D-66 kiểu C): manifest mốc thời gian + các scene đã dùng theo khoá. JSON tuỳ ý, kiểm bằng `sanitizeManifest`/`sanitizeScene` khi nạp. */
  sequence?: { manifest: unknown; scenes: Record<string, unknown> };
}

export interface PackContents {
  manifest: PackManifest;
  scene: unknown;
  workspace: unknown;
  overrides: unknown;
  source: { name: string; bytes: Uint8Array };
  audio?: { name: string; bytes: Uint8Array; offsetMs: number };
  assets: { name: string; bytes: Uint8Array }[];
  /** Chuỗi cảnh nếu pack có (đã đọc JSON, CHƯA kiểm schema). */
  sequence?: { manifest: unknown; scenes: Record<string, unknown> };
  warnings: { code: string; message: string; details?: Record<string, unknown> }[];
}

const SEQUENCE_PATH = 'sequence.json', SCENE_PATH = 'workspace_preset.json', WORKSPACE_PATH = 'workspace.json', OVERRIDES_PATH = 'overrides.json', MANIFEST_PATH = 'manifest.json';

/** Chuẩn hoá tên tệp người dùng thành một thành phần đường dẫn an toàn (không `/`, `\`, `..`, ký tự điều khiển). */
export function safeName(name: string, fallback: string): string {
  const base = name.split(/[\\/]/).pop() ?? '';
  // eslint-disable-next-line no-control-regex
  const clean = base.replace(/[\u0000-\u001f<>:"|?*]/g, '_').replace(/^\.+/, '').trim().slice(0, 120);
  return clean || fallback;
}

/** Đường dẫn trong ZIP có an toàn không (REQ-PARSER-00). */
export function isSafePackPath(p: string): boolean {
  if (!p || p.startsWith('/') || p.includes('\\') || /^[a-zA-Z]:/.test(p)) return false;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f]/.test(p)) return false;
  return !p.split('/').some((s) => s === '..' || s === '.');
}

const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  // `slice` để có ArrayBuffer riêng (digest không nhận SharedArrayBuffer/offset lạ).
  return hex(await crypto.subtle.digest('SHA-256', bytes.slice().buffer));
}

/** Tên tệp không trùng trong cùng một thư mục: `a.png`, `a-2.png`, … */
function uniqueNames(names: string[]): string[] {
  const seen = new Set<string>();
  return names.map((n) => {
    let out = n, i = 2;
    const dot = n.lastIndexOf('.');
    const stem = dot > 0 ? n.slice(0, dot) : n, ext = dot > 0 ? n.slice(dot) : '';
    while (seen.has(out.toLowerCase())) out = `${stem}-${i++}${ext}`;
    seen.add(out.toLowerCase());
    return out;
  });
}

export async function buildPack(input: PackInput): Promise<Uint8Array> {
  const sourceName = safeName(input.source.name, 'project');
  const assetNames = uniqueNames((input.assets ?? []).map((a) => safeName(a.name, 'asset')));
  const files: Record<string, Uint8Array> = {};
  const entries: PackFileEntry[] = [];
  const add = async (path: string, bytes: Uint8Array, role: PackRole) => {
    files[path] = bytes;
    entries.push({ path, size: bytes.length, sha256: await sha256Hex(bytes), role });
  };
  const json = (v: unknown) => strToU8(JSON.stringify(v ?? null) + '\n');
  await add(SCENE_PATH, json(input.scene), 'json');
  await add(WORKSPACE_PATH, json(input.workspace), 'json');
  await add(OVERRIDES_PATH, json(input.overrides ?? {}), 'json');
  if (input.sequence) await add(SEQUENCE_PATH, json(input.sequence), 'json');
  await add(`source/${sourceName}`, input.source.bytes, 'source');
  let audio: PackManifest['audio'];
  if (input.audio) {
    const n = safeName(input.audio.name, 'audio');
    await add(`audio/${n}`, input.audio.bytes, 'audio');
    audio = { name: n, offsetMs: input.audio.offsetMs };
  }
  for (const [i, a] of (input.assets ?? []).entries()) await add(`assets/${assetNames[i]}`, a.bytes, 'asset');
  const manifest: PackManifest = {
    schemaVersion: PACK_SCHEMA_VERSION, generator: 'dawviz', createdAt: input.now.toISOString(),
    title: input.title, ...(input.author ? { author: input.author } : {}),
    source: { name: sourceName }, ...(input.tempoOverride !== undefined ? { tempoOverride: input.tempoOverride } : {}),
    ...(audio ? { audio } : {}), files: entries,
  };
  // Mọi thứ trừ JSON và dự án đã nén sẵn (audio/ảnh) thì không nén lại: level 0 nhanh và an toàn bộ nhớ; dự án/JSON là chữ nên nén.
  const level = (p: string) => (p.startsWith('audio/') || p.startsWith('assets/') ? 0 : 6);
  const zipInput: Record<string, [Uint8Array, { level: 0 | 6 }]> = { [MANIFEST_PATH]: [json(manifest), { level: 6 }] };
  for (const [p, b] of Object.entries(files)) zipInput[p] = [b, { level: level(p) as 0 | 6 }];
  return zipSync(zipInput, { mtime: input.now });
}

/** Phiên bản chính.phụ.vá → [chính, phụ, vá]; sai dạng → null. */
function parseVer(v: unknown): [number, number, number] | null {
  const m = typeof v === 'string' ? /^(\d{1,4})\.(\d{1,4})\.(\d{1,4})$/.exec(v) : null;
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** So sánh phiên bản: dương nếu a mới hơn b. */
const cmpVer = (a: number[], b: number[]) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

function jsonOf(files: Record<string, Uint8Array>, path: string, limits: PackLimits, required: boolean): unknown {
  const b = files[path];
  if (!b) { if (required) throw new PackError('ERR_PACK_INVALID', `thiếu ${path}`, { path }); return undefined; }
  if (b.length > limits.maxJsonBytes) throw new PackError('ERR_ARCHIVE_TOO_LARGE', `${path} lớn hơn giới hạn JSON`, { path, size: b.length });
  try { return JSON.parse(strFromU8(b).replace(/^﻿/, '')); }
  catch (e) { throw new PackError('ERR_PACK_INVALID', `${path} không phải JSON hợp lệ: ${(e as Error).message}`, { path }); }
}

export async function readPack(bytes: Uint8Array, limitsIn: Partial<PackLimits> = {}): Promise<PackContents> {
  const limits = { ...PACK_LIMITS, ...limitsIn };
  if (bytes.length > limits.maxFileBytes) throw new PackError('ERR_ARCHIVE_TOO_LARGE', `pack ${bytes.length} byte vượt giới hạn ${limits.maxFileBytes}`, { size: bytes.length });
  if (!(bytes[0] === 0x50 && bytes[1] === 0x4b)) throw new PackError('ERR_ARCHIVE_INVALID', 'không phải tệp ZIP');
  // `filter` chạy trước khi giải nén từng entry: chặn theo kích thước khai báo, đường dẫn và số entry; sau giải nén kiểm lại cỡ thật.
  let count = 0, declared = 0;
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, {
      filter: (f) => {
        if (++count > limits.maxEntries) throw new PackError('ERR_ARCHIVE_TOO_LARGE', `pack có hơn ${limits.maxEntries} entry`, { max: limits.maxEntries });
        if (f.name.endsWith('/')) return false;
        if (!isSafePackPath(f.name)) throw new PackError('ERR_ARCHIVE_INVALID', `đường dẫn không an toàn: ${JSON.stringify(f.name)}`, { path: f.name });
        declared += f.originalSize;
        if (declared > limits.maxUnzippedBytes || f.originalSize > limits.maxFileBytes) throw new PackError('ERR_ARCHIVE_TOO_LARGE', 'giải nén vượt giới hạn', { declared });
        if (f.size > 0 && f.originalSize / f.size > limits.maxRatio && f.originalSize > 1e6) throw new PackError('ERR_ARCHIVE_TOO_LARGE', `tỉ lệ giải nén quá lớn ở ${f.name}`, { path: f.name });
        return true;
      },
    });
  } catch (e) {
    if (e instanceof PackError) throw e;
    throw new PackError('ERR_ARCHIVE_INVALID', `ZIP hỏng: ${(e as Error).message}`);
  }
  let real = 0;
  for (const b of Object.values(files)) real += b.length;
  if (real > limits.maxUnzippedBytes) throw new PackError('ERR_ARCHIVE_TOO_LARGE', 'giải nén vượt giới hạn', { total: real });

  const manifest = jsonOf(files, MANIFEST_PATH, limits, true) as PackManifest;
  const ver = parseVer(manifest?.schemaVersion);
  if (!manifest || typeof manifest !== 'object' || !ver) throw new PackError('ERR_PACK_INVALID', 'manifest thiếu hoặc sai schemaVersion');
  const cur = parseVer(PACK_SCHEMA_VERSION)!;
  // Chính lớn hơn: không hiểu được. Cùng chính, phụ/vá mới hơn: đọc được (trường lạ bỏ qua) nhưng báo.
  if (ver[0] > cur[0]) throw new PackError('ERR_SCHEMA_NEWER', `pack ${manifest.schemaVersion} mới hơn ứng dụng (${PACK_SCHEMA_VERSION})`, { found: manifest.schemaVersion, supported: PACK_SCHEMA_VERSION });
  const warnings: PackContents['warnings'] = [];
  if (cmpVer(ver, cur) > 0) warnings.push({ code: 'WARN_PACK_NEWER_MINOR', message: `pack ${manifest.schemaVersion} mới hơn ${PACK_SCHEMA_VERSION}; trường lạ bị bỏ qua` });

  if (!Array.isArray(manifest.files)) throw new PackError('ERR_PACK_INVALID', 'manifest thiếu danh sách tệp');
  // Băm: mọi tệp trong manifest phải có và khớp; tệp ngoài manifest bị bỏ (báo).
  const listed = new Set<string>();
  for (const f of manifest.files) {
    if (!f || typeof f.path !== 'string' || !isSafePackPath(f.path)) throw new PackError('ERR_ARCHIVE_INVALID', `manifest có đường dẫn không an toàn: ${JSON.stringify(f?.path)}`);
    const b = files[f.path];
    if (!b) throw new PackError('ERR_PACK_INVALID', `manifest nêu ${f.path} nhưng pack không có`, { path: f.path });
    if (b.length !== f.size || (await sha256Hex(b)) !== f.sha256) throw new PackError('ERR_PACK_HASH', `${f.path} không khớp băm trong manifest`, { path: f.path });
    listed.add(f.path);
  }
  for (const p of Object.keys(files)) if (p !== MANIFEST_PATH && !listed.has(p)) warnings.push({ code: 'WARN_PACK_UNLISTED_FILE', message: `bỏ qua tệp không có trong manifest: ${p}`, details: { path: p } });

  const srcName = manifest.source?.name;
  const srcPath = typeof srcName === 'string' ? `source/${srcName}` : '';
  if (!srcPath || !isSafePackPath(srcPath) || !listed.has(srcPath)) throw new PackError('ERR_PACK_INVALID', 'pack không có tệp dự án nguồn');
  let audio: PackContents['audio'];
  if (manifest.audio) {
    const p = `audio/${manifest.audio.name}`;
    if (isSafePackPath(p) && listed.has(p)) audio = { name: manifest.audio.name, bytes: files[p], offsetMs: Number.isFinite(manifest.audio.offsetMs) ? manifest.audio.offsetMs : 0 };
    else warnings.push({ code: 'WARN_PACK_AUDIO_MISSING', message: 'manifest nêu âm thanh nhưng pack không có tệp đó' });
  }
  const assets = [...listed].filter((p) => p.startsWith('assets/')).map((p) => ({ name: p.slice('assets/'.length), bytes: files[p] }));
  return {
    manifest, scene: jsonOf(files, SCENE_PATH, limits, true), workspace: jsonOf(files, WORKSPACE_PATH, limits, false) ?? {},
    overrides: jsonOf(files, OVERRIDES_PATH, limits, false) ?? {},
    ...(listed.has(SEQUENCE_PATH) ? (() => { const q = jsonOf(files, SEQUENCE_PATH, limits, false) as { manifest?: unknown; scenes?: unknown } | undefined; return q && typeof q === 'object' && q.scenes && typeof q.scenes === 'object' ? { sequence: { manifest: q.manifest, scenes: q.scenes as Record<string, unknown> } } : {}; })() : {}),
    source: { name: srcName as string, bytes: files[srcPath] }, ...(audio ? { audio } : {}), assets, warnings,
  };
}
