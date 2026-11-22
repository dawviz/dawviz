// Ô giá trị của thuộc tính animate theo bậc (T-22: bật/tắt, lựa chọn, chữ): dùng chung cho cây Timeline và mục Keyframe.
// Bật/tắt = hộp chọn; lựa chọn có danh sách (lấy từ bảng Thiết lập) = ô chọn; còn lại = ô chữ, ghi khi Enter hoặc rời ô.
import { useEffect, useState } from 'react';
import { MAX_CHOICE_LEN, type KeyValue } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import type { AnimField } from '../lib/animateFields.ts';
import { Select } from './Select.tsx';

export function DiscreteValue({ f, value, label, disabled, compact, onChange }: { f: AnimField; value: KeyValue; label: string; disabled?: boolean; compact?: boolean; onChange(v: KeyValue): void }) {
  const { i18n } = useI18n();
  const [text, setText] = useState(String(value));
  useEffect(() => { setText(String(value)); }, [value]);
  if (f.kind === 'bool') {
    return (
      <span className={`flex min-w-0 flex-1 items-center ${compact ? 'justify-end' : ''}`}>
        <input type="checkbox" aria-label={label} checked={value === true} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" data-testid={`discrete-${f.path}`} />
      </span>
    );
  }
  if (f.options?.length) {
    const opt = (o: string | number) => (f.optionPrefix && i18n.has(`${f.optionPrefix}${o}`) ? i18n.t(`${f.optionPrefix}${o}`) : String(o));
    const known = f.options.some((o) => String(o) === String(value));
    return (
      <Select wrapClassName="min-w-0 flex-1" className={compact ? '!min-h-5 !py-0 text-[11px]' : ''} aria-label={label} value={String(value)} disabled={disabled}
        onChange={(e) => { const o = f.options!.find((x) => String(x) === e.target.value); if (o !== undefined) onChange(o); }} data-testid={`discrete-${f.path}`}>
        {!known && <option value={String(value)}>{String(value)}</option>}
        {f.options.map((o) => <option key={String(o)} value={String(o)}>{opt(o)}</option>)}
      </Select>
    );
  }
  const commit = () => { const v = text.slice(0, MAX_CHOICE_LEN); if (v !== String(value)) onChange(v); };
  return (
    <input type="text" aria-label={label} value={text} maxLength={MAX_CHOICE_LEN} disabled={disabled} onChange={(e) => setText(e.target.value)} onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } else if (e.key === 'Escape') setText(String(value)); }}
      className={`min-w-0 flex-1 rounded border border-control bg-raised px-1 text-fg focus:outline-none focus:ring-1 focus:ring-focus disabled:opacity-60 ${compact ? 'min-h-5 text-[11px]' : 'min-h-[var(--hit)] text-xs'}`} data-testid={`discrete-${f.path}`} />
  );
}
