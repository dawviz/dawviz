// Mục "Ảnh nền" của bảng Thuộc tính khi không chọn widget (T-21): nạp/bỏ ảnh của phiên và cách đặt. Ảnh không nằm trong preset.
import { useRef } from 'react';
import { DEFAULT_BACKGROUND, type BackgroundFit, type BackgroundImageSpec } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { BACKGROUND_ACCEPT } from '../lib/backgroundImage.ts';
import { InspectorSection, ResetButton } from './Inspector.tsx';
import { NumberField } from './NumberField.tsx';
import { StatusIcon } from './StatusIcon.tsx';

const btn = 'flex min-h-[var(--hit)] items-center gap-1.5 rounded border border-control bg-raised px-2.5 text-xs font-medium text-fg transition hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50';
export interface BackgroundState { name: string | null; busy: boolean; /** Mã lỗi gần nhất (ERR_ASSET_*) hoặc null. */ error: string | null }
const FITS: readonly BackgroundFit[] = ['COVER', 'CONTAIN', 'STRETCH'];

export function BackgroundSection({ n, state, spec, onPick, onRemove, onSpec }: { n: number; state: BackgroundState; spec: BackgroundImageSpec | undefined; onPick(f: File): void; onRemove(): void; onSpec(p: Partial<BackgroundImageSpec>): void }) {
  const { i18n } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const s = spec ?? DEFAULT_BACKGROUND;
  const num = (k: 'opacity' | 'dim', label: string) => (
    <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_1.5rem] items-center gap-2 text-xs text-muted">
      <span>{label}</span>
      <NumberField label={label} value={Math.round(s[k] * 100)} spec={{ min: 0, max: 100, step: 1, units: { '%': 1 } }} range={[0, 100]} onChange={(v) => onSpec({ [k]: v / 100 })} />
      <ResetButton label={label} changed={s[k] !== DEFAULT_BACKGROUND[k]} onReset={() => onSpec({ [k]: DEFAULT_BACKGROUND[k] })} />
    </div>
  );
  return (
    <InspectorSection n={n} id="background" title={i18n.t('web.bg.title')}>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} disabled={state.busy} onClick={() => input.current?.click()} data-testid="bg-load">{state.busy ? i18n.t('web.bg.loading') : state.name ? i18n.t('web.bg.replace') : i18n.t('web.bg.load')}</button>
        {state.name && <button type="button" className="btn-ghost" onClick={onRemove} data-testid="bg-remove">{i18n.t('web.bg.remove')}</button>}
        <input ref={input} type="file" accept={BACKGROUND_ACCEPT} hidden data-testid="bg-input" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onPick(f); }} />
      </div>
      {state.name && <p className="truncate text-xs text-fg" title={state.name} data-testid="bg-name">{state.name}</p>}
      {state.error && <p className="flex items-start gap-1.5 text-xs text-fg" role="status" data-testid="bg-error"><StatusIcon kind="warning" className="mt-px h-3.5 w-3.5 shrink-0 text-warning" />{i18n.t(`errors.${state.error}`)}</p>}
      {state.name && (
        <>
          <div className="space-y-1.5" data-testid="bg-fit">
            <div className="flex items-center justify-between gap-2 text-xs text-muted">
              <span>{i18n.t('web.bg.fit')}</span>
              <ResetButton label={i18n.t('web.bg.fit')} changed={s.fit !== DEFAULT_BACKGROUND.fit} onReset={() => onSpec({ fit: DEFAULT_BACKGROUND.fit })} />
            </div>
            <div className="seg w-full" role="radiogroup" aria-label={i18n.t('web.bg.fit')}>
              {FITS.map((f) => <button key={f} type="button" role="radio" aria-checked={s.fit === f} className="seg-btn flex-1" onClick={() => onSpec({ fit: f })} data-testid={`bg-fit-${f}`}>{i18n.t(`web.bg.fit.${f}`)}</button>)}
            </div>
          </div>
          {num('opacity', i18n.t('web.bg.opacity'))}
          {num('dim', i18n.t('web.bg.dim'))}
        </>
      )}
    </InspectorSection>
  );
}
