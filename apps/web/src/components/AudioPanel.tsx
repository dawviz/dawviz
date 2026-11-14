// Âm thanh trong mục 01 Bài (T-08, TECHNICAL-DESIGN §6.2.3, D-53). Cơ bản: chỉ nạp tệp + tên tệp; offset ở "Thêm tuỳ chọn".
// Offset: ô số (REQ-UI-15, ms) + nút −/+ (Shift ×10, Alt ×100) + dòng chữ giải thích theo giá trị.
import { useRef, type DragEvent } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { AUDIO_ACCEPT } from '../lib/audioLimits.ts';
import { OFFSET_LIMIT_MS, clampOffsetMs } from '../lib/audioMap.ts';
import { formatClock } from '../lib/timeFormat.ts';
import { Minus, Plus } from './Icons.tsx';
import { NumberField } from './NumberField.tsx';

export interface AudioInfo { name: string; durationSec: number }
const stepBtn = 'grid h-[var(--hit)] w-8 shrink-0 place-items-center rounded border border-control bg-raised text-fg transition hover:border-line-strong active:scale-95';

/** Dòng giải thích offset bằng lời (locales web.audio.offset.*). */
export function offsetSummary(i18n: { t(k: string, p?: Record<string, unknown>): string; number(n: number, o?: Intl.NumberFormatOptions): string }, ms: number): { text: string; cut?: string } {
  const abs = i18n.number(Math.abs(ms));
  if (ms > 0) return { text: i18n.t('web.audio.offset.late', { ms: abs }) };
  if (ms < 0) return { text: i18n.t('web.audio.offset.early', { ms: abs }), cut: i18n.t('web.audio.offset.cut', { ms: abs }) };
  return { text: i18n.t('web.audio.offset.zero') };
}

export function AudioPanel({ audio, busy, offsetMs, showOffset, onLoad, onRemove, onOffset }: {
  audio: AudioInfo | null; busy: boolean; offsetMs: number; showOffset: boolean;
  onLoad(file: File): void; onRemove(): void; onOffset(ms: number): void;
}) {
  const { i18n } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const pick = (f?: File | null) => { if (f) onLoad(f); if (input.current) input.current.value = ''; };
  const onDrop = (e: DragEvent) => { e.preventDefault(); pick(e.dataTransfer.files[0]); };
  const sum = offsetSummary(i18n, offsetMs);
  const bump = (dir: 1 | -1) => (e: React.MouseEvent) => onOffset(clampOffsetMs(offsetMs + dir * (e.altKey ? 100 : e.shiftKey ? 10 : 1)));
  return (
    <div className="space-y-2" onDragOver={(e) => e.preventDefault()} onDrop={onDrop} data-testid="audio-panel">
      <div className="flex items-center gap-2">
        <button type="button" className="btn-ghost border border-control" disabled={busy} onClick={() => input.current?.click()} data-testid="audio-load">
          {busy ? i18n.t('web.audio.loading') : audio ? i18n.t('web.audio.replace') : i18n.t('web.audio.load')}
        </button>
        {audio && <button type="button" className="btn-ghost" onClick={onRemove} data-testid="audio-remove">{i18n.t('web.audio.remove')}</button>}
        <input ref={input} type="file" accept={AUDIO_ACCEPT} hidden onChange={(e) => pick(e.target.files?.[0])} data-testid="audio-input" />
      </div>
      {/* Ngoại lệ của D-59: dòng giải thích ngắn cạnh Nạp âm thanh giữ lại (chủ dự án, 2026-11-14). */}
      {audio
        ? <p className="truncate text-xs text-fg" title={audio.name}>{audio.name} <span className="tabular-nums text-muted">· {formatClock(audio.durationSec)}</span></p>
        : <p className="text-xs text-muted">{i18n.t('web.audio.hint')}</p>}
      {audio && showOffset && (
        <div className="space-y-1.5" data-testid="audio-offset">
          <div className="flex items-center gap-1.5">
            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted">{i18n.t('web.audio.offsetLabel')}</span>
            <button type="button" className={stepBtn} aria-label={i18n.t('web.audio.offset.minus')} title={i18n.t('web.audio.offset.step')} onClick={bump(-1)}><Minus /></button>
            <span className="w-24 shrink-0">
              <NumberField label={i18n.t('web.audio.offset.field')} value={offsetMs} spec={{ min: -OFFSET_LIMIT_MS, max: OFFSET_LIMIT_MS, step: 1, units: { ms: 1, s: 1000 } }} onChange={(v) => onOffset(clampOffsetMs(v))} />
            </span>
            <button type="button" className={stepBtn} aria-label={i18n.t('web.audio.offset.plus')} title={i18n.t('web.audio.offset.step')} onClick={bump(1)}><Plus /></button>
          </div>
          <p className="text-xs text-fg" role="status" data-testid="audio-offset-text">{sum.text}</p>
          {sum.cut && <p className="text-xs text-muted">{sum.cut}</p>}
        </div>
      )}
    </div>
  );
}
