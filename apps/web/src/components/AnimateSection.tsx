// Mục "Hoạt hình" của widget đang chọn (T-22): mỗi thuộc tính số/màu (kể cả vị trí, cỡ, góc, độ đục) có thể chạy theo keyframe hoặc theo dữ liệu nhạc.
import { useState } from 'react';
import { EASING_NAMES, type Animation, type Binding, type BindSource, type Key, type KeyAnimation, type LoopMode, type WidgetSpec } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { InspectorSection, ResetButton } from './Inspector.tsx';
import { NumberField } from './NumberField.tsx';
import { TimeField } from './TimeField.tsx';
import { Select } from './Select.tsx';
import { Plus, Close } from './Icons.tsx';
import { addKey, animFields, isKeyAnimation, keyTimeText, newBinding, newKeyAnimation, removeKey, setKey, SOURCES, staticValue, withSource, type AnimField } from '../lib/animateFields.ts';

const btn = 'flex min-h-[var(--hit)] items-center gap-1.5 rounded border border-control bg-raised px-2.5 text-xs font-medium text-fg transition hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50';
const iconBtn = 'tog shrink-0';
const EASES = [...EASING_NAMES, 'hold'];
const LOOPS: LoopMode[] = ['NONE', 'CYCLE', 'PINGPONG', 'OFFSET'];

export function AnimateSection({ n, widget, getTime, disabled, onChange }: { n: number; widget: WidgetSpec; getTime(): number; disabled?: boolean; onChange(path: string, v: Animation | null, key?: string): void }) {
  const { i18n } = useI18n();
  const fields = animFields(widget.type), byPath = new Map(fields.map((f) => [f.path, f]));
  const used = Object.keys(widget.animate ?? {}).filter((p) => byPath.has(p));
  const free = fields.filter((f) => !used.includes(f.path));
  const [pick, setPick] = useState('');
  const label = (f: AnimField) => (f.labelKey ? i18n.t(f.labelKey) : f.path);
  const chosen = byPath.get(pick && free.some((f) => f.path === pick) ? pick : free[0]?.path ?? '');

  const valueField = (f: AnimField, v: number | string, set: (v: number | string) => void, name: string, key?: string) => f.kind === 'color'
    ? <input type="color" aria-label={name} value={String(v)} disabled={disabled} onChange={(e) => set(e.target.value)} className="h-6 w-full" />
    : <NumberField label={name} value={Number(v)} spec={{ min: f.min, max: f.max, step: f.step }} range={f.range} disabled={disabled} onChange={(x) => set(x)} />;

  const keysEditor = (f: AnimField, a: KeyAnimation) => (
    <div className="space-y-1.5">
      <ul className="space-y-1.5" data-testid={`anim-keys-${f.path}`}>
        {a.keys.map((k: Key, i) => {
          const name = `${label(f)} #${i + 1}`, sec = 'sec' in k.at ? k.at.sec : null;
          return (
            <li key={i} className="grid grid-cols-[4.5rem_minmax(0,1fr)_1.5rem] items-center gap-1.5 text-xs text-muted">
              {sec !== null ? <TimeField id={`anim-${f.path}-t-${i}`} label={`${name}: ${i18n.t('web.anim.at')}`} value={sec} onChange={(v) => onChange(f.path, setKey(a, i, { at: { sec: v ?? 0 } }), `t${i}`)} />
                : <span className="text-right tabular-nums" title={i18n.t('web.anim.atMusic')}>{keyTimeText(k.at)}</span>}
              {valueField(f, k.value, (v) => onChange(f.path, setKey(a, i, { value: v }), `v${i}`), `${name}: ${i18n.t('web.anim.value')}`)}
              <button type="button" className={iconBtn} aria-label={i18n.t('web.anim.removeKey')} title={i18n.t('web.anim.removeKey')} disabled={disabled} onClick={() => onChange(f.path, removeKey(a, i))} data-testid={`anim-key-remove-${f.path}-${i}`}><Close className="h-3.5 w-3.5" /></button>
              <label className="col-span-3 flex items-center gap-2">
                <span className="shrink-0">{i18n.t('web.anim.ease')}</span>
                <Select wrapClassName="min-w-0 flex-1" value={typeof k.ease === 'string' ? k.ease : k.ease === undefined ? 'linear' : '__custom'} disabled={disabled || (k.ease !== undefined && typeof k.ease !== 'string')} onChange={(e) => onChange(f.path, setKey(a, i, { ease: e.target.value }))}>
                  {k.ease !== undefined && typeof k.ease !== 'string' && <option value="__custom">{i18n.t('web.anim.easeCustom')}</option>}
                  {EASES.map((e) => <option key={e} value={e}>{e}</option>)}
                </Select>
                <Select wrapClassName="w-28" aria-label={i18n.t('web.anim.interp')} value={k.interp ?? 'linear'} disabled={disabled} onChange={(e) => onChange(f.path, setKey(a, i, { interp: e.target.value as Key['interp'] }))}>
                  {(['linear', 'hold', 'smooth'] as const).map((m) => <option key={m} value={m}>{i18n.t(`web.anim.interp.${m}`)}</option>)}
                </Select>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={btn} disabled={disabled || a.keys.length >= 256} onClick={() => { const t = getTime(); onChange(f.path, addKey(a, t, a.keys[a.keys.length - 1]?.value ?? staticValue(widget, f.path))); }} data-testid={`anim-key-add-${f.path}`}><Plus className="h-3.5 w-3.5" />{i18n.t('web.anim.addKey')}</button>
        <label className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted">
          <span className="shrink-0">{i18n.t('web.anim.loop')}</span>
          <Select wrapClassName="min-w-0 flex-1" value={a.loop ?? 'NONE'} disabled={disabled} onChange={(e) => onChange(f.path, { ...a, loop: e.target.value === 'NONE' ? undefined : (e.target.value as LoopMode) })}>
            {LOOPS.map((l) => <option key={l} value={l}>{i18n.t(`web.anim.loop.${l}`)}</option>)}
          </Select>
        </label>
      </div>
    </div>
  );

  const bindEditor = (f: AnimField, b: Binding) => {
    const setTo = (i: 0 | 1, v: number | string) => onChange(f.path, { ...b, to: (i === 0 ? [v, b.to[1]] : [b.to[0], v]) as Binding['to'] }, `to${i}`);
    return (
      <div className="space-y-1.5" data-testid={`anim-bind-${f.path}`}>
        <label className="flex items-center gap-2 text-xs text-muted">
          <span className="shrink-0">{i18n.t('web.anim.source')}</span>
          <Select wrapClassName="min-w-0 flex-1" value={b.bind} disabled={disabled} data-testid={`anim-source-${f.path}`} onChange={(e) => onChange(f.path, withSource(b, e.target.value as BindSource))}>
            {SOURCES.map((s) => <option key={s} value={s}>{i18n.t(`web.anim.src.${s}`)}</option>)}
          </Select>
        </label>
        <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-center gap-2 text-xs text-muted">
          <span>{i18n.t('web.anim.from')}</span>
          <NumberField label={`${label(f)}: ${i18n.t('web.anim.from')} (1)`} value={b.from[0]} spec={{ min: -1e6, max: 1e6, step: 0.1 }} disabled={disabled} onChange={(v) => onChange(f.path, { ...b, from: [v, b.from[1] === v ? v + 1 : b.from[1]] }, 'from0')} />
          <NumberField label={`${label(f)}: ${i18n.t('web.anim.from')} (2)`} value={b.from[1]} spec={{ min: -1e6, max: 1e6, step: 0.1 }} disabled={disabled} onChange={(v) => onChange(f.path, { ...b, from: [b.from[0], v === b.from[0] ? v + 1 : v] }, 'from1')} />
          <span>{i18n.t('web.anim.to')}</span>
          <div>{valueField(f, b.to[0], (v) => setTo(0, v), `${label(f)}: ${i18n.t('web.anim.to')} (1)`)}</div>
          <div>{valueField(f, b.to[1], (v) => setTo(1, v), `${label(f)}: ${i18n.t('web.anim.to')} (2)`)}</div>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted">
          <span className="shrink-0">{i18n.t('web.anim.ease')}</span>
          <Select wrapClassName="min-w-0 flex-1" value={typeof b.ease === 'string' ? b.ease : b.ease === undefined ? 'linear' : '__custom'} disabled={disabled || (b.ease !== undefined && typeof b.ease !== 'string')} onChange={(e) => onChange(f.path, { ...b, ease: e.target.value })}>
            {b.ease !== undefined && typeof b.ease !== 'string' && <option value="__custom">{i18n.t('web.anim.easeCustom')}</option>}
            {EASES.map((e) => <option key={e} value={e}>{e}</option>)}
          </Select>
        </label>
      </div>
    );
  };

  return (
    <InspectorSection n={n} id="animate" title={i18n.t('web.anim.title')}>
      {used.length === 0 && <p className="text-xs leading-snug text-muted" data-testid="anim-none">{i18n.t('web.anim.none')}</p>}
      <ul className="space-y-3">
        {used.map((path) => {
          const f = byPath.get(path)!, a = widget.animate![path], isKeys = isKeyAnimation(a);
          return (
            <li key={path} className="space-y-1.5 rounded border border-line p-2" data-testid={`anim-item-${path}`}>
              <div className="flex items-center gap-2 text-xs">
                <strong className="min-w-0 flex-1 truncate font-medium text-fg">{label(f)}</strong>
                <Select wrapClassName="w-32" aria-label={`${label(f)}: ${i18n.t('web.anim.mode')}`} value={isKeys ? 'keys' : 'bind'} disabled={disabled} data-testid={`anim-mode-${path}`}
                  onChange={(e) => onChange(path, e.target.value === 'keys' ? newKeyAnimation(widget, path, getTime()) : newBinding(widget, f))}>
                  <option value="keys">{i18n.t('web.anim.mode.keys')}</option>
                  <option value="bind">{i18n.t('web.anim.mode.bind')}</option>
                </Select>
                <button type="button" className={iconBtn} aria-label={`${i18n.t('web.anim.remove')}: ${label(f)}`} title={i18n.t('web.anim.remove')} disabled={disabled} onClick={() => onChange(path, null)} data-testid={`anim-remove-${path}`}><Close className="h-3.5 w-3.5" /></button>
              </div>
              {isKeys ? keysEditor(f, a as KeyAnimation) : bindEditor(f, a as Binding)}
            </li>
          );
        })}
      </ul>
      {free.length > 0 && (
        <div className="flex items-center gap-2">
          <Select wrapClassName="min-w-0 flex-1" aria-label={i18n.t('web.anim.property')} value={chosen?.path ?? ''} disabled={disabled} data-testid="anim-property" onChange={(e) => setPick(e.target.value)}>
            {free.map((f) => <option key={f.path} value={f.path}>{label(f)}</option>)}
          </Select>
          <button type="button" className={btn} disabled={disabled || !chosen || used.length >= 24} onClick={() => chosen && onChange(chosen.path, newKeyAnimation(widget, chosen.path, getTime()))} data-testid="anim-add"><Plus className="h-3.5 w-3.5" />{i18n.t('web.anim.add')}</button>
        </div>
      )}
      <ResetButton label={i18n.t('web.anim.removeAll')} changed={used.length > 0} disabled={disabled} onReset={() => used.forEach((p) => onChange(p, null))} />
    </InspectorSection>
  );
}
