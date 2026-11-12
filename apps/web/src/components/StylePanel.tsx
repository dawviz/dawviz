// Bảng tuỳ chỉnh kiểu dáng nốt (toàn cục) và bàn phím. Chỉ sửa dữ liệu StyleConfig; việc vẽ nằm ở Render Core.
import { STYLE_PRESETS, DEFAULT_NOTE_STYLE, GLOW_SOURCES, type StyleConfig, type NoteStyle, type ColorMode, type KeyboardStyle, type GlowSource, type GlowPanMode } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { SliderField as Slider } from './SliderField.tsx';

const MODES: ColorMode[] = ['track', 'custom', 'pitch', 'velocity'];
const PRESETS = Object.keys(STYLE_PRESETS);

/** `lanes`: tên lane automation có trong dự án đang mở (cho nguồn phát sáng "automation"). */
export function StylePanel({ style, keyboard, onStyle, onKeyboard, lanes = [] }: { style: StyleConfig; keyboard: KeyboardStyle; onStyle(next: StyleConfig): void; onKeyboard(next: KeyboardStyle): void; lanes?: string[] }) {
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
      <Slider id="st-radius" label={i18n.t('web.style.cornerRadius')} value={b.cornerRadius} min={0} max={20} hardMax={999} step={1} onChange={(v) => set({ cornerRadius: v })} />
      <Slider id="st-glow" label={i18n.t('web.style.glow')} value={b.glow} min={0} max={1} step={0.05} onChange={(v) => set({ glow: v })} />
      <Slider id="st-glowr" label={i18n.t('web.style.glowRadius')} value={b.glowRadius} min={0} max={40} hardMax={64} step={1} onChange={(v) => set({ glowRadius: v })} />
      <Slider id="st-border" label={i18n.t('web.style.borderWidth')} value={b.borderWidth} min={0} max={6} hardMax={8} step={0.5} onChange={(v) => set({ borderWidth: v })} />
      <GlowSection b={b} set={set} lanes={lanes} />
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

const sel = 'min-w-0 max-w-full rounded border border-ink-700 bg-ink-950 px-1.5 py-0.5 text-ink-100';

/** REQ-GRAPHICS-17: đều nhau (mặc định) hoặc phát sáng động khi thanh phát chạm nốt, theo một tiêu chí. */
function GlowSection({ b, set, lanes }: { b: NoteStyle; set(p: Partial<NoteStyle>): void; lanes: string[] }) {
  const { i18n } = useI18n();
  const dyn = b.glowMode === 'dynamic';
  const laneList = lanes.includes(b.glowLane) ? lanes : [b.glowLane, ...lanes];
  return (
    <div className="space-y-2 rounded-lg border border-ink-700/70 p-2" data-testid="glow-section">
      <div className="space-y-1 text-xs text-ink-300">
        <span className="block">{i18n.t('web.glow.mode')}</span>
        <div className="flex min-w-0 gap-1" role="radiogroup" aria-label={i18n.t('web.glow.mode')}>
          {(['uniform', 'dynamic'] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={b.glowMode === m} onClick={() => set({ glowMode: m })}
              className={`min-w-0 flex-1 truncate rounded-full border px-2 py-0.5 ${b.glowMode === m ? 'border-accent-500 bg-accent-600/20 text-ink-50' : 'border-ink-700 text-ink-300 hover:border-ink-500'}`}>
              {i18n.t(`web.glow.mode.${m}`)}
            </button>
          ))}
        </div>
      </div>
      {dyn && <>
        <label className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2 text-xs text-ink-300">
          <span className="truncate">{i18n.t('web.glow.source')}</span>
          <select value={b.glowSource} onChange={(e) => set({ glowSource: e.target.value as GlowSource })} className={sel}>
            {GLOW_SOURCES.map((s) => <option key={s} value={s}>{i18n.t(`web.glow.source.${s}`)}</option>)}
          </select>
        </label>
        {b.glowSource === 'automation' && (
          <label className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2 text-xs text-ink-300">
            <span className="truncate">{i18n.t('web.glow.lane')}</span>
            <select value={b.glowLane} onChange={(e) => set({ glowLane: e.target.value })} className={sel}>
              {laneList.map((l) => <option key={l} value={l}>{i18n.has(`web.glow.lane.${l}`) ? i18n.t(`web.glow.lane.${l}`) : l}{lanes.includes(l) ? '' : ` (${i18n.t('web.glow.lane.absent')})`}</option>)}
            </select>
          </label>
        )}
        {(b.glowSource === 'pan' || (b.glowSource === 'automation' && b.glowLane === 'pan')) && (
          <label className="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2 text-xs text-ink-300">
            <span className="truncate">{i18n.t('web.glow.panMode')}</span>
            <select value={b.glowPanMode} onChange={(e) => set({ glowPanMode: e.target.value as GlowPanMode })} className={sel}>
              {(['lr', 'spread'] as const).map((m) => <option key={m} value={m}>{i18n.t(`web.glow.panMode.${m}`)}</option>)}
            </select>
          </label>
        )}
        <p className="text-[11px] leading-snug text-ink-300/80">{i18n.t(b.glowSource === 'pan' ? `web.glow.hint.pan.${b.glowPanMode}` : `web.glow.hint.${b.glowSource}`)}</p>
        <Slider id="st-gmin" label={i18n.t('web.glow.min')} value={b.glowMin} min={0} max={1} step={0.05} onChange={(v) => set({ glowMin: v })} />
        <Slider id="st-gmax" label={i18n.t('web.glow.max')} value={b.glowMax} min={0} max={1} step={0.05} onChange={(v) => set({ glowMax: v })} />
        <label className="flex items-center gap-2 text-xs text-ink-300">
          <input type="checkbox" checked={b.glowInvert} onChange={(e) => set({ glowInvert: e.target.checked })} />{i18n.t('web.glow.invert')}
        </label>
      </>}
      <Slider id="st-grel" label={i18n.t('web.glow.release')} value={b.glowRelease} min={0} max={2} hardMax={4} step={0.05} onChange={(v) => set({ glowRelease: v })} />
    </div>
  );
}
