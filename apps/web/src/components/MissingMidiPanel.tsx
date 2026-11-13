// REQ-UI-08: dự án Reaper tham chiếu file .mid ngoài mà người dùng chưa nạp → nói rõ thiếu tệp nào, hậu quả, và cho nạp thêm
// ngay tại chỗ (giữ nguyên tệp dự án, không phải chọn lại từ đầu). Cũng chỉ ra tệp đã nạp nhưng không khớp tên nào.
import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { StatusIcon } from './StatusIcon.tsx';
import type { ExternalMidiInfo } from '../lib/externalMidi.ts';

export function MissingMidiPanel({ info, level, busy, onAdd }: { info: ExternalMidiInfo; level: 'error' | 'warning'; busy: boolean; onAdd(files: File[]): void }) {
  const { i18n } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const take = (list: FileList | null) => { const fs = [...(list ?? [])].filter((f) => /\.midi?$/i.test(f.name)); if (fs.length) onAdd(fs); };
  const tone = level === 'error' ? 'border-danger/60 bg-danger/10' : 'border-warning/60 bg-warning/10';
  return (
    <section role="alert" data-testid="missing-midi" aria-busy={busy}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
      className={`rounded border px-4 py-3 text-sm text-fg ${tone} ${over ? 'border-dashed ring-2 ring-focus' : ''}`}>
      {info.missing.length > 0 && <>
        <h2 className="flex items-center gap-2 font-semibold"><StatusIcon kind={level} className={`h-4 w-4 shrink-0 ${level === 'error' ? 'text-danger' : 'text-warning'}`} />{i18n.t('web.missing.title', { n: info.missing.length })}</h2>
        <p className="mt-0.5 text-muted">{i18n.t(level === 'error' ? 'web.missing.errorHint' : 'web.missing.warnHint')}</p>
        <ul className="mb-2 mt-2 space-y-0.5 font-mono text-xs">
          {info.missing.map((f) => <li key={f} className="break-all">• {f}</li>)}
        </ul>
      </>}
      {info.unused.length > 0 && (
        <p className="text-xs text-muted" data-testid="missing-midi-unused">{i18n.t('web.missing.unused', { files: info.unused.join(', ') })}</p>
      )}
      {info.missing.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy} onClick={() => input.current?.click()}
          className="rounded bg-accent px-3 py-1.5 font-medium text-on-accent hover:ring-1 hover:ring-line-strong hover:ring-offset-2 hover:ring-offset-page focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-page disabled:opacity-50 disabled:hover:ring-0">
          {busy ? i18n.t('web.drop.busy') : i18n.t('web.missing.add')}
        </button>
        <span className="text-xs text-muted">{i18n.t('web.missing.dropHint')}</span>
      </div>}
      <input ref={input} type="file" multiple accept=".mid,.midi" className="hidden" data-testid="missing-midi-input"
        onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
    </section>
  );
}
