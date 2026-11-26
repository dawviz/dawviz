// Mục "Chữ" của bảng Thuộc tính (T-72, SRS REQ-GRAPHICS-18, giao diện): sửa kiểu chữ của từng chỗ chữ trong widget.
// Mỗi thuộc tính là một ghi đè trên kiểu dựng sẵn; nút ↺ bỏ ghi đè (về kiểu, hoặc về dòng chứa nó nếu là một đoạn).
// Cơ bản: chỗ chữ, thanh Kiểu, phông, cỡ, màu, đậm, nghiêng, căn lề. Nâng cao: mọi thuộc tính còn lại.
// Thanh Kiểu (T-126, D-73): ô chọn kiểu (kiểu của dự án + Thư viện của tôi), chấm • khi chỗ chữ có ghi đè, menu ⋯ (lưu, cập nhật, bỏ thay đổi,
// đổi tên, xoá, lưu vào / xoá khỏi thư viện).
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ColorField } from './ColorField.tsx';
import { BUNDLED_FONTS, saveAsTextStyle, updateTextStyleFromRef, type SceneDocument, type TextRef, type TextStyle, type TextStyleSet, type WidgetSpec } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { radioKeys, radioTab } from '../lib/a11y.ts';
import { clearOverride, isOverridden, newStyleId, overrideCount, setOverride, slotStyles, textSlots, valueAt, type TextPath } from '../lib/textRef.ts';
import { NumberField } from './NumberField.tsx';
import { ResetButton } from './Inspector.tsx';
import { Select } from './Select.tsx';
import { useAssets } from '../lib/assetsRuntime.ts';
import { FONT_ACCEPT } from '../lib/sessionAssets.ts';
import { MAX_LIBRARY, MAX_TEXT_STYLES, addToLibrary, copyFromLibrary, isBuiltinStyle, loadLibrary, removeFromLibrary, saveLibrary, styleUseCounts, type LibraryStyle } from '../lib/textStyles.ts';
import type { TextStylesKind } from '../lib/commands.ts';
import { useMenuPlacement } from '../lib/useMenuPlacement.ts';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { More } from './Icons.tsx';
/** Độ đậm chọn được ở mục Chữ: đúng các mặt phông đóng gói (Mảnh, Thường, Đậm). */
const TEXT_WEIGHTS = [300, 400, 700] as const;

const row = 'grid grid-cols-[minmax(0,1fr)_minmax(0,9.5rem)_1.5rem] items-center gap-2 text-xs text-muted';
const numRow = 'grid grid-cols-[minmax(0,1fr)_4.5rem_1.5rem] items-center gap-2 text-xs text-muted';
const btn = 'btn-ghost border border-line px-2 py-1 text-xs';
const FAMILIES = [...new Set(BUNDLED_FONTS.map((f) => f.family))];
const LOAD_FONT = '\u0000load-font';
/** Tiền tố giá trị của kiểu trong Thư viện của tôi trong ô chọn kiểu (id thư viện có thể trùng id kiểu của dự án). */
const LIB = '\u0000lib:';

export interface TextPanelProps {
  widget: WidgetSpec; styles: TextStyleSet; advanced: boolean; disabled?: boolean;
  /** Ghi đè mới của một chỗ chữ; `path` là thuộc tính vừa đổi (để gộp bước hoàn tác). */
  onRef(field: string, next: TextRef, path: string): void;
  /** Bộ kiểu mới + ghi đè mới của chỗ chữ (Lưu thành kiểu mới / Cập nhật kiểu / chọn kiểu từ Thư viện của tôi). */
  onStyles(styles: TextStyleSet, field: string, ref: TextRef, kind: TextStylesKind): void;
  /** Số chỗ chữ dùng mỗi kiểu trong cả dự án (gốc và mọi precomp); vắng = chỉ đếm trong widget này. */
  uses?: Readonly<Record<string, number>>;
  /** Đổi tên kiểu (của cả dự án). */
  onRenameStyle?(id: string, name: string): void;
  /** Xoá kiểu người dùng tạo; chỗ đang dùng về kiểu gốc của chỗ đó. */
  onDeleteStyle?(id: string): void;
  /** Căn lề của widget (thuộc tính `align` hoặc `timeAlign`). */
  onProps(patch: Record<string, unknown>): void;
  /** Thuộc tính của widget trong bộ dựng sẵn áp gần nhất: đích của ↺ ở Căn lề. */
  reference?: Record<string, unknown>;
}

export function TextPanel({ widget, styles, advanced, disabled, onRef, onStyles, onProps, reference, uses, onRenameStyle, onDeleteStyle }: TextPanelProps) {
  const { i18n } = useI18n();
  // Phông người dùng nạp (T-21) đứng sau phông đóng gói; lựa chọn cuối mở hộp chọn tệp phông.
  const assets = useAssets(), fontInput = useRef<HTMLInputElement>(null), [fontErr, setFontErr] = useState<string | null>(null);
  const families = [...FAMILIES, ...assets.list.filter((a) => a.family).map((a) => a.family!)];
  const slots = textSlots(widget.type);
  const [pick, setPick] = useState(slots[0]?.field ?? '');
  useEffect(() => { if (!slots.some((s) => s.field === pick)) setPick(slots[0]?.field ?? ''); }, [widget.type]); // eslint-disable-line react-hooks/exhaustive-deps
  const slot = slots.find((s) => s.field === pick) ?? slots[0];
  if (!slot) return null;
  const props = widget.properties as Record<string, unknown>;
  const { resolved, ref } = slotStyles(props, slot, styles);
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
      <ColorField label={name} value={String(v(p))} disabled={disabled} onChange={(c) => set(p, c)} />
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
        <StyleBar styles={styles} styleRef={ref} fallbackId={slot.fallbackId} disabled={disabled} styleName={styleName} resolved={resolved}
          uses={uses ?? styleUseCounts({ widgets: [widget], textStyles: styles } as unknown as SceneDocument)}
          onPick={(id) => onRef(slot.field, { ...ref, styleId: id }, 'styleId')}
          onPickLibrary={(item) => { const r = copyFromLibrary(styles, item); if (r) onStyles(r.set, slot.field, { ...ref, styleId: r.id }, 'library'); return !!r; }}
          onSave={(name) => { const id = newStyleId(styles, name); const r = saveAsTextStyle(styles, ref, slot.fallbackId, id, name); onStyles(r.set, slot.field, r.ref, 'save'); }}
          onUpdate={() => { const r = updateTextStyleFromRef(styles, ref, slot.fallbackId); onStyles(r.set, slot.field, r.ref, 'update'); }}
          onClear={() => onRef(slot.field, ref.styleId ? { styleId: ref.styleId } : {}, 'all')}
          onRename={onRenameStyle} onDelete={onDeleteStyle} />
      )}
      <label className={row} data-testid="text-font">
        <span>{i18n.t('web.text.font')}</span>
        <Select value={resolved.font} disabled={disabled} className="py-1 pl-2" wrapClassName="min-w-0"
          onChange={(e) => { if (e.target.value === LOAD_FONT) fontInput.current?.click(); else set('font', e.target.value); }}>
          {[...new Set([...families, resolved.font])].map((f) => <option key={f} value={f}>{families.includes(f) ? f : `${f} (${i18n.t('web.text.fontMissing')})`}</option>)}
          <option value={LOAD_FONT}>{i18n.t('web.asset.pickFont')}</option>
        </Select>
        {R('font', i18n.t('web.text.font'))}
      </label>
      <input ref={fontInput} type="file" accept={FONT_ACCEPT} disabled={disabled} className="sr-only" tabIndex={-1} aria-label={i18n.t('web.asset.pickFont')} data-testid="text-font-file"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; setFontErr(null); assets.add(f).then((m) => { if (m.family) set('font', m.family); else setFontErr('ERR_ASSET_UNSUPPORTED'); }, (err) => setFontErr((err as { code?: string }).code ?? 'ERR_ASSET_DECODE')); }} />
      {fontErr && <p role="alert" className="text-xs leading-snug text-danger" data-testid="text-font-error">{i18n.t(`errors.${fontErr}`)}</p>}
      {num('size', i18n.t('web.text.size'), { min: 4, max: 400, step: 1 }, [6, 120])}
      {color('color', i18n.t('web.text.color'))}
      <label className={row} key="weight" data-testid="text-weight">
        <span className="min-w-0 break-words leading-tight">{i18n.t('web.text.weight')}</span>
        {/* Ba độ đậm có phông đóng gói (Space Grotesk 300/400/700); giá trị khác trong preset hiện theo mức gần nhất. */}
        <Select value={String(TEXT_WEIGHTS.reduce((b, w) => (Math.abs(w - resolved.weight) < Math.abs(b - resolved.weight) ? w : b), 400))} disabled={disabled}
          onChange={(e) => set('weight', Number(e.target.value))} className="py-1 pl-2" wrapClassName="min-w-0">
          {TEXT_WEIGHTS.map((w) => <option key={w} value={w}>{i18n.t(`web.text.weight.${w}`)}</option>)}
        </Select>
        {R('weight', i18n.t('web.text.weight'))}
      </label>
      {check('italic', i18n.t('web.text.italic'))}
      {alignKey && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs text-muted">
            <span>{i18n.t('web.text.align')}</span>
            <ResetButton label={i18n.t('web.text.align')} changed={!disabled && reference?.[alignKey] !== undefined && reference[alignKey] !== props[alignKey]} disabled={disabled}
              onReset={() => onProps({ [alignKey]: reference![alignKey] })} />
          </div>
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
          {g && <GradientRows g={g} disabled={disabled} color={resolved.color} onChange={(next) => set('gradient', next)} />}
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
        {slot.parent && overrideCount(ref) > 0 && (
          <button type="button" className={btn} disabled={disabled} onClick={() => onRef(slot.field, {}, 'all')}>{i18n.t('web.text.clearSpan')}</button>
        )}
      </>}
    </div>
  );
}

/** Chuyển màu: ↺ của từng dòng đưa về giá trị lúc mới bật (kiểu thẳng, 0°, từ màu chữ sang xanh), vì "không có chuyển màu" đã có ↺ ở ô tick. */
function GradientRows({ g, disabled, color, onChange }: { g: NonNullable<TextStyle['gradient']>; disabled?: boolean; color: string; onChange(next: NonNullable<TextStyle['gradient']>): void }) {
  const { i18n } = useI18n();
  const first = g.stops[0], last = g.stops[g.stops.length - 1];
  const D = { kind: 'linear' as const, angle: 0, from: color, to: '#1D4ED8' };
  const stop = (i: 0 | 1, color: string) => onChange({ ...g, stops: g.stops.map((s, k) => ((i === 0 ? k === 0 : k === g.stops.length - 1) ? { ...s, color } : s)) });
  return <>
    <label className={row}>
      <span>{i18n.t('web.text.gradientKind')}</span>
      <Select value={g.kind} disabled={disabled} onChange={(e) => onChange({ ...g, kind: e.target.value as 'linear' | 'radial' })} className="py-1 pl-2" wrapClassName="min-w-0">
        {(['linear', 'radial'] as const).map((k) => <option key={k} value={k}>{i18n.t(`web.text.gradientKind.${k}`)}</option>)}
      </Select>
      <ResetButton label={i18n.t('web.text.gradientKind')} changed={g.kind !== D.kind} disabled={disabled} onReset={() => onChange({ ...g, kind: D.kind })} />
    </label>
    {g.kind === 'linear' && (
      <div className={numRow}>
        <span>{i18n.t('web.text.gradientAngle')}</span>
        <NumberField label={i18n.t('web.text.gradientAngle')} value={g.angle} spec={{ min: -360, max: 360, step: 1 }} range={[-180, 180]} disabled={disabled} onChange={(a) => onChange({ ...g, angle: a })} />
        <ResetButton label={i18n.t('web.text.gradientAngle')} changed={g.angle !== D.angle} disabled={disabled} onReset={() => onChange({ ...g, angle: D.angle })} />
      </div>
    )}
    <div className={numRow}>
      <span>{i18n.t('web.text.gradientStops')}</span>
      <span className="flex gap-1">
        <ColorField label={i18n.t('web.text.gradientFrom')} value={first.color} disabled={disabled} onChange={(c) => stop(0, c)} className="!w-1/2" />
        <ColorField label={i18n.t('web.text.gradientTo')} value={last.color} disabled={disabled} onChange={(c) => stop(1, c)} className="!w-1/2" />
      </span>
      <ResetButton label={i18n.t('web.text.gradientStops')} changed={first.color.toUpperCase() !== D.from.toUpperCase() || last.color.toUpperCase() !== D.to.toUpperCase()} disabled={disabled}
        onReset={() => onChange({ ...g, stops: g.stops.map((s, k) => (k === 0 ? { ...s, color: D.from } : k === g.stops.length - 1 ? { ...s, color: D.to } : s)) })} />
    </div>
  </>;
}

/** Thư viện của tôi (localStorage, giữa các dự án): mọi thanh Kiểu đang mở cùng thấy thay đổi. */
const libSubs = new Set<(lib: LibraryStyle[]) => void>();
function useLibrary(): [LibraryStyle[], (next: LibraryStyle[]) => void] {
  const [lib, setLib] = useState(loadLibrary);
  useEffect(() => { libSubs.add(setLib); return () => { libSubs.delete(setLib); }; }, []);
  return [lib, (next) => { saveLibrary(next); libSubs.forEach((f) => f(next)); }];
}

interface StyleBarProps {
  styles: TextStyleSet; styleRef: TextRef; fallbackId: string; disabled?: boolean;
  /** Kiểu thật đang vẽ (kiểu + ghi đè): thứ được lưu vào Thư viện của tôi. */
  resolved: TextStyle;
  styleName(id: string): string;
  uses: Readonly<Record<string, number>>;
  onPick(id: string): void;
  /** Chép kiểu từ thư viện vào dự án rồi áp; false = dự án đã đủ kiểu. */
  onPickLibrary(item: LibraryStyle): boolean;
  onSave(name: string): void; onUpdate(): void; onClear(): void;
  onRename?(id: string, name: string): void; onDelete?(id: string): void;
}

/** Thanh Kiểu ở đầu mục Chữ (T-126): [ô chọn kiểu] [•] [⋯]. Menu ⋯ là menu tự dựng (portal + useMenuPlacement, T-114). */
function StyleBar(p: StyleBarProps) {
  const { i18n } = useI18n();
  const [lib, setLib] = useLibrary();
  const [open, setOpen] = useState(false), [view, setView] = useState<'main' | 'lib'>('main');
  const [naming, setNaming] = useState<null | 'save' | 'rename'>(null), [name, setName] = useState('');
  const [confirm, setConfirm] = useState<null | { kind: 'delete' } | { kind: 'lib'; item: LibraryStyle }>(null);
  const [note, setNote] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), menu = useRef<HTMLDivElement>(null);
  const place = useMenuPlacement(open, menu, { anchor: box, fixed: true });
  const selId = useId(), inputId = useId(), menuId = useId();
  const id = p.styleRef.styleId && p.styles[p.styleRef.styleId] ? p.styleRef.styleId : p.fallbackId;
  const n = overrideCount(p.styleRef), count = p.uses[id] ?? 0, label = p.styleName(id);
  const stylesFull = Object.keys(p.styles).length >= MAX_TEXT_STYLES;
  const libFull = lib.length >= MAX_LIBRARY && !lib.some((x) => x.name === label);
  const modified = i18n.t('web.text.modified', { n });

  const items = () => [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
  const close = (refocus = true) => { setOpen(false); setView('main'); if (refocus) trigger.current?.focus(); };
  useEffect(() => { if (open) items()[0]?.focus(); }, [open, view]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { // bấm ra ngoài (ngoài thanh và ngoài menu) thì đóng
    if (!open) return;
    const down = (e: PointerEvent) => { const t = e.target as Node; if (!box.current?.contains(t) && !menu.current?.contains(t)) { setOpen(false); setView('main'); } };
    document.addEventListener('pointerdown', down);
    return () => document.removeEventListener('pointerdown', down);
  }, [open]);
  const onMenuKey = (e: React.KeyboardEvent) => {
    const els = items(), i = els.indexOf(document.activeElement as HTMLElement);
    const go = (k: number) => { e.preventDefault(); els[(k + els.length) % els.length]?.focus(); };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(els.length - 1);
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === 'Tab') close(false);
  };
  /** Mục menu; mục không dùng được vẫn nhận tiêu điểm và có chú thích vì sao (aria-disabled thay vì disabled). */
  const item = (testId: string, text: string, run: () => void, off = false, why?: string) => (
    <button key={testId} type="button" role="menuitem" tabIndex={-1} aria-disabled={off || undefined} title={off ? why : undefined} data-testid={testId}
      className={`block w-full px-3 py-1.5 text-left text-xs focus:bg-raised focus:outline-none ${off ? 'cursor-not-allowed text-faint' : 'text-fg hover:bg-raised'}`}
      onClick={() => { if (!off) run(); }}>{text}</button>
  );
  const startNaming = (kind: 'save' | 'rename') => { close(false); setNote(null); setNaming(kind); setName(kind === 'rename' ? label : ''); };
  const done = () => {
    const v = name.trim().slice(0, 60);
    if (v) { if (naming === 'save') p.onSave(v); else if (v !== label) p.onRename?.(id, v); }
    setNaming(null); setName('');
  };
  const pick = (v: string) => {
    setNote(null);
    if (!v.startsWith(LIB)) { p.onPick(v); return; }
    const it = lib.find((x) => LIB + x.id === v);
    if (it && !p.onPickLibrary(it)) setNote(i18n.t('web.text.stylesFull'));
  };

  return (
    <div ref={box} className="space-y-1.5" data-testid="text-style-bar">
      <div className={row}>
        <label htmlFor={selId} className="min-w-0 break-words leading-tight">{i18n.t('web.text.style')}</label>
        <span className="flex min-w-0 items-center gap-1">
          <Select id={selId} value={id} disabled={p.disabled} onChange={(e) => pick(e.target.value)} className="py-1 pl-2" wrapClassName="min-w-0 flex-1" data-testid="text-styleId">
            <optgroup label={i18n.t('web.text.projectStyles')}>
              {Object.keys(p.styles).map((k) => <option key={k} value={k}>{p.styleName(k)}</option>)}
            </optgroup>
            {lib.length > 0 && (
              <optgroup label={i18n.t('web.text.library')} data-testid="text-library-group">
                {lib.map((x) => <option key={x.id} value={LIB + x.id}>{x.name}</option>)}
              </optgroup>
            )}
          </Select>
          {n > 0 && <span role="img" aria-label={modified} title={modified} className="shrink-0 text-sm leading-none text-fg" data-testid="text-style-modified">•</span>}
        </span>
        <button ref={trigger} type="button" className="tog" disabled={p.disabled} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined}
          aria-label={i18n.t('web.text.styleMenu')} title={i18n.t('web.text.styleMenu')} data-testid="text-style-menu"
          onClick={() => { if (open) close(); else { setView('main'); setOpen(true); } }}
          onKeyDown={(e) => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setView('main'); setOpen(true); } }}>
          <More className="h-4 w-4" />
        </button>
      </div>
      {naming && (
        <div className="flex items-center gap-1.5">
          <label htmlFor={inputId} className="sr-only">{i18n.t('web.text.newName')}</label>
          <input id={inputId} autoFocus className="min-w-0 flex-1 border border-line bg-surface px-2 py-1 text-xs text-fg" value={name} maxLength={60} placeholder={i18n.t('web.text.newName')}
            onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') done(); else if (e.key === 'Escape') { e.stopPropagation(); setNaming(null); } }} data-testid="text-new-name" />
          <button type="button" className={btn} disabled={!name.trim()} onClick={done} data-testid="text-name-ok">{i18n.t('web.text.saveOk')}</button>
        </div>
      )}
      {note && <p role="status" className="text-xs leading-snug text-muted" data-testid="text-style-note">{note}</p>}
      {open && createPortal(
        <div ref={menu} id={menuId} role="menu" aria-label={i18n.t('web.text.styleMenu')} onKeyDown={onMenuKey} data-testid="text-style-menu-list"
          style={place.style ?? { position: 'fixed', visibility: 'hidden' }} className="z-50 w-64 max-w-[calc(100vw-1rem)] overflow-y-auto border border-line bg-surface py-1 shadow-sm">
          {view === 'main' ? <>
            {item('text-save-style', i18n.t('web.text.saveStyle'), () => startNaming('save'), stylesFull, i18n.t('web.text.stylesFull'))}
            {item('text-update-style', i18n.t('web.text.updateStyleN', { name: label, n: count }), () => { close(); p.onUpdate(); }, !n, i18n.t('web.text.noChanges'))}
            {item('text-clear', i18n.t('web.text.clearAll'), () => { close(); p.onClear(); }, !n, i18n.t('web.text.noChanges'))}
            {item('text-rename-style', i18n.t('web.text.renameStyle'), () => startNaming('rename'), !p.onRename)}
            {item('text-delete-style', i18n.t('web.text.deleteStyle'), () => { close(); if (count > 0) setConfirm({ kind: 'delete' }); else p.onDelete?.(id); },
              isBuiltinStyle(id) || !p.onDelete, i18n.t('web.text.deleteBuiltin'))}
            <div role="separator" className="my-1 border-t border-line" />
            {item('text-save-library', i18n.t('web.text.saveToLibrary'), () => {
              close(); const next = addToLibrary(lib, label, p.resolved);
              if (next) { setLib(next); setNote(i18n.t('web.text.librarySaved', { name: label })); }
            }, libFull, i18n.t('web.text.libraryFull'))}
            {item('text-remove-library', i18n.t('web.text.removeFromLibrary'), () => setView('lib'), !lib.length)}
          </> : <>
            {item('text-library-back', `‹ ${i18n.t('web.text.back')}`, () => setView('main'))}
            <div role="separator" className="my-1 border-t border-line" />
            {lib.map((x) => item(`text-library-item-${x.id}`, x.name, () => { close(); setConfirm({ kind: 'lib', item: x }); }))}
          </>}
        </div>,
        document.body)}
      {confirm?.kind === 'delete' && (
        <ConfirmDialog testId="text-delete-confirm" title={i18n.t('web.text.deleteTitle', { name: label })} message={i18n.t('web.text.deleteMsg', { n: count })}
          confirmLabel={i18n.t('web.text.deleteStyle')} cancelLabel={i18n.t('web.confirm.cancel')}
          onCancel={() => setConfirm(null)} onConfirm={() => { setConfirm(null); p.onDelete?.(id); }} />
      )}
      {confirm?.kind === 'lib' && (
        <ConfirmDialog testId="text-lib-remove-confirm" title={i18n.t('web.text.libRemoveTitle', { name: confirm.item.name })} message={i18n.t('web.text.libRemoveMsg')}
          confirmLabel={i18n.t('web.text.libRemoveOk')} cancelLabel={i18n.t('web.confirm.cancel')}
          onCancel={() => setConfirm(null)} onConfirm={() => { const it = confirm.item; setConfirm(null); setLib(removeFromLibrary(lib, it.id)); }} />
      )}
    </div>
  );
}

const DEFAULT_NAMES: Record<string, string> = { title: 'Title', subtitle: 'Subtitle', heading: 'Heading', body: 'Body', caption: 'Caption', label: 'Small label', counter: 'Counter', clock: 'Clock', tiny: 'Tiny' };
/** Tên gốc của kiểu dựng sẵn (chưa đổi tên thì hiện theo ngôn ngữ giao diện). */
const defaultName = (id: string) => DEFAULT_NAMES[id];
