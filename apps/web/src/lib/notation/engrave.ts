// Engraver Bản nhạc (D-63, Technical Design §5.11): ScoreModel (đã lượng tử) → VexFlow → NotationLayout (dữ liệu thuần).
// Chạy trong Worker (notation.worker.ts) hoặc Node (test). Đo chữ bằng bảng glyph sinh sẵn nên mọi trình duyệt dàn trang như nhau.
import {
  Accidental, Barline, Beam, Dot, Element, Formatter, Fraction, GhostNote, Stave, StaveConnector, StaveNote, StaveTie, Tuplet, VexFlow, Voice,
  type RenderContext,
} from 'vexflow/core';
import { keyName, spellingTable, vexKey, type NotationLayout, type NotationOwner, type NotationPage, type NotationWarning, type ScoreEvent, type ScoreMeasure, type ScoreModel } from '@dawviz/render-core';
import { drawFramed, patchElementFrames, RecordingContext } from './recordingContext.ts';
import { measureCanvas } from './glyphTable.ts';

export type MusicFont = 'BRAVURA' | 'PETALUMA' | 'GONVILLE';
/** Chồng phông (nhạc, dự phòng, chữ): glyph thiếu ở phông chính lấy từ Bravura (Gonville không có số liên ba, nốt của ký hiệu tempo). */
export const MUSIC_FONTS: Record<MusicFont, string[]> = { BRAVURA: ['Bravura', 'Academico'], PETALUMA: ['Petaluma', 'Bravura', 'Petaluma Script'], GONVILLE: ['Gonville', 'Bravura', 'Academico'] };

export interface EngraveOptions {
  /** Bề rộng trang (đơn vị VexFlow). */
  width?: number;
  /** Số ô mỗi hàng (0 = tự dàn theo bề rộng) và số hàng mỗi trang. */
  barsPerSystem?: number; systemsPerPage?: number;
  musicFont?: MusicFont;
  measureNumbers?: boolean;
  /** Cỡ số ô nhịp so với mặc định của VexFlow (1 = mặc định). */
  measureNumberScale?: number;
  /** BPM ghi ở đầu bài (vắng = không ghi). */
  tempoBpm?: number;
  tickToSec: (tick: number) => number;
  /** Giây thật và track của nốt AST theo id. */
  noteInfo: (id: string) => { on: number; off: number; track: number } | undefined;
}

const DUR: Record<number, string> = { 1: 'w', 2: 'h', 4: 'q', 8: '8', 16: '16', 32: '32' };
const STAFF_GAP = 100, SYSTEM_GAP = 70, TOP = 30, STAVE_PAD = 40; // Stave(y) vẽ dòng kẻ đầu ở y + 40
type VNote = StaveNote;

let ready = false;
function setup() {
  if (ready) return;
  (Element as unknown as { setTextMeasurementCanvas(c: unknown): void }).setTextMeasurementCanvas(measureCanvas());
  patchElementFrames();
  ready = true;
}

interface Built { voices: Voice[][]; tuplets: Tuplet[]; beams: Beam[]; byEvent: Map<ScoreEvent, VNote> }

export function engrave(model: ScoreModel, o: EngraveOptions): NotationLayout {
  setup();
  const t0 = performance.now();
  const width = o.width ?? 1200, perPage = Math.max(1, o.systemsPerPage ?? 1);
  VexFlow.setFonts(...MUSIC_FONTS[o.musicFont ?? 'BRAVURA']);
  const table = spellingTable(model.key.fifths, model.key.mode);
  const keySpec = keyName(model.key.fifths, model.key.mode);
  const owners: NotationOwner[] = [], ownerIdx = new Map<string, number>();
  const warnings: NotationWarning[] = [];
  let seq = 0;

  // 1) Nốt VexFlow cho từng ô (chưa định vị)
  const built: Built[] = model.measures.map((m) => buildMeasure(m));
  function buildMeasure(m: ScoreMeasure): Built {
    const beatTicks = (model.ppq * 4) / m.den, barTicks = (VexFlow.RESOLUTION * m.num) / m.den;
    const res: Built = { voices: [], tuplets: [], beams: [], byEvent: new Map() };
    m.staves.forEach((st, si) => {
      const twoVoices = st.voices.filter((v) => v.events.some((e) => !e.rest)).length >= 2;
      res.voices[si] = [];
      st.voices.forEach((v, vi) => {
        const notes: VNote[] = [];
        const groups = new Map<number, VNote[]>();
        for (const e of v.events) {
          const base = DUR[e.value.base] + (e.value.dots ? 'd' : '');
          const wholeBar = e.rest && e.pos === 0 && e.dur === m.endTick - m.startTick && e.value.base === 1;
          let sn: VNote;
          if (e.hidden) {
            sn = new GhostNote({ duration: wholeBar ? 'w' : base }) as unknown as VNote;
            if (wholeBar) sn.setIntrinsicTicks(barTicks);
          } else if (wholeBar) { // lặng cả ô: dấu lặng tròn giữa ô, số tick = cả ô (mọi nhịp)
            sn = new StaveNote({ keys: [st.clef === 'treble' ? 'd/5' : 'f/3'], duration: 'wr', clef: st.clef });
            sn.setIntrinsicTicks(barTicks); sn.setCenterAlignment(true);
          } else {
            const keys = e.rest ? [st.clef === 'treble' ? (vi === 1 ? 'e/4' : 'b/4') : (vi === 1 ? 'f/2' : 'd/3')] : [...e.notes].sort((a, b) => a.pitch - b.pitch).map((n) => vexKey(n.pitch, table));
            sn = new StaveNote({ keys, duration: base + (e.rest ? 'r' : ''), clef: st.clef, autoStem: !twoVoices, ...(twoVoices ? { stemDirection: vi === 0 ? 1 : -1 } : {}) });
            if (e.value.dots) Dot.buildAndAttach([sn], { all: true });
          }
          if (e.rest && !e.hidden) { // dấu lặng: chủ riêng chỉ để viết tay/xoá đúng lúc (T-132), vẽ như phần tĩnh
            const id = 'n' + seq++;
            sn.setAttribute('id', id);
            ownerIdx.set(id, owners.length);
            owners.push({ notes: [], head: false, rest: true, on: o.tickToSec(m.startTick + e.pos), off: o.tickToSec(m.startTick + e.pos + e.dur), cx: 0, cy: 0, track: 0 });
          } else if (!e.hidden) {
            const id = 'n' + seq++;
            sn.setAttribute('id', id);
            const infos = e.notes.map((n) => o.noteInfo(n.noteId)).filter((x): x is NonNullable<typeof x> => !!x);
            ownerIdx.set(id, owners.length);
            owners.push({
              notes: e.notes.map((n) => n.noteId), head: e.notes.every((n) => !n.tieEnd),
              on: infos.length ? Math.min(...infos.map((x) => x.on)) : o.tickToSec(m.startTick + e.pos),
              off: infos.length ? Math.max(...infos.map((x) => x.off)) : o.tickToSec(m.startTick + e.pos + e.dur),
              cx: 0, cy: 0, track: infos[0]?.track ?? 0,
            });
          }
          res.byEvent.set(e, sn);
          notes.push(sn);
          if (e.tuplet >= 0) { let g = groups.get(e.tuplet); if (!g) groups.set(e.tuplet, (g = [])); g.push(sn); }
        }
        for (const g of groups.values()) {
          const tp = new Tuplet(g, { numNotes: 3, notesOccupied: 2, ratioed: false, bracketed: true });
          if (g.every((n) => !(n instanceof GhostNote))) res.tuplets.push(tp); // nhóm có lặng ẩn: chỉ đổi tick, không vẽ ngoặc
        }
        const voice = new Voice({ numBeats: m.num, beatValue: m.den }).setMode(Voice.Mode.STRICT);
        voice.addTickables(notes);
        res.voices[si][vi] = voice;
        const beamable = notes.filter((n) => !(n instanceof GhostNote));
        res.beams.push(...Beam.generateBeams(beamable, { groups: [new Fraction(beatTicks, model.ppq * 4).simplify()], maintainStemDirections: twoVoices, beamRests: false }));
      });
      Accidental.applyAccidentals(res.voices[si], keySpec);
    });
    return res;
  }

  // 2) Bề rộng tối thiểu từng ô (hai khuông chung một Formatter)
  const minW = built.map((b) => {
    const f = new Formatter();
    for (const vs of b.voices) f.joinVoices(vs);
    return f.preCalculateMinTotalWidth(b.voices.flat()) + 24;
  });
  const sigChanged = (mi: number) => mi > 0 && (model.measures[mi - 1].num !== model.measures[mi].num || model.measures[mi - 1].den !== model.measures[mi].den);
  const headerW = (withTime: boolean) => { const s = new Stave(0, 0, 500).addClef('treble').addKeySignature(keySpec); if (withTime) s.addTimeSignature('4/4'); return s.getNoteStartX() + 10; };
  const HEAD = headerW(false), HEAD_TIME = headerW(true);

  // 3) Chia hàng
  const systems: number[][] = [];
  let cur: number[] = [], used = 0;
  for (let i = 0; i < model.measures.length; i++) {
    const need = minW[i] + (cur.length ? (sigChanged(i) ? 30 : 0) : i === 0 || sigChanged(i) ? HEAD_TIME : HEAD);
    const full = o.barsPerSystem ? cur.length >= o.barsPerSystem : cur.length > 0 && used + need > width - 20;
    if (full) { systems.push(cur); cur = []; used = 0; i--; continue; }
    cur.push(i); used += need;
  }
  if (cur.length) systems.push(cur);

  // 4) Dàn và ghi lệnh vẽ từng trang
  const pages: NotationPage[] = [];
  let glyphs: NotationLayout['glyphs'] = [];
  const glyphMap = new Map<string, number>(); // gộp bảng glyph các trang
  const missing = new Set<number>();
  for (let p = 0; p < systems.length; p += perPage) {
    const ctx = new RecordingContext();
    ctx.ownerOf = (id) => ownerIdx.get(id) ?? -1;
    const rc = ctx as unknown as RenderContext;
    const sysOut: NotationPage['systems'] = [];
    let y = TOP;
    for (const bars of systems.slice(p, p + perPage)) {
      const heads = bars.map((mi, k) => (k === 0 ? (mi === 0 || sigChanged(mi) ? HEAD_TIME : HEAD) : sigChanged(mi) ? 30 : 0));
      const total = bars.reduce((a, mi, k) => a + minW[mi] + heads[k], 0);
      const stretch = (width - 20) / total;
      let x = 10;
      const anchors: { sec: number; x: number }[] = [];
      const staves: [Stave, Stave][] = [];
      bars.forEach((mi, k) => {
        const m = model.measures[mi];
        const w = (minW[mi] + heads[k]) * stretch;
        const top = new Stave(x, y, w), bot = new Stave(x, y + STAFF_GAP, w);
        if (k === 0) { top.addClef('treble').addKeySignature(keySpec); bot.addClef('bass').addKeySignature(keySpec); }
        if (mi === 0 || sigChanged(mi)) { top.addTimeSignature(`${m.num}/${m.den}`); bot.addTimeSignature(`${m.num}/${m.den}`); }
        if (k === 0 && o.measureNumbers !== false && mi > 0) { top.setMeasure(mi + 1); const sc = o.measureNumberScale ?? 1; if (sc !== 1) top.setFontSize(parseFloat(String(top.fontInfo.size)) * sc); }
        if (mi === 0 && o.tempoBpm) top.setTempo({ duration: 'q', bpm: Math.round(o.tempoBpm) }, -10);
        if (mi === model.measures.length - 1) { top.setEndBarType(Barline.type.END); bot.setEndBarType(Barline.type.END); }
        const start = Math.max(top.getNoteStartX(), bot.getNoteStartX());
        top.setNoteStartX(start); bot.setNoteStartX(start);
        staves.push([top, bot]);
        const b = built[mi], f = new Formatter();
        for (const vs of b.voices) f.joinVoices(vs);
        f.format(b.voices.flat(), Math.max(10, top.getNoteEndX() - start - 12));
        anchors.push({ sec: o.tickToSec(m.startTick), x: start - 4 });
        x += w;
      });
      for (const [top, bot] of staves) { drawFramed(ctx, top); drawFramed(ctx, bot); }
      drawFramed(ctx, new StaveConnector(staves[0][0], staves[0][1]).setType('brace'));
      drawFramed(ctx, new StaveConnector(staves[0][0], staves[0][1]).setType('singleLeft'));
      for (const [top, bot] of staves) drawFramed(ctx, new StaveConnector(top, bot).setType('singleRight'));
      bars.forEach((mi, k) => {
        const b = built[mi], m = model.measures[mi];
        b.voices.forEach((vs, s) => vs.forEach((v) => v.draw(rc, staves[k][s])));
        b.beams.forEach((bm) => bm.setContext(rc).drawWithStyle());
        b.tuplets.forEach((tp) => tp.setContext(rc).drawWithStyle());
        m.staves.forEach((st) => st.voices.forEach((v) => v.events.forEach((e) => {
          if (e.hidden) return;
          const sn = b.byEvent.get(e)!, oi = ownerIdx.get(sn.getAttribute('id'));
          const own = oi !== undefined ? owners[oi] : undefined;
          anchors.push({ sec: own && own.head ? own.on : o.tickToSec(m.startTick + e.pos), x: sn.getAbsoluteX() });
          if (own) { const bb = sn.getBoundingBox(); own.cx = bb ? bb.getX() + bb.getW() / 2 : sn.getAbsoluteX(); own.cy = bb ? bb.getY() + bb.getH() / 2 : y; }
        })));
      });
      drawTies(ctx, rc, bars);
      anchors.sort((a, b) => a.sec - b.sec || a.x - b.x);
      const at: number[] = [], ax: number[] = [];
      for (const a of anchors) if (!at.length || (a.x >= ax[ax.length - 1] && a.sec >= at[at.length - 1])) { at.push(a.sec); ax.push(a.x); }
      const last = model.measures[bars[bars.length - 1]];
      at.push(o.tickToSec(last.endTick)); ax.push(x);
      sysOut.push({ y0: y + STAVE_PAD - 20, y1: y + STAFF_GAP + STAVE_PAD + 60, start: o.tickToSec(model.measures[bars[0]].startTick), end: o.tickToSec(last.endTick), at, ax });
      y += STAFF_GAP + STAVE_PAD + 40 + SYSTEM_GAP;
    }
    // gộp bảng glyph của trang vào bảng chung
    const remap = ctx.glyphs.map((d) => { const k = JSON.stringify(d); let i = glyphMap.get(k); if (i === undefined) { i = glyphs.length; glyphs.push(d); glyphMap.set(k, i); } return i; });
    for (const it of ctx.items) if (it.g) for (let j = 0; j < it.g.length; j += 4) it.g[j] = remap[it.g[j]];
    for (const cp of ctx.missing) missing.add(cp);
    const first = systems[p][0], lastBar = systems[Math.min(systems.length, p + perPage) - 1].slice(-1)[0];
    pages.push({ start: o.tickToSec(model.measures[first].startTick), end: o.tickToSec(model.measures[lastBar].endTick), height: y - SYSTEM_GAP + 10, firstBar: first, lastBar, items: ctx.items, systems: sysOut });
  }
  if (missing.size) warnings.push({ code: 'WARN_NOTATION_GLYPH', message: `thiếu ${missing.size} glyph trong bảng phông`, details: { codepoints: [...missing].map((c) => c.toString(16)) } });
  glyphs = glyphs.map((d) => d);

  function drawTies(ctx: RecordingContext, rc: RenderContext, bars: number[]) {
    const inSys = new Set(bars);
    for (const mi of bars) {
      const m = model.measures[mi];
      m.staves.forEach((st, s) => st.voices.forEach((v, vi) => v.events.forEach((e, ei) => {
        if (e.rest || !e.notes.some((n) => n.tieStart)) return;
        const from = built[mi].byEvent.get(e)!;
        let next: ScoreEvent | undefined = v.events[ei + 1], nm = mi;
        if (!next) { nm = mi + 1; next = model.measures[nm]?.staves[s].voices[vi]?.events[0]; }
        const to = next && !next.rest && inSys.has(nm) ? built[nm].byEvent.get(next) : undefined;
        const idx = sortedIdx(e, (n) => n.tieStart);
        new StaveTie({ firstNote: from, lastNote: to, firstIndexes: idx, lastIndexes: idx }).setContext(rc).drawWithStyle();
      })));
      if (mi === bars[0] && mi > 0) m.staves.forEach((st) => st.voices.forEach((v) => { // nửa dấu nối đầu hàng (từ hàng trước)
        const e = v.events[0];
        if (!e || e.rest || !e.notes.some((n) => n.tieEnd)) return;
        const idx = sortedIdx(e, (n) => n.tieEnd);
        new StaveTie({ firstNote: undefined, lastNote: built[mi].byEvent.get(e)!, firstIndexes: idx, lastIndexes: idx }).setContext(rc).drawWithStyle();
      }));
    }
    void ctx;
  }
  /** Chỉ số khoá (đã sắp theo cao độ như khi dựng StaveNote) của các nốt thoả điều kiện. */
  function sortedIdx(e: ScoreEvent, ok: (n: ScoreEvent['notes'][number]) => boolean): number[] {
    return [...e.notes].sort((a, b) => a.pitch - b.pitch).map((n, i) => (ok(n) ? i : -1)).filter((i) => i >= 0);
  }

  const st = model.stats;
  return {
    version: 1, width, maxHeight: Math.max(...pages.map((p) => p.height)), pages, owners, glyphs, key: model.key,
    stats: { measures: model.measures.length, notes: st.notes, exactOnsets: st.exactOnsets, meanOnsetErr: st.meanOnsetErr, engraveMs: Math.round(performance.now() - t0) },
    warnings,
  };
}
