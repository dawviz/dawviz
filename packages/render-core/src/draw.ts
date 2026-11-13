// Lớp vẽ duy nhất lên Canvas 2D / OffscreenCanvas. Preview và Export đều gọi hàm này (WYSIWYG, D-06).
import type { NoteRect, KeyRect } from './pianoroll.ts';

export interface Ctx2D {
  fillStyle: unknown; strokeStyle: unknown; globalAlpha: number; lineWidth: number; shadowColor: string; shadowBlur: number;
  clearRect(x: number, y: number, w: number, h: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void; moveTo(x: number, y: number): void; arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void;
  closePath(): void; fill(): void; stroke(): void;
  // Chữ (T-69): đặt phông/lề/baseline rồi fillText; maxWidth làm chữ không tràn khung.
  font: string; textAlign: string; textBaseline: string; fontKerning: string; textRendering: string;
  fillText(text: string, x: number, y: number, maxWidth?: number): void;
}
function roundedPath(ctx: Ctx2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
const a01 = (v: number) => Math.min(1, Math.max(0, v));

export function drawPianoRoll(ctx: Ctx2D, rects: NoteRect[], size: { width: number; height: number; background: string; playheadX: number }): void {
  ctx.shadowBlur = 0; ctx.globalAlpha = 1; ctx.fillStyle = size.background; ctx.fillRect(0, 0, size.width, size.height);
  for (const r of rects) {
    const alpha = a01(r.brightness * r.opacity);
    if (alpha <= 0.004) continue;
    ctx.globalAlpha = Math.max(0.05, alpha); ctx.fillStyle = r.color;
    if (r.glow > 0 && r.glowRadius > 0) { ctx.shadowColor = r.color; ctx.shadowBlur = r.glowRadius * r.glow * (0.4 + 0.6 * r.brightness); }
    if (r.radius > 0.5) { roundedPath(ctx, r.x, r.y, r.w, r.h, r.radius); ctx.fill(); } else ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.shadowBlur = 0;
    if (r.borderWidth > 0) {
      ctx.strokeStyle = r.borderColor; ctx.lineWidth = r.borderWidth;
      roundedPath(ctx, r.x, r.y, r.w, r.h, Math.max(0, r.radius)); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.fillRect(size.playheadX, 0, 1, size.height);
}

/** Vẽ bàn phím lên vùng bên trái (gọi SAU drawPianoRoll nên che phần nốt đã trôi qua). */
export function drawKeyboard(ctx: Ctx2D, keys: KeyRect[], o: { width: number; height: number; whiteColor: string; separator?: string }): void {
  ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  for (const k of keys) if (!k.black) { ctx.fillStyle = k.color; ctx.fillRect(k.x, k.y, k.w, k.h); }
  for (const k of keys) if (k.black) { // hàng phím đen: nền trắng cả hàng rồi phím đen ngắn hơn đè lên
    ctx.fillStyle = o.whiteColor; ctx.fillRect(0, k.y, o.width, k.h);
    ctx.fillStyle = k.color; ctx.fillRect(k.x, k.y, k.w, k.h);
  }
  ctx.fillStyle = o.separator ?? '#0c0e16'; ctx.fillRect(o.width - 1, 0, 1, o.height);
}
