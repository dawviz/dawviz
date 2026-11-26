// Bố cục Piano Roll thuần (không vẽ): trả danh sách hình chữ nhật theo pixel. Cùng đầu vào → cùng đầu ra ở Preview và Export.
import { notesInRange, type TimelineIndex } from './notes.ts';
import { trackBrightness, DEFAULT_BRIGHTNESS, type BrightnessConfig } from './brightness.ts';
import type { TempoPoint } from './types.ts';
import { glowAmount } from './glow.ts';
import { noteFxAt, applyNoteFx, type NoteTransitionSpec } from './noteTransition.ts';
import type { RectPrim, TextPrim } from './prims.ts';
import { resolveNoteStyle, noteColor, noteState, stateColor, shade, DEFAULT_KEYBOARD_STYLE, type StyleConfig, type KeyboardStyle } from './style.ts';

export interface PianoRollOptions {
  width: number; height: number;
  windowSeconds: number;       // độ dài cửa sổ nhìn
  playheadRatio: number;       // vị trí playhead trong cửa sổ, 0..1
  pitchMin: number; pitchMax: number; // đóng cả hai đầu
  brightness?: Record<string, BrightnessConfig>; // theo track.id; thiếu thì dùng mặc định
  style?: StyleConfig;         // kiểu dáng nốt; thiếu thì dùng mặc định
  left?: number;               // chừa bên trái (px) cho bàn phím; vùng cuộn nốt là [left, width]
  /** Chế độ trang: cửa sổ nhìn bắt đầu đúng tại đây (giây) và KHÔNG trượt theo t; nốt cắt theo biên trang. `playheadRatio` bị bỏ qua. */
  pageStart?: number;
  /** Chế độ trang: chỉ hiện nốt đã phát hoặc sẽ bắt đầu trong `revealAhead` giây tới (nốt xa hơn chưa hiện). Vắng/0 = hiện cả trang. */
  revealAhead?: number;
  /** Chuyển cảnh nốt bốn pha (T-18). `beatPhase`: 0..1 trong nhịp tại t, cho pha kêu. Vắng = không biến đổi. */
  transition?: { spec: NoteTransitionSpec; beatPhase: number };
}
export interface NoteRect { id: string; trackId: string; x: number; y: number; w: number; h: number; color: string; brightness: number; active: boolean; velocity: number; /** giây bắt đầu của nốt */ start?: number;
  pitch: number; opacity: number; radius: number; glow: number; glowRadius: number; borderWidth: number; borderColor: string }

export function layoutPianoRoll(index: TimelineIndex, tempoMap: TempoPoint[], t: number, o: PianoRollOptions): NoteRect[] {
  const paged = o.pageStart !== undefined;
  const t0 = paged ? o.pageStart! : t - o.windowSeconds * o.playheadRatio, t1 = t0 + o.windowSeconds;
  const left = o.left ?? 0, pxPerSec = (o.width - left) / o.windowSeconds;
  const rows = o.pitchMax - o.pitchMin + 1, rowH = o.height / rows;
  const rects: NoteRect[] = [];
  // D-56: thứ tự track = thứ tự ưu tiên hiển thị, tracks[0] (trên cùng danh sách) nằm trên cùng → vẽ từ track cuối lên track đầu.
  for (let k = index.tracks.length - 1; k >= 0; k--) {
    const ti = index.tracks[k];
    if (!ti.track.isVisible) continue;
    const cfg = o.brightness?.[ti.track.id] ?? DEFAULT_BRIGHTNESS;
    for (const n of notesInRange(ti, t0, t1)) {
      if (n.pitch < o.pitchMin || n.pitch > o.pitchMax) continue;
      if (paged && n.startTimeSeconds >= t1) continue; // nốt bắt đầu đúng biên trang thuộc trang sau
      if (paged && o.revealAhead !== undefined && n.startTimeSeconds > t + o.revealAhead) continue; // chưa tới lúc hiện
      const st = resolveNoteStyle(o.style, ti.track.id);
      const s0 = paged ? Math.max(n.startTimeSeconds, t0) : n.startTimeSeconds, e0 = paged ? Math.min(n.endTimeSeconds, t1) : n.endTimeSeconds; // chế độ trang: cắt theo biên trang
      const x = left + (s0 - t0) * pxPerSec, h = Math.max(1, rowH * st.heightScale);
      const active = n.startTimeSeconds <= t && t < n.endTimeSeconds;
      const color = stateColor(st, noteState(n.startTimeSeconds, n.endTimeSeconds, t), noteColor(st, ti.track.color, n.pitch, n.velocity, [o.pitchMin, o.pitchMax])), w = Math.max(1, (e0 - s0) * pxPerSec);
      const rect: NoteRect = {
        id: n.id, trackId: ti.track.id, x, w, y: (o.pitchMax - n.pitch) * rowH + (rowH - h) / 2, h, color,
        brightness: trackBrightness(ti.track, tempoMap, Math.max(0, n.startTimeSeconds), cfg),
        active, velocity: n.velocity, pitch: n.pitch, start: n.startTimeSeconds,
        opacity: st.opacity * (active ? 1 : st.inactiveOpacity), radius: Math.min(st.cornerRadius, h / 2, w / 2),
        glow: st.glow > 0 ? st.glow * glowAmount(st, { track: ti.track, note: n, t, tempoMap, pitchMin: o.pitchMin, pitchMax: o.pitchMax }) : 0, glowRadius: st.glowRadius,
        borderWidth: st.borderWidth, borderColor: st.borderColor || shade(color, 0.45),
      };
      if (o.transition) { const { fx, morph } = noteFxAt(o.transition.spec, n.startTimeSeconds, n.endTimeSeconds, t, o.transition.beatPhase); rects.push(applyNoteFx(rect, fx, morph)); } else rects.push(rect);
    }
  }
  // T-71: nốt đang phát vẽ sau cùng (nằm trên nốt đã phát và nốt chưa phát chồng lên nó); giữ thứ tự ổn định trong mỗi nhóm.
  return [...rects.filter((r) => !r.active), ...rects.filter((r) => r.active)];
}

// ---- Bàn phím piano (widget): cùng trục cao độ với Piano Roll, phím sáng màu track khi có nốt đang phát.
const BLACK = new Set([1, 3, 6, 8, 10]);
export interface KeyRect { pitch: number; x: number; y: number; w: number; h: number; black: boolean; active: boolean; color: string }
/** `reach`: bề dài thật của dải phím tính từ mép xa (T-59: làn xoay kéo dài bàn phím ra mép làn); phần phím trắng ở đầu gần vạch phát giữ 38% `width`. Vắng = `width`. */
export function layoutKeyboard(index: TimelineIndex, t: number, o: { height: number; pitchMin: number; pitchMax: number; style?: Partial<KeyboardStyle>; noteStyle?: StyleConfig; reach?: number }): KeyRect[] {
  const ks = { ...DEFAULT_KEYBOARD_STYLE, ...(o.style ?? {}) };
  const rows = o.pitchMax - o.pitchMin + 1, rowH = o.height / rows, activeBy = new Map<number, string>();
  for (const ti of index.tracks) { // D-56: hai track cùng phím → màu của track đứng trước (ưu tiên cao hơn)
    if (!ti.track.isVisible) continue;
    const st = resolveNoteStyle(o.noteStyle, ti.track.id);
    for (const n of notesInRange(ti, t, t)) if (n.startTimeSeconds <= t && t < n.endTimeSeconds && n.pitch >= o.pitchMin && n.pitch <= o.pitchMax)
      if (!activeBy.has(n.pitch)) activeBy.set(n.pitch, ks.useTrackColor ? noteColor(st, ti.track.color, n.pitch, n.velocity, [o.pitchMin, o.pitchMax]) : ks.pressedColor);
  }
  const keys: KeyRect[] = [];
  for (let p = o.pitchMin; p <= o.pitchMax; p++) {
    const black = BLACK.has(p % 12), c = activeBy.get(p);
    const reach = o.reach ?? ks.width;
    keys.push({ pitch: p, x: 0, y: (o.pitchMax - p) * rowH, w: black ? (o.reach === undefined ? ks.width * 0.62 : reach - ks.width * 0.38) : reach, h: rowH, black, active: c !== undefined, color: c ?? (black ? ks.blackColor : ks.whiteColor) });
  }
  return keys.sort((a, b) => Number(a.black) - Number(b.black)); // phím đen vẽ sau (nằm trên)
}

// ---- Góc chảy tự do (T-59, REQ-WIDGET-01). Làn nốt dựng trong hệ toạ độ riêng (u: thời gian, tương lai về +u; v: cao độ, cao ở v = 0) như
// Piano Roll ngang thường, rồi xoay quanh tâm khung widget. Làn rộng Lw × Lh = hộp bao của khung đã xoay ngược, nên ở mọi góc làn phủ kín khung.
// Góc 0 và không lật: hệ toạ độ làn trùng khung (chuỗi lệnh vẽ giữ như trước T-59).
export interface FlowFrame {
  W: number; H: number; angle: number; mirror: boolean;
  /** Kích thước làn. */ Lw: number; Lh: number;
  /** Bề dài đoạn trục thời gian đi qua tâm và nằm trong khung (thay cho bề rộng widget khi tính tỉ lệ thời gian, vị trí vạch phát). */ span: number;
  /** Bề dài đoạn trục cao độ qua tâm nằm trong khung. */ pitchSpan: number;
  /** u của đầu đoạn `span` trên làn. */ u0: number;
  c: number; s: number; identity: boolean;
}
const QUARTER: readonly [number, number][] = [[1, 0], [0, -1], [-1, 0], [0, 1]]; // (cos φ, sin φ) với φ = −góc, góc bội 90° (tránh sai số cos/sin)
export function flowFrame(W: number, H: number, angle: number, mirror = false): FlowFrame {
  const a = Number.isFinite(angle) ? ((angle % 360) + 360) % 360 : 0, q = a / 90;
  const [c, s] = Number.isInteger(q) ? QUARTER[q % 4] : [Math.cos(-a * Math.PI / 180), Math.sin(-a * Math.PI / 180)];
  const ac = Math.abs(c), as = Math.abs(s);
  const Lw = W * ac + H * as, Lh = W * as + H * ac;
  const span = 2 * Math.min(ac > 1e-12 ? W / 2 / ac : Infinity, as > 1e-12 ? H / 2 / as : Infinity);
  const pitchSpan = 2 * Math.min(as > 1e-12 ? W / 2 / as : Infinity, ac > 1e-12 ? H / 2 / ac : Infinity);
  const identity = a === 0 && !mirror;
  return { W, H, angle: a, mirror, Lw: identity ? W : Lw, Lh: identity ? H : Lh, span: identity ? W : span, pitchSpan: identity ? H : pitchSpan, u0: identity ? 0 : (Lw - span) / 2, c, s, identity };
}
/** Điểm trên làn → điểm trong khung widget. */
export function flowPoint(f: FlowFrame, u: number, v: number): { x: number; y: number } {
  if (f.identity) return { x: u, y: v };
  const du = u - f.Lw / 2, dv = (f.mirror ? f.Lh - v : v) - f.Lh / 2;
  return { x: f.W / 2 + du * f.c - dv * f.s, y: f.H / 2 + du * f.s + dv * f.c };
}
/** Hình chữ nhật trên làn → hình chữ nhật trong khung (góc bội 90°: vẫn thẳng trục, đổi rộng/cao; góc khác: xoay quanh tâm hình). */
export function flowRect(f: FlowFrame, r: RectPrim): RectPrim {
  if (f.identity) return r;
  const m = flowPoint(f, r.x + r.w / 2, r.y + r.h / 2), q = f.angle / 90;
  if (Number.isInteger(q)) { const sw = q % 2 === 1; const w = sw ? r.h : r.w, h = sw ? r.w : r.h; return { ...r, x: m.x - w / 2, y: m.y - h / 2, w, h }; }
  const rot = ((-f.angle % 180) + 180) % 180; // hình chữ nhật đối xứng qua tâm: xoay 180° như không xoay
  return { ...r, x: m.x - r.w / 2, y: m.y - r.h / 2, ...(rot ? { rotation: rot } : {}) };
}
/**
 * Nhãn chữ một dòng đặt theo TÂM (cu, cv) trên làn. `upright`: chữ luôn đứng thẳng (chỉ dời điểm neo); không thì xoay theo làn.
 * Góc 0: căn theo `align` tại `ax` (mép trái/phải hoặc tâm) như bố cục ngang thường.
 */
export function flowLabel(f: FlowFrame, o: { cu: number; cv: number; ax: number; align: 'left' | 'center' | 'right'; text: string; size: number; color: string; alpha: number; font: string; weight: number; maxWidth?: number; upright: boolean }): TextPrim {
  const base = { kind: 'text' as const, text: o.text, font: o.font, size: o.size, weight: o.weight, color: o.color, alpha: o.alpha, ...(o.maxWidth !== undefined ? { maxWidth: o.maxWidth } : {}) };
  const drop = o.size * 0.35; // từ tâm chữ xuống baseline
  if (f.identity) return { ...base, x: o.ax, y: o.cv + drop, align: o.align };
  if (o.upright) { const m = flowPoint(f, o.cu, o.cv); return { ...base, x: m.x, y: m.y + drop, align: 'center' }; }
  const m = flowPoint(f, o.cu, f.mirror ? o.cv - drop : o.cv + drop), rot = -f.angle;
  return { ...base, x: m.x, y: m.y, align: 'center', ...(rot % 360 ? { rotation: rot } : {}) };
}
