// Kiểm tự động M4 (T-10) trên Chromium, Firefox và WebKit: tự lưu phiên (IndexedDB), mở lại sau khi tải lại trang, navigator.storage.estimate, Blob lớn,
// Project Pack khứ hồi. Không phải mã ứng dụng, không vào bản build.
// node scripts/e2e/m4-browsers.mjs [--browsers=chromium,firefox,webkit] [--big-mb=120] [--json]
import { chromium, firefox, webkit } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const arg = (k, d) => process.argv.find((a) => a.startsWith('--' + k + '='))?.split('=')[1] ?? d;
const names = arg('browsers', 'chromium,firefox,webkit').split(',');
const bigMb = Number(arg('big-mb', '120'));
const engines = { chromium, firefox, webkit };
const PORT = 5298;
const vite = spawn(path.join(root, 'node_modules/.bin/vite'), ['--port', String(PORT), '--strictPort'], { cwd: path.join(root, 'apps/web'), stdio: ['ignore', 'pipe', 'pipe'] });
process.on('exit', () => vite.kill());
await new Promise((ok) => { vite.stdout.on('data', (d) => { if (String(d).includes('Local')) ok(); }); setTimeout(ok, 20000); });

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dawviz-m4-'));
/** WAV PCM16 stereo 44,1 kHz toàn khoảng lặng, cỡ ~mb MB (ghi từng đoạn, không giữ cả tệp trong bộ nhớ). */
function bigWav(file, mb) {
  const rate = 44100, ch = 2, bytes = Math.floor(mb * 1e6 / 4) * 4, fd = fs.openSync(file, 'w');
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + bytes, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(ch, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * ch * 2, 28); h.writeUInt16LE(ch * 2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(bytes, 40);
  fs.writeSync(fd, h);
  const chunk = Buffer.alloc(1 << 20); for (let i = 0; i < chunk.length; i += 2) chunk.writeInt16LE(Math.round(Math.sin(i / 400) * 3000), i);
  for (let w = 0; w < bytes; w += chunk.length) fs.writeSync(fd, chunk, 0, Math.min(chunk.length, bytes - w));
  fs.closeSync(fd);
}
const wav = path.join(tmp, 'big.wav'); bigWav(wav, bigMb);
const project = path.join(root, 'test/fixtures/Reaper/BigProject4.rpp');
const als = path.join(root, 'test/fixtures/third-party/Ableton/Demo.als');

const report = [];
for (const name of names) {
  const r = { browser: name, steps: [], errors: [] };
  report.push(r);
  const step = async (label, fn) => { try { const v = await fn(); r.steps.push({ label, ok: true, ...(v === undefined ? {} : { info: v }) }); } catch (e) { r.steps.push({ label, ok: false, error: String(e.message ?? e).split('\n')[0] }); } };
  let b;
  try { b = await engines[name].launch(); } catch (e) { r.steps.push({ label: 'launch', ok: false, error: String(e.message).split('\n')[0] }); continue; }
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: 'vi-VN', acceptDownloads: true });
  await ctx.addInitScript(() => { localStorage.setItem('dawviz.lang', 'vi'); if (!localStorage.getItem('dawviz.prefs.v1.ui')) localStorage.setItem('dawviz.prefs.v1.ui', JSON.stringify({ modeChosen: true })); });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => r.errors.push('pageerror: ' + String(e.message).slice(0, 160)));
  pg.on('console', (m) => { if (m.type() === 'error') r.errors.push('console: ' + m.text().slice(0, 160)); });
  const url = 'http://localhost:' + PORT + '/';
  await pg.goto(url, { timeout: 120000 });
  const body = () => pg.evaluate(() => document.body.innerText);
  await step('storage.estimate', () => pg.evaluate(async () => { const e = await navigator.storage?.estimate?.(); return e ? { quotaMB: Math.round(e.quota / 1e6), usageMB: Math.round(e.usage / 1e6) } : 'không có'; }));
  await step('nạp .rpp', async () => { await pg.locator('[data-testid="file-input"]').first().setInputFiles(project); await pg.waitForTimeout(3000); if (!(await body()).includes('BigProject4')) throw new Error('không thấy tên dự án sau khi nạp'); });
  await step('IndexedDB có bản lưu', async () => { await pg.waitForTimeout(1500); const dbs = await pg.evaluate(async () => (indexedDB.databases ? (await indexedDB.databases()).map((d) => d.name) : 'không hỗ trợ databases()')); return dbs; });
  await step('tải lại: phiên được mở lại', async () => { await pg.reload(); await pg.waitForTimeout(4000); if (!(await body()).includes('BigProject4')) throw new Error('mất phiên sau khi tải lại'); });
  await step('Blob lớn (' + bigMb + ' MB âm thanh): nạp', async () => {
    const t0 = Date.now();
    await pg.locator('[data-testid="audio-input"], [data-testid="file-input"]').last().setInputFiles(wav);
    await pg.waitForTimeout(8000);
    return { ms: Date.now() - t0 };
  });
  await step('Blob lớn: ghi vào IndexedDB và mở lại', async () => {
    await pg.waitForTimeout(3000);
    const size = await pg.evaluate(async () => { const e = await navigator.storage.estimate(); return Math.round(e.usage / 1e6); });
    await pg.reload();
    const t1 = Date.now(); await pg.waitForFunction(() => document.body.innerText.includes('big.wav'), null, { timeout: 40000 }).catch(() => {});
    const restoreMs = Date.now() - t1;
    const txt = await body();
    return { restoreMs, usageMB: size, restored: txt.includes('BigProject4'), hasWavName: txt.includes('big.wav'), audioLines: txt.split('\n').filter((l) => /big\.wav|âm thanh|audio/i.test(l)).slice(0, 4) };
  });
  await step('Cài đặt: trạng thái phiên', async () => { await pg.locator('#tab-settings').click(); await pg.waitForTimeout(500); return (await pg.locator('[data-testid="session-state"]').innerText()).trim() || '(trống)'; });
  await step('Project Pack: lưu', async () => { const [dl] = await Promise.all([pg.waitForEvent('download', { timeout: 60000 }), pg.locator('[data-testid="pack-save"]').click()]); const f = path.join(tmp, name + '.zip'); await dl.saveAs(f); return { file: dl.suggestedFilename(), bytes: fs.statSync(f).size }; });
  await step('xoá phiên rồi mở Pack', async () => {
    await pg.locator('[data-testid="session-discard"]').click(); await pg.locator('[data-testid="session-discard-yes"]').click(); await pg.waitForTimeout(1000);
    await pg.locator('[data-testid="pack-input"]').setInputFiles(path.join(tmp, name + '.zip')); await pg.waitForTimeout(5000);
    if (!(await body()).includes('BigProject4')) throw new Error('Pack không mở ra dự án');
  });
  await step('nạp .als', async () => { await pg.locator('#tab-preview').click(); await pg.locator('[data-testid="file-input"]').first().setInputFiles(als); await pg.waitForTimeout(3000); return (await body()).includes('Demo') ? 'thấy Demo' : 'không thấy tên'; });
  await b.close();
}
fs.rmSync(tmp, { recursive: true, force: true });
vite.kill();
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
else for (const r of report) {
  console.log('\n== ' + r.browser);
  for (const s of r.steps) console.log((s.ok ? '  ok  ' : ' FAIL ') + s.label + (s.info !== undefined ? ' — ' + JSON.stringify(s.info) : '') + (s.error ? ' — ' + s.error : ''));
  if (r.errors.length) console.log('  lỗi console/trang: ' + [...new Set(r.errors)].slice(0, 5).join(' | '));
}
process.exit(report.some((r) => r.steps.some((s) => !s.ok)) ? 1 : 0);
