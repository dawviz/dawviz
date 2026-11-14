// Mục "Chữ" của bảng Thuộc tính (T-72, SRS REQ-GRAPHICS-18, giao diện): sửa kiểu chữ của từng chỗ chữ trong widget.
// Mỗi thuộc tính là một ghi đè trên kiểu dựng sẵn; nút ↺ bỏ ghi đè (về kiểu, hoặc về dòng chứa nó nếu là một đoạn).
// Cơ bản: chỗ chữ, kiểu, phông, cỡ, màu, đậm, nghiêng, căn lề. Nâng cao: mọi thuộc tính còn lại + Lưu thành kiểu mới / Cập nhật kiểu.
import { useEffect, useId, useState, type ReactNode } from 'react';
import { BUNDLED_FONTS, saveAsTextStyle, updateTextStyleFromRef, type TextRef, type TextStyle, type TextStyleSet, type WidgetSpec } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { radioKeys, radioTab } from '../lib/a11y.ts';
import { clearOverride, isOverridden, newStyleId, overrideCount, setOverride, slotStyles, textSlots, valueAt, type TextPath } from '../lib/textRef.ts';
import { NumberField } from './NumberField.tsx';
import { ResetButton } from './Inspector.tsx';
import { Select } from './Select.tsx';

const row = 'grid grid-cols-[minmax(0,1fr)_minmax(0,9.5rem)_1.5rem] items-center gap-2 text-xs text-muted';
const numRow = 'grid grid-cols-[minmax(0,1fr)_4.5rem_1.5rem] items-center gap-2 text-xs text-muted';
const btn = 'btn-ghost border border-line px-2 py-1 text-xs';
const FAMILIES = [...new Set(BUNDLED_FONTS.map((f) => f.family))];

export interface TextPanelProps {
  widget: WidgetSpec; styles: TextStyleSet; advanced: boolean; disabled?: boolean;
  /** Ghi đè mới của một chỗ chữ; `path` là thuộc tính vừa đổi (để gộp bước hoàn tác). */
  onRef(field: string, next: TextRef, path: string): void;
  /** Bộ kiểu mới + ghi đè mới của chỗ chữ (Lưu thành kiểu mới / Cập nhật kiểu). */
  onStyles(styles: TextStyleSet, field: string, ref: TextRef, kind: 'save' | 'update'): void;
  /** Căn lề của widget (thuộc tính `align` hoặc `timeAlign`). */
  onProps(patch: Record<string, unknown>): void;
}

export function TextPanel({ widget, styles, advanced, disabled, onRef, onStyles, onProps }: TextPanelProps) {
  const { i18n } = useI18n();
  const slots = textSlots(widget.type);
  const [pick, setPick] = useState(slots[0]?.field ?? '');
  useEffect(() => { if (!slots.some((s) => s.field === pick)) setPick(slots[0]?.field ?? ''); }, [widget.type]); // eslint-disable-line react-hooks/exhaustive-deps
  const slot = slots.find((s) => s.field === pick) ?? slots[0];
  if (!slot) return null;
  const props = widget.properties as Record<string, unknown>;
  const { base, resolved, ref } = slotStyles(props, slot, styles);
  const set = (path: TextPath, v: unknown) => onRef(slot.field, setOverride(ref, path, v), path);
  const reset = (path: TextPath) => onRef(slot.field, clearOverride(ref, path), path);
  const label = (f: string) => (i18n.has(`web.text.field.${widget.type}.${f}`) ? i18n.t(`web.text.field.${widget.type}.${f}`) : f);
  const styleName = (id: string) => (i18n.has(`web.text.style.${id}`) && styles[id]?.name === defaultName(id) ? i18n.t(`web.text.style.${id}`) : styles[id]?.name ?? id);
  const alignKey = 'align' in props ? 'align' : 'timeAlign' in props ? 'timeAlign' : null;
  const v = (p: TextPath) => valueAt(resolved, p);
  const R = (p: TextPath, name: string) => <ResetButton label={name} changed={isOverridden(ref, p)} disabled={disabled} text={i18n.t('web.text.reset', { name })} onReset={() => reset(p)} />;

  const num = (p: TextPath, name: string, spec: { min: number; max: number; step: number }, range?: [number, number], scale = 1) => (
    <div className={numRow} key={p} data-testid={`text-${p}`}>
      <span className="min-w-0 break-words leading-tight">{name}</span>
      <NumberField label={name} value={Number(v(p)) * scale} spec={{ min: spec.min * scale, max: spec.max * scale, step: spec.step }} range={range} disabled={disabled}
        onChange={(x) => set(p, x / scale)} />
      {R(p, name)}
    </div>
  );
  const color = (p: TextPath, name: string) => (
    <div className={numRow} key={p} data-testid={`text-${p}`}>
      <span className="min-w-0 break-words leading-tight">{name}</span>
      <input type="color" aria-label={name} value={String(v(p))} disabled={disabled} onChange={(e) => set(p, e.target.value.toUpperCase())} className="h-6 w-full" />
      {R(p, name)}
    </div>
  );
  const check = (p: TextPath, name: string, on = Boolean(v(p)), make = (x: boolean): unknown => x) => (
    <div className={numRow} key={p} data-testid={`text-${p}`}>
      <label className="col-span-2 flex items-center gap-2"><input type="checkbox" checked={on} disabled={disabled} onChange={(e) => set(p, make(e.target.checked))} />{name}</label>
      {R(p, name)}
    </div>
  );
  const select = (p: TextPath, name: string, options: readonly string[], prefix: string) => (
    <label className={row} key={p} data-testid={`text-${p}`}>
      <span className="min-w-0 break-words leading-tight">{name}</span>
      <Select value={String(v(p))} disabled={disabled} onChange={(e) => set(p, e.target.value)} className="py-1 pl-2" wrapClassName="min-w-0">
        {options.map((o) => <option key={o} value={o}>{i18n.t(`${prefix}${o}`)}</option>)}
      </Select>
      {R(p, name)}
    </label>
  );
  const group = (title: string, children: ReactNode) => <div className="space-y-2 border-t border-line pt-2.5"><h3 className="text-xs font-medium text-fg">{title}</h3>{children}</div>;
  const g = resolved.gradient;

  return (
    <div className="space-y-2.5" data-testid="text-panel">
      {slots.length > 1 && (
        <label className={row}>
          <span>{i18n.t('web.text.slot')}</span>
          <Select value={slot.field} onChange={(e) => setPick(e.target.value)} className="py-1 pl-2" wrapClassName="min-w-0" data-testid="text-slot">
            {slots.map((s) => <option key={s.field} value={s.field}>{label(s.field)}{overrideCount(props[s.field] as TextRef) ? ' •' : ''}</option>)}
          </Select>
          <span aria-hidden />
        </label>
      )}
      {!slot.parent && (
        <label className={row}>
          <span>{i18n.t('web.text.style')}</span>
          <Select value={ref.styleId && styles[ref.styleId] ? ref.styleId : slot.fallbackId} disabled={disabled} onChange={(e) => onRef(slot.field, { ...ref, styleId: e.target.value }, 'styleId')}
            className="py-1 pl-2" wrapClassName="min-w-0" data-testid="text-styleId">
            {Object.keys(styles).map((id) => <option key={id} value={id}>{styleName(id)}</option>)}
          </Select>
          <ResetButton label={i18n.t('web.text.style')} changed={!!ref.styleId && ref.styleId !== slot.fallbackId} disabled={disabled}
            text={i18n.t('web.text.reset', { name: i18n.t('web.text.style') })} onReset={() => reset('styleId')} />
        </label>
      )}
      <label className={row} data-testid="text-font">
        <span>{i18n.t('web.text.font')}</span>
        <Select value={resolved.font} disabled={disabled} onChange={(e) => set('font', e.target.value)} className="py-1 pl-2" wrapClassName="min-w-0">
          {[...new Set([...FAMILIES, resolved.font])].map((f) => <option key={f} value={f}>{FAMILIES.includes(f) ? f : `${f} (${i18n.t('web.text.fontMissing')})`}</option>)}
        </Select>
        {R('font', i18n.t('web.text.font'))}
      </label>
      {num('size', i18n.t('web.text.size'), { min: 4, max: 400, step: 1 }, [6, 120])}
      {color('color', i18n.t('web.text.color'))}
      {check('weight', i18n.t('web.text.bold'), resolved.weight >= 600, (x) => (x ? 700 : 400))}
      {check('italic', i18n.t('web.text.italic'))}
      {alignKey && (
        <div className="space-y-1.5">
          <span className="block text-xs text-muted">{i18n.t('web.text.align')}</span>
          <div className="seg w-full" role="radiogroup" aria-label={i18n.t('web.text.align')} onKeyDown={radioKeys} data-testid="text-align">
            {(['left', 'center', 'right'] as const).map((a) => (
              <button key={a} type="button" role="radio" aria-checked={props[alignKey] === a} tabIndex={radioTab(props[alignKey] === a)} className="seg-btn flex-1" disabled={disabled}
                onClick={() => onProps({ [alignKey]: a })}>{i18n.t(`web.text.align.${a}`)}</button>
            ))}
          </div>
        </div>
      )}
      {advanced && <>
        {group(i18n.t('web.text.group.shape'), <>
          {select('textCase', i18n.t('web.text.case'), ['none', 'upper', 'lower', 'title', 'smallCaps'], 'web.text.case.')}
          {num('tracking', i18n.t('web.text.tracking'), { min: -500, max: 2000, step: 10 }, [-200, 800])}
          {num('scaleX', i18n.t('web.text.scaleX'), { min: 0.1, max: 10, step: 1 }, [50, 200], 100)}
          {num('scaleY', i18n.t('web.text.scaleY'), { min: 0.1, max: 10, step: 1 }, [50, 200], 100)}
          {num('baselineShift', i18n.t('web.text.baselineShift'), { min: -400, max: 400, step: 1 }, [-40, 40])}
          {select('script', i18n.t('web.text.script'), ['none', 'super', 'sub'], 'web.text.script.')}
          {check('underline', i18n.t('web.text.underline'))}
          {check('strike', i18n.t('web.text.strike'))}
          {(resolved.underline || resolved.strike) && num('decoThickness', i18n.t('web.text.decoThickness'), { min: 0, max: 50, step: 0.5 }, [0, 10])}
          {num('opacity', i18n.t('web.text.opacity'), { min: 0, max: 1, step: 1 }, [0, 100], 100)}
          {check('tabularNums', i18n.t('web.text.tabular'))}
        </>)}
        {group(i18n.t('web.text.group.fill'), <>
          {check('gradient', i18n.t('web.text.gradient'), !!g, (x) => (x ? { kind: 'linear', angle: 0, stops: [{ at: 0, color: resolved.color }, { at: 1, color: '#1D4ED8' }] } : null))}
          {g && <GradientRows g={g} disabled={disabled} onChange={(next) => set('gradient', next)} />}
        </>)}
        {group(i18n.t('web.text.group.stroke'), <>
          {num('stroke.width', i18n.t('web.text.strokeWidth'), { min: 0, max: 50, step: 0.5 }, [0, 10])}
          {resolved.stroke.width > 0 && <>
            {color('stroke.color', i18n.t('web.text.strokeColor'))}
            {select('stroke.position', i18n.t('web.text.strokePosition'), ['center', 'outside'], 'web.text.strokePosition.')}
            {check('stroke.over', i18n.t('web.text.strokeOver'))}
          </>}
        </>)}
        {group(i18n.t('web.text.group.shadow'), <>
          {check('shadow.enabled', i18n.t('web.text.shadow'))}
          {resolved.shadow.enabled && <>
            {color('shadow.color', i18n.t('web.text.shadowColor'))}
            {num('shadow.opacity', i18n.t('web.text.opacity'), { min: 0, max: 1, step: 1 }, [0, 100], 100)}
            {num('shadow.distance', i18n.t('web.text.shadowDistance'), { min: 0, max: 200, step: 1 }, [0, 30])}
            {num('shadow.angle', i18n.t('web.text.shadowAngle'), { min: -360, max: 360, step: 1 }, [-180, 180])}
            {num('shadow.blur', i18n.t('web.text.shadowBlur'), { min: 0, max: 100, step: 1 }, [0, 30])}
          </>}
        </>)}
        {group(i18n.t('web.text.group.background'), <>
          {check('background.enabled', i18n.t('web.text.background'))}
          {resolved.background.enabled && <>
            {color('background.color', i18n.t('web.text.backgroundColor'))}
            {num('background.opacity', i18n.t('web.text.opacity'), { min: 0, max: 1, step: 1 }, [0, 100], 100)}
            {num('background.padX', i18n.t('web.text.padX'), { min: 0, max: 200, step: 1 }, [0, 40])}
            {num('background.padY', i18n.t('web.text.padY'), { min: 0, max: 200, step: 1 }, [0, 40])}
            {num('background.radius', i18n.t('web.text.radius'), { min: 0, max: 200, step: 1 }, [0, 30])}
          </>}
        </>)}
        {group(i18n.t('web.text.group.fit'), <>
          {select('overflow', i18n.t('web.text.overflow'), ['ellipsis', 'shrink', 'visible'], 'web.text.overflow.')}
          {resolved.overflow === 'shrink' && num('minSize', i18n.t('web.text.minSize'), { min: 4, max: 400, step: 1 }, [4, 60])}
          {check('wrap', i18n.t('web.text.wrap'))}
          {resolved.wrap && <>
            {num('maxLines', i18n.t('web.text.maxLines'), { min: 1, max: 20, step: 1 }, [1, 6])}
            {num('leading', i18n.t('web.text.leading'), { min: 0.5, max: 5, step: 0.05 }, [0.8, 2])}
          </>}
        </>)}
        {!slot.parent && <StyleActions slotId={slot.fallbackId} styleRef={ref} styles={styles} disabled={disabled} base={base}
          onSave={(name) => { const id = newStyleId(styles, name); const r = saveAsTextStyle(styles, ref, slot.fallbackId, id, name); onStyles(r.set, slot.field, r.ref, 'save'); }}
          onUpdate={() => { const r = updateTextStyleFromRef(styles, ref, slot.fallbackId); onStyles(r.set, slot.field, r.ref, 'update'); }}
          onClear={() => onRef(slot.field, ref.styleId ? { styleId: ref.styleId } : {}, 'all')} />}
        {slot.parent && overrideCount(ref) > 0 && (
          <button type="button" className={btn} disabled={disabled} onClick={() => onRef(slot.field, {}, 'all')}>{i18n.t('web.text.clearSpan')}</button>
        )}
      </>}
    </div>
  );
}

function GradientRows({ g, disabled, onChange }: { g: NonNullable<TextStyle['gradient']>; disabled?: boolean; onChange(next: NonNullable<TextStyle['gradient']>): void }) {
  const { i18n } = useI18n();
  const first = g.stops[0], last = g.stops[g.stops.length - 1];
  const stop = (i: 0 | 1, color: string) => onChange({ ...g, stops: g.stops.map((s, k) => ((i === 0 ? k === 0 : k === g.stops.length - 1) ? { ...s, color } : s)) });
  return <>
    <label className={row}>
      <span>{i18n.t('web.text.gradientKind')}</span>
      <Select value={g.kind} disabled={disabled} onChange={(e) => onChange({ ...g, kind: e.target.value as 'linear' | 'radial' })} className="py-1 pl-2" wrapClassName="min-w-0">
        {(['linear', 'radial'] as const).map((k) => <option key={k} value={k}>{i18n.t(`web.text.gradientKind.${k}`)}</option>)}
      </Select>
      <span aria-hidden />
    </label>
    {g.kind === 'linear' && (
      <div className={numRow}>
        <span>{i18n.t('web.text.gradientAngle')}</span>
        <NumberField label={i18n.t('web.text.gradientAngle')} value={g.angle} spec={{ min: -360, max: 360, step: 1 }} range={[-180, 180]} disabled={disabled} onChange={(a) => onChange({ ...g, angle: a })} />
        <span aria-hidden />
      </div>
    )}
    <div className={numRow}>
      <span>{i18n.t('web.text.gradientStops')}</span>
      <span className="flex gap-1">
        <input type="color" aria-label={i18n.t('web.text.gradientFrom')} value={first.color} disabled={disabled} onChange={(e) => stop(0, e.target.value.toUpperCase())} className="h-6 w-1/2" />
        <input type="color" aria-label={i18n.t('web.text.gradientTo')} value={last.color} disabled={disabled} onChange={(e) => stop(1, e.target.value.toUpperCase())} className="h-6 w-1/2" />
      </span>
      <span aria-hidden />
    </div>
  </>;
}

function StyleActions({ styleRef, styles, disabled, onSave, onUpdate, onClear }: { slotId: string; styleRef: TextRef; styles: TextStyleSet; base: TextStyle; disabled?: boolean; onSave(name: string): void; onUpdate(): void; onClear(): void }) {
  const { i18n } = useI18n();
  const [naming, setNaming] = useState(false), [name, setName] = useState('');
  const inputId = useId();
  const n = overrideCount(styleRef);
  const done = () => { const t = name.trim().slice(0, 60); if (t) onSave(t); setNaming(false); setName(''); };
  return (
    <div className="space-y-2 border-t border-line pt-2.5" data-testid="text-style-actions">
      <h3 className="text-xs font-medium text-fg">{i18n.t('web.text.group.styles')}</h3>
      {naming ? (
        <div className="flex items-center gap-1.5">
          <label htmlFor={inputId} className="sr-only">{i18n.t('web.text.newName')}</label>
          <input id={inputId} autoFocus className="min-w-0 flex-1 border border-line bg-surface px-2 py-1 text-xs text-fg" value={name} maxLength={60} placeholder={i18n.t('web.text.newName')}
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') done(); else if (e.key === 'Escape') { e.stopPropagation(); setNaming(false); } }} data-testid="text-new-name" />
          <button type="button" className={btn} disabled={!name.trim()} onClick={done}>{i18n.t('web.text.saveOk')}</button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={btn} disabled={disabled || Object.keys(styles).length >= 64} onClick={() => setNaming(true)} data-testid="text-save-style">{i18n.t('web.text.saveStyle')}</button>
          <button type="button" className={btn} disabled={disabled || !n} onClick={onUpdate} data-testid="text-update-style">{i18n.t('web.text.updateStyle')}</button>
          <button type="button" className={btn} disabled={disabled || !n} onClick={onClear} data-testid="text-clear">{i18n.t('web.text.clearAll')}</button>
        </div>
      )}
    </div>
  );
}

const DEFAULT_NAMES: Record<string, string> = { title: 'Title', subtitle: 'Subtitle', heading: 'Heading', body: 'Body', caption: 'Caption', label: 'Small label', counter: 'Counter', clock: 'Clock', tiny: 'Tiny' };
/** Tên gốc của kiểu dựng sẵn (chưa đổi tên thì hiện theo ngôn ngữ giao diện). */
const defaultName = (id: string) => DEFAULT_NAMES[id];
