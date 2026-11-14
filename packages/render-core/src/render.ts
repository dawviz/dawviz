// T-05: renderFrame + hợp đồng WidgetRenderer (Technical Design §5.1–5.2). Preview và Export gọi cùng hàm này,
// chỉ khác `target` và `scale` (SRS REQ-GRAPHICS-05). Không đọc đồng hồ, không trạng thái tăng dần: khung hình là hàm của t.
import type { Ctx2D } from './draw.ts';
import type { TimelineIndex, TrackIndex } from './notes.ts';
import type { UnifiedProjectAST } from './types.ts';
import { layoutPianoRoll, layoutKeyboard } from './pianoroll.ts';
import { DEFAULT_KEYBOARD_STYLE } from './style.ts';
import type { PianoRollProps, SceneDocument, WidgetSpec } from './scene.ts';
import type { Derived, Primitive, RectPrim, TextPrim, WidgetRenderer } from './prims.ts';
import { HUD_RENDERERS, buildHud, type ChordProps, type HudData } from './hud.ts';
import { measureText } from './text.ts';
import { DEFAULT_TEXT_STYLES, TEXT_METRICS, type PlacedRun, type RichText, type TextGradient } from './typography.ts';
import { normalizeAngle } from './snap.ts';

/** Ngữ cảnh vẽ đủ cho renderFrame (Canvas 2D và OffscreenCanvas đều có). */
export interface RenderCtx extends Ctx2D {
  save(): void; restore(): void;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  translate(x: number, y: number): void;
  rotate(rad: number): void;
  rect(x: number, y: number, w: number, h: number): void;
  clip(): void;
  // Chữ tự vẽ (T-72): tỉ lệ/nghiêng run, viền, gradient, đổ bóng.
  scale(x: number, y: number): void;
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  strokeText(text: string, x: number, y: number): void;
  lineJoin: string; shadowOffsetX: number; shadowOffsetY: number;
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradientLike;
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradientLike;
}
export interface CanvasGradientLike { addColorStop(offset: number, color: string): void }
/** Phép biến đổi đang áp khi vẽ một widget: cần cho đổ bóng chữ, vì shadowOffset/shadowBlur của Canvas tính theo điểm ảnh thiết bị, không theo transform. */
export interface DrawEnv { scale: number; rotation: number }
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

/**
 * Hình học trục thời gian của Piano Roll (T-71). Tỉ lệ thời gian cố định: pt/giây = width / visibleSeconds, KHÔNG đổi theo
 * vị trí vạch phát hay bàn phím (đổi vị trí vạch chỉ dời mốc "bây giờ", nốt giữ nguyên độ dài). Bật bàn phím: vạch phát ở
 * mép phải bàn phím, `playheadPositionRatio` không có tác dụng (giao diện khoá ô đó); nốt đã phát trượt xuống dưới bàn phím.
 * Trả `windowSeconds`/`ratio` theo vùng cuộn nốt [kb, width] để đưa thẳng vào layoutPianoRoll.
 */
export function pianoRollGeometry(p: Pick<PianoRollProps, 'keyboard' | 'playheadPositionRatio' | 'visibleSeconds'>, width: number) {
  const kb = p.keyboard.enabled ? Math.min(p.keyboard.width, width * 0.4) : 0;
  const pxPerSec = width / p.visibleSeconds;
  const playX = kb > 0 ? kb : width * p.playheadPositionRatio;
  const area = width - kb;
  return { kb, playX, pxPerSec, ratio: area > 0 ? (playX - kb) / area : 0, windowSeconds: area / pxPerSec };
}

export const pianoRollRenderer: WidgetRenderer<PianoRollProps> = {
  type: 'PIANO_ROLL',
  layout({ ast, derived, tracks }, spec, t) {
    const p = spec.properties, { width, height } = spec.layout;
    const [pitchMin, pitchMax] = pianoRollPitchRange(p, tracks);
    const { kb, ratio, playX, windowSeconds } = pianoRollGeometry(p, width);
    const rects = layoutPianoRoll({ tracks, duration: derived.index.duration }, ast.tempoMap, t,
      { width, height, windowSeconds, playheadRatio: ratio, pitchMin, pitchMax, brightness: derived.brightness, style: p.noteStyle, left: kb });
    const out: Primitive[] = [];
    for (const r of rects) {
      const alpha = a01(r.brightness * r.opacity);
      if (alpha <= 0.004) continue;
      out.push({ kind: 'rect', x: r.x, y: r.y, w: r.w, h: r.h, fill: r.color, alpha: Math.max(0.05, alpha), radius: r.radius > 0.5 ? r.radius : 0,
        glowColor: r.color, glowBlur: r.glow > 0 && r.glowRadius > 0 ? r.glowRadius * r.glow * (0.4 + 0.6 * r.brightness) : 0,
        stroke: r.borderColor, strokeWidth: r.borderWidth });
    }
    if (p.playheadVisible && p.playheadWidth > 0) out.push(rect(playX - p.playheadWidth / 2, 0, p.playheadWidth, height, p.playheadColor));
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
  buildHud(ast, index, scene.widgets.filter((w) => w.type === 'CHORD_DETECTION')
    .map((w) => ({ tracks: tracksFor(w, index), mode: (w.properties as ChordProps).mode ?? 'sustained' })));
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
  const measure = derived.measure ?? measureText, textStyles = scene.textStyles ?? DEFAULT_TEXT_STYLES;
  return order.map(({ w }) => ({ widget: w, prims: renderers[w.type]!.layout({ ast, derived, tracks: tracksFor(w, derived.index), measure, textStyles, fonts: derived.fonts }, w, t) }));
}

/**
 * Vẽ một khung hình. `scale` = điểm ảnh đích / pt (Preview: bề rộng canvas × DPR / designWidth; Export: W_export / designWidth).
 * (1) nền; (2) widget theo zIndex, mỗi widget cắt theo khung của nó (đã xoay quanh điểm neo, REQ-GRAPHICS-03); (3) primitive.
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
    const rot = normalizeAngle(L.rotation);
    if (rot === 0) g.translate(L.x, L.y); // góc 0: đúng chuỗi lệnh trước T-68
    else { // dời tới điểm neo, xoay (chiều kim đồng hồ, trục y xuống), dời ngược: toạ độ trong widget giữ nguyên, không co nội dung
      const ax = L.anchor.x * L.width, ay = L.anchor.y * L.height;
      g.translate(L.x + ax, L.y + ay); g.rotate(rot * Math.PI / 180); g.translate(-ax, -ay);
    }
    g.beginPath(); g.rect(0, 0, L.width, L.height); g.clip();
    drawPrimitives(g, derived.fontsReady === false ? prims.filter((p) => p.kind !== 'text') : prims, { scale, rotation: rot }); // phông chưa nạp: không vẽ chữ (TECHNICAL-DESIGN 5.7)
    g.restore();
  }
}

function roundedPath(g: Ctx2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/** Chỉ vẽ, không tính nghiệp vụ. Mọi trạng thái ctx bị đổi (alpha, shadow) được trả về mặc định sau mỗi hình. */
export function drawPrimitives(g: RenderCtx, prims: Primitive[], env: DrawEnv = { scale: 1, rotation: 0 }): void {
  for (const p of prims) {
    if (p.kind === 'text') { if (p.rich) drawRichText(g, p, p.rich, env); else drawText(g, p); continue; }
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

// ───────────────────────────── chữ tự vẽ (T-72, REQ-GRAPHICS-18) ─────────────────────────────
// Vị trí từng run/cụm ký tự đã tính ở layout bằng bảng đo, nên mọi trình duyệt đặt chữ như nhau. Không dùng letterSpacing,
// fontVariantNumeric hay italic tổng hợp của trình duyệt: tracking/chữ số đều bề rộng là vị trí đã dàn, nghiêng là phép xiên.
const FAR = 1e5; // bản sao chữ cho bóng nằm ngoài vùng cắt của widget; chỉ bóng của nó rơi vào khung
const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.min(1, Math.max(0, a))})`;
};
function drawRichText(g: RenderCtx, p: TextPrim, r: RichText, env: DrawEnv): void {
  const alpha = p.alpha * r.opacity;
  if (!(alpha > 0.004)) return;
  const top = p.y - r.ascent, h = r.ascent + r.descent;
  g.shadowBlur = 0;
  const bg = r.background;
  if (bg.enabled && bg.opacity > 0) {
    const bx = r.left - bg.padX, by = top - bg.padY, bw = r.width + 2 * bg.padX, bh = h + 2 * bg.padY;
    g.globalAlpha = alpha * bg.opacity; g.fillStyle = bg.color;
    if (bg.radius > 0) { roundedPath(g, bx, by, bw, bh, Math.min(bg.radius, bw / 2, bh / 2)); g.fill(); } else g.fillRect(bx, by, bw, bh);
  }
  g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fontKerning = 'none'; g.textRendering = 'geometricPrecision';
  const sh = r.shadow;
  if (sh.enabled && sh.opacity > 0) {
    const rot = env.rotation * Math.PI / 180, a = sh.angle * Math.PI / 180;
    const lx = Math.cos(a) * sh.distance - FAR, ly = Math.sin(a) * sh.distance; // dời bản sao về vị trí bóng, quy ra điểm ảnh thiết bị
    g.globalAlpha = alpha; g.shadowColor = rgba(sh.color, sh.opacity); g.shadowBlur = sh.blur * env.scale;
    g.shadowOffsetX = env.scale * (lx * Math.cos(rot) - ly * Math.sin(rot)); g.shadowOffsetY = env.scale * (lx * Math.sin(rot) + ly * Math.cos(rot));
    for (const run of r.runs) paintRun(g, p, r, run, FAR, true);
    g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0; g.shadowColor = 'rgba(0,0,0,0)';
  }
  g.globalAlpha = alpha;
  for (const run of r.runs) paintRun(g, p, r, run, 0, false);
}
/** Gradient trên hộp cả dòng, đổi sang toạ độ riêng của run (đã dời tới baseline và co theo tỉ lệ ngang/dọc). */
function runGradient(g: RenderCtx, r: RichText, baseY: number, grad: TextGradient, x0: number, y0: number, sx: number, sy: number) {
  const L = (X: number) => (X - x0) / sx, T = (Y: number) => (Y - y0) / sy;
  const top = baseY - r.ascent, w = r.width, h = r.ascent + r.descent, cx = r.left + w / 2, cy = top + h / 2;
  let gr: CanvasGradientLike;
  if (grad.kind === 'radial') gr = g.createRadialGradient(L(cx), T(cy), 0, L(cx), T(cy), Math.hypot(w, h) / 2 / Math.max(sx, sy));
  else {
    const a = grad.angle * Math.PI / 180, dx = Math.cos(a), dy = Math.sin(a), half = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
    gr = g.createLinearGradient(L(cx - dx * half), T(cy - dy * half), L(cx + dx * half), T(cy + dy * half));
  }
  for (const s of grad.stops) gr.addColorStop(s.at, s.color);
  return gr;
}
function paintRun(g: RenderCtx, p: TextPrim, r: RichText, run: PlacedRun, offX: number, shadow: boolean): void {
  const M = TEXT_METRICS, x0 = r.left + run.dx + offX, y0 = p.y - run.shift;
  const sx = run.scaleX, sy = run.scaleY;
  const fill = shadow ? '#000000' : run.gradient ? runGradient(g, r, p.y, run.gradient, x0, y0, sx, sy) : run.color;
  g.save(); g.translate(x0, y0);
  if (sx !== 1 || sy !== 1) g.scale(sx, sy);
  if (run.italic) g.transform(1, 0, -M.italicSkew, 1, 0, 0); // nghiêng giả, giống nhau mọi trình duyệt (phông đóng gói không có mặt nghiêng)
  g.font = `${run.weight} ${run.size}px "${run.font}", sans-serif`;
  const glyphs: [string, number][] = run.clusters && run.xs ? run.clusters.map((c, i) => [c, run.xs![i] / sx]) : [[run.text, 0]];
  const st = run.stroke, outside = st.position === 'outside';
  const stroke = () => {
    g.lineWidth = outside ? 2 * st.width : st.width; g.lineJoin = st.join; g.strokeStyle = shadow ? '#000000' : st.color;
    for (const [c, x] of glyphs) g.strokeText(c, x, 0);
  };
  const doFill = () => { g.fillStyle = fill; for (const [c, x] of glyphs) g.fillText(c, x, 0); };
  if (st.width > 0 && (!st.over || outside)) { stroke(); doFill(); }
  else { doFill(); if (st.width > 0) stroke(); }
  g.restore();
  if (run.underline || run.strike) { // gạch tự vẽ: không xiên theo chữ nghiêng, dài đúng bề rộng run
    const th = run.decoThickness > 0 ? run.decoThickness : Math.max(0.5, run.size * M.decoThickness * sy);
    g.fillStyle = shadow ? '#000000' : run.decoColor || fill as string;
    if (!shadow && !run.decoColor && run.gradient) g.fillStyle = runGradient(g, r, p.y, run.gradient, 0, 0, 1, 1);
    if (run.underline) g.fillRect(x0, y0 + run.size * M.underline * sy - th / 2, run.width, th);
    if (run.strike) g.fillRect(x0, y0 - run.size * M.strike * sy - th / 2, run.width, th);
  }
}
