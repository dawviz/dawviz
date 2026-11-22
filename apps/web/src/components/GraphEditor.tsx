// Graph Editor cơ bản (T-33, ANIMATION-CATALOG §3, DESIGN.md "Graph Editor"): chế độ "Đồ thị" của panel Timeline. Vẽ đường cong của dòng đang chọn
// (Vị trí: hai đường x và y) theo thời gian: đồ thị GIÁ TRỊ (kéo keyframe đổi thời điểm + giá trị, kéo tay cầm bezier của đoạn) hoặc đồ thị TỐC ĐỘ
// (độ lớn đạo hàm; kéo tay cầm ngang = ảnh hưởng, dọc = vận tốc). Ô số vận tốc/ảnh hưởng vào/ra cho keyframe đang chọn (D-49), bắt dính
// (vạch phát, phách, keyframe khác, khung hình 1/30 s, giá trị tròn; giữ Alt để tắt), sao chép/dán easing, thư viện easing (dựng sẵn + đường cong đã lưu).
// Mọi chỉnh sửa đi qua `onAnimateMany` (lệnh editWidgetAnimation): một lần kéo = một bước hoàn tác (bọc trong cử chỉ).
// Vùng chọn dùng chung với chế độ Danh sách (KeySel). Logic thuần ở lib/graphEditor.ts. Tải lười (Editor.tsx) nên không vào gói đầu.
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import { isBinding, type Animation, type EaseSpec, type KeyAnimation, type TempoPoint, type WidgetSpec } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { usePlayback, type Playback } from '../lib/playback.ts';
import type { Gesture } from '../lib/storeReact.ts';
import { isTextEntry } from '../lib/a11y.ts';
import { formatClock } from '../lib/timeFormat.ts';
import { EASE_BEZIER, bezierOf, easeSamples, type Bezier } from '../lib/easeCurve.ts';
import { DRAG_SLOP, beatTimes, groupRefs, keyRef, keySecs, moveKeys, parseKeyRef, removeKeys, rulerLabel, rulerStep, rulerTicks, snapTime } from '../lib/timeline.ts';
import { rowOfPath, timelineRows, type RowDef } from '../lib/timelineRows.ts';
import {
  EASE_LIBRARY_KEY, addSavedEase, applyEase, bezierFromHandle, easeClipboard, easeOfKeys, graphable, handlePoints, keyVelocity, nextEaseName, niceTicks,
  parseEaseLibrary, sampleGraph, segmentBezier, startSlope, endSlope, segments, setSegmentBezier, setVelocity, snapValue, tickStep, valueRange, type GraphMode, type SavedEase, type Segment,
} from '../lib/graphEditor.ts';
import { NumberField } from './NumberField.tsx';
import { FitWidth } from './Icons.tsx';
import { NO_SEL, type KeySel } from './KeyframeTimeline.tsx';

export interface GraphEditorProps {
  widget: WidgetSpec;
  tempoMap: readonly TempoPoint[];
  duration: number;
  playback: Playback;
  locked: boolean;
  sel: KeySel;
  onSel(s: KeySel): void;
  onAnimateMany(changes: Record<string, Animation | null>, key?: string): void;
  gesture: Gesture;
}

const FRAME = 1 / 30;
const M = { l: 48, r: 12, t: 22, b: 8 }; // lề trong của vùng vẽ (px): trái chứa nhãn giá trị, trên là thước
const STROKES = ['stroke-fg', 'stroke-muted'] as const;
type View = { t0: number; t1: number } | null;

export function GraphEditor({ widget, tempoMap, duration, playback, locked, sel, onSel, onAnimateMany, gesture }: GraphEditorProps) {
  const { i18n } = useI18n();
  const animate = widget.animate ?? {};
  const rows = useMemo(() => timelineRows(widget.type, animate), [widget.type, animate]);
  const keyAnim = (p: string): KeyAnimation | null => { const a = animate[p]; return a && !isBinding(a) ? a : null; };
  // Dòng hiện trên đồ thị: dòng đang chọn, hoặc dòng của keyframe đang chọn, hoặc dòng đầu tiên có đường cong số.
  const firstSelPath = sel.keys.map((r) => parseKeyRef(r)?.path).find((p): p is string => !!p);
  const row: RowDef | undefined = rows.find((r) => r.id === sel.row && r.paths.some((p) => graphable(keyAnim(p))))
    ?? (firstSelPath ? rowOfPath(rows, firstSelPath) : undefined)
    ?? rows.find((r) => r.paths.some((p) => graphable(keyAnim(p))));
  const paths = (row?.paths ?? []).filter((p) => graphable(keyAnim(p)));
  const label = (r: RowDef) => (i18n.has(r.labelKey) ? i18n.t(r.labelKey) : r.id);
  const axisName = (p: string) => (paths.length > 1 ? p.split('.').pop()! : '');

  const [mode, setMode] = useState<GraphMode>('value');
  const [view, setView] = useState<View>(null);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 640, h: 180 });
  useEffect(() => {
    const el = box.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setSize({ w: Math.max(200, e.contentRect.width), h: Math.max(100, e.contentRect.height) }));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const live = useRef({ animate, locked, sel }); live.current = { animate, locked, sel };

  // ── khung nhìn thời gian ──
  const allTimes = paths.flatMap((p) => keySecs(keyAnim(p)!, tempoMap).filter(Number.isFinite));
  const fit = (): { t0: number; t1: number } => {
    if (!allTimes.length) return { t0: 0, t1: Math.max(1, Math.min(duration || 10, 10)) };
    const lo = Math.min(...allTimes), hi = Math.max(...allTimes), span = Math.max(1, hi - lo);
    return { t0: lo - span * 0.08, t1: hi + span * 0.08 };
  };
  const v = view ?? fit();
  const plotW = Math.max(40, size.w - M.l - M.r), plotH = Math.max(40, size.h - M.t - M.b);
  const pps = plotW / (v.t1 - v.t0);
  const xOf = (t: number) => M.l + (t - v.t0) * pps;
  const tOf = (x: number) => v.t0 + (x - M.l) / pps;

  // ── đường cong ──
  const n = Math.min(600, Math.max(40, Math.round(plotW / 2)));
  const curves = paths.map((p) => ({ p, pts: sampleGraph(keyAnim(p)!, tempoMap, v.t0, v.t1, n, mode) }));
  const selSet = new Set(sel.keys);
  const keyPts = paths.flatMap((p) => {
    const a = keyAnim(p)!, secs = keySecs(a, tempoMap), tMax = Math.max(...secs.filter(Number.isFinite));
    return a.keys.map((k, i) => ({ p, i, t: secs[i], v: mode === 'value' ? (k.value as number) : speedAt(a, tempoMap, secs[i], secs[i] >= tMax), ref: keyRef(p, i) })).filter((x) => Number.isFinite(x.t));
  });
  // tay cầm của các đoạn kề keyframe đang chọn
  const handles = paths.flatMap((p) => {
    const a = keyAnim(p)!;
    return segments(a, tempoMap).flatMap((s) => {
      const bz = segmentBezier(a, s); if (!bz) return [];
      const out: { p: string; s: Segment; bz: Bezier; which: 0 | 1; key: number; at: [number, number]; from: [number, number] }[] = [];
      const [h0, h1] = handlePoints(s, bz);
      if (selSet.has(keyRef(p, s.a))) out.push({ p, s, bz, which: 0, key: s.a, at: mode === 'value' ? h0 : [h0[0], Math.abs(velOut(s, bz))], from: mode === 'value' ? [s.ta, s.va] : [s.ta, Math.abs(velOut(s, bz))] });
      if (selSet.has(keyRef(p, s.b))) out.push({ p, s, bz, which: 1, key: s.b, at: mode === 'value' ? h1 : [h1[0], Math.abs(velIn(s, bz))], from: mode === 'value' ? [s.tb, s.vb] : [s.tb, Math.abs(velIn(s, bz))] });
      return out;
    });
  });
  const [vlo, vhi] = valueRange(curves.flatMap((c) => c.pts), [...keyPts.filter((k) => k.t >= v.t0 && k.t <= v.t1).map((k) => k.v), ...handles.map((h) => h.at[1])], mode === 'speed');
  const yOf = (val: number) => M.t + plotH - ((val - vlo) / (vhi - vlo)) * plotH;
  const vOf = (y: number) => vlo + ((M.t + plotH - y) / plotH) * (vhi - vlo);
  const vticks = niceTicks(vlo, vhi, Math.max(2, Math.floor(plotH / 36)));
  const step = rulerStep(pps), tticks = rulerTicks(Math.max(0, v.t0), v.t1, step).filter((t) => t >= v.t0);
  const pathD = (pts: [number, number][]) => pts.map(([t, y], k) => `${k ? 'L' : 'M'}${xOf(t).toFixed(1)} ${yOf(y).toFixed(1)}`).join('');

  // ── thao tác ──
  const [snapLine, setSnapLine] = useState<{ t?: number; v?: number } | null>(null);
  const [chip, setChip] = useState<{ x: number; y: number; text: string } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const local = (e: { clientX: number; clientY: number }) => { const r = svg.current!.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
  const listen = (move: (m: PointerEvent) => void, done: (moved: boolean) => void) => {
    const el: Window = window; let moved = false; const x0 = { v: NaN, y: NaN };
    const mv = (m: PointerEvent) => {
      if (Number.isNaN(x0.v)) { x0.v = m.clientX; x0.y = m.clientY; }
      if (!moved && Math.hypot(m.clientX - x0.v, m.clientY - x0.y) < DRAG_SLOP) return;
      if (!moved) { moved = true; gesture.begin(); }
      move(m);
    };
    const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); if (moved) gesture.end(); setSnapLine(null); setChip(null); done(moved); };
    el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
  const timeTargets = (exclude: Set<string>) => {
    const out = [playback.get().t, ...beatTimes(tempoMap, duration)];
    for (const k of keyPts) if (!exclude.has(k.ref)) out.push(k.t);
    return out;
  };

  const startKey = (e: RPointerEvent<SVGElement>, k: { p: string; i: number; t: number; v: number; ref: string }) => {
    if (e.button !== 0) return;
    e.stopPropagation(); e.preventDefault();
    const additive = e.shiftKey || e.ctrlKey || e.metaKey, on = selSet.has(k.ref);
    let keys = sel.keys;
    if (additive) { if (on) { onSel({ keys: sel.keys.filter((r) => r !== k.ref), row: row?.id ?? sel.row }); return; } keys = [...sel.keys, k.ref]; }
    else if (!on) keys = [k.ref];
    onSel({ keys, row: row?.id ?? sel.row });
    (e.currentTarget as unknown as HTMLElement).focus?.();
    if (locked || mode !== 'value') return;
    const groups = groupRefs(keys), orig = new Map<string, KeyAnimation>();
    for (const p of groups.keys()) { const a = keyAnim(p); if (a) orig.set(p, a); }
    const pick = new Set(keys), targets = timeTargets(pick);
    const p0 = local(e), vt = vticks;
    listen((m) => {
      const q = local(m);
      let dt = (q.x - p0.x) / pps, dv = vOf(q.y) - vOf(p0.y);
      if (m.shiftKey) { if (Math.abs(q.x - p0.x) > Math.abs(q.y - p0.y)) dv = 0; else dt = 0; } // Shift khi kéo: khoá theo một trục
      let snapT: number | undefined, snapV: number | undefined;
      if (!m.altKey) {
        const st = snapTime(k.t + dt, targets, pps);
        if (st.snapped) { dt = st.t - k.t; snapT = st.t; } else dt = Math.round((k.t + dt) / FRAME) * FRAME - k.t;
        const sv = snapValue(k.v + dv, tickStep(vt), (vhi - vlo) * 6 / plotH);
        if (sv.snapped && dv !== 0) { dv = sv.v - k.v; snapV = sv.v; }
      }
      const ch: Record<string, Animation> = {}, next: string[] = [];
      for (const [p, idx] of groups) {
        const a = orig.get(p); if (!a) continue;
        const mvd = dt !== 0 ? moveKeys(a, idx, dt, duration, tempoMap) : { anim: a, idx };
        const pickNew = new Set(mvd.idx);
        ch[p] = dv === 0 ? mvd.anim : { ...mvd.anim, keys: mvd.anim.keys.map((kk, j) => (pickNew.has(j) && typeof kk.value === 'number' ? { ...kk, value: r3(kk.value + dv) } : kk)) };
        next.push(...mvd.idx.map((j) => keyRef(p, j)));
      }
      onAnimateMany(ch, 'gdrag');
      onSel({ keys: next, row: row?.id ?? live.current.sel.row });
      setSnapLine(snapT !== undefined || snapV !== undefined ? { t: snapT, v: snapV } : null);
      setChip({ x: q.x, y: q.y, text: `${formatClock(k.t + dt)} · ${fmt(k.v + dv)}` });
    }, () => {});
  };

  const startHandle = (e: RPointerEvent<SVGElement>, h: (typeof handles)[number]) => {
    if (e.button !== 0 || locked) return;
    e.stopPropagation(); e.preventDefault();
    const a0 = keyAnim(h.p); if (!a0) return;
    listen((m) => {
      const q = local(m), t = tOf(q.x), val = vOf(q.y);
      let next: KeyAnimation;
      if (mode === 'value') next = setSegmentBezier(a0, h.s, bezierFromHandle(h.bz, h.s, h.which, t, val));
      else { // tốc độ: ngang = ảnh hưởng, dọc = vận tốc (giữ chiều của đoạn)
        const span = h.s.tb - h.s.ta, sign = Math.sign(h.s.vb - h.s.va) || 1;
        const inf = h.which === 0 ? (t - h.s.ta) / span : (h.s.tb - t) / span;
        next = setVelocity(a0, tempoMap, h.key, h.which === 0 ? 'out' : 'in', m.altKey ? null : Math.max(0, val) * sign, inf);
      }
      onAnimateMany({ [h.p]: next }, 'ghandle');
      const kv = keyVelocity(next, tempoMap, h.key), side = h.which === 0 ? 'out' : 'in';
      setChip({ x: q.x, y: q.y, text: `${fmt(kv[`${side}Vel`] ?? 0)}/s · ${Math.round((kv[`${side}Inf`] ?? 0) * 100)}%` });
    }, () => {});
  };

  const startBg = (e: RPointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const p = local(e);
    if (p.y < M.t) { // thước: kéo để tua (bắt dính keyframe; Alt để tắt)
      const seek = (x: number, alt: boolean) => { const raw = Math.max(0, Math.min(duration, tOf(x))); const s = alt ? { t: raw, snapped: false } : snapTime(raw, keyPts.map((k) => k.t), pps); playback.seek(s.t); };
      seek(p.x, e.altKey);
      const el: Window = window;
      const mv = (m: PointerEvent) => seek(local(m).x, m.altKey);
      const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); };
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
      return;
    }
    if (!(e.shiftKey || e.ctrlKey || e.metaKey)) onSel({ keys: [], row: row?.id ?? sel.row });
  };
  // Cuộn: đi ngang theo thời gian; Ctrl/⌘+cuộn: thu phóng quanh con trỏ. Nghe bằng listener không passive để chặn trình duyệt phóng cả trang
  // (onWheel của React là passive). Khung nhìn đọc qua ref để listener gắn một lần.
  const viewRef = useRef({ v, pps, duration }); viewRef.current = { v, pps, duration };
  useEffect(() => {
    const el = svg.current; if (!el) return;
    const h = (e: globalThis.WheelEvent) => {
      e.preventDefault();
      const { v: cv, pps: cp, duration: dur } = viewRef.current, r = el.getBoundingClientRect(), t = cv.t0 + (e.clientX - r.left - M.l) / cp;
      if (e.ctrlKey || e.metaKey) {
        const k = Math.exp(e.deltaY * 0.002), t0 = t - (t - cv.t0) * k, t1 = t + (cv.t1 - t) * k;
        if (t1 - t0 > 0.05 && t1 - t0 < Math.max(30, dur * 2)) setView({ t0, t1 });
      } else { const d = (e.deltaX || e.deltaY) / cp; setView({ t0: cv.t0 + d, t1: cv.t1 + d }); }
    };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, [row?.id]);

  // ── bàn phím ──
  const removeSelected = () => {
    if (locked || !sel.keys.length) return;
    const ch: Record<string, Animation | null> = {};
    for (const [p, idx] of groupRefs(sel.keys)) { const a = keyAnim(p); if (a) ch[p] = removeKeys(a, idx); }
    if (Object.keys(ch).length) onAnimateMany(ch);
    onSel({ keys: [], row: sel.row });
  };
  const onKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isTextEntry(e.target)) return;
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); removeSelected(); return; }
    if (e.key === 'Escape' && sel.keys.length) { e.preventDefault(); e.stopPropagation(); onSel(NO_SEL); return; }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA') { e.preventDefault(); e.stopPropagation(); onSel({ keys: keyPts.map((k) => k.ref), row: row?.id ?? sel.row }); }
  };
  const onKeyKey = (e: KeyboardEvent<SVGElement>, k: (typeof keyPts)[number]) => {
    if (locked || mode !== 'value' || e.ctrlKey || e.metaKey) return;
    const a = keyAnim(k.p); if (!a) return;
    const big = e.shiftKey, st = tickStep(vticks) / 10 || 0.1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); e.stopPropagation();
      const r = moveKeys(a, [k.i], (e.key === 'ArrowLeft' ? -1 : 1) * (big ? 1 : FRAME), duration, tempoMap);
      onAnimateMany({ [k.p]: r.anim }); onSel({ keys: [keyRef(k.p, r.idx[0])], row: row?.id ?? sel.row });
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault(); e.stopPropagation();
      const dv = (e.key === 'ArrowUp' ? 1 : -1) * st * (big ? 10 : 1);
      onAnimateMany({ [k.p]: { ...a, keys: a.keys.map((kk, j) => (j === k.i ? { ...kk, value: r3((kk.value as number) + dv) } : kk)) } });
    } else if (e.key === 'Enter') { e.preventDefault(); playback.seek(k.t); }
  };

  // ── easing: sao chép/dán, thư viện ──
  const selByPath = groupRefs(sel.keys);
  const copySource = [...selByPath].map(([p, idx]) => { const a = keyAnim(p); return a ? easeOfKeys(a, tempoMap, idx) : undefined; }).filter((x) => x !== undefined);
  const copyable = copySource.length > 0 && copySource.every((x) => x !== 'mixed' && JSON.stringify(x) === JSON.stringify(copySource[0]));
  const [clip, setClip] = useState(easeClipboard.get());
  const pasteTargets = [...selByPath].filter(([p, idx]) => { const a = keyAnim(p); return !!a && segments(a, tempoMap).some((s) => idx.includes(s.b)); });
  const applyToSel = (ease: EaseSpec | undefined) => {
    if (locked) return;
    const ch: Record<string, Animation> = {};
    for (const [p, idx] of pasteTargets) { const a = keyAnim(p); if (a) ch[p] = applyEase(a, tempoMap, idx, ease); }
    if (Object.keys(ch).length) onAnimateMany(ch);
  };
  const [lib, setLib] = useState<SavedEase[]>(() => { try { return parseEaseLibrary(localStorage.getItem(EASE_LIBRARY_KEY)); } catch { return []; } });
  const saveLib = (next: SavedEase[]) => { setLib(next); try { localStorage.setItem(EASE_LIBRARY_KEY, JSON.stringify(next)); } catch { /* đầy hoặc bị chặn: vẫn dùng được trong phiên */ } };
  const [libOpen, setLibOpen] = useState(false);
  const libBtn = useRef<HTMLButtonElement>(null);
  const closeLib = (refocus: boolean) => { setLibOpen(false); if (refocus) libBtn.current?.focus(); };
  const currentBez = copyable ? bezierOf(copySource[0] as EaseSpec) : null;

  // ── ô số vận tốc/ảnh hưởng (một keyframe) ──
  const one = sel.keys.length === 1 ? parseKeyRef(sel.keys[0]) : null;
  const oneAnim = one ? keyAnim(one.path) : null;
  const vel = one && oneAnim && graphable(oneAnim) ? keyVelocity(oneAnim, tempoMap, one.i) : null;
  const setVel = (side: 'in' | 'out', velV: number | null, inf: number | null) => { if (one && oneAnim && !locked) onAnimateMany({ [one.path]: setVelocity(oneAnim, tempoMap, one.i, side, velV, inf) }); };

  if (!row || !paths.length) {
    return <p className="px-4 py-3 text-xs leading-snug text-muted" data-testid="graph-empty">{i18n.t('web.graph.empty')}</p>;
  }
  return (
    <div className="flex h-full min-h-0 flex-col outline-none" tabIndex={-1} onKeyDown={onKeys} data-testid="graph-editor">
      <div className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-line px-2 py-1">
        <span className="max-w-[10rem] truncate text-xs font-medium text-fg" title={label(row)} data-testid="graph-row">{label(row)}</span>
        <div className="seg" role="radiogroup" aria-label={i18n.t('web.graph.kind')}>
          {(['value', 'speed'] as const).map((m) => <button key={m} type="button" role="radio" aria-checked={mode === m} className="seg-btn px-2" onClick={() => setMode(m)} data-testid={`graph-mode-${m}`}>{i18n.t(`web.graph.${m}`)}</button>)}
        </div>
        <button type="button" className="tog" aria-pressed={view === null} onClick={() => setView(null)} aria-label={i18n.t('web.graph.fit')} title={`${i18n.t('web.graph.fit')} (Ctrl+scroll)`} data-testid="graph-fit"><FitWidth className="h-3.5 w-3.5" /></button>
        <span aria-hidden className="mx-0.5 h-4 w-px bg-line" />
        <button type="button" className="btn-ghost" disabled={!copyable} onClick={() => { easeClipboard.set(copySource[0] === 'linear' ? undefined : copySource[0] as EaseSpec); setClip(easeClipboard.get()); }} data-testid="graph-copy-ease">{i18n.t('web.graph.copyEase')}</button>
        <button type="button" className="btn-ghost" disabled={locked || clip === null || !pasteTargets.length} onClick={() => clip !== null && applyToSel(clip ?? undefined)} data-testid="graph-paste-ease">{i18n.t('web.graph.pasteEase')}</button>
        <div className="relative">
          <button ref={libBtn} type="button" className="btn-ghost" aria-expanded={libOpen} aria-haspopup="dialog" onClick={() => setLibOpen((o) => !o)} data-testid="graph-library">{i18n.t('web.graph.library')}</button>
          {libOpen && <EaseLibrary lib={lib} current={currentBez} canApply={!locked && pasteTargets.length > 0}
            onApply={(e) => { applyToSel(e); }} onSave={() => currentBez && saveLib(addSavedEase(lib, nextEaseName(lib, i18n.t('web.graph.curveName')), currentBez))}
            onRemove={(name) => saveLib(lib.filter((x) => x.name !== name))} onClose={closeLib} />}
        </div>
        {vel && (
          <div className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-1" data-testid="graph-velocity">
            {(['in', 'out'] as const).map((side) => {
              const vv = vel[`${side}Vel`], inf = vel[`${side}Inf`];
              if (vv === null || inf === null) return null;
              return (
                <div key={side} className="flex items-center gap-1 text-xs text-muted">
                  <span className="shrink-0">{i18n.t(`web.graph.${side}`)}</span>
                  <span className="w-16 shrink-0" title={i18n.t('web.graph.velocity')}><NumberField label={`${i18n.t(`web.graph.${side}`)}: ${i18n.t('web.graph.velocity')}`} value={vv} spec={{ step: 1 }} disabled={locked} onChange={(x) => setVel(side, x, null)} /></span>
                  <span className="w-14 shrink-0" title={i18n.t('web.graph.influence')}><NumberField label={`${i18n.t(`web.graph.${side}`)}: ${i18n.t('web.graph.influence')}`} value={Math.round(inf * 1000) / 10} spec={{ min: 10, max: 100, step: 1, units: { '%': 1 } }} disabled={locked} onChange={(x) => setVel(side, null, x / 100)} /></span>
                </div>
              );
            })}
            <span className="sr-only">{i18n.t('web.graph.velocity')} · {i18n.t('web.graph.influence')}</span>
          </div>
        )}
      </div>
      <div ref={box} className="relative min-h-0 flex-1 overflow-hidden" data-testid="graph-plot">
        <svg ref={svg} width={size.w} height={size.h} className="absolute inset-0 block touch-none select-none" onPointerDown={startBg}
          role="group" aria-label={`${i18n.t('web.graph.region')}: ${label(row)}`}>
          {/* thước thời gian */}
          <rect x={0} y={0} width={size.w} height={M.t} className="fill-surface" />
          <line x1={0} y1={M.t} x2={size.w} y2={M.t} className="stroke-line" />
          {tticks.map((tt) => (
            <g key={tt}>
              <line x1={xOf(tt)} y1={M.t - 5} x2={xOf(tt)} y2={size.h} className="stroke-line" strokeOpacity={0.6} />
              <text x={xOf(tt) + 3} y={M.t - 7} className="fill-muted text-[11px] tabular-nums">{rulerLabel(tt, step)}</text>
            </g>
          ))}
          {/* trục giá trị */}
          {vticks.map((vv) => (
            <g key={vv}>
              <line x1={M.l} y1={yOf(vv)} x2={size.w - M.r} y2={yOf(vv)} className="stroke-line" strokeOpacity={vv === 0 ? 1 : 0.5} />
              <text x={M.l - 6} y={yOf(vv) + 3.5} textAnchor="end" className="fill-muted text-[11px] tabular-nums">{fmt(vv)}</text>
            </g>
          ))}
          {/* đường cong: không dùng màu nhấn (DESIGN.md); hai đường của Vị trí phân biệt bằng độ đậm và nét đứt */}
          {curves.map((c, k) => (
            <g key={c.p}>
              <path d={pathD(c.pts)} className={`fill-none ${STROKES[k % 2]}`} strokeWidth={k ? 1.5 : 2} strokeDasharray={k ? '5 3' : undefined} strokeLinejoin="round" data-testid={`graph-curve-${c.p}`} />
              {axisName(c.p) && <text x={size.w - M.r - 2} y={yOf(c.pts[c.pts.length - 1][1]) - 4} textAnchor="end" className="fill-muted text-[11px]">{axisName(c.p)}</text>}
            </g>
          ))}
          {/* vạch dẫn bắt dính */}
          {snapLine?.t !== undefined && <line x1={xOf(snapLine.t)} y1={M.t} x2={xOf(snapLine.t)} y2={size.h} className="stroke-guide" />}
          {snapLine?.v !== undefined && <line x1={M.l} y1={yOf(snapLine.v)} x2={size.w - M.r} y2={yOf(snapLine.v)} className="stroke-guide" />}
          {/* vạch phát */}
          <Playhead playback={playback} t0={v.t0} t1={v.t1} xOf={xOf} y0={M.t} y1={size.h} />
          {/* tay cầm */}
          {handles.map((h, k) => (
            <g key={`${h.p}-${h.s.a}-${h.which}-${k}`}>
              <line x1={xOf(h.from[0])} y1={yOf(h.from[1])} x2={xOf(h.at[0])} y2={yOf(h.at[1])} className="pointer-events-none stroke-control" strokeWidth={1.25} />
              <circle cx={xOf(h.at[0])} cy={yOf(h.at[1])} r={4.5} className="pointer-events-none fill-surface stroke-fg [stroke-width:1.5]" />
              <circle cx={xOf(h.at[0])} cy={yOf(h.at[1])} r={12} className={`fill-transparent ${locked ? '' : 'cursor-grab active:cursor-grabbing'}`}
                onPointerDown={(e) => startHandle(e, h)} aria-hidden data-testid={`graph-handle-${h.which}`} />
            </g>
          ))}
          {/* keyframe */}
          {keyPts.filter((k) => k.t >= v.t0 - 1 && k.t <= v.t1 + 1).map((k) => {
            const on = selSet.has(k.ref), x = xOf(k.t), y = yOf(k.v);
            return (
              <g key={k.ref}>
                <rect x={x - 4.5} y={y - 4.5} width={9} height={9} className={`pointer-events-none ${on ? 'fill-accent stroke-accent' : 'fill-surface stroke-muted'}`} strokeWidth={1.5} />
                <rect x={x - 12} y={y - 12} width={24} height={24} tabIndex={0} role="button" aria-pressed={on}
                  aria-label={i18n.t('web.graph.key', { name: `${label(row)}${axisName(k.p) ? ` ${axisName(k.p)}` : ''}`, time: formatClock(k.t), value: fmt(keyAnim(k.p)!.keys[k.i].value as number) })}
                  className={`fill-transparent outline-none focus-visible:stroke-focus [stroke-width:2] ${locked || mode !== 'value' ? 'cursor-pointer' : 'cursor-move'}`}
                  onPointerDown={(e) => startKey(e, k)} onKeyDown={(e) => onKeyKey(e, k)} data-key={k.ref} data-testid="graph-key" />
              </g>
            );
          })}
        </svg>
        {chip && <span className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded border border-control bg-raised px-1.5 py-0.5 text-[11px] tabular-nums text-fg" style={{ left: Math.min(Math.max(chip.x, 64), size.w - 64), top: Math.max(chip.y - 10, 28) }} data-testid="graph-chip">{chip.text}</span>}
      </div>
    </div>
  );
}

/** Vạch phát: thành phần riêng nên lúc đang phát chỉ nó vẽ lại, không phải cả đồ thị. */
function Playhead({ playback, t0, t1, xOf, y0, y1 }: { playback: Playback; t0: number; t1: number; xOf(t: number): number; y0: number; y1: number }) {
  const t = usePlayback(playback, (s) => s.t);
  if (t < t0 || t > t1) return null;
  return <line x1={xOf(t)} y1={y0} x2={xOf(t)} y2={y1} className="pointer-events-none stroke-fg" data-testid="graph-playhead" />;
}

/** Thư viện easing: đường cong dựng sẵn (bezier tương đương) và đường cong đã lưu, mỗi mục có hình thu nhỏ đúng hàm Render Core. */
function EaseLibrary({ lib, current, canApply, onApply, onSave, onRemove, onClose }: {
  lib: readonly SavedEase[]; current: Bezier | null; canApply: boolean;
  onApply(e: EaseSpec | undefined): void; onSave(): void; onRemove(name: string): void; onClose(refocus: boolean): void;
}) {
  const { i18n } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus();
    const away = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node) && !(e.target as HTMLElement)?.closest?.('[data-testid="graph-library"]')) onClose(false); };
    window.addEventListener('pointerdown', away); return () => window.removeEventListener('pointerdown', away);
  }, [onClose]);
  const item = (key: string, name: string, ease: EaseSpec | undefined, remove?: () => void) => (
    <li key={key} className="flex items-center">
      <button type="button" className="flex min-h-[var(--hit)] min-w-0 flex-1 items-center gap-2 rounded px-1.5 text-left text-xs text-fg hover:bg-raised disabled:cursor-not-allowed disabled:opacity-50" disabled={!canApply}
        onClick={() => onApply(ease)} title={name} data-testid={`ease-lib-${key}`}>
        <Thumb ease={ease} /><span className="min-w-0 truncate">{name}</span>
      </button>
      {remove && <button type="button" className="btn-ghost shrink-0" onClick={remove} aria-label={i18n.t('web.graph.removeSaved', { name })} title={i18n.t('web.graph.removeSaved', { name })}>×</button>}
    </li>
  );
  return (
    <div ref={ref} role="dialog" aria-label={i18n.t('web.graph.library')} className="absolute bottom-full left-0 z-40 mb-1 max-h-72 w-64 overflow-auto rounded border border-control bg-surface p-1.5 shadow-none"
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onClose(true); } }} data-testid="ease-library">
      <button type="button" className="btn-ghost mb-1 w-full !justify-start text-left" disabled={!current} onClick={onSave} data-testid="ease-lib-save">{i18n.t('web.graph.save')}</button>
      {lib.length > 0 && <>
        <p className="px-1.5 pb-0.5 pt-1 text-[11px] font-medium text-muted">{i18n.t('web.graph.saved')}</p>
        <ul>{lib.map((s) => item(`saved-${s.name}`, s.name, { cubicBezier: [...s.bezier] as Bezier }, () => onRemove(s.name)))}</ul>
      </>}
      <p className="px-1.5 pb-0.5 pt-1 text-[11px] font-medium text-muted">{i18n.t('web.graph.builtin')}</p>
      <ul>{Object.keys(EASE_BEZIER).map((nm) => item(nm, nm, nm === 'linear' ? undefined : nm))}</ul>
    </div>
  );
}
function Thumb({ ease }: { ease: EaseSpec | undefined }) {
  const pts = easeSamples(ease, 24);
  let lo = 0, hi = 1; for (const [, y] of pts) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
  const d = pts.map(([x, y], k) => `${k ? 'L' : 'M'}${(2 + x * 24).toFixed(1)} ${(26 - ((y - lo) / (hi - lo)) * 24).toFixed(1)}`).join('');
  return <svg viewBox="0 0 28 28" className="h-6 w-6 shrink-0 rounded border border-line bg-page" aria-hidden><path d={d} className="fill-none stroke-fg" strokeWidth={1.5} /></svg>;
}

const r3 = (x: number) => Math.round(x * 1000) / 1000;
/** Số ngắn cho nhãn trục và chip: tối đa 3 chữ số thập phân, bỏ số 0 thừa. */
const fmt = (x: number) => String(Math.abs(x) >= 1000 ? Math.round(x) : r3(x));
const velOut = (s: Segment, bz: Bezier) => { const h = s.tb - s.ta; return h > 0 ? startSlope(bz) * (s.vb - s.va) / h : 0; };
const velIn = (s: Segment, bz: Bezier) => { const h = s.tb - s.ta; return h > 0 ? endSlope(bz) * (s.vb - s.va) / h : 0; };
/** Tốc độ tại keyframe trên đồ thị tốc độ: tốc độ của đoạn đi ra (keyframe cuối: đoạn đi vào); lấy lệch một chút để không rơi vào điểm gãy. */
function speedAt(a: KeyAnimation, tempoMap: readonly TempoPoint[], t: number, last: boolean): number {
  const e = 0.01, at = last ? t - e : t + e; // lớn hơn bước sai phân của trackSpeed (1/240 s)
  return Math.abs(sampleGraph(a, tempoMap, at, at, 1, 'speed')[0][1]);
}
