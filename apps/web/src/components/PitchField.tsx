// Ô cao độ của dải cao độ Piano Roll (T-129): là ô số (NumberField) theo số MIDI 0–127 nhưng HIỆN tên nốt (C2, C#3).
// Kéo lên/xuống đổi theo nửa cung (Shift nhanh hơn, Alt chậm hơn), ↑/↓ một nửa cung; gõ tên nốt (C1, C#3, Db2) hoặc số MIDI rồi Enter.
import { pitchName } from '@dawviz/render-core';
import { parsePitch } from '../lib/pitchText.ts';
import { NumberField } from './NumberField.tsx';

const SPEC = { min: 0, max: 127, step: 1 } as const;
const RANGE: [number, number] = [0, 127];

export function PitchField({ id, label, value, onChange }: { id: string; label: string; value: number; onChange(v: number): void }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span>{label}</span>
      <NumberField id={id} testId={id} label={label} value={value} spec={SPEC} range={RANGE} format={pitchName} parse={parsePitch} syntaxErrorKey="web.pitch.error"
        className="text-[13px]" onChange={(v) => { const p = Math.max(0, Math.min(127, Math.round(v))); if (p !== value) onChange(p); }} />
    </label>
  );
}
