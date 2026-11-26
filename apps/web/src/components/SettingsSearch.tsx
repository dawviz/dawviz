// Ô "Tìm thiết lập" (REQ-UI-13, T-60) ở đầu inspector của Xem trước và bảng Thuộc tính của Editor. Câu tìm nằm trong `SettingsSearchContext`
// (App giữ, không lưu): mục inspector (`InspectorSection`) ẩn khi không có gì khớp, mục Thiết lập widget chỉ giữ ô khớp; khi đang tìm, phần
// nâng cao của mọi mục được hiện (App: `showAdv`), nên ở Cơ bản vẫn tìm thấy ô nâng cao. Xoá ô tìm thì mọi thứ về như cũ (không đổi dữ liệu).
import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';

export interface SettingsSearch { query: string; setQuery(q: string): void }
export const SettingsSearchContext = createContext<SettingsSearch>({ query: '', setQuery: () => {} });
export const useSettingsSearch = (): SettingsSearch => useContext(SettingsSearchContext);

/** Ô tìm: Esc xoá chữ (và không lọt ra Editor để bỏ chọn widget). */
export function SettingsSearchBox() {
  const { i18n } = useI18n();
  const { query, setQuery } = useSettingsSearch();
  return (
    <div className="shrink-0 border-b border-line px-4 py-1.5">
      <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} aria-label={i18n.t('web.search.label')} placeholder={i18n.t('web.search.placeholder')}
        onKeyDown={(e) => { if (e.key === 'Escape' && query) { e.preventDefault(); e.stopPropagation(); setQuery(''); } }}
        className="field min-h-[var(--hit)] w-full px-2 py-1 text-xs" data-testid="settings-search" />
    </div>
  );
}

/** Dòng "Không có thiết lập nào khớp" cuối bảng: hiện khi đang tìm mà không mục nào trong cùng bảng có kết quả. */
export function SearchEmpty() {
  const { i18n } = useI18n();
  const { query } = useSettingsSearch();
  const ref = useRef<HTMLParagraphElement>(null);
  const [none, setNone] = useState(false);
  useLayoutEffect(() => {
    const host = ref.current?.parentElement;
    if (!query.trim() || !host) { setNone(false); return; }
    const check = () => setNone(!host.querySelector('section[data-search-hit]'));
    check();
    const mo = new MutationObserver(check);
    mo.observe(host, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-search-hit'] });
    return () => mo.disconnect();
  }, [query]);
  return <p ref={ref} role="status" hidden={!(query.trim() && none)} className="px-4 py-3 text-xs text-muted" data-testid="settings-search-none">{query.trim() && none ? i18n.t('web.search.none', { q: query.trim() }) : ''}</p>;
}
