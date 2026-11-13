// "Giao diện ứng dụng" (REQ-UI-10, D-52): Sáng / Tối / Theo hệ thống và bảng màu nhấn. Chỉ đổi màu giao diện app,
// không đổi khung video. Đổi tức thì, không tải lại trang; lựa chọn lưu theo trình duyệt (public/theme-boot.js áp lúc mở).
// Ở T-70 bảng màu chuyển vào thẻ Settings; thanh trên giữ nút sáng/tối.
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { Select } from './Select.tsx';
import { loadPref, savePref } from '../lib/prefs.ts';
import { applyTheme, DEFAULT_THEME, PALETTES, sanitizeThemePref, THEME_MODES, type Palette, type ThemeMode, type ThemePref } from '../lib/theme.ts';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const systemDark = () => typeof matchMedia === 'function' && matchMedia(DARK_QUERY).matches;

export function useTheme(): [ThemePref, (p: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(() => sanitizeThemePref(loadPref('theme', DEFAULT_THEME)));
  useEffect(() => {
    applyTheme(document.documentElement, pref, systemDark());
    savePref('theme', pref);
    if (pref.mode !== 'system' || typeof matchMedia !== 'function') return;
    const mq = matchMedia(DARK_QUERY);
    const onChange = () => applyTheme(document.documentElement, pref, mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [pref]);
  return [pref, setPref];
}

const SunMoon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" className="h-4 w-4" aria-hidden>
    <circle cx="8" cy="8" r="5.75" /><path d="M8 2.25a5.75 5.75 0 0 0 0 11.5Z" fill="currentColor" />
  </svg>
);

export function ThemeSelect() {
  const { i18n } = useI18n();
  const [pref, setPref] = useTheme();
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted" role="group" aria-label={i18n.t('web.theme')}>
      <span title={i18n.t('web.theme')}><SunMoon /></span>
      <label>
        <span className="sr-only">{i18n.t('web.theme.mode')}</span>
        <Select value={pref.mode} onChange={(e) => setPref({ ...pref, mode: e.target.value as ThemeMode })} className="py-1 pl-2" data-testid="theme-mode">
          {THEME_MODES.map((m) => <option key={m} value={m}>{i18n.t(`web.theme.${m}`)}</option>)}
        </Select>
      </label>
      <label>
        <span className="sr-only">{i18n.t('web.theme.palette')}</span>
        <Select value={pref.palette} onChange={(e) => setPref({ ...pref, palette: e.target.value as Palette })} className="py-1 pl-2" data-testid="theme-palette">
          {PALETTES.map((p) => <option key={p} value={p}>{i18n.t(`web.theme.palette.${p}`)}</option>)}
        </Select>
      </label>
    </div>
  );
}
