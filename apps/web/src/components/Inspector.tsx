// Inspector (UI-DIRECTION 5.3): mục đánh số 01, 02, 03…, phân cách bằng kẻ 1 px, không thẻ có bóng.
// Ở Cơ bản, mục có phần nâng cao hiện nút "Thêm tuỳ chọn" ở đầu mục (REQ-UI-13, nhớ theo mục); dòng nâng cao mang nhãn ADV.
import type { ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';

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

/** Nhãn nhỏ cho dòng chỉ có ở Nâng cao. */
export function AdvTag() {
  const { i18n } = useI18n();
  return <span className="shrink-0 rounded-sm border border-line px-1 text-xs leading-4 text-muted" title={i18n.t('web.adv.title')}>
    <span aria-hidden>{i18n.t('web.adv')}</span><span className="sr-only">{i18n.t('web.adv.title')}</span>
  </span>;
}

/** Dòng nhãn – giá trị chỉ đọc (mục Bài). */
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-xs">
      {rows.map(([k, v]) => <div key={k} className="contents"><dt className="truncate text-muted">{k}</dt><dd className="truncate text-right tabular-nums text-fg">{v}</dd></div>)}
    </dl>
  );
}
