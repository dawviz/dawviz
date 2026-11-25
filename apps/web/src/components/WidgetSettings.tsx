// Mục "Thiết lập" của bảng Thuộc tính (T-68/T-06): thuộc tính riêng của từng loại widget (SRS REQ-WIDGET-02…08).
// Cơ bản: bật/tắt và lựa chọn hay dùng. Nâng cao: mẫu chữ, số chữ số, khoảng cách dòng, màu thanh… (REQ-UI-13).
// Mọi điều khiển đều vẽ từ bảng khai báo `lib/widgetFields.ts`, nên MỌI thiết lập đều có nút ↺ (về giá trị của bộ dựng sẵn áp gần nhất)
// và Alt+nhấp (Option+nhấp trên Mac) vào nhãn để khôi phục nhanh (làm trong `ResetButton`, dùng chung cho mọi bảng). Mỗi thay đổi là `patchWidgetProps` (gộp bước theo khoá thuộc tính);
// mỗi lần khôi phục là một bước hoàn tác riêng. Chữ của mẫu chỉ áp khi Enter hoặc rời ô.
import { useContext, useEffect, useId, useRef, useState } from 'react';
import { ColorField } from './ColorField.tsx';
import { GLOBAL_KEYS, INSIGHT_TEMPLATE_KEYS, TEMPLATE_KEYS, type WidgetSpec } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { radioKeys, radioTab } from '../lib/a11y.ts';
import { clickIsKeyboard, startPaintDrag } from '../lib/paintDrag.ts';
import { GestureContext } from '../lib/storeReact.ts';
import { laneLabel, type LaneChoice } from '../lib/animateFields.ts';
import { TRACK_WIDGETS, WIDGET_FIELDS, fieldChanged, getIn, hasWidgetFields, resetPatch, setIn, withNestedDefaults, type FieldDef } from '../lib/widgetFields.ts';
import { NumberField } from './NumberField.tsx';
import { ResetButton } from './Inspector.tsx';
import { Select } from './Select.tsx';
import { NotationStatusContext } from '../lib/notation/useNotation.ts';
import { useAssets } from '../lib/assetsRuntime.ts';
import { IMAGE_ACCEPT } from '../lib/sessionAssets.ts';

type Obj = Record<string, unknown>;
const numRow = 'grid grid-cols-[minmax(0,1fr)_4.5rem_1.5rem] items-center gap-2 text-xs text-muted';

/** Widget nào có mục Thiết lập. */
export const hasWidgetSettings = hasWidgetFields;
/** Tên chỗ giữ dùng được trong mẫu của widget: riêng của widget trước, rồi chỗ giữ chung (T-73). */
export const placeholderNames = (type: string): string[] => [...new Set([...((TEMPLATE_KEYS as Record<string, readonly string[]>)[type] ?? (INSIGHT_TEMPLATE_KEYS as Record<string, readonly string[]>)[type] ?? []), ...GLOBAL_KEYS])];

export interface TrackChoice { index: number; name: string }
export interface WidgetSettingsProps {
  widget: WidgetSpec; advanced: boolean; disabled?: boolean;
  /** Thuộc tính của widget trong bộ dựng sẵn áp gần nhất: đích của nút ↺. Thiếu thì không có ↺. */
  reference?: Obj;
  onProps(patch: Obj): void;
  tracks?: TrackChoice[];
  onTracks?(mode: 'ALL' | 'MANUAL', indices: number[]): void;
  /** Lane automation của dự án (T-66): ô chọn lane của widget Automation liệt kê theo tên. */
  lanes?: readonly LaneChoice[];
}

export function WidgetSettings({ widget, advanced, disabled, reference, onProps, tracks, onTracks, lanes = [] }: WidgetSettingsProps) {
  const { i18n } = useI18n();
  const gesture = useContext(GestureContext);
  const P = withNestedDefaults(widget.type, widget.properties as Obj), fields = WIDGET_FIELDS[widget.type] ?? [];
  const T = (k: string) => i18n.t(`web.ws.${k}`);
  const names = placeholderNames(widget.type);
  const hint = i18n.t('web.ws.placeholders', { list: names.map((k) => `{${k}}`).join(' ') });
  const showTracks = !!tracks?.length && !!onTracks && TRACK_WIDGETS.includes(widget.type) && (widget.type === 'TEXT' || widget.type === 'NOTATION' || advanced);

  const name = (f: FieldDef) => (f.group ? `${T(f.group)}: ${T(f.label)}` : T(f.label));
  const changed = (f: FieldDef) => !disabled && fieldChanged(f, P, reference);
  // Một lần khôi phục là MỘT bước hoàn tác, không gộp với lần kéo/gõ trước đó.
  const reset = (f: FieldDef) => { if (!reference) return; gesture.begin(); onProps(resetPatch(f, P, reference)); gesture.end(); };
  const resetBtn = (f: FieldDef) => <ResetButton label={name(f)} changed={changed(f)} disabled={disabled} onReset={() => reset(f)} />;
  const set = (f: FieldDef) => (v: unknown) => onProps({ [f.path[0]]: setIn(P, f.path, v)[f.path[0]] });

  const control = (f: FieldDef) => {
    const v = getIn(P, f.path);
    const label = name(f);
    switch (f.kind) {
      case 'check': return (
        <div key={f.path.join('.')} className="flex items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted" data-testid={f.testId}>
            <input type="checkbox" checked={!!v} disabled={disabled} onChange={(e) => set(f)(e.target.checked)} />{T(f.label)}
          </label>
          {resetBtn(f)}
        </div>);
      case 'num': return (
        <div key={f.path.join('.')} className={numRow}>
          <span className="min-w-0 break-words leading-tight">{T(f.label)}</span>
          <NumberField label={label} value={Number(v)} spec={f.num!} range={f.num!.range} disabled={disabled} onChange={set(f)} />
          {resetBtn(f)}
        </div>);
      case 'choice': return (
        <div key={f.path.join('.')} className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs text-muted"><span>{T(f.label)}</span>{resetBtn(f)}</div>
          <div className="seg w-full" role="radiogroup" aria-label={label} onKeyDown={radioKeys}>
            {f.options!.map((o) => <button key={o} type="button" role="radio" aria-checked={v === o} tabIndex={radioTab(v === o)} className="seg-btn flex-1" disabled={disabled} onClick={() => set(f)(o)}>{i18n.t(`${f.prefix}${o}`)}</button>)}
          </div>
        </div>);
      case 'select': {
        // Lane automation (T-66): lựa chọn cố định + lane của dự án + giá trị đang dùng (đánh dấu khi dự án không có lane đó).
        const opts = f.lanes ? [...new Set([...f.options!.map(String), ...lanes.map((l) => l.id), String(v)])] : f.options!;
        const optLabel = (o: string | number) => f.raw ? String(o)
          : f.lanes && !i18n.has(`${f.prefix}${o}`) ? `${laneLabel(i18n, String(o), lanes)}${lanes.some((l) => l.id === o) ? '' : ` (${i18n.t('web.glow.lane.absent')})`}`
          : i18n.t(`${f.prefix}${o}`);
        return (
        <div key={f.path.join('.')} className="grid grid-cols-[minmax(0,1fr)_minmax(0,9.5rem)_1.5rem] items-center gap-2 text-xs text-muted">
          <label>{T(f.label)}</label>
          <Select value={String(v)} disabled={disabled} aria-label={label} onChange={(e) => set(f)(f.options!.find((o) => String(o) === e.target.value) ?? e.target.value)} className="py-1 pl-2" wrapClassName="min-w-0" data-testid={f.testId}>
            {opts.map((o) => <option key={o} value={o}>{optLabel(o)}</option>)}
          </Select>
          {resetBtn(f)}
        </div>);
      }
      case 'color': case 'colorOpt': {
        const opt = f.kind === 'colorOpt', s = String(v ?? '');
        return (
          <div key={f.path.join('.')} className={numRow}>
            <span className="min-w-0 break-words leading-tight">{T(f.label)}</span>
            <span className="flex items-center gap-1.5">
              {opt && <input type="checkbox" aria-label={i18n.t('web.ws.show', { name: label })} checked={!!s} disabled={disabled} onChange={(e) => set(f)(e.target.checked ? '#E4E4E4' : '')} />}
              {(!opt || s) && <ColorField label={label} value={s || '#000000'} disabled={disabled} onChange={set(f)} testId={f.testId} />}
            </span>
            {resetBtn(f)}
          </div>);
      }
      case 'asset': return <AssetField key={f.path.join('.')} label={label} value={String(v ?? '')} disabled={disabled} onChange={set(f)} testId={f.testId} reset={resetBtn(f)} />;
      case 'text': return (
        <TextInput key={f.path.join('.')} label={T(f.label)} aria={label} value={String(v ?? '')} onCommit={set(f)} disabled={disabled}
          placeholder={f.text?.placeholder ? T(f.text.placeholder) : undefined} title={hint} max={f.text?.max ?? 200} names={names} multiline={f.text?.multiline}
          reset={resetBtn(f)} />);
    }
  };

  return (
    <div className="space-y-2.5" data-testid="widget-settings">
      {widget.type === 'NOTATION' && <NotationStatus id={widget.id} />}
      {fields.filter((f) => (!f.adv || advanced) && (f.when?.(P) ?? true)).map(control)}
      {showTracks && <TrackPicker widget={widget} tracks={tracks!} disabled={disabled} onTracks={onTracks!} />}
    </div>
  );
}

const MAJOR_TONICS = ['C♭', 'G♭', 'D♭', 'A♭', 'E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯'];
const MINOR_TONICS = ['A♭', 'E♭', 'B♭', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'D♯', 'A♯'];
/** Trạng thái bản dựng của widget Bản nhạc: đang viết / lỗi / số trang + cảnh báo (dịch theo mã). */
function NotationStatus({ id }: { id: string }) {
  const { i18n } = useI18n();
  const st = useContext(NotationStatusContext);
  if (!st) return null;
  const err = st.errors.get(id), lay = st.layouts.get(id), busy = st.busy.has(id);
  const key = lay ? i18n.t(`web.ws.ntKeyName.${lay.key.mode}`, { tonic: (lay.key.mode === 'major' ? MAJOR_TONICS : MINOR_TONICS)[lay.key.fifths + 7] }) : '';
  return (
    <div className="space-y-1 text-xs" data-testid="notation-status" role="status">
      {busy && <p className="text-muted">{i18n.t('web.ws.ntBusy')}</p>}
      {err && <p className="text-danger">{i18n.t('web.ws.ntFailed', { message: err })}</p>}
      {lay && !busy && <p className="text-muted">{i18n.t('web.ws.ntPages', { pages: lay.pages.length, measures: lay.stats.measures, key })}</p>}
      {lay && lay.warnings.map((w) => <p key={w.code} className="text-warning">{i18n.t(`warn.${w.code}`, (w.details ?? {}) as Record<string, string | number>)}</p>)}
    </div>
  );
}

/** Chọn track cho widget: mọi track đang hiện, hoặc chỉ vài track. Bấm giữ rồi kéo qua các dòng để chọn/bỏ nhanh (cả lần kéo là một bước hoàn tác);
 *  **Chọn tất cả** / **Bỏ chọn tất cả** ở đầu danh sách. ↺ (hoặc Alt+nhấp nhãn) về "Mọi track đang hiện". */
function TrackPicker({ widget, tracks, disabled, onTracks }: { widget: WidgetSpec; tracks: TrackChoice[]; disabled?: boolean; onTracks(mode: 'ALL' | 'MANUAL', indices: number[]): void }) {
  const { i18n } = useI18n();
  const gesture = useContext(GestureContext);
  const manual = widget.trackMappingMode === 'MANUAL';
  const [draft, setDraft] = useState<Set<number> | null>(null); // trong lúc kéo: kết quả tạm, áp một lần khi thả
  const saved = new Set(widget.assignedTrackIndices);
  const chosen = draft ?? saved;
  const live = useRef<Set<number>>(saved); live.current = chosen;
  const label = i18n.t('web.ws.tracks');
  const commit = (next: Set<number>) => onTracks('MANUAL', [...next]);
  const back = () => { gesture.begin(); onTracks('ALL', []); gesture.end(); };
  const paint = (e: React.PointerEvent<HTMLElement>) => {
    if (disabled) return;
    startPaintDrag(e, {
      current: (_k, id) => live.current.has(Number(id)),
      apply: (_k, id, on) => setDraft((d) => { const n = new Set(d ?? live.current); if (on) n.add(Number(id)); else n.delete(Number(id)); live.current = n; return n; }),
      gesture: { begin: () => setDraft(new Set(live.current)), end: () => { const n = live.current; setDraft(null); commit(n); } },
    });
  };
  return (
    <div className="mt-2.5 space-y-1.5" data-testid="widget-tracks">
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span>{label}</span>
        <ResetButton label={label} changed={manual && !disabled} disabled={disabled} onReset={back} />
      </div>
      <div className="seg w-full" role="radiogroup" aria-label={label} onKeyDown={radioKeys}>
        {(['ALL', 'MANUAL'] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={manual === (m === 'MANUAL')} tabIndex={radioTab(manual === (m === 'MANUAL'))} className="seg-btn flex-1" disabled={disabled}
            onClick={() => onTracks(m, m === 'MANUAL' ? tracks.map((t) => t.index) : [])}>{i18n.t(`web.ws.tracks.${m}`)}</button>
        ))}
      </div>
      {manual && <>
        <div className="flex gap-3 text-xs">
          <button type="button" className="hit text-muted underline-offset-2 hover:text-fg hover:underline disabled:opacity-40" disabled={disabled || tracks.every((t) => chosen.has(t.index))}
            onClick={() => commit(new Set(tracks.map((t) => t.index)))} data-testid="tracks-all">{i18n.t('web.ws.tracks.selectAll')}</button>
          <button type="button" className="hit text-muted underline-offset-2 hover:text-fg hover:underline disabled:opacity-40" disabled={disabled || !tracks.some((t) => chosen.has(t.index))}
            onClick={() => commit(new Set())} data-testid="tracks-none">{i18n.t('web.ws.tracks.selectNone')}</button>
        </div>
        <ul className="space-y-0.5" onPointerDown={paint} data-testid="tracks-list">
          {tracks.map((t) => (
            <li key={t.index}>
              <button type="button" role="checkbox" aria-checked={chosen.has(t.index)} disabled={disabled} data-paint="trk" data-paint-id={t.index}
                onClick={(e) => { if (clickIsKeyboard(e)) { const n = new Set(chosen); if (n.has(t.index)) n.delete(t.index); else n.add(t.index); commit(n); } }}
                className="flex min-h-[var(--hit)] w-full touch-none items-center gap-2 text-left text-xs text-muted hover:text-fg">
                <span aria-hidden className={`grid h-3.5 w-3.5 shrink-0 place-items-center border border-control text-[10px] leading-none ${chosen.has(t.index) ? 'bg-accent text-on-accent' : 'bg-raised'}`}>{chosen.has(t.index) ? '✓' : ''}</span>
                <span className="min-w-0 truncate">{t.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </>}
    </div>
  );
}

/** Chỗ giữ hay dùng nhất, có nút chèn sẵn dưới ô chữ (chỉ hiện nếu widget hỗ trợ tên đó). */
const QUICK_PLACEHOLDERS = ['bpm', 'title'] as const;

/** Ô chữ: gõ thoải mái, Enter (ô một dòng) hoặc rời ô mới áp (một bước hoàn tác); Esc trả về chữ cũ.
 *  Gõ `{` thì hiện gợi ý tên chỗ giữ (T-73): bấm một tên để điền nốt `{tên}`. Nút ↺ nằm cạnh nhãn. */
function TextInput({ label, aria, value, onCommit, disabled, placeholder, title, max, names, multiline, reset }: { label: string; aria?: string; value: string; onCommit(v: string): void; disabled?: boolean; placeholder?: string; title?: string; max: number; names?: readonly string[]; multiline?: boolean; reset?: React.ReactNode }) {
  const { i18n } = useI18n();
  const id = useId();
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
  const quick = disabled ? [] : QUICK_PLACEHOLDERS.filter((n) => names?.includes(n)); // chèn một chạm: người dùng không phải biết cú pháp `{…}`
  const insert = (n: string) => {
    const el = ref.current, s = el?.selectionStart ?? v.length, e = el?.selectionEnd ?? s, ins = `{${n}}`;
    const next = (v.slice(0, s) + ins + v.slice(e)).slice(0, max);
    pending.current = Math.min(next.length, s + ins.length); setV(next); setCaret(pending.current); onCommit(next); el?.focus();
  };
  const common = {
    ref, id, 'aria-label': aria, className: 'w-full border border-control bg-raised px-2 py-1 text-xs text-fg', value: v, maxLength: max, disabled, placeholder, title,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setV(e.target.value); setCaret(e.target.selectionStart ?? e.target.value.length); },
    onSelect: (e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => setCaret(e.currentTarget.selectionStart ?? 0),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) { e.preventDefault(); commit(); } else if (e.key === 'Escape') { e.stopPropagation(); setV(value); }
    },
  };
  return (
    <div className="space-y-1 text-xs text-muted">
      <div className="flex items-center justify-between gap-2"><label htmlFor={id}>{label}</label>{reset}</div>
      {multiline ? <textarea {...common} rows={4} className={`${common.className} resize-y`} /> : <input {...common} />}
      {quick.length > 0 && <span className="flex flex-wrap gap-1" data-testid="placeholder-quick">
        {quick.map((n) => <button key={n} type="button" className="min-h-[var(--hit)] border border-control px-1.5 text-xs text-fg hover:bg-raised" aria-label={i18n.t('web.ws.insert', { name: `{${n}}` })} title={i18n.t('web.ws.insert', { name: `{${n}}` })} onMouseDown={(e) => e.preventDefault()} onClick={() => insert(n)}>{`{${n}}`}</button>)}
      </span>}
      {hits.length > 0 && <span className="flex flex-wrap gap-1" data-testid="placeholder-hints">
        {hits.map((n) => <button key={n} type="button" className="min-h-[var(--hit)] border border-control px-1.5 text-xs text-fg hover:bg-raised" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(n)}>{`{${n}}`}</button>)}
      </span>}
    </div>
  );
}

/** Ô chọn ảnh của phiên (T-21): danh sách ảnh/SVG đã nạp + nút chọn tệp mới. Tệp bị từ chối thì báo theo mã lỗi ngay dưới ô. */
function AssetField({ label, value, disabled, onChange, testId, reset }: { label: string; value: string; disabled?: boolean; onChange(v: string): void; testId?: string; reset: React.ReactNode }) {
  const { i18n } = useI18n();
  const assets = useAssets(), images = assets.list.filter((a) => a.kind === 'image' || a.kind === 'svg');
  const input = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState<string | null>(null), [busy, setBusy] = useState(false);
  const known = !value || images.some((a) => a.id === value);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setErr(null); setBusy(true);
    try { const m = await assets.add(file); if (m.kind === 'font') setErr('ERR_ASSET_UNSUPPORTED'); else onChange(m.id); }
    catch (e) { setErr((e as { code?: string }).code ?? 'ERR_ASSET_DECODE'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  };
  return (
    <div className="space-y-1.5" data-testid={testId}>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_auto] items-center gap-2 text-xs text-muted">
        <span className="min-w-0 break-words leading-tight">{label}</span>
        <Select value={value} disabled={disabled} aria-label={label} onChange={(e) => onChange(e.target.value)} className="py-1 pl-2" wrapClassName="min-w-0" data-testid="ws-asset-select">
          <option value="">{i18n.t('web.asset.none')}</option>
          {!known && <option value={value}>{i18n.t('web.asset.missing')}</option>}
          {images.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
        {reset}
      </div>
      <input ref={input} type="file" accept={IMAGE_ACCEPT} className="sr-only" tabIndex={-1} aria-label={i18n.t('web.asset.pick')} onChange={(e) => void pick(e.target.files?.[0])} data-testid="ws-asset-file" />
      <button type="button" className="btn-ghost border border-control" disabled={disabled || busy} onClick={() => input.current?.click()} data-testid="ws-asset-pick">{busy ? i18n.t('web.asset.loading') : i18n.t('web.asset.pick')}</button>
      {err && <p role="alert" className="text-xs leading-snug text-danger" data-testid="ws-asset-error">{i18n.t(`errors.${err}`)}</p>}
      {!known && <p className="text-xs leading-snug text-warning">{i18n.t('web.asset.missingHint')}</p>}
    </div>
  );
}
