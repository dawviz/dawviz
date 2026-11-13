// Khung thả/chọn tệp dự án (kèm .mid ngoài); hiệu ứng Framer Motion.
// `compact`: sau khi đã nạp dự án, khung thu lại thành một nút nhỏ ở thanh trên (vẫn nhận kéo thả) để khung xem trước lên đầu trang.
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nProvider.tsx';

export interface Picked { main: File; extras: File[] }

const FORMATS = ['.als', '.alp', '.rpp', '.dawproject', '.mid'];

const UploadIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M12 15V4m0 0-4 4m4-4 4 4" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
);

export function FileDrop({ onPick, busy, compact = false }: { onPick(p: Picked): void; busy: boolean; compact?: boolean }) {
  const { i18n } = useI18n();
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const take = (list: FileList | null) => {
    if (!list || !list.length) return;
    const files = [...list];
    // Tệp .mid đi kèm một dự án khác (Reaper tham chiếu .mid ngoài) được coi là tệp phụ; nếu chỉ có một tệp thì nó là tệp chính.
    const main = files.find((f) => !/\.mid$/i.test(f.name)) ?? files[0];
    onPick({ main, extras: files.filter((f) => f !== main) });
  };

  const handlers = {
    role: 'button', tabIndex: 0, 'aria-busy': busy,
    onClick: () => input.current?.click(),
    onKeyDown: (e: React.KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && input.current?.click(),
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(true); },
    onDragLeave: () => setOver(false),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); },
  } as const;
  const fileInput = (
    <input ref={input} type="file" multiple className="hidden" data-testid="file-input"
      accept=".als,.alp,.rpp,.dawproject,.mid,.midi" onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
  );

  if (compact) {
    return (
      <motion.div {...handlers} layoutId="file-drop" title={i18n.t('web.drop.title')}
        className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${over ? 'border-accent-500 bg-accent-600/15 text-ink-50' : 'border-ink-700 bg-ink-900/70 text-ink-100 hover:border-ink-500'}`}>
        <UploadIcon className={`h-4 w-4 ${busy ? 'animate-pulse text-accent-400' : 'text-ink-300'}`} />
        <span className="whitespace-nowrap">{busy ? i18n.t('web.drop.busy') : i18n.t('web.drop.replace')}</span>
        {fileInput}
      </motion.div>
    );
  }

  return (
    <motion.div {...handlers} layoutId="file-drop"
      animate={{ scale: over ? 1.01 : 1 }}
      className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border border-dashed px-6 py-16 text-center transition-colors ${over ? 'border-accent-500 bg-accent-600/10' : 'border-ink-700 bg-ink-900/50 hover:border-ink-500 hover:bg-ink-900/80'}`}>
      <div className={`grid h-14 w-14 place-items-center rounded-2xl border transition ${over ? 'border-accent-500 bg-accent-600/20 text-accent-300' : 'border-ink-700 bg-ink-800 text-ink-300 group-hover:text-ink-100'}`}>
        <UploadIcon className={`h-6 w-6 ${busy ? 'animate-pulse' : ''}`} />
      </div>
      <p className="text-lg font-semibold tracking-tight text-ink-50">{busy ? i18n.t('web.drop.busy') : i18n.t('web.drop.title')}</p>
      <div className="flex flex-wrap justify-center gap-1.5" aria-hidden>
        {FORMATS.map((f) => <span key={f} className="rounded-md border border-ink-700 bg-ink-950/60 px-2 py-0.5 font-mono text-[11px] text-ink-300">{f}</span>)}
      </div>
      <p className="max-w-md text-sm leading-relaxed text-ink-300">{i18n.t('web.drop.hint')}</p>
      {fileInput}
    </motion.div>
  );
}
