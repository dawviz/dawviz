// Context đa ngôn ngữ: nạp locales/*.json, chọn và lưu ngôn ngữ, đặt lang/dir cho <html>.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createI18n, matchLocale, type I18n } from '@dawviz/i18n';
import en from '../../../../locales/en.json';
import vi from '../../../../locales/vi.json';

// Danh mục nằm ở locales/ của monorepo (cộng đồng thêm ngôn ngữ bằng cách thêm file + dòng trong index.json, xem docs/I18N.md).
// Với ngôn ngữ mới: import thêm ở đây (hoặc chuyển sang import.meta.glob khi số ngôn ngữ tăng).
const catalogs = { en, vi } as unknown as Record<string, Record<string, string>>;
const AVAILABLE = Object.keys(catalogs);
const KEY = 'dawviz.lang';

function initialLocale(): string {
  try { const s = localStorage.getItem(KEY); if (s && AVAILABLE.includes(s)) return s; } catch { /* bộ nhớ bị chặn */ }
  return matchLocale(navigator.languages ?? [navigator.language], AVAILABLE, 'en');
}

interface Ctx { i18n: I18n; locale: string; setLocale(l: string): void; available: { code: string; name: string }[] }
const C = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLoc] = useState(initialLocale);
  const i18n = useMemo(() => createI18n({ locale, fallback: 'en', catalogs }), [locale]);
  useEffect(() => { document.documentElement.lang = locale; document.documentElement.dir = i18n.dir; }, [locale, i18n]);
  const setLocale = useCallback((l: string) => { setLoc(l); try { localStorage.setItem(KEY, l); } catch { /* bỏ qua */ } }, []);
  const available = useMemo(() => AVAILABLE.map((code) => ({ code, name: (catalogs[code] as any)['@meta']?.name ?? code })), []);
  return <C.Provider value={{ i18n, locale, setLocale, available }}>{children}</C.Provider>;
}
export function useI18n() {
  const c = useContext(C); if (!c) throw new Error('useI18n ngoài I18nProvider');
  return c;
}
