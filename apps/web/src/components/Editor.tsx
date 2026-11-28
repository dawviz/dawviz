// Thẻ Editor (T-68, UI-DIRECTION 5.3 mục 3, SRS 5.3 Edit Mode): bố cục widget trên khung video.
// Sân khấu có lớp tương tác + thanh phát | "Thuộc tính" đánh số (cao hết màn hình). Dưới sân khấu là Timeline (D-69): tầng 1 là timeline lớp
// (LayerTimeline: mỗi lớp một hàng, mỗi khoảng hiển thị một thanh, thay cho danh sách Lớp cũ), tầng 2 là keyframe của một lớp (KeyframeTimeline).
// Precomp: Editor làm việc trên khung nhìn của comp đang mở (App truyền `scene` = khung nhìn, `root` = scene gốc). D-57 (một dữ liệu, hai cách bày bảng): chọn Piano Roll thì bảng Thuộc tính có luôn mục Hình thức — cùng
// thành phần và cùng lệnh với inspector của Preview (App truyền vào qua `widgetSections`).
// Khoá là trạng thái của phiên chỉnh sửa (không vào preset video, không vào lịch sử); ẩn/hiện, vị trí, cỡ, góc, neo, thứ tự lớp
// và bắt dính đều là lệnh hoàn tác được (lib/commands.ts).
import { Suspense, lazy, useContext, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ADDABLE_WIDGETS, COMP_SEP, IDENTITY_TIME, buildHud, chordTimeline, MAX_COMP_DEPTH, MAX_COMPS, MAX_FLAT_WIDGETS, canPlaceComp, compOf, newCompId, resolveCompPath, isKeyAnim, defaultScene, normalizeAngle, rotateGroup, type Animation, type Derived, type NoteNaming, type WidgetMotion, type Phase, type SceneDocument, type UnifiedProjectAST, type WidgetLayout, type WidgetSpec, type WidgetType, type WidgetVisibility, type BackgroundImageSpec } from '@dawviz/render-core';
import { startPaintDrag } from '../lib/paintDrag.ts';
import { GestureContext } from '../lib/storeReact.ts';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { menuWidgets, type TextTemplate } from '../lib/textTemplates.ts';
import { TextDialog, templateLabelKey } from './TextDialog.tsx';
import { projectLanes } from '../lib/animateFields.ts';
import type { Playback } from '../lib/playback.ts';
import type { FontsStatus } from '../lib/fonts.ts';
import { STAGE_CHROME, useStageWidth } from '../lib/useStageWidth.ts';
import { alignLayouts, distributeLayouts, hasCanvasFrame, intoFrame, outsideFrame, round, setAnchor, type AlignMode } from '../lib/editorGeometry.ts';
import { LiveCanvas } from './Stage.tsx';
import { AspectSwitch, frameInfo } from './AspectSwitch.tsx';
import { Crop } from './Stage.tsx';
import { InspectorSection, ResetButton, TickField } from './Inspector.tsx';
import { SearchEmpty, SettingsSearchBox } from './SettingsSearch.tsx';
import { NumberField } from './NumberField.tsx';
import { AlignBottom, AlignHCenter, AlignLeft, AlignRight, AlignTop, AlignVCenter, Diamond, DistributeH, DistributeV, Duplicate, LayerDown, LayerUp, Lock, PanelRight, Plus, Precomp, ToBack, ToFront, Trash } from './Icons.tsx';
import { isTextEntry } from '../lib/a11y.ts';
import { layerOrder, parentCandidates, type AnimEdit, type Doc, type LayerEdit } from '../lib/commands.ts';
import { refKey } from '../lib/compLens.ts';
import { clipsOf, newCompName, precompose, splitLayer, uncompose } from '../lib/layerTimeline.ts';
import { formatClock } from '../lib/timeFormat.ts';
import { LayerTimeline, type TrackEdit } from './LayerTimeline.tsx';
import { createPortal } from 'react-dom';
import { ConfirmDialog } from './ConfirmDialog.tsx';
import { useMenuPlacement } from '../lib/useMenuPlacement.ts';
import { Select } from './Select.tsx';
import { checkLayerName } from '../lib/layerName.ts';
import { MAX_WIDGET_NAME } from '@dawviz/render-core';
import { StatusIcon } from './StatusIcon.tsx';
import { BackgroundSection, type BackgroundState } from './BackgroundSection.tsx';
import { AnimationInspector, hasInspectorTarget } from './AnimationInspector.tsx';
import { LiveLayout, LiveOverlay, type LiveCtx } from './LiveLayout.tsx';
import { addKey, setKey } from '../lib/animateFields.ts';
import { keyAt, keySecs, valueAt } from '../lib/timeline.ts';
import { Splitter } from './Splitter.tsx';
import { TimelinePanel, type TimelineView } from './TimelinePanel.tsx';
import { KeyframeTimeline, NO_SEL, type KeySel } from './KeyframeTimeline.tsx';
import { usePanelLayout, usePanelShortcuts } from '../lib/usePanelLayout.ts';
import { PanelCollapse, Rail } from './PanelChrome.tsx';
import { PANEL_LIMITS } from '../lib/panelLayout.ts';
import { KeySection, MotionSection, NamingSection } from './TimeSections.tsx';
// Graph Editor (T-33): chỉ nạp khi người dùng chuyển Timeline sang chế độ Đồ thị.
const GraphEditor = lazy(() => import('./GraphEditor.tsx').then((m) => ({ default: m.GraphEditor })));
const TL_VIEW_KEY = 'dawviz.timelineView';
const readTlView = (): TimelineView => { try { return localStorage.getItem(TL_VIEW_KEY) === 'graph' ? 'graph' : 'list'; } catch { return 'list'; } };

/** Mốc ↺ của mục Bắt dính: giá trị mặc định của canvas (scene mới). */
const SNAP_DEFAULT = defaultScene().canvas.snapping;

/** Vùng đệm quanh khung (px): tay nắm của widget chạm mép hoặc ra ngoài khung vẫn có chỗ, không vẽ đè thanh phát. */
const PASTEBOARD = 28;


type Patches = Record<string, Partial<WidgetLayout>>;
export interface EditorActions {
  layouts(p: Patches): void;
  /** Đổi tỉ lệ khung (9:16 / 1:1 / 16:9): widget co giãn theo tỉ lệ, một bước hoàn tác. */
  aspect(aspect: string): void;
  /** Đặt cỡ khung tuỳ ý (pt, 256–4096 mỗi cạnh); widget co giãn theo tỉ lệ, một bước hoàn tác. */
  canvasSize(width: number, height: number): void;
  /** Đổi tên lớp; null = bỏ tên riêng (dùng tên theo loại). Tên đã được kiểm không trùng. */
  rename(id: string, name: string | null): void;
  visible(id: string, v: boolean): void;
  /** Đặt/bỏ widget cha (parenting). */
  parent(id: string, parent: string | null): void;
  /** Kéo qua các mắt của Lớp: đặt giá trị cho từng lớp đi qua (gộp trong cử chỉ kéo). */
  paintVisible(id: string, v: boolean): void;
  /** Ô mắt ở hàng đầu Lớp: còn lớp ẩn thì hiện hết, không thì ẩn hết. */
  allVisible(): void;
  z(id: string, where: 'front' | 'back'): void;
  /** Đưa lớp tới vị trí `to` của danh sách Lớp (0 = trên cùng). */
  moveLayer(id: string, to: number): void;
  snapping(p: Partial<SceneDocument['canvas']['snapping']>): void;
  /** Khoảng hiển thị theo thời gian của widget; null = hiện suốt bài. `key` gộp các lần chỉnh liên tiếp cùng một ô. */
  visibility(id: string, v: WidgetVisibility | null, key?: string): void;
  motion(id: string, v: WidgetMotion | null, key?: string): void;
  animate(id: string, path: string, v: Animation | null, key?: string): void;
  /** Sửa bố cục tĩnh + nhiều hoạt hình của nhiều widget trong một lệnh (lib/commands.ts editWidgetAnimation). */
  animEdit(edits: Record<string, AnimEdit>, key?: string): void;
  /** Phase của bài (đã sắp theo thời điểm bắt đầu). */
  phases(list: Phase[], key?: string): void;
  /** Nốt chủ của bài (0 = C … 11 = B); null = chưa đặt. */
  tonic(t: number | null): void;
  noteNaming(n: NoteNaming | null): void;
  /** Ảnh nền của phiên (T-21): nạp, bỏ, đổi cách đặt. */
  background: { pick(f: File): void; remove(): void; spec(p: Partial<BackgroundImageSpec>): void };
  /** Thêm widget loại `type` (T-68); `props` ghi đè thuộc tính mặc định (mẫu của hộp thoại Chữ, cũng là mốc ↺ của widget mới). Trả id mới để chọn ngay. */
  add(type: WidgetType, props?: Record<string, unknown>): string;
  /** Nhân bản; trả id các bản sao. */
  duplicate(ids: string[]): string[];
  remove(ids: string[]): void;
  /** Timeline lớp (D-69): thay danh sách lớp (dời/cắt/tách thanh, gom precomp) trong một lệnh; `key` gộp cả lần kéo. */
  layers(kind: LayerEdit, next: { widgets: WidgetSpec[]; comps?: SceneDocument['comps']; layoutRef?: Doc['layoutRef']; propsRef?: Doc['propsRef'] }, key?: string): void;
  /** Đổi tên một precomp trong sổ comp. */
  renameComp(comp: string, name: string): void;
  /** Doc như Editor đang thấy (khung nhìn của precomp đang mở), đọc tại lúc gọi. */
  view(): Doc;
}
interface Props {
  /** Khung bản in thử (dấu cắt quanh khung): tắt ở Cài đặt thì ẩn ở mọi nơi (T-117). Mặc định bật. */
  proof?: boolean;
  /** Tên phong cách video đang dùng (dòng thông số trên khung, như thẻ Xem trước). */
  styleName?: string;
  /** Khung nhìn đang mở: scene gốc, hoặc nội dung của precomp ở cuối `compPath` (mốc thời gian theo toàn bài). */
  scene: SceneDocument;
  /** Scene gốc (breadcrumb, phase, sổ comp). */
  root: SceneDocument;
  /** Precomp đang mở: id các lớp COMP từ gốc vào trong; [] = gốc. */
  compPath: string[];
  onCompPath(path: string[]): void;
  /** Tăng mỗi lần một lệnh bị chặn vì vượt trần số lớp sau khi trải precomp. */
  flatFull?: number;
  derived: Derived | null; ast: UnifiedProjectAST | null; playback: Playback; fonts: FontsStatus;
  advanced: boolean; actions: EditorActions;
  /** Thanh phát (dùng chung với Preview), đặt ngay dưới khung. */
  transport?: ReactNode;
  /** Thẻ đang mở (để đo lại bề rộng khi hiện). */
  active: boolean;
  /** Mục thêm của bảng Thuộc tính cho widget đang chọn (vd. Hình thức của Piano Roll), đánh số tiếp từ `n`. */
  widgetSections?(w: WidgetSpec, n: number, locked: boolean): ReactNode[];
  /** Bố cục của phong cách/preset áp gần nhất (đích của nút ↺ ở X, Y, W, H). */
  layoutRef?: Record<string, WidgetLayout>;
  /** Trạng thái ảnh nền của phiên. */
  background?: BackgroundState;
  /** Khoá track ở làn Nhạc của timeline (D-57, T-52): trạng thái phiên do App giữ (bảng Track cũng đọc). */
  trackLocks?: ReadonlySet<string>;
  onLockTrack?(id: string): void;
  /** Chỉnh track trên làn Nhạc của timeline (T-127): cùng Doc và lệnh với danh sách Track ở Xem trước. */
  trackEdit?: TrackEdit;
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
      names.set(w.id, w.name ?? ((count.get(w.type) ?? 0) > 1 ? `${base} ${n}` : base));
    }
    return (id: string) => names.get(id) ?? id;
  }, [widgets, i18n]);
}

export function Editor({ proof = true, styleName, scene, root, compPath, onCompPath, flatFull, derived: derived0, ast, playback, fonts, advanced, actions, transport, active, widgetSections, layoutRef, background, trackLocks, onLockTrack, trackEdit }: Props) {
  const { i18n } = useI18n();
  const [selected, setSelected] = useState<string[]>([]);
  const [locked, setLocked] = useState<ReadonlySet<string>>(new Set());
  const name = useWidgetNames(scene.widgets);
  const live = selected.filter((id) => scene.widgets.some((w) => w.id === id)); // widget mất đi (mở preset khác, đổi precomp) thì bỏ khỏi chọn
  // Khoá chỉ chặn chỉnh trên khung và timeline; widget khoá vẫn chọn được để xem số và mở khoá.
  const toggleLock = (id: string) => setLocked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  // Ô khoá tổng: còn lớp chưa khoá thì khoá hết, đã khoá hết thì mở hết (cùng quy tắc với ô mắt).
  const lockAll = () => setLocked(() => (scene.widgets.every((w) => locked.has(w.id)) ? new Set() : new Set(scene.widgets.map((w) => w.id))));
  const { designWidth: W, designHeight: H } = scene.canvas;
  // Kéo qua các mắt/khoá của cột lớp để ẩn hoặc khoá nhanh (lib/paintDrag.ts). Cả lần kéo là một bước hoàn tác (mắt); khoá không vào lịch sử.
  const gestureCtx = useContext(GestureContext);
  // Cùng cử chỉ cho làn Nhạc: mắt ('hide'), S ('solo') và khoá ('tlock') của track, đặt qua lệnh của App (một bước hoàn tác cho cả lần kéo).
  const paintRef = useRef({ scene, locked, actions, trackEdit, trackLocks }); paintRef.current = { scene, locked, actions, trackEdit, trackLocks };
  const paintLayers = (e: React.PointerEvent<HTMLElement>) => startPaintDrag(e, {
    current: (kind, id) => {
      const r = paintRef.current;
      if (kind === 'hide') return !!r.trackEdit?.view.hidden.has(id);
      if (kind === 'solo') return !!r.trackEdit?.view.solo.has(id);
      if (kind === 'tlock') return !!r.trackLocks?.has(id);
      return kind === 'eye' ? !r.scene.widgets.find((w) => w.id === id)?.visible : r.locked.has(id);
    },
    apply: (kind, id, on) => {
      if (kind === 'hide' || kind === 'solo') paintRef.current.trackEdit?.onPaint(kind, id, on);
      else if (kind === 'tlock') paintRef.current.trackEdit?.onSetLock(id, on);
      else if (kind === 'eye') paintRef.current.actions.paintVisible(id, !on);
      else setLocked((s) => { if (s.has(id) === on) return s; const n = new Set(s); if (on) n.add(id); else n.delete(id); return n; });
    },
    gesture: gestureCtx ?? undefined,
  });

  // Precomp đang mở (D-69): breadcrumb, khoảng hiện của lớp precomp (làm mờ phần ngoài trên timeline) và Bản nhạc dựng theo id đã trải phẳng của gốc.
  const frames = useMemo(() => resolveCompPath(root, compPath), [root, compPath]);
  const prefix = compPath.length ? compPath.join(COMP_SEP) + COMP_SEP : '';
  const derived = useMemo(() => {
    if (!derived0 || !prefix || !derived0.notation) return derived0;
    const m = new Map(derived0.notation);
    for (const [id, l] of derived0.notation) if (id.startsWith(prefix)) m.set(id.slice(prefix.length), l);
    return { ...derived0, notation: m };
  }, [derived0, prefix]);
  const duration = derived?.index.duration ?? 0;
  const bounds = useMemo(() => {
    const f = frames.at(-1); if (!f) return null;
    const pm = frames.at(-2)?.map ?? IDENTITY_TIME; // khoảng của lớp precomp tính theo comp cha → đổi sang thời gian toàn bài
    return clipsOf(f.layer, duration).map((c) => ({ from: pm.a * c.from + pm.b, to: c.open ? duration : pm.a * c.to + pm.b }));
  }, [frames, duration]);
  const compName = (f: { layer: WidgetSpec; spec: { name: string } }) => f.layer.name ?? f.spec.name;
  // Làn tham chiếu nhạc của timeline lớp: nốt từng track (dữ liệu đã có trong chỉ mục) và hợp âm của mọi track, dò một lần mỗi dự án.
  const index = derived0?.index;
  const lanes = useMemo(() => projectLanes(ast?.tracks ?? []), [ast]); // nguồn "Theo nhạc" theo lane automation (T-66)
  const music = useMemo(() => (ast && index ? { tracks: index.tracks, chords: chordTimeline(buildHud(ast, index, [{ tracks: index.tracks, mode: 'sustained' }]), index.tracks) } : undefined), [ast, index]);
  const openComp = (layerId: string) => { onCompPath([...compPath, layerId]); setSelected([]); setKeysOpen(false); setSay(i18n.t('web.comp.opened', { name: name(layerId) })); };
  const goUp = (depth: number) => { const back = compPath[depth]; onCompPath(compPath.slice(0, depth)); setSelected(back ? [back] : []); setKeysOpen(false); };

  const scrollerRef = useRef<HTMLDivElement>(null), stageRef = useRef<HTMLDivElement>(null);
  const width = useStageWidth(scrollerRef, stageRef, { aspect: scene.canvas.designWidth / scene.canvas.designHeight, chrome: STAGE_CHROME.editor + 48 + 2 * PASTEBOARD, extra: 2 * PASTEBOARD, active: active && !!derived });

  // Danh sách lớp: trên cùng trước (zIndex giảm dần; cùng zIndex thì đứng sau trong tài liệu được vẽ sau, nên đứng trước ở đây).
  const order = useMemo(() => layerOrder(scene), [scene]);
  const [say, setSay] = useState('');
  // Lớp đã khoá đứng yên trong danh sách (như After Effects): không kéo, không lên/xuống. Lớp khác vẫn đổi chỗ quanh nó.
  const move = (id: string, to: number) => {
    if (locked.has(id)) return;
    const dest = Math.max(0, Math.min(order.length - 1, to));
    if (dest === order.indexOf(id)) return;
    actions.moveLayer(id, dest);
    setSay(i18n.t('web.editor.layerDropped', { name: name(id), n: dest + 1 }));
  };
  // Delete/Backspace: xoá; Ctrl/⌘+D: nhân bản (lớp khoá không bị xoá/nhân bản). Ctrl/⌘ + ] / [ : lên/xuống một bậc; thêm Shift: lên trên cùng / xuống dưới cùng.
  const removeSel = () => { const ids = live.filter((id) => !locked.has(id)); if (ids.length) { actions.remove(ids); setSelected(live.filter((id) => locked.has(id))); setSay(i18n.t('web.editor.removed', { n: ids.length })); } };
  const duplicateSel = () => {
    const ids = live.filter((id) => !locked.has(id)); if (!ids.length) return;
    const made = actions.duplicate(ids); setSelected(made);
    if (made.length < ids.length) note(i18n.t('web.comp.copyLimit', { max: MAX_COMPS })); // precomp nhân bản là bản độc lập: vượt số precomp tối đa thì không làm
  };
  const deselect = () => { setSelected([]); setSay(i18n.t('web.editor.deselected')); };
  const selectAll = () => { setSelected(order); setSay(i18n.t('web.editor.selectedAll', { n: order.length })); };
  // Đổi tên lớp (nhấp đúp hoặc F2): Enter/rời ô thì áp, Esc bỏ. Trống = về tên theo loại. Trùng tên lớp khác: giữ tên cũ và báo lý do.
  // Lớp precomp: đổi tên lớp là đổi tên của chính precomp đó.
  const [editing, setEditing] = useState<string | null>(null);
  const [nameErr, setNameErr] = useState('');
  const commitName = (id: string, raw: string) => {
    setEditing(null);
    const r = checkLayerName(raw, id, order, name);
    if (!r.ok) {
      const msg = i18n.t(r.reason === 'tooLong' ? 'web.editor.nameTooLong' : 'web.editor.nameTaken', { name: r.name, old: name(id), max: MAX_WIDGET_NAME });
      setNameErr(msg); setSay(msg); return;
    }
    setNameErr('');
    const w = scene.widgets.find((x) => x.id === id), cur = w?.name ?? null, c = w && compOf(w);
    if (r.value === cur || (r.value !== null && r.value === name(id) && cur === null)) return; // không đổi gì
    actions.rename(id, r.value);
    if (c && r.value) actions.renameComp(c.comp, r.value);
    setSay(i18n.t(r.value === null ? 'web.editor.nameReset' : 'web.editor.renamed', { name: r.value ?? '' }));
  };
  const addWidget = (type: WidgetType) => { setSelected([actions.add(type)]); setSay(i18n.t('web.editor.added', { name: i18n.t(`web.widget.${type}`) })); };
  // Hộp thoại Chữ (D-78, T-138): mọi widget chữ thêm qua đây.
  const [textDlg, setTextDlg] = useState(false);
  const addTemplate = (tpl: TextTemplate) => { setTextDlg(false); setSelected([actions.add(tpl.type, tpl.props)]); setSay(i18n.t('web.editor.added', { name: i18n.t(templateLabelKey(tpl)) })); };

  // ── tách lớp và gom precomp (D-69) ──
  const [tlNote, setTlNote] = useState('');
  const note = (msg: string) => { setTlNote(msg); setSay(msg); };
  useEffect(() => { if (flatFull) note(i18n.t('web.comp.tooMany', { max: MAX_FLAT_WIDGETS })); }, [flatFull]); // eslint-disable-line react-hooks/exhaustive-deps
  const splitSel = () => {
    const t = playback.get().t, ids = live.filter((id) => !locked.has(id));
    if (!ids.length) return;
    const v = actions.view();
    let sc = v.scene; const copies: WidgetSpec[] = [], lr = { ...v.layoutRef }, pr = { ...v.propsRef };
    for (const id of ids) {
      const r = splitLayer(sc, id, t, duration); if (!r) continue;
      sc = { ...sc, widgets: r.widgets }; copies.push(r.copy);
      if (v.layoutRef[id]) lr[r.copy.id] = v.layoutRef[id];
      if (v.propsRef[id]) pr[r.copy.id] = v.propsRef[id];
    }
    if (!copies.length) { note(i18n.t('web.layers.splitNone')); return; }
    actions.layers('splitLayer', { widgets: sc.widgets, layoutRef: lr, propsRef: pr });
    setSelected(copies.map((w) => w.id)); setTlNote('');
    setSay(i18n.t('web.layers.splitDone', { n: copies.length, time: formatClock(t) }));
  };
  const precomposeSel = () => {
    const ids = live.filter((id) => !locked.has(id));
    if (!ids.length) return;
    const v = actions.view(), compId = newCompId(root);
    const cname = newCompName(v.scene, i18n.t('web.comp.defaultName'), order.map(name));
    const r = precompose(v.scene, ids, frames.at(-1)?.map ?? IDENTITY_TIME, compId, cname); if (!r) return;
    if (!canPlaceComp(r.comps, compId, frames.map((f) => f.comp))) { note(i18n.t('web.comp.tooDeep', { max: MAX_COMP_DEPTH })); return; }
    const moveRefs = <V,>(refs: Record<string, V>) => { const out = { ...refs }; for (const id of ids) if (id in out) { out[refKey(compId, id)] = out[id]; delete out[id]; } return out; };
    actions.layers('precompose', { widgets: r.widgets, comps: r.comps, layoutRef: moveRefs(v.layoutRef), propsRef: moveRefs(v.propsRef) });
    setSelected([r.layer.id]); setTlNote('');
    setSay(i18n.t('web.comp.created', { name: cname, n: ids.length }));
  };

  // Gỡ precomp (Ctrl+Shift+G): các lớp bên trong ra lại timeline đang mở, đúng chỗ và đúng thời gian. Chỉ khi sẽ MẤT hoạt hình của chính lớp precomp
  // (keyframe, chuyển động, tỉ lệ, hiện/ẩn dần không chuyển sang lớp con được) mới hỏi xác nhận (T-120); còn lại làm ngay, hoàn tác được.
  const [askUncompose, setAskUncompose] = useState<string | null>(null);
  const doUncompose = (id: string) => {
    const w = scene.widgets.find((x) => x.id === id);
    if (!w || !compOf(w) || locked.has(w.id)) return;
    const v = actions.view(), r = uncompose(v.scene, w.id, duration); if (!r) return;
    const move = <V,>(refs: Record<string, V>) => { const out = { ...refs }; for (const [from, to] of r.refs) if (from in refs) out[to] = refs[from]; return out; };
    actions.layers('uncompose', { widgets: r.widgets, layoutRef: move(v.layoutRef), propsRef: move(v.propsRef) });
    setSelected(r.added);
    setTlNote(''); // mất hoạt hình đã được hỏi trước khi gỡ (hộp thoại xác nhận): không báo thêm trên Timeline
    setSay(i18n.t('web.comp.uncomposed', { name: name(w.id), n: r.added.length }));
  };
  const uncomposeSel = () => {
    const id = live.length === 1 ? live[0] : null, w = id && scene.widgets.find((x) => x.id === id);
    if (!w || !compOf(w) || locked.has(w.id)) return;
    const r = uncompose(actions.view().scene, w.id, duration); if (!r) return;
    if (r.lost) setAskUncompose(w.id); else doUncompose(w.id);
  };
  // Tốc độ phát của precomp (%, 10–1000). Ô số ghi tốc độ so với comp cha; khung nhìn lưu theo thời gian toàn bài nên đổi qua phép đổi thời gian của comp đang mở.
  const frameA = frames.at(-1)?.map.a ?? 1;
  const setCompSpeed = (id: string, pct: number) => {
    const v = actions.view(), w = v.scene.widgets.find((x) => x.id === id), c = w && compOf(w); if (!w || !c) return;
    const speed = Math.min(10, Math.max(0.1, Math.round(pct) / 100)) / frameA;
    actions.layers('compSpeed', { widgets: v.scene.widgets.map((x) => (x.id === id ? { ...x, properties: { ...c, speed: Math.round(speed * 1e6) / 1e6 } } : x)) }, `speed:${id}`);
  };
  const onKeys = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyG' && !isTextEntry(e.target)) { e.preventDefault(); uncomposeSel(); return; }
    if (isTextEntry(e.target) || e.altKey) return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && !e.ctrlKey && !e.metaKey && live.length) { e.preventDefault(); removeSel(); return; }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyD' && live.length) { e.preventDefault(); duplicateSel(); return; }
    if ((e.ctrlKey || e.metaKey) && e.code === 'KeyA' && !e.shiftKey) { e.preventDefault(); selectAll(); return; }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyK' && live.length) { e.preventDefault(); splitSel(); return; }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyG' && live.length) { e.preventDefault(); precomposeSel(); return; }
    if (e.key === 'Escape') {
      if (keysOpen) { e.preventDefault(); setKeysOpen(false); return; }
      if (live.length) { e.preventDefault(); deselect(); return; }
      if (compPath.length) { e.preventDefault(); goUp(compPath.length - 1); return; }
      return;
    }
    if (e.key === 'F2' && live.length === 1) { e.preventDefault(); setEditing(live[0]); return; }
    if (!(e.ctrlKey || e.metaKey) || live.length !== 1) return;
    const k = e.code === 'BracketRight' ? 1 : e.code === 'BracketLeft' ? -1 : 0;
    if (!k) return;
    e.preventDefault();
    const id = live[0], i = order.indexOf(id);
    move(id, e.shiftKey ? (k > 0 ? 0 : order.length - 1) : i - k);
  };

  // Ctrl/⌘+G và Ctrl/⌘+Shift+G khi tiêu điểm đã rơi ra thân trang (sau khi gom, nút vừa bấm biến mất): nếu không bắt ở đây thì trình duyệt mở "Tìm trong trang".
  const keysRef = useRef(onKeys); keysRef.current = onKeys;
  useEffect(() => {
    if (!active) return;
    const h = (ev: globalThis.KeyboardEvent) => {
      if (ev.defaultPrevented || ev.code !== 'KeyG' || !(ev.ctrlKey || ev.metaKey) || ev.altKey || isTextEntry(ev.target)) return;
      if ((ev.target as HTMLElement | null)?.closest?.('[role="dialog"], [role="alertdialog"]')) return;
      keysRef.current(ev as unknown as KeyboardEvent<HTMLDivElement>);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [active]);

  // Bố cục panel đổi cỡ (lib/panelLayout.ts): sân khấu | Thiết lập (cao hết); Timeline ở đáy dưới sân khấu (D-69: cột Lớp nằm trong Timeline).
  // Dưới 1024 px các khối xếp dọc như trước; thanh chia ẩn đi.
  const panels = usePanelLayout(advanced), { r } = panels;
  const keyHint = (label: string, keys: string) => `${label} (${keys})`;
  // Ctrl/⌘+Alt+B: Thiết lập · Ctrl/⌘+J: Timeline (như VS Code). Chỉ khi thẻ Editor đang mở và không gõ chữ.
  usePanelShortcuts(panels, active, true, false);
  // Sửa bố cục từ khung hoặc ô số (D-64, như After Effects): thuộc tính đang có keyframe thì đặt/sửa keyframe tại vạch phát;
  // đang chạy theo nhạc thì bỏ qua (không sửa được trên khung); đứng yên thì đổi bố cục tĩnh như cũ. Một lệnh mỗi lần → một bước hoàn tác cho cả lần kéo.
  const liveCtx = useMemo<LiveCtx | null>(() => (derived && ast ? { ast, derived, playback } : null), [ast, derived, playback]);
  const editLayouts = (patches: Patches) => {
    const t = playback.get().t, edits: Record<string, AnimEdit> = {};
    let keyed = false;
    for (const [id, p] of Object.entries(patches)) {
      const w = scene.widgets.find((x) => x.id === id); if (!w) continue;
      const layout: Record<string, unknown> = {}, animate: Record<string, Animation> = {};
      for (const [f, v] of Object.entries(p)) {
        const a = f === 'anchor' ? undefined : w.animate?.[`layout.${f}`];
        if (!a) { layout[f] = v; continue; }
        if (!isKeyAnim(a)) continue; // gắn theo nhạc hoặc biểu thức: kéo trên khung không đặt keyframe
        const tm = ast?.tempoMap ?? [];
        // Trường không đổi so với giá trị đang thấy (vd. x/y đi kèm khi đổi điểm neo) không sinh keyframe thừa.
        if (Math.abs(Number(valueAt(a, t, tm)) - Number(v)) < 1e-6) continue;
        const i = keyAt(keySecs(a, tm), t);
        animate[`layout.${f}`] = i >= 0 ? setKey(a, i, { value: v as number }) : addKey(a, t, v as number);
        keyed = true;
      }
      edits[id] = { ...(Object.keys(layout).length ? { layout: layout as Partial<WidgetLayout> } : {}), ...(Object.keys(animate).length ? { animate } : {}) };
    }
    if (keyed) actions.animEdit(edits, 'canvas'); else actions.layouts(patches);
  };

  // Tầng 2 (keyframe của một lớp): mở bằng nhấp đúp thanh, nút ◆ của dòng hoặc Enter; Esc hay breadcrumb quay về timeline lớp.
  const [keysOpen, setKeysOpen] = useState(false);
  const single = live.length === 1 ? scene.widgets.find((w) => w.id === live[0]) ?? null : null;
  const openKeys = (id: string) => { setSelected([id]); setKeysOpen(true); if (!r.open.timeline) panels.setOpen('timeline', true); };
  // Vùng chọn của Timeline keyframe (keyframe + hàng thuộc tính), gắn với widget đang chọn: đổi widget thì vùng chọn cũ không còn hiệu lực.
  const [keySelRaw, setKeySel] = useState<{ id: string; sel: KeySel }>({ id: '', sel: NO_SEL });
  const keySel = single && keySelRaw.id === single.id ? keySelRaw.sel : NO_SEL;
  const onKeySel = (s: KeySel) => { if (single) setKeySel({ id: single.id, sel: s }); };
  const [tlView, setTlViewRaw] = useState<TimelineView>(readTlView);
  const setTlView = (v: TimelineView) => { setTlViewRaw(v); try { localStorage.setItem(TL_VIEW_KEY, v); } catch { /* chặn lưu: chỉ nhớ trong phiên */ } };
  const vars = { '--ed-r': `${r.props}px`, '--ed-t': `${r.timeline}px` } as React.CSSProperties;
  const crumbs = [{ label: i18n.t('web.comp.root'), onClick: compPath.length || keysOpen ? () => goUp(0) : undefined },
    ...frames.map((f, k) => ({ label: compName(f), onClick: k < frames.length - 1 || keysOpen ? () => (k < frames.length - 1 ? goUp(k + 1) : setKeysOpen(false)) : undefined })),
    ...(keysOpen && single ? [{ label: i18n.t('web.layers.keysOf', { name: name(single.id) }) }] : [])];

  return (
    <div ref={panels.ref} style={vars} data-testid="editor" onKeyDown={onKeys}
      className="grid h-full min-h-0 max-lg:content-start max-lg:overflow-y-auto lg:grid-cols-[minmax(0,1fr)_var(--ed-r)] lg:grid-rows-[minmax(0,1fr)_var(--ed-t)]">
      <span className="sr-only" role="status" aria-live="polite">{say}</span>
      {askUncompose && (
        <ConfirmDialog title={i18n.t('web.comp.uncomposeAskTitle')} message={i18n.t('web.comp.uncomposeAsk', { name: name(askUncompose) })} confirmLabel={i18n.t('web.comp.uncomposeAskOk')} cancelLabel={i18n.t('web.confirm.cancel')} testId="uncompose-confirm"
          onCancel={() => setAskUncompose(null)} onConfirm={() => { const id = askUncompose; setAskUncompose(null); doUncompose(id); }} />
      )}
      {textDlg && <TextDialog scene={scene} fontsReady={fonts === 'ready'} onPick={addTemplate} onClose={() => setTextDlg(false)} />}

      <div ref={scrollerRef} className="relative min-h-0 min-w-0 overflow-y-auto bg-page p-3 max-lg:order-1 max-lg:h-[75svh] lg:col-start-1 lg:row-start-1 lg:p-6"
        onPointerDown={(e) => { if (live.length && !(e.target as HTMLElement).closest('figure, button, [role="radiogroup"], input, select, [data-testid="editor-transport"]')) setSelected([]); }}>
        {derived && ast ? (
          <div ref={stageRef} className="mx-auto grid gap-y-2" style={{ width: width + 2 * PASTEBOARD, gridTemplateColumns: `${width + 2 * PASTEBOARD}px` }}>
            <div className="flex items-center justify-between gap-3 px-7 text-xs tabular-nums text-muted">
              <span className="min-w-0 truncate" title={styleName ? i18n.t('web.stage.style', { name: styleName }) : undefined}>
                {frameInfo(i18n, W, H, scene.canvas.aspectRatio)}
                {frames.length ? <><span aria-hidden> · </span><span className="text-fg" data-testid="stage-comp">{i18n.t('web.comp.stageLabel', { name: compName(frames.at(-1)!) })}</span></> : styleName && <><span aria-hidden> · </span>{styleName}</>}
              </span>
              <AspectSwitch value={scene.canvas.aspectRatio} onChange={actions.aspect} />
            </div>
            {/* Bàn đệm: tay nắm ra ngoài khung vẫn thấy được nhưng bị cắt ở mép bàn, không đè thanh phát. */}
            <div className="overflow-hidden" style={{ padding: PASTEBOARD }} data-testid="editor-pasteboard">
              <figure aria-label={i18n.t('web.stage')} className="relative outline outline-1 outline-line">
                {/* Dấu cắt như bản in thử ở thẻ Xem trước: nằm ngoài khung (trong bàn đệm), không vào video xuất. */}
                {proof && <>
                  <Crop className="-left-5 -top-5" /><Crop className="-right-5 -top-5 -scale-x-100" />
                  <Crop className="-bottom-5 -left-5 -scale-y-100" /><Crop className="-bottom-5 -right-5 -scale-100" />
                </>}
                <LiveCanvas scene={scene} derived={derived} ast={ast} playback={playback} fonts={fonts} />
                <LiveOverlay ctx={liveCtx!} scene={scene} cssWidth={width} selected={live} locked={locked} onSelect={setSelected} onLayouts={editLayouts} name={name} advanced={advanced} />
              </figure>
            </div>
            {transport && <div className="mx-7 border border-line bg-surface" data-testid="editor-transport">{transport}</div>}
            {/* Cách thao tác bằng chuột/bàn phím: chỉ cho trình đọc màn hình (khung có aria-describedby); người xem đọc trong hướng dẫn sử dụng. */}
            <p id="editor-keys" className="sr-only">{i18n.t(advanced ? 'web.editor.keysAdv' : 'web.editor.keys')}</p>
          </div>
        ) : (
          <p className="mx-auto max-w-md pt-10 text-[13px] text-muted" data-testid="editor-empty">{i18n.t('web.editor.empty')}</p>
        )}
      </div>

      <div className="relative max-lg:order-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:min-h-0">
      {!r.open.props ? (
        <Rail side="right" label={i18n.t('web.editor.properties')} title={keyHint(i18n.t('web.panel.open', { name: i18n.t('web.editor.properties') }), 'Ctrl+Alt+B')} onOpen={() => panels.setOpen('props', true)} testId="rail-props" />
      ) : <>
      <aside id="editor-props-panel" aria-label={i18n.t('web.editor.properties')} className="relative flex h-full min-h-0 flex-col border-t border-line bg-surface max-lg:h-auto max-lg:overflow-visible lg:border-l lg:border-t-0" data-testid="editor-props">
        <div className="flex h-8 shrink-0 items-center justify-between gap-2 border-b border-line pl-4 pr-2">
          <span className="truncate text-xs text-muted">{i18n.t('web.editor.properties')}</span>
          <PanelCollapse label={keyHint(i18n.t('web.panel.collapse', { name: i18n.t('web.editor.properties') }), 'Ctrl+Alt+B')} icon={<PanelRight className="h-3.5 w-3.5" />} onClick={() => panels.setOpen('props', false)} testId="collapse-props" />
        </div>
        <SettingsSearchBox />
        <div className="relative min-h-0 flex-1 overflow-y-auto max-lg:flex-none max-lg:overflow-visible">
        <Properties background={background} scene={scene} selected={live} locked={locked} name={name} advanced={advanced} actions={actions} onLock={toggleLock} order={order} move={move} widgetSections={widgetSections} onPick={(id) => setSelected([id])} layoutRef={layoutRef}
          onDuplicate={duplicateSel} onRemove={removeSel} onDeselect={deselect} live={liveCtx} editLayouts={editLayouts} onOpenComp={openComp} onOpenKeys={openKeys} inComp={frames.length > 0} onUncompose={uncomposeSel} onPrecompose={precomposeSel} compSpeed={(w) => Math.round((compOf(w)?.speed ?? 1) * frameA * 100)} onCompSpeed={setCompSpeed}
          keyInspector={single && ast && keysOpen && hasInspectorTarget(single, keySel) ? (n) => (
            <AnimationInspector n={n} widget={single} sel={keySel} tempoMap={ast.tempoMap} locked={locked.has(single.id)} getTime={() => playback.get().t} lanes={lanes}
              onAnimate={(p, v, k) => actions.animate(single.id, p, v, k)} onAnimateMany={(ch, k) => actions.animEdit({ [single.id]: { animate: ch } }, k)} onSel={onKeySel} gesture={gestureCtx} />
          ) : undefined} />
        <SearchEmpty />
        </div>
      </aside>
      <Splitter axis="x" grow={-1} label={i18n.t('web.panel.resize', { name: i18n.t('web.editor.properties') })} title={i18n.t('web.panel.resizeHint')} controls="editor-props-panel"
        value={r.props} min={PANEL_LIMITS.props[0]} max={PANEL_LIMITS.props[1]} onResize={(v) => panels.resize('props', v)} onReset={() => panels.reset('props')}
        onToggle={() => panels.setOpen('props', false)} className="left-0 max-lg:hidden" testId="split-props" />
      </>}
      </div>

      <div className={`relative min-w-0 max-lg:order-2 lg:min-h-0 lg:col-start-1 lg:row-start-2 ${r.open.timeline ? 'max-lg:h-96' : ''}`}>
        {r.open.timeline && (
          <Splitter axis="y" grow={-1} label={i18n.t('web.panel.resize', { name: i18n.t('web.timeline.title') })} title={i18n.t('web.panel.resizeHint')} controls="editor-timeline"
            value={r.timeline} min={PANEL_LIMITS.timeline[0]} max={PANEL_LIMITS.timeline[1]} onResize={(v) => panels.resize('timeline', v)} onReset={() => panels.reset('timeline')}
            onToggle={() => panels.setOpen('timeline', false)} className="top-0 max-lg:hidden" testId="split-timeline" />
        )}
        <TimelinePanel open={r.open.timeline} onOpen={(o) => panels.setOpen('timeline', o)} toggleHint={(open) => keyHint(i18n.t(open ? 'web.panel.collapse' : 'web.panel.open', { name: i18n.t('web.timeline.title') }), 'Ctrl+J')}
          crumbs={crumbs} keys={keysOpen} hasProject={!!ast} selectedCount={live.length} hasWidget={!!single} view={tlView} onView={setTlView} note={tlNote} onNote={() => setTlNote('')}>
          {!keysOpen && ast && (
            <LayerTimeline scene={scene} order={order} duration={duration} tempoMap={ast.tempoMap} playback={playback} phases={root.phases ?? []} onPhases={actions.phases}
              selected={live} onSelect={setSelected} locked={locked} onLock={toggleLock} onLockAll={lockAll} name={name} onVisible={actions.visible} onAllVisible={actions.allVisible} onPaint={paintLayers}
              onMoveLayer={move} onLayers={(kind, next, key) => actions.layers(kind, next, key)} onOpenKeys={openKeys} onOpenComp={openComp} onSplit={splitSel} onPrecompose={precomposeSel}
              bounds={bounds} music={music} markers={ast.meta.markers} trackLocks={trackLocks} onLockTrack={onLockTrack} trackEdit={trackEdit} tree={r.tree} onTree={(v) => panels.resize('tree', v)} onTreeReset={() => panels.reset('tree')} gesture={gestureCtx} addMenu={<AddMenu onAdd={addWidget} onText={() => setTextDlg(true)} />}
              editing={editing} onEdit={setEditing}
              renameInput={(id) => <LayerNameInput initial={scene.widgets.find((w) => w.id === id)?.name ?? name(id)} label={i18n.t('web.editor.nameLabel')} onCommit={(v) => commitName(id, v)} onCancel={() => setEditing(null)} />} />
          )}
          {keysOpen && single && ast && tlView === 'graph' && (
            <Suspense fallback={<div className="h-full" aria-busy="true" data-testid="graph-loading" />}>
              <GraphEditor widget={single} tempoMap={ast.tempoMap} duration={duration} playback={playback} locked={locked.has(single.id)}
                sel={keySel} onSel={onKeySel} onAnimateMany={(ch, k) => actions.animEdit({ [single.id]: { animate: ch } }, k)} gesture={gestureCtx} />
            </Suspense>
          )}
          {keysOpen && single && ast && tlView === 'list' && (
            <KeyframeTimeline widget={single} tempoMap={ast.tempoMap} duration={duration} playback={playback} locked={locked.has(single.id)}
              sel={keySel} onSel={onKeySel} onAnimate={(p, v, k) => actions.animate(single.id, p, v, k)} onAnimateMany={(ch, k) => actions.animEdit({ [single.id]: { animate: ch } }, k)} gesture={gestureCtx}
              tree={r.tree} onTree={(v) => panels.resize('tree', v)} onTreeReset={() => panels.reset('tree')} />
          )}
        </TimelinePanel>
        {nameErr && <p role="alert" className="absolute bottom-2 left-2 z-40 max-w-sm border border-warning/60 bg-surface px-2 py-1.5 text-xs leading-snug text-fg" data-testid="layer-name-error">{nameErr}</p>}
      </div>
    </div>
  );
}

/** Ô đổi tên lớp ngay trên dòng. Enter hoặc rời ô: áp; Esc: bỏ. */
function LayerNameInput({ initial, label, onCommit, onCancel }: { initial: string; label: string; onCommit(v: string): void; onCancel(): void }) {
  const [v, setV] = useState(initial);
  const done = useRef(false);
  const finish = (ok: boolean) => { if (done.current) return; done.current = true; if (ok) onCommit(v); else onCancel(); };
  return (
    <input autoFocus aria-label={label} value={v} maxLength={MAX_WIDGET_NAME * 2} data-testid="layer-name-input" className="min-w-0 flex-1 border border-control bg-raised px-1.5 py-1 text-[13px] text-fg"
      onFocus={(e) => e.currentTarget.select()} onChange={(e) => setV(e.target.value)} onBlur={() => finish(true)}
      onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); finish(true); } else if (e.key === 'Escape') { e.preventDefault(); finish(false); } }} />
  );
}

/** Nút "Thêm" ở đầu danh sách Lớp: mở danh sách loại widget (T-68). Phím: Enter/Space mở, ↑/↓ chọn, Esc đóng. */
const MENU_WIDGETS = menuWidgets(ADDABLE_WIDGETS);
function AddMenu({ onAdd, onText }: { onAdd(type: WidgetType): void; onText(): void }) {
  const { i18n } = useI18n();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null), menuEl = useRef<HTMLDivElement>(null);
  // Menu dựng bằng portal + `position: fixed`: vùng cuộn của Timeline cắt mọi thứ lòi ra ngoài nó, nên menu lật lên phải thoát khỏi vùng đó (T-114).
  const place = useMenuPlacement(open, menuEl, { anchor: box, fixed: true });
  const items = () => [...(menuEl.current?.querySelectorAll<HTMLButtonElement>('[role=menuitem]') ?? [])];
  const pick = (t: WidgetType) => { setOpen(false); onAdd(t); };
  return (
    <div ref={box} className="relative inline-block" onBlur={(e) => { const to = e.relatedTarget as Node | null; if (!box.current?.contains(to) && !menuEl.current?.contains(to)) setOpen(false); }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) { e.stopPropagation(); setOpen(false); box.current?.querySelector<HTMLButtonElement>('button')?.focus(); }
        if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && open) { e.preventDefault(); const l = items(), i = l.indexOf(document.activeElement as HTMLButtonElement); l[(i + (e.key === 'ArrowDown' ? 1 : -1) + l.length) % l.length]?.focus(); }
      }}>
      <button type="button" className="btn-ghost flex h-6 items-center gap-1" aria-haspopup="menu" aria-expanded={open} onClick={() => { setOpen((o) => !o); requestAnimationFrame(() => items()[0]?.focus()); }}
        data-testid="layers-add"><Plus className="h-3.5 w-3.5" />{i18n.t('web.editor.add')}</button>
      {open && createPortal(
        <div ref={menuEl} role="menu" aria-label={i18n.t('web.editor.add')} style={place.style ?? { position: 'fixed', visibility: 'hidden' }} className={`z-50 min-w-[11rem] max-h-[calc(10*2rem+0.5rem)] overflow-y-auto border border-line bg-surface py-1 shadow-sm`} data-testid="add-menu">
          {/* Mục đầu: Chữ… mở hộp thoại mẫu (D-78); các loại chữ không còn mục riêng. */}
          <button type="button" role="menuitem" className="block w-full px-3 py-1.5 text-left text-xs text-fg hover:bg-raised focus:bg-raised focus:outline-none" onClick={() => { setOpen(false); onText(); }} data-testid="add-text">
            {i18n.t('web.editor.addText')}
          </button>
          {MENU_WIDGETS.map((t) => (
            <button key={t} type="button" role="menuitem" className="block w-full px-3 py-1.5 text-left text-xs text-fg hover:bg-raised focus:bg-raised focus:outline-none" onClick={() => pick(t)} data-testid={`add-${t}`}>
              {i18n.t(`web.widget.${t}`)}
            </button>
          ))}
        </div>,
        document.body)}
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

function Properties({ background, scene, selected, locked, name, advanced, actions, onLock, order, move, widgetSections, onPick, layoutRef, onDuplicate, onRemove, onDeselect, keyInspector, live, editLayouts, onOpenComp, onOpenKeys, inComp, onUncompose, onPrecompose, compSpeed, onCompSpeed }: { onUncompose(): void; onPrecompose(): void; compSpeed(w: WidgetSpec): number; onCompSpeed(id: string, pct: number): void; keyInspector?(n: number): ReactNode; live: LiveCtx | null; editLayouts(p: Patches): void; onDeselect(): void; background?: BackgroundState; onOpenComp(id: string): void; onOpenKeys(id: string): void; inComp: boolean; onDuplicate(): void; onRemove(): void; layoutRef?: Record<string, WidgetLayout>; onPick(id: string): void; scene: SceneDocument; selected: string[]; locked: ReadonlySet<string>; name(id: string): string; advanced: boolean; actions: EditorActions; onLock(id: string): void; order: string[]; move(id: string, to: number): void; widgetSections?: Props['widgetSections'] }) {
  const { i18n } = useI18n();
  const ws = selected.map((id) => scene.widgets.find((w) => w.id === id)!).filter(Boolean);
  const { designWidth: W, designHeight: H } = scene.canvas;
  // Khoá lớp (T-115): mọi lớp đang chọn đã khoá thì Bắt dính (thiết lập chung của khung) cũng tắt, như các mục khác.
  const lockedAll = ws.length > 0 && ws.every((x) => locked.has(x.id));
  const snapping = (n: number) => (
    <InspectorSection n={n} id="snapping" title={i18n.t('web.editor.snapping')}>
      <TickField strong label={i18n.t('web.editor.guides')} checked={scene.canvas.snapping.smartGuidesEnabled} onChange={(v) => actions.snapping({ smartGuidesEnabled: v })} reference={SNAP_DEFAULT.smartGuidesEnabled} disabled={lockedAll} />
      <TickField strong label={i18n.t('web.editor.grid')} checked={scene.canvas.snapping.gridEnabled} onChange={(v) => actions.snapping({ gridEnabled: v })} reference={SNAP_DEFAULT.gridEnabled} disabled={lockedAll} />
      <div className="flex items-center justify-between gap-2 text-[13px] text-fg">
        <span>{i18n.t('web.editor.gridSize')}</span>
        <span className="flex items-center gap-2">
          <div className="seg" role="radiogroup" aria-label={i18n.t('web.editor.gridSize')}>
            {[8, 16].map((g) => (
              <button key={g} type="button" role="radio" aria-checked={scene.canvas.snapping.gridSize === g} className="seg-btn tabular-nums" disabled={lockedAll || !scene.canvas.snapping.gridEnabled}
                onClick={() => actions.snapping({ gridSize: g })}>{i18n.t('web.editor.pt', { n: g })}</button>
            ))}
          </div>
          <ResetButton label={i18n.t('web.editor.gridSize')} changed={scene.canvas.snapping.gridSize !== SNAP_DEFAULT.gridSize} disabled={lockedAll || !scene.canvas.snapping.gridEnabled} onReset={() => actions.snapping({ gridSize: SNAP_DEFAULT.gridSize })} />
        </span>
      </div>
    </InspectorSection>
  );

  const piano = scene.widgets.find((x) => x.type === 'PIANO_ROLL');
  if (!ws.length) {
    // Số mục đếm liền nhau theo mục thật sự hiện (Khung chỉ có ở Nâng cao, Ảnh nền khi có). Phase nay nằm trên Timeline (làn Phase, D-69).
    let n = 0;
    const next = () => ++n;
    return (
    <>
      <InspectorSection n={next()} id="selection" title={i18n.t('web.editor.selection')}>
        <p className="text-xs leading-snug text-muted" data-testid="editor-noselection">{i18n.t(inComp ? 'web.comp.noSelection' : 'web.editor.noSelection')}</p>
        {/* Hình thức nốt chỉ còn ở Editor (D-57): lối tắt chọn Piano Roll để người mới không phải đoán. */}
        {piano && <button type="button" className={btn} onClick={() => onPick(piano.id)} data-testid="editor-open-look">{i18n.t('web.editor.openLook')}</button>}
      </InspectorSection>
      {advanced && <FrameSection n={next()} width={W} height={H} onSize={actions.canvasSize} />}
      <KeySection n={next()} tonic={scene.tonic} onChange={actions.tonic} />
      <NamingSection n={next()} naming={scene.noteNaming} onChange={actions.noteNaming} />
      {background && <BackgroundSection n={next()} state={background} spec={scene.canvas.backgroundImage} onPick={actions.background.pick} onRemove={actions.background.remove} onSpec={actions.background.spec} />}
      {snapping(next())}
    </>
    );
  }

  if (ws.length > 1) return (
    <>
      <InspectorSection n={1} id="selection" title={i18n.t('web.editor.selectedMany', { n: ws.length })}>
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 text-xs leading-snug text-muted">{ws.map((w) => name(w.id)).join(', ')}</p>
          <button type="button" className="btn-ghost shrink-0 border border-control" onClick={onDeselect} title={i18n.t('web.editor.deselectHint')} data-testid="deselect">{i18n.t('web.editor.deselect')}</button>
        </div>
        <NumRow label={i18n.t('web.editor.rotateBy')}>
          <NumberField label={i18n.t('web.editor.rotateBy')} value={0} spec={{ min: -360, max: 360, step: 1 }} disabled={lockedAll}
            onChange={(d) => { const free = ws.filter((x) => !locked.has(x.id)), out = rotateGroup(free.map((w) => w.layout), d); actions.layouts(Object.fromEntries(free.map((w, i) => [w.id, round(out[i])]))); }} />
        </NumRow>
        <div className="flex gap-1.5">
          <button type="button" className={btn} onClick={onDuplicate} disabled={lockedAll} title={`${i18n.t('web.editor.duplicate')} (Ctrl+D)`} data-testid="duplicate"><Duplicate className="h-3.5 w-3.5" />{i18n.t('web.editor.duplicate')}</button>
          <button type="button" className={btn} onClick={onRemove} disabled={ws.every((x) => locked.has(x.id))} title={`${i18n.t('web.editor.remove')} (Delete)`} data-testid="remove"><Trash className="h-3.5 w-3.5" />{i18n.t('web.editor.remove')}</button>
        </div>
      </InspectorSection>
      <AlignSection n={2} items={ws} frame={{ width: W, height: H }} onLayouts={actions.layouts} locked={locked} />
      {snapping(3)}
    </>
  );

  const w = ws[0], lk = locked.has(w.id), zi = order.indexOf(w.id), comp = compOf(w);
  // Bố cục tại vạch phát (khi vị trí/cỡ/góc đang animate): ô số và nút ↺ đọc giá trị đang thấy; sửa thì đặt keyframe (editLayouts).
  const withL = (fn: (l: WidgetLayout) => ReactNode) => (live ? <LiveLayout w={w} ctx={live} canvas={scene.canvas}>{fn}</LiveLayout> : fn(w.layout));
  // Animation Inspector (khi Timeline đang chọn keyframe/hàng) là mục 01: thứ người dùng đang chỉnh ngay lúc đó; các mục sau lùi một số.
  const ki = keyInspector?.(1), o = ki ? 1 : 0;
  // Mục riêng của widget (Hình thức của Piano Roll) đứng ngay sau Vị trí: là thứ hay chỉnh nhất; các mục sau đánh số tiếp.
  const extra = (widgetSections?.(w, 2 + o, lk) ?? []).filter(Boolean), k = extra.length + o;
  const set = (p: Partial<WidgetLayout>) => editLayouts({ [w.id]: p });
  const ref = layoutRef?.[w.id];
  const field = (l: WidgetLayout, k: 'x' | 'y' | 'width' | 'height', label: string, min: number, max: number) => {
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
      <header className="flex items-start justify-between gap-2 border-b border-line px-4 py-3" data-testid="editor-selected">
        <div className="min-w-0">
          <p className="text-xs text-muted">{i18n.t('web.editor.selectedLabel')}</p>
          <h2 className="truncate text-[17px] font-semibold text-fg" title={name(w.id)}>{name(w.id)}</h2>
        </div>
        <button type="button" className="btn-ghost shrink-0 border border-control" onClick={onDeselect} title={i18n.t('web.editor.deselectHint')} data-testid="deselect">{i18n.t('web.editor.deselect')}</button>
      </header>
      {!hasCanvasFrame(w) && <p className="border-b border-line px-4 py-2 text-xs leading-snug text-muted" data-testid="frame-hidden-note">{i18n.t('web.editor.frameHidden')}</p>}
      {/* Lối vào tầng 2 (keyframe) hoặc vào precomp, cùng việc với nhấp đúp thanh trên timeline. */}
      <div className="flex flex-wrap gap-1.5 border-b border-line px-4 py-2">
        {comp
          ? <button type="button" className={btn} onClick={() => onOpenComp(w.id)} data-testid="props-open-comp"><Precomp className="h-3.5 w-3.5" />{i18n.t('web.comp.open')}</button>
          : <button type="button" className={btn} onClick={() => onOpenKeys(w.id)} data-testid="props-open-keys"><Diamond className="h-3 w-3" />{i18n.t('web.layers.openKeysBtn')}</button>}
        {!comp && <button type="button" className={btn} disabled={lk} onClick={onPrecompose} title={`${i18n.t('web.layers.precompose')} (Ctrl+G)`} data-testid="props-precompose"><Precomp className="h-3.5 w-3.5" />{i18n.t('web.comp.precomposeBtn')}</button>}
        {comp && <button type="button" className={btn} onClick={() => onOpenKeys(w.id)} data-testid="props-open-keys"><Diamond className="h-3 w-3" />{i18n.t('web.layers.openKeysBtn')}</button>}
        {comp && <button type="button" className={btn} disabled={lk} onClick={onUncompose} title={`${i18n.t('web.comp.uncompose')} (Ctrl+Shift+G)`} data-testid="props-uncompose">{i18n.t('web.comp.uncompose')}</button>}
      </div>
      {comp && (
        <div className="border-b border-line px-4 py-2">
          <NumRow label={i18n.t('web.comp.speed')} reset={<ResetButton label={i18n.t('web.comp.speed')} changed={compSpeed(w) !== 100} disabled={lk} onReset={() => onCompSpeed(w.id, 100)} />}>
            <NumberField label={i18n.t('web.comp.speed')} value={compSpeed(w)} spec={{ min: 10, max: 1000, step: 5, units: { '%': 1 } }} disabled={lk} onChange={(v) => onCompSpeed(w.id, v)} />
          </NumRow>
        </div>
      )}
      {ki}
      <InspectorSection n={1 + o} id="transform" title={i18n.t('web.editor.positionSize')}>
        {lk && (
          <div className="flex items-center justify-between gap-2 text-xs leading-snug text-muted" data-testid="editor-locked">
            <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 shrink-0" />{i18n.t('web.editor.lockedHint')}</span>
            <button type="button" className={btn} onClick={() => onLock(w.id)}>{i18n.t('web.editor.unlockBtn')}</button>
          </div>
        )}
        {withL((l) => <>
        {w.visible && outsideFrame(l, W, H) && (
          <div className="flex items-start justify-between gap-2 border border-warning/60 bg-warning/10 px-2 py-1.5 text-xs leading-snug text-fg" role="status" data-testid="editor-outside">
            <span className="flex gap-1.5"><StatusIcon kind="warning" className="mt-px h-3.5 w-3.5 shrink-0 text-warning" />{i18n.t('web.editor.outsideHint')}</span>
            <button type="button" className={`${btn} shrink-0`} disabled={lk} onClick={() => set(intoFrame(l, W, H))}>{i18n.t('web.editor.bringIn')}</button>
          </div>
        )}
        <div className="grid grid-cols-2 gap-x-2 gap-y-2" data-testid="editor-geometry">
          {field(l, 'x', 'X', -W, 2 * W)}{field(l, 'y', 'Y', -H, 2 * H)}
          {/* Lớp precomp luôn đúng cỡ khung (D-69): phóng to/thu nhỏ bằng Tỉ lệ trên timeline keyframe. */}
          {!comp && <>{field(l, 'width', 'W', 1, 4 * W)}{field(l, 'height', 'H', 1, 4 * H)}</>}
        </div>
        </>)}
      </InspectorSection>
      {extra}
      <InspectorSection n={2 + k} id="rotation" title={i18n.t('web.editor.rotation')}>
        {/* Cùng lưới với dòng số của Hình thức (nhãn | ô 4,5rem | ↺), nên các ô thẳng cột; ↺ chỉ hiện khi đã đổi. */}
        {withL((l) => <>
        <NumRow label={i18n.t('web.editor.angle')} reset={<ResetButton label={i18n.t('web.editor.angle')} text={i18n.t('web.editor.resetRotation')} changed={l.rotation !== 0} disabled={lk} onReset={() => set({ rotation: 0 })} />}>
          <NumberField label={i18n.t('web.editor.angle')} value={l.rotation} spec={{ min: -360, max: 360, step: 1, units: { '°': 1, deg: 1 } }} disabled={lk}
            onChange={(v) => set({ rotation: normalizeAngle(v) })} />
        </NumRow>
        {/* Điểm neo là khái niệm của trình dựng chuyển động: chỉ ở Nâng cao (Cơ bản xoay quanh tâm). */}
        {advanced && <>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_1.5rem] items-center gap-2 text-xs text-muted">
            <span className="min-w-0 break-words leading-tight">{i18n.t('web.editor.anchor')}</span>
            <AnchorPicker value={l.anchor} disabled={lk} onChange={(a) => editLayouts({ [w.id]: setAnchor(l, a) })} />
            <ResetButton label={i18n.t('web.editor.anchor')} text={i18n.t('web.editor.resetAnchor')} changed={l.anchor.x !== 0.5 || l.anchor.y !== 0.5} disabled={lk}
              onReset={() => editLayouts({ [w.id]: setAnchor(l, { x: 0.5, y: 0.5 }) })} />
          </div>
          {(['x', 'y'] as const).map((ax) => (
            <NumRow key={ax} label={i18n.t(`web.editor.anchor${ax.toUpperCase()}`)}
              reset={<ResetButton label={i18n.t(`web.editor.anchor${ax.toUpperCase()}`)} changed={l.anchor[ax] !== 0.5} disabled={lk} text={i18n.t('web.editor.resetAnchorAxis', { name: i18n.t(`web.editor.anchor${ax.toUpperCase()}`) })}
                onReset={() => editLayouts({ [w.id]: setAnchor(l, { ...l.anchor, [ax]: 0.5 }) })} />}>
              <NumberField label={i18n.t(`web.editor.anchor${ax.toUpperCase()}`)} value={Math.round(l.anchor[ax] * 100)} spec={{ min: 0, max: 100, step: 1, units: { '%': 1 } }} disabled={lk}
                onChange={(v) => editLayouts({ [w.id]: setAnchor(l, { ...l.anchor, [ax]: v / 100 }) })} />
            </NumRow>
          ))}
        </>}
        </>)}
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
          <button type="button" className={`${btn} w-9 justify-center px-0`} aria-label={i18n.t('web.editor.duplicate')} disabled={lk} title={`${i18n.t('web.editor.duplicate')} (Ctrl+D)`} onClick={onDuplicate} data-testid="duplicate"><Duplicate className="h-3.5 w-3.5" /></button>
          <button type="button" className={`${btn} w-9 justify-center px-0`} disabled={lk} aria-label={i18n.t('web.editor.remove')} title={`${i18n.t('web.editor.remove')} (Delete)`} onClick={onRemove} data-testid="remove"><Trash className="h-3.5 w-3.5" /></button>
        </div>
        <label className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] items-center gap-2 text-xs text-muted">
          <span className="min-w-0 break-words leading-tight">{i18n.t('web.editor.parent')}</span>
          <Select wrapClassName="w-full" aria-label={i18n.t('web.editor.parent')} title={i18n.t('web.editor.parentHint')} value={w.parent ?? ''} disabled={lk}
            onChange={(e) => actions.parent(w.id, e.target.value || null)} data-testid="widget-parent">
            <option value="">{i18n.t('web.editor.parentNone')}</option>
            {parentCandidates(scene, w.id).map((id) => <option key={id} value={id}>{name(id)}</option>)}
          </Select>
        </label>
        <TickField strong label={i18n.t('web.editor.visible')} checked={w.visible} onChange={(v) => actions.visible(w.id, v)} reference disabled={lk} />
        <TickField strong label={i18n.t('web.editor.locked')} checked={lk} onChange={() => onLock(w.id)} reference={false} />
      </InspectorSection>
      {/* Khoảng hiển thị và hiện dần/ẩn dần chỉnh trên thanh của lớp ở Timeline (D-69): không còn mục riêng ở đây. */}
      <MotionSection n={4 + k} widgetId={w.id} value={w.motion} disabled={lk} onChange={(v, key) => actions.motion(w.id, v, key)} />
      <AlignSection n={5 + k} items={[w]} frame={{ width: W, height: H }} onLayouts={actions.layouts} locked={locked} />
      {snapping(6 + k)}
    </>
  );
}

/** Dòng số cùng lưới với SliderField (nhãn | ô 4,5rem | ↺ 1,5rem): các ô của Xoay, Neo và Hình thức thẳng một cột. */
/** Cỡ khung tuỳ ý (Nâng cao): 9:16 / 1:1 / 16:9 đã có bộ chọn ở đầu khung; mục này cho mọi cỡ khác (4:5, 21:9, 1280×720…). */
function FrameSection({ n, width, height, onSize }: { n: number; width: number; height: number; onSize(w: number, h: number): void }) {
  const { i18n } = useI18n();
  const spec = { min: 256, max: 4096, step: 1 };
  return (
    <InspectorSection n={n} id="frame" title={i18n.t('web.editor.frame')}>
      <NumRow label={i18n.t('web.editor.frameW')}>
        <NumberField label={i18n.t('web.editor.frameW')} value={width} spec={spec} onChange={(v) => onSize(v, height)} />
      </NumRow>
      <NumRow label={i18n.t('web.editor.frameH')}>
        <NumberField label={i18n.t('web.editor.frameH')} value={height} spec={spec} onChange={(v) => onSize(width, v)} />
      </NumRow>
    </InspectorSection>
  );
}

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


