// Các widget phân tích (P-02…P-13, SRS 3.4b, AT-23): Tempo & nhịp, Bar & Beat, Giọng, Velocity, Mật độ, Vòng cao độ, Tổng quan bản phối,
// Drum pad, Tên đoạn (marker), Lời, Automation. Mỗi widget là một renderer thuần của (spec, t, AST, derived): không trạng thái, không đồng hồ,
// nên Preview = Export. Chữ lấy từ MẪU trong thuộc tính widget (như sáu widget chữ ở hud.ts); tên nốt đi qua `derived.naming` (P-12).
import { sampleLane, secToTick } from '@dawviz/parser-core';
import { laneNorm } from './glow.ts';
import { activeNotes, notesInRange, type TrackIndex } from './notes.ts';
import { barPosAt, base, block, chordName, hudOf, pct, shown, typo, xFor, globalValues, withLocals, isDrumTrack, type Align } from './hud.ts';
import { chordNameFor, noteNameFor, pitchClassNameFor } from './naming.ts';
import { pitchName } from './music.ts';
import { pitchClassName } from './musicAnalysis.ts';
import { listV, numV, timeV } from './placeholders.ts';
import { chordDegree, romanAscii, romanOf, type RomanStyle } from './degree.ts';
import { arcPts, poly } from './prims.ts';
import { templateSpans, type TextRef, type TextSpan } from './typography.ts';
import type { AutomationLane } from './types.ts';
import type { Derived, Primitive, RectPrim, WidgetRenderer } from './prims.ts';

const ts = (styleId: string): TextRef => ({ styleId });
const rect = (x: number, y: number, w: number, h: number, fill: string, alpha = 1, radius = 0, rotation = 0): RectPrim =>
  ({ kind: 'rect', x, y, w, h, fill, alpha, radius: Math.max(0, Math.min(radius, h / 2, w / 2)), glowColor: '', glowBlur: 0, stroke: '', strokeWidth: 0, ...(rotation ? { rotation } : {}) });
const clamp01 = pct;
const pcName = (pc: number, d: Derived) => (d.naming ? pitchClassNameFor(pc, d.naming) : pitchClassName(pc));
const noteName = (p: number, d: Derived) => (d.naming ? noteNameFor(p, d.naming) : pitchName(p));
const chordLabel = (name: string, d: Derived) => (d.naming ? chordNameFor(name, d.naming) : name);

// ───────────────────────────── thuộc tính ─────────────────────────────
export interface TempoInfoProps { align: Align; style: TextRef; template: string; showCurve: boolean; curveHeight: number; curveColor: string; flash: boolean; flashColor: string; flashMs: number }
export interface BarBeatProps { align: Align; style: TextRef; format: 'PERCENT' | 'SIXTEENTH'; barDigits: number; dots: boolean; dotSize: number; dotColor: string; dotActiveColor: string; pulse: boolean }
export interface KeyScaleProps { align: Align; nameStyle: TextRef; confStyle: TextRef; template: string; majorLabel: string; minorLabel: string; noKeyText: string; windowSec: number; minConfidence: number; showConfidence: boolean; confTemplate: string }
export interface VelocityProps { mode: 'LEVEL' | 'HISTOGRAM'; perTrack: boolean; decayMs: number; windowSec: number; bins: number; gap: number; colorMode: 'TRACK' | 'SOLID'; color: string; trackColor: string; radius: number }
export interface PitchWheelProps {
  order: 'CHROMATIC' | 'FIFTHS'; ring: number; litColor: string; dimColor: string; dimAlpha: number; showNames: boolean; nameStyle: TextRef; showChord: boolean; chordStyle: TextRef;
  /** Nhãn quanh vòng: tên nốt hoặc bậc La Mã so với giọng (scene.tonic, không đặt thì giọng nhận diện trong `windowSec`). */
  labels: 'NAMES' | 'DEGREES';
  /** Ô quanh vòng: TILE (thanh cong, như cũ) hoặc CIRCLE (nút tròn có viền, chữ bên trong). */
  nodeShape: 'TILE' | 'CIRCLE';
  /** Màu chữ trong nút đang sáng (CIRCLE); rỗng = màu kiểu chữ nhãn. */
  litTextColor: string;
  /** Đa giác nối các lớp cao độ đang vang (theo thứ tự quanh vòng). Màu rỗng = màu sáng. */
  polygon: boolean; polygonColor: string; polygonAlpha: number;
  /** Vòng đánh dấu nốt bass (nốt thấp nhất đang vang); rỗng = không đánh dấu. */
  rootColor: string;
  /** Cung tiến độ quanh vòng: tắt, theo ô nhịp hoặc theo cả bài. Màu rỗng = màu sáng. */
  progress: 'OFF' | 'BAR' | 'SONG'; progressColor: string; progressWidth: number;
  /** Số phách quanh vòng (1 ở đỉnh), phách đang chơi tô màu tiến độ. */
  beatMarks: boolean;
  /** Đường tròn mảnh ở bán kính các nút; rỗng = không vẽ. */
  outlineColor: string;
  /** Chữ ở giữa: tên hợp âm hoặc bậc hợp âm. */
  chordAs: 'NAME' | 'DEGREE'; romanStyle: RomanStyle;
  /** Dòng phụ dưới hợp âm (chỗ giữ dùng chung, vd. "BAR {bar}"); rỗng = không có. */
  subTemplate: string; subStyle: TextRef;
  /** Cửa sổ (giây) nhận diện giọng khi scene chưa đặt nốt chủ. */
  windowSec: number;
  /** Phát sáng quanh các nút đang sáng (0 = tắt); màu rỗng = màu sáng. Chỉ nút, không áp cho đa giác và cung tiến độ. */
  glow: number; glowColor: string;
}
export interface DrumPadProps { source: 'DRUMS' | 'ALL'; cols: number; maxPads: number; gap: number; radius: number; padColor: string; hitColor: string; colorMode: 'TRACK' | 'SOLID'; decayMs: number; labels: boolean; labelStyle: TextRef }
export interface SectionProps { align: Align; style: TextRef; nextStyle: TextRef; template: string; showNext: boolean; nextTemplate: string; fadeMs: number }
export interface LyricsProps { align: Align; style: TextRef; unsungStyle: TextRef; showNext: boolean; nextStyle: TextRef; maxChars: number; gapSec: number; hideAfterSec: number }
/** `lane`: id lane của track (`volume`, `pan`, `cc1`, `cc11`, `pitchBend`… — T-66); widget vẽ các track có lane đó. */
export interface AutomationProps { lane: string; windowSec: number; playheadRatio: number; colorMode: 'TRACK' | 'SOLID'; color: string; thickness: number; fill: boolean; fillAlpha: number; floorDb: number; ceilDb: number; playheadColor: string; showValue: boolean; valueStyle: TextRef }

export const DEFAULT_TEMPO_INFO: Readonly<TempoInfoProps> = Object.freeze({ align: 'left', style: ts('clock'), template: '{bpm} BPM  {sig}', showCurve: true, curveHeight: 36, curveColor: '#8aa4ff', flash: true, flashColor: '#ffd166', flashMs: 600 });
export const DEFAULT_BAR_BEAT: Readonly<BarBeatProps> = Object.freeze({ align: 'left', style: ts('clock'), format: 'PERCENT', barDigits: 3, dots: true, dotSize: 10, dotColor: '#3a4060', dotActiveColor: '#ffd166', pulse: true });
export const DEFAULT_KEY_SCALE: Readonly<KeyScaleProps> = Object.freeze({ align: 'left', nameStyle: ts('heading'), confStyle: ts('caption'), template: '{key} {scale}', majorLabel: 'major', minorLabel: 'minor', noKeyText: '—', windowSec: 16, minConfidence: 0.3, showConfidence: true, confTemplate: 'Confidence {confidence}' });
export const DEFAULT_VELOCITY: Readonly<VelocityProps> = Object.freeze({ mode: 'LEVEL', perTrack: true, decayMs: 500, windowSec: 8, bins: 8, gap: 4, colorMode: 'TRACK', color: '#8aa4ff', trackColor: '', radius: 2 });
export const DEFAULT_PITCH_WHEEL: Readonly<PitchWheelProps> = Object.freeze({
  order: 'CHROMATIC', ring: 0.34, litColor: '#ffd166', dimColor: '#3a4060', dimAlpha: 0.55, showNames: true, nameStyle: ts('label'), showChord: true, chordStyle: ts('heading'),
  labels: 'NAMES', nodeShape: 'TILE', litTextColor: '#ffffff', polygon: false, polygonColor: '', polygonAlpha: 0.22, rootColor: '', progress: 'OFF', progressColor: '', progressWidth: 4,
  beatMarks: false, outlineColor: '', chordAs: 'NAME', romanStyle: 'SUFFIX', subTemplate: '', subStyle: ts('label'), windowSec: 16, glow: 0, glowColor: '',
});
export const DEFAULT_DRUM_PAD: Readonly<DrumPadProps> = Object.freeze({ source: 'DRUMS', cols: 4, maxPads: 16, gap: 6, radius: 8, padColor: '#2a2f45', hitColor: '#ffb74d', colorMode: 'SOLID', decayMs: 250, labels: true, labelStyle: ts('tiny') });
export const DEFAULT_SECTION: Readonly<SectionProps> = Object.freeze({ align: 'left', style: ts('heading'), nextStyle: ts('caption'), template: '{section}', showNext: true, nextTemplate: 'Next: {next} in {next_in:m:ss}', fadeMs: 250 });
export const DEFAULT_LYRICS: Readonly<LyricsProps> = Object.freeze({ align: 'center', style: ts('body'), unsungStyle: { opacity: 0.5 }, showNext: true, nextStyle: ts('caption'), maxChars: 60, gapSec: 2.5, hideAfterSec: 4 });
export const DEFAULT_AUTOMATION: Readonly<AutomationProps> = Object.freeze({ lane: 'volume', windowSec: 20, playheadRatio: 0.3, colorMode: 'TRACK', color: '#8aa4ff', thickness: 2, fill: true, fillAlpha: 0.18, floorDb: -36, ceilDb: 6, playheadColor: '#ffffff', showValue: true, valueStyle: ts('tiny') });

/** Chỗ giữ riêng của từng widget phân tích (ngoài chỗ giữ chung). */
export const INSIGHT_TEMPLATE_KEYS = {
  TEMPO_INFO: [], BAR_BEAT: [], KEY_SCALE: ['key', 'scale', 'confidence'], VELOCITY: [], PITCH_WHEEL: [], DRUM_PAD: [], NOTE_GRID: ['poly'],
  SECTION: ['section', 'next', 'next_in', 'section_no', 'section_elapsed'], LYRICS: [], AUTOMATION: [],
} as const;
export const INSIGHT_TYPES = ['TEMPO_INFO', 'BAR_BEAT', 'KEY_SCALE', 'VELOCITY', 'PITCH_WHEEL', 'DRUM_PAD', 'SECTION', 'LYRICS', 'AUTOMATION'] as const;

// ───────────────────────────── P-02 Tempo & nhịp ─────────────────────────────
export const tempoInfoRenderer: WidgetRenderer<TempoInfoProps> = {
  type: 'TEMPO_INFO',
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, { width: W, height: H } = spec.layout, out: Primitive[] = [], T = typo(textStyles, measure, fonts);
    const g = hudOf(derived, ast).bars, pos = barPosAt(g, t), st = T.style(p.style, 'clock'), dur = derived.index.duration;
    const curveH = p.showCurve ? Math.min(p.curveHeight, H * 0.8) : 0;
    if (p.flash) { // tempo hoặc nhịp vừa đổi: nền sáng mờ dần
      const map = ast.tempoMap; let last = -1;
      for (let i = 1; i < map.length && map[i].timeSeconds <= t; i++) {
        const a = map[i - 1], b = map[i];
        if (Math.abs(b.bpm - a.bpm) >= 1 || (b.timeSigNumerator ?? 4) !== (a.timeSigNumerator ?? 4) || (b.timeSigDenominator ?? 4) !== (a.timeSigDenominator ?? 4)) last = i;
      }
      const age = last >= 0 ? t - map[last].timeSeconds : Infinity, k = 1 - age / Math.max(0.001, p.flashMs / 1000);
      if (k > 0) out.push(rect(0, 0, W, Math.max(1, H - curveH - 2), p.flashColor, 0.35 * k, 4));
    }
    const G = globalValues({ ast, derived, tracks }, t);
    T.text(out, templateSpans(p.template, withLocals(G, {}), undefined), xFor(p.align, W), base(st.size), st, p.align, W);
    if (p.showCurve && curveH > 2 && dur > 0) {
      const cols = Math.max(20, Math.min(300, Math.floor(W / 3))), bw = W / cols;
      let lo = Infinity, hi = -Infinity; for (const q of g.tempo) { if (q.bpm < lo) lo = q.bpm; if (q.bpm > hi) hi = q.bpm; }
      for (let i = 0; i < cols; i++) {
        const sec = ((i + 0.5) / cols) * dur; let j = 0; while (j + 1 < g.tempo.length && g.tempo[j + 1].sec <= sec) j++;
        const k = hi > lo ? (g.tempo[j].bpm - lo) / (hi - lo) : 0.5, h = Math.max(2, curveH * (0.15 + 0.85 * k));
        out.push(rect(i * bw, H - h, Math.max(1, bw - 0.5), h, p.curveColor, sec <= t ? 1 : 0.35));
      }
    }
    return out;
  },
};

// ───────────────────────────── P-03 Bar & Beat ─────────────────────────────
export const barBeatRenderer: WidgetRenderer<BarBeatProps> = {
  type: 'BAR_BEAT',
  layout({ ast, derived, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, { width: W } = spec.layout, out: Primitive[] = [], T = typo(textStyles, measure, fonts);
    const pos = barPosAt(hudOf(derived, ast).bars, t), st = T.style(p.style, 'clock');
    const sub = p.format === 'PERCENT' ? String(Math.min(99, Math.floor(pos.beatPhase * 100))).padStart(2, '0') : String(Math.min(16 / pos.den, Math.floor(pos.beatPhase * (16 / pos.den))) + 1);
    const text = `${String(pos.bar).padStart(Math.round(p.barDigits), '0')}.${pos.beat}.${sub}`;
    T.text(out, text, xFor(p.align, W), base(st.size), st, p.align, W);
    if (p.dots && pos.num <= 16) {
      const n = pos.num, d = p.dotSize, gap = d * 0.6, total = n * d + (n - 1) * gap, x0 = p.align === 'left' ? 0 : p.align === 'center' ? (W - total) / 2 : W - total, y = st.size * 1.35;
      for (let i = 0; i < n; i++) {
        const on = i === pos.beat - 1, k = on && p.pulse ? 1 + 0.5 * (1 - pos.beatPhase) : 1, s = d * k;
        out.push(rect(x0 + i * (d + gap) - (s - d) / 2, y - (s - d) / 2, s, s, on ? p.dotActiveColor : p.dotColor, on ? 1 : 0.9, s / 2));
      }
    }
    return out;
  },
};

// ───────────────────────────── P-04 Giọng (Krumhansl–Schmuckler) ─────────────────────────────
export { keyFromHistogram, keyAt, tonicAt } from './keyDetect.ts';
import { keyAt, tonicAt } from './keyDetect.ts';
export const keyScaleRenderer: WidgetRenderer<KeyScaleProps> = {
  type: 'KEY_SCALE',
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, W = spec.layout.width, x = xFor(p.align, W), out: Primitive[] = [], T = typo(textStyles, measure, fonts);
    const nst = T.style(p.nameStyle, 'heading'), cst = T.style(p.confStyle, 'caption'), G = globalValues({ ast, derived, tracks }, t);
    const k = keyAt(shown(tracks), t, p.windowSec);
    if (!k || k.confidence < p.minConfidence) { T.text(out, p.noKeyText, x, base(nst.size), nst, p.align, W); return out; }
    const L = withLocals(G, { key: pcName(k.tonic, derived), scale: k.minor ? p.minorLabel : p.majorLabel, confidence: numV(k.confidence * 100, `${Math.round(k.confidence * 100)}%`) });
    T.text(out, templateSpans(p.template, L), x, base(nst.size), nst, p.align, W);
    if (p.showConfidence) T.text(out, templateSpans(p.confTemplate, L), x, base(nst.size) + cst.size * 1.5, cst, p.align, W);
    return out;
  },
};

// ───────────────────────────── P-05 Velocity ─────────────────────────────
export const velocityRenderer: WidgetRenderer<VelocityProps> = {
  type: 'VELOCITY',
  layout({ tracks }, spec, t) {
    const p = spec.properties, { width: W, height: H } = spec.layout, out: Primitive[] = [], list = shown(tracks);
    if (!list.length) return out;
    if (p.mode === 'HISTOGRAM') {
      const bins = new Array(Math.round(p.bins)).fill(0), t0 = Math.max(0, t - p.windowSec);
      for (const ti of list) for (const n of notesInRange(ti, t0, t)) if (n.startTimeSeconds <= t && n.startTimeSeconds >= t0) bins[Math.min(bins.length - 1, Math.floor(((n.velocity - 1) / 127) * bins.length))]++;
      const mx = Math.max(1, ...bins), bw = (W - p.gap * (bins.length - 1)) / bins.length;
      bins.forEach((c, i) => { const h = c ? Math.max(2, (c / mx) * H) : 0; if (p.trackColor) out.push(rect(i * (bw + p.gap), 0, bw, H, p.trackColor, 1, p.radius)); if (h) out.push(rect(i * (bw + p.gap), H - h, bw, h, p.color, 1, p.radius)); });
      return out;
    }
    const decay = Math.max(0.001, p.decayMs / 1000);
    const level = (set: readonly TrackIndex[]): number => {
      let v = 0;
      for (const ti of set) for (const n of notesInRange(ti, t - decay, t)) { const age = t - n.startTimeSeconds; if (age >= 0 && age < decay) v = Math.max(v, (n.velocity / 127) * (1 - age / decay)); }
      return v;
    };
    const groups = p.perTrack ? list.map((ti) => [ti]) : [list], bw = (W - p.gap * (groups.length - 1)) / groups.length;
    groups.forEach((g, i) => {
      const h = clamp01(level(g)) * H, x = i * (bw + p.gap), col = p.colorMode === 'TRACK' && g.length === 1 ? g[0].track.color : p.color;
      if (p.trackColor) out.push(rect(x, 0, bw, H, p.trackColor, 1, p.radius));
      if (h > 0.5) out.push(rect(x, H - h, bw, h, col, 1, p.radius));
    });
    return out;
  },
};

// ───────────────────────────── P-07 Vòng cao độ / vòng quãng năm ─────────────────────────────
export const pitchWheelRenderer: WidgetRenderer<PitchWheelProps> = {
  type: 'PITCH_WHEEL',
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = { ...DEFAULT_PITCH_WHEEL, ...spec.properties }, { width: W, height: H } = spec.layout, out: Primitive[] = [], T = typo(textStyles, measure, fonts), list = shown(tracks);
    const active = new Set<number>(), pitches: number[] = [];
    for (const ti of list) for (const n of activeNotes(ti, t)) { if (n.channel === 9) continue; active.add(n.pitch % 12); pitches.push(n.pitch); }
    pitches.sort((x, y) => x - y);
    const degrees = p.labels === 'DEGREES' || p.chordAs === 'DEGREE', tonic = degrees ? tonicAt(derived, list, t, p.windowSec) : null;
    const nst = T.style(p.nameStyle, 'label'), lit = p.litColor, accent = p.progressColor || lit, cx = W / 2, cy = H / 2;
    // Vành ngoài (cung tiến độ + số phách) chiếm phần mép; vòng nút nằm bên trong.
    const beatPad = p.beatMarks ? nst.size * 1.8 : 0, arcW = p.progress !== 'OFF' ? Math.max(0.5, p.progressWidth) : 0;
    const Rm = Math.max(4, Math.min(W, H) / 2 - beatPad - (arcW ? arcW / 2 + 1 : 0)), circle = p.nodeShape === 'CIRCLE';
    const thick = Rm * p.ring * 2, r0 = circle ? Rm * (1 - p.ring * 0.6) : Rm - thick / 2, step = 2 * Math.PI * r0 / 12;
    const nodeR = circle ? Math.max(2, Math.min(step * 0.24, Rm * p.ring * 0.4)) : 0, tw = step * 0.86;
    const at = (i: number) => { const th = i * 30 * Math.PI / 180; return { x: cx + r0 * Math.sin(th), y: cy - r0 * Math.cos(th) }; };
    const slotOf = (pc: number) => (p.order === 'FIFTHS' ? (pc * 7) % 12 : pc); // vị trí quanh vòng của lớp cao độ (7 tự nghịch đảo mod 12)
    const asc = (s: string) => (derived.naming?.ascii ? romanAscii(s) : s);
    const labelOf = (pc: number) => (p.labels === 'DEGREES' && tonic !== null ? asc(romanOf(pc, tonic)) : pcName(pc, derived));
    if (p.outlineColor) out.push(poly(arcPts(cx, cy, r0, 0, 360), { closed: true, stroke: p.outlineColor, width: 1 }));
    if (arcW) {
      const outer = Math.min(W, H) / 2 - beatPad - arcW / 2;
      const k = p.progress === 'BAR' ? barPosAt(hudOf(derived, ast).bars, t).barPhase : clamp01(derived.index.duration > 0 ? t / derived.index.duration : 0);
      out.push(poly(arcPts(cx, cy, outer, 0, 360), { closed: true, stroke: p.dimColor, width: 1, alpha: p.dimAlpha }));
      if (k > 0) out.push(poly(arcPts(cx, cy, outer, 0, 360 * k), { stroke: accent, width: arcW }));
    }
    if (p.beatMarks) {
      const pos = barPosAt(hudOf(derived, ast).bars, t), n = Math.max(1, Math.min(16, pos.num)), outer = Math.min(W, H) / 2 - beatPad - arcW / 2, rl = Math.min(W, H) / 2 - beatPad / 2;
      for (let i = 0; i < n; i++) {
        const a = i * 360 / n, th = a * Math.PI / 180, on = i === pos.beat - 1, sx = Math.sin(th), sy = -Math.cos(th);
        out.push(poly([cx + (outer - 5) * sx, cy + (outer - 5) * sy, cx + (outer + 5) * sx, cy + (outer + 5) * sy], { stroke: on ? accent : p.dimColor, width: 1.5 }));
        T.text(out, String(i + 1), cx + rl * sx, cy + rl * sy + nst.size * 0.35, on ? { ...nst, color: accent } : nst, 'center', nst.size * 3);
      }
    }
    if (p.polygon && active.size >= 2) {
      const slots = [...active].map(slotOf).sort((x, y) => x - y), pts: number[] = [];
      for (const s of slots) { const q = at(s); pts.push(q.x, q.y); }
      const c = p.polygonColor || lit;
      out.push(poly(pts, { closed: active.size >= 3, fill: c, fillAlpha: p.polygonAlpha, stroke: c, width: 1.5 }));
    }
    const bass = pitches.length ? pitches[0] % 12 : -1, glowBlur = p.glow * 24, glowCol = p.glowColor || lit;
    for (let i = 0; i < 12; i++) {
      const pc = p.order === 'FIFTHS' ? (i * 7) % 12 : i, { x, y } = at(i), on = active.has(pc), halo = on && glowBlur > 0;
      if (circle) {
        // Đa giác (poly) chưa có phát sáng: nút sáng có glow vẽ bằng hình chữ nhật bo tròn hết cỡ, cùng màu, cùng viền.
        if (halo) out.push({ ...rect(x - nodeR, y - nodeR, 2 * nodeR, 2 * nodeR, lit, 1, nodeR), glowColor: glowCol, glowBlur, stroke: lit, strokeWidth: 1 });
        else out.push(poly(arcPts(x, y, nodeR, 0, 360, 40), { closed: true, fill: on ? lit : p.dimColor, fillAlpha: on ? 1 : 0.12, stroke: on ? lit : p.dimColor, width: 1, alpha: on ? 1 : p.dimAlpha }));
        if (pc === bass && p.rootColor) out.push(poly(arcPts(x, y, nodeR * 1.4, 0, 360, 48), { closed: true, stroke: p.rootColor, width: 2 }));
        if (p.showNames) T.text(out, labelOf(pc), x, y + nst.size * 0.35, on && p.litTextColor ? { ...nst, color: p.litTextColor } : nst, 'center', nodeR * 2.4);
      } else {
        const tile = rect(x - tw / 2, y - thick / 2, tw, thick, on ? lit : p.dimColor, on ? 1 : p.dimAlpha, 6, i * 30);
        out.push(halo ? { ...tile, glowColor: glowCol, glowBlur } : tile);
        if (pc === bass && p.rootColor) { // khung quanh thanh (đã xoay theo vị trí trên vòng)
          const th = i * 30 * Math.PI / 180, ux = Math.cos(th), uy = Math.sin(th), hw = tw / 2 + 3, hh = thick / 2 + 3;
          out.push(poly([x - ux * hw + uy * hh, y - uy * hw - ux * hh, x + ux * hw + uy * hh, y + uy * hw - ux * hh, x + ux * hw - uy * hh, y + uy * hw + ux * hh, x - ux * hw - uy * hh, y - uy * hw + ux * hh], { closed: true, stroke: p.rootColor, width: 2 }));
        }
        if (p.showNames) T.text(out, labelOf(pc), x, y + nst.size * 0.35, nst, 'center', tw * 1.6);
      }
    }
    const inner = circle ? r0 - nodeR * 1.6 : Rm - thick;
    let cyText = cy;
    const sub = p.subTemplate ? templateSpans(p.subTemplate, globalValues({ ast, derived, tracks }, t)) : null, sst = T.style(p.subStyle, 'label');
    if (p.showChord && pitches.length >= 2) {
      const nm = chordName(pitches), st = T.style(p.chordStyle, 'heading');
      if (nm) {
        const label = p.chordAs === 'DEGREE' && tonic !== null ? asc(chordDegree(nm, tonic, p.romanStyle)) : chordLabel(nm, derived);
        if (sub) cyText = cy - sst.size * 0.7;
        T.text(out, label, cx, cyText + st.size * 0.35, st, 'center', Math.max(10, inner * 1.7));
        if (sub) T.text(out, sub, cx, cyText + st.size * 0.35 + sst.size * 1.6, sst, 'center', Math.max(10, inner * 1.7));
        return out;
      }
    }
    if (sub) T.text(out, sub, cx, cy + sst.size * 0.35, sst, 'center', Math.max(10, inner * 1.7));
    return out;
  },
};

// ───────────────────────────── P-09 Drum pad ─────────────────────────────
/** Tên ngắn của trống GM (nốt 35–81, kênh 10). */
export const GM_DRUMS: Readonly<Record<number, string>> = Object.freeze({
  35: 'Kick 2', 36: 'Kick', 37: 'Rim', 38: 'Snare', 39: 'Clap', 40: 'Snare 2', 41: 'Tom L', 42: 'HH Closed', 43: 'Tom L2', 44: 'HH Pedal', 45: 'Tom M', 46: 'HH Open', 47: 'Tom M2', 48: 'Tom H', 49: 'Crash',
  50: 'Tom H2', 51: 'Ride', 52: 'China', 53: 'Ride Bell', 54: 'Tamb', 55: 'Splash', 56: 'Cowbell', 57: 'Crash 2', 58: 'Vibra', 59: 'Ride 2', 60: 'Bongo H', 61: 'Bongo L', 62: 'Conga M', 63: 'Conga H', 64: 'Conga L',
  65: 'Timbale H', 66: 'Timbale L', 67: 'Agogo H', 68: 'Agogo L', 69: 'Cabasa', 70: 'Maracas', 71: 'Whistle S', 72: 'Whistle L', 73: 'Guiro S', 74: 'Guiro L', 75: 'Claves', 76: 'Block H', 77: 'Block L',
  78: 'Cuica M', 79: 'Cuica O', 80: 'Triangle M', 81: 'Triangle O',
});
const padMemo = new WeakMap<TrackIndex, { drum: boolean; pitches: number[] }>();
const padsOf = (ti: TrackIndex) => {
  let r = padMemo.get(ti);
  if (!r) { const set = new Set<number>(); let ch9 = false; for (const n of ti.notes) { set.add(n.pitch); if (n.channel === 9) ch9 = true; } r = { drum: ch9 || isDrumTrack(ti.track.name), pitches: [...set].sort((a, b) => a - b) }; padMemo.set(ti, r); }
  return r;
};
export const drumPadRenderer: WidgetRenderer<DrumPadProps> = {
  type: 'DRUM_PAD',
  layout({ derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, { width: W, height: H } = spec.layout, out: Primitive[] = [], T = typo(textStyles, measure, fonts);
    const src = shown(tracks).filter((ti) => p.source === 'ALL' || padsOf(ti).drum), pads = [...new Set(src.flatMap((ti) => padsOf(ti).pitches))].sort((a, b) => a - b).slice(0, Math.round(p.maxPads));
    if (!pads.length) return out;
    const cols = Math.min(Math.round(p.cols), pads.length), rows = Math.ceil(pads.length / cols), cw = (W - p.gap * (cols - 1)) / cols, ch = (H - p.gap * (rows - 1)) / rows, decay = Math.max(0.001, p.decayMs / 1000), lst = T.style(p.labelStyle, 'tiny');
    pads.forEach((pitch, i) => {
      const x = (i % cols) * (cw + p.gap), y = Math.floor(i / cols) * (ch + p.gap); let k = 0, color = p.hitColor;
      for (const ti of src) for (const n of notesInRange(ti, t - decay, t)) if (n.pitch === pitch && n.startTimeSeconds <= t) { const a = 1 - (t - n.startTimeSeconds) / decay; if (a > k) { k = a; if (p.colorMode === 'TRACK') color = ti.track.color; } }
      out.push(rect(x, y, cw, ch, p.padColor, 1, p.radius));
      if (k > 0) out.push(rect(x, y, cw, ch, color, clamp01(k), p.radius));
      if (p.labels) T.text(out, GM_DRUMS[pitch] ?? noteName(pitch, derived), x + cw / 2, y + ch / 2 + lst.size * 0.35, lst, 'center', cw - 4);
    });
    return out;
  },
};

// ───────────────────────────── P-10 Tên đoạn (marker) ─────────────────────────────
export interface Cue { time: number; name: string }
/** Đoạn của bài: marker của dự án; không có thì dùng phase của scene (REQ-GRAPHICS-14). Sắp theo thời gian. */
export function sectionsOf(derived: Derived, markers: readonly { timeSeconds: number; name: string }[] | undefined): Cue[] {
  if (markers && markers.length) return markers.map((m) => ({ time: m.timeSeconds, name: m.name }));
  return (derived.phases ?? []).map((ph) => ({ time: ph.start, name: ph.name })).sort((a, b) => a.time - b.time);
}
export const sectionRenderer: WidgetRenderer<SectionProps> = {
  type: 'SECTION',
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, W = spec.layout.width, x = xFor(p.align, W), out: Primitive[] = [], T = typo(textStyles, measure, fonts);
    const cues = sectionsOf(derived, ast.meta.markers); if (!cues.length) return out;
    let i = -1; for (let j = 0; j < cues.length && cues[j].time <= t + 1e-9; j++) i = j;
    const st = T.style(p.style, 'heading'), nst = T.style(p.nextStyle, 'caption'), nx = cues[i + 1];
    const L = withLocals(globalValues({ ast, derived, tracks }, t), { section: i >= 0 ? cues[i].name : '', next: nx?.name ?? '', next_in: timeV(nx ? Math.max(0, nx.time - t) : 0), section_no: i + 1, section_elapsed: timeV(i >= 0 ? t - cues[i].time : 0) });
    const fade = i >= 0 && p.fadeMs > 0 ? clamp01((t - cues[i].time) / (p.fadeMs / 1000)) : 1;
    if (i >= 0) T.text(out, templateSpans(p.template, L), x, base(st.size), st, p.align, W, fade);
    if (p.showNext && nx) T.text(out, templateSpans(p.nextTemplate, L), x, base(st.size) + nst.size * 1.6, nst, p.align, W);
    return out;
  },
};

// ───────────────────────────── P-11 Lời ─────────────────────────────
interface LyricLine { start: number; end: number; parts: { text: string; time: number }[] }
const lineMemo = new WeakMap<object, Map<string, LyricLine[]>>();
/** Gom âm tiết (MIDI Lyric/Text) thành dòng: ngắt khi gặp `/` hoặc `\` (kiểu .kar), khi nghỉ quá `gapSec` hoặc dòng dài quá `maxChars`. Tệp không có khoảng trắng nào: nối âm tiết bằng dấu cách, trừ âm tiết kết thúc bằng `-`. */
export function lyricLines(lyrics: readonly { timeSeconds: number; text: string }[], gapSec: number, maxChars: number): LyricLine[] {
  let memo = lineMemo.get(lyrics); if (!memo) lineMemo.set(lyrics, (memo = new Map()));
  const key = `${gapSec}|${maxChars}`, hit = memo.get(key); if (hit) return hit;
  const spaced = lyrics.some((l) => /\s/.test(l.text)), lines: LyricLine[] = []; let cur: LyricLine | null = null, chars = 0, prevEnd = -Infinity;
  for (const l of lyrics) {
    let text = l.text, brk = false;
    if (/^[\\/]/.test(text)) { brk = true; text = text.replace(/^[\\/]+/, ''); }
    if (!text) { if (brk) cur = null; continue; }
    if (!cur || brk || l.timeSeconds - prevEnd > gapSec || chars + text.length > maxChars) { cur = { start: l.timeSeconds, end: l.timeSeconds, parts: [] }; lines.push(cur); chars = 0; }
    const joined = spaced ? text : text.endsWith('-') ? text.slice(0, -1) : text + ' ';
    cur.parts.push({ text: joined, time: l.timeSeconds }); cur.end = l.timeSeconds; chars += joined.length; prevEnd = l.timeSeconds;
  }
  memo.set(key, lines); return lines;
}
export const lyricsRenderer: WidgetRenderer<LyricsProps> = {
  type: 'LYRICS',
  layout({ ast, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, W = spec.layout.width, x = xFor(p.align, W), out: Primitive[] = [], T = typo(textStyles, measure, fonts), ly = ast.meta.lyrics;
    if (!ly || !ly.length) return out;
    const lines = lyricLines(ly, p.gapSec, Math.round(p.maxChars)); let i = -1; for (let j = 0; j < lines.length && lines[j].start <= t + 1e-9; j++) i = j;
    const st = T.style(p.style, 'body'), nst = T.style(p.nextStyle, 'caption'), cur = i >= 0 ? lines[i] : null, nxt = lines[i + 1];
    if (cur && (t <= cur.end + p.hideAfterSec || (nxt && t >= nxt.start))) {
      const spans: TextSpan[] = cur.parts.map((q) => (q.time <= t + 1e-9 ? { text: q.text } : { text: q.text, style: p.unsungStyle }));
      T.text(out, spans, x, base(st.size), st, p.align, W);
    }
    if (p.showNext && nxt) T.text(out, nxt.parts.map((q) => q.text).join(''), x, base(st.size) + nst.size * 1.8, nst, p.align, W, 0.8);
    return out;
  },
};

// ───────────────────────────── P-13 Automation lane ─────────────────────────────
const laneValue = (lane: AutomationLane, tick: number, p: AutomationProps): number => {
  const v = sampleLane(lane as never, tick) as number | undefined; if (v === undefined) return 0;
  return laneNorm(lane, v, { floorDb: p.floorDb, ceilDb: p.ceilDb });
};
/** Chữ giá trị hiện tại của lane theo loại: dB (âm lượng), L/C/R (pan), số thô 0–127 (CC), ±1 (pitch bend), % theo `range` (loại khác). */
export function laneValueText(lane: Pick<AutomationLane, 'kind' | 'range'>, v: number): string {
  switch (lane.kind) {
    case 'volume': { const db = v > 1e-6 ? 20 * Math.log10(v) : -Infinity; return db <= -120 ? '-∞ dB' : `${db.toFixed(1)} dB`; }
    case 'pan': return Math.abs(v) < 0.005 ? 'C' : `${v < 0 ? 'L' : 'R'}${Math.round(Math.abs(v) * 100)}`;
    case 'midi-cc': return String(Math.round(v));
    case 'pitch-bend': { const n = v / (v < 0 ? 8192 : 8191); return Math.abs(n) < 0.005 ? '0' : `${n > 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}`; }
    default: return lane.range && lane.range.max !== lane.range.min ? `${Math.round(laneNorm(lane, v) * 100)}%` : v.toFixed(2);
  }
}
export const automationRenderer: WidgetRenderer<AutomationProps> = {
  type: 'AUTOMATION',
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, { width: W, height: H } = spec.layout, out: Primitive[] = [], T = typo(textStyles, measure, fonts), dur = derived.index.duration;
    const withLane = shown(tracks).filter((ti) => ti.track.automation?.[p.lane]?.points?.length).slice(0, 8);
    if (!withLane.length || dur <= 0) return out;
    const win = p.windowSec > 0 ? p.windowSec : dur, t0 = p.windowSec > 0 ? t - p.playheadRatio * win : 0, cols = Math.max(20, Math.min(400, Math.floor(W / 2))), bw = W / cols, th = Math.max(1, p.thickness), vst = T.style(p.valueStyle, 'tiny');
    for (const ti of withLane) {
      const lane = ti.track.automation![p.lane]!, col = p.colorMode === 'TRACK' ? ti.track.color : p.color; let prev = NaN;
      for (let c = 0; c < cols; c++) {
        const sec = t0 + ((c + 0.5) / cols) * win; if (sec < 0 || sec > dur) { prev = NaN; continue; }
        const y = (1 - laneValue(lane, secToTick(ast.tempoMap as never, sec), p)) * (H - th);
        if (p.fill) out.push(rect(c * bw, y + th, Math.max(0.5, bw), Math.max(0, H - y - th), col, p.fillAlpha));
        const a = Number.isFinite(prev) ? Math.min(y, prev) : y, b = Number.isFinite(prev) ? Math.max(y, prev) : y;
        out.push(rect(c * bw, a, Math.max(0.5, bw), b - a + th, col, 1)); prev = y;
      }
    }
    if (p.playheadColor && p.windowSec > 0) out.push(rect(W * p.playheadRatio, 0, 1.5, H, p.playheadColor, 0.9));
    else if (p.playheadColor) out.push(rect(Math.min(W - 1.5, (t / dur) * W), 0, 1.5, H, p.playheadColor, 0.9));
    if (p.showValue) {
      const ti = withLane[0], lane = ti.track.automation![p.lane]!, v = sampleLane(lane as never, secToTick(ast.tempoMap as never, t)) as number | undefined;
      if (v !== undefined) {
        const text = laneValueText(lane, v);
        T.text(out, text, W - 2, vst.size * 1.1, vst, 'right', W);
      }
    }
    return out;
  },
};

export const INSIGHT_RENDERERS = {
  TEMPO_INFO: tempoInfoRenderer, BAR_BEAT: barBeatRenderer, KEY_SCALE: keyScaleRenderer, VELOCITY: velocityRenderer, PITCH_WHEEL: pitchWheelRenderer,
  DRUM_PAD: drumPadRenderer, SECTION: sectionRenderer, LYRICS: lyricsRenderer, AUTOMATION: automationRenderer,
} as const;
void listV; void block;
