#!/usr/bin/env node
// Điều khiển DAW Visualizer bằng Playwright cho AI agent có terminal (skill dawviz, cách 3). Mở app với ?agent=1 trong Chrome/Chromium,
// gọi window.dawviz (apps/web/src/lib/agentApi.ts): nạp dự án + âm thanh, kiểm và áp preset, chụp khung để agent tự nhìn, xuất video.
// In một dòng JSON tóm tắt ra stdout (agent đọc), tiến trình ra stderr.
//
//   node dawviz.mjs --project song.rpp [--audio mix.wav] [--preset video.json] [--style paper] \
//                   [--frames 0,8,30] [--out-dir out] [--export out/video.mp4 --resolution 1080 --fps 30 --quality medium] \
//                   [--url http://localhost:5173/ | --repo /path/to/dawviz] [--headed] [--channel chrome]
//   node dawviz.mjs --validate video.json [--url … | --repo …]     (chỉ kiểm preset, không cần dự án)
//
// Cần `playwright-core` (cd vào thư mục này rồi `npm install`, hoặc chạy trong repo dawviz đã `npm install`). Xuất MP4 (H.264) cần Chrome thật
// (`--channel chrome`, mặc định thử Chrome trước); Chromium của Playwright thường chỉ có VP9/WebM.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const flag = (k) => args.includes(`--${k}`);
const log = (...m) => console.error('[dawviz]', ...m);
const fail = (msg, extra = {}) => { console.log(JSON.stringify({ ok: false, error: msg, ...extra })); process.exit(1); };

if (flag('help') || !args.length) {
  console.error(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 12).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(args.length ? 0 : 2);
}

let chromium;
try { ({ chromium } = await import('playwright-core')); }
catch {
  try { ({ chromium } = await import(path.join(findRepo(HERE) ?? HERE, 'node_modules/playwright-core/index.mjs'))); }
  catch { fail(`playwright-core not installed: run "npm install" in ${HERE}`); }
}

/** Thư mục gốc repo dawviz chứa `dir` (để tự chạy app khi không có --url). */
function findRepo(dir) {
  for (let d = path.resolve(dir); ; d = path.dirname(d)) {
    try { if (JSON.parse(fs.readFileSync(path.join(d, 'package.json'), 'utf8')).name === 'dawviz') return d; } catch { /* đi lên tiếp */ }
    if (path.dirname(d) === d) return null;
  }
}

// ── app: --url có sẵn, hoặc tự chạy Vite dev trong repo ──
let url = opt('url'), vite = null;
if (!url) {
  const repo = opt('repo') ?? findRepo(HERE) ?? findRepo(process.cwd());
  if (!repo) fail('no app: pass --url (where DAW Visualizer runs) or --repo (a dawviz checkout with npm install done)');
  const port = Number(opt('port', '5297'));
  log(`starting app from ${repo} on port ${port}`);
  vite = spawn(path.join(repo, 'node_modules/.bin/vite'), ['--port', String(port), '--strictPort'], { cwd: path.join(repo, 'apps/web'), stdio: ['ignore', 'pipe', 'pipe'] });
  process.on('exit', () => vite?.kill());
  await new Promise((ok) => { vite.stdout.on('data', (d) => { if (String(d).includes('Local')) ok(); }); setTimeout(ok, 30000); });
  url = `http://localhost:${port}/`;
}
const u = new URL(url); u.searchParams.set('agent', '1');

// ── trình duyệt: Chrome thật trước (có H.264), không có thì Chromium của Playwright ──
const headless = !flag('headed');
let browser;
for (const channel of [opt('channel', 'chrome'), undefined]) {
  try { browser = await chromium.launch({ headless, ...(channel ? { channel } : {}) }); log(`browser: ${channel ?? 'chromium'}`); break; }
  catch (e) { if (!channel) fail(`cannot launch a browser: ${e.message}`); }
}
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
const done = async (summary) => { await browser.close(); vite?.kill(); console.log(JSON.stringify({ ok: true, ...summary, ...(pageErrors.length ? { pageErrors: pageErrors.slice(0, 5) } : {}) })); process.exit(0); };

await page.goto(u.toString(), { timeout: 120000 });
await page.waitForFunction(() => !!window.dawviz, null, { timeout: 60000 }).catch(() => fail('window.dawviz did not appear (is this DAW Visualizer with agent API support?)'));
const api = (method, ...a) => page.evaluate(([m, xs]) => window.dawviz[m](...xs), [method, a]);
const fileArg = (p) => ({ name: path.basename(p), base64: fs.readFileSync(p).toString('base64') });

// ── chỉ kiểm preset ──
const validate = opt('validate');
if (validate) {
  const r = await api('validate', fs.readFileSync(validate, 'utf8'));
  await done({ validate: validate, result: r.ok ? { ok: true, warnings: r.warnings } : r });
}

const outDir = opt('out-dir', '.');
fs.mkdirSync(outDir, { recursive: true });
const summary = { url: u.toString() };

const project = opt('project');
if (!project) fail('--project is required (a .als .alp .rpp .flp .dawproject .mid file)');
log(`loading ${project}`);
let st = await api('loadProject', fileArg(project));
if (!st.project) fail('project did not load', { problems: st.problems });
summary.project = st.project;

const audio = opt('audio');
if (audio) { log(`loading audio ${audio}`); st = await api('loadAudio', fileArg(audio)); summary.audio = st.audio; }

const style = opt('style');
if (style) { st = await api('pickStyle', style); summary.videoStyle = st.videoStyle; }

const preset = opt('preset');
if (preset) {
  const r = await api('setScene', fs.readFileSync(preset, 'utf8'));
  if (!r.ok) fail(`preset rejected: ${r.error.code} ${r.error.message}`, { path: r.error.path });
  summary.presetWarnings = r.warnings;
}

const frames = opt('frames');
if (frames) {
  summary.frames = [];
  for (const t of frames.split(',').map(Number).filter((x) => Number.isFinite(x))) {
    const data = await api('frame', t, Number(opt('frame-width', '960')));
    const file = path.join(outDir, `frame-${String(t).replace('.', '_')}s.png`);
    fs.writeFileSync(file, Buffer.from(data.replace(/^data:image\/png;base64,/, ''), 'base64'));
    summary.frames.push(file);
  }
  log(`wrote ${summary.frames.length} frame(s)`);
}

const exportTo = opt('export');
if (exportTo) {
  log('exporting…');
  const r = await api('exportVideo', { resolution: Number(opt('resolution', '1080')), fps: Number(opt('fps', '30')), quality: opt('quality', 'medium'), kind: opt('kind', 'video'), download: false });
  const f = await api('lastExport');
  const ext = path.extname(f.name), target = path.extname(exportTo) ? exportTo.replace(/\.[^.]+$/, ext) : `${exportTo}${ext}`;
  fs.mkdirSync(path.dirname(path.resolve(target)), { recursive: true });
  fs.writeFileSync(target, Buffer.from(f.base64, 'base64'));
  summary.export = { file: target, bytes: r.bytes, ms: r.ms, mime: r.mime };
  if (ext !== path.extname(exportTo) && path.extname(exportTo)) summary.export.note = `browser produced ${ext} (no ${path.extname(exportTo)} encoder); try --channel chrome`;
}

summary.problems = (await api('status')).problems;
await done(summary);
