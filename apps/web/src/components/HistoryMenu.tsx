// Cụm Hoàn tác / Làm lại và nút riêng "Lịch sử chỉnh sửa" (đồng hồ quay ngược, bên phải cả cụm) mở danh sách lịch sử thả xuống (T-07 bước 2b, SRS REQ-UI-02).
// Mới nhất ở trên, bước hiện tại có vạch nhỏ màu nhấn + nền `selection` (không tô đặc cả dòng), các bước làm lại hiện mờ, mốc đầu "Mở dự án".
// Bấm hoặc Enter vào một bước thì hoàn tác/làm lại liên tiếp tới bước đó. Bàn phím: ↑/↓/Home/End đi trong danh sách, Esc đóng.
import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { HistoryIcon, Undo as UndoIcon, Redo as RedoIcon } from './Icons.tsx';
import type { History } from '../lib/store.ts';
import type { HistoryItem } from '../lib/historyLabels.ts';

export function HistoryMenu({ history, items, undoName, undoTitle, redoName, redoTitle, onUndo, onRedo, onJump }: {
  history: History<any>; items: HistoryItem[]; undoName: string; undoTitle: string; redoName: string; redoTitle: string;
  onUndo(): void; onRedo(): void; onJump(position: number): void;
}) {
  const { i18n } = useI18n();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), menu = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const btn = 'btn-ghost inline-flex items-center gap-1.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-40';

  const close = (refocus = true) => { setOpen(false); if (refocus) trigger.current?.focus(); };
  const nodes = () => [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];

  useEffect(() => { // al mở: focus vào bước hiện tại
    if (!open) return;
    const els = nodes();
    (els.find((e) => e.getAttribute('aria-current') === 'step') ?? els[0])?.focus();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // bấm ra ngoài thì đóng
    if (!open) return;
    const down = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', down);
    return () => document.removeEventListener('pointerdown', down);
  }, [open]);

  const onMenuKey = (e: React.KeyboardEvent) => {
    const els = nodes(), i = els.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => { e.preventDefault(); els[(n + els.length) % els.length]?.focus(); };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(els.length - 1);
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <div ref={root} className="relative flex items-center gap-0.5" role="group" aria-label={i18n.t('web.history')}>
      <button type="button" disabled={!history.canUndo} onClick={onUndo} aria-label={undoName} title={undoTitle} data-testid="undo-button" className={btn}>
        <UndoIcon className="h-3.5 w-3.5" /><span>{i18n.t('web.undo')}</span>
      </button>
      <button type="button" disabled={!history.canRedo} onClick={onRedo} aria-label={redoName} title={redoTitle} data-testid="redo-button" className={`${btn} ml-1`}>
        <RedoIcon className="h-3.5 w-3.5" /><span>{i18n.t('web.redo')}</span>
      </button>
      {/* Chỉ có biểu tượng: tên và tooltip qua locales. Luôn bấm được; lịch sử rỗng thì danh sách chỉ có mốc "Mở dự án". */}
      <button ref={trigger} type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
        aria-label={i18n.t('web.history.open')} title={i18n.t('web.history.open')} data-testid="history-toggle" className={`${btn} ml-1 px-1.5`}
        onClick={() => setOpen((o) => !o)} onKeyDown={(e) => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); } }}>
        <HistoryIcon className="h-4 w-4" />
      </button>
      {open && (
        <div ref={menu} id={menuId} role="menu" aria-label={i18n.t('web.history.list')} data-testid="history-menu" onKeyDown={onMenuKey}
          className="absolute right-0 top-full z-40 mt-1 max-h-80 w-72 overflow-y-auto border border-line-strong bg-surface py-1 shadow-lg">
          {items.map((it) => {
            const current = it.position === history.position;
            return (
              <button key={it.position} type="button" role="menuitem" tabIndex={-1} aria-current={current ? 'step' : undefined} data-testid="history-item" data-position={it.position}
                onClick={() => { onJump(it.position); close(); }}
                className={`relative flex w-full items-baseline gap-2 py-1.5 pl-4 pr-3 text-left text-[13px] transition hover:bg-raised focus-visible:bg-raised ${current ? 'bg-selection font-medium text-fg' : it.redo ? 'text-faint' : 'text-fg'}`}>
                {current && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
                <span className="min-w-0 flex-1 truncate" title={it.label}>{it.label}</span>
                {it.redo && <span className="sr-only">{i18n.t('web.history.redoable')}</span>}
                {current && <span className="sr-only">{i18n.t('web.history.current')}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
