// S3: node s3-perf.mjs <layout> <chromium|firefox> [frames]
import { chromium, firefox } from 'playwright-core';
import { serve } from './serve.mjs';
import { homedir } from 'node:os';
const [name, which = 'chromium', frames = '4500'] = process.argv.slice(2);
const { srv, port } = await serve();
const b = which === 'firefox' ? await firefox.launch() : await chromium.launch({ executablePath: homedir() + '/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome' });
for (const cache of ['0', '1']) for (const glow of ['none', 'halo', 'shadow']) {
  const p = await b.newPage();
  p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto(`http://127.0.0.1:${port}/pages/perf.html?file=${encodeURIComponent(name)}&cache=${cache}&glow=${glow}&frames=${frames}`);
  await p.waitForFunction(() => window.__res, null, { timeout: 600000 });
  console.log(which.padEnd(8), `cache=${cache} glow=${glow.padEnd(6)}`, JSON.stringify(await p.evaluate(() => window.__res)));
  await p.close();
}
await b.close(); srv.close();
