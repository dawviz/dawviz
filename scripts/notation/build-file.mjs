// Thử buildNotation của ứng dụng trên tệp thật (Node).
import { loadAst } from './lib/loadAst.mjs';
import { buildNotation } from '../../apps/web/src/lib/notation/buildNotation.ts';
import { DEFAULT_NOTATION } from '../../packages/render-core/src/index.ts';
import { mkdirSync, writeFileSync } from 'node:fs';
const OUT = new URL('./out/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
for (const f of process.argv.slice(2)) {
  const ast = await loadAst(f);
  const notes = ast.tracks.filter((t) => t.isVisible && !t.notes.every((n) => n.channel === 9) && !/drum|kick|clap|hihat|snare|tom/i.test(t.name)).flatMap((t) => t.notes.map((n) => ({ ...n, track: t.index })));
  const t0 = performance.now();
  const lay = buildNotation({ notes, tempoMap: ast.tempoMap, props: { ...DEFAULT_NOTATION, barsPerSystem: 0, systemsPerPage: 2 } });
  const ms = performance.now() - t0, json = JSON.stringify(lay);
  const items = lay.pages.reduce((a, p) => a + p.items.length, 0), owned = lay.pages.reduce((a, p) => a + p.items.filter((i) => i.o >= 0).length, 0);
  console.log(f.split('/').pop().padEnd(28), `trang ${lay.pages.length} phần tử ${items} (của nốt ${owned}) chủ ${lay.owners.length} glyph ${lay.glyphs.length} JSON ${(json.length / 1024).toFixed(0)}KB ${ms.toFixed(0)}ms`, lay.warnings.map((w) => w.code).join(','));
  writeFileSync(OUT + 'app-' + f.split('/').pop() + '.json', json);
}
