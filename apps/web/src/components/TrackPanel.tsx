// Danh sách track (REQ-UI-14 sửa 2026-11-12): hai cách trình bày.
//  • Lưới (mặc định): thẻ xếp theo hàng ngang dưới khung xem trước; người dùng chọn số cột (hoặc tự động). Nếu bề rộng
//    không đủ cho số cột đã chọn thì hiện ít cột hơn và báo, chứ không làm thẻ tràn.
//  • Danh sách: mỗi track một dòng gọn (màu, tên, số nốt, độ sáng hiện tại) ở cột phải; bấm dòng để mở phần chỉnh.
// Thẻ có animation khi đổi số cột/đổi kiểu (Framer Motion layout + layoutId), tôn trọng "giảm chuyển động" của hệ thống.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BRIGHTNESS_DB_RANGE, DEFAULT_BRIGHTNESS, pitchName, trackBrightness, type ProjectTrack, type BrightnessConfig, type BrightnessSource, type NoteStyle, type TempoPoint } from '@dawviz/render-core';
import { SliderField } from './SliderField.tsx';
import { NumberField } from './NumberField.tsx';
import { useI18n } from '../i18n/I18nProvider.tsx';

const SOURCES: BrightnessSource[] = ['off', 'volume', 'static', 'pan', 'mute'];
const EXPERIMENTAL = new Set<BrightnessSource>(['pan', 'mute']); // chiều pan / nghĩa mute chưa kiểm (SOI-19)
/** Bề rộng tối thiểu của một thẻ (px) để nội dung không tràn. Không phải giới hạn số cột: số cột do người dùng chọn. */
export const MIN_CARD_PX = 224;
const SPRING = { type: 'spring', stiffness: 420, damping: 38, mass: 0.8 } as const;

export interface TrackLayout { mode: 'grid' | 'list'; columns: number | 'auto' }
export const DEFAULT_TRACK_LAYOUT: TrackLayout = { mode: 'grid', columns: 'auto' };

/** Số cột thực vẽ: số người dùng chọn, nhưng không vượt số thẻ vừa bề rộng (hàm thuần, test được). */
export function effectiveColumns(chosen: number | 'auto', widthPx: number, count: number, minCard = MIN_CARD_PX, gap = 8): { cols: number; limited: boolean } {
  const fit = Math.max(1, Math.floor((widthPx + gap) / (minCard + gap)));
  if (chosen === 'auto') return { cols: Math.max(1, Math.min(fit, Math.max(1, count))), limited: false };
  const want = Math.max(1, Math.round(chosen));
  return { cols: Math.min(want, fit), limited: widthPx > 0 && want > fit };
}

interface Props {
  tracks: ProjectTrack[]; config: Record<string, BrightnessConfig>; overrides: Record<string, Partial<NoteStyle>>;
  onChange(id: string, patch: Partial<BrightnessConfig>): void; onStyle(id: string, patch: Partial<NoteStyle> | null): void;
  t?: number; tempoMap?: TempoPoint[]; layout?: TrackLayout;
}

export function TrackPanel(props: Props) {
  const layout = props.layout ?? DEFAULT_TRACK_LAYOUT;
  return layout.mode === 'list' ? <TrackList {...props} /> : <TrackGrid {...props} columns={layout.columns} />;
}

/** Thanh chọn kiểu trình bày: Lưới/Danh sách + số cột (ô nhập số, không giới hạn cứng ngoài số track). */
export function TrackLayoutBar({ value, onChange, count }: { value: TrackLayout; onChange(v: TrackLayout): void; count: number }) {
  const { i18n } = useI18n();
  const btn = (on: boolean) => `rounded-full border px-2.5 py-0.5 text-xs ${on ? 'border-accent-500 bg-accent-600/20 text-ink-50' : 'border-ink-700 text-ink-300 hover:border-ink-500'}`;
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="track-layout-bar">
      <div className="flex gap-1" role="radiogroup" aria-label={i18n.t('web.tracks.layout')}>
        {(['grid', 'list'] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={value.mode === m} className={btn(value.mode === m)} onClick={() => onChange({ ...value, mode: m })}>
            {i18n.t(`web.tracks.layout.${m}`)}
          </button>
        ))}
      </div>
      {value.mode === 'grid' && (
        <div className="flex items-center gap-2 text-xs text-ink-300">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={value.columns === 'auto'} onChange={(e) => onChange({ ...value, columns: e.target.checked ? 'auto' : 3 })} />
            {i18n.t('web.tracks.columns.auto')}
          </label>
          {value.columns !== 'auto' && (
            <span className="flex items-center gap-1">
              <span>{i18n.t('web.tracks.columns')}</span>
              <span className="w-14"><NumberField label={i18n.t('web.tracks.columns')} value={value.columns} spec={{ min: 1, max: Math.max(1, count), step: 1 }} onChange={(v) => onChange({ ...value, columns: v })} /></span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** Phím mũi tên đi theo hướng xếp: tìm thẻ gần nhất theo hướng bấm (dùng cho cả lưới tự động lẫn danh sách). */
function arrowNav(e: KeyboardEvent<HTMLElement>, container: HTMLElement | null) {
  const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (!dir || !container) return;
  const items = [...container.querySelectorAll<HTMLElement>('[data-track-focus]')];
  const cur = e.currentTarget.getBoundingClientRect();
  let best: HTMLElement | null = null, bestD = Infinity;
  for (const el of items) {
    if (el === e.currentTarget) continue;
    const r = el.getBoundingClientRect(), dx = r.left - cur.left, dy = r.top - cur.top;
    if (dir[0] && (Math.sign(dx) !== dir[0] || Math.abs(dy) > cur.height / 2)) continue;
    if (dir[1] && (Math.sign(dy) !== dir[1])) continue;
    const d = Math.abs(dx) + Math.abs(dy) * (dir[1] ? 1 : 4);
    if (d < bestD) { bestD = d; best = el; }
  }
  if (best) { e.preventDefault(); best.focus(); }
}

function TrackGrid({ tracks, config, overrides, onChange, onStyle, t = 0, tempoMap = [], columns }: Props & { columns: number | 'auto' }) {
  const { i18n } = useI18n();
  const ref = useRef<HTMLUListElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth)); ro.observe(el); setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const { cols, limited } = effectiveColumns(columns, width || MIN_CARD_PX * 3, tracks.length);
  return (
    <div>
      {limited && <p className="mb-2 text-xs text-amber-200" data-testid="track-columns-limited">{i18n.t('web.tracks.columns.limited', { n: cols })}</p>}
      <ul ref={ref} role="list" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} data-testid="track-grid" data-cols={cols}>
        <AnimatePresence initial={false}>
          {tracks.map((tr) => (
            <motion.li key={tr.id} layout layoutId={`track-${tr.id}`} transition={SPRING} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
              className="min-w-0 rounded-xl border border-ink-700 bg-ink-900 p-3">
              <TrackHeader tr={tr} c={config[tr.id]} overrides={overrides} onStyle={onStyle} t={t} tempoMap={tempoMap}
                focusProps={{ tabIndex: 0, 'data-track-focus': '', onKeyDown: (e: KeyboardEvent<HTMLElement>) => arrowNav(e, ref.current) }} />
              <TrackControls tr={tr} c={config[tr.id]} overrides={overrides} onChange={onChange} onStyle={onStyle} />
              <details className="mt-2 text-xs text-ink-300" data-testid={`track-details-${tr.id}`}>
                <summary className="cursor-pointer">{i18n.t('web.track.details')}</summary>
                <TrackInfo tr={tr} c={config[tr.id]} onChange={(p) => onChange(tr.id, p)} />
              </details>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

function TrackList({ tracks, config, overrides, onChange, onStyle, t = 0, tempoMap = [] }: Props) {
  const { i18n } = useI18n();
  const ref = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setOpen((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  return (
    <ul ref={ref} role="list" className="divide-y divide-ink-700 overflow-hidden rounded-xl border border-ink-700 bg-ink-900" data-testid="track-list">
      <AnimatePresence initial={false}>
        {tracks.map((tr) => {
          const isOpen = open.has(tr.id);
          return (
            <motion.li key={tr.id} layout layoutId={`track-${tr.id}`} transition={SPRING} className="min-w-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 ${isOpen ? 'bg-ink-800' : 'hover:bg-ink-800/60'}`}>
                <TrackHeader tr={tr} c={config[tr.id]} overrides={overrides} onStyle={onStyle} t={t} tempoMap={tempoMap} compact
                  focusProps={{ role: 'button', tabIndex: 0, 'aria-expanded': isOpen, 'data-track-focus': '', onClick: () => toggle(tr.id),
                    onKeyDown: (e: KeyboardEvent<HTMLElement>) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(tr.id); } else arrowNav(e, ref.current); } }} />
              </div>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }}
                    className="overflow-hidden" data-testid={`track-details-${tr.id}`}>
                    <div className="px-3 pb-3 pt-1">
                      <TrackControls tr={tr} c={config[tr.id]} overrides={overrides} onChange={onChange} onStyle={onStyle} />
                      <div className="mt-2 text-xs text-ink-300"><TrackInfo tr={tr} c={config[tr.id]} onChange={(p) => onChange(tr.id, p)} /></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </AnimatePresence>
      {tracks.length === 0 && <li className="px-3 py-2 text-xs text-ink-300">{i18n.t('web.track.none')}</li>}
    </ul>
  );
}

/** Màu + tên + số nốt + độ sáng hiện tại. `focusProps` gắn vào phần tên (nơi nhận bàn phím/bấm). */
function TrackHeader({ tr, c, overrides, onStyle, t, tempoMap, compact, focusProps }: { tr: ProjectTrack; c: BrightnessConfig; overrides: Props['overrides']; onStyle: Props['onStyle']; t: number; tempoMap: TempoPoint[]; compact?: boolean; focusProps: Record<string, unknown> }) {
  const { i18n } = useI18n();
  const b = trackBrightness(tr, tempoMap, t, c);
  const pct = i18n.number(b, { style: 'percent', maximumFractionDigits: 0 });
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <input type="color" aria-label={`${i18n.t('web.track.color')}: ${tr.name}`} className="swatch h-4 w-4 shrink-0 cursor-pointer rounded-full border-0 bg-transparent p-0"
        value={overrides[tr.id]?.customColor ?? tr.color} onChange={(e) => onStyle(tr.id, { colorMode: 'custom', customColor: e.target.value })} />
      <div {...focusProps} className={`flex min-w-0 flex-1 items-center gap-2 rounded focus:outline-none focus:ring-1 focus:ring-accent-400 ${compact ? 'cursor-pointer' : ''}`}>
        <span className={`min-w-0 flex-1 truncate ${compact ? 'text-sm' : 'font-medium'}`} title={tr.name}>{tr.name}</span>
        <span className="shrink-0 text-xs tabular-nums text-ink-300">{i18n.t('web.track.notes', { n: tr.notes.length })}</span>
        {c.source !== 'off' && <span className="shrink-0 text-xs tabular-nums text-ink-100" title={i18n.t('web.brightness.now')} data-testid={`brightness-now-${tr.id}`}>{pct}</span>}
        {compact && <span aria-hidden className="shrink-0 text-ink-300">{(focusProps['aria-expanded'] as boolean) ? '▾' : '▸'}</span>}
      </div>
    </div>
  );
}

function TrackControls({ tr, c, overrides, onChange, onStyle }: { tr: ProjectTrack; c: BrightnessConfig; overrides: Props['overrides']; onChange: Props['onChange']; onStyle: Props['onStyle'] }) {
  const { i18n } = useI18n();
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-300">
      <label className="flex min-w-0 max-w-full items-center gap-1">
        <span className="shrink-0">{i18n.t('web.brightness.source')}</span>
        <select value={c.source} onChange={(e) => onChange(tr.id, { source: e.target.value as BrightnessSource })}
          className="min-w-0 max-w-[10rem] rounded border border-ink-700 bg-ink-950 px-1.5 py-0.5 text-ink-100">
          {SOURCES.map((s) => <option key={s} value={s}>{i18n.t(`web.brightness.${s}`)}{EXPERIMENTAL.has(s) ? ` (${i18n.t('web.experimental')})` : ''}</option>)}
        </select>
      </label>
      {c.source !== 'off' && (
        <label className="flex items-center gap-1">
          <input type="checkbox" checked={c.invert} onChange={(e) => onChange(tr.id, { invert: e.target.checked })} />
          <span>{i18n.t('web.brightness.invert')}</span>
        </label>
      )}
      {overrides[tr.id] && <button type="button" className="underline" onClick={() => onStyle(tr.id, null)}>{i18n.t('web.track.colorReset')}</button>}
    </div>
  );
}

/** T-03: thông tin track và ngưỡng độ sáng nền (chỉ khi nguồn khác "đều nhau"). */
function TrackInfo({ tr, c, onChange }: { tr: ProjectTrack; c: BrightnessConfig; onChange(patch: Partial<BrightnessConfig>): void }) {
  const { i18n } = useI18n();
  const lanes = Object.entries(tr.automation ?? {}).filter(([, l]) => l?.points.length).map(([k]) => k);
  const usesDb = c.source === 'volume' || c.source === 'static';
  const db = (v: number) => `${i18n.number(v, { maximumFractionDigits: 1 })} dB`;
  const id = (k: string) => `tr-${tr.id}-${k}`;
  const { min: dLo, max: dHi } = BRIGHTNESS_DB_RANGE;
  const laneName = (k: string) => (i18n.has(`web.glow.lane.${k}`) ? i18n.t(`web.glow.lane.${k}`) : k);
  return (
    <>
      <dl className="mt-2 grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)] gap-x-2 gap-y-1">
        <dt className="truncate">{i18n.t('web.track.range')}</dt><dd className="truncate text-ink-100">{tr.notes.length ? `${pitchName(tr.pitchRange.min)} – ${pitchName(tr.pitchRange.max)}` : '—'}</dd>
        <dt className="truncate">{i18n.t('web.track.fader')}</dt><dd className="truncate text-ink-100">{tr.mix ? `${db(tr.mix.volumeDb)} · ${i18n.t('web.track.pan')} ${i18n.number(tr.mix.pan, { maximumFractionDigits: 2 })}` : '—'}</dd>
        <dt className="truncate">{i18n.t('web.track.automation')}</dt><dd className="truncate text-ink-100">{lanes.length ? lanes.map(laneName).join(', ') : i18n.t('web.track.none')}</dd>
        {tr.isMuted && <><dt className="truncate">{i18n.t('web.track.state')}</dt><dd className="text-amber-200">{i18n.t('web.track.mutedInDaw')}</dd></>}
      </dl>
      {c.source !== 'off' && (
        <div className="mt-2 space-y-1.5 border-t border-ink-700 pt-2">
          {usesDb && <>
            <SliderField id={id('floor')} label={i18n.t('web.brightness.floorDb')} value={c.floorDb} min={-60} max={0} hardMin={dLo} hardMax={dHi} step={1} onChange={(v) => onChange({ floorDb: v })} />
            <SliderField id={id('ceil')} label={i18n.t('web.brightness.ceilDb')} value={c.ceilDb} min={-48} max={12} hardMin={dLo} hardMax={dHi} step={1} onChange={(v) => onChange({ ceilDb: v })} />
          </>}
          <SliderField id={id('min')} label={i18n.t('web.brightness.min')} value={c.minBrightness} min={0} max={1} step={0.05} onChange={(v) => onChange({ minBrightness: v })} />
          <SliderField id={id('max')} label={i18n.t('web.brightness.max')} value={c.maxBrightness} min={0} max={1} step={0.05} onChange={(v) => onChange({ maxBrightness: v })} />
          <button type="button" className="underline" onClick={() => onChange({ floorDb: DEFAULT_BRIGHTNESS.floorDb, ceilDb: DEFAULT_BRIGHTNESS.ceilDb, minBrightness: DEFAULT_BRIGHTNESS.minBrightness, maxBrightness: DEFAULT_BRIGHTNESS.maxBrightness })}>{i18n.t('web.brightness.reset')}</button>
        </div>
      )}
    </>
  );
}
