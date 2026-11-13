// Ô nhập số dùng chung (REQ-UI-15): gõ giá trị, phép tính, đơn vị, `+=`; ↑/↓ (Shift ×10, Alt ×0,1); Enter/rời ô để áp, Esc huỷ.
// Mọi điều khiển kéo (thanh trượt, tay nắm…) phải đi kèm một ô này để không thuộc tính nào chỉ chỉnh được bằng chuột.
// Giá trị không đọc được: báo bằng chữ + biểu tượng (không chỉ bằng màu viền, WCAG 1.4.1), nối với ô qua aria-describedby.
// Rời ô khi còn lỗi thì giữ giá trị cũ và nói rõ điều đó, thông báo ở lại tới khi người dùng sửa, bấm Esc hoặc nhập đúng.
import { useContext, useEffect, useId, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { formatNumber, nudge, parseNumberInput, type NumberSpec } from '../lib/numberInput.ts';
import { StatusIcon } from './StatusIcon.tsx';
import { GestureContext } from '../lib/storeReact.ts';

type ErrorReason = 'syntax' | 'unit' | 'nan' | 'expr';

/** `disabled`: ô bị khoá (vd. vạch phát khi bật bàn phím, T-71); `describedBy`: id đoạn chú thích giải thích lý do. */
export function NumberField({ id, label, value, onChange, spec, className = '', disabled, describedBy }: { id?: string; label: string; value: number; onChange(v: number): void; spec: NumberSpec; className?: string; disabled?: boolean; describedBy?: string }) {
  const { i18n } = useI18n();
  const msgId = useId();
  const gesture = useContext(GestureContext);
  const shown = formatNumber(value, spec.step);
  const [text, setText] = useState(shown);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<{ reason: ErrorReason; reverted: boolean } | null>(null);
  useEffect(() => { if (!editing) setText(shown); }, [shown, editing]);

  /** Áp chuỗi đang gõ; trả lý do lỗi nếu không đọc được. */
  const commit = (): ErrorReason | null => {
    const r = parseNumberInput(text, value, spec);
    // Chốt một giá trị gõ vào là MỘT bước hoàn tác (T-07): bọc trong cử chỉ riêng để không gộp với thanh trượt vừa chỉnh trước đó.
    if (r.ok) { setError(null); if (r.value !== value) { gesture.begin(); onChange(r.value); gesture.end(); } setText(formatNumber(r.value, spec.step)); return null; }
    if (r.reason === 'empty') { setError(null); setText(shown); return null; }
    setError({ reason: r.reason, reverted: false });
    return r.reason;
  };

  return (
    <span className="relative block w-full min-w-0">
      <input id={id} type="text" inputMode="decimal" spellCheck={false} autoComplete="off" aria-label={label}
        aria-invalid={error ? true : undefined} aria-describedby={[error ? msgId : '', describedBy ?? ''].filter(Boolean).join(' ') || undefined} disabled={disabled}
        value={text}
        onFocus={(e) => { setEditing(true); e.currentTarget.select(); }}
        onChange={(e) => { setText(e.target.value); setError(null); }}
        onBlur={() => {
          const reason = commit();
          if (reason) { setText(shown); setError({ reason, reverted: true }); }
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          else if (e.key === 'Escape') { e.preventDefault(); setText(shown); setError(null); e.currentTarget.blur(); }
          else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            const v = nudge(value, e.key === 'ArrowUp' ? 1 : -1, spec, { shift: e.shiftKey, alt: e.altKey });
            setError(null); onChange(v); setText(formatNumber(v, spec.step));
          }
        }}
        className={`min-h-[var(--hit)] w-full min-w-0 rounded border bg-raised px-1 py-0.5 text-right tabular-nums text-fg focus:outline-none focus:ring-1 focus:ring-focus disabled:cursor-not-allowed disabled:opacity-60 ${error ? 'border-danger' : 'border-control'} ${className}`} />
      <span id={msgId} role="status" aria-live="polite"
        className={error ? 'absolute right-0 top-full z-30 mt-1 flex w-max max-w-[16rem] gap-1.5 rounded border border-danger/60 bg-raised px-2 py-1 text-left text-xs leading-snug text-fg' : 'sr-only'}
        data-testid="number-error">
        {error && <>
          <StatusIcon kind="error" className="mt-px h-3.5 w-3.5 shrink-0 text-danger" />
          <span>{i18n.t(`web.number.error.${error.reason}`)}{error.reverted ? ` ${i18n.t('web.number.reverted')}` : ''}</span>
        </>}
      </span>
    </span>
  );
}
