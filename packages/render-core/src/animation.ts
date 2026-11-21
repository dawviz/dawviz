// Hoạt hình thuộc tính (T-22, CUSTOMIZATION §3.1 và §3.3): MỌI thuộc tính số hoặc màu của một widget có thể là giá trị tĩnh, keyframe theo thời gian,
// hoặc binding vào dữ liệu nhạc. `WidgetSpec.animate` ánh xạ đường dẫn thuộc tính → hoạt hình. Mỗi khung hình, giá trị tính ra được ghép vào bản sao của widget
// rồi đi lại qua đúng bộ kiểm của loại widget (kẹp về miền hợp lệ), nên renderer không bao giờ nhận giá trị sai. Thuần và tất định: hàm của (widget, t, AST).
//
// Đường dẫn: `layout.x|y|width|height|rotation`, `opacity` (0..1, nhân thêm độ đục cả widget), `scale` (%, 100 = nguyên cỡ; co giãn cả widget quanh điểm neo,
// như Scale của After Effects; không đổi khung bố cục), và mọi thuộc tính số hoặc màu `#rrggbb` có trong mặc định của loại
// widget (lồng được: `lines.played.x`…). Piano Roll chỉ nhận `layout.*` và `opacity`; Bản nhạc chỉ nhận `layout.*` và `opacity` (đổi thuộc tính bản nhạc phải dựng lại).
import { activeNotes, notesInRange, type TrackIndex } from './notes.ts';
import { barPosAt, hudOf, shown } from './hud.ts';
import { laneUnit } from './glow.ts';
import { frameAt, u8ToDb } from './audioFeatures.ts';
import { compileTrack, sampleTrack, mixColor, type CompiledTrack, type Key, type KeyTime, type LoopMode, type TrackSpec } from './keyframes.ts';
import { interpolate, parseEase, type EaseSpec } from './motion.ts';
import { normalizeAngle } from './snap.ts';
import { widgetDefaults, silentSanitizer, sanitizeWidgetProps, type Sanitizer, type SceneDocument, type WidgetSpec, type WidgetType } from './scene.ts';
import type { Derived } from './prims.ts';
import type { UnifiedProjectAST } from './types.ts';

export const BIND_SOURCES = ['beat.phase', 'bar.phase', 'progress', 'notes.count', 'notes.velocity', 'note.hit', 'track.volume', 'track.pan', 'audio.level'] as const;
export type BindSource = typeof BIND_SOURCES[number];
/** Giá trị = `to[0]` khi nguồn ở `from[0]`, `to[1]` khi ở `from[1]`, nội suy (kẹp ngoài biên) qua `ease`. `to` là hai số hoặc hai màu `#rrggbb`. */
export interface Binding { bind: BindSource; from: [number, number]; to: [number, number] | [string, string]; ease?: EaseSpec }
export type KeyAnimation = TrackSpec;
export type Animation = KeyAnimation | Binding;
export const isBinding = (a: Animation): a is Binding => 'bind' in a;
export const MAX_ANIMATIONS = 24, MAX_ANIM_KEYS = 256;
/** Giới hạn của `scale` (%): 0 (biến mất) tới 2000. */
export const MAX_SCALE = 2000;
const HEX = /^#[0-9a-f]{6}$/i;
const LAYOUT_PATHS = ['layout.x', 'layout.y', 'layout.width', 'layout.height', 'layout.rotation'] as const;
const FRAME_ONLY: ReadonlySet<string> = new Set(['PIANO_ROLL', 'NOTATION']);

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
function setIn(o: Obj, path: readonly string[], v: unknown): Obj {
  const [k, ...rest] = path;
  return { ...o, [k]: rest.length ? setIn(isObj(o[k]) ? (o[k] as Obj) : {}, rest, v) : v };
}
const leaves = (o: unknown, prefix: string[], out: Map<string, 'number' | 'color'>): void => {
  if (!isObj(o)) return;
  for (const [k, v] of Object.entries(o)) {
    const p = [...prefix, k];
    if (typeof v === 'number') out.set(p.join('.'), 'number'); else if (typeof v === 'string' && HEX.test(v)) out.set(p.join('.'), 'color'); else leaves(v, p, out);
  }
};
/** Các đường dẫn animate được của một loại widget và kiểu giá trị của chúng. */
export function animatablePaths(type: WidgetType): Map<string, 'number' | 'color'> {
  const out = new Map<string, 'number' | 'color'>();
  for (const p of LAYOUT_PATHS) out.set(p, 'number');
  out.set('opacity', 'number');
  out.set('scale', 'number');
  if (!FRAME_ONLY.has(type)) leaves(widgetDefaults(type), [], out);
  return out;
}

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
    const okVal = (x: unknown): boolean => (kind === 'number' ? finite(x) : typeof x === 'string' && HEX.test(x));
    if (Array.isArray(raw.keys)) {
      const keys: Key[] = [];
      raw.keys.slice(0, MAX_ANIM_KEYS).forEach((k, i) => {
        const at = isObj(k) ? cleanKeyTime(k.at) : null;
        if (!isObj(k) || !at || !okVal(k.value)) { S.warn(`${p}.keys[${i}]`, k, 'keyframe không hợp lệ; bỏ'); return; }
        const key: Key = { at, value: k.value as number | string };
        if (k.ease !== undefined) { if (parseEase(k.ease).ok) key.ease = k.ease as EaseSpec; else S.warn(`${p}.keys[${i}].ease`, k.ease, 'easing lạ; dùng linear'); }
        if (k.interp === 'hold' || k.interp === 'smooth' || k.interp === 'linear') key.interp = k.interp;
        keys.push(key);
      });
      if (raw.keys.length > MAX_ANIM_KEYS) S.warn(`${p}.keys`, raw.keys.length, `quá ${MAX_ANIM_KEYS} keyframe; cắt bớt`);
      if (!keys.length) { S.warn(p, raw, 'không có keyframe hợp lệ; bỏ'); continue; }
      const a: KeyAnimation = { keys, ...(kind === 'color' ? { kind: 'color' as const } : {}) };
      if (raw.loop === 'CYCLE' || raw.loop === 'PINGPONG' || raw.loop === 'OFFSET') a.loop = raw.loop as LoopMode;
      out[key] = a;
    } else if (typeof raw.bind === 'string') {
      const from = raw.from, to = raw.to;
      if (!(BIND_SOURCES as readonly string[]).includes(raw.bind)) { S.warn(`${p}.bind`, raw.bind, `không thuộc ${BIND_SOURCES.join('/')}; bỏ`); continue; }
      if (!Array.isArray(from) || from.length !== 2 || !from.every(finite) || from[0] === from[1]) { S.warn(`${p}.from`, from, 'cần hai số khác nhau; bỏ'); continue; }
      if (!Array.isArray(to) || to.length !== 2 || !to.every(okVal)) { S.warn(`${p}.to`, to, kind === 'color' ? 'cần hai màu #rrggbb; bỏ' : 'cần hai số; bỏ'); continue; }
      const b: Binding = { bind: raw.bind as BindSource, from: [from[0], from[1]], to: [to[0], to[1]] as Binding['to'] };
      if (raw.ease !== undefined) { if (parseEase(raw.ease).ok) b.ease = raw.ease as EaseSpec; else S.warn(`${p}.ease`, raw.ease, 'easing lạ; dùng linear'); }
      out[key] = b;
    } else S.warn(p, raw, 'cần `keys` hoặc `bind`; bỏ');
  }
  return Object.keys(out).length ? out : undefined;
}

// ───────────── tính giá trị mỗi khung ─────────────
export interface BindCtx { ast: UnifiedProjectAST; derived: Derived; tracks: TrackIndex[]; t: number }
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const HIT_DECAY = 0.6;
/** Giá trị thô của một nguồn dữ liệu nhạc tại t (thang riêng của từng nguồn; ánh xạ sang thuộc tính bằng `from`/`to`). */
export function bindSourceValue(src: BindSource, c: BindCtx): number {
  const { ast, derived, t } = c, list = shown(c.tracks);
  switch (src) {
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
}
const trackCache = new WeakMap<object, { tm: unknown; ct: CompiledTrack }>();
function animValue(a: Animation, kind: 'number' | 'color', c: BindCtx): number | string {
  if (isBinding(a)) {
    const k = interpolate(bindSourceValue(a.bind, c), a.from, [0, 1], { ease: a.ease });
    if (kind === 'color') return mixColor(a.to[0] as string, a.to[1] as string, k);
    return (a.to[0] as number) + ((a.to[1] as number) - (a.to[0] as number)) * k;
  }
  let hit = trackCache.get(a);
  if (!hit || hit.tm !== c.ast.tempoMap) { hit = { tm: c.ast.tempoMap, ct: compileTrack(a, { tempoMap: c.ast.tempoMap }) }; trackCache.set(a, hit); }
  return sampleTrack(hit.ct, c.t);
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
    const v = animValue(a, kind, c);
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
  if (propsTouched) {
    const clean = sanitizeWidgetProps(w.type, props, silentSanitizer());
    if (clean) properties = clean as never;
  }
  return { widget: layout === w.layout && properties === w.properties ? w : { ...w, layout, properties }, opacity, scale };
}
