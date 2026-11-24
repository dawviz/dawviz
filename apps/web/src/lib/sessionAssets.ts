// Tài nguyên của phiên (T-21, AD-12, REQ-STORAGE-05): ảnh (PNG/JPEG/WebP/GIF), SVG (chỉ vẽ dạng ảnh) và phông (WOFF2/WOFF/TTF/OTF).
// Định danh bằng SHA-256 của nội dung (`sha256:<hex>`): cùng tệp nạp hai lần chỉ có một bản. Nhận dạng bằng magic bytes, không tin đuôi tệp.
// Giới hạn: 20 MB mỗi tệp, 200 MB mỗi phiên, cạnh ảnh ≤ 8192 px. SVG bị kiểm nội dung (script, on*=, foreignObject, liên kết ngoài, ENTITY):
// dù chỉ vẽ qua ảnh (không chạy script), tệp nghi ngờ vẫn bị từ chối để gói preset/Project Pack không mang mã độc đi tiếp.
// Phần thuần ở đây (không DOM); giải mã ảnh và nạp phông nằm sau các hàm tiêm vào. Test ở sessionAssets.test.ts.

export type AssetKind = 'image' | 'svg' | 'font';
export interface AssetMeta { id: string; kind: AssetKind; name: string; size: number; /** Phông: họ phông dùng trong kiểu chữ. */ family?: string }
export const ASSET_LIMITS = Object.freeze({ maxBytes: 20 * 1024 * 1024, maxSessionBytes: 200 * 1024 * 1024, maxEdge: 8192 });
export type AssetErrorCode = 'ERR_ASSET_TOO_LARGE' | 'ERR_ASSET_DECODE' | 'ERR_ASSET_UNSUPPORTED' | 'ERR_ASSET_SESSION_FULL' | 'ERR_ASSET_UNSAFE';
export class AssetError extends Error {
  code: AssetErrorCode; details?: Record<string, unknown>;
  constructor(code: AssetErrorCode, message: string, details?: Record<string, unknown>) { super(message); this.name = 'AssetError'; this.code = code; this.details = details; }
}
/** Chọn tệp: phần mở rộng gợi ý cho hộp chọn (nhận dạng thật vẫn bằng nội dung). */
export const IMAGE_ACCEPT = '.png,.jpg,.jpeg,.webp,.gif,.svg,image/png,image/jpeg,image/webp,image/gif,image/svg+xml';
export const FONT_ACCEPT = '.woff2,.woff,.ttf,.otf,font/woff2,font/woff,font/ttf,font/otf';

const starts = (b: Uint8Array, sig: number[], at = 0) => sig.every((x, i) => b[at + i] === x);
const ascii = (b: Uint8Array, s: string, at = 0) => starts(b, [...s].map((c) => c.charCodeAt(0)), at);
/** Nhận dạng theo magic bytes; SVG theo phần đầu văn bản. Không nhận ra → null. */
export function sniff(b: Uint8Array): { kind: AssetKind; ext: string } | null {
  if (starts(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: 'image', ext: 'png' };
  if (starts(b, [0xff, 0xd8, 0xff])) return { kind: 'image', ext: 'jpg' };
  if (ascii(b, 'GIF87a') || ascii(b, 'GIF89a')) return { kind: 'image', ext: 'gif' };
  if (ascii(b, 'RIFF') && ascii(b, 'WEBP', 8)) return { kind: 'image', ext: 'webp' };
  if (ascii(b, 'wOF2')) return { kind: 'font', ext: 'woff2' };
  if (ascii(b, 'wOFF')) return { kind: 'font', ext: 'woff' };
  if (ascii(b, 'OTTO')) return { kind: 'font', ext: 'otf' };
  if (starts(b, [0, 1, 0, 0]) || ascii(b, 'true')) return { kind: 'font', ext: 'ttf' };
  const head = new TextDecoder('utf-8', { fatal: false }).decode(b.subarray(0, 1024)).replace(/^﻿/, '').trimStart();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return { kind: 'svg', ext: 'svg' };
  return null;
}

/** Lý do một SVG bị từ chối (rỗng = an toàn để vẽ dạng ảnh và mang theo trong gói). */
export function svgProblems(text: string): string[] {
  const out: string[] = [];
  if (/<script[\s/>]/i.test(text)) out.push('script');
  if (/\son[a-z]+\s*=/i.test(text)) out.push('event-handler');
  if (/<foreignObject[\s/>]/i.test(text)) out.push('foreignObject');
  if (/<!ENTITY/i.test(text)) out.push('entity');
  if (/javascript:/i.test(text)) out.push('javascript-url');
  for (const m of text.matchAll(/(?:xlink:)?href\s*=\s*["']([^"']*)["']/gi)) if (!m[1].startsWith('#') && !m[1].startsWith('data:image/')) { out.push('external-link'); break; }
  if (/url\(\s*["']?(?!#|data:image\/)/i.test(text)) out.push('external-url');
  return [...new Set(out)];
}

export async function sha256Id(bytes: Uint8Array): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes.slice().buffer as ArrayBuffer));
  return `sha256:${[...d].map((x) => x.toString(16).padStart(2, '0')).join('')}`;
}

/** Họ phông từ tên tệp (bỏ đuôi, chỉ giữ chữ/số/khoảng trắng/gạch), không trùng họ đã có; tối đa 40 ký tự. */
export function fontFamilyFor(fileName: string, taken: ReadonlySet<string>): string {
  const base = (fileName.replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N} _-]+/gu, ' ').replace(/\s+/g, ' ').trim() || 'Font').slice(0, 40);
  if (!taken.has(base)) return base;
  for (let i = 2; ; i++) { const n = `${base} ${i}`; if (!taken.has(n)) return n; }
}

/**
 * Kiểm và nhận một tệp vào danh sách tài nguyên của phiên. Trả meta (đã có thì trả bản cũ, không thêm). Ném AssetError có mã khi:
 * quá 20 MB, phiên quá 200 MB, không nhận dạng được, SVG có nội dung nguy hiểm. Kích thước ảnh kiểm sau khi giải mã (checkImageSize).
 */
export async function acceptAsset(list: readonly AssetMeta[], name: string, bytes: Uint8Array): Promise<{ meta: AssetMeta; added: boolean }> {
  if (bytes.length === 0) throw new AssetError('ERR_ASSET_DECODE', 'empty file', { name });
  if (bytes.length > ASSET_LIMITS.maxBytes) throw new AssetError('ERR_ASSET_TOO_LARGE', 'file too large', { name, size: bytes.length, max: ASSET_LIMITS.maxBytes });
  const s = sniff(bytes);
  if (!s) throw new AssetError('ERR_ASSET_UNSUPPORTED', 'unsupported file type', { name });
  if (s.kind === 'svg') { const p = svgProblems(new TextDecoder().decode(bytes)); if (p.length) throw new AssetError('ERR_ASSET_UNSAFE', 'unsafe SVG', { name, problems: p }); }
  const id = await sha256Id(bytes), old = list.find((a) => a.id === id);
  if (old) return { meta: old, added: false };
  const used = list.reduce((n, a) => n + a.size, 0);
  if (used + bytes.length > ASSET_LIMITS.maxSessionBytes) throw new AssetError('ERR_ASSET_SESSION_FULL', 'session assets full', { name, used, max: ASSET_LIMITS.maxSessionBytes });
  const meta: AssetMeta = { id, kind: s.kind, name: name.slice(0, 120), size: bytes.length };
  if (s.kind === 'font') meta.family = fontFamilyFor(name, new Set(list.filter((a) => a.family).map((a) => a.family!)));
  return { meta, added: true };
}
/** Cạnh ảnh sau giải mã: quá 8192 px thì từ chối. */
export function checkImageSize(name: string, w: number, h: number): void {
  if (!(w > 0 && h > 0)) throw new AssetError('ERR_ASSET_DECODE', 'image has no size', { name });
  if (Math.max(w, h) > ASSET_LIMITS.maxEdge) throw new AssetError('ERR_ASSET_TOO_LARGE', 'image too large', { name, width: w, height: h, max: ASSET_LIMITS.maxEdge });
}

/** Tên tệp tài nguyên trong Project Pack: `asset-<16 hex đầu>-<tên gốc an toàn>`; đọc lại bằng parsePackAssetName. */
export const packAssetName = (m: Pick<AssetMeta, 'id' | 'name'>): string => `asset-${m.id.slice(7, 23)}-${m.name.replace(/[^\w.-]+/g, '_').slice(0, 80)}`;
export const parsePackAssetName = (n: string): { short: string; name: string } | null => { const m = /^asset-([0-9a-f]{16})-(.+)$/.exec(n); return m ? { short: m[1], name: m[2] } : null; };

/** Tài nguyên mà scene dùng: ảnh (widget Ảnh) và họ phông (kiểu chữ, ghi đè chữ) — để pre-flight báo thiếu trước khi xuất. */
type WidgetsLike = { widgets: readonly { type: string; properties: unknown }[]; comps?: Readonly<Record<string, { widgets: readonly { type: string; properties: unknown }[] }>> };
/** Ảnh mà scene dùng, kể cả ảnh trong precomp (D-69). */
export function referencedAssets(scene: WidgetsLike): string[] {
  const out = new Set<string>();
  for (const list of [scene.widgets, ...Object.values(scene.comps ?? {}).map((c) => c.widgets)])
    for (const w of list) if (w.type === 'IMAGE') { const a = (w.properties as { asset?: unknown }).asset; if (typeof a === 'string' && a) out.add(a); }
  return [...out];
}
export function missingAssets(scene: WidgetsLike, have: ReadonlySet<string>): string[] {
  return referencedAssets(scene).filter((id) => !have.has(id));
}
