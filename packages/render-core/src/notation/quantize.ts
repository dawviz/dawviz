// Lượng tử hoá nốt thành bản nhạc (REQ-NOTATION-01, D-63). Hàm thuần, tất định, không phụ thuộc ngoài.
// CHỈ ĐỂ VẼ: thời điểm sáng của nốt vẫn lấy từ AST (startTick thật); mỗi nốt trong bản nhạc giữ noteId để truy ngược.
// Đơn vị: tick 960 PPQ (internalPPQ của AST).
import type { ASTNote, TempoPoint } from '../types.ts';

export const NOTATION_PPQ = 960;

export interface QuantizeOptions {
  /** Nốt ngắn nhất kiểu nhị phân: 8 (móc đơn), 16 (móc kép, mặc định), 32 (móc ba). */
  maxDivision?: 8 | 16 | 32;
  /** Cho phép tam liên theo từng phách (mặc định bật). */
  triplets?: boolean;
  /** Chia hai tay theo cao độ: nốt ≥ splitPitch lên khuông Sol (mặc định 60 = C4). */
  splitPitch?: number;
  /** Số giọng tối đa mỗi khuông (1 hoặc 2, mặc định 2). */
  maxVoices?: 1 | 2;
  /** Ghi đè giọng: số dấu hoá (−7…7, âm = giáng) và điệu thức. Vắng thì ước lượng. */
  key?: { fifths: number; mode: 'major' | 'minor' };
  /** Hệ số phạt độ phức tạp của lưới (mặc định 1; lớn hơn = ưu tiên lưới thô). */
  simplicity?: number;
}

export interface ScoreNoteRef { noteId: string; pitch: number; tieStart: boolean; tieEnd: boolean }
/** Giá trị nốt: base 1 (tròn), 2 (trắng), 4 (đen), 8, 16, 32; dots 0/1; triplet = nằm trong nhóm tam liên của phách. */
export interface NoteValue { base: 1 | 2 | 4 | 8 | 16 | 32; dots: 0 | 1; triplet: boolean }
export interface ScoreEvent {
  /** Vị trí trong ô (tick đã lượng tử) và độ dài thật (tick, đã tính tam liên). */
  pos: number; dur: number; value: NoteValue;
  /** rest = nốt lặng; hidden = lặng ẩn (giọng 2 chỗ trống). */
  rest: boolean; hidden: boolean;
  notes: ScoreNoteRef[];
  /** Chỉ số nhóm tam liên trong ô (các sự kiện cùng phách tam liên cùng số), −1 nếu không. */
  tuplet: number;
}
export interface ScoreVoice { events: ScoreEvent[] }
export interface ScoreStaff { clef: 'treble' | 'bass'; voices: ScoreVoice[] }
export interface ScoreMeasure { index: number; startTick: number; endTick: number; num: number; den: number; staves: [ScoreStaff, ScoreStaff] }
export interface QuantizeStats {
  notes: number; exactOnsets: number; meanOnsetErr: number; maxOnsetErr: number;
  /** Nốt bị cắt ngắn để vừa giọng (legato chồng, hết giọng). */
  cut: number; tripletBeats: number; voice2Events: number;
}
export interface ScoreModel {
  ppq: number; measures: ScoreMeasure[];
  key: { fifths: number; mode: 'major' | 'minor'; confidence: number; estimated: boolean };
  stats: QuantizeStats;
}

interface Bar { startTick: number; endTick: number; num: number; den: number }
interface QNote { id: string; pitch: number; s: number; e: number; qs: number; qe: number; staff: 0 | 1 }
interface VEvent { s: number; e: number; notes: QNote[] }

/** Danh sách ô nhịp phủ [0, endTick) theo dấu nhịp trong tempoMap (đổi nhịp giữa ô thì bắt đầu ô mới tại điểm đổi). */
export function barsOf(tempoMap: readonly TempoPoint[], endTick: number, ppq = NOTATION_PPQ): Bar[] {
  const sigs: { tick: number; num: number; den: number }[] = [];
  for (const p of tempoMap) {
    const num = p.timeSigNumerator || 4, den = p.timeSigDenominator || 4, last = sigs[sigs.length - 1];
    if (last && last.num === num && last.den === den) continue;
    sigs.push({ tick: last ? p.tick : 0, num, den });
  }
  if (!sigs.length) sigs.push({ tick: 0, num: 4, den: 4 });
  const bars: Bar[] = [];
  for (let i = 0; i < sigs.length; i++) {
    const sg = sigs[i], len = (ppq * 4 / sg.den) * sg.num, until = i + 1 < sigs.length ? sigs[i + 1].tick : Math.max(endTick, sg.tick + 1);
    for (let t = sg.tick; t < until; t += len) bars.push({ startTick: t, endTick: Math.min(t + len, i + 1 < sigs.length ? until : t + len), num: sg.num, den: sg.den });
  }
  return bars;
}

// ───────────────────────────── giọng (key) ─────────────────────────────
const KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const MAJOR_FIFTHS = [0, -5, 2, -3, 4, -1, 6, 1, -4, 3, -2, 5]; // tonic pc → số dấu hoá (C, Db, D, Eb, E, F, F#, G, Ab, A, Bb, B)

function corr(a: number[], b: number[]): number {
  const ma = a.reduce((x, y) => x + y, 0) / 12, mb = b.reduce((x, y) => x + y, 0) / 12;
  let n = 0, da = 0, db = 0;
  for (let i = 0; i < 12; i++) { n += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return da && db ? n / Math.sqrt(da * db) : 0;
}
/** Krumhansl–Schmuckler trên toàn bài, trọng số theo độ dài nốt. */
export function estimateKey(notes: readonly { pitch: number; startTick: number; endTick: number }[]): { fifths: number; mode: 'major' | 'minor'; confidence: number } {
  const h = new Array(12).fill(0);
  for (const n of notes) h[n.pitch % 12] += Math.min(n.endTick - n.startTick, 4 * NOTATION_PPQ);
  const scores: { pc: number; mode: 'major' | 'minor'; r: number }[] = [];
  for (let pc = 0; pc < 12; pc++) for (const [mode, prof] of [['major', KK_MAJOR], ['minor', KK_MINOR]] as const) {
    const rot = prof.map((_, i) => prof[(i - pc + 12) % 12]);
    scores.push({ pc, mode, r: corr(h, rot) });
  }
  scores.sort((a, b) => b.r - a.r || a.pc - b.pc);
  const best = scores[0];
  const fifths = best.mode === 'major' ? MAJOR_FIFTHS[best.pc] : MAJOR_FIFTHS[(best.pc + 3) % 12];
  return { fifths, mode: best.mode, confidence: Math.max(0, best.r - scores[1].r) };
}

// ───────────────────────────── lưới ─────────────────────────────
const PENALTY: Record<number, number> = { 1: 0, 2: 0.02, 4: 0.05, 8: 0.12, 3: 0.07, 6: 0.12, 12: 0.22 };

function candidates(beat: number, opt: Required<Pick<QuantizeOptions, 'maxDivision' | 'triplets'>>): number[] {
  const minBin = (NOTATION_PPQ * 4) / opt.maxDivision; // tick của nốt ngắn nhất cho phép
  const out = [1, 2, 4, 8].filter((s) => beat / s >= minBin - 1e-9 && Number.isInteger(beat / s));
  if (opt.triplets) for (const s of [3, 6, 12]) if (Number.isInteger(beat / s) && beat / s >= (minBin * 2) / 3 - 1e-9) out.push(s);
  return out;
}

// ───────────────────────────── giá trị nốt ─────────────────────────────
const BASES = [1, 2, 4, 8, 16, 32] as const;
const ticksOf = (base: number, dots: number) => ((NOTATION_PPQ * 4) / base) * (dots ? 1.5 : 1);

/** Tách đoạn nhị phân [p, p+len) (vị trí trong ô) thành giá trị nốt, theo phách. */
function splitBinary(p: number, len: number, beat: number, bar: number, minTick: number, rest: boolean): { pos: number; dur: number; value: NoteValue }[] {
  const out: { pos: number; dur: number; value: NoteValue }[] = [];
  let guard = 0;
  while (len > 0 && guard++ < 256) {
    let pick: { dur: number; value: NoteValue } | null = null;
    for (const base of BASES) for (const dots of [1, 0] as const) {
      const v = ticksOf(base, dots);
      if (pick || v > len + 1e-9 || v < minTick - 1e-9 || !Number.isInteger(v)) continue;
      if (rest && dots) continue; // nốt lặng không dùng chấm (dễ đọc)
      const unit = dots ? v / 3 : v;
      if (v >= beat) {
        // từ một phách trở lên: phải bắt đầu ở đầu phách; ≥ 2 phách: ở phách chẵn; tròn: chỉ khi cả ô
        if (p % beat !== 0) continue;
        if (v >= 2 * beat && (p / beat) % 2 !== 0) continue;
        if (base === 1 && !(p === 0 && v === bar)) continue;
        if (dots && v > beat && (v / beat) % 1 !== 0) continue;
      } else {
        // dưới một phách: không vượt ranh phách, thẳng hàng theo đơn vị
        if (Math.floor(p / beat) !== Math.floor((p + v - 1) / beat)) continue;
        if (p % unit !== 0) continue;
      }
      pick = { dur: v, value: { base, dots, triplet: false } };
    }
    if (!pick) { // không còn giá trị hợp lệ: dùng đơn vị nhỏ nhất (không xảy ra nếu lưới khớp)
      const base = BASES.find((b) => ticksOf(b, 0) <= len) ?? 32;
      pick = { dur: Math.min(len, ticksOf(base, 0)), value: { base, dots: 0, triplet: false } };
    }
    out.push({ pos: p, ...pick });
    p += pick.dur; len -= pick.dur;
  }
  return out;
}

/** Tách đoạn trong một phách tam liên thành giá trị (đơn vị = beat/3 → móc đơn tam liên khi beat là nốt đen). */
function splitTriplet(p: number, len: number, beat: number, beatStart: number): { pos: number; dur: number; value: NoteValue }[] {
  const out: { pos: number; dur: number; value: NoteValue }[] = [];
  // Ánh xạ độ dài thật → giá trị viết: thật × 3/2
  let guard = 0;
  while (len > 0 && guard++ < 64) {
    let pick: { dur: number; value: NoteValue } | null = null;
    for (const base of BASES) for (const dots of [0, 1] as const) {
      const written = ticksOf(base, dots), real = (written * 2) / 3;
      if (pick || !Number.isInteger(real) || real > len + 1e-9 || written > beat * 1.5 + 1e-9) continue;
      const unit = dots ? real / 3 : real;
      if ((p - beatStart) % unit !== 0) continue;
      pick = { dur: real, value: { base, dots, triplet: true } };
    }
    if (!pick) { pick = { dur: len, value: { base: 32, dots: 0, triplet: true } }; }
    out.push({ pos: p, ...pick });
    p += pick.dur; len -= pick.dur;
  }
  return out;
}

// ───────────────────────────── chính ─────────────────────────────
export interface QuantizeInput { notes: readonly ASTNote[]; tempoMap: readonly TempoPoint[]; staffOf?: (n: ASTNote) => 0 | 1 | undefined }

export function quantize(input: QuantizeInput, options: QuantizeOptions = {}): ScoreModel {
  const opt = {
    maxDivision: options.maxDivision ?? 16, triplets: options.triplets ?? true, splitPitch: options.splitPitch ?? 60,
    maxVoices: options.maxVoices ?? 2, simplicity: options.simplicity ?? 1,
  };
  const src = [...input.notes].sort((a, b) => a.startTick - b.startTick || b.pitch - a.pitch || (a.id < b.id ? -1 : 1));
  const endTick = src.reduce((m, n) => Math.max(m, n.endTick), 0);
  const bars = barsOf(input.tempoMap, endTick);
  const key = options.key ? { ...options.key, confidence: 1, estimated: false } : { ...estimateKey(src), estimated: true };

  const qn: QNote[] = src.map((n) => ({ id: n.id, pitch: n.pitch, s: n.startTick, e: n.endTick, qs: n.startTick, qe: n.endTick, staff: input.staffOf?.(n) ?? (n.pitch >= opt.splitPitch ? 0 : 1) }));

  // Phách: mảng {start, len, s (lưới chọn)} cho mọi ô
  const beats: { start: number; len: number; bar: number; sub: number[] }[] = [];
  bars.forEach((b, bi) => {
    const len = (NOTATION_PPQ * 4) / b.den;
    for (let t = b.startTick; t < b.endTick; t += len) beats.push({ start: t, len: Math.min(len, b.endTick - t), bar: bi, sub: [1, 1] });
  });
  const beatAt = (tick: number): number => {
    let lo = 0, hi = beats.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (beats[m].start <= tick) lo = m; else hi = m - 1; }
    return lo;
  };

  // 1) Lượng tử điểm bắt đầu, theo từng khuông, từng phách
  let errSum = 0, errMax = 0, exact = 0, tripletBeats = 0;
  for (const staff of [0, 1] as const) {
    const notes = qn.filter((n) => n.staff === staff);
    // nhóm theo phách (ε = nửa bước nhỏ nhất: nốt sát cuối phách thuộc phách sau)
    const byBeat = new Map<number, QNote[]>();
    for (const n of notes) {
      const b0 = beatAt(n.s), bt = beats[b0];
      const eps = bt.len / 24;
      const bi = n.s >= bt.start + bt.len - eps && b0 + 1 < beats.length ? b0 + 1 : b0;
      if (!byBeat.has(bi)) byBeat.set(bi, []);
      byBeat.get(bi)!.push(n);
    }
    const carried = new Map<number, QNote[]>();
    for (let bi = 0; bi < beats.length; bi++) {
      const bt = beats[bi];
      const list = byBeat.get(bi) ?? [];
      const fixed = carried.get(bi) ?? [];
      if (!list.length) { bt.sub[staff] = 1; continue; }
      let best = 1, bestCost = Infinity;
      for (const s of candidates(bt.len, opt)) {
        const step = bt.len / s;
        let cost = PENALTY[s] * opt.simplicity * (1 + Math.log2(1 + list.length) / 4);
        const seen = new Map<number, number>();
        for (const n of list) {
          const q = Math.round((n.s - bt.start) / step);
          cost += Math.abs(n.s - (bt.start + q * step)) / bt.len;
          const prev = seen.get(q);
          if (prev !== undefined && Math.abs(prev - n.s) > bt.len / 16) cost += 0.08; // hai nốt cách xa bị ép thành hợp âm
          seen.set(q, n.s);
        }
        if (cost < bestCost - 1e-12) { bestCost = cost; best = s; }
      }
      bt.sub[staff] = best;
      if (best % 3 === 0) tripletBeats++;
      const step = bt.len / best;
      for (const n of list) {
        const q = Math.round((n.s - bt.start) / step);
        n.qs = bt.start + q * step;
        if (q >= best && bi + 1 < beats.length) { n.qs = beats[bi + 1].start; (carried.get(bi + 1) ?? carried.set(bi + 1, []).get(bi + 1)!).push(n); }
      }
      void fixed;
    }
    // 2) điểm kết thúc: lưới của phách chứa điểm kết thúc (phách trống: móc kép, giới hạn theo maxDivision)
    for (const n of notes) {
      const bi = beatAt(Math.max(n.qs, n.e - 1)), bt = beats[bi];
      let s = bt.sub[staff];
      if (s === 1 && !(byBeat.get(bi)?.length)) s = Math.min(4, bt.len / ((NOTATION_PPQ * 4) / opt.maxDivision));
      const step = bt.len / Math.max(1, s);
      let qe = bt.start + Math.round((n.e - bt.start) / step) * step;
      const sb = beats[beatAt(n.qs)], minStep = sb.len / sb.sub[staff];
      if (qe <= n.qs) qe = n.qs + minStep;
      n.qe = qe;
    }
  }
  for (const n of qn) {
    const err = Math.abs(n.qs - n.s);
    errSum += err; errMax = Math.max(errMax, err); if (err === 0) exact++;
  }

  // 3) Giọng: nhóm theo điểm bắt đầu, mỗi khuông tối đa 2 giọng
  let cut = 0, voice2 = 0;
  const voicesByStaff: VEvent[][][] = [[[], []], [[], []]];
  for (const staff of [0, 1] as const) {
    const groups = new Map<number, QNote[]>();
    for (const n of qn) if (n.staff === staff) (groups.get(n.qs) ?? groups.set(n.qs, []).get(n.qs)!).push(n);
    const [v0, v1] = voicesByStaff[staff];
    const end = (v: VEvent[]) => (v.length ? v[v.length - 1].e : 0);
    const cutTo = (v: VEvent[], t: number) => { const l = v[v.length - 1]; if (l && l.e > t && l.s < t) { l.e = t; cut++; } };
    for (const T of [...groups.keys()].sort((a, b) => a - b)) {
      const g = groups.get(T)!.sort((a, b) => b.pitch - a.pitch);
      const parts = new Map<number, QNote[]>();
      for (const n of g) (parts.get(n.qe) ?? parts.set(n.qe, []).get(n.qe)!).push(n);
      const ends = [...parts.keys()];
      const place = (v: VEvent[], notes: QNote[], e: number) => v.push({ s: T, e, notes });
      if (opt.maxVoices === 1) {
        cutTo(v0, T);
        place(v0, g, Math.max(...ends));
        continue;
      }
      const v0Busy = end(v0) > T;
      if (v0Busy) {
        const l = v0[v0.length - 1], overlap = l.e - T, small = overlap <= Math.max((l.e - l.s) * 0.25, beats[beatAt(T)].len / 4);
        if (!small && end(v1) <= T) { place(v1, g, Math.max(...ends)); voice2++; continue; }
        cutTo(v0, T);
      }
      if (ends.length === 1) { place(v0, g, ends[0]); continue; }
      // nhiều độ dài: phần chứa nốt cao nhất ở giọng 1, phần còn lại ở giọng 2 nếu trống
      const topEnd = g[0].qe;
      const top = parts.get(topEnd)!, rest = g.filter((n) => n.qe !== topEnd);
      if (end(v1) <= T) { place(v0, top, topEnd); place(v1, rest, Math.max(...rest.map((n) => n.qe))); voice2++; }
      else { place(v0, g, Math.min(...ends)); cut += rest.length; }
    }
  }

  // 4) Dựng ô nhịp: cắt sự kiện theo ô, lấp nốt lặng, tách giá trị (tam liên theo phách)
  const minTick = (NOTATION_PPQ * 4) / opt.maxDivision;
  const measures: ScoreMeasure[] = bars.map((b, i) => ({
    index: i, startTick: b.startTick, endTick: b.endTick, num: b.num, den: b.den,
    staves: [{ clef: 'treble', voices: [] }, { clef: 'bass', voices: [] }] as [ScoreStaff, ScoreStaff],
  }));
  for (const staff of [0, 1] as const) {
    voicesByStaff[staff].forEach((evs, vi) => {
      if (vi === 1 && !evs.length) return;
      let k = 0;
      measures.forEach((m) => {
        const barLen = m.endTick - m.startTick, beatLen = (NOTATION_PPQ * 4) / m.den;
        const out: ScoreEvent[] = [];
        let tupletId = 0;
        const firstBeat = beatAt(m.startTick);
        const isTrip = (pos: number) => beats[firstBeat + Math.floor(pos / beatLen)]?.sub[staff] % 3 === 0;
        const emit = (pos: number, len: number, rest: boolean, notes: QNote[], headTie: boolean, tailTie: boolean) => {
          // tách theo đoạn phách nhị phân/tam liên liên tiếp
          const pieces: { pos: number; dur: number; value: NoteValue; trip: boolean }[] = [];
          let p = pos, left = len;
          while (left > 0) {
            const bIdx = Math.floor(p / beatLen), bStart = bIdx * beatLen;
            if (isTrip(p)) {
              const segEnd = Math.min(p + left, bStart + beatLen);
              for (const x of splitTriplet(p, segEnd - p, beatLen, bStart)) pieces.push({ ...x, trip: true });
              left -= segEnd - p; p = segEnd;
            } else {
              let segEnd = p + left;
              for (let q = bIdx + 1; q * beatLen < segEnd; q++) if (isTrip(q * beatLen)) { segEnd = q * beatLen; break; }
              for (const x of splitBinary(p, segEnd - p, beatLen, barLen, rest ? minTick : 1, rest)) pieces.push({ ...x, trip: false });
              left -= segEnd - p; p = segEnd;
            }
          }
          pieces.forEach((x, j) => {
            const hidden = rest && vi === 1;
            out.push({
              pos: x.pos, dur: x.dur, value: x.value, rest, hidden, tuplet: -1,
              notes: rest ? [] : notes.map((n) => ({ noteId: n.id, pitch: n.pitch, tieStart: j < pieces.length - 1 || tailTie, tieEnd: j > 0 || headTie })),
            });
          });
        };
        let cursor = 0;
        while (k < evs.length && evs[k].e <= m.startTick) k++;
        for (let j = k; j < evs.length && evs[j].s < m.endTick; j++) {
          const ev = evs[j];
          const a = Math.max(ev.s, m.startTick) - m.startTick, z = Math.min(ev.e, m.endTick) - m.startTick;
          if (z <= a) continue;
          if (a > cursor) emit(cursor, a - cursor, true, [], false, false);
          emit(a, z - a, false, ev.notes, ev.s < m.startTick, ev.e > m.endTick);
          cursor = z;
        }
        if (cursor < barLen) {
          if (cursor === 0 && vi === 0) out.push({ pos: 0, dur: barLen, value: { base: 1, dots: 0, triplet: false }, rest: true, hidden: false, notes: [], tuplet: -1 }); // lặng cả ô
          else emit(cursor, barLen - cursor, true, [], false, false);
        }
        // nhóm tam liên theo phách
        let lastBeat = -1;
        for (const e of out) if (e.value.triplet) {
          const b = Math.floor(e.pos / beatLen);
          if (b !== lastBeat) { tupletId++; lastBeat = b; }
          e.tuplet = tupletId - 1;
        }
        m.staves[staff].voices[vi] = { events: out };
      });
    });
  }
  // khuông trống: một giọng lặng cả ô
  for (const m of measures) for (const st of m.staves) if (!st.voices.length) st.voices.push({ events: [{ pos: 0, dur: m.endTick - m.startTick, value: { base: 1, dots: 0, triplet: false }, rest: true, hidden: false, notes: [], tuplet: -1 }] });

  return {
    ppq: NOTATION_PPQ, measures, key,
    stats: { notes: qn.length, exactOnsets: exact, meanOnsetErr: qn.length ? errSum / qn.length : 0, maxOnsetErr: errMax, cut, tripletBeats, voice2Events: voice2 },
  };
}

/** Kiểm cấu trúc: mọi giọng mọi ô có tổng độ dài = độ dài ô và các sự kiện liền nhau. Trả danh sách lỗi (rỗng = hợp lệ). */
export function validateScore(model: ScoreModel): string[] {
  const errs: string[] = [];
  for (const m of model.measures) {
    const len = m.endTick - m.startTick;
    m.staves.forEach((st, si) => st.voices.forEach((v, vi) => {
      let p = 0;
      for (const e of v.events) {
        if (Math.abs(e.pos - p) > 1e-6) errs.push(`ô ${m.index + 1} khuông ${si} giọng ${vi}: hở/chồng tại ${e.pos} (mong ${p})`);
        const written = ticksOf(e.value.base, e.value.dots) * (e.value.triplet ? 2 / 3 : 1);
        if (Math.abs(written - e.dur) > 1e-6 && !(e.rest && e.value.base === 1 && e.pos === 0 && e.dur === len)) errs.push(`ô ${m.index + 1} khuông ${si} giọng ${vi}: giá trị ${e.value.base}${e.value.dots ? '.' : ''}${e.value.triplet ? 't' : ''} (${written}) ≠ độ dài ${e.dur} tại ${e.pos}`);
        p = e.pos + e.dur;
      }
      if (Math.abs(p - len) > 1e-6) errs.push(`ô ${m.index + 1} khuông ${si} giọng ${vi}: tổng ${p} ≠ ${len}`);
    }));
  }
  return errs;
}
