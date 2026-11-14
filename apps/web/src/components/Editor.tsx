// Thẻ Editor (T-68, UI-DIRECTION 5.3 mục 3, SRS 5.3 Edit Mode): bố cục widget trên khung video.
// Ba cột như thẻ Preview: "Lớp" (danh sách widget, mắt, khoá; kéo dòng để đổi thứ tự) | sân khấu có lớp tương tác + thanh phát |
// "Thuộc tính" đánh số. D-57 (một dữ liệu, hai cách bày bảng): chọn Piano Roll thì bảng Thuộc tính có luôn mục Hình thức — cùng
// thành phần và cùng lệnh với inspector của Preview (App truyền vào qua `widgetSections`).
// Khoá là trạng thái của phiên chỉnh sửa (không vào preset video, không vào lịch sử); ẩn/hiện, vị trí, cỡ, góc, neo, thứ tự lớp
// và bắt dính đều là lệnh hoàn tác được (lib/commands.ts).
import { useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react';
import { ADDABLE_WIDGETS, normalizeAngle, rotateGroup, type Derived, type SceneDocument, type UnifiedProjectAST, type WidgetLayout, type WidgetSpec, type WidgetType } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import type { Playback } from '../lib/playback.ts';
import type { FontsStatus } from '../lib/fonts.ts';
import { STAGE_CHROME, useStageWidth } from '../lib/useStageWidth.ts';
import { alignLayouts, distributeLayouts, intoFrame, outsideFrame, round, setAnchor, type AlignMode } from '../lib/editorGeometry.ts';
import { LiveCanvas } from './Stage.tsx';
import { EditorOverlay } from './EditorOverlay.tsx';
import { InspectorSection, ResetButton } from './Inspector.tsx';
import { NumberField } from './NumberField.tsx';
import { AlignBottom, AlignHCenter, AlignLeft, AlignRight, AlignTop, AlignVCenter, DistributeH, DistributeV, Duplicate, Eye, EyeOff, Grip, LayerDown, LayerUp, Lock, Plus, ToBack, ToFront, Trash, Unlock } from './Icons.tsx';
import { isTextEntry } from '../lib/a11y.ts';
import { layerOrder } from '../lib/commands.ts';
import { StatusIcon } from './StatusIcon.tsx';

/** Vùng đệm quanh khung (px): tay nắm của widget chạm mép hoặc ra ngoài khung vẫn có chỗ, không vẽ đè thanh phát. */
const PASTEBOARD = 28;


type Patches = Record<string, Partial<WidgetLayout>>;
export interface EditorActions {
  layouts(p: Patches): void;
  visible(id: string, v: boolean): void;
  /** Ô mắt ở hàng đầu Lớp: còn lớp ẩn thì hiện hết, không thì ẩn hết. */
  allVisible(): void;
  z(id: string, where: 'front' | 'back'): void;
  /** Đưa lớp tới vị trí `to` của danh sách Lớp (0 = trên cùng). */
  moveLayer(id: string, to: number): void;
  snapping(p: Partial<SceneDocument['canvas']['snapping']>): void;
  /** Thêm widget loại `type` (T-68); trả id mới để chọn ngay. */
  add(type: WidgetType): string;
  /** Nhân bản; trả id các bản sao. */
  duplicate(ids: string[]): string[];
  remove(ids: string[]): void;
}
interface Props {
  scene: SceneDocument; derived: Derived | null; ast: UnifiedProjectAST | null; playback: Playback; fonts: FontsStatus;
  advanced: boolean; actions: EditorActions;
  /** Thanh phát (dùng chung với Preview), đặt ngay dưới khung. */
  transport?: ReactNode;
  /** Thẻ đang mở (để đo lại bề rộng khi hiện). */
  active: boolean;
  /** Mục thêm của bảng Thuộc tính cho widget đang chọn (vd. Hình thức của Piano Roll), đánh số tiếp từ `n`. */
  widgetSections?(w: WidgetSpec, n: number, locked: boolean): ReactNode[];
  /** Bố cục của phong cách/preset áp gần nhất (đích của nút ↺ ở X, Y, W, H). */
  layoutRef?: Record<string, WidgetLayout>;
}

/** Tên hiển thị của widget: tên loại theo ngôn ngữ, đánh số khi có nhiều widget cùng loại. */
export function useWidgetNames(widgets: readonly WidgetSpec[]): (id: string) => string {
  const { i18n } = useI18n();
  return useMemo(() => {
    const count = new Map<string, number>(), names = new Map<string, string>();
    for (const w of widgets) count.set(w.type, (count.get(w.type) ?? 0) + 1);
    const seen = new Map<string, number>();
    for (const w of widgets) {
      const n = (seen.get(w.type) ?? 0) + 1; seen.set(w.type, n);
      const base = i18n.has(`web.widget.${w.type}`) ? i18n.t(`web.widget.${w.type}`) : w.type;
      names.set(w.id, (count.get(w.type) ?? 0) > 1 ? `${base} ${n}` : base);
    }
    return (id: string) => names.get(id) ?? id;
  }, [widgets, i18n]);
}

export function Editor({ scene, derived, ast, playback, fonts, advanced, actions, transport, active, widgetSections, layoutRef }: Props) {
  const { i18n } = useI18n();
  const [selected, setSelected] = useState<string[]>([]);
  const [locked, setLocked] = useState<ReadonlySet<string>>(new Set());
  const name = useWidgetNames(scene.widgets);
  const live = selected.filter((id) => scene.widgets.some((w) => w.id === id)); // widget mất đi (mở preset khác) thì bỏ khỏi chọn
  // Khoá chỉ chặn chỉnh trên khung; widget khoá vẫn chọn được ở Lớp để xem số và mở khoá.
  const toggleLock = (id: string) => setLocked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  // Ô khoá ở hàng đầu Lớp: còn lớp chưa khoá thì khoá hết, đã khoá hết thì mở hết (cùng quy tắc với ô mắt).
  const lockAll = () => setLocked(() => (scene.widgets.every((w) => locked.has(w.id)) ? new Set() : new Set(scene.widgets.map((w) => w.id))));
  const { designWidth: W, designHeight: H } = scene.canvas;

  const scrollerRef = useRef<HTMLDivElement>(null), stageRef = useRef<HTMLDivElement>(null);
  const width = useStageWidth(scrollerRef, stageRef, { aspect: scene.canvas.designWidth / scene.canvas.designHeight, chrome: STAGE_CHROME.plain + 48 + 2 * PASTEBOARD, extra: 2 * PASTEBOARD, active: active && !!derived });

  // Danh sách lớp: trên cùng trước (zIndex giảm dần; cùng zIndex thì đứng sau trong tài liệu được vẽ sau, nên đứng trước ở đây).
  const order = useMemo(() => layerOrder(scene), [scene]);
  const layers = order.map((id) => scene.widgets.find((w) => w.id === id)!);
  const [say, setSay] = useState('');
  // Lớp đã khoá đứng yên cả trong danh sách (như After Effects): không kéo, không lên/xuống. Lớp khác vẫn đổi chỗ quanh nó.
  const move = (id: string, to: number) => {
    if (locked.has(id)) return;
    const dest = Math.max(0, Math.min(order.length - 1, to));
    if (dest === order.indexOf(id)) return;
    actions.moveLayer(id, dest);
    setSay(i18n.t('web.editor.layerDropped', { name: name(id), n: dest + 1 }));
  };
  // Kéo thả dòng Lớp: vạch chèn ở mép trên/dưới của dòng đang rê; thả thì đưa lớp tới đúng chỗ vạch.
  const [drop, setDrop] = useState<{ i: number; after: boolean } | null>(null);
  const dragId = useRef<string | null>(null);
  const LAYER_MIME = 'text/x-dawviz-layer';
  const rowDrag = (i: number) => ({
    onDragOver: (e: DragEvent<HTMLLIElement>) => {
      if (!e.dataTransfer.types.includes(LAYER_MIME)) return;
      e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      const r = e.currentTarget.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
      setDrop((d) => (d && d.i === i && d.after === after ? d : { i, after }));
    },
    onDrop: (e: DragEvent<HTMLLIElement>) => {
      const id = e.dataTransfer.getData(LAYER_MIME) || dragId.current; const d = drop;
      setDrop(null); dragId.current = null;
      if (!id || !d) return;
      e.preventDefault();
      const from = order.indexOf(id);
      let to = d.after ? d.i + 1 : d.i;
      if (from < to) to -= 1;
      move(id, to);
    },
  });
  // Ctrl/⌘ + ] / [ : lên/xuống một bậc; thêm Shift: lên trên cùng / xuống dưới cùng (chỉ khi chọn đúng một lớp).
  // Delete/Backspace: xoá; Ctrl/⌘+D: nhân bản (lớp khoá không bị xoá/nhân bản).
  const removeSel = () => { const ids = live.filter((id) => !locked.has(id)); if (ids.length) { actions.remove(ids); setSelected(live.filter((id) => locked.has(id))); setSay(i18n.t('web.editor.removed', { n: ids.length })); } };
  const duplicateSel = () => { const ids = live.filter((id) => !locked.has(id)); if (ids.length) setSelected(actions.duplicate(ids)); };
  const addWidget = (type: WidgetType) => { setSelected([actions.add(type)]); setSay(i18n.t('web.editor.added', { name: i18n.t(`web.widget.${type}`) })); };
  const onKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isTextEntry(e.target) || e.altKey) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey && live.length) { e.preventDefault(); removeSel(); return; }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD' && live.length) { e.preventDefault(); duplicateSel(); return; }
    if (!(e.ctrlKey || e.metaKey) || live.length !== 1) return;
    const k = e.code === 'BracketRight' ? 1 : e.code === 'BracketLeft' ? -1 : 0;
    if (!k) return;
    e.preventDefault();
    const id = live[0], i = order.indexOf(id);
    move(id, e.shiftKey ? (k > 0 ? 0 : order.length - 1) : i - k);
  };

  return (
    <div className="grid h-full min-h-0 lg:grid-cols-[13rem_minmax(0,1fr)_20rem] min-[1440px]:grid-cols-[14rem_minmax(0,1fr)_22rem]" data-testid="editor" onKeyDown={onKeys}>
      <aside aria-labelledby="layers-h" className="relative min-h-0 overflow-y-auto border-b border-line bg-surface py-3 lg:border-b-0 lg:border-r">
        <h2 id="layers-h" className="px-4 pb-2 text-[15px] font-semibold text-fg">{i18n.t('web.editor.layers')}</h2>
        <LayersHead widgets={scene.widgets} locked={locked} onAllVisible={actions.allVisible} onLockAll={lockAll} onAdd={addWidget} />
        <ul aria-labelledby="layers-h" data-testid="layers">
          {layers.map((w, i) => {
            const on = live.includes(w.id), lk = locked.has(w.id), out = w.visible && outsideFrame(w.layout, W, H);
            return (
              <li key={w.id} draggable={!lk} data-layer={w.id} data-locked={lk || undefined} {...rowDrag(i)}
                onDragStart={(e) => { if (lk) { e.preventDefault(); return; } dragId.current = w.id; e.dataTransfer.setData(LAYER_MIME, w.id); e.dataTransfer.effectAllowed = 'move'; }}
                onDragEnd={() => { setDrop(null); dragId.current = null; }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrop((d) => (d?.i === i ? null : d)); }}
                className={`group relative flex items-center gap-1 pl-2 pr-2 ${lk ? '' : 'cursor-grab active:cursor-grabbing'} ${on ? 'bg-raised' : 'hover:bg-raised'}`}>
                {on && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
                {drop?.i === i && <span aria-hidden className={`pointer-events-none absolute inset-x-2 h-0.5 bg-focus ${drop.after ? '-bottom-px' : '-top-px'}`} data-testid="layer-drop" />}
                {/* Tay nắm 6 chấm như dòng track: chỉ để nhìn (cả dòng kéo được); bàn phím dùng Alt+↑/↓ trên tên lớp.
                    Lớp khoá không kéo được nên không có tay nắm (vẫn giữ chỗ để tên thẳng cột). */}
                {lk ? <span aria-hidden className="w-4 shrink-0" />
                  : <span aria-hidden className="grid h-6 w-4 shrink-0 place-items-center text-faint group-hover:text-fg" data-testid="layer-grip"><Grip className="h-3.5 w-3.5" /></span>}
                <button type="button" aria-pressed={on} title={lk ? undefined : i18n.t('web.editor.layerDrag', { name: name(w.id) })}
                  onKeyDown={(e) => {
                    if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
                    e.preventDefault(); move(w.id, i + (e.key === 'ArrowUp' ? -1 : 1));
                    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-layer="${CSS.escape(w.id)}"] button`)?.focus());
                  }}
                  onClick={(e) => setSelected((s) => (e.shiftKey || e.metaKey || e.ctrlKey ? (s.includes(w.id) ? s.filter((x) => x !== w.id) : [...s, w.id]) : [w.id]))}
                  className={`flex min-h-[var(--hit)] min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left text-[13px] transition ${on ? 'font-medium text-fg' : 'text-muted hover:text-fg'}`}>
                  <span className={`truncate ${w.visible ? '' : 'line-through decoration-faint'}`}>{name(w.id)}</span>
                  {out && <span className="flex shrink-0 items-center" title={i18n.t('web.editor.outside')}><StatusIcon kind="warning" className="h-3.5 w-3.5 text-warning" /><span className="sr-only">({i18n.t('web.editor.outside')})</span></span>}
                </button>
                <button type="button" className="tog" aria-pressed={!w.visible} aria-label={i18n.t(w.visible ? 'web.editor.hide' : 'web.editor.show', { name: name(w.id) })}
                  title={i18n.t(w.visible ? 'web.editor.hide' : 'web.editor.show', { name: name(w.id) })} onClick={() => actions.visible(w.id, !w.visible)}>
                  {w.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button type="button" className="tog" aria-pressed={lk} aria-label={i18n.t(lk ? 'web.editor.unlock' : 'web.editor.lock', { name: name(w.id) })}
                  title={i18n.t(lk ? 'web.editor.unlock' : 'web.editor.lock', { name: name(w.id) })} onClick={() => toggleLock(w.id)}>
                  {lk ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                </button>
              </li>
            );
          })}
        </ul>
        <span className="sr-only" role="status" aria-live="polite">{say}</span>
      </aside>

      <div ref={scrollerRef} className="relative min-h-0 min-w-0 overflow-y-auto bg-page p-6">
        {derived && ast ? (
          <div ref={stageRef} className="mx-auto grid gap-y-2" style={{ width: width + 2 * PASTEBOARD, gridTemplateColumns: `${width + 2 * PASTEBOARD}px` }}>
            <p className="flex justify-between gap-3 px-7 text-xs tabular-nums text-muted">
              <span>{i18n.t('web.stage.size', { w: W, h: H, aspect: scene.canvas.aspectRatio })}</span>
            </p>
            {/* Bàn đệm: tay nắm ra ngoài khung vẫn thấy được nhưng bị cắt ở mép bàn, không đè thanh phát. */}
            <div className="overflow-hidden" style={{ padding: PASTEBOARD }} data-testid="editor-pasteboard">
              <figure aria-label={i18n.t('web.stage')} className="relative outline outline-1 outline-line">
                <LiveCanvas scene={scene} derived={derived} ast={ast} playback={playback} fonts={fonts} />
                <EditorOverlay scene={scene} cssWidth={width} selected={live} locked={locked} onSelect={setSelected} onLayouts={actions.layouts} name={name} advanced={advanced} />
              </figure>
            </div>
            {transport && <div className="mx-7 border border-line bg-surface">{transport}</div>}
            {/* Cách thao tác bằng chuột/bàn phím: chỉ cho trình đọc màn hình (khung có aria-describedby); người xem đọc trong hướng dẫn sử dụng. */}
            <p id="editor-keys" className="sr-only">{i18n.t(advanced ? 'web.editor.keysAdv' : 'web.editor.keys')}</p>
          </div>
        ) : (
          <p className="mx-auto max-w-md pt-10 text-[13px] text-muted" data-testid="editor-empty">{i18n.t('web.editor.empty')}</p>
        )}
      </div>

      <aside aria-label={i18n.t('web.editor.properties')} className="relative min-h-0 overflow-y-auto border-t border-line bg-surface lg:border-l lg:border-t-0" data-testid="editor-props">
        <Properties scene={scene} selected={live} locked={locked} name={name} advanced={advanced} actions={actions} onLock={toggleLock} order={order} move={move} widgetSections={widgetSections} onPick={(id) => setSelected([id])} layoutRef={layoutRef}
          onDuplicate={duplicateSel} onRemove={removeSel} />
      </aside>
    </div>
  );
}

/** Hàng đầu danh sách Lớp: mắt và khoá tổng, đúng cột với dòng bên dưới; chỉ biểu tượng, chú thích khi rê (như hàng đầu danh sách track). */
function LayersHead({ widgets, locked, onAllVisible, onLockAll, onAdd }: { widgets: readonly WidgetSpec[]; locked: ReadonlySet<string>; onAllVisible(): void; onLockAll(): void; onAdd(type: WidgetType): void }) {
  const { i18n } = useI18n();
  const hiddenN = widgets.filter((w) => !w.visible).length, lockedN = widgets.filter((w) => locked.has(w.id)).length;
  const eyeLabel = i18n.t(hiddenN ? 'web.editor.allShow' : 'web.editor.allHide');
  const lockLabel = i18n.t(lockedN === widgets.length && widgets.length ? 'web.editor.allUnlock' : 'web.editor.allLock');
  const allLocked = lockedN === widgets.length && widgets.length > 0;
  return (
    <div role="group" aria-label={i18n.t('web.editor.layersHead')} className="flex items-center gap-1 pb-1 pl-2 pr-2" data-testid="layers-head">
      <span className="min-w-0 flex-1"><AddMenu onAdd={onAdd} /></span>
      <button type="button" className="tog" aria-pressed={hiddenN === widgets.length && hiddenN > 0 ? true : hiddenN ? 'mixed' : false} aria-label={eyeLabel} title={eyeLabel} onClick={onAllVisible} data-testid="layers-all-visible">
        {hiddenN === widgets.length && hiddenN > 0 ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className={`h-3.5 w-3.5 ${hiddenN ? 'opacity-50' : ''}`} />}
      </button>
      <button type="button" className="tog" aria-pressed={allLocked ? true : lockedN ? 'mixed' : false} aria-label={lockLabel} title={lockLabel} onClick={onLockAll} data-testid="layers-lock-all">
        {allLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className={`h-3.5 w-3.5 ${lockedN ? 'opacity-50' : ''}`} />}
      </button>
    </div>
  );
}

/** Nút "Thêm" ở đầu danh sách Lớp: mở danh sách loại widget (T-68). Phím: Enter/Space mở, ↑/↓ chọn, Esc đóng. */
function AddMenu({ onAdd }: { onAdd(type: WidgetType): void }) {
  const { i18n } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const items = () => [...(box.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]') ?? [])];
  const pick = (t: WidgetType) => { setOpen(false); onAdd(t); };
  return (
    <div ref={box} className="relative inline-block" onBlur={(e) => { if (!box.current?.contains(e.relatedTarget as Node)) setOpen(false); }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); box.current?.querySelector<HTMLButtonElement>('button')?.focus(); }
        if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && open) { e.preventDefault(); const l = items(), i = l.indexOf(document.activeElement as HTMLButtonElement); l[(i + (e.key === 'ArrowDown' ? 1 : -1) + l.length) % l.length]?.focus(); }
      }}>
      <button type="button" className="tog flex items-center gap-1 px-1.5 text-xs" aria-haspopup="menu" aria-expanded={open} onClick={() => { setOpen((o) => !o); requestAnimationFrame(() => items()[0]?.focus()); }}
        title={i18n.t('web.editor.add')} data-testid="layers-add"><Plus className="h-3.5 w-3.5" />{i18n.t('web.editor.add')}</button>
      {open && (
        <div role="menu" aria-label={i18n.t('web.editor.add')} className="absolute left-0 top-full z-20 mt-1 min-w-[11rem] border border-line bg-surface py-1 shadow-sm" data-testid="add-menu">
          {ADDABLE_WIDGETS.map((t) => (
            <button key={t} type="button" role="menuitem" className="block w-full px-3 py-1.5 text-left text-xs text-fg hover:bg-raised focus:bg-raised focus:outline-none" onClick={() => pick(t)}>
              {i18n.t(`web.widget.${t}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const ALIGN_ICONS: [AlignMode, (p: { className?: string }) => ReactNode][] = [['left', AlignLeft], ['hcenter', AlignHCenter], ['right', AlignRight], ['top', AlignTop], ['vcenter', AlignVCenter], ['bottom', AlignBottom]];
/** Căn chỉnh (T-68): một widget căn theo khung video, nhiều widget căn theo khung bao chung; chia đều khi chọn từ 3 widget. */
function AlignSection({ n, items, frame, onLayouts, locked }: { n: number; items: WidgetSpec[]; frame: { width: number; height: number }; onLayouts(p: Record<string, Partial<WidgetLayout>>): void; locked: ReadonlySet<string> }) {
  const { i18n } = useI18n();
  const free = items.filter((w) => !locked.has(w.id)).map((w) => ({ id: w.id, layout: w.layout }));
  const ib = `${btn} w-8 justify-center px-0`;
  return (
    <InspectorSection n={n} id="align" title={i18n.t('web.editor.align')}>
      <div className="flex gap-1" role="group" aria-label={i18n.t('web.editor.align')} data-testid="align">
        {ALIGN_ICONS.map(([m, Icon]) => {
          const label = i18n.t(`web.editor.align.${m}`) + (items.length === 1 ? ` (${i18n.t('web.editor.alignToFrame')})` : '');
          return <button key={m} type="button" className={ib} disabled={!free.length} aria-label={label} title={label} onClick={() => onLayouts(alignLayouts(free, m, frame))} data-testid={`align-${m}`}><Icon className="h-3.5 w-3.5" /></button>;
        })}
        {items.length > 1 && <span className="mx-0.5 w-px self-stretch bg-line" aria-hidden />}
        {items.length > 1 && (['x', 'y'] as const).map((ax) => {
          const label = i18n.t(`web.editor.distribute.${ax}`), Icon = ax === 'x' ? DistributeH : DistributeV;
          return <button key={ax} type="button" className={ib} disabled={free.length < 3} aria-label={label} title={label} onClick={() => onLayouts(distributeLayouts(free, ax))} data-testid={`distribute-${ax}`}><Icon className="h-3.5 w-3.5" /></button>;
        })}
      </div>
    </InspectorSection>
  );
}

const btn = 'flex min-h-[var(--hit)] items-center gap-1.5 rounded border border-control bg-raised px-2.5 text-xs font-medium text-fg transition hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-50';

function Properties({ scene, selected, locked, name, advanced, actions, onLock, order, move, widgetSections, onPick, layoutRef, onDuplicate, onRemove }: { onDuplicate(): void; onRemove(): void; layoutRef?: Record<string, WidgetLayout>; onPick(id: string): void; scene: SceneDocument; selected: string[]; locked: ReadonlySet<string>; name(id: string): string; advanced: boolean; actions: EditorActions; onLock(id: string): void; order: string[]; move(id: string, to: number): void; widgetSections?: Props['widgetSections'] }) {
  const { i18n } = useI18n();
  const ws = selected.map((id) => scene.widgets.find((w) => w.id === id)!).filter(Boolean);
  const { designWidth: W, designHeight: H } = scene.canvas;
  const snapping = (n: number) => (
    <InspectorSection n={n} id="snapping" title={i18n.t('web.editor.snapping')}>
      <label className="flex items-center gap-2 text-[13px] text-fg">
        <input type="checkbox" checked={scene.canvas.snapping.smartGuidesEnabled} onChange={(e) => actions.snapping({ smartGuidesEnabled: e.target.checked })} />
        {i18n.t('web.editor.guides')}
      </label>
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-[13px] text-fg">
          <input type="checkbox" checked={scene.canvas.snapping.gridEnabled} onChange={(e) => actions.snapping({ gridEnabled: e.target.checked })} />
          {i18n.t('web.editor.grid')}
        </label>
        <div className="seg" role="radiogroup" aria-label={i18n.t('web.editor.gridSize')}>
          {[8, 16].map((g) => (
            <button key={g} type="button" role="radio" aria-checked={scene.canvas.snapping.gridSize === g} className="seg-btn tabular-nums" disabled={!scene.canvas.snapping.gridEnabled}
              onClick={() => actions.snapping({ gridSize: g })}>{i18n.t('web.editor.pt', { n: g })}</button>
          ))}
        </div>
      </div>
    </InspectorSection>
  );

  const piano = scene.widgets.find((x) => x.type === 'PIANO_ROLL');
  if (!ws.length) return (
    <>
      <InspectorSection n={1} id="selection" title={i18n.t('web.editor.selection')}>
        <p className="text-xs leading-snug text-muted" data-testid="editor-noselection">{i18n.t('web.editor.noSelection')}</p>
        {/* Hình thức nốt chỉ còn ở Editor (D-57): lối tắt chọn Piano Roll để người mới không phải đoán. */}
        {piano && <button type="button" className={btn} onClick={() => onPick(piano.id)} data-testid="editor-open-look">{i18n.t('web.editor.openLook')}</button>}
      </InspectorSection>
      {snapping(2)}
    </>
  );

  if (ws.length > 1) return (
    <>
      <InspectorSection n={1} id="selection" title={i18n.t('web.editor.selectedMany', { n: ws.length })}>
        <p className="text-xs leading-snug text-muted">{ws.map((w) => name(w.id)).join(', ')}</p>
        <NumRow label={i18n.t('web.editor.rotateBy')}>
          <NumberField label={i18n.t('web.editor.rotateBy')} value={0} spec={{ min: -360, max: 360, step: 1 }}
            onChange={(d) => { const out = rotateGroup(ws.map((w) => w.layout), d); actions.layouts(Object.fromEntries(ws.map((w, i) => [w.id, round(out[i])]))); }} />
        </NumRow>
        <div className="flex gap-1.5">
          <button type="button" className={btn} onClick={onDuplicate} title={`${i18n.t('web.editor.duplicate')} (Ctrl+D)`} data-testid="duplicate"><Duplicate className="h-3.5 w-3.5" />{i18n.t('web.editor.duplicate')}</button>
          <button type="button" className={btn} onClick={onRemove} disabled={ws.every((x) => locked.has(x.id))} title={`${i18n.t('web.editor.remove')} (Delete)`} data-testid="remove"><Trash className="h-3.5 w-3.5" />{i18n.t('web.editor.remove')}</button>
        </div>
      </InspectorSection>
      <AlignSection n={2} items={ws} frame={{ width: W, height: H }} onLayouts={actions.layouts} locked={locked} />
      {snapping(3)}
    </>
  );

  const w = ws[0], l = w.layout, lk = locked.has(w.id), zi = order.indexOf(w.id);
  // Mục riêng của widget (Hình thức của Piano Roll) đứng ngay sau Vị trí: là thứ hay chỉnh nhất; các mục sau đánh số tiếp.
  const extra = (widgetSections?.(w, 2, lk) ?? []).filter(Boolean), k = extra.length;
  const set = (p: Partial<WidgetLayout>) => actions.layouts({ [w.id]: p });
  const ref = layoutRef?.[w.id];
  const field = (k: 'x' | 'y' | 'width' | 'height', label: string, min: number, max: number) => {
    const full = i18n.t(`web.editor.${k === 'width' ? 'w' : k === 'height' ? 'h' : k}`);
    return (
      <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_1.5rem] items-center gap-1.5 text-xs text-muted">
        <span aria-hidden className="text-center">{label}</span>
        <NumberField label={full} value={l[k]} spec={{ min, max, step: 1, units: { pt: 1 } }} disabled={lk} onChange={(v) => set({ [k]: v })} />
        {/* ↺ về bố cục của phong cách/preset áp gần nhất; chỉ hiện khi đã đổi. */}
        <ResetButton label={full} changed={!!ref && ref[k] !== l[k]} disabled={lk} onReset={() => set({ [k]: ref![k] })} />
      </div>
    );
  };
  return (
    <>
      {/* Tên widget đang chọn đứng riêng ở đầu bảng; mục 01 là "Vị trí và kích thước" như các mục khác. */}
      <header className="border-b border-line px-4 py-3" data-testid="editor-selected">
        <p className="text-xs text-muted">{i18n.t('web.editor.selectedLabel')}</p>
        <h2 className="truncate text-[17px] font-semibold text-fg" title={name(w.id)}>{name(w.id)}</h2>
      </header>
      <InspectorSection n={1} id="transform" title={i18n.t('web.editor.positionSize')}>
        {lk && (
          <div className="flex items-center justify-between gap-2 text-xs leading-snug text-muted" data-testid="editor-locked">
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 shrink-0" />{i18n.t('web.editor.lockedHint')}</span>
            <button type="button" className={btn} onClick={() => onLock(w.id)}>{i18n.t('web.editor.unlockBtn')}</button>
          </div>
        )}
        {w.visible && outsideFrame(l, W, H) && (
          <div className="flex items-start justify-between gap-2 border border-warning/60 bg-warning/10 px-2 py-1.5 text-xs leading-snug text-fg" role="status" data-testid="editor-outside">
            <span className="flex gap-1.5"><StatusIcon kind="warning" className="mt-px h-3.5 w-3.5 shrink-0 text-warning" />{i18n.t('web.editor.outsideHint')}</span>
            <button type="button" className={`${btn} shrink-0`} disabled={lk} onClick={() => set(intoFrame(l, W, H))}>{i18n.t('web.editor.bringIn')}</button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-x-2 gap-y-2" data-testid="editor-geometry">
          {field('x', 'X', -W, 2 * W)}{field('y', 'Y', -H, 2 * H)}
          {field('width', 'W', 1, 4 * W)}{field('height', 'H', 1, 4 * H)}
        </div>
      </InspectorSection>
      {extra}
      <InspectorSection n={2 + k} id="rotation" title={i18n.t('web.editor.rotation')}>
        {/* Cùng lưới với dòng số của Hình thức (nhãn | ô 4,5rem | ↺), nên các ô thẳng cột; ↺ chỉ hiện khi đã đổi. */}
        <NumRow label={i18n.t('web.editor.angle')} reset={<ResetButton label={i18n.t('web.editor.angle')} text={i18n.t('web.editor.resetRotation')} changed={l.rotation !== 0} disabled={lk} onReset={() => set({ rotation: 0 })} />}>
          <NumberField label={i18n.t('web.editor.angle')} value={l.rotation} spec={{ min: -360, max: 360, step: 1, units: { '°': 1, deg: 1 } }} disabled={lk}
            onChange={(v) => set({ rotation: normalizeAngle(v) })} />
        </NumRow>
        {/* Điểm neo là khái niệm của trình dựng chuyển động: chỉ ở Nâng cao (Cơ bản xoay quanh tâm). */}
        {advanced && <>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_1.5rem] items-center gap-2 text-xs text-muted">
            <span className="min-w-0 break-words leading-tight">{i18n.t('web.editor.anchor')}</span>
            <AnchorPicker value={l.anchor} disabled={lk} onChange={(a) => actions.layouts({ [w.id]: setAnchor(l, a) })} />
            <ResetButton label={i18n.t('web.editor.anchor')} text={i18n.t('web.editor.resetAnchor')} changed={l.anchor.x !== 0.5 || l.anchor.y !== 0.5} disabled={lk}
              onReset={() => actions.layouts({ [w.id]: setAnchor(l, { x: 0.5, y: 0.5 }) })} />
          </div>
          {(['x', 'y'] as const).map((ax) => (
            <NumRow key={ax} label={i18n.t(`web.editor.anchor${ax.toUpperCase()}`)}
              reset={<ResetButton label={i18n.t(`web.editor.anchor${ax.toUpperCase()}`)} changed={l.anchor[ax] !== 0.5} disabled={lk} text={i18n.t('web.editor.resetAnchorAxis', { name: i18n.t(`web.editor.anchor${ax.toUpperCase()}`) })}
                onReset={() => actions.layouts({ [w.id]: setAnchor(l, { ...l.anchor, [ax]: 0.5 }) })} />}>
              <NumberField label={i18n.t(`web.editor.anchor${ax.toUpperCase()}`)} value={Math.round(l.anchor[ax] * 100)} spec={{ min: 0, max: 100, step: 1, units: { '%': 1 } }} disabled={lk}
                onChange={(v) => actions.layouts({ [w.id]: setAnchor(l, { ...l.anchor, [ax]: v / 100 }) })} />
            </NumRow>
          ))}
        </>}
      </InspectorSection>
      <InspectorSection n={3 + k} id="arrange" title={i18n.t('web.editor.arrange')}>
        {/* Bốn nút một hàng, chỉ biểu tượng + chú thích khi rê (tên đầy đủ cho trình đọc màn hình); ở đầu/cuối thì nút tương ứng mờ. */}
        <div className="flex gap-1.5" role="group" aria-label={i18n.t('web.editor.arrange')} data-testid="arrange">
          {([
            ['front', ToFront, 'web.editor.toFront', 0, 'Ctrl+Shift+]'],
            ['up', LayerUp, 'web.editor.layerUp', zi - 1, 'Ctrl+]'],
            ['down', LayerDown, 'web.editor.layerDown', zi + 1, 'Ctrl+['],
            ['back', ToBack, 'web.editor.toBack', order.length - 1, 'Ctrl+Shift+['],
          ] as const).map(([k, Icon, key, to, keys]) => {
            const at = lk || (k === 'front' || k === 'up' ? zi === 0 : zi === order.length - 1);
            return (
              <button key={k} type="button" className={`${btn} w-9 justify-center px-0`} disabled={at} aria-label={i18n.t(key)} title={`${i18n.t(key)} (${keys})`}
                aria-keyshortcuts={keys.replace('Ctrl', 'Control')} onClick={() => move(w.id, to)} data-testid={`layer-${k}`}>
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
          <span className="mx-0.5 w-px self-stretch bg-line" aria-hidden />
          <button type="button" className={`${btn} w-9 justify-center px-0`} aria-label={i18n.t('web.editor.duplicate')} title={`${i18n.t('web.editor.duplicate')} (Ctrl+D)`} onClick={onDuplicate} data-testid="duplicate"><Duplicate className="h-3.5 w-3.5" /></button>
          <button type="button" className={`${btn} w-9 justify-center px-0`} disabled={lk} aria-label={i18n.t('web.editor.remove')} title={`${i18n.t('web.editor.remove')} (Delete)`} onClick={onRemove} data-testid="remove"><Trash className="h-3.5 w-3.5" /></button>
        </div>
        <label className="flex items-center gap-2 text-[13px] text-fg">
          <input type="checkbox" checked={w.visible} onChange={(e) => actions.visible(w.id, e.target.checked)} />{i18n.t('web.editor.visible')}
        </label>
        <label className="flex items-center gap-2 text-[13px] text-fg">
          <input type="checkbox" checked={lk} onChange={() => onLock(w.id)} />{i18n.t('web.editor.locked')}
        </label>
      </InspectorSection>
      <AlignSection n={4 + k} items={[w]} frame={{ width: W, height: H }} onLayouts={actions.layouts} locked={locked} />
      {snapping(5 + k)}
    </>
  );
}

/** Dòng số cùng lưới với SliderField (nhãn | ô 4,5rem | ↺ 1,5rem): các ô của Xoay, Neo và Hình thức thẳng một cột. */
function NumRow({ label, reset, children }: { label: string; reset?: ReactNode; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_4.5rem_1.5rem] items-center gap-2 text-xs text-muted">
      <span className="min-w-0 break-words leading-tight">{label}</span>
      <div className="min-w-0">{children}</div>
      {reset ?? <span aria-hidden />}
    </div>
  );
}

/** Ô chọn điểm neo 3 × 3 (góc, giữa cạnh, tâm): nhóm radio, phím mũi tên đi theo lưới. */
function AnchorPicker({ value, disabled, onChange }: { value: { x: number; y: number }; disabled?: boolean; onChange(a: { x: number; y: number }): void }) {
  const { i18n } = useI18n();
  const pts = [0, 0.5, 1].flatMap((y) => [0, 0.5, 1].map((x) => ({ x, y })));
  const cur = pts.findIndex((p) => Math.abs(p.x - value.x) < 1e-3 && Math.abs(p.y - value.y) < 1e-3);
  const key = (e: React.KeyboardEvent, i: number) => {
    const d = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3 }[e.key];
    if (d === undefined) return;
    e.preventDefault();
    const j = i + d; if (j < 0 || j > 8 || (Math.abs(d) === 1 && Math.floor(j / 3) !== Math.floor(i / 3))) return;
    onChange(pts[j]); (e.currentTarget.parentElement?.children[j] as HTMLElement | undefined)?.focus();
  };
  return (
    <div role="radiogroup" aria-label={i18n.t('web.editor.anchor')} className="grid w-[5.25rem] grid-cols-3 gap-px rounded border border-control bg-control p-px" data-testid="anchor-picker">
      {pts.map((p, i) => {
        const on = i === cur;
        return (
          <button key={i} type="button" role="radio" aria-checked={on} disabled={disabled} tabIndex={on || (cur < 0 && i === 4) ? 0 : -1}
            aria-label={i18n.t(`web.editor.anchorPt.${i}`)} title={i18n.t(`web.editor.anchorPt.${i}`)} onClick={() => onChange(p)} onKeyDown={(e) => key(e, i)}
            className="grid h-6 place-items-center bg-raised transition hover:bg-selection disabled:cursor-not-allowed">
            <span aria-hidden className={`block rounded-full ${on ? 'h-2 w-2 bg-fg' : 'h-1 w-1 bg-faint'}`} />
          </button>
        );
      })}
    </div>
  );
}

