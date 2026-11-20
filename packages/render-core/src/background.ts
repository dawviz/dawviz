// Ảnh nền của khung (T-21, REQ-GRAPHICS-xx): hàm thuần tính cách đặt ảnh vào khung và phần tô tối. Ảnh thật là TÀI NGUYÊN CỦA PHIÊN
// (không nằm trong preset, AD-12): preset chỉ nhớ cách đặt (vừa khung, độ đục, làm tối); ảnh do người dùng nạp, truyền vào qua `Derived.background`.
export type BackgroundFit = 'COVER' | 'CONTAIN' | 'STRETCH';
export interface BackgroundImageSpec { fit: BackgroundFit; opacity: number; /** Tô đen phủ lên ảnh (0 = không, 1 = đen hẳn) để chữ và nốt dễ đọc. */ dim: number }
export const DEFAULT_BACKGROUND: Readonly<BackgroundImageSpec> = Object.freeze({ fit: 'COVER', opacity: 1, dim: 0 });
/** Ảnh đã giải mã: `image` là ImageBitmap/CanvasImageSource (Render Core không biết kiểu, chỉ chuyển cho `drawImage`). */
export interface BackgroundImage { image: unknown; width: number; height: number }

export interface ImagePlacement { sx: number; sy: number; sw: number; sh: number; dx: number; dy: number; dw: number; dh: number }
/**
 * Cách vẽ ảnh `iw × ih` vào khung `W × H`: COVER phủ kín khung và cắt phần thừa ở giữa; CONTAIN nằm gọn trong khung, giữa khung, chừa nền màu;
 * STRETCH kéo giãn đúng khung (méo tỉ lệ). Vùng đích luôn nằm trong khung nên không cần cắt.
 */
export function placeImage(fit: BackgroundFit, iw: number, ih: number, W: number, H: number): ImagePlacement {
  if (!(iw > 0 && ih > 0)) return { sx: 0, sy: 0, sw: 0, sh: 0, dx: 0, dy: 0, dw: 0, dh: 0 };
  if (fit === 'STRETCH') return { sx: 0, sy: 0, sw: iw, sh: ih, dx: 0, dy: 0, dw: W, dh: H };
  if (fit === 'CONTAIN') {
    const k = Math.min(W / iw, H / ih), dw = iw * k, dh = ih * k;
    return { sx: 0, sy: 0, sw: iw, sh: ih, dx: (W - dw) / 2, dy: (H - dh) / 2, dw, dh };
  }
  const k = Math.max(W / iw, H / ih), sw = W / k, sh = H / k;
  return { sx: (iw - sw) / 2, sy: (ih - sh) / 2, sw, sh, dx: 0, dy: 0, dw: W, dh: H };
}
