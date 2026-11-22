// Phần chạy trong trình duyệt của tài nguyên phiên (T-21): giải mã ảnh (SVG qua <img>, không chèn vào DOM nên không chạy script), nạp phông
// bằng FontFace từ byte (không cần URL, hợp CSP), và context để bảng Thiết lập / bảng Chữ thêm tài nguyên. Phần thuần ở sessionAssets.ts.
import { createContext, useContext } from 'react';
import { AssetError, checkImageSize, type AssetMeta } from './sessionAssets.ts';

export interface SessionAsset { meta: AssetMeta; file: File; bitmap?: ImageBitmap }
export interface AssetsApi {
  list: readonly AssetMeta[];
  /** Thêm tệp (ảnh, SVG, phông); trả meta. Ném AssetError có mã khi bị từ chối. */
  add(file: File): Promise<AssetMeta>;
  remove(id: string): void;
  /** Bản cho Export Worker: bản sao bitmap (chuyển quyền sở hữu sang Worker) và byte phông người dùng. */
  exportPayload(): Promise<ExportAssets>;
}
export interface ExportAssets { images: [string, ImageBitmap][]; fonts: { family: string; bytes: Uint8Array }[] }
export const AssetsContext = createContext<AssetsApi>({ list: [], add: async () => { throw new AssetError('ERR_ASSET_UNSUPPORTED', 'no asset store'); }, remove: () => {}, exportPayload: async () => ({ images: [], fonts: [] }) });
export const useAssets = (): AssetsApi => useContext(AssetsContext);

/** SVG không khai báo cỡ: vẽ ở cỡ này. */
const SVG_DEFAULT = 1024;
export async function decodeImage(meta: AssetMeta, bytes: Uint8Array): Promise<ImageBitmap> {
  try {
    if (meta.kind === 'svg') {
      const url = URL.createObjectURL(new Blob([bytes.slice().buffer as ArrayBuffer], { type: 'image/svg+xml' }));
      try {
        const img = new Image(); img.src = url; await img.decode();
        const w = img.naturalWidth || SVG_DEFAULT, h = img.naturalHeight || SVG_DEFAULT;
        checkImageSize(meta.name, w, h);
        return await createImageBitmap(img, { resizeWidth: w, resizeHeight: h });
      } finally { URL.revokeObjectURL(url); }
    }
    const bmp = await createImageBitmap(new Blob([bytes.slice().buffer as ArrayBuffer]));
    try { checkImageSize(meta.name, bmp.width, bmp.height); } catch (e) { bmp.close(); throw e; }
    return bmp;
  } catch (e) { if (e instanceof AssetError) throw e; throw new AssetError('ERR_ASSET_DECODE', 'cannot decode image', { name: meta.name }); }
}
/** Nạp phông vào một FontFaceSet (document.fonts hoặc self.fonts của Worker). */
export async function loadFontBytes(family: string, bytes: Uint8Array, set: FontFaceSet, name = family): Promise<void> {
  try { const face = new FontFace(family, bytes.slice().buffer as ArrayBuffer); await face.load(); set.add(face); }
  catch { throw new AssetError('ERR_ASSET_DECODE', 'cannot load font', { name }); }
}
