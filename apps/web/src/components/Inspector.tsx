// Inspector (UI-DIRECTION 5.3): mục đánh số 01, 02, 03…, phân cách bằng kẻ 1 px, không thẻ có bóng.
// Ở Cơ bản, mục có phần nâng cao hiện nút "Thêm tuỳ chọn" ở đầu mục (REQ-UI-13, nhớ theo mục). Dòng nâng cao KHÔNG mang nhãn
// nào, ở cả hai chế độ (D-57, chủ dự án bỏ hẳn nhãn NC 2026-11-14: không phần mềm dựng hình nào đánh dấu như vậy).
import { useEffect, useRef, type ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { RotateReset } from './Icons.tsx';

export function InspectorSection({ n, id, title, more, children }: {
  n: number; id: string; title: string; children: ReactNode;
  /** Có khi đang ở Cơ bản và mục có phần nâng cao. `edited`: phần nâng cao đang khác mặc định. */
  more?: { open: boolean; edited: boolean; onToggle(): void };
}) {
  const { i18n } = useI18n();
  return (
    <section aria-labelledby={`${id}-h`} className="border-b border-line" data-testid={`section-${id}`}>
      <header className="flex items-center gap-2 px-4 pb-2 pt-3">
        <span className="text-xs tabular-nums text-muted" aria-hidden>{String(n).padStart(2, '0')}</span>
        <h2 id={`${id}-h`} className="min-w-0 flex-1 truncate text-[15px] font-semibold text-fg">{title}</h2>
        {more && (
          <button type="button" className="btn-ghost flex items-center gap-1.5" aria-expanded={more.open} onClick={more.onToggle}
            title={more.edited && !more.open ? i18n.t('web.more.edited') : undefined}>
            {more.edited && !more.open && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-line-strong" />}
            {more.open ? i18n.t('web.less') : i18n.t('web.more')}
            {more.edited && !more.open && <span className="sr-only">({i18n.t('web.more.edited')})</span>}
          </button>
        )}
      </header>
      <div className="space-y-2.5 px-4 pb-4">{children}</div>
    </section>
  );
}

/** Dòng nhãn – giá trị chỉ đọc (mục Bài). */
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs">
      {rows.map(([k, v]) => <div key={k} className="contents"><dt className="truncate text-muted">{k}</dt><dd className="truncate text-right tabular-nums text-fg">{v}</dd></div>)}
    </dl>
  );
}

/** Tên phím "Alt" theo hệ điều hành (Option trên Mac) cho chú thích của nút ↺. */
const altName = (): string => (typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '') ? 'Option' : 'Alt');

/**
 * Nút ↺ đưa một thông số về giá trị tham chiếu (giá trị của bộ dựng sẵn đang chọn), kiểu DaVinci Resolve / Premiere.
 * Chỉ hiện khi giá trị khác tham chiếu; khi không hiện vẫn giữ chỗ để các ô cùng cột không xô lệch.
 * Mỗi lần bấm là một bước hoàn tác (người gọi bọc trong cử chỉ riêng nếu cần).
 * Alt+nhấp (Option+nhấp trên Mac) vào chữ nhãn của CÙNG DÒNG (phần tử cha của nút) cũng khôi phục; nhấp vào chính ô nhập thì không (Alt+kéo ô số là kéo mịn).
 * Khi dòng chưa đổi, Alt+nhấp vào nhãn không làm gì (không đảo ô tick, không bôi đen nhãn), để hành vi giống nhau ở mọi dòng có ↺.
 */
export function ResetButton({ label, changed, disabled, onReset, text }: { label: string; changed: boolean; disabled?: boolean; onReset(): void; /** Thay chú thích mặc định "về giá trị bộ dựng sẵn". */ text?: string }) {
  const { i18n } = useI18n();
  const name = text ?? i18n.t('web.reset.to', { name: label });
  const el = useRef<HTMLElement>(null);
  const live = useRef({ changed, disabled, onReset }); live.current = { changed, disabled, onReset };
  useEffect(() => {
    const row = el.current?.parentElement; if (!row) return;
    const h = (e: MouseEvent) => {
      if (!e.altKey || e.button !== 0) return;
      if ((e.target as HTMLElement).closest('input, select, textarea, button, [role="slider"], [role="spinbutton"]')) return;
      e.preventDefault(); e.stopPropagation();
      if (live.current.changed && !live.current.disabled) live.current.onReset();
    };
    row.addEventListener('click', h, true); // pha bắt: chạy trước việc nhãn bật/tắt ô tick
    return () => row.removeEventListener('click', h, true);
  }, []);
  if (!changed) return <span ref={el} aria-hidden className="block h-6 w-6 shrink-0" />;
  return (
    <button ref={el as React.RefObject<HTMLButtonElement>} type="button" className="tog shrink-0" disabled={disabled} aria-label={name} title={`${name} (${i18n.t('web.reset.altHint', { key: altName() })})`} onClick={onReset} data-testid="reset">
      <RotateReset className="h-3.5 w-3.5" />
    </button>
  );
}

/** Ô tick kèm ↺ (về giá trị `reference`; vắng thì không có ↺). Nhãn ở trong <label>, ↺ đứng ngoài để bấm ↺ không đảo ô. `strong`: chữ nhãn đậm màu (mục Editor). */
export function TickField({ label, checked, onChange, reference, testId, disabled, strong }: { label: string; checked: boolean; onChange(v: boolean): void; reference?: boolean; testId?: string; disabled?: boolean; strong?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <label className={`flex min-w-0 flex-1 items-center gap-2 ${strong ? 'text-[13px] text-fg' : 'text-xs text-muted'}`}>
        <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} data-testid={testId} />{label}
      </label>
      <ResetButton label={label} changed={!disabled && reference !== undefined && reference !== checked} disabled={disabled} onReset={() => onChange(reference!)} />
    </div>
  );
}
