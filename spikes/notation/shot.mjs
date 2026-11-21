// Chụp một trang layout: node shot.mjs <tên> <trang> [scale]
import { chromium } from 'playwright-core';
import { serve } from './serve.mjs';
import { homedir } from 'node:os';
const [name, page = '0', scale = '1', extra = ''] = process.argv.slice(2);
const { srv, port } = await serve();
const b = await chromium.launch({ executablePath: homedir() + '/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome' });
const p = await b.newPage({ deviceScaleFactor: 1, viewport: { width: 1600, height: 1200 } });
p.on('pageerror', (e) => console.log('[pageerror]', e.message));
await p.goto(`http://127.0.0.1:${port}/pages/view.html?file=${encodeURIComponent(name)}&page=${page}&scale=${scale}${extra}`);
await p.waitForFunction(() => window.__done, null, { timeout: 30000 });
const tag = extra ? '-' + extra.replace(/[^a-z0-9]+/gi, '') : '';
console.log(JSON.stringify(await p.evaluate(() => window.__done)));
await p.locator('#c').screenshot({ path: `out/${name}-p${page}${tag}.png` });
console.log(`out/${name}-p${page}${tag}.png`);
await b.close(); srv.close();
