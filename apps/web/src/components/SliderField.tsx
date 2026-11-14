// Dòng thông số số dùng chung cho mọi bảng (REQ-UI-15, D-57): nhãn | ô số kéo được | nút ↺.
// Không còn thanh trượt: kéo lên/xuống (hoặc trái/phải) ngay trên ô để đổi giá trị như "hot text" của phần mềm Adobe.
// Tên `SliderField` giữ lại cho ít xáo trộn; `min`/`max` vẫn là phạm vi mềm (quyết định tốc độ kéo), `hardMin`/`hardMax` là giới hạn gõ.
// Lưới dùng minmax(0,1fr) để không tràn khung hẹp (T-61); ô số và nút ↺ ở cột cố định nên mọi dòng thẳng hàng.
import { useContext } from 'react';
import { NumberField } from './NumberField.tsx';
import { ResetButton } from './Inspector.tsx';
import { GestureContext } from '../lib/storeReact.ts';

/** `disabled` + `describedBy`: khoá ô, nối với chú thích lý do.
 *  `reset`: giá trị tham chiếu (bộ dựng sẵn đang chọn); khác giá trị hiện tại thì hiện nút ↺. */
export function SliderField({ id, label, value, min, max, step, hardMin, hardMax, disabled, describedBy, reset, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; hardMin?: number; hardMax?: number; disabled?: boolean; describedBy?: string; reset?: number; onChange(v: number): void }) {
  const gesture = useContext(GestureContext);
  const changed = reset !== undefined && Math.abs(reset - value) > step / 1000;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_1.5rem] items-center gap-2 text-xs text-muted" data-testid={`field-${id}`}>
      <span className="flex min-w-0 items-center gap-1.5"><label htmlFor={id} className="min-w-0 break-words leading-tight" title={label}>{label}</label></span>
      <NumberField id={id} label={label} value={value} onChange={onChange} range={[min, max]} spec={{ min: hardMin ?? min, max: hardMax ?? max, step }} disabled={disabled} describedBy={describedBy} />
      <ResetButton label={label} changed={changed} disabled={disabled} onReset={() => { gesture.begin(); onChange(reset!); gesture.end(); }} />
    </div>
  );
}
