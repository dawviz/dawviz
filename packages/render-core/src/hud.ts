// Sáu widget chữ của T-69 (SRS REQ-WIDGET-02…06, 08): Track Info, Event Counter, Live Note Trigger, Time & Bar Counter,
// Chord Detection, Progress Bar. Mọi hàm layout là hàm thuần của (spec, t, AST, derived); số đếm tính sẵn trong HudData
// (tổng tích luỹ + tìm nhị phân), không quét lại toàn bộ nốt mỗi khung. Chữ lấy từ MẪU trong thuộc tính widget, không từ locales/ của app.
import { detect } from '@tonaljs/chord-detect';
import { notesInRange, type TimelineIndex, type TrackIndex } from './notes.ts';
import type { ASTNote, TempoPoint, UnifiedProjectAST } from './types.ts';
import type { Derived, Primitive, RectPrim, TextPrim, WidgetRenderer } from './prims.ts';
import { clockMs, fitText, fixed, formatTemplate, groupDigits, pad, type Measure } from './text.ts';
import { pitchName } from './music.ts';
import { DEFAULT_FONT } from './fonts.ts';

// ───────────────────────────── thuộc tính ─────────────────────────────
export type Align = 'left' | 'center' | 'right';
export interface TextStyle { font: string; size: number; weight: number; color: string }
export interface LineCfg { enabled: boolean; template: string }

export interface TrackInfoProps { align: Align; titleText: string; titleStyle: TextStyle; artistText: string; artistStyle: TextStyle }
export interface EventCounterProps { align: Align; style: TextStyle; lineHeight: number; decimals: number; lines: { played: LineCfg; total: LineCfg; progress: LineCfg; tempo: LineCfg } }
export interface LiveTriggerProps { mode: 'list' | 'inline'; align: Align; style: TextStyle; template: string; showTrack: boolean; trackTemplate: string; tailMs: number; maxLines: number; lineHeight: number; separator: string }
export interface ClockCfg { enabled: boolean; label: string }
export interface TimeBarProps {
  style: TextStyle; labelStyle: TextStyle; rowGap: number;
  time: ClockCfg & { format: 'grouped' | 'clock' }; beat: ClockCfg & { format: 'grouped' | 'bbs' };
  timeGroups: [number, number, number]; beatGroups: [number, number, number];
  showBars: boolean; barLength: number; barThickness: number; barColor: string; barTrackColor: string;
}
export interface ChordProps { align: Align; nameStyle: TextStyle; notesStyle: TextStyle; alwaysShowNotes: boolean; notesTemplate: string; unrecognized: 'nc' | 'notes'; noChordText: string }
export interface ProgressBarProps { orientation: 'HORIZONTAL' | 'VERTICAL'; thickness: number; progressColor: string; trackColor: string; radius: number; showTime: boolean; timeStyle: TextStyle; timeTemplate: string; timeAlign: Align }

const ts = (size: number, weight: number, color: string, font = DEFAULT_FONT): TextStyle => ({ font, size, weight, color });
export const DEFAULT_TRACK_INFO: Readonly<TrackInfoProps> = Object.freeze({ align: 'left', titleText: '', titleStyle: ts(72, 700, '#111111'), artistText: '', artistStyle: ts(28, 400, '#111111') });
export const DEFAULT_EVENT_COUNTER: Readonly<EventCounterProps> = Object.freeze({
  align: 'right', style: ts(22, 400, '#777777'), lineHeight: 1.45, decimals: 2,
  lines: { played: { enabled: true, template: 'Num played notes: {played}/{total} ({pct})' }, total: { enabled: false, template: 'Num events: {total}' },
    progress: { enabled: false, template: 'Progress: {pct}' }, tempo: { enabled: false, template: 'Tempo: {tempo} BPM' } },
});
export const DEFAULT_LIVE_TRIGGER: Readonly<LiveTriggerProps> = Object.freeze({
  mode: 'list', align: 'right', style: ts(15, 400, '#888888'), template: 'Note: {name} (Vel: {velocity})', showTrack: false, trackTemplate: '< {track}',
  tailMs: 300, maxLines: 6, lineHeight: 1.4, separator: '   ',
});
export const DEFAULT_TIME_BAR: Readonly<TimeBarProps> = Object.freeze<TimeBarProps>({
  style: ts(18, 400, '#777777'), labelStyle: ts(11, 400, '#999999'), rowGap: 1.9,
  time: { enabled: true, label: 'time', format: 'grouped' }, beat: { enabled: true, label: 'beat', format: 'grouped' },
  timeGroups: [3, 2, 3], beatGroups: [3, 2, 3],
  showBars: true, barLength: 64, barThickness: 3, barColor: '#999999', barTrackColor: '#E4E4E4',
});
export const DEFAULT_CHORD: Readonly<ChordProps> = Object.freeze({
  align: 'right', nameStyle: ts(34, 700, '#111111'), notesStyle: ts(17, 400, '#777777'),
  alwaysShowNotes: false, notesTemplate: 'Notes: {notes}', unrecognized: 'nc', noChordText: 'N.C.',
});
export const DEFAULT_PROGRESS_BAR: Readonly<ProgressBarProps> = Object.freeze({
  orientation: 'HORIZONTAL', thickness: 12, progressColor: '#CCCCCC', trackColor: '', radius: 0, showTime: true,
  timeStyle: ts(7, 400, '#BBBBBB'), timeTemplate: '{elapsed} / {total}', timeAlign: 'right',
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

/** `chordGroups`: các nhóm track mà widget Chord Detection sẽ đọc; dò hợp âm (@tonaljs/chord-detect) chạy ở ĐÂY, ở bước derived, không chạy khi vẽ khung. */
export function buildHud(ast: UnifiedProjectAST, index: TimelineIndex, chordGroups: TrackIndex[][] = []): HudData {
  const starts = new Map<string, Float64Array>();
  for (const ti of index.tracks) starts.set(ti.track.id, Float64Array.from(ti.notes, (n) => n.startTimeSeconds)); // đã sắp theo bắt đầu
  const hud: HudData = { starts, bars: buildBarGrid(ast.tempoMap, ast.meta.internalPPQ || 960), chords: new Map() };
  for (const g of chordGroups) chordTimeline(hud, shown(g));
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
const chordKey = (tracks: TrackIndex[]) => tracks.map((ti) => ti.track.id).join('|');
/** Danh sách đoạn hợp âm (Sustained, SRS REQ-WIDGET-06) của một nhóm track; đệm theo (derived, nhóm track). */
export function chordTimeline(hud: HudData, tracks: TrackIndex[]): ChordSeg[] {
  const key = chordKey(tracks);
  const hit = hud.chords.get(key); if (hit) return hit;
  const ev: { t: number; p: number; d: number }[] = [];
  for (const ti of tracks) if (!isDrumTrack(ti.track.name)) for (const n of ti.notes) if (n.channel !== DRUM_CHANNEL) { ev.push({ t: n.startTimeSeconds, p: n.pitch, d: 1 }); ev.push({ t: n.endTimeSeconds, p: n.pitch, d: -1 }); }
  ev.sort((a, b) => a.t - b.t || a.p - b.p || a.d - b.d);
  const raw: ChordSeg[] = [], held = new Map<number, number>();
  for (let i = 0; i < ev.length;) {
    const t0 = ev[i].t;
    for (; i < ev.length && ev[i].t === t0; i++) { const c = (held.get(ev[i].p) ?? 0) + ev[i].d; if (c > 0) held.set(ev[i].p, c); else held.delete(ev[i].p); }
    const pitches = [...held.keys()].sort((a, b) => a - b);
    const prev = raw[raw.length - 1]; if (prev) prev.end = t0;
    raw.push({ start: t0, end: Infinity, pitches, name: chordName(pitches) });
  }
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
function text(s: string, x: number, y: number, st: TextStyle, align: Align, maxWidth: number, measure: Measure, alpha = 1): TextPrim | null {
  const fitted = Number.isFinite(maxWidth) ? fitText(s, maxWidth, st.font, st.size, st.weight, measure) : s;
  if (!fitted) return null;
  return { kind: 'text', text: fitted, x, y, font: st.font, size: st.size, weight: st.weight, align, color: st.color, alpha, maxWidth: Number.isFinite(maxWidth) ? maxWidth : undefined };
}
const push = (out: Primitive[], p: Primitive | null) => { if (p) out.push(p); };
const base = (size: number) => size * 0.95; // baseline dòng đầu so với mép trên widget
/** Độ rộng ổn định: chữ số tính bằng chữ số rộng nhất, để nhãn đặt cạnh số không nhảy khi số đổi. */
function stableWidth(s: string, st: TextStyle, measure: Measure): number {
  let digit = 0; for (let d = 0; d < 10; d++) digit = Math.max(digit, measure(String(d), st.font, st.size, st.weight));
  let w = 0; for (const ch of s) w += /\d/.test(ch) ? digit : measure(ch, st.font, st.size, st.weight);
  return w;
}
const block = (x: number, y: number, w: number, h: number, fill: string, radius = 0): RectPrim =>
  ({ kind: 'rect', x, y, w, h, fill, alpha: 1, radius: Math.min(radius, h / 2, w / 2), glowColor: '', glowBlur: 0, stroke: '', strokeWidth: 0 });
const pct = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));

// ───────────────────────────── widget ─────────────────────────────
export const trackInfoRenderer: WidgetRenderer<TrackInfoProps> = {
  type: 'TRACK_INFO',
  layout({ ast, measure }, spec) {
    const p = spec.properties, W = spec.layout.width, x = xFor(p.align, W), out: Primitive[] = [];
    const title = p.titleText || ast.meta.title || '', artist = p.artistText || (ast.meta as { artist?: string }).artist || '';
    const y1 = p.titleStyle.size * 0.8;
    if (title) push(out, text(title, x, y1, p.titleStyle, p.align, W, measure));
    if (artist) push(out, text(artist, x, (title ? y1 : 0) + p.artistStyle.size * (title ? 1.5 : 0.8), p.artistStyle, p.align, W, measure));
    return out;
  },
};

export const eventCounterRenderer: WidgetRenderer<EventCounterProps> = {
  type: 'EVENT_COUNTER',
  layout({ ast, derived, tracks, measure }, spec, t) {
    const p = spec.properties, W = spec.layout.width, x = xFor(p.align, W), hud = hudOf(derived, ast), out: Primitive[] = [];
    let played = 0, total = 0;
    for (const ti of shown(tracks)) { const s = hud.starts.get(ti.track.id); if (!s) continue; total += s.length; played += upperBound(s, t); }
    const bpm = barPosAt(hud.bars, t).bpm;
    const v = { played, total, pct: `${fixed(total ? played / total * 100 : 0, p.decimals)}%`, tempo: String(Math.round(bpm * 100) / 100) };
    let row = 0;
    for (const k of ['played', 'total', 'progress', 'tempo'] as const) {
      const cfg = p.lines[k]; if (!cfg.enabled) continue;
      push(out, text(formatTemplate(cfg.template, v), x, base(p.style.size) + row * p.style.size * p.lineHeight, p.style, p.align, W, measure)); row++;
    }
    return out;
  },
};

export const liveTriggerRenderer: WidgetRenderer<LiveTriggerProps> = {
  type: 'LIVE_TRIGGER',
  layout({ tracks, measure }, spec, t) {
    const p = spec.properties, W = spec.layout.width, out: Primitive[] = [], tail = p.tailMs / 1000;
    const items: { n: ASTNote; track: TrackIndex; alpha: number }[] = [];
    for (const ti of shown(tracks)) for (const n of notesInRange(ti, t - tail, t)) {
      if (n.startTimeSeconds > t) continue;
      if (t < n.endTimeSeconds) items.push({ n, track: ti, alpha: 1 });
      else if (tail > 0 && t < n.endTimeSeconds + tail) items.push({ n, track: ti, alpha: 1 - (t - n.endTimeSeconds) / tail });
    }
    items.sort((a, b) => b.n.pitch - a.n.pitch || a.track.track.index - b.track.track.index || a.n.startTimeSeconds - b.n.startTimeSeconds);
    if (!items.length) return out;
    const label = (it: typeof items[number]) => formatTemplate(p.template, { name: pitchName(it.n.pitch), velocity: Math.round(it.n.velocity), track: it.track.track.name, pitch: it.n.pitch });
    const w = (s: string) => measure(s, p.style.font, p.style.size, p.style.weight), y = base(p.style.size);
    if (p.mode === 'list') {
      const shownItems = items.slice(0, p.maxLines), more = items.length - shownItems.length;
      shownItems.forEach((it, i) => {
        const s = label(it) + (p.showTrack ? ' ' + formatTemplate(p.trackTemplate, { track: it.track.track.name }) : '');
        push(out, text(s, xFor(p.align, W), y + i * p.style.size * p.lineHeight, p.style, p.align, W, measure, it.alpha));
      });
      if (more > 0) push(out, text(`+${more}`, xFor(p.align, W), y + shownItems.length * p.style.size * p.lineHeight, p.style, p.align, W, measure, 1));
      return out;
    }
    // Một dòng ngang: nối các nốt (cao → thấp), hậu tố tên track một lần cuối dòng; quá rộng thì bỏ nốt thấp nhất, thêm "+N".
    const names = (list: typeof items) => [...new Set(list.map((it) => it.track.track.name))].join(', ');
    const suffix = (list: typeof items) => (p.showTrack ? formatTemplate(p.trackTemplate, { track: names(list) }) : '');
    let keep = items.length, dropped = 0;
    const totalW = (n: number) => {
      const part = items.slice(0, n), sfx = suffix(part), extra = items.length - n;
      return part.reduce((s, it, i) => s + w(label(it)) + (i ? w(p.separator) : 0), 0) + (sfx ? w(p.separator) + w(sfx) : 0) + (extra ? w(p.separator) + w(`+${extra}`) : 0);
    };
    while (keep > 1 && totalW(keep) > W) keep--;
    dropped = items.length - keep;
    const part = items.slice(0, keep), segs: { s: string; a: number }[] = part.map((it) => ({ s: label(it), a: it.alpha }));
    if (suffix(part)) segs.push({ s: suffix(part), a: 1 });
    if (dropped) segs.push({ s: `+${dropped}`, a: 1 });
    const sepW = w(p.separator), total = segs.reduce((s, g, i) => s + w(g.s) + (i ? sepW : 0), 0);
    let x = p.align === 'left' ? 0 : p.align === 'center' ? (W - total) / 2 : W - total;
    segs.forEach((g, i) => {
      if (i) x += sepW;
      push(out, text(g.s, x, y, p.style, 'left', Math.max(0, W - x), measure, g.a)); x += w(g.s);
    });
    return out;
  },
};

export const timeBarRenderer: WidgetRenderer<TimeBarProps> = {
  type: 'TIME_BAR',
  layout({ ast, derived, measure }, spec, t) {
    const p = spec.properties, W = spec.layout.width, hud = hudOf(derived, ast), out: Primitive[] = [];
    const pos = barPosAt(hud.bars, t), tt = Math.max(0, t);
    const totalMs = Math.floor(tt * 1000 + 1e-6), m = Math.floor(totalMs / 60000), s = Math.floor(totalMs / 1000) % 60, ms = totalMs % 1000; // số nguyên ms: không lệch do dấu phẩy động
    const rows: { cfg: ClockCfg; text: string; bars: boolean }[] = [];
    if (p.time.enabled) rows.push({ cfg: p.time, bars: false, text: p.time.format === 'grouped' ? groupDigits([m, s, ms], p.timeGroups) : `${pad(m, 2)}:${pad(s, 2)}.${pad(ms, 3)}` });
    if (p.beat.enabled) rows.push({ cfg: p.beat, bars: p.showBars, text: p.beat.format === 'grouped' ? groupDigits([pos.bar, pos.beat, pos.sub], p.beatGroups) : `${pos.bar}.${pos.beat}.${pad(pos.sub, 3)}` });
    let y = base(p.style.size);
    for (const r of rows) {
      push(out, text(r.text, 0, y, p.style, 'left', W, measure));
      if (r.cfg.label) {
        const nx = stableWidth(r.text, p.style, measure) + 6;
        push(out, text(r.cfg.label, nx, y - p.style.size * 0.62, p.labelStyle, 'left', Math.max(0, W - nx), measure));
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
      y += p.style.size * p.rowGap;
    }
    return out;
  },
};

export const chordRenderer: WidgetRenderer<ChordProps> = {
  type: 'CHORD_DETECTION',
  layout({ ast, derived, tracks, measure }, spec, t) {
    const p = spec.properties, W = spec.layout.width, x = xFor(p.align, W), out: Primitive[] = [];
    const seg = chordAt(hudOf(derived, ast).chords.get(chordKey(shown(tracks))) ?? [], t);
    const notes = seg ? seg.pitches.map((n) => pitchName(n)).join(' ') : '';
    const name = seg?.name ?? null;
    const notesLine = notes ? formatTemplate(p.notesTemplate, { notes, chord: name ?? '' }) : '';
    const y1 = p.nameStyle.size * 0.85;
    if (name) {
      push(out, text(name, x, y1, p.nameStyle, p.align, W, measure));
      if (p.alwaysShowNotes && notesLine) push(out, text(notesLine, x, y1 + p.notesStyle.size * 1.6, p.notesStyle, p.align, W, measure));
    } else if (seg) { // có nốt nhưng không nhận diện được: "N.C." hoặc danh sách nốt
      if (p.unrecognized === 'notes' && notesLine) push(out, text(notesLine, x, base(p.notesStyle.size), p.notesStyle, p.align, W, measure));
      else if (p.unrecognized === 'nc') {
        push(out, text(p.noChordText, x, y1, p.nameStyle, p.align, W, measure));
        if (p.alwaysShowNotes && notesLine) push(out, text(notesLine, x, y1 + p.notesStyle.size * 1.6, p.notesStyle, p.align, W, measure));
      }
    }
    return out;
  },
};

export const progressBarRenderer: WidgetRenderer<ProgressBarProps> = {
  type: 'PROGRESS_BAR',
  layout({ derived, measure }, spec, t) {
    const p = spec.properties, { width: W, height: H } = spec.layout, out: Primitive[] = [];
    const dur = derived.index.duration, P = dur > 0 ? pct(t / dur) : 0, th = Math.min(p.thickness, p.orientation === 'HORIZONTAL' ? H : W);
    if (p.orientation === 'HORIZONTAL') {
      const y = H - th;
      if (p.trackColor) out.push(block(0, y, W, th, p.trackColor, p.radius));
      if (P > 0) out.push(block(0, y, W * P, th, p.progressColor, p.radius));
      if (p.showTime) push(out, text(formatTemplate(p.timeTemplate, { elapsed: clockMs(t), total: clockMs(dur), remaining: clockMs(Math.max(0, dur - t)), pct: `${Math.round(P * 100)}%` }),
        xFor(p.timeAlign, W), y - 4, p.timeStyle, p.timeAlign, W, measure));
    } else {
      if (p.trackColor) out.push(block(W - th, 0, th, H, p.trackColor, p.radius));
      if (P > 0) out.push(block(W - th, H * (1 - P), th, H * P, p.progressColor, p.radius));
    }
    return out;
  },
};

export const HUD_RENDERERS = {
  TRACK_INFO: trackInfoRenderer, EVENT_COUNTER: eventCounterRenderer, LIVE_TRIGGER: liveTriggerRenderer,
  TIME_BAR: timeBarRenderer, CHORD_DETECTION: chordRenderer, PROGRESS_BAR: progressBarRenderer,
} as const;
