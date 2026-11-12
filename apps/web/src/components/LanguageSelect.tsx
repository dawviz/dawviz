// Ô chọn ngôn ngữ giao diện.
import { useI18n } from '../i18n/I18nProvider.tsx';

export function LanguageSelect() {
  const { i18n, locale, setLocale, available } = useI18n();
  return (
    <label className="flex items-center gap-2 text-sm text-ink-300">
      <span>{i18n.t('web.lang')}</span>
      <select value={locale} onChange={(e) => setLocale(e.target.value)}
        className="rounded-md border border-ink-700 bg-ink-900 px-2 py-1 text-ink-100 focus:outline-none focus:ring-2 focus:ring-accent-500">
        {available.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
      </select>
    </label>
  );
}
