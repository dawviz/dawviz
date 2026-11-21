// Thanh chia panel (DESIGN.md "Panel đổi cỡ", mẫu WAI-ARIA Window Splitter): kéo để đổi cỡ, nhấp đúp về cỡ mặc định,
// phím mũi tên đổi 8 px (Shift: 32 px), Home/End về nhỏ nhất/lớn nhất, Enter thu gọn/mở panel nếu có `onToggle`.
// Vô hình khi nghỉ (đường kẻ `line` của panel là đủ); rê, focus hoặc đang kéo thì hiện vạch `line-strong` 2 px.
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';

export interface SplitterProps {
  /** 'x': vạch dọc, đổi bề rộng. 'y': vạch ngang, đổi chiều cao. */
  axis: 'x' | 'y';
  /** Chiều con trỏ làm panel lớn lên: 1 = sang phải/xuống dưới, -1 = sang trái/lên trên. */
  grow: 1 | -1;
  label: string; value: number; min: number; max: number;
  /** id của panel được đổi cỡ (aria-controls). */
  controls: string;
  onResize(px: number): void;
  onReset(): void;
  onToggle?(): void;
  /** Gợi ý khi rê (cách kéo, nhấp đúp, phím). */
  title?: string;
  className?: string;
  style?: CSSProperties;
  testId?: string;
}

export function Splitter({ axis, grow, label, value, min, max, controls, onResize, onReset, onToggle, title, className = '', style, testId }: SplitterProps) {
  const [drag, setDrag] = useState(false);
  const start = useRef({ p: 0, v: 0 });
  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    start.current = { p: axis === 'x' ? e.clientX : e.clientY, v: value };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.currentTarget.focus();
    setDrag(true);
    document.body.style.cursor = axis === 'x' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const p = axis === 'x' ? e.clientX : e.clientY;
    onResize(start.current.v + grow * (p - start.current.p));
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    setDrag(false);
    document.body.style.cursor = ''; document.body.style.userSelect = '';
  };
  const key = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 32 : 8;
    const dir = axis === 'x' ? { ArrowLeft: -1, ArrowRight: 1 }[e.key] : { ArrowUp: -1, ArrowDown: 1 }[e.key];
    if (dir !== undefined) { e.preventDefault(); onResize(value + grow * dir * step); return; }
    if (e.key === 'Home') { e.preventDefault(); onResize(min); return; }
    if (e.key === 'End') { e.preventDefault(); onResize(max); return; }
    if (e.key === 'Enter' && onToggle) { e.preventDefault(); onToggle(); }
  };
  const box = axis === 'x' ? 'inset-y-0 w-2 -translate-x-1/2 cursor-col-resize' : 'inset-x-0 h-2 -translate-y-1/2 cursor-row-resize';
  const bar = axis === 'x' ? 'inset-y-0 left-1/2 w-0.5 -translate-x-1/2' : 'inset-x-0 top-1/2 h-0.5 -translate-y-1/2';
  return (
    <div role="separator" tabIndex={0} aria-orientation={axis === 'x' ? 'vertical' : 'horizontal'} aria-label={label} aria-controls={controls}
      aria-valuenow={Math.round(value)} aria-valuemin={min} aria-valuemax={max} title={title} data-testid={testId} data-dragging={drag || undefined}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={up} onDoubleClick={onReset} onKeyDown={key}
      className={`group absolute z-30 touch-none outline-none ${box} ${className}`} style={style}>
      <span aria-hidden className={`pointer-events-none absolute ${bar} transition-colors duration-150 ${drag ? 'bg-line-strong' : 'bg-transparent group-hover:bg-line-strong group-focus-visible:bg-focus'}`} />
    </div>
  );
}
