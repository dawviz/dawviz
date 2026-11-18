// Ghi đè tempo (T-10, REQ-PARSER-07, D-24). Cơ bản: một ô BPM. Nâng cao: bảng điểm tempo (vị trí theo giây / Reaper / sixteenth, dấu nhịp).
// Nguồn tempo khác `file` thì nêu rõ và mời nhập (D-24). Gõ nháp trong bảng; chỉ "Áp dụng" mới phân tích lại.
import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { draftToOverride, emptyDraft, type TempoDraft, type TempoOverride, type TempoUnit } from '../lib/tempoRows.ts';
import { Select } from './Select.tsx';

const input = 'field w-full min-w-0 px-2 py-1 text-[13px] tabular-nums';

export function TempoPanel({ source, draft, overridden, busy, advanced, onApply, onClear }: {
  source: string; draft: TempoDraft | null; overridden: boolean; busy: boolean; advanced: boolean;
  onApply(override: TempoOverride, draft: TempoDraft): void; onClear(): void;
}) {
  const { i18n } = useI18n();
  const [d, setD] = useState<TempoDraft>(draft ?? emptyDraft());
  const [err, setErr] = useState<{ row: number; code: string } | null>(null);
  const set = (next: TempoDraft) => { setD(next); setErr(null); };
  const setRow = (i: number, patch: Partial<TempoDraft['rows'][number]>) => set({ ...d, rows: d.rows.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const apply = () => {
    const shown: TempoDraft = advanced ? d : { unit: 'time', rows: [{ pos: '', bpm: d.rows[0]?.bpm ?? '', sig: '' }] };
    const r = draftToOverride(shown);
    if (r.ok) onApply(r.override, shown); else setErr({ row: r.row, code: r.code });
  };
  const needs = source === 'fallback' || source === 'midi-default';
  const rows = advanced ? d.rows : d.rows.slice(0, 1);
  return (
    <div className="space-y-2" data-testid="tempo-panel">
      {needs && <p className="text-xs text-warning" role="status" data-testid="tempo-needs">{i18n.t(`web.tempo.source.${source}`)}</p>}
      {advanced && (
        <label className="flex items-center gap-2 text-xs text-muted">
          <span className="shrink-0">{i18n.t('web.tempo.unit')}</span>
          <Select wrapClassName="min-w-0 flex-1" className="w-full px-2 py-1 text-[13px]" value={d.unit} onChange={(e) => set({ ...d, unit: e.target.value as TempoUnit })} data-testid="tempo-unit">
            {(['time', 'reaper', 'sixteenth'] as const).map((u) => <option key={u} value={u}>{i18n.t(`web.tempo.unit.${u}`)}</option>)}
          </Select>
        </label>
      )}
      <div className={`grid items-center gap-1.5 ${advanced ? 'grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto]' : 'grid-cols-1'}`}>
        {advanced && <>
          <span className="text-xs text-muted">{i18n.t('web.tempo.pos')}</span><span className="text-xs text-muted">{i18n.t('web.tempo.bpm')}</span>
          <span className="text-xs text-muted">{i18n.t('web.tempo.sig')}</span><span />
        </>}
        {rows.map((r, i) => {
          const bad = err?.row === i;
          return (
            <div key={i} className="contents">
              {advanced && <input className={input} inputMode="text" aria-label={i18n.t('web.tempo.pos')} aria-invalid={bad && err?.code === 'position'} value={r.pos} placeholder={i === 0 ? '0' : ''} onChange={(e) => setRow(i, { pos: e.target.value })} />}
              <input className={input} inputMode="decimal" aria-label={i18n.t('web.tempo.bpm')} aria-invalid={bad && err?.code === 'bpm'} value={r.bpm} placeholder="120" onChange={(e) => setRow(i, { bpm: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') apply(); }} data-testid={`tempo-bpm-${i}`} />
              {advanced && <input className={input} aria-label={i18n.t('web.tempo.sig')} aria-invalid={bad && err?.code === 'signature'} value={r.sig} placeholder="4/4" onChange={(e) => setRow(i, { sig: e.target.value })} />}
              {advanced && <button type="button" className="btn-ghost px-2" aria-label={i18n.t('web.tempo.removeRow')} disabled={d.rows.length <= 1} onClick={() => set({ ...d, rows: d.rows.filter((_, k) => k !== i) })}>−</button>}
            </div>
          );
        })}
      </div>
      {err && <p role="alert" className="text-xs text-danger" data-testid="tempo-error">{i18n.t(`web.tempo.err.${err.code}`, { row: err.row + 1 })}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-ghost border border-control" disabled={busy} onClick={apply} data-testid="tempo-apply">{i18n.t('web.tempo.apply')}</button>
        {advanced && <button type="button" className="btn-ghost" onClick={() => set({ ...d, rows: [...d.rows, { pos: '', bpm: '', sig: '' }].slice(0, 64) })}>{i18n.t('web.tempo.addRow')}</button>}
        {overridden && <button type="button" className="btn-ghost" disabled={busy} onClick={() => { setD(emptyDraft()); setErr(null); onClear(); }} data-testid="tempo-clear">{i18n.t('web.tempo.useFile')}</button>}
      </div>
    </div>
  );
}
