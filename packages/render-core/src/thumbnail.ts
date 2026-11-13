// Ảnh thu nhỏ cho cột "Video styles" (T-69): vẽ một khung nhỏ của dự án đang mở tại một mốc cố định, dùng chung renderFrame.
// Tất định: cùng (scene, dự án, kích thước) → cùng chuỗi lệnh vẽ. Mốc thời gian chỉ phụ thuộc thời lượng; không đọc đồng hồ.
import type { SceneDocument } from './scene.ts';
import type { UnifiedProjectAST } from './types.ts';
import type { Derived } from './prims.ts';
import { renderFrame, type RenderTarget } from './render.ts';

/** Mốc vẽ ảnh thu nhỏ: 40% thời lượng, làm tròn mili giây (giữa bài thường đã có nhiều nốt). */
export const THUMBNAIL_FRACTION = 0.4;
export const thumbnailTime = (duration: number): number => Math.round(Math.max(0, Number.isFinite(duration) ? duration : 0) * THUMBNAIL_FRACTION * 1000) / 1000;

/** Vẽ ảnh thu nhỏ bề rộng `widthPx` điểm ảnh; cao theo tỉ lệ khung của scene. */
export function renderThumbnail(scene: SceneDocument, derived: Derived, ast: UnifiedProjectAST, target: Omit<RenderTarget, 'width' | 'height'>, widthPx: number): { width: number; height: number } {
  const { designWidth: W, designHeight: H } = scene.canvas;
  const width = Math.max(1, Math.round(widthPx)), height = Math.max(1, Math.round(width * H / W));
  renderFrame(scene, derived, ast, thumbnailTime(derived.index.duration), { ...target, width, height }, width / W);
  return { width, height };
}

/** Khoá bộ đệm: đổi phong cách, dự án hoặc kích thước thì vẽ lại. `projectKey` do nơi gọi tính (tên tệp, thời lượng, số nốt…). */
export const thumbnailKey = (styleId: string, projectKey: string, width: number): string => `${styleId}\u0001${projectKey}\u0001${Math.round(width)}`;

/** Bộ đệm có trần (bỏ mục cũ nhất). Không chứa trạng thái vẽ, chỉ chứa kết quả đã có. */
export function createThumbnailCache<T>(max = 48) {
  const m = new Map<string, T>();
  return {
    get: (k: string) => m.get(k),
    set(k: string, v: T) { m.delete(k); m.set(k, v); while (m.size > max) m.delete(m.keys().next().value as string); },
    get size() { return m.size; },
  };
}
