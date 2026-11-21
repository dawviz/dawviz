// Ô nhập thời gian `m:ss` / `m:ss.s` / giây (T-81). Enter hoặc rời ô để áp; sai cú pháp thì trả về giá trị cũ; Esc huỷ.
// `value = null` cùng `emptyText`: ô trống có nghĩa riêng (vd. "hết bài" của mốc kết thúc khoảng hiển thị).
import { useEffect, useState } from 'react';
import { formatTime, parseTime } from '../lib/timeText.ts';

export function TimeField({ id, label, value, onChange, emptyText, min = 0, max = 86400, className = '', disabled }: {
  id?: string; label: string; value: number | null; onChange(v: number | null): void; disabled?: boolean;
  /** Có thì cho phép ô trống (= null) và hiện chữ này làm gợi ý. */
  emptyText?: string; min?: number; max?: number; className?: string;
}) {
  const shown = value === null ? '' : formatTime(value);
  const [text, setText] = useState(shown);
  const [bad, setBad] = useState(false);
  useEffect(() => { setText(shown); setBad(false); }, [shown]);
  const commit = () => {
    if (!text.trim() && emptyText !== undefined) { setBad(false); if (value !== null) onChange(null); return; }
    const v = parseTime(text);
    if (v === null || v < min || v > max) { setText(shown); setBad(true); return; }
    setBad(false); setText(formatTime(v)); if (v !== value) onChange(v);
  };
  return (
    <input id={id} type="text" inputMode="decimal" autoComplete="off" spellCheck={false} aria-label={label} value={text} placeholder={emptyText} aria-invalid={bad || undefined} data-testid={id} disabled={disabled}
      onChange={(e) => { setText(e.target.value); setBad(false); }} onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } else if (e.key === 'Escape') { setText(shown); setBad(false); } }}
      className={`w-full min-w-0 rounded border border-control bg-raised px-2 py-1 text-right text-[13px] tabular-nums text-fg disabled:cursor-not-allowed disabled:opacity-60 ${className}`} />
  );
}
