// S5: dàn trang cả bài (lượng tử → VexFlow → display list); ghi out/<tên>.layout.json để xem/đo trong trình duyệt.
import { writeFileSync, mkdirSync } from 'node:fs';
import { loadAst } from './lib/loadAst.mjs';
import { quantize, validateScore } from '../../packages/render-core/src/notation/quantize.ts';
import { engrave, installMeasurer } from './lib/engrave.ts';
import { fakeMeasureCanvas, glyphOutline } from './lib/fonts.mjs';
import { tickToSec } from '../../packages/core/src/tempo.js';

const args = process.argv.slice(2);
const opt = {}; const files = [];
for (const a of args) { const m = /^--(\w+)=(.*)$/.exec(a); if (m) opt[m[1]] = isNaN(+m[2]) ? m[2] : +m[2]; else files.push(a); }
installMeasurer(fakeMeasureCanvas());
mkdirSync('out', { recursive: true });
for (const f of files) {
  const ast = await loadAst(f);
  const tracks = ast.tracks.filter((t) => t.isVisible && !/drum|kick|clap|hihat|snare|tom|perc/i.test(t.name) && !t.notes.every((n) => n.channel === 9) && (!opt.track || t.name.includes(opt.track)));
  const notes = tracks.flatMap((t) => t.notes);
  const byId = new Map(notes.map((n) => [n.id, n]));
  const t0 = performance.now();
  const sm = quantize({ notes, tempoMap: ast.tempoMap }, opt);
  const t1 = performance.now();
  const lay = engrave(sm, {
    width: opt.width ?? 1200, barsPerSystem: opt.bars ?? 0, systemsPerPage: opt.systems ?? 2, musicFont: opt.font ?? 'Bravura', textFont: opt.text ?? 'Academico',
    tickToSec: (t) => tickToSec(ast.tempoMap, t), noteTime: (id) => { const n = byId.get(id); return n && { on: n.startTimeSeconds, off: n.endTimeSeconds }; },
    tempoBpm: ast.tempoMap[0].bpm,
  });
  const t2 = performance.now();
  const glyphs = {};
  let items = 0;
  for (const p of lay.pages) for (const it of p.items) { items++; if (it.t === 'glyphs') for (const g of it.glyphs) glyphs[g.f + '#' + g.g] ??= glyphOutline(g.f, g.g); }
  lay.glyphs = glyphs;
  const json = JSON.stringify(lay);
  const name = f.split('/').pop().replace(/\.[^.]+$/, '') + (opt.font ? '-' + opt.font : '');
  writeFileSync(`out/${name}.layout.json`, json);
  console.log(`${name.padEnd(30)} ô ${sm.measures.length} trang ${lay.pages.length} hàng ${lay.stats.systems}  phần tử ${items}  glyph ${Object.keys(glyphs).length}  JSON ${(json.length / 1024).toFixed(0)} KB  lỗi ${validateScore(sm).length}  lượng tử ${(t1 - t0).toFixed(0)}ms  engrave ${(t2 - t1).toFixed(0)}ms`);
}
