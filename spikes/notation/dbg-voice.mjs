// Gỡ lỗi: dựng Voice VexFlow cho từng ô của ScoreModel và in ô đầu tiên không khớp số tick.
import { loadAst } from './lib/loadAst.mjs';
import { quantize } from '../../packages/render-core/src/notation/quantize.ts';
import * as VF from 'vexflow';
import { fakeMeasureCanvas } from './lib/fonts.mjs';
VF.Element.setTextMeasurementCanvas(fakeMeasureCanvas());
const ast = await loadAst(process.argv[2]);
const notes = ast.tracks.filter((t) => t.isVisible).flatMap((t) => t.notes);
const sm = quantize({ notes, tempoMap: ast.tempoMap });
const DUR = { 1: 'w', 2: 'h', 4: 'q', 8: '8', 16: '16', 32: '32' };
let shown = 0;
for (const m of sm.measures) m.staves.forEach((st, si) => st.voices.forEach((v, vi) => {
  const ns = v.events.map((e) => e.hidden ? new VF.GhostNote({ duration: DUR[e.value.base] + (e.value.dots ? 'd' : '') }) : new VF.StaveNote({ keys: ['b/4'], duration: DUR[e.value.base] + (e.value.dots ? 'd' : '') + (e.rest ? 'r' : '') }));
  const groups = new Map(); v.events.forEach((e, i) => { if (e.tuplet >= 0) (groups.get(e.tuplet) ?? groups.set(e.tuplet, []).get(e.tuplet)).push(ns[i]); });
  for (const g of groups.values()) new VF.Tuplet(g, { numNotes: 3, notesOccupied: 2 });
  const voice = new VF.Voice({ numBeats: m.num, beatValue: m.den });
  try { voice.addTickables(ns); if (!voice.isComplete()) throw new Error('incomplete ' + voice.getTicksUsed().value() + ' / ' + voice.getTotalTicks().value()); }
  catch (err) { if (shown++ < 3) console.log('ô', m.index + 1, si, vi, err.message, JSON.stringify(v.events.map((e) => [e.pos, e.dur, e.value.base + (e.value.dots ? '.' : '') + (e.value.triplet ? 't' : ''), e.tuplet, e.rest ? 'r' : '', e.hidden ? 'h' : '']))); }
}));
console.log('done', shown);
