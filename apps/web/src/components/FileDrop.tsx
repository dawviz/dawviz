// Khung thả/chọn tệp dự án (kèm .mid ngoài); hiệu ứng Framer Motion.
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nProvider.tsx';

export interface Picked { main: File; extras: File[] }

export function FileDrop({ onPick, busy }: { onPick(p: Picked): void; busy: boolean }) {
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

  return (
    <motion.div
      role="button" tabIndex={0} aria-busy={busy}
      onClick={() => input.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && input.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); }}
      animate={{ scale: over ? 1.015 : 1, borderColor: over ? '#4aa8f5' : '#2a2f42' }}
      whileHover={{ borderColor: '#5b627a' }}
      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-ink-900/60 px-6 py-12 text-center">
      <p className="text-lg font-medium">{busy ? i18n.t('web.drop.busy') : i18n.t('web.drop.title')}</p>
      <p className="max-w-md text-sm text-ink-300">{i18n.t('web.drop.hint')}</p>
      <input ref={input} type="file" multiple className="hidden" data-testid="file-input"
        accept=".als,.alp,.rpp,.dawproject,.mid,.midi" onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
    </motion.div>
  );
}
