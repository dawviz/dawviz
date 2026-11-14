// Mục "Thiết lập" của bảng Thuộc tính (T-68/T-06): thuộc tính riêng của từng loại widget chữ (SRS REQ-WIDGET-02…08).
// Cơ bản: bật/tắt và lựa chọn hay dùng. Nâng cao: mẫu chữ, số chữ số, khoảng cách dòng, màu thanh… (REQ-UI-13).
// Mỗi thay đổi là `patchWidgetProps` (gộp bước theo khoá thuộc tính). Chữ của mẫu chỉ áp khi Enter hoặc rời ô.
import { useEffect, useState } from 'react';
import { TEMPLATE_KEYS, type WidgetSpec } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { radioKeys, radioTab } from '../lib/a11y.ts';
import { NumberField } from './NumberField.tsx';
import { Select } from './Select.tsx';

const row = 'grid grid-cols-[minmax(0,1fr)_minmax(0,9.5rem)] items-center gap-2 text-xs text-muted';
const numRow = 'grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2 text-xs text-muted';
type Obj = Record<string, unknown>;

/** Widget nào có mục Thiết lập. */
export const hasWidgetSettings = (type: string) => ['TRACK_INFO', 'EVENT_COUNTER', 'LIVE_TRIGGER', 'TIME_BAR', 'CHORD_DETECTION', 'PROGRESS_BAR'].includes(type);
/** Thuộc tính chỉ có ở Nâng cao (để biết phần nâng cao đang khác mặc định). */
export const ADVANCED_WIDGET_KEYS: Readonly<Record<string, readonly string[]>> = {
  EVENT_COUNTER: ['lineHeight', 'decimals'], LIVE_TRIGGER: ['template', 'trackTemplate', 'tailMs', 'lineHeight', 'separator'],
  TIME_BAR: ['rowGap', 'barLength', 'barThickness', 'barColor', 'barTrackColor'], CHORD_DETECTION: ['notesTemplate', 'noChordText'],
  PROGRESS_BAR: ['radius', 'timeTemplate', 'trackColor'],
};

export function WidgetSettings({ widget, advanced, disabled, onProps }: { widget: WidgetSpec; advanced: boolean; disabled?: boolean; onProps(patch: Obj): void }) {
  const { i18n } = useI18n();
  const P = widget.properties as Obj, t = widget.type;
  const T = (k: string) => i18n.t(`web.ws.${k}`);
  const keys = (TEMPLATE_KEYS as Record<string, readonly string[]>)[t] ?? [];
  const hint = keys.length ? i18n.t('web.ws.placeholders', { list: keys.map((k) => `{${k}}`).join(' ') }) : undefined;

  const check = (label: string, on: boolean, set: (v: boolean) => void, id?: string) => (
    <label className="flex items-center gap-2 text-xs text-muted" data-testid={id}><input type="checkbox" checked={on} disabled={disabled} onChange={(e) => set(e.target.checked)} />{label}</label>
  );
  const num = (label: string, value: number, spec: { min: number; max: number; step: number }, set: (v: number) => void, range?: [number, number]) => (
    <div className={numRow}><span className="min-w-0 break-words leading-tight">{label}</span>
      <NumberField label={label} value={value} spec={spec} range={range} disabled={disabled} onChange={set} /></div>
  );
  const choice = <V extends string>(label: string, value: V, options: readonly V[], prefix: string, set: (v: V) => void) => (
    <div className="space-y-1.5"><span className="block text-xs text-muted">{label}</span>
      <div className="seg w-full" role="radiogroup" aria-label={label} onKeyDown={radioKeys}>
        {options.map((o) => <button key={o} type="button" role="radio" aria-checked={value === o} tabIndex={radioTab(value === o)} className="seg-btn flex-1" disabled={disabled} onClick={() => set(o)}>{i18n.t(`${prefix}${o}`)}</button>)}
      </div></div>
  );
  const color = (label: string, value: string, set: (v: string) => void, allowNone = false) => (
    <div className={numRow}><span className="min-w-0 break-words leading-tight">{label}</span>
      <span className="flex items-center gap-1.5">
        {allowNone && <input type="checkbox" aria-label={i18n.t('web.ws.show', { name: label })} checked={!!value} disabled={disabled} onChange={(e) => set(e.target.checked ? '#E4E4E4' : '')} />}
        {(!allowNone || value) && <input type="color" aria-label={label} value={value || '#000000'} disabled={disabled} onChange={(e) => set(e.target.value.toUpperCase())} className="h-6 w-full" />}
      </span></div>
  );
  const text = (label: string, value: string, set: (v: string) => void, opts: { placeholder?: string; title?: string; max?: number } = {}) => (
    <TextInput label={label} value={value} onCommit={set} disabled={disabled} placeholder={opts.placeholder} title={opts.title} max={opts.max ?? 200} />
  );
  const set = (k: string) => (v: unknown) => onProps({ [k]: v });
  const sub = (k: string, f: string) => (v: unknown) => onProps({ [k]: { ...(P[k] as Obj), [f]: v } });

  if (t === 'TRACK_INFO') return <div className="space-y-2.5" data-testid="widget-settings">
    {text(T('title'), String(P.titleText ?? ''), set('titleText'), { placeholder: T('fromProject') })}
    {text(T('artist'), String(P.artistText ?? ''), set('artistText'), { placeholder: T('fromProject') })}
  </div>;

  if (t === 'EVENT_COUNTER') {
    const L = P.lines as Record<string, { enabled: boolean; template: string }>;
    return <div className="space-y-2.5" data-testid="widget-settings">
      {(['played', 'total', 'progress', 'tempo'] as const).map((k) => <div key={k} className="space-y-1.5">
        {check(T(`line.${k}`), L[k].enabled, (v) => onProps({ lines: { ...L, [k]: { ...L[k], enabled: v } } }), `ws-line-${k}`)}
        {advanced && L[k].enabled && text(T('template'), L[k].template, (v) => onProps({ lines: { ...L, [k]: { ...L[k], template: v } } }), { title: hint })}
      </div>)}
      {advanced && <>
        {num(T('decimals'), Number(P.decimals), { min: 0, max: 4, step: 1 }, set('decimals'))}
        {num(T('lineHeight'), Number(P.lineHeight), { min: 1, max: 3, step: 0.05 }, set('lineHeight'))}
      </>}
    </div>;
  }

  if (t === 'LIVE_TRIGGER') return <div className="space-y-2.5" data-testid="widget-settings">
    {choice(T('layout'), P.mode as 'list' | 'inline', ['list', 'inline'] as const, 'web.ws.mode.', set('mode'))}
    {P.mode === 'list' && num(T('maxLines'), Number(P.maxLines), { min: 1, max: 32, step: 1 }, set('maxLines'))}
    {check(T('showTrack'), !!P.showTrack, set('showTrack'))}
    {advanced && <>
      {text(T('template'), String(P.template), set('template'), { title: hint })}
      {!!P.showTrack && text(T('trackTemplate'), String(P.trackTemplate), set('trackTemplate'), { title: hint })}
      {P.mode === 'inline' && text(T('separator'), String(P.separator), set('separator'), { max: 16 })}
      {num(T('tailMs'), Number(P.tailMs), { min: 0, max: 1000, step: 10 }, set('tailMs'), [0, 1000])}
      {P.mode === 'list' && num(T('lineHeight'), Number(P.lineHeight), { min: 1, max: 3, step: 0.05 }, set('lineHeight'))}
    </>}
  </div>;

  if (t === 'TIME_BAR') {
    const tm = P.time as { enabled: boolean; label: string; format: 'grouped' | 'clock' }, bt = P.beat as { enabled: boolean; label: string; format: 'grouped' | 'bbs' };
    return <div className="space-y-2.5" data-testid="widget-settings">
      {check(T('showTime'), tm.enabled, sub('time', 'enabled'))}
      {tm.enabled && choice(T('timeFormat'), tm.format, ['grouped', 'clock'] as const, 'web.ws.format.', sub('time', 'format'))}
      {check(T('showBeat'), bt.enabled, sub('beat', 'enabled'))}
      {bt.enabled && choice(T('beatFormat'), bt.format, ['grouped', 'bbs'] as const, 'web.ws.format.', sub('beat', 'format'))}
      {check(T('showBars'), !!P.showBars, set('showBars'))}
      {advanced && <>
        {tm.enabled && text(T('timeLabel'), tm.label, sub('time', 'label'), { max: 40 })}
        {bt.enabled && text(T('beatLabel'), bt.label, sub('beat', 'label'), { max: 40 })}
        {num(T('rowGap'), Number(P.rowGap), { min: 1, max: 5, step: 0.05 }, set('rowGap'))}
        {!!P.showBars && <>
          {num(T('barLength'), Number(P.barLength), { min: 4, max: 1000, step: 1 }, set('barLength'), [8, 400])}
          {num(T('barThickness'), Number(P.barThickness), { min: 0.5, max: 40, step: 0.5 }, set('barThickness'), [0.5, 10])}
          {color(T('barColor'), String(P.barColor), set('barColor'))}
          {color(T('barTrackColor'), String(P.barTrackColor), set('barTrackColor'), true)}
        </>}
      </>}
    </div>;
  }

  if (t === 'CHORD_DETECTION') return <div className="space-y-2.5" data-testid="widget-settings">
    {choice(T('chordMode'), P.mode as 'sustained' | 'strike', ['sustained', 'strike'] as const, 'web.ws.chordMode.', set('mode'))}
    {check(T('alwaysShowNotes'), !!P.alwaysShowNotes, set('alwaysShowNotes'), 'ws-always-notes')}
    <label className={row}><span>{T('unrecognized')}</span>
      <Select value={String(P.unrecognized)} disabled={disabled} onChange={(e) => onProps({ unrecognized: e.target.value })} className="py-1 pl-2" wrapClassName="min-w-0">
        {(['nc', 'notes'] as const).map((o) => <option key={o} value={o}>{T(`unrecognized.${o}`)}</option>)}
      </Select></label>
    {advanced && <>
      {P.unrecognized === 'nc' && text(T('noChordText'), String(P.noChordText), set('noChordText'), { max: 20 })}
      {text(T('notesTemplate'), String(P.notesTemplate), set('notesTemplate'), { title: hint })}
    </>}
  </div>;

  if (t === 'PROGRESS_BAR') return <div className="space-y-2.5" data-testid="widget-settings">
    {choice(T('orientation'), P.orientation as 'HORIZONTAL' | 'VERTICAL', ['HORIZONTAL', 'VERTICAL'] as const, 'web.ws.orientation.', set('orientation'))}
    {num(T('thickness'), Number(P.thickness), { min: 1, max: 200, step: 1 }, set('thickness'), [1, 40])}
    {color(T('progressColor'), String(P.progressColor), set('progressColor'))}
    {P.orientation === 'HORIZONTAL' && check(T('showTimeText'), !!P.showTime, set('showTime'))}
    {advanced && <>
      {color(T('trackColor'), String(P.trackColor), set('trackColor'), true)}
      {num(T('radius'), Number(P.radius), { min: 0, max: 100, step: 1 }, set('radius'), [0, 20])}
      {P.orientation === 'HORIZONTAL' && !!P.showTime && text(T('template'), String(P.timeTemplate), set('timeTemplate'), { title: hint })}
    </>}
  </div>;
  return null;
}

/** Ô chữ một dòng: gõ thoải mái, Enter hoặc rời ô mới áp (một bước hoàn tác); Esc trả về chữ cũ. */
function TextInput({ label, value, onCommit, disabled, placeholder, title, max }: { label: string; value: string; onCommit(v: string): void; disabled?: boolean; placeholder?: string; title?: string; max: number }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  const commit = () => { if (v !== value) onCommit(v.slice(0, max)); };
  return (
    <label className="block space-y-1 text-xs text-muted">
      <span className="block">{label}</span>
      <input className="w-full border border-control bg-raised px-2 py-1 text-xs text-fg" value={v} maxLength={max} disabled={disabled} placeholder={placeholder} title={title}
        onChange={(e) => setV(e.target.value)} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } else if (e.key === 'Escape') { e.stopPropagation(); setV(value); } }} />
    </label>
  );
}
