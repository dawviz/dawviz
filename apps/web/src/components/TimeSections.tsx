// Hai mục của bảng Thuộc tính (T-81): "Khoảng hiển thị" của widget đang chọn (REQ-GRAPHICS-14) và "Phase" của cả bài.
import { MAX_PHASES, MAX_RANGES, PITCH_CLASSES, type Phase, type TimeRange, type WidgetVisibility } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { InspectorSection, TickField } from './Inspector.tsx';
import { NumberField } from './NumberField.tsx';
import { TimeField } from './TimeField.tsx';
import { Plus, Close } from './Icons.tsx';
import { Select } from './Select.tsx';

const btn = 'flex min-h-[var(--hit)] items-center gap-1.5 rounded border border-control bg-raised px-2.5 text-xs font-medium text-fg transition hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50';
const iconBtn = 'tog shrink-0';
const FADE = { min: 0, max: 30, step: 0.1, units: { s: 1 } } as const;
const ALWAYS: WidgetVisibility = { ranges: [{ from: 0, to: null }], fadeIn: 0, fadeOut: 0 };

/** Mục "Khoảng hiển thị": tắt = hiện suốt bài; bật = danh sách khoảng (mốc kết thúc trống = hết bài) + thời gian hiện dần/ẩn dần. */
export function VisibilitySection({ n, widgetId, value, disabled, onChange }: { n: number; widgetId: string; value: WidgetVisibility | undefined; disabled?: boolean; onChange(v: WidgetVisibility | null, key?: string): void }) {
  const { i18n } = useI18n();
  const on = !!value, id = `vis-${widgetId}`;
  const setRange = (i: number, r: TimeRange) => onChange({ ...value!, ranges: value!.ranges.map((x, j) => (j === i ? r : x)).sort((a, b) => a.from - b.from) });
  return (
    <InspectorSection n={n} id="visibility" title={i18n.t('web.vis.title')}>
      <TickField strong label={i18n.t('web.vis.limit')} checked={on} disabled={disabled} onChange={(v) => onChange(v ? ALWAYS : null)} reference={false} testId="vis-limit" />
      {on && (
        <>
          <ul className="space-y-1.5" data-testid="vis-ranges">
            {value!.ranges.map((r, i) => (
              <li key={i} className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_1.5rem] items-center gap-1.5 text-xs text-muted">
                <TimeField id={`${id}-from-${i}`} label={i18n.t('web.vis.from')} value={r.from} max={r.to === null ? 86400 : r.to - 0.001} onChange={(v) => setRange(i, { ...r, from: v ?? 0 })} />
                <span aria-hidden>–</span>
                <TimeField id={`${id}-to-${i}`} label={i18n.t('web.vis.to')} value={r.to} emptyText={i18n.t('web.vis.end')} min={r.from + 0.001} onChange={(v) => setRange(i, { ...r, to: v })} />
                <button type="button" className={iconBtn} aria-label={i18n.t('web.vis.removeRange')} title={i18n.t('web.vis.removeRange')} onClick={() => onChange({ ...value!, ranges: value!.ranges.filter((_, j) => j !== i) })} data-testid={`vis-remove-${i}`}><Close className="h-3.5 w-3.5" /></button>
              </li>
            ))}
          </ul>
          {value!.ranges.length === 0 && <p className="text-xs leading-snug text-muted" role="status" data-testid="vis-none">{i18n.t('web.vis.none')}</p>}
          <button type="button" className={btn} disabled={disabled || value!.ranges.length >= MAX_RANGES} onClick={() => {
            const last = value!.ranges[value!.ranges.length - 1], from = last ? (last.to ?? last.from) : 0;
            onChange({ ...value!, ranges: [...value!.ranges, { from, to: null }] });
          }} data-testid="vis-add"><Plus className="h-3.5 w-3.5" />{i18n.t('web.vis.addRange')}</button>
          <div className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2 text-xs text-muted">
            <span>{i18n.t('web.vis.fadeIn')}</span>
            <NumberField label={i18n.t('web.vis.fadeIn')} value={value!.fadeIn} spec={FADE} range={[0, 5]} onChange={(v) => onChange({ ...value!, fadeIn: v }, 'fadeIn')} />
            <span>{i18n.t('web.vis.fadeOut')}</span>
            <NumberField label={i18n.t('web.vis.fadeOut')} value={value!.fadeOut} spec={FADE} range={[0, 5]} onChange={(v) => onChange({ ...value!, fadeOut: v }, 'fadeOut')} />
          </div>
        </>
      )}
    </InspectorSection>
  );
}

/** Mục "Phase": mỗi dòng là tên + thời điểm bắt đầu; phase kéo dài tới phase kế. Dùng cho chỗ giữ `{phase}`, `{next_phase}`, `{phase_remaining}`… */
export function PhasesSection({ n, phases, duration, onChange }: { n: number; phases: readonly Phase[]; duration: number; onChange(p: Phase[], key?: string): void }) {
  const { i18n } = useI18n();
  const sort = (l: Phase[]) => [...l].sort((a, b) => a.start - b.start);
  const taken = (start: number, except: number) => phases.some((p, j) => j !== except && Math.abs(p.start - start) < 0.001);
  return (
    <InspectorSection n={n} id="phases" title={i18n.t('web.phase.title')}>
      {phases.length === 0 && <p className="text-xs leading-snug text-muted" data-testid="phase-none">{i18n.t('web.phase.none')}</p>}
      <ul className="space-y-1.5" data-testid="phase-list">
        {phases.map((p, i) => (
          <li key={i} className="grid grid-cols-[minmax(0,1fr)_5.5rem_1.5rem] items-center gap-1.5">
            <input type="text" aria-label={i18n.t('web.phase.name')} defaultValue={p.name} maxLength={60} data-testid={`phase-name-${i}`} key={`${i}-${p.name}`}
              onBlur={(e) => { const v = e.target.value.replace(/\s+/g, ' ').trim(); if (!v) e.target.value = p.name; else if (v !== p.name) onChange(phases.map((x, j) => (j === i ? { ...x, name: v } : x)), `name${i}`); }}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              className="w-full min-w-0 rounded border border-control bg-raised px-2 py-1 text-[13px] text-fg" />
            <TimeField id={`phase-start-${i}`} label={i18n.t('web.phase.start')} value={p.start} max={Math.max(duration, 1)} onChange={(v) => { if (v !== null && !taken(v, i)) onChange(sort(phases.map((x, j) => (j === i ? { ...x, start: v } : x)))); }} />
            <button type="button" className={iconBtn} aria-label={i18n.t('web.phase.remove')} title={i18n.t('web.phase.remove')} onClick={() => onChange(phases.filter((_, j) => j !== i))} data-testid={`phase-remove-${i}`}><Close className="h-3.5 w-3.5" /></button>
          </li>
        ))}
      </ul>
      <button type="button" className={btn} disabled={phases.length >= MAX_PHASES} onClick={() => {
        let start = phases.length ? phases[phases.length - 1].start + 1 : 0; while (taken(start, -1)) start += 1;
        onChange(sort([...phases, { name: i18n.t('web.phase.defaultName', { n: phases.length + 1 }), start }]));
      }} data-testid="phase-add"><Plus className="h-3.5 w-3.5" />{i18n.t('web.phase.add')}</button>
    </InspectorSection>
  );
}

/** Mục "Nốt chủ": chọn nốt chủ của bài để `{bass}` hiện bậc (1, ♭2, … 7) thay vì tên nốt. */
export function KeySection({ n, tonic, onChange }: { n: number; tonic: number | undefined; onChange(t: number | null): void }) {
  const { i18n } = useI18n();
  return (
    <InspectorSection n={n} id="tonic" title={i18n.t('web.tonic.title')}>
      <label className="flex items-center gap-2 text-xs text-muted">
        <span className="shrink-0">{i18n.t('web.tonic.label')}</span>
        <Select wrapClassName="min-w-0 flex-1" value={tonic === undefined ? '' : String(tonic)} data-testid="tonic-select" onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}>
          <option value="">{i18n.t('web.tonic.none')}</option>
          {PITCH_CLASSES.map((p, i) => <option key={p} value={i}>{p}</option>)}
        </Select>
      </label>
    </InspectorSection>
  );
}
