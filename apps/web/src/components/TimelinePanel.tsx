// Panel "Timeline và keyframe" ở đáy thẻ Editor (UI-DIRECTION 5.3, DESIGN.md "Timeline"): thanh tiêu đề luôn hiện (thu gọn/mở bằng nút
// hoặc Ctrl+J), thân panel là cây thuộc tính của widget đang chọn và làn keyframe theo thời gian (KeyframeTimeline).
import type { ReactNode } from 'react';
import type { WidgetSpec } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { PanelBottom } from './Icons.tsx';
import { radioKeys } from '../lib/a11y.ts';

export interface TimelinePanelProps {
  open: boolean;
  onOpen(open: boolean): void;
  /** Chú thích của nút thu gọn/mở (kèm phím tắt). */
  toggleHint(open: boolean): string;
  widget: WidgetSpec | null;
  widgetName: string;
  selectedCount: number;
  /** Đã nạp dự án chưa (chưa thì nhắc mở dự án). */
  hasProject: boolean;
  /** Chế độ thân panel: Danh sách (làn keyframe) hoặc Đồ thị (Graph Editor, T-33). */
  view: TimelineView;
  onView(v: TimelineView): void;
  children?: ReactNode;
}
export type TimelineView = 'list' | 'graph';

export function TimelinePanel({ open, onOpen, toggleHint, widget, widgetName, selectedCount, hasProject, view, onView, children }: TimelinePanelProps) {
  const { i18n } = useI18n();
  const hint = toggleHint(open);
  return (
    <section id="editor-timeline" aria-labelledby="timeline-h" className="flex h-full min-h-0 flex-col border-t border-line bg-surface" data-testid="timeline-panel" data-open={open || undefined}>
      <header className="flex h-9 shrink-0 items-center gap-2 pl-2 pr-2">
        <button type="button" className="tog" aria-expanded={open} aria-controls="timeline-body" aria-label={hint} title={hint} onClick={() => onOpen(!open)} data-testid="timeline-toggle">
          <PanelBottom className="h-3.5 w-3.5" />
        </button>
        <h2 id="timeline-h" className="shrink-0 text-[13px] font-semibold text-fg">{i18n.t('web.timeline.title')}</h2>
        {widget && <span className="min-w-0 truncate text-xs text-muted" title={widgetName} data-testid="timeline-widget"><span aria-hidden>· </span>{widgetName}</span>}
        {open && widget && hasProject && (
          <div className="seg ml-auto shrink-0" role="radiogroup" aria-label={i18n.t('web.graph.view')} onKeyDown={radioKeys} data-testid="timeline-view">
            {(['list', 'graph'] as const).map((v) => (
              <button key={v} type="button" role="radio" aria-checked={view === v} tabIndex={view === v ? 0 : -1} className="seg-btn px-2" onClick={() => onView(v)} data-testid={`timeline-view-${v}`}>{i18n.t(`web.graph.view.${v}`)}</button>
            ))}
          </div>
        )}
      </header>
      {open && (
        <div id="timeline-body" className="min-h-0 flex-1 border-t border-line">
          {widget && hasProject ? children : (
            <p className="px-4 py-3 text-xs leading-snug text-muted" data-testid="timeline-empty">
              {i18n.t(!hasProject ? 'web.editor.empty' : selectedCount > 1 ? 'web.timeline.many' : 'web.timeline.none')}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
