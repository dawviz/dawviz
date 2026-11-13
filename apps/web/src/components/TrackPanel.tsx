// Danh sách track (REQ-UI-12, REQ-UI-14, UI-DIRECTION 5.3): hai cách trình bày.
//  • Danh sách: mỗi track một dòng gọn trong mục 03 của inspector: [tay nắm] ô màu, tên, mắt, S, số nốt căn phải.
//    Bấm tên (hoặc Enter) để mở chi tiết. Không có khoá ở đây: khoá chỉ có ở danh sách lớp của Editor.
//  • Lưới: thẻ xếp dưới khung xem trước; người dùng chọn số cột (hoặc tự động). Nếu bề rộng không đủ thì hiện ít cột hơn và báo.
// Cơ bản: màu, ẩn/hiện, solo, thông tin track. Nâng cao thêm: kéo đổi thứ tự, độ sáng nền và ngưỡng (REQ-UI-13).
// Ẩn/hiện, solo và thứ tự là việc của ứng dụng (lọc/sắp danh sách track trước khi đưa cho Render Core), không đổi Render Core.
import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent, type RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BRIGHTNESS_DB_RANGE, DEFAULT_BRIGHTNESS, pitchName, trackBrightness, type ProjectTrack, type BrightnessConfig, type BrightnessSource, type NoteStyle, type TempoPoint } from '@dawviz/render-core';
import { SliderField } from './SliderField.tsx';
import { NumberField } from './NumberField.tsx';
import { Select } from './Select.tsx';
import { AdvTag } from './Inspector.tsx';
import { ChevronRight, Eye, EyeOff, Grip } from './Icons.tsx';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { usePlayback, type Playback } from '../lib/playback.ts';
import { radioKeys, radioTab } from '../lib/a11y.ts';

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

/** Ẩn/hiện và solo (REQ-UI-12). Có track solo thì chỉ các track solo được vẽ. */
export interface TrackView { hidden: ReadonlySet<string>; solo: ReadonlySet<string> }
export const EMPTY_VIEW: TrackView = { hidden: new Set(), solo: new Set() };
export function isShown(id: string, v: TrackView): boolean { return v.solo.size ? v.solo.has(id) : !v.hidden.has(id); }

interface Props {
  tracks: ProjectTrack[]; config: Record<string, BrightnessConfig>; overrides: Record<string, Partial<NoteStyle>>;
  onChange(id: string, patch: Partial<BrightnessConfig>): void; onStyle(id: string, patch: Partial<NoteStyle> | null): void;
  /** Thời điểm cố định (test); khi có `playback` thì độ sáng hiện tại theo dõi đồng hồ phát. */
  t?: number; playback?: Playback; tempoMap?: TempoPoint[]; layout?: TrackLayout;
  advanced?: boolean; view?: TrackView;
  onToggleHidden?(id: string): void; onToggleSolo?(id: string): void;
  /** Đổi thứ tự (Nâng cao): đưa track `id` tới vị trí `to` trong danh sách. */
  onMove?(id: string, to: number): void;
}

export function TrackPanel(props: Props) {
  const layout = props.layout ?? DEFAULT_TRACK_LAYOUT;
  return layout.mode === 'list' ? <TrackList {...props} /> : <TrackGrid {...props} columns={layout.columns} />;
}

/** Thanh chọn kiểu trình bày: Lưới/Danh sách + số cột (ô nhập số, không giới hạn cứng ngoài số track). */
export function TrackLayoutBar({ value, onChange, count }: { value: TrackLayout; onChange(v: TrackLayout): void; count: number }) {
  const { i18n } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="track-layout-bar">
      <div className="seg" role="radiogroup" aria-label={i18n.t('web.tracks.layout')} onKeyDown={radioKeys}>
        {(['list', 'grid'] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={value.mode === m} tabIndex={radioTab(value.mode === m)} className="seg-btn" onClick={() => onChange({ ...value, mode: m })}>
            {i18n.t(`web.tracks.layout.${m}`)}
          </button>
        ))}
      </div>
      {value.mode === 'grid' && (
        <div className="flex items-center gap-2 text-xs text-muted">
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

/** Phím mũi tên đi theo hướng xếp: tìm phần tử gần nhất theo hướng bấm (dùng cho cả lưới tự động lẫn danh sách). */
function arrowNav(e: KeyboardEvent<HTMLElement>, container: HTMLElement | null) {
  const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (!dir || !container || e.altKey) return;
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

/** Ô màu + tên + mắt + solo + số nốt (+ độ sáng hiện tại). Dùng chung cho dòng danh sách và đầu thẻ lưới. */
function TrackHeader({ tr, i, p, expanded, onExpand, focusRef }: { tr: ProjectTrack; i: number; p: Props; expanded?: boolean; onExpand?(): void; focusRef: RefObject<HTMLElement> }) {
  const { i18n } = useI18n();
  const view = p.view ?? EMPTY_VIEW;
  const shown = isShown(tr.id, view), hidden = view.hidden.has(tr.id), solo = view.solo.has(tr.id);
  const c = p.config[tr.id] ?? DEFAULT_BRIGHTNESS;
  const nameCls = `min-w-0 flex-1 truncate text-left text-[13px] ${shown ? 'text-fg' : 'text-muted line-through decoration-line-strong/40'}`;
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (onExpand && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onExpand(); } else arrowNav(e, focusRef.current);
  };
  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      {p.advanced && p.onMove && (
        <button type="button" draggable data-track-grip={tr.id} aria-label={i18n.t('web.track.reorder', { name: tr.name })} title={i18n.t('web.track.reorder', { name: tr.name })}
          className="hit grid h-6 w-4 shrink-0 cursor-grab place-items-center text-faint hover:text-fg active:cursor-grabbing"
          onDragStart={(e) => { e.dataTransfer.setData('text/x-dawviz-track', tr.id); e.dataTransfer.effectAllowed = 'move'; }}
          onKeyDown={(e) => {
            if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
              e.preventDefault(); p.onMove!(tr.id, i + (e.key === 'ArrowUp' ? -1 : 1));
              // Giữ focus trên tay nắm của track vừa chuyển để bấm tiếp được.
              requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-track-grip="${CSS.escape(tr.id)}"]`)?.focus());
            }
          }}>
          <Grip className="h-3.5 w-3.5" />
        </button>
      )}
      <input type="color" aria-label={`${i18n.t('web.track.color')}: ${tr.name}`} className="swatch"
        value={p.overrides[tr.id]?.customColor ?? tr.color} onChange={(e) => p.onStyle(tr.id, { colorMode: 'custom', customColor: e.target.value })} />
      {onExpand ? (
        <button type="button" data-track-focus aria-expanded={expanded} onClick={onExpand} onKeyDown={onKey} title={tr.name}
          className="flex min-h-[var(--hit)] min-w-0 flex-1 items-center gap-1 rounded-sm py-0.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-focus">
          <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-muted transition-transform ${expanded ? 'rotate-90' : ''}`} />
          <span className={nameCls}>{tr.name}</span>
        </button>
      ) : (
        <span title={tr.name} className={`${nameCls} font-semibold`}>{tr.name}</span>
      )}
      {p.onToggleHidden && (
        <button type="button" className="tog" aria-pressed={hidden} aria-label={i18n.t('web.track.hide', { name: tr.name })} title={i18n.t('web.track.hide', { name: tr.name })}
          onClick={() => p.onToggleHidden!(tr.id)}>{hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}</button>
      )}
      {p.onToggleSolo && (
        <button type="button" className="tog text-xs" aria-pressed={solo} aria-label={i18n.t('web.track.solo', { name: tr.name })} title={i18n.t('web.track.solo', { name: tr.name })}
          onClick={() => p.onToggleSolo!(tr.id)}><span aria-hidden>{i18n.t('web.track.soloShort')}</span></button>
      )}
      {c.source !== 'off' && <Brightness tr={tr} c={c} p={p} />}
      <span className="shrink-0 whitespace-nowrap text-right text-xs tabular-nums text-muted">{i18n.t('web.track.notes', { n: tr.notes.length })}</span>
    </div>
  );
}

function Brightness({ tr, c, p }: { tr: ProjectTrack; c: BrightnessConfig; p: Props }) {
  return p.playback ? <LiveBrightness tr={tr} c={c} tempoMap={p.tempoMap ?? []} playback={p.playback} /> : <BrightnessValue tr={tr} c={c} tempoMap={p.tempoMap ?? []} t={p.t ?? 0} />;
}
function LiveBrightness({ playback, ...rest }: { tr: ProjectTrack; c: BrightnessConfig; tempoMap: TempoPoint[]; playback: Playback }) {
  const t = usePlayback(playback, (s) => s.t);
  return <BrightnessValue {...rest} t={t} />;
}
function BrightnessValue({ tr, c, tempoMap, t }: { tr: ProjectTrack; c: BrightnessConfig; tempoMap: TempoPoint[]; t: number }) {
  const { i18n } = useI18n();
  const pct = i18n.number(trackBrightness(tr, tempoMap, t, c), { style: 'percent', maximumFractionDigits: 0 });
  return <span className="w-9 shrink-0 text-right text-xs tabular-nums text-fg" title={i18n.t('web.brightness.now')} data-testid={`brightness-now-${tr.id}`}>{pct}</span>;
}

/** Phần mở ra của một track: thông tin (Cơ bản) và độ sáng nền (Nâng cao). */
function TrackBody({ tr, p }: { tr: ProjectTrack; p: Props }) {
  const { i18n } = useI18n();
  const c = p.config[tr.id] ?? DEFAULT_BRIGHTNESS;
  return (
    <div className="space-y-2 text-xs text-muted">
      <TrackInfo tr={tr} />
      {p.overrides[tr.id] && <button type="button" className="btn-ghost -ml-1.5" onClick={() => p.onStyle(tr.id, null)}>{i18n.t('web.track.colorReset')}</button>}
      {p.advanced && <BrightnessControls tr={tr} c={c} onChange={(patch) => p.onChange(tr.id, patch)} />}
    </div>
  );
}

function TrackGrid(p: Props & { columns: number | 'auto' }) {
  const { i18n } = useI18n();
  const ref = useRef<HTMLUListElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth)); ro.observe(el); setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const { cols, limited } = effectiveColumns(p.columns, width || MIN_CARD_PX * 3, p.tracks.length);
  const drop = useDrop(p);
  return (
    <div>
      {limited && <p className="mb-2 text-xs text-warning" data-testid="track-columns-limited">{i18n.t('web.tracks.columns.limited', { n: cols })}</p>}
      <ul ref={ref} role="list" className="grid gap-px border border-line bg-line" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} data-testid="track-grid" data-cols={cols}>
        <AnimatePresence initial={false}>
          {p.tracks.map((tr, i) => (
            <motion.li key={tr.id} data-track-row={tr.id} layout layoutId={`track-${tr.id}`} transition={SPRING} {...drop(i)}
              className={`relative min-w-0 bg-surface p-3 pt-3.5 ${drop.over === i ? 'outline outline-1 outline-focus' : ''}`}>
              {/* Dải màu track ở mép trên: nhận ra track bằng màu như trong DAW, không chỉ bằng chấm nhỏ. */}
              <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: p.overrides[tr.id]?.customColor ?? tr.color }} />
              <TrackHeader tr={tr} i={i} p={p} focusRef={ref} />
              <details className="mt-2 border-t border-line pt-2" data-testid={`track-details-${tr.id}`}>
                <summary className="disclosure text-xs" data-track-focus aria-label={`${i18n.t('web.track.details')}: ${tr.name}`} onKeyDown={(e) => arrowNav(e, ref.current)}>{i18n.t('web.track.details')}</summary>
                <div className="mt-2"><TrackBody tr={tr} p={p} /></div>
              </details>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

/** Số dòng track thấy được trước khi cuộn riêng, và chiều cao một dòng (rem, khớp `py-1` + nút 24 px + kẻ 1 px). */
const LIST_ROWS = 6;
const LIST_ROW_REM = 2.0625;

function TrackList(p: Props) {
  const { i18n } = useI18n();
  const ref = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  // MỘT trạng thái duy nhất cho giới hạn dòng: `all`. Mở chi tiết khi đang thu gọn thì chuyển sang "hiện tất cả";
  // đóng chi tiết bằng tay giữ nguyên; "Thu gọn" về 6 dòng, đóng dòng đang mở và cuộn dòng đó vào vùng nhìn.
  const [all, setAll] = useState(false);
  const lastOpened = useRef<string | null>(null);
  const revealAfterClose = useRef<string | null>(null);
  const toggle = (id: string) => {
    if (open.has(id)) { setOpen((s) => { const n = new Set(s); n.delete(id); return n; }); return; }
    lastOpened.current = id; setAll(true);
    setOpen((s) => new Set(s).add(id));
  };
  const collapse = () => {
    const id = lastOpened.current && open.has(lastOpened.current) ? lastOpened.current : [...open].pop() ?? null;
    setAll(false);
    if (!id) return;
    revealAfterClose.current = id; setOpen(new Set());
  };
  // Mở chi tiết xong chuyển động thì cuộn dòng đó vào vùng nhìn (đo sau khi chiều cao đã ổn định, không đoán thời gian).
  const reveal = (id: string) => ref.current?.querySelector(`[data-track-row="${CSS.escape(id)}"]`)?.scrollIntoView({ block: 'nearest' });
  const drop = useDrop(p);
  // Mục Track có chiều cao tối đa ~6 dòng và cuộn riêng; "Hiện tất cả" bỏ giới hạn. Chỉ áp khi có hơn LIST_ROWS track.
  const capped = p.tracks.length > LIST_ROWS && !all;
  return (
    <>
    <ul ref={ref} role="list" className={`-mx-4 divide-y divide-line border-y border-line ${capped ? 'overflow-y-auto overscroll-contain' : ''}`}
      style={capped ? { maxHeight: `${LIST_ROWS * LIST_ROW_REM}rem` } : undefined} data-testid="track-list">
      <AnimatePresence initial={false}>
        {p.tracks.map((tr, i) => {
          const isOpen = open.has(tr.id);
          return (
            <motion.li key={tr.id} data-track-row={tr.id} layout layoutId={`track-${tr.id}`} transition={SPRING} {...drop(i)}
              className={`min-w-0 ${isOpen ? 'bg-raised' : ''} ${drop.over === i ? 'outline outline-1 -outline-offset-1 outline-focus' : ''}`}>
              <div className={`flex items-center px-3 py-1 ${isOpen ? '' : 'hover:bg-raised'}`}>
                <TrackHeader tr={tr} i={i} p={p} expanded={isOpen} onExpand={() => toggle(tr.id)} focusRef={ref} />
              </div>
              <AnimatePresence initial={false} onExitComplete={() => { if (revealAfterClose.current === tr.id) { revealAfterClose.current = null; reveal(tr.id); window.setTimeout(() => reveal(tr.id), 350); /* sau khi các dòng bên dưới xếp lại xong */ } }}>
                {isOpen && (
                  <motion.div key="body" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.18 }} onAnimationComplete={() => reveal(tr.id)}
                    className="overflow-hidden" data-testid={`track-details-${tr.id}`}>
                    <div className="px-4 pb-3 pt-1"><TrackBody tr={tr} p={p} /></div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </AnimatePresence>
      {p.tracks.length === 0 && <li className="px-4 py-2 text-xs text-muted">{i18n.t('web.track.none')}</li>}
    </ul>
    {p.tracks.length > LIST_ROWS && (
      <button type="button" className="mt-1 -ml-1.5 flex min-h-[var(--hit)] w-fit items-center rounded px-1.5 text-xs font-medium text-fg transition hover:bg-raised" aria-expanded={all} onClick={() => (all ? collapse() : setAll(true))} data-testid="track-list-all">
        {all ? i18n.t('web.tracks.showFewer') : i18n.t('web.tracks.showAll', { n: i18n.number(p.tracks.length) })}
      </button>
    )}
    </>
  );
}

/** Thả để đổi thứ tự (Nâng cao). Chỉ nhận dữ liệu kéo từ tay nắm của chính danh sách này. */
function useDrop(p: Props) {
  const [over, setOver] = useState<number | null>(null);
  const handlers = (i: number) => p.advanced && p.onMove ? {
    onDragOver: (e: DragEvent) => { if (e.dataTransfer.types.includes('text/x-dawviz-track')) { e.preventDefault(); setOver(i); } },
    onDragLeave: () => setOver((o) => (o === i ? null : o)),
    onDrop: (e: DragEvent) => { const id = e.dataTransfer.getData('text/x-dawviz-track'); setOver(null); if (id) { e.preventDefault(); p.onMove!(id, i); } },
  } : {};
  return Object.assign(handlers, { over });
}

/** T-03: thông tin track (Cơ bản). */
function TrackInfo({ tr }: { tr: ProjectTrack }) {
  const { i18n } = useI18n();
  const lanes = Object.entries(tr.automation ?? {}).filter(([, l]) => l?.points.length).map(([k]) => k);
  const db = (v: number) => `${i18n.number(v, { maximumFractionDigits: 1 })} dB`;
  const laneName = (k: string) => (i18n.has(`web.glow.lane.${k}`) ? i18n.t(`web.glow.lane.${k}`) : k);
  return (
    <dl className="grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)] gap-x-2 gap-y-1">
      <dt className="truncate">{i18n.t('web.track.range')}</dt><dd className="truncate text-fg">{tr.notes.length ? `${pitchName(tr.pitchRange.min)} – ${pitchName(tr.pitchRange.max)}` : '—'}</dd>
      <dt className="truncate">{i18n.t('web.track.fader')}</dt><dd className="truncate text-fg">{tr.mix ? `${db(tr.mix.volumeDb)} · ${i18n.t('web.track.pan')} ${i18n.number(tr.mix.pan, { maximumFractionDigits: 2 })}` : '—'}</dd>
      <dt className="truncate">{i18n.t('web.track.automation')}</dt><dd className="truncate text-fg">{lanes.length ? lanes.map(laneName).join(', ') : i18n.t('web.track.none')}</dd>
      {tr.isMuted && <><dt className="truncate">{i18n.t('web.track.state')}</dt><dd className="text-warning">{i18n.t('web.track.mutedInDaw')}</dd></>}
    </dl>
  );
}

/** Độ sáng nền (REQ-GRAPHICS-06, Nâng cao): nguồn, đảo chiều, ngưỡng dB, mức yếu/mạnh nhất. */
function BrightnessControls({ tr, c, onChange }: { tr: ProjectTrack; c: BrightnessConfig; onChange(patch: Partial<BrightnessConfig>): void }) {
  const { i18n } = useI18n();
  const usesDb = c.source === 'volume' || c.source === 'static';
  const id = (k: string) => `tr-${tr.id}-${k}`;
  const { min: dLo, max: dHi } = BRIGHTNESS_DB_RANGE;
  return (
    <div className="space-y-1.5 border-t border-line pt-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <label className="flex min-w-0 max-w-full flex-1 items-center gap-2">
          <span className="flex shrink-0 items-center gap-1.5">{i18n.t('web.brightness.source')}<AdvTag /></span>
          <Select value={c.source} onChange={(e) => onChange({ source: e.target.value as BrightnessSource })} wrapClassName="min-w-0 flex-1" className="truncate py-1 pl-2">
            {SOURCES.map((s) => <option key={s} value={s}>{i18n.t(`web.brightness.${s}`)}{EXPERIMENTAL.has(s) ? ` (${i18n.t('web.experimental')})` : ''}</option>)}
          </Select>
        </label>
        {c.source !== 'off' && (
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={c.invert} onChange={(e) => onChange({ invert: e.target.checked })} />
            <span>{i18n.t('web.brightness.invert')}</span>
          </label>
        )}
      </div>
      {c.source !== 'off' && <>
        {usesDb && <>
          <SliderField adv id={id('floor')} label={i18n.t('web.brightness.floorDb')} value={c.floorDb} min={-60} max={0} hardMin={dLo} hardMax={dHi} step={1} onChange={(v) => onChange({ floorDb: v })} />
          <SliderField adv id={id('ceil')} label={i18n.t('web.brightness.ceilDb')} value={c.ceilDb} min={-48} max={12} hardMin={dLo} hardMax={dHi} step={1} onChange={(v) => onChange({ ceilDb: v })} />
        </>}
        <SliderField adv id={id('min')} label={i18n.t('web.brightness.min')} value={c.minBrightness} min={0} max={1} step={0.05} onChange={(v) => onChange({ minBrightness: v })} />
        <SliderField adv id={id('max')} label={i18n.t('web.brightness.max')} value={c.maxBrightness} min={0} max={1} step={0.05} onChange={(v) => onChange({ maxBrightness: v })} />
        <button type="button" className="btn-ghost -ml-1.5" onClick={() => onChange({ floorDb: DEFAULT_BRIGHTNESS.floorDb, ceilDb: DEFAULT_BRIGHTNESS.ceilDb, minBrightness: DEFAULT_BRIGHTNESS.minBrightness, maxBrightness: DEFAULT_BRIGHTNESS.maxBrightness })}>{i18n.t('web.brightness.reset')}</button>
      </>}
    </div>
  );
}
