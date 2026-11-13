// Danh sách lỗi/cảnh báo đã dịch, kèm chi tiết kỹ thuật gập lại.
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { StatusIcon } from './StatusIcon.tsx';
import type { Problem } from '../lib/problems.ts';

export function Notices({ problems }: { problems: Problem[] }) {
  const { i18n } = useI18n();
  return (
    <ul className="space-y-2" aria-live="polite">
      <AnimatePresence initial={false}>
        {problems.map((p, i) => (
          <motion.li key={`${p.code}-${i}`} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`flex gap-2 rounded border px-3 py-2 text-sm text-fg ${p.kind === 'error' ? 'border-danger/60 bg-danger/10' : 'border-warning/60 bg-warning/10'}`}>
            <StatusIcon kind={p.kind === 'error' ? 'error' : 'warning'} className={`mt-0.5 h-4 w-4 shrink-0 ${p.kind === 'error' ? 'text-danger' : 'text-warning'}`} />
            <div className="min-w-0">
            <span>{p.text}</span>
            {p.technical && (
              <details className="mt-1 text-xs text-muted">
                <summary className="cursor-pointer">{i18n.t('web.technical')}</summary>
                <code className="break-all">{p.code}: {p.technical}</code>
              </details>
            )}
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
