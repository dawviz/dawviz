// npm run preset:check -- [--community] <tệp.json | tệp.dawviz-preset.zip…>   (thoát mã 1 nếu có lỗi; in cảnh báo để người duyệt xem)
import fs from 'node:fs';
import { checkPreset, checkPresetPack } from './check.mjs';
const args = process.argv.slice(2), community = args.includes('--community'), files = args.filter((a) => !a.startsWith('--'));
if (!files.length) { console.error('cần ít nhất một tệp preset .json'); process.exit(2); }
let bad = 0;
for (const f of files) {
  const opts = { community, now: () => performance.now() };
  const r = /\.zip$/i.test(f) ? await checkPresetPack(f, fs.readFileSync(f), opts) : checkPreset(f, fs.readFileSync(f), opts);
  console.log(`${r.ok ? '✓' : '✗'} ${f} (${r.kind}${r.stats.widgets !== undefined ? `, ${r.stats.widgets} widget, ${r.stats.expressions} biểu thức, khung chậm nhất ${r.stats.worstFrameMs} ms` : ''})`);
  for (const e of r.errors) console.log(`  lỗi: ${e}`);
  for (const w of r.warnings) console.log(`  cảnh báo: ${w}`);
  if (!r.ok) bad++;
}
process.exit(bad ? 1 : 0);
