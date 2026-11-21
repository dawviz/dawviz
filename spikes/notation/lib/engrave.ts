// Engraver: ScoreModel → VexFlow → NotationLayout (display list thuần, chia trang, có mốc thời gian → x).
// Chạy được ở Node, Worker hay luồng chính: đo chữ bằng bảng đo cài sẵn (setTextMeasurementCanvas), không FontFace.
import * as VF from 'vexflow';
import type { ScoreModel, ScoreEvent, ScoreMeasure } from '../../../packages/render-core/src/notation/quantize.ts';
import { RecordingContext, patchElementFrames, drawFramed } from './recordingContext.mjs';

export interface EngraveOptions {
  /** Chiều rộng trang (đơn vị VexFlow: 10 = một khoảng dòng kẻ). */
  width?: number;
  /** Số ô mỗi hàng (0 = tự dàn theo độ rộng). */
  barsPerSystem?: number;
  /** Số hàng mỗi trang. */
  systemsPerPage?: number;
  musicFont?: 'Bravura' | 'Petaluma' | 'Gonville';
  textFont?: 'Academico' | 'Petaluma Script';
  /** Giây của tick (đổi theo tempoMap) — để ghi mốc thời gian vào layout. */
  tickToSec: (tick: number) => number;
  /** Giây bắt đầu/kết thúc thật của nốt AST (theo id). */
  noteTime: (id: string) => { on: number; off: number } | undefined;
  showMeasureNumbers?: boolean;
  tempoBpm?: number;
}

export interface LayoutItem { t: 'path' | 'glyphs'; owner: string | null; cat: string; [k: string]: unknown }
export interface OwnerInfo { notes: string[]; on: number; off: number; head: boolean; cx: number; cy: number }
export interface LayoutPage {
  firstBar: number; lastBar: number; start: number; end: number; height: number;
  items: LayoutItem[];
  /** Mốc thời gian → x theo từng hàng: [{sec, x}], đơn điệu; y0/y1 là phạm vi dọc của hàng. */
  systems: { y0: number; y1: number; start: number; end: number; anchors: { sec: number; x: number }[] }[];
}
export interface NotationLayout { width: number; pages: LayoutPage[]; owners: Record<string, OwnerInfo>; glyphs: Record<string, unknown>; stats: Record<string, number> }

const MAJOR_NAMES = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
const MINOR_NAMES = ['Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'];
const LETTERS = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];

/** Bảng cách viết cao độ theo giọng: pc → {letter, acc}. Bậc 7 nâng của giọng thứ viết bằng thăng/bình. */
export function spellingTable(fifths: number, mode: 'major' | 'minor'): { letter: number; acc: number }[] {
  const keyAcc = new Array(7).fill(0);
  const sharpOrder = [3, 0, 4, 1, 5, 2, 6], flatOrder = [6, 2, 5, 1, 4, 0, 3];
  if (fifths > 0) for (let i = 0; i < fifths; i++) keyAcc[sharpOrder[i]] = 1;
  if (fifths < 0) for (let i = 0; i < -fifths; i++) keyAcc[flatOrder[i]] = -1;
  const table: ({ letter: number; acc: number } | null)[] = new Array(12).fill(null);
  for (let l = 0; l < 7; l++) table[(LETTER_PC[l] + keyAcc[l] + 12) % 12] = { letter: l, acc: keyAcc[l] };
  if (mode === 'minor') { // bậc 7 nâng
    const majorTonicPc = ((fifths * 7) % 12 + 12) % 12, tonicPc = (majorTonicPc + 9) % 12, lt = (tonicPc + 11) % 12;
    if (!table[lt]) { const l = (LETTERS.indexOf(MINOR_NAMES[fifths + 7][0].toLowerCase()) + 6) % 7; table[lt] = { letter: l, acc: ((lt - LETTER_PC[l] + 18) % 12) - 6 }; }
  }
  for (let pc = 0; pc < 12; pc++) if (!table[pc]) {
    const nat = LETTER_PC.indexOf(pc);
    if (nat >= 0) { table[pc] = { letter: nat, acc: 0 }; continue; }
    if (fifths >= 0) { const l = LETTER_PC.indexOf((pc + 11) % 12); table[pc] = l >= 0 ? { letter: l, acc: 1 } : { letter: LETTER_PC.indexOf((pc + 1) % 12), acc: -1 }; }
    else { const l = LETTER_PC.indexOf((pc + 1) % 12); table[pc] = l >= 0 ? { letter: l, acc: -1 } : { letter: LETTER_PC.indexOf((pc + 11) % 12), acc: 1 }; }
  }
  return table as { letter: number; acc: number }[];
}
function vfKey(pitch: number, table: { letter: number; acc: number }[]): string {
  const sp = table[pitch % 12];
  const octave = Math.floor((pitch - sp.acc) / 12) - 1;
  const acc = sp.acc === 1 ? '#' : sp.acc === -1 ? 'b' : sp.acc === 2 ? '##' : sp.acc === -2 ? 'bb' : '';
  return `${LETTERS[sp.letter]}${acc}/${octave}`;
}
const DUR: Record<number, string> = { 1: 'w', 2: 'h', 4: 'q', 8: '8', 16: '16', 32: '32' };

let installed = false;
export function installMeasurer(canvas: unknown) {
  if (installed) return;
  (VF.Element as unknown as { setTextMeasurementCanvas(c: unknown): void }).setTextMeasurementCanvas(canvas);
  patchElementFrames();
  installed = true;
}

interface Built { staveNotes: VF.StaveNote[][][]; voices: VF.Voice[][]; tuplets: VF.Tuplet[]; beams: VF.Beam[]; byEvent: Map<ScoreEvent, VF.StaveNote> }

export function engrave(model: ScoreModel, o: EngraveOptions): NotationLayout {
  const width = o.width ?? 1200, systemsPerPage = o.systemsPerPage ?? 1;
  const font = o.musicFont ?? 'Bravura', textFont = o.textFont ?? 'Academico';
  VF.VexFlow.setFonts(font, textFont);
  const table = spellingTable(model.key.fifths, model.key.mode);
  const keySpec = (model.key.mode === 'major' ? MAJOR_NAMES : MINOR_NAMES)[model.key.fifths + 7] + (model.key.mode === 'minor' ? 'm' : '');
  const owners: Record<string, OwnerInfo> = {};
  let ownerSeq = 0;

  // 1) Dựng nốt VexFlow cho từng ô (chưa định vị)
  const built: Built[] = model.measures.map((m) => {
    const beatTicks = (model.ppq * 4) / m.den;
    const res: Built = { staveNotes: [], voices: [], tuplets: [], beams: [], byEvent: new Map() };
    m.staves.forEach((st, si) => {
      const visibleVoices = st.voices.filter((v) => v.events.some((e) => !e.hidden && !e.rest)).length;
      res.staveNotes[si] = [];
      res.voices[si] = [];
      st.voices.forEach((v, vi) => {
        const notes: VF.StaveNote[] = [];
        const tupletGroups = new Map<number, VF.StaveNote[]>();
        for (const e of v.events) {
          let sn: VF.StaveNote;
          const dur = DUR[e.value.base] + (e.value.dots ? 'd' : '') + (e.rest ? 'r' : '');
          const wholeBarRest = e.rest && e.pos === 0 && e.dur === m.endTick - m.startTick && e.value.base === 1;
          if (wholeBarRest && !e.hidden) {
            // lặng cả ô: dấu lặng tròn ở giữa ô, số tick = cả ô (nhịp bất kỳ)
            sn = new VF.StaveNote({ keys: [st.clef === 'treble' ? 'd/5' : 'f/3'], duration: 'wr', clef: st.clef });
            sn.setIntrinsicTicks((VF.VexFlow.RESOLUTION * m.num) / m.den);
            sn.setCenterAlignment(true);
          } else if (e.hidden && wholeBarRest) {
            sn = new VF.GhostNote({ duration: 'w' }) as unknown as VF.StaveNote;
            sn.setIntrinsicTicks((VF.VexFlow.RESOLUTION * m.num) / m.den);
          } else if (e.hidden) sn = new VF.GhostNote({ duration: DUR[e.value.base] + (e.value.dots ? 'd' : '') }) as unknown as VF.StaveNote;
          else {
            const keys = e.rest ? [st.clef === 'treble' ? (vi === 1 ? 'e/4' : 'b/4') : (vi === 1 ? 'f/2' : 'd/3')] : [...e.notes].sort((a, b) => a.pitch - b.pitch).map((n) => vfKey(n.pitch, table));
            sn = new VF.StaveNote({ keys, duration: dur, clef: st.clef, autoStem: visibleVoices < 2, stemDirection: visibleVoices >= 2 ? (vi === 0 ? 1 : -1) : undefined });
            if (e.value.dots) VF.Dot.buildAndAttach([sn], { all: true });
          }
          if (!e.rest && !e.hidden) {
            const id = 'o' + ownerSeq++;
            sn.setAttribute('id', id);
            const times = e.notes.map((n) => o.noteTime(n.noteId)).filter(Boolean) as { on: number; off: number }[];
            owners[id] = {
              notes: e.notes.map((n) => n.noteId), head: e.notes.every((n) => !n.tieEnd),
              on: times.length ? Math.min(...times.map((x) => x.on)) : o.tickToSec(m.startTick + e.pos),
              off: times.length ? Math.max(...times.map((x) => x.off)) : o.tickToSec(m.startTick + e.pos + e.dur),
              cx: 0, cy: 0,
            };
          }
          res.byEvent.set(e, sn);
          notes.push(sn);
          if (e.tuplet >= 0) (tupletGroups.get(e.tuplet) ?? tupletGroups.set(e.tuplet, []).get(e.tuplet)!).push(sn);
        }
        for (const g of tupletGroups.values()) {
          const tp = new VF.Tuplet(g, { numNotes: 3, notesOccupied: 2, ratioed: false, bracketed: true });
          if (g.every((n) => !(n instanceof VF.GhostNote))) res.tuplets.push(tp); // nhóm có lặng ẩn: chỉ đổi tick, không vẽ ngoặc
        }
        const voice = new VF.Voice({ numBeats: m.num, beatValue: m.den }).setMode(VF.Voice.Mode.STRICT);
        voice.addTickables(notes);
        res.voices[si][vi] = voice;
        res.staveNotes[si][vi] = notes;
        const beamable = notes.filter((n) => !(n instanceof VF.GhostNote));
        const groups = [new VF.Fraction(beatTicks, model.ppq * 4).simplify()];
        res.beams.push(...VF.Beam.generateBeams(beamable, { groups, maintainStemDirections: visibleVoices >= 2, beamRests: false }));
      });
      VF.Accidental.applyAccidentals(res.voices[si], keySpec);
    });
    return res;
  });

  // 2) Độ rộng tối thiểu từng ô (căn hai khuông chung một Formatter)
  const minW = built.map((b) => {
    const f = new VF.Formatter();
    const all = b.voices.flat();
    for (const vs of b.voices) f.joinVoices(vs);
    return f.preCalculateMinTotalWidth(all) + 24;
  });

  // 3) Chia hàng
  const STAFF_GAP = 100, SYSTEM_GAP = 90, TOP = 50;
  const headerW = (first: boolean) => { // khoá + hoá biểu (+ nhịp ở hàng đầu hoặc khi đổi)
    const s = new VF.Stave(0, 0, 500).addClef('treble').addKeySignature(keySpec);
    if (first) s.addTimeSignature('4/4');
    return s.getNoteStartX() + 10;
  };
  const systems: number[][] = [];
  let cur: number[] = [], used = 0;
  for (let i = 0; i < model.measures.length; i++) {
    const h = cur.length ? 0 : headerW(systems.length === 0);
    const need = minW[i] + h;
    const full = o.barsPerSystem ? cur.length >= o.barsPerSystem : cur.length && used + need > width - 20;
    if (full) { systems.push(cur); cur = []; used = 0; i--; continue; }
    cur.push(i); used += need;
  }
  if (cur.length) systems.push(cur);

  // 4) Dàn, vẽ từng trang
  const pages: LayoutPage[] = [];
  const ctxs: RecordingContext[] = [];
  const t0 = performance.now();
  for (let p = 0; p < systems.length; p += systemsPerPage) {
    const ctx = new RecordingContext();
    const pageSystems = systems.slice(p, p + systemsPerPage);
    const sysOut: LayoutPage['systems'] = [];
    let y = TOP;
    const prevSig = (mi: number) => (mi > 0 ? model.measures[mi - 1] : null);
    pageSystems.forEach((bars, si) => {
      const first = p + si === 0;
      const heads = bars.map((mi, k) => (k === 0 ? headerW(first) : 0) + (k > 0 && sigChanged(model.measures[mi], prevSig(mi)) ? 30 : 0));
      const total = bars.reduce((a, mi, k) => a + minW[mi] + heads[k], 0);
      const stretch = o.barsPerSystem || bars.length > 1 || total > width * 0.6 ? (width - 20) / total : 1;
      let x = 10;
      const anchors: { sec: number; x: number }[] = [];
      const staves: [VF.Stave, VF.Stave][] = [];
      bars.forEach((mi, k) => {
        const m = model.measures[mi];
        const w = (minW[mi] + heads[k]) * stretch;
        const top = new VF.Stave(x, y, w), bot = new VF.Stave(x, y + STAFF_GAP, w);
        if (k === 0) { top.addClef('treble').addKeySignature(keySpec); bot.addClef('bass').addKeySignature(keySpec); }
        if (first && k === 0 || sigChanged(m, prevSig(mi))) { top.addTimeSignature(`${m.num}/${m.den}`); bot.addTimeSignature(`${m.num}/${m.den}`); }
        if (k === 0 && o.showMeasureNumbers !== false) top.setMeasure(mi + 1);
        if (first && k === 0 && o.tempoBpm) top.setTempo({ duration: 'q', bpm: Math.round(o.tempoBpm) }, -10);
        if (k === bars.length - 1 && mi === model.measures.length - 1) { top.setEndBarType(VF.Barline.type.END); bot.setEndBarType(VF.Barline.type.END); }
        const start = Math.max(top.getNoteStartX(), bot.getNoteStartX());
        top.setNoteStartX(start); bot.setNoteStartX(start);
        staves.push([top, bot]);
        const b = built[mi];
        const f = new VF.Formatter();
        for (const vs of b.voices) f.joinVoices(vs);
        f.format(b.voices.flat(), top.getNoteEndX() - start - 12);
        anchors.push({ sec: o.tickToSec(m.startTick), x: start - 4 });
        x += w;
      });
      // vẽ
      for (const [top, bot] of staves) { drawFramed(ctx, top); drawFramed(ctx, bot); }
      const [t0s, b0s] = staves[0], [tls, bls] = staves[staves.length - 1];
      drawFramed(ctx, new VF.StaveConnector(t0s, b0s).setType('brace'));
      drawFramed(ctx, new VF.StaveConnector(t0s, b0s).setType('singleLeft'));
      for (const [top, bot] of staves) drawFramed(ctx, new VF.StaveConnector(top, bot).setType(top === tls ? (bars[bars.length - 1] === model.measures.length - 1 ? 'boldDoubleRight' : 'singleRight') : 'singleRight'));
      void bls;
      bars.forEach((mi, k) => {
        const b = built[mi];
        b.voices.forEach((vs, s) => vs.forEach((v) => v.draw(ctx as unknown as VF.RenderContext, staves[k][s])));
        b.beams.forEach((bm) => bm.setContext(ctx as unknown as VF.RenderContext).drawWithStyle());
        b.tuplets.forEach((tp) => tp.setContext(ctx as unknown as VF.RenderContext).drawWithStyle());
        // mốc thời gian theo nốt (dùng giây thật của nốt; rests theo tick)
        const m = model.measures[mi];
        m.staves.forEach((st) => st.voices.forEach((v) => v.events.forEach((e) => {
          if (e.hidden) return;
          const sn = b.byEvent.get(e)!;
          const id = sn.getAttribute('id');
          const sec = !e.rest && owners[id] && owners[id].head ? owners[id].on : o.tickToSec(m.startTick + e.pos);
          anchors.push({ sec, x: sn.getAbsoluteX() });
          if (owners[id]) { const bb = sn.getBoundingBox(); owners[id].cx = bb ? bb.getX() + bb.getW() / 2 : sn.getAbsoluteX(); owners[id].cy = bb ? bb.getY() + bb.getH() / 2 : 0; }
        })));
      });
      // dấu nối: trong hàng, và nửa dấu nối ở mép hàng
      const inSys = new Set(bars);
      for (const mi of bars) {
        const m = model.measures[mi];
        m.staves.forEach((st, s) => st.voices.forEach((v, vi) => v.events.forEach((e, ei) => {
          if (e.rest || !e.notes.some((n) => n.tieStart)) return;
          const from = built[mi].byEvent.get(e)!;
          let nextE: ScoreEvent | undefined = v.events[ei + 1], nextM = mi;
          if (!nextE) { nextM = mi + 1; nextE = model.measures[nextM]?.staves[s].voices[vi]?.events[0]; }
          const to = nextE && !nextE.rest && inSys.has(nextM) ? built[nextM].byEvent.get(nextE) : undefined;
          const idx = e.notes.map((n, i) => (n.tieStart ? i : -1)).filter((i) => i >= 0);
          const tie = new VF.StaveTie({ firstNote: from, lastNote: to, firstIndexes: idx, lastIndexes: idx });
          tie.setContext(ctx as unknown as VF.RenderContext).drawWithStyle();
        })));
        // nửa dấu nối đầu hàng (nối từ hàng trước)
        if (mi === bars[0] && mi > 0) m.staves.forEach((st) => st.voices.forEach((v) => {
          const e = v.events[0];
          if (!e || e.rest || !e.notes.some((n) => n.tieEnd)) return;
          const idx = e.notes.map((n, i) => (n.tieEnd ? i : -1)).filter((i) => i >= 0);
          new VF.StaveTie({ firstNote: undefined, lastNote: built[mi].byEvent.get(e)!, firstIndexes: idx, lastIndexes: idx }).setContext(ctx as unknown as VF.RenderContext).drawWithStyle();
        }));
      }
      anchors.sort((a, b) => a.sec - b.sec || a.x - b.x);
      const mono: { sec: number; x: number }[] = [];
      for (const a of anchors) if (!mono.length || (a.x >= mono[mono.length - 1].x && a.sec >= mono[mono.length - 1].sec)) mono.push(a);
      const lastM = model.measures[bars[bars.length - 1]];
      mono.push({ sec: o.tickToSec(lastM.endTick), x: x });
      sysOut.push({ y0: y, y1: y + STAFF_GAP + 120, start: o.tickToSec(model.measures[bars[0]].startTick), end: o.tickToSec(lastM.endTick), anchors: mono });
      y += STAFF_GAP + 40 + SYSTEM_GAP;
    });
    const firstBar = pageSystems[0][0], lastBar = pageSystems[pageSystems.length - 1].slice(-1)[0];
    pages.push({ firstBar, lastBar, start: o.tickToSec(model.measures[firstBar].startTick), end: o.tickToSec(model.measures[lastBar].endTick), height: y - SYSTEM_GAP - 40 + 160, items: ctx.items as LayoutItem[], systems: sysOut });
    ctxs.push(ctx);
  }
  const ms = performance.now() - t0;
  return { width, pages, owners, glyphs: {}, stats: { drawMs: ms, systems: systems.length } };
}

function sigChanged(m: ScoreMeasure, prev: ScoreMeasure | null): boolean { return !!prev && (prev.num !== m.num || prev.den !== m.den); }
