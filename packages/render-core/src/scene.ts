// T-05: SceneDocument (= Preset, SRS REQ-STORAGE-02) + kiểm/sửa lược đồ. Dữ liệu thuần, không DOM.
// Mô hình hiện tại là "canvas + textStyles + widgets" của preset 0.5.0 (0.4.0 thêm `layout.anchor` theo REQ-GRAPHICS-03; 0.5.0 thêm bộ kiểu chữ
// `textStyles` và chữ dạng TextRef theo REQ-GRAPHICS-18). Đọc được 0.3.x/0.4.x qua `migrateScene`.
// Lớp/phần tử storyboard (T-22) sẽ là schemaVersion mới, có hàm di trú từ 0.4.0; vì vậy mọi trường ở đây giữ đúng tên trong SRS.
import {
  DEFAULT_CHORD, DEFAULT_EVENT_COUNTER, DEFAULT_LIVE_TRIGGER, DEFAULT_PROGRESS_BAR, DEFAULT_TEXT_BOX, DEFAULT_TIME_BAR, DEFAULT_TRACK_INFO, TEMPLATE_KEYS, TEXT_FIELDS,
  type Align, type ChordProps, type EventCounterProps, type LineCfg, type LiveTriggerProps, type ProgressBarProps, type TextBoxProps, type TimeBarProps, type TrackInfoProps,
} from './hud.ts';
import { BASE_TEXT_STYLE, BUNDLED_TEXT_FAMILIES, DEFAULT_TEXT_STYLES, TEXT_DEFAULT_FONT, applyOverride, cloneStyle, type NamedTextStyle, type TextRef, type TextStyle, type TextStyleSet } from './typography.ts';
import { ALIAS_KEYS, GLOBAL_KEYS, checkTemplate } from './placeholders.ts';
import { normalizeAngle } from './snap.ts';
import { DEFAULT_BACKGROUND, type BackgroundImageSpec } from './background.ts';
import { DEFAULT_PARTICLES, type ParticleProps } from './particles.ts';
import { NOTE_TRANSITION_NAMES } from './noteTransition.ts';
import { DEFAULT_NAMING, NAMING_SYSTEMS, type NoteNaming } from './naming.ts';
import {
  DEFAULT_ARRANGEMENT, DEFAULT_AUTOMATION, DEFAULT_BAR_BEAT, DEFAULT_DENSITY, DEFAULT_DRUM_PAD, DEFAULT_KEY_SCALE, DEFAULT_LYRICS, DEFAULT_PITCH_WHEEL, DEFAULT_SECTION, DEFAULT_TEMPO_INFO, DEFAULT_VELOCITY,
  INSIGHT_TEMPLATE_KEYS, INSIGHT_TYPES, type ArrangementProps, type AutomationProps, type BarBeatProps, type DensityProps, type DrumPadProps, type KeyScaleProps, type LyricsProps, type PitchWheelProps, type SectionProps, type TempoInfoProps, type VelocityProps,
} from './insight.ts';
import { DEFAULT_NOTATION, notationInkFor, type NotationProps } from './notation/widget.ts';
import { CHORD_RESOLUTIONS, DASHBOARD_TYPES, DEFAULT_DEGREE, DEFAULT_DOTS, DEFAULT_PANEL, DOTS_GRIDS, MAX_PANEL_STATS, type DegreeProps, type DotsProps, type PanelProps } from './dashboard.ts';
import { ROMAN_STYLES } from './degree.ts';
import { DEFAULT_SPECTRUM, SPECTRUM_STYLES, type SpectrumProps } from './spectrum.ts';
import { sanitizeAnimate, type Animation } from './animation.ts';
import { DEFAULT_LOOP, DEFAULT_PHASE, LOOP_EFFECT_NAMES, WIDGET_EFFECT_NAMES, hasMotion, type MotionLoop, type MotionPhase, type WidgetMotion } from './widgetMotion.ts';
import { parseEase } from './motion.ts';
import { MAX_FADE, MAX_PHASES, MAX_PHASE_NAME, MAX_RANGES, type Phase, type TimeRange, type WidgetVisibility } from './visibility.ts';
import { isLaneId } from './glow.ts';
import { DEFAULT_KEYBOARD_STYLE, DEFAULT_NOTE_STYLE, DEFAULT_ROLL_GRID, KEYBOARD_SCALES, KEYBOARD_SHAPES, KEY_LABEL_MODES, PLAYHEAD_HITS, PLAYHEAD_STYLES, sanitizeStyle, type KeyboardStyle, type NoteStyle, type PlayheadHit, type PlayheadStyle, type RollGrid, type StyleConfig } from './style.ts';
import { MAX_PARENT_DEPTH, resolveParents } from './parenting.ts';
import { ANIM_EFFECTS, ANIM_ORDERS, ANIM_UNITS, DEFAULT_TEXT_ANIMATOR, type TextAnimator } from './textAnimator.ts';
import { EASING_NAMES } from './motion.ts';
import { ASSET_REF, DEFAULT_IMAGE, IMAGE_FITS, type ImageProps } from './image.ts';
import { COMP_SEP, MAX_COMPS, MAX_COMP_DEPTH, MAX_COMP_ID, MAX_COMP_NAME, MAX_FLAT_WIDGETS, canPlaceComp, compOf, flatCount, type CompProps, type CompSpec } from './comp.ts';

export const SCENE_SCHEMA_VERSION = '0.8.0';

export const WIDGET_TYPES = ['TRACK_INFO', 'PIANO_ROLL', 'EVENT_COUNTER', 'LIVE_TRIGGER', 'TIME_BAR', 'CHORD_DETECTION', 'AUDIO_SPECTRUM', 'PROGRESS_BAR', 'TEXT', 'PARTICLES', 'NOTATION', ...INSIGHT_TYPES, ...DASHBOARD_TYPES, 'IMAGE', 'COMP'] as const;
export type WidgetType = typeof WIDGET_TYPES[number];

/** `rotation`: độ, (−180, 180]. `anchor`: điểm neo xoay theo tỉ lệ khung widget (0..1), mặc định tâm (REQ-GRAPHICS-03). */
export interface WidgetLayout { x: number; y: number; width: number; height: number; rotation: number; anchor: { x: number; y: number } }
export const DEFAULT_ANCHOR: Readonly<{ x: number; y: number }> = Object.freeze({ x: 0.5, y: 0.5 });
export type TrackMappingMode = 'ALL' | 'MANUAL' | 'AUTO_ASSIGN_FIRST_MELODIC';

export interface WidgetSpec<P = unknown> {
  id: string;
  type: WidgetType;
  zIndex: number;
  visible: boolean;
  layout: WidgetLayout;
  /** Tên lớp do người dùng đặt (chỉ để hiển thị trong ứng dụng, không vào video). Vắng = tên theo loại (`Chord`, `Chord 2`…). Không trùng nhau (so không phân biệt hoa/thường). */
  name?: string;
  /** Khoảng hiển thị theo thời gian (REQ-GRAPHICS-14). Vắng = hiện suốt bài. */
  visibility?: WidgetVisibility;
  /** Chuyển động cấp widget (vào, ra, lặp theo nhịp), dùng được cho mọi loại widget. Vắng = không chuyển động. */
  motion?: WidgetMotion;
  /** Widget cha (0.7.0, parenting): mỗi khung, widget này nhận thêm phần dời/xoay/tỉ lệ (quanh điểm neo của cha) và độ đục của cha so với tư thế tĩnh
   *  của cha. Vắng = không có cha. Cha không tồn tại hoặc vòng lặp: bị bỏ khi đọc preset (cảnh báo) và bị bỏ qua khi vẽ. */
  parent?: string;
  /** Hoạt hình thuộc tính (T-22): đường dẫn thuộc tính (`properties.*` không tiền tố, hoặc `layout.x`…, `opacity`) → keyframe hoặc binding vào dữ liệu nhạc. Vắng = mọi thuộc tính tĩnh. */
  animate?: Record<string, Animation>;
  trackMappingMode: TrackMappingMode;
  /** Chỉ số track trong AST (khớp `ProjectTrack.index`), dùng khi `trackMappingMode = MANUAL`. */
  assignedTrackIndices: number[];
  /**
   * Đổi tập track theo đoạn (T-52, REQ-GRAPHICS-14; tuỳ chọn): trong một đoạn `[from, to)` (giây) widget dùng đúng các track `tracks` thay cho
   * `trackMappingMode`; ngoài mọi đoạn thì theo `trackMappingMode`. Đoạn chồng nhau: đoạn bắt đầu trước thắng. Bản nhạc (NOTATION) bỏ qua trường này.
   */
  trackRanges?: TrackRange[];
  properties: P;
}

/** Một đoạn đổi tập track (T-52): `to = null` = tới hết bài; `tracks` = chỉ số track (`ProjectTrack.index`). */
export interface TrackRange { from: number; to: number | null; tracks: number[] }
export const MAX_TRACK_RANGES = 32;

export interface PianoRollProps {
  orientation: 'HORIZONTAL';          // giữ để đọc preset cũ; hướng chảy thật là `flowAngle` (T-59). Preset cũ ghi VERTICAL → flowAngle 90.
  pitchRangeMode: 'FIT_CONTENT' | 'CUSTOM';
  pitchMin: number; pitchMax: number; // dùng khi CUSTOM
  lookaheadSeconds: number;           // 1–8 (REQ-WIDGET-01). Chỉ dùng để suy ra visibleSeconds khi preset cũ thiếu trường đó.
  playheadPositionRatio: number;      // 0.05–0.95
  /** Số giây trải trên toàn bề rộng widget = tỉ lệ thời gian (pt/giây = width / visibleSeconds). Không đổi theo vị trí vạch phát hay bàn phím. 0,5–60.
   *  Preset thiếu trường này: lấy lookahead / (1 − playheadPositionRatio), đúng cách tính cũ, nên preset cũ vẽ như trước. */
  visibleSeconds: number;
  /** Cách nốt chạy: SCROLL (mặc định) nốt cuộn qua vạch phát cố định; PAGE nốt đứng yên theo trang dài `visibleSeconds`, vạch phát chạy từ trái sang phải
   *  rồi sang trang mới (nốt kéo dài qua ranh giới trang bị cắt ở mép trang). `playheadPositionRatio` không có tác dụng ở PAGE. */
  scrollMode: 'SCROLL' | 'PAGE';
  /** Chế độ trang: độ dài trang tính bằng giây (`visibleSeconds`) hay bằng số ô nhịp (`pageBars`; trang bắt đầu đúng đầu ô nhịp, theo tempo và nhịp của bài). */
  pageUnit: 'SECONDS' | 'BARS';
  /** Số ô nhịp mỗi trang khi `pageUnit = BARS`, 1–32. */
  pageBars: number;
  /** Chế độ trang: chỉ hiện nốt sắp tới trong ngần này giây tính từ vạch phát (nốt đã phát vẫn ở lại tới hết trang). 0 = hiện cả trang. */
  revealAhead: number;
  /** Chuyển cảnh nốt (T-18): tên template trong NOTE_TRANSITIONS; `none` = Piano Roll thường. */
  transition: string;
  noteStyle: StyleConfig;
  keyboard: KeyboardStyle;
  playheadColor: string;
  playheadWidth: number;              // pt
  /** Hiện vạch phát (REQ-GRAPHICS-16). Ẩn thì nốt vẫn phát tại vị trí vạch, chỉ không vẽ vạch. */
  playheadVisible: boolean;
  // ---- Các trường dưới đây tuỳ chọn trong preset (vắng = mặc định, vẽ như trước).
  /** Góc chảy nốt 0–360° (T-59, REQ-WIDGET-01): 0 = nốt chạy từ phải sang trái, 90 = nốt rơi từ trên xuống. Làn nốt, vạch phát, bàn phím, lưới
   *  xoay bên trong khung widget; làn tự kéo dài phủ kín khung. Khác `layout.rotation` (xoay cả khung widget). */
  flowAngle: number;
  /** Lật trục cao độ (nốt cao ở phía ngược lại), ví dụ 90° + lật = kiểu "nốt rơi", nốt trầm bên trái. */
  flowMirror: boolean;
  /** Tên nốt trên phím và số ô nhịp luôn đứng thẳng khi làn xoay (tắt = xoay theo làn). */
  labelsUpright: boolean;
  /** Kiểu vạch phát (T-58): vạch liền, nét đứt, dải mờ, dải mờ dần hai bên. */
  playheadStyle: PlayheadStyle;
  /** Đầu tam giác ở hai đầu vạch, chỉ vào trong. */
  playheadArrows: boolean;
  /** Độ dài vạch so với chiều cao làn (0,05–1), căn giữa. */
  playheadLength: number;
  /** Phát sáng quanh vạch, 0..1. */
  playheadGlow: number;
  /** Phản ứng khi nốt chạm vạch: nháy (màu theo nốt vừa chạm, sáng hơn) hoặc phình độ dày; mức theo velocity, tắt dần trong `playheadHitMs`. */
  playheadHit: PlayheadHit;
  playheadHitMs: number;
  /** Lưới ô nhịp (vạch ô nhịp, vạch phách, số ô nhịp), theo tempo/nhịp của bài. */
  grid: RollGrid;
}

export interface CanvasSpec {
  aspectRatio: string;
  designWidth: number; designHeight: number; // pt logic, 256–4096 (REQ-GRAPHICS-00)
  backgroundColor: string;
  backgroundImageData: null;          // luôn null: ảnh nền là tài nguyên của phiên, không nằm trong preset (xem `backgroundImage`)
  /** Cách đặt ảnh nền khi phiên có ảnh (T-21). Vắng = mặc định (phủ kín, độ đục 1, không làm tối). */
  backgroundImage?: BackgroundImageSpec;
  snapping: { gridEnabled: boolean; gridSize: number; smartGuidesEnabled: boolean };
}

export interface SceneDocument {
  schemaVersion: string;
  presetName: string;
  author: string;
  canvas: CanvasSpec;
  /** Bộ kiểu chữ dựng sẵn của preset (REQ-GRAPHICS-18). `sanitizeScene` luôn điền đủ (DEFAULT_TEXT_STYLES + kiểu của preset); vắng = DEFAULT_TEXT_STYLES. */
  textStyles?: TextStyleSet;
  /** Các phase của bài (verse, chorus…), sắp theo `start`; dùng cho chỗ giữ `{phase}`… và (sau này) đoạn hiển thị. Vắng = không có phase. */
  phases?: Phase[];
  /** Nốt chủ do người dùng đặt (0 = C … 11 = B). Vắng = chưa đặt: `{bass}` hiện tên nốt thay vì bậc. */
  tonic?: number;
  /** Cách ghi tên nốt và hợp âm cho mọi widget (P-12). Vắng = cách ghi cũ (C♯, quy ước C4 = 60). */
  noteNaming?: NoteNaming;
  /** Thuộc tính tuỳ loại: PIANO_ROLL → PianoRollProps; loại chưa có renderer → giữ nguyên JSON. */
  widgets: WidgetSpec[];
  /** Sổ precomp (0.8.0, D-69): id comp → comp. Lớp loại `COMP` trong `widgets` (hoặc trong comp khác) đặt comp lên timeline. Vắng = không có comp. */
  comps?: Record<string, CompSpec>;
}

/** Góc chảy về [0, 360). */
export const flowAngleOf = (deg: number): number => { if (!Number.isFinite(deg)) return 0; const r = ((deg % 360) + 360) % 360; return r >= 360 - 1e-9 ? 0 : r; };

export const DEFAULT_PIANO_ROLL: Readonly<PianoRollProps> = Object.freeze({
  orientation: 'HORIZONTAL', pitchRangeMode: 'CUSTOM', pitchMin: 21, pitchMax: 108, // mặc định hiện đủ 88 phím (A0–C8); FIT_CONTENT là lựa chọn
  lookaheadSeconds: 3, playheadPositionRatio: 0.3, visibleSeconds: 3 / 0.7, scrollMode: 'SCROLL', pageUnit: 'SECONDS', pageBars: 4, revealAhead: 0, transition: 'none',
  noteStyle: { base: { ...DEFAULT_NOTE_STYLE }, tracks: {} }, keyboard: { ...DEFAULT_KEYBOARD_STYLE, width: 96 }, // 96 pt ≈ 5% bề rộng 1920
  playheadColor: '#ffffff', playheadWidth: 2, playheadVisible: true,
  flowAngle: 0, flowMirror: false, labelsUpright: true,
  playheadStyle: 'LINE', playheadArrows: false, playheadLength: 1, playheadGlow: 0, playheadHit: 'OFF', playheadHitMs: 250,
  grid: { ...DEFAULT_ROLL_GRID },
});

export const ASPECTS: Readonly<Record<string, [number, number]>> = Object.freeze({ '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080] });

/** Scene mặc định: một Piano Roll phủ kín khung. Bố cục mặc định theo nền tảng (9:16 cho người mới, KPI-04) chốt ở M2 cùng Preset. */
export function defaultScene(aspect: keyof typeof ASPECTS = '16:9'): SceneDocument {
  const [w, h] = ASPECTS[aspect];
  return {
    schemaVersion: SCENE_SCHEMA_VERSION, presetName: 'Default', author: 'DAW Visualizer',
    canvas: { aspectRatio: aspect, designWidth: w, designHeight: h, backgroundColor: '#0c0e16', backgroundImageData: null,
      snapping: { gridEnabled: true, gridSize: 8, smartGuidesEnabled: true } },
    textStyles: cloneTextStyles(DEFAULT_TEXT_STYLES),
    widgets: [pianoRollWidget({ x: 0, y: 0, width: w, height: h, rotation: 0 })],
  };
}

export function pianoRollWidget(layout: Omit<WidgetLayout, 'anchor'> & { anchor?: WidgetLayout['anchor'] }, props: Partial<PianoRollProps> = {}, id = 'piano-roll-main'): WidgetSpec<PianoRollProps> {
  return { id, type: 'PIANO_ROLL', zIndex: 10, visible: true, layout: { ...layout, anchor: { ...(layout.anchor ?? DEFAULT_ANCHOR) } }, trackMappingMode: 'ALL', assignedTrackIndices: [],
    properties: { ...clonePiano(DEFAULT_PIANO_ROLL), ...props } };
}
/** Loại widget người dùng thêm được từ Editor (có renderer). */
export const ADDABLE_WIDGETS = ['PIANO_ROLL', 'TRACK_INFO', 'EVENT_COUNTER', 'LIVE_TRIGGER', 'TIME_BAR', 'CHORD_DETECTION', 'AUDIO_SPECTRUM', 'PARTICLES', 'NOTATION', ...INSIGHT_TYPES, ...DASHBOARD_TYPES, 'PROGRESS_BAR', 'TEXT', 'IMAGE'] as const satisfies readonly WidgetType[];
const HUD_DEFAULTS: Record<string, unknown> = {
  TRACK_INFO: DEFAULT_TRACK_INFO, EVENT_COUNTER: DEFAULT_EVENT_COUNTER, LIVE_TRIGGER: DEFAULT_LIVE_TRIGGER,
  TIME_BAR: DEFAULT_TIME_BAR, CHORD_DETECTION: DEFAULT_CHORD, AUDIO_SPECTRUM: DEFAULT_SPECTRUM, PARTICLES: DEFAULT_PARTICLES, NOTATION: DEFAULT_NOTATION, PROGRESS_BAR: DEFAULT_PROGRESS_BAR, TEXT: DEFAULT_TEXT_BOX, IMAGE: DEFAULT_IMAGE,
  TEMPO_INFO: DEFAULT_TEMPO_INFO, BAR_BEAT: DEFAULT_BAR_BEAT, KEY_SCALE: DEFAULT_KEY_SCALE, VELOCITY: DEFAULT_VELOCITY, DENSITY: DEFAULT_DENSITY, PITCH_WHEEL: DEFAULT_PITCH_WHEEL,
  ARRANGEMENT: DEFAULT_ARRANGEMENT, DRUM_PAD: DEFAULT_DRUM_PAD, SECTION: DEFAULT_SECTION, LYRICS: DEFAULT_LYRICS, AUTOMATION: DEFAULT_AUTOMATION,
  PANEL: DEFAULT_PANEL, DEGREE: DEFAULT_DEGREE, DOTS: DEFAULT_DOTS,
};
/** Thuộc tính mặc định của một loại widget (bản sao sâu): mốc tham chiếu của nút ↺ khi widget chưa có bộ dựng sẵn nào áp lên nó. */
export function widgetDefaults(type: WidgetType): Record<string, unknown> {
  return JSON.parse(JSON.stringify(type === 'PIANO_ROLL' ? DEFAULT_PIANO_ROLL : (HUD_DEFAULTS[type] ?? {})));
}
/** Cỡ mặc định khi thêm (tỉ lệ theo khung, hoặc pt cố định), kẹp trong khung. */
const NEW_SIZE: Record<string, (W: number, H: number) => [number, number]> = {
  PIANO_ROLL: (W, H) => [W * 0.6, H * 0.4], TRACK_INFO: (W) => [W * 0.5, 130], EVENT_COUNTER: () => [480, 120], LIVE_TRIGGER: () => [480, 60],
  TIME_BAR: () => [320, 100], CHORD_DETECTION: () => [400, 100], AUDIO_SPECTRUM: (W) => [W * 0.5, 240], PARTICLES: (W, H) => [W * 0.5, H * 0.5], NOTATION: (W, H) => [W * 0.8, H * 0.45], PROGRESS_BAR: (W) => [W * 0.8, 24], TEXT: () => [480, 100], IMAGE: (W, H) => [Math.min(W, H) * 0.4, Math.min(W, H) * 0.4],
  TEMPO_INFO: () => [360, 110], BAR_BEAT: () => [320, 110], KEY_SCALE: () => [320, 110], VELOCITY: () => [360, 160], DENSITY: (W) => [W * 0.5, 200], PITCH_WHEEL: () => [320, 320],
  ARRANGEMENT: (W) => [W * 0.6, 180], DRUM_PAD: () => [360, 360], SECTION: () => [420, 100], LYRICS: (W) => [W * 0.7, 120], AUTOMATION: (W) => [W * 0.5, 140],
  PANEL: (W, H) => [W * 0.4, H * 0.3], DEGREE: (W) => [W * 0.4, 150], DOTS: (W) => [W * 0.35, 180],
};
/** Độ dài tối đa của tên lớp. */
export const MAX_WIDGET_NAME = 60;
/** Tên lớp chuẩn hoá: bỏ khoảng trắng đầu/cuối, gộp khoảng trắng liền nhau, bỏ ký tự điều khiển. */
export const normalizeWidgetName = (s: string): string => s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
/** Khoá so sánh tên (không phân biệt hoa/thường, không dấu cách thừa). */
export const widgetNameKey = (s: string): string => normalizeWidgetName(s).toLocaleLowerCase();
/** Id mới không trùng trong scene: `<loại>-<n>`. */
export function newWidgetId(scene: SceneDocument, type: WidgetType): string {
  const base = type.toLowerCase().replace(/_/g, '-'), ids = new Set(scene.widgets.map((w) => w.id));
  let n = 1; while (ids.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
/** Widget mới với thuộc tính mặc định, đặt giữa khung (hoặc quanh `center`), nằm trên cùng (T-68: thêm widget từ Editor). */
export function createWidget(scene: SceneDocument, type: WidgetType, center?: { x: number; y: number }): WidgetSpec {
  const { designWidth: W, designHeight: H } = scene.canvas;
  const [w0, h0] = (NEW_SIZE[type] ?? (() => [400, 120]))(W, H);
  const w = Math.round(Math.min(W, w0)), h = Math.round(Math.min(H, h0));
  const cx = center?.x ?? W / 2, cy = center?.y ?? H / 2;
  const layout = { x: Math.round(Math.min(W - w, Math.max(0, cx - w / 2))), y: Math.round(Math.min(H - h, Math.max(0, cy - h / 2))), width: w, height: h, rotation: 0 };
  const id = newWidgetId(scene, type);
  const zIndex = scene.widgets.reduce((m, x) => Math.max(m, x.zIndex), 0) + 1;
  if (type === 'PIANO_ROLL') return { ...pianoRollWidget(layout, {}, id), zIndex };
  const properties = JSON.parse(JSON.stringify(HUD_DEFAULTS[type] ?? {}));
  if (type === 'NOTATION') Object.assign(properties, notationInkFor(scene.canvas.backgroundColor)); // mực nhìn rõ trên nền khung
  // Chord Detection mới tự chọn track hoà âm (piano/keys/guitar, T-06); loại khác đọc mọi track đang hiện.
  return { id, type, zIndex, visible: true, layout: { ...layout, anchor: { ...DEFAULT_ANCHOR } }, trackMappingMode: type === 'CHORD_DETECTION' ? 'AUTO_ASSIGN_FIRST_MELODIC' : 'ALL', assignedTrackIndices: [], properties };
}
/** Bản sao của widget (nhân bản): id mới, dời `offset` pt, nằm ngay trên bản gốc. */
export function duplicateWidget(scene: SceneDocument, w: WidgetSpec, offset = 16): WidgetSpec {
  const { name: _name, ...rest } = JSON.parse(JSON.stringify(w)) as WidgetSpec; // bản sao không mang tên: tên phải khác nhau
  return { ...rest, id: newWidgetId(scene, w.type), zIndex: scene.widgets.reduce((m, x) => Math.max(m, x.zIndex), 0) + 1,
    layout: { ...w.layout, anchor: { ...w.layout.anchor }, x: w.layout.x + offset, y: w.layout.y + offset } };
}
/** Bản sao sâu của bộ kiểu chữ (sửa kiểu trong một scene không đụng bộ mặc định đã đóng băng). */
export const cloneTextStyles = (set: TextStyleSet): Record<string, NamedTextStyle> => Object.fromEntries(Object.entries(set).map(([k, v]) => [k, cloneStyle(v)]));
const clonePiano = (p: PianoRollProps): PianoRollProps => ({ ...p, noteStyle: { base: { ...p.noteStyle.base }, tracks: { ...p.noteStyle.tracks } }, keyboard: { ...p.keyboard }, grid: { ...(p.grid ?? DEFAULT_ROLL_GRID) } });

/** Text animator của Ô chữ (T-35): mọi trường về mặc định/kẹp khi sai. */
function sanitizeTextAnimator(S: Sanitizer, v: unknown, p: string): TextAnimator {
  const A = isObj(v) ? v : (S.warn(p, v, 'không phải đối tượng; dùng mặc định'), {}), d = DEFAULT_TEXT_ANIMATOR;
  return {
    enabled: S.bool(A.enabled, d.enabled, `${p}.enabled`), effect: S.oneOf(A.effect, ANIM_EFFECTS, d.effect, `${p}.effect`),
    unit: S.oneOf(A.unit, ANIM_UNITS, d.unit, `${p}.unit`), order: S.oneOf(A.order, ANIM_ORDERS, d.order, `${p}.order`),
    direction: S.oneOf(A.direction, ['in', 'out'] as const, d.direction, `${p}.direction`),
    start: S.num(A.start, d.start, 0, 86400, `${p}.start`), duration: S.num(A.duration, d.duration, 0, 30, `${p}.duration`), stagger: S.num(A.stagger, d.stagger, 0, 10, `${p}.stagger`),
    ease: S.oneOf(A.ease, EASING_NAMES as readonly string[], d.ease, `${p}.ease`),
    fromOpacity: S.num(A.fromOpacity, d.fromOpacity, 0, 1, `${p}.fromOpacity`), fromX: S.num(A.fromX, d.fromX, -2000, 2000, `${p}.fromX`), fromY: S.num(A.fromY, d.fromY, -2000, 2000, `${p}.fromY`),
    fromScale: S.num(A.fromScale, d.fromScale, 0, 10, `${p}.fromScale`), fromColor: S.str(A.fromColor, d.fromColor, `${p}.fromColor`, (s) => s === '' || HEX.test(s)),
    countUp: S.bool(A.countUp, d.countUp, `${p}.countUp`), seed: Math.round(S.num(A.seed, d.seed, 0, 1e9, `${p}.seed`)),
  };
}

// ───────────────────────────── kiểm và sửa lược đồ (REQ-STORAGE-02) ─────────────────────────────
// Trường lạ bị bỏ; giá trị sai về mặc định kèm cảnh báo; không đọc được thì ném ERR_PRESET_INVALID.

export type SceneWarningCode = 'WARN_PRESET_FONT_MISSING' | 'WARN_PRESET_VALUE' | 'WARN_PRESET_WIDGET_UNKNOWN' | 'WARN_PRESET_UNSUPPORTED' | 'WARN_PRESET_VERSION' | 'WARN_PRESET_MIGRATED' | 'WARN_PRESET_UNSAFE_KEY';
export interface SceneWarning { code: SceneWarningCode; message: string; details: { path: string; value?: unknown; from?: string; to?: string } }
export type SceneErrorCode = 'ERR_PRESET_INVALID' | 'ERR_PRESET_TOO_LARGE' | 'ERR_SCHEMA_NEWER';
export class SceneError extends Error {
  code: SceneErrorCode;
  details: { path: string; [k: string]: unknown };
  constructor(message: string, path: string, code: SceneErrorCode = 'ERR_PRESET_INVALID', extra: Record<string, unknown> = {}) { super(message); this.code = code; this.details = { path, ...extra }; }
}

/** Giới hạn khi đọc preset (NFR-SEC-04). Vượt thì `ERR_PRESET_INVALID` (kích thước tệp: `ERR_PRESET_TOO_LARGE`). */
export const PRESET_LIMITS = Object.freeze({ maxBytes: 1024 * 1024, maxDepth: 12, maxNodes: 20000, maxWidgets: 64, maxString: 4096, maxArray: 1024 });
/** Khoá có thể làm bẩn nguyên mẫu đối tượng: bị bỏ ở mọi độ sâu. */
export const UNSAFE_KEYS: ReadonlySet<string> = new Set(['__proto__', 'constructor', 'prototype']);

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const HEX = /^#[0-9a-f]{6}$/i;

/** Sao chép JSON thô thành cây an toàn: bỏ khoá nguy hiểm (kèm cảnh báo), kiểm giới hạn độ sâu/số nút/độ dài (NFR-SEC-04).
 *  Đối tượng mới luôn dựng bằng `{}` + gán khoá đã lọc, nên `__proto__` không bao giờ thành nguyên mẫu. */
function cleanJson(raw: unknown, warn: (path: string, key: string) => void): unknown {
  const L = PRESET_LIMITS;
  let nodes = 0;
  const walk = (v: unknown, path: string, depth: number): unknown => {
    if (++nodes > L.maxNodes) throw new SceneError(`preset có hơn ${L.maxNodes} nút`, path);
    if (depth > L.maxDepth) throw new SceneError(`preset lồng sâu hơn ${L.maxDepth} cấp`, path);
    if (typeof v === 'string') { if (v.length > L.maxString) throw new SceneError(`chuỗi dài hơn ${L.maxString} ký tự`, path); return v; }
    if (Array.isArray(v)) {
      if (v.length > L.maxArray) throw new SceneError(`mảng dài hơn ${L.maxArray} phần tử`, path);
      return v.map((x, i) => walk(x, `${path}[${i}]`, depth + 1));
    }
    if (typeof v === 'object' && v !== null) {
      const out: Obj = {};
      for (const [k, x] of Object.entries(v)) {
        if (UNSAFE_KEYS.has(k)) { warn(`${path}.${k}`, k); continue; }
        out[k] = walk(x, `${path}.${k}`, depth + 1);
      }
      return out;
    }
    return typeof v === 'number' || typeof v === 'boolean' || v === null ? v : undefined;
  };
  return walk(raw, '$', 0);
}

const parseVersion = (v: unknown): [number, number, number] | null => {
  const m = typeof v === 'string' ? /^(\d{1,4})\.(\d{1,4})\.(\d{1,4})$/.exec(v) : null;
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
};

/** Di trú theo từng bậc phiên bản, trên một bản sao (đối tượng vào không bị sửa). Trả bản đã lên `SCENE_SCHEMA_VERSION`
 *  và phiên bản gốc; ném `ERR_SCHEMA_NEWER` nếu mới hơn ứng dụng hiểu, `ERR_PRESET_INVALID` nếu quá cũ hoặc không đọc được.
 *  0.3.x → 0.4.0: mỗi `widget.layout` thêm `anchor` = tâm (REQ-GRAPHICS-03).
 *  0.4.x → 0.5.0: không đổi cấu trúc. Chữ cũ `{font,size,weight,color}` đọc thành ghi đè trên kiểu mặc định của chỗ đó nên vẽ như cũ;
 *  `textStyles` vắng = bộ dựng sẵn (REQ-GRAPHICS-18).
 *  0.5.x → 0.6.0: không đổi cấu trúc; thêm loại widget `TEXT` (ô chữ) và cú pháp chỗ giữ `{tên:định_dạng}`, `{{` (T-73). Preset cũ vẽ như cũ.
 *  0.6.x → 0.7.0: không đổi cấu trúc; thêm `widget.parent` (parenting), keyframe theo bậc (`kind: 'discrete'`: bật/tắt, lựa chọn, chữ) và đường dẫn
 *  animate của Piano Roll (T-22, T-32). Preset cũ vẽ như cũ.
 *  0.7.x → 0.8.0: không đổi cấu trúc; thêm sổ precomp `comps` và loại lớp `COMP` (D-69). Preset cũ vẽ như cũ. */
export function migrateScene(raw: unknown): { raw: Obj; from: string } {
  if (!isObj(raw)) throw new SceneError('preset không phải đối tượng JSON', '$');
  if (typeof raw.schemaVersion !== 'string') throw new SceneError('thiếu schemaVersion', '$.schemaVersion');
  const v = parseVersion(raw.schemaVersion);
  if (!v) throw new SceneError(`schemaVersion "${raw.schemaVersion.slice(0, 40)}" không đúng dạng chính.phụ.vá`, '$.schemaVersion');
  const cur = parseVersion(SCENE_SCHEMA_VERSION)!;
  if (v[0] > cur[0] || (v[0] === cur[0] && v[1] > cur[1]))
    throw new SceneError(`preset phiên bản ${raw.schemaVersion} mới hơn ứng dụng (đọc được tới ${cur[0]}.${cur[1]}.x)`, '$.schemaVersion', 'ERR_SCHEMA_NEWER', { found: raw.schemaVersion, supported: SCENE_SCHEMA_VERSION });
  if (v[0] !== 0 || v[1] < 3) throw new SceneError(`schemaVersion ${raw.schemaVersion} không đọc được (cần 0.3.x đến 0.8.x)`, '$.schemaVersion');
  let out: Obj = structuredClone(raw);
  if (v[1] === 3) {
    if (Array.isArray(out.widgets)) for (const w of out.widgets) if (isObj(w) && isObj(w.layout) && w.layout.anchor === undefined) w.layout.anchor = { x: DEFAULT_ANCHOR.x, y: DEFAULT_ANCHOR.y };
    out = { ...out, schemaVersion: '0.4.0' };
  }
  if (v[1] <= 4) out = { ...out, schemaVersion: '0.5.0' };
  if (v[1] <= 5) out = { ...out, schemaVersion: '0.6.0' };
  if (v[1] <= 6) out = { ...out, schemaVersion: '0.7.0' };
  if (v[1] <= 7) out = { ...out, schemaVersion: '0.8.0' };
  return { raw: out, from: raw.schemaVersion };
}

/** Đọc một preset/scene từ JSON thô. Trả scene hợp lệ + cảnh báo.
 *  `opts.fonts`: họ phông vẽ được (mặc định phông đóng gói). Chữ dùng họ khác → WARN_PRESET_FONT_MISSING; tên phông giữ nguyên trong
 *  scene (lưu lại không mất), còn Render Core vẽ bằng phông mặc định (REQ-GRAPHICS-18: báo, không đổi âm thầm). */
export function sanitizeScene(input: unknown, opts: { fonts?: readonly string[] } = {}): { scene: SceneDocument; warnings: SceneWarning[] } {
  const warnings: SceneWarning[] = [];
  const w = (code: SceneWarningCode, path: string, value: unknown, message: string) => warnings.push({ code, message, details: { path, value } });
  if (!isObj(input)) throw new SceneError('preset không phải đối tượng JSON', '$');
  const cleaned = cleanJson(input, (path, key) => w('WARN_PRESET_UNSAFE_KEY', path, key, `khoá "${key}" không được phép; bỏ qua`));
  const { raw, from } = migrateScene(cleaned);
  if (from !== raw.schemaVersion) warnings.push({ code: 'WARN_PRESET_MIGRATED', message: `di trú từ ${from} lên ${String(raw.schemaVersion)}`, details: { path: '$.schemaVersion', from, to: String(raw.schemaVersion) } });
  else if (from !== SCENE_SCHEMA_VERSION) w('WARN_PRESET_VERSION', '$.schemaVersion', from, `phiên bản ${from} khác ${SCENE_SCHEMA_VERSION}; đọc theo ${SCENE_SCHEMA_VERSION}`);
  if (!isObj(raw.canvas)) throw new SceneError('thiếu canvas', '$.canvas');
  if (Array.isArray(raw.widgets) && raw.widgets.length > PRESET_LIMITS.maxWidgets) throw new SceneError(`preset có hơn ${PRESET_LIMITS.maxWidgets} widget`, '$.widgets');

  const num = (v: unknown, d: number, lo: number, hi: number, path: string): number => {
    if (v === undefined) return d;
    if (typeof v !== 'number' || !Number.isFinite(v)) { w('WARN_PRESET_VALUE', path, v, 'không phải số; dùng mặc định'); return d; }
    if (v < lo || v > hi) { const c = Math.min(hi, Math.max(lo, v)); w('WARN_PRESET_VALUE', path, v, `ngoài [${lo}, ${hi}]; kẹp về ${c}`); return c; }
    return v;
  };
  const str = (v: unknown, d: string, path: string, ok?: (s: string) => boolean): string => {
    if (v === undefined) return d;
    if (typeof v !== 'string' || (ok && !ok(v))) { w('WARN_PRESET_VALUE', path, v, 'giá trị không hợp lệ; dùng mặc định'); return d; }
    return v;
  };
  const bool = (v: unknown, d: boolean, path: string): boolean => {
    if (v === undefined) return d;
    if (typeof v !== 'boolean') { w('WARN_PRESET_VALUE', path, v, 'không phải true/false; dùng mặc định'); return d; }
    return v;
  };
  const oneOf = <T extends string>(v: unknown, list: readonly T[], d: T, path: string): T => {
    if (v === undefined) return d;
    if (!list.includes(v as T)) { w('WARN_PRESET_VALUE', path, v, `không thuộc ${list.join('/')}; dùng ${d}`); return d; }
    return v as T;
  };

  const S: Sanitizer = { num, str, bool, oneOf, warn: (path, value, message) => w('WARN_PRESET_VALUE', path, value, message) };
  const textStyles = sanitizeTextStyles(S, raw.textStyles, '$.textStyles');
  S.styleIds = new Set(Object.keys(textStyles));

  const c = raw.canvas;
  const dw = Math.round(num(c.designWidth, 1920, 256, 4096, '$.canvas.designWidth'));
  const dh = Math.round(num(c.designHeight, 1080, 256, 4096, '$.canvas.designHeight'));
  if (c.backgroundImageData != null) w('WARN_PRESET_UNSUPPORTED', '$.canvas.backgroundImageData', '(ảnh)', 'preset không chứa ảnh nền (ảnh là tài nguyên của phiên); bỏ qua');
  const bi = isObj(c.backgroundImage) ? c.backgroundImage : undefined;
  const sn = isObj(c.snapping) ? c.snapping : {};
  const canvas: CanvasSpec = {
    aspectRatio: str(c.aspectRatio, `${dw}:${dh}`, '$.canvas.aspectRatio'),
    designWidth: dw, designHeight: dh,
    backgroundColor: str(c.backgroundColor, '#0c0e16', '$.canvas.backgroundColor', (s) => HEX.test(s)),
    backgroundImageData: null,
    ...(bi ? { backgroundImage: { fit: oneOf(bi.fit, ['COVER', 'CONTAIN', 'STRETCH'] as const, DEFAULT_BACKGROUND.fit, '$.canvas.backgroundImage.fit'),
      opacity: num(bi.opacity, DEFAULT_BACKGROUND.opacity, 0, 1, '$.canvas.backgroundImage.opacity'), dim: num(bi.dim, DEFAULT_BACKGROUND.dim, 0, 1, '$.canvas.backgroundImage.dim') } } : {}),
    snapping: {
      gridEnabled: bool(sn.gridEnabled, true, '$.canvas.snapping.gridEnabled'),
      gridSize: num(sn.gridSize, 8, 1, 256, '$.canvas.snapping.gridSize'),
      smartGuidesEnabled: bool(sn.smartGuidesEnabled, true, '$.canvas.snapping.smartGuidesEnabled'),
    },
  };

  // Đọc một danh sách widget (của scene, hoặc của một comp: D-69). Id và tên lớp không trùng trong cùng danh sách.
  const readWidgets = (rawList: unknown, at: string): WidgetSpec[] => {
  const widgets: WidgetSpec[] = [];
  const ids = new Set<string>(), names = new Set<string>();
  const list = Array.isArray(rawList) ? rawList : (w('WARN_PRESET_VALUE', at, rawList, 'không phải mảng; bỏ qua'), []);
  list.forEach((rw, i) => {
    const p = `${at}[${i}]`;
    if (!isObj(rw)) { w('WARN_PRESET_VALUE', p, rw, 'widget không phải đối tượng; bỏ qua'); return; }
    if (!WIDGET_TYPES.includes(rw.type as WidgetType)) { w('WARN_PRESET_WIDGET_UNKNOWN', `${p}.type`, rw.type, 'loại widget không hợp lệ; bỏ qua'); return; }
    let id = str(rw.id, `${String(rw.type).toLowerCase()}-${i}`, `${p}.id`, (s) => s.length > 0 && s.length <= 64);
    if (id.includes(COMP_SEP)) { const n = id.split(COMP_SEP).join('-'); w('WARN_PRESET_VALUE', `${p}.id`, id, `id không được chứa "${COMP_SEP}"; đổi thành ${n}`); id = n; }
    if (ids.has(id)) { const n = `${id}-${i}`; w('WARN_PRESET_VALUE', `${p}.id`, id, `id trùng; đổi thành ${n}`); id = n; }
    ids.add(id);
    const L = isObj(rw.layout) ? rw.layout : {};
    const layout: WidgetLayout = {
      x: num(L.x, 0, -dw, 2 * dw, `${p}.layout.x`), y: num(L.y, 0, -dh, 2 * dh, `${p}.layout.y`),
      width: num(L.width, dw, 1, 4 * dw, `${p}.layout.width`), height: num(L.height, dh, 1, 4 * dh, `${p}.layout.height`),
      rotation: normalizeAngle(num(L.rotation, 0, -360, 360, `${p}.layout.rotation`)),
      anchor: { x: DEFAULT_ANCHOR.x, y: DEFAULT_ANCHOR.y },
    };
    const A = isObj(L.anchor) ? L.anchor : {};
    layout.anchor = { x: num(A.x, DEFAULT_ANCHOR.x, 0, 1, `${p}.layout.anchor.x`), y: num(A.y, DEFAULT_ANCHOR.y, 0, 1, `${p}.layout.anchor.y`) };
    const mode = oneOf(rw.trackMappingMode, ['ALL', 'MANUAL', 'AUTO_ASSIGN_FIRST_MELODIC'] as const, 'ALL', `${p}.trackMappingMode`);
    const idx = Array.isArray(rw.assignedTrackIndices) ? rw.assignedTrackIndices.filter((n): n is number => Number.isInteger(n) && (n as number) >= 0) : [];
    const base: Omit<WidgetSpec, 'properties'> = {
      id, type: rw.type as WidgetType, zIndex: Math.round(num(rw.zIndex, 10 * (i + 1), -10000, 10000, `${p}.zIndex`)),
      visible: bool(rw.visible, true, `${p}.visible`), layout, trackMappingMode: mode, assignedTrackIndices: idx,
    };
    if (rw.motion !== undefined) { const mo = sanitizeMotion(S, rw.motion, `${p}.motion`); if (mo) base.motion = mo; }
    if (rw.animate !== undefined) { const an = sanitizeAnimate(S, rw.animate, `${p}.animate`, rw.type as WidgetType); if (an) base.animate = an; }
    if (rw.parent !== undefined) { if (typeof rw.parent === 'string' && rw.parent && rw.parent.length <= 64 && rw.parent !== id) base.parent = rw.parent; else w('WARN_PRESET_VALUE', `${p}.parent`, rw.parent, 'widget cha không hợp lệ; bỏ'); }
    if (rw.visibility !== undefined) { const vis = sanitizeVisibility(S, rw.visibility, `${p}.visibility`); if (vis) base.visibility = vis; }
    if (rw.trackRanges !== undefined) { const tr = sanitizeTrackRanges(S, rw.trackRanges, `${p}.trackRanges`); if (tr.length) base.trackRanges = tr; }
    if (rw.name !== undefined) { // tên lớp: chuỗi 1–60 ký tự, không trùng (trùng thì bỏ tên, dùng tên theo loại)
      const nm = typeof rw.name === 'string' ? normalizeWidgetName(rw.name) : '';
      if (!nm || nm.length > MAX_WIDGET_NAME) w('WARN_PRESET_VALUE', `${p}.name`, rw.name, `tên lớp phải dài 1–${MAX_WIDGET_NAME} ký tự; bỏ tên`);
      else if (names.has(widgetNameKey(nm))) w('WARN_PRESET_VALUE', `${p}.name`, rw.name, 'tên lớp trùng với lớp khác; bỏ tên');
      else { names.add(widgetNameKey(nm)); base.name = nm; }
    }
    const P = isObj(rw.properties) ? rw.properties : {};
    if (rw.type === 'PIANO_ROLL') {
      const d = DEFAULT_PIANO_ROLL;
      // T-59: hướng chảy là `flowAngle`; preset cũ ghi VERTICAL (nốt rơi) đọc thành 90°.
      if (P.orientation !== undefined && P.orientation !== 'HORIZONTAL' && P.orientation !== 'VERTICAL') w('WARN_PRESET_VALUE', `${p}.properties.orientation`, P.orientation, 'không thuộc HORIZONTAL/VERTICAL; dùng HORIZONTAL');
      const gr = isObj(P.grid) ? P.grid : {};
      const ns = isObj(P.noteStyle) ? P.noteStyle : {};
      const nsBase = { ...DEFAULT_NOTE_STYLE, ...(isObj(ns.base) ? ns.base : {}) } as NoteStyle;
      if (typeof P.noteBorderRadius === 'number') nsBase.cornerRadius = P.noteBorderRadius; // tên cũ trong ví dụ SRS
      const tracks: Record<string, Partial<NoteStyle>> = {};
      if (isObj(ns.tracks)) for (const [k, v] of Object.entries(ns.tracks)) if (isObj(v)) tracks[k] = v as Partial<NoteStyle>;
      const kb = isObj(P.keyboard) ? P.keyboard : {};
      let pMin = Math.round(num(P.pitchMin, d.pitchMin, 0, 127, `${p}.properties.pitchMin`));
      let pMax = Math.round(num(P.pitchMax, d.pitchMax, 0, 127, `${p}.properties.pitchMax`));
      if (pMin > pMax) { w('WARN_PRESET_VALUE', `${p}.properties.pitchMin`, pMin, 'pitchMin > pitchMax; đổi chỗ'); [pMin, pMax] = [pMax, pMin]; }
      const look = num(P.lookaheadSeconds, d.lookaheadSeconds, 1, 8, `${p}.properties.lookaheadSeconds`);
      const ratio = num(P.playheadPositionRatio, d.playheadPositionRatio, 0.05, 0.95, `${p}.properties.playheadPositionRatio`);
      const props: PianoRollProps = {
        orientation: 'HORIZONTAL',
        pitchRangeMode: oneOf(P.pitchRangeMode, ['FIT_CONTENT', 'CUSTOM'] as const, d.pitchRangeMode, `${p}.properties.pitchRangeMode`),
        pitchMin: pMin, pitchMax: pMax,
        lookaheadSeconds: look, playheadPositionRatio: ratio,
        visibleSeconds: num(P.visibleSeconds, Math.min(60, Math.max(0.5, Math.round(look / (1 - ratio) * 1e6) / 1e6)), 0.5, 60, `${p}.properties.visibleSeconds`),
        scrollMode: oneOf(P.scrollMode, ['SCROLL', 'PAGE'] as const, d.scrollMode, `${p}.properties.scrollMode`),
        pageUnit: oneOf(P.pageUnit, ['SECONDS', 'BARS'] as const, d.pageUnit, `${p}.properties.pageUnit`),
        pageBars: Math.round(num(P.pageBars, d.pageBars, 1, 32, `${p}.properties.pageBars`)),
        revealAhead: num(P.revealAhead, d.revealAhead, 0, 30, `${p}.properties.revealAhead`),
        transition: oneOf(P.transition, NOTE_TRANSITION_NAMES as readonly string[], d.transition, `${p}.properties.transition`),
        noteStyle: { base: sanitizeStyle(nsBase), tracks },
        keyboard: {
          enabled: bool(kb.enabled, d.keyboard.enabled, `${p}.properties.keyboard.enabled`),
          width: num(kb.width, d.keyboard.width, 8, 400, `${p}.properties.keyboard.width`),
          whiteColor: str(kb.whiteColor, d.keyboard.whiteColor, `${p}.properties.keyboard.whiteColor`, (s) => HEX.test(s)),
          blackColor: str(kb.blackColor, d.keyboard.blackColor, `${p}.properties.keyboard.blackColor`, (s) => HEX.test(s)),
          useTrackColor: bool(kb.useTrackColor, d.keyboard.useTrackColor, `${p}.properties.keyboard.useTrackColor`),
          shape: oneOf(kb.shape, KEYBOARD_SHAPES, d.keyboard.shape, `${p}.properties.keyboard.shape`),
          pressedColor: str(kb.pressedColor, d.keyboard.pressedColor, `${p}.properties.keyboard.pressedColor`, (s) => HEX.test(s)),
          scale: oneOf(kb.scale, KEYBOARD_SCALES, d.keyboard.scale, `${p}.properties.keyboard.scale`),
          scaleColor: str(kb.scaleColor, d.keyboard.scaleColor, `${p}.properties.keyboard.scaleColor`, (s) => HEX.test(s)),
          scaleOpacity: num(kb.scaleOpacity, d.keyboard.scaleOpacity, 0, 1, `${p}.properties.keyboard.scaleOpacity`),
          labels: oneOf(kb.labels, KEY_LABEL_MODES, d.keyboard.labels, `${p}.properties.keyboard.labels`),
          labelOctave: bool(kb.labelOctave, d.keyboard.labelOctave, `${p}.properties.keyboard.labelOctave`),
          labelColor: str(kb.labelColor, d.keyboard.labelColor, `${p}.properties.keyboard.labelColor`, (s) => s === '' || HEX.test(s)),
        },
        playheadColor: str(P.playheadColor, d.playheadColor, `${p}.properties.playheadColor`, (s) => HEX.test(s)),
        playheadWidth: num(P.playheadWidth, d.playheadWidth, 0, 40, `${p}.properties.playheadWidth`),
        playheadVisible: bool(P.playheadVisible, d.playheadVisible, `${p}.properties.playheadVisible`),
        flowAngle: flowAngleOf(num(P.flowAngle, P.orientation === 'VERTICAL' ? 90 : d.flowAngle, -360, 720, `${p}.properties.flowAngle`)),
        flowMirror: bool(P.flowMirror, d.flowMirror, `${p}.properties.flowMirror`),
        labelsUpright: bool(P.labelsUpright, d.labelsUpright, `${p}.properties.labelsUpright`),
        playheadStyle: oneOf(P.playheadStyle, PLAYHEAD_STYLES, d.playheadStyle, `${p}.properties.playheadStyle`),
        playheadArrows: bool(P.playheadArrows, d.playheadArrows, `${p}.properties.playheadArrows`),
        playheadLength: num(P.playheadLength, d.playheadLength, 0.05, 1, `${p}.properties.playheadLength`),
        playheadGlow: num(P.playheadGlow, d.playheadGlow, 0, 1, `${p}.properties.playheadGlow`),
        playheadHit: oneOf(P.playheadHit, PLAYHEAD_HITS, d.playheadHit, `${p}.properties.playheadHit`),
        playheadHitMs: num(P.playheadHitMs, d.playheadHitMs, 30, 2000, `${p}.properties.playheadHitMs`),
        grid: {
          bars: bool(gr.bars, d.grid.bars, `${p}.properties.grid.bars`), beats: bool(gr.beats, d.grid.beats, `${p}.properties.grid.beats`),
          numbers: bool(gr.numbers, d.grid.numbers, `${p}.properties.grid.numbers`),
          color: str(gr.color, d.grid.color, `${p}.properties.grid.color`, (s) => HEX.test(s)), opacity: num(gr.opacity, d.grid.opacity, 0, 1, `${p}.properties.grid.opacity`),
        },
      };
      widgets.push({ ...base, properties: props });
    } else if (base.type in HUD_SANITIZERS) {
      widgets.push({ ...base, properties: HUD_SANITIZERS[base.type as keyof typeof HUD_SANITIZERS](P, `${p}.properties`, S) });
    } else if (rw.type === 'COMP') {
      // Lớp precomp (D-69): chỉ mang khoá comp và điểm bắt đầu; comp thiếu/vòng lặp/quá sâu kiểm ở dưới khi đã đọc hết sổ comp.
      const comp = typeof P.comp === 'string' && P.comp.length > 0 && P.comp.length <= MAX_COMP_ID ? P.comp : '';
      if (!comp) { w('WARN_PRESET_VALUE', `${p}.properties.comp`, P.comp, 'lớp precomp thiếu khoá comp; bỏ lớp'); return; }
      const speed = num(P.speed, 1, 0.1, 10, `${p}.properties.speed`);
      const props: CompProps = { comp, start: num(P.start, 0, -86400, 86400, `${p}.properties.start`), ...(speed !== 1 ? { speed } : {}) };
      widgets.push({ ...base, properties: props });
    } else {
      // Widget chưa có renderer (T-37…): giữ nguyên thuộc tính để không mất dữ liệu khi lưu lại; renderFrame bỏ qua.
      widgets.push({ ...base, properties: P });
    }
  });

  // Parenting (0.7.0): cha không tồn tại, vòng lặp hoặc chuỗi quá sâu → bỏ `parent` kèm cảnh báo (preset vẫn đọc được, con đứng yên như không có cha).
  const REASON = { missing: 'widget cha không tồn tại; bỏ', cycle: 'widget cha tạo vòng lặp; bỏ', depth: `chuỗi widget cha sâu hơn ${MAX_PARENT_DEPTH}; bỏ` } as const;
  for (const pr of resolveParents(widgets).problems) {
    const i = widgets.findIndex((x) => x.id === pr.id);
    delete widgets[i].parent;
    w('WARN_PRESET_VALUE', `${at}[${i}].parent`, pr.parent, REASON[pr.reason]);
  }
  return widgets;
  };
  const widgets = readWidgets(raw.widgets, '$.widgets');

  // Sổ comp (D-69): khoá 1–64 ký tự không chứa "/", tối đa MAX_COMPS comp, mỗi comp tối đa PRESET_LIMITS.maxWidgets widget.
  const comps: Record<string, CompSpec> = {};
  if (raw.comps !== undefined) {
    if (!isObj(raw.comps)) w('WARN_PRESET_VALUE', '$.comps', raw.comps, 'không phải đối tượng; bỏ');
    else {
      const entries = Object.entries(raw.comps);
      if (entries.length > MAX_COMPS) w('WARN_PRESET_VALUE', '$.comps', entries.length, `quá ${MAX_COMPS} comp; bỏ phần thừa`);
      for (const [cid, rc] of entries.slice(0, MAX_COMPS)) {
        const cp = `$.comps.${cid}`;
        if (!cid || cid.length > MAX_COMP_ID || cid.includes(COMP_SEP) || !isObj(rc)) { w('WARN_PRESET_VALUE', cp, cid, 'comp không hợp lệ; bỏ'); continue; }
        if (Array.isArray(rc.widgets) && rc.widgets.length > PRESET_LIMITS.maxWidgets) throw new SceneError(`comp "${cid}" có hơn ${PRESET_LIMITS.maxWidgets} widget`, `${cp}.widgets`);
        const nm = typeof rc.name === 'string' ? normalizeWidgetName(rc.name).slice(0, MAX_COMP_NAME) : '';
        comps[cid] = { name: nm || cid, widgets: readWidgets(rc.widgets, `${cp}.widgets`) };
      }
    }
  }
  // Lớp COMP trỏ tới comp không có, tạo vòng lặp hoặc lồng quá MAX_COMP_DEPTH cấp: bỏ lớp đó kèm cảnh báo. Comp không lớp nào dùng vẫn giữ.
  const dropBadLayers = (list: WidgetSpec[], at: string, inside: readonly string[]): WidgetSpec[] => list.filter((x, i) => {
    const c = compOf(x); if (!c) return true;
    const ok = !!comps[c.comp] && canPlaceComp(comps, c.comp, inside);
    if (!ok) w('WARN_PRESET_VALUE', `${at}[${i}].properties.comp`, c.comp, comps[c.comp] ? `precomp tạo vòng lặp hoặc lồng sâu hơn ${MAX_COMP_DEPTH} cấp; bỏ lớp` : 'comp không tồn tại; bỏ lớp');
    return ok;
  });
  for (const [cid, spec] of Object.entries(comps)) spec.widgets = dropBadLayers(spec.widgets, `$.comps.${cid}.widgets`, [cid]);
  const rootWidgets = dropBadLayers(widgets, '$.widgets', []);
  widgets.length = 0; widgets.push(...rootWidgets);
  if (flatCount({ widgets, comps } as unknown as SceneDocument) > MAX_FLAT_WIDGETS) throw new SceneError(`preset có hơn ${MAX_FLAT_WIDGETS} lớp sau khi trải precomp`, '$.comps');

  // Phông không có sẵn: một cảnh báo cho mỗi họ (đường dẫn chỗ đầu tiên dùng nó).
  const fonts = opts.fonts ?? BUNDLED_TEXT_FAMILIES, seen = new Set<string>();
  const missing = (font: unknown, path: string) => {
    if (typeof font !== 'string' || fonts.includes(font) || seen.has(font)) return;
    seen.add(font);
    warnings.push({ code: 'WARN_PRESET_FONT_MISSING', message: `phông "${font}" không có sẵn; vẽ bằng ${TEXT_DEFAULT_FONT}`, details: { path, value: font, to: TEXT_DEFAULT_FONT } });
  };
  for (const [id, st] of Object.entries(textStyles)) missing(st.font, `$.textStyles.${id}.font`);
  const fontsOf = (list: WidgetSpec[], at: string) => list.forEach((wd, i) => {
    const P = wd.properties as Record<string, unknown>;
    for (const f of Object.keys((TEXT_FIELDS as Record<string, object>)[wd.type] ?? {})) missing((P[f] as TextRef | undefined)?.font, `${at}[${i}].properties.${f}.font`);
  });
  fontsOf(widgets, '$.widgets');
  for (const [cid, spec] of Object.entries(comps)) fontsOf(spec.widgets, `$.comps.${cid}.widgets`);

  const phases = raw.phases === undefined ? undefined : sanitizePhases(S, raw.phases, '$.phases');
  const nn = isObj(raw.noteNaming) ? raw.noteNaming : null;
  const noteNaming: NoteNaming | undefined = nn ? { system: S.oneOf(nn.system, NAMING_SYSTEMS, DEFAULT_NAMING.system, '$.noteNaming.system'), accidental: S.oneOf(nn.accidental, ['SHARP', 'FLAT'] as const, DEFAULT_NAMING.accidental, '$.noteNaming.accidental'),
    ascii: S.bool(nn.ascii, DEFAULT_NAMING.ascii, '$.noteNaming.ascii'), middleC: Math.round(S.num(nn.middleC, DEFAULT_NAMING.middleC, 3, 4, '$.noteNaming.middleC')) === 3 ? 3 : 4 } : undefined;
  const tonic = raw.tonic === undefined ? undefined : Math.round(num(raw.tonic, NaN, 0, 11, '$.tonic'));
  return {
    scene: { schemaVersion: SCENE_SCHEMA_VERSION, presetName: str(raw.presetName, 'Untitled', '$.presetName'), author: str(raw.author, '', '$.author'), canvas, textStyles, ...(phases?.length ? { phases } : {}), ...(tonic !== undefined && !Number.isNaN(tonic) ? { tonic } : {}), ...(noteNaming ? { noteNaming } : {}), widgets, ...(Object.keys(comps).length ? { comps } : {}) },
    warnings,
  };
}

// ───────────────────────────── thuộc tính widget chữ (T-69) ─────────────────────────────
/** Bộ kiểm giá trị dùng chung (đóng gói từ sanitizeScene để mỗi widget kiểm theo đường dẫn riêng). */
export interface Sanitizer {
  num(v: unknown, d: number, lo: number, hi: number, path: string): number;
  str(v: unknown, d: string, path: string, ok?: (s: string) => boolean): string;
  bool(v: unknown, d: boolean, path: string): boolean;
  oneOf<T extends string>(v: unknown, list: readonly T[], d: T, path: string): T;
  warn(path: string, value: unknown, message: string): void;
  /** Id kiểu chữ có trong scene (để kiểm `styleId` của chữ). */
  styleIds?: ReadonlySet<string>;
}
/** Bộ kiểm im lặng: kẹp về miền hợp lệ, không ghi cảnh báo. Dùng cho giá trị tính mỗi khung (thuộc tính đã animate) để widget luôn nhận giá trị hợp lệ. */
export function silentSanitizer(styleIds?: ReadonlySet<string>): Sanitizer {
  const fin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
  return {
    num: (v, d, lo, hi) => (fin(v) ? Math.min(hi, Math.max(lo, v)) : d),
    str: (v, d, _p, ok) => (typeof v === 'string' && (!ok || ok(v)) ? v : d),
    bool: (v, d) => (typeof v === 'boolean' ? v : d),
    oneOf: (v, list, d) => (list.includes(v as never) ? (v as never) : d),
    warn: () => {}, styleIds,
  };
}
/** Thuộc tính của widget (trừ Piano Roll) qua đúng bộ kiểm của loại đó. Loại không có bộ kiểm (Piano Roll) → null. */
export function sanitizeWidgetProps(type: WidgetType, props: unknown, S: Sanitizer): Record<string, unknown> | null {
  const f = (HUD_SANITIZERS as Record<string, ((P: Obj, p: string, S: Sanitizer) => unknown) | undefined>)[type];
  return f ? (f(isObj(props) ? props : {}, '$', S) as Record<string, unknown>) : null;
}
/** Khoảng hiển thị: danh sách khoảng (≤ MAX_RANGES), mỗi khoảng from ≥ 0, to > from hoặc null (tới hết bài); khoảng sai bị bỏ kèm cảnh báo. */
export function sanitizeVisibility(S: Sanitizer, v: unknown, path: string): WidgetVisibility | undefined {
  if (!isObj(v)) { S.warn(path, v, 'khoảng hiển thị không phải đối tượng; bỏ'); return undefined; }
  const ranges: TimeRange[] = [];
  const list = Array.isArray(v.ranges) ? v.ranges : (S.warn(`${path}.ranges`, v.ranges, 'không phải mảng; coi như hiện suốt bài'), [{ from: 0, to: null }]);
  if (list.length > MAX_RANGES) S.warn(`${path}.ranges`, list.length, `quá ${MAX_RANGES} khoảng; bỏ phần thừa`);
  list.slice(0, MAX_RANGES).forEach((r, i) => {
    const rp = `${path}.ranges[${i}]`;
    if (!isObj(r)) { S.warn(rp, r, 'khoảng không phải đối tượng; bỏ'); return; }
    const from = S.num(r.from, NaN, 0, 86400, `${rp}.from`);
    const to = r.to === null || r.to === undefined ? null : S.num(r.to, NaN, 0, 86400, `${rp}.to`);
    if (Number.isNaN(from) || (to !== null && Number.isNaN(to))) { S.warn(rp, r, 'khoảng thiếu mốc hợp lệ; bỏ'); return; }
    if (to !== null && to <= from) { S.warn(rp, r, '"to" phải lớn hơn "from"; bỏ'); return; }
    ranges.push({ from, to });
  });
  ranges.sort((a, b) => a.from - b.from);
  return { ranges, fadeIn: S.num(v.fadeIn, 0, 0, MAX_FADE, `${path}.fadeIn`), fadeOut: S.num(v.fadeOut, 0, 0, MAX_FADE, `${path}.fadeOut`) };
}
/** Đoạn đổi tập track (T-52): tối đa MAX_TRACK_RANGES đoạn; mốc như khoảng hiển thị; chỉ số track nguyên ≥ 0, không trùng, sắp tăng; sắp đoạn theo `from`. */
export function sanitizeTrackRanges(S: Sanitizer, v: unknown, path: string): TrackRange[] {
  if (!Array.isArray(v)) { S.warn(path, v, 'không phải mảng; bỏ'); return []; }
  if (v.length > MAX_TRACK_RANGES) S.warn(path, v.length, `quá ${MAX_TRACK_RANGES} đoạn; bỏ phần thừa`);
  const out: TrackRange[] = [];
  v.slice(0, MAX_TRACK_RANGES).forEach((r, i) => {
    const rp = `${path}[${i}]`;
    if (!isObj(r)) { S.warn(rp, r, 'đoạn không phải đối tượng; bỏ'); return; }
    const from = S.num(r.from, NaN, 0, 86400, `${rp}.from`);
    const to = r.to === null || r.to === undefined ? null : S.num(r.to, NaN, 0, 86400, `${rp}.to`);
    if (Number.isNaN(from) || (to !== null && Number.isNaN(to))) { S.warn(rp, r, 'đoạn thiếu mốc hợp lệ; bỏ'); return; }
    if (to !== null && to <= from) { S.warn(rp, r, '"to" phải lớn hơn "from"; bỏ'); return; }
    const list = Array.isArray(r.tracks) ? r.tracks : (S.warn(`${rp}.tracks`, r.tracks, 'không phải mảng; coi như rỗng'), []);
    const tracks = [...new Set(list.filter((n): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) < 4096))].sort((a, b) => a - b);
    out.push({ from, to, tracks });
  });
  return out.sort((a, b) => a.from - b.from);
}
/** Phase: mảng {name, start}; tên 1–60 ký tự, start ≥ 0; sắp theo start; hai phase cùng start thì giữ phase đầu. */
export function sanitizePhases(S: Sanitizer, v: unknown, path: string): Phase[] {
  if (!Array.isArray(v)) { S.warn(path, v, 'không phải mảng; bỏ'); return []; }
  if (v.length > MAX_PHASES) S.warn(path, v.length, `quá ${MAX_PHASES} phase; bỏ phần thừa`);
  const out: Phase[] = [];
  v.slice(0, MAX_PHASES).forEach((x, i) => {
    const pp = `${path}[${i}]`;
    if (!isObj(x)) { S.warn(pp, x, 'phase không phải đối tượng; bỏ'); return; }
    const name = typeof x.name === 'string' ? normalizeWidgetName(x.name) : '';
    if (!name || name.length > MAX_PHASE_NAME) { S.warn(`${pp}.name`, x.name, `tên phase phải dài 1–${MAX_PHASE_NAME} ký tự; bỏ phase`); return; }
    const start = S.num(x.start, NaN, 0, 86400, `${pp}.start`);
    if (Number.isNaN(start)) { S.warn(`${pp}.start`, x.start, 'thiếu mốc bắt đầu hợp lệ; bỏ phase'); return; }
    out.push({ name, start });
  });
  out.sort((a, b) => a.start - b.start);
  return out.filter((p, i) => i === 0 || p.start > out[i - 1].start);
}
const FONT_OK = (s: string) => /^[\w][\w \-]{0,39}$/.test(s);
/** Mẫu chữ: tên chỗ giữ riêng của widget + chỗ giữ chung; chỗ giữ lạ hoặc định dạng sai → cảnh báo, chữ giữ nguyên (T-73). */
const tpl = (S: Sanitizer, v: unknown, d: string, path: string, keys: readonly string[], max = 200): string => {
  const t = S.str(v, d, path, (s) => s.length <= max);
  const { unknown, badFormat } = checkTemplate(t, [...keys, ...GLOBAL_KEYS, ...ALIAS_KEYS]);
  if (unknown.length) S.warn(path, t, `chỗ giữ lạ {${unknown.join('}, {')}}; chữ được giữ nguyên`);
  if (badFormat.length) S.warn(path, t, `định dạng sai ${badFormat.join(' ')}; chữ được giữ nguyên`);
  return t;
};
// ── kiểu chữ (T-72, REQ-GRAPHICS-18) ──
// Một bảng mô tả mọi trường: dùng cho cả kiểu đầy đủ trong `textStyles` và ghi đè (TextRef) của từng chữ. Ghi đè chỉ giữ trường có mặt
// và hợp lệ (trường sai: cảnh báo rồi bỏ, chữ theo kiểu); số ngoài khoảng được kẹp như mọi thuộc tính khác.
type FieldSpec = readonly ['num', number, number] | readonly ['int', number, number] | readonly ['weight'] | readonly ['bool'] | readonly ['font'] | readonly ['color'] | readonly ['colorOrEmpty']
  | readonly ['one', readonly string[]] | readonly ['gradient'] | readonly ['obj', Readonly<Record<string, FieldSpec>>];
const COLOR: FieldSpec = ['color'];
const TEXT_SPEC: Readonly<Record<string, FieldSpec>> = {
  font: ['font'], weight: ['weight'], italic: ['bool'], size: ['num', 4, 400], scaleX: ['num', 0.1, 10], scaleY: ['num', 0.1, 10], baselineShift: ['num', -400, 400],
  script: ['one', ['none', 'super', 'sub']], underline: ['bool'], strike: ['bool'], decoThickness: ['num', 0, 50], decoColor: ['colorOrEmpty'],
  textCase: ['one', ['none', 'upper', 'lower', 'title', 'smallCaps']], tracking: ['num', -500, 2000], leading: ['num', 0.5, 5],
  color: COLOR, gradient: ['gradient'], opacity: ['num', 0, 1],
  stroke: ['obj', { width: ['num', 0, 50], color: COLOR, position: ['one', ['center', 'outside']], join: ['one', ['miter', 'round', 'bevel']], over: ['bool'] }],
  shadow: ['obj', { enabled: ['bool'], color: COLOR, opacity: ['num', 0, 1], distance: ['num', 0, 200], angle: ['num', -360, 360], blur: ['num', 0, 100] }],
  background: ['obj', { enabled: ['bool'], color: COLOR, opacity: ['num', 0, 1], padX: ['num', 0, 200], padY: ['num', 0, 200], radius: ['num', 0, 200] }],
  tabularNums: ['bool'], overflow: ['one', ['ellipsis', 'shrink', 'visible']], minSize: ['num', 4, 400], wrap: ['bool'], maxLines: ['int', 1, 20],
};
const DROP = Symbol('drop');
function field(S: Sanitizer, spec: FieldSpec, v: unknown, path: string): unknown {
  const bad = (msg = 'giá trị không hợp lệ; bỏ ghi đè') => { S.warn(path, v, msg); return DROP; };
  switch (spec[0]) {
    case 'num': case 'int': {
      const n = S.num(v, NaN, spec[1], spec[2], path);
      return Number.isNaN(n) ? DROP : spec[0] === 'int' ? Math.round(n) : n;
    }
    case 'weight': { const n = S.num(v, NaN, 100, 900, path); return Number.isNaN(n) ? DROP : Math.round(n / 100) * 100; }
    case 'bool': return typeof v === 'boolean' ? v : bad('không phải true/false; bỏ ghi đè');
    case 'font': return typeof v === 'string' && FONT_OK(v) ? v : bad();
    case 'color': return typeof v === 'string' && HEX.test(v) ? v : bad();
    case 'colorOrEmpty': return typeof v === 'string' && (v === '' || HEX.test(v)) ? v : bad();
    case 'one': return typeof v === 'string' && spec[1].includes(v) ? v : bad(`không thuộc ${spec[1].join('/')}; bỏ ghi đè`);
    case 'gradient': {
      if (v === null) return null;
      if (!isObj(v) || !Array.isArray(v.stops)) return bad();
      const stops = v.stops.slice(0, 8).filter((x): x is Obj => isObj(x) && typeof x.at === 'number' && Number.isFinite(x.at) && typeof x.color === 'string' && HEX.test(x.color))
        .map((x) => ({ at: Math.min(1, Math.max(0, x.at as number)), color: x.color as string })).sort((a, b) => a.at - b.at);
      if (stops.length < 2) return bad('gradient cần ít nhất 2 điểm màu hợp lệ; bỏ ghi đè');
      const kind = v.kind === 'radial' ? 'radial' : 'linear';
      const angle = S.num(v.angle, 0, -360, 360, `${path}.angle`);
      return { kind, angle, stops };
    }
    case 'obj': {
      if (!isObj(v)) return bad();
      const out: Obj = {};
      for (const [k, sp] of Object.entries(spec[1])) if (v[k] !== undefined) { const x = field(S, sp, v[k], `${path}.${k}`); if (x !== DROP) out[k] = x; }
      return out;
    }
  }
}
/** Các trường kiểu chữ hợp lệ có mặt trong `o` (dạng ghi đè). */
function textFields(S: Sanitizer, o: Obj, path: string): Partial<TextStyle> {
  const out: Obj = {};
  for (const [k, spec] of Object.entries(TEXT_SPEC)) if (o[k] !== undefined) { const x = field(S, spec, o[k], `${path}.${k}`); if (x !== DROP) out[k] = x; }
  return out as Partial<TextStyle>;
}
const STYLE_ID = /^[A-Za-z][\w-]{0,31}$/;
/** Bộ kiểu của scene: bộ dựng sẵn + kiểu preset thêm/sửa (kiểu trùng id dựng sẵn ghi đè lên nó, kiểu mới dựa trên kiểu gốc). */
function sanitizeTextStyles(S: Sanitizer, v: unknown, path: string): Record<string, NamedTextStyle> {
  const out = cloneTextStyles(DEFAULT_TEXT_STYLES);
  if (v === undefined) return out;
  if (!isObj(v)) { S.warn(path, v, 'không phải đối tượng; dùng bộ kiểu dựng sẵn'); return out; }
  let n = 0;
  for (const [id, raw] of Object.entries(v)) {
    const p = `${path}.${id}`;
    if (!STYLE_ID.test(id)) { S.warn(p, id, 'id kiểu chữ không hợp lệ; bỏ qua'); continue; }
    if (!isObj(raw)) { S.warn(p, raw, 'kiểu chữ không phải đối tượng; bỏ qua'); continue; }
    if (++n > 64) { S.warn(p, id, 'quá 64 kiểu chữ; bỏ qua'); continue; }
    const base: NamedTextStyle = out[id] ?? { ...cloneStyle(BASE_TEXT_STYLE), name: id };
    out[id] = { ...applyOverride(base, textFields(S, raw, p) as TextRef), name: S.str(raw.name, base.name, `${p}.name`, (s) => s.length > 0 && s.length <= 60) };
  }
  return out;
}
/** Chữ của widget: vắng → ghi đè mặc định của chỗ đó; có → `styleId` (phải có trong bộ) + các trường ghi đè hợp lệ. */
const textRef = (S: Sanitizer, v: unknown, d: TextRef, path: string): TextRef => {
  if (v === undefined) return { ...d };
  if (!isObj(v)) { S.warn(path, v, 'không phải đối tượng; dùng mặc định'); return { ...d }; }
  const out: TextRef = textFields(S, v, path) as TextRef;
  if (v.styleId !== undefined) {
    if (typeof v.styleId === 'string' && (S.styleIds?.has(v.styleId) ?? v.styleId in DEFAULT_TEXT_STYLES)) out.styleId = v.styleId;
    else S.warn(`${path}.styleId`, v.styleId, 'không có kiểu chữ này; dùng kiểu mặc định của chỗ chữ');
  }
  return out;
};
const ALIGNS = ['left', 'center', 'right'] as const;
const lineCfg = (S: Sanitizer, v: unknown, d: LineCfg, path: string, keys: readonly string[]): LineCfg => {
  const o = isObj(v) ? v : {};
  return { enabled: S.bool(o.enabled, d.enabled, `${path}.enabled`), template: tpl(S, o.template, d.template, `${path}.template`, keys) };
};
const groups = (S: Sanitizer, v: unknown, d: readonly number[], path: string): [number, number, number] => {
  const a = Array.isArray(v) ? v : [];
  return [0, 1, 2].map((i) => Math.round(S.num(a[i], d[i], 1, 8, `${path}[${i}]`))) as [number, number, number];
};

/** Chuyển động của widget: hiệu ứng lạ về mặc định kèm cảnh báo; không còn gì (vào, ra, lặp đều trống) thì bỏ hẳn. */
function sanitizeMotion(S: Sanitizer, v: unknown, path: string): WidgetMotion | undefined {
  if (!isObj(v)) { S.warn(path, v, 'không phải đối tượng; bỏ'); return undefined; }
  const phase = (raw: unknown, p: string): MotionPhase | null => {
    if (raw === undefined || raw === null) return null;
    if (!isObj(raw)) { S.warn(p, raw, 'không phải đối tượng; bỏ'); return null; }
    const ease = raw.ease === undefined ? DEFAULT_PHASE.ease : raw.ease;
    if (!parseEase(ease).ok) S.warn(`${p}.ease`, ease, 'easing lạ; dùng mặc định');
    return { effect: S.oneOf(raw.effect, WIDGET_EFFECT_NAMES as readonly string[], DEFAULT_PHASE.effect, `${p}.effect`), sec: S.num(raw.sec, DEFAULT_PHASE.sec, 0, 30, `${p}.sec`), ease: parseEase(ease).ok ? (ease as MotionPhase['ease']) : DEFAULT_PHASE.ease };
  };
  let loop: MotionLoop | null = null;
  if (isObj(v.loop)) { const l = v.loop; loop = { effect: S.oneOf(l.effect, LOOP_EFFECT_NAMES, DEFAULT_LOOP.effect, `${path}.loop.effect`), amount: S.num(l.amount, DEFAULT_LOOP.amount, 0, 1, `${path}.loop.amount`), every: S.num(l.every, DEFAULT_LOOP.every, 0.05, 64, `${path}.loop.every`), unit: S.oneOf(l.unit, ['BEATS', 'SECONDS'] as const, DEFAULT_LOOP.unit, `${path}.loop.unit`) }; }
  else if (v.loop !== undefined && v.loop !== null) S.warn(`${path}.loop`, v.loop, 'không phải đối tượng; bỏ');
  const m: WidgetMotion = { enter: phase(v.enter, `${path}.enter`), exit: phase(v.exit, `${path}.exit`), loop };
  return hasMotion(m) ? m : undefined;
}
const hexp = (S: Sanitizer, v: unknown, d: string, path: string): string => S.str(v, d, path, (s) => HEX.test(s));
const hexOpt = (S: Sanitizer, v: unknown, d: string, path: string): string => S.str(v, d, path, (s) => s === '' || HEX.test(s));
const HUD_SANITIZERS = {
  TRACK_INFO(P: Obj, p: string, S: Sanitizer): TrackInfoProps {
    const d = DEFAULT_TRACK_INFO;
    return { align: S.oneOf(P.align, ALIGNS, d.align, `${p}.align`), titleText: tpl(S, P.titleText, d.titleText, `${p}.titleText`, TEMPLATE_KEYS.TRACK_INFO),
      titleStyle: textRef(S, P.titleStyle, d.titleStyle, `${p}.titleStyle`), artistText: tpl(S, P.artistText, d.artistText, `${p}.artistText`, TEMPLATE_KEYS.TRACK_INFO),
      artistStyle: textRef(S, P.artistStyle, d.artistStyle, `${p}.artistStyle`) };
  },
  EVENT_COUNTER(P: Obj, p: string, S: Sanitizer): EventCounterProps {
    const d = DEFAULT_EVENT_COUNTER, L = isObj(P.lines) ? P.lines : {}, K = TEMPLATE_KEYS.EVENT_COUNTER;
    return { align: S.oneOf(P.align, ALIGNS, d.align, `${p}.align`), style: textRef(S, P.style, d.style, `${p}.style`), valueStyle: textRef(S, P.valueStyle, d.valueStyle, `${p}.valueStyle`),
      lineHeight: S.num(P.lineHeight, d.lineHeight, 1, 3, `${p}.lineHeight`), decimals: Math.round(S.num(P.decimals, d.decimals, 0, 4, `${p}.decimals`)),
      lines: { played: lineCfg(S, L.played, d.lines.played, `${p}.lines.played`, K), total: lineCfg(S, L.total, d.lines.total, `${p}.lines.total`, K),
        progress: lineCfg(S, L.progress, d.lines.progress, `${p}.lines.progress`, K), tempo: lineCfg(S, L.tempo, d.lines.tempo, `${p}.lines.tempo`, K) } };
  },
  LIVE_TRIGGER(P: Obj, p: string, S: Sanitizer): LiveTriggerProps {
    const d = DEFAULT_LIVE_TRIGGER, K = TEMPLATE_KEYS.LIVE_TRIGGER;
    return { mode: S.oneOf(P.mode, ['list', 'inline'] as const, d.mode, `${p}.mode`), align: S.oneOf(P.align, ALIGNS, d.align, `${p}.align`), style: textRef(S, P.style, d.style, `${p}.style`), valueStyle: textRef(S, P.valueStyle, d.valueStyle, `${p}.valueStyle`),
      template: tpl(S, P.template, d.template, `${p}.template`, K), showTrack: S.bool(P.showTrack, d.showTrack, `${p}.showTrack`), trackTemplate: tpl(S, P.trackTemplate, d.trackTemplate, `${p}.trackTemplate`, K),
      tailMs: S.num(P.tailMs, d.tailMs, 0, 1000, `${p}.tailMs`), maxLines: Math.round(S.num(P.maxLines, d.maxLines, 1, 32, `${p}.maxLines`)),
      lineHeight: S.num(P.lineHeight, d.lineHeight, 1, 3, `${p}.lineHeight`), separator: S.str(P.separator, d.separator, `${p}.separator`, (s) => s.length <= 16) };
  },
  TIME_BAR(P: Obj, p: string, S: Sanitizer): TimeBarProps {
    const d = DEFAULT_TIME_BAR, tm = isObj(P.time) ? P.time : {}, bt = isObj(P.beat) ? P.beat : {};
    return { style: textRef(S, P.style, d.style, `${p}.style`), labelStyle: textRef(S, P.labelStyle, d.labelStyle, `${p}.labelStyle`), rowGap: S.num(P.rowGap, d.rowGap, 1, 5, `${p}.rowGap`),
      time: { enabled: S.bool(tm.enabled, d.time.enabled, `${p}.time.enabled`), label: tpl(S, tm.label, d.time.label, `${p}.time.label`, TEMPLATE_KEYS.TIME_BAR, 40), format: S.oneOf(tm.format, ['grouped', 'clock'] as const, d.time.format, `${p}.time.format`) },
      beat: { enabled: S.bool(bt.enabled, d.beat.enabled, `${p}.beat.enabled`), label: tpl(S, bt.label, d.beat.label, `${p}.beat.label`, TEMPLATE_KEYS.TIME_BAR, 40), format: S.oneOf(bt.format, ['grouped', 'bbs'] as const, d.beat.format, `${p}.beat.format`) },
      timeGroups: groups(S, P.timeGroups, d.timeGroups, `${p}.timeGroups`), beatGroups: groups(S, P.beatGroups, d.beatGroups, `${p}.beatGroups`),
      showBars: S.bool(P.showBars, d.showBars, `${p}.showBars`), barLength: S.num(P.barLength, d.barLength, 4, 1000, `${p}.barLength`), barThickness: S.num(P.barThickness, d.barThickness, 0.5, 40, `${p}.barThickness`),
      barColor: S.str(P.barColor, d.barColor, `${p}.barColor`, (s) => HEX.test(s)), barTrackColor: S.str(P.barTrackColor, d.barTrackColor, `${p}.barTrackColor`, (s) => s === '' || HEX.test(s)) };
  },
  CHORD_DETECTION(P: Obj, p: string, S: Sanitizer): ChordProps {
    const d = DEFAULT_CHORD;
    return { mode: S.oneOf(P.mode, ['sustained', 'strike'] as const, d.mode, `${p}.mode`), align: S.oneOf(P.align, ALIGNS, d.align, `${p}.align`), nameStyle: textRef(S, P.nameStyle, d.nameStyle, `${p}.nameStyle`), bassStyle: textRef(S, P.bassStyle, d.bassStyle, `${p}.bassStyle`),
      notesStyle: textRef(S, P.notesStyle, d.notesStyle, `${p}.notesStyle`), notesValueStyle: textRef(S, P.notesValueStyle, d.notesValueStyle, `${p}.notesValueStyle`),
      alwaysShowNotes: S.bool(P.alwaysShowNotes, d.alwaysShowNotes, `${p}.alwaysShowNotes`), notesTemplate: tpl(S, P.notesTemplate, d.notesTemplate, `${p}.notesTemplate`, TEMPLATE_KEYS.CHORD_DETECTION),
      unrecognized: S.oneOf(P.unrecognized, ['nc', 'notes'] as const, d.unrecognized, `${p}.unrecognized`), noChordText: tpl(S, P.noChordText, d.noChordText, `${p}.noChordText`, TEMPLATE_KEYS.CHORD_DETECTION, 20) };
  },
  TEXT(P: Obj, p: string, S: Sanitizer): TextBoxProps {
    const d = DEFAULT_TEXT_BOX;
    return { align: S.oneOf(P.align, ALIGNS, d.align, `${p}.align`), text: tpl(S, P.text, d.text, `${p}.text`, TEMPLATE_KEYS.TEXT, 2000),
      style: textRef(S, P.style, d.style, `${p}.style`), valueStyle: textRef(S, P.valueStyle, d.valueStyle, `${p}.valueStyle`),
      animator: P.animator === undefined ? { ...DEFAULT_TEXT_ANIMATOR } : sanitizeTextAnimator(S, P.animator, `${p}.animator`) };
  },
  IMAGE(P: Obj, p: string, S: Sanitizer): ImageProps {
    const d = DEFAULT_IMAGE, cols = Math.round(S.num(P.cols, d.cols, 1, 64, `${p}.cols`)), rows = Math.round(S.num(P.rows, d.rows, 1, 64, `${p}.rows`));
    return { asset: S.str(P.asset, d.asset, `${p}.asset`, (x) => x === '' || ASSET_REF.test(x)), fit: S.oneOf(P.fit, IMAGE_FITS, d.fit, `${p}.fit`), cols, rows,
      frames: Math.min(cols * rows, Math.round(S.num(P.frames, d.frames, 1, 4096, `${p}.frames`))), fps: S.num(P.fps, d.fps, 0, 120, `${p}.fps`),
      loop: S.bool(P.loop, d.loop, `${p}.loop`), smooth: S.bool(P.smooth, d.smooth, `${p}.smooth`) };
  },
  AUDIO_SPECTRUM(P: Obj, p: string, S: Sanitizer): SpectrumProps {
    const d = DEFAULT_SPECTRUM, col = (v: unknown, dv: string, path: string) => S.str(v, dv, path, (s) => HEX.test(s));
    let lo = S.num(P.minHz, d.minHz, 20, 20000, `${p}.minHz`), hi = S.num(P.maxHz, d.maxHz, 20, 20000, `${p}.maxHz`);
    if (lo >= hi) { S.warn(`${p}.minHz`, lo, 'minHz phải nhỏ hơn maxHz; dùng mặc định'); lo = d.minHz; hi = d.maxHz; }
    let fl = S.num(P.floorDb, d.floorDb, -80, -10, `${p}.floorDb`), ce = S.num(P.ceilDb, d.ceilDb, -60, 0, `${p}.ceilDb`);
    if (ce <= fl) { S.warn(`${p}.ceilDb`, ce, 'ceilDb phải lớn hơn floorDb; dùng mặc định'); fl = d.floorDb; ce = d.ceilDb; }
    return { style: S.oneOf(P.style, SPECTRUM_STYLES, d.style, `${p}.style`), scale: S.oneOf(P.scale, ['LOG', 'LINEAR', 'MEL'] as const, d.scale, `${p}.scale`),
      peakCap: S.bool(P.peakCap, d.peakCap, `${p}.peakCap`), capFall: S.num(P.capFall, d.capFall, 0.05, 10, `${p}.capFall`), scopeMs: S.num(P.scopeMs, d.scopeMs, 5, 500, `${p}.scopeMs`),
      playedColor: col(P.playedColor, d.playedColor, `${p}.playedColor`),
      shape: S.oneOf(P.shape, ['LINE', 'CIRCLE'] as const, d.shape, `${p}.shape`), bars: Math.round(S.num(P.bars, d.bars, 8, 256, `${p}.bars`)), minHz: lo, maxHz: hi,
      reverse: S.bool(P.reverse, d.reverse, `${p}.reverse`), mirror: S.bool(P.mirror, d.mirror, `${p}.mirror`), angle: normalizeAngle(S.num(P.angle, d.angle, -360, 360, `${p}.angle`)),
      length: S.num(P.length, d.length, 16, 8192, `${p}.length`), radius: S.num(P.radius, d.radius, 0, 4096, `${p}.radius`), startAngle: S.num(P.startAngle, d.startAngle, -360, 360, `${p}.startAngle`),
      thickness: S.num(P.thickness, d.thickness, 1, 4096, `${p}.thickness`), minLen: S.num(P.minLen, d.minLen, 0, 100, `${p}.minLen`), barWidth: S.num(P.barWidth, d.barWidth, 0.1, 1, `${p}.barWidth`),
      roundness: S.num(P.roundness, d.roundness, 0, 1, `${p}.roundness`), attackMs: S.num(P.attackMs, d.attackMs, 0, 1000, `${p}.attackMs`), releaseMs: S.num(P.releaseMs, d.releaseMs, 0, 3000, `${p}.releaseMs`),
      floorDb: fl, ceilDb: ce, colorMode: S.oneOf(P.colorMode, ['SOLID', 'GRADIENT'] as const, d.colorMode, `${p}.colorMode`), color: col(P.color, d.color, `${p}.color`), colorB: col(P.colorB, d.colorB, `${p}.colorB`),
      opacity: S.num(P.opacity, d.opacity, 0, 1, `${p}.opacity`), glow: S.num(P.glow, d.glow, 0, 1, `${p}.glow`) };
  },
  PARTICLES(P: Obj, p: string, S: Sanitizer): ParticleProps {
    const d = DEFAULT_PARTICLES;
    let lo = Math.round(S.num(P.pitchMin, d.pitchMin, 0, 127, `${p}.pitchMin`)), hi = Math.round(S.num(P.pitchMax, d.pitchMax, 0, 127, `${p}.pitchMax`));
    if (lo >= hi) { S.warn(`${p}.pitchMin`, lo, 'pitchMin phải nhỏ hơn pitchMax; dùng mặc định'); lo = d.pitchMin; hi = d.pitchMax; }
    return { perNote: Math.round(S.num(P.perNote, d.perNote, 1, 24, `${p}.perNote`)), velocityScale: S.bool(P.velocityScale, d.velocityScale, `${p}.velocityScale`), life: S.num(P.life, d.life, 0.2, 10, `${p}.life`),
      speed: S.num(P.speed, d.speed, 0, 3000, `${p}.speed`), speedSpread: S.num(P.speedSpread, d.speedSpread, 0, 1, `${p}.speedSpread`), angle: S.num(P.angle, d.angle, -360, 360, `${p}.angle`), spread: S.num(P.spread, d.spread, 0, 360, `${p}.spread`),
      gravity: S.num(P.gravity, d.gravity, -3000, 3000, `${p}.gravity`), sizeStart: S.num(P.sizeStart, d.sizeStart, 0, 200, `${p}.sizeStart`), sizeEnd: S.num(P.sizeEnd, d.sizeEnd, 0, 200, `${p}.sizeEnd`),
      shape: S.oneOf(P.shape, ['CIRCLE', 'SQUARE'] as const, d.shape, `${p}.shape`), colorMode: S.oneOf(P.colorMode, ['TRACK', 'SOLID'] as const, d.colorMode, `${p}.colorMode`), color: S.str(P.color, d.color, `${p}.color`, (s) => HEX.test(s)),
      opacity: S.num(P.opacity, d.opacity, 0, 1, `${p}.opacity`), fade: S.bool(P.fade, d.fade, `${p}.fade`), glow: S.num(P.glow, d.glow, 0, 1, `${p}.glow`),
      originX: S.oneOf(P.originX, ['PITCH', 'CENTER', 'SPREAD', 'NOTE'] as const, d.originX, `${p}.originX`), originY: S.num(P.originY, d.originY, 0, 1, `${p}.originY`), pitchMin: lo, pitchMax: hi,
      seed: Math.round(S.num(P.seed, d.seed, 0, 999999, `${p}.seed`)), maxParticles: Math.round(S.num(P.maxParticles, d.maxParticles, 50, 4000, `${p}.maxParticles`)) };
  },
  NOTATION(P: Obj, p: string, S: Sanitizer): NotationProps {
    const d = DEFAULT_NOTATION, col = (v: unknown, dv: string, path: string) => S.str(v, dv, path, (x) => HEX.test(x)), int = (v: unknown, dv: number, lo: number, hi: number, path: string) => Math.round(S.num(v, dv, lo, hi, path));
    const pick = <T extends number>(v: unknown, list: readonly T[], dv: T, path: string): T => {
      if (v === undefined) return dv;
      if (!list.includes(v as T)) { S.warn(path, v, `không thuộc ${list.join('/')}; dùng ${dv}`); return dv; }
      return v as T;
    };
    return {
      division: pick(P.division, [8, 16, 32] as const, d.division, `${p}.division`), triplets: S.bool(P.triplets, d.triplets, `${p}.triplets`), simplify: S.num(P.simplify, d.simplify, 0.5, 4, `${p}.simplify`),
      splitPitch: int(P.splitPitch, d.splitPitch, 21, 108, `${p}.splitPitch`), voices: pick(P.voices, [1, 2] as const, d.voices, `${p}.voices`),
      keyMode: S.oneOf(P.keyMode, ['AUTO', 'MANUAL'] as const, d.keyMode, `${p}.keyMode`), keyFifths: int(P.keyFifths, d.keyFifths, -7, 7, `${p}.keyFifths`), keyMinor: S.bool(P.keyMinor, d.keyMinor, `${p}.keyMinor`),
      barsPerSystem: int(P.barsPerSystem, d.barsPerSystem, 0, 8, `${p}.barsPerSystem`), systemsPerPage: int(P.systemsPerPage, d.systemsPerPage, 1, 4, `${p}.systemsPerPage`),
      musicFont: S.oneOf(P.musicFont, ['BRAVURA', 'PETALUMA', 'GONVILLE'] as const, d.musicFont, `${p}.musicFont`), measureNumbers: S.bool(P.measureNumbers, d.measureNumbers, `${p}.measureNumbers`), tempoMark: S.bool(P.tempoMark, d.tempoMark, `${p}.tempoMark`),
      measureNumberSize: S.num(P.measureNumberSize, d.measureNumberSize, 0.5, 4, `${p}.measureNumberSize`),
      inkColor: col(P.inkColor, d.inkColor, `${p}.inkColor`), playedColor: col(P.playedColor, d.playedColor, `${p}.playedColor`), activeColor: col(P.activeColor, d.activeColor, `${p}.activeColor`),
      colorMode: S.oneOf(P.colorMode, ['SOLID', 'TRACK'] as const, d.colorMode, `${p}.colorMode`), upcomingOpacity: S.num(P.upcomingOpacity, d.upcomingOpacity, 0, 1, `${p}.upcomingOpacity`), playedOpacity: S.num(P.playedOpacity, d.playedOpacity, 0, 1, `${p}.playedOpacity`),
      staticOpacity: S.num(P.staticOpacity, d.staticOpacity, 0, 1, `${p}.staticOpacity`), opacity: S.num(P.opacity, d.opacity, 0, 1, `${p}.opacity`),
      zoom: S.num(P.zoom, d.zoom, 1, 3, `${p}.zoom`), zoomMode: S.oneOf(P.zoomMode, ['PULSE', 'HOLD'] as const, d.zoomMode, `${p}.zoomMode`), zoomMs: S.num(P.zoomMs, d.zoomMs, 20, 3000, `${p}.zoomMs`),
      glow: S.num(P.glow, d.glow, 0, 1, `${p}.glow`), glowSize: S.num(P.glowSize, d.glowSize, 0, 20, `${p}.glowSize`), glowMode: S.oneOf(P.glowMode, ['HALO', 'SOFT'] as const, d.glowMode, `${p}.glowMode`),
      playhead: S.oneOf(P.playhead, ['NONE', 'LINE'] as const, d.playhead, `${p}.playhead`), playheadColor: col(P.playheadColor, d.playheadColor, `${p}.playheadColor`), playheadWidth: S.num(P.playheadWidth, d.playheadWidth, 0, 40, `${p}.playheadWidth`),
      rough: S.num(P.rough, d.rough, 0, 6, `${p}.rough`), boilFps: S.num(P.boilFps, d.boilFps, 0, 24, `${p}.boilFps`), seed: int(P.seed, d.seed, 0, 999999, `${p}.seed`),
      align: S.oneOf(P.align, ['TOP', 'CENTER'] as const, d.align, `${p}.align`), pageFadeMs: S.num(P.pageFadeMs, d.pageFadeMs, 0, 2000, `${p}.pageFadeMs`),
      aura: S.oneOf(P.aura, ['OFF', 'STEADY', 'BEAT', 'BAR', 'TIME'] as const, d.aura, `${p}.aura`), auraShape: S.oneOf(P.auraShape, ['SMOOTH', 'FLASH', 'BLINK'] as const, d.auraShape, `${p}.auraShape`),
      auraEvery: S.num(P.auraEvery, d.auraEvery, 0.25, 64, `${p}.auraEvery`), auraGlow: S.num(P.auraGlow, d.auraGlow, 0, 1, `${p}.auraGlow`), auraMin: S.num(P.auraMin, d.auraMin, 0, 1, `${p}.auraMin`),
      auraColor: S.str(P.auraColor, d.auraColor, `${p}.auraColor`, (s) => s === '' || HEX.test(s)),
    };
  },
  TEMPO_INFO(P: Obj, p: string, S: Sanitizer): TempoInfoProps {
    const d = DEFAULT_TEMPO_INFO;
    return { align: S.oneOf(P.align, ALIGNS, d.align, `${p}.align`), style: textRef(S, P.style, d.style, `${p}.style`), template: tpl(S, P.template, d.template, `${p}.template`, INSIGHT_TEMPLATE_KEYS.TEMPO_INFO),
      showCurve: S.bool(P.showCurve, d.showCurve, `${p}.showCurve`), curveHeight: S.num(P.curveHeight, d.curveHeight, 8, 400, `${p}.curveHeight`), curveColor: hexp(S, P.curveColor, d.curveColor, `${p}.curveColor`),
      flash: S.bool(P.flash, d.flash, `${p}.flash`), flashColor: hexp(S, P.flashColor, d.flashColor, `${p}.flashColor`), flashMs: S.num(P.flashMs, d.flashMs, 50, 3000, `${p}.flashMs`) };
  },
  BAR_BEAT(P: Obj, p: string, S: Sanitizer): BarBeatProps {
    const d = DEFAULT_BAR_BEAT;
    return { align: S.oneOf(P.align, ALIGNS, d.align, `${p}.align`), style: textRef(S, P.style, d.style, `${p}.style`), format: S.oneOf(P.format, ['PERCENT', 'SIXTEENTH'] as const, d.format, `${p}.format`),
      barDigits: Math.round(S.num(P.barDigits, d.barDigits, 1, 4, `${p}.barDigits`)), dots: S.bool(P.dots, d.dots, `${p}.dots`), dotSize: S.num(P.dotSize, d.dotSize, 2, 60, `${p}.dotSize`),
      dotColor: hexp(S, P.dotColor, d.dotColor, `${p}.dotColor`), dotActiveColor: hexp(S, P.dotActiveColor, d.dotActiveColor, `${p}.dotActiveColor`), pulse: S.bool(P.pulse, d.pulse, `${p}.pulse`) };
  },
  KEY_SCALE(P: Obj, p: string, S: Sanitizer): KeyScaleProps {
    const d = DEFAULT_KEY_SCALE, K = INSIGHT_TEMPLATE_KEYS.KEY_SCALE;
    return { align: S.oneOf(P.align, ALIGNS, d.align, `${p}.align`), nameStyle: textRef(S, P.nameStyle, d.nameStyle, `${p}.nameStyle`), confStyle: textRef(S, P.confStyle, d.confStyle, `${p}.confStyle`),
      template: tpl(S, P.template, d.template, `${p}.template`, K), majorLabel: S.str(P.majorLabel, d.majorLabel, `${p}.majorLabel`, (s) => s.length <= 24), minorLabel: S.str(P.minorLabel, d.minorLabel, `${p}.minorLabel`, (s) => s.length <= 24),
      noKeyText: S.str(P.noKeyText, d.noKeyText, `${p}.noKeyText`, (s) => s.length <= 40), windowSec: S.num(P.windowSec, d.windowSec, 2, 120, `${p}.windowSec`), minConfidence: S.num(P.minConfidence, d.minConfidence, 0, 1, `${p}.minConfidence`),
      showConfidence: S.bool(P.showConfidence, d.showConfidence, `${p}.showConfidence`), confTemplate: tpl(S, P.confTemplate, d.confTemplate, `${p}.confTemplate`, K) };
  },
  VELOCITY(P: Obj, p: string, S: Sanitizer): VelocityProps {
    const d = DEFAULT_VELOCITY;
    return { mode: S.oneOf(P.mode, ['LEVEL', 'HISTOGRAM'] as const, d.mode, `${p}.mode`), perTrack: S.bool(P.perTrack, d.perTrack, `${p}.perTrack`), decayMs: S.num(P.decayMs, d.decayMs, 50, 5000, `${p}.decayMs`),
      windowSec: S.num(P.windowSec, d.windowSec, 1, 120, `${p}.windowSec`), bins: Math.round(S.num(P.bins, d.bins, 4, 16, `${p}.bins`)), gap: S.num(P.gap, d.gap, 0, 40, `${p}.gap`),
      colorMode: S.oneOf(P.colorMode, ['TRACK', 'SOLID'] as const, d.colorMode, `${p}.colorMode`), color: hexp(S, P.color, d.color, `${p}.color`), trackColor: hexOpt(S, P.trackColor, d.trackColor, `${p}.trackColor`), radius: S.num(P.radius, d.radius, 0, 50, `${p}.radius`) };
  },
  DENSITY(P: Obj, p: string, S: Sanitizer): DensityProps {
    const d = DEFAULT_DENSITY;
    return { cols: Math.round(S.num(P.cols, d.cols, 16, 400, `${p}.cols`)), rowGap: S.num(P.rowGap, d.rowGap, 0, 20, `${p}.rowGap`), cellGap: S.num(P.cellGap, d.cellGap, 0, 10, `${p}.cellGap`),
      colorMode: S.oneOf(P.colorMode, ['TRACK', 'SOLID'] as const, d.colorMode, `${p}.colorMode`), color: hexp(S, P.color, d.color, `${p}.color`), minAlpha: S.num(P.minAlpha, d.minAlpha, 0, 1, `${p}.minAlpha`),
      playheadColor: hexOpt(S, P.playheadColor, d.playheadColor, `${p}.playheadColor`), showPolyphony: S.bool(P.showPolyphony, d.showPolyphony, `${p}.showPolyphony`),
      polyTemplate: tpl(S, P.polyTemplate, d.polyTemplate, `${p}.polyTemplate`, INSIGHT_TEMPLATE_KEYS.DENSITY), polyStyle: textRef(S, P.polyStyle, d.polyStyle, `${p}.polyStyle`) };
  },
  PITCH_WHEEL(P: Obj, p: string, S: Sanitizer): PitchWheelProps {
    const d = DEFAULT_PITCH_WHEEL;
    return { order: S.oneOf(P.order, ['CHROMATIC', 'FIFTHS'] as const, d.order, `${p}.order`), ring: S.num(P.ring, d.ring, 0.1, 0.5, `${p}.ring`), litColor: hexp(S, P.litColor, d.litColor, `${p}.litColor`), dimColor: hexp(S, P.dimColor, d.dimColor, `${p}.dimColor`),
      dimAlpha: S.num(P.dimAlpha, d.dimAlpha, 0, 1, `${p}.dimAlpha`), showNames: S.bool(P.showNames, d.showNames, `${p}.showNames`), nameStyle: textRef(S, P.nameStyle, d.nameStyle, `${p}.nameStyle`),
      showChord: S.bool(P.showChord, d.showChord, `${p}.showChord`), chordStyle: textRef(S, P.chordStyle, d.chordStyle, `${p}.chordStyle`),
      labels: S.oneOf(P.labels, ['NAMES', 'DEGREES'] as const, d.labels, `${p}.labels`), nodeShape: S.oneOf(P.nodeShape, ['TILE', 'CIRCLE'] as const, d.nodeShape, `${p}.nodeShape`),
      litTextColor: hexOpt(S, P.litTextColor, d.litTextColor, `${p}.litTextColor`), polygon: S.bool(P.polygon, d.polygon, `${p}.polygon`),
      polygonColor: hexOpt(S, P.polygonColor, d.polygonColor, `${p}.polygonColor`), polygonAlpha: S.num(P.polygonAlpha, d.polygonAlpha, 0, 1, `${p}.polygonAlpha`),
      rootColor: hexOpt(S, P.rootColor, d.rootColor, `${p}.rootColor`), progress: S.oneOf(P.progress, ['OFF', 'BAR', 'SONG'] as const, d.progress, `${p}.progress`),
      progressColor: hexOpt(S, P.progressColor, d.progressColor, `${p}.progressColor`), progressWidth: S.num(P.progressWidth, d.progressWidth, 0.5, 40, `${p}.progressWidth`),
      beatMarks: S.bool(P.beatMarks, d.beatMarks, `${p}.beatMarks`), outlineColor: hexOpt(S, P.outlineColor, d.outlineColor, `${p}.outlineColor`),
      chordAs: S.oneOf(P.chordAs, ['NAME', 'DEGREE'] as const, d.chordAs, `${p}.chordAs`), romanStyle: S.oneOf(P.romanStyle, ROMAN_STYLES, d.romanStyle, `${p}.romanStyle`),
      subTemplate: tpl(S, P.subTemplate, d.subTemplate, `${p}.subTemplate`, []), subStyle: textRef(S, P.subStyle, d.subStyle, `${p}.subStyle`),
      windowSec: S.num(P.windowSec, d.windowSec, 2, 120, `${p}.windowSec`) };
  },
  PANEL(P: Obj, p: string, S: Sanitizer): PanelProps {
    const d = DEFAULT_PANEL, raw = Array.isArray(P.stats) ? P.stats : (P.stats === undefined ? d.stats : (S.warn(`${p}.stats`, P.stats, 'không phải mảng; dùng mặc định'), d.stats));
    if (raw.length > MAX_PANEL_STATS) S.warn(`${p}.stats`, raw.length, `quá ${MAX_PANEL_STATS} cột; bỏ phần thừa`);
    const stats = Array.from({ length: MAX_PANEL_STATS }, (_, i) => {
      const s = isObj(raw[i]) ? raw[i] as Obj : {};
      return { label: tpl(S, s.label, '', `${p}.stats[${i}].label`, [], 60), value: tpl(S, s.value, '', `${p}.stats[${i}].value`, [], 120) };
    });
    return { number: S.str(P.number, d.number, `${p}.number`, (s) => s.length <= 8), title: S.str(P.title, d.title, `${p}.title`, (s) => s.length <= 60),
      numberColor: hexOpt(S, P.numberColor, d.numberColor, `${p}.numberColor`), titleStyle: textRef(S, P.titleStyle, d.titleStyle, `${p}.titleStyle`),
      frame: S.bool(P.frame, d.frame, `${p}.frame`), frameColor: hexp(S, P.frameColor, d.frameColor, `${p}.frameColor`), frameWidth: S.num(P.frameWidth, d.frameWidth, 0, 20, `${p}.frameWidth`),
      fillColor: hexOpt(S, P.fillColor, d.fillColor, `${p}.fillColor`), fillAlpha: S.num(P.fillAlpha, d.fillAlpha, 0, 1, `${p}.fillAlpha`),
      stats, labelStyle: textRef(S, P.labelStyle, d.labelStyle, `${p}.labelStyle`), valueStyle: textRef(S, P.valueStyle, d.valueStyle, `${p}.valueStyle`) };
  },
  DEGREE(P: Obj, p: string, S: Sanitizer): DegreeProps {
    const d = DEFAULT_DEGREE, c = (k: keyof DegreeProps) => hexp(S, P[k], d[k] as string, `${p}.${k}`);
    return { windowBars: S.num(P.windowBars, d.windowBars, 1, 64, `${p}.windowBars`), playheadRatio: S.num(P.playheadRatio, d.playheadRatio, 0, 1, `${p}.playheadRatio`),
      showDetail: S.bool(P.showDetail, d.showDetail, `${p}.showDetail`), showFunction: S.bool(P.showFunction, d.showFunction, `${p}.showFunction`), showBars: S.bool(P.showBars, d.showBars, `${p}.showBars`),
      resolution: S.oneOf(P.resolution, CHORD_RESOLUTIONS, d.resolution, `${p}.resolution`),
      romanStyle: S.oneOf(P.romanStyle, ROMAN_STYLES, d.romanStyle, `${p}.romanStyle`), keyWindowSec: S.num(P.keyWindowSec, d.keyWindowSec, 2, 120, `${p}.keyWindowSec`),
      accentColor: c('accentColor'), detailColor: c('detailColor'), blockColor: c('blockColor'), activeTextColor: c('activeTextColor'), pastAlpha: S.num(P.pastAlpha, d.pastAlpha, 0, 1, `${p}.pastAlpha`),
      tonicColor: c('tonicColor'), subdominantColor: c('subdominantColor'), dominantColor: c('dominantColor'), playheadColor: hexOpt(S, P.playheadColor, d.playheadColor, `${p}.playheadColor`),
      radius: S.num(P.radius, d.radius, 0, 40, `${p}.radius`), gap: S.num(P.gap, d.gap, 0, 40, `${p}.gap`),
      labelStyle: textRef(S, P.labelStyle, d.labelStyle, `${p}.labelStyle`), smallStyle: textRef(S, P.smallStyle, d.smallStyle, `${p}.smallStyle`) };
  },
  DOTS(P: Obj, p: string, S: Sanitizer): DotsProps {
    const d = DEFAULT_DOTS;
    return { grid: (DOTS_GRIDS as readonly number[]).includes(P.grid as number) ? P.grid as number : (P.grid !== undefined && S.warn(`${p}.grid`, P.grid, `không phải ${DOTS_GRIDS.join('/')}; dùng ${d.grid}`), d.grid), cols: Math.round(S.num(P.cols, d.cols, 8, 256, `${p}.cols`)), playheadRatio: S.num(P.playheadRatio, d.playheadRatio, 0, 1, `${p}.playheadRatio`),
      pitchRangeMode: S.oneOf(P.pitchRangeMode, ['FIT_CONTENT', 'CUSTOM'] as const, d.pitchRangeMode, `${p}.pitchRangeMode`),
      pitchMin: Math.round(S.num(P.pitchMin, d.pitchMin, 0, 127, `${p}.pitchMin`)), pitchMax: Math.round(S.num(P.pitchMax, d.pitchMax, 0, 127, `${p}.pitchMax`)),
      maxRows: Math.round(S.num(P.maxRows, d.maxRows, 8, 128, `${p}.maxRows`)), dotSize: S.num(P.dotSize, d.dotSize, 0.05, 1, `${p}.dotSize`), shape: S.oneOf(P.shape, ['ROUND', 'SQUARE'] as const, d.shape, `${p}.shape`),
      emptyColor: hexp(S, P.emptyColor, d.emptyColor, `${p}.emptyColor`), emptyColorB: hexOpt(S, P.emptyColorB, d.emptyColorB, `${p}.emptyColorB`), emptyAlpha: S.num(P.emptyAlpha, d.emptyAlpha, 0, 1, `${p}.emptyAlpha`),
      colorMode: S.oneOf(P.colorMode, ['TRACK', 'SOLID'] as const, d.colorMode, `${p}.colorMode`), color: hexp(S, P.color, d.color, `${p}.color`),
      upcomingAlpha: S.num(P.upcomingAlpha, d.upcomingAlpha, 0, 1, `${p}.upcomingAlpha`), activeScale: S.num(P.activeScale, d.activeScale, 1, 3, `${p}.activeScale`),
      playheadColor: hexOpt(S, P.playheadColor, d.playheadColor, `${p}.playheadColor`), playheadWidth: S.num(P.playheadWidth, d.playheadWidth, 0, 10, `${p}.playheadWidth`) };
  },
  ARRANGEMENT(P: Obj, p: string, S: Sanitizer): ArrangementProps {
    const d = DEFAULT_ARRANGEMENT;
    return { cols: Math.round(S.num(P.cols, d.cols, 16, 600, `${p}.cols`)), rowGap: S.num(P.rowGap, d.rowGap, 0, 20, `${p}.rowGap`), colorMode: S.oneOf(P.colorMode, ['TRACK', 'SOLID'] as const, d.colorMode, `${p}.colorMode`), color: hexp(S, P.color, d.color, `${p}.color`),
      upcomingAlpha: S.num(P.upcomingAlpha, d.upcomingAlpha, 0, 1, `${p}.upcomingAlpha`), playheadColor: hexOpt(S, P.playheadColor, d.playheadColor, `${p}.playheadColor`), playheadWidth: S.num(P.playheadWidth, d.playheadWidth, 0, 20, `${p}.playheadWidth`) };
  },
  DRUM_PAD(P: Obj, p: string, S: Sanitizer): DrumPadProps {
    const d = DEFAULT_DRUM_PAD;
    return { source: S.oneOf(P.source, ['DRUMS', 'ALL'] as const, d.source, `${p}.source`), cols: Math.round(S.num(P.cols, d.cols, 1, 8, `${p}.cols`)), maxPads: Math.round(S.num(P.maxPads, d.maxPads, 4, 32, `${p}.maxPads`)),
      gap: S.num(P.gap, d.gap, 0, 40, `${p}.gap`), radius: S.num(P.radius, d.radius, 0, 100, `${p}.radius`), padColor: hexp(S, P.padColor, d.padColor, `${p}.padColor`), hitColor: hexp(S, P.hitColor, d.hitColor, `${p}.hitColor`),
      colorMode: S.oneOf(P.colorMode, ['TRACK', 'SOLID'] as const, d.colorMode, `${p}.colorMode`), decayMs: S.num(P.decayMs, d.decayMs, 50, 3000, `${p}.decayMs`), labels: S.bool(P.labels, d.labels, `${p}.labels`),
      labelStyle: textRef(S, P.labelStyle, d.labelStyle, `${p}.labelStyle`) };
  },
  SECTION(P: Obj, p: string, S: Sanitizer): SectionProps {
    const d = DEFAULT_SECTION, K = INSIGHT_TEMPLATE_KEYS.SECTION;
    return { align: S.oneOf(P.align, ALIGNS, d.align, `${p}.align`), style: textRef(S, P.style, d.style, `${p}.style`), nextStyle: textRef(S, P.nextStyle, d.nextStyle, `${p}.nextStyle`), template: tpl(S, P.template, d.template, `${p}.template`, K),
      showNext: S.bool(P.showNext, d.showNext, `${p}.showNext`), nextTemplate: tpl(S, P.nextTemplate, d.nextTemplate, `${p}.nextTemplate`, K), fadeMs: S.num(P.fadeMs, d.fadeMs, 0, 3000, `${p}.fadeMs`) };
  },
  LYRICS(P: Obj, p: string, S: Sanitizer): LyricsProps {
    const d = DEFAULT_LYRICS;
    return { align: S.oneOf(P.align, ALIGNS, d.align, `${p}.align`), style: textRef(S, P.style, d.style, `${p}.style`), unsungStyle: textRef(S, P.unsungStyle, d.unsungStyle, `${p}.unsungStyle`), showNext: S.bool(P.showNext, d.showNext, `${p}.showNext`),
      nextStyle: textRef(S, P.nextStyle, d.nextStyle, `${p}.nextStyle`), maxChars: Math.round(S.num(P.maxChars, d.maxChars, 20, 200, `${p}.maxChars`)), gapSec: S.num(P.gapSec, d.gapSec, 0.5, 10, `${p}.gapSec`), hideAfterSec: S.num(P.hideAfterSec, d.hideAfterSec, 0, 60, `${p}.hideAfterSec`) };
  },
  AUTOMATION(P: Obj, p: string, S: Sanitizer): AutomationProps {
    const d = DEFAULT_AUTOMATION;
    let fl = S.num(P.floorDb, d.floorDb, -120, 24, `${p}.floorDb`), ce = S.num(P.ceilDb, d.ceilDb, -120, 24, `${p}.ceilDb`);
    if (ce - fl < 1) { S.warn(`${p}.ceilDb`, ce, 'ceilDb phải lớn hơn floorDb ít nhất 1 dB; dùng mặc định'); fl = d.floorDb; ce = d.ceilDb; }
    const lane = P.lane === undefined ? d.lane : isLaneId(P.lane) ? P.lane : (S.warn(`${p}.lane`, P.lane, 'id lane không hợp lệ (chữ, số, . : _ -; tối đa 64 ký tự); dùng volume'), d.lane);
    return { lane, windowSec: S.num(P.windowSec, d.windowSec, 0, 1800, `${p}.windowSec`), playheadRatio: S.num(P.playheadRatio, d.playheadRatio, 0, 1, `${p}.playheadRatio`),
      colorMode: S.oneOf(P.colorMode, ['TRACK', 'SOLID'] as const, d.colorMode, `${p}.colorMode`), color: hexp(S, P.color, d.color, `${p}.color`), thickness: S.num(P.thickness, d.thickness, 1, 20, `${p}.thickness`), fill: S.bool(P.fill, d.fill, `${p}.fill`),
      fillAlpha: S.num(P.fillAlpha, d.fillAlpha, 0, 1, `${p}.fillAlpha`), floorDb: fl, ceilDb: ce, playheadColor: hexOpt(S, P.playheadColor, d.playheadColor, `${p}.playheadColor`), showValue: S.bool(P.showValue, d.showValue, `${p}.showValue`),
      valueStyle: textRef(S, P.valueStyle, d.valueStyle, `${p}.valueStyle`) };
  },
  PROGRESS_BAR(P: Obj, p: string, S: Sanitizer): ProgressBarProps {
    const d = DEFAULT_PROGRESS_BAR;
    return { orientation: S.oneOf(P.orientation, ['HORIZONTAL', 'VERTICAL'] as const, d.orientation, `${p}.orientation`), thickness: S.num(P.thickness, d.thickness, 1, 200, `${p}.thickness`),
      progressColor: S.str(P.progressColor, d.progressColor, `${p}.progressColor`, (s) => HEX.test(s)), trackColor: S.str(P.trackColor, d.trackColor, `${p}.trackColor`, (s) => s === '' || HEX.test(s)),
      radius: S.num(P.radius, d.radius, 0, 100, `${p}.radius`), showTime: S.bool(P.showTime, d.showTime, `${p}.showTime`), timeStyle: textRef(S, P.timeStyle, d.timeStyle, `${p}.timeStyle`), timeValueStyle: textRef(S, P.timeValueStyle, d.timeValueStyle, `${p}.timeValueStyle`),
      timeTemplate: tpl(S, P.timeTemplate, d.timeTemplate, `${p}.timeTemplate`, TEMPLATE_KEYS.PROGRESS_BAR), timeAlign: S.oneOf(P.timeAlign, ALIGNS, d.timeAlign, `${p}.timeAlign`) };
  },
} as const;
export type { Align };
