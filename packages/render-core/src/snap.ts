// Bắt dính khi kéo widget (SRS REQ-GRAPHICS-02, REQ-GRAPHICS-03). Hàm thuần: không DOM, không đồng hồ, tất định.
// Widget đã xoay dùng KHUNG BAO THẲNG TRỤC của hình đã xoay (và tâm của khung đó) cho cả lưới lẫn Smart Guides.
// Kết quả là dữ liệu hình học; màu đường gióng (token `guide`, D-55) và việc vẽ nằm ở lớp phủ Edit Mode (T-68).
import type { WidgetLayout } from './scene.ts';

export interface Rect { x: number; y: number; width: number; height: number }
/** Khung của một widget: `anchor` vắng thì lấy tâm. `rotation` độ, chiều kim đồng hồ (cùng chiều `ctx.rotate`, trục y hướng xuống). */
export type SnapLayout = Omit<WidgetLayout, 'anchor'> & { anchor?: { x: number; y: number } };

/** Đưa góc về (−180, 180]. */
export function normalizeAngle(deg: number): number {
  if (!Number.isFinite(deg)) return 0;
  let r = ((deg % 360) + 360) % 360;
  if (r > 180) r -= 360;
  return r;
}

/** cos/sin chính xác với bội số của 90° (tránh sai số kiểu 6e-17 làm lệch bắt dính). */
function cosSin(deg: number): [number, number] {
  const d = normalizeAngle(deg);
  if (d === 0) return [1, 0];
  if (d === 90) return [0, 1];
  if (d === 180) return [-1, 0];
  if (d === -90) return [0, -1];
  const r = (d * Math.PI) / 180;
  return [Math.cos(r), Math.sin(r)];
}

/** Khung bao thẳng trục của widget sau khi xoay quanh điểm neo. Góc 0 trả đúng `x, y, width, height`. */
export function rotatedBounds(l: SnapLayout): Rect {
  if (normalizeAngle(l.rotation) === 0) return { x: l.x, y: l.y, width: l.width, height: l.height };
  const ax = l.x + (l.anchor?.x ?? 0.5) * l.width, ay = l.y + (l.anchor?.y ?? 0.5) * l.height;
  const [c, s] = cosSin(l.rotation);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [px, py] of [[l.x, l.y], [l.x + l.width, l.y], [l.x + l.width, l.y + l.height], [l.x, l.y + l.height]] as const) {
    const dx = px - ax, dy = py - ay;
    const x = ax + dx * c - dy * s, y = ay + dx * s + dy * c;
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export interface Guide {
  /** `x`: đường dọc tại `pos` (hoành độ), kéo dài theo y từ `from` tới `to`. `y`: đường ngang tại `pos`, kéo dài theo x. */
  axis: 'x' | 'y';
  pos: number; from: number; to: number;
  /** `center`: tâm khung bao của widget đang kéo; `edge`: một cạnh (trái/phải hoặc trên/dưới). */
  kind: 'edge' | 'center';
  /** Đối tượng gióng theo: mép/tâm canvas, hoặc chỉ số trong `others`. */
  with: 'canvas' | number;
}

export interface SnapInput {
  /** Khung widget đang kéo (cỡ, góc, neo); `x, y` bị bỏ qua, vị trí lấy từ `to`. */
  moving: SnapLayout;
  /** Vị trí `layout.x, layout.y` mà con trỏ đề xuất (chưa bắt dính). */
  to: { x: number; y: number };
  others: readonly SnapLayout[];
  canvas: { width: number; height: number };
  grid: { enabled: boolean; size: number };
  /** Smart Guides bật/tắt (canvas.snapping.smartGuidesEnabled). */
  guides: boolean;
  /** Ngưỡng hút của Smart Guides, pt logic (mặc định 5). */
  threshold?: number;
  /** Giữ Alt: tắt tạm mọi bắt dính. */
  alt?: boolean;
  /** Giữ Shift: khoá theo trục (cần `from`): trục lệch nhiều hơn được giữ, trục kia giữ nguyên vị trí `from`. */
  shift?: boolean;
  /** Vị trí `layout.x, layout.y` lúc bắt đầu kéo (cho Shift). */
  from?: { x: number; y: number };
}

export interface SnapResult {
  /** `layout.x, layout.y` đã bắt dính (không phải toạ độ khung bao). */
  x: number; y: number;
  /** Khung bao thẳng trục của widget ở vị trí đã bắt dính. */
  bounds: Rect;
  guides: Guide[];
}

const EPS = 1e-6;

/** Ba đường của một khung bao theo một trục: [thấp, giữa, cao]. */
const lines = (r: Rect, axis: 'x' | 'y'): [number, number, number] => axis === 'x' ? [r.x, r.x + r.width / 2, r.x + r.width] : [r.y, r.y + r.height / 2, r.y + r.height];

/**
 * Thứ tự (mỗi trục độc lập): Smart Guides trước (cạnh/tâm của khung bao so với mép/tâm canvas và khung bao các widget khác,
 * trong ngưỡng, lấy khoảng cách nhỏ nhất); trục nào không dính guide thì làm tròn cạnh trái/trên của khung bao về bội số ô lưới.
 */
export function snap(i: SnapInput): SnapResult {
  const threshold = i.threshold ?? 5;
  let x = i.to.x, y = i.to.y;
  if (i.shift && i.from && !i.alt) {
    if (Math.abs(x - i.from.x) >= Math.abs(y - i.from.y)) y = i.from.y; else x = i.from.x;
  }
  const at = (px: number, py: number): Rect => rotatedBounds({ ...i.moving, x: px, y: py });
  let b = at(x, y);
  if (i.alt) return { x, y, bounds: b, guides: [] };

  const lockedX = !!(i.shift && i.from && x === i.from.x && y !== i.from.y);
  const lockedY = !!(i.shift && i.from && y === i.from.y && x !== i.from.x);
  const guides: Guide[] = [];
  const otherBounds = i.others.map((o) => rotatedBounds(o));
  const canvasRect: Rect = { x: 0, y: 0, width: i.canvas.width, height: i.canvas.height };
  const targets: { r: Rect; with: Guide['with'] }[] = [{ r: canvasRect, with: 'canvas' }, ...otherBounds.map((r, k) => ({ r, with: k as number }))];

  let dx = 0, dy = 0;
  const axes: ('x' | 'y')[] = ['x', 'y'];
  for (const axis of axes) {
    if ((axis === 'x' && lockedX) || (axis === 'y' && lockedY)) continue;
    let best: number | null = null;
    if (i.guides) {
      const mine = lines(b, axis);
      for (const t of targets) for (const tl of lines(t.r, axis)) for (const ml of mine) {
        const d = tl - ml;
        if (Math.abs(d) <= threshold && (best === null || Math.abs(d) < Math.abs(best) - EPS)) best = d;
      }
    }
    if (best === null && i.grid.enabled && i.grid.size > 0) {
      const edge = axis === 'x' ? b.x : b.y;
      best = Math.round(edge / i.grid.size) * i.grid.size - edge;
    }
    if (best !== null) { if (axis === 'x') dx = best; else dy = best; }
  }
  x += dx; y += dy;
  b = at(x, y);

  if (i.guides) {
    for (const axis of axes) {
      if ((axis === 'x' && lockedX) || (axis === 'y' && lockedY)) continue;
      const mine = lines(b, axis);
      const other = axis === 'x' ? 'y' : 'x';
      const span = (r: Rect): [number, number] => { const l = lines(r, other); return [l[0], l[2]]; };
      const mySpan = span(b);
      targets.forEach((t) => {
        const tl = lines(t.r, axis);
        mine.forEach((ml, mi) => tl.forEach((tv) => {
          if (Math.abs(tv - ml) > EPS) return;
          const ts = span(t.r);
          guides.push({ axis, pos: tv, from: Math.min(mySpan[0], ts[0]), to: Math.max(mySpan[1], ts[1]), kind: mi === 1 ? 'center' : 'edge', with: t.with });
        }));
      });
    }
  }
  return { x, y, bounds: b, guides };
}
