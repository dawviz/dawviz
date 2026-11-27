// Widget cho bảng phân tích nhạc kiểu "dashboard" (tham chiếu REFERENCE-VIDEOS video 3, T-107; video 2 dải lớp cao độ, T-109):
// Khung ô (PANEL), Bậc hợp âm (DEGREE); Lưới nốt (NOTE_GRID) ở noteGrid.ts. Như insight.ts: mỗi renderer là hàm thuần của
// (spec, t, AST, derived), không trạng thái, không đồng hồ, nên Preview = Export. Chữ lấy từ mẫu/thuộc tính, không từ locales/ của app.
import type { TrackIndex } from './notes.ts';
import { barPosAt, barStartSec, base, chordTimeline, globalValues, hudOf, shown, typo, xFor, type Align, type ChordSeg } from './hud.ts';
import { tonicAt } from './keyDetect.ts';
import { chordDegree, chordFunction, romanAscii, type HarmonicFunction, type RomanStyle } from './degree.ts';
import { templateSpans, type TextRef } from './typography.ts';
import { chordNameFor } from './naming.ts';
import { noteGridRenderer } from './noteGrid.ts';
import { poly, type Derived, type Primitive, type RectPrim, type WidgetRenderer } from './prims.ts';

const ts = (styleId: string): TextRef => ({ styleId });
const clamp01 = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));
const rect = (x: number, y: number, w: number, h: number, fill: string, alpha = 1, radius = 0): RectPrim =>
  ({ kind: 'rect', x, y, w, h, fill, alpha, radius: Math.max(0, Math.min(radius, h / 2, w / 2)), glowColor: '', glowBlur: 0, stroke: '', strokeWidth: 0 });
/** Khung chữ nhật chỉ có viền (không tô): đa giác khép kín. */
const outline = (x: number, y: number, w: number, h: number, color: string, width: number, alpha = 1) =>
  poly([x, y, x + w, y, x + w, y + h, x, y + h], { closed: true, stroke: color, width, alpha });

// ───────────────────────────── thuộc tính ─────────────────────────────
export interface PanelStat { label: string; value: string }
export interface PanelProps {
  /** Số thứ tự (chữ tự do, vd. "03") và tiêu đề của ô. Rỗng cả hai = không có dòng tiêu đề. */
  number: string; title: string; numberColor: string; titleStyle: TextRef;
  /** Khung quanh vùng nội dung (giữa tiêu đề và hàng số liệu). */
  frame: boolean; frameColor: string; frameWidth: number; fillColor: string; fillAlpha: number;
  /** Hàng số liệu ở đáy: tối đa 6 cột nhãn + giá trị (mẫu có chỗ giữ dùng chung). Cột có cả nhãn lẫn giá trị rỗng bị bỏ. */
  stats: PanelStat[]; labelStyle: TextRef; valueStyle: TextRef;
}
export interface DegreeProps {
  /** Số ô nhịp hiện trên bề rộng widget và vị trí vạch phát (0–1). */
  windowBars: number; playheadRatio: number;
  /** Độ mịn hàng chính: mỗi ô nhịp / nửa ô nhịp / mỗi phách lấy MỘT hợp âm (hợp âm vang lâu nhất trong ô), hoặc CHANGE = theo từng lần đổi nốt.
   *  Hàng phụ mịn hơn một bậc. Gom theo ô cho khối gọn như bảng phân tích tham chiếu; nhạc dày nốt không còn vụn thành sợi. */
  resolution: ChordResolution;
  /** Hàng phụ (hợp âm theo lần dập), dải chức năng (T/SD/D) và số ô nhịp. */
  showDetail: boolean; showFunction: boolean; showBars: boolean;
  romanStyle: RomanStyle;
  /** Cửa sổ (giây) nhận diện giọng khi scene chưa đặt nốt chủ. */
  keyWindowSec: number;
  accentColor: string; detailColor: string; blockColor: string; activeTextColor: string; pastAlpha: number;
  tonicColor: string; subdominantColor: string; dominantColor: string; playheadColor: string;
  radius: number; gap: number;
  labelStyle: TextRef; smallStyle: TextRef;
  /** Vị trí chữ trong khối hợp âm: đầu / giữa (mặc định, như trước T-131) / cuối khối. */
  labelAlign: DegreeLabelAlign;
  /** Khối hai tầng: bậc La Mã to ở trên, tên hợp âm nhỏ ngay dưới (chỉ hàng chính, khi đã biết giọng và khối đủ cao). */
  showChordName: boolean;
  /** Khối bị cắt ở mép trái widget: chữ dính mép trái phần đang thấy và đi theo tới cuối khối rồi bị đẩy ra (như tên clip trong DAW). */
  labelSticky: boolean;
}
export type DegreeLabelAlign = 'START' | 'CENTER' | 'END';
export const DEGREE_LABEL_ALIGNS: readonly DegreeLabelAlign[] = ['START', 'CENTER', 'END'];
export type ChordResolution = 'BAR' | 'HALF' | 'BEAT' | 'CHANGE';
export const CHORD_RESOLUTIONS: readonly ChordResolution[] = ['BAR', 'HALF', 'BEAT', 'CHANGE'];
export const DEFAULT_PANEL: Readonly<PanelProps> = Object.freeze({
  number: '01', title: 'PANEL', numberColor: '#ff3d8b', titleStyle: { styleId: 'label', weight: 700, tracking: 120, color: '#222222', size: 13 },
  frame: true, frameColor: '#d8c6d1', frameWidth: 1, fillColor: '', fillAlpha: 1,
  stats: [{ label: 'BAR', value: '{bar}.{beat}' }, { label: 'TEMPO', value: '{bpm:0.0}' }, { label: '', value: '' }, { label: '', value: '' }, { label: '', value: '' }, { label: '', value: '' }],
  labelStyle: ts('label'), valueStyle: ts('body'),
});
export const DEFAULT_DEGREE: Readonly<DegreeProps> = Object.freeze({
  windowBars: 8, playheadRatio: 0.42, resolution: 'BAR', showDetail: true, showFunction: true, showBars: true, romanStyle: 'SUFFIX', keyWindowSec: 16,
  accentColor: '#ff3d8b', detailColor: '#2ec4b6', blockColor: '#2b2b33', activeTextColor: '#ffffff', pastAlpha: 0.45,
  tonicColor: '#2ec4b6', subdominantColor: '#ffb3cf', dominantColor: '#ff3d8b', playheadColor: '#222222',
  radius: 6, gap: 4, labelStyle: ts('caption'), smallStyle: ts('label'), labelAlign: 'CENTER', labelSticky: true, showChordName: false,
});
export const DASHBOARD_TYPES = ['PANEL', 'DEGREE', 'NOTE_GRID'] as const;
export const DASHBOARD_TEXT_FIELDS = {
  PANEL: { titleStyle: 'label', labelStyle: 'label', valueStyle: 'body' }, DEGREE: { labelStyle: 'caption', smallStyle: 'label' }, NOTE_GRID: { labelStyle: 'label', polyStyle: 'caption' },
} as const;
export const MAX_PANEL_STATS = 6;

// ───────────────────────────── Khung ô ─────────────────────────────
export const panelRenderer: WidgetRenderer<PanelProps> = {
  type: 'PANEL',
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, { width: W, height: H } = spec.layout, out: Primitive[] = [], T = typo(textStyles, measure, fonts);
    const tst = T.style(p.titleStyle, 'label'), lst = T.style(p.labelStyle, 'label'), vst = T.style(p.valueStyle, 'body');
    let top = 0;
    if (p.number || p.title) {
      const y = base(tst.size); let x = 0;
      if (p.number) { T.text(out, p.number, 0, y, { ...tst, color: p.numberColor || tst.color }, 'left', W); x = T.width(p.number, tst) + tst.size * 0.9; }
      if (p.title) T.text(out, p.title, x, y, tst, 'left', Math.max(0, W - x));
      top = tst.size * 1.9;
    }
    const stats = (p.stats ?? []).slice(0, MAX_PANEL_STATS).filter((s) => s.label || s.value);
    const statsH = stats.length ? lst.size * 1.5 + vst.size * 1.3 : 0, bottom = H - statsH - (stats.length ? lst.size * 0.8 : 0);
    if (p.frame && bottom - top > 2) {
      if (p.fillColor) out.push(rect(0, top, W, bottom - top, p.fillColor, p.fillAlpha));
      if (p.frameWidth > 0) { const hw = p.frameWidth / 2; out.push(outline(hw, top + hw, W - p.frameWidth, bottom - top - p.frameWidth, p.frameColor, p.frameWidth)); }
    }
    if (stats.length) {
      const G = globalValues({ ast, derived, tracks }, t), cw = W / stats.length, y0 = H - statsH;
      stats.forEach((s, i) => {
        const x = i * cw;
        if (s.label) T.text(out, templateSpans(s.label, G), x, y0 + base(lst.size), lst, 'left', cw - 6);
        if (s.value) T.text(out, templateSpans(s.value, G), x, y0 + lst.size * 1.5 + base(vst.size), vst, 'left', cw - 6);
      });
    }
    return out;
  },
};

// ───────────────────────────── Bậc hợp âm ─────────────────────────────
/** Vị trí theo ô nhịp (số thực, ô đầu bắt đầu ở 0) của thời điểm `sec`: đúng cả khi đổi tempo/nhịp. */
const barCoord = (derived: Derived, ast: Parameters<typeof hudOf>[1], sec: number) => { const q = barPosAt(hudOf(derived, ast).bars, sec); return q.bar - 1 + q.barPhase; };
/** Nốt chủ theo từng đoạn hợp âm (khi scene chưa đặt nốt chủ): đệm theo danh sách đoạn. */
const segKeyMemo = new WeakMap<readonly ChordSeg[], Map<string, number | null>>();
function segTonic(derived: Derived, tracks: readonly TrackIndex[], segs: readonly ChordSeg[], i: number, windowSec: number): number | null {
  if (derived.tonic !== undefined) return derived.tonic;
  let m = segKeyMemo.get(segs); if (!m) segKeyMemo.set(segs, (m = new Map()));
  const k = `${i}|${windowSec}`; if (m.has(k)) return m.get(k)!;
  const s = segs[i], v = tonicAt(derived, tracks, Math.min(s.end, s.start + 0.25), windowSec); // giọng tính tới ngay sau lúc hợp âm vào
  m.set(k, v); return v;
}
/** Đoạn hợp âm gom theo ô (ô nhịp/nửa ô/phách): mỗi ô lấy hợp âm có tên vang lâu nhất trong ô, ô liền nhau cùng tên nối lại. Đệm theo danh sách gốc. */
const quantMemo = new WeakMap<readonly ChordSeg[], Map<string, ChordSeg[]>>();
export function quantizeChords(segs: readonly ChordSeg[], grid: Parameters<typeof barStartSec>[0], dur: number, res: ChordResolution): readonly ChordSeg[] {
  if (res === 'CHANGE' || !(dur > 0)) return segs;
  let m = quantMemo.get(segs); if (!m) quantMemo.set(segs, (m = new Map()));
  const key = `${res}|${dur}`, hit = m.get(key); if (hit) return hit;
  const slots: number[] = [];
  for (let b = 0; b < 100000; b++) {
    const a = barStartSec(grid, b); if (a >= dur) break;
    const e = Math.min(dur, barStartSec(grid, b + 1)), n = res === 'BAR' ? 1 : res === 'HALF' ? 2 : barPosAt(grid, a + 1e-6).num;
    for (let k = 0; k < n; k++) slots.push(a + (e - a) * k / n);
  }
  slots.push(dur);
  const out: ChordSeg[] = []; let j = 0;
  for (let i = 0; i + 1 < slots.length; i++) {
    const a = slots[i], b = slots[i + 1]; if (!(b > a)) continue;
    while (j < segs.length && segs[j].end <= a) j++;
    const dur2 = new Map<string, { len: number; seg: ChordSeg }>();
    for (let k = j; k < segs.length && segs[k].start < b; k++) {
      const s = segs[k]; if (!s.name) continue;
      const len = Math.min(b, s.end) - Math.max(a, s.start), cur = dur2.get(s.name);
      if (len > 0) dur2.set(s.name, { len: (cur?.len ?? 0) + len, seg: cur?.seg ?? s });
    }
    let best: { len: number; seg: ChordSeg } | null = null;
    for (const v of dur2.values()) if (!best || v.len > best.len + 1e-9) best = v;
    const last = out[out.length - 1];
    if (!best) continue;
    if (last && last.name === best.seg.name && Math.abs(last.end - a) < 1e-6) { last.end = b; continue; }
    out.push({ start: a, end: b, pitches: best.seg.pitches, name: best.seg.name });
  }
  m.set(key, out); return out;
}
const FINER: Record<ChordResolution, ChordResolution> = { BAR: 'BEAT', HALF: 'BEAT', BEAT: 'CHANGE', CHANGE: 'CHANGE' };
/** Lề chữ trong khối (mỗi bên), như bề rộng tối đa `w - 6` của chữ. */
const LABEL_PAD = 3;
/**
 * Vị trí chữ của một khối [x0, x1] (toạ độ widget, mép trái vùng thấy là 0), chữ rộng `tw`. Không dính: đầu/giữa/cuối khối.
 * Dính và khối bị cắt bên trái: phần đầu của khối coi như bắt đầu ở mép trái vùng thấy; chữ đi theo cho tới khi chạm cuối khối,
 * rồi bị đẩy ra cùng khối (giữ nguyên mép phải chữ ở cuối khối). Hàm thuần của vị trí hiện tại nên tua tới/lui cho cùng kết quả.
 */
export function degreeLabelPos(align: DegreeLabelAlign, sticky: boolean, x0: number, x1: number, tw: number): { x: number; align: Align } {
  const b = x1 - LABEL_PAD;
  if (align === 'END') return { x: b, align: 'right' };
  const a = sticky ? Math.max(x0 + LABEL_PAD, LABEL_PAD) : x0 + LABEL_PAD;
  if (align === 'START') return { x: sticky ? Math.min(a, b - tw) : a, align: 'left' };
  if (!sticky) return { x: x0 + (x1 - x0) / 2, align: 'center' };
  return { x: Math.min((a + b) / 2, b - tw / 2), align: 'center' };
}
const FN_COLOR = (p: DegreeProps, f: HarmonicFunction) => (f === 'T' ? p.tonicColor : f === 'SD' ? p.subdominantColor : p.dominantColor);
export const degreeRenderer: WidgetRenderer<DegreeProps> = {
  type: 'DEGREE',
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, { width: W, height: H } = spec.layout, out: Primitive[] = [], T = typo(textStyles, measure, fonts), list = shown(tracks);
    const hud = hudOf(derived, ast), lst = T.style(p.labelStyle, 'caption'), sst = T.style(p.smallStyle, 'label'), asc = (s: string) => (derived.naming?.ascii ? romanAscii(s) : s);
    const win = Math.max(1, p.windowBars), now = barCoord(derived, ast, t), b0 = now - p.playheadRatio * win, b1 = b0 + win, xOf = (b: number) => ((b - b0) / win) * W;
    // Chiều cao các hàng theo kiểu chữ; phần dư dồn cho hàng chính.
    const rowFn = p.showFunction ? Math.max(4, sst.size * 0.45) + sst.size * 1.2 : 0, rowBars = p.showBars ? sst.size * 1.6 : 0, rowDetail = p.showDetail ? sst.size * 1.9 : 0;
    const gapY = p.gap, top = 10, mainH = Math.max(lst.size * 1.6, H - top - rowFn - rowBars - rowDetail - gapY * 3);
    const yDetail = top + mainH + gapY, yFn = yDetail + (p.showDetail ? rowDetail + gapY : 0), yBars = yFn + (p.showFunction ? rowFn + gapY : 0);
    const drawRow = (segs: readonly ChordSeg[], y: number, h: number, st: typeof lst, active: string, withFn: boolean) => {
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i]; if (!s.name || !(s.end > s.start)) continue;
        const a = barCoord(derived, ast, s.start), b = barCoord(derived, ast, Math.min(s.end, derived.index.duration || s.end));
        if (b < b0 || a > b1) continue;
        const x0 = xOf(a) + p.gap / 2, x1 = xOf(b) - p.gap / 2, w = x1 - x0; if (w < 1) continue;
        const tonic = segTonic(derived, list, segs, i, p.keyWindowSec), label = tonic === null ? s.name : asc(chordDegree(s.name, tonic, p.romanStyle));
        const cur = s.start <= t && t < s.end, past = s.end <= t, alpha = past ? p.pastAlpha : 1;
        if (cur) out.push(rect(x0, y, w, h, active, 1, p.radius));
        else out.push(poly(roundRectPts(x0, y, w, h, p.radius), { closed: true, stroke: p.blockColor, width: 1, alpha }));
        const lp = degreeLabelPos(p.labelAlign, p.labelSticky, x0, x1, Math.min(T.width(label, st), Math.max(1, w - 6)));
        const two = withFn && p.showChordName && tonic !== null && h >= st.size * 1.1 + sst.size * 1.6, yL = y + h / 2 + st.size * 0.35 - (two ? sst.size * 0.6 : 0);
        T.text(out, label, lp.x, yL, cur ? { ...st, color: p.activeTextColor } : st, lp.align, Math.max(1, w - 6), cur ? 1 : alpha);
        if (two) {
          const nm = derived.naming ? chordNameFor(s.name, derived.naming) : s.name, np = degreeLabelPos(p.labelAlign, p.labelSticky, x0, x1, Math.min(T.width(nm, sst), Math.max(1, w - 6)));
          T.text(out, nm, np.x, yL + sst.size * 1.3, cur ? { ...sst, color: p.activeTextColor } : sst, np.align, Math.max(1, w - 6), (cur ? 1 : alpha) * 0.8);
        }
        if (withFn && p.showFunction && tonic !== null) {
          const f = chordFunction(s.name, tonic);
          if (f) { const bh = Math.max(4, sst.size * 0.45); out.push(rect(x0, yFn, w, bh, FN_COLOR(p, f), past ? p.pastAlpha : 1, bh / 2)); T.text(out, f, x0 + w / 2, yFn + bh + sst.size * 1.05, sst, 'center', Math.max(1, w), alpha); }
        }
      }
    };
    const dur = derived.index.duration;
    drawRow(quantizeChords(chordTimeline(hud, list, 'sustained'), hud.bars, dur, p.resolution), top, mainH, lst, p.accentColor, true);
    if (p.showDetail) drawRow(quantizeChords(chordTimeline(hud, list, 'strike'), hud.bars, dur, FINER[p.resolution]), yDetail, rowDetail, sst, p.detailColor, false);
    if (p.showBars) {
      for (let b = Math.ceil(b0); b <= Math.floor(b1); b++) {
        const x = xOf(b); if (x < 0 || x > W) continue;
        out.push(rect(x, yBars, 1, sst.size * 0.8, p.blockColor, 0.5));
        if (b >= 0) T.text(out, String(b + 1), x + 3, yBars + sst.size * 1.25, sst, 'left', W / win); // trước đầu bài (số ≤ 0) chỉ còn vạch, không có số
      }
    }
    if (p.playheadColor) {
      const x = xOf(now);
      out.push(rect(x - 0.75, top, 1.5, H - top, p.playheadColor, 1));
      out.push(poly([x - 6, 0, x + 6, 0, x, top - 1], { closed: true, fill: p.playheadColor }));
    }
    return out;
  },
};
/** Điểm của hình chữ nhật bo góc (đa giác): dùng cho khung chỉ có viền. */
export function roundRectPts(x: number, y: number, w: number, h: number, r: number): number[] {
  const R = Math.max(0, Math.min(r, w / 2, h / 2)), out: number[] = [], seg = 4;
  if (R <= 0.01) return [x, y, x + w, y, x + w, y + h, x, y + h];
  const corner = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= seg; i++) { const a = (a0 + 90 * i / seg) * Math.PI / 180; out.push(cx + R * Math.cos(a), cy + R * Math.sin(a)); } };
  corner(x + w - R, y + R, -90); corner(x + w - R, y + h - R, 0); corner(x + R, y + h - R, 90); corner(x + R, y + R, 180);
  return out;
}

export const DASHBOARD_RENDERERS = { PANEL: panelRenderer, DEGREE: degreeRenderer, NOTE_GRID: noteGridRenderer } as const;
void xFor; void clamp01;
export type { Align };
