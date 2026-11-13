// REQ-UI-08: dự án Reaper tham chiếu file .mid ngoài mà người dùng chưa nạp → nói rõ thiếu tệp nào, hậu quả, và cho nạp thêm
// ngay tại chỗ (giữ nguyên tệp dự án, không phải chọn lại từ đầu). Cũng chỉ ra tệp đã nạp nhưng không khớp tên nào.
// Nút hành động nằm ở ĐẦU bảng (luôn thấy được dù danh sách dài); danh sách chỉ mở 4 tệp đầu, phần còn lại sau "+N tệp nữa".
import { useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import type { ExternalMidiInfo } from '../lib/externalMidi.ts';
import { StatusIcon } from './StatusIcon.tsx';

const SHOWN = 4;

export function MissingMidiPanel({ info, level, busy, onAdd }: { info: ExternalMidiInfo; level: 'error' | 'warning'; busy: boolean; onAdd(files: File[]): void }) {
  const { i18n } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const take = (list: FileList | null) => { const fs = [...(list ?? [])].filter((f) => /\.midi?$/i.test(f.name)); if (fs.length) onAdd(fs); };
  const tone = level === 'error' ? 'border-danger/60 bg-danger/10' : 'border-warning/60 bg-warning/10';
  const first = info.missing.slice(0, SHOWN), rest = info.missing.slice(SHOWN);
  const li = (f: string) => <li key={f} className="break-all">• {f}</li>;
  return (
    <section role="alert" data-testid="missing-midi" aria-busy={busy}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
      className={`rounded border px-4 py-3 text-sm text-fg ${tone} ${over ? 'border-dashed ring-2 ring-focus' : ''}`}>
      {info.missing.length > 0 && <>
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <h2 className="flex min-w-0 flex-1 items-start gap-2 text-[15px] font-semibold"><StatusIcon kind={level} className={`mt-0.5 h-4 w-4 shrink-0 ${level === 'error' ? 'text-danger' : 'text-warning'}`} /><span className="min-w-0">{i18n.t('web.missing.title', { n: info.missing.length })}</span></h2>
          <button type="button" disabled={busy} onClick={() => input.current?.click()}
            className="field shrink-0 px-3 py-1.5 text-[13px] font-semibold hover:border-line-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50">
            {busy ? i18n.t('web.drop.busy') : i18n.t('web.missing.add')}
          </button>
        </div>
        <p className="mt-1 text-muted">{i18n.t(level === 'error' ? 'web.missing.errorHint' : 'web.missing.warnHint')} {i18n.t('web.missing.dropHint')}</p>
        <ul className="mt-2 space-y-0.5 text-xs">
          {first.map(li)}
        </ul>
        {rest.length > 0 && (
          <details className="mt-0.5 text-xs text-muted">
            <summary className="disclosure inline-flex">{i18n.t('web.missing.more', { n: rest.length })}</summary>
            <ul className="mt-1 space-y-0.5">{rest.map(li)}</ul>
          </details>
        )}
      </>}
      {info.unused.length > 0 && (
        <p className={`text-xs text-muted ${info.missing.length ? 'mt-2' : ''}`} data-testid="missing-midi-unused">{i18n.t('web.missing.unused', { files: info.unused.join(', ') })}</p>
      )}
      <input ref={input} type="file" multiple accept=".mid,.midi" className="hidden" data-testid="missing-midi-input"
        onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
    </section>
  );
}
