// Mục "Hình thức" của inspector: kiểu dáng nốt (toàn cục) và bàn phím. Chỉ sửa dữ liệu StyleConfig; việc vẽ nằm ở Render Core.
// Phân bổ Cơ bản / Nâng cao theo SRS REQ-UI-13 (dòng "Kiểu nốt", "Bàn phím"). Phong cách dựng sẵn chọn ở cột Video styles.
import { GLOW_SOURCES, type StyleConfig, type NoteStyle, type ColorMode, type KeyboardStyle, type GlowSource, type GlowPanMode } from '@dawviz/render-core';
import { ColorField } from './ColorField.tsx';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { laneLabel, type LaneChoice } from '../lib/animateFields.ts';
import { radioKeys, radioTab } from '../lib/a11y.ts';
import { matchNotePreset } from '../lib/videoScenes.ts';
import { Select } from './Select.tsx';
import { ResetButton, TickField } from './Inspector.tsx';
import { SliderField as Slider } from './SliderField.tsx';
import { PitchField } from './PitchField.tsx';
import type { PitchRange } from '../lib/commands.ts';

const MODES: ColorMode[] = ['track', 'custom', 'pitch', 'velocity'];
/** Trường chỉ có ở Nâng cao (REQ-UI-13). Dùng để biết phần nâng cao đang khác mặc định hay không. */
export const ADVANCED_STYLE_KEYS: readonly (keyof NoteStyle)[] = ['inactiveOpacity', 'glowRadius', 'borderWidth', 'glowActiveOnly', 'glowMin', 'glowMax', 'glowInvert', 'glowRelease', 'glowLane', 'glowPanMode'];
// Cùng lưới với dòng số (SliderField): nhãn | điều khiển | ô ↺, để cột ↺ thẳng hàng ở mọi dòng.
const row = 'grid grid-cols-[minmax(0,1fr)_minmax(0,9.5rem)_1.5rem] items-center gap-2 text-xs text-muted';

/** `lanes`: tên lane automation có trong dự án đang mở (cho nguồn phát sáng "automation").
 *  `playhead`: vị trí vạch phát (0..1) và hàm đổi; bàn phím bật thì cả hai ô vạch phát bị ẩn (T-71).
 *  `advanced`: hiện cả dòng nâng cao (chế độ Nâng cao, hoặc "Thêm tuỳ chọn" của mục đang mở).
 *  `reference`: kiểu nốt của bộ dựng sẵn đang chọn; thông số khác nó thì có nút ↺ đưa về (D-57). */
export function StylePanel({ style, keyboard, onStyle, onKeyboard, lanes = [], laneInfo = [], advanced = true, notePresets, onNotePreset, playhead, reference, keyboardRef, pitchRange }: { /** Dải cao độ Piano Roll: Fit content hoặc Custom (nhập theo tên nốt). */ pitchRange?: { value: PitchRange; reference?: PitchRange; onChange(next: PitchRange): void }; reference?: NoteStyle; /** Bàn phím bật/tắt của bộ dựng sẵn áp gần nhất (đích của ↺ ở ô tick Bàn phím). */ keyboardRef?: boolean; playhead?: { ratio: number; visible: boolean; scrollMode: 'SCROLL' | 'PAGE'; scrollModeRef?: 'SCROLL' | 'PAGE'; onScrollMode(m: 'SCROLL' | 'PAGE'): void; visibleSeconds: number; visibleSecondsRef?: number; onVisibleSeconds(v: number): void; /** Chế độ trang: đơn vị trang, số ô nhịp mỗi trang, thời gian nốt hiện trước (T-84). */ page?: { unit: 'SECONDS' | 'BARS'; bars: number; reveal: number; unitRef?: 'SECONDS' | 'BARS'; barsRef?: number; revealRef?: number; onUnit(u: 'SECONDS' | 'BARS'): void; onBars(n: number): void; onReveal(s: number): void }; /** Vạch phát hiện/ẩn của bộ dựng sẵn áp gần nhất. */ visibleRef?: boolean; reference?: number; onChange(ratio: number): void; onVisible(visible: boolean): void }; notePresets?: readonly string[]; onNotePreset?(id: string): void; style: StyleConfig; keyboard: KeyboardStyle; onStyle(next: StyleConfig): void; onKeyboard(next: KeyboardStyle): void; lanes?: string[]; /** Tên lane của dự án (T-66): ô chọn lane gọi theo tên ("Mod Wheel (CC1)"). */ laneInfo?: readonly LaneChoice[]; advanced?: boolean }) {
  const { i18n } = useI18n();
  const b = style.base;
  const set = (patch: Partial<NoteStyle>) => onStyle({ ...style, base: { ...b, ...patch } });
  const ref = (k: keyof NoteStyle) => { const v = reference?.[k]; return typeof v === 'number' ? v : undefined; };
  return (
    <div className="space-y-2.5" data-testid="style-panel">
      <h3 className="pt-1 text-xs font-medium text-fg">{i18n.t('web.look.notes')}</h3>
      {notePresets && onNotePreset && (
        <label className={row}>
          <span>{i18n.t('web.style.presets')}</span>
          <Select value={notePresets.includes(matchNotePreset(b)) ? matchNotePreset(b) : 'custom'} onChange={(e) => e.target.value !== 'custom' && onNotePreset(e.target.value)} className="py-1 pl-2" wrapClassName="min-w-0" data-testid="note-preset">
            {matchNotePreset(b) === 'custom' && <option value="custom">{i18n.t('web.style.preset.custom')}</option>}
            {notePresets.map((id) => <option key={id} value={id}>{i18n.t(`web.style.preset.${id}`)}</option>)}
          </Select>
          <span aria-hidden />
        </label>
      )}
      <label className={row}>
        <span>{i18n.t('web.style.colorMode')}</span>
        <span className="flex min-w-0 items-center gap-2">
          <Select value={b.colorMode} onChange={(e) => set({ colorMode: e.target.value as ColorMode })} className="py-1 pl-2" wrapClassName="min-w-0 flex-1">
            {MODES.map((m) => <option key={m} value={m}>{i18n.t(`web.style.mode.${m}`)}</option>)}
          </Select>
          {b.colorMode === 'custom' && <ColorField variant="swatch" label={i18n.t('web.style.customColor')} value={b.customColor} onChange={(c) => set({ customColor: c })} />}
        </span>
        <ResetButton label={i18n.t('web.style.colorMode')} changed={!!reference && (reference.colorMode !== b.colorMode || (b.colorMode === 'custom' && reference.customColor !== b.customColor))}
          onReset={() => set({ colorMode: reference!.colorMode, customColor: reference!.customColor })} />
      </label>
      <Slider id="st-opacity" label={i18n.t('web.style.opacity')} value={b.opacity} min={0} max={1} step={0.05} reset={ref('opacity')} onChange={(v) => set({ opacity: v })} />
      {advanced && <Slider id="st-inactive" label={i18n.t('web.style.inactiveOpacity')} value={b.inactiveOpacity} min={0} max={1} step={0.05} reset={ref('inactiveOpacity')} onChange={(v) => set({ inactiveOpacity: v })} />}
      <Slider id="st-height" label={i18n.t('web.style.heightScale')} value={b.heightScale} min={0.1} max={1.5} step={0.05} reset={ref('heightScale')} onChange={(v) => set({ heightScale: v })} />
      <Slider id="st-radius" label={i18n.t('web.style.cornerRadius')} value={b.cornerRadius} min={0} max={20} hardMax={999} step={1} reset={ref('cornerRadius')} onChange={(v) => set({ cornerRadius: v })} />
      {advanced && <Slider id="st-border" label={i18n.t('web.style.borderWidth')} value={b.borderWidth} min={0} max={6} hardMax={8} step={0.5} reset={ref('borderWidth')} onChange={(v) => set({ borderWidth: v })} />}
      {pitchRange && <PitchRangeRows {...pitchRange} />}
      <div className="border-t border-line" />
      <h3 className="pt-1 text-xs font-medium text-fg">{i18n.t('web.look.glow')}</h3>
      <Slider id="st-glow" label={i18n.t('web.style.glow')} value={b.glow} min={0} max={1} step={0.05} reset={ref('glow')} onChange={(v) => set({ glow: v })} />
      {advanced && <Slider id="st-glowr" label={i18n.t('web.style.glowRadius')} value={b.glowRadius} min={0} max={40} hardMax={64} step={1} reset={ref('glowRadius')} onChange={(v) => set({ glowRadius: v })} />}
      <GlowSection b={b} set={set} lanes={lanes} laneInfo={laneInfo} advanced={advanced} reference={reference} />
      {advanced && <TickField label={i18n.t('web.style.glowActiveOnly')} checked={b.glowActiveOnly} onChange={(v) => set({ glowActiveOnly: v })} reference={reference?.glowActiveOnly} />}
      <div className="space-y-2 border-t border-line pt-2.5">
        <TickField label={i18n.t('web.keyboard.show')} checked={keyboard.enabled} onChange={(v) => onKeyboard({ ...keyboard, enabled: v })} reference={keyboardRef} />
        {/* Bàn phím bật: vạch phát ghim ở mép bàn phím (Render Core bỏ qua tỉ lệ và nốt phát đúng lúc chạm phím) nên không còn gì để chỉnh: ẩn cả hai ô thay vì khoá. Giá trị vẫn giữ để dùng lại khi tắt bàn phím. */}
        {playhead && <>
          <div className="space-y-1.5" data-testid="scroll-mode">
            <div className="flex items-center justify-between gap-2 text-xs text-muted">
              <span>{i18n.t('web.scroll.title')}</span>
              <ResetButton label={i18n.t('web.scroll.title')} changed={playhead.scrollModeRef !== undefined && playhead.scrollModeRef !== playhead.scrollMode} onReset={() => playhead.onScrollMode(playhead.scrollModeRef!)} />
            </div>
            <div className="seg w-full" role="radiogroup" aria-label={i18n.t('web.scroll.title')} onKeyDown={radioKeys}>
              {(['SCROLL', 'PAGE'] as const).map((m) => (
                <button key={m} type="button" role="radio" aria-checked={playhead.scrollMode === m} tabIndex={radioTab(playhead.scrollMode === m)} onClick={() => playhead.onScrollMode(m)} className="seg-btn flex-1" data-testid={`scroll-${m}`}>
                  {i18n.t(`web.scroll.${m}`)}
                </button>
              ))}
            </div>
          </div>
          {playhead.scrollMode === 'PAGE' && playhead.page && (
            <div className="space-y-1.5" data-testid="page-unit">
              <div className="flex items-center justify-between gap-2 text-xs text-muted">
                <span>{i18n.t('web.page.pageUnit')}</span>
                <ResetButton label={i18n.t('web.page.pageUnit')} changed={playhead.page.unitRef !== undefined && playhead.page.unitRef !== playhead.page.unit} onReset={() => playhead.page!.onUnit(playhead.page!.unitRef!)} />
              </div>
              <div className="seg w-full" role="radiogroup" aria-label={i18n.t('web.page.pageUnit')} onKeyDown={radioKeys}>
                {(['SECONDS', 'BARS'] as const).map((u) => (
                  <button key={u} type="button" role="radio" aria-checked={playhead.page!.unit === u} tabIndex={radioTab(playhead.page!.unit === u)} onClick={() => playhead.page!.onUnit(u)} className="seg-btn flex-1" data-testid={`page-unit-${u}`}>
                    {i18n.t(`web.page.unit.${u}`)}
                  </button>
                ))}
              </div>
            </div>
          )}
          {playhead.scrollMode === 'PAGE' && playhead.page?.unit === 'BARS'
            ? <Slider id="st-page-bars" label={i18n.t('web.page.pageBars')} value={playhead.page.bars} min={1} max={16} hardMax={32} step={1} reset={playhead.page.barsRef} onChange={playhead.page.onBars} />
            : <Slider id="st-visible" label={i18n.t(playhead.scrollMode === 'PAGE' ? 'web.visible.page' : 'web.visible.label')} value={playhead.visibleSeconds} min={0.5} max={20} hardMax={60} step={0.1} reset={playhead.visibleSecondsRef} onChange={playhead.onVisibleSeconds} />}
          {playhead.scrollMode === 'PAGE' && playhead.page && <Slider id="st-reveal" label={i18n.t('web.page.revealAhead')} value={playhead.page.reveal} min={0} max={8} hardMax={30} step={0.1} reset={playhead.page.revealRef} onChange={playhead.page.onReveal} />}
          {/* Chế độ cuộn + bàn phím: vạch ghim ở mép bàn phím, không còn gì để chỉnh. Chế độ trang: vạch chạy nên chỉ còn ô hiện/ẩn. */}
          {(!keyboard.enabled || playhead.scrollMode === 'PAGE') && <TickField label={i18n.t('web.playhead.show')} checked={playhead.visible} onChange={playhead.onVisible} reference={playhead.visibleRef} testId="playhead-visible" />}
          {playhead.scrollMode === 'SCROLL' && !keyboard.enabled && playhead.visible && <Slider id="st-playhead" label={i18n.t('web.playhead.position')} value={Math.round(playhead.ratio * 100)} min={5} max={95} step={1} reset={playhead.reference === undefined ? undefined : Math.round(playhead.reference * 100)}
            onChange={(v) => playhead.onChange(v / 100)} />}
        </>}
      </div>
    </div>
  );
}

/** REQ-GRAPHICS-17: đều nhau (mặc định) hoặc phát sáng động khi thanh phát chạm nốt, theo một tiêu chí. */
function GlowSection({ b, set, lanes, laneInfo, advanced, reference }: { b: NoteStyle; set(p: Partial<NoteStyle>): void; lanes: string[]; laneInfo: readonly LaneChoice[]; advanced: boolean; reference?: NoteStyle }) {
  const { i18n } = useI18n();
  const ref = (k: 'glowMin' | 'glowMax' | 'glowRelease') => reference?.[k];
  const dyn = b.glowMode === 'dynamic';
  const laneList = lanes.includes(b.glowLane) ? lanes : [b.glowLane, ...lanes];
  return (
    <div className="space-y-2" data-testid="glow-section">
      {/* Kiểu phát sáng: nhãn ở trên, nút chọn rộng hết dòng, để "Đều nhau" và "Động khi chạm" không bị cắt chữ. */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span>{i18n.t('web.glow.mode')}</span>
          <ResetButton label={i18n.t('web.glow.mode')} changed={!!reference && reference.glowMode !== b.glowMode} onReset={() => set({ glowMode: reference!.glowMode })} />
        </div>
        <div className="seg w-full" role="radiogroup" aria-label={i18n.t('web.glow.mode')} onKeyDown={radioKeys}>
          {(['uniform', 'dynamic'] as const).map((m) => (
            <button key={m} type="button" role="radio" aria-checked={b.glowMode === m} tabIndex={radioTab(b.glowMode === m)} onClick={() => set({ glowMode: m })}
              className="seg-btn flex-1">
              {i18n.t(`web.glow.mode.${m}`)}
            </button>
          ))}
        </div>
      </div>
      {dyn && <>
        <label className={row}>
          <span className="min-w-0 break-words leading-tight">{i18n.t('web.glow.source')}</span>
          <Select value={b.glowSource} title={i18n.t(b.glowSource === 'pan' ? `web.glow.hint.pan.${b.glowPanMode}` : `web.glow.hint.${b.glowSource}`)} onChange={(e) => set({ glowSource: e.target.value as GlowSource })} className="py-1 pl-2" wrapClassName="min-w-0">
            {GLOW_SOURCES.map((s) => <option key={s} value={s}>{i18n.t(`web.glow.source.${s}`)}</option>)}
          </Select>
          <ResetButton label={i18n.t('web.glow.source')} changed={!!reference && reference.glowSource !== b.glowSource} onReset={() => set({ glowSource: reference!.glowSource })} />
        </label>
        {advanced && b.glowSource === 'automation' && (
          <label className={row}>
            <span className="flex min-w-0 items-center gap-1.5"><span className="min-w-0 break-words leading-tight">{i18n.t('web.glow.lane')}</span></span>
            <Select value={b.glowLane} onChange={(e) => set({ glowLane: e.target.value })} className="py-1 pl-2" wrapClassName="min-w-0">
              {laneList.map((l) => <option key={l} value={l}>{laneLabel(i18n, l, laneInfo)}{lanes.includes(l) ? '' : ` (${i18n.t('web.glow.lane.absent')})`}</option>)}
            </Select>
            <ResetButton label={i18n.t('web.glow.lane')} changed={!!reference && reference.glowLane !== b.glowLane} onReset={() => set({ glowLane: reference!.glowLane })} />
          </label>
        )}
        {advanced && (b.glowSource === 'pan' || (b.glowSource === 'automation' && b.glowLane === 'pan')) && (
          <label className={row}>
            <span className="flex min-w-0 items-center gap-1.5"><span className="min-w-0 break-words leading-tight">{i18n.t('web.glow.panMode')}</span></span>
            <Select value={b.glowPanMode} onChange={(e) => set({ glowPanMode: e.target.value as GlowPanMode })} className="py-1 pl-2" wrapClassName="min-w-0">
              {(['lr', 'spread'] as const).map((m) => <option key={m} value={m}>{i18n.t(`web.glow.panMode.${m}`)}</option>)}
            </Select>
            <ResetButton label={i18n.t('web.glow.panMode')} changed={!!reference && reference.glowPanMode !== b.glowPanMode} onReset={() => set({ glowPanMode: reference!.glowPanMode })} />
          </label>
        )}
        {advanced && <>
          <Slider id="st-gmin" label={i18n.t('web.glow.min')} value={b.glowMin} min={0} max={1} step={0.05} reset={ref('glowMin')} onChange={(v) => set({ glowMin: v })} />
          <Slider id="st-gmax" label={i18n.t('web.glow.max')} value={b.glowMax} min={0} max={1} step={0.05} reset={ref('glowMax')} onChange={(v) => set({ glowMax: v })} />
          <TickField label={i18n.t('web.glow.invert')} checked={b.glowInvert} onChange={(v) => set({ glowInvert: v })} reference={reference?.glowInvert} />
        </>}
      </>}
      {advanced && <Slider id="st-grel" label={i18n.t('web.glow.release')} value={b.glowRelease} min={0} max={2} hardMax={4} step={0.05} reset={ref('glowRelease')} onChange={(v) => set({ glowRelease: v })} />}
    </div>
  );
}

/** Dải cao độ: "Fit content" (theo nốt của track) hoặc "Custom" (hai ô tên nốt: thấp nhất, cao nhất). */
function PitchRangeRows({ value, reference, onChange }: { value: PitchRange; reference?: PitchRange; onChange(next: PitchRange): void }) {
  const { i18n } = useI18n();
  const custom = value.mode === 'CUSTOM';
  return (
    <div className="space-y-2" data-testid="pitch-range">
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span>{i18n.t('web.pitch.title')}</span>
        <ResetButton label={i18n.t('web.pitch.title')} changed={!!reference && JSON.stringify(reference) !== JSON.stringify(value)} onReset={() => onChange(reference!)} />
      </div>
      <div className="seg w-full" role="radiogroup" aria-label={i18n.t('web.pitch.title')} onKeyDown={radioKeys}>
        {(['FIT_CONTENT', 'CUSTOM'] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={value.mode === m} tabIndex={radioTab(value.mode === m)} onClick={() => onChange({ ...value, mode: m })} className="seg-btn flex-1" data-testid={`pitch-mode-${m}`}>
            {i18n.t(m === 'CUSTOM' ? 'web.pitch.custom' : 'web.pitch.fit')}
          </button>
        ))}
      </div>
      {custom && (
        <div className="grid grid-cols-2 gap-2 text-xs text-muted">
          <PitchField id="st-pitch-min" label={i18n.t('web.pitch.min')} value={value.min} onChange={(v) => onChange({ ...value, min: v, max: Math.max(v, value.max) })} />
          <PitchField id="st-pitch-max" label={i18n.t('web.pitch.max')} value={value.max} onChange={(v) => onChange({ ...value, max: v, min: Math.min(v, value.min) })} />
        </div>
      )}
    </div>
  );
}
