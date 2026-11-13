// Ảnh thu nhỏ cho cột "Video styles": Render Core vẽ một khung nhỏ của dự án đang mở tại mốc cố định (thumbnailTime), có bộ đệm.
// Cùng renderFrame với khung xem trước, nên thấy gì ở ảnh thu nhỏ thì khung video ra thế đó. Không vẽ được (không có canvas) thì trả undefined.
import { buildSceneHud, buildIndex, createThumbnailCache, DEFAULT_BRIGHTNESS, renderThumbnail, thumbnailKey, type Derived, type RenderCtx, type SceneDocument, type UnifiedProjectAST } from '@dawviz/render-core';

const cache = createThumbnailCache<string>();
/** Khoá dự án cho bộ đệm: đổi tệp hoặc nội dung thì ảnh vẽ lại. */
export const projectKey = (name: string, ast: UnifiedProjectAST) => `${name}|${ast.meta.totalDurationSeconds}|${ast.tracks.length}|${ast.tracks.reduce((n, t) => n + t.notes.length, 0)}`;

/** Phóng 2 lần quanh vạch phát: ảnh nhỏ thấy nốt và chữ rõ thay vì cả khung thu nhỏ. */
export const THUMB_ZOOM = 2;
type Pt = { x: number; y: number };
/** Tâm cắt (đơn vị thiết kế) = vạch phát của Piano Roll đầu tiên; không có Piano Roll thì giữa khung. */
export function playheadCenter(scene: SceneDocument): Pt {
  const w = scene.widgets.find((x) => x.type === 'PIANO_ROLL' && x.visible);
  if (!w) return { x: scene.canvas.designWidth / 2, y: scene.canvas.designHeight / 2 };
  const pr = w.properties as { playheadPositionRatio?: number; keyboard?: { enabled?: boolean; width?: number } };
  const kb = pr.keyboard?.enabled ? pr.keyboard.width ?? 0 : 0, ratio = pr.playheadPositionRatio ?? 0.3;
  return { x: w.layout.x + kb + (w.layout.width - kb) * ratio, y: w.layout.y + w.layout.height / 2 };
}

export function styleThumbnail(styleId: string, scene: SceneDocument, ast: UnifiedProjectAST, pkey: string, width: number): string | undefined {
  const key = thumbnailKey(styleId, pkey, width);
  const hit = cache.get(key); if (hit) return hit;
  if (typeof document === 'undefined') return undefined;
  const H = scene.canvas.designHeight, W = scene.canvas.designWidth;
  const out = document.createElement('canvas'); out.width = Math.round(width); out.height = Math.max(1, Math.round(width * H / W));
  const octx = out.getContext('2d'); if (!octx) return undefined;
  // Vẽ cả khung ở độ phân giải gấp THUMB_ZOOM rồi cắt cửa sổ cỡ (W/zoom × H/zoom) quanh vạch phát.
  const full = document.createElement('canvas'), fw = Math.round(width * THUMB_ZOOM);
  full.width = fw; full.height = Math.max(1, Math.round(fw * H / W));
  const ctx = full.getContext('2d'); if (!ctx) return undefined;
  const index = buildIndex(ast.tracks, ast.meta.totalDurationSeconds);
  const derived: Derived = { index, brightness: Object.fromEntries(ast.tracks.map((t) => [t.id, { ...DEFAULT_BRIGHTNESS }])), hud: buildSceneHud(scene, ast, index), fontsReady: true };
  renderThumbnail(scene, derived, ast, { ctx: ctx as unknown as RenderCtx }, fw);
  const k = full.width / W, c = playheadCenter(scene), cw = out.width, ch = out.height;
  const sx = Math.min(Math.max(c.x * k - cw / 2, 0), full.width - cw), sy = Math.min(Math.max(c.y * k - ch / 2, 0), full.height - ch);
  octx.drawImage(full, sx, sy, cw, ch, 0, 0, cw, ch);
  const url = out.toDataURL('image/png'); cache.set(key, url);
  return url;
}
