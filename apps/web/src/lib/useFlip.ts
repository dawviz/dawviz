// Hook FLIP (lib/flip.ts): các hàng trượt từ chỗ cũ tới chỗ mới khi đổi thứ tự, thay vì nhảy. Dùng ở Timeline lớp (hàng lớp, làn của lớp,
// hàng track của làn Nhạc). Danh sách Track của Xem trước đã trượt bằng framer-motion (`layout`), không cần hook này.
// Dùng Web Animations API (el.animate): không đụng style của phần tử, tự dọn khi xong. Tắt khi người dùng bật giảm chuyển động.
import { useLayoutEffect, useRef, type RefObject } from 'react';
import { FLIP_EASING, FLIP_MS, flipDeltas, flipFrames } from './flip.ts';

/** Người dùng chọn giảm chuyển động (prefers-reduced-motion: reduce). */
export const prefersReducedMotion = (): boolean => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Vị trí dọc (px, so với `root`) của mọi phần tử có thuộc tính `attr` trong `root`, theo giá trị thuộc tính đó. */
function measure(root: HTMLElement, attr: string): Map<string, number> {
  const top = root.getBoundingClientRect().top, out = new Map<string, number>();
  for (const el of root.querySelectorAll<HTMLElement>(`[${attr}]`)) out.set(el.getAttribute(attr)!, el.getBoundingClientRect().top - top);
  return out;
}

/**
 * Các phần tử `[attr="<id>"]` trong `root` trượt khi `order` (chuỗi đại diện thứ tự, vd. id nối nhau) đổi.
 * Vị trí cũ đo lúc render với thứ tự mới (DOM còn là bản cũ), vị trí mới đo sau khi React vẽ xong; thứ tự không đổi thì không làm gì
 * (cuộn, đổi độ cao hàng, mở/đóng nhóm không gây trượt). Hàng đang trượt dở mà đổi thứ tự lần nữa thì đi tiếp từ chỗ đang thấy.
 */
export function useFlip(root: RefObject<HTMLElement | null>, order: string, attr: string): void {
  const last = useRef(order);
  const before = useRef<Map<string, number> | null>(null);
  const running = useRef(new Map<string, Animation>());
  if (order !== last.current && before.current === null && root.current) before.current = measure(root.current, attr);
  useLayoutEffect(() => {
    if (order === last.current) return;
    last.current = order;
    const from = before.current; before.current = null;
    const el = root.current;
    if (!from || !el || prefersReducedMotion()) return;
    for (const a of running.current.values()) a.cancel(); // đo chỗ mới không lẫn độ dịch của lần trượt trước
    running.current.clear();
    for (const [id, dy] of flipDeltas(from, measure(el, attr))) {
      const node = el.querySelector<HTMLElement>(`[${attr}="${CSS.escape(id)}"]`);
      if (typeof node?.animate !== 'function') continue; // jsdom, trình duyệt rất cũ: nhảy thẳng
      const a = node.animate(flipFrames(dy), { duration: FLIP_MS, easing: FLIP_EASING });
      running.current.set(id, a);
      a.onfinish = () => { if (running.current.get(id) === a) running.current.delete(id); };
    }
  }, [order, root, attr]);
}
