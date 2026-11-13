// Hình học thuần cho Editor (T-68, SRS REQ-GRAPHICS-02/03, REQ-UI 5.3 Edit Mode). Toạ độ là pt của khung thiết kế.
// Đổi cỡ và đổi điểm neo của widget ĐÃ XOAY phải giữ nguyên chỗ trên khung của phần không bị kéo: công thức chung
//   X' = X + a − a' + R(o + a' − a)
// với X = (x, y), a = neo × cỡ cũ, a' = neo × cỡ mới, o = góc trên trái mới tính trong toạ độ widget cũ, R = ma trận xoay.
import { normalizeAngle, pointInWidget, rotatedBounds, toWidgetLocal, type WidgetLayout } from '@dawviz/render-core';

export type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
export const HANDLES: readonly Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
/** Cỡ nhỏ nhất khi kéo tay nắm (pt). Ô nhập số vẫn cho xuống 1 pt như lược đồ preset. */
export const MIN_SIZE = 8;

type L = WidgetLayout;
const rad = (deg: number) => (normalizeAngle(deg) * Math.PI) / 180;
const rot = (deg: number, x: number, y: number): [number, number] => {
  const r = rad(deg), c = Math.cos(r), s = Math.sin(r);
  return [x * c - y * s, x * s + y * c];
};

/** Điểm trong widget (toạ độ widget) → điểm trên khung. */
export function toCanvas(l: L, qx: number, qy: number): [number, number] {
  const ax = l.anchor.x * l.width, ay = l.anchor.y * l.height;
  const [dx, dy] = rot(l.rotation, qx - ax, qy - ay);
  return [l.x + ax + dx, l.y + ay + dy];
}

/** Đặt khung mới (cỡ `w × h`, góc trên trái `o` theo toạ độ widget cũ) sao cho mọi điểm còn lại đứng yên trên khung. */
function reframe(l: L, ox: number, oy: number, w: number, h: number, anchor = l.anchor): L {
  const ax = l.anchor.x * l.width, ay = l.anchor.y * l.height;
  const bx = anchor.x * w, by = anchor.y * h;
  const [rx, ry] = rot(l.rotation, ox + bx - ax, oy + by - ay);
  return { ...l, x: l.x + ax - bx + rx, y: l.y + ay - by + ry, width: w, height: h, anchor: { ...anchor } };
}

/**
 * Đổi cỡ bằng tay nắm. `p`: con trỏ trên khung. Cạnh/góc đối diện đứng yên (theo hướng của chính widget, kể cả khi đã xoay).
 * `shift`: giữ tỉ lệ (tay nắm góc); `alt`: co giãn đối xứng quanh tâm.
 */
export function resizeLayout(start: L, handle: Handle, p: { x: number; y: number }, o: { shift?: boolean; alt?: boolean } = {}): L {
  const q = toWidgetLocal(start, p.x, p.y);
  const W = start.width, H = start.height;
  let l = 0, t = 0, r = W, b = H;
  if (handle.includes('w')) l = q.x; if (handle.includes('e')) r = q.x;
  if (handle.includes('n')) t = q.y; if (handle.includes('s')) b = q.y;
  if (o.alt) { // đối xứng quanh tâm
    if (handle.includes('w')) r = W - l; if (handle.includes('e')) l = W - r;
    if (handle.includes('n')) b = H - t; if (handle.includes('s')) t = H - b;
  }
  let w = Math.max(MIN_SIZE, r - l), h = Math.max(MIN_SIZE, b - t);
  if (o.shift && handle.length === 2) { // giữ tỉ lệ theo trục bị kéo nhiều hơn
    const k = Math.max(w / W, h / H);
    w = Math.max(MIN_SIZE, W * k); h = Math.max(MIN_SIZE, H * k);
  }
  // góc trên trái mới theo cạnh cố định
  let ox: number, oy: number;
  if (o.alt) { ox = (W - w) / 2; oy = (H - h) / 2; }
  else {
    ox = handle.includes('w') ? W - w : 0;
    oy = handle.includes('n') ? H - h : 0;
    if (handle === 'n' || handle === 's') ox = 0;
    if (handle === 'e' || handle === 'w') oy = 0;
  }
  return round(reframe(start, ox, oy, w, h));
}

/** Đổi điểm neo mà widget không nhảy chỗ trên khung. */
export function setAnchor(l: L, anchor: { x: number; y: number }): L {
  const a = { x: Math.min(1, Math.max(0, anchor.x)), y: Math.min(1, Math.max(0, anchor.y)) };
  return round(reframe(l, 0, 0, l.width, l.height, a));
}

/** Góc (độ) của con trỏ quanh tâm xoay; 0° = hướng lên (tay nắm xoay nằm phía trên khung). */
export function pointerAngle(pivot: [number, number], p: { x: number; y: number }): number {
  return (Math.atan2(p.y - pivot[1], p.x - pivot[0]) * 180) / Math.PI + 90;
}

/** Widget trên cùng (zIndex lớn nhất, cùng zIndex thì đứng sau trong tài liệu) chứa điểm `p`; bỏ widget ẩn hoặc khoá. */
export function hitTest<W extends { id: string; zIndex: number; visible: boolean; layout: L }>(widgets: readonly W[], p: { x: number; y: number }, locked: ReadonlySet<string> = new Set()): W | null {
  let best: W | null = null, bi = -1;
  widgets.forEach((w, i) => {
    if (!w.visible || locked.has(w.id) || !pointInWidget(w.layout, p.x, p.y)) return;
    if (!best || w.zIndex > best.zIndex || (w.zIndex === best.zIndex && i > bi)) { best = w; bi = i; }
  });
  return best;
}

/**
 * Kéo trên khung cho pt nguyên và độ nguyên (như công cụ thiết kế): ô số hiện đúng giá trị đã lưu, nên vào rồi rời ô
 * không làm đổi tài liệu. Widget đã xoay vì thế có thể lệch tối đa 0,5 pt so với điểm cố định lý tưởng.
 */
const r4 = (v: number) => Math.round(v * 1e4) / 1e4;
export const round = (l: L): L => ({ ...l, x: Math.round(l.x), y: Math.round(l.y), width: Math.round(l.width), height: Math.round(l.height), rotation: normalizeAngle(Math.round(l.rotation)), anchor: { x: r4(l.anchor.x), y: r4(l.anchor.y) } });

/** Widget nằm hẳn ngoài khung (khung bao đã xoay không giao với khung): video sẽ không thấy nó. */
export function outsideFrame(l: WidgetLayout, W: number, H: number): boolean {
  const b = rotatedBounds(l);
  return b.x >= W || b.y >= H || b.x + b.width <= 0 || b.y + b.height <= 0;
}
/** Dời widget ít nhất có thể để khung bao của nó nằm trong khung (lớn hơn khung thì canh mép trái/trên). */
export function intoFrame(l: WidgetLayout, W: number, H: number): { x: number; y: number } {
  const b = rotatedBounds(l);
  const fit = (lo: number, size: number, max: number) => (size >= max ? -lo : lo < 0 ? -lo : lo + size > max ? max - size - lo : 0);
  return { x: Math.round(l.x + fit(b.x, b.width, W)), y: Math.round(l.y + fit(b.y, b.height, H)) };
}
