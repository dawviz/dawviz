// Animation Inspector (UI-DIRECTION 5.3, DESIGN.md "Animation Inspector"): mục đầu của cột Thiết lập khi Timeline đang chọn keyframe
// hoặc một hàng thuộc tính. Thay cho mục "Hoạt hình thuộc tính" cũ (T-22): danh sách keyframe nằm trên Timeline, ở đây chỉ chỉnh chi tiết.
//  • Chọn keyframe (một hay nhiều): thời điểm và giá trị (khi chọn một), đồ thị đường cong đi TỚI keyframe (cubic-bezier kéo được + 4 ô số),
//    đường cong có tên, cách đi tiếp, sau keyframe cuối. Áp cho mọi keyframe đang chọn trong một bước hoàn tác.
//  • Chọn hàng (không keyframe): cách thay đổi Keyframe | Theo nhạc; form "Theo nhạc" (nguồn, khoảng nguồn, khoảng giá trị, đường cong).
import type { ReactNode } from 'react';
import { EASING_NAMES, isBinding, type Animation, type Binding, type BindSource, type EaseSpec, type Key, type KeyAnimation, type LoopMode, type TempoPoint, type WidgetSpec } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import type { Gesture } from '../lib/storeReact.ts';
import { radioKeys, radioTab } from '../lib/a11y.ts';
import { formatClock } from '../lib/timeFormat.ts';
import { animFields, keyTimeText, newBinding, newKeyAnimation, setKey, SOURCES, withSource, type AnimField } from '../lib/animateFields.ts';
import { DEFAULT_BEZIER, bezierOf, common, easeName, sameEase, type Bezier } from '../lib/easeCurve.ts';
import { groupRefs, keyRef, keySecs, parseKeyRef, removeKeys } from '../lib/timeline.ts';
import { InspectorSection, ResetButton } from './Inspector.tsx';
import { NumberField } from './NumberField.tsx';
import { TimeField } from './TimeField.tsx';
import { Select } from './Select.tsx';
import { EaseGraph } from './EaseGraph.tsx';
import { Trash } from './Icons.tsx';
import { NO_SEL, type KeySel } from './KeyframeTimeline.tsx';
import { rowOfPath, timelineRows } from '../lib/timelineRows.ts';

const EASES = [...EASING_NAMES, 'hold'];
const LOOPS: LoopMode[] = ['NONE', 'CYCLE', 'PINGPONG', 'OFFSET'];
const MIXED = '__mixed';
const btn = 'flex min-h-[var(--hit)] items-center gap-1.5 rounded border border-control bg-raised px-2.5 text-xs font-medium text-fg transition hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50';

export interface AnimationInspectorProps {
  n: number;
  widget: WidgetSpec;
  sel: KeySel;
  tempoMap: readonly TempoPoint[];
  locked: boolean;
  getTime(): number;
  onAnimate(path: string, v: Animation | null, key?: string): void;
  /** Nhiều đường dẫn trong một lệnh (một bước hoàn tác). */
  onAnimateMany(changes: Record<string, Animation | null>, key?: string): void;
  onSel(s: KeySel): void;
  gesture: Gesture;
}

/** Có gì để hiện không (để cột Thiết lập biết có đánh số thêm một mục hay không). */
export function hasInspectorTarget(widget: WidgetSpec, sel: KeySel): boolean {
  if (sel.keys.some((r) => { const p = parseKeyRef(r); const a = p && widget.animate?.[p.path]; return !!a && !isBinding(a) && a.keys.length > p!.i; })) return true;
  return !!sel.row && timelineRows(widget.type, widget.animate).some((r) => r.id === sel.row);
}

export function AnimationInspector({ n, widget, sel, tempoMap, locked, getTime, onAnimate, onAnimateMany, onSel, gesture }: AnimationInspectorProps) {
  const { i18n } = useI18n();
  const fields = animFields(widget.type), byPath = new Map(fields.map((f) => [f.path, f]));
  const label = (f: AnimField) => (f.labelKey && i18n.has(f.labelKey) ? i18n.t(f.labelKey) : f.path);
  const anim = (p: string): KeyAnimation | null => { const a = widget.animate?.[p]; return a && !isBinding(a) ? a : null; };
  /** Gom mọi thay đổi của một thao tác thành MỘT lệnh (một bước hoàn tác, lib/commands.ts editWidgetAnimation). */
  const many = (fn: (put: (p: string, v: Animation | null) => void) => void, key?: string) => { const ch: Record<string, Animation | null> = {}; fn((p, v) => { ch[p] = v; }); if (Object.keys(ch).length) onAnimateMany(ch, key); };
  const rows = timelineRows(widget.type, widget.animate);
  const rowName = (path: string) => { const r = rowOfPath(rows, path); return r && i18n.has(r.labelKey) ? i18n.t(r.labelKey) : label(byPath.get(path)!); };
  const deselect = <button type="button" className="btn-ghost shrink-0" onClick={() => onSel(NO_SEL)} title={`${i18n.t('web.keyinsp.deselect')} (Esc)`} data-testid="keyinsp-deselect">{i18n.t('web.keyinsp.deselect')}</button>;

  // Keyframe đang chọn (bỏ những cái không còn tồn tại).
  const entries = sel.keys.flatMap((r) => {
    const p = parseKeyRef(r), a = p && anim(p.path), f = p && byPath.get(p.path);
    if (!p || !a || !f || p.i >= a.keys.length) return [];
    const secs = keySecs(a, tempoMap), t = secs[p.i];
    const first = secs.every((x, j) => j === p.i || !(x < t || (x === t && j < p.i)));
    return [{ path: p.path, i: p.i, f, a, k: a.keys[p.i], t, first }];
  });

  if (entries.length) {
    const groups = groupRefs(entries.map((e) => keyRef(e.path, e.i)));
    const paths = [...groups.keys()];
    const patchAll = (patch: (k: Key) => Partial<Key>, key?: string) => many((put) => {
      for (const [p, idx] of groups) { const a = anim(p); if (!a) continue; let next = a; for (const i of idx) next = setKey(next, i, patch(next.keys[i])); put(p, next); }
    }, key);
    const incoming = entries.filter((e) => !e.first);
    const ease = common(incoming.map((e) => e.k.ease), sameEase);
    const mixedEase = ease === 'mixed';
    const curEase = mixedEase ? undefined : (ease as EaseSpec | undefined);
    const bez: Bezier = (!mixedEase && bezierOf(curEase)) || DEFAULT_BEZIER;
    const setEase = (e: EaseSpec | undefined, key?: string) => patchAll(() => ({ ease: e }), key);
    const interp = common(entries.map((e) => e.k.interp ?? 'linear'));
    const loop = common(paths.map((p) => anim(p)?.loop ?? 'NONE'));
    const spots = new Set(entries.map((e) => `${rowOfPath(rows, e.path)?.id ?? e.path}@${Math.round(e.t * 240)}`));
    const rowIds = new Set(entries.map((e) => rowOfPath(rows, e.path)?.id ?? e.path));
    const one = spots.size === 1 ? entries : null;
    const noIncoming = incoming.length === 0;
    const title = one ? `${rowName(one[0].path)} · ${formatClock(one[0].t)}` : i18n.t('web.keyinsp.many', { n: spots.size, m: rowIds.size });
    return (
      <InspectorSection n={n} id="keyframe" title={i18n.t('web.keyinsp.title')}>
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 text-xs leading-snug text-fg" data-testid="keyinsp-summary">{title}</p>
          {deselect}
        </div>
        {one && (
          <div className="grid grid-cols-[minmax(0,1fr)_7rem] items-center gap-x-2 gap-y-2 text-xs text-muted">
            <span>{i18n.t('web.keyinsp.time')}</span>
            {one.every((e) => 'sec' in e.k.at)
              ? <TimeField id="keyinsp-time" label={i18n.t('web.keyinsp.time')} value={(one[0].k.at as { sec: number }).sec} disabled={locked}
                  onChange={(v) => { if (locked) return; many((put) => { for (const e of one) { const a = anim(e.path); if (a) put(e.path, setKey(a, e.i, { at: { sec: v ?? 0 } })); } }, 'kt'); }} />
              : <span className="text-right tabular-nums text-fg" title={i18n.t('web.anim.atMusic')}>{keyTimeText(one[0].k.at)}</span>}
            {one.map((e) => {
              const name = one.length > 1 ? `${i18n.t('web.keyinsp.value')} ${e.path.split('.').pop()!.toUpperCase()}` : i18n.t('web.keyinsp.value');
              const set = (v: number | string) => { const a = anim(e.path); if (a) onAnimate(e.path, setKey(a, e.i, { value: v }), `kv${e.path}`); };
              return [
                <span key={`l${e.path}`}>{name}</span>,
                e.f.kind === 'color'
                  ? <input key={e.path} type="color" aria-label={name} value={String(e.k.value)} disabled={locked} onChange={(x) => set(x.target.value)} className="h-6 w-full" />
                  : <NumberField key={e.path} label={name} value={Number(e.k.value)} spec={{ min: e.f.min, max: e.f.max, step: e.f.step }} range={e.f.range} disabled={locked} onChange={set} />,
              ];
            })}
          </div>
        )}

        <div className="space-y-2 border-t border-line pt-2.5">
          <p className="text-xs font-semibold text-fg">{i18n.t('web.keyinsp.curveIn')}</p>
          {noIncoming && <p className="text-xs leading-snug text-muted" data-testid="keyinsp-first">{i18n.t('web.keyinsp.firstKey')}</p>}
          <EaseGraph ease={curEase} mixed={mixedEase} disabled={locked || noIncoming}
            onBegin={() => gesture.begin()} onEnd={() => gesture.end()}
            onChange={(b) => patchAll(() => ({ ease: { cubicBezier: b } }), 'bez')} />
          <Row label={i18n.t('web.anim.ease')} reset={<ResetButton label={i18n.t('web.anim.ease')} text={i18n.t('web.keyinsp.resetCurve')} changed={!noIncoming && (mixedEase || !sameEase(curEase, undefined))} disabled={locked} onReset={() => setEase(undefined)} />}>
            <Select wrapClassName="w-full" aria-label={i18n.t('web.anim.ease')} value={mixedEase ? MIXED : easeName(curEase)} disabled={locked || noIncoming} data-testid="keyinsp-ease"
              onChange={(e) => { if (e.target.value !== MIXED && e.target.value !== 'custom') setEase(e.target.value); }}>
              {mixedEase && <option value={MIXED} disabled>{i18n.t('web.keyinsp.mixed')}</option>}
              {easeName(curEase) === 'custom' && !mixedEase && <option value="custom">{i18n.t('web.keyinsp.custom')}</option>}
              {EASES.map((x) => <option key={x} value={x}>{x}</option>)}
            </Select>
          </Row>
          <div className="grid grid-cols-4 gap-1.5" role="group" aria-label={i18n.t('web.keyinsp.bezier')}>
            {(['x1', 'y1', 'x2', 'y2'] as const).map((name, j) => (
              <label key={name} className="space-y-0.5 text-[11px] text-muted">
                <span className="block text-center">{name}</span>
                <NumberField label={`${i18n.t('web.keyinsp.bezier')} ${name}`} value={bez[j]} spec={{ min: j % 2 ? -1 : 0, max: j % 2 ? 2 : 1, step: 0.01 }} range={j % 2 ? [-0.5, 1.5] : [0, 1]}
                  disabled={locked || noIncoming} onChange={(v) => { const b = [...bez] as Bezier; b[j] = v; setEase({ cubicBezier: b }, `bz${j}`); }} />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2 border-t border-line pt-2.5">
          <Row label={i18n.t('web.anim.interp')} reset={<ResetButton label={i18n.t('web.anim.interp')} text={i18n.t('web.keyinsp.resetInterp')} changed={interp !== 'linear'} disabled={locked} onReset={() => patchAll(() => ({ interp: undefined }))} />}>
            <Select wrapClassName="w-full" aria-label={i18n.t('web.anim.interp')} value={interp === 'mixed' ? MIXED : interp} disabled={locked} data-testid="keyinsp-interp"
              onChange={(e) => { if (e.target.value !== MIXED) patchAll(() => ({ interp: e.target.value as Key['interp'] })); }}>
              {interp === 'mixed' && <option value={MIXED} disabled>{i18n.t('web.keyinsp.mixed')}</option>}
              {(['linear', 'hold', 'smooth'] as const).map((m) => <option key={m} value={m}>{i18n.t(`web.anim.interp.${m}`)}</option>)}
            </Select>
          </Row>
          <Row label={i18n.t('web.anim.loop')} reset={<ResetButton label={i18n.t('web.anim.loop')} text={i18n.t('web.keyinsp.resetLoop')} changed={loop !== 'NONE'} disabled={locked}
            onReset={() => many((put) => { for (const p of paths) { const a = anim(p); if (a?.loop) { const { loop: _l, ...rest } = a; put(p, rest); } } })} />}>
            <Select wrapClassName="w-full" aria-label={i18n.t('web.anim.loop')} value={loop === 'mixed' ? MIXED : loop} disabled={locked} data-testid="keyinsp-loop"
              onChange={(e) => {
                const v = e.target.value as LoopMode | typeof MIXED; if (v === MIXED) return;
                many((put) => { for (const p of paths) { const a = anim(p); if (a) put(p, { ...a, loop: v === 'NONE' ? undefined : v }); } });
              }}>
              {loop === 'mixed' && <option value={MIXED} disabled>{i18n.t('web.keyinsp.mixed')}</option>}
              {LOOPS.map((l) => <option key={l} value={l}>{i18n.t(`web.anim.loop.${l}`)}</option>)}
            </Select>
          </Row>
        </div>
        <button type="button" className={btn} disabled={locked} data-testid="keyinsp-delete"
          onClick={() => { many((put) => { for (const [p, idx] of groups) { const a = anim(p); if (a) put(p, removeKeys(a, idx)); } }); onSel({ keys: [], row: sel.row }); }}>
          <Trash className="h-3.5 w-3.5" />{i18n.t('web.keyinsp.delete', { n: entries.length })}
        </button>
      </InspectorSection>
    );
  }

  // ── chọn dòng thuộc tính (một dòng có thể gồm nhiều đường dẫn, vd. Vị trí = X + Y) ──
  const row = sel.row ? rows.find((r) => r.id === sel.row) : undefined;
  if (!row) return null;
  const anims = row.paths.map((p) => widget.animate?.[p]);
  const mode = anims.some((a) => a && !isBinding(a)) ? 'keys' : anims.some((a) => a) ? 'bind' : null;
  const used = Object.keys(widget.animate ?? {}).length;
  const rname = i18n.has(row.labelKey) ? i18n.t(row.labelKey) : row.id;
  const setMode = (m: 'keys' | 'bind') => {
    if (locked || m === mode) return;
    if (!mode && used + row.paths.length > 24) return;
    many((put) => { row.fields.forEach((f) => put(f.path, m === 'keys' ? newKeyAnimation(widget, f.path, getTime()) : newBinding(widget, f))); });
  };
  return (
    <InspectorSection n={n} id="keyframe" title={i18n.t('web.keyinsp.title')}>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-xs leading-snug text-fg" data-testid="keyinsp-summary">{rname}</p>
        {deselect}
      </div>
      <div className="seg w-full" role="radiogroup" aria-label={i18n.t('web.anim.mode')} onKeyDown={radioKeys} data-testid="keyinsp-mode">
        {(['keys', 'bind'] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} tabIndex={radioTab(mode === m || (mode === null && m === 'keys'))} className="seg-btn flex-1" disabled={locked}
            onClick={() => setMode(m)} data-testid={`keyinsp-mode-${m}`}>{i18n.t(`web.anim.mode.${m}`)}</button>
        ))}
      </div>
      {mode === null && <p className="text-xs leading-snug text-muted">{i18n.t('web.keyinsp.notAnimated')}</p>}
      {mode === 'keys' && (() => {
        const ka = anims.filter((a): a is KeyAnimation => !!a && !isBinding(a));
        const loop = common(ka.map((a) => a.loop ?? 'NONE'));
        return (
          <>
            <p className="text-xs leading-snug text-muted">{i18n.t('web.keyinsp.keyCount', { n: Math.max(...ka.map((a) => a.keys.length)) })}</p>
            <Row label={i18n.t('web.anim.loop')} reset={<ResetButton label={i18n.t('web.anim.loop')} text={i18n.t('web.keyinsp.resetLoop')} changed={loop !== 'NONE'} disabled={locked}
              onReset={() => many((put) => { row.paths.forEach((p, j) => { const a = anims[j]; if (a && !isBinding(a) && a.loop) { const { loop: _l, ...rest } = a; put(p, rest); } }); })} />}>
              <Select wrapClassName="w-full" aria-label={i18n.t('web.anim.loop')} value={loop === 'mixed' ? MIXED : loop ?? 'NONE'} disabled={locked} data-testid="keyinsp-loop"
                onChange={(e) => { const v = e.target.value; if (v === MIXED) return; many((put) => { row.paths.forEach((p, j) => { const a = anims[j]; if (a && !isBinding(a)) put(p, { ...a, loop: v === 'NONE' ? undefined : (v as LoopMode) }); }); }); }}>
                {loop === 'mixed' && <option value={MIXED} disabled>{i18n.t('web.keyinsp.mixed')}</option>}
                {LOOPS.map((l) => <option key={l} value={l}>{i18n.t(`web.anim.loop.${l}`)}</option>)}
              </Select>
            </Row>
          </>
        );
      })()}
      {mode === 'bind' && row.fields.map((f, j) => { const b = anims[j]; return b && isBinding(b)
        ? <BindEditor key={f.path} f={f} b={b} name={row.paths.length > 1 ? label(f) : rname} disabled={locked} onChange={(v, key) => onAnimate(f.path, v, key)} />
        : null; })}
      {mode && (
        <button type="button" className={btn} disabled={locked} data-testid="keyinsp-remove"
          onClick={() => { many((put) => { for (const p of row.paths) if (widget.animate?.[p]) put(p, null); }); onSel({ keys: [], row: row.id }); }}><Trash className="h-3.5 w-3.5" />{i18n.t('web.anim.remove')}</button>
      )}
    </InspectorSection>
  );
}

function Row({ label, children, reset }: { label: string; children: ReactNode; reset?: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,9.5rem)_1.5rem] items-center gap-2 text-xs text-muted">
      <span className="min-w-0 break-words leading-tight">{label}</span>
      {children}
      {reset ?? <span aria-hidden />}
    </div>
  );
}

/** Form "Theo nhạc": nguồn, khoảng nguồn, khoảng giá trị, đường cong (chuyển từ mục Hoạt hình cũ). */
function BindEditor({ f, b, name, disabled, onChange }: { f: AnimField; b: Binding; name: string; disabled: boolean; onChange(v: Binding, key?: string): void }) {
  const { i18n } = useI18n();
  const value = (v: number | string, set: (v: number | string) => void, lbl: string) => f.kind === 'color'
    ? <input type="color" aria-label={lbl} value={String(v)} disabled={disabled} onChange={(e) => set(e.target.value)} className="h-6 w-full" />
    : <NumberField label={lbl} value={Number(v)} spec={{ min: f.min, max: f.max, step: f.step }} range={f.range} disabled={disabled} onChange={(x) => set(x)} />;
  const setTo = (i: 0 | 1, v: number | string) => onChange({ ...b, to: (i === 0 ? [v, b.to[1]] : [b.to[0], v]) as Binding['to'] }, `to${i}`);
  return (
    <div className="space-y-2" data-testid="keyinsp-bind">
      <Row label={i18n.t('web.anim.source')}>
        <Select wrapClassName="w-full" aria-label={i18n.t('web.anim.source')} value={b.bind} disabled={disabled} data-testid="keyinsp-source" onChange={(e) => onChange(withSource(b, e.target.value as BindSource))}>
          {SOURCES.map((s) => <option key={s} value={s}>{i18n.t(`web.anim.src.${s}`)}</option>)}
        </Select>
      </Row>
      <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-center gap-2 text-xs text-muted">
        <span className="min-w-0 break-words leading-tight">{i18n.t('web.anim.from')}</span>
        <NumberField label={`${name}: ${i18n.t('web.anim.from')} (1)`} value={b.from[0]} spec={{ min: -1e6, max: 1e6, step: 0.1 }} disabled={disabled} onChange={(v) => onChange({ ...b, from: [v, b.from[1] === v ? v + 1 : b.from[1]] }, 'from0')} />
        <NumberField label={`${name}: ${i18n.t('web.anim.from')} (2)`} value={b.from[1]} spec={{ min: -1e6, max: 1e6, step: 0.1 }} disabled={disabled} onChange={(v) => onChange({ ...b, from: [b.from[0], v === b.from[0] ? v + 1 : v] }, 'from1')} />
        <span className="min-w-0 break-words leading-tight">{i18n.t('web.anim.to')}</span>
        <div>{value(b.to[0], (v) => setTo(0, v), `${name}: ${i18n.t('web.anim.to')} (1)`)}</div>
        <div>{value(b.to[1], (v) => setTo(1, v), `${name}: ${i18n.t('web.anim.to')} (2)`)}</div>
      </div>
      <Row label={i18n.t('web.anim.ease')}>
        <Select wrapClassName="w-full" aria-label={i18n.t('web.anim.ease')} value={easeName(b.ease)} disabled={disabled} onChange={(e) => { if (e.target.value !== 'custom') onChange({ ...b, ease: e.target.value }); }}>
          {easeName(b.ease) === 'custom' && <option value="custom">{i18n.t('web.keyinsp.custom')}</option>}
          {EASES.map((x) => <option key={x} value={x}>{x}</option>)}
        </Select>
      </Row>
    </div>
  );
}
