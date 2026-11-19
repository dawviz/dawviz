// Ô nhập cao độ theo tên nốt (C1, C#3, Db2) cho dải cao độ. Gõ xong Enter hoặc rời ô để áp; sai cú pháp thì trả về giá trị cũ, Esc huỷ.
import { useEffect, useState } from 'react';
import { pitchName } from '@dawviz/render-core';
import { parsePitch } from '../lib/pitchText.ts';

export function PitchField({ id, label, value, onChange }: { id: string; label: string; value: number; onChange(v: number): void }) {
  const shown = pitchName(value);
  const [text, setText] = useState(shown);
  const [bad, setBad] = useState(false);
  useEffect(() => { setText(shown); setBad(false); }, [shown]);
  const commit = () => {
    const p = parsePitch(text);
    if (p === null) { setText(shown); setBad(true); return; }
    setBad(false); setText(pitchName(p)); if (p !== value) onChange(p);
  };
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span>{label}</span>
      <input id={id} type="text" inputMode="text" autoComplete="off" spellCheck={false} value={text} aria-invalid={bad || undefined} data-testid={id}
        onChange={(e) => { setText(e.target.value); setBad(false); }} onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } else if (e.key === 'Escape') { setText(shown); setBad(false); } }}
        className="w-full rounded border border-control bg-raised px-2 py-1 text-right text-[13px] text-fg" />
    </label>
  );
}
