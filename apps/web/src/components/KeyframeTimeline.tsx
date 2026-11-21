// Thân panel Timeline (UI-DIRECTION 5.3, DESIGN.md "Timeline"): bên trái là cây thuộc tính của widget đang chọn (đồng hồ bật hoạt hình, tên,
// giá trị tại vạch phát, đi tới keyframe trước/sau), bên phải là thước và làn keyframe theo thời gian. Một vùng cuộn chung cho hai cột:
// cột cây dính mép trái, thước dính mép trên, nên cuộn dọc/ngang luôn thẳng hàng.
// Thao tác: nhấp hình thoi để chọn (Shift/Ctrl/⌘ cộng thêm), kéo để dời (bắt dính vạch phát, keyframe khác và phách; giữ Alt để tắt),
// kéo trên chỗ trống để chọn bằng hộp, nhấp đúp vào làn để thêm keyframe, Ctrl+cuộn để thu phóng, kéo trên thước để tua.
// Bàn phím: Delete xoá, Ctrl+A chọn hết, Esc bỏ chọn, U chỉ hiện thuộc tính đang animate, Alt+←/→ dời 1/30 s (thêm Shift: 1 s),
// ←/→ trên hình thoi đi qua keyframe cùng hàng, ↑/↓ sang hàng khác, Enter đưa vạch phát tới keyframe.
// Logic thuần ở lib/timeline.ts; hình dạng hình thoi cho biết cách đi tiếp: thoi = đều, vuông = giữ rồi nhảy, tròn = cong mượt.
import { memo, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import { MAX_ANIMATIONS, MAX_ANIM_KEYS, compileTrack, isBinding, sampleTrack, type Animation, type KeyAnimation, type TempoPoint, type WidgetSpec } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { usePlayback, type Playback } from '../lib/playback.ts';
import type { Gesture } from '../lib/storeReact.ts';
import { isTextEntry } from '../lib/a11y.ts';
import { formatClock } from '../lib/timeFormat.ts';
import { addKey, animFields, newKeyAnimation, removeKey, setKey, staticValue, type AnimField } from '../lib/animateFields.ts';
import {
  DRAG_SLOP, ROW_H, RULER_H, beatTimes, clampPps, clampShift, fitPps, groupRefs, keyAt, keyRef, keySecs, keysInBox, moveKeys, nextKey,
  parseKeyRef, prevKey, removeKeys, rulerLabel, rulerStep, rulerTicks, snapTime, xToTime, zoomAround,
} from '../lib/timeline.ts';
import { PANEL_LIMITS } from '../lib/panelLayout.ts';
import { NumberField } from './NumberField.tsx';
import { Splitter } from './Splitter.tsx';
import { ChevronRight, Diamond, FitWidth, Filter, KeyNext, KeyPrev, Stopwatch, ZoomIn, ZoomOut } from './Icons.tsx';

/** Vùng chọn của Timeline: keyframe (`đường dẫn#chỉ số`) và hàng thuộc tính đang chọn (đích của Animation Inspector). */
export interface KeySel { keys: string[]; row: string | null }
export const NO_SEL: KeySel = { keys: [], row: null };

export interface KeyframeTimelineProps {
  widget: WidgetSpec;
  tempoMap: readonly TempoPoint[];
  duration: number;
  playback: Playback;
  locked: boolean;
  sel: KeySel;
  onSel(s: KeySel): void;
  onAnimate(path: string, v: Animation | null, key?: string): void;
  gesture: Gesture;
  tree: number;
  onTree(px: number): void;
  onTreeReset(): void;
}

const FRAME = 1 / 30;
/** Lề trái của làn (px): keyframe ở 0:00 không bị cắt nửa ở mép. */
const PAD = 10;
const GROUPS = [{ id: 'transform', key: 'web.timeline.group.transform' }, { id: 'props', key: 'web.timeline.group.props' }] as const;
type GroupId = typeof GROUPS[number]['id'];
const groupOf = (path: string): GroupId => (path.startsWith('layout.') || path === 'opacity' ? 'transform' : 'props');
type Item = { kind: 'group'; id: GroupId; open: boolean; count: number } | { kind: 'row'; f: AnimField; anim: Animation | undefined; times: number[]; keyRow: number };

export function KeyframeTimeline({ widget, tempoMap, duration, playback, locked, sel, onSel, onAnimate, gesture, tree, onTree, onTreeReset }: KeyframeTimelineProps) {
  const { i18n } = useI18n();
  const label = (f: AnimField) => (f.labelKey && i18n.has(f.labelKey) ? i18n.t(f.labelKey) : f.path);
  const fields = useMemo(() => animFields(widget.type), [widget.type]);
  const animate = widget.animate ?? {};
  const used = Object.keys(animate).filter((p) => fields.some((f) => f.path === p));
  const [onlyAnimated, setOnlyAnimated] = useState(false);
  // Nhóm "Thuộc tính widget" thường dài: đóng sẵn khi chưa có thuộc tính nào trong đó đang animate.
  const [closed, setClosed] = useState<ReadonlySet<GroupId>>(() => new Set(used.some((p) => groupOf(p) === 'props') ? [] : ['props']));

  // ── hàng hiển thị ──
  const times = useMemo(() => {
    const m = new Map<string, number[]>();
    for (const [p, a] of Object.entries(animate)) if (!isBinding(a)) m.set(p, keySecs(a, tempoMap));
    return m;
  }, [animate, tempoMap]);
  const items: Item[] = [];
  let keyRow = 0;
  for (const g of GROUPS) {
    const rows = fields.filter((f) => groupOf(f.path) === g.id && (!onlyAnimated || animate[f.path]));
    if (!rows.length) continue;
    const open = !closed.has(g.id);
    items.push({ kind: 'group', id: g.id, open, count: rows.filter((f) => animate[f.path]).length });
    if (open) for (const f of rows) items.push({ kind: 'row', f, anim: animate[f.path], times: times.get(f.path) ?? [], keyRow: keyRow++ });
  }
  const keyRows = items.filter((x): x is Extract<Item, { kind: 'row' }> => x.kind === 'row');
  // Vùng chọn chỉ giữ keyframe còn tồn tại (sau hoàn tác, xoá thuộc tính…).
  const selKeys = sel.keys.filter((r) => { const p = parseKeyRef(r); return !!p && (times.get(p.path)?.length ?? 0) > p.i; });
  const selSet = new Set(selKeys);

  // ── kích thước và thu phóng ──
  const scroller = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ w: 0, left: 0 });
  useEffect(() => {
    const el = scroller.current; if (!el) return;
    const read = () => setView((v) => (v.w === el.clientWidth && v.left === el.scrollLeft ? v : { w: el.clientWidth, left: el.scrollLeft }));
    read();
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(read); };
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(read) : null; ro?.observe(el);
    return () => { el.removeEventListener('scroll', onScroll); ro?.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  const laneW = Math.max(120, view.w - tree - 16); // chừa lề phải để keyframe cuối không chạm mép
  const fit = fitPps(laneW - PAD, duration);
  const [zoom, setZoom] = useState<number | null>(null); // null = vừa khung
  const pps = zoom === null ? fit : clampPps(zoom, fit);
  const contentW = PAD + Math.max(laneW - PAD, duration * pps) + 16;
  const live = useRef({ pps, fit, tree, duration, widget, sel: { keys: selKeys, row: sel.row }, times, keyRows, locked });
  live.current = { pps, fit, tree, duration, widget, sel: { keys: selKeys, row: sel.row }, times, keyRows, locked };

  const zoomBy = (factor: number, anchorX?: number) => {
    const el = scroller.current, L = live.current; if (!el) return;
    const ax = anchorX ?? Math.min(laneW, Math.max(0, playback.get().t * L.pps - el.scrollLeft)); // nút: giữ vạch phát đứng yên
    const z = zoomAround(L.pps, factor, ax, el.scrollLeft, L.fit);
    setZoom(z.pps <= L.fit * 1.0001 ? null : z.pps);
    requestAnimationFrame(() => { el.scrollLeft = z.scrollLeft; });
  };
  // Ctrl/⌘ + cuộn: thu phóng quanh con trỏ (cần listener không passive để chặn thu phóng cả trang).
  useEffect(() => {
    const el = scroller.current; if (!el) return;
    const h = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const r = el.getBoundingClientRect(), L = live.current;
      const ax = e.clientX - r.left - L.tree - PAD;
      if (ax < -PAD) return;
      const z = zoomAround(L.pps, Math.exp(-e.deltaY * 0.0015), ax, el.scrollLeft, L.fit);
      setZoom(z.pps <= L.fit * 1.0001 ? null : z.pps);
      requestAnimationFrame(() => { el.scrollLeft = z.scrollLeft; });
    };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);

  // ── sửa dữ liệu ──
  const keyAnim = (p: string): KeyAnimation | null => { const a = live.current.widget.animate?.[p]; return a && !isBinding(a) ? a : null; };
  const batch = (fn: () => void) => { gesture.begin(); try { fn(); } finally { gesture.end(); } };
  const removeSelected = () => {
    if (live.current.locked || !selKeys.length) return;
    batch(() => { for (const [p, idx] of groupRefs(selKeys)) { const a = keyAnim(p); if (a) onAnimate(p, removeKeys(a, idx)); } });
    onSel({ keys: [], row: sel.row });
  };
  const shiftSelected = (dt: number) => {
    if (live.current.locked || !selKeys.length) return;
    const all = selKeys.map((r) => { const q = parseKeyRef(r)!; return times.get(q.path)?.[q.i] ?? NaN; });
    const d = clampShift(all, dt, duration);
    const next: string[] = [];
    batch(() => { for (const [p, idx] of groupRefs(selKeys)) { const a = keyAnim(p); if (!a) continue; const m = moveKeys(a, idx, d, duration, tempoMap); onAnimate(p, m.anim, 'knudge'); next.push(...m.idx.map((j) => keyRef(p, j))); } });
    onSel({ keys: next, row: sel.row });
  };
  const toggleAnim = (f: AnimField) => {
    if (locked) return;
    if (animate[f.path]) { onAnimate(f.path, null); onSel({ keys: selKeys.filter((r) => parseKeyRef(r)?.path !== f.path), row: f.path }); return; }
    onAnimate(f.path, newKeyAnimation(widget, f.path, playback.get().t));
    onSel({ keys: [keyRef(f.path, 0)], row: f.path });
  };
  /** Thêm keyframe tại `t` (giá trị liền mạch: giá trị của hoạt hình tại `t`), hoặc bật hoạt hình nếu chưa có. */
  const addAt = (f: AnimField, t: number) => {
    if (locked) return;
    const a = keyAnim(f.path);
    if (a && a.keys.length >= MAX_ANIM_KEYS) return;
    if (!a && (animate[f.path] || used.length >= MAX_ANIMATIONS)) return; // binding: không thêm keyframe
    const next = a ? addKey(a, t, sampleTrack(compileTrack(a, { tempoMap }), t)) : newKeyAnimation(widget, f.path, t);
    onAnimate(f.path, next);
    const i = keyAt(keySecs(next, tempoMap), t);
    onSel({ keys: i >= 0 ? [keyRef(f.path, i)] : [], row: f.path });
  };

  // ── kéo hình thoi ──
  const [chip, setChip] = useState<{ t: number; path: string; i: number } | null>(null);
  const startKeyDrag = (e: RPointerEvent<HTMLButtonElement>, path: string, i: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const ref = keyRef(path, i), additive = e.shiftKey || e.ctrlKey || e.metaKey;
    let keys = selKeys;
    if (additive) {
      if (selSet.has(ref)) { onSel({ keys: selKeys.filter((r) => r !== ref), row: path }); return; }
      keys = [...selKeys, ref];
    } else if (!selSet.has(ref)) keys = [ref];
    onSel({ keys, row: path });
    if (locked) return;
    const groups = groupRefs(keys), orig = new Map<string, KeyAnimation>();
    for (const p of groups.keys()) { const a = keyAnim(p); if (a) orig.set(p, a); }
    const selTimes = keys.map((r) => { const q = parseKeyRef(r)!; return times.get(q.path)?.[q.i] ?? NaN; });
    const grabT = times.get(path)?.[i] ?? 0;
    const pick = new Set(keys);
    const targets = [playback.get().t, ...beatTimes(tempoMap, duration)];
    for (const [p, ts] of times) ts.forEach((t, j) => { if (!pick.has(keyRef(p, j))) targets.push(t); });
    const x0 = e.clientX, el: Window = window;
    let moved = false;
    const move = (m: PointerEvent) => {
      const dx = m.clientX - x0;
      if (!moved && Math.abs(dx) < DRAG_SLOP) return;
      if (!moved) { moved = true; gesture.begin(); }
      const L = live.current;
      let target = grabT + dx / L.pps;
      if (!m.altKey) target = snapTime(target, targets, L.pps).t;
      const dt = clampShift(selTimes, target - grabT, duration);
      const next: string[] = [];
      for (const [p, idx] of groups) { const a = orig.get(p); if (!a) continue; const r = moveKeys(a, idx, dt, duration, tempoMap); onAnimate(p, r.anim, 'kdrag'); next.push(...r.idx.map((j) => keyRef(p, j))); }
      onSel({ keys: next, row: path });
      const mine = next.find((r) => parseKeyRef(r)?.path === path);
      setChip({ t: grabT + dt, path, i: mine ? parseKeyRef(mine)!.i : i });
    };
    const up = () => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      if (moved) gesture.end();
      setChip(null);
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };

  // ── chọn bằng hộp (kéo trên chỗ trống của làn) ──
  const lanes = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);
  const startBox = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !lanes.current) return;
    // Toạ độ trong làn (đã gồm phần cuộn, vì làn nằm trong vùng cuộn). Lưu điểm đầu theo toạ độ màn hình để vùng cuộn trôi vẫn đúng.
    const r0 = lanes.current.getBoundingClientRect();
    const p0 = { x: e.clientX - r0.left, y: e.clientY - r0.top }, base = e.shiftKey || e.ctrlKey || e.metaKey ? selKeys : [];
    const itemAt = (y: number) => items[Math.floor(y / ROW_H)];
    const el: Window = window;
    let moved = false;
    const move = (m: PointerEvent) => {
      const rr = lanes.current!.getBoundingClientRect();
      const p = { x: m.clientX - rr.left, y: m.clientY - rr.top }, q0 = { x: p0.x + (r0.left - rr.left), y: p0.y + (r0.top - rr.top) };
      if (!moved && Math.hypot(p.x - q0.x, p.y - q0.y) < DRAG_SLOP) return;
      moved = true;
      setBox({ x0: q0.x, y0: q0.y, x1: p.x, y1: p.y });
      const L = live.current;
      const [ya, yb] = q0.y <= p.y ? [q0.y, p.y] : [p.y, q0.y];
      const rows = items.flatMap((it, k) => (it.kind === 'row' && (k + 1) * ROW_H > ya && k * ROW_H < yb ? [{ path: it.f.path, times: it.times }] : []));
      const picked = keysInBox(rows, 0, rows.length - 1, (q0.x - PAD) / L.pps, (p.x - PAD) / L.pps);
      onSel({ keys: [...new Set([...base, ...picked])], row: L.sel.row });
    };
    const up = () => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      setBox(null);
      if (!moved) { const it = itemAt(p0.y); onSel({ keys: base, row: it && it.kind === 'row' ? it.f.path : live.current.sel.row }); }
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
  const onLaneDouble = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!lanes.current) return;
    const r = lanes.current.getBoundingClientRect(), it = items[Math.floor((e.clientY - r.top) / ROW_H)];
    if (!it || it.kind !== 'row') return;
    const t = xToTime(e.clientX - r.left - PAD, pps, duration);
    addAt(it.f, e.altKey ? t : snapTime(t, [playback.get().t, ...beatTimes(tempoMap, duration)], pps).t);
  };

  // ── thước: kéo để tua ──
  const scrub = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const ruler = e.currentTarget, el: Window = window;
    const seek = (x: number) => playback.seek(xToTime(x - ruler.getBoundingClientRect().left - PAD, live.current.pps, live.current.duration));
    seek(e.clientX);
    const move = (m: PointerEvent) => seek(m.clientX);
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };

  // ── bàn phím ──
  const onKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isTextEntry(e.target)) return;
    const mod = e.ctrlKey || e.metaKey;
    // Delete trong Timeline chỉ xoá keyframe; chưa chọn keyframe thì không làm gì (không để lọt ra Editor và xoá cả widget).
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); removeSelected(); return; }
    if (e.key === 'Escape' && (selKeys.length || sel.row)) { e.preventDefault(); e.stopPropagation(); onSel(NO_SEL); return; }
    if (mod && e.code === 'KeyA' && !e.shiftKey) {
      e.preventDefault(); e.stopPropagation();
      onSel({ keys: keyRows.flatMap((x) => x.times.map((_, i) => keyRef(x.f.path, i))), row: sel.row }); return;
    }
    if (!mod && !e.altKey && (e.key === 'u' || e.key === 'U')) { e.preventDefault(); e.stopPropagation(); setOnlyAnimated((v) => !v); return; }
    if (e.altKey && !mod && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && selKeys.length) {
      e.preventDefault(); e.stopPropagation(); shiftSelected((e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1 : FRAME));
    }
  };
  const focusKey = (path: string, i: number) => requestAnimationFrame(() => scroller.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(keyRef(path, i))}"]`)?.focus());
  const onDiamondKey = (e: KeyboardEvent<HTMLButtonElement>, row: Extract<Item, { kind: 'row' }>, i: number) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const t = row.times[i];
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); playback.seek(t); return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); e.stopPropagation();
      const order = row.times.map((x, j) => ({ x, j })).sort((a, b) => a.x - b.x || a.j - b.j), at = order.findIndex((o) => o.j === i);
      const nb = order[at + (e.key === 'ArrowLeft' ? -1 : 1)];
      if (!nb) return;
      onSel({ keys: e.shiftKey ? [...new Set([...selKeys, keyRef(row.f.path, nb.j)])] : [keyRef(row.f.path, nb.j)], row: row.f.path });
      focusKey(row.f.path, nb.j); return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault(); e.stopPropagation();
      const k = keyRows.indexOf(row), step = e.key === 'ArrowUp' ? -1 : 1;
      for (let r = k + step; r >= 0 && r < keyRows.length; r += step) {
        const o = keyRows[r]; if (!o.times.length) continue;
        let best = 0; o.times.forEach((x, j) => { if (Math.abs(x - t) < Math.abs(o.times[best] - t)) best = j; });
        onSel({ keys: [keyRef(o.f.path, best)], row: o.f.path }); focusKey(o.f.path, best); return;
      }
    }
  };

  // ── vẽ ──
  const step = rulerStep(pps), from = view.left / pps - step, to = (view.left + laneW + tree) / pps + step;
  const ticks = rulerTicks(Math.max(0, from), Math.min(duration, to), step);
  const minor = pps * step / 4 >= 10 ? rulerTicks(Math.max(0, from), Math.min(duration, to), step / 4).filter((t) => !ticks.includes(t)) : [];
  const height = RULER_H + items.length * ROW_H;
  const shown = (a: Animation | undefined) => (a ? (isBinding(a) ? 'bind' : 'keys') : 'none');
  const empty = onlyAnimated && keyRows.length === 0;

  return (
    <div className="relative h-full min-h-0" onKeyDown={onKeys} data-testid="keyframe-timeline">
      <div ref={scroller} className="tl-scroll relative h-full overflow-auto overscroll-contain" data-testid="timeline-scroller">
        <div className="relative" style={{ width: tree + contentW, minHeight: '100%', height }}>
          {/* Hàng thước: góc trái chứa công cụ (lọc, thu phóng), bên phải là thước kéo để tua. */}
          <div className="sticky top-0 z-30 flex" style={{ height: RULER_H }}>
            <div className="sticky left-0 z-40 flex shrink-0 items-center gap-0.5 border-b border-r border-line bg-surface px-1.5" style={{ width: tree }}>
              <button type="button" className="tog" aria-pressed={onlyAnimated} onClick={() => setOnlyAnimated((v) => !v)} data-testid="timeline-filter"
                aria-label={i18n.t('web.timeline.onlyAnimated')} title={`${i18n.t('web.timeline.onlyAnimated')} (U)`}><Filter className="h-3.5 w-3.5" /></button>
              <span className="ml-auto" />
              <button type="button" className="tog" onClick={() => zoomBy(1 / 1.5)} disabled={zoom === null} aria-label={i18n.t('web.timeline.zoomOut')} title={i18n.t('web.timeline.zoomHint', { name: i18n.t('web.timeline.zoomOut') })} data-testid="timeline-zoom-out"><ZoomOut className="h-3.5 w-3.5" /></button>
              <button type="button" className="tog" onClick={() => setZoom(null)} aria-pressed={zoom === null} aria-label={i18n.t('web.timeline.zoomFit')} title={i18n.t('web.timeline.zoomFit')} data-testid="timeline-zoom-fit"><FitWidth className="h-3.5 w-3.5" /></button>
              <button type="button" className="tog" onClick={() => zoomBy(1.5)} disabled={pps >= 2399} aria-label={i18n.t('web.timeline.zoomIn')} title={i18n.t('web.timeline.zoomHint', { name: i18n.t('web.timeline.zoomIn') })} data-testid="timeline-zoom-in"><ZoomIn className="h-3.5 w-3.5" /></button>
            </div>
            <div className="relative shrink-0 cursor-ew-resize touch-none border-b border-line bg-surface" style={{ width: contentW }} onPointerDown={scrub} data-testid="timeline-ruler"
              aria-hidden title={i18n.t('web.timeline.rulerHint')}>
              {minor.map((t) => <span key={`m${t}`} className="absolute bottom-0 h-1.5 w-px bg-line" style={{ left: PAD + t * pps }} />)}
              {ticks.map((t) => (
                <span key={t} className="absolute bottom-0 flex h-full items-end" style={{ left: PAD + t * pps }}>
                  <span className="h-2.5 w-px bg-control" />
                  <span className="absolute bottom-2.5 left-1 whitespace-nowrap text-[11px] tabular-nums text-muted">{rulerLabel(t, step)}</span>
                </span>
              ))}
              <PlayheadHead playback={playback} pps={pps} />
            </div>
          </div>

          {/* Vạch chia dọc theo vạch thước, phủ cả các làn (dưới cột cây dính). */}
          <div aria-hidden className="pointer-events-none absolute bottom-0 z-0" style={{ left: tree + PAD, top: RULER_H, width: contentW - PAD }}>
            {ticks.map((t) => <span key={t} className="absolute inset-y-0 w-px bg-line/60" style={{ left: t * pps }} />)}
          </div>

          {/* Các hàng: cột cây dính trái + làn keyframe. Làn nhận kéo chọn hộp và nhấp đúp thêm keyframe. */}
          <div className="relative flex">
            <div className="sticky left-0 z-20 shrink-0 bg-surface" style={{ width: tree }} role="group" aria-label={i18n.t('web.timeline.props')}>
              {items.map((it) => it.kind === 'group' ? (
                <div key={it.id} className="flex items-center border-b border-r border-line bg-page/40" style={{ height: ROW_H }}>
                  <button type="button" aria-expanded={it.open} className="flex h-full min-w-0 flex-1 items-center gap-1.5 px-1.5 text-left text-xs font-semibold text-fg hover:bg-raised" data-testid={`timeline-group-${it.id}`}
                    onClick={() => setClosed((s) => { const n = new Set(s); if (n.has(it.id)) n.delete(it.id); else n.add(it.id); return n; })}>
                    <ChevronRight className={`h-3 w-3 shrink-0 text-faint transition-transform duration-150 ${it.open ? 'rotate-90' : ''}`} />
                    <span className="min-w-0 truncate">{i18n.t(GROUPS.find((g) => g.id === it.id)!.key)}</span>
                    {it.count > 0 && <span className="ml-auto pr-1 font-normal tabular-nums text-muted">{i18n.t('web.timeline.animatedCount', { n: it.count })}</span>}
                  </button>
                </div>
              ) : (
                <TreeRow key={it.f.path} f={it.f} name={label(it.f)} anim={it.anim} times={it.times} widget={widget} tempoMap={tempoMap} playback={playback} locked={locked}
                  selected={sel.row === it.f.path} full={!it.anim && used.length >= MAX_ANIMATIONS}
                  onPick={() => onSel({ keys: selKeys.filter((r) => parseKeyRef(r)?.path === it.f.path), row: it.f.path })}
                  onToggle={() => toggleAnim(it.f)} onAddHere={() => addAt(it.f, playback.get().t)}
                  onRemoveHere={(i) => { const a = keyAnim(it.f.path); if (a && !locked) { onAnimate(it.f.path, removeKey(a, i)); onSel({ keys: [], row: it.f.path }); } }}
                  onValue={(v) => {
                    const a = keyAnim(it.f.path); if (!a || locked) return;
                    const t = playback.get().t, i = keyAt(it.times, t);
                    onAnimate(it.f.path, i >= 0 ? setKey(a, i, { value: v }) : addKey(a, t, v), 'val');
                  }} />
              ))}
              {empty && (
                <div className="border-r border-line px-3 py-2 text-xs leading-snug text-muted" data-testid="timeline-none-animated">
                  <p>{i18n.t('web.timeline.noneAnimated')}</p>
                  <button type="button" className="mt-1 text-fg underline underline-offset-2" onClick={() => setOnlyAnimated(false)}>{i18n.t('web.timeline.showAll')}</button>
                </div>
              )}
            </div>
            <div ref={lanes} className="relative shrink-0 touch-none" style={{ width: contentW, height: items.length * ROW_H }} onPointerDown={startBox} onDoubleClick={onLaneDouble} data-testid="timeline-lanes">
              {items.map((it, k) => it.kind === 'group' ? (
                <div key={it.id} className="absolute inset-x-0 border-b border-line bg-page/40" style={{ top: k * ROW_H, height: ROW_H }} />
              ) : (
                <div key={it.f.path} className={`absolute inset-x-0 border-b border-line/70 ${sel.row === it.f.path ? 'bg-raised/70' : ''}`} style={{ top: k * ROW_H, height: ROW_H }} data-lane={it.f.path} data-mode={shown(it.anim)}>
                  <div className="absolute inset-y-0 right-0" style={{ left: PAD }}>
                  {it.anim && isBinding(it.anim) ? (
                    <div className="absolute inset-y-1.5 left-0 flex items-center overflow-hidden rounded-sm border border-control bg-raised px-2 text-[11px] text-muted" style={{ width: duration * pps }}>
                      <span className="sticky left-2 truncate">{i18n.t('web.timeline.bound', { source: i18n.t(`web.anim.src.${it.anim.bind}`) })}</span>
                    </div>
                  ) : it.anim ? (
                    <Keys row={it} pps={pps} sel={selSet} name={label(it.f)} locked={locked}
                      onDown={(e, i) => startKeyDrag(e, it.f.path, i)} onKey={(e, i) => onDiamondKey(e, it, i)} />
                  ) : null}
                  </div>
                </div>
              ))}
              {box && (
                <div aria-hidden className="pointer-events-none absolute z-10 border border-focus bg-accent/10"
                  style={{ left: Math.min(box.x0, box.x1), top: Math.min(box.y0, box.y1), width: Math.abs(box.x1 - box.x0), height: Math.abs(box.y1 - box.y0) }} />
              )}
              {chip && (
                <div aria-hidden className="pointer-events-none absolute z-30 -translate-x-1/2 whitespace-nowrap rounded-sm border border-control bg-raised px-1.5 py-0.5 text-[11px] tabular-nums text-fg"
                  style={{ left: PAD + chip.t * pps, top: Math.max(0, items.findIndex((x) => x.kind === 'row' && x.f.path === chip.path) * ROW_H - 22) }} data-testid="timeline-drag-chip">
                  {formatClock(chip.t)}
                </div>
              )}
            </div>
          </div>
          <PlayheadLine playback={playback} pps={pps} tree={tree} scroller={scroller} laneW={laneW} />
        </div>
      </div>
      <Splitter axis="x" grow={1} label={i18n.t('web.panel.resize', { name: i18n.t('web.timeline.props') })} title={i18n.t('web.panel.resizeHint')} controls="timeline-scroller"
        value={tree} min={PANEL_LIMITS.tree[0]} max={PANEL_LIMITS.tree[1]} onResize={onTree} onReset={onTreeReset} testId="split-tree"
        style={{ left: tree }} /* đúng mép phải cột cây: cột này dính trái nên vạch chia không trôi theo cuộn ngang */ />
    </div>
  );
}

/** Hình thoi của một hàng + đoạn nối giữa các keyframe. Hình dạng theo cách đi tiếp: thoi = đều, vuông = giữ rồi nhảy, tròn = cong mượt. */
const Keys = memo(function Keys({ row, pps, sel, name, locked, onDown, onKey }: {
  row: Extract<Item, { kind: 'row' }>; pps: number; sel: ReadonlySet<string>; name: string; locked: boolean;
  onDown(e: RPointerEvent<HTMLButtonElement>, i: number): void; onKey(e: KeyboardEvent<HTMLButtonElement>, i: number): void;
}) {
  const { i18n } = useI18n();
  const a = row.anim as KeyAnimation;
  const order = row.times.map((t, i) => ({ t, i })).filter((x) => Number.isFinite(x.t)).sort((x, y) => x.t - y.t || x.i - y.i);
  // Một điểm dừng Tab cho mỗi hàng: keyframe đầu tiên đang chọn, không thì keyframe đầu.
  const stop = order.find((o) => sel.has(keyRef(row.f.path, o.i)))?.i ?? order[0]?.i;
  return (
    <>
      {order.slice(1).map((o, k) => {
        const prev = order[k], hold = (a.keys[prev.i]?.interp ?? 'linear') === 'hold';
        return <span key={`s${prev.i}`} aria-hidden className={`pointer-events-none absolute top-1/2 ${hold ? 'border-t border-dashed border-control' : 'h-px bg-control/70'}`} style={{ left: prev.t * pps, width: (o.t - prev.t) * pps }} />;
      })}
      {order.map((o) => {
        const k = a.keys[o.i], on = sel.has(keyRef(row.f.path, o.i)), interp = k.interp ?? 'linear';
        const shape = interp === 'hold' ? 'rounded-[1px]' : interp === 'smooth' ? 'rounded-full' : 'rotate-45 rounded-[1px]';
        const music = !('sec' in k.at);
        const text = i18n.t('web.timeline.keyLabel', { name, n: o.i + 1, time: formatClock(o.t), value: typeof k.value === 'number' ? String(Math.round(k.value * 1000) / 1000) : k.value });
        return (
          <button key={o.i} type="button" data-key={keyRef(row.f.path, o.i)} aria-pressed={on} aria-label={text} title={music ? `${text} · ${i18n.t('web.timeline.musicAnchored')}` : text}
            tabIndex={o.i === stop ? 0 : -1} onPointerDown={(e) => onDown(e, o.i)} onKeyDown={(e) => onKey(e, o.i)} onDoubleClick={(e) => e.stopPropagation()}
            className={`group absolute top-0 grid h-6 w-6 -translate-x-1/2 place-items-center outline-none ${locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`} style={{ left: o.t * pps }}>
            <span aria-hidden className={`block h-2.5 w-2.5 border-[1.5px] transition-colors duration-100 ${shape} ${on ? 'border-accent bg-accent' : `border-muted bg-surface group-hover:border-fg`} group-focus-visible:ring-2 group-focus-visible:ring-focus group-focus-visible:ring-offset-1 group-focus-visible:ring-offset-surface`} />
            {music && <span aria-hidden className="absolute bottom-0.5 h-0.5 w-0.5 rounded-full bg-muted" />}
          </button>
        );
      })}
    </>
  );
});

/** Một hàng của cây thuộc tính: đồng hồ | tên | giá trị tại vạch phát | ◀ ◆ ▶. Theo dõi đồng hồ phát riêng (chỉ hàng này vẽ lại mỗi khung). */
function TreeRow({ f, name, anim, times, widget, tempoMap, playback, locked, selected, full, onPick, onToggle, onAddHere, onRemoveHere, onValue }: {
  f: AnimField; name: string; anim: Animation | undefined; times: number[]; widget: WidgetSpec; tempoMap: readonly TempoPoint[]; playback: Playback; locked: boolean;
  selected: boolean; full: boolean; onPick(): void; onToggle(): void; onAddHere(): void; onRemoveHere(i: number): void; onValue(v: number | string): void;
}) {
  const { i18n } = useI18n();
  const keys = anim && !isBinding(anim) ? anim : null;
  // Chỉ dòng có keyframe mới cần t (giá trị, keyframe tại vạch phát, trước/sau): dòng đứng yên không vẽ lại mỗi khung khi phát.
  const t = usePlayback(playback, (s) => (keys ? s.t : 0));
  const compiled = useMemo(() => (keys ? compileTrack(keys, { tempoMap }) : null), [keys, tempoMap]);
  const value = compiled ? sampleTrack(compiled, t) : staticValue(widget, f.path);
  const here = keys ? keyAt(times, t) : -1;
  const prev = keys ? prevKey(times, t) : null, next = keys ? nextKey(times, t) : null;
  const watch = anim ? i18n.t('web.timeline.stopAnim', { name }) : full ? i18n.t('web.timeline.full') : i18n.t('web.timeline.startAnim', { name });
  const nav = 'grid h-6 w-6 shrink-0 place-items-center rounded-sm text-muted transition hover:bg-raised hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent';
  const fmt = (v: number) => String(Math.round(v * 1000) / 1000);
  return (
    <div className={`relative flex items-center gap-0.5 border-b border-r border-line/70 pl-0.5 pr-0.5 ${selected ? 'bg-raised' : ''}`} style={{ height: ROW_H }} data-row={f.path}>
      {selected && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
      <button type="button" className={`grid h-6 w-6 shrink-0 place-items-center rounded-sm transition hover:bg-raised hover:text-fg disabled:opacity-40 ${anim ? 'text-fg' : 'text-faint'}`} aria-pressed={!!anim} aria-label={watch} title={watch} disabled={locked || (full && !anim)} onClick={onToggle} data-testid={`tl-watch-${f.path}`}>
        <Stopwatch className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={`min-w-0 flex-1 truncate py-0.5 pl-0.5 text-left text-xs ${anim ? 'text-fg' : 'text-muted'} hover:text-fg`} title={name} aria-pressed={selected} onClick={onPick} data-testid={`tl-row-${f.path}`}>{name}</button>
      <div className="w-[3.75rem] shrink-0">
        {anim && isBinding(anim) ? (
          <span className="block truncate text-right text-[11px] text-muted" title={i18n.t('web.anim.mode.bind')}>{i18n.t('web.anim.mode.bind')}</span>
        ) : f.kind === 'color' ? (
          <input type="color" aria-label={i18n.t('web.timeline.valueAt', { name })} value={String(value).slice(0, 7)} disabled={!keys || locked} onChange={(e) => onValue(e.target.value)}
            className="h-5 w-full cursor-pointer rounded-sm border border-control bg-raised disabled:cursor-default" title={keys ? undefined : i18n.t('web.timeline.staticHint')} />
        ) : keys ? (
          <NumberField label={i18n.t('web.timeline.valueAt', { name })} value={Number(value)} spec={{ min: f.min, max: f.max, step: f.step }} range={f.range} disabled={locked} onChange={(v) => onValue(v)} className="!min-h-5 !py-0 text-[11px]" />
        ) : (
          <span className="block truncate text-right text-[11px] tabular-nums text-muted" title={i18n.t('web.timeline.staticHint')}>{fmt(Number(value))}</span>
        )}
      </div>
      {!(anim && isBinding(anim)) && (
        <div className="flex shrink-0 items-center" role="group" aria-label={i18n.t('web.timeline.nav', { name })}>
          <button type="button" className={nav} disabled={prev === null} aria-label={i18n.t('web.timeline.prevKey')} title={i18n.t('web.timeline.prevKey')} onClick={() => prev !== null && playback.seek(prev)}><KeyPrev className="h-3 w-3" /></button>
          <button type="button" className={`${nav} ${here >= 0 ? 'text-accent' : ''}`} disabled={locked || (!anim && full)} aria-pressed={here >= 0} data-testid={`tl-here-${f.path}`}
            aria-label={here >= 0 ? i18n.t('web.timeline.removeHere') : i18n.t('web.timeline.addHere')} title={here >= 0 ? i18n.t('web.timeline.removeHere') : i18n.t('web.timeline.addHere')}
            onClick={() => (here >= 0 ? onRemoveHere(here) : onAddHere())}><Diamond className="h-3 w-3" filled={here >= 0} /></button>
          <button type="button" className={nav} disabled={next === null} aria-label={i18n.t('web.timeline.nextKey')} title={i18n.t('web.timeline.nextKey')} onClick={() => next !== null && playback.seek(next)}><KeyNext className="h-3 w-3" /></button>
        </div>
      )}
    </div>
  );
}

/** Đầu vạch phát trên thước. */
function PlayheadHead({ playback, pps }: { playback: Playback; pps: number }) {
  const t = usePlayback(playback, (s) => s.t);
  return <span aria-hidden className="pointer-events-none absolute bottom-0 h-3 w-2.5 -translate-x-1/2 bg-fg [clip-path:polygon(0_0,100%_0,100%_55%,50%_100%,0_55%)]" style={{ left: PAD + t * pps }} />;
}
/** Vạch phát dọc qua các làn (dưới cột cây). Đang phát mà vạch chạy ra khỏi phần đang thấy thì cuộn theo từng trang. */
function PlayheadLine({ playback, pps, tree, scroller, laneW }: { playback: Playback; pps: number; tree: number; scroller: React.RefObject<HTMLDivElement>; laneW: number }) {
  const t = usePlayback(playback, (s) => s.t), playing = usePlayback(playback, (s) => s.playing);
  useEffect(() => {
    const el = scroller.current; if (!el || !playing) return;
    const x = PAD + t * pps;
    if (x < el.scrollLeft || x > el.scrollLeft + laneW) el.scrollLeft = Math.max(0, x - laneW * 0.1);
  }, [t, pps, playing, laneW, scroller]);
  return <span aria-hidden className="pointer-events-none absolute bottom-0 z-10 w-px bg-fg" style={{ left: tree + PAD + t * pps, top: RULER_H }} data-testid="timeline-playhead" />;
}
