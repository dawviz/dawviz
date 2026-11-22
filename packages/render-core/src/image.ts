// Widget Ảnh (T-21, REQ-STORAGE-05): vẽ một tài nguyên ảnh của phiên (PNG/JPEG/WebP/GIF khung đầu, SVG đã giải mã thành ảnh) hoặc một
// khung của sprite sheet (lưới cột × hàng, chạy theo `fps` từ đầu khoảng hiển thị). Ảnh tham chiếu bằng định danh nội dung `sha256:<hex>`,
// bitmap nằm ở `Derived.images` (Preview và Export cùng bảng). Thiếu ảnh (chưa nạp, chưa có trong phiên) thì không vẽ gì.
import type { ImagePrim, LayoutCtx, Primitive, WidgetRenderer } from './prims.ts';
import type { WidgetSpec } from './scene.ts';
import { activeRange } from './widgetMotion.ts';

export type ImageFit = 'contain' | 'cover' | 'stretch';
export interface ImageProps {
  /** `sha256:<64 hex>` hoặc '' (chưa chọn ảnh). */
  asset: string;
  fit: ImageFit;
  /** Sprite sheet: số cột, số hàng của lưới; `frames` khung dùng (≤ cột × hàng, đọc theo hàng); `fps` tốc độ; `loop` lặp hay dừng ở khung cuối. */
  cols: number; rows: number; frames: number; fps: number; loop: boolean;
  /** Vẽ mượt khi phóng (tắt cho ảnh pixel art). */
  smooth: boolean;
}
export const DEFAULT_IMAGE: Readonly<ImageProps> = Object.freeze({ asset: '', fit: 'contain', cols: 1, rows: 1, frames: 1, fps: 12, loop: true, smooth: true });
export const IMAGE_FITS: readonly ImageFit[] = ['contain', 'cover', 'stretch'];
export const ASSET_REF = /^sha256:[0-9a-f]{64}$/;

/** Khung sprite tại t: chỉ số (0…frames−1) theo thời gian từ đầu khoảng hiển thị. */
export function spriteFrame(p: Pick<ImageProps, 'frames' | 'fps' | 'loop'>, elapsed: number): number {
  const n = Math.max(1, Math.floor(p.frames));
  if (n === 1 || !(p.fps > 0)) return 0;
  const k = Math.floor(Math.max(0, elapsed) * p.fps + 1e-9);
  return p.loop ? k % n : Math.min(n - 1, k);
}

/** Đặt ô nguồn (sw × sh) vào khung W × H theo cách khớp: chứa trọn, phủ kín (cắt phần thừa ở nguồn), hay kéo giãn. */
export function fitRect(fit: ImageFit, sw: number, sh: number, W: number, H: number): { sx: number; sy: number; sw: number; sh: number; x: number; y: number; w: number; h: number } {
  if (fit === 'stretch' || sw <= 0 || sh <= 0) return { sx: 0, sy: 0, sw, sh, x: 0, y: 0, w: W, h: H };
  if (fit === 'contain') { const k = Math.min(W / sw, H / sh), w = sw * k, h = sh * k; return { sx: 0, sy: 0, sw, sh, x: (W - w) / 2, y: (H - h) / 2, w, h }; }
  const k = Math.max(W / sw, H / sh), cw = W / k, ch = H / k;
  return { sx: (sw - cw) / 2, sy: (sh - ch) / 2, sw: cw, sh: ch, x: 0, y: 0, w: W, h: H };
}

export function imagePrims(p: ImageProps, W: number, H: number, size: { width: number; height: number } | undefined, elapsed: number): Primitive[] {
  if (!size || !ASSET_REF.test(p.asset)) return [];
  const cols = Math.max(1, Math.floor(p.cols)), rows = Math.max(1, Math.floor(p.rows));
  const cw = size.width / cols, ch = size.height / rows, f = Math.min(spriteFrame({ ...p, frames: Math.min(p.frames, cols * rows) }, elapsed), cols * rows - 1);
  const ox = (f % cols) * cw, oy = Math.floor(f / cols) * ch, r = fitRect(p.fit, cw, ch, W, H);
  const prim: ImagePrim = { kind: 'image', asset: p.asset, sx: ox + r.sx, sy: oy + r.sy, sw: r.sw, sh: r.sh, x: r.x, y: r.y, w: r.w, h: r.h, alpha: 1, smooth: p.smooth };
  return [prim];
}

export const imageRenderer: WidgetRenderer<ImageProps> = {
  type: 'IMAGE',
  layout({ derived }: LayoutCtx, spec: WidgetSpec<ImageProps>, t: number) {
    const p = { ...DEFAULT_IMAGE, ...spec.properties }, from = activeRange(spec.visibility, t, derived.index.duration)?.from ?? 0;
    return imagePrims(p, spec.layout.width, spec.layout.height, derived.images?.get(p.asset), t - from);
  },
};
