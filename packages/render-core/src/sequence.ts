// Chuỗi cảnh (T-110, D-66): một dự án dùng nhiều preset scene ở các mốc thời gian khác nhau. Mốc nằm ở MANIFEST của dự án, không nằm trong preset.
// Mô hình lúc chạy: mỗi khung chọn các "cue" đang hiện, đổi scene của cue sang thời gian cục bộ (mốc giây của keyframe và khoảng hiển thị
// tính từ lúc cue bắt đầu) và vẽ chồng theo thứ tự, mỗi cue một độ đục (hiện dần/ẩn dần ở biên). Dữ liệu nhạc (nốt, nhịp, hợp âm) VẪN theo
// `t` toàn bài: chỉ phần dàn dựng của preset dùng thời gian cục bộ. Hàm thuần, tất định theo (manifest, scene, t).
import { renderFrame, type RenderTarget, type WidgetRenderer } from './render.ts';
import { WIDGET_RENDERERS } from './render.ts';
import { visibilityAlpha } from './visibility.ts';
import { isKeyAnim } from './animation.ts';
import type { Derived } from './prims.ts';
import type { SceneDocument, WidgetSpec } from './scene.ts';
import type { UnifiedProjectAST } from './types.ts';

export const SEQUENCE_VERSION = 1;
export const MAX_CUES = 64, MAX_CUE_ID = 60, MAX_FADE_SEC = 30;
/** Một đoạn của chuỗi: preset `scene` (khoá trong thư viện preset của dự án) hiện từ `from` tới `to` (giây; null = tới hết bài). */
export interface SceneCue { id: string; scene: string; from: number; to: number | null; fadeIn: number; fadeOut: number }
/** Manifest đi cùng dự án. `global` = scene luôn bật suốt bài, vẽ trên cùng (vd. chữ hợp âm, thanh tiến độ). */
export interface SequenceManifest { version: number; cues: SceneCue[]; global?: string }
export interface SequenceWarning { code: 'WARN_SEQUENCE_VALUE'; path: string; message: string }

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Đọc manifest từ JSON không tin cậy: mục sai bị bỏ kèm cảnh báo, số kẹp vào miền, cue sắp theo `from`, id trùng bị bỏ. */
export function sanitizeManifest(raw: unknown): { manifest: SequenceManifest; warnings: SequenceWarning[] } {
  const warnings: SequenceWarning[] = [];
  const warn = (path: string, message: string) => warnings.push({ code: 'WARN_SEQUENCE_VALUE', path, message });
  const out: SequenceManifest = { version: SEQUENCE_VERSION, cues: [] };
  if (!isObj(raw)) { if (raw !== undefined) warn('$', 'manifest không phải đối tượng'); return { manifest: out, warnings }; }
  if (typeof raw.global === 'string' && raw.global && raw.global.length <= MAX_CUE_ID) out.global = raw.global;
  else if (raw.global !== undefined) warn('$.global', 'phải là khoá scene (chuỗi 1–60 ký tự)');
  const list = Array.isArray(raw.cues) ? raw.cues : (raw.cues !== undefined && warn('$.cues', 'phải là mảng'), []);
  const seen = new Set<string>();
  list.slice(0, MAX_CUES).forEach((c, i) => {
    const p = `$.cues[${i}]`;
    if (!isObj(c)) return warn(p, 'bỏ: không phải đối tượng');
    const id = typeof c.id === 'string' ? c.id.trim() : '';
    if (!id || id.length > MAX_CUE_ID || id.includes('/')) return warn(`${p}.id`, 'bỏ: id rỗng, quá 60 ký tự hoặc chứa "/"');
    if (seen.has(id)) return warn(`${p}.id`, `bỏ: id "${id}" trùng`);
    if (typeof c.scene !== 'string' || !c.scene || c.scene.length > MAX_CUE_ID) return warn(`${p}.scene`, 'bỏ: thiếu khoá scene');
    if (!finite(c.from) || c.from < 0) return warn(`${p}.from`, 'bỏ: mốc bắt đầu phải là số giây ≥ 0');
    let to: number | null = null;
    if (c.to !== null && c.to !== undefined) {
      if (!finite(c.to) || c.to <= c.from) return warn(`${p}.to`, 'bỏ: mốc kết thúc phải > mốc bắt đầu (hoặc null = hết bài)');
      to = c.to;
    }
    const fade = (v: unknown, path: string) => { if (v === undefined) return 0; if (!finite(v) || v < 0) { warn(path, 'dùng 0: thời gian mờ phải ≥ 0'); return 0; } if (v > MAX_FADE_SEC) warn(path, `kẹp về ${MAX_FADE_SEC}`); return Math.min(MAX_FADE_SEC, v); };
    seen.add(id);
    out.cues.push({ id, scene: c.scene, from: c.from, to, fadeIn: fade(c.fadeIn, `${p}.fadeIn`), fadeOut: fade(c.fadeOut, `${p}.fadeOut`) });
  });
  if (list.length > MAX_CUES) warn('$.cues', `bỏ các mục sau mục ${MAX_CUES}`);
  out.cues.sort((a, b) => a.from - b.from); // sắp ổn định: cùng mốc giữ thứ tự gốc
  return { manifest: out, warnings };
}

/** Độ đục của cue tại `t` (0 = không hiện): trong [from, to) có hiện dần/ẩn dần ở hai biên (cùng đường cong `visibilityAlpha`). */
export function cueAlpha(c: SceneCue, t: number, duration: number): number {
  return visibilityAlpha({ ranges: [{ from: c.from, to: c.to }], fadeIn: c.fadeIn, fadeOut: c.fadeOut }, t, duration);
}
/** Các cue đang hiện tại `t`, theo thứ tự vẽ (cue sau vẽ đè cue trước). */
export function activeCues(m: SequenceManifest, t: number, duration: number): { cue: SceneCue; alpha: number }[] {
  const out: { cue: SceneCue; alpha: number }[] = [];
  for (const cue of m.cues) { const alpha = cueAlpha(cue, t, duration); if (alpha > 0) out.push({ cue, alpha }); }
  return out;
}

// ───── scene → thời gian cục bộ của cue ─────
const memo = new WeakMap<SceneDocument, Map<string, SceneDocument>>();
/** Tiền tố id widget của một cue: các cue dùng cùng một scene không đụng id (Bản nhạc dựng theo id widget). */
export const cueWidgetId = (cueId: string, widgetId: string): string => `${cueId}/${widgetId}`;

/**
 * Bản sao của `scene` đặt ở cue `cue`: id widget (và `parent`) có tiền tố cue; keyframe mốc `sec` và khoảng hiển thị của widget lùi theo `cue.from`
 * (giây 0 của preset = lúc cue bắt đầu; khoảng "tới hết bài" thành tới hết cue); phase dời theo. Mốc nhạc (beat/bar/tick), biểu thức và binding giữ theo
 * thời gian toàn bài. Bản đệm theo (scene, cue.id, from, to): cùng cue luôn trả cùng đối tượng (đệm HUD theo scene).
 */
export function cueScene(scene: SceneDocument, cue: SceneCue): SceneDocument {
  let m = memo.get(scene); if (!m) memo.set(scene, m = new Map());
  const key = `${cue.id}|${cue.from}|${cue.to}`;
  const hit = m.get(key); if (hit) return hit;
  const f = cue.from, end = cue.to;
  const widgets = scene.widgets.map((w): WidgetSpec => {
    const nw: WidgetSpec = { ...w, id: cueWidgetId(cue.id, w.id) };
    if (w.parent) nw.parent = cueWidgetId(cue.id, w.parent);
    if (w.animate) {
      const an: NonNullable<WidgetSpec['animate']> = {};
      for (const [path, a] of Object.entries(w.animate)) an[path] = isKeyAnim(a) ? { ...a, keys: a.keys.map((k) => ('sec' in k.at ? { ...k, at: { sec: k.at.sec + f } } : k)) } : a;
      nw.animate = an;
    }
    if (w.visibility) nw.visibility = { ...w.visibility, ranges: w.visibility.ranges.map((r) => ({ from: r.from + f, to: r.to === null ? end : r.to + f })) };
    return nw;
  });
  const out: SceneDocument = { ...scene, widgets, ...(scene.phases ? { phases: scene.phases.map((p) => ({ ...p, start: p.start + f })) } : {}) };
  m.set(key, out); return out;
}

export interface SequenceSource {
  /** Scene của một khoá preset; undefined = thiếu (cue đó bị bỏ qua). */
  scene(key: string): SceneDocument | undefined;
  /** Dữ liệu dẫn xuất của một scene đã đặt ở cue (Bản nhạc dựng theo id có tiền tố cue). */
  derived(scene: SceneDocument, cue: SceneCue | null): Derived;
}
/** Các scene cần vẽ ở `t`, theo thứ tự: cue theo `from`, rồi scene chung (trên cùng). Cue có scene khác khung thiết kế với scene đầu tiên bị bỏ. */
export function sequenceLayers(m: SequenceManifest, src: SequenceSource, t: number, duration: number): { scene: SceneDocument; cue: SceneCue | null; alpha: number }[] {
  const out: { scene: SceneDocument; cue: SceneCue | null; alpha: number }[] = [];
  for (const { cue, alpha } of activeCues(m, t, duration)) { const s = src.scene(cue.scene); if (s) out.push({ scene: cueScene(s, cue), cue, alpha }); }
  const g = m.global ? src.scene(m.global) : undefined;
  if (g) out.push({ scene: g, cue: null, alpha: 1 });
  const first = out[0]?.scene.canvas;
  return first ? out.filter((l) => l.scene.canvas.designWidth === first.designWidth && l.scene.canvas.designHeight === first.designHeight) : out;
}

/** Vẽ một khung của chuỗi cảnh. Không có cue nào hiện và không có scene chung: tô `fallback` (nền của scene đó) cho khung không bị trống. */
export function renderSequenceFrame(m: SequenceManifest, src: SequenceSource, fallback: SceneDocument, ast: UnifiedProjectAST, t: number, target: RenderTarget, scale: number,
  renderers: Partial<Record<WidgetSpec['type'], WidgetRenderer<any>>> = WIDGET_RENDERERS): void {
  const layers = sequenceLayers(m, src, t, src.derived(fallback, null).index.duration);
  if (!layers.length) { renderFrame(fallback, src.derived(fallback, null), ast, t, target, scale, renderers, { transparent: false, layers: new Set() }); return; }
  layers.forEach((l, i) => renderFrame(l.scene, src.derived(l.scene, l.cue), ast, t, target, scale, renderers, { alpha: l.alpha, noClear: i > 0, transparent: i > 0 && l.cue === null }));
}
