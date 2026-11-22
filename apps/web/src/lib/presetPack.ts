// Gói preset để chia sẻ (T-24, REQ-STORAGE-06, CUSTOMIZATION §6.2–6.3): `.dawviz-preset.zip` gồm `preset.json` (vỏ chung + nội dung theo loại)
// và tài nguyên `assets/…` (ảnh, SVG, phông) kèm SHA-256. Giấy phép SPDX bắt buộc, trong danh sách cho phép. Đọc lại: kiểm cỡ/số tệp/tỉ lệ nén,
// băm từng tài nguyên, đọc nội dung qua đúng bộ kiểm của loại (trường lạ bỏ, giá trị ngoài miền kẹp). Lược đồ: presets/schema/preset-pack.schema.json.
// Không DOM; test ở presetPack.test.ts. Preset mở từ gói luôn mang nhãn "chưa kiểm duyệt" (thư viện cộng đồng có kiểm duyệt là 1.1).
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { DEFAULT_NOTE_STYLE, sanitizeScene, sanitizeStyle, sanitizeWidgetProps, silentSanitizer, type NoteStyle, type SceneDocument, type SceneWarning } from '@dawviz/render-core';
import { clampBezier, type Bezier } from './easeCurve.ts';
import { packAssetName, sha256Id, sniff } from './sessionAssets.ts';

export const PRESET_FORMAT = 'dawviz-preset', PRESET_FORMAT_VERSION = 1;
export const PRESET_KINDS = ['scene', 'note-style', 'easing', 'particle'] as const;
export type PresetKind = (typeof PRESET_KINDS)[number];
/** Giấy phép SPDX được nhận (cùng danh sách với scripts/preset-check, COMMUNITY-CONTENT §3–4). */
export const PRESET_LICENSES = Object.freeze(['CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'MIT', 'Apache-2.0', 'OFL-1.1', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC']);
export const PRESET_PACK_LIMITS = Object.freeze({ maxBytes: 60 * 1024 * 1024, maxUnzipped: 120 * 1024 * 1024, maxEntries: 64, maxJson: 2 * 1024 * 1024, maxRatio: 60 });
export const PRESET_EXT = '.dawviz-preset.zip';

export type PresetPayload =
  | { kind: 'scene'; scene: SceneDocument }
  | { kind: 'note-style'; style: Partial<NoteStyle> }
  | { kind: 'easing'; bezier: Bezier }
  | { kind: 'particle'; properties: Record<string, unknown> };
export interface PresetInfo { name: string; author: string; license: string; description: string }
export interface PresetAsset { name: string; bytes: Uint8Array }
export type PresetPackErrorCode = 'ERR_PRESET_INVALID' | 'ERR_PRESET_TOO_LARGE' | 'ERR_PRESET_LICENSE' | 'ERR_PRESET_HASH';
export class PresetPackError extends Error {
  code: PresetPackErrorCode; details?: Record<string, unknown>;
  constructor(code: PresetPackErrorCode, message: string, details?: Record<string, unknown>) { super(message); this.name = 'PresetPackError'; this.code = code; this.details = details; }
}

const clean = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '');
/** Tên tệp gói: slug chữ thường a-z0-9- (bỏ dấu), thêm đuôi `.dawviz-preset.zip`. */
export function presetFileName(name: string): string {
  const slug = name.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'preset';
  return `${slug}${PRESET_EXT}`;
}

/** Đóng gói. Ném PresetPackError khi thiếu tên/tác giả hoặc giấy phép không nằm trong danh sách. */
export async function buildPresetPack(info: PresetInfo, payload: PresetPayload, assets: readonly PresetAsset[] = [], now = new Date()): Promise<Uint8Array> {
  const name = clean(info.name, 60), author = clean(info.author, 60), description = clean(info.description, 500);
  if (!name || !author) throw new PresetPackError('ERR_PRESET_INVALID', 'name and author are required');
  if (!PRESET_LICENSES.includes(info.license)) throw new PresetPackError('ERR_PRESET_LICENSE', 'license not allowed', { license: info.license });
  const files: Record<string, Uint8Array> = {}, list: { file: string; sha256: string; size: number }[] = [];
  const seen = new Set<string>();
  for (const a of assets) {
    const id = await sha256Id(a.bytes), file = `assets/${packAssetName({ id, name: a.name })}`;
    if (seen.has(id)) continue; // cùng nội dung (dù khác tên) chỉ một tệp
    seen.add(id);
    files[file] = a.bytes; list.push({ file, sha256: id.slice(7), size: a.bytes.length });
  }
  const { kind, ...body } = payload;
  const doc = { format: PRESET_FORMAT, formatVersion: PRESET_FORMAT_VERSION, kind, name, author, license: info.license, ...(description ? { description } : {}), createdAt: now.toISOString(), payload: body, assets: list };
  files['preset.json'] = strToU8(JSON.stringify(doc, null, 2));
  return zipSync(files, { level: 6, mtime: now });
}

export interface ReadPreset { info: PresetInfo; payload: PresetPayload; assets: PresetAsset[]; warnings: SceneWarning[] }
/** Đọc gói: kiểm cỡ, số tệp, tỉ lệ nén, băm; nội dung qua bộ kiểm của loại. Lỗi → PresetPackError có mã. */
export async function readPresetPack(bytes: Uint8Array, limits = PRESET_PACK_LIMITS): Promise<ReadPreset> {
  if (bytes.length > limits.maxBytes) throw new PresetPackError('ERR_PRESET_TOO_LARGE', 'pack too large', { size: bytes.length });
  if (!(bytes[0] === 0x50 && bytes[1] === 0x4b)) throw new PresetPackError('ERR_PRESET_INVALID', 'not a zip file');
  let count = 0, total = 0, files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, { filter: (f) => {
      count++; total += f.originalSize;
      if (count > limits.maxEntries || total > limits.maxUnzipped || (f.size > 0 && f.originalSize / f.size > limits.maxRatio)) throw new PresetPackError('ERR_PRESET_TOO_LARGE', 'pack expands too much', { entries: count, bytes: total });
      if (f.name.includes('..') || f.name.startsWith('/') || f.name.includes('\\')) throw new PresetPackError('ERR_PRESET_INVALID', 'bad path', { path: f.name });
      return f.name === 'preset.json' || f.name.startsWith('assets/');
    } });
  } catch (e) { if (e instanceof PresetPackError) throw e; throw new PresetPackError('ERR_PRESET_INVALID', 'cannot unzip', { reason: String(e) }); }
  const pj = files['preset.json'];
  if (!pj) throw new PresetPackError('ERR_PRESET_INVALID', 'missing preset.json');
  if (pj.length > limits.maxJson) throw new PresetPackError('ERR_PRESET_TOO_LARGE', 'preset.json too large');
  let doc: Record<string, unknown>;
  try { doc = JSON.parse(strFromU8(pj)); } catch { throw new PresetPackError('ERR_PRESET_INVALID', 'preset.json is not JSON'); }
  if (!doc || typeof doc !== 'object' || doc.format !== PRESET_FORMAT) throw new PresetPackError('ERR_PRESET_INVALID', 'not a dawviz preset');
  if (typeof doc.formatVersion !== 'number' || doc.formatVersion > PRESET_FORMAT_VERSION) throw new PresetPackError('ERR_PRESET_INVALID', 'preset made by a newer app', { formatVersion: doc.formatVersion });
  const kind = doc.kind as PresetKind;
  if (!PRESET_KINDS.includes(kind)) throw new PresetPackError('ERR_PRESET_INVALID', 'unknown preset kind', { kind });
  const info: PresetInfo = { name: clean(doc.name, 60), author: clean(doc.author, 60), license: String(doc.license ?? ''), description: clean(doc.description, 500) };
  if (!info.name) throw new PresetPackError('ERR_PRESET_INVALID', 'missing name');
  if (!PRESET_LICENSES.includes(info.license)) throw new PresetPackError('ERR_PRESET_LICENSE', 'license not allowed', { license: info.license });
  // tài nguyên: mọi tệp liệt kê phải có, đúng băm, nhận dạng được; tệp thừa không liệt kê thì bỏ
  const assets: PresetAsset[] = [];
  for (const a of Array.isArray(doc.assets) ? doc.assets : []) {
    const f = a as { file?: unknown; sha256?: unknown }, file = typeof f.file === 'string' ? f.file : '', data = files[file];
    if (!data) throw new PresetPackError('ERR_PRESET_INVALID', 'listed asset missing', { file });
    if ((await sha256Id(data)).slice(7) !== f.sha256) throw new PresetPackError('ERR_PRESET_HASH', 'asset hash mismatch', { file });
    if (!sniff(data)) throw new PresetPackError('ERR_PRESET_INVALID', 'unknown asset type', { file });
    assets.push({ name: file.replace(/^assets\/asset-[0-9a-f]{16}-/, ''), bytes: data });
  }
  const body = (doc.payload && typeof doc.payload === 'object' ? doc.payload : {}) as Record<string, unknown>;
  let payload: PresetPayload, warnings: SceneWarning[] = [];
  if (kind === 'scene') { const r = sanitizeScene(body.scene); payload = { kind, scene: r.scene }; warnings = r.warnings; }
  else if (kind === 'note-style') {
    const raw = (body.style && typeof body.style === 'object' ? body.style : {}) as Record<string, unknown>, full = sanitizeStyle({ ...DEFAULT_NOTE_STYLE, ...raw } as NoteStyle);
    payload = { kind, style: Object.fromEntries(Object.keys(raw).filter((k) => k in DEFAULT_NOTE_STYLE).map((k) => [k, (full as unknown as Record<string, unknown>)[k]])) as Partial<NoteStyle> };
  } else if (kind === 'easing') {
    const b = body.bezier;
    if (!Array.isArray(b) || b.length !== 4 || !b.every((x) => typeof x === 'number' && Number.isFinite(x))) throw new PresetPackError('ERR_PRESET_INVALID', 'easing needs bezier [x1, y1, x2, y2]');
    payload = { kind, bezier: clampBezier(b) };
  } else payload = { kind, properties: sanitizeWidgetProps('PARTICLES', body.properties, silentSanitizer()) ?? {} };
  return { info, payload, assets, warnings };
}
