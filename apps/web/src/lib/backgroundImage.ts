// Nạp ảnh nền (T-21, AD-12): tài nguyên của phiên. Kiểm kích thước và định dạng TRƯỚC khi giải mã; ảnh quá lớn về điểm ảnh được thu nhỏ khi giải mã
// để bộ nhớ không phình (cạnh dài ≤ 4096). Phần phụ thuộc trình duyệt tiêm vào để test.
export const MAX_BACKGROUND_BYTES = 20 * 1024 * 1024;
export const MAX_BACKGROUND_EDGE = 4096;
export const BACKGROUND_ACCEPT = '.png,.jpg,.jpeg,.webp,.gif,image/png,image/jpeg,image/webp,image/gif';
const EXT = /\.(png|jpe?g|webp|gif)$/i;

export type BackgroundErrorCode = 'ERR_ASSET_TOO_LARGE' | 'ERR_ASSET_DECODE';
export class BackgroundError extends Error {
  readonly code: BackgroundErrorCode; readonly details: Record<string, unknown>;
  constructor(code: BackgroundErrorCode, message: string, details: Record<string, unknown> = {}) { super(message); this.name = 'BackgroundError'; this.code = code; this.details = details; }
}

export const hasImageExtension = (name: string): boolean => EXT.test(name);
/** Phần mở rộng chuẩn hoá (png, jpg, webp, gif) để đặt tên tệp trong Project Pack. */
export const imageExt = (name: string): string => { const m = EXT.exec(name); return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'png'; };
/** Cỡ giải mã: giữ tỉ lệ, cạnh dài không quá `max`; không đổi nếu đã nhỏ hơn. */
export function targetSize(w: number, h: number, max = MAX_BACKGROUND_EDGE): { width: number; height: number } {
  const k = Math.min(1, max / Math.max(w, h));
  return { width: Math.max(1, Math.round(w * k)), height: Math.max(1, Math.round(h * k)) };
}

export interface BitmapLike { width: number; height: number; close?(): void }
export interface DecodeDeps { decode(file: Blob, size?: { width: number; height: number }): Promise<BitmapLike> }
export const browserDecode: DecodeDeps = { decode: (f, s) => createImageBitmap(f, s ? { resizeWidth: s.width, resizeHeight: s.height, resizeQuality: 'high' } : undefined) };

export async function loadBackground(file: File, deps: DecodeDeps = browserDecode): Promise<BitmapLike> {
  if (file.size === 0 || !hasImageExtension(file.name)) throw new BackgroundError('ERR_ASSET_DECODE', 'unsupported or empty image', { reason: file.size === 0 ? 'empty' : 'format' });
  if (file.size > MAX_BACKGROUND_BYTES) throw new BackgroundError('ERR_ASSET_TOO_LARGE', 'image too large', { size: file.size, max: MAX_BACKGROUND_BYTES });
  let bmp: BitmapLike;
  try { bmp = await deps.decode(file); } catch { throw new BackgroundError('ERR_ASSET_DECODE', 'cannot decode image', { reason: 'decode' }); }
  const t = targetSize(bmp.width, bmp.height);
  if (t.width === bmp.width && t.height === bmp.height) return bmp;
  bmp.close?.();
  try { return await deps.decode(file, t); } catch { throw new BackgroundError('ERR_ASSET_DECODE', 'cannot decode image', { reason: 'decode' }); }
}
