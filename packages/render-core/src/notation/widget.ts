// Widget Bản nhạc (REQ-WIDGET-09, D-63): vẽ NotationLayout đã dựng sẵn theo t. Không lượng tử hoá, không VexFlow ở đây:
// bản dựng nằm trong Derived.notation (engraver chạy ngoài Render Core). Thiếu bản dựng (đang dựng) thì widget không vẽ gì.
import type { LayoutCtx, PathPrim, Primitive, RectPrim, WidgetRenderer } from '../prims.ts';
import type { WidgetSpec } from '../scene.ts';
import { PATH_ARGS, pageIndexAt, systemX, type NotationItem, type NotationLayout, type NotationOwner, type PathData } from './types.ts';
import { barPosAt, barStartSec, buildBarGrid, type BarGrid } from '../hud.ts';
import { hashSigned } from './draw.ts';
import type { UnifiedProjectAST } from '../types.ts';

const grids = new WeakMap<object, BarGrid>();
/** Lưới ô nhịp khi Derived chưa có HUD (ví dụ test): dựng một lần cho mỗi AST. */
const gridOf = (ast: UnifiedProjectAST): BarGrid => grids.get(ast) ?? grids.set(ast, buildBarGrid(ast.tempoMap, ast.meta.internalPPQ || 960)).get(ast)!;

export interface NotationProps {
  // ── ảnh hưởng bản dựng (đổi thì dựng lại) ──
  /** Nốt ngắn nhất: 8, 16, 32. */
  division: 8 | 16 | 32;
  /** Cho phép tam liên theo phách. */
  triplets: boolean;
  /** Ưu tiên nhịp đơn giản (0,5–4; lớn hơn = ít nốt lẻ, sai số lớn hơn). */
  simplify: number;
  /** Chia hai tay: nốt từ cao độ này trở lên ở khuông Sol (MIDI, mặc định 60 = C4). */
  splitPitch: number;
  /** Số giọng mỗi khuông. */
  voices: 1 | 2;
  /** Giọng: AUTO = ước lượng; MANUAL = keyFifths/keyMode. */
  keyMode: 'AUTO' | 'MANUAL'; keyFifths: number; keyMinor: boolean;
  /** Cách bày: PAGES = lật từng trang (mặc định); SCROLL = cả bài là một hàng dài cuộn ngang qua vạch phát cố định. */
  layoutMode: 'PAGES' | 'SCROLL';
  /** Chỉ SCROLL: vị trí vạch phát trên bề rộng widget (0,05–0,95). */
  scrollAnchor: number;
  /** Số ô mỗi hàng (0 = tự dàn theo bề rộng) và số hàng mỗi trang (chỉ PAGES). */
  barsPerSystem: number; systemsPerPage: number;
  /** Phông nhạc: chuẩn in (Bravura), viết tay (Petaluma), nét mảnh cổ (Gonville). */
  musicFont: 'BRAVURA' | 'PETALUMA' | 'GONVILLE';
  measureNumbers: boolean; tempoMark: boolean;
  /** Cỡ số ô nhịp (1 = mặc định, nhỏ). */
  measureNumberSize: number;
  // ── chỉ ảnh hưởng hình vẽ ──
  /** Màu mực (nốt sắp tới và phần tĩnh), nốt đã qua, nốt đang ngân. TRACK = nốt đang ngân theo màu track. */
  inkColor: string; playedColor: string; activeColor: string; colorMode: 'SOLID' | 'TRACK';
  upcomingOpacity: number; playedOpacity: number;
  /** Độ đục khuông, khoá, số ô, dấu nối và các nét tĩnh khác; độ đục chung nhân cho cả bản nhạc (nốt, quầng sáng, vạch phát). */
  staticOpacity: number; opacity: number;
  /** Phóng to khi vào nốt: PULSE = nhấp rồi về, HOLD = giữ trong lúc ngân. */
  zoom: number; zoomMode: 'PULSE' | 'HOLD'; zoomMs: number;
  /** Quầng sáng quanh nốt đang ngân (0–1) và độ rộng (đơn vị dòng kẻ/10). SOFT = mờ mềm (chậm hơn trên Firefox). */
  glow: number; glowSize: number; glowMode: 'HALO' | 'SOFT';
  playhead: 'NONE' | 'LINE'; playheadColor: string; playheadWidth: number;
  /** Nét tay: độ rung (0 = tắt), số lần đổi nét mỗi giây (0 = rung cố định), hạt giống. */
  rough: number; boilFps: number; seed: number;
  /** Căn trang trong khung và thời gian mờ dần khi sang trang (ms). */
  align: 'TOP' | 'CENTER'; pageFadeMs: number;
  /**
   * Sáng cả bản nhạc (quầng quanh mọi nét, kể cả dòng kẻ): OFF; STEADY = luôn sáng; BEAT / BAR = lặp theo phách / ô nhịp của bài;
   * TIME = lặp theo giây. auraEvery = lặp mỗi bao nhiêu phách / ô / giây. auraShape: SMOOTH = thở (lên xuống êm, sáng nhất ở đầu chu kỳ),
   * FLASH = loé rồi tắt dần, BLINK = bật nửa đầu, tắt nửa sau. auraGlow = độ sáng lúc sáng nhất, auraMin = mức thấp nhất (phần của auraGlow).
   * auraColor '' = mỗi nét sáng theo màu của nó. Luôn vẽ kiểu Quầng (Mềm trên cả trang quá chậm).
   */
  aura: 'OFF' | 'STEADY' | 'BEAT' | 'BAR' | 'TIME'; auraShape: 'SMOOTH' | 'FLASH' | 'BLINK'; auraEvery: number;
  auraGlow: number; auraMin: number; auraColor: string;
  /**
   * Viết tay từng nốt (T-132): NONE = mọi nốt hiện sẵn; WRITE = mỗi phần tử gắn với nốt (đầu nốt, thân, cờ, dấu hoá, chấm, dấu lặng, gạch nối móc,
   * dấu nối) chưa tới lượt thì không vẽ, tới lượt thì lộ dần từ trái sang phải trên hộp bao của nó trong writeMs, bắt đầu sớm nửa writeMs trước khi nốt vang.
   * Khuông, khoá, hoá biểu, vạch nhịp, số ô nhịp vẽ như cũ.
   */
  reveal: 'NONE' | 'WRITE'; writeMs: number;
  /**
   * Xoá nốt (T-132): NONE; AFTER = mọi nốt bị xoá sau eraseAfterBars ô nhịp kể từ khi kết thúc; RANDOM = như AFTER nhưng chỉ một phần eraseAmount (0–1)
   * số nốt, chọn bằng băm tất định (id nốt + eraseSeed). eraseMs = thời gian xoá; FADE = mờ dần, WIPE = lau từ phải sang trái.
   */
  erase: 'NONE' | 'AFTER' | 'RANDOM'; eraseAfterBars: number; eraseAmount: number; eraseMs: number; eraseStyle: 'FADE' | 'WIPE'; eraseSeed: number;
}

export const DEFAULT_NOTATION: Readonly<NotationProps> = Object.freeze({
  division: 16, triplets: true, simplify: 1, splitPitch: 60, voices: 2, keyMode: 'AUTO', keyFifths: 0, keyMinor: false,
  layoutMode: 'PAGES', scrollAnchor: 0.3, barsPerSystem: 2, systemsPerPage: 1, musicFont: 'BRAVURA', measureNumbers: true, tempoMark: true, measureNumberSize: 1,
  inkColor: '#e8ecf4', playedColor: '#8a93a8', activeColor: '#ffb347', colorMode: 'SOLID', upcomingOpacity: 1, playedOpacity: 0.7, staticOpacity: 1, opacity: 1,
  zoom: 1.35, zoomMode: 'PULSE', zoomMs: 350, glow: 0.6, glowSize: 2.5, glowMode: 'HALO',
  playhead: 'NONE', playheadColor: '#ffb347', playheadWidth: 2, rough: 0, boilFps: 0, seed: 1, align: 'CENTER', pageFadeMs: 250,
  aura: 'OFF', auraShape: 'SMOOTH', auraEvery: 1, auraGlow: 0.5, auraMin: 0, auraColor: '',
  reveal: 'NONE', writeMs: 250, erase: 'NONE', eraseAfterBars: 1, eraseAmount: 0.5, eraseMs: 400, eraseStyle: 'FADE', eraseSeed: 1,
});

/**
 * Màu mực hợp với nền khung: nền sáng (độ sáng tương đối > 0,5) dùng mực tối, nền tối dùng mực sáng. Dùng khi thêm widget.
 * Nền sáng thì "sáng cả bản nhạc" dùng màu nốt đang phát (quầng theo mực tối trông như nét nhoè, không phải phát sáng).
 */
export function notationInkFor(background: string): Pick<NotationProps, 'inkColor' | 'playedColor' | 'auraColor'> {
  const m = /^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/i.exec(background); // alpha (#rrggbbaa) không đổi độ sáng của nền
  const n = m ? parseInt(m[1], 16) : 0, lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return L > 0.5 ? { inkColor: '#16181d', playedColor: '#8a909c', auraColor: DEFAULT_NOTATION.activeColor }
    : { inkColor: DEFAULT_NOTATION.inkColor, playedColor: DEFAULT_NOTATION.playedColor, auraColor: DEFAULT_NOTATION.auraColor };
}

/** Thuộc tính ảnh hưởng bản dựng: đổi một trong số này thì phải engrave lại (khoá đệm). */
export const NOTATION_ENGRAVE_KEYS = ['division', 'triplets', 'simplify', 'splitPitch', 'voices', 'keyMode', 'keyFifths', 'keyMinor', 'layoutMode', 'barsPerSystem', 'systemsPerPage', 'musicFont', 'measureNumbers', 'measureNumberSize', 'tempoMark'] as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (x: number) => { const k = clamp01(x); return k * k * (3 - 2 * k); };

/** Hệ số phóng to của một chủ tại t (1 = bình thường). */
export function zoomAt(p: Pick<NotationProps, 'zoom' | 'zoomMode' | 'zoomMs'>, head: boolean, on: number, off: number, t: number): number {
  if (p.zoom <= 1 || !head || t < on || t >= off) return 1;
  const age = t - on, dur = Math.max(0.001, p.zoomMs / 1000), extra = p.zoom - 1;
  if (p.zoomMode === 'HOLD') {
    const attack = Math.min(0.06, dur), rel = Math.min(dur, Math.max(0, off - on) / 2);
    return 1 + extra * smooth(age / attack) * (1 - smooth((t - (off - rel)) / Math.max(1e-3, rel)));
  }
  return 1 + extra * (1 - smooth(age / dur)) * smooth(age / 0.03);
}

/** Vị trí nhạc liên tục tại t: số phách và số ô nhịp đã qua kể từ đầu bài (có phần lẻ). */
export interface MusicPos { beats: number; bars: number }

/** Độ sáng cả bản nhạc tại t (0 … auraGlow). Thuần theo (props, t, vị trí nhạc); thiếu vị trí nhạc thì BEAT/BAR coi như 120 BPM 4/4. */
export function auraAt(p: Pick<NotationProps, 'aura' | 'auraShape' | 'auraEvery' | 'auraGlow' | 'auraMin'>, t: number, pos?: MusicPos): number {
  if (p.aura === 'OFF' || !(p.auraGlow > 0)) return 0;
  if (p.aura === 'STEADY') return p.auraGlow;
  const every = Math.max(1e-3, p.auraEvery);
  const x = p.aura === 'TIME' ? t : p.aura === 'BEAT' ? pos?.beats ?? t * 2 : pos?.bars ?? t / 2;
  const ph = (((x / every) % 1) + 1) % 1;
  const level = p.auraShape === 'FLASH' ? (Math.exp(-6 * ph) - Math.exp(-6)) / (1 - Math.exp(-6))
    : p.auraShape === 'BLINK' ? smooth(ph / 0.04) * (1 - smooth((ph - 0.5) / 0.04))
    : 0.5 + 0.5 * Math.cos(2 * Math.PI * ph);
  const lo = clamp01(p.auraMin);
  return p.auraGlow * (lo + (1 - lo) * level);
}

/** Phần sớm của writeMs: nốt bắt đầu được viết trước lúc vang nửa writeMs, nên lúc vang đã viết được một nửa. */
export const WRITE_LEAD = 0.5;

/** Mức đã viết của một phần tử thuộc nốt bắt đầu lúc `on` (0 = chưa viết, 1 = đủ). reveal NONE luôn 1. */
export function writeAt(p: Pick<NotationProps, 'reveal' | 'writeMs'>, on: number, t: number): number {
  if (p.reveal !== 'WRITE') return 1;
  const dur = Math.max(0.001, p.writeMs / 1000);
  const w = (t - (on - dur * WRITE_LEAD)) / dur;
  return w >= 1 - 1e-9 ? 1 : clamp01(w); // sai số phẩy động ở cuối không để lại vùng cắt sát mép
}

const ownerKeys = new WeakMap<NotationOwner, number>();
/** Khoá băm của một chủ: theo id nốt đầu (bền khi dàn trang lại), dấu lặng theo chỉ số. FNV-1a 32 bit. */
function ownerKey(o: NotationOwner, index: number): number {
  let k = ownerKeys.get(o);
  if (k === undefined) {
    const s = o.notes.length ? o.notes[0] : 'r' + index;
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193);
    ownerKeys.set(o, (k = h | 0));
  }
  return k;
}

/** Chủ này có bị xoá không: AFTER = mọi chủ; RANDOM = phần eraseAmount số chủ, chọn tất định theo (id nốt, eraseSeed). */
export function erasePicked(p: Pick<NotationProps, 'erase' | 'eraseAmount' | 'eraseSeed'>, o: NotationOwner, index: number): boolean {
  if (p.erase === 'AFTER') return true;
  if (p.erase !== 'RANDOM' || !(p.eraseAmount > 0)) return false;
  return (hashSigned(ownerKey(o, index), p.eraseSeed, 0x5eed, 0x7132) + 1) / 2 < p.eraseAmount;
}

/** Giây sau `n` ô nhịp kể từ `t` (có phần lẻ), theo lưới ô nhịp của bài. */
export function barsAfter(g: BarGrid, t: number, n: number): number {
  const b = barPosAt(g, Math.max(0, t)), x = b.bar - 1 + b.barPhase + n, i = Math.floor(x), s0 = barStartSec(g, i);
  return x === i ? s0 : s0 + (barStartSec(g, i + 1) - s0) * (x - i);
}

/** Mức đã xoá của một chủ kết thúc lúc `off` (0 = còn nguyên, 1 = đã xoá hết). `after` đổi (giây, số ô) → giây; vắng thì coi như 2 giây một ô. */
export function eraseAt(p: Pick<NotationProps, 'eraseAfterBars' | 'eraseMs'>, off: number, t: number, after?: (t: number, bars: number) => number): number {
  const start = after ? after(off, p.eraseAfterBars) : off + p.eraseAfterBars * 2;
  const e = (t - start) / Math.max(0.001, p.eraseMs / 1000);
  return e >= 1 - 1e-9 ? 1 : clamp01(e);
}

const spans = new WeakMap<object, readonly [number, number]>();
/** Khoảng x của một đường (đơn vị của nó): mọi điểm, kể cả điểm điều khiển; cung tròn lấy tâm ± bán kính. */
function pathSpan(d: PathData): [number, number] {
  let x0 = Infinity, x1 = -Infinity;
  const add = (x: number) => { if (x < x0) x0 = x; if (x > x1) x1 = x; };
  for (let i = 0; i < d.length;) {
    const op = d[i], n = PATH_ARGS[op] ?? 0;
    if (op === 5) { add(d[i + 1] - d[i + 3]); add(d[i + 1] + d[i + 3]); }
    else for (let j = 1; j < n; j += 2) add(d[i + j]);
    i += 1 + n;
  }
  return x0 <= x1 ? [x0, x1] : [0, 0];
}
/** Hộp bao theo chiều ngang của một phần tử (đơn vị trang), có lề nhỏ cho bề dày nét. Đệm theo phần tử. */
export function itemSpanX(it: NotationItem, glyphs: readonly PathData[]): readonly [number, number] {
  let s = spans.get(it);
  if (s) return s;
  let x0 = Infinity, x1 = -Infinity;
  if (it.k === 2) {
    const g = it.g ?? [];
    for (let j = 0; j + 3 < g.length; j += 4) {
      const d = glyphs[g[j]] ?? [];
      let gs = spans.get(d);
      if (!gs) spans.set(d, (gs = pathSpan(d)));
      x0 = Math.min(x0, g[j + 1] + gs[0] * g[j + 3]); x1 = Math.max(x1, g[j + 1] + gs[1] * g[j + 3]);
    }
  } else [x0, x1] = pathSpan(it.d ?? []);
  const pad = 1 + (it.k === 1 ? (it.lw ?? 1) / 2 : 0);
  s = x0 <= x1 ? [x0 - pad, x1 + pad] : [0, 0];
  spans.set(it, s);
  return s;
}

/** Trạng thái viết/xoá của một phần tử tại t: null = không vẽ; cut = chỉ vẽ phần x < cut (đơn vị trang); k = hệ số độ đục. */
interface WriteState { cut?: number; k: number }
const FULL: WriteState = Object.freeze({ k: 1 });

/** Phép đặt trang vào khung widget: tỉ lệ theo bề rộng và chiều cao trang lớn nhất (tỉ lệ không đổi khi lật trang). */
export function notationFit(lay: NotationLayout, W: number, H: number, pageH: number, align: NotationProps['align']) {
  const s = Math.min(W / lay.width, H / Math.max(1, lay.maxHeight));
  const tx = (W - lay.width * s) / 2, ty = align === 'TOP' ? 0 : (H - pageH * s) / 2;
  return { s, tx, ty };
}

/**
 * Primitive của một khung: mỗi phần tử của trang hiện tại thành một PathPrim (màu theo trạng thái nốt), nốt đang ngân vẽ đè
 * sau cùng (phóng to + quầng sáng), cuối cùng là vạch phát. Thuần theo (layout, props, t).
 */
export function notationPrims(lay: NotationLayout, p: NotationProps, W: number, H: number, t: number, trackColor: (track: number) => string | undefined, pos?: MusicPos,
  after?: (t: number, bars: number) => number): Primitive[] {
  const out: Primitive[] = [];
  const scroll = p.layoutMode === 'SCROLL';
  const pi = scroll ? (lay.pages.length ? 0 : -1) : pageIndexAt(lay, t);
  if (pi < 0) return out;
  const page = lay.pages[pi];
  let { s, tx, ty } = notationFit(lay, W, H, page.height, p.align);
  // Cuộn: tỉ lệ theo chiều cao, vạch phát đứng yên ở scrollAnchor, bản nhạc trượt ngang; chỉ phần tử trong khung nhìn được vẽ.
  let vis0 = -Infinity, vis1 = Infinity;
  if (scroll) {
    s = H / Math.max(1, lay.maxHeight); ty = p.align === 'TOP' ? 0 : (H - page.height * s) / 2;
    tx = W * p.scrollAnchor - (page.systems[0] ? systemX(page.systems[0], t) : 0) * s;
    vis0 = (-tx) / s - 30; vis1 = (W - tx) / s + 30;
  }
  const inView = (it: NotationItem) => { if (!scroll) return true; const [a, b] = itemSpanX(it, lay.glyphs); return b >= vis0 && a <= vis1; };
  const fade = (!scroll && p.pageFadeMs > 0 && pi > 0 ? smooth((t - page.start) / (p.pageFadeMs / 1000)) : 1) * p.opacity;
  if (fade <= 0.004) return out;
  const rough = p.rough > 0 ? { amp: p.rough, step: p.boilFps > 0 ? Math.floor(Math.max(0, t) * p.boilFps) : 0, seed: p.seed } : undefined;
  const aura = auraAt(p, t, pos);
  const auraOf = (color: string): PathPrim['glow'] => (aura > 0.004 && p.glowSize > 0 ? { mode: 'HALO', color: p.auraColor || color, width: p.glowSize, alpha: aura } : undefined);
  // Viết tay / xoá (T-132): thuần theo t, nên tua tới hay lui đều cho cùng hình.
  const timed = p.reveal === 'WRITE' || p.erase === 'AFTER' || p.erase === 'RANDOM';
  const stateOf = (it: NotationItem): WriteState | null => {
    const wi = it.o >= 0 ? it.o : it.w ?? -1, o = wi >= 0 ? lay.owners[wi] : undefined;
    if (!o) return FULL;
    let cut = Infinity, k = 1;
    const w = writeAt(p, o.on, t);
    if (w <= 0) return null;
    if (w < 1) { const [x0, x1] = itemSpanX(it, lay.glyphs); cut = x0 + (x1 - x0) * w; }
    if (p.erase !== 'NONE' && erasePicked(p, o, wi)) {
      const e = eraseAt(p, o.off, t, after);
      if (e >= 1) return null;
      if (e > 0) {
        if (p.eraseStyle === 'WIPE') { const [x0, x1] = itemSpanX(it, lay.glyphs); cut = Math.min(cut, x1 - (x1 - x0) * e); }
        else k = 1 - smooth(e);
      }
    }
    return cut === Infinity ? (k === 1 ? FULL : { k }) : { cut, k };
  };
  const active: [number, WriteState][] = [];
  page.items.forEach((it, i) => {
    if (!inView(it)) return;
    const ws = timed ? stateOf(it) : FULL;
    if (!ws) return;
    let color = p.inkColor, alpha = p.upcomingOpacity;
    const o = it.o >= 0 ? lay.owners[it.o] : undefined;
    if (o && !o.rest) {
      if (t >= o.off) { color = p.playedColor; alpha = p.playedOpacity; }
      else if (t >= o.on) { active.push([i, ws]); return; }
    } else alpha = p.staticOpacity;
    if (alpha * fade * ws.k <= 0.004) return;
    out.push(pathPrim(lay, it, i, pi, color, alpha * fade * ws.k, tx, ty, s, undefined, rough, auraOf(color), ws.cut));
  });
  for (const [i, ws] of active) {
    const it = page.items[i], o = lay.owners[it.o];
    const color = p.colorMode === 'TRACK' ? trackColor(o.track) ?? p.activeColor : p.activeColor;
    const k = zoomAt(p, o.head, o.on, o.off, t);
    const glow = p.glow > 0 && p.glowSize > 0 ? { mode: p.glowMode, color, width: p.glowSize, alpha: p.glow } : auraOf(color);
    out.push(pathPrim(lay, it, i, pi, color, fade * ws.k, tx, ty, s, k !== 1 ? { k, cx: o.cx, cy: o.cy } : undefined, rough, glow, ws.cut));
  }
  if (p.playhead === 'LINE' && p.playheadWidth > 0) {
    const sys = scroll ? page.systems[0] : page.systems.find((y) => t >= y.start && t < y.end);
    if (sys) out.push({ kind: 'rect', x: tx + systemX(sys, t) * s - p.playheadWidth / 2, y: ty + sys.y0 * s, w: p.playheadWidth, h: (sys.y1 - sys.y0) * s, fill: p.playheadColor, alpha: fade, radius: 0, glowColor: '', glowBlur: 0, stroke: '', strokeWidth: 0 } satisfies RectPrim);
  }
  return out;
}

function pathPrim(lay: NotationLayout, item: NotationLayout['pages'][number]['items'][number], i: number, page: number, color: string, alpha: number, tx: number, ty: number, s: number,
  zoom?: PathPrim['zoom'], rough?: { amp: number; step: number; seed: number }, glow?: PathPrim['glow'], clipX?: number): PathPrim {
  return { kind: 'path', item, glyphs: lay.glyphs, color, alpha, tx, ty, s, ...(zoom ? { zoom } : {}), ...(glow ? { glow } : {}), ...(rough ? { rough: { ...rough, id: page * 65536 + i } } : {}),
    ...(clipX !== undefined ? { clipX } : {}) };
}

export const notationRenderer: WidgetRenderer<NotationProps> = {
  type: 'NOTATION',
  layout({ derived, ast }: LayoutCtx, spec: WidgetSpec<NotationProps>, t: number) {
    const lay = derived.notation?.get(spec.id);
    if (!lay) return [];
    const colors = new Map(ast.tracks.map((tr) => [tr.index, tr.color]));
    const P = spec.properties;
    let pos: MusicPos | undefined;
    if (P.aura === 'BEAT' || P.aura === 'BAR') {
      const b = barPosAt(derived.hud?.bars ?? gridOf(ast), Math.max(0, t));
      pos = { bars: b.bar - 1 + b.barPhase, beats: (b.bar - 1) * b.num + b.beat - 1 + b.beatPhase };
    }
    let after: ((t: number, bars: number) => number) | undefined;
    if (P.erase === 'AFTER' || P.erase === 'RANDOM') { const g = derived.hud?.bars ?? gridOf(ast); after = (x, n) => barsAfter(g, x, n); }
    return notationPrims(lay, P, spec.layout.width, spec.layout.height, t, (k) => colors.get(k), pos, after);
  },
};
