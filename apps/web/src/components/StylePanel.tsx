// Bảng tuỳ chỉnh kiểu dáng nốt (toàn cục) và bàn phím. Chỉ sửa dữ liệu StyleConfig; việc vẽ nằm ở Render Core.
import { STYLE_PRESETS, DEFAULT_NOTE_STYLE, type StyleConfig, type NoteStyle, type ColorMode, type KeyboardStyle } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';

const MODES: ColorMode[] = ['track', 'custom', 'pitch', 'velocity'];
const PRESETS = Object.keys(STYLE_PRESETS);

function Slider({ id, label, value, min, max, step, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange(v: number): void }) {
  return (
    <label className="grid grid-cols-[7rem_minmax(0,1fr)_2.5rem] items-center gap-2 text-xs text-ink-300" htmlFor={id}>
      <span className="truncate" title={label}>{label}</span>
      <input id={id} className="w-full min-w-0" type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <output className="text-right tabular-nums text-ink-100">{Number.isInteger(step) ? value : value.toFixed(2)}</output>
    </label>
  );
}

export function StylePanel({ style, keyboard, onStyle, onKeyboard }: { style: StyleConfig; keyboard: KeyboardStyle; onStyle(next: StyleConfig): void; onKeyboard(next: KeyboardStyle): void }) {
  const { i18n } = useI18n();
  const b = style.base;
  const set = (patch: Partial<NoteStyle>) => onStyle({ ...style, base: { ...b, ...patch } });
  return (
    <section aria-label={i18n.t('web.style.title')} className="space-y-2 rounded-xl border border-ink-700 bg-ink-900 p-3" data-testid="style-panel">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-ink-300">{i18n.t('web.style.title')}</h2>
        <button type="button" className="text-xs text-ink-300 underline" onClick={() => onStyle({ base: { ...DEFAULT_NOTE_STYLE }, tracks: {} })}>{i18n.t('web.style.reset')}</button>
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={i18n.t('web.style.presets')}>
        {PRESETS.map((p) => (
          <button key={p} type="button" onClick={() => onStyle({ ...style, base: { ...DEFAULT_NOTE_STYLE, ...STYLE_PRESETS[p] } })}
            className="rounded-full border border-ink-700 px-2.5 py-0.5 text-xs text-ink-100 hover:border-ink-300">{i18n.t(`web.style.preset.${p}`)}</button>
        ))}
      </div>
      <label className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2 text-xs text-ink-300">
        <span>{i18n.t('web.style.colorMode')}</span>
        <span className="flex min-w-0 items-center gap-2">
          <select value={b.colorMode} onChange={(e) => set({ colorMode: e.target.value as ColorMode })} className="min-w-0 max-w-full rounded border border-ink-700 bg-ink-950 px-1.5 py-0.5 text-ink-100">
            {MODES.map((m) => <option key={m} value={m}>{i18n.t(`web.style.mode.${m}`)}</option>)}
          </select>
          {b.colorMode === 'custom' && <input type="color" aria-label={i18n.t('web.style.customColor')} value={b.customColor} onChange={(e) => set({ customColor: e.target.value })} />}
        </span>
      </label>
      <Slider id="st-opacity" label={i18n.t('web.style.opacity')} value={b.opacity} min={0} max={1} step={0.05} onChange={(v) => set({ opacity: v })} />
      <Slider id="st-inactive" label={i18n.t('web.style.inactiveOpacity')} value={b.inactiveOpacity} min={0} max={1} step={0.05} onChange={(v) => set({ inactiveOpacity: v })} />
      <Slider id="st-height" label={i18n.t('web.style.heightScale')} value={b.heightScale} min={0.1} max={1.5} step={0.05} onChange={(v) => set({ heightScale: v })} />
      <Slider id="st-radius" label={i18n.t('web.style.cornerRadius')} value={Math.min(b.cornerRadius, 20)} min={0} max={20} step={1} onChange={(v) => set({ cornerRadius: v })} />
      <Slider id="st-glow" label={i18n.t('web.style.glow')} value={b.glow} min={0} max={1} step={0.05} onChange={(v) => set({ glow: v })} />
      <Slider id="st-glowr" label={i18n.t('web.style.glowRadius')} value={b.glowRadius} min={0} max={40} step={1} onChange={(v) => set({ glowRadius: v })} />
      <Slider id="st-border" label={i18n.t('web.style.borderWidth')} value={b.borderWidth} min={0} max={6} step={0.5} onChange={(v) => set({ borderWidth: v })} />
      <label className="flex items-center gap-2 text-xs text-ink-300">
        <input type="checkbox" checked={b.glowActiveOnly} onChange={(e) => set({ glowActiveOnly: e.target.checked })} />{i18n.t('web.style.glowActiveOnly')}
      </label>
      <div className="border-t border-ink-700 pt-2">
        <label className="flex items-center gap-2 text-xs text-ink-300">
          <input type="checkbox" checked={keyboard.enabled} onChange={(e) => onKeyboard({ ...keyboard, enabled: e.target.checked })} />{i18n.t('web.keyboard.show')}
        </label>
      </div>
    </section>
  );
}
