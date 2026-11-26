// T-05: renderFrame + hợp đồng WidgetRenderer (Technical Design §5.1–5.2). Preview và Export gọi cùng hàm này,
// chỉ khác `target` và `scale` (SRS REQ-GRAPHICS-05). Không đọc đồng hồ, không trạng thái tăng dần: khung hình là hàm của t.
import type { Ctx2D } from './draw.ts';
import type { TimelineIndex, TrackIndex } from './notes.ts';
import type { UnifiedProjectAST } from './types.ts';
import { layoutPianoRoll, layoutKeyboard, flowFrame, flowPoint, flowRect, flowLabel, type FlowFrame, type KeyRect } from './pianoroll.ts';
import { notesInRange } from './notes.ts';
import { keyAt } from './insight.ts';
import { DEFAULT_NAMING, noteNameFor, pitchClassNameFor, type NoteNaming } from './naming.ts';
import { NOTE_TRANSITIONS, rippleAt } from './noteTransition.ts';
import { barPosAt, gridLinesIn } from './hud.ts';
import { DEFAULT_KEYBOARD_STYLE, DEFAULT_ROLL_GRID, mixHex, noteColor, resolveNoteStyle, scalePitchClasses, type KeyboardStyle } from './style.ts';
import { rgbaOf } from './color.ts';
import type { PianoRollProps, SceneDocument, WidgetSpec } from './scene.ts';
import type { Derived, LayoutCtx, PolyPrim, Primitive, RectPrim, TextPrim, WidgetRenderer } from './prims.ts';
import { HUD_RENDERERS, barPageAt, buildHud, hudOf, isDrumTrack, usesChordPlaceholder, type ChordProps, type HudData } from './hud.ts';
import { INSIGHT_RENDERERS } from './insight.ts';
import { DASHBOARD_RENDERERS } from './dashboard.ts';
import { measureText } from './text.ts';
import { DEFAULT_TEXT_STYLES, TEXT_DEFAULT_FONT, TEXT_METRICS, type PlacedRun, type RichText, type TextGradient } from './typography.ts';
import { normalizeAngle } from './snap.ts';
import { visibilityAlpha } from './visibility.ts';
import { flattenScene, rootIdOf } from './comp.ts';
import { resolveAnimated } from './animation.ts';
import { FRAME_BUDGET } from '@dawviz/expr';
import { deltaMatrix, mul, resolveParents, widgetMatrix, type Mat } from './parenting.ts';
import { activeRange, hasMotion, NEUTRAL_WFX, widgetFxAt, type WidgetFx } from './widgetMotion.ts';
import { spectrumRenderer } from './spectrum.ts';
import { particleRenderer, particlesInCanvasSpace } from './particles.ts';
import { DEFAULT_BACKGROUND, placeImage, type BackgroundImage } from './background.ts';
import { notationRenderer } from './notation/widget.ts';
import { imageRenderer } from './image.ts';
import { drawPathPrim } from './notation/draw.ts';

/** Ngữ cảnh vẽ đủ cho renderFrame (Canvas 2D và OffscreenCanvas đều có). */
export interface RenderCtx extends Ctx2D {
  save(): void; restore(): void;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  translate(x: number, y: number): void;
  rotate(rad: number): void;
  rect(x: number, y: number, w: number, h: number): void;
  clip(): void;
  /** Đường gấp khúc / đa giác (PolyPrim). `setLineDash` tuỳ chọn: đích vẽ không có thì nét đứt thành nét liền. */
  lineTo(x: number, y: number): void;
  setLineDash?(segments: number[]): void;
  // Chữ tự vẽ (T-72): tỉ lệ/nghiêng run, viền, gradient, đổ bóng.
  scale(x: number, y: number): void;
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  strokeText(text: string, x: number, y: number): void;
  lineJoin: string; shadowOffsetX: number; shadowOffsetY: number;
  createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradientLike;
  createRadialGradient(x0: number, y0: number, r0: number, x1: number, y1: number, r1: number): CanvasGradientLike;
  /** Ảnh nền (T-21): `image` là ImageBitmap/CanvasImageSource. */
  drawImage(image: unknown, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
}
export interface CanvasGradientLike { addColorStop(offset: number, color: string): void }
/** Phép biến đổi đang áp khi vẽ một widget: cần cho đổ bóng chữ, vì shadowOffset/shadowBlur của Canvas tính theo điểm ảnh thiết bị, không theo transform. */
export interface DrawEnv {
  scale: number; rotation: number;
  /** Bitmap của phiên cho ImagePrim (Derived.images). */
  images?: Derived['images'];
  /**
   * Phông đang đặt trên ctx (trong phạm vi save/restore hiện tại). Gán `g.font` rất tốn trên Firefox khi phông web nạp nhiều mặt,
   * nên chỉ gán khi đổi (docs/design/FIREFOX-FONT-SLOWDOWN.md). Mỗi lần gọi `drawPrimitives` bắt đầu từ '' (chưa biết) nên luôn gán lần đầu.
   */
  font?: { v: string };
}
/** `width`/`height` theo điểm ảnh thật của đích vẽ. */
export interface RenderTarget { ctx: RenderCtx; width: number; height: number }

export type { Derived, RectPrim, TextPrim, Primitive, LayoutCtx, WidgetRenderer } from './prims.ts';

/** Tên track nhạc cụ hoà âm (Chord Detection chọn trước, T-06): piano, keys/keyboard, guitar, organ, Rhodes/EP, đàn… */
export const isHarmonicTrack = (name: string) => /piano|pno|\bkeys?\b|keyboard|guitar|gtr|organ|rhodes|e\.?\s?piano|\bep\b|clav|harpsichord|ukulele|đàn|ghi\s?ta|dương cầm/i.test(name);
/** Track trống: kênh 10 (GM) chiếm đa số nốt hoặc tên Drums/Percussion… (cùng quy tắc P-09/T-41). */
export const isDrumTrackIndex = (ti: TrackIndex) => isDrumTrack(ti.track.name) || (ti.notes.length > 0 && ti.notes.filter((n) => n.channel === 9).length * 2 > ti.notes.length);
/**
 * AUTO_ASSIGN_FIRST_MELODIC (T-06): track đang hiện có nốt, bỏ track trống. Chord Detection (`harmonic`) chọn trước track có tên piano/keys/guitar…;
 * không có thì track giai điệu đầu tiên; chỉ có track trống thì track đầu tiên có nốt.
 */
export function firstMelodicTrack(tracks: readonly TrackIndex[], harmonic = false): TrackIndex | undefined {
  const live = tracks.filter((ti) => ti.track.isVisible && ti.notes.length > 0), melodic = live.filter((ti) => !isDrumTrackIndex(ti));
  return (harmonic ? melodic.find((ti) => isHarmonicTrack(ti.track.name)) : undefined) ?? melodic[0] ?? live[0];
}
/** Đoạn đổi track (T-52) đang hiệu lực tại `t`: đoạn đầu tiên (theo `from`) chứa t; không có → undefined. */
export const trackRangeAt = (spec: Pick<WidgetSpec<unknown>, 'trackRanges'>, t: number) => spec.trackRanges?.find((r) => t >= r.from && (r.to === null || t < r.to));
/**
 * Chọn track cho widget theo trackMappingMode (SRS REQ-STORAGE-02). Có `t` và widget có `trackRanges` (T-52): trong một đoạn thì dùng đúng tập track
 * của đoạn đó. Không có `t` (bước dựng trước như Bản nhạc) → bỏ qua đoạn.
 */
export function tracksFor(spec: WidgetSpec<unknown>, index: TimelineIndex, t?: number): TrackIndex[] {
  const seg = t === undefined ? undefined : trackRangeAt(spec, t);
  if (seg) { const want = new Set(seg.tracks); return index.tracks.filter((ti) => want.has(ti.track.index)); }
  if (spec.trackMappingMode === 'MANUAL') {
    const want = new Set(spec.assignedTrackIndices);
    return index.tracks.filter((ti) => want.has(ti.track.index));
  }
  if (spec.trackMappingMode === 'AUTO_ASSIGN_FIRST_MELODIC') {
    const first = firstMelodicTrack(index.tracks, spec.type === 'CHORD_DETECTION');
    return first ? [first] : [];
  }
  return index.tracks;
}

/** Tầm cao độ của Piano Roll (mặc định CUSTOM 21–108): FIT_CONTENT lấy min/max của track được gán (±1), rỗng thì C3–C6. */
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
export function pianoRollGeometry(p: Pick<PianoRollProps, 'keyboard' | 'playheadPositionRatio' | 'visibleSeconds'> & { scrollMode?: PianoRollProps['scrollMode'] }, width: number, t = 0, page?: { start: number; end: number }) {
  if (p.scrollMode === 'PAGE') { // chế độ trang: trang dài visibleSeconds phủ đủ vùng nốt; vạch phát chạy trong trang, hết trang thì về đầu
    // `page`: trang do người gọi tính (canh theo ô nhịp); vắng thì trang dài visibleSeconds bắt đầu từ 0.
    const len = page ? Math.max(1e-6, page.end - page.start) : p.visibleSeconds;
    const kb = p.keyboard.enabled ? Math.min(p.keyboard.width, width * 0.4) : 0, area = width - kb, pxPerSec = area / len;
    const pageStart = page ? page.start : Math.max(0, Math.floor(t / len + 1e-9)) * len;
    return { kb, playX: kb + Math.min(area, Math.max(0, (t - pageStart) * pxPerSec)), pxPerSec, ratio: 0, windowSeconds: len, pageStart: pageStart as number | undefined };
  }
  const kb = p.keyboard.enabled ? Math.min(p.keyboard.width, width * 0.4) : 0;
  const pxPerSec = width / p.visibleSeconds;
  const playX = kb > 0 ? kb : width * p.playheadPositionRatio;
  const area = width - kb;
  return { kb, playX, pxPerSec, ratio: area > 0 ? (playX - kb) / area : 0, windowSeconds: area / pxPerSec, pageStart: undefined as number | undefined };
}

/** Thuộc tính Piano Roll đã điền mặc định cho các trường mới (đối tượng dựng tay hoặc tài liệu cũ chưa qua sanitizeScene vẫn vẽ được). */
function rollProps(p: PianoRollProps): PianoRollProps {
  return { ...ROLL_EXTRA, ...p, keyboard: { ...DEFAULT_KEYBOARD_STYLE, ...p.keyboard }, grid: { ...DEFAULT_ROLL_GRID, ...(p.grid ?? {}) } };
}
const ROLL_EXTRA = { flowAngle: 0, flowMirror: false, labelsUpright: true, playheadStyle: 'LINE', playheadArrows: false, playheadLength: 1, playheadGlow: 0, playheadHit: 'OFF', playheadHitMs: 250 } as const;

/**
 * Hình học làn của Piano Roll ở góc chảy bất kỳ (T-59): mọi số theo toạ độ LÀN (xem `flowFrame`). Tỉ lệ thời gian và vị trí vạch phát tính trên đoạn
 * trục thời gian nằm trong khung (`span`), nên ở góc 0 đúng như `pianoRollGeometry` trên bề rộng widget. Bàn phím kéo dài từ mép làn tới vạch phát
 * (`kbU`) để không lộ góc trống. `left`/`layoutWidth`/`windowSeconds`/`ratio`: tham số đưa thẳng vào layoutPianoRoll.
 */
export function pianoRollLane(p: PianoRollProps, width: number, height: number, t: number, page?: { start: number; end: number }) {
  const f = flowFrame(width, height, p.flowAngle ?? 0, !!p.flowMirror);
  const g = pianoRollGeometry(p, f.span, t, page);
  const kbU = g.kb > 0 ? f.u0 + g.kb : 0, playU = f.u0 + g.playX;
  if (g.pageStart !== undefined) {
    const left = f.u0 + g.kb;
    return { f, ...g, kbU, playU, left, layoutWidth: f.u0 + f.span, windowSeconds: g.windowSeconds, ratio: 0 };
  }
  const left = kbU, area = f.Lw - left, windowSeconds = area / g.pxPerSec;
  return { f, ...g, kbU, playU, left, layoutWidth: f.Lw, windowSeconds, ratio: area > 0 ? (playU - left) / area : 0 };
}

/** Mức phản ứng của vạch phát tại t (0..1): nốt vừa bắt đầu trong `ms` vừa qua, tắt dần tuyến tính, nhân velocity; kèm màu của nốt mạnh nhất. */
export function playheadHitAt(tracks: TrackIndex[], t: number, ms: number, pitchMin: number, pitchMax: number, style?: PianoRollProps['noteStyle']): { k: number; color: string | null } {
  const win = Math.max(0.001, ms / 1000);
  let best = 0, color: string | null = null;
  for (const ti of tracks) {
    if (!ti.track.isVisible) continue;
    for (const n of notesInRange(ti, t - win, t)) {
      if (n.startTimeSeconds > t || n.startTimeSeconds <= t - win || n.pitch < pitchMin || n.pitch > pitchMax) continue;
      const k = (1 - (t - n.startTimeSeconds) / win) * Math.min(1, Math.max(0, n.velocity / 127));
      if (k > best + 1e-12) { best = k; color = noteColor(resolveNoteStyle(style, ti.track.id), ti.track.color, n.pitch, n.velocity); }
    }
  }
  return { k: best, color };
}

/** Thang âm đánh dấu trên bàn phím tại t (T-51/T-41): tập lớp cao độ và nốt chủ; null = tắt hoặc chưa đủ nốt để nhận diện. */
export function keyboardScaleAt(mode: KeyboardStyle['scale'], tonic: number | undefined, tracks: TrackIndex[], t: number): { pcs: Set<number>; tonic: number } | null {
  if (mode === 'OFF') return null;
  const det = tonic === undefined || mode === 'AUTO' ? keyAt(tracks.filter((ti) => ti.track.isVisible), t, KEY_WINDOW_SEC) : null;
  if (mode === 'MAJOR' || mode === 'MINOR') {
    const tn = tonic ?? det?.tonic; if (tn === undefined) return null;
    return { pcs: scalePitchClasses(tn, mode === 'MINOR'), tonic: tn };
  }
  if (tonic === undefined) return det ? { pcs: scalePitchClasses(det.tonic, det.minor), tonic: det.tonic } : null;
  // Có nốt chủ người dùng đặt: chọn trưởng/thứ của nốt chủ đó trùng nhiều lớp cao độ nhất với giọng nhận diện (hoà: trưởng).
  const maj = scalePitchClasses(tonic, false), min = scalePitchClasses(tonic, true);
  if (!det) return { pcs: maj, tonic };
  const ref = scalePitchClasses(det.tonic, det.minor), hits = (s: Set<number>) => [...s].filter((x) => ref.has(x)).length;
  return { pcs: hits(min) > hits(maj) ? min : maj, tonic };
}
/** Cửa sổ nhận diện giọng cho đánh dấu thang âm (giây), như mặc định widget Giọng. */
export const KEY_WINDOW_SEC = 16;

export const pianoRollRenderer: WidgetRenderer<PianoRollProps> = {
  type: 'PIANO_ROLL',
  layout({ ast, derived, tracks }, spec, t) {
    const p = rollProps(spec.properties), { width, height } = spec.layout;
    const [pitchMin, pitchMax] = pianoRollPitchRange(p, tracks);
    const page = p.scrollMode === 'PAGE' && p.pageUnit === 'BARS' ? barPageAt(hudOf(derived, ast).bars, p.pageBars, t) : undefined;
    const L = pianoRollLane(p, width, height, t, page), { f, kb, kbU, playU, pageStart } = L, Lh = f.Lh;
    const rects = layoutPianoRoll({ tracks, duration: derived.index.duration }, ast.tempoMap, t,
      { width: L.layoutWidth, height: Lh, windowSeconds: L.windowSeconds, playheadRatio: L.ratio, pitchMin, pitchMax, brightness: derived.brightness, style: p.noteStyle, left: L.left, pageStart, revealAhead: p.scrollMode === 'PAGE' && p.revealAhead > 0 ? p.revealAhead : undefined,
        transition: p.transition && p.transition !== 'none' && NOTE_TRANSITIONS[p.transition] ? { spec: NOTE_TRANSITIONS[p.transition], beatPhase: barPosAt(hudOf(derived, ast).bars, t).beatPhase } : undefined });
    const out: Primitive[] = []; // toạ độ làn; đổi sang toạ độ khung ở cuối (góc 0: trùng nhau)
    const labels: TextPrim[] = [];
    const upright = p.labelsUpright;
    // Lưới ô nhịp (dưới nốt): vạch đầu ô nhịp, vạch phách mờ, số ô nhịp ở đầu mỗi ô. Lấy lưới từ HudData nên đúng khi đổi tempo/nhịp.
    const G = p.grid;
    if ((G.bars || G.beats || G.numbers) && G.opacity > 0) {
      const pps = (L.layoutWidth - L.left) / L.windowSeconds, t0 = pageStart !== undefined ? pageStart : t - L.windowSeconds * L.ratio;
      const tA = pageStart !== undefined ? pageStart : t0 - L.left / pps, tB = pageStart !== undefined ? pageStart + L.windowSeconds : t0 + L.windowSeconds;
      const uMin = kb > 0 ? kbU : 0, size = Math.min(14, Math.max(8, f.pitchSpan * 0.018)), vTop = (Lh - f.pitchSpan) / 2;
      for (const ln of gridLinesIn(hudOf(derived, ast).bars, tA, tB, G.beats)) {
        const u = L.left + (ln.sec - t0) * pps;
        if (u < uMin - 0.5) continue;
        const head = ln.beat === 1;
        if (head ? G.bars : G.beats) out.push({ ...rect(u - 0.5, 0, 1, Lh, G.color), alpha: head ? G.opacity : G.opacity * 0.45 });
        if (head && G.numbers) {
          const text = String(ln.bar), w = text.length * size * 0.62;
          labels.push(flowLabel(f, { cu: u + 4 + w / 2, cv: vTop + (f.identity ? 4 + size / 2 : 6 + size), ax: u + 4, align: 'left', text, size, color: G.color, alpha: Math.min(1, G.opacity * 2 + 0.2), font: TEXT_DEFAULT_FONT, weight: 400, upright }));
        }
      }
    }
    for (const r of rects) {
      const alpha = a01(r.brightness * r.opacity);
      if (alpha <= 0.004) continue;
      out.push({ kind: 'rect', x: r.x, y: r.y, w: r.w, h: r.h, fill: r.color, alpha: Math.max(0.05, alpha), radius: r.radius > 0.5 ? r.radius : 0,
        glowColor: r.color, glowBlur: r.glow > 0 && r.glowRadius > 0 ? r.glowRadius * r.glow * (0.4 + 0.6 * r.brightness) : 0,
        stroke: r.borderColor, strokeWidth: r.borderWidth });
    }
    // Vòng gợn (template ripple, T-18): viền tròn toả từ đầu nốt, không tô; vẽ trên nốt, dưới vạch phát.
    const tr = p.transition ? NOTE_TRANSITIONS[p.transition] : undefined;
    if (tr?.ripple) for (const r of rects) {
      if (r.start === undefined) continue;
      const g = rippleAt(tr, r.start, t, r.h); if (!g) continue;
      const alpha = a01(r.brightness * g.alpha); if (alpha <= 0.004) continue;
      out.push({ kind: 'rect', x: r.x - g.r, y: r.y + r.h / 2 - g.r, w: 2 * g.r, h: 2 * g.r, fill: '#00000000', alpha, radius: g.r, glowColor: '', glowBlur: 0, stroke: r.color, strokeWidth: Math.max(1, r.h * 0.12) });
    }
    if (p.playheadVisible && p.playheadWidth > 0) {
      const hit = p.playheadHit !== 'OFF' ? playheadHitAt(tracks, t, p.playheadHitMs, pitchMin, pitchMax, p.noteStyle) : { k: 0, color: null };
      out.push(...playheadPrims(p, playU, Lh, f.pitchSpan, hit), ...playheadArrowPrims(p, playU, Lh, f.pitchSpan));
    }
    if (kb > 0) {
      const ks = { ...DEFAULT_KEYBOARD_STYLE, ...p.keyboard, width: kb };
      const keys = layoutKeyboard({ tracks, duration: derived.index.duration }, t, { height: Lh, pitchMin, pitchMax, style: ks, noteStyle: p.noteStyle, ...(kbU !== kb ? { reach: kbU } : {}) });
      const sc = keyboardScaleAt(ks.scale, derived.tonic, tracks, t);
      const round = ks.shape === 'ROUNDED';
      const keyRect = (x: number, y: number, w: number, h: number, fill: string): RectPrim => {
        if (!round) return rect(x, y, w, h, fill);
        const gap = Math.min(1, h * 0.15), r = Math.min(h * 0.45, kb * 0.08, 6);
        return { ...rect(x, y + gap / 2, w, h - gap, fill), radius: r > 0.5 ? r : 0 };
      };
      if (round) out.push(rect(0, 0, kbU, Lh, '#0c0e16')); // khe giữa các phím bo góc
      for (const k of keys) {
        if (k.black) out.push(keyRect(0, k.y, kbU, k.h, ks.whiteColor)); // hàng phím đen: nền trắng cả hàng rồi phím đen ngắn đè lên
        out.push(keyRect(k.x, k.y, k.w, k.h, k.color));
        if (sc && !k.active && ks.scaleOpacity > 0 && sc.pcs.has(k.pitch % 12))
          out.push({ ...keyRect(k.x, k.y, k.w, k.h, ks.scaleColor), alpha: Math.min(1, ks.scaleOpacity * (k.pitch % 12 === sc.tonic ? 1.8 : 1)) });
      }
      out.push(rect(kbU - 1, 0, 1, Lh, '#0c0e16'));
      if (ks.labels !== 'NONE') labels.push(...keyLabels(f, keys, ks, kb, kbU, Lh / (pitchMax - pitchMin + 1), derived.naming ?? DEFAULT_NAMING, upright));
    }
    const prims: Primitive[] = f.identity ? out : out.map((q) => (q.kind === 'rect' ? flowRect(f, q) : q));
    return labels.length ? [...prims, ...labels] : prims;
  },
};
const rect = (x: number, y: number, w: number, h: number, fill: string): RectPrim => ({ kind: 'rect', x, y, w, h, fill, alpha: 1, radius: 0, glowColor: '', glowBlur: 0, stroke: '', strokeWidth: 0 });

/**
 * Vạch phát (T-58) trên làn, vuông góc với hướng chảy, căn giữa theo chiều cao làn. Kiểu LINE mặc định ra đúng một hình chữ nhật như trước.
 * `hit.k`: mức phản ứng khi nốt chạm (FLASH: màu ngả về màu nốt vừa chạm và sáng hơn; SWELL: dày thêm tới 3 lần).
 */
export function playheadPrims(p: Pick<PianoRollProps, 'playheadColor' | 'playheadWidth' | 'playheadStyle' | 'playheadArrows' | 'playheadLength' | 'playheadGlow' | 'playheadHit'>, u: number, laneH: number, pitchSpan: number, hit: { k: number; color: string | null }): RectPrim[] {
  const k = p.playheadHit === 'OFF' ? 0 : Math.min(1, Math.max(0, hit.k));
  const w = p.playheadWidth * (p.playheadHit === 'SWELL' ? 1 + 2 * k : 1);
  const color = p.playheadHit === 'FLASH' && k > 0 ? mixHex(p.playheadColor, mixHex(hit.color ?? p.playheadColor, '#ffffff', 0.35), k) : p.playheadColor;
  const glowBlur = Math.max(p.playheadGlow * 24, p.playheadHit === 'FLASH' ? k * 28 : 0);
  const len = p.playheadLength >= 0.999 ? laneH : Math.min(laneH, p.playheadLength * pitchSpan), v0 = (laneH - len) / 2;
  const glow = (r: RectPrim): RectPrim => (glowBlur > 0 ? { ...r, glowColor: color, glowBlur } : r);
  const out: RectPrim[] = [];
  switch (p.playheadStyle) {
    case 'DASHED': {
      const dash = Math.max(4, w * 3), gap = dash * 0.75;
      for (let v = v0; v < v0 + len - 0.01; v += dash + gap) out.push(glow(rect(u - w / 2, v, w, Math.min(dash, v0 + len - v), color)));
      break;
    }
    case 'BAND': out.push(glow({ ...rect(u - w / 2, v0, w, len, color), alpha: 0.35 }), rect(u - 0.5, v0, 1, len, color)); break;
    case 'GRADIENT': { // dải mờ dần về hai bên: các dải con lồng nhau, tâm đậm nhất
      const n = 6;
      for (let i = n; i >= 1; i--) { const ww = (w * i) / n; out.push({ ...(i === n ? glow(rect(u - ww / 2, v0, ww, len, color)) : rect(u - ww / 2, v0, ww, len, color)), alpha: 1 / n + (i === 1 ? 0.2 : 0) }); }
      break;
    }
    default: out.push(glow(rect(u - w / 2, v0, w, len, color)));
  }
  return out;
}

/** Đầu mũi tên hai đầu của vạch phát (T-58): hai tam giác đặc chỉ vào trong, nằm gọn trong đoạn vạch. Rỗng khi `playheadArrows` tắt. */
export function playheadArrowPrims(p: Pick<PianoRollProps, 'playheadColor' | 'playheadWidth' | 'playheadArrows' | 'playheadLength'>, u: number, laneH: number, pitchSpan: number): PolyPrim[] {
  if (!p.playheadArrows) return [];
  const len = p.playheadLength >= 0.999 ? laneH : Math.min(laneH, p.playheadLength * pitchSpan), v0 = (laneH - len) / 2;
  const s = Math.min(40, Math.max(8, p.playheadWidth * 3)), h = Math.min(s * 0.8, len / 2);
  const tri = (v: number, apex: number): PolyPrim => ({ kind: 'poly', pts: [u - s / 2, v, u + s / 2, v, u, apex], closed: true, fill: p.playheadColor, fillAlpha: 1, stroke: '', width: 0, alpha: 1 });
  return [tri(v0, v0 + h), tri(v0 + len, v0 + len - h)];
}

/** Tên nốt trên phím (T-51, P-12). Cỡ chữ theo chiều cao một hàng phím; quá nhỏ (< 5 pt) thì không vẽ. Tâm nhãn ở đầu phím gần vạch phát. */
export function keyLabels(f: FlowFrame, keys: KeyRect[], ks: KeyboardStyle, kb: number, kbU: number, rowH: number, naming: NoteNaming, upright: boolean): TextPrim[] {
  const size = Math.min(rowH * (ks.labels === 'C' ? 1.5 : 0.85), kb * 0.22, 24);
  if (!(size >= 5)) return [];
  const across = !f.identity && upright && Math.abs(f.s) > 0.5; // chữ đứng thẳng trên làn gần dọc: bề ngang chữ nằm ngang qua các hàng phím
  const out: TextPrim[] = [];
  for (const k of keys) {
    const pc = k.pitch % 12;
    const show = ks.labels === 'ALL' || (ks.labels === 'WHITE' && !k.black) || (ks.labels === 'C' && pc === 0) || (ks.labels === 'ACTIVE' && k.active);
    if (!show) continue;
    const text = ks.labelOctave ? noteNameFor(k.pitch, naming) : pitchClassNameFor(k.pitch, naming);
    const cu = k.black ? k.x + k.w - kb * 0.16 : kbU - kb * 0.19;
    out.push(flowLabel(f, { cu, cv: k.y + k.h / 2, ax: cu, align: 'center', text, size, color: ks.labelColor || (k.black ? '#e8eaf2' : '#3a3f52'), alpha: 0.9,
      font: TEXT_DEFAULT_FONT, weight: 400, maxWidth: across ? rowH * 1.8 : kb * 0.34, upright }));
  }
  return out;
}

/** Bảng renderer theo loại. Widget chưa có renderer được bỏ qua khi vẽ (vẫn giữ trong Scene). */
export const WIDGET_RENDERERS: Partial<Record<WidgetSpec['type'], WidgetRenderer<any>>> = { IMAGE: imageRenderer, PIANO_ROLL: pianoRollRenderer, AUDIO_SPECTRUM: spectrumRenderer, PARTICLES: particleRenderer, NOTATION: notationRenderer, ...INSIGHT_RENDERERS, ...DASHBOARD_RENDERERS, ...HUD_RENDERERS };

/** Bố cục toàn khung (thuần): danh sách widget đã sắp theo zIndex kèm primitive của từng widget. Dùng để test tất định. */
/** HudData cho một scene: số đếm, lưới ô nhịp và hợp âm của mọi widget Chord Detection. Gọi ở bước derived (một lần cho mỗi dự án × scene). */
export const buildSceneHud = (scene: SceneDocument, ast: UnifiedProjectAST, index: TimelineIndex): HudData =>
  buildHud(ast, index, flattenScene(scene).widgets.flatMap((w) => {
    // mỗi tập track widget có thể dùng: mặc định + từng đoạn đổi track (T-52)
    const sets = [tracksFor(w, index), ...(w.trackRanges ?? []).map((r) => tracksFor(w, index, r.from))];
    if (w.type === 'DEGREE') return sets.flatMap((tracks) => [{ tracks, mode: 'sustained' as const }, { tracks, mode: 'strike' as const }]); // hàng chính + hàng phụ (theo lần dập)
    if (w.type !== 'CHORD_DETECTION' && !usesChordPlaceholder(w)) return [];
    const mode = (w.properties as ChordProps).mode ?? 'sustained';
    return sets.map((tracks) => ({ tracks, mode }));
  }));
const hudMemo = new WeakMap<Derived, WeakMap<SceneDocument, HudData>>();
/** Derived có hud: dùng cái đã dựng; thiếu (gọi trực tiếp, kiểm thử) thì dựng một lần cho (derived, scene) rồi đệm. */
function withHud(scene: SceneDocument, derived: Derived, ast: UnifiedProjectAST): Derived {
  if (derived.hud) return derived;
  let m = hudMemo.get(derived); if (!m) hudMemo.set(derived, m = new WeakMap());
  let h = m.get(scene); if (!h) m.set(scene, h = buildSceneHud(scene, ast, derived.index));
  return { ...derived, hud: h };
}
export function layoutFrame(scene0: SceneDocument, derived0: Derived, ast: UnifiedProjectAST, t: number, renderers = WIDGET_RENDERERS) {
  const scene = flattenScene(scene0); // precomp (D-69): trải cây comp thành danh sách phẳng; scene không có comp giữ nguyên
  const derived: Derived = { ...withHud(scene, derived0, ast), phases: scene.phases, tonic: scene.tonic, naming: scene.noteNaming }; // phase thuộc scene: gắn mỗi khung (đối tượng nhỏ, không đệm)
  const dur = derived.index.duration;
  const order = scene.widgets.map((w, i) => ({ w, i })).filter(({ w }) => w.visible && renderers[w.type])
    .sort((a, b) => a.w.zIndex - b.w.zIndex || a.i - b.i); // cùng zIndex: giữ thứ tự trong tài liệu
  const measure = derived.measure ?? measureText, textStyles = scene.textStyles ?? DEFAULT_TEXT_STYLES;
  const out: { widget: WidgetSpec; prims: Primitive[]; fx?: WidgetFx; /** Phần thay đổi của chuỗi cha (parenting), áp trước biến đổi của chính widget. */ pm?: Mat }[] = [];
  // Điểm chạm vạch phát của nốt (hạt `NOTE`): cùng hình học với Piano Roll nên khớp ở Preview và Export.
  const roll = order.map(({ w }) => w).find((w): w is WidgetSpec<PianoRollProps> => w.type === 'PIANO_ROLL');
  const emitter: LayoutCtx['emitter'] | undefined = roll && ((pitch, ts) => {
    const p = roll.properties, { x, y, width, height } = roll.layout, [lo, hi] = pianoRollPitchRange(p, tracksFor(roll, derived.index, ts));
    if (pitch < lo || pitch > hi) return null;
    const page = p.scrollMode === 'PAGE' && p.pageUnit === 'BARS' ? barPageAt(hudOf(derived, ast).bars, p.pageBars, ts) : undefined;
    const L = pianoRollLane(rollProps(p), width, height, ts, page), rowH = L.f.Lh / (hi - lo + 1);
    const m = flowPoint(L.f, L.playU, (hi - pitch) * rowH + rowH / 2);
    return { x: x + m.x, y: y + m.y };
  });
  // Ngân sách bước của mọi biểu thức trong khung (T-30, EXPRESSIONS §3.4): hết thì phần tử còn lại dùng giá trị tĩnh và báo qua derived.onExprIssue.
  // Đếm bước (không đo giờ) nên Preview và Export cắt đúng cùng chỗ: tất định.
  const budget = { left: FRAME_BUDGET };
  // Biến đổi riêng của từng widget trong khung này (hoạt hình + motion), tính một lần: dùng cho chính nó và cho các widget con (parenting).
  type Own = { we: WidgetSpec; opacity: number; sc: number; fx?: WidgetFx };
  const owns = new Map<string, Own>(), byId = new Map(scene.widgets.map((w) => [w.id, w]));
  const ownOf = (w: WidgetSpec): Own => {
    let o = owns.get(w.id); if (o) return o;
    let we = w, opacity = 1, sc = 1; // `scale` animate được (%, quanh điểm neo): gộp vào phép co giãn của chuyển động cấp widget
    if (w.animate) { const r = resolveAnimated(w, { ast, derived, tracks: tracksFor(w, derived.index, t), t, budget, onExprIssue: derived.onExprIssue }, scene.canvas); we = r.widget; opacity = r.opacity; sc = r.scale; } // hoạt hình thuộc tính (T-22)
    let fx = hasMotion(w.motion) ? widgetFxAt(w.motion, activeRange(w.visibility, t, dur), t, ast.tempoMap) : undefined;
    if (sc !== 1) fx = { ...(fx ?? NEUTRAL_WFX), sx: (fx?.sx ?? 1) * sc, sy: (fx?.sy ?? 1) * sc };
    if (fx && fx.dx === 0 && fx.dy === 0 && fx.sx === 1 && fx.sy === 1 && fx.rot === 0 && fx.alpha === 1) fx = undefined; // trung tính: chuỗi lệnh vẽ giữ như không có motion
    o = { we, opacity, sc, fx };
    owns.set(w.id, o); return o;
  };
  // Phần thay đổi cộng dồn của chuỗi cha và độ đục của chuỗi cha (parenting, 0.7.0). Cha bị ẩn vẫn dẫn con.
  const { parents } = scene.widgets.some((w) => w.parent) ? resolveParents(scene.widgets) : { parents: new Map<string, string>() };
  const chain = new Map<string, { m: Mat; a: number }>();
  const parentOf = (id: string): { m: Mat; a: number } | null => {
    const pid = parents.get(id); if (pid === undefined) return null;
    let c = chain.get(pid); if (c) return c;
    const pw = byId.get(pid)!, po = ownOf(pw), up = parentOf(pid);
    const L = po.we.layout, fx = po.fx, comp = pw.type === 'COMP';
    // Lớp precomp (D-69): nội dung comp ở toạ độ khung, nên tư thế "tĩnh" để so là khung đầy đủ ở gốc; lớp còn truyền cho con khoảng hiển thị,
    // hiện dần/ẩn dần và nút mắt của nó (cha thường thì không).
    const rest = comp ? widgetMatrix({ ...pw.layout, x: 0, y: 0, width: scene.canvas.designWidth, height: scene.canvas.designHeight }, 0) : widgetMatrix(pw.layout, normalizeAngle(pw.layout.rotation));
    const d = deltaMatrix(widgetMatrix(L, normalizeAngle(L.rotation) + (fx ? fx.rot : 0), fx), rest);
    const a = po.opacity * (fx?.alpha ?? 1) * (comp ? (pw.visible ? visibilityAlpha(pw.visibility, t, dur) : 0) : 1);
    c = up ? { m: mul(up.m, d), a: up.a * a } : { m: d, a };
    chain.set(pid, c); return c;
  };
  for (const { w } of order) {
    let k = visibilityAlpha(w.visibility, t, dur);
    if (k <= 0) continue; // ngoài khoảng hiển thị: không dựng gì
    const wTracks = tracksFor(w, derived.index, t);
    const own = ownOf(w), we = own.we, fx = own.fx, par = parentOf(w.id);
    k *= own.opacity * (par ? par.a : 1);
    if (k <= 0 || own.sc <= 0) continue;
    const prims = renderers[w.type]!.layout({ ast, derived, tracks: wTracks, measure, textStyles, fonts: derived.fonts, emitter }, we, t);
    const ka = fx ? k * fx.alpha : k;
    if (fx && ka <= 0) continue; // vào/ra: đang ẩn hẳn
    out.push({ widget: we, prims: ka >= 1 ? prims : prims.map((p) => fadePrim(p, ka)), ...(fx ? { fx } : {}), ...(par && !isIdentity(par.m) ? { pm: par.m } : {}) });
  }
  return out;
}
const isIdentity = (m: Mat) => Math.abs(m[0] - 1) < 1e-12 && Math.abs(m[1]) < 1e-12 && Math.abs(m[2]) < 1e-12 && Math.abs(m[3] - 1) < 1e-12 && Math.abs(m[4]) < 1e-9 && Math.abs(m[5]) < 1e-9;
/** Nhân độ đục của primitive với hệ số làm mờ `k` (0..1); phát sáng co theo để không còn quầng khi gần ẩn. */
const fadePrim = (p: Primitive, k: number): Primitive => (p.kind === 'rect' ? { ...p, alpha: p.alpha * k, glowBlur: p.glowBlur * k } : p.kind === 'path' && p.glow ? { ...p, alpha: p.alpha * k, glow: { ...p.glow, alpha: p.glow.alpha * k } } : { ...p, alpha: p.alpha * k });

/**
 * Vẽ một khung hình. `scale` = điểm ảnh đích / pt (Preview: bề rộng canvas × DPR / designWidth; Export: W_export / designWidth).
 * (1) nền; (2) widget theo zIndex, mỗi widget cắt theo khung của nó (đã xoay quanh điểm neo, REQ-GRAPHICS-03); (3) primitive.
 */
/** Tuỳ chọn khung (T-55): `transparent` = không tô màu nền và không vẽ ảnh nền (xuất PNG có kênh trong suốt); `layers` = chỉ vẽ các widget có id trong tập (xuất nền và tiền cảnh riêng). */
export interface FrameOptions {
  transparent?: boolean; layers?: ReadonlySet<string>;
  /** Chuỗi cảnh (T-110): hệ số độ đục của cả khung (nền và mọi widget), 0..1; vắng = 1. */
  alpha?: number;
  /** Chuỗi cảnh: không xoá canvas trước khi vẽ (vẽ chồng lên cảnh trước). */
  noClear?: boolean;
}
export function renderFrame(scene0: SceneDocument, derived: Derived, ast: UnifiedProjectAST, t: number, target: RenderTarget, scale: number, renderers = WIDGET_RENDERERS, opts: FrameOptions = {}): void {
  const scene = flattenScene(scene0);
  const g = target.ctx, { designWidth: W, designHeight: H } = scene.canvas;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1; g.shadowBlur = 0;
  const K = opts.alpha === undefined ? 1 : Math.min(1, Math.max(0, opts.alpha));
  if (!opts.noClear) g.clearRect(0, 0, target.width, target.height);
  g.setTransform(scale, 0, 0, scale, 0, 0);
  if (!opts.transparent && K > 0) {
    g.fillStyle = scene.canvas.backgroundColor; if (K < 1) g.globalAlpha = K; // K = 1: giữ nguyên chuỗi lệnh vẽ như trước chuỗi cảnh
    g.fillRect(0, 0, W, H); if (K < 1) g.globalAlpha = 1;
    if (derived.background) drawBackground(g, scene, derived.background, W, H, K);
  }
  // `layers` chứa id lớp cấp gốc; con của một lớp precomp thuộc lớp đó (id có tiền tố).
  const only0 = opts.layers, only = only0 && { has: (id: string) => only0.has(id) || only0.has(rootIdOf(id)) };
  for (const { widget, prims: prims0, fx, pm } of layoutFrame(only ? { ...scene, widgets: scene.widgets.filter((w) => only.has(w.id) || scene.widgets.some((c) => c.parent === w.id && only.has(c.id))) } : scene, derived, ast, t, renderers)) {
    if (only && !only.has(widget.id)) continue; // cha chỉ được giữ để dẫn con (parenting), không vẽ
    const prims = K >= 1 ? prims0 : prims0.map((p) => fadePrim(p, K)); // chuỗi cảnh: làm mờ cả cảnh
    const L = widget.layout;
    g.save();
    if (pm && !particlesInCanvasSpace(widget)) g.transform(pm[0], pm[1], pm[2], pm[3], pm[4], pm[5]); // parenting: theo thay đổi của cha
    if (particlesInCanvasSpace(widget)) { drawPrimitives(g, prims, { scale, rotation: 0, images: derived.images }); g.restore(); continue; }
    const rot = normalizeAngle(L.rotation) + (fx ? fx.rot : 0);
    if (fx) { // chuyển động cấp widget: dời, xoay thêm và co giãn quanh điểm neo
      const ax = L.anchor.x * L.width, ay = L.anchor.y * L.height;
      g.translate(L.x + ax + fx.dx * L.width, L.y + ay + fx.dy * L.height); g.rotate(rot * Math.PI / 180); g.scale(fx.sx, fx.sy); g.translate(-ax, -ay);
    } else if (rot === 0) g.translate(L.x, L.y); // góc 0: đúng chuỗi lệnh trước T-68
    else { // dời tới điểm neo, xoay (chiều kim đồng hồ, trục y xuống), dời ngược: toạ độ trong widget giữ nguyên, không co nội dung
      const ax = L.anchor.x * L.width, ay = L.anchor.y * L.height;
      g.translate(L.x + ax, L.y + ay); g.rotate(rot * Math.PI / 180); g.translate(-ax, -ay);
    }
    g.beginPath(); g.rect(0, 0, L.width, L.height); g.clip();
    drawPrimitives(g, derived.fontsReady === false ? prims.filter((p) => p.kind !== 'text') : prims, { scale, rotation: rot, images: derived.images }); // phông chưa nạp: không vẽ chữ (TECHNICAL-DESIGN 5.7)
    g.restore();
  }
}

/** Ảnh nền rồi lớp làm tối, trước mọi widget. */
function drawBackground(g: RenderCtx, scene: SceneDocument, bg: BackgroundImage, W: number, H: number, k = 1): void {
  const spec = scene.canvas.backgroundImage ?? DEFAULT_BACKGROUND, pl = placeImage(spec.fit, bg.width, bg.height, W, H);
  if (pl.dw > 0 && spec.opacity > 0) { g.globalAlpha = k < 1 ? spec.opacity * k : spec.opacity; g.drawImage(bg.image, pl.sx, pl.sy, pl.sw, pl.sh, pl.dx, pl.dy, pl.dw, pl.dh); }
  if (spec.dim > 0) { g.globalAlpha = k < 1 ? spec.dim * k : spec.dim; g.fillStyle = '#000000'; g.fillRect(0, 0, W, H); }
  g.globalAlpha = 1;
}

function roundedPath(g: Ctx2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

/** Chỉ vẽ, không tính nghiệp vụ. Mọi trạng thái ctx bị đổi (alpha, shadow) được trả về mặc định sau mỗi hình. */
export function drawPrimitives(g: RenderCtx, prims: Primitive[], env0: DrawEnv = { scale: 1, rotation: 0 }): void {
  const env: DrawEnv = { ...env0, font: { v: '' } };
  for (const p of prims) {
    if (p.kind === 'text') { if (p.rich) drawRichText(g, p, p.rich, env); else drawText(g, p, env); continue; }
    if (p.kind === 'path') { drawPathPrim(g, p, env.scale); continue; }
    if (p.kind === 'poly') { drawPoly(g, p); continue; }
    if (p.kind === 'image') {
      const img = env.images?.get(p.asset);
      if (img && p.alpha > 0 && p.w > 0 && p.h > 0 && p.sw > 0 && p.sh > 0) {
        const c = g as unknown as { imageSmoothingEnabled: boolean; drawImage(...a: unknown[]): void };
        g.globalAlpha = p.alpha; c.imageSmoothingEnabled = p.smooth;
        c.drawImage(img.image, p.sx, p.sy, p.sw, p.sh, p.x, p.y, p.w, p.h);
        c.imageSmoothingEnabled = true;
      }
      continue;
    }
    g.globalAlpha = p.alpha; g.fillStyle = p.fill;
    const rot = p.rotation ? p.rotation * Math.PI / 180 : 0;
    if (rot) { g.save(); g.translate(p.x + p.w / 2, p.y + p.h / 2); g.rotate(rot); } // xoay quanh tâm hình; vẽ như hộp đặt tại gốc
    const x = rot ? -p.w / 2 : p.x, y = rot ? -p.h / 2 : p.y;
    if (p.glowBlur > 0) { g.shadowColor = p.glowColor; g.shadowBlur = p.glowBlur; }
    if (p.radius > 0) { roundedPath(g, x, y, p.w, p.h, p.radius); g.fill(); } else g.fillRect(x, y, p.w, p.h);
    g.shadowBlur = 0;
    if (p.strokeWidth > 0) { g.strokeStyle = p.stroke; g.lineWidth = p.strokeWidth; roundedPath(g, x, y, p.w, p.h, p.radius); g.stroke(); }
    if (rot) g.restore();
  }
  g.globalAlpha = 1;
}

/** Đa giác/đường gấp khúc: tô (nếu có) rồi viền (nếu có). Độ đục tô = alpha × fillAlpha. */
function drawPoly(g: RenderCtx, p: PolyPrim): void {
  const n = p.pts.length >> 1; if (n < 2 || !(p.alpha > 0)) return;
  g.shadowBlur = 0; g.beginPath(); g.moveTo(p.pts[0], p.pts[1]);
  for (let i = 1; i < n; i++) g.lineTo(p.pts[2 * i], p.pts[2 * i + 1]);
  if (p.closed) g.closePath();
  if (p.fill && n >= 3 && p.fillAlpha > 0) { g.globalAlpha = Math.min(1, p.alpha * p.fillAlpha); g.fillStyle = p.fill; g.fill(); }
  if (p.stroke && p.width > 0) {
    g.globalAlpha = Math.min(1, p.alpha); g.strokeStyle = p.stroke; g.lineWidth = p.width; g.lineJoin = 'round';
    if (p.dash?.length) g.setLineDash?.([...p.dash]);
    g.stroke();
    if (p.dash?.length) g.setLineDash?.([]);
  }
}

/** Gán `g.font` chỉ khi khác giá trị đang đặt (xem DrawEnv.font). */
function setFont(g: Ctx2D, env: DrawEnv, f: string): void { const st = env.font; if (st) { if (st.v === f) return; st.v = f; } g.font = f; }

/** Chữ: baseline chữ cái, không kerning, textRendering geometricPrecision (đo bằng FONT_METRICS không có cặp kerning). maxWidth truyền cho fillText để không bao giờ tràn khung. */
function drawText(g: Ctx2D, p: TextPrim, env: DrawEnv): void {
  g.globalAlpha = p.alpha; g.fillStyle = p.color; g.shadowBlur = 0;
  setFont(g, env, `${p.weight} ${p.size}px "${p.font}", sans-serif`);
  g.textAlign = p.align; g.textBaseline = 'alphabetic'; g.fontKerning = 'none'; g.textRendering = 'geometricPrecision'; // không kerning, không làm tròn advance: khớp bảng đo
  if (p.rotation) { // phông/lề đặt trước save nên còn nguyên sau restore (khớp bộ nhớ phông env.font)
    const c = g as RenderCtx; c.save(); c.translate(p.x, p.y); c.rotate(p.rotation * Math.PI / 180);
    if (p.maxWidth !== undefined) g.fillText(p.text, 0, 0, p.maxWidth); else g.fillText(p.text, 0, 0);
    c.restore(); return;
  }
  if (p.maxWidth !== undefined) g.fillText(p.text, p.x, p.y, p.maxWidth); else g.fillText(p.text, p.x, p.y);
}

// ───────────────────────────── chữ tự vẽ (T-72, REQ-GRAPHICS-18) ─────────────────────────────
// Vị trí từng run/cụm ký tự đã tính ở layout bằng bảng đo, nên mọi trình duyệt đặt chữ như nhau. Không dùng letterSpacing,
// fontVariantNumeric hay italic tổng hợp của trình duyệt: tracking/chữ số đều bề rộng là vị trí đã dàn, nghiêng là phép xiên.
const FAR = 1e5; // bản sao chữ cho bóng nằm ngoài vùng cắt của widget; chỉ bóng của nó rơi vào khung
const rgba = (hex: string, a: number) => rgbaOf(hex, a); // alpha của mã (#rrggbbaa) nhân với độ đục của bóng
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
    for (const run of r.runs) paintRun(g, p, r, run, FAR, true, env);
    g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0; g.shadowColor = 'rgba(0,0,0,0)';
  }
  g.globalAlpha = alpha;
  for (const run of r.runs) paintRun(g, p, r, run, 0, false, env);
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
function paintRun(g: RenderCtx, p: TextPrim, r: RichText, run: PlacedRun, offX: number, shadow: boolean, env: DrawEnv): void {
  const M = TEXT_METRICS, x0 = r.left + run.dx + offX, y0 = p.y - run.shift;
  const sx = run.scaleX, sy = run.scaleY;
  const fill = shadow ? '#000000' : run.gradient ? runGradient(g, r, p.y, run.gradient, x0, y0, sx, sy) : run.color;
  const fontBefore = env.font?.v;
  g.save(); g.translate(x0, y0);
  if (sx !== 1 || sy !== 1) g.scale(sx, sy);
  if (run.italic) g.transform(1, 0, -M.italicSkew, 1, 0, 0); // nghiêng giả, giống nhau mọi trình duyệt (phông đóng gói không có mặt nghiêng)
  setFont(g, env, `${run.weight} ${run.size}px "${run.font}", sans-serif`);
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
  if (env.font && fontBefore !== undefined) env.font.v = fontBefore; // restore() trả phông về giá trị trước save
  if (run.underline || run.strike) { // gạch tự vẽ: không xiên theo chữ nghiêng, dài đúng bề rộng run
    const th = run.decoThickness > 0 ? run.decoThickness : Math.max(0.5, run.size * M.decoThickness * sy);
    g.fillStyle = shadow ? '#000000' : run.decoColor || fill as string;
    if (!shadow && !run.decoColor && run.gradient) g.fillStyle = runGradient(g, r, p.y, run.gradient, 0, 0, 1, 1);
    if (run.underline) g.fillRect(x0, y0 + run.size * M.underline * sy - th / 2, run.width, th);
    if (run.strike) g.fillRect(x0, y0 - run.size * M.strike * sy - th / 2, run.width, th);
  }
}
