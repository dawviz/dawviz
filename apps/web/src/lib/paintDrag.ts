// Kéo để bật/tắt nhanh (như cột mắt/khoá của After Effects), dùng chung cho danh sách Track và danh sách Lớp của Editor.
// Bấm xuống một nút có `data-paint="<loại>"` + `data-paint-id="<id>"` thì đặt giá trị mới (ngược hiện tại) cho nó; kéo qua các nút
// cùng loại khác thì đặt cùng giá trị. Lấy mẫu dọc đường kéo nên kéo nhanh không bỏ sót dòng. Phím (Enter/Space) vẫn đi qua onClick
// (detail 0); chuột/cảm ứng đi qua đây nên onClick của nút phải bỏ qua khi detail > 0 (xem `clickIsKeyboard`).
export interface PaintOptions {
  current(kind: string, id: string): boolean;
  apply(kind: string, id: string, on: boolean): void;
  /** Gộp cả lần kéo thành một bước hoàn tác (nếu có). */
  gesture?: { begin(): void; end(): void };
}
/** Nút chỉ nên xử lý onClick khi đến từ bàn phím; chuột/cảm ứng đã xử lý ở pointerdown. */
export const clickIsKeyboard = (e: { detail: number }) => e.detail === 0;

export function startPaintDrag(e: { button: number; isPrimary: boolean; target: EventTarget; clientX: number; clientY: number }, o: PaintOptions): void {
  if ((e.button ?? 0) !== 0 || e.isPrimary === false) return; // (jsdom không có PointerEvent: trường thiếu coi như chuột trái, chính)
  const first = (e.target as HTMLElement).closest<HTMLElement>('[data-paint]');
  if (!first) return;
  const kind = first.dataset.paint!, on = !o.current(kind, first.dataset.paintId!);
  const seen = new Set<string>();
  const apply = (el: Element | null) => {
    const b = el?.closest<HTMLElement>(`[data-paint="${kind}"]`), id = b?.dataset.paintId;
    if (!id || seen.has(id)) return;
    seen.add(id); o.apply(kind, id, on);
  };
  o.gesture?.begin();
  apply(first);
  let last = { x: e.clientX, y: e.clientY };
  const prevSelect = document.body.style.userSelect; document.body.style.userSelect = 'none';
  const move = (m: PointerEvent) => {
    const dx = m.clientX - last.x, dy = m.clientY - last.y, n = Math.min(200, Math.ceil(Math.hypot(dx, dy) / 6));
    for (let i = 1; i <= n; i++) apply(document.elementFromPoint(last.x + (dx * i) / n, last.y + (dy * i) / n));
    last = { x: m.clientX, y: m.clientY };
  };
  const done = () => {
    window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', done); window.removeEventListener('pointercancel', done);
    document.body.style.userSelect = prevSelect; o.gesture?.end();
  };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', done); window.addEventListener('pointercancel', done);
}
