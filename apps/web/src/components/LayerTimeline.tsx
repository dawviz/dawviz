// Timeline lớp (tầng 1, D-69, T-112; UI-DIRECTION 5.3, DESIGN.md "Timeline lớp"): thay danh sách Lớp cũ. Bên trái là cột lớp (tay nắm đổi thứ tự,
// tên, mắt, khoá, nút mở keyframe), bên phải là thước và các thanh: mỗi thanh là một khoảng hiển thị của lớp, như clip trong Premiere/After Effects.
// Trên cùng là làn Phase (mốc đoạn bài, dùng cho chỗ giữ {phase}). Một vùng cuộn chung cho hai chiều: cột lớp dính trái, thước dính trên.
//
// Chuột: kéo giữa thanh để dời (mọi lớp đang chọn cùng dời, keyframe đi theo), kéo mép để cắt (keyframe đứng yên); bắt dính vạch phát, mép thanh khác,
// phase và phách (Alt để tắt). Nhấp đúp thanh: mở keyframe của lớp (tầng 2), hoặc mở precomp. Ctrl+cuộn thu phóng ngang, Alt+cuộn đổi độ cao hàng.
// Bàn phím (khi timeline có focus): Ctrl+K tách lớp tại vạch phát, Ctrl+G gom thành precomp, [ / ] đưa đầu/cuối thanh tới vạch phát,
// Alt+[ / Alt+] cắt đầu/cuối tại vạch phát, Alt+←/→ dời 1/30 s (thêm Shift: 1 s), ↑/↓ chọn lớp trên/dưới, Enter mở. Phép thuần ở lib/layerTimeline.ts.
import { memo, useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { MAX_PHASES, MAX_PHASE_NAME, compOf, isKeyAnim, type Phase, type SceneDocument, type TempoPoint, type WidgetSpec } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import type { Playback } from '../lib/playback.ts';
import type { Gesture } from '../lib/storeReact.ts';
import { isTextEntry } from '../lib/a11y.ts';
import { clickIsKeyboard } from '../lib/paintDrag.ts';
import { formatClock } from '../lib/timeFormat.ts';
import { DRAG_SLOP, ROW_H, RULER_H, beatTimes, clampPps, fitPps, keySecs, rulerLabel, rulerStep, rulerTicks, snapTime, xToTime, zoomAround } from '../lib/timeline.ts';
import { clipEdges, clipsOf, moveLayers, trimLayer, type Clip } from '../lib/layerTimeline.ts';
import type { LayerEdit } from '../lib/commands.ts';
import { PANEL_LIMITS } from '../lib/panelLayout.ts';
import { Splitter } from './Splitter.tsx';
import { PAD, PlayheadHead, PlayheadLine } from './KeyframeTimeline.tsx';
import { ChevronRight, Diamond, Eye, EyeOff, FitWidth, Flag, Grip, Lock, Plus, Precomp, RowsShorter, RowsTaller, Scissors, Unlock, ZoomIn, ZoomOut } from './Icons.tsx';

const FRAME = 1 / 30;
const ROW_MIN = 24, ROW_MAX = 64, ROW_STEP = 8;
/** Bề rộng vùng nắm ở hai mép thanh (px). */
const EDGE = 6;
const LAYER_MIME = 'text/x-dawviz-layer';

export interface LayerTimelineProps {
  /** Khung nhìn đang mở (gốc hoặc một precomp, lib/compLens.ts): mốc thời gian theo toàn bài. */
  scene: SceneDocument;
  /** Thứ tự lớp như danh sách: trên cùng trước. */
  order: string[];
  duration: number;
  tempoMap: readonly TempoPoint[];
  playback: Playback;
  phases: Phase[];
  onPhases(list: Phase[], key?: string): void;
  selected: string[];
  onSelect(ids: string[]): void;
  locked: ReadonlySet<string>;
  onLock(id: string): void;
  onLockAll(): void;
  name(id: string): string;
  onVisible(id: string, v: boolean): void;
  onAllVisible(): void;
  /** Kéo qua các mắt/khoá (lib/paintDrag.ts), gắn ở cột lớp. */
  onPaint(e: RPointerEvent<HTMLElement>): void;
  onMoveLayer(id: string, to: number): void;
  onLayers(kind: LayerEdit, next: { widgets: WidgetSpec[] }, key?: string): void;
  onOpenKeys(id: string): void;
  onOpenComp(id: string): void;
  onSplit(): void;
  onPrecompose(): void;
  /** Đang ở trong precomp: các khoảng (thời gian toàn bài) mà lớp precomp đang hiện; ngoài đó làm mờ. */
  bounds: { from: number; to: number }[] | null;
  tree: number;
  onTree(px: number): void;
  onTreeReset(): void;
  gesture: Gesture;
  /** Nút Thêm widget (menu) ở góc trái trên. */
  addMenu: ReactNode;
  /** Ô đổi tên đang mở (id lớp) và cách áp/huỷ: logic kiểm tên ở Editor. */
  editing: string | null;
  onEdit(id: string | null): void;
  renameInput(id: string): ReactNode;
}

type DragState =
  | { kind: 'clip'; mode: 'move' | 'in' | 'out'; id: string; clip: Clip; ids: string[]; snap0: WidgetSpec[]; x0: number; moved: boolean; targets: number[] }
  | { kind: 'phase'; i: number; snap0: Phase[]; x0: number; moved: boolean; targets: number[] };

export function LayerTimeline(props: LayerTimelineProps) {
  const { scene, order, duration, tempoMap, playback, phases, onPhases, selected, onSelect, locked, name, onLayers, gesture, tree } = props;
  const { i18n } = useI18n();
  const byId = useMemo(() => new Map(scene.widgets.map((w) => [w.id, w])), [scene.widgets]);
  const layers = order.map((id) => byId.get(id)).filter((w): w is WidgetSpec => !!w);
  const sel = new Set(selected);
  const [rowH, setRowH] = useState(ROW_MIN + ROW_STEP);

  // ── kích thước và thu phóng (như KeyframeTimeline) ──
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
  const laneW = Math.max(120, view.w - tree - 16);
  const fit = fitPps(laneW - PAD, duration);
  const [zoom, setZoom] = useState<number | null>(null);
  const pps = zoom === null ? fit : clampPps(zoom, fit);
  const contentW = PAD + Math.max(laneW - PAD, duration * pps) + 16;
  const live = useRef({ pps, fit, tree, rowH }); live.current = { pps, fit, tree, rowH };
  const zoomBy = (factor: number) => {
    const el = scroller.current, L = live.current; if (!el) return;
    const ax = Math.min(laneW, Math.max(0, playback.get().t * L.pps - el.scrollLeft));
    const z = zoomAround(L.pps, factor, ax, el.scrollLeft, L.fit);
    setZoom(z.pps <= L.fit * 1.0001 ? null : z.pps);
    requestAnimationFrame(() => { el.scrollLeft = z.scrollLeft; });
  };
  const rows = (d: number) => setRowH((h) => Math.min(ROW_MAX, Math.max(ROW_MIN, h + d * ROW_STEP)));
  // Ctrl/⌘ + cuộn: thu phóng ngang quanh con trỏ; Alt + cuộn: đổi độ cao hàng (thu phóng dọc).
  useEffect(() => {
    const el = scroller.current; if (!el) return;
    const h = (e: WheelEvent) => {
      if (e.altKey && !(e.ctrlKey || e.metaKey)) { e.preventDefault(); setRowH((v) => Math.min(ROW_MAX, Math.max(ROW_MIN, v + (e.deltaY < 0 ? ROW_STEP : -ROW_STEP)))); return; }
      if (!(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      const r = el.getBoundingClientRect(), L = live.current, ax = e.clientX - r.left - L.tree - PAD;
      if (ax < -PAD) return;
      const z = zoomAround(L.pps, Math.exp(-e.deltaY * 0.0015), ax, el.scrollLeft, L.fit);
      setZoom(z.pps <= L.fit * 1.0001 ? null : z.pps);
      requestAnimationFrame(() => { el.scrollLeft = z.scrollLeft; });
    };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, []);

  // ── đích bắt dính ──
  const beats = useMemo(() => beatTimes(tempoMap, duration), [tempoMap, duration]);
  const targetsFor = (skip: ReadonlySet<string>, skipPhase = -1) => [playback.get().t, 0, duration, ...phases.filter((_, k) => k !== skipPhase).map((p) => p.start), ...clipEdges(scene.widgets, skip, duration), ...beats];

  // ── kéo thanh / mép thanh / mốc phase ──
  const drag = useRef<DragState | null>(null);
  const [snapLine, setSnapLine] = useState<number | null>(null);
  const [chip, setChip] = useState<{ t: number; y: number } | null>(null);
  const endDrag = () => {
    const d = drag.current; drag.current = null; setSnapLine(null); setChip(null);
    if (d?.moved) gesture?.end();
  };
  useEffect(() => () => { if (drag.current?.moved) gesture?.end(); }, [gesture]);
  const onMove = (e: PointerEvent) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.x0;
    if (!d.moved) { if (Math.abs(dx) < DRAG_SLOP) return; d.moved = true; gesture?.begin(); }
    const L = live.current, raw = dx / L.pps;
    if (d.kind === 'phase') {
      const p0 = d.snap0[d.i], s = e.altKey ? { t: p0.start + raw, snapped: false } : snapTime(p0.start + raw, d.targets, L.pps);
      const t = Math.min(duration, Math.max(0, s.t));
      onPhases(d.snap0.map((p, k) => (k === d.i ? { ...p, start: Math.round(t * 1000) / 1000 } : p)).sort((a, b) => a.start - b.start), 'phasedrag');
      setSnapLine(s.snapped ? t : null); setChip({ t, y: 0 });
      return;
    }
    const y = layers.findIndex((w) => w.id === d.id) * L.rowH + ROW_H; // dưới làn phase
    if (d.mode === 'move') {
      // bắt dính đầu hoặc cuối thanh đang nắm, đầu nào gần đích hơn
      const a = snapTime(d.clip.from + raw, d.targets, L.pps), b = snapTime(d.clip.to + raw, d.targets, L.pps);
      const pick = e.altKey ? { dt: raw, line: null } : a.snapped && (!b.snapped || Math.abs(a.t - d.clip.from - raw) <= Math.abs(b.t - d.clip.to - raw)) ? { dt: a.t - d.clip.from, line: a.t } : b.snapped ? { dt: b.t - d.clip.to, line: b.t } : { dt: raw, line: null };
      const r = moveLayers(d.snap0, d.ids, pick.dt, tempoMap);
      onLayers('moveClips', { widgets: r.widgets }, 'clipdrag');
      setSnapLine(pick.line !== null && r.dt === pick.dt ? pick.line : null); setChip({ t: d.clip.from + r.dt, y });
      return;
    }
    const edge0 = d.mode === 'in' ? d.clip.from : d.clip.to, s = e.altKey ? { t: edge0 + raw, snapped: false } : snapTime(edge0 + raw, d.targets, L.pps);
    const w0 = d.snap0.find((w) => w.id === d.id)!, w1 = trimLayer(w0, d.clip.i, d.mode, s.t, duration);
    onLayers('trimClip', { widgets: d.snap0.map((w) => (w.id === d.id ? w1 : w)) }, 'cliptrim');
    const c1 = clipsOf(w1, duration)[d.clip.i];
    setSnapLine(s.snapped ? s.t : null); setChip({ t: d.mode === 'in' ? c1.from : c1.to, y });
  };
  const listen = () => {
    const up = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); endDrag(); };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  };
  const startClip = (e: RPointerEvent<HTMLElement>, w: WidgetSpec, clip: Clip) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const add = e.shiftKey || e.ctrlKey || e.metaKey;
    const nextSel = add ? (sel.has(w.id) ? selected.filter((x) => x !== w.id) : [...selected, w.id]) : sel.has(w.id) ? selected : [w.id];
    if (nextSel.join() !== selected.join()) onSelect(nextSel);
    if (locked.has(w.id) || add) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect(), x = e.clientX - r.left;
    const mode = x <= EDGE ? 'in' : x >= r.width - EDGE ? 'out' : 'move';
    const ids = mode === 'move' ? nextSel.filter((id) => !locked.has(id) && byId.has(id)) : [w.id];
    drag.current = { kind: 'clip', mode, id: w.id, clip, ids, snap0: scene.widgets, x0: e.clientX, moved: false, targets: targetsFor(new Set(ids)) };
    listen();
  };
  const startPhase = (e: RPointerEvent<HTMLElement>, i: number) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    drag.current = { kind: 'phase', i, snap0: phases, x0: e.clientX, moved: false, targets: targetsFor(new Set(), i) };
    listen();
  };

  // ── thước: kéo để tua; vạch phát bắt dính vào mép thanh và phase (Alt để tắt) ──
  const scrub = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const ruler = e.currentTarget, targets = targetsFor(new Set()).slice(1);
    const seek = (x: number, alt: boolean) => {
      const L = live.current, raw = xToTime(x - ruler.getBoundingClientRect().left - PAD, L.pps, duration);
      const s = alt ? { t: raw, snapped: false } : snapTime(raw, targets, L.pps);
      playback.seek(s.t); setSnapLine(s.snapped ? s.t : null);
    };
    seek(e.clientX, e.altKey);
    const move = (m: PointerEvent) => seek(m.clientX, m.altKey);
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); setSnapLine(null); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  };

  // ── phase ──
  const [phaseEdit, setPhaseEdit] = useState<number | null>(null);
  const addPhase = (t: number) => {
    if (phases.length >= MAX_PHASES) return;
    const at = Math.round(Math.min(duration, Math.max(0, t)) * 1000) / 1000;
    if (phases.some((p) => Math.abs(p.start - at) < 1e-3)) return;
    const n = phases.length + 1;
    const list = [...phases, { name: i18n.t('web.phase.defaultName', { n }), start: at }].sort((a, b) => a.start - b.start);
    onPhases(list); setPhaseEdit(list.findIndex((p) => p.start === at));
  };
  const renamePhase = (i: number, raw: string) => {
    setPhaseEdit(null);
    const v = raw.replace(/\s+/g, ' ').trim().slice(0, MAX_PHASE_NAME);
    if (!v || v === phases[i]?.name) return;
    onPhases(phases.map((p, k) => (k === i ? { ...p, name: v } : p)));
  };
  const removePhase = (i: number) => onPhases(phases.filter((_, k) => k !== i));

  // ── thao tác bàn phím trên lớp đang chọn ──
  const movable = selected.filter((id) => byId.has(id) && !locked.has(id));
  const nudge = (dt: number) => { if (movable.length) onLayers('moveClips', { widgets: moveLayers(scene.widgets, movable, dt, tempoMap).widgets }); };
  const toPlayhead = (edge: 'in' | 'out', trim: boolean) => {
    const t = playback.get().t;
    if (!movable.length) return;
    let ws = scene.widgets;
    for (const id of movable) {
      const w = ws.find((x) => x.id === id)!, cs = clipsOf(w, duration);
      if (trim) {
        const i = cs.findIndex((c) => t > c.from && t < c.to); if (i < 0) continue;
        ws = ws.map((x) => (x.id === id ? trimLayer(x, i, edge, t, duration) : x));
      } else {
        const ref = edge === 'in' ? cs[0].from : cs[cs.length - 1].to;
        ws = moveLayers(ws, [id], t - ref, tempoMap).widgets;
      }
    }
    onLayers(trim ? 'trimClip' : 'moveClips', { widgets: ws });
  };
  const onKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isTextEntry(e.target)) return;
    const mod = e.ctrlKey || e.metaKey;
    const stop = () => { e.preventDefault(); e.stopPropagation(); };
    if (mod && !e.altKey && !e.shiftKey && e.code === 'KeyK') { stop(); props.onSplit(); return; }
    if (mod && !e.altKey && !e.shiftKey && e.code === 'KeyG') { stop(); props.onPrecompose(); return; }
    if (!mod && (e.code === 'BracketLeft' || e.code === 'BracketRight')) { stop(); toPlayhead(e.code === 'BracketLeft' ? 'in' : 'out', e.altKey); return; }
    if (e.altKey && !mod && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      stop();
      const dt = (e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1 : FRAME), fp = (e.target as HTMLElement).dataset?.phase;
      if (fp === undefined) { nudge(dt); return; }
      // mốc phase đang có focus: dời mốc đó (giữ focus trên đúng mốc sau khi sắp lại)
      const k = Number(fp), p = phases[k]; if (!p) return;
      const start = Math.round(Math.min(duration, Math.max(0, p.start + dt)) * 1000) / 1000;
      if (phases.some((q, j) => j !== k && Math.abs(q.start - start) < 1e-3)) return;
      const list = phases.map((q, j) => (j === k ? { ...q, start } : q)).sort((a, c) => a.start - c.start);
      onPhases(list, 'phasenudge');
      const at = list.findIndex((q) => q.start === start && q.name === p.name);
      requestAnimationFrame(() => scroller.current?.querySelector<HTMLElement>(`[data-phase="${at}"]`)?.focus());
      return;
    }
    if (!mod && !e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown') && layers.length) {
      stop();
      const cur = layers.findIndex((w) => w.id === selected[selected.length - 1]);
      const j = cur < 0 ? 0 : Math.min(layers.length - 1, Math.max(0, cur + (e.key === 'ArrowUp' ? -1 : 1)));
      onSelect([layers[j].id]);
      requestAnimationFrame(() => scroller.current?.querySelector<HTMLElement>(`[data-clip-of="${CSS.escape(layers[j].id)}"]`)?.focus());
      return;
    }
    if (e.key === 'Enter' && !mod && selected.length === 1 && byId.has(selected[0])) { stop(); open(selected[0]); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const focusedPhase = (e.target as HTMLElement).dataset?.phase;
      if (focusedPhase !== undefined) { stop(); removePhase(Number(focusedPhase)); }
    }
  };
  const open = (id: string) => { const w = byId.get(id); if (!w) return; if (compOf(w)) props.onOpenComp(id); else props.onOpenKeys(id); };

  // ── kéo thả đổi thứ tự lớp (tay nắm) ──
  const [drop, setDrop] = useState<{ i: number; after: boolean } | null>(null);
  const dragId = useRef<string | null>(null);
  const rowDrag = (i: number) => ({
    onDragOver: (e: DragEvent<HTMLLIElement>) => {
      if (!e.dataTransfer.types.includes(LAYER_MIME)) return;
      e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      const r = e.currentTarget.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
      setDrop((d) => (d && d.i === i && d.after === after ? d : { i, after }));
    },
    onDragLeave: (e: DragEvent<HTMLLIElement>) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrop((d) => (d?.i === i ? null : d)); },
    onDrop: (e: DragEvent<HTMLLIElement>) => {
      const id = e.dataTransfer.getData(LAYER_MIME) || dragId.current, d = drop;
      setDrop(null); dragId.current = null;
      if (!id || !d) return;
      e.preventDefault();
      const from = order.indexOf(id);
      let to = d.after ? d.i + 1 : d.i;
      if (from < to) to -= 1;
      props.onMoveLayer(id, to);
    },
  });

  // Kéo trên tên lớp để chọn một dãy lớp (giữ Shift/Ctrl/⌘ để cộng vào vùng chọn đang có). Lần nhấp kèm theo của lần kéo bị bỏ qua.
  const dragged = useRef(false);
  const orderRef = useRef(order); orderRef.current = order;
  const selRef = useRef(selected); selRef.current = selected;
  const startNameSelect = (e: RPointerEvent<HTMLElement>, startId: string) => {
    if ((e.button ?? 0) !== 0 || e.isPrimary === false) return;
    const baseSel = e.shiftKey || e.metaKey || e.ctrlKey ? selRef.current : [];
    const from = orderRef.current.indexOf(startId); if (from < 0) return;
    const prevSelect = document.body.style.userSelect;
    const idAt = (x: number, y: number) => (document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-layer]'))?.dataset.layer;
    const move = (m: PointerEvent) => {
      const id = idAt(m.clientX, m.clientY), to = id ? orderRef.current.indexOf(id) : -1;
      if (to < 0 || (to === from && !dragged.current)) return;
      if (!dragged.current) { dragged.current = true; document.body.style.userSelect = 'none'; }
      onSelect([...new Set([...baseSel, ...orderRef.current.slice(Math.min(from, to), Math.max(from, to) + 1)])]);
    };
    const done = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', done); window.removeEventListener('pointercancel', done);
      document.body.style.userSelect = prevSelect;
      setTimeout(() => { dragged.current = false; }, 0);
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', done); window.addEventListener('pointercancel', done);
  };

  // ── vẽ ──
  const step = rulerStep(pps), from = view.left / pps - step, to = (view.left + laneW + tree) / pps + step;
  const ticks = rulerTicks(Math.max(0, from), Math.min(duration, to), step);
  const minor = pps * step / 4 >= 10 ? rulerTicks(Math.max(0, from), Math.min(duration, to), step / 4).filter((t) => !ticks.includes(t)) : [];
  const height = RULER_H + ROW_H + layers.length * rowH;
  const hiddenN = layers.filter((w) => !w.visible).length, lockedN = layers.filter((w) => locked.has(w.id)).length;
  const allLocked = lockedN === layers.length && layers.length > 0;
  const eyeLabel = i18n.t(hiddenN ? 'web.editor.allShow' : 'web.editor.allHide');
  const lockLabel = i18n.t(allLocked ? 'web.editor.allUnlock' : 'web.editor.allLock');
  const outside = props.bounds ? gaps(props.bounds, duration) : [];

  return (
    <div className="relative h-full min-h-0 outline-none" tabIndex={-1} onKeyDown={onKeys} data-testid="layer-timeline">
      <div ref={scroller} id="layer-scroller" className="tl-scroll relative h-full overflow-auto overscroll-contain" data-testid="layer-scroller">
        <div className="relative" style={{ width: tree + contentW, minHeight: '100%', height }}>
          {/* Hàng thước: góc trái chứa Thêm, mắt/khoá tổng và thu phóng; bên phải là thước kéo để tua. */}
          <div className="sticky top-0 z-30 flex" style={{ height: RULER_H }}>
            <div className="sticky left-0 z-40 flex shrink-0 items-center gap-0.5 border-b border-r border-line bg-surface pl-1 pr-1.5" style={{ width: tree }} role="group" aria-label={i18n.t('web.editor.layersHead')} data-testid="layers-head">
              <span className="min-w-0 flex-1">{props.addMenu}</span>
              <button type="button" className="tog" onClick={props.onSplit} disabled={!movable.length} aria-label={i18n.t('web.layers.split')} title={`${i18n.t('web.layers.split')} (Ctrl+K)`} data-testid="layers-split"><Scissors className="h-3.5 w-3.5" /></button>
              <button type="button" className="tog" onClick={props.onPrecompose} disabled={!movable.length} aria-label={i18n.t('web.layers.precompose')} title={`${i18n.t('web.layers.precompose')} (Ctrl+G)`} data-testid="layers-precompose"><Precomp className="h-3.5 w-3.5" /></button>
              <span className="mx-0.5 h-4 w-px bg-line" aria-hidden />
              <button type="button" className="tog" onClick={() => zoomBy(1 / 1.5)} disabled={zoom === null} aria-label={i18n.t('web.timeline.zoomOut')} title={i18n.t('web.timeline.zoomHint', { name: i18n.t('web.timeline.zoomOut') })} data-testid="layers-zoom-out"><ZoomOut className="h-3.5 w-3.5" /></button>
              <button type="button" className="tog" onClick={() => setZoom(null)} aria-pressed={zoom === null} aria-label={i18n.t('web.timeline.zoomFit')} title={i18n.t('web.timeline.zoomFit')} data-testid="layers-zoom-fit"><FitWidth className="h-3.5 w-3.5" /></button>
              <button type="button" className="tog" onClick={() => zoomBy(1.5)} disabled={pps >= 2399} aria-label={i18n.t('web.timeline.zoomIn')} title={i18n.t('web.timeline.zoomHint', { name: i18n.t('web.timeline.zoomIn') })} data-testid="layers-zoom-in"><ZoomIn className="h-3.5 w-3.5" /></button>
              <button type="button" className="tog" onClick={() => rows(-1)} disabled={rowH <= ROW_MIN} aria-label={i18n.t('web.layers.rowsShorter')} title={i18n.t('web.layers.rowsHint', { name: i18n.t('web.layers.rowsShorter') })} data-testid="layers-rows-less"><RowsShorter className="h-3.5 w-3.5" /></button>
              <button type="button" className="tog" onClick={() => rows(1)} disabled={rowH >= ROW_MAX} aria-label={i18n.t('web.layers.rowsTaller')} title={i18n.t('web.layers.rowsHint', { name: i18n.t('web.layers.rowsTaller') })} data-testid="layers-rows-more"><RowsTaller className="h-3.5 w-3.5" /></button>
            </div>
            <div className="relative shrink-0 cursor-ew-resize touch-none border-b border-line bg-surface" style={{ width: contentW }} onPointerDown={scrub} data-testid="layers-ruler" aria-hidden title={i18n.t('web.timeline.rulerHint')}>
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

          <div aria-hidden className="pointer-events-none absolute bottom-0 z-0" style={{ left: tree + PAD, top: RULER_H, width: contentW - PAD }}>
            {ticks.map((t) => <span key={t} className="absolute inset-y-0 w-px bg-line/60" style={{ left: t * pps }} />)}
          </div>

          <div className="relative flex">
            {/* Cột lớp: dính trái. Hàng đầu là làn Phase. */}
            <div className="sticky left-0 z-20 shrink-0 bg-surface" style={{ width: tree }} onPointerDown={props.onPaint}>
              <div className="flex items-center gap-1 border-b border-r border-line bg-page/40 pl-2 pr-1" style={{ height: ROW_H }} data-testid="phase-head">
                <Flag className="h-3.5 w-3.5 shrink-0 text-faint" />
                <span className="min-w-0 flex-1 truncate text-xs font-semibold text-fg">{i18n.t('web.phase.title')}</span>
                {phases.length > 0 && <span className="text-[11px] tabular-nums text-muted">{i18n.number(phases.length)}</span>}
                <button type="button" className="tog" disabled={phases.length >= MAX_PHASES} onClick={() => addPhase(playback.get().t)} aria-label={i18n.t('web.phase.addHere')} title={i18n.t('web.phase.addHere')} data-testid="phase-add"><Plus className="h-3.5 w-3.5" /></button>
              </div>
              <ul aria-label={i18n.t('web.editor.layers')} data-testid="layers">
                {layers.map((w, i) => {
                  const on = sel.has(w.id), lk = locked.has(w.id), comp = compOf(w), keyed = Object.values(w.animate ?? {}).some(isKeyAnim);
                  return (
                    <li key={w.id} data-layer={w.id} data-locked={lk || undefined} {...rowDrag(i)}
                      className={`group relative flex items-center gap-1 border-b border-r border-line/70 pl-1 pr-1 ${on ? 'bg-raised' : 'hover:bg-raised'}`} style={{ height: rowH }}>
                      {on && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
                      {drop?.i === i && <span aria-hidden className={`pointer-events-none absolute inset-x-1 h-0.5 bg-focus ${drop.after ? '-bottom-px' : '-top-px'}`} data-testid="layer-drop" />}
                      {lk ? <span aria-hidden className="w-4 shrink-0" />
                        : <span draggable aria-hidden className="grid h-6 w-4 shrink-0 cursor-grab place-items-center text-faint hover:text-fg active:cursor-grabbing" data-testid="layer-grip" title={i18n.t('web.editor.layerDrag', { name: name(w.id) })}
                            onDragStart={(e) => { dragId.current = w.id; e.dataTransfer.setData(LAYER_MIME, w.id); e.dataTransfer.effectAllowed = 'move'; const row = e.currentTarget.closest('[data-layer]'); if (row) e.dataTransfer.setDragImage(row, 16, 12); }}
                            onDragEnd={() => { setDrop(null); dragId.current = null; }}><Grip className="h-3.5 w-3.5" /></span>}
                      {comp && <Precomp className="h-3.5 w-3.5 shrink-0 text-muted" />}
                      {props.editing === w.id ? props.renameInput(w.id) : (
                        <button type="button" aria-pressed={on} onDoubleClick={() => props.onEdit(w.id)} onPointerDown={(e) => startNameSelect(e, w.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'F2') { e.preventDefault(); e.stopPropagation(); props.onEdit(w.id); return; }
                            if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
                            e.preventDefault(); e.stopPropagation(); props.onMoveLayer(w.id, i + (e.key === 'ArrowUp' ? -1 : 1));
                            requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-layer="${CSS.escape(w.id)}"] button[aria-pressed]`)?.focus());
                          }}
                          onClick={(e) => { if (dragged.current) return; onSelect(e.shiftKey || e.metaKey || e.ctrlKey ? (on ? selected.filter((x) => x !== w.id) : [...selected, w.id]) : [w.id]); }}
                          className={`flex min-h-[var(--hit)] min-w-0 flex-1 items-center py-1 text-left text-[13px] transition ${on ? 'font-medium text-fg' : 'text-muted hover:text-fg'}`}>
                          <span className={`truncate ${w.visible ? '' : 'line-through decoration-faint'}`}>{name(w.id)}</span>
                        </button>
                      )}
                      <button type="button" className={`tog ${keyed ? 'text-fg' : ''}`} onClick={() => open(w.id)} data-testid={`layer-open-${w.id}`}
                        aria-label={i18n.t(comp ? 'web.layers.openComp' : 'web.layers.openKeys', { name: name(w.id) })} title={i18n.t(comp ? 'web.layers.openComp' : 'web.layers.openKeys', { name: name(w.id) })}>
                        {comp ? <ChevronRight className="h-3.5 w-3.5" /> : <Diamond className="h-3 w-3" filled={keyed} />}
                      </button>
                      <button type="button" className="tog touch-none" data-paint="eye" data-paint-id={w.id} aria-pressed={!w.visible} aria-label={i18n.t(w.visible ? 'web.editor.hide' : 'web.editor.show', { name: name(w.id) })}
                        title={i18n.t(w.visible ? 'web.editor.hide' : 'web.editor.show', { name: name(w.id) })} onClick={(e) => { if (clickIsKeyboard(e)) props.onVisible(w.id, !w.visible); }}>
                        {w.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button type="button" className="tog touch-none" data-paint="lock" data-paint-id={w.id} aria-pressed={lk} aria-label={i18n.t(lk ? 'web.editor.unlock' : 'web.editor.lock', { name: name(w.id) })}
                        title={i18n.t(lk ? 'web.editor.unlock' : 'web.editor.lock', { name: name(w.id) })} onClick={(e) => { if (clickIsKeyboard(e)) props.onLock(w.id); }}>
                        {lk ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {layers.length > 0 && (
                <div className="flex items-center justify-end gap-0.5 border-r border-line py-1 pl-2 pr-1">
                  <span className="min-w-0 flex-1 truncate text-[11px] text-muted">{i18n.t('web.layers.all')}</span>
                  <button type="button" className="tog" aria-pressed={hiddenN === layers.length && hiddenN > 0 ? true : hiddenN ? 'mixed' : false} aria-label={eyeLabel} title={eyeLabel} onClick={props.onAllVisible} data-testid="layers-all-visible">
                    {hiddenN === layers.length && hiddenN > 0 ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className={`h-3.5 w-3.5 ${hiddenN ? 'opacity-50' : ''}`} />}
                  </button>
                  <button type="button" className="tog" aria-pressed={allLocked ? true : lockedN ? 'mixed' : false} aria-label={lockLabel} title={lockLabel} onClick={props.onLockAll} data-testid="layers-lock-all">
                    {allLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className={`h-3.5 w-3.5 ${lockedN ? 'opacity-50' : ''}`} />}
                  </button>
                </div>
              )}
            </div>

            {/* Làn: phase rồi một làn mỗi lớp. Nhấp chỗ trống bỏ chọn; nhấp đúp làn phase thêm phase. */}
            <div className="relative shrink-0 touch-none" style={{ width: contentW, height: ROW_H + layers.length * rowH }} data-testid="layer-lanes"
              onPointerDown={(e) => { if (e.button === 0 && e.target === e.currentTarget && !(e.shiftKey || e.ctrlKey || e.metaKey)) onSelect([]); }}>
              <div className="absolute inset-x-0 top-0 border-b border-line bg-page/40" style={{ height: ROW_H }} data-testid="phase-lane"
                onDoubleClick={(e) => { if (e.target !== e.currentTarget) return; const r = e.currentTarget.getBoundingClientRect(); addPhase(xToTime(e.clientX - r.left - PAD, pps, duration)); }}>
                {phases.map((p, k) => {
                  const end = phases[k + 1]?.start ?? duration, x = PAD + p.start * pps;
                  return (
                    <div key={`${k}:${p.start}`} className="absolute inset-y-0" style={{ left: x, width: Math.max(2, (end - p.start) * pps) }}>
                      {phaseEdit === k ? (
                        <input autoFocus aria-label={i18n.t('web.phase.name')} defaultValue={p.name} maxLength={MAX_PHASE_NAME} className="absolute left-1 top-0.5 h-5 w-40 border border-control bg-raised px-1 text-xs text-fg"
                          onFocus={(e) => e.currentTarget.select()} onBlur={(e) => renamePhase(k, e.currentTarget.value)}
                          onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); renamePhase(k, e.currentTarget.value); } else if (e.key === 'Escape') { e.preventDefault(); setPhaseEdit(null); } }} data-testid="phase-name-input" />
                      ) : (
                        <button type="button" data-phase={k} className="absolute inset-y-0 left-0 flex max-w-full cursor-grab items-center gap-1 border-l-2 border-fg pl-1 pr-2 text-left text-[11px] text-fg outline-none hover:bg-raised focus-visible:ring-2 focus-visible:ring-focus active:cursor-grabbing"
                          aria-label={i18n.t('web.phase.marker', { name: p.name, time: formatClock(p.start) })} title={`${p.name} · ${formatClock(p.start)} — ${i18n.t('web.phase.markerHint')}`}
                          onPointerDown={(e) => startPhase(e, k)} onDoubleClick={(e) => { e.stopPropagation(); setPhaseEdit(k); }} data-testid={`phase-${k}`}>
                          <span className="truncate">{p.name}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              {layers.map((w, i) => (
                <div key={w.id} className={`absolute inset-x-0 border-b border-line/70 ${sel.has(w.id) ? 'bg-raised/60' : ''}`} style={{ top: ROW_H + i * rowH, height: rowH }} data-lane={w.id}>
                  <Bars w={w} name={name(w.id)} pps={pps} duration={duration} tempoMap={tempoMap} on={sel.has(w.id)} locked={locked.has(w.id)} rowH={rowH}
                    onDown={(e, c) => startClip(e, w, c)} onOpen={() => open(w.id)} />
                </div>
              ))}
              {outside.map((g) => <span key={`o${g.from}`} aria-hidden className="pointer-events-none absolute bottom-0 z-[5] bg-page/70" style={{ top: ROW_H, left: PAD + g.from * pps, width: (g.to - g.from) * pps }} data-testid="comp-outside" />)}
              {snapLine !== null && <span aria-hidden className="pointer-events-none absolute inset-y-0 z-20 w-px bg-guide" style={{ left: PAD + snapLine * pps }} data-testid="layers-snap" />}
              {chip && (
                <div aria-hidden className="pointer-events-none absolute z-30 -translate-x-1/2 whitespace-nowrap rounded-sm border border-control bg-raised px-1.5 py-0.5 text-[11px] tabular-nums text-fg"
                  style={{ left: PAD + chip.t * pps, top: Math.max(0, chip.y - 22) }} data-testid="layers-drag-chip">{formatClock(chip.t)}</div>
              )}
            </div>
          </div>
          <PlayheadLine playback={playback} pps={pps} tree={tree} scroller={scroller} laneW={laneW} />
        </div>
      </div>
      <Splitter axis="x" grow={1} label={i18n.t('web.panel.resize', { name: i18n.t('web.editor.layers') })} title={i18n.t('web.panel.resizeHint')} controls="layer-scroller"
        value={tree} min={PANEL_LIMITS.tree[0]} max={PANEL_LIMITS.tree[1]} onResize={props.onTree} onReset={props.onTreeReset} testId="split-layer-tree" style={{ left: tree }} />
    </div>
  );
}

/** Phần ngoài các khoảng `bounds` trong [0, duration]. */
function gaps(bounds: readonly { from: number; to: number }[], duration: number): { from: number; to: number }[] {
  const out: { from: number; to: number }[] = [];
  let at = 0;
  for (const b of [...bounds].sort((a, c) => a.from - c.from)) { if (b.from > at) out.push({ from: at, to: Math.min(duration, b.from) }); at = Math.max(at, b.to); }
  if (at < duration) out.push({ from: at, to: duration });
  return out.filter((g) => g.to > g.from);
}

/** Các thanh của một lớp + vạch keyframe trên thanh. Mép thanh (EDGE px) là chỗ nắm để cắt. */
const Bars = memo(function Bars({ w, name, pps, duration, tempoMap, on, locked, rowH, onDown, onOpen }: {
  w: WidgetSpec; name: string; pps: number; duration: number; tempoMap: readonly TempoPoint[]; on: boolean; locked: boolean; rowH: number;
  onDown(e: RPointerEvent<HTMLElement>, c: Clip): void; onOpen(): void;
}) {
  const { i18n } = useI18n();
  const clips = clipsOf(w, duration), comp = compOf(w);
  const keys = useMemo(() => [...new Set(Object.values(w.animate ?? {}).flatMap((a) => (isKeyAnim(a) ? keySecs(a, tempoMap) : [])))], [w.animate, tempoMap]);
  return (
    <>
      {clips.map((c, k) => {
        const label = i18n.t('web.layers.clip', { name, from: formatClock(c.from), to: c.open ? i18n.t('web.layers.toEnd') : formatClock(c.to) });
        return (
          <button key={c.i} type="button" data-clip-of={w.id} data-clip={c.i} tabIndex={k === 0 ? 0 : -1} aria-pressed={on} aria-label={label}
            title={`${label}${locked ? '' : ` — ${i18n.t(comp ? 'web.layers.clipHintComp' : 'web.layers.clipHint')}`}`}
            onPointerDown={(e) => onDown(e, c)} onDoubleClick={(e) => { e.stopPropagation(); onOpen(); }}
            className={`group absolute top-1 flex items-center overflow-hidden rounded-sm border text-left text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-focus ${w.visible ? '' : 'opacity-50'} ${on ? 'border-accent bg-accent/15 text-fg' : 'border-control bg-raised text-muted hover:border-line-strong'} ${locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
            style={{ left: PAD + c.from * pps, width: Math.max(4, (c.to - c.from) * pps), bottom: 4 }}>
            {!locked && <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 cursor-ew-resize group-hover:bg-control/60" />}
            {!locked && <span aria-hidden className="absolute inset-y-0 right-0 w-1.5 cursor-ew-resize group-hover:bg-control/60" />}
            <span className="pointer-events-none sticky left-2 flex min-w-0 items-center gap-1 truncate px-2">
              {comp && <Precomp className="h-3 w-3 shrink-0" />}
              {rowH >= 32 || (c.to - c.from) * pps > 48 ? <span className="truncate">{name}</span> : null}
            </span>
            {keys.filter((t) => t >= c.from && t <= c.to).map((t) => (
              <span key={t} aria-hidden className="pointer-events-none absolute bottom-0.5 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-muted" style={{ left: (t - c.from) * pps }} />
            ))}
          </button>
        );
      })}
    </>
  );
});
