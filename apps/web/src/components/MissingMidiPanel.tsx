// REQ-UI-08: dự án Reaper tham chiếu file .mid ngoài mà người dùng chưa nạp → nói rõ thiếu tệp nào, hậu quả, và cho nạp thêm
// ngay tại chỗ (giữ nguyên tệp dự án, không phải chọn lại từ đầu). Cũng chỉ ra tệp đã nạp nhưng không khớp tên nào.
import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import type { ExternalMidiInfo } from '../lib/externalMidi.ts';

export function MissingMidiPanel({ info, level, busy, onAdd }: { info: ExternalMidiInfo; level: 'error' | 'warning'; busy: boolean; onAdd(files: File[]): void }) {
  const { i18n } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const take = (list: FileList | null) => { const fs = [...(list ?? [])].filter((f) => /\.midi?$/i.test(f.name)); if (fs.length) onAdd(fs); };
  const tone = level === 'error' ? 'border-red-500/50 bg-red-500/10 text-red-50' : 'border-amber-500/50 bg-amber-500/10 text-amber-50';
  return (
    <section role="alert" data-testid="missing-midi" aria-busy={busy}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
      className={`rounded-xl border-2 px-4 py-3 text-sm ${tone} ${over ? 'border-dashed ring-2 ring-accent-400' : ''}`}>
      {info.missing.length > 0 && <>
        <h2 className="font-semibold">{i18n.t('web.missing.title', { n: info.missing.length })}</h2>
        <p className="mt-0.5 opacity-90">{i18n.t(level === 'error' ? 'web.missing.errorHint' : 'web.missing.warnHint')}</p>
        <ul className="mb-2 mt-2 space-y-0.5 font-mono text-xs">
          {info.missing.map((f) => <li key={f} className="break-all">• {f}</li>)}
        </ul>
      </>}
      {info.unused.length > 0 && (
        <p className="text-xs opacity-90" data-testid="missing-midi-unused">{i18n.t('web.missing.unused', { files: info.unused.join(', ') })}</p>
      )}
      {info.missing.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" disabled={busy} onClick={() => input.current?.click()}
          className="rounded-lg bg-accent-600 px-3 py-1.5 font-medium text-white hover:bg-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-400 disabled:opacity-50">
          {busy ? i18n.t('web.drop.busy') : i18n.t('web.missing.add')}
        </button>
        <span className="text-xs opacity-80">{i18n.t('web.missing.dropHint')}</span>
      </div>}
      <input ref={input} type="file" multiple accept=".mid,.midi" className="hidden" data-testid="missing-midi-input"
        onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
    </section>
  );
}
