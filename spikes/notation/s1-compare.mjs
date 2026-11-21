// S1: so ảnh VexFlow thật (phông web) với display list vẽ lại bằng Path2D, trong Chromium/Firefox.
import { chromium, firefox } from 'playwright-core';
import { serve } from './serve.mjs';
import { homedir } from 'node:os';
const which = process.argv[2] ?? 'chromium';
const { srv, port } = await serve();
const browser = which === 'firefox'
  ? await firefox.launch()
  : await chromium.launch({ executablePath: homedir() + '/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome' });
const page = await browser.newPage({ deviceScaleFactor: 1 });
page.on('console', (m) => console.log('[page]', m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://127.0.0.1:${port}/pages/s1.html`);
await page.waitForFunction(() => window.__result, null, { timeout: 30000 });
console.log(which, JSON.stringify(await page.evaluate(() => window.__result)));
for (const id of ['a', 'b', 'd']) await page.locator('#' + id).screenshot({ path: `out/s1-${which}-${id}.png` });
await browser.close(); srv.close();
