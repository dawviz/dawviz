// T-69: phông và đo chữ (TECHNICAL-DESIGN 5.7). Mã băm phông ↔ bảng đo; cổng "phông chưa nạp thì không vẽ chữ"; ensureFonts;
// đối chiếu FONT_METRICS với measureText của Chromium thật (chỉ chạy khi có trình duyệt).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ensureFonts, requiredFonts, needsFonts, BUNDLED_FONTS, FontLoadError, sanitizeScene, renderFrame, measureText, defaultScene } from '../src/index.ts';
import { FONT_METRICS_DATA } from '../src/fontMetrics.generated.ts';
import { synthAst, derivedOf, recCtx } from './helpers.ts';

const FONT_DIR = new URL('../../../apps/web/public/fonts/', import.meta.url);
const paper = () => sanitizeScene(JSON.parse(fs.readFileSync(new URL('../../../presets/scene/paper-1x1.json', import.meta.url), 'utf8'))).scene;

test('FONT_METRICS khớp tệp phông đóng gói: đổi phông mà quên chạy scripts/gen-font-metrics.mjs thì đỏ', () => {
  const files = fs.readdirSync(FONT_DIR).filter((f) => f.endsWith('.woff2')).sort();
  assert.deepEqual(files, Object.keys(FONT_METRICS_DATA.files).sort(), 'danh sách tệp phông lệch bảng');
  for (const f of files) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(f, FONT_DIR))).digest('hex'), (FONT_METRICS_DATA.files as Record<string, string>)[f], `${f}: mã băm lệch; chạy node scripts/gen-font-metrics.mjs`);
  assert.deepEqual(BUNDLED_FONTS.map((b) => b.file).sort(), files); // danh sách nạp = tệp đã gói
  for (const f of ['OFL-SpaceGrotesk.txt', 'OFL-Inter.txt']) assert.ok(/SIL Open Font License/.test(fs.readFileSync(new URL(f, FONT_DIR), 'utf8')), f);   // giấy phép đi kèm phông, Vite chép vào dist/fonts
});

test('bảng đo phủ Latin cơ bản, Latin mở rộng và tiếng Việt', () => {
  const w = FONT_METRICS_DATA.weights['400'] as Record<string, number>;
  for (const ch of 'ABCxyz0123456789 .,:/()%#-' + 'ÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬĐÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ' + 'ąčęłńőšž') assert.ok(w[ch.codePointAt(0)!] > 0, ch);
});

test('ensureFonts: nạp mọi mặt phông cần; một mặt lỗi → ERR_FONT_LOAD (không xuất bằng phông dự phòng)', async () => {
  const need = requiredFonts(paper());
  assert.equal(need.length, BUNDLED_FONTS.length); assert.ok(needsFonts(paper()));
  const loaded: string[] = [];
  await ensureFonts(need, async (s) => { loaded.push(s.file); });
  assert.equal(loaded.length, need.length);
  await assert.rejects(ensureFonts(need, async (s) => { if (s.weight === 700) throw new Error('404'); }), (e: unknown) => e instanceof FontLoadError && (e as FontLoadError).code === 'ERR_FONT_LOAD');
  assert.deepEqual(requiredFonts(defaultScene()), []); // scene chỉ có Piano Roll không cần phông
});

test('cổng phông: fontsReady=false → renderFrame không phát lệnh chữ; sẵn sàng thì có fillText', () => {
  const ast = synthAst(), sc = paper();
  const run = (ready: boolean | undefined) => { const { ctx, log } = recCtx(); renderFrame(sc, derivedOf(ast, { fontsReady: ready }), ast, 1, { ctx, width: 1080, height: 1080 }, 1); return log; };
  assert.ok(!run(false).some((l) => l.startsWith('fillText')) && !run(false).some((l) => l.startsWith('font=')));
  assert.ok(run(true).some((l) => l.startsWith('fillText(Demo Song')));
  assert.ok(run(true).some((l) => l === 'fontKerning=none')); // đo không kerning ⇒ vẽ không kerning
  assert.deepEqual(run(true), run(undefined));
});

// ---- Đối chiếu trình duyệt thật (điều kiện 5): chỉ chạy khi có Chromium.
function findChrome(): string | null {
  if (process.env.CHROMIUM_PATH && fs.existsSync(process.env.CHROMIUM_PATH)) return process.env.CHROMIUM_PATH;
  const root = path.join(os.homedir(), '.cache', 'ms-playwright');
  if (!fs.existsSync(root)) return null;
  for (const d of fs.readdirSync(root).filter((x) => x.startsWith('chromium')).sort().reverse())
    for (const rel of ['chrome-linux64/chrome', 'chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/chrome']) {
      const p = path.join(root, d, rel); if (fs.existsSync(p)) return p;
    }
  return null;
}
const SAMPLES: [string, number, number][] = [
  ['The Last Dice', 72, 700], ['Num played notes: 1271/1917 (66.30%)', 22, 400], ['001 35 083', 18, 400], ['E7/G#', 34, 700],
  ['Notes: G#2 E3 D4 E4 G#4 B4', 17, 400], ['Bản nhạc tiếng Việt: Ướt át, Ệ Ữ Ặ', 28, 400], ['Đêm không tên – Nguyễn Văn A', 28, 700], ['0123456789', 100, 400],
];
test('FONT_METRICS so với measureText của Chromium thật: lệch ≤ 1 pt (bỏ qua nếu không có trình duyệt)', { skip: findChrome() ? false : 'không tìm thấy Chromium (đặt CHROMIUM_PATH hoặc cài qua Playwright)' }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dawviz-fonts-'));
  try {
    const faces = BUNDLED_FONTS.map((b) => ({ ...b, url: new URL(b.file, FONT_DIR).href }));
    const html = `<!doctype html><meta charset="utf-8"><body><pre id="o"></pre><script>
      (async () => {
        const faces = ${JSON.stringify(faces)}, samples = ${JSON.stringify(SAMPLES)};
        for (const f of faces) { const ff = new FontFace(f.family, 'url(' + f.url + ')', { weight: String(f.weight), unicodeRange: f.unicodeRange }); await ff.load(); document.fonts.add(ff); }
        const c = document.createElement('canvas').getContext('2d'); c.fontKerning = 'none'; c.textRendering = 'geometricPrecision';
        document.getElementById('o').textContent = JSON.stringify(samples.map(([t, s, w]) => { c.font = w + ' ' + s + 'px "Space Grotesk"'; return c.measureText(t).width; }));
      })().catch((e) => { document.getElementById('o').textContent = 'ERR ' + e; });
    </script>`;
    const page = path.join(dir, 'm.html'); fs.writeFileSync(page, html);
    const r = spawnSync(findChrome()!, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--virtual-time-budget=8000', '--dump-dom', 'file://' + page], { encoding: 'utf8', timeout: 60000 });
    const m = /<pre id="o">([^<]*)<\/pre>/.exec(r.stdout); assert.ok(m, `không đọc được kết quả trình duyệt: ${r.stderr.slice(0, 300)}`);
    assert.ok(!m![1].startsWith('ERR'), m![1]);
    const widths: number[] = JSON.parse(m![1].replace(/&quot;/g, '"'));
    SAMPLES.forEach(([t, s, w], i) => {
      const mine = measureText(t, 'Space Grotesk', s, w);
      assert.ok(Math.abs(mine - widths[i]) <= 1, `"${t}" ${s}pt/${w}: bảng ${mine.toFixed(2)} ≠ trình duyệt ${widths[i].toFixed(2)}`);
    });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
