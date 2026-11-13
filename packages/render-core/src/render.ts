// T-05: renderFrame + hợp đồng WidgetRenderer (Technical Design §5.1–5.2). Preview và Export gọi cùng hàm này,
// chỉ khác `target` và `scale` (SRS REQ-GRAPHICS-05). Không đọc đồng hồ, không trạng thái tăng dần: khung hình là hàm của t.
import type { Ctx2D } from './draw.ts';
import type { TimelineIndex, TrackIndex } from './notes.ts';
import type { UnifiedProjectAST } from './types.ts';
import { layoutPianoRoll, layoutKeyboard } from './pianoroll.ts';
import { DEFAULT_KEYBOARD_STYLE } from './style.ts';
import type { PianoRollProps, SceneDocument, WidgetSpec } from './scene.ts';
import type { Derived, Primitive, RectPrim, TextPrim, WidgetRenderer } from './prims.ts';
import { HUD_RENDERERS, buildHud, type HudData } from './hud.ts';
import { measureText } from './text.ts';

/** Ngữ cảnh vẽ đủ cho renderFrame (Canvas 2D và OffscreenCanvas đều có). */
export interface RenderCtx extends Ctx2D {
  save(): void; restore(): void;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  translate(x: number, y: number): void;
  rect(x: number, y: number, w: number, h: number): void;
  clip(): void;
}
/** `width`/`height` theo điểm ảnh thật của đích vẽ. */
export interface RenderTarget { ctx: RenderCtx; width: number; height: number }

export type { Derived, RectPrim, TextPrim, Primitive, LayoutCtx, WidgetRenderer } from './prims.ts';

/** Chọn track cho widget theo trackMappingMode (SRS REQ-STORAGE-02). */
export function tracksFor(spec: WidgetSpec<unknown>, index: TimelineIndex): TrackIndex[] {
  if (spec.trackMappingMode === 'MANUAL') {
    const want = new Set(spec.assignedTrackIndices);
    return index.tracks.filter((ti) => want.has(ti.track.index));
  }
  if (spec.trackMappingMode === 'AUTO_ASSIGN_FIRST_MELODIC') {
    // Tạm: track hiện đầu tiên có nốt. Loại track trống (drum) cần nhận diện kênh 10 / tên: làm cùng P-09 (T-41).
    const first = index.tracks.find((ti) => ti.track.isVisible && ti.notes.length > 0);
    return first ? [first] : [];
  }
  return index.tracks;
}

/** Tầm cao độ của Piano Roll: FIT_CONTENT lấy min/max của track được gán (±1), rỗng thì C3–C6. */
export function pianoRollPitchRange(p: PianoRollProps, tracks: TrackIndex[]): [number, number] {
  if (p.pitchRangeMode === 'CUSTOM') return [p.pitchMin, p.pitchMax];
  let lo = 127, hi = 0;
  for (const ti of tracks) if (ti.track.isVisible && ti.notes.length) { lo = Math.min(lo, ti.track.pitchRange.min); hi = Math.max(hi, ti.track.pitchRange.max); }
  return lo > hi ? [48, 84] : [Math.max(0, lo - 1), Math.min(127, hi + 1)];
}

const a01 = (v: number) => Math.min(1, Math.max(0, v));

export const pianoRollRenderer: WidgetRenderer<PianoRollProps> = {
  type: 'PIANO_ROLL',
  layout({ ast, derived, tracks }, spec, t) {
    const p = spec.properties, { width, height } = spec.layout;
    const [pitchMin, pitchMax] = pianoRollPitchRange(p, tracks);
    const kb = p.keyboard.enabled ? Math.min(p.keyboard.width, width * 0.4) : 0;
    // cửa sổ nhìn: lookahead là phần nằm SAU playhead → window = lookahead / (1 − ratio)
    const windowSeconds = p.lookaheadSeconds / (1 - p.playheadPositionRatio);
    const rects = layoutPianoRoll({ tracks, duration: derived.index.duration }, ast.tempoMap, t,
      { width, height, windowSeconds, playheadRatio: p.playheadPositionRatio, pitchMin, pitchMax, brightness: derived.brightness, style: p.noteStyle, left: kb });
    const out: Primitive[] = [];
    for (const r of rects) {
      const alpha = a01(r.brightness * r.opacity);
      if (alpha <= 0.004) continue;
      out.push({ kind: 'rect', x: r.x, y: r.y, w: r.w, h: r.h, fill: r.color, alpha: Math.max(0.05, alpha), radius: r.radius > 0.5 ? r.radius : 0,
        glowColor: r.color, glowBlur: r.glow > 0 && r.glowRadius > 0 ? r.glowRadius * r.glow * (0.4 + 0.6 * r.brightness) : 0,
        stroke: r.borderColor, strokeWidth: r.borderWidth });
    }
    const playX = kb + (width - kb) * p.playheadPositionRatio;
    if (p.playheadWidth > 0) out.push(rect(playX - p.playheadWidth / 2, 0, p.playheadWidth, height, p.playheadColor));
    if (kb > 0) {
      const ks = { ...DEFAULT_KEYBOARD_STYLE, ...p.keyboard, width: kb };
      const keys = layoutKeyboard({ tracks, duration: derived.index.duration }, t, { height, pitchMin, pitchMax, style: ks, noteStyle: p.noteStyle });
      for (const k of keys) {
        if (k.black) out.push(rect(0, k.y, kb, k.h, ks.whiteColor)); // hàng phím đen: nền trắng cả hàng rồi phím đen ngắn đè lên
        out.push(rect(k.x, k.y, k.w, k.h, k.color));
      }
      out.push(rect(kb - 1, 0, 1, height, '#0c0e16'));
    }
    return out;
  },
};
const rect = (x: number, y: number, w: number, h: number, fill: string): RectPrim => ({ kind: 'rect', x, y, w, h, fill, alpha: 1, radius: 0, glowColor: '', glowBlur: 0, stroke: '', strokeWidth: 0 });

/** Bảng renderer theo loại. Widget chưa có renderer được bỏ qua khi vẽ (vẫn giữ trong Scene). */
export const WIDGET_RENDERERS: Partial<Record<WidgetSpec['type'], WidgetRenderer<any>>> = { PIANO_ROLL: pianoRollRenderer, ...HUD_RENDERERS };

/** Bố cục toàn khung (thuần): danh sách widget đã sắp theo zIndex kèm primitive của từng widget. Dùng để test tất định. */
/** HudData cho một scene: số đếm, lưới ô nhịp và hợp âm của mọi widget Chord Detection. Gọi ở bước derived (một lần cho mỗi dự án × scene). */
export const buildSceneHud = (scene: SceneDocument, ast: UnifiedProjectAST, index: TimelineIndex): HudData =>
  buildHud(ast, index, scene.widgets.filter((w) => w.type === 'CHORD_DETECTION').map((w) => tracksFor(w, index)));
const hudMemo = new WeakMap<Derived, WeakMap<SceneDocument, HudData>>();
/** Derived có hud: dùng cái đã dựng; thiếu (gọi trực tiếp, kiểm thử) thì dựng một lần cho (derived, scene) rồi đệm. */
function withHud(scene: SceneDocument, derived: Derived, ast: UnifiedProjectAST): Derived {
  if (derived.hud) return derived;
  let m = hudMemo.get(derived); if (!m) hudMemo.set(derived, m = new WeakMap());
  let h = m.get(scene); if (!h) m.set(scene, h = buildSceneHud(scene, ast, derived.index));
  return { ...derived, hud: h };
}
export function layoutFrame(scene: SceneDocument, derived0: Derived, ast: UnifiedProjectAST, t: number, renderers = WIDGET_RENDERERS) {
  const derived = withHud(scene, derived0, ast);
  const order = scene.widgets.map((w, i) => ({ w, i })).filter(({ w }) => w.visible && renderers[w.type])
    .sort((a, b) => a.w.zIndex - b.w.zIndex || a.i - b.i); // cùng zIndex: giữ thứ tự trong tài liệu
  const measure = derived.measure ?? measureText;
  return order.map(({ w }) => ({ widget: w, prims: renderers[w.type]!.layout({ ast, derived, tracks: tracksFor(w, derived.index), measure }, w, t) }));
}

/**
 * Vẽ một khung hình. `scale` = điểm ảnh đích / pt (Preview: bề rộng canvas × DPR / designWidth; Export: W_export / designWidth).
 * (1) nền; (2) widget theo zIndex, mỗi widget cắt theo khung của nó; (3) primitive.
 */
export function renderFrame(scene: SceneDocument, derived: Derived, ast: UnifiedProjectAST, t: number, target: RenderTarget, scale: number, renderers = WIDGET_RENDERERS): void {
  const g = target.ctx, { designWidth: W, designHeight: H } = scene.canvas;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1; g.shadowBlur = 0;
  g.clearRect(0, 0, target.width, target.height);
  g.setTransform(scale, 0, 0, scale, 0, 0);
  g.fillStyle = scene.canvas.backgroundColor; g.fillRect(0, 0, W, H);
  for (const { widget, prims } of layoutFrame(scene, derived, ast, t, renderers)) {
    const L = widget.layout;
    g.save();
    g.translate(L.x, L.y);
    g.beginPath(); g.rect(0, 0, L.width, L.height); g.clip();
    drawPrimitives(g, derived.fontsReady === false ? prims.filter((p) => p.kind !== 'text') : prims); // phông chưa nạp: không vẽ chữ (TECHNICAL-DESIGN 5.7)
    g.restore();
  }
}

function roundedPath(g: Ctx2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/** Chỉ vẽ, không tính nghiệp vụ. Mọi trạng thái ctx bị đổi (alpha, shadow) được trả về mặc định sau mỗi hình. */
export function drawPrimitives(g: Ctx2D, prims: Primitive[]): void {
  for (const p of prims) {
    if (p.kind === 'text') { drawText(g, p); continue; }
    g.globalAlpha = p.alpha; g.fillStyle = p.fill;
    if (p.glowBlur > 0) { g.shadowColor = p.glowColor; g.shadowBlur = p.glowBlur; }
    if (p.radius > 0) { roundedPath(g, p.x, p.y, p.w, p.h, p.radius); g.fill(); } else g.fillRect(p.x, p.y, p.w, p.h);
    g.shadowBlur = 0;
    if (p.strokeWidth > 0) { g.strokeStyle = p.stroke; g.lineWidth = p.strokeWidth; roundedPath(g, p.x, p.y, p.w, p.h, p.radius); g.stroke(); }
  }
  g.globalAlpha = 1;
}

/** Chữ: baseline chữ cái, không kerning, textRendering geometricPrecision (đo bằng FONT_METRICS không có cặp kerning). maxWidth truyền cho fillText để không bao giờ tràn khung. */
function drawText(g: Ctx2D, p: TextPrim): void {
  g.globalAlpha = p.alpha; g.fillStyle = p.color; g.shadowBlur = 0;
  g.font = `${p.weight} ${p.size}px "${p.font}", sans-serif`;
  g.textAlign = p.align; g.textBaseline = 'alphabetic'; g.fontKerning = 'none'; g.textRendering = 'geometricPrecision'; // không kerning, không làm tròn advance: khớp bảng đo
  if (p.maxWidth !== undefined) g.fillText(p.text, p.x, p.y, p.maxWidth); else g.fillText(p.text, p.x, p.y);
}
