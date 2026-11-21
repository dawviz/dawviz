// S2 bước 0: nốt trong tệp thật đã nằm trên lưới nào (đơn vị 960 PPQ).
import { loadAst } from './lib/loadAst.mjs';
const grids = { '1/4': 960, '1/8': 480, '1/16': 240, '1/32': 120, '1/8T': 320, '1/16T': 160, '1/64': 60 };
for (const f of process.argv.slice(2)) {
  const ast = await loadAst(f);
  console.log('==', f.split('/').pop());
  for (const t of ast.tracks.filter((t) => t.isVisible)) {
    const n = t.notes.length, row = [];
    for (const [k, g] of Object.entries(grids)) {
      const on = t.notes.filter((x) => x.startTick % g === 0).length;
      row.push(`${k}:${((100 * on) / n).toFixed(0)}%`);
    }
    const endOn = t.notes.filter((x) => x.endTick % 60 === 0).length;
    console.log(`  ${t.name.padEnd(24).slice(0, 24)} ${String(n).padStart(5)}  ${row.join(' ')}  end@1/64:${((100 * endOn) / n).toFixed(0)}%`);
  }
}
