// Mẫu radiogroup của WAI-ARIA: cả nhóm là một điểm Tab (chỉ ô đang chọn có tabIndex 0), phím mũi tên / Home / End
// chuyển và chọn luôn. Gắn `onKeyDown={radioKeys}` vào phần tử role="radiogroup"; các ô là [role="radio"] bên trong.
import type { KeyboardEvent } from 'react';

export function radioKeys(e: KeyboardEvent<HTMLElement>): void {
  const radios = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')];
  const i = radios.indexOf(e.target as HTMLElement);
  if (i < 0) return;
  const k = e.key;
  const next = k === 'ArrowRight' || k === 'ArrowDown' ? (i + 1) % radios.length
    : k === 'ArrowLeft' || k === 'ArrowUp' ? (i - 1 + radios.length) % radios.length
    : k === 'Home' ? 0 : k === 'End' ? radios.length - 1 : -1;
  if (next < 0) return;
  e.preventDefault();
  radios[next].focus();
  radios[next].click();
}

/** tabIndex cho một ô radio: ô đang chọn nhận Tab; nếu chưa ô nào chọn thì ô đầu tiên nhận. */
export const radioTab = (checked: boolean, first = false, anyChecked = true) => (checked || (!anyChecked && first) ? 0 : -1);

/** Ô nhập chữ/số và danh sách chọn: tự xử lý phím (kể cả Space), phím tắt toàn cục không được đụng vào. */
const TEXT_ENTRY = 'textarea, select, input:not([type]), input[type="text"], input[type="number"], input[type="search"], input[type="email"], input[type="url"], input[type="tel"], input[type="password"], [contenteditable=""], [contenteditable="true"]';
/** Điều khiển mà Space kích hoạt theo chuẩn (bấm nút, chọn radio/ô đánh dấu, mở/đóng summary, mở liên kết). */
const SPACE_ACTIVATES = 'button, a[href], summary, input[type="checkbox"], input[type="radio"], input[type="button"], input[type="submit"], input[type="reset"], [role="button"], [role="radio"], [role="tab"], [role="checkbox"], [role="switch"], [role="menuitem"]';

/** Phần tử đang focus theo kiểu bàn phím? Dùng đúng bộ chọn `:focus-visible` của trình duyệt (chuột → không khớp, Tab → khớp).
 *  Môi trường không hiểu bộ chọn (jsdom cũ) thì coi là focus bằng bàn phím: hành vi an toàn là giữ nguyên phím chuẩn. */
export function isKeyboardFocused(el: Element): boolean {
  try { return el.matches(':focus-visible'); } catch { return true; }
}

/** Space có thuộc về thanh phát không (phím tắt kiểu DAW)?
 *  • Ô gõ chữ/số, select, contentEditable: không, giữ nguyên.
 *  • Nút, radio, thẻ, ô đánh dấu, summary, liên kết: chỉ khi focus do CHUỘT (không khớp `:focus-visible`);
 *    focus do bàn phím thì Space bấm nút như chuẩn, vì đó là cách duy nhất để dùng nút bằng phím.
 *  • Còn lại (thân trang, thanh trượt…): có. */
export function spaceBelongsToTransport(t: EventTarget | null, focusedByKeyboard: (el: Element) => boolean = isKeyboardFocused): boolean {
  if (!(t instanceof HTMLElement)) return true;
  if (t.matches(TEXT_ENTRY)) return false;
  if (t.matches(SPACE_ACTIVATES)) return !focusedByKeyboard(t);
  return true;
}

/** Phím tắt khác (Home…): không nuốt khi đang gõ hoặc ở một điều khiển tự xử lý phím đó. */
export function isTypingTarget(t: EventTarget | null): boolean {
  return t instanceof HTMLElement && (t.isContentEditable || t.matches(TEXT_ENTRY) || t.matches(SPACE_ACTIVATES) || t.matches('[role="slider"], input[type="range"]'));
}
