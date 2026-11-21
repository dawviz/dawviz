// Sáu widget chữ của T-69 (SRS REQ-WIDGET-02…06, 08): Track Info, Event Counter, Live Note Trigger, Time & Bar Counter,
// Chord Detection, Progress Bar. Mọi hàm layout là hàm thuần của (spec, t, AST, derived); số đếm tính sẵn trong HudData
// (tổng tích luỹ + tìm nhị phân), không quét lại toàn bộ nốt mỗi khung. Chữ lấy từ MẪU trong thuộc tính widget, không từ locales/ của app.
import { detect } from '@tonaljs/chord-detect';
import { notesInRange, type TimelineIndex, type TrackIndex } from './notes.ts';
import type { ASTNote, TempoPoint, UnifiedProjectAST } from './types.ts';
import type { Derived, Primitive, RectPrim, WidgetRenderer } from './prims.ts';
import { fixed, groupDigits, pad, type Measure } from './text.ts';
import { pitchName } from './music.ts';
import { chordNameFor, noteNameFor, pitchClassNameFor } from './naming.ts';
import { phaseInfoAt, type PhaseInfo } from './visibility.ts';
import { RECENT_ONSETS, degreeName, formatUnits, ioiSixteenths, pitchClassName, quarterFraction, recentOnsets } from './musicAnalysis.ts';
import { listV, numV, timeV, type PV } from './placeholders.ts';
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
/** Ô chữ người dùng thêm (T-73, REQ-GRAPHICS-19): chữ nhiều dòng, có chỗ giữ dùng chung. `style`: kiểu của dòng; `valueStyle`: ghi đè cho phần giá trị của chỗ giữ. */
export interface TextBoxProps { align: Align; text: string; style: TextRef; valueStyle: TextRef }
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
  TEXT: { style: 'body', valueStyle: null },
  // widget phân tích (insight.ts)
  TEMPO_INFO: { style: 'clock' }, BAR_BEAT: { style: 'clock' }, KEY_SCALE: { nameStyle: 'heading', confStyle: 'caption' }, DENSITY: { polyStyle: 'caption' },
  PITCH_WHEEL: { nameStyle: 'label', chordStyle: 'heading' }, DRUM_PAD: { labelStyle: 'tiny' }, SECTION: { style: 'heading', nextStyle: 'caption' },
  LYRICS: { style: 'body', nextStyle: 'caption' }, AUTOMATION: { valueStyle: 'tiny' },
} as const satisfies Record<string, Record<string, keyof typeof DEFAULT_TEXT_STYLES | null>>;
/** Ghi đè một đoạn → trường của dòng chứa nó (kiểu gốc của đoạn là kiểu thật của dòng đó). */
export const TEXT_SPAN_OF = {
  EVENT_COUNTER: { valueStyle: 'style' }, LIVE_TRIGGER: { valueStyle: 'style' },
  CHORD_DETECTION: { bassStyle: 'nameStyle', notesValueStyle: 'notesStyle' }, PROGRESS_BAR: { timeValueStyle: 'timeStyle' }, TEXT: { valueStyle: 'style' },
} as const;
const ts = (styleId: string): TextRef => ({ styleId });
export const DEFAULT_TRACK_INFO: Readonly<TrackInfoProps> = Object.freeze({ align: 'left', titleText: '', titleStyle: ts('title'), artistText: '', artistStyle: ts('subtitle') });
export const DEFAULT_EVENT_COUNTER: Readonly<EventCounterProps> = Object.freeze({
  align: 'right', style: ts('counter'), valueStyle: {}, lineHeight: 1.45, decimals: 2,
  lines: { played: { enabled: true, template: 'Num played notes: {played}/{total} ({pct})' }, total: { enabled: false, template: 'Num events: {total}' },
    progress: { enabled: false, template: 'Progress: {pct}' }, tempo: { enabled: false, template: 'Tempo: {bpm} BPM' } },
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

export const DEFAULT_TEXT_BOX: Readonly<TextBoxProps> = Object.freeze({ align: 'left', text: 'Text', style: ts('body'), valueStyle: {} });

/** Chỗ giữ RIÊNG của từng widget (che chỗ giữ chung cùng tên). Chỗ giữ chung (GLOBAL_KEYS) dùng được ở mọi chữ; preset dùng chỗ giữ lạ → cảnh báo, chữ giữ nguyên. */
export const TEMPLATE_KEYS = {
  EVENT_COUNTER: ['played', 'total', 'pct'], LIVE_TRIGGER: ['name', 'velocity', 'track', 'pitch'],
  CHORD_DETECTION: ['notes', 'chord'], PROGRESS_BAR: ['elapsed', 'total', 'remaining', 'pct'], TRACK_INFO: [], TIME_BAR: [], TEXT: [],
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

/** Giây của đầu ô nhịp thứ `bar0` (đếm từ 0, ô đầu = 0). Ngược của `barPosAt`: dùng để canh trang Piano Roll theo ô nhịp. */
export function barStartSec(g: BarGrid, bar0: number): number {
  const b = Math.max(0, bar0), sg = lastLE(g.sigs, (x) => x.barStart, b);
  const tick = sg.tick + (b - sg.barStart) * (g.ppq * 4 / sg.den * sg.num);
  const tp = lastLE(g.tempo, (x) => x.tick, tick);
  return tp.sec + (tick - tp.tick) / g.ppq * 60 / tp.bpm;
}
/** Trang gồm `bars` ô nhịp liền nhau chứa thời điểm `t`: trang 0 là ô 1…bars, trang 1 là ô bars+1… Trả [start, end) theo giây (đổi nhịp/tempo giữa bài thì độ dài trang khác nhau). */
export function barPageAt(g: BarGrid, bars: number, t: number): { start: number; end: number } {
  const n = Math.max(1, Math.round(bars)), page = Math.floor((barPosAt(g, Math.max(0, t) + 1e-9).bar - 1) / n);
  return { start: barStartSec(g, page * n), end: barStartSec(g, (page + 1) * n) };
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
export const shown = (tracks: TrackIndex[]) => tracks.filter((ti) => ti.track.isVisible);

/** Trống không có cao độ hoà âm: kênh MIDI 10 (chỉ số 9) và track tên Drums/Percussion bị loại khỏi nhận diện hợp âm (SRS REQ-WIDGET-06 nguồn nốt). */
const DRUM_CHANNEL = 9;
export const isDrumTrack = (name: string) => /\b(drums?|percussion|perc|kit)\b|\(drums\)|trống/i.test(name);
export const chordKey = (tracks: TrackIndex[], mode: ChordMode = 'sustained') => `${mode}:${tracks.map((ti) => ti.track.id).join('|')}`;
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
export function chordName(pitches: number[]): string | null {
  if (pitches.length < 2) return null;
  const pcs: string[] = []; // nốt thấp nhất đứng đầu: hợp âm đảo ra dạng "E7/G#"
  for (const p of pitches) { const n = PC[p % 12]; if (!pcs.includes(n)) pcs.push(n); }
  if (pcs.length < 2) return null;
  const d = detect(pcs)[0]; if (!d) return null;
  return d.replace(/^([A-G][#b]?)M(?=\/|$)/, '$1');   // tonal gọi tam hợp trưởng là "CM"; ký hiệu thường dùng là "C" (CM7 giữ nguyên)
}
export function chordAt(segs: ChordSeg[], t: number): ChordSeg | null {
  let lo = 0, hi = segs.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (segs[m].start <= t) { r = m; lo = m + 1; } else hi = m - 1; }
  return r >= 0 && t < segs[r].end && segs[r].pitches.length ? segs[r] : null;
}

// ───────────────────────────── chỗ giữ dùng chung (T-73, D-60) ─────────────────────────────
/** Nguồn của chỗ giữ chung: dự án, dữ liệu dẫn xuất, các track của widget đang vẽ. */
export interface PlaceholderSource { ast: UnifiedProjectAST; derived: Derived; tracks: TrackIndex[] }
/** Tập chỗ giữ chung tại `t`. Mỗi giá trị chỉ tính khi mẫu thật sự dùng tới (getter, đệm trong một lần vẽ), nên mẫu không có `{…}` không tốn gì. */
export function globalValues(src: PlaceholderSource, t: number): Record<string, PV> {
  const { ast, derived, tracks } = src, memo = new Map<string, PV>();
  const hud = () => hudOf(derived, ast), tt = Math.max(0, t), dur = derived.index.duration;
  let pos: BarPos | null = null; const bar = () => (pos ??= barPosAt(hud().bars, t));
  const ppq = ast.meta.internalPPQ || 960;
  let on: ReturnType<typeof recentOnsets> | null = null; const onsets = () => (on ??= recentOnsets(shown(tracks), t, RECENT_ONSETS + 1));
  let ph: PhaseInfo | null = null; const phase = () => (ph ??= phaseInfoAt(derived.phases, t, dur));
  let counts: { played: number; total: number } | null = null;
  const count = () => {
    if (counts) return counts;
    let played = 0, total = 0;
    for (const ti of shown(tracks)) { const s = hud().starts.get(ti.track.id); if (!s) continue; total += s.length; played += upperBound(s, t); }
    return (counts = { played, total });
  };
  const activePitches = () => { // mọi cao độ đang vang của các track đã chọn, thấp → cao
    const set = new Set<number>();
    for (const ti of shown(tracks)) for (const n of notesInRange(ti, t, t)) if (n.startTimeSeconds <= t && t < n.endTimeSeconds) set.add(n.pitch);
    return [...set].sort((a, b) => a - b);
  };
  const nm = derived.naming, nName = (p: number) => (nm ? noteNameFor(p, nm) : pitchName(p)), pcN = (p: number) => (nm ? pitchClassNameFor(p, nm) : pitchClassName(p));
  const active = () => activePitches().map(nName);
  const make: Record<string, () => PV> = {
    time: () => timeV(tt), elapsed: () => timeV(tt), remaining: () => timeV(Math.max(0, dur - t)), total_time: () => timeV(dur),
    bpm: () => numV(bar().bpm, String(Math.round(bar().bpm * 100) / 100)), tempo: () => numV(bar().bpm, String(Math.round(bar().bpm * 100) / 100)), // tempo = tên cũ của bpm
    rhythm: () => listV(ioiSixteenths(onsets(), ppq).slice(-RECENT_ONSETS).map(formatUnits)),
    bass: () => listV(onsets().slice(-RECENT_ONSETS).map((o) => (derived.tonic === undefined ? nName(o.bass) : degreeName(o.bass, derived.tonic)))),
    lengths: () => listV(onsets().slice(-RECENT_ONSETS).map((o) => quarterFraction(o.len, ppq))),
    pitch_classes: () => listV([...new Set(activePitches())].sort((a, b) => a - b).map(pcN)),
    phase: () => phase().name, next_phase: () => phase().next, phase_elapsed: () => timeV(phase().elapsed), phase_remaining: () => timeV(phase().remaining), phase_no: () => phase().index,
    bar: () => bar().bar, beat: () => bar().beat, sig: () => `${bar().num}/${bar().den}`,
    title: () => ast.meta.title ?? '', artist: () => (ast.meta as { artist?: string }).artist ?? '',
    chord: () => { const c = chordAt(hud().chords.get(chordKey(shown(tracks))) ?? [], t)?.name ?? ''; return c && nm ? chordNameFor(c, nm) : c; }, notes: () => listV(active()),
    played: () => count().played, total: () => count().total,
    pct: () => { const c = count(), v = c.total ? c.played / c.total * 100 : 0; return numV(v, String(Math.round(v))); },
  };
  const out: Record<string, PV> = {};
  for (const k of Object.keys(make)) Object.defineProperty(out, k, { enumerable: true, get: () => { let v = memo.get(k); if (v === undefined) memo.set(k, v = make[k]()); return v; } });
  return out;
}
/** Giá trị riêng của widget che giá trị chung cùng tên (`{total}` của Thanh tiến độ là thời lượng, không phải số nốt). */
export function withLocals(glob: Record<string, PV>, local: Record<string, PV>): Record<string, PV> {
  const out = Object.create(glob) as Record<string, PV>;
  for (const k of Object.keys(local)) Object.defineProperty(out, k, { value: local[k], enumerable: true }); // defineProperty: không bị getter của bộ chung chặn
  return out;
}
/** Mẫu của mọi widget có dùng `{chord` thì nhóm track của nó cần dựng dòng thời gian hợp âm ở bước derived. */
export const usesChordPlaceholder = (w: { properties: unknown }) => JSON.stringify(w.properties).includes('{chord');

// ───────────────────────────── trợ giúp vẽ chữ ─────────────────────────────
export const xFor = (align: Align, width: number) => (align === 'left' ? 0 : align === 'center' ? width / 2 : width);
/** Bộ dựng chữ của một lần layout: kiểu của scene + hàm đo. `text` thêm primitive vào `out`, trả bước tiến dọc (chữ xuống dòng cao hơn một dòng). */
export function typo(set: TextStyleSet | undefined, measure: Measure, fonts?: ReadonlySet<string>) {
  const S = set ?? DEFAULT_TEXT_STYLES;
  return {
    style: (ref: TextRef | undefined, fallbackId: string): TextStyle => resolveTextStyle(ref, S, fallbackId),
    text(out: Primitive[], s: string | readonly TextSpan[], x: number, y: number, st: TextStyle, align: Align, maxWidth: number, alpha = 1): number {
      const r = textPrims(s, st, x, y, align, maxWidth, measure, alpha, S, fonts);
      for (const p of r.prims) out.push(p);
      return r.height;
    },
    width: (s: string | readonly TextSpan[], st: TextStyle) => textWidth(s, st, measure, S, fonts),
  };
}
export const base = (size: number) => size * 0.95; // baseline dòng đầu so với mép trên widget
/** Độ rộng ổn định: chữ số tính theo ô chữ số rộng nhất (chữ số đều bề rộng), để nhãn đặt cạnh số không nhảy khi số đổi. */
const stableWidth = (T: ReturnType<typeof typo>, s: string, st: TextStyle) => T.width(s, { ...st, tabularNums: true });
export const block = (x: number, y: number, w: number, h: number, fill: string, radius = 0): RectPrim =>
  ({ kind: 'rect', x, y, w, h, fill, alpha: 1, radius: Math.min(radius, h / 2, w / 2), glowColor: '', glowBlur: 0, stroke: '', strokeWidth: 0 });
export const pct = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));

// ───────────────────────────── widget ─────────────────────────────
export const trackInfoRenderer: WidgetRenderer<TrackInfoProps> = {
  type: 'TRACK_INFO',
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, W = spec.layout.width, x = xFor(p.align, W), out: Primitive[] = [], T = typo(textStyles, measure, fonts);
    const ts1 = T.style(p.titleStyle, 'title'), ts2 = T.style(p.artistStyle, 'subtitle');
    const G = globalValues({ ast, derived, tracks }, t);
    const title: string | TextSpan[] = p.titleText ? templateSpans(p.titleText, G) : ast.meta.title || '';
    const artist: string | TextSpan[] = p.artistText ? templateSpans(p.artistText, G) : (ast.meta as { artist?: string }).artist || '';
    const y1 = ts1.size * 0.8;
    // Tên bài xuống nhiều dòng (kiểu bật wrap) đẩy dòng nghệ sĩ xuống theo số dòng thật.
    const extra = title.length ? T.text(out, title, x, y1, ts1, p.align, W) - ts1.size * ts1.leading : 0;
    if (artist.length) T.text(out, artist, x, (title.length ? y1 + Math.max(0, extra) : 0) + ts2.size * (title.length ? 1.5 : 0.8), ts2, p.align, W);
    return out;
  },
};

export const eventCounterRenderer: WidgetRenderer<EventCounterProps> = {
  type: 'EVENT_COUNTER',
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, W = spec.layout.width, x = xFor(p.align, W), hud = hudOf(derived, ast), out: Primitive[] = [], T = typo(textStyles, measure, fonts);
    const st = T.style(p.style, 'counter');
    let played = 0, total = 0;
    for (const ti of shown(tracks)) { const s = hud.starts.get(ti.track.id); if (!s) continue; total += s.length; played += upperBound(s, t); }
    const share = total ? played / total * 100 : 0;
    // `{pct}` giữ chữ cũ kèm "%" (số chữ số theo `decimals`); có định dạng thì ra số trần: `{pct:0.0}`.
    const v = withLocals(globalValues({ ast, derived, tracks }, t), { played, total, pct: numV(share, `${fixed(share, p.decimals)}%`) });
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
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, W = spec.layout.width, out: Primitive[] = [], tail = p.tailMs / 1000, T = typo(textStyles, measure, fonts);
    const st = T.style(p.style, 'caption');
    const items: { n: ASTNote; track: TrackIndex; alpha: number }[] = [];
    for (const ti of shown(tracks)) for (const n of notesInRange(ti, t - tail, t)) {
      if (n.startTimeSeconds > t) continue;
      if (t < n.endTimeSeconds) items.push({ n, track: ti, alpha: 1 });
      else if (tail > 0 && t < n.endTimeSeconds + tail) items.push({ n, track: ti, alpha: 1 - (t - n.endTimeSeconds) / tail });
    }
    items.sort((a, b) => b.n.pitch - a.n.pitch || a.track.track.index - b.track.track.index || a.n.startTimeSeconds - b.n.startTimeSeconds);
    if (!items.length) return out;
    const G = globalValues({ ast, derived, tracks }, t);
    const label = (it: typeof items[number]) => templateSpans(p.template, withLocals(G, { name: derived.naming ? noteNameFor(it.n.pitch, derived.naming) : pitchName(it.n.pitch), velocity: Math.round(it.n.velocity), track: it.track.track.name, pitch: it.n.pitch }), p.valueStyle);
    const w = (s: string | readonly TextSpan[]) => T.width(s, st), y = base(st.size);
    if (p.mode === 'list') {
      const shownItems = items.slice(0, p.maxLines), more = items.length - shownItems.length;
      shownItems.forEach((it, i) => {
        const s = [...label(it), ...(p.showTrack ? templateSpans(' ' + p.trackTemplate, withLocals(G, { track: it.track.track.name }), p.valueStyle) : [])];
        T.text(out, s, xFor(p.align, W), y + i * st.size * p.lineHeight, st, p.align, W, it.alpha);
      });
      if (more > 0) T.text(out, `+${more}`, xFor(p.align, W), y + shownItems.length * st.size * p.lineHeight, st, p.align, W, 1);
      return out;
    }
    // Một dòng ngang: nối các nốt (cao → thấp), hậu tố tên track một lần cuối dòng; quá rộng thì bỏ nốt thấp nhất, thêm "+N".
    const names = (list: typeof items) => [...new Set(list.map((it) => it.track.track.name))].join(', ');
    const suffix = (list: typeof items): TextSpan[] => (p.showTrack ? templateSpans(p.trackTemplate, withLocals(G, { track: names(list) }), p.valueStyle) : []);
    // O(n) mỗi khung (trước đây O(n²): mỗi lần thử bớt một nốt lại đo lại toàn bộ). Cộng dồn đúng thứ tự cũ nên kết quả số học giữ nguyên.
    let keep = items.length, dropped = 0;
    const sepW0 = w(p.separator), prefix: number[] = [0], sfxW: number[] = [0], seen = new Set<string>(), nameList: string[] = [];
    let lastNames: string | null = null, lastSfx = 0;
    items.forEach((it, i) => {
      prefix.push(prefix[i] + w(label(it)) + (i ? sepW0 : 0));
      if (!seen.has(it.track.track.name)) { seen.add(it.track.track.name); nameList.push(it.track.track.name); }
      const key = nameList.join(', ');
      if (key !== lastNames) { lastNames = key; const sx = suffix(items.slice(0, i + 1)); lastSfx = sx.length ? sepW0 + w(sx) : 0; }
      sfxW.push(lastSfx);
    });
    const totalW = (n: number) => { const extra = items.length - n; return prefix[n] + sfxW[n] + (extra ? sepW0 + w(`+${extra}`) : 0); };
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
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, W = spec.layout.width, hud = hudOf(derived, ast), out: Primitive[] = [], T = typo(textStyles, measure, fonts);
    const G = globalValues({ ast, derived, tracks }, t);
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
        T.text(out, templateSpans(r.cfg.label, G), nx, y - st.size * 0.62, lst, 'left', Math.max(0, W - nx));
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
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, W = spec.layout.width, x = xFor(p.align, W), out: Primitive[] = [], T = typo(textStyles, measure, fonts);
    const nst = T.style(p.nameStyle, 'heading'), bst = T.style(p.notesStyle, 'body');
    const seg = chordAt(hudOf(derived, ast).chords.get(chordKey(shown(tracks), p.mode)) ?? [], t);
    const nmg = derived.naming, nN = (n: number) => (nmg ? noteNameFor(n, nmg) : pitchName(n));
    const notes = seg ? seg.pitches.map(nN).join(' ') : '';
    const name = seg?.name ? (nmg ? chordNameFor(seg.name, nmg) : seg.name) : null;
    const G = globalValues({ ast, derived, tracks }, t);
    const notesLine = notes ? templateSpans(p.notesTemplate, withLocals(G, { notes: listV(seg!.pitches.map(nN)), chord: name ?? '' }), p.notesValueStyle) : [];
    const y1 = nst.size * 0.85;
    if (name) {
      T.text(out, chordSpans(name, p.bassStyle), x, y1, nst, p.align, W);
      if (p.alwaysShowNotes && notesLine.length) T.text(out, notesLine, x, y1 + bst.size * 1.6, bst, p.align, W);
    } else if (seg) { // có nốt nhưng không nhận diện được: "N.C." hoặc danh sách nốt
      if (p.unrecognized === 'notes' && notesLine.length) T.text(out, notesLine, x, base(bst.size), bst, p.align, W);
      else if (p.unrecognized === 'nc') {
        T.text(out, templateSpans(p.noChordText, G), x, y1, nst, p.align, W);
        if (p.alwaysShowNotes && notesLine.length) T.text(out, notesLine, x, y1 + bst.size * 1.6, bst, p.align, W);
      }
    }
    return out;
  },
};

export const progressBarRenderer: WidgetRenderer<ProgressBarProps> = {
  type: 'PROGRESS_BAR',
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, { width: W, height: H } = spec.layout, out: Primitive[] = [], T = typo(textStyles, measure, fonts);
    const dur = derived.index.duration, P = dur > 0 ? pct(t / dur) : 0, th = Math.min(p.thickness, p.orientation === 'HORIZONTAL' ? H : W);
    if (p.orientation === 'HORIZONTAL') {
      const y = H - th;
      if (p.trackColor) out.push(block(0, y, W, th, p.trackColor, p.radius));
      if (P > 0) out.push(block(0, y, W * P, th, p.progressColor, p.radius));
      if (p.showTime) T.text(out, templateSpans(p.timeTemplate, withLocals(globalValues({ ast, derived, tracks }, t), { elapsed: timeV(t), total: timeV(dur), remaining: timeV(Math.max(0, dur - t)), pct: numV(P * 100, `${Math.round(P * 100)}%`) }), p.timeValueStyle),
        xFor(p.timeAlign, W), y - 4, T.style(p.timeStyle, 'tiny'), p.timeAlign, W);
    } else {
      if (p.trackColor) out.push(block(W - th, 0, th, H, p.trackColor, p.radius));
      if (P > 0) out.push(block(W - th, H * (1 - P), th, H * P, p.progressColor, p.radius));
    }
    return out;
  },
};

/** Ô chữ (T-73): mỗi dòng của `text` là một mẫu; xuống dòng cao theo kiểu chữ, dòng trống vẫn chiếm một dòng. */
export const textBoxRenderer: WidgetRenderer<TextBoxProps> = {
  type: 'TEXT',
  layout({ ast, derived, tracks, measure, textStyles, fonts }, spec, t) {
    const p = spec.properties, W = spec.layout.width, x = xFor(p.align, W), out: Primitive[] = [], T = typo(textStyles, measure, fonts);
    const st = T.style(p.style, 'body'), G = globalValues({ ast, derived, tracks }, t);
    let y = base(st.size);
    for (const line of p.text.split('\n')) {
      const spans = templateSpans(line, G, p.valueStyle);
      y += spans.length ? T.text(out, spans, x, y, st, p.align, W) : st.size * st.leading;
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
  TIME_BAR: timeBarRenderer, CHORD_DETECTION: chordRenderer, PROGRESS_BAR: progressBarRenderer, TEXT: textBoxRenderer,
} as const;
