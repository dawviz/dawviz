// Lượng tử hoá trên tệp thật; đo lỗi cấu trúc, sai số điểm bắt đầu, thời gian chạy.
import { loadAst } from './lib/loadAst.mjs';
import { quantize, validateScore } from '../../packages/render-core/src/notation/quantize.ts';
const args = process.argv.slice(2);
const opt = {}; const files = [];
for (const a of args) { const m = /^--(\w+)=(.*)$/.exec(a); if (m) opt[m[1]] = isNaN(+m[2]) ? m[2] : +m[2]; else files.push(a); }
for (const f of files) {
  const ast = await loadAst(f);
  const tracks = ast.tracks.filter((t) => t.isVisible && !/drum|kick|clap|hihat|snare|tom|perc/i.test(t.name) && !t.notes.every((n) => n.channel === 9));
  const notes = tracks.flatMap((t) => t.notes);
  const t0 = performance.now();
  const sm = quantize({ notes, tempoMap: ast.tempoMap }, opt);
  const ms = performance.now() - t0;
  const errs = validateScore(sm);
  const s = sm.stats, ppq = 960, beatMs = 60000 / ast.tempoMap[0].bpm;
  console.log(`${f.split('/').pop().padEnd(34)} nốt ${String(s.notes).padStart(5)} ô ${String(sm.measures.length).padStart(4)}  lỗi cấu trúc ${errs.length}  đúng lưới ${(100 * s.exactOnsets / s.notes).toFixed(1)}%  lệch TB ${(s.meanOnsetErr / ppq * beatMs).toFixed(1)}ms max ${(s.maxOnsetErr / ppq * beatMs).toFixed(0)}ms  cắt ${s.cut}  phách tam liên ${s.tripletBeats}  giọng2 ${s.voice2Events}  giọng ${sm.key.fifths}${sm.key.mode[0]} (${sm.key.confidence.toFixed(2)})  ${ms.toFixed(0)}ms`);
  if (errs.length) console.log('   ', errs.slice(0, 3).join(' | '));
}
