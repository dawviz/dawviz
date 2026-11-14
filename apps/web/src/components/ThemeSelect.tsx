// "Giao diện ứng dụng" (REQ-UI-10, D-52): Sáng / Tối / Theo hệ thống và bảng màu nhấn. Chỉ đổi màu giao diện app,
// không đổi khung video. Đổi tức thì, không tải lại trang; lựa chọn lưu theo trình duyệt (public/theme-boot.js áp lúc mở).
// Thanh trên chỉ có nút sáng/tối (ThemeToggle); đủ lựa chọn nằm ở thẻ Settings (AppearanceSettings), theo UI-DIRECTION 5.3.
import { useEffect, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { loadPref, savePref } from '../lib/prefs.ts';
import { applyTheme, DEFAULT_THEME, PALETTES, resolveMode, sanitizeThemePref, THEME_MODES, type Palette, type ThemeMode, type ThemePref } from '../lib/theme.ts';
import { Moon, Sun } from './Icons.tsx';
import { radioKeys, radioTab } from '../lib/a11y.ts';

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

/** Nút sáng/tối ở thanh trên: đổi sang chế độ ngược với chế độ đang thấy (kể cả khi đang "Theo hệ thống"). */
export function ThemeToggle({ pref, onChange }: { pref: ThemePref; onChange(p: ThemePref): void }) {
  const { i18n } = useI18n();
  const dark = resolveMode(pref.mode, systemDark()) === 'dark';
  const label = dark ? i18n.t('web.theme.toLight') : i18n.t('web.theme.toDark');
  return (
    <button type="button" className="grid h-8 w-8 place-items-center rounded text-muted transition hover:bg-raised hover:text-fg"
      aria-label={label} title={label} data-testid="theme-toggle" onClick={() => onChange({ ...pref, mode: dark ? 'light' : 'dark' })}>
      {dark ? <Sun /> : <Moon />}
    </button>
  );
}

function Segmented<T extends string>({ label, value, options, name, onChange }: { label: string; value: T; options: readonly T[]; name(v: T): string; onChange(v: T): void }) {
  return (
    <div className="seg flex-wrap" role="radiogroup" aria-label={label} onKeyDown={radioKeys}>
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} tabIndex={radioTab(value === o)} onClick={() => onChange(o)}
          className="seg-btn px-3 text-[13px]">{name(o)}</button>
      ))}
    </div>
  );
}

/** Thẻ Settings: sáng/tối/theo hệ thống và bảng màu nhấn. */
export function AppearanceSettings({ pref, onChange }: { pref: ThemePref; onChange(p: ThemePref): void }) {
  const { i18n } = useI18n();
  return (
    <div className="space-y-3" data-testid="appearance-settings">
      <div className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-center gap-3 text-[13px] text-muted">
        <span>{i18n.t('web.theme.mode')}</span>
        <Segmented label={i18n.t('web.theme.mode')} value={pref.mode} options={THEME_MODES} name={(m) => i18n.t(`web.theme.${m}`)} onChange={(mode: ThemeMode) => onChange({ ...pref, mode })} />
        <span>{i18n.t('web.theme.palette')}</span>
        <Segmented label={i18n.t('web.theme.palette')} value={pref.palette} options={PALETTES} name={(p) => i18n.t(`web.theme.palette.${p}`)} onChange={(palette: Palette) => onChange({ ...pref, palette })} />
      </div>
    </div>
  );
}
