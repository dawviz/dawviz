// Sáu widget chữ của T-69 (SRS REQ-WIDGET-02…06, 08): Track Info, Event Counter, Live Note Trigger, Time & Bar Counter,
// Chord Detection, Progress Bar. Mọi hàm layout là hàm thuần của (spec, t, AST, derived); số đếm tính sẵn trong HudData
// (tổng tích luỹ + tìm nhị phân), không quét lại toàn bộ nốt mỗi khung. Chữ lấy từ MẪU trong thuộc tính widget, không từ locales/ của app.
import { detect } from '@tonaljs/chord-detect';
import { notesInRange, type TimelineIndex, type TrackIndex } from './notes.ts';
import type { ASTNote, TempoPoint, UnifiedProjectAST } from './types.ts';
import type { Derived, Primitive, RectPrim, WidgetRenderer } from './prims.ts';
import { clockMs, fixed, groupDigits, pad, type Measure } from './text.ts';
import { pitchName } from './music.ts';
import { DEFAULT_TEXT_STYLES, resolveTextStyle, templateSpans, textPrims, textWidth, type Align, type TextRef, type TextSpan, type TextStyle, type TextStyleSet } from './typography.ts';

// ───────────────────────────── thuộc tính ─────────────────────────────
export type { Align };
export interface LineCfg { enabled: boolean; template: string }

// Mọi chữ là TextRef (T-72): kiểu dựng sẵn `styleId` + ghi đè. Thiếu `styleId` thì dùng kiểu mặc định của chỗ đó (TEXT_FIELDS).
// `valueStyle`/`notesValueStyle`/`timeValueStyle`/`bassStyle`: ghi đè cho một đoạn trong dòng (định dạng từng đoạn), rỗng = như cả dòng.
export interface TrackInfoProps { align: Align; titleText: string; titleStyle: TextRef; artistText: string; artistStyle: TextRef }
export interface EventCounterProps { align: Align; style: TextRef; valueStyle: TextRef; lineHeight: number; decimals: number; lines: { played: LineCfg; total: LineCfg; progress: LineCfg; tempo: LineCfg } }
export interface LiveTriggerProps { mode: 'list' | 'inline'; align: Align; style: TextRef; valueStyle: TextRef; template: string; showTrack: boolean; trackTemplate: string; tailMs: number; maxLines: number; lineHeight: number; separator: string }
export interface ClockCfg { enabled: boolean; label: string }
export interface TimeBarProps {
  style: TextRef; labelStyle: TextRef; rowGap: number;
  time: ClockCfg & { format: 'grouped' | 'clock' }; beat: ClockCfg & { format: 'grouped' | 'bbs' };
  timeGroups: [number, number, number]; beatGroups: [number, number, number];
  showBars: boolean; barLength: number; barThickness: number; barColor: string; barTrackColor: string;
}
export type ChordMode = 'sustained' | 'strike';
export interface ChordProps { mode: ChordMode; align: Align; nameStyle: TextRef; bassStyle: TextRef; notesStyle: TextRef; notesValueStyle: TextRef; alwaysShowNotes: boolean; notesTemplate: string; unrecognized: 'nc' | 'notes'; noChordText: string }
export interface ProgressBarProps { orientation: 'HORIZONTAL' | 'VERTICAL'; thickness: number; progressColor: string; trackColor: string; radius: number; showTime: boolean; timeStyle: TextRef; timeValueStyle: TextRef; timeTemplate: string; timeAlign: Align }

/** Chỗ có chữ trong từng widget → kiểu dựng sẵn mặc định (REQ-GRAPHICS-18). Trường `…ValueStyle`/`bassStyle` là ghi đè một đoạn, kiểu gốc là của dòng chứa nó. */
export const TEXT_FIELDS = {
  TRACK_INFO: { titleStyle: 'title', artistStyle: 'subtitle' },
  EVENT_COUNTER: { style: 'counter', valueStyle: null },
  LIVE_TRIGGER: { style: 'caption', valueStyle: null },
  TIME_BAR: { style: 'clock', labelStyle: 'label' },
  CHORD_DETECTION: { nameStyle: 'heading', bassStyle: null, notesStyle: 'body', notesValueStyle: null },
  PROGRESS_BAR: { timeStyle: 'tiny', timeValueStyle: null },
} as const satisfies Record<string, Record<string, keyof typeof DEFAULT_TEXT_STYLES | null>>;
const ts = (styleId: string): TextRef => ({ styleId });
export const DEFAULT_TRACK_INFO: Readonly<TrackInfoProps> = Object.freeze({ align: 'left', titleText: '', titleStyle: ts('title'), artistText: '', artistStyle: ts('subtitle') });
export const DEFAULT_EVENT_COUNTER: Readonly<EventCounterProps> = Object.freeze({
  align: 'right', style: ts('counter'), valueStyle: {}, lineHeight: 1.45, decimals: 2,
  lines: { played: { enabled: true, template: 'Num played notes: {played}/{total} ({pct})' }, total: { enabled: false, template: 'Num events: {total}' },
    progress: { enabled: false, template: 'Progress: {pct}' }, tempo: { enabled: false, template: 'Tempo: {tempo} BPM' } },
});
export const DEFAULT_LIVE_TRIGGER: Readonly<LiveTriggerProps> = Object.freeze({
  mode: 'list', align: 'right', style: ts('caption'), valueStyle: {}, template: 'Note: {name} (Vel: {velocity})', showTrack: false, trackTemplate: '< {track}',
  tailMs: 300, maxLines: 6, lineHeight: 1.4, separator: '   ',
});
export const DEFAULT_TIME_BAR: Readonly<TimeBarProps> = Object.freeze<TimeBarProps>({
  style: ts('clock'), labelStyle: ts('label'), rowGap: 1.9,
  time: { enabled: true, label: 'time', format: 'grouped' }, beat: { enabled: true, label: 'beat', format: 'grouped' },
  timeGroups: [3, 2, 3], beatGroups: [3, 2, 3],
  showBars: true, barLength: 64, barThickness: 3, barColor: '#999999', barTrackColor: '#E4E4E4',
});
export const DEFAULT_CHORD: Readonly<ChordProps> = Object.freeze({
  mode: 'sustained', align: 'right', nameStyle: ts('heading'), bassStyle: {}, notesStyle: ts('body'), notesValueStyle: {},
  alwaysShowNotes: false, notesTemplate: 'Notes: {notes}', unrecognized: 'nc', noChordText: 'N.C.',
});
export const DEFAULT_PROGRESS_BAR: Readonly<ProgressBarProps> = Object.freeze({
  orientation: 'HORIZONTAL', thickness: 12, progressColor: '#CCCCCC', trackColor: '', radius: 0, showTime: true,
  timeStyle: ts('tiny'), timeValueStyle: {}, timeTemplate: '{elapsed} / {total}', timeAlign: 'right',
});

/** Chỗ giữ được phép dùng trong mẫu chữ theo widget (preset dùng chỗ giữ lạ → cảnh báo, chữ giữ nguyên). */
export const TEMPLATE_KEYS = {
  EVENT_COUNTER: ['played', 'total', 'pct', 'tempo'], LIVE_TRIGGER: ['name', 'velocity', 'track', 'pitch'],
  CHORD_DETECTION: ['notes', 'chord'], PROGRESS_BAR: ['elapsed', 'total', 'remaining', 'pct'],
} as const;

// ───────────────────────────── dữ liệu dẫn xuất ─────────────────────────────
interface SigSeg { tick: number; num: number; den: number; barStart: number }
export interface BarGrid { ppq: number; tempo: { tick: number; sec: number; bpm: number }[]; sigs: SigSeg[] }
export interface HudData { starts: Map<string, Float64Array>; bars: BarGrid; chords: Map<string, ChordSeg[]> }
export interface ChordSeg { start: number; end: number; pitches: number[]; name: string | null }
export interface BarPos { bar: number; beat: number; sub: number; beatPhase: number; barPhase: number; bpm: number; num: number; den: number }

export function buildBarGrid(tempoMap: TempoPoint[], ppq = 960): BarGrid {
  const tempo = tempoMap.map((p) => ({ tick: p.tick, sec: p.timeSeconds, bpm: p.bpm }));
  const sigs: SigSeg[] = [];
  for (const p of tempoMap) {
    const num = p.timeSigNumerator || 4, den = p.timeSigDenominator || 4, last = sigs[sigs.length - 1];
    if (last && last.num === num && last.den === den) continue; // chỉ đổi tempo: ô nhịp không bị ngắt
    const barStart = last ? last.barStart + Math.ceil((p.tick - last.tick) / (ppq * 4 / last.den * last.num)) : 0;
    sigs.push({ tick: p.tick, num, den, barStart });
  }
  if (!sigs.length) sigs.push({ tick: 0, num: 4, den: 4, barStart: 0 });
  if (!tempo.length) tempo.push({ tick: 0, sec: 0, bpm: 120 });
  return { ppq, tempo, sigs };
}
const lastLE = <T>(arr: T[], key: (x: T) => number, v: number): T => {
  let lo = 0, hi = arr.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (key(arr[mid]) <= v) lo = mid; else hi = mid - 1; }
  return arr[lo];
};
/** Vị trí nhạc tại t (giây). Bar, Beat đếm từ 1; Sub là tick lẻ trong beat. Một beat dài ppq×4/den tick. */
export function barPosAt(g: BarGrid, t: number): BarPos {
  const tp = lastLE(g.tempo, (x) => x.sec, Math.max(0, t));
  const tick = Math.max(0, tp.tick + (Math.max(0, t) - tp.sec) * tp.bpm / 60 * g.ppq);
  const sg = lastLE(g.sigs, (x) => x.tick, tick);
  const perBeat = g.ppq * 4 / sg.den, perBar = perBeat * sg.num, rel = tick - sg.tick;
  const bar = Math.floor(rel / perBar), inBar = rel - bar * perBar, beat = Math.floor(inBar / perBeat), inBeat = inBar - beat * perBeat;
  return { bar: sg.barStart + bar + 1, beat: beat + 1, sub: Math.floor(inBeat), beatPhase: inBeat / perBeat, barPhase: inBar / perBar, bpm: tp.bpm, num: sg.num, den: sg.den };
}

/** Nhóm track + chế độ của một widget Chord Detection. */
export interface ChordGroup { tracks: TrackIndex[]; mode: ChordMode }
/** `chordGroups`: các nhóm track mà widget Chord Detection sẽ đọc; dò hợp âm (@tonaljs/chord-detect) chạy ở ĐÂY, ở bước derived, không chạy khi vẽ khung. */
export function buildHud(ast: UnifiedProjectAST, index: TimelineIndex, chordGroups: ChordGroup[] = []): HudData {
  const starts = new Map<string, Float64Array>();
  for (const ti of index.tracks) starts.set(ti.track.id, Float64Array.from(ti.notes, (n) => n.startTimeSeconds)); // đã sắp theo bắt đầu
  const hud: HudData = { starts, bars: buildBarGrid(ast.tempoMap, ast.meta.internalPPQ || 960), chords: new Map() };
  for (const g of chordGroups) chordTimeline(hud, shown(g.tracks), g.mode);
  return hud;
}
/** HudData của derived. `layoutFrame` bảo đảm `derived.hud` có sẵn (dựng ở bước derived); thiếu thì chỉ còn số đếm/lưới ô nhịp, không có hợp âm. */
export function hudOf(derived: Derived, ast: UnifiedProjectAST): HudData {
  return derived.hud ?? buildHud(ast, derived.index);
}
const upperBound = (a: Float64Array, v: number) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] <= v) lo = m + 1; else hi = m; } return lo; };
const shown = (tracks: TrackIndex[]) => tracks.filter((ti) => ti.track.isVisible);

/** Trống không có cao độ hoà âm: kênh MIDI 10 (chỉ số 9) và track tên Drums/Percussion bị loại khỏi nhận diện hợp âm (SRS REQ-WIDGET-06 nguồn nốt). */
const DRUM_CHANNEL = 9;
export const isDrumTrack = (name: string) => /\b(drums?|percussion|perc|kit)\b|\(drums\)|trống/i.test(name);
const chordKey = (tracks: TrackIndex[], mode: ChordMode = 'sustained') => `${mode}:${tracks.map((ti) => ti.track.id).join('|')}`;
/** Khung gom nốt của chế độ Strike: các nốt bắt đầu cách nốt đầu nhóm ≤ 30 ms là một lần dập (SRS REQ-WIDGET-06). */
export const STRIKE_WINDOW_SEC = 0.03;
/** Danh sách đoạn hợp âm (SRS REQ-WIDGET-06) của một nhóm track theo chế độ; đệm theo (derived, chế độ, nhóm track). */
export function chordTimeline(hud: HudData, tracks: TrackIndex[], mode: ChordMode = 'sustained'): ChordSeg[] {
  const key = chordKey(tracks, mode);
  const hit = hud.chords.get(key); if (hit) return hit;
  const notes: ASTNote[] = [];
  for (const ti of tracks) if (!isDrumTrack(ti.track.name)) for (const n of ti.notes) if (n.channel !== DRUM_CHANNEL) notes.push(n);
  const raw = mode === 'strike' ? strikeSegments(notes) : sustainedSegments(notes);
  // Đoạn ngắn hơn 80 ms gộp vào đoạn trước (SOI-09 [PROVISIONAL]); đoạn liền kề cùng nốt thì hợp nhất.
  const out: ChordSeg[] = [];
  for (const s of raw) {
    const prev = out[out.length - 1];
    if (prev && (s.end - s.start < 0.08 || (prev.name === s.name && prev.pitches.join() === s.pitches.join()))) { prev.end = s.end; continue; }
    out.push({ ...s });
  }
  hud.chords.set(key, out);
  return out;
}
/** Sustained: mọi nốt đang giữ tại t. */
function sustainedSegments(notes: ASTNote[]): ChordSeg[] {
  const ev: { t: number; p: number; d: number }[] = [];
  for (const n of notes) { ev.push({ t: n.startTimeSeconds, p: n.pitch, d: 1 }); ev.push({ t: n.endTimeSeconds, p: n.pitch, d: -1 }); }
  ev.sort((a, b) => a.t - b.t || a.p - b.p || a.d - b.d);
  const raw: ChordSeg[] = [], held = new Map<number, number>();
  for (let i = 0; i < ev.length;) {
    const t0 = ev[i].t;
    for (; i < ev.length && ev[i].t === t0; i++) { const c = (held.get(ev[i].p) ?? 0) + ev[i].d; if (c > 0) held.set(ev[i].p, c); else held.delete(ev[i].p); }
    const pitches = [...held.keys()].sort((a, b) => a - b);
    const prev = raw[raw.length - 1]; if (prev) prev.end = t0;
    raw.push({ start: t0, end: Infinity, pitches, name: chordName(pitches) });
  }
  return raw;
}
/**
 * Strike: nốt bắt đầu cách nốt đầu nhóm ≤ STRIKE_WINDOW_SEC gom thành một lần dập; tên giữ đến lần dập kế.
 * Nhóm chỉ có một pitch class (nốt giai điệu đơn, quãng tám) không phải lần dập hợp âm: không cắt tên đang giữ.
 * Tên giữ qua cả chỗ nhả nốt (staccato) đúng như SRS; lần dập cuối giữ đến khi nốt cuối cùng tắt.
 */
function strikeSegments(notes: ASTNote[]): ChordSeg[] {
  const sorted = [...notes].sort((a, b) => a.startTimeSeconds - b.startTimeSeconds || a.pitch - b.pitch);
  const raw: ChordSeg[] = [];
  let soundEnd = -Infinity; // thời điểm nốt cuối cùng tắt
  for (let i = 0; i < sorted.length;) {
    const t0 = sorted[i].startTimeSeconds, group = new Set<number>();
    let groupEnd = -Infinity;
    for (; i < sorted.length && sorted[i].startTimeSeconds - t0 <= STRIKE_WINDOW_SEC; i++) { group.add(sorted[i].pitch); groupEnd = Math.max(groupEnd, sorted[i].endTimeSeconds); }
    const prev = raw[raw.length - 1];
    soundEnd = Math.max(soundEnd, groupEnd);
    if (new Set([...group].map((p) => p % 12)).size < 2) continue;
    const pitches = [...group].sort((a, b) => a - b);
    if (prev) prev.end = t0;
    raw.push({ start: t0, end: Infinity, pitches, name: chordName(pitches) });
  }
  const last = raw[raw.length - 1]; if (last) last.end = soundEnd;
  return raw;
}
const PC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function chordName(pitches: number[]): string | null {
  if (pitches.length < 2) return null;
  const pcs: string[] = []; // nốt thấp nhất đứng đầu: hợp âm đảo ra dạng "E7/G#"
  for (const p of pitches) { const n = PC[p % 12]; if (!pcs.includes(n)) pcs.push(n); }
  if (pcs.length < 2) return null;
  const d = detect(pcs)[0]; if (!d) return null;
  return d.replace(/^([A-G][#b]?)M(?=\/|$)/, '$1');   // tonal gọi tam hợp trưởng là "CM"; ký hiệu thường dùng là "C" (CM7 giữ nguyên)
}
function chordAt(segs: ChordSeg[], t: number): ChordSeg | null {
  let lo = 0, hi = segs.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (segs[m].start <= t) { r = m; lo = m + 1; } else hi = m - 1; }
  return r >= 0 && t < segs[r].end && segs[r].pitches.length ? segs[r] : null;
}

// ───────────────────────────── trợ giúp vẽ chữ ─────────────────────────────
const xFor = (align: Align, width: number) => (align === 'left' ? 0 : align === 'center' ? width / 2 : width);
/** Bộ dựng chữ của một lần layout: kiểu của scene + hàm đo. `text` thêm primitive vào `out`, trả bước tiến dọc (chữ xuống dòng cao hơn một dòng). */
function typo(set: TextStyleSet | undefined, measure: Measure) {
  const S = set ?? DEFAULT_TEXT_STYLES;
  return {
    style: (ref: TextRef | undefined, fallbackId: string): TextStyle => resolveTextStyle(ref, S, fallbackId),
    text(out: Primitive[], s: string | readonly TextSpan[], x: number, y: number, st: TextStyle, align: Align, maxWidth: number, alpha = 1): number {
      const r = textPrims(s, st, x, y, align, maxWidth, measure, alpha, S);
      for (const p of r.prims) out.push(p);
      return r.height;
    },
    width: (s: string | readonly TextSpan[], st: TextStyle) => textWidth(s, st, measure, S),
  };
}
const base = (size: number) => size * 0.95; // baseline dòng đầu so với mép trên widget
/** Độ rộng ổn định: chữ số tính theo ô chữ số rộng nhất (chữ số đều bề rộng), để nhãn đặt cạnh số không nhảy khi số đổi. */
const stableWidth = (T: ReturnType<typeof typo>, s: string, st: TextStyle) => T.width(s, { ...st, tabularNums: true });
const block = (x: number, y: number, w: number, h: number, fill: string, radius = 0): RectPrim =>
  ({ kind: 'rect', x, y, w, h, fill, alpha: 1, radius: Math.min(radius, h / 2, w / 2), glowColor: '', glowBlur: 0, stroke: '', strokeWidth: 0 });
const pct = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));

// ───────────────────────────── widget ─────────────────────────────
export const trackInfoRenderer: WidgetRenderer<TrackInfoProps> = {
  type: 'TRACK_INFO',
  layout({ ast, measure, textStyles }, spec) {
    const p = spec.properties, W = spec.layout.width, x = xFor(p.align, W), out: Primitive[] = [], T = typo(textStyles, measure);
    const ts1 = T.style(p.titleStyle, 'title'), ts2 = T.style(p.artistStyle, 'subtitle');
    const title = p.titleText || ast.meta.title || '', artist = p.artistText || (ast.meta as { artist?: string }).artist || '';
    const y1 = ts1.size * 0.8;
    // Tên bài xuống nhiều dòng (kiểu bật wrap) đẩy dòng nghệ sĩ xuống theo số dòng thật.
    const extra = title ? T.text(out, title, x, y1, ts1, p.align, W) - ts1.size * ts1.leading : 0;
    if (artist) T.text(out, artist, x, (title ? y1 + Math.max(0, extra) : 0) + ts2.size * (title ? 1.5 : 0.8), ts2, p.align, W);
    return out;
  },
};

export const eventCounterRenderer: WidgetRenderer<EventCounterProps> = {
  type: 'EVENT_COUNTER',
  layout({ ast, derived, tracks, measure, textStyles }, spec, t) {
    const p = spec.properties, W = spec.layout.width, x = xFor(p.align, W), hud = hudOf(derived, ast), out: Primitive[] = [], T = typo(textStyles, measure);
    const st = T.style(p.style, 'counter');
    let played = 0, total = 0;
    for (const ti of shown(tracks)) { const s = hud.starts.get(ti.track.id); if (!s) continue; total += s.length; played += upperBound(s, t); }
    const bpm = barPosAt(hud.bars, t).bpm;
    const v = { played, total, pct: `${fixed(total ? played / total * 100 : 0, p.decimals)}%`, tempo: String(Math.round(bpm * 100) / 100) };
    let row = 0;
    for (const k of ['played', 'total', 'progress', 'tempo'] as const) {
      const cfg = p.lines[k]; if (!cfg.enabled) continue;
      T.text(out, templateSpans(cfg.template, v, p.valueStyle), x, base(st.size) + row * st.size * p.lineHeight, st, p.align, W); row++;
    }
    return out;
  },
};

export const liveTriggerRenderer: WidgetRenderer<LiveTriggerProps> = {
  type: 'LIVE_TRIGGER',
  layout({ tracks, measure, textStyles }, spec, t) {
    const p = spec.properties, W = spec.layout.width, out: Primitive[] = [], tail = p.tailMs / 1000, T = typo(textStyles, measure);
    const st = T.style(p.style, 'caption');
    const items: { n: ASTNote; track: TrackIndex; alpha: number }[] = [];
    for (const ti of shown(tracks)) for (const n of notesInRange(ti, t - tail, t)) {
      if (n.startTimeSeconds > t) continue;
      if (t < n.endTimeSeconds) items.push({ n, track: ti, alpha: 1 });
      else if (tail > 0 && t < n.endTimeSeconds + tail) items.push({ n, track: ti, alpha: 1 - (t - n.endTimeSeconds) / tail });
    }
    items.sort((a, b) => b.n.pitch - a.n.pitch || a.track.track.index - b.track.track.index || a.n.startTimeSeconds - b.n.startTimeSeconds);
    if (!items.length) return out;
    const label = (it: typeof items[number]) => templateSpans(p.template, { name: pitchName(it.n.pitch), velocity: Math.round(it.n.velocity), track: it.track.track.name, pitch: it.n.pitch }, p.valueStyle);
    const w = (s: string | readonly TextSpan[]) => T.width(s, st), y = base(st.size);
    if (p.mode === 'list') {
      const shownItems = items.slice(0, p.maxLines), more = items.length - shownItems.length;
      shownItems.forEach((it, i) => {
        const s = [...label(it), ...(p.showTrack ? templateSpans(' ' + p.trackTemplate, { track: it.track.track.name }, p.valueStyle) : [])];
        T.text(out, s, xFor(p.align, W), y + i * st.size * p.lineHeight, st, p.align, W, it.alpha);
      });
      if (more > 0) T.text(out, `+${more}`, xFor(p.align, W), y + shownItems.length * st.size * p.lineHeight, st, p.align, W, 1);
      return out;
    }
    // Một dòng ngang: nối các nốt (cao → thấp), hậu tố tên track một lần cuối dòng; quá rộng thì bỏ nốt thấp nhất, thêm "+N".
    const names = (list: typeof items) => [...new Set(list.map((it) => it.track.track.name))].join(', ');
    const suffix = (list: typeof items): TextSpan[] => (p.showTrack ? templateSpans(p.trackTemplate, { track: names(list) }, p.valueStyle) : []);
    let keep = items.length, dropped = 0;
    const totalW = (n: number) => {
      const part = items.slice(0, n), sfx = suffix(part), extra = items.length - n;
      return part.reduce((s, it, i) => s + w(label(it)) + (i ? w(p.separator) : 0), 0) + (sfx.length ? w(p.separator) + w(sfx) : 0) + (extra ? w(p.separator) + w(`+${extra}`) : 0);
    };
    while (keep > 1 && totalW(keep) > W) keep--;
    dropped = items.length - keep;
    const part = items.slice(0, keep), segs: { s: string | TextSpan[]; a: number }[] = part.map((it) => ({ s: label(it), a: it.alpha }));
    if (suffix(part).length) segs.push({ s: suffix(part), a: 1 });
    if (dropped) segs.push({ s: `+${dropped}`, a: 1 });
    const sepW = w(p.separator), total = segs.reduce((s, g, i) => s + w(g.s) + (i ? sepW : 0), 0);
    let x = p.align === 'left' ? 0 : p.align === 'center' ? (W - total) / 2 : W - total;
    segs.forEach((g, i) => {
      if (i) x += sepW;
      T.text(out, g.s, x, y, st, 'left', Math.max(0, W - x), g.a); x += w(g.s);
    });
    return out;
  },
};

export const timeBarRenderer: WidgetRenderer<TimeBarProps> = {
  type: 'TIME_BAR',
  layout({ ast, derived, measure, textStyles }, spec, t) {
    const p = spec.properties, W = spec.layout.width, hud = hudOf(derived, ast), out: Primitive[] = [], T = typo(textStyles, measure);
    const st = T.style(p.style, 'clock'), lst = T.style(p.labelStyle, 'label');
    const pos = barPosAt(hud.bars, t), tt = Math.max(0, t);
    const totalMs = Math.floor(tt * 1000 + 1e-6), m = Math.floor(totalMs / 60000), s = Math.floor(totalMs / 1000) % 60, ms = totalMs % 1000; // số nguyên ms: không lệch do dấu phẩy động
    const rows: { cfg: ClockCfg; text: string; bars: boolean }[] = [];
    if (p.time.enabled) rows.push({ cfg: p.time, bars: false, text: p.time.format === 'grouped' ? groupDigits([m, s, ms], p.timeGroups) : `${pad(m, 2)}:${pad(s, 2)}.${pad(ms, 3)}` });
    if (p.beat.enabled) rows.push({ cfg: p.beat, bars: p.showBars, text: p.beat.format === 'grouped' ? groupDigits([pos.bar, pos.beat, pos.sub], p.beatGroups) : `${pos.bar}.${pos.beat}.${pad(pos.sub, 3)}` });
    let y = base(st.size);
    for (const r of rows) {
      T.text(out, r.text, 0, y, st, 'left', W);
      if (r.cfg.label) {
        const nx = stableWidth(T, r.text, st) + 6;
        T.text(out, r.cfg.label, nx, y - st.size * 0.62, lst, 'left', Math.max(0, W - nx));
      }
      if (r.bars) { // hai vạch mảnh: tiến độ trong beat, rồi trong ô nhịp
        const bh = p.barThickness, L = Math.min(p.barLength, W);
        [pos.beatPhase, pos.barPhase].forEach((ph, i) => {
          const by = y + 6 + i * (bh + 3);
          if (p.barTrackColor) out.push(block(0, by, L, bh, p.barTrackColor));
          const fw = L * pct(ph); if (fw > 0) out.push(block(0, by, fw, bh, p.barColor));
        });
        y += 6 + 2 * p.barThickness + 3;
      }
      y += st.size * p.rowGap;
    }
    return out;
  },
};

export const chordRenderer: WidgetRenderer<ChordProps> = {
  type: 'CHORD_DETECTION',
  layout({ ast, derived, tracks, measure, textStyles }, spec, t) {
    const p = spec.properties, W = spec.layout.width, x = xFor(p.align, W), out: Primitive[] = [], T = typo(textStyles, measure);
    const nst = T.style(p.nameStyle, 'heading'), bst = T.style(p.notesStyle, 'body');
    const seg = chordAt(hudOf(derived, ast).chords.get(chordKey(shown(tracks), p.mode)) ?? [], t);
    const notes = seg ? seg.pitches.map((n) => pitchName(n)).join(' ') : '';
    const name = seg?.name ?? null;
    const notesLine = notes ? templateSpans(p.notesTemplate, { notes, chord: name ?? '' }, p.notesValueStyle) : [];
    const y1 = nst.size * 0.85;
    if (name) {
      T.text(out, chordSpans(name, p.bassStyle), x, y1, nst, p.align, W);
      if (p.alwaysShowNotes && notesLine.length) T.text(out, notesLine, x, y1 + bst.size * 1.6, bst, p.align, W);
    } else if (seg) { // có nốt nhưng không nhận diện được: "N.C." hoặc danh sách nốt
      if (p.unrecognized === 'notes' && notesLine.length) T.text(out, notesLine, x, base(bst.size), bst, p.align, W);
      else if (p.unrecognized === 'nc') {
        T.text(out, p.noChordText, x, y1, nst, p.align, W);
        if (p.alwaysShowNotes && notesLine.length) T.text(out, notesLine, x, y1 + bst.size * 1.6, bst, p.align, W);
      }
    }
    return out;
  },
};

export const progressBarRenderer: WidgetRenderer<ProgressBarProps> = {
  type: 'PROGRESS_BAR',
  layout({ derived, measure, textStyles }, spec, t) {
    const p = spec.properties, { width: W, height: H } = spec.layout, out: Primitive[] = [], T = typo(textStyles, measure);
    const dur = derived.index.duration, P = dur > 0 ? pct(t / dur) : 0, th = Math.min(p.thickness, p.orientation === 'HORIZONTAL' ? H : W);
    if (p.orientation === 'HORIZONTAL') {
      const y = H - th;
      if (p.trackColor) out.push(block(0, y, W, th, p.trackColor, p.radius));
      if (P > 0) out.push(block(0, y, W * P, th, p.progressColor, p.radius));
      if (p.showTime) T.text(out, templateSpans(p.timeTemplate, { elapsed: clockMs(t), total: clockMs(dur), remaining: clockMs(Math.max(0, dur - t)), pct: `${Math.round(P * 100)}%` }, p.timeValueStyle),
        xFor(p.timeAlign, W), y - 4, T.style(p.timeStyle, 'tiny'), p.timeAlign, W);
    } else {
      if (p.trackColor) out.push(block(W - th, 0, th, H, p.trackColor, p.radius));
      if (P > 0) out.push(block(W - th, H * (1 - P), th, H * P, p.progressColor, p.radius));
    }
    return out;
  },
};

/** Tên hợp âm → đoạn: phần bass sau "/" theo `bassStyle` (ví dụ nhạt hơn), phần gốc theo kiểu dòng. */
export function chordSpans(name: string, bassStyle?: TextRef): TextSpan[] {
  const i = name.indexOf('/');
  if (i <= 0 || !bassStyle || !Object.keys(bassStyle).length) return [{ text: name }];
  return [{ text: name.slice(0, i) }, { text: name.slice(i), style: bassStyle }];
}

export const HUD_RENDERERS = {
  TRACK_INFO: trackInfoRenderer, EVENT_COUNTER: eventCounterRenderer, LIVE_TRIGGER: liveTriggerRenderer,
  TIME_BAR: timeBarRenderer, CHORD_DETECTION: chordRenderer, PROGRESS_BAR: progressBarRenderer,
} as const;
