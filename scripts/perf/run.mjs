// Đo thời gian khung hình trong trình duyệt thật (T-27, SPIKE-5). Không phải mã ứng dụng, không vào bản build.
// node scripts/perf/run.mjs <tệp dự án> [--browser=chrome|firefox|chromium] [--headless] [--rep=N] [--frames=600] [--t0=30] [--only=a,b] [--audio=giây]
//   chrome   = Google Chrome cài trên máy (CHROME=<đường dẫn> để chỉ định), có giao diện nên dùng GPU thật.
//   chromium = Chromium của Playwright; --headless trên máy không màn hình sẽ vẽ bằng phần mềm (SwiftShader): số liệu KHÔNG đại diện.
// In một dòng JSON: mỗi cảnh có p50/p95/p99/max (ms) của layoutFrame, renderFrame và renderFrame + đồng bộ GPU.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { build } from 'vite';
import { chromium, firefox } from 'playwright-core';
import { parseProject } from '@dawviz/parser';

const here = import.meta.dirname, out = path.join(here, 'out');
const args = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? '1']; }));
const file = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!file) { console.error('cần đường dẫn tệp dự án'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });

const t0 = performance.now();
const parsed = await parseProject(path.basename(file), fs.readFileSync(file), {});
const parseMs = Math.round(performance.now() - t0);
fs.writeFileSync(path.join(out, 'ast.json'), JSON.stringify(parsed.ast));

fs.writeFileSync(path.join(out, 'index.html'), '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#000"><script type="module" src="../frame-bench.ts"></script>');
await build({ configFile: false, root: out, logLevel: 'warn', build: { outDir: path.join(out, 'dist'), emptyOutDir: true, minify: true, rollupOptions: { input: path.join(out, 'index.html') } } });
fs.copyFileSync(path.join(out, 'ast.json'), path.join(out, 'dist', 'ast.json'));

const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(out, 'dist', decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(path.join(out, 'dist')) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': types[path.extname(p)] ?? 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
}).listen(0, 'localhost');
await new Promise((ok) => server.once('listening', ok));

const which = args.browser ?? 'chrome', headless = !!args.headless;
const chromePath = process.env.CHROME ?? ['/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find((p) => fs.existsSync(p));
const b = which === 'firefox' ? await firefox.launch({ headless }) : await chromium.launch({ headless, ...(which === 'chrome' && chromePath ? { executablePath: chromePath } : {}) });
try {
  const pg = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const q = new URLSearchParams({ ast: 'ast.json', rep: args.rep ?? '1', frames: args.frames ?? '600', t0: args.t0 ?? '30', ...(args.only ? { only: args.only } : {}), ...(args.audio ? { audio: args.audio } : {}) });
  await pg.goto(`http://localhost:${server.address().port}/index.html?${q}`);
  await pg.waitForFunction(() => window.__result, null, { timeout: 30 * 60_000 });
  const r = await pg.evaluate(() => window.__result);
  const gpu = await pg.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl2'); const d = gl?.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : null; });
  console.log(JSON.stringify({ browser: b.version(), which, headless, gpu, parseMsNode: parseMs, ...r }));
} finally { await b.close(); server.close(); }
