// Chụp khung xem trước của một preset scene ở các mốc thời gian, để đặt cạnh khung tham chiếu (references/frames). Không vào bản build.
// node scripts/references/shot.mjs <preset.json> [--project tệp] [--times 0:10,0:30] [--out thư-mục] [--port 5311]
// Cần Vite đang chạy ở --port (cd apps/web && npx vite --port 5311), hoặc dùng --serve để script tự bật.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const root = path.resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const preset = path.resolve(args.find((a) => !a.startsWith('--') && a.endsWith('.json')) ?? '');
const project = path.resolve(opt('project', path.join(root, 'test/fixtures/Reaper/BigProject4.rpp')));
const times = opt('times', '0:10').split(',');
const out = path.resolve(opt('out', path.join(root, 'references/shots')));
const port = Number(opt('port', '5311'));
let vite;
if (args.includes('--serve')) {
  vite = spawn(path.join(root, 'node_modules/.bin/vite'), ['--port', String(port), '--strictPort'], { cwd: path.join(root, 'apps/web'), stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 8000));
}
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'vi-VN' });
await ctx.addInitScript(() => { localStorage.setItem('dawviz.lang', 'vi'); if (!localStorage.getItem('dawviz.prefs.v1.ui')) localStorage.setItem('dawviz.prefs.v1.ui', JSON.stringify({ modeChosen: true })); }); // ui: bỏ qua hộp chọn chế độ lần đầu (T-60)
const pg = await ctx.newPage();
pg.on('pageerror', (e) => console.error('pageerror:', e.message));
await pg.goto(`http://localhost:${port}/`, { timeout: 120000 });
await pg.locator('[data-testid="file-input"]').first().setInputFiles(project);
await pg.waitForTimeout(2500);
if (preset.endsWith('.json') && fs.existsSync(preset)) {
  await pg.locator('[data-testid="preset-input"]').first().setInputFiles(preset);
  await pg.waitForTimeout(1500);
  console.log('trạng thái preset:', await pg.locator('[data-testid="preset-status"]').first().textContent());
}
const name = path.basename(preset, '.json');
for (const t of times) {
  const box = pg.locator('[data-testid="transport-time"]').first();
  await box.click(); await box.fill(t); await box.press('Enter'); await pg.waitForTimeout(700);
  const file = path.join(out, `${name}_${t.replace(':', 'm')}.png`);
  await pg.locator('[data-testid="scene-canvas"]').first().screenshot({ path: file });
  console.log('đã chụp', file);
}
await b.close(); vite?.kill();
