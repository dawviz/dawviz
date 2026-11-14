// T-05: SceneDocument (= Preset, SRS REQ-STORAGE-02) + kiểm/sửa lược đồ. Dữ liệu thuần, không DOM.
// Mô hình hiện tại là "canvas + textStyles + widgets" của preset 0.5.0 (0.4.0 thêm `layout.anchor` theo REQ-GRAPHICS-03; 0.5.0 thêm bộ kiểu chữ
// `textStyles` và chữ dạng TextRef theo REQ-GRAPHICS-18). Đọc được 0.3.x/0.4.x qua `migrateScene`.
// Lớp/phần tử storyboard (T-22) sẽ là schemaVersion mới, có hàm di trú từ 0.4.0; vì vậy mọi trường ở đây giữ đúng tên trong SRS.
import {
  DEFAULT_CHORD, DEFAULT_EVENT_COUNTER, DEFAULT_LIVE_TRIGGER, DEFAULT_PROGRESS_BAR, DEFAULT_TIME_BAR, DEFAULT_TRACK_INFO, TEMPLATE_KEYS, TEXT_FIELDS,
  type Align, type ChordProps, type EventCounterProps, type LineCfg, type LiveTriggerProps, type ProgressBarProps, type TimeBarProps, type TrackInfoProps,
} from './hud.ts';
import { BASE_TEXT_STYLE, BUNDLED_TEXT_FAMILIES, DEFAULT_TEXT_STYLES, TEXT_DEFAULT_FONT, applyOverride, cloneStyle, type NamedTextStyle, type TextRef, type TextStyle, type TextStyleSet } from './typography.ts';
import { unknownPlaceholders } from './text.ts';
import { normalizeAngle } from './snap.ts';
import { DEFAULT_KEYBOARD_STYLE, DEFAULT_NOTE_STYLE, sanitizeStyle, type KeyboardStyle, type NoteStyle, type StyleConfig } from './style.ts';

export const SCENE_SCHEMA_VERSION = '0.5.0';

export const WIDGET_TYPES = ['TRACK_INFO', 'PIANO_ROLL', 'EVENT_COUNTER', 'LIVE_TRIGGER', 'TIME_BAR', 'CHORD_DETECTION', 'AUDIO_SPECTRUM', 'PROGRESS_BAR'] as const;
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
  trackMappingMode: TrackMappingMode;
  /** Chỉ số track trong AST (khớp `ProjectTrack.index`), dùng khi `trackMappingMode = MANUAL`. */
  assignedTrackIndices: number[];
  properties: P;
}

export interface PianoRollProps {
  orientation: 'HORIZONTAL';          // VERTICAL và góc tự do: T-59
  pitchRangeMode: 'FIT_CONTENT' | 'CUSTOM';
  pitchMin: number; pitchMax: number; // dùng khi CUSTOM
  lookaheadSeconds: number;           // 1–8 (REQ-WIDGET-01). Chỉ dùng để suy ra visibleSeconds khi preset cũ thiếu trường đó.
  playheadPositionRatio: number;      // 0.05–0.95
  /** Số giây trải trên toàn bề rộng widget = tỉ lệ thời gian (pt/giây = width / visibleSeconds). Không đổi theo vị trí vạch phát hay bàn phím. 0,5–60.
   *  Preset thiếu trường này: lấy lookahead / (1 − playheadPositionRatio), đúng cách tính cũ, nên preset cũ vẽ như trước. */
  visibleSeconds: number;
  noteStyle: StyleConfig;
  keyboard: KeyboardStyle;
  playheadColor: string;
  playheadWidth: number;              // pt
  /** Hiện vạch phát (REQ-GRAPHICS-16). Ẩn thì nốt vẫn phát tại vị trí vạch, chỉ không vẽ vạch. */
  playheadVisible: boolean;
}

export interface CanvasSpec {
  aspectRatio: string;
  designWidth: number; designHeight: number; // pt logic, 256–4096 (REQ-GRAPHICS-00)
  backgroundColor: string;
  backgroundImageData: null;          // ảnh nền: T-21 (tài nguyên phiên)
  snapping: { gridEnabled: boolean; gridSize: number; smartGuidesEnabled: boolean };
}

export interface SceneDocument {
  schemaVersion: string;
  presetName: string;
  author: string;
  canvas: CanvasSpec;
  /** Bộ kiểu chữ dựng sẵn của preset (REQ-GRAPHICS-18). `sanitizeScene` luôn điền đủ (DEFAULT_TEXT_STYLES + kiểu của preset); vắng = DEFAULT_TEXT_STYLES. */
  textStyles?: TextStyleSet;
  /** Thuộc tính tuỳ loại: PIANO_ROLL → PianoRollProps; loại chưa có renderer → giữ nguyên JSON. */
  widgets: WidgetSpec[];
}

export const DEFAULT_PIANO_ROLL: Readonly<PianoRollProps> = Object.freeze({
  orientation: 'HORIZONTAL', pitchRangeMode: 'FIT_CONTENT', pitchMin: 48, pitchMax: 84,
  lookaheadSeconds: 3, playheadPositionRatio: 0.3, visibleSeconds: 3 / 0.7,
  noteStyle: { base: { ...DEFAULT_NOTE_STYLE }, tracks: {} }, keyboard: { ...DEFAULT_KEYBOARD_STYLE, width: 96 }, // 96 pt ≈ 5% bề rộng 1920
  playheadColor: '#ffffff', playheadWidth: 2, playheadVisible: true,
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
/** Bản sao sâu của bộ kiểu chữ (sửa kiểu trong một scene không đụng bộ mặc định đã đóng băng). */
export const cloneTextStyles = (set: TextStyleSet): Record<string, NamedTextStyle> => Object.fromEntries(Object.entries(set).map(([k, v]) => [k, cloneStyle(v)]));
const clonePiano = (p: PianoRollProps): PianoRollProps => ({ ...p, noteStyle: { base: { ...p.noteStyle.base }, tracks: { ...p.noteStyle.tracks } }, keyboard: { ...p.keyboard } });

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
 *  `textStyles` vắng = bộ dựng sẵn (REQ-GRAPHICS-18). */
export function migrateScene(raw: unknown): { raw: Obj; from: string } {
  if (!isObj(raw)) throw new SceneError('preset không phải đối tượng JSON', '$');
  if (typeof raw.schemaVersion !== 'string') throw new SceneError('thiếu schemaVersion', '$.schemaVersion');
  const v = parseVersion(raw.schemaVersion);
  if (!v) throw new SceneError(`schemaVersion "${raw.schemaVersion.slice(0, 40)}" không đúng dạng chính.phụ.vá`, '$.schemaVersion');
  const cur = parseVersion(SCENE_SCHEMA_VERSION)!;
  if (v[0] > cur[0] || (v[0] === cur[0] && v[1] > cur[1]))
    throw new SceneError(`preset phiên bản ${raw.schemaVersion} mới hơn ứng dụng (đọc được tới ${cur[0]}.${cur[1]}.x)`, '$.schemaVersion', 'ERR_SCHEMA_NEWER', { found: raw.schemaVersion, supported: SCENE_SCHEMA_VERSION });
  if (v[0] !== 0 || v[1] < 3) throw new SceneError(`schemaVersion ${raw.schemaVersion} không đọc được (cần 0.3.x đến 0.5.x)`, '$.schemaVersion');
  let out: Obj = structuredClone(raw);
  if (v[1] === 3) {
    if (Array.isArray(out.widgets)) for (const w of out.widgets) if (isObj(w) && isObj(w.layout) && w.layout.anchor === undefined) w.layout.anchor = { x: DEFAULT_ANCHOR.x, y: DEFAULT_ANCHOR.y };
    out = { ...out, schemaVersion: '0.4.0' };
  }
  if (v[1] <= 4) out = { ...out, schemaVersion: '0.5.0' };
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
  if (c.backgroundImageData != null) w('WARN_PRESET_UNSUPPORTED', '$.canvas.backgroundImageData', '(ảnh)', 'ảnh nền chưa hỗ trợ (T-21); bỏ qua');
  const sn = isObj(c.snapping) ? c.snapping : {};
  const canvas: CanvasSpec = {
    aspectRatio: str(c.aspectRatio, `${dw}:${dh}`, '$.canvas.aspectRatio'),
    designWidth: dw, designHeight: dh,
    backgroundColor: str(c.backgroundColor, '#0c0e16', '$.canvas.backgroundColor', (s) => HEX.test(s)),
    backgroundImageData: null,
    snapping: {
      gridEnabled: bool(sn.gridEnabled, true, '$.canvas.snapping.gridEnabled'),
      gridSize: num(sn.gridSize, 8, 1, 256, '$.canvas.snapping.gridSize'),
      smartGuidesEnabled: bool(sn.smartGuidesEnabled, true, '$.canvas.snapping.smartGuidesEnabled'),
    },
  };

  const widgets: WidgetSpec[] = [];
  const ids = new Set<string>();
  const list = Array.isArray(raw.widgets) ? raw.widgets : (w('WARN_PRESET_VALUE', '$.widgets', raw.widgets, 'không phải mảng; bỏ qua'), []);
  list.forEach((rw, i) => {
    const p = `$.widgets[${i}]`;
    if (!isObj(rw)) { w('WARN_PRESET_VALUE', p, rw, 'widget không phải đối tượng; bỏ qua'); return; }
    if (!WIDGET_TYPES.includes(rw.type as WidgetType)) { w('WARN_PRESET_WIDGET_UNKNOWN', `${p}.type`, rw.type, 'loại widget không hợp lệ; bỏ qua'); return; }
    let id = str(rw.id, `${String(rw.type).toLowerCase()}-${i}`, `${p}.id`, (s) => s.length > 0 && s.length <= 64);
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
    const P = isObj(rw.properties) ? rw.properties : {};
    if (rw.type === 'PIANO_ROLL') {
      const d = DEFAULT_PIANO_ROLL;
      if (P.orientation !== undefined && P.orientation !== 'HORIZONTAL') w('WARN_PRESET_UNSUPPORTED', `${p}.properties.orientation`, P.orientation, 'hướng dọc/góc tự do chưa hỗ trợ (T-59); dùng HORIZONTAL');
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
        noteStyle: { base: sanitizeStyle(nsBase), tracks },
        keyboard: {
          enabled: bool(kb.enabled, d.keyboard.enabled, `${p}.properties.keyboard.enabled`),
          width: num(kb.width, d.keyboard.width, 8, 400, `${p}.properties.keyboard.width`),
          whiteColor: str(kb.whiteColor, d.keyboard.whiteColor, `${p}.properties.keyboard.whiteColor`, (s) => HEX.test(s)),
          blackColor: str(kb.blackColor, d.keyboard.blackColor, `${p}.properties.keyboard.blackColor`, (s) => HEX.test(s)),
          useTrackColor: bool(kb.useTrackColor, d.keyboard.useTrackColor, `${p}.properties.keyboard.useTrackColor`),
        },
        playheadColor: str(P.playheadColor, d.playheadColor, `${p}.properties.playheadColor`, (s) => HEX.test(s)),
        playheadWidth: num(P.playheadWidth, d.playheadWidth, 0, 40, `${p}.properties.playheadWidth`),
        playheadVisible: bool(P.playheadVisible, d.playheadVisible, `${p}.properties.playheadVisible`),
      };
      widgets.push({ ...base, properties: props });
    } else if (base.type in HUD_SANITIZERS) {
      widgets.push({ ...base, properties: HUD_SANITIZERS[base.type as keyof typeof HUD_SANITIZERS](P, `${p}.properties`, S) });
    } else {
      // Widget chưa có renderer (T-37…): giữ nguyên thuộc tính để không mất dữ liệu khi lưu lại; renderFrame bỏ qua.
      widgets.push({ ...base, properties: P });
    }
  });

  // Phông không có sẵn: một cảnh báo cho mỗi họ (đường dẫn chỗ đầu tiên dùng nó).
  const fonts = opts.fonts ?? BUNDLED_TEXT_FAMILIES, seen = new Set<string>();
  const missing = (font: unknown, path: string) => {
    if (typeof font !== 'string' || fonts.includes(font) || seen.has(font)) return;
    seen.add(font);
    warnings.push({ code: 'WARN_PRESET_FONT_MISSING', message: `phông "${font}" không có sẵn; vẽ bằng ${TEXT_DEFAULT_FONT}`, details: { path, value: font, to: TEXT_DEFAULT_FONT } });
  };
  for (const [id, st] of Object.entries(textStyles)) missing(st.font, `$.textStyles.${id}.font`);
  widgets.forEach((wd, i) => {
    const P = wd.properties as Record<string, unknown>;
    for (const f of Object.keys((TEXT_FIELDS as Record<string, object>)[wd.type] ?? {})) missing((P[f] as TextRef | undefined)?.font, `$.widgets[${i}].properties.${f}.font`);
  });

  return {
    scene: { schemaVersion: SCENE_SCHEMA_VERSION, presetName: str(raw.presetName, 'Untitled', '$.presetName'), author: str(raw.author, '', '$.author'), canvas, textStyles, widgets },
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
const FONT_OK = (s: string) => /^[\w][\w \-]{0,39}$/.test(s);
const tpl = (S: Sanitizer, v: unknown, d: string, path: string, keys: readonly string[]): string => {
  const t = S.str(v, d, path, (s) => s.length <= 200);
  const bad = unknownPlaceholders(t, keys);
  if (bad.length) S.warn(path, t, `chỗ giữ lạ {${bad.join('}, {')}}; chữ được giữ nguyên`);
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

const HUD_SANITIZERS = {
  TRACK_INFO(P: Obj, p: string, S: Sanitizer): TrackInfoProps {
    const d = DEFAULT_TRACK_INFO;
    return { align: S.oneOf(P.align, ALIGNS, d.align, `${p}.align`), titleText: S.str(P.titleText, d.titleText, `${p}.titleText`, (s) => s.length <= 200),
      titleStyle: textRef(S, P.titleStyle, d.titleStyle, `${p}.titleStyle`), artistText: S.str(P.artistText, d.artistText, `${p}.artistText`, (s) => s.length <= 200),
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
      time: { enabled: S.bool(tm.enabled, d.time.enabled, `${p}.time.enabled`), label: S.str(tm.label, d.time.label, `${p}.time.label`, (s) => s.length <= 40), format: S.oneOf(tm.format, ['grouped', 'clock'] as const, d.time.format, `${p}.time.format`) },
      beat: { enabled: S.bool(bt.enabled, d.beat.enabled, `${p}.beat.enabled`), label: S.str(bt.label, d.beat.label, `${p}.beat.label`, (s) => s.length <= 40), format: S.oneOf(bt.format, ['grouped', 'bbs'] as const, d.beat.format, `${p}.beat.format`) },
      timeGroups: groups(S, P.timeGroups, d.timeGroups, `${p}.timeGroups`), beatGroups: groups(S, P.beatGroups, d.beatGroups, `${p}.beatGroups`),
      showBars: S.bool(P.showBars, d.showBars, `${p}.showBars`), barLength: S.num(P.barLength, d.barLength, 4, 1000, `${p}.barLength`), barThickness: S.num(P.barThickness, d.barThickness, 0.5, 40, `${p}.barThickness`),
      barColor: S.str(P.barColor, d.barColor, `${p}.barColor`, (s) => HEX.test(s)), barTrackColor: S.str(P.barTrackColor, d.barTrackColor, `${p}.barTrackColor`, (s) => s === '' || HEX.test(s)) };
  },
  CHORD_DETECTION(P: Obj, p: string, S: Sanitizer): ChordProps {
    const d = DEFAULT_CHORD;
    return { mode: S.oneOf(P.mode, ['sustained', 'strike'] as const, d.mode, `${p}.mode`), align: S.oneOf(P.align, ALIGNS, d.align, `${p}.align`), nameStyle: textRef(S, P.nameStyle, d.nameStyle, `${p}.nameStyle`), bassStyle: textRef(S, P.bassStyle, d.bassStyle, `${p}.bassStyle`),
      notesStyle: textRef(S, P.notesStyle, d.notesStyle, `${p}.notesStyle`), notesValueStyle: textRef(S, P.notesValueStyle, d.notesValueStyle, `${p}.notesValueStyle`),
      alwaysShowNotes: S.bool(P.alwaysShowNotes, d.alwaysShowNotes, `${p}.alwaysShowNotes`), notesTemplate: tpl(S, P.notesTemplate, d.notesTemplate, `${p}.notesTemplate`, TEMPLATE_KEYS.CHORD_DETECTION),
      unrecognized: S.oneOf(P.unrecognized, ['nc', 'notes'] as const, d.unrecognized, `${p}.unrecognized`), noChordText: S.str(P.noChordText, d.noChordText, `${p}.noChordText`, (s) => s.length <= 20) };
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
