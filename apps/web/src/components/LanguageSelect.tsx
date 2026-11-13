// Ô chọn ngôn ngữ giao diện.
import { useI18n } from '../i18n/I18nProvider.tsx';

export function LanguageSelect() {
  const { i18n, locale, setLocale, available } = useI18n();
  return (
    <label className="flex items-center gap-1.5 text-sm text-ink-300" title={i18n.t('web.lang')}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-4 w-4" aria-hidden>
        <circle cx="8" cy="8" r="6.25" /><path d="M1.75 8h12.5M8 1.75c1.8 1.9 2.6 3.9 2.6 6.25S9.8 12.35 8 14.25M8 1.75C6.2 3.65 5.4 5.65 5.4 8s.8 4.35 2.6 6.25" />
      </svg>
      <span className="sr-only">{i18n.t('web.lang')}</span>
      <select value={locale} onChange={(e) => setLocale(e.target.value)}
        className="rounded-md border border-ink-700 bg-ink-900 py-1 pl-2 text-ink-100 focus:outline-none focus:ring-2 focus:ring-accent-500">
        {available.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
      </select>
    </label>
  );
}
