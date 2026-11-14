// Ô nhập số dùng chung (REQ-UI-15): gõ giá trị, phép tính, đơn vị, `+=`; ↑/↓ (Shift ×10, Alt ×0,1); Enter/rời ô để áp, Esc huỷ.
// Kéo trên ô (chuột/bút, kiểu "hot text" của phần mềm Adobe): kéo lên hoặc sang phải để tăng, xuống hoặc sang trái để giảm;
// Shift ×10, Alt ×0,1; một lần kéo = một bước hoàn tác. Nhấp không kéo thì vào chế độ gõ. Chạm (touch) chỉ gõ, để không cướp cuộn trang.
// Thay thế thanh trượt (D-57): `range` là phạm vi kéo thường dùng (phạm vi mềm), quyết định tốc độ kéo; ô vẫn gõ được tới giới hạn cứng.
// Giá trị không đọc được: báo bằng chữ + biểu tượng (không chỉ bằng màu viền, WCAG 1.4.1), nối với ô qua aria-describedby.
// Rời ô khi còn lỗi thì giữ giá trị cũ và nói rõ điều đó, thông báo ở lại tới khi người dùng sửa, bấm Esc hoặc nhập đúng.
import { useContext, useEffect, useId, useRef, useState, type PointerEvent } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { formatNumber, nudge, parseNumberInput, scrubValue, type NumberSpec } from '../lib/numberInput.ts';
import { StatusIcon } from './StatusIcon.tsx';
import { GestureContext } from '../lib/storeReact.ts';

type ErrorReason = 'syntax' | 'unit' | 'nan' | 'expr';
/** Con trỏ phải đi quá ngần này (px) mới coi là kéo; ít hơn là một cú nhấp để gõ. */
const DRAG_PX = 3;

/** `disabled`: ô bị khoá (vd. vạch phát khi bật bàn phím, T-71); `describedBy`: id đoạn chú thích giải thích lý do.
 *  `range`: phạm vi mềm cho tốc độ kéo (mặc định: một bước mỗi px). `scrub={false}`: tắt kéo (ô chỉ gõ). */
export function NumberField({ id, label, value, onChange, spec, className = '', disabled, describedBy, range, scrub = true }: { id?: string; label: string; value: number; onChange(v: number): void; spec: NumberSpec; className?: string; disabled?: boolean; describedBy?: string; range?: [number, number]; scrub?: boolean }) {
  const { i18n } = useI18n();
  const msgId = useId();
  const gesture = useContext(GestureContext);
  const shown = formatNumber(value, spec.step);
  const [text, setText] = useState(shown);
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<{ reason: ErrorReason; reverted: boolean } | null>(null);
  const drag = useRef<{ x: number; y: number; v0: number; moved: boolean; id: number } | null>(null);
  useEffect(() => { if (!editing) setText(shown); }, [shown, editing]);
  // Gỡ thành phần giữa lúc kéo: đóng cử chỉ để store không kẹt ở trạng thái gộp.
  useEffect(() => () => { if (drag.current?.moved) gesture.end(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /** Áp chuỗi đang gõ; trả lý do lỗi nếu không đọc được. */
  const commit = (): ErrorReason | null => {
    const r = parseNumberInput(text, value, spec);
    // Chốt một giá trị gõ vào là MỘT bước hoàn tác (T-07): bọc trong cử chỉ riêng để không gộp với lần kéo vừa làm trước đó.
    if (r.ok) { setError(null); if (r.value !== value) { gesture.begin(); onChange(r.value); gesture.end(); } setText(formatNumber(r.value, spec.step)); return null; }
    if (r.reason === 'empty') { setError(null); setText(shown); return null; }
    setError({ reason: r.reason, reverted: false });
    return r.reason;
  };

  const canScrub = scrub && !disabled;
  const onPointerDown = (e: PointerEvent<HTMLInputElement>) => {
    // Đang gõ (ô đã focus) thì kéo là bôi đen chữ như mọi ô nhập; chạm thì để trình duyệt cuộn/focus như thường.
    if (!canScrub || editing || e.button !== 0 || e.pointerType === 'touch') return;
    e.preventDefault(); // không focus ngay: chờ xem là nhấp hay kéo
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, v0: value, moved: false, id: e.pointerId };
  };
  const onPointerMove = (e: PointerEvent<HTMLInputElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = d.y - e.clientY; // lên = dương
    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_PX) return;
      d.moved = true; setDragging(true); setError(null); gesture.begin();
    }
    // Trục nào đi xa hơn thì theo trục đó: kéo chéo không cộng dồn hai lần.
    const px = Math.abs(dx) >= Math.abs(dy) ? dx : dy;
    const v = scrubValue(d.v0, px, spec, range, { shift: e.shiftKey, alt: e.altKey });
    if (v !== value) onChange(v);
  };
  const onPointerUp = (e: PointerEvent<HTMLInputElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    if (d.moved) { setDragging(false); gesture.end(); return; }
    // Nhấp không kéo: vào chế độ gõ, bôi đen sẵn để gõ đè.
    const el = e.currentTarget; el.focus(); el.select();
  };
  const onPointerCancel = () => { if (drag.current?.moved) { setDragging(false); gesture.end(); } drag.current = null; };

  const lo = range?.[0] ?? spec.min, hi = range?.[1] ?? spec.max;
  return (
    <span className="relative block w-full min-w-0">
      <input id={id} type="text" inputMode="decimal" spellCheck={false} autoComplete="off" aria-label={label}
        role={scrub ? 'spinbutton' : undefined} aria-valuenow={scrub ? value : undefined}
        aria-valuemin={scrub && Number.isFinite(lo) ? lo : undefined} aria-valuemax={scrub && Number.isFinite(hi) ? hi : undefined}
        aria-invalid={error ? true : undefined} aria-describedby={[error ? msgId : '', describedBy ?? ''].filter(Boolean).join(' ') || undefined} disabled={disabled}
        title={canScrub && !editing ? i18n.t('web.number.scrub') : undefined}
        value={text}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}
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
        style={canScrub && !editing ? { cursor: 'ns-resize' } : undefined}
        className={`min-h-[var(--hit)] w-full min-w-0 select-none rounded border bg-raised px-1 py-0.5 text-right tabular-nums text-fg focus:select-text focus:outline-none focus:ring-1 focus:ring-focus disabled:cursor-not-allowed disabled:opacity-60 ${dragging ? 'border-focus' : error ? 'border-danger' : 'border-control hover:border-line-strong'} ${className}`} />
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
