// Phím tắt thanh phát kiểu DAW cho thẻ Preview: Space phát/dừng, Home về đầu.
// Đăng ký ở pha capture trên window để chạy TRƯỚC handler của React: nếu Space thuộc về thanh phát (xem
// spaceBelongsToTransport), ta chặn cả keydown lẫn keyup, nên nút vừa bấm bằng chuột không bị "bấm lại" (Chrome kích hoạt
// nút ở keydown/keyup tuỳ phiên bản; Firefox ở keyup) và các handler Space của React không chạy.
import { isTypingTarget, spaceBelongsToTransport } from './a11y.ts';
import type { Playback } from './playback.ts';

export function bindTransportKeys(win: Pick<Window, 'addEventListener' | 'removeEventListener'>, playback: Playback, focusedByKeyboard?: (el: Element) => boolean): () => void {
  let spaceHandled = false;
  const down = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if (e.code === 'Space' && spaceBelongsToTransport(e.target, focusedByKeyboard)) {
      e.preventDefault(); e.stopPropagation();
      spaceHandled = true;
      if (!e.repeat) playback.toggle(); // giữ phím không được bật/tắt liên tục
    } else if (e.key === 'Home' && !e.defaultPrevented && !isTypingTarget(e.target)) {
      e.preventDefault(); playback.seek(0);
    }
  };
  const up = (e: KeyboardEvent) => {
    if (e.code === 'Space' && spaceHandled) { spaceHandled = false; e.preventDefault(); e.stopPropagation(); }
  };
  win.addEventListener('keydown', down as EventListener, true);
  win.addEventListener('keyup', up as EventListener, true);
  return () => { win.removeEventListener('keydown', down as EventListener, true); win.removeEventListener('keyup', up as EventListener, true); };
}
