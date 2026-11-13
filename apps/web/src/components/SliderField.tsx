// Thanh trượt + ô nhập số (REQ-UI-15) dùng chung cho mọi bảng. Lưới dùng minmax(0,1fr) để không tràn khung hẹp (T-61).
import { NumberField } from './NumberField.tsx';
import { AdvTag } from './Inspector.tsx';
import { useGesturePointer } from '../lib/storeReact.ts';

/** `min`/`max` là phạm vi thanh trượt (phạm vi mềm); `hardMin`/`hardMax` cho phép gõ vượt phạm vi đó (mặc định bằng min/max).
 *  `adv`: dòng chỉ có ở Nâng cao (REQ-UI-13), hiện nhãn ADV. `disabled` + `describedBy`: khoá cả thanh trượt lẫn ô số, nối với chú thích lý do. */
export function SliderField({ id, label, value, min, max, step, hardMin, hardMax, adv, disabled, describedBy, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; hardMin?: number; hardMax?: number; adv?: boolean; disabled?: boolean; describedBy?: string; onChange(v: number): void }) {
  const shown = Math.min(Math.max(value, min), max);
  const gesture = useGesturePointer(); // kéo từ pointerdown tới pointerup = một bước hoàn tác (T-07)
  const pct = max > min ? ((shown - min) / (max - min)) * 100 : 0;
  return (
    <div className="grid grid-cols-[minmax(0,7.5rem)_minmax(3rem,1fr)_3.5rem] items-center gap-2 text-xs text-muted">
      <span className="flex min-w-0 items-center gap-1.5"><label htmlFor={id} className="min-w-0 break-words leading-tight" title={label}>{label}</label>{adv && <AdvTag />}</span>
      <input id={id} className="w-full min-w-0 disabled:cursor-not-allowed disabled:opacity-60" disabled={disabled} aria-describedby={describedBy} type="range" min={min} max={max} step={step} value={shown} style={{ '--p': `${pct}%` } as React.CSSProperties} onPointerDown={gesture.onPointerDown} onBlur={gesture.onBlur} onChange={(e) => onChange(Number(e.target.value))} />
      <NumberField label={label} value={value} onChange={onChange} spec={{ min: hardMin ?? min, max: hardMax ?? max, step }} disabled={disabled} describedBy={describedBy} />
    </div>
  );
}
