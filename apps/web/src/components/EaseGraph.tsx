// Đồ thị đường cong của Animation Inspector (DESIGN.md "Animation Inspector"): trục ngang là thời gian của đoạn (0 → 1), trục dọc là tiến độ
// giá trị. Vẽ đúng hàm Render Core sẽ dùng (kể cả elastic, bounce). Hai tay nắm cubic-bezier kéo được; kéo hoặc dùng phím mũi tên
// (Shift ×10, Alt ×0,1) đổi đường cong thành bezier riêng. Một lần kéo = một bước hoàn tác (người gọi bọc trong cử chỉ).
// Không dùng màu nhấn: đường cong màu chữ, tay nắm viền chữ; focus có vòng `focus`.
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { EaseSpec } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { DEFAULT_BEZIER, bezierOf, clampBezier, easeSamples, graphRange, type Bezier } from '../lib/easeCurve.ts';

const W = 200, H = 200, P = 14; // khung vẽ (đơn vị viewBox) và lề trong

export function EaseGraph({ ease, mixed, disabled, onChange, onBegin, onEnd }: {
  ease: EaseSpec | undefined;
  /** Nhiều keyframe đang chọn có đường cong khác nhau: vẽ mờ, kéo tay nắm sẽ áp cho tất cả. */
  mixed?: boolean;
  disabled?: boolean;
  onChange(b: Bezier): void;
  onBegin(): void;
  onEnd(): void;
}) {
  const { i18n } = useI18n();
  const exact = mixed ? null : bezierOf(ease);
  const [drag, setDrag] = useState<Bezier | null>(null);
  const bez: Bezier = drag ?? exact ?? DEFAULT_BEZIER;
  const curve = drag ? { cubicBezier: drag } : ease;
  const samples = easeSamples(mixed && !drag ? 'linear' : curve);
  const [lo, hi] = graphRange(samples, bez);
  const sx = (x: number) => P + x * (W - 2 * P), sy = (y: number) => H - P - ((y - lo) / (hi - lo)) * (H - 2 * P);
  const svg = useRef<SVGSVGElement>(null);
  const toData = (cx: number, cy: number): [number, number] => {
    const r = svg.current!.getBoundingClientRect();
    const x = ((cx - r.left) / r.width) * W, y = ((cy - r.top) / r.height) * H;
    return [(x - P) / (W - 2 * P), lo + ((H - P - y) / (H - 2 * P)) * (hi - lo)];
  };
  const start = (e: PointerEvent<SVGCircleElement>, h: 0 | 1) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const el = e.currentTarget; el.setPointerCapture?.(e.pointerId);
    (el as unknown as HTMLElement).focus?.();
    onBegin();
    let cur = bez;
    const move = (m: globalThis.PointerEvent) => {
      const [x, y] = toData(m.clientX, m.clientY);
      cur = clampBezier(h === 0 ? [x, y, cur[2], cur[3]] : [cur[0], cur[1], x, y]);
      setDrag(cur); onChange(cur);
    };
    const up = () => {
      el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
      setDrag(null); onEnd();
    };
    el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  };
  const key = (e: KeyboardEvent<SVGCircleElement>, h: 0 | 1) => {
    if (disabled) return;
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (!d) return;
    e.preventDefault(); e.stopPropagation();
    const s = e.shiftKey ? 0.1 : e.altKey ? 0.001 : 0.01, b = [...bez];
    b[h * 2] += d[0] * s; b[h * 2 + 1] += d[1] * s;
    onBegin(); onChange(clampBezier(b)); onEnd();
  };
  const path = samples.map(([x, y], i) => `${i ? 'L' : 'M'}${sx(x).toFixed(2)} ${sy(y).toFixed(2)}`).join('');
  const handles: [number, number, number, number][] = [[0, 0, bez[0], bez[1]], [1, 1, bez[2], bez[3]]];
  const faint = mixed || !exact;
  return (
    <div className="relative w-full max-w-[15rem]" data-testid="ease-graph" data-mixed={mixed || undefined}>
      <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className={`block aspect-square w-full touch-none rounded border border-control bg-page ${disabled ? 'opacity-50' : ''}`}
        role="group" aria-label={i18n.t('web.keyinsp.graph')}>
        {/* khung 0..1 và đường chéo "đều" để so */}
        <rect x={sx(0)} y={sy(1)} width={sx(1) - sx(0)} height={sy(0) - sy(1)} className="fill-none stroke-line" strokeWidth="1" />
        <line x1={sx(0)} y1={sy(0)} x2={sx(1)} y2={sy(1)} className="stroke-line" strokeWidth="1" strokeDasharray="3 3" />
        <path d={path} className={`fill-none ${mixed && !drag ? 'stroke-faint' : 'stroke-fg'}`} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" data-testid="ease-path" />
        {handles.map(([ax, ay, hx, hy], h) => (
          <g key={h} className={faint && !drag ? 'opacity-50' : ''}>
            <line x1={sx(ax)} y1={sy(ay)} x2={sx(hx)} y2={sy(hy)} className="stroke-control" strokeWidth="1.25" />
            <rect x={sx(ax) - 3} y={sy(ay) - 3} width="6" height="6" className="fill-fg" />
            {/* Chấm nhìn thấy r 5,5; vùng bấm và focus là vòng r 13 trong suốt quanh nó (≥ 24 px ở cỡ hiển thị), viền focus khi dùng bàn phím. */}
            <circle cx={sx(hx)} cy={sy(hy)} r="5.5" className="pointer-events-none fill-surface stroke-fg [stroke-width:1.75]" />
            <circle cx={sx(hx)} cy={sy(hy)} r="13" tabIndex={disabled ? -1 : 0} role="slider" aria-orientation="horizontal"
              aria-label={i18n.t('web.keyinsp.handle', { n: h + 1 })} aria-valuetext={`x ${bez[h * 2]}, y ${bez[h * 2 + 1]}`} aria-valuenow={bez[h * 2]} aria-valuemin={0} aria-valuemax={1}
              onPointerDown={(e) => start(e, h as 0 | 1)} onKeyDown={(e) => key(e, h as 0 | 1)} data-testid={`ease-handle-${h + 1}`}
              className={`fill-transparent stroke-transparent outline-none [stroke-width:2] focus-visible:stroke-focus ${disabled ? '' : 'cursor-grab active:cursor-grabbing'}`} />
          </g>
        ))}
      </svg>
    </div>
  );
}
