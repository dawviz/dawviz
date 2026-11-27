// Lưới nốt (NOTE_GRID, D-77, T-139): một widget thay cho Mật độ nốt (DENSITY), Tổng quan bản phối (ARRANGEMENT) và Lưới chấm (DOTS).
// Lưới hàng × thời gian: hàng là track hoặc cao độ, cột là cả bài chia đều hoặc các ô lưới nhịp quanh vạch phát; ô sáng khi có nốt,
// đậm theo mật độ hoặc cường độ; vẽ thành ô đầy, chấm hoặc thanh liền. Hàm thuần của (spec, t, AST, derived) như mọi renderer khác.
// Preset cũ: `legacyGridProps` đổi thuộc tính của ba loại cũ sang lựa chọn tương ứng để hình như trước (bảng ở WIDGET-REVAMP §5b).
import { secToTick, tickToSec } from '@dawviz/parser-core';
import { activeNotes, notesInRange, type TrackIndex } from './notes.ts';
import { base, globalValues, shown, typo, withLocals } from './hud.ts';
import { noteNameFor } from './naming.ts';
import { pitchName } from './music.ts';
import { poly, type Primitive, type RectPrim, type WidgetRenderer } from './prims.ts';
import { templateSpans, type TextRef } from './typography.ts';

const ts = (styleId: string): TextRef => ({ styleId });
const rect = (x: number, y: number, w: number, h: number, fill: string, alpha = 1, radius = 0): RectPrim =>
  ({ kind: 'rect', x, y, w, h, fill, alpha, radius: Math.max(0, Math.min(radius, h / 2, w / 2)), glowColor: '', glowBlur: 0, stroke: '', strokeWidth: 0 });
const outline = (x: number, y: number, w: number, h: number, color: string, width: number) =>
  poly([x, y, x + w, y, x + w, y + h, x, y + h], { closed: true, stroke: color, width, alpha: 1 });
const hex = (h: string) => { const n = parseInt(h.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixHex = (a: string, b: string, k: number) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };

export const GRID_ROWS = ['TRACK', 'PITCH'] as const;
export const GRID_SPANS = ['SONG', 'WINDOW'] as const;
export const GRID_LIGHTS = ['NOTES', 'DENSITY', 'VELOCITY'] as const;
export const GRID_SHAPES = ['FILL', 'SQUARE', 'ROUND', 'BAR'] as const;
export const GRID_MARKS = ['LINE', 'COLUMN'] as const;
/** Số ô lưới mỗi nốt tròn khi hiện quanh vạch phát: 16 = mỗi cột một móc kép. */
export const GRID_STEPS = [4, 8, 16, 32] as const;
export type GridRows = typeof GRID_ROWS[number];
export type GridSpan = typeof GRID_SPANS[number];
export type GridLight = typeof GRID_LIGHTS[number];
export type GridShape = typeof GRID_SHAPES[number];
export type GridMark = typeof GRID_MARKS[number];

export interface NoteGridProps {
  /** Hàng theo track (mỗi track một hàng, kể cả trống) hoặc theo cao độ (bỏ nốt trống). */
  rows: GridRows;
  /** Cả bài (`cols` cột chia đều thời lượng, ô sáng khi có nốt bắt đầu trong cột) hoặc quanh vạch phát (mỗi cột một ô lưới nhịp, ô sáng suốt độ dài nốt). */
  span: GridSpan;
  /** Độ đục của ô sáng: có nốt (1), theo số nốt so với ô nhiều nhất của hàng, hoặc theo cường độ lớn nhất; hai cách sau đi từ `minAlpha` tới 1. */
  light: GridLight;
  /** Ô đầy (trừ `cellGap`), chấm vuông/tròn (cỡ `dotSize`), hoặc thanh liền (ô sáng liền nhau cùng màu nối thành thanh). */
  shape: GridShape;
  cols: number;
  /** Quanh vạch phát: số ô mỗi nốt tròn và vị trí cột vạch phát (0–1). */
  grid: number; playheadRatio: number;
  /** Hàng theo cao độ: dải cao độ (theo nốt có trong track hoặc tự đặt). */
  pitchRangeMode: 'FIT_CONTENT' | 'CUSTOM'; pitchMin: number; pitchMax: number;
  /** Số hàng tối đa: track thừa bị bỏ; dải cao độ rộng hơn thì nhiều cao độ chung một hàng. */
  maxRows: number;
  rowGap: number; cellGap: number; dotSize: number;
  /** Chấm ở cột đang phát to hơn (chấm vuông/tròn). */
  activeScale: number;
  colorMode: 'TRACK' | 'SOLID'; color: string;
  minAlpha: number;
  /** Độ đục nhân thêm cho ô chưa phát. */
  upcomingAlpha: number;
  /** Ô trống: rỗng = màu của hàng; `emptyColorB` cho dải màu trên → dưới. Không vẽ khi `emptyAlpha` = 0. */
  emptyColor: string; emptyColorB: string; emptyAlpha: number;
  /** Cỡ chấm theo cường độ nốt (127 = đủ cỡ, nhỏ nhất co về `velocityMin`). */
  velocitySize: boolean; velocityMin: number;
  /** Quanh vạch phát: vạch mảnh theo phách (đậm hơn ở đầu mỗi 4 phách). */
  beatLines: boolean;
  /** Cột nhãn bên trái lưới: tên track, hoặc tên nốt C khi hàng theo cao độ. */
  rowLabels: boolean; labelStyle: TextRef;
  /** Quanh vạch phát: lưới trôi liên tục từng pixel (như Piano Roll) thay vì nhảy nguyên cột; vạch phát và khung cột đứng yên. */
  smooth: boolean;
  /** Vạch phát: vạch dọc hoặc khung quanh cột đang phát; màu rỗng = không vẽ. */
  playheadMark: GridMark; playheadColor: string; playheadWidth: number;
  /** Dòng chữ phía trên lưới (chỗ giữ `{poly}` = số nốt đang vang). */
  showPolyphony: boolean; polyTemplate: string; polyStyle: TextRef;
}

export const DEFAULT_NOTE_GRID: Readonly<NoteGridProps> = Object.freeze({
  rows: 'TRACK', span: 'SONG', light: 'NOTES', shape: 'FILL', cols: 160, grid: 16, playheadRatio: 0.96,
  pitchRangeMode: 'FIT_CONTENT', pitchMin: 36, pitchMax: 96, maxRows: 32, rowGap: 2, cellGap: 0.5, dotSize: 0.6, activeScale: 1.5,
  colorMode: 'TRACK', color: '#8aa4ff', minAlpha: 0.08, upcomingAlpha: 0.4, emptyColor: '', emptyColorB: '', emptyAlpha: 0,
  velocitySize: false, velocityMin: 0.4, beatLines: false, rowLabels: false, labelStyle: ts('label'),
  smooth: true, playheadMark: 'LINE', playheadColor: '#ffffff', playheadWidth: 2, showPolyphony: false, polyTemplate: 'Voices: {poly}', polyStyle: ts('caption'),
}) as Readonly<NoteGridProps>;

// ───────────────────────────── preset cũ ─────────────────────────────
/** Loại cũ đọc được và đổi thành NOTE_GRID khi đọc preset (lược đồ 0.9.0). */
export const LEGACY_GRID_TYPES = ['DENSITY', 'ARRANGEMENT', 'DOTS'] as const;
export type LegacyGridType = typeof LEGACY_GRID_TYPES[number];
export const isLegacyGridType = (t: unknown): t is LegacyGridType => (LEGACY_GRID_TYPES as readonly unknown[]).includes(t);
type Obj = Record<string, unknown>;
/** Mặc định của ba loại cũ (thuộc tính vắng trong preset cũ lấy từ đây, không từ mặc định của Lưới nốt) và miền cũ của `cols`. */
const LEGACY: Record<LegacyGridType, { d: Obj; cols: [number, number]; set: (P: Obj) => Obj }> = {
  DENSITY: {
    d: { cols: 96, rowGap: 2, cellGap: 1, colorMode: 'TRACK', color: '#8aa4ff', minAlpha: 0.08, playheadColor: '#ffffff', showPolyphony: true, polyTemplate: 'Voices: {poly}', polyStyle: ts('caption') },
    cols: [16, 400],
    // Ô trống vẽ bằng màu track, độ đục bằng nửa minAlpha; không làm mờ phần chưa phát; vạch 1,5 pt.
    set: (P) => ({ rows: 'TRACK', span: 'SONG', light: 'DENSITY', shape: 'FILL', maxRows: 24, upcomingAlpha: 1, emptyColor: '', emptyColorB: '',
      emptyAlpha: (typeof P.minAlpha === 'number' && Number.isFinite(P.minAlpha) ? Math.min(1, Math.max(0, P.minAlpha)) : 0.08) * 0.5, playheadMark: 'LINE', playheadWidth: 1.5,
      activeScale: 1, velocitySize: false, beatLines: false, rowLabels: false }),
  },
  ARRANGEMENT: {
    d: { cols: 160, rowGap: 2, colorMode: 'TRACK', color: '#8aa4ff', upcomingAlpha: 0.4, playheadColor: '#ffffff', playheadWidth: 2 },
    cols: [16, 600],
    set: () => ({ rows: 'TRACK', span: 'SONG', light: 'NOTES', shape: 'FILL', maxRows: 32, cellGap: 0.5, emptyColor: '', emptyColorB: '', emptyAlpha: 0, playheadMark: 'LINE',
      showPolyphony: false, activeScale: 1, velocitySize: false, beatLines: false, rowLabels: false }),
  },
  DOTS: {
    d: { grid: 16, cols: 64, playheadRatio: 0.96, pitchRangeMode: 'FIT_CONTENT', pitchMin: 36, pitchMax: 96, maxRows: 32, dotSize: 0.6, shape: 'ROUND',
      emptyColor: '#c7a3bb', emptyColorB: '#8fd3cb', emptyAlpha: 0.45, colorMode: 'SOLID', color: '#ff3d8b', upcomingAlpha: 0.3, activeScale: 1.5,
      playheadColor: '#333344', playheadWidth: 1.5, velocitySize: false, velocityMin: 0.4, beatLines: false, rowLabels: false, labelStyle: ts('label') },
    cols: [8, 256],
    set: () => ({ rows: 'PITCH', span: 'WINDOW', light: 'NOTES', smooth: false, rowGap: 0, cellGap: 0, playheadMark: 'COLUMN', showPolyphony: false }),
  },
};
/** Thuộc tính thô của một widget loại cũ → thuộc tính thô của NOTE_GRID (còn qua bộ kiểm). Chỉ lấy các khoá loại cũ có; khoá vắng lấy mặc định cũ. */
export function legacyGridProps(type: LegacyGridType, raw: unknown): Obj {
  const L = LEGACY[type], R = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Obj : {}, P: Obj = {};
  for (const k of Object.keys(L.d)) P[k] = R[k] !== undefined ? R[k] : L.d[k];
  if (typeof P.cols === 'number' && Number.isFinite(P.cols)) P.cols = Math.min(L.cols[1], Math.max(L.cols[0], P.cols));
  return { ...P, ...L.set(P) };
}

// ───────────────────────────── vẽ ─────────────────────────────
/** Dải cao độ khi hàng theo cao độ: theo nốt có trong các track (bỏ trống) hoặc tự đặt. */
export function gridPitchRange(p: Pick<NoteGridProps, 'pitchRangeMode' | 'pitchMin' | 'pitchMax'>, tracks: readonly TrackIndex[]): [number, number] {
  if (p.pitchRangeMode === 'CUSTOM') return [Math.min(p.pitchMin, p.pitchMax), Math.max(p.pitchMin, p.pitchMax)];
  let lo = 127, hi = 0;
  for (const ti of tracks) for (const n of ti.notes) { if (n.channel === 9) continue; if (n.pitch < lo) lo = n.pitch; if (n.pitch > hi) hi = n.pitch; }
  return lo > hi ? [48, 72] : [lo, hi];
}
/** Trần số ô mỗi khung (cột × hàng) để lưới dày không làm chậm khung hình: quanh vạch phát / cả bài. */
export const MAX_GRID_CELLS = { WINDOW: 6000, SONG: 19200 } as const;

export const noteGridRenderer: WidgetRenderer<NoteGridProps> = {
  type: 'NOTE_GRID',
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, { width: W, height: H } = spec.layout, out: Primitive[] = [], T = typo(textStyles, measure, fonts), lst = T.style(p.labelStyle, 'label');
    const byPitch = p.rows === 'PITCH', win = p.span === 'WINDOW', dur = derived.index.duration;
    const list = byPitch ? shown(tracks).filter((ti) => ti.notes.some((n) => n.channel !== 9)) : shown(tracks).slice(0, Math.max(1, Math.round(p.maxRows)));
    let top = 0;
    if (p.showPolyphony) {
      const st = T.style(p.polyStyle, 'caption'); let voices = 0; for (const ti of list) voices += activeNotes(ti, t).length;
      T.text(out, templateSpans(p.polyTemplate, withLocals(globalValues({ ast, derived, tracks }, t), { poly: voices })), 0, base(st.size), st, 'left', W); top = st.size * 1.6;
    }
    if (win ? !byPitch && !list.length : !list.length || dur <= 0) return out;
    // Hàng
    let rows = list.length, lo = 0, hi = 0, rows0 = 1;
    if (byPitch) { [lo, hi] = gridPitchRange(p, list); rows0 = hi - lo + 1; rows = Math.max(1, Math.min(rows0, Math.round(p.maxRows))); }
    const rowOf = (pitch: number) => Math.min(rows - 1, Math.floor((hi - pitch) * rows / rows0));
    const cap = MAX_GRID_CELLS[p.span], cols = win ? Math.max(4, Math.min(Math.round(p.cols), Math.floor(cap / Math.max(1, rows)))) : Math.max(1, Math.min(Math.round(p.cols), Math.floor(cap / Math.max(1, rows))));
    const gx = !p.rowLabels ? 0 : byPitch ? Math.round(lst.size * 2.8) : Math.min(Math.round(W * 0.4), Math.ceil(Math.max(0, ...list.map((ti) => T.width(ti.track.name, lst)))) + 8);
    const cw = (W - gx) / cols, rh = Math.max(1, (H - top - p.rowGap * (rows - 1)) / rows), rowY = (r: number) => top + r * (rh + p.rowGap);
    // Ô: 0 trống, 1 có nốt đã/đang phát, 2 có nốt chưa phát; số nốt, cường độ lớn nhất, màu.
    const sm = win && p.smooth, nc = sm ? cols + 1 : cols; // cột thừa ở mép phải để lấp chỗ trống khi trôi
    const N = rows * nc, state = new Int8Array(N), cnt = new Int32Array(N), vel = new Uint8Array(N), color: string[] = new Array(N);
    const colorOf = (ti: TrackIndex) => (p.colorMode === 'TRACK' ? ti.track.color : p.color);
    let cur: number, s0 = 0, nowStep = 0, off = 0;
    if (win) {
      const ppq = ast.meta.internalPPQ || 960, stepT = ppq * 4 / Math.max(1, p.grid), map = ast.tempoMap as never;
      nowStep = secToTick(map, Math.max(0, t)) / stepT;
      cur = Math.min(cols - 1, Math.max(0, Math.round(p.playheadRatio * cols))); s0 = Math.floor(nowStep) - cur; // cột vạch phát cố định
      if (sm) off = nowStep - Math.floor(nowStep); // trôi mượt: dời lưới sang trái một phần cột
      const t0 = tickToSec(map, Math.max(0, s0 * stepT)), t1 = tickToSec(map, Math.max(0, (s0 + nc) * stepT)), now = Math.floor(nowStep);
      list.forEach((ti, ri) => {
        for (const n of notesInRange(ti, t0, t1)) {
          if (byPitch && (n.channel === 9 || n.pitch < lo || n.pitch > hi)) continue;
          const a = Math.max(0, Math.floor(n.startTick / stepT) - s0), b = Math.min(nc - 1, Math.ceil(n.endTick / stepT) - 1 - s0), r = byPitch ? rowOf(n.pitch) : ri;
          for (let c = a; c <= b; c++) {
            const i = r * nc + c; cnt[i]++; vel[i] = Math.max(vel[i], n.velocity);
            if (state[i] !== 1) { state[i] = s0 + c <= now ? 1 : 2; color[i] = colorOf(ti); }
          }
        }
      });
    } else {
      // Cột c gồm các nốt bắt đầu trong ((c/cols)·dur − ε, ((c+1)/cols)·dur − ε]: đúng cách đếm của hai widget cũ.
      const edge = (c: number) => (c / cols) * dur - 1e-9, played = t / dur * cols;
      cur = Math.min(cols - 1, Math.max(0, Math.floor(played)));
      const colOf = (s: number) => {
        if (!(s > edge(0)) || !(s <= edge(cols))) return -1;
        let c = Math.min(cols - 1, Math.max(0, Math.ceil((s + 1e-9) * cols / dur) - 1));
        while (c > 0 && s <= edge(c)) c--;
        while (c < cols - 1 && s > edge(c + 1)) c++;
        return c;
      };
      list.forEach((ti, ri) => {
        for (const n of ti.notes) {
          if (byPitch && (n.channel === 9 || n.pitch < lo || n.pitch > hi)) continue;
          const c = colOf(n.startTimeSeconds); if (c < 0) continue;
          const i = (byPitch ? rowOf(n.pitch) : ri) * cols + c; cnt[i]++; vel[i] = Math.max(vel[i], n.velocity);
          if (!state[i]) { state[i] = c + 1 <= played ? 1 : 2; color[i] = colorOf(ti); }
        }
      });
    }
    if (win && p.beatLines && cw >= 2) {
      const per = Math.max(1, p.grid / 4), mod = (n: number, m: number) => ((n % m) + m) % m;
      for (let c = 0; c <= nc; c++) {
        const s = s0 + c; if (mod(s, per) !== 0) continue;
        const bx = gx + (c - off) * cw; if (bx < gx || bx > W) continue;
        out.push(rect(bx - 0.4, top, 0.8, H - top, p.emptyColor || '#888888', mod(s, p.grid) === 0 ? 0.55 : 0.25));
      }
    }
    if (p.rowLabels) {
      if (byPitch) {
        for (let r = 0; r < rows; r++) {
          const hiR = hi - Math.floor(r * rows0 / rows), loR = hi - Math.floor((r + 1) * rows0 / rows) + 1, c0 = hiR - (((hiR % 12) + 12) % 12);
          if (c0 < loR || c0 < 0) continue;
          T.text(out, derived.naming ? noteNameFor(c0, derived.naming) : pitchName(c0), gx - 5, rowY(r) + rh / 2 + lst.size * 0.35, lst, 'right', Math.max(1, gx - 5), 1);
        }
      } else list.forEach((ti, r) => T.text(out, ti.track.name, gx - 5, rowY(r) + rh / 2 + lst.size * 0.35, lst, 'right', Math.max(1, gx - 5), 1));
    }
    // Trôi mượt: ô nhô ra ngoài vùng lưới [gx, W] bị cắt thay vì tràn (không có vùng cắt trong primitive).
    const clipX = (x: number, w: number): [number, number] | null => { const a = Math.max(x, gx), b = Math.min(x + w, W); return b - a > 0.01 ? [a, b - a] : null; };
    const dot = p.shape === 'SQUARE' || p.shape === 'ROUND', round = p.shape === 'ROUND';
    const d = Math.max(0.5, Math.min(cw, rh) * Math.min(1, Math.max(0.05, p.dotSize))), bh = Math.max(0.5, rh * Math.min(1, Math.max(0.05, p.dotSize)));
    for (let r = 0; r < rows; r++) {
      const y = rowY(r), rowColor = byPitch ? p.color : colorOf(list[r]);
      const empty = !p.emptyColor ? rowColor : p.emptyColorB ? mixHex(p.emptyColor, p.emptyColorB, rows > 1 ? r / (rows - 1) : 0) : p.emptyColor;
      let mx = 0; if (p.light === 'DENSITY') for (let c = 0; c < nc; c++) mx = Math.max(mx, cnt[r * nc + c]);
      const fillOf = (i: number) => (state[i] ? color[i] : empty);
      const alphaOf = (i: number) => {
        const v = state[i]; if (!v) return p.emptyAlpha;
        const a = p.light === 'NOTES' ? 1 : p.minAlpha + (1 - p.minAlpha) * (p.light === 'DENSITY' ? cnt[i] / Math.max(1, mx) : Math.min(1, vel[i] / 127));
        return v === 2 ? a * p.upcomingAlpha : a;
      };
      for (let c = 0; c < nc; c++) {
        const i = r * nc + c, v = state[i];
        if (v === 0 && p.emptyAlpha <= 0) continue;
        if (p.shape === 'FILL') { const q = clipX(gx + (c - off) * cw, Math.max(0.5, cw - p.cellGap)); if (q) out.push(rect(q[0], y, q[1], rh, fillOf(i), alphaOf(i))); continue; }
        if (dot) {
          const cx = gx + (c - off) * cw + cw / 2, cy = y + rh / 2;
          if (sm && (cx < gx || cx > W)) continue;
          const k = v !== 0 && c === cur ? p.activeScale : 1, s = d * k * (p.velocitySize && v ? p.velocityMin + (1 - p.velocityMin) * Math.min(1, vel[i] / 127) : 1);
          out.push(rect(cx - s / 2, cy - s / 2, s, s, fillOf(i), alphaOf(i), round ? s / 2 : 0));
          continue;
        }
        // Thanh liền: gom các ô liền nhau cùng màu, cùng độ đục.
        const f = fillOf(i), a = alphaOf(i); let c1 = c;
        while (c1 + 1 < nc) { const j = i + (c1 + 1 - c); if ((state[j] === 0 && p.emptyAlpha <= 0) || fillOf(j) !== f || alphaOf(j) !== a) break; c1++; }
        const q = clipX(gx + (c - off) * cw, Math.max(0.5, (c1 - c + 1) * cw - p.cellGap));
        if (q) out.push(rect(q[0], y + (rh - bh) / 2, q[1], bh, f, a, Math.min(bh / 2, Math.max(1, cw)))); // bo theo cỡ cột: hàng cao không thành viên thuốc
        c = c1;
      }
    }
    if (p.playheadColor && p.playheadWidth > 0) {
      const pw = p.playheadWidth;
      if (p.playheadMark === 'COLUMN') { const x = gx + cur * cw, hw = pw / 2; out.push(outline(x + hw, top + hw, Math.max(1, cw - pw), H - top - pw, p.playheadColor, pw)); }
      else { const pos = win ? gx + (sm ? cur : nowStep - s0) * cw : gx + (t / dur) * (W - gx); out.push(rect(Math.min(W - pw, pos), top, pw, H - top, p.playheadColor, 0.95)); }
    }
    return out;
  },
};
