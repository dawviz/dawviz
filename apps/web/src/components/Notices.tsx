// Lỗi và cảnh báo khi đọc tệp, đã dịch. Lỗi (chặn việc dùng tệp) hiện đầy đủ từng cái.
// Cảnh báo gộp thành MỘT dòng thu gọn (T-70): người dùng thấy có bao nhiêu cảnh báo mà sân khấu không bị đẩy xuống;
// mở ra mới thấy từng cảnh báo và chi tiết kỹ thuật. Luôn kèm biểu tượng, không để màu tự nói.
import { useI18n } from '../i18n/I18nProvider.tsx';
import { StatusIcon } from './StatusIcon.tsx';
import { ChevronRight, Info } from './Icons.tsx';
import type { Problem } from '../lib/problems.ts';

function Item({ p }: { p: Problem }) {
  const { i18n } = useI18n();
  return (
    <>
      <span>{p.text}</span>
      {p.technical && (
        <details className="mt-1 text-xs text-muted">
          <summary className="disclosure">{i18n.t('web.technical')}</summary>
          <code className="break-all">{p.code}: {p.technical}</code>
        </details>
      )}
    </>
  );
}

/** `basic`: ở chế độ Cơ bản, cảnh báo không đổi hình gộp vào một dòng thu gọn KHÔNG màu vàng (xám trung tính); cảnh báo có thể đổi hình
 *  vẫn ở nhóm vàng. Ở Nâng cao mọi cảnh báo nằm chung một nhóm. */
export function Notices({ problems, basic = false }: { problems: Problem[]; basic?: boolean }) {
  const { i18n } = useI18n();
  const errors = problems.filter((p) => p.kind === 'error');
  const all = problems.filter((p) => p.kind !== 'error');
  const notes = basic ? all.filter((p) => p.cosmetic) : [];
  const warnings = basic ? all.filter((p) => !p.cosmetic) : all;
  // Vùng aria-live luôn có mặt (kể cả khi rỗng) để trình đọc màn hình đọc được thông báo mới xuất hiện.
  return (
    <div className={problems.length ? 'space-y-2' : 'hidden'} aria-live="polite" data-testid="notices">
      {errors.map((p, i) => (
        <div key={`${p.code}-${i}`} role="alert" className="flex gap-2 rounded border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-fg">
          <StatusIcon kind="error" className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <div className="min-w-0"><Item p={p} /></div>
        </div>
      ))}
      {warnings.length > 0 && (
        <details className="group rounded border border-warning/60 bg-warning/10 text-sm text-fg" data-testid="notices-warnings">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-1.5">
            <StatusIcon kind="warning" className="h-4 w-4 shrink-0 text-warning" />
            <span className="min-w-0 flex-1 truncate">{i18n.t('web.notices.summary', { n: warnings.length })}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted transition-transform group-open:rotate-90" />
          </summary>
          <ul className="space-y-2 border-t border-warning/40 px-3 py-2">
            {warnings.map((p, i) => <li key={`${p.code}-${i}`} className="min-w-0"><Item p={p} /></li>)}
          </ul>
        </details>
      )}
      {notes.length > 0 && (
        <details className="group rounded border border-line bg-surface text-sm text-fg" data-testid="notices-notes">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-1.5 text-muted">
            <Info className="h-4 w-4 shrink-0" />
            <span className="min-w-0 flex-1 truncate">{i18n.t('web.notices.notes', { n: notes.length })}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-open:rotate-90" />
          </summary>
          <ul className="space-y-2 border-t border-line px-3 py-2">
            {notes.map((p, i) => <li key={`${p.code}-${i}`} className="min-w-0"><Item p={p} /></li>)}
          </ul>
        </details>
      )}
    </div>
  );
}
