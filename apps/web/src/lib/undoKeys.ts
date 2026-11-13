// Phím tắt hoàn tác (T-07, REQ-UI-02): Ctrl/Cmd+Z hoàn tác; Ctrl/Cmd+Shift+Z và Ctrl+Y làm lại.
// Không chạy khi đang gõ trong ô chữ/số (trình duyệt tự hoàn tác chữ ở đó, lib/a11y.ts `isTextEntry`).
import { isTextEntry } from './a11y.ts';

interface Undoable { undo(): void; redo(): void }

/** Hành động ứng với một phím, hoặc null nếu không phải phím hoàn tác. Tách ra để test không cần DOM. */
export function undoAction(e: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>): 'undo' | 'redo' | null {
  if (e.altKey) return null;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if ((e.ctrlKey || e.metaKey) && k === 'z') return e.shiftKey ? 'redo' : 'undo';
  if (e.ctrlKey && !e.metaKey && !e.shiftKey && k === 'y') return 'redo';
  return null;
}

export function bindUndoKeys(target: Pick<Window, 'addEventListener' | 'removeEventListener'>, store: Undoable): () => void {
  const onKey = (ev: Event) => {
    const e = ev as KeyboardEvent;
    if (e.defaultPrevented || e.isComposing || isTextEntry(e.target)) return;
    const a = undoAction(e);
    if (!a) return;
    e.preventDefault();
    store[a]();
  };
  target.addEventListener('keydown', onKey);
  return () => target.removeEventListener('keydown', onKey);
}

/** macOS dùng Cmd, nơi khác dùng Ctrl (chỉ để hiển thị; phím thật chấp nhận cả hai). */
export const isMac = (): boolean => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
export function shortcutLabels(mac = isMac()): { undo: string; redo: string } {
  return mac ? { undo: '⌘Z', redo: '⇧⌘Z' } : { undo: 'Ctrl+Z', redo: 'Ctrl+Shift+Z' };
}
