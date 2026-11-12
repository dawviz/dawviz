// T-05: renderFrame + hợp đồng WidgetRenderer (Technical Design §5.1–5.2). Preview và Export gọi cùng hàm này,
// chỉ khác `target` và `scale` (SRS REQ-GRAPHICS-05). Không đọc đồng hồ, không trạng thái tăng dần: khung hình là hàm của t.
import type { Ctx2D } from './draw.ts';
import type { TimelineIndex, TrackIndex } from './notes.ts';
import type { BrightnessConfig } from './brightness.ts';
import type { UnifiedProjectAST } from './types.ts';
import { layoutPianoRoll, layoutKeyboard } from './pianoroll.ts';
import { DEFAULT_KEYBOARD_STYLE } from './style.ts';
import type { PianoRollProps, SceneDocument, WidgetSpec, WidgetType } from './scene.ts';

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

/** Dữ liệu dẫn xuất: tính một lần ngoài vòng vẽ (Technical Design §4). */
export interface Derived { index: TimelineIndex; brightness: Record<string, BrightnessConfig> }

/** Hình học thuần, đơn vị pt trong toạ độ widget. Đủ cho Piano Roll; widget sau thêm kiểu mới (text, path…). */
export type Primitive = RectPrim;
export interface RectPrim {
  kind: 'rect';
  x: number; y: number; w: number; h: number;
  fill: string; alpha: number;      // alpha đã gộp độ sáng × độ đục, 0..1
  radius: number;                   // 0 = góc vuông
  glowColor: string; glowBlur: number; // glowBlur 0 = không phát sáng
  stroke: string; strokeWidth: number; // strokeWidth 0 = không viền
}

export interface LayoutCtx { ast: UnifiedProjectAST; derived: Derived; tracks: TrackIndex[] }

export interface WidgetRenderer<P = unknown> {
  type: WidgetType;
  /** Thuần: cùng (ctx, spec, t) → cùng danh sách. Toạ độ pt, gốc ở góc trên trái widget. */
  layout(ctx: LayoutCtx, spec: WidgetSpec<P>, t: number): Primitive[];
}

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
export const WIDGET_RENDERERS: Partial<Record<WidgetType, WidgetRenderer<any>>> = { PIANO_ROLL: pianoRollRenderer };

/** Bố cục toàn khung (thuần): danh sách widget đã sắp theo zIndex kèm primitive của từng widget. Dùng để test tất định. */
export function layoutFrame(scene: SceneDocument, derived: Derived, ast: UnifiedProjectAST, t: number, renderers = WIDGET_RENDERERS) {
  const order = scene.widgets.map((w, i) => ({ w, i })).filter(({ w }) => w.visible && renderers[w.type])
    .sort((a, b) => a.w.zIndex - b.w.zIndex || a.i - b.i); // cùng zIndex: giữ thứ tự trong tài liệu
  return order.map(({ w }) => ({ widget: w, prims: renderers[w.type]!.layout({ ast, derived, tracks: tracksFor(w, derived.index) }, w, t) }));
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
    drawPrimitives(g, prims);
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
    g.globalAlpha = p.alpha; g.fillStyle = p.fill;
    if (p.glowBlur > 0) { g.shadowColor = p.glowColor; g.shadowBlur = p.glowBlur; }
    if (p.radius > 0) { roundedPath(g, p.x, p.y, p.w, p.h, p.radius); g.fill(); } else g.fillRect(p.x, p.y, p.w, p.h);
    g.shadowBlur = 0;
    if (p.strokeWidth > 0) { g.strokeStyle = p.stroke; g.lineWidth = p.strokeWidth; roundedPath(g, p.x, p.y, p.w, p.h, p.radius); g.stroke(); }
  }
  g.globalAlpha = 1;
}
