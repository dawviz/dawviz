#!/usr/bin/env node
// CLI kiểm chứng: node bin/dawparse.mjs <file> [--json] [--inventory] [--tempo 128] [--show-muted] [--schema s.json]... [--files dir] [--ref ref.mid]
import fs from 'node:fs';
import path from 'node:path';
import { parseProject, parseMidi, compareAST, alsInventory, dawprojectInventory, inspectRpp, formatInventory, sniff } from '@dawviz/parser';

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); if (i < 0) return undefined; return args.splice(i, 1) && true; };
const opt = (n) => { const i = args.indexOf(n); if (i < 0) return undefined; const v = args[i + 1]; args.splice(i, 2); return v; };
const optAll = (n) => { const r = []; for (let v; (v = opt(n)) !== undefined;) r.push(v); return r; };
const json = flag('--json'), inv = flag('--inventory'), showMuted = flag('--show-muted');
const tempo = opt('--tempo'), filesDir = opt('--files'), ref = opt('--ref'), schemas = optAll('--schema').map((p) => JSON.parse(fs.readFileSync(p, 'utf8')));
const file = args[0];
if (!file) { console.error('Dùng: dawparse <file> [--json] [--inventory] [--tempo BPM] [--show-muted] [--schema s.json] [--files thư_mục_chứa_.mid] [--ref ref.mid]'); process.exit(2); }

const buf = fs.readFileSync(file), name = path.basename(file), ext = name.split('.').pop().toLowerCase();
try {
  if (inv) {
    if (ext === 'als') console.log(formatInventory(await alsInventory(buf)));
    else if (ext === 'dawproject') console.log(formatInventory(await dawprojectInventory(buf)));
    else if (ext === 'rpp') console.log(JSON.stringify(inspectRpp(buf), null, 2));
    else { console.error(`--inventory chưa hỗ trợ .${ext}`); process.exit(2); }
    process.exit(0);
  }
  const options = { showMuted, schemas };
  if (tempo) options.tempoOverride = Number(tempo);
  if (filesDir) options.resolveFile = async (_p, base) => { const f = path.join(filesDir, base); return fs.existsSync(f) ? fs.readFileSync(f) : null; };
  const r = await parseProject(name, buf, options);
  if (json) { console.log(JSON.stringify(r.ast)); process.exit(0); }
  const m = r.ast.meta;
  console.log(`${name}  [${r.format}]  ${m.sourceVersion}`);
  console.log(`tempo: ${m.tempoSource} (${r.ast.tempoMap.length} điểm, đầu = ${r.ast.tempoMap[0].bpm.toFixed(2)} BPM)  PPQ nguồn ${m.sourcePPQ}  dài ${m.totalDurationSeconds.toFixed(1)}s / ${m.totalTicks} tick`);
  for (const t of r.ast.tracks) console.log(`  ${t.isVisible ? ' ' : 'x'} ${String(t.notes.length).padStart(6)} nốt  ${t.name}`);
  for (const w of r.warnings) console.log(`  ! ${w.code}: ${w.message}`);
  if (ref) {
    const rm = await parseMidi(fs.readFileSync(ref));
    const c = compareAST(r.ast, rm.ast);
    console.log('so với MIDI tham chiếu:', JSON.stringify(c).slice(0, 600));
    process.exitCode = c.pass === false ? 1 : 0;
  }
} catch (e) { console.error(e.message.startsWith(e.code) ? e.message : `${e.code || "ERROR"}: ${e.message}`); process.exit(1); }
