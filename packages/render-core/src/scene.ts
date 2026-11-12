// T-05: SceneDocument (= Preset, SRS REQ-STORAGE-02) + kiểm/sửa lược đồ. Dữ liệu thuần, không DOM.
// Mô hình hiện tại là "canvas + widgets" của preset 0.3.0. Lớp/phần tử storyboard (T-22) sẽ là schemaVersion mới,
// có hàm di trú từ 0.3.0; vì vậy mọi trường ở đây giữ đúng tên trong SRS để không phải đổi tên khi di trú.
import { DEFAULT_KEYBOARD_STYLE, DEFAULT_NOTE_STYLE, sanitizeStyle, type KeyboardStyle, type NoteStyle, type StyleConfig } from './style.ts';

export const SCENE_SCHEMA_VERSION = '0.3.0';

export const WIDGET_TYPES = ['TRACK_INFO', 'PIANO_ROLL', 'EVENT_COUNTER', 'LIVE_TRIGGER', 'TIME_BAR', 'CHORD_DETECTION', 'AUDIO_SPECTRUM', 'PROGRESS_BAR'] as const;
export type WidgetType = typeof WIDGET_TYPES[number];

export interface WidgetLayout { x: number; y: number; width: number; height: number; rotation: number }
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
  lookaheadSeconds: number;           // 1–8 (REQ-WIDGET-01)
  playheadPositionRatio: number;      // 0.05–0.95
  noteStyle: StyleConfig;
  keyboard: KeyboardStyle;
  playheadColor: string;
  playheadWidth: number;              // pt
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
  /** Thuộc tính tuỳ loại: PIANO_ROLL → PianoRollProps; loại chưa có renderer → giữ nguyên JSON. */
  widgets: WidgetSpec[];
}

export const DEFAULT_PIANO_ROLL: Readonly<PianoRollProps> = Object.freeze({
  orientation: 'HORIZONTAL', pitchRangeMode: 'FIT_CONTENT', pitchMin: 48, pitchMax: 84,
  lookaheadSeconds: 3, playheadPositionRatio: 0.3,
  noteStyle: { base: { ...DEFAULT_NOTE_STYLE }, tracks: {} }, keyboard: { ...DEFAULT_KEYBOARD_STYLE, width: 96 }, // 96 pt ≈ 5% bề rộng 1920
  playheadColor: '#ffffff', playheadWidth: 2,
});

export const ASPECTS: Readonly<Record<string, [number, number]>> = Object.freeze({ '16:9': [1920, 1080], '9:16': [1080, 1920], '1:1': [1080, 1080] });

/** Scene mặc định: một Piano Roll phủ kín khung. Bố cục mặc định theo nền tảng (9:16 cho người mới, KPI-04) chốt ở M2 cùng Preset. */
export function defaultScene(aspect: keyof typeof ASPECTS = '16:9'): SceneDocument {
  const [w, h] = ASPECTS[aspect];
  return {
    schemaVersion: SCENE_SCHEMA_VERSION, presetName: 'Default', author: 'DAW Visualizer',
    canvas: { aspectRatio: aspect, designWidth: w, designHeight: h, backgroundColor: '#0c0e16', backgroundImageData: null,
      snapping: { gridEnabled: true, gridSize: 8, smartGuidesEnabled: true } },
    widgets: [pianoRollWidget({ x: 0, y: 0, width: w, height: h, rotation: 0 })],
  };
}

export function pianoRollWidget(layout: WidgetLayout, props: Partial<PianoRollProps> = {}, id = 'piano-roll-main'): WidgetSpec<PianoRollProps> {
  return { id, type: 'PIANO_ROLL', zIndex: 10, visible: true, layout, trackMappingMode: 'ALL', assignedTrackIndices: [],
    properties: { ...clonePiano(DEFAULT_PIANO_ROLL), ...props } };
}
const clonePiano = (p: PianoRollProps): PianoRollProps => ({ ...p, noteStyle: { base: { ...p.noteStyle.base }, tracks: { ...p.noteStyle.tracks } }, keyboard: { ...p.keyboard } });

// ───────────────────────────── kiểm và sửa lược đồ (REQ-STORAGE-02) ─────────────────────────────
// Trường lạ bị bỏ; giá trị sai về mặc định kèm cảnh báo; không đọc được thì ném ERR_PRESET_INVALID.

export interface SceneWarning { code: 'WARN_PRESET_VALUE' | 'WARN_PRESET_WIDGET_UNKNOWN' | 'WARN_PRESET_UNSUPPORTED' | 'WARN_PRESET_VERSION'; message: string; details: { path: string; value?: unknown } }
export class SceneError extends Error {
  code = 'ERR_PRESET_INVALID';
  details: { path: string };
  constructor(message: string, path: string) { super(message); this.details = { path }; }
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const HEX = /^#[0-9a-f]{6}$/i;

/** Đọc một preset/scene từ JSON thô. Trả scene hợp lệ + cảnh báo. */
export function sanitizeScene(raw: unknown): { scene: SceneDocument; warnings: SceneWarning[] } {
  const warnings: SceneWarning[] = [];
  const w = (code: SceneWarning['code'], path: string, value: unknown, message: string) => warnings.push({ code, message, details: { path, value } });
  if (!isObj(raw)) throw new SceneError('preset không phải đối tượng JSON', '$');
  if (typeof raw.schemaVersion !== 'string') throw new SceneError('thiếu schemaVersion', '$.schemaVersion');
  if (raw.schemaVersion.split('.')[0] !== SCENE_SCHEMA_VERSION.split('.')[0]) throw new SceneError(`schemaVersion ${raw.schemaVersion} không đọc được (cần ${SCENE_SCHEMA_VERSION.split('.')[0]}.x)`, '$.schemaVersion');
  if (raw.schemaVersion !== SCENE_SCHEMA_VERSION) w('WARN_PRESET_VERSION', '$.schemaVersion', raw.schemaVersion, `phiên bản ${raw.schemaVersion} khác ${SCENE_SCHEMA_VERSION}; đọc theo ${SCENE_SCHEMA_VERSION}`);
  if (!isObj(raw.canvas)) throw new SceneError('thiếu canvas', '$.canvas');

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
      rotation: num(L.rotation, 0, -360, 360, `${p}.layout.rotation`),
    };
    if (layout.rotation !== 0) w('WARN_PRESET_UNSUPPORTED', `${p}.layout.rotation`, layout.rotation, 'xoay widget mở từ 1.1 (D-47); vẽ như 0°');
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
      const props: PianoRollProps = {
        orientation: 'HORIZONTAL',
        pitchRangeMode: oneOf(P.pitchRangeMode, ['FIT_CONTENT', 'CUSTOM'] as const, d.pitchRangeMode, `${p}.properties.pitchRangeMode`),
        pitchMin: pMin, pitchMax: pMax,
        lookaheadSeconds: num(P.lookaheadSeconds, d.lookaheadSeconds, 1, 8, `${p}.properties.lookaheadSeconds`),
        playheadPositionRatio: num(P.playheadPositionRatio, d.playheadPositionRatio, 0.05, 0.95, `${p}.properties.playheadPositionRatio`),
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
      };
      widgets.push({ ...base, properties: props });
    } else {
      // Widget chưa có renderer (T-06, T-37…): giữ nguyên thuộc tính để không mất dữ liệu khi lưu lại; renderFrame bỏ qua.
      widgets.push({ ...base, properties: JSON.parse(JSON.stringify(P)) as Record<string, unknown> });
    }
  });

  return {
    scene: { schemaVersion: SCENE_SCHEMA_VERSION, presetName: str(raw.presetName, 'Untitled', '$.presetName'), author: str(raw.author, '', '$.author'), canvas, widgets },
    warnings,
  };
}
