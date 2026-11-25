// Hoạt hình thuộc tính (T-22, CUSTOMIZATION §3.1 và §3.3): MỌI thuộc tính số hoặc màu của một widget có thể là giá trị tĩnh, keyframe theo thời gian,
// hoặc binding vào dữ liệu nhạc. `WidgetSpec.animate` ánh xạ đường dẫn thuộc tính → hoạt hình. Mỗi khung hình, giá trị tính ra được ghép vào bản sao của widget
// rồi đi lại qua đúng bộ kiểm của loại widget (kẹp về miền hợp lệ), nên renderer không bao giờ nhận giá trị sai. Thuần và tất định: hàm của (widget, t, AST).
//
// Đường dẫn: `layout.x|y|width|height|rotation`, `opacity` (0..1, nhân thêm độ đục cả widget), `scale` (%, 100 = nguyên cỡ; co giãn cả widget quanh điểm neo,
// như Scale của After Effects; không đổi khung bố cục), và mọi thuộc tính số hoặc màu `#rrggbb` có trong mặc định của loại
// widget (lồng được: `lines.played.x`…). Thuộc tính bật/tắt và lựa chọn (chuỗi không phải màu: kiểu chữ, căn lề, chế độ…) animate theo bậc
// (`kind: 'discrete'`: giữ rồi đổi đúng tại keyframe). Piano Roll nhận một danh sách đường dẫn riêng (`PIANO_PATHS`: tỉ lệ thời gian, vạch phát,
// bàn phím, kiểu nốt chung) — phần cấu trúc (dải cao độ, chế độ trang, kiểu nốt theo track) không animate. Bản nhạc chỉ nhận `layout.*`, `opacity`,
// `scale` (đổi thuộc tính bản nhạc phải dựng lại trong Worker).
import { activeNotes, notesInRange, type TrackIndex } from './notes.ts';
import { barPosAt, hudOf, shown } from './hud.ts';
import { isLaneId, laneUnit } from './glow.ts';
import { frameAt, u8ToDb } from './audioFeatures.ts';
import { compileTrack, sampleTrack, mixColor, type CompiledTrack, type Key, type KeyTime, type KeyValue, type LoopMode, type TrackSpec } from './keyframes.ts';
import { DEFAULT_NOTE_STYLE, sanitizeStyle, type NoteStyle } from './style.ts';
import { EASINGS, interpolate, parseEase, type EaseSpec } from './motion.ts';
import { ExprError, colorToHex, compile, isFiniteValue, type Budget, type Compiled, type ExprErrorCode } from '@dawviz/expr';
import { keyTimeSec } from './keyframes.ts';
import { strHash } from './particles.ts';
import { normalizeAngle } from './snap.ts';
import { HEX_COLOR } from './color.ts';
import { widgetDefaults, silentSanitizer, sanitizeWidgetProps, type Sanitizer, type SceneDocument, type WidgetSpec, type WidgetType } from './scene.ts';
import type { Derived } from './prims.ts';
import type { UnifiedProjectAST } from './types.ts';

export const BIND_SOURCES = ['beat.phase', 'bar.phase', 'progress', 'notes.count', 'notes.velocity', 'note.hit', 'track.volume', 'track.pan', 'audio.level'] as const;
/** Nguồn cố định (9 nguồn) hoặc một lane automation bất kỳ theo id: `track.automation.<id>` (T-66, REQ-AST-02), giá trị 0..1 như laneUnit. */
export type BindSource = typeof BIND_SOURCES[number] | `track.automation.${string}`;
export const LANE_BIND_PREFIX = 'track.automation.';
/** Id lane của nguồn `track.automation.<id>`; nguồn khác → null. */
export const bindLaneId = (src: string): string | null => (src.startsWith(LANE_BIND_PREFIX) && isLaneId(src.slice(LANE_BIND_PREFIX.length)) ? src.slice(LANE_BIND_PREFIX.length) : null);
export const laneBindSource = (id: string): BindSource => `${LANE_BIND_PREFIX}${id}` as BindSource;
export const isBindSource = (s: unknown): s is BindSource => typeof s === 'string' && ((BIND_SOURCES as readonly string[]).includes(s) || bindLaneId(s) !== null);
/** Giá trị = `to[0]` khi nguồn ở `from[0]`, `to[1]` khi ở `from[1]`, nội suy (kẹp ngoài biên) qua `ease`. `to` là hai số hoặc hai màu `#rrggbb`. */
export interface Binding { bind: BindSource; from: [number, number]; to: [number, number] | [string, string]; ease?: EaseSpec }
export type KeyAnimation = TrackSpec;
/** Biểu thức (T-29, AD-13): `{ expr: "0.5 + note.velocity / 127" }`, ngôn ngữ của @dawviz/expr. */
export interface ExprAnimation { expr: string }
export type Animation = KeyAnimation | Binding | ExprAnimation;
export const isBinding = (a: Animation): a is Binding => 'bind' in a;
export const isExpr = (a: Animation): a is ExprAnimation => typeof (a as ExprAnimation).expr === 'string';
/** Hoạt hình bằng keyframe (không phải binding hay biểu thức). */
export const isKeyAnim = (a: Animation | null | undefined): a is KeyAnimation => !!a && Array.isArray((a as KeyAnimation).keys);

// ───────────── biểu thức (T-29, T-30) ─────────────
/** Biến đọc được trong biểu thức (danh sách trắng, EXPRESSIONS §3.2): bản chụp số của dữ liệu nhạc tại t, không có đối tượng nào của ứng dụng. */
export const EXPR_VARS: ReadonlyMap<string, 'num' | 'bool'> = new Map<string, 'num' | 'bool'>([
  ['t', 'num'], ['time.sec', 'num'], ['time.progress', 'num'], ['time.duration', 'num'],
  ['beat.phase', 'num'], ['beat.index', 'num'], ['bar.phase', 'num'], ['bar.index', 'num'], ['bar.bpm', 'num'],
  ['notes.count', 'num'], ['note.velocity', 'num'], ['note.pitch', 'num'], ['note.hit', 'num'], ['note.active', 'bool'],
  ['track.volume', 'num'], ['track.pan', 'num'], ['audio.level', 'num'],
  ['value', 'num'], ['width', 'num'], ['height', 'num'], ['index', 'num'], ['count', 'num'], ['seed', 'num'],
]);
const EASE_MAP: ReadonlyMap<string, (x: number) => number> = new Map(Object.entries(EASINGS));
const RESULT: Partial<Record<AnimKind, 'num' | 'color' | 'bool'>> = { number: 'num', color: 'color', bool: 'bool' };
/** Biên dịch biểu thức cho một đường dẫn kiểu `kind` (lựa chọn/chữ không nhận biểu thức). Ném ExprError khi sai. */
export function compileExpr(src: string, kind: AnimKind): Compiled {
  const result = RESULT[kind];
  if (!result) throw new ExprError('ERR_EXPR_TYPE', 'thuộc tính lựa chọn/chữ không nhận biểu thức');
  return compile(src, { vars: EXPR_VARS, result, easings: EASE_MAP });
}
/** Nơi báo biểu thức lỗi lúc chạy (vượt ngân sách, NaN/∞): Render Core không ném, chỉ báo và dùng giá trị dự phòng. */
export interface ExprIssue { widgetId: string; path: string; code: ExprErrorCode | 'ERR_EXPR_COMPILE' }
export const MAX_ANIMATIONS = 24, MAX_ANIM_KEYS = 256;
/** Giới hạn của `scale` (%): 0 (biến mất) tới 2000. */
export const MAX_SCALE = 2000;
const HEX = HEX_COLOR; // #rrggbb hoặc #rrggbbaa (T-49)
const LAYOUT_PATHS = ['layout.x', 'layout.y', 'layout.width', 'layout.height', 'layout.rotation'] as const;
/** Kiểu giá trị của một đường dẫn animate được. `bool`/`choice` animate theo bậc (track `kind: 'discrete'`). */
export type AnimKind = 'number' | 'color' | 'bool' | 'choice';
/** Độ dài tối đa của một giá trị lựa chọn/chữ trong keyframe. */
export const MAX_CHOICE_LEN = 200;
/**
 * Đường dẫn animate được của Piano Roll và miền kẹp của số (cùng miền với bộ kiểm preset). Kiểu nốt chung (`noteStyle.base.*`) đi qua
 * `sanitizeStyle` nên chỉ cần liệt kê; số khác kẹp theo bảng.
 */
const PIANO_NUM: Readonly<Record<string, [number, number]>> = {
  visibleSeconds: [0.5, 60], playheadPositionRatio: [0.05, 0.95], playheadWidth: [0, 40], 'keyboard.width': [8, 400],
  // T-58/T-51/T-59 và lưới ô nhịp
  flowAngle: [0, 360], playheadLength: [0.05, 1], playheadGlow: [0, 1], 'grid.opacity': [0, 1], 'keyboard.scaleOpacity': [0, 1],
};
const PIANO_STYLE_NUM = ['opacity', 'inactiveOpacity', 'cornerRadius', 'heightScale', 'glow', 'glowRadius', 'borderWidth', 'glowMin', 'glowMax', 'glowRelease'] as const;
export const PIANO_PATHS: ReadonlyMap<string, AnimKind> = new Map<string, AnimKind>([
  ...Object.keys(PIANO_NUM).map((p) => [p, 'number'] as [string, AnimKind]),
  ...PIANO_STYLE_NUM.map((k) => [`noteStyle.base.${k}`, 'number'] as [string, AnimKind]),
  ['noteStyle.base.customColor', 'color'], ['playheadColor', 'color'], ['keyboard.whiteColor', 'color'], ['keyboard.blackColor', 'color'],
  ['keyboard.pressedColor', 'color'], ['keyboard.scaleColor', 'color'], ['grid.color', 'color'], ['grid.bars', 'bool'], ['grid.beats', 'bool'], ['grid.numbers', 'bool'],
  ['noteStyle.base.glowActiveOnly', 'bool'], ['noteStyle.base.colorMode', 'choice'], ['playheadVisible', 'bool'], ['keyboard.enabled', 'bool'], ['keyboard.useTrackColor', 'bool'],
]);
/**
 * Đường dẫn animate được của Bản nhạc: chỉ thuộc tính hình vẽ (màu, quầng sáng, độ đục, phóng to, vạch phát). Thuộc tính dựng bản nhạc
 * (`NOTATION_ENGRAVE_KEYS`) không animate được vì đổi là phải dựng lại.
 */
export const NOTATION_PATHS: ReadonlyMap<string, AnimKind> = new Map<string, AnimKind>([
  ['inkColor', 'color'], ['playedColor', 'color'], ['activeColor', 'color'], ['playheadColor', 'color'], ['auraColor', 'color'],
  ...['upcomingOpacity', 'playedOpacity', 'staticOpacity', 'zoom', 'glow', 'glowSize', 'playheadWidth', 'auraGlow', 'auraMin'].map((k) => [k, 'number'] as [string, AnimKind]),
  ['colorMode', 'choice'], ['glowMode', 'choice'],
]);
const CHOICE_OK: Readonly<Record<string, readonly string[]>> = { 'noteStyle.base.colorMode': ['track', 'custom', 'pitch', 'velocity'] };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
function setIn(o: Obj, path: readonly string[], v: unknown): Obj {
  const [k, ...rest] = path;
  return { ...o, [k]: rest.length ? setIn(isObj(o[k]) ? (o[k] as Obj) : {}, rest, v) : v };
}
const leaves = (o: unknown, prefix: string[], out: Map<string, AnimKind>): void => {
  if (!isObj(o)) return;
  for (const [k, v] of Object.entries(o)) {
    const p = [...prefix, k];
    if (typeof v === 'number') out.set(p.join('.'), 'number');
    else if (typeof v === 'string') out.set(p.join('.'), HEX.test(v) ? 'color' : 'choice');
    else if (typeof v === 'boolean') out.set(p.join('.'), 'bool');
    else leaves(v, p, out);
  }
};
const pathCache = new Map<WidgetType, Map<string, AnimKind>>();
/** Các đường dẫn animate được của một loại widget và kiểu giá trị của chúng (bản đệm: đừng sửa Map trả về). */
export function animatablePaths(type: WidgetType): Map<string, AnimKind> {
  const hit = pathCache.get(type); if (hit) return hit;
  const out = new Map<string, AnimKind>();
  for (const p of LAYOUT_PATHS) out.set(p, 'number');
  out.set('opacity', 'number');
  out.set('scale', 'number');
  if (type === 'PIANO_ROLL') for (const [p, k] of PIANO_PATHS) out.set(p, k);
  else if (type === 'NOTATION') for (const [p, k] of NOTATION_PATHS) out.set(p, k);
  else leaves(widgetDefaults(type), [], out);
  pathCache.set(type, out);
  return out;
}
/** Track của kiểu này nội suy được không (số, màu) hay theo bậc (bật/tắt, lựa chọn). */
export const isDiscreteKind = (k: AnimKind): boolean => k === 'bool' || k === 'choice';

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
function cleanKeyTime(a: unknown): KeyTime | null {
  if (!isObj(a)) return null;
  if (finite(a.sec) && a.sec >= 0) return { sec: a.sec };
  if (finite(a.tick) && a.tick >= 0) return { tick: a.tick };
  if (finite(a.bar) && a.bar >= 1) return { bar: a.bar, ...(finite(a.beat) && a.beat >= 1 ? { beat: a.beat } : {}) };
  if (finite(a.beat) && a.beat >= 0) return { beat: a.beat };
  return null;
}
/** Đọc `animate` của một widget. Mục sai bị bỏ kèm cảnh báo; không còn mục nào → undefined. */
export function sanitizeAnimate(S: Sanitizer, v: unknown, path: string, type: WidgetType): Record<string, Animation> | undefined {
  if (!isObj(v)) { S.warn(path, v, 'không phải đối tượng; bỏ'); return undefined; }
  const paths = animatablePaths(type), out: Record<string, Animation> = {};
  let n = 0;
  for (const [key, raw] of Object.entries(v)) {
    const p = `${path}.${key}`, kind = paths.get(key);
    if (!kind) { S.warn(p, key, 'thuộc tính này không animate được; bỏ'); continue; }
    if (++n > MAX_ANIMATIONS) { S.warn(p, key, `quá ${MAX_ANIMATIONS} hoạt hình; bỏ`); continue; }
    if (!isObj(raw)) { S.warn(p, raw, 'không phải đối tượng; bỏ'); continue; }
    const okVal = (x: unknown): boolean => (kind === 'number' ? finite(x) : kind === 'color' ? typeof x === 'string' && HEX.test(x)
      : kind === 'bool' ? typeof x === 'boolean' : typeof x === 'string' && x.length <= MAX_CHOICE_LEN);
    if (Array.isArray(raw.keys)) {
      const keys: Key[] = [];
      raw.keys.slice(0, MAX_ANIM_KEYS).forEach((k, i) => {
        const at = isObj(k) ? cleanKeyTime(k.at) : null;
        if (!isObj(k) || !at || !okVal(k.value)) { S.warn(`${p}.keys[${i}]`, k, 'keyframe không hợp lệ; bỏ'); return; }
        const key: Key = { at, value: k.value as KeyValue };
        if (k.ease !== undefined) { if (parseEase(k.ease).ok) key.ease = k.ease as EaseSpec; else S.warn(`${p}.keys[${i}].ease`, k.ease, 'easing lạ; dùng linear'); }
        if (k.interp === 'hold' || k.interp === 'smooth' || k.interp === 'linear') key.interp = k.interp;
        keys.push(key);
      });
      if (raw.keys.length > MAX_ANIM_KEYS) S.warn(`${p}.keys`, raw.keys.length, `quá ${MAX_ANIM_KEYS} keyframe; cắt bớt`);
      if (!keys.length) { S.warn(p, raw, 'không có keyframe hợp lệ; bỏ'); continue; }
      const a: KeyAnimation = { keys, ...(kind === 'color' ? { kind: 'color' as const } : isDiscreteKind(kind) ? { kind: 'discrete' as const } : {}) };
      if (raw.loop === 'CYCLE' || raw.loop === 'PINGPONG' || raw.loop === 'OFFSET') a.loop = raw.loop as LoopMode;
      out[key] = a;
    } else if (typeof raw.expr === 'string') {
      try { compileExpr(raw.expr, kind); out[key] = { expr: raw.expr }; }
      catch (e) { S.warn(`${p}.expr`, raw.expr.slice(0, 80), e instanceof ExprError ? `biểu thức lỗi (${e.code}, ký tự ${e.pos}): ${e.message}; bỏ` : 'biểu thức lỗi; bỏ'); }
    } else if (typeof raw.bind === 'string') {
      if (isDiscreteKind(kind)) { S.warn(p, raw, 'thuộc tính theo bậc chỉ nhận keyframe, không gắn theo nhạc; bỏ'); continue; }
      const from = raw.from, to = raw.to;
      if (!isBindSource(raw.bind)) { S.warn(`${p}.bind`, raw.bind, `không thuộc ${BIND_SOURCES.join('/')} hay ${LANE_BIND_PREFIX}<id>; bỏ`); continue; }
      if (!Array.isArray(from) || from.length !== 2 || !from.every(finite) || from[0] === from[1]) { S.warn(`${p}.from`, from, 'cần hai số khác nhau; bỏ'); continue; }
      if (!Array.isArray(to) || to.length !== 2 || !to.every(okVal)) { S.warn(`${p}.to`, to, kind === 'color' ? 'cần hai màu #rrggbb; bỏ' : 'cần hai số; bỏ'); continue; }
      const b: Binding = { bind: raw.bind as BindSource, from: [from[0], from[1]], to: [to[0], to[1]] as Binding['to'] };
      if (raw.ease !== undefined) { if (parseEase(raw.ease).ok) b.ease = raw.ease as EaseSpec; else S.warn(`${p}.ease`, raw.ease, 'easing lạ; dùng linear'); }
      out[key] = b;
    } else S.warn(p, raw, 'cần `keys`, `bind` hoặc `expr`; bỏ');
  }
  return Object.keys(out).length ? out : undefined;
}

// ───────────── tính giá trị mỗi khung ─────────────
export interface BindCtx {
  ast: UnifiedProjectAST; derived: Derived; tracks: TrackIndex[]; t: number;
  /** Ngân sách bước biểu thức dùng chung cả khung (T-30, FRAME_BUDGET); vắng = mỗi biểu thức tự giới hạn LIMITS.maxSteps. */
  budget?: Budget;
  /** Báo biểu thức lỗi lúc chạy (giá trị dự phòng đã được dùng). */
  onExprIssue?(i: ExprIssue): void;
}
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const HIT_DECAY = 0.6;
/** Giá trị thô của một nguồn dữ liệu nhạc tại t (thang riêng của từng nguồn; ánh xạ sang thuộc tính bằng `from`/`to`). */
export function bindSourceValue(src: BindSource, c: BindCtx): number {
  const { ast, derived, t } = c, list = shown(c.tracks);
  const lane = bindLaneId(src);
  if (lane !== null) { // lane theo id: track đầu tiên (theo thứ tự của widget) có lane đó; không track nào có → 0
    for (const ti of list) { const u = laneUnit(ti.track, lane, ast.tempoMap, t); if (u !== undefined) return u; }
    return 0;
  }
  switch (src as typeof BIND_SOURCES[number]) {
    case 'beat.phase': return barPosAt(hudOf(derived, ast).bars, t).beatPhase;
    case 'bar.phase': return barPosAt(hudOf(derived, ast).bars, t).barPhase;
    case 'progress': return derived.index.duration > 0 ? clamp01(t / derived.index.duration) : 0;
    case 'notes.count': { let n = 0; for (const ti of list) n += activeNotes(ti, t).length; return n; }
    case 'notes.velocity': { let v = 0; for (const ti of list) for (const x of activeNotes(ti, t)) if (x.velocity > v) v = x.velocity; return v; }
    case 'note.hit': {
      let v = 0;
      for (const ti of list) for (const n of notesInRange(ti, t - HIT_DECAY, t)) { const age = t - n.startTimeSeconds; if (age >= 0 && age < HIT_DECAY) v = Math.max(v, (n.velocity / 127) * (1 - age / HIT_DECAY)); }
      return v;
    }
    case 'track.volume': case 'track.pan': {
      const name = src === 'track.volume' ? 'volume' : 'pan';
      for (const ti of list) { const u = laneUnit(ti.track, name, ast.tempoMap, t); if (u !== undefined) return u; }
      return 0;
    }
    case 'audio.level': {
      const a = derived.audio; if (!a) return 0;
      const f = frameAt(a.features, t - a.offsetSec); if (f < 0) return 0;
      return clamp01((u8ToDb(a.features.rms[f]) + 60) / 60);
    }
  }
  return 0;
}
const trackCache = new WeakMap<object, { tm: unknown; ct: CompiledTrack }>();
const exprCache = new WeakMap<object, { kind: AnimKind; c: Compiled | null }>();
/** Bản chụp biến của biểu thức tại t (tính lười, mỗi tên một lần cho mỗi lần đánh giá). */
function exprVars(c: BindCtx, w: WidgetSpec, base: KeyValue): (name: string) => number | boolean | undefined {
  const memo = new Map<string, number | boolean>();
  const pos = () => barPosAt(hudOf(c.derived, c.ast).bars, c.t);
  const notes = () => { let v = 0, p = 0, n = 0; for (const ti of shown(c.tracks)) for (const x of activeNotes(ti, c.t)) { n++; if (x.velocity > v) v = x.velocity; if (x.pitch > p) p = x.pitch; } return { v, p, n }; };
  const calc = (name: string): number | boolean | undefined => {
    switch (name) {
      case 't': case 'time.sec': return c.t;
      case 'time.duration': return c.derived.index.duration;
      case 'time.progress': return bindSourceValue('progress', c);
      case 'beat.phase': return bindSourceValue('beat.phase', c);
      case 'bar.phase': return bindSourceValue('bar.phase', c);
      case 'beat.index': return pos().beat;
      case 'bar.index': return pos().bar;
      case 'bar.bpm': return pos().bpm;
      case 'notes.count': return notes().n;
      case 'note.velocity': return notes().v;
      case 'note.pitch': return notes().p;
      case 'note.active': return notes().n > 0;
      case 'note.hit': return bindSourceValue('note.hit', c);
      case 'track.volume': return bindSourceValue('track.volume', c);
      case 'track.pan': return bindSourceValue('track.pan', c);
      case 'audio.level': return bindSourceValue('audio.level', c);
      case 'value': return typeof base === 'number' ? base : 0;
      case 'width': return w.layout.width;
      case 'height': return w.layout.height;
      case 'index': return 0;
      case 'count': return 1;
      case 'seed': return strHash(w.id);
    }
    return undefined;
  };
  return (name) => { if (memo.has(name)) return memo.get(name); const v = calc(name); if (v !== undefined) memo.set(name, v); return v; };
}
function exprValue(a: ExprAnimation, kind: AnimKind, c: BindCtx, w: WidgetSpec, path: string, base: KeyValue): KeyValue {
  let hit = exprCache.get(a);
  if (!hit || hit.kind !== kind) { let comp: Compiled | null = null; try { comp = compileExpr(a.expr, kind); } catch { /* preset đã kiểm; dữ liệu sửa tay lỗi: dùng giá trị tĩnh */ } hit = { kind, c: comp }; exprCache.set(a, hit); }
  if (!hit.c) { c.onExprIssue?.({ widgetId: w.id, path, code: 'ERR_EXPR_COMPILE' }); return base; }
  const tm = c.ast.tempoMap;
  try {
    const v = hit.c.evaluate({
      get: exprVars(c, w, base), seed: strHash(`${w.id}/${path}`),
      valueAt: () => (typeof base === 'number' ? base : 0), loop: () => (typeof base === 'number' ? base : 0),
      beatsToSec: (b) => keyTimeSec({ beat: b }, { tempoMap: tm }), secToBeats: (s) => secToBeatsOf(tm, s),
    }, c.budget);
    if (!isFiniteValue(v)) { c.onExprIssue?.({ widgetId: w.id, path, code: 'ERR_EXPR_VALUE' }); return base; }
    if (typeof v === 'object') return v.kind === 'color' ? colorToHex(v) : base;
    return v;
  } catch (e) { c.onExprIssue?.({ widgetId: w.id, path, code: e instanceof ExprError ? e.code : 'ERR_EXPR_VALUE' }); return base; }
}
/** Giây → số phách (nghịch của keyTimeSec({beat})) theo tempo map: tìm đoạn tempo chứa s. */
function secToBeatsOf(tm: UnifiedProjectAST['tempoMap'], s: number): number {
  if (!tm.length) return s * 2;
  let i = 0; while (i + 1 < tm.length && tm[i + 1].timeSeconds <= s) i++;
  const p = tm[i];
  return beatsAt(tm, i) + ((s - p.timeSeconds) * p.bpm) / 60;
}
const beatsAt = (tm: UnifiedProjectAST['tempoMap'], i: number) => { let b = 0; for (let k = 0; k < i; k++) b += ((tm[k + 1].timeSeconds - tm[k].timeSeconds) * tm[k].bpm) / 60; return b; };
function animValue(a: Animation, kind: AnimKind, c: BindCtx, w: WidgetSpec, path: string, base: KeyValue): KeyValue {
  if (isExpr(a)) return exprValue(a, kind, c, w, path, base);
  if (isBinding(a)) {
    const k = interpolate(bindSourceValue(a.bind, c), a.from, [0, 1], { ease: a.ease });
    if (kind === 'color') return mixColor(a.to[0] as string, a.to[1] as string, k);
    return (a.to[0] as number) + ((a.to[1] as number) - (a.to[0] as number)) * k;
  }
  let hit = trackCache.get(a);
  if (!hit || hit.tm !== c.ast.tempoMap) { hit = { tm: c.ast.tempoMap, ct: compileTrack(isDiscreteKind(kind) && a.kind !== 'discrete' ? { ...a, kind: 'discrete' } : a, { tempoMap: c.ast.tempoMap }) }; trackCache.set(a, hit); }
  return sampleTrack(hit.ct, c.t);
}

/** Giá trị tĩnh của một đường dẫn (biến `value` của biểu thức; giá trị dự phòng khi biểu thức lỗi). */
function baseValue(w: WidgetSpec, path: string): KeyValue {
  if (path === 'opacity') return 1;
  if (path === 'scale') return 100;
  let v: unknown = path.startsWith('layout.') ? (w.layout as unknown as Obj)[path.slice(7)] : w.properties;
  if (!path.startsWith('layout.')) for (const k of path.split('.')) v = isObj(v) ? v[k] : undefined;
  return typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean' ? v : 0;
}
/**
 * Widget của khung hình này: bản sao với thuộc tính/bố cục đã animate (qua bộ kiểm của loại widget) và hệ số độ đục `opacity`.
 * Widget không có `animate` được trả nguyên (cùng tham chiếu).
 */
export function resolveAnimated(w: WidgetSpec, c: BindCtx, canvas: SceneDocument['canvas']): { widget: WidgetSpec; opacity: number; scale: number } {
  if (!w.animate) return { widget: w, opacity: 1, scale: 1 };
  const kinds = animatablePaths(w.type);
  let props = w.properties as Obj | null, layout = w.layout, opacity = 1, scale = 1, propsTouched = false;
  const { designWidth: dw, designHeight: dh } = canvas;
  for (const [path, a] of Object.entries(w.animate)) {
    const kind = kinds.get(path); if (!kind) continue;
    const v = animValue(a, kind, c, w, path, isExpr(a) ? baseValue(w, path) : 0);
    if (path === 'opacity') opacity = clamp01(Number(v));
    else if (path === 'scale') { const n = Number(v); if (Number.isFinite(n)) scale = Math.min(MAX_SCALE, Math.max(0, n)) / 100; }
    else if (path.startsWith('layout.')) {
      const f = path.slice(7) as 'x' | 'y' | 'width' | 'height' | 'rotation', n = Number(v);
      if (!Number.isFinite(n)) continue;
      const lim = f === 'x' ? [-dw, 2 * dw] : f === 'y' ? [-dh, 2 * dh] : f === 'width' ? [1, 4 * dw] : f === 'height' ? [1, 4 * dh] : [-360, 360];
      layout = { ...layout, [f]: f === 'rotation' ? normalizeAngle(Math.min(lim[1], Math.max(lim[0], n))) : Math.min(lim[1], Math.max(lim[0], n)) };
    } else if (props) { props = setIn(props, path.split('.'), v); propsTouched = true; }
  }
  let properties = w.properties;
  if (propsTouched && w.type === 'PIANO_ROLL') properties = cleanPiano(props as Obj, kinds) as never;
  else if (propsTouched) {
    const clean = sanitizeWidgetProps(w.type, props, silentSanitizer());
    if (clean) properties = clean as never;
  }
  return { widget: layout === w.layout && properties === w.properties ? w : { ...w, layout, properties }, opacity, scale };
}

/** Kẹp thuộc tính Piano Roll sau khi ghép giá trị animate (chỉ các đường dẫn PIANO_PATHS bị đổi; phần còn lại giữ nguyên). */
function cleanPiano(p: Obj, kinds: ReadonlyMap<string, AnimKind>): Obj {
  let out = p;
  for (const [path, [lo, hi]] of Object.entries(PIANO_NUM)) {
    const ks = path.split('.'); let v: unknown = out; for (const k of ks) v = isObj(v) ? v[k] : undefined;
    if (v !== undefined) out = setIn(out, ks, finite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
  }
  for (const [path, kind] of kinds) {
    if (!path.startsWith('keyboard.') && !path.startsWith('grid.') && path !== 'playheadColor' && path !== 'playheadVisible') continue;
    const ks = path.split('.'); let v: unknown = out; for (const k of ks) v = isObj(v) ? v[k] : undefined;
    if (kind === 'color' && !(typeof v === 'string' && HEX.test(v))) out = setIn(out, ks, '#ffffff');
    if (kind === 'bool' && typeof v !== 'boolean') out = setIn(out, ks, !!v);
  }
  const ns = isObj(out.noteStyle) ? out.noteStyle : {};
  if (isObj(ns.base)) {
    const base = { ...DEFAULT_NOTE_STYLE, ...ns.base } as Obj;
    for (const [path, ok] of Object.entries(CHOICE_OK)) { const k = path.split('.').pop()!; if (!ok.includes(base[k] as string)) base[k] = (DEFAULT_NOTE_STYLE as unknown as Obj)[k]; }
    if (typeof base.glowActiveOnly !== 'boolean') base.glowActiveOnly = !!base.glowActiveOnly;
    out = { ...out, noteStyle: { ...ns, base: sanitizeStyle(base as unknown as NoteStyle) } };
  }
  return out;
}
