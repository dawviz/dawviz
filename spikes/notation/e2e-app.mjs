// Kiểm thử tự động trong ứng dụng thật (Vite dev + Chromium): mở dự án, thêm widget Bản nhạc, phát, chụp khung, xuất video ngắn.
// node e2e-app.mjs <tệp dự án> [giây phát]   (BROWSER=firefox, AURA=STEADY|BEAT|BAR|TIME, AURA_SHAPE=SMOOTH|FLASH|BLINK, EXPORT=1, TAG=tên)
import { chromium, firefox } from 'playwright-core';
import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { mkdirSync } from 'node:fs';

const [file, playSec = '4'] = process.argv.slice(2);
const PORT = 5199;
mkdirSync('out/e2e', { recursive: true });
const vite = spawn(new URL('../../node_modules/.bin/vite', import.meta.url).pathname, ['--port', String(PORT), '--strictPort'], { cwd: new URL('../../apps/web', import.meta.url).pathname, stdio: ['ignore', 'pipe', 'pipe'] });
process.on('exit', () => vite.kill());
process.on('uncaughtException', (e) => { console.error(e); vite.kill(); process.exit(1); });
await new Promise((ok, bad) => { vite.stdout.on('data', (d) => { if (String(d).includes('Local')) ok(); }); vite.on('exit', bad); setTimeout(ok, 15000); });
const b = process.env.BROWSER === 'firefox' ? await firefox.launch() : await chromium.launch({ executablePath: homedir() + '/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome' });
const TAG = process.env.TAG ?? '';
try {
  const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, locale: 'vi-VN', acceptDownloads: true });
  await ctx.addInitScript(() => { try { delete Window.prototype.showSaveFilePicker; delete window.showSaveFilePicker; } catch {} }); // tải xuống thay vì hộp chọn nơi lưu
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto(`http://localhost:${PORT}/`, { timeout: 120000 });
  await page.locator('[data-testid="file-input"]').first().setInputFiles(file);
  await page.waitForTimeout(2500);
  await page.locator('#tab-editor').click();
  await page.locator('[data-testid="layers-add"]').click();
  await page.locator('[data-testid="add-menu"] [role="menuitem"]').nth(8).click(); // ADDABLE_WIDGETS[8] = NOTATION
  const status = page.locator('[data-testid="notation-status"]');
  await status.waitFor({ timeout: 20000 });
  await page.waitForFunction(() => /trang|pages/.test(document.querySelector('[data-testid="notation-status"]')?.textContent ?? ''), null, { timeout: 30000 });
  console.log('trạng thái:', (await status.textContent()).trim());
  if (process.env.MNSIZE) {
    await page.locator('[data-testid="mode-switch"] [role="radio"]').last().click();
    const f = page.getByLabel('Cỡ số ô nhịp (1 = mặc định)').first();
    await f.fill(process.env.MNSIZE); await f.press('Enter'); await page.waitForTimeout(3000);
  }
  if (process.env.AURA) {
    await page.getByRole('combobox', { name: 'Sáng cả bản nhạc' }).selectOption(process.env.AURA);
    if (process.env.AURA_SHAPE) await page.getByRole('radio', { name: { SMOOTH: 'Thở', FLASH: 'Loé', BLINK: 'Bật tắt' }[process.env.AURA_SHAPE] }).click().catch(async () => page.getByRole('button', { name: { SMOOTH: 'Thở', FLASH: 'Loé', BLINK: 'Bật tắt' }[process.env.AURA_SHAPE] }).click());
  }
  await page.screenshot({ path: `out/e2e/editor-added${TAG}.png` });
  // về thẻ Xem trước, phát vài giây rồi chụp
  await page.locator('#tab-preview').click();
  await page.waitForTimeout(500);
  await page.locator('button[aria-keyshortcuts="Space"]').first().click();
  for (let i = 0; i < 3; i++) { await page.waitForTimeout(Number(playSec) * 1000 / 3); await page.locator('canvas').first().screenshot({ path: `out/e2e/play${TAG}-${i}.png` }); }
  await page.locator('button[aria-keyshortcuts="Space"]').first().click();
  if (process.env.EXPORT) {
    await page.getByRole('button', { name: /Xuất video/ }).first().click();
    await page.locator('[data-testid="export-start"]').click();
    const t0 = Date.now();
    const btn = page.locator('[data-testid="export-download"]');
    let dl = await Promise.race([page.waitForEvent('download', { timeout: 600000 }), btn.waitFor({ timeout: 600000 }).then(() => null)]);
    if (!dl) [dl] = await Promise.all([page.waitForEvent('download'), btn.click()]);
    const ms = Date.now() - t0;
    await dl.saveAs(`out/e2e/export${TAG}.` + (dl.suggestedFilename().split('.').pop()));
    console.log('thời gian (ms, gồm chờ tải):', ms);
    console.log('đã xuất:', dl.suggestedFilename(), (await page.locator('[data-testid="export-dialog"]').textContent()).slice(0, 200));
  }
  console.log('lỗi trang:', errors.length ? errors.slice(0, 5) : 'không có');
} finally { await b.close(); vite.kill(); }
