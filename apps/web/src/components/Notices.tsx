// Danh sách lỗi/cảnh báo đã dịch, kèm chi tiết kỹ thuật gập lại.
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nProvider.tsx';
import type { Problem } from '../lib/problems.ts';

export function Notices({ problems }: { problems: Problem[] }) {
  const { i18n } = useI18n();
  return (
    <ul className="space-y-2" aria-live="polite">
      <AnimatePresence initial={false}>
        {problems.map((p, i) => (
          <motion.li key={`${p.code}-${i}`} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`rounded-lg border px-3 py-2 text-sm ${p.kind === 'error' ? 'border-red-500/40 bg-red-500/10 text-red-100' : 'border-amber-500/40 bg-amber-500/10 text-amber-100'}`}>
            <span>{p.text}</span>
            {p.technical && (
              <details className="mt-1 text-xs opacity-70">
                <summary className="cursor-pointer">{i18n.t('web.technical')}</summary>
                <code className="break-all">{p.code}: {p.technical}</code>
              </details>
            )}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
