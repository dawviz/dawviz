// Mục "Thiết lập" của bảng Thuộc tính (T-68/T-06): thuộc tính riêng của từng loại widget chữ (SRS REQ-WIDGET-02…08).
// Cơ bản: bật/tắt và lựa chọn hay dùng. Nâng cao: mẫu chữ, số chữ số, khoảng cách dòng, màu thanh… (REQ-UI-13).
// Mỗi thay đổi là `patchWidgetProps` (gộp bước theo khoá thuộc tính). Chữ của mẫu chỉ áp khi Enter hoặc rời ô.
import { useEffect, useRef, useState } from 'react';
import { GLOBAL_KEYS, TEMPLATE_KEYS, type WidgetSpec } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { radioKeys, radioTab } from '../lib/a11y.ts';
import { NumberField } from './NumberField.tsx';
import { Select } from './Select.tsx';

const row = 'grid grid-cols-[minmax(0,1fr)_minmax(0,9.5rem)] items-center gap-2 text-xs text-muted';
const numRow = 'grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-2 text-xs text-muted';
type Obj = Record<string, unknown>;

/** Widget nào có mục Thiết lập. */
export const hasWidgetSettings = (type: string) => ['TRACK_INFO', 'EVENT_COUNTER', 'LIVE_TRIGGER', 'TIME_BAR', 'CHORD_DETECTION', 'PROGRESS_BAR', 'TEXT'].includes(type);
/** Thuộc tính chỉ có ở Nâng cao (để biết phần nâng cao đang khác mặc định). */
export const ADVANCED_WIDGET_KEYS: Readonly<Record<string, readonly string[]>> = {
  EVENT_COUNTER: ['lineHeight', 'decimals'], LIVE_TRIGGER: ['template', 'trackTemplate', 'tailMs', 'lineHeight', 'separator'],
  TIME_BAR: ['rowGap', 'barLength', 'barThickness', 'barColor', 'barTrackColor'], CHORD_DETECTION: ['notesTemplate', 'noChordText'],
  PROGRESS_BAR: ['radius', 'timeTemplate', 'trackColor'],
};
/** Tên chỗ giữ dùng được trong mẫu của widget: riêng của widget trước, rồi chỗ giữ chung (T-73). */
export const placeholderNames = (type: string): string[] => [...new Set([...((TEMPLATE_KEYS as Record<string, readonly string[]>)[type] ?? []), ...GLOBAL_KEYS])];

/** Widget đọc số liệu từ các track, nên cho chọn track riêng (T-73). Ô chữ ở Cơ bản (vì `{notes}`, `{played}` phụ thuộc track), các widget còn lại ở Nâng cao. */
const TRACK_WIDGETS = ['TEXT', 'EVENT_COUNTER', 'LIVE_TRIGGER', 'CHORD_DETECTION'];
export interface TrackChoice { index: number; name: string }
type SettingsProps = { widget: WidgetSpec; advanced: boolean; disabled?: boolean; onProps(patch: Obj): void; tracks?: TrackChoice[]; onTracks?(mode: 'ALL' | 'MANUAL', indices: number[]): void };

export function WidgetSettings(props: SettingsProps) {
  const { widget, advanced, disabled, tracks, onTracks } = props;
  const show = !!tracks?.length && !!onTracks && TRACK_WIDGETS.includes(widget.type) && (widget.type === 'TEXT' || advanced);
  return <><WidgetSettingsBody {...props} />{show && <TrackPicker widget={widget} tracks={tracks!} disabled={disabled} onTracks={onTracks!} />}</>;
}

/** Chọn track cho widget: mọi track đang hiện, hoặc chỉ vài track. */
function TrackPicker({ widget, tracks, disabled, onTracks }: { widget: WidgetSpec; tracks: TrackChoice[]; disabled?: boolean; onTracks(mode: 'ALL' | 'MANUAL', indices: number[]): void }) {
  const { i18n } = useI18n();
  const manual = widget.trackMappingMode === 'MANUAL', chosen = new Set(widget.assignedTrackIndices);
  const label = i18n.t('web.ws.tracks');
  return (
    <div className="mt-2.5 space-y-1.5" data-testid="widget-tracks">
      <span className="block text-xs text-muted">{label}</span>
      <div className="seg w-full" role="radiogroup" aria-label={label} onKeyDown={radioKeys}>
        {(['ALL', 'MANUAL'] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={manual === (m === 'MANUAL')} tabIndex={radioTab(manual === (m === 'MANUAL'))} className="seg-btn flex-1" disabled={disabled}
            onClick={() => onTracks(m, m === 'MANUAL' ? tracks.map((t) => t.index) : [])}>{i18n.t(`web.ws.tracks.${m}`)}</button>
        ))}
      </div>
      {manual && <ul className="space-y-1">
        {tracks.map((t) => (
          <li key={t.index}><label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={chosen.has(t.index)} disabled={disabled}
              onChange={(e) => onTracks('MANUAL', e.target.checked ? [...chosen, t.index] : [...chosen].filter((i) => i !== t.index))} />{t.name}
          </label></li>
        ))}
      </ul>}
    </div>
  );
}

function WidgetSettingsBody({ widget, advanced, disabled, onProps }: SettingsProps) {
  const { i18n } = useI18n();
  const P = widget.properties as Obj, t = widget.type;
  const T = (k: string) => i18n.t(`web.ws.${k}`);
  const names = placeholderNames(t);
  const hint = i18n.t('web.ws.placeholders', { list: names.map((k) => `{${k}}`).join(' ') });

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
  const text = (label: string, value: string, set: (v: string) => void, opts: { placeholder?: string; title?: string; max?: number; multiline?: boolean } = {}) => (
    <TextInput label={label} value={value} onCommit={set} disabled={disabled} placeholder={opts.placeholder} title={opts.title ?? hint} max={opts.max ?? 200} names={names} multiline={opts.multiline} />
  );
  const set = (k: string) => (v: unknown) => onProps({ [k]: v });
  const sub = (k: string, f: string) => (v: unknown) => onProps({ [k]: { ...(P[k] as Obj), [f]: v } });

  if (t === 'TEXT') return <div className="space-y-2.5" data-testid="widget-settings">
    {text(T('boxText'), String(P.text ?? ''), set('text'), { max: 2000, multiline: true })}
  </div>;

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

/** Ô chữ: gõ thoải mái, Enter (ô một dòng) hoặc rời ô mới áp (một bước hoàn tác); Esc trả về chữ cũ.
 *  Gõ `{` thì hiện gợi ý tên chỗ giữ (T-73): bấm một tên để điền nốt `{tên}`. */
function TextInput({ label, value, onCommit, disabled, placeholder, title, max, names, multiline }: { label: string; value: string; onCommit(v: string): void; disabled?: boolean; placeholder?: string; title?: string; max: number; names?: readonly string[]; multiline?: boolean }) {
  const [v, setV] = useState(value);
  const [caret, setCaret] = useState(0);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  const pending = useRef<number | null>(null);
  useEffect(() => setV(value), [value]);
  useEffect(() => { if (pending.current !== null && ref.current) { ref.current.setSelectionRange(pending.current, pending.current); pending.current = null; } });
  const commit = () => { if (v !== value) onCommit(v.slice(0, max)); };
  const open = names?.length ? /\{([A-Za-z][A-Za-z0-9_]*)?$/.exec(v.slice(0, caret)) : null; // đang gõ dở một tên sau dấu {
  const hits = open ? names!.filter((n) => n.startsWith(open[1] ?? '')).slice(0, 8) : [];
  const pick = (n: string) => {
    const start = caret - open![0].length, ins = `{${n}}`, next = (v.slice(0, start) + ins + v.slice(caret)).slice(0, max);
    pending.current = Math.min(next.length, start + ins.length); setV(next); setCaret(pending.current);
  };
  const common = {
    ref, className: 'w-full border border-control bg-raised px-2 py-1 text-xs text-fg', value: v, maxLength: max, disabled, placeholder, title,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setV(e.target.value); setCaret(e.target.selectionStart ?? e.target.value.length); },
    onSelect: (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => setCaret(e.currentTarget.selectionStart ?? 0),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit(); } else if (e.key === 'Escape') { e.stopPropagation(); setV(value); }
    },
  };
  return (
    <label className="block space-y-1 text-xs text-muted">
      <span className="block">{label}</span>
      {multiline ? <textarea {...common} rows={4} className={`${common.className} resize-y`} /> : <input {...common} />}
      {hits.length > 0 && <span className="flex flex-wrap gap-1" data-testid="placeholder-hints">
        {hits.map((n) => <button key={n} type="button" className="border border-control px-1.5 py-0.5 text-[11px] text-fg hover:bg-raised" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(n)}>{`{${n}}`}</button>)}
      </span>}
    </label>
  );
}
