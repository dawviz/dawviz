// Thẻ Cài đặt, mục "Độ trễ thiết bị" (T-82): hồ sơ thiết bị có tên, bài đo gõ theo nhịp, nhập/xuất tệp.
// Chỉ ảnh hưởng Xem trước trên máy này; không vào preset, Project Pack hay video xuất. Toán ở lib/latencyCalibration.ts.
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { createCalibration, type Calibration, type CalStatus } from '../lib/calibrationRunner.ts';
import { CAL, DEVICE_OFFSET_LIMIT_MS, MAX_PROFILES, MAX_PROFILE_FILE_BYTES, MAX_PROFILE_NAME, addProfile, removeProfile, parseProfile, serializeProfile, updateProfile, uniqueProfileName,
  type CalibrationResult, type DevicePrefs } from '../lib/latencyCalibration.ts';
import { NumberField } from './NumberField.tsx';
import { ResetButton } from './Inspector.tsx';
import { Select } from './Select.tsx';
import { StatusIcon } from './StatusIcon.tsx';

const btn = 'btn-ghost border border-control';
const browserDeps = {
  createContext: () => { try { return new AudioContext({ sampleRate: 48_000, latencyHint: 'interactive' }) as never; } catch { return new AudioContext() as never; } },
  now: () => performance.now(),
};
const newId = () => (globalThis.crypto?.randomUUID?.() ?? `d${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`).slice(0, 64);

export function DeviceLatency({ prefs, onChange, makeCalibration = () => createCalibration(browserDeps) }: { prefs: DevicePrefs; onChange(p: DevicePrefs): void; makeCalibration?(): Calibration }) {
  const { i18n } = useI18n();
  const cal = useRef<Calibration | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<CalStatus | null>(null);
  const [result, setResult] = useState<CalibrationResult | null>(null);
  const [note, setNote] = useState<{ kind: 'error' | 'info'; text: string } | null>(null);
  const [saveName, setSaveName] = useState('');
  const active = prefs.profiles.find((p) => p.id === prefs.activeId) ?? null;
  const running = status?.phase === 'starting' || status?.phase === 'running';

  // Làm tươi trạng thái và hỏi kết quả khi đang đo. Gõ: Space/Enter ở bất cứ đâu trong lúc đo (pointerdown trên nút gõ có ở dưới).
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => { const c = cal.current; if (!c) return; const r = c.poll(); setStatus(c.status()); if (r) setResult(r); }, 100);
    const key = (e: KeyboardEvent) => {
      if ((e.code !== 'Space' && e.key !== 'Enter') || e.repeat) return;
      const t = e.target as HTMLElement | null; if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      e.preventDefault(); cal.current?.tap(e.timeStamp);
    };
    window.addEventListener('keydown', key);
    return () => { window.clearInterval(id); window.removeEventListener('keydown', key); };
  }, [running]);
  useEffect(() => () => cal.current?.abort(), []);

  const start = () => {
    setResult(null); setNote(null);
    const c = cal.current = makeCalibration();
    setStatus({ phase: 'starting', bar: -1, taps: 0 });
    void c.start().then(() => { setStatus(c.status()); if (c.status().phase === 'failed') setNote({ kind: 'error', text: i18n.t('web.latency.failed') }); });
  };
  const stop = () => { cal.current?.abort(); setStatus(null); };

  /** Ghi kết quả vào thiết bị đang chọn (độ lệch mới thay hẳn độ lệch cũ, không cộng dồn). */
  const apply = (r: CalibrationResult) => {
    if (r.offsetMs === null || !active) return;
    onChange(updateProfile(prefs, active.id, { offsetMs: r.offsetMs })); setResult(null); setStatus(null);
  };
  const saveNew = (r: CalibrationResult) => {
    if (r.offsetMs === null) return;
    const next = addProfile(prefs, saveName.trim() || i18n.t('web.latency.defaultName', { n: prefs.profiles.length + 1 }), r.offsetMs, newId());
    if (!next) { setNote({ kind: 'error', text: i18n.t('web.latency.full', { n: MAX_PROFILES }) }); return; }
    onChange(next); setResult(null); setStatus(null); setSaveName('');
  };
  const onImport = async (f: File) => {
    setNote(null);
    if (f.size > MAX_PROFILE_FILE_BYTES) { setNote({ kind: 'error', text: i18n.t('web.latency.importFailed.tooLarge') }); return; }
    const r = parseProfile(await f.text());
    if (!r.ok) { setNote({ kind: 'error', text: i18n.t(`web.latency.importFailed.${r.reason}`) }); return; }
    const next = addProfile(prefs, r.name, r.offsetMs, newId());
    if (!next) { setNote({ kind: 'error', text: i18n.t('web.latency.full', { n: MAX_PROFILES }) }); return; }
    onChange(next); setNote({ kind: 'info', text: i18n.t('web.latency.imported', { name: next.profiles[next.profiles.length - 1].name }) });
  };
  const download = () => {
    if (!active) return;
    const url = URL.createObjectURL(new Blob([serializeProfile(active)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${(active.name.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'device')}.dawviz-device.json`; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const total = CAL.measuredBars;
  const bar = status && status.bar >= CAL.warmupBars ? status.bar - CAL.warmupBars + 1 : 0; // 0 = chưa tới ô đo đầu
  return (
    <div className="space-y-3" data-testid="device-latency">
      <div className="flex items-center gap-2">
        <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted">
          <span className="shrink-0">{i18n.t('web.latency.device')}</span>
          <Select wrapClassName="min-w-0 flex-1" className="truncate" value={prefs.activeId ?? ''} disabled={running} data-testid="device-select"
            onChange={(e) => onChange({ ...prefs, activeId: e.target.value || null })}>
            <option value="">{i18n.t('web.latency.none')}</option>
            {prefs.profiles.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.offsetMs > 0 ? '+' : ''}{p.offsetMs} ms)</option>)}
          </Select>
        </label>
      </div>

      {active && (
        <div className="grid grid-cols-[minmax(0,1fr)_6rem_1.5rem] items-center gap-x-3 gap-y-2 text-xs text-muted" data-testid="device-edit">
          <span>{i18n.t('web.latency.name')}</span>
          <span aria-hidden className="col-span-2" />
          <input type="text" aria-label={i18n.t('web.latency.name')} defaultValue={active.name} key={active.id + active.name} maxLength={MAX_PROFILE_NAME} data-testid="device-name"
            onBlur={(e) => { const v = e.target.value.trim(); if (!v) e.target.value = active.name; else if (v !== active.name) onChange(updateProfile(prefs, active.id, { name: v })); }}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
            className="col-span-3 w-full min-w-0 rounded border border-control bg-raised px-2 py-1 text-[13px] text-fg" />
          <span>{i18n.t('web.latency.offset')}</span>
          <NumberField label={i18n.t('web.latency.offset')} value={active.offsetMs} spec={{ min: -DEVICE_OFFSET_LIMIT_MS, max: DEVICE_OFFSET_LIMIT_MS, step: 1, units: { ms: 1 } }} range={[-200, 200]}
            onChange={(v) => onChange(updateProfile(prefs, active.id, { offsetMs: v }))} />
          <ResetButton label={i18n.t('web.latency.offset')} changed={active.offsetMs !== 0} onReset={() => onChange(updateProfile(prefs, active.id, { offsetMs: 0 }))} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={start} disabled={running} data-testid="latency-start">{i18n.t('web.latency.measure')}</button>
        {active && <button type="button" className={btn} onClick={download} disabled={running} data-testid="device-download">{i18n.t('web.latency.export')}</button>}
        <button type="button" className={btn} onClick={() => file.current?.click()} disabled={running} data-testid="device-import">{i18n.t('web.latency.import')}</button>
        {active && <button type="button" className="btn-ghost" onClick={() => onChange(removeProfile(prefs, active.id))} disabled={running} data-testid="device-delete">{i18n.t('web.latency.delete')}</button>}
        <input ref={file} type="file" accept=".json,application/json" hidden data-testid="device-file" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void onImport(f); }} />
      </div>

      {running && (
        <div className="space-y-2 rounded border border-line p-3" data-testid="latency-run">
          <button type="button" className="w-full rounded border border-accent bg-raised px-4 py-6 text-[15px] font-medium text-fg active:scale-[0.99]"
            onPointerDown={(e) => { e.preventDefault(); cal.current?.tap(e.timeStamp); }} onKeyDown={(e) => { if (e.code === 'Space' || e.key === 'Enter') e.preventDefault(); }} data-testid="latency-pad" autoFocus>
            {status?.phase === 'starting' ? i18n.t('web.latency.starting') : i18n.t('web.latency.pad')}
          </button>
          <p className="text-xs text-muted" role="status" data-testid="latency-progress">
            {status?.phase === 'running' && (bar === 0 ? i18n.t('web.latency.getReady') : i18n.t('web.latency.progress', { bar, total, taps: status.taps }))}
          </p>
          <button type="button" className="btn-ghost" onClick={stop} data-testid="latency-cancel">{i18n.t('web.latency.cancel')}</button>
        </div>
      )}

      {result && (
        <div className="space-y-2 rounded border border-line p-3" role="status" data-testid="latency-result">
          <p className="flex items-start gap-1.5 text-[13px] text-fg">
            {result.status !== 'ok' && <StatusIcon kind="warning" className="mt-px h-3.5 w-3.5 shrink-0 text-warning" />}
            <span>{result.status === 'tooFew'
              ? i18n.t('web.latency.result.tooFew', { valid: result.valid, total: result.total })
              : i18n.t(result.status === 'ok' ? 'web.latency.result.ok' : 'web.latency.result.unstable', { ms: i18n.number(result.offsetMs!), valid: result.valid, total: result.total, spread: i18n.number(result.spreadMs) })}</span>
          </p>
          {result.offsetMs !== null && (
            <div className="flex flex-wrap items-center gap-2">
              {active && <button type="button" className={btn} onClick={() => apply(result)} data-testid="latency-apply">{i18n.t('web.latency.apply', { name: active.name })}</button>}
              <input type="text" aria-label={i18n.t('web.latency.name')} placeholder={uniqueProfileName(prefs.profiles, i18n.t('web.latency.defaultName', { n: prefs.profiles.length + 1 }))} value={saveName} maxLength={MAX_PROFILE_NAME}
                onChange={(e) => setSaveName(e.target.value)} data-testid="latency-name" className="min-w-0 flex-1 rounded border border-control bg-raised px-2 py-1 text-[13px] text-fg" />
              <button type="button" className={btn} onClick={() => saveNew(result)} data-testid="latency-save">{i18n.t('web.latency.save')}</button>
            </div>
          )}
          <button type="button" className="btn-ghost" onClick={() => { setResult(null); setStatus(null); }} data-testid="latency-dismiss">{i18n.t('web.latency.dismiss')}</button>
        </div>
      )}

      {note && <p className={`flex items-start gap-1.5 text-xs ${note.kind === 'error' ? 'text-fg' : 'text-muted'}`} role="status" data-testid="latency-note">
        {note.kind === 'error' && <StatusIcon kind="warning" className="mt-px h-3.5 w-3.5 shrink-0 text-warning" />}{note.text}</p>}
    </div>
  );
}
