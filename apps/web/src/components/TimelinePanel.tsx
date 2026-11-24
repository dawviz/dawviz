// Panel "Timeline" ở đáy thẻ Editor (UI-DIRECTION 5.3, DESIGN.md "Timeline", D-69): thanh tiêu đề luôn hiện (thu gọn/mở bằng nút hoặc Ctrl+J),
// kèm breadcrumb: Gốc › precomp đang mở › Keyframe của lớp. Thân panel là timeline lớp (tầng 1, LayerTimeline) hoặc keyframe của một lớp
// (tầng 2, KeyframeTimeline / Graph Editor). Nhấp một mục của breadcrumb để quay lên.
import type { ReactNode } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { ChevronRight, Close, PanelBottom } from './Icons.tsx';
import { radioKeys } from '../lib/a11y.ts';

export interface Crumb { label: string; onClick?(): void }
export interface TimelinePanelProps {
  open: boolean;
  onOpen(open: boolean): void;
  /** Chú thích của nút thu gọn/mở (kèm phím tắt). */
  toggleHint(open: boolean): string;
  /** Đường dẫn: gốc, các precomp đang mở, rồi "Keyframe · <lớp>" khi ở tầng 2. Mục cuối là chỗ đang đứng (không bấm được). */
  crumbs: Crumb[];
  /** Đang ở tầng 2 (keyframe của một lớp). */
  keys: boolean;
  /** Tầng 2 cần đúng một lớp đang chọn. */
  hasWidget: boolean;
  selectedCount: number;
  /** Đã nạp dự án chưa (chưa thì nhắc mở dự án). */
  hasProject: boolean;
  /** Chế độ của tầng 2: Danh sách (làn keyframe) hoặc Đồ thị (Graph Editor, T-33). */
  view: TimelineView;
  onView(v: TimelineView): void;
  /** Thông báo ngắn theo tình huống (vd. không có thanh nào ở vạch phát để tách); nút × để đóng. */
  note?: string;
  onNote?(): void;
  children?: ReactNode;
}
export type TimelineView = 'list' | 'graph';

export function TimelinePanel({ open, onOpen, toggleHint, crumbs, keys, hasWidget, selectedCount, hasProject, view, onView, note, onNote, children }: TimelinePanelProps) {
  const { i18n } = useI18n();
  const hint = toggleHint(open);
  const body = !hasProject ? 'web.editor.empty' : keys && !hasWidget ? (selectedCount > 1 ? 'web.timeline.many' : 'web.timeline.none') : null;
  return (
    <section id="editor-timeline" aria-labelledby="timeline-h" className="flex h-full min-h-0 flex-col border-t border-line bg-surface" data-testid="timeline-panel" data-open={open || undefined}>
      <header className="flex h-9 shrink-0 items-center gap-2 pl-2 pr-2">
        <button type="button" className="tog" aria-expanded={open} aria-controls="timeline-body" aria-label={hint} title={hint} onClick={() => onOpen(!open)} data-testid="timeline-toggle">
          <PanelBottom className="h-3.5 w-3.5" />
        </button>
        <h2 id="timeline-h" className="shrink-0 text-[13px] font-semibold text-fg">{i18n.t('web.timeline.title')}</h2>
        <nav aria-label={i18n.t('web.comp.path')} className="min-w-0 flex-1" data-testid="timeline-crumbs">
          <ol className="flex min-w-0 items-center gap-1 text-xs">
            {crumbs.map((c, k) => (
              <li key={k} className={`flex min-w-0 items-center gap-1 ${k === crumbs.length - 1 ? 'shrink' : 'shrink-[2]'}`}>
                {k > 0 && <ChevronRight aria-hidden className="h-3 w-3 shrink-0 text-faint" />}
                {c.onClick
                  ? <button type="button" className="min-w-0 truncate text-muted underline-offset-2 hover:text-fg hover:underline" onClick={c.onClick} title={c.label} data-testid={`crumb-${k}`}>{c.label}</button>
                  : <span className="min-w-0 truncate text-fg" aria-current="location" title={c.label} data-testid={`crumb-${k}`}>{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
        {open && keys && hasWidget && hasProject && (
          <div className="seg shrink-0" role="radiogroup" aria-label={i18n.t('web.graph.view')} onKeyDown={radioKeys} data-testid="timeline-view">
            {(['list', 'graph'] as const).map((v) => (
              <button key={v} type="button" role="radio" aria-checked={view === v} tabIndex={view === v ? 0 : -1} className="seg-btn px-2" onClick={() => onView(v)} data-testid={`timeline-view-${v}`}>{i18n.t(`web.graph.view.${v}`)}</button>
            ))}
          </div>
        )}
      </header>
      {open && note && (
        <div role="status" className="flex shrink-0 items-start justify-between gap-2 border-t border-warning/60 bg-warning/10 px-3 py-1.5 text-xs leading-snug text-fg" data-testid="timeline-note">
          <span>{note}</span>
          {onNote && <button type="button" className="tog -my-1" onClick={onNote} aria-label={i18n.t('web.close')} title={i18n.t('web.close')}><Close className="h-3 w-3" /></button>}
        </div>
      )}
      {open && (
        <div id="timeline-body" className="min-h-0 flex-1 border-t border-line">
          {body ? <p className="px-4 py-3 text-xs leading-snug text-muted" data-testid="timeline-empty">{i18n.t(body)}</p> : children}
        </div>
      )}
    </section>
  );
}
