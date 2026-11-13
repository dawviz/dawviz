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

/** Góc khi kéo tay nắm xoay: bắt dính bội số `step` (mặc định 15°); giữ Shift thì tự do. Kết quả chuẩn hoá về (−180, 180]. */
export function snapAngle(deg: number, opts: { shift?: boolean; step?: number } = {}): number {
  const step = opts.step ?? 15;
  return normalizeAngle(opts.shift || !(step > 0) ? deg : Math.round(deg / step) * step);
}

/** Xoay cả nhóm widget thêm `delta` độ quanh tâm khung bao chung (REQ-GRAPHICS-03): điểm neo của từng widget quay quanh tâm nhóm, góc riêng cộng thêm `delta`. */
export function rotateGroup<L extends SnapLayout>(group: readonly L[], delta: number): L[] {
  if (!group.length) return [];
  const bs = group.map(rotatedBounds);
  const x0 = Math.min(...bs.map((b) => b.x)), y0 = Math.min(...bs.map((b) => b.y));
  const cx = (x0 + Math.max(...bs.map((b) => b.x + b.width))) / 2, cy = (y0 + Math.max(...bs.map((b) => b.y + b.height))) / 2;
  const [c, s] = cosSin(delta);
  return group.map((l) => {
    const ax = (l.anchor?.x ?? 0.5) * l.width, ay = (l.anchor?.y ?? 0.5) * l.height;
    const px = l.x + ax - cx, py = l.y + ay - cy;
    return { ...l, x: cx + px * c - py * s - ax, y: cy + px * s + py * c - ay, rotation: normalizeAngle(l.rotation + delta) };
  });
}

/** Đổi điểm trên canvas về toạ độ trong widget (gốc ở góc trên trái khung chưa xoay). Dùng cho nhấp chọn widget đã xoay. */
export function toWidgetLocal(l: SnapLayout, px: number, py: number): { x: number; y: number } {
  const ax = (l.anchor?.x ?? 0.5) * l.width, ay = (l.anchor?.y ?? 0.5) * l.height;
  const [c, s] = cosSin(l.rotation), dx = px - l.x - ax, dy = py - l.y - ay;
  return { x: ax + dx * c + dy * s, y: ay - dx * s + dy * c };
}
/** Điểm (toạ độ canvas) có nằm trong hình đã xoay của widget không (tính cả cạnh). */
export function pointInWidget(l: SnapLayout, px: number, py: number): boolean {
  const q = toWidgetLocal(l, px, py);
  return q.x >= -EPS && q.y >= -EPS && q.x <= l.width + EPS && q.y <= l.height + EPS;
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

/** Khoảng cách đều (Equal Spacing): ba khung bao thẳng hàng theo `axis`, hai khoảng hở `gaps` (từng cặp [đầu, cuối] trên trục) bằng nhau. */
export interface Spacing { axis: 'x' | 'y'; gap: number; gaps: [[number, number], [number, number]]; /** Vị trí trên trục kia để vẽ dấu đo. */ at: number; with: [number, number] }

export interface SnapResult {
  /** `layout.x, layout.y` đã bắt dính (không phải toạ độ khung bao). */
  x: number; y: number;
  /** Khung bao thẳng trục của widget ở vị trí đã bắt dính. */
  bounds: Rect;
  guides: Guide[];
  spacings: Spacing[];
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
  if (i.alt) return { x, y, bounds: b, guides: [], spacings: [] };

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
      for (const e of equalSpacing(b, otherBounds, axis)) {
        const d = e.low - (axis === 'x' ? b.x : b.y);
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
  const spacings: Spacing[] = [];
  if (i.guides) for (const axis of axes) {
    if ((axis === 'x' && lockedX) || (axis === 'y' && lockedY)) continue;
    for (const e of equalSpacing(b, otherBounds, axis)) if (Math.abs(e.low - (axis === 'x' ? b.x : b.y)) <= EPS) spacings.push(e.spacing);
  }
  return { x, y, bounds: b, guides, spacings };
}

/** Khoảng chồng nhau trên trục kia (để coi là "thẳng hàng"). */
const overlap = (a: Rect, b: Rect, axis: 'x' | 'y') => {
  const [a0, , a1] = lines(a, axis === 'x' ? 'y' : 'x'), [b0, , b1] = lines(b, axis === 'x' ? 'y' : 'x');
  return Math.min(a1, b1) - Math.max(a0, b0);
};
/**
 * Vị trí cạnh thấp của `m` trên `axis` để ba khung (m và hai widget khác A < B, cùng hàng với m) cách đều:
 * m giữa A và B, m sau B (khoảng m–B = khoảng A–B), hoặc m trước A. Chỉ xét cặp không chồng nhau trên trục.
 */
function equalSpacing(m: Rect, others: Rect[], axis: 'x' | 'y'): { low: number; spacing: Spacing }[] {
  const out: { low: number; spacing: Spacing }[] = [];
  const size = axis === 'x' ? m.width : m.height;
  const row = others.map((r, k) => ({ r, k })).filter(({ r }) => overlap(m, r, axis) > EPS);
  for (const A of row) for (const B of row) {
    const [a0, , a1] = lines(A.r, axis), [b0, , b1] = lines(B.r, axis);
    if (A.k === B.k || a1 > b0 + EPS) continue; // A phải nằm trước B, không chồng
    const at = (rs: Rect[]) => { const o = axis === 'x' ? 'y' : 'x'; const lo = Math.max(...rs.map((r) => lines(r, o)[0])), hi = Math.min(...rs.map((r) => lines(r, o)[2])); return (lo + hi) / 2; };
    const mk = (low: number, g1: [number, number], g2: [number, number], first: number, second: number) => {
      const moved = axis === 'x' ? { ...m, x: low } : { ...m, y: low };
      out.push({ low, spacing: { axis, gap: g1[1] - g1[0], gaps: [g1, g2], at: at([moved, A.r, B.r]), with: [first, second] } });
    };
    const mid = (a1 + b0 - size) / 2;                     // A | m | B
    if (mid >= a1 - EPS) mk(mid, [a1, mid], [mid + size, b0], A.k, B.k);
    const gap = b0 - a1;
    mk(b1 + gap, [a1, b0], [b1, b1 + gap], A.k, B.k);     // A | B | m
    mk(a0 - gap - size, [a0 - gap, a0], [a1, b0], A.k, B.k); // m | A | B
  }
  return out;
}
