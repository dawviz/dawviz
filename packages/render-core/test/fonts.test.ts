// T-69: phông và đo chữ (TECHNICAL-DESIGN 5.7). Mã băm phông ↔ bảng đo; cổng "phông chưa nạp thì không vẽ chữ"; ensureFonts;
// đối chiếu FONT_METRICS với measureText của Chromium thật (chỉ chạy khi có trình duyệt).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { charsOfScene, ensureFonts, requiredFonts, needsFonts, BUNDLED_FONTS, FontLoadError, sanitizeScene, renderFrame, measureText, defaultScene } from '../src/index.ts';
import { FONT_METRICS_DATA } from '../src/fontMetrics.generated.ts';
import { synthAst, derivedOf, recCtx } from './helpers.ts';

const FONT_DIR = new URL('../../../apps/web/public/fonts/', import.meta.url);
const paper = () => sanitizeScene(JSON.parse(fs.readFileSync(new URL('../../../presets/scene/paper-1x1.json', import.meta.url), 'utf8'))).scene;

test('FONT_METRICS khớp tệp phông đóng gói: đổi phông mà quên chạy scripts/gen-font-metrics.mjs thì đỏ', () => {
  const files = fs.readdirSync(FONT_DIR).filter((f) => f.endsWith('.woff2')).sort();
  assert.deepEqual(files, Object.keys(FONT_METRICS_DATA.files).sort(), 'danh sách tệp phông lệch bảng');
  for (const f of files) assert.equal(crypto.createHash('sha256').update(fs.readFileSync(new URL(f, FONT_DIR))).digest('hex'), (FONT_METRICS_DATA.files as Record<string, string>)[f], `${f}: mã băm lệch; chạy node scripts/gen-font-metrics.mjs`);
  assert.deepEqual(BUNDLED_FONTS.map((b) => b.file).sort(), files); // danh sách nạp = tệp đã gói
  for (const f of ['OFL-SpaceGrotesk.txt', 'OFL-Inter.txt', 'OFL-SMuFL-Steinberg.txt']) assert.ok(/SIL Open Font License/.test(fs.readFileSync(new URL(f, FONT_DIR), 'utf8')), f);   // giấy phép đi kèm phông, Vite chép vào dist/fonts
  assert.match(fs.readFileSync(new URL('OFL-SMuFL-Steinberg.txt', FONT_DIR), 'utf8'), /Copyright © [0-9–]+, Steinberg Media Technologies GmbH/);   // glyph Bản nhạc (D-63, OI-20)
});

test('bảng đo phủ Latin cơ bản, Latin mở rộng và tiếng Việt', () => {
  const w = FONT_METRICS_DATA.weights['400'] as Record<string, number>;
  for (const ch of 'ABCxyz0123456789 .,:/()%#-' + 'ÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬĐÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴ' + 'ąčęłńőšž') assert.ok(w[ch.codePointAt(0)!] > 0, ch);
});

test('ensureFonts: nạp mọi mặt phông cần; một mặt lỗi → ERR_FONT_LOAD (không xuất bằng phông dự phòng)', async () => {
  const need = requiredFonts(paper());
  assert.equal(need.length, BUNDLED_FONTS.filter((b) => b.weight !== 300).length); assert.ok(needsFonts(paper())); // paper không dùng chữ Mảnh
  const light = sanitizeScene({ ...JSON.parse(JSON.stringify(paper())), textStyles: { ...paper().textStyles, title: { ...paper().textStyles!.title, weight: 300 } } }).scene;
  assert.equal(requiredFonts(light).length, BUNDLED_FONTS.length);                               // có chữ Mảnh: nạp thêm 3 mặt 300
  assert.equal(requiredFonts(light, 'The Last Dice').filter((f) => f.weight === 300).length, 1);   // chữ ASCII: chỉ dải latin
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
  ['The Last Dice', 72, 700], ['The Last Dice', 72, 300], ['Num played notes: 1271/1917 (66.30%)', 22, 400], ['001 35 083', 18, 400], ['E7/G#', 34, 700],
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

test('requiredFonts(scene, chars): chỉ nạp dải ký tự thật sự cần (Firefox chậm dần theo số mặt phông trong Worker)', () => {
  const sc = paper(), files = (c?: string) => requiredFonts(sc, c).map((f) => f.file.replace('space-grotesk-', '').replace('-normal.woff2', '')).sort();
  assert.equal(requiredFonts(sc).length, 6, 'không có chars: nạp đủ (Preview)');
  assert.deepEqual(files('Demo Song 120 BPM Em7/G #♭'), ['latin-400', 'latin-700'], 'ASCII (và dấu có trong dải latin): 2 mặt thay vì 6');
  assert.deepEqual(files(''), ['latin-400', 'latin-700'], 'luôn có dải latin');
  assert.deepEqual(files('Bài hát Việt'), ['latin-400', 'latin-700', 'vietnamese-400', 'vietnamese-700'], 'chữ Việt thêm dải vietnamese');
  assert.deepEqual(files('Łódź'), ['latin-400', 'latin-700', 'latin-ext-400', 'latin-ext-700'], 'Latin mở rộng thêm dải latin-ext');
  assert.equal(files('ă').length, 4, 'ký tự cả hai dải cùng phủ chỉ cần một dải (vietnamese ưu tiên)');
  assert.deepEqual(files('日本語'), ['latin-400', 'latin-700'], 'ký tự không dải nào phủ: rơi về phông dự phòng như trước, không nạp thừa');
  assert.deepEqual(requiredFonts(defaultScene(), 'abc'), [], 'scene không dùng phông đóng gói: không nạp gì');
});

test('charsOfScene: gom tên bài, nghệ sĩ, tên track và mọi chuỗi trong thuộc tính widget', () => {
  const sc = paper(), ast = { meta: { title: 'Bản nhạc', artist: 'Nghệ sĩ' }, tracks: [{ name: 'Đàn piano' }] };
  const chars = charsOfScene(sc, ast);
  for (const ch of 'ảệĐ') assert.ok(chars.includes(ch), ch);
  assert.ok(requiredFonts(sc, chars).some((f) => f.file.includes('vietnamese')));
  assert.ok(!requiredFonts(sc, charsOfScene(sc, { meta: { title: 'Song' }, tracks: [{ name: 'Piano' }] })).some((f) => f.file.includes('vietnamese')));
});

test('drawPrimitives chỉ gán font khi đổi (gán font rất tốn trên Firefox với phông web nhiều mặt); kết quả vẽ không đổi', () => {
  const ast = synthAst(), sc = paper();
  const { ctx, log } = recCtx(); renderFrame(sc, derivedOf(ast, { fontsReady: true }), ast, 1, { ctx, width: 1080, height: 1080 }, 1);
  const fonts = log.filter((l) => l.startsWith('font=')), texts = log.filter((l) => l.startsWith('fillText'));
  assert.ok(texts.length > fonts.length, 'nhiều chữ dùng chung một phông: số lần gán font ít hơn số lần vẽ chữ');
  // cùng phông liên tiếp trong cùng widget không bị gán lại
  for (let i = 1; i < log.length; i++) if (log[i].startsWith('font=') && log[i - 1].startsWith('font=')) assert.notEqual(log[i], log[i - 1]);
});
