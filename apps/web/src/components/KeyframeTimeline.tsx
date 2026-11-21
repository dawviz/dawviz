// Thân panel Timeline (UI-DIRECTION 5.3, DESIGN.md "Timeline"): bên trái là cây thuộc tính của widget đang chọn (đồng hồ bật hoạt hình, tên ngắn,
// giá trị tại vạch phát, đi tới keyframe trước/sau), bên phải là thước và làn keyframe theo thời gian. Một vùng cuộn chung cho hai cột:
// cột cây dính mép trái, thước dính mép trên, nên cuộn dọc/ngang luôn thẳng hàng.
// Dòng có thể gắn nhiều đường dẫn (Vị trí = x + y, lib/timelineRows.ts): keyframe cùng thời điểm của các đường dẫn hiện thành MỘT hình thoi.
// Thao tác: nhấp hình thoi để chọn (Shift/Ctrl/⌘ cộng thêm), kéo để dời (bắt dính vạch phát, keyframe khác và phách; giữ Alt để tắt;
// đang bắt dính thì hiện vạch dẫn), kéo trên chỗ trống để chọn bằng hộp, nhấp đúp vào làn để thêm keyframe, Ctrl+cuộn để thu phóng,
// kéo trên thước để tua (vạch phát bắt dính vào keyframe; Alt để tắt).
// Bàn phím: Delete xoá, Ctrl+A chọn hết, Esc bỏ chọn, U chỉ hiện thuộc tính đang animate, Alt+←/→ dời 1/30 s (thêm Shift: 1 s),
// ←/→ trên hình thoi đi qua keyframe cùng hàng, ↑/↓ sang hàng khác, Enter đưa vạch phát tới keyframe.
// Logic thuần ở lib/timeline.ts và lib/timelineRows.ts; hình dạng hình thoi cho biết cách đi tiếp: thoi = đều, vuông = giữ rồi nhảy, tròn = cong mượt.
import { memo, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import { MAX_ANIMATIONS, MAX_ANIM_KEYS, compileTrack, isBinding, sampleTrack, type Animation, type KeyAnimation, type TempoPoint, type WidgetSpec } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { usePlayback, type Playback } from '../lib/playback.ts';
import type { Gesture } from '../lib/storeReact.ts';
import { isTextEntry } from '../lib/a11y.ts';
import { formatClock } from '../lib/timeFormat.ts';
import { addKey, newKeyAnimation, setKey, staticValue, type AnimField } from '../lib/animateFields.ts';
import {
  DRAG_SLOP, ROW_H, RULER_H, SAME_TIME, beatTimes, clampPps, clampShift, fitPps, groupRefs, keyAt, keyRef, keySecs, moveKeys,
  parseKeyRef, removeKeys, rulerLabel, rulerStep, rulerTicks, snapTime, xToTime, zoomAround,
} from '../lib/timeline.ts';
import { rowKeys, timelineRows, type GroupId, type RowDef, type VKey } from '../lib/timelineRows.ts';
import { PANEL_LIMITS } from '../lib/panelLayout.ts';
import { NumberField } from './NumberField.tsx';
import { Splitter } from './Splitter.tsx';
import { ChevronRight, Diamond, FitWidth, Filter, KeyNext, KeyPrev, Stopwatch, ZoomIn, ZoomOut } from './Icons.tsx';

/** Vùng chọn của Timeline: keyframe (`đường dẫn#chỉ số`) và dòng đang chọn (id của dòng, lib/timelineRows.ts; đích của Animation Inspector). */
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
  /** Nhiều đường dẫn trong một lệnh (một bước hoàn tác). */
  onAnimateMany(changes: Record<string, Animation | null>, key?: string): void;
  gesture: Gesture;
  tree: number;
  onTree(px: number): void;
  onTreeReset(): void;
}

const FRAME = 1 / 30;
/** Lề trái của làn (px): keyframe ở 0:00 không bị cắt nửa ở mép. */
const PAD = 10;
const GROUPS: readonly { id: GroupId; key: string }[] = [{ id: 'transform', key: 'web.timeline.group.transform' }, { id: 'props', key: 'web.timeline.group.props' }];
type Mode = 'none' | 'keys' | 'bind';
type RowItem = { kind: 'row'; row: RowDef; anims: (Animation | undefined)[]; mode: Mode; vkeys: VKey[] };
type Item = { kind: 'group'; id: GroupId; open: boolean; count: number } | RowItem;
const modeOf = (anims: (Animation | undefined)[]): Mode => (anims.some((a) => a && !isBinding(a)) ? 'keys' : anims.some((a) => a) ? 'bind' : 'none');

export function KeyframeTimeline({ widget, tempoMap, duration, playback, locked, sel, onSel, onAnimate, onAnimateMany, gesture, tree, onTree, onTreeReset }: KeyframeTimelineProps) {
  const { i18n } = useI18n();
  const animate = widget.animate ?? {};
  const rows = useMemo(() => timelineRows(widget.type, animate), [widget.type, animate]);
  const label = (r: RowDef) => (i18n.has(r.labelKey) ? i18n.t(r.labelKey) : r.id);
  const used = Object.keys(animate).length;
  const [onlyAnimated, setOnlyAnimated] = useState(false);
  // Nhóm "Thuộc tính widget" thường dài: đóng sẵn khi chưa có thuộc tính nào trong đó đang animate.
  const [closed, setClosed] = useState<ReadonlySet<GroupId>>(() => new Set(rows.some((r) => r.group === 'props' && r.paths.some((p) => animate[p])) ? [] : ['props']));

  // ── hàng hiển thị ──
  const times = useMemo(() => {
    const m = new Map<string, number[]>();
    for (const [p, a] of Object.entries(animate)) if (!isBinding(a)) m.set(p, keySecs(a, tempoMap));
    return m;
  }, [animate, tempoMap]);
  const items: Item[] = [];
  for (const g of GROUPS) {
    const mine = rows.filter((r) => r.group === g.id).map((row): RowItem => {
      const anims = row.paths.map((p) => animate[p]);
      return { kind: 'row', row, anims, mode: modeOf(anims), vkeys: rowKeys(row, times) };
    }).filter((x) => !onlyAnimated || x.mode !== 'none');
    if (!mine.length) continue;
    const open = !closed.has(g.id);
    items.push({ kind: 'group', id: g.id, open, count: mine.filter((x) => x.mode !== 'none').length });
    if (open) items.push(...mine);
  }
  const keyRows = items.filter((x): x is RowItem => x.kind === 'row');
  // Vùng chọn chỉ giữ keyframe còn tồn tại (sau hoàn tác, xoá thuộc tính…).
  const selKeys = sel.keys.filter((r) => { const p = parseKeyRef(r); return !!p && (times.get(p.path)?.length ?? 0) > p.i; });
  const selSet = new Set(selKeys);
  const allTimes = keyRows.flatMap((x) => x.vkeys.map((v) => v.t));

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
  const live = useRef({ pps, fit, tree, duration, widget, sel: { keys: selKeys, row: sel.row }, allTimes, locked });
  live.current = { pps, fit, tree, duration, widget, sel: { keys: selKeys, row: sel.row }, allTimes, locked };

  const zoomBy = (factor: number) => {
    const el = scroller.current, L = live.current; if (!el) return;
    const ax = Math.min(laneW, Math.max(0, playback.get().t * L.pps - el.scrollLeft)); // nút: giữ vạch phát đứng yên
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
  /** Gom mọi thay đổi của một thao tác thành MỘT lệnh (một bước hoàn tác, lib/commands.ts editWidgetAnimation). */
  const many = (fn: (put: (p: string, v: Animation | null) => void) => void, key?: string) => { const ch: Record<string, Animation | null> = {}; fn((p, v) => { ch[p] = v; }); if (Object.keys(ch).length) onAnimateMany(ch, key); };
  const refsAt = (paths: readonly string[], t: number): string[] => paths.flatMap((p) => { const a = keyAnim(p); if (!a) return []; const i = keyAt(keySecs(a, tempoMap), t); return i >= 0 ? [keyRef(p, i)] : []; });
  const removeRefs = (refs: readonly string[]) => many((put) => { for (const [p, idx] of groupRefs(refs)) { const a = keyAnim(p); if (a) put(p, removeKeys(a, idx)); } });
  const removeSelected = () => {
    if (live.current.locked || !selKeys.length) return;
    removeRefs(selKeys);
    onSel({ keys: [], row: sel.row });
  };
  const shiftSelected = (dt: number) => {
    if (live.current.locked || !selKeys.length) return;
    const all = selKeys.map((r) => { const q = parseKeyRef(r)!; return times.get(q.path)?.[q.i] ?? NaN; });
    const d = clampShift(all, dt, duration);
    const next: string[] = [];
    many((put) => { for (const [p, idx] of groupRefs(selKeys)) { const a = keyAnim(p); if (!a) continue; const m = moveKeys(a, idx, d, duration, tempoMap); put(p, m.anim); next.push(...m.idx.map((j) => keyRef(p, j))); } }, 'knudge');
    onSel({ keys: next, row: sel.row });
  };
  const toggleAnim = (it: RowItem) => {
    if (locked) return;
    if (it.mode !== 'none') {
      many((put) => { for (const p of it.row.paths) if (animate[p]) put(p, null); });
      onSel({ keys: selKeys.filter((r) => !it.row.paths.includes(parseKeyRef(r)?.path ?? '')), row: it.row.id });
      return;
    }
    if (used + it.row.paths.length > MAX_ANIMATIONS) return;
    const t = playback.get().t;
    many((put) => { for (const p of it.row.paths) put(p, newKeyAnimation(widget, p, t)); });
    onSel({ keys: it.row.paths.map((p) => keyRef(p, 0)), row: it.row.id });
  };
  /** Thêm keyframe tại `t` cho mọi đường dẫn của dòng (giá trị liền mạch: giá trị của hoạt hình tại `t`); đường dẫn chưa animate thì bật. Đường dẫn "Theo nhạc" bỏ qua. */
  const addAt = (it: RowItem, t: number) => {
    if (locked) return;
    const refs: string[] = [];
    many((put) => { refs.push(...putAdd(it, t, put)); });
    onSel({ keys: refs, row: it.row.id });
  };
  /** Đặt keyframe tại `t` cho mọi đường dẫn của dòng vào `put`; trả các keyframe vừa đặt. Dùng chung cho nút ◆, nhấp đúp và kéo qua nhiều dòng. */
  const putAdd = (it: RowItem, t: number, put: (p: string, v: Animation | null) => void): string[] => {
    const refs: string[] = [], fresh = it.row.paths.filter((p) => !animate[p]).length;
    for (const p of it.row.paths) {
      const cur = animate[p];
      if (cur && isBinding(cur)) continue;
      const a = cur ? (cur as KeyAnimation) : null;
      if (a && a.keys.length >= MAX_ANIM_KEYS) continue;
      if (!a && used + fresh > MAX_ANIMATIONS) continue;
      const next = a ? addKey(a, t, sampleTrack(compileTrack(a, { tempoMap }), t)) : newKeyAnimation(widget, p, t);
      put(p, next);
      const i = keyAt(keySecs(next, tempoMap), t); if (i >= 0) refs.push(keyRef(p, i));
    }
    return refs;
  };
  // Nhấn ◆ rồi kéo xuống/lên qua các dòng khác: mọi dòng đi qua nhận keyframe tại vạch phát (hoặc mất keyframe, nếu dòng đầu đang có keyframe ở đó),
  // như kéo qua các mắt của Lớp. Áp một lần lúc thả: một bước hoàn tác. Dòng đã vùng phủ được tô nhẹ khi đang kéo.
  const [painted, setPainted] = useState<ReadonlySet<string>>(new Set());
  const suppressClick = useRef(false);
  const startAddPaint = (e: RPointerEvent<HTMLButtonElement>, it: RowItem, removing: boolean) => {
    if (e.button !== 0 || live.current.locked) return;
    const t = playback.get().t, rowsById = new Map(keyRows.map((x) => [x.row.id, x]));
    const covered = new Set<string>([it.row.id]);
    let moved = false;
    const y0 = e.clientY;
    const move = (m: PointerEvent) => {
      if (!moved && Math.abs(m.clientY - y0) < DRAG_SLOP) return;
      moved = true;
      const id = document.elementFromPoint(m.clientX, m.clientY)?.closest<HTMLElement>('[data-row]')?.dataset.row;
      if (id && rowsById.has(id) && !covered.has(id)) { covered.add(id); setPainted(new Set(covered)); } else if (covered.size === 1) setPainted(new Set(covered));
    };
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      setPainted(new Set());
      if (!moved) return; // nhấp thường: onClick của nút xử lý
      suppressClick.current = true; setTimeout(() => { suppressClick.current = false; }, 0);
      const rows = [...covered].map((id) => rowsById.get(id)!).filter((r) => r.mode !== 'bind');
      if (removing) { const refs = rows.flatMap((r) => refsAt(r.row.paths, t)); if (refs.length) { removeRefs(refs); onSel({ keys: [], row: it.row.id }); } return; }
      const refs: string[] = [];
      many((put) => { for (const r of rows) refs.push(...putAdd(r, t, put)); });
      onSel({ keys: refs, row: it.row.id });
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
  };

  // ── vạch dẫn bắt dính (khi kéo keyframe hoặc tua bị bắt vào một mốc) ──
  const [snapLine, setSnapLine] = useState<number | null>(null);

  // ── kéo hình thoi ──
  const [chip, setChip] = useState<{ t: number; row: string } | null>(null);
  const startKeyDrag = (e: RPointerEvent<HTMLButtonElement>, it: RowItem, vk: VKey) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const additive = e.shiftKey || e.ctrlKey || e.metaKey, on = vk.refs.some((r) => selSet.has(r));
    let keys = selKeys;
    if (additive) {
      if (on) { onSel({ keys: selKeys.filter((r) => !vk.refs.includes(r)), row: it.row.id }); return; }
      keys = [...selKeys, ...vk.refs];
    } else if (!on) keys = [...vk.refs];
    onSel({ keys, row: it.row.id });
    if (locked) return;
    const groups = groupRefs(keys), orig = new Map<string, KeyAnimation>();
    for (const p of groups.keys()) { const a = keyAnim(p); if (a) orig.set(p, a); }
    const selTimes = keys.map((r) => { const q = parseKeyRef(r)!; return times.get(q.path)?.[q.i] ?? NaN; });
    const grabT = vk.t;
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
      let target = grabT + dx / L.pps, snapped = false;
      if (!m.altKey) ({ t: target, snapped } = snapTime(target, targets, L.pps));
      const dt = clampShift(selTimes, target - grabT, duration);
      const next: string[] = [];
      const ch: Record<string, Animation> = {};
      for (const [p, idx] of groups) { const a = orig.get(p); if (!a) continue; const r = moveKeys(a, idx, dt, duration, tempoMap); ch[p] = r.anim; next.push(...r.idx.map((j) => keyRef(p, j))); }
      onAnimateMany(ch, 'kdrag');
      onSel({ keys: next, row: it.row.id });
      setChip({ t: grabT + dt, row: it.row.id });
      setSnapLine(snapped ? grabT + dt : null);
    };
    const up = () => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      if (moved) gesture.end();
      setChip(null); setSnapLine(null);
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
      const [ta, tb] = [(Math.min(q0.x, p.x) - PAD) / L.pps, (Math.max(q0.x, p.x) - PAD) / L.pps];
      const picked = items.flatMap((it, k) => (it.kind === 'row' && (k + 1) * ROW_H > ya && k * ROW_H < yb ? it.vkeys.filter((v) => v.t >= ta && v.t <= tb).flatMap((v) => v.refs) : []));
      onSel({ keys: [...new Set([...base, ...picked])], row: L.sel.row });
    };
    const up = () => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      setBox(null);
      if (!moved) { const it = itemAt(p0.y); onSel({ keys: base, row: it && it.kind === 'row' ? it.row.id : live.current.sel.row }); }
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
  const onLaneDouble = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!lanes.current) return;
    const r = lanes.current.getBoundingClientRect(), it = items[Math.floor((e.clientY - r.top) / ROW_H)];
    if (!it || it.kind !== 'row') return;
    const t = xToTime(e.clientX - r.left - PAD, pps, duration);
    addAt(it, e.altKey ? t : snapTime(t, [playback.get().t, ...beatTimes(tempoMap, duration)], pps).t);
  };

  // ── thước: kéo để tua; vạch phát bắt dính vào keyframe (Alt để tắt) ──
  const scrub = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const ruler = e.currentTarget, el: Window = window;
    const seek = (x: number, alt: boolean) => {
      const L = live.current, raw = xToTime(x - ruler.getBoundingClientRect().left - PAD, L.pps, L.duration);
      const s = alt ? { t: raw, snapped: false } : snapTime(raw, L.allTimes, L.pps);
      playback.seek(s.t); setSnapLine(s.snapped ? s.t : null);
    };
    seek(e.clientX, e.altKey);
    const move = (m: PointerEvent) => seek(m.clientX, m.altKey);
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); setSnapLine(null); };
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
      onSel({ keys: keyRows.flatMap((x) => x.vkeys.flatMap((v) => v.refs)), row: sel.row }); return;
    }
    if (!mod && !e.altKey && (e.key === 'u' || e.key === 'U')) { e.preventDefault(); e.stopPropagation(); setOnlyAnimated((v) => !v); return; }
    if (e.altKey && !mod && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && selKeys.length) {
      e.preventDefault(); e.stopPropagation(); shiftSelected((e.key === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 1 : FRAME));
    }
  };
  const focusKey = (ref: string) => requestAnimationFrame(() => scroller.current?.querySelector<HTMLElement>(`[data-key="${CSS.escape(ref)}"]`)?.focus());
  const onDiamondKey = (e: KeyboardEvent<HTMLButtonElement>, it: RowItem, k: number) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const vk = it.vkeys[k];
    if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); playback.seek(vk.t); return; }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); e.stopPropagation();
      const nb = it.vkeys[k + (e.key === 'ArrowLeft' ? -1 : 1)];
      if (!nb) return;
      onSel({ keys: e.shiftKey ? [...new Set([...selKeys, ...nb.refs])] : [...nb.refs], row: it.row.id });
      focusKey(nb.refs[0]); return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault(); e.stopPropagation();
      const r0 = keyRows.indexOf(it), step = e.key === 'ArrowUp' ? -1 : 1;
      for (let r = r0 + step; r >= 0 && r < keyRows.length; r += step) {
        const o = keyRows[r]; if (!o.vkeys.length) continue;
        const best = o.vkeys.reduce((b, v) => (Math.abs(v.t - vk.t) < Math.abs(b.t - vk.t) ? v : b));
        onSel({ keys: [...best.refs], row: o.row.id }); focusKey(best.refs[0]); return;
      }
    }
  };

  // ── vẽ ──
  const step = rulerStep(pps), from = view.left / pps - step, to = (view.left + laneW + tree) / pps + step;
  const ticks = rulerTicks(Math.max(0, from), Math.min(duration, to), step);
  const minor = pps * step / 4 >= 10 ? rulerTicks(Math.max(0, from), Math.min(duration, to), step / 4).filter((t) => !ticks.includes(t)) : [];
  const height = RULER_H + items.length * ROW_H;
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
              {/* mốc keyframe trên thước: chỗ vạch phát bắt dính khi tua */}
              {[...new Set(allTimes)].map((t) => <span key={`k${t}`} aria-hidden className="absolute bottom-0 h-1 w-1 -translate-x-1/2 rotate-45 bg-muted" style={{ left: PAD + t * pps }} />)}
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
                <TreeRow key={it.row.id} it={it} name={label(it.row)} widget={widget} tempoMap={tempoMap} playback={playback} locked={locked}
                  selected={sel.row === it.row.id} full={it.mode === 'none' && used + it.row.paths.length > MAX_ANIMATIONS}
                  onPick={() => onSel({ keys: selKeys.filter((r) => it.row.paths.includes(parseKeyRef(r)?.path ?? '')), row: it.row.id })}
                  onToggle={() => toggleAnim(it)} onAddHere={() => { if (!suppressClick.current) addAt(it, playback.get().t); }} painted={painted.has(it.row.id)}
                  onPaintStart={(e, removing) => startAddPaint(e, it, removing)}
                  onRemoveHere={(t) => { if (locked || suppressClick.current) return; removeRefs(refsAt(it.row.paths, t)); onSel({ keys: [], row: it.row.id }); }}
                  onValue={(p, v) => {
                    const a = keyAnim(p); if (!a || locked) return;
                    const t = playback.get().t, i = keyAt(keySecs(a, tempoMap), t);
                    onAnimate(p, i >= 0 ? setKey(a, i, { value: v }) : addKey(a, t, v), 'val');
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
                <div key={it.row.id} className={`absolute inset-x-0 border-b border-line/70 ${sel.row === it.row.id ? 'bg-raised/70' : ''}`} style={{ top: k * ROW_H, height: ROW_H }} data-lane={it.row.id} data-mode={it.mode}>
                  <div className="absolute inset-y-0 right-0" style={{ left: PAD }}>
                  {it.mode === 'bind' && (
                    <div className="absolute inset-y-1.5 left-0 flex items-center overflow-hidden rounded-sm border border-control bg-raised px-2 text-[11px] text-muted" style={{ width: duration * pps }}>
                      <span className="sticky left-2 truncate">{i18n.t('web.timeline.bound', { source: i18n.t(`web.anim.src.${(it.anims.find((a) => a && isBinding(a)) as { bind: string }).bind}`) })}</span>
                    </div>
                  )}
                  {it.vkeys.length > 0 && (
                    <Keys it={it} pps={pps} sel={selSet} name={label(it.row)} locked={locked} widget={widget}
                      onDown={(e, vk) => startKeyDrag(e, it, vk)} onKey={(e, k) => onDiamondKey(e, it, k)} />
                  )}
                  </div>
                </div>
              ))}
              {snapLine !== null && <span aria-hidden className="pointer-events-none absolute inset-y-0 z-20 w-px bg-guide" style={{ left: PAD + snapLine * pps }} data-testid="timeline-snap" />}
              {box && (
                <div aria-hidden className="pointer-events-none absolute z-10 border border-focus bg-accent/10"
                  style={{ left: Math.min(box.x0, box.x1), top: Math.min(box.y0, box.y1), width: Math.abs(box.x1 - box.x0), height: Math.abs(box.y1 - box.y0) }} />
              )}
              {chip && (
                <div aria-hidden className="pointer-events-none absolute z-30 -translate-x-1/2 whitespace-nowrap rounded-sm border border-control bg-raised px-1.5 py-0.5 text-[11px] tabular-nums text-fg"
                  style={{ left: PAD + chip.t * pps, top: Math.max(0, items.findIndex((x) => x.kind === 'row' && x.row.id === chip.row) * ROW_H - 22) }} data-testid="timeline-drag-chip">
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
const Keys = memo(function Keys({ it, pps, sel, name, locked, widget, onDown, onKey }: {
  it: RowItem; pps: number; sel: ReadonlySet<string>; name: string; locked: boolean; widget: WidgetSpec;
  onDown(e: RPointerEvent<HTMLButtonElement>, vk: VKey): void; onKey(e: KeyboardEvent<HTMLButtonElement>, k: number): void;
}) {
  const { i18n } = useI18n();
  const keyOf = (ref: string) => { const q = parseKeyRef(ref)!; const a = widget.animate?.[q.path]; return a && !isBinding(a) ? a.keys[q.i] : undefined; };
  // Một điểm dừng Tab cho mỗi hàng: hình thoi đầu tiên đang chọn, không thì hình thoi đầu.
  const stop = Math.max(0, it.vkeys.findIndex((v) => v.refs.some((r) => sel.has(r))));
  return (
    <>
      {it.vkeys.slice(1).map((v, k) => {
        const prev = it.vkeys[k], hold = (keyOf(prev.refs[0])?.interp ?? 'linear') === 'hold';
        return <span key={`s${k}`} aria-hidden className={`pointer-events-none absolute top-1/2 ${hold ? 'border-t border-dashed border-control' : 'h-px bg-control/70'}`} style={{ left: prev.t * pps, width: (v.t - prev.t) * pps }} />;
      })}
      {it.vkeys.map((v, k) => {
        const key = keyOf(v.refs[0]), on = v.refs.some((r) => sel.has(r)), interp = key?.interp ?? 'linear';
        const shape = interp === 'hold' ? 'rounded-[1px]' : interp === 'smooth' ? 'rounded-full' : 'rotate-45 rounded-[1px]';
        const music = !!key && !('sec' in key.at);
        const value = v.refs.map((r) => { const x = keyOf(r)?.value; return typeof x === 'number' ? String(Math.round(x * 1000) / 1000) : x ?? ''; }).join(', ');
        const text = i18n.t('web.timeline.keyLabel', { name, n: k + 1, time: formatClock(v.t), value });
        return (
          <button key={v.refs[0]} type="button" data-key={v.refs[0]} data-refs={v.refs.join(' ')} aria-pressed={on} aria-label={text} title={music ? `${text} · ${i18n.t('web.timeline.musicAnchored')}` : text}
            tabIndex={k === stop ? 0 : -1} onPointerDown={(e) => onDown(e, v)} onKeyDown={(e) => onKey(e, k)} onDoubleClick={(e) => e.stopPropagation()}
            className={`group absolute top-0 grid h-6 w-6 -translate-x-1/2 place-items-center outline-none ${locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`} style={{ left: v.t * pps }}>
            <span aria-hidden className={`block h-2.5 w-2.5 border-[1.5px] transition-colors duration-100 ${shape} ${on ? 'border-accent bg-accent' : 'border-muted bg-surface group-hover:border-fg'} group-focus-visible:ring-2 group-focus-visible:ring-focus group-focus-visible:ring-offset-1 group-focus-visible:ring-offset-surface`} />
            {music && <span aria-hidden className="absolute bottom-0.5 h-0.5 w-0.5 rounded-full bg-muted" />}
          </button>
        );
      })}
    </>
  );
});

/** Một hàng của cây thuộc tính: đồng hồ | tên ngắn | giá trị tại vạch phát (một ô mỗi đường dẫn) | ◀ ◆ ▶. Chỉ hàng có keyframe theo dõi đồng hồ phát. */
function TreeRow({ it, name, widget, tempoMap, playback, locked, selected, full, painted, onPick, onToggle, onAddHere, onRemoveHere, onPaintStart, onValue }: {
  it: RowItem; name: string; widget: WidgetSpec; tempoMap: readonly TempoPoint[]; playback: Playback; locked: boolean;
  selected: boolean; full: boolean; painted: boolean; onPaintStart(e: RPointerEvent<HTMLButtonElement>, removing: boolean): void; onPick(): void; onToggle(): void; onAddHere(): void; onRemoveHere(t: number): void; onValue(path: string, v: number | string): void;
}) {
  const { i18n } = useI18n();
  const { row, anims, mode, vkeys } = it;
  // Chỉ dòng có keyframe mới cần t (giá trị, keyframe tại vạch phát, trước/sau): dòng đứng yên không vẽ lại mỗi khung khi phát.
  const t = usePlayback(playback, (s) => (mode === 'keys' ? s.t : 0));
  const compiled = useMemo(() => anims.map((a) => (a && !isBinding(a) ? compileTrack(a, { tempoMap }) : null)), [anims, tempoMap]);
  const here = mode === 'keys' && vkeys.some((v) => Math.abs(v.t - t) <= SAME_TIME);
  const prev = mode === 'keys' ? vkeys.filter((v) => v.t < t - SAME_TIME).at(-1)?.t ?? null : null;
  const next = mode === 'keys' ? vkeys.find((v) => v.t > t + SAME_TIME)?.t ?? null : null;
  const watch = mode !== 'none' ? i18n.t('web.timeline.stopAnim', { name }) : full ? i18n.t('web.timeline.full') : i18n.t('web.timeline.startAnim', { name });
  const nav = 'grid h-6 w-6 shrink-0 place-items-center rounded-sm text-muted transition hover:bg-raised hover:text-fg disabled:opacity-30 disabled:hover:bg-transparent';
  const fmt = (v: number) => String(Math.round(v * 1000) / 1000);
  const cell = (f: AnimField, j: number) => {
    const a = anims[j], c = compiled[j], value = c ? sampleTrack(c, t) : staticValue(widget, f.path);
    const lbl = i18n.t('web.timeline.valueAt', { name: row.paths.length > 1 ? `${name} ${f.path.split('.').pop()!.toUpperCase()}` : name });
    if (a && isBinding(a)) return <span key={f.path} className="block min-w-0 flex-1 truncate text-right text-[11px] text-muted" title={i18n.t('web.anim.mode.bind')}>{i18n.t('web.anim.mode.bind')}</span>;
    if (f.kind === 'color') return <input key={f.path} type="color" aria-label={lbl} value={String(value).slice(0, 7)} disabled={!c || locked} onChange={(e) => onValue(f.path, e.target.value)}
      className="h-5 min-w-0 flex-1 cursor-pointer rounded-sm border border-control bg-raised disabled:cursor-default" title={c ? undefined : i18n.t('web.timeline.staticHint')} />;
    if (c) return <div key={f.path} className="min-w-0 flex-1"><NumberField label={lbl} value={Number(value)} spec={{ min: f.min, max: f.max, step: f.step }} range={f.range} disabled={locked} onChange={(v) => onValue(f.path, v)} className="!min-h-5 !py-0 text-[11px]" /></div>;
    return <span key={f.path} className="block min-w-0 flex-1 truncate text-right text-[11px] tabular-nums text-muted" title={i18n.t('web.timeline.staticHint')}>{fmt(Number(value))}</span>;
  };
  return (
    <div className={`relative flex items-center gap-0.5 border-b border-r border-line/70 pl-0.5 pr-0.5 ${painted ? 'bg-accent/15' : selected ? 'bg-raised' : ''}`} style={{ height: ROW_H }} data-row={row.id}>
      {selected && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
      <button type="button" className={`grid h-6 w-6 shrink-0 place-items-center rounded-sm transition hover:bg-raised hover:text-fg disabled:opacity-40 ${mode !== 'none' ? 'text-fg' : 'text-faint'}`} aria-pressed={mode !== 'none'} aria-label={watch} title={watch} disabled={locked || full} onClick={onToggle} data-testid={`tl-watch-${row.id}`}>
        <Stopwatch className="h-3.5 w-3.5" />
      </button>
      <button type="button" className={`min-w-0 flex-1 truncate py-0.5 pl-0.5 text-left text-xs ${mode !== 'none' ? 'text-fg' : 'text-muted'} hover:text-fg`} title={name} aria-pressed={selected} onClick={onPick} data-testid={`tl-row-${row.id}`}>{name}</button>
      <div className={`flex shrink-0 items-center gap-1 ${row.paths.length > 1 ? 'w-[6.5rem]' : 'w-[3.75rem]'}`}>{row.fields.map(cell)}</div>
      {mode !== 'bind' && (
        <div className="flex shrink-0 items-center" role="group" aria-label={i18n.t('web.timeline.nav', { name })}>
          <button type="button" className={nav} disabled={prev === null} aria-label={i18n.t('web.timeline.prevKey')} title={i18n.t('web.timeline.prevKey')} onClick={() => prev !== null && playback.seek(prev)}><KeyPrev className="h-3 w-3" /></button>
          <button type="button" className={`${nav} ${here ? 'text-accent' : ''}`} disabled={locked || full} aria-pressed={here} data-testid={`tl-here-${row.id}`} onPointerDown={(e) => onPaintStart(e, here)}
            aria-label={here ? i18n.t('web.timeline.removeHere') : i18n.t('web.timeline.addHere')} title={here ? i18n.t('web.timeline.removeHere') : i18n.t('web.timeline.addHere')}
            onClick={() => (here ? onRemoveHere(playback.get().t) : onAddHere())}><Diamond className="h-3 w-3" filled={here} /></button>
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
