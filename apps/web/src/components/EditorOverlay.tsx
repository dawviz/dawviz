// Lớp tương tác của Editor (T-68, SRS 5.3 Edit Mode, REQ-GRAPHICS-02/03): khung chọn, 8 tay nắm co giãn, tay nắm xoay,
// điểm neo, đường gióng và dấu khoảng cách đều. Là SVG phủ lên canvas theo toạ độ thiết kế (pt); KHÔNG vẽ vào canvas của
// Render Core nên không bao giờ vào video xuất. Một màu cho cả lớp chỉnh sửa: token `guide` (D-55), khác mọi màu nhấn.
// Mọi thay đổi đi qua `onLayouts` (một lệnh hoàn tác cho cả cử chỉ, lib/commands.ts patchLayouts).
import { useContext, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { rotateGroup, rotatedBounds, snap, snapAngle, toWidgetLocal, type Guide, type SceneDocument, type Spacing, type WidgetLayout } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { GestureContext } from '../lib/storeReact.ts';
import { HANDLES, hitTest, marqueeHits, pointerAngle, round, setAnchor, snapResize, toCanvas, type Handle } from '../lib/editorGeometry.ts';

type Patches = Record<string, Partial<WidgetLayout>>;
interface Props {
  scene: SceneDocument;
  /** Bề rộng hiển thị của khung (CSS px): để tay nắm luôn cùng cỡ trên màn hình. */
  cssWidth: number;
  selected: readonly string[];
  locked: ReadonlySet<string>;
  onSelect(ids: string[]): void;
  onLayouts(p: Patches): void;
  /** Tên widget hiển thị (nhãn trợ năng và chip số đo). */
  name(id: string): string;
  /** Nâng cao: điểm neo kéo được trên khung. Ở Cơ bản điểm neo chỉ để nhìn, để cú nắm giữa widget luôn là "di chuyển". */
  advanced: boolean;
}

type Drag =
  | { kind: 'move'; p0: Pt; primary: string; starts: Record<string, WidgetLayout>; moved: boolean }
  | { kind: 'resize'; handle: Handle; id: string; start: WidgetLayout }
  | { kind: 'rotate'; ids: string[]; starts: Record<string, WidgetLayout>; pivot: [number, number]; a0: number }
  | { kind: 'anchor'; id: string; start: WidgetLayout }
  /** Khung chọn (T-68): kéo trên chỗ trống; Shift cộng thêm vào vùng chọn đang có. Chỉ đổi vùng chọn, không vào lịch sử. */
  | { kind: 'marquee'; p0: Pt; base: string[] };
type Pt = { x: number; y: number };

/** Chip số đo nằm trên khung video (luôn theo preset, thường trắng) nên dùng màu cố định như đường gióng, không theo theme app:
 *  nền trắng, chữ mực #1C1C1A (17:1), viền `guide`. Chữ trắng trên nền `guide` chỉ đạt ~4:1 nên không dùng. */
const CHIP = 'pointer-events-none absolute rounded-sm font-medium tabular-nums ring-1 ring-guide';
const CHIP_COLORS = { background: '#FFFFFF', color: '#1C1C1A' } as const;
const HANDLE_ANGLE: Record<Handle, number> = { n: 0, ne: 45, e: 90, se: 135, s: 180, sw: 225, w: 270, nw: 315 };
const CURSORS = ['ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize'];
const cursorFor = (h: Handle, rot: number) => CURSORS[(((Math.round((HANDLE_ANGLE[h] + rot) / 45) % 4) + 4) % 4)];
const frac = (h: Handle): [number, number] => [h.includes('w') ? 0 : h.includes('e') ? 1 : 0.5, h.includes('n') ? 0 : h.includes('s') ? 1 : 0.5];
/** Neo hút về 9 điểm chuẩn (góc, cạnh giữa, tâm) khi cách dưới ngưỡng; Alt tắt. */
const snapFrac = (v: number, th: number) => { for (const k of [0, 0.5, 1]) if (Math.abs(v - k) <= th) return k; return v; };

export function EditorOverlay({ scene, cssWidth, selected, locked, onSelect, onLayouts, name, advanced }: Props) {
  const { i18n } = useI18n();
  const gesture = useContext(GestureContext);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [guides, setGuides] = useState<{ g: Guide[]; s: Spacing[] }>({ g: [], s: [] });
  const [active, setActive] = useState<Drag['kind'] | null>(null);
  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const { designWidth: W, designHeight: H, snapping } = scene.canvas;
  const k = cssWidth > 0 ? W / cssWidth : 1; // pt trên mỗi px màn hình
  const byId = useMemo(() => new Map(scene.widgets.map((w) => [w.id, w])), [scene.widgets]);
  const sel = selected.map((id) => byId.get(id)).filter((w): w is NonNullable<typeof w> => !!w);
  const single = sel.length === 1 ? sel[0] : null;

  const toPt = (e: { clientX: number; clientY: number }): Pt => {
    const r = svg.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };
  const begin = (d: Drag, e: PointerEvent) => {
    drag.current = d; setActive(d.kind);
    svg.current?.setPointerCapture(e.pointerId);
    gesture.begin();
  };

  const onDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    const p = toPt(e), t = e.target as Element;
    const handle = t.getAttribute('data-handle') as Handle | 'rotate' | 'anchor' | null;
    e.preventDefault();
    svg.current?.parentElement?.focus({ preventScroll: true });
    if (handle === 'rotate' && sel.length) {
      const ids = sel.map((w) => w.id), starts = Object.fromEntries(sel.map((w) => [w.id, w.layout]));
      const pivot: [number, number] = single ? toCanvas(single.layout, single.layout.anchor.x * single.layout.width, single.layout.anchor.y * single.layout.height) : groupCenter(sel.map((w) => w.layout));
      begin({ kind: 'rotate', ids, starts, pivot, a0: pointerAngle(pivot, p) }, e); return;
    }
    if (handle === 'anchor' && single && advanced) { begin({ kind: 'anchor', id: single.id, start: single.layout }, e); return; }
    if (handle && single) { begin({ kind: 'resize', handle: handle as Handle, id: single.id, start: single.layout }, e); return; }
    const hit = hitTest(scene.widgets, p, locked);
    if (!hit) {
      if (!e.shiftKey) onSelect([]);
      drag.current = { kind: 'marquee', p0: p, base: e.shiftKey ? [...selected] : [] }; setActive('marquee'); setBox(null);
      svg.current?.setPointerCapture(e.pointerId); return;
    }
    if (e.shiftKey) { onSelect(selected.includes(hit.id) ? selected.filter((x) => x !== hit.id) : [...selected, hit.id]); return; }
    const ids = selected.includes(hit.id) ? selected.filter((id) => !locked.has(id)) : [hit.id];
    if (!selected.includes(hit.id)) onSelect(ids);
    begin({ kind: 'move', p0: p, primary: hit.id, starts: Object.fromEntries(ids.map((id) => [id, byId.get(id)!.layout])), moved: false }, e);
  };

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const p = toPt(e), d = drag.current;
    if (!d) { const h = hitTest(scene.widgets, p, locked); setHover(h ? h.id : null); return; }
    if (d.kind === 'marquee') {
      const r = { x: Math.min(d.p0.x, p.x), y: Math.min(d.p0.y, p.y), width: Math.abs(p.x - d.p0.x), height: Math.abs(p.y - d.p0.y) };
      if (r.width < 3 * k && r.height < 3 * k) return;
      setBox(r);
      const hits = marqueeHits(scene.widgets, r, locked);
      onSelect([...new Set([...d.base, ...hits])]);
      return;
    }
    if (d.kind === 'move') {
      if (!d.moved && Math.hypot(p.x - d.p0.x, p.y - d.p0.y) < 3 * k) return; // nhấp không phải kéo
      d.moved = true;
      const s0 = d.starts[d.primary];
      const others = scene.widgets.filter((w) => w.visible && !(w.id in d.starts)).map((w) => w.layout);
      const r = snap({
        moving: s0, to: { x: s0.x + p.x - d.p0.x, y: s0.y + p.y - d.p0.y }, from: { x: s0.x, y: s0.y }, others, canvas: { width: W, height: H },
        grid: { enabled: snapping.gridEnabled, size: snapping.gridSize }, guides: snapping.smartGuidesEnabled, threshold: 5 * k, alt: e.altKey, shift: e.shiftKey,
      });
      const dx = Math.round(r.x) - s0.x, dy = Math.round(r.y) - s0.y;
      setGuides({ g: r.guides, s: r.spacings });
      onLayouts(Object.fromEntries(Object.entries(d.starts).map(([id, l]) => [id, { x: l.x + dx, y: l.y + dy }])));
    } else if (d.kind === 'resize') {
      // Bắt dính khi đổi cỡ: Alt đã là "co giãn quanh tâm" nên Ctrl/⌘ mới tắt tạm bắt dính.
      const others = scene.widgets.filter((w) => w.visible && w.id !== d.id).map((w) => w.layout);
      const r = snapResize(d.start, d.handle, p, { shift: e.shiftKey, alt: e.altKey }, {
        others, canvas: { width: W, height: H }, grid: { enabled: snapping.gridEnabled, size: snapping.gridSize }, guides: snapping.smartGuidesEnabled,
        threshold: 5 * k, off: e.ctrlKey || e.metaKey,
      });
      setGuides({ g: r.guides, s: [] });
      onLayouts({ [d.id]: r.layout });
    } else if (d.kind === 'rotate') {
      const raw = pointerAngle(d.pivot, p) - d.a0;
      if (d.ids.length === 1) {
        const s = d.starts[d.ids[0]];
        onLayouts({ [d.ids[0]]: { rotation: Math.round(snapAngle(s.rotation + raw, { shift: e.shiftKey })) } });
      } else {
        const delta = Math.round(snapAngle(raw, { shift: e.shiftKey }));
        const out = rotateGroup(d.ids.map((id) => d.starts[id]), delta);
        onLayouts(Object.fromEntries(d.ids.map((id, i) => [id, round(out[i])])));
      }
    } else if (d.kind === 'anchor') {
      const s = d.start, th = e.altKey ? 0 : (8 * k) / Math.min(s.width, s.height);
      const loc = toWidgetLocal(s, p.x, p.y);
      onLayouts({ [d.id]: setAnchor(s, { x: snapFrac(loc.x / s.width, th), y: snapFrac(loc.y / s.height, th) }) });
    }
  };

  const end = () => {
    if (!drag.current) return;
    const wasMarquee = drag.current.kind === 'marquee';
    drag.current = null; setActive(null); setGuides({ g: [], s: [] }); setBox(null);
    if (!wasMarquee) gesture.end();
  };

  // Bàn phím: mũi tên dịch 1 pt (Shift 10 pt), Esc bỏ chọn. Các lần bấm liên tiếp gộp thành một bước (MERGE_WINDOW_MS của store).
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && selected.length) { e.preventDefault(); onSelect([]); return; }
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!dir || !sel.length) return;
    e.preventDefault();
    const step = e.shiftKey ? 10 : 1;
    onLayouts(Object.fromEntries(sel.filter((w) => !locked.has(w.id)).map((w) => [w.id, { x: w.layout.x + dir[0] * step, y: w.layout.y + dir[1] * step }])));
  };

  const px = (n: number) => n * k;
  const transform = (l: WidgetLayout) => {
    const ax = l.anchor.x * l.width, ay = l.anchor.y * l.height;
    return `translate(${l.x + ax} ${l.y + ay}) rotate(${l.rotation}) translate(${-ax} ${-ay})`;
  };
  const groupBox = sel.length > 1 ? unionBounds(sel.map((w) => w.layout)) : null;
  const readout = single && active ? readoutFor(active, single.layout, i18n) : null;
  const chipAt = single ? rotatedBounds(single.layout) : groupBox;

  return (
    <div className="absolute inset-0 outline-none" tabIndex={0} role="group" aria-label={i18n.t('web.editor.canvas')} aria-describedby="editor-keys" onKeyDown={onKey} data-testid="editor-overlay">
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full touch-none select-none overflow-visible"
        style={{ cursor: active === 'move' ? 'move' : active === 'rotate' ? 'grabbing' : hover ? 'move' : 'default' }}
        onPointerDown={onDown} onPointerMove={onMove} onPointerUp={end} onPointerCancel={end} onPointerLeave={() => { if (!drag.current) setHover(null); }}
        onDoubleClick={(e) => {
          const t = (e.target as Element).getAttribute('data-handle');
          if (t === 'rotate' && sel.length) { gesture.begin(); onLayouts(Object.fromEntries(sel.map((w) => [w.id, { rotation: 0 }]))); gesture.end(); }
        }}>
        <g fill="none" stroke="rgb(var(--guide))" vectorEffect="non-scaling-stroke">
          {/* Khung mờ của mọi widget: widget chưa có dữ liệu vẫn thấy chỗ của nó ở Edit Mode (SRS 3.4). */}
          {/* Khung chờ: chấm mảnh, nhạt; rê chuột thì nét liền. Widget khoá: nét liền rất nhạt, không bao giờ nổi khi rê. */}
          {scene.widgets.filter((w) => w.visible && !selected.includes(w.id)).map((w) => {
            const hot = w.id === hover && !active, lk = locked.has(w.id);
            return <rect key={w.id} transform={transform(w.layout)} width={w.layout.width} height={w.layout.height}
              strokeOpacity={hot ? 0.9 : lk ? 0.2 : 0.3} strokeWidth={hot ? 1.5 : 1} strokeDasharray={hot || lk ? undefined : '1 3'} strokeLinecap="round" vectorEffect="non-scaling-stroke" pointerEvents="none" />;
          })}
          {box && <rect x={box.x} y={box.y} width={box.width} height={box.height} fill="rgb(var(--guide))" fillOpacity={0.08} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" pointerEvents="none" data-testid="marquee" />}
          {groupBox && <rect x={groupBox.x} y={groupBox.y} width={groupBox.width} height={groupBox.height} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" pointerEvents="none" />}
          {sel.map((w) => <rect key={w.id} transform={transform(w.layout)} width={w.layout.width} height={w.layout.height} strokeWidth={1.5} vectorEffect="non-scaling-stroke" pointerEvents="none" />)}
          {guides.g.map((g, i) => g.axis === 'x'
            ? <line key={`g${i}`} x1={g.pos} x2={g.pos} y1={g.from} y2={g.to} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            : <line key={`g${i}`} y1={g.pos} y2={g.pos} x1={g.from} x2={g.to} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />)}
          {guides.s.map((s, i) => s.gaps.map(([a, b], j) => s.axis === 'x'
            ? <path key={`s${i}${j}`} d={`M${a} ${s.at}H${b}M${a} ${s.at - px(4)}V${s.at + px(4)}M${b} ${s.at - px(4)}V${s.at + px(4)}`} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            : <path key={`s${i}${j}`} d={`M${s.at} ${a}V${b}M${s.at - px(4)} ${a}H${s.at + px(4)}M${s.at - px(4)} ${b}H${s.at + px(4)}`} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />))}
        </g>
        {single && !locked.has(single.id) && (
          <g transform={transform(single.layout)}>
            <line x1={single.layout.width / 2} x2={single.layout.width / 2} y1={0} y2={-px(22)} stroke="rgb(var(--guide))" vectorEffect="non-scaling-stroke" pointerEvents="none" />
            <circle data-handle="rotate" cx={single.layout.width / 2} cy={-px(22)} r={px(5)} fill="white" stroke="rgb(var(--guide))" strokeWidth={1.5} vectorEffect="non-scaling-stroke" style={{ cursor: active === 'rotate' ? 'grabbing' : 'grab' }}>
              <title>{i18n.t('web.editor.rotateHandle')}</title>
            </circle>
            {HANDLES.map((h) => {
              const [fx, fy] = frac(h), s = px(8);
              return <rect key={h} data-handle={h} x={fx * single.layout.width - s / 2} y={fy * single.layout.height - s / 2} width={s} height={s}
                fill="white" stroke="rgb(var(--guide))" strokeWidth={1.5} vectorEffect="non-scaling-stroke" style={{ cursor: cursorFor(h, single.layout.rotation) }} />;
            })}
            {/* Điểm neo: tâm xoay, kéo để đổi (hút về góc/cạnh/tâm, Alt tự do). */}
            <g transform={`translate(${single.layout.anchor.x * single.layout.width} ${single.layout.anchor.y * single.layout.height})`}>
              {advanced
                ? <circle data-handle="anchor" r={px(5)} fill="white" fillOpacity={0.85} stroke="rgb(var(--guide))" strokeWidth={1.5} vectorEffect="non-scaling-stroke" style={{ cursor: 'crosshair' }}>
                    <title>{i18n.t('web.editor.anchorHandle')}</title>
                  </circle>
                : <circle r={px(2)} fill="rgb(var(--guide))" pointerEvents="none" />}
              {advanced && <path d={`M${-px(8)} 0H${px(8)}M0 ${-px(8)}V${px(8)}`} stroke="rgb(var(--guide))" vectorEffect="non-scaling-stroke" pointerEvents="none" />}
            </g>
          </g>
        )}
        {groupBox && (
          <g>
            <line x1={groupBox.x + groupBox.width / 2} x2={groupBox.x + groupBox.width / 2} y1={groupBox.y} y2={groupBox.y - px(22)} stroke="rgb(var(--guide))" vectorEffect="non-scaling-stroke" pointerEvents="none" />
            <circle data-handle="rotate" cx={groupBox.x + groupBox.width / 2} cy={groupBox.y - px(22)} r={px(5)} fill="white" stroke="rgb(var(--guide))" strokeWidth={1.5} vectorEffect="non-scaling-stroke" style={{ cursor: 'grab' }}>
              <title>{i18n.t('web.editor.rotateGroup')}</title>
            </circle>
          </g>
        )}
      </svg>
      {/* Số đo khi kéo: chữ của giao diện (không phải của video), đặt ngay dưới khung bao. */}
      {readout && chipAt && (
        <span className={`${CHIP} z-10 -translate-x-1/2 whitespace-nowrap px-1.5 py-0.5 text-xs`} style={{ ...CHIP_COLORS,
          left: `${((chipAt.x + chipAt.width / 2) / W) * 100}%`, top: `calc(${((chipAt.y + chipAt.height) / H) * 100}% + 8px)` }} data-testid="editor-readout">{readout}</span>
      )}
      {guides.s.map((s, i) => s.gaps.map(([a, b], j) => (
        <span key={`l${i}${j}`} className={`${CHIP} -translate-x-1/2 -translate-y-1/2 px-1 text-xs leading-4`}
          style={s.axis === 'x' ? { ...CHIP_COLORS, left: `${((a + b) / 2 / W) * 100}%`, top: `calc(${(s.at / H) * 100}% - 10px)` } : { ...CHIP_COLORS, left: `calc(${(s.at / W) * 100}% + 18px)`, top: `${((a + b) / 2 / H) * 100}%` }}>
          {i18n.number(Math.round(s.gap))}
        </span>
      )))}
      <span className="sr-only" aria-live="polite">{single ? i18n.t('web.editor.selectedOne', { name: name(single.id), x: i18n.number(single.layout.x), y: i18n.number(single.layout.y) }) : sel.length > 1 ? i18n.t('web.editor.selectedMany', { n: sel.length }) : ''}</span>
    </div>
  );
}

function unionBounds(ls: WidgetLayout[]) {
  const bs = ls.map(rotatedBounds);
  const x = Math.min(...bs.map((b) => b.x)), y = Math.min(...bs.map((b) => b.y));
  return { x, y, width: Math.max(...bs.map((b) => b.x + b.width)) - x, height: Math.max(...bs.map((b) => b.y + b.height)) - y };
}
function groupCenter(ls: WidgetLayout[]): [number, number] {
  const b = unionBounds(ls); return [b.x + b.width / 2, b.y + b.height / 2];
}
function readoutFor(kind: Drag['kind'], l: WidgetLayout, i18n: { number(n: number): string }): string {
  if (kind === 'rotate') return `${i18n.number(l.rotation)}°`;
  if (kind === 'resize') return `${i18n.number(l.width)} × ${i18n.number(l.height)}`;
  if (kind === 'anchor') return `${i18n.number(Math.round(l.anchor.x * 100))}% · ${i18n.number(Math.round(l.anchor.y * 100))}%`;
  return `${i18n.number(l.x)}, ${i18n.number(l.y)}`;
}
