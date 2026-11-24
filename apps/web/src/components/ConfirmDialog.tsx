// Hộp thoại xác nhận dùng chung (T-120): thay cho window.confirm của trình duyệt (xấu, không theo theme, không dịch được). Chỉ dùng khi thao tác
// làm mất thứ không tự khôi phục được; thao tác có hoàn tác (Ctrl+Z) thì không hỏi. Esc và nút Huỷ đều là "không làm"; tiêu điểm vào nút Huỷ
// (chọn an toàn), Tab xoay vòng trong hộp thoại, đóng xong trả tiêu điểm về chỗ cũ.
import { useEffect, useRef } from 'react';

interface Props { title: string; message: string; confirmLabel: string; cancelLabel: string; onConfirm(): void; onCancel(): void; testId?: string }

export function ConfirmDialog({ title, message, confirmLabel, cancelLabel, onConfirm, onCancel, testId = 'confirm-dialog' }: Props) {
  const box = useRef<HTMLDivElement>(null), cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    cancel.current?.focus();
    return () => { back?.focus?.(); };
  }, []);
  const keys = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel(); return; }
    if (e.key !== 'Tab') return;
    const f = [...(box.current?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? [])]; if (!f.length) return;
    const first = f[0], last = f[f.length - 1], at = document.activeElement;
    if (e.shiftKey && at === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
  };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" data-testid={testId} onKeyDown={keys}>
      <div ref={box} role="alertdialog" aria-modal="true" aria-labelledby={`${testId}-title`} aria-describedby={`${testId}-msg`} className="w-full max-w-sm space-y-3 rounded border border-line bg-surface p-5 text-fg">
        <h2 id={`${testId}-title`} className="text-[16px] font-semibold">{title}</h2>
        <p id={`${testId}-msg`} className="text-[13px] leading-snug text-muted">{message}</p>
        <div className="flex justify-end gap-2 pt-1">
          <button ref={cancel} type="button" className="flex min-h-[var(--hit)] items-center rounded border border-control bg-raised px-3 text-xs font-medium text-fg transition hover:border-line-strong" onClick={onCancel} data-testid={`${testId}-cancel`}>{cancelLabel}</button>
          <button type="button" className="flex min-h-[var(--hit)] items-center rounded border border-accent bg-accent px-3 text-xs font-semibold text-on-accent transition hover:ring-2 hover:ring-line-strong" onClick={onConfirm} data-testid={`${testId}-ok`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
