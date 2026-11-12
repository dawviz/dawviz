// Ô nhập số dùng chung (REQ-UI-15): gõ giá trị, phép tính, đơn vị, `+=`; ↑/↓ (Shift ×10, Alt ×0,1); Enter/rời ô để áp, Esc huỷ.
// Mọi điều khiển kéo (thanh trượt, tay nắm…) phải đi kèm một ô này để không thuộc tính nào chỉ chỉnh được bằng chuột.
import { useEffect, useState } from 'react';
import { formatNumber, nudge, parseNumberInput, type NumberSpec } from '../lib/numberInput.ts';

export function NumberField({ id, label, value, onChange, spec, className = '' }: { id?: string; label: string; value: number; onChange(v: number): void; spec: NumberSpec; className?: string }) {
  const shown = formatNumber(value, spec.step);
  const [text, setText] = useState(shown);
  const [editing, setEditing] = useState(false);
  const [bad, setBad] = useState(false);
  useEffect(() => { if (!editing) setText(shown); }, [shown, editing]);

  const commit = () => {
    const r = parseNumberInput(text, value, spec);
    if (r.ok) { setBad(false); if (r.value !== value) onChange(r.value); setText(formatNumber(r.value, spec.step)); }
    else if (r.reason === 'empty') { setBad(false); setText(shown); }
    else { setBad(true); return false; }
    return true;
  };

  return (
    <input id={id} type="text" inputMode="decimal" spellCheck={false} autoComplete="off" aria-label={label} aria-invalid={bad || undefined}
      value={text}
      onFocus={(e) => { setEditing(true); e.currentTarget.select(); }}
      onChange={(e) => { setText(e.target.value); setBad(false); }}
      onBlur={() => { if (!commit()) setText(shown); setBad(false); setEditing(false); }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit(); }
        else if (e.key === 'Escape') { e.preventDefault(); setText(shown); setBad(false); e.currentTarget.blur(); }
        else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const v = nudge(value, e.key === 'ArrowUp' ? 1 : -1, spec, { shift: e.shiftKey, alt: e.altKey });
          onChange(v); setText(formatNumber(v, spec.step));
        }
      }}
      className={`w-full min-w-0 rounded border bg-ink-950 px-1 py-0.5 text-right tabular-nums text-ink-100 focus:outline-none focus:ring-1 focus:ring-accent-400 ${bad ? 'border-red-500' : 'border-ink-700'} ${className}`} />
  );
}
