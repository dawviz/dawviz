// Thanh trượt + ô nhập số (REQ-UI-15) dùng chung cho mọi bảng. Lưới dùng minmax(0,1fr) để không tràn khung hẹp (T-61).
import { NumberField } from './NumberField.tsx';

/** `min`/`max` là phạm vi thanh trượt (phạm vi mềm); `hardMin`/`hardMax` cho phép gõ vượt phạm vi đó (mặc định bằng min/max). */
export function SliderField({ id, label, value, min, max, step, hardMin, hardMax, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; hardMin?: number; hardMax?: number; onChange(v: number): void }) {
  return (
    <div className="grid grid-cols-[minmax(0,7rem)_minmax(3rem,1fr)_3.25rem] items-center gap-2 text-xs text-ink-300">
      <label htmlFor={id} className="truncate" title={label}>{label}</label>
      <input id={id} className="w-full min-w-0" type="range" min={min} max={max} step={step} value={Math.min(Math.max(value, min), max)} onChange={(e) => onChange(Number(e.target.value))} />
      <NumberField label={label} value={value} onChange={onChange} spec={{ min: hardMin ?? min, max: hardMax ?? max, step }} />
    </div>
  );
}
