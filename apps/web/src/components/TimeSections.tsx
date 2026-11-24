// Các mục thời gian của bảng Thuộc tính: chuyển động, nốt chủ, cách ghi tên nốt. Khoảng hiển thị và hiện dần/ẩn dần chỉnh trên thanh của lớp ở Timeline (D-69).
// Phase của bài chỉnh trên làn Phase của Timeline (D-69, LayerTimeline.tsx).
import { DEFAULT_LOOP, DEFAULT_PHASE, DEFAULT_NAMING, LOOP_EFFECT_NAMES, WIDGET_EFFECT_NAMES, type MotionLoop, type WidgetMotion, NAMING_SYSTEMS, PITCH_CLASSES, type NoteNaming } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { InspectorSection, ResetButton } from './Inspector.tsx';
import { NumberField } from './NumberField.tsx';
import { Select } from './Select.tsx';


const MOTION_SEC = { min: 0, max: 30, step: 0.1, units: { s: 1 } } as const;
/** Mục "Chuyển động" (mọi loại widget): hiệu ứng vào ở đầu khoảng hiển thị, hiệu ứng ra ở cuối, và một chuyển động lặp theo nhịp. */
export function MotionSection({ n, widgetId, value, disabled, onChange }: { n: number; widgetId: string; value: WidgetMotion | undefined; disabled?: boolean; onChange(v: WidgetMotion | null, key?: string): void }) {
  const { i18n } = useI18n();
  const cur: WidgetMotion = value ?? { enter: null, exit: null, loop: null };
  const phase = (k: 'enter' | 'exit') => {
    const p = cur[k];
    return (
      <div className="space-y-1.5" data-testid={`motion-${k}`}>
        <label className="flex items-center gap-2 text-xs text-muted">
          <span className="shrink-0">{i18n.t(`web.motion.${k}`)}</span>
          <Select wrapClassName="min-w-0 flex-1" value={p ? p.effect : ''} disabled={disabled} data-testid={`motion-${k}-effect`} onChange={(e) => onChange({ ...cur, [k]: e.target.value === '' ? null : { ...(p ?? DEFAULT_PHASE), effect: e.target.value } })}>
            <option value="">{i18n.t('web.motion.none')}</option>
            {WIDGET_EFFECT_NAMES.map((f) => <option key={f} value={f}>{i18n.t(`web.motion.fx.${f}`)}</option>)}
          </Select>
        </label>
        {p && (
          <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_1.5rem] items-center gap-2 text-xs text-muted">
            <span>{i18n.t('web.motion.sec')}</span>
            <NumberField label={`${i18n.t(`web.motion.${k}`)}: ${i18n.t('web.motion.sec')}`} value={p.sec} spec={MOTION_SEC} range={[0, 3]} disabled={disabled} onChange={(v) => onChange({ ...cur, [k]: { ...p, sec: v } }, `${k}Sec`)} />
            <ResetButton label={i18n.t('web.motion.sec')} changed={p.sec !== DEFAULT_PHASE.sec} disabled={disabled} onReset={() => onChange({ ...cur, [k]: { ...p, sec: DEFAULT_PHASE.sec } }, `${k}Sec`)} />
          </div>
        )}
      </div>
    );
  };
  const lp = cur.loop;
  return (
    <InspectorSection n={n} id="motion" title={i18n.t('web.motion.title')}>
      {phase('enter')}
      {phase('exit')}
      <label className="flex items-center gap-2 text-xs text-muted">
        <span className="shrink-0">{i18n.t('web.motion.loop')}</span>
        <Select wrapClassName="min-w-0 flex-1" value={lp ? lp.effect : ''} disabled={disabled} data-testid="motion-loop-effect" onChange={(e) => onChange({ ...cur, loop: e.target.value === '' ? null : { ...(lp ?? DEFAULT_LOOP), effect: e.target.value as MotionLoop['effect'] } })}>
          <option value="">{i18n.t('web.motion.none')}</option>
          {LOOP_EFFECT_NAMES.map((f) => <option key={f} value={f}>{i18n.t(`web.motion.loopfx.${f}`)}</option>)}
        </Select>
      </label>
      {lp && (
        <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_1.5rem] items-center gap-2 text-xs text-muted">
          <span>{i18n.t('web.motion.amount')}</span>
          <NumberField label={i18n.t('web.motion.amount')} value={lp.amount} spec={{ min: 0, max: 1, step: 0.05 }} disabled={disabled} onChange={(v) => onChange({ ...cur, loop: { ...lp, amount: v } }, 'amount')} />
          <ResetButton label={i18n.t('web.motion.amount')} changed={lp.amount !== DEFAULT_LOOP.amount} disabled={disabled} onReset={() => onChange({ ...cur, loop: { ...lp, amount: DEFAULT_LOOP.amount } }, 'amount')} />
          <span>{i18n.t('web.motion.every')}</span>
          <NumberField label={i18n.t('web.motion.every')} value={lp.every} spec={{ min: 0.05, max: 64, step: 0.25 }} range={[0.25, 8]} disabled={disabled} onChange={(v) => onChange({ ...cur, loop: { ...lp, every: v } }, 'every')} />
          <ResetButton label={i18n.t('web.motion.every')} changed={lp.every !== DEFAULT_LOOP.every} disabled={disabled} onReset={() => onChange({ ...cur, loop: { ...lp, every: DEFAULT_LOOP.every } }, 'every')} />
        </div>
      )}
      {lp && (
        <label className="flex items-center gap-2 text-xs text-muted">
          <span className="shrink-0">{i18n.t('web.motion.unit')}</span>
          <Select wrapClassName="min-w-0 flex-1" value={lp.unit} disabled={disabled} data-testid="motion-loop-unit" onChange={(e) => onChange({ ...cur, loop: { ...lp, unit: e.target.value as MotionLoop['unit'] } })}>
            <option value="BEATS">{i18n.t('web.motion.unit.BEATS')}</option>
            <option value="SECONDS">{i18n.t('web.motion.unit.SECONDS')}</option>
          </Select>
        </label>
      )}
    </InspectorSection>
  );
}

/** Mục "Nốt chủ": chọn nốt chủ của bài để `{bass}` hiện bậc (1, ♭2, … 7) thay vì tên nốt. */
/** Mục "Cách ghi tên nốt" (P-12): một thiết lập chung cho mọi widget có tên nốt hoặc hợp âm. Trống = cách ghi cũ. */
export function NamingSection({ n, naming, onChange }: { n: number; naming: NoteNaming | undefined; onChange(v: NoteNaming | null): void }) {
  const { i18n } = useI18n();
  const cur = naming ?? DEFAULT_NAMING, set = (patch: Partial<NoteNaming>) => onChange({ ...cur, ...patch });
  return (
    <InspectorSection n={n} id="naming" title={i18n.t('web.naming.title')}>
      <label className="flex items-center gap-2 text-xs text-muted">
        <span className="shrink-0">{i18n.t('web.naming.system')}</span>
        <Select wrapClassName="min-w-0 flex-1" value={naming ? naming.system : ''} data-testid="naming-system" onChange={(e) => (e.target.value === '' ? onChange(null) : set({ system: e.target.value as NoteNaming['system'] }))}>
          <option value="">{i18n.t('web.naming.default')}</option>
          {NAMING_SYSTEMS.map((s) => <option key={s} value={s}>{i18n.t(`web.naming.system.${s}`)}</option>)}
        </Select>
      </label>
      {naming && (<>
        <label className="flex items-center gap-2 text-xs text-muted">
          <span className="shrink-0">{i18n.t('web.naming.accidental')}</span>
          <Select wrapClassName="min-w-0 flex-1" value={naming.accidental} data-testid="naming-accidental" onChange={(e) => set({ accidental: e.target.value as NoteNaming['accidental'] })}>
            <option value="SHARP">{i18n.t('web.naming.accidental.SHARP')}</option>
            <option value="FLAT">{i18n.t('web.naming.accidental.FLAT')}</option>
          </Select>
        </label>
        <label className="flex items-center gap-2 text-xs text-muted"><input type="checkbox" checked={naming.ascii} data-testid="naming-ascii" onChange={(e) => set({ ascii: e.target.checked })} />{i18n.t('web.naming.ascii')}</label>
        <label className="flex items-center gap-2 text-xs text-muted">
          <span className="shrink-0">{i18n.t('web.naming.middleC')}</span>
          <Select wrapClassName="min-w-0 flex-1" value={String(naming.middleC)} data-testid="naming-middlec" onChange={(e) => set({ middleC: e.target.value === '3' ? 3 : 4 })}>
            <option value="4">{i18n.t('web.naming.middleC.4')}</option>
            <option value="3">{i18n.t('web.naming.middleC.3')}</option>
          </Select>
        </label>
      </>)}
    </InspectorSection>
  );
}

export function KeySection({ n, tonic, onChange }: { n: number; tonic: number | undefined; onChange(t: number | null): void }) {
  const { i18n } = useI18n();
  return (
    <InspectorSection n={n} id="tonic" title={i18n.t('web.tonic.title')}>
      <label className="flex items-center gap-2 text-xs text-muted">
        <span className="shrink-0">{i18n.t('web.tonic.label')}</span>
        <Select wrapClassName="min-w-0 flex-1" value={tonic === undefined ? '' : String(tonic)} data-testid="tonic-select" onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}>
          <option value="">{i18n.t('web.tonic.none')}</option>
          {PITCH_CLASSES.map((p, i) => <option key={p} value={i}>{p}</option>)}
        </Select>
      </label>
    </InspectorSection>
  );
}
