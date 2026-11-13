// Mục "Hình thức" của inspector: kiểu dáng nốt (toàn cục) và bàn phím. Chỉ sửa dữ liệu StyleConfig; việc vẽ nằm ở Render Core.
// Phân bổ Cơ bản / Nâng cao theo SRS REQ-UI-13 (dòng "Kiểu nốt", "Bàn phím"). Phong cách dựng sẵn chọn ở cột Video styles.
import { GLOW_SOURCES, type StyleConfig, type NoteStyle, type ColorMode, type KeyboardStyle, type GlowSource, type GlowPanMode } from '@dawviz/render-core';
import { useId } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { radioKeys, radioTab } from '../lib/a11y.ts';
import { matchNotePreset } from '../lib/videoScenes.ts';
import { Select } from './Select.tsx';
import { AdvTag } from './Inspector.tsx';
import { SliderField as Slider } from './SliderField.tsx';

const MODES: ColorMode[] = ['track', 'custom', 'pitch', 'velocity'];
/** Trường chỉ có ở Nâng cao (REQ-UI-13). Dùng để biết phần nâng cao đang khác mặc định hay không. */
export const ADVANCED_STYLE_KEYS: readonly (keyof NoteStyle)[] = ['inactiveOpacity', 'glowRadius', 'borderWidth', 'glowActiveOnly', 'glowMin', 'glowMax', 'glowInvert', 'glowRelease', 'glowLane', 'glowPanMode'];
const row = 'grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)] items-center gap-2 text-xs text-muted';

/** `lanes`: tên lane automation có trong dự án đang mở (cho nguồn phát sáng "automation").
 *  `playhead`: vị trí vạch phát (0..1) và hàm đổi; bàn phím bật thì ô bị khoá kèm chú thích (T-71).
 *  `advanced`: hiện cả dòng nâng cao (chế độ Nâng cao, hoặc "Thêm tuỳ chọn" của mục đang mở). */
export function StylePanel({ style, keyboard, onStyle, onKeyboard, lanes = [], advanced = true, notePresets, onNotePreset, playhead }: { playhead?: { ratio: number; visible: boolean; onChange(ratio: number): void; onVisible(visible: boolean): void }; notePresets?: readonly string[]; onNotePreset?(id: string): void; style: StyleConfig; keyboard: KeyboardStyle; onStyle(next: StyleConfig): void; onKeyboard(next: KeyboardStyle): void; lanes?: string[]; advanced?: boolean }) {
  const { i18n } = useI18n();
  const b = style.base;
  const set = (patch: Partial<NoteStyle>) => onStyle({ ...style, base: { ...b, ...patch } });
  const lockId = useId();
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
        </label>
      )}
      <label className={row}>
        <span>{i18n.t('web.style.colorMode')}</span>
        <span className="flex min-w-0 items-center gap-2">
          <Select value={b.colorMode} onChange={(e) => set({ colorMode: e.target.value as ColorMode })} className="py-1 pl-2" wrapClassName="min-w-0 flex-1">
            {MODES.map((m) => <option key={m} value={m}>{i18n.t(`web.style.mode.${m}`)}</option>)}
          </Select>
          {b.colorMode === 'custom' && <input type="color" aria-label={i18n.t('web.style.customColor')} value={b.customColor} onChange={(e) => set({ customColor: e.target.value })} />}
        </span>
      </label>
      <Slider id="st-opacity" label={i18n.t('web.style.opacity')} value={b.opacity} min={0} max={1} step={0.05} onChange={(v) => set({ opacity: v })} />
      {advanced && <Slider adv id="st-inactive" label={i18n.t('web.style.inactiveOpacity')} value={b.inactiveOpacity} min={0} max={1} step={0.05} onChange={(v) => set({ inactiveOpacity: v })} />}
      <Slider id="st-height" label={i18n.t('web.style.heightScale')} value={b.heightScale} min={0.1} max={1.5} step={0.05} onChange={(v) => set({ heightScale: v })} />
      <Slider id="st-radius" label={i18n.t('web.style.cornerRadius')} value={b.cornerRadius} min={0} max={20} hardMax={999} step={1} onChange={(v) => set({ cornerRadius: v })} />
      {advanced && <Slider adv id="st-border" label={i18n.t('web.style.borderWidth')} value={b.borderWidth} min={0} max={6} hardMax={8} step={0.5} onChange={(v) => set({ borderWidth: v })} />}
      <div className="border-t border-line" />
      <h3 className="pt-1 text-xs font-medium text-fg">{i18n.t('web.look.glow')}</h3>
      <Slider id="st-glow" label={i18n.t('web.style.glow')} value={b.glow} min={0} max={1} step={0.05} onChange={(v) => set({ glow: v })} />
      {advanced && <Slider adv id="st-glowr" label={i18n.t('web.style.glowRadius')} value={b.glowRadius} min={0} max={40} hardMax={64} step={1} onChange={(v) => set({ glowRadius: v })} />}
      <GlowSection b={b} set={set} lanes={lanes} advanced={advanced} />
      {advanced && <label className="flex items-center gap-2 text-xs text-muted">
        <input type="checkbox" checked={b.glowActiveOnly} onChange={(e) => set({ glowActiveOnly: e.target.checked })} />{i18n.t('web.style.glowActiveOnly')}<AdvTag />
      </label>}
      <div className="space-y-2 border-t border-line pt-2.5">
        <label className="flex items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={keyboard.enabled} onChange={(e) => onKeyboard({ ...keyboard, enabled: e.target.checked })} />{i18n.t('web.keyboard.show')}
        </label>
        {playhead && <>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={playhead.visible} onChange={(e) => playhead.onVisible(e.target.checked)} data-testid="playhead-visible" />{i18n.t('web.playhead.show')}
          </label>
          {/* Bàn phím bật: vạch phát ghim ở mép bàn phím (Render Core bỏ qua tỉ lệ), nên khoá ô và nói lý do ngay bên dưới. Giá trị vẫn giữ để dùng lại khi tắt bàn phím. */}
          <Slider id="st-playhead" label={i18n.t('web.playhead.position')} value={Math.round(playhead.ratio * 100)} min={5} max={95} step={1}
            disabled={keyboard.enabled} describedBy={keyboard.enabled ? lockId : undefined} onChange={(v) => playhead.onChange(v / 100)} />
          {keyboard.enabled && <p id={lockId} className="text-xs leading-snug text-muted" data-testid="playhead-locked">{i18n.t('web.playhead.locked')}</p>}
        </>}
      </div>
    </div>
  );
}

/** REQ-GRAPHICS-17: đều nhau (mặc định) hoặc phát sáng động khi thanh phát chạm nốt, theo một tiêu chí. */
function GlowSection({ b, set, lanes, advanced }: { b: NoteStyle; set(p: Partial<NoteStyle>): void; lanes: string[]; advanced: boolean }) {
  const { i18n } = useI18n();
  const dyn = b.glowMode === 'dynamic';
  const laneList = lanes.includes(b.glowLane) ? lanes : [b.glowLane, ...lanes];
  return (
    <div className="space-y-2" data-testid="glow-section">
      {/* Kiểu phát sáng: nhãn ở trên, nút chọn rộng hết dòng, để "Đều nhau" và "Động khi chạm" không bị cắt chữ. */}
      <div className="space-y-1.5">
        <span className="block text-xs text-muted">{i18n.t('web.glow.mode')}</span>
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
          <Select value={b.glowSource} onChange={(e) => set({ glowSource: e.target.value as GlowSource })} className="py-1 pl-2" wrapClassName="min-w-0">
            {GLOW_SOURCES.map((s) => <option key={s} value={s}>{i18n.t(`web.glow.source.${s}`)}</option>)}
          </Select>
        </label>
        {advanced && b.glowSource === 'automation' && (
          <label className={row}>
            <span className="flex min-w-0 items-center gap-1.5"><span className="min-w-0 break-words leading-tight">{i18n.t('web.glow.lane')}</span><AdvTag /></span>
            <Select value={b.glowLane} onChange={(e) => set({ glowLane: e.target.value })} className="py-1 pl-2" wrapClassName="min-w-0">
              {laneList.map((l) => <option key={l} value={l}>{i18n.has(`web.glow.lane.${l}`) ? i18n.t(`web.glow.lane.${l}`) : l}{lanes.includes(l) ? '' : ` (${i18n.t('web.glow.lane.absent')})`}</option>)}
            </Select>
          </label>
        )}
        {advanced && (b.glowSource === 'pan' || (b.glowSource === 'automation' && b.glowLane === 'pan')) && (
          <label className={row}>
            <span className="flex min-w-0 items-center gap-1.5"><span className="min-w-0 break-words leading-tight">{i18n.t('web.glow.panMode')}</span><AdvTag /></span>
            <Select value={b.glowPanMode} onChange={(e) => set({ glowPanMode: e.target.value as GlowPanMode })} className="py-1 pl-2" wrapClassName="min-w-0">
              {(['lr', 'spread'] as const).map((m) => <option key={m} value={m}>{i18n.t(`web.glow.panMode.${m}`)}</option>)}
            </Select>
          </label>
        )}
        <p className="text-xs leading-snug text-muted">{i18n.t(b.glowSource === 'pan' ? `web.glow.hint.pan.${b.glowPanMode}` : `web.glow.hint.${b.glowSource}`)}</p>
        {advanced && <>
          <Slider adv id="st-gmin" label={i18n.t('web.glow.min')} value={b.glowMin} min={0} max={1} step={0.05} onChange={(v) => set({ glowMin: v })} />
          <Slider adv id="st-gmax" label={i18n.t('web.glow.max')} value={b.glowMax} min={0} max={1} step={0.05} onChange={(v) => set({ glowMax: v })} />
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" checked={b.glowInvert} onChange={(e) => set({ glowInvert: e.target.checked })} />{i18n.t('web.glow.invert')}<AdvTag />
          </label>
        </>}
      </>}
      {advanced && <Slider adv id="st-grel" label={i18n.t('web.glow.release')} value={b.glowRelease} min={0} max={2} hardMax={4} step={0.05} onChange={(v) => set({ glowRelease: v })} />}
    </div>
  );
}
