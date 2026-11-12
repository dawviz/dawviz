#!/usr/bin/env node
// Dựng trang web tài liệu tĩnh từ các tệp .md của repo (không phụ thuộc thư viện; chạy offline).
//
//   node scripts/docs-site/build.mjs [--out dist-docs]      dựng ra dist-docs/ (mở index.html, cả khi mở trực tiếp bằng file://)
//   node scripts/docs-site/build.mjs --serve [--port 4173]   dựng rồi mở máy chủ tĩnh để xem thử
//
// Cấu hình: scripts/docs-site/config.json (tiêu đề, menu, repoUrl để có liên kết "Chỉnh sửa trang này" và liên kết tới mã nguồn).
// Quy ước: liên kết .md → .html (kiểm tra cả #heading); tệp/thư mục không phải .md → repoUrl/blob|tree/… nếu có repoUrl, không thì hiện chữ thường.
// Thoát với mã 1 nếu có liên kết hỏng hoặc có tài liệu trong docs/ không nằm trong menu (bị bỏ quên).
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { renderMarkdown, escapeHtml } from './markdown.mjs';
import { uniqueSlugger } from './slug.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const argv = process.argv.slice(2);
const argVal = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const OUT = path.resolve(ROOT, argVal('--out', 'dist-docs'));
const cfg = JSON.parse(fs.readFileSync(path.join(HERE, 'config.json'), 'utf8'));
const repoUrl = (process.env.DOCS_REPO_URL || cfg.repoUrl || '').replace(/\/$/, '');
const branch = process.env.DOCS_BRANCH || cfg.branch || 'main';

const errors = [], notes = [];
const posix = (p) => p.split(path.sep).join('/');
const exists = (p) => fs.existsSync(path.join(ROOT, p));

// ── danh sách trang ────────────────────────────────────────────────────────────
const SPECIAL_OUT = { 'README.md': 'index.html', 'docs/README.md': 'guide.html', 'packages/README.md': 'packages.html', 'locales/README.md': 'locales.html' };
const outOf = (src) => SPECIAL_OUT[src] ?? (src.startsWith('docs/') ? src.slice(5) : src).replace(/\.md$/, '.html');

const navItems = cfg.nav.flatMap((g) => g.items.map((it) => ({ ...it, group: g.group })));
const pages = new Map(); // src → { src, out, title, group, listed }
for (const it of navItems) {
  if (!exists(it.src)) { errors.push(`menu trỏ tới tệp không có: ${it.src}`); continue; }
  pages.set(it.src, { src: it.src, out: outOf(it.src), navTitle: it.title, group: it.group, listed: true });
}
function walk(dir) { const out = []; for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) { const p = posix(path.join(dir, e.name)); if (e.isDirectory()) out.push(...walk(p)); else if (e.name.endsWith('.md')) out.push(p); } return out; }
for (const src of fs.existsSync(path.join(ROOT, 'docs')) ? walk('docs') : []) {
  if (pages.has(src)) continue;
  if (src.startsWith('docs/split/')) pages.set(src, { src, out: outOf(src), listed: false }); // mảnh tách: có trang nhưng không vào menu
  else errors.push(`tài liệu chưa có trong menu docs-site: ${src} → thêm vào scripts/docs-site/config.json`);
}

// ── liên kết ───────────────────────────────────────────────────────────────────
const idsByPage = new Map(); // src → Set(id)
const pendingAnchors = [];   // { from, to, id }
let deadLinks = 0;
const rel = (fromOut, toOut) => { const r = path.posix.relative(path.posix.dirname(fromOut), toOut); return r || path.posix.basename(toOut); };
function makeLinker(srcFile) {
  const from = pages.get(srcFile);
  return (href, isImage) => {
    if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
    if (href.startsWith('#')) return href;
    const [p, frag] = href.split('#');
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(srcFile), decodeURI(p)));
    if (target.startsWith('..')) { errors.push(`${srcFile}: liên kết ra ngoài repo → ${href}`); return null; }
    if (!exists(target)) { errors.push(`${srcFile}: liên kết hỏng → ${href} (không có ${target})`); return null; }
    if (target.endsWith('.md')) {
      const to = pages.get(target);
      if (!to) { errors.push(`${srcFile}: liên kết tới tài liệu không có trong site → ${target}`); return null; }
      if (frag) pendingAnchors.push({ from: srcFile, to: target, id: decodeURIComponent(frag), href });
      return rel(from.out, to.out) + (frag ? `#${frag}` : '');
    }
    if (isImage) return null;
    if (!repoUrl) { deadLinks++; return null; }
    const isDir = fs.statSync(path.join(ROOT, target)).isDirectory();
    return `${repoUrl}/${isDir ? 'tree' : 'blob'}/${branch}/${target}`;
  };
}

// ── dựng nội dung từng trang ──────────────────────────────────────────────────
const searchIndex = [];
for (const pg of pages.values()) {
  const md = fs.readFileSync(path.join(ROOT, pg.src), 'utf8');
  const r = renderMarkdown(md, { link: makeLinker(pg.src), slugger: uniqueSlugger() });
  pg.html = r.html; pg.headings = r.headings;
  pg.title = r.headings.find((h) => h.level === 1)?.text ?? pg.navTitle ?? path.posix.basename(pg.src, '.md');
  idsByPage.set(pg.src, new Set(r.headings.map((h) => h.id)));
  if (pg.listed) { // chỉ mục tìm kiếm theo từng mục (heading) của trang có trong menu
    const parts = r.html.split(/(?=<h[1-6] id=")/);
    for (const part of parts) {
      const m = part.match(/^<h([1-6]) id="([^"]*)">([\s\S]*?)<a class="anchor"/);
      const text = part.replace(/<a class="anchor"[^>]*>#<\/a>/g, '').replace(/<pre[\s\S]*?<\/pre>/g, ' ').replace(/<[^>]+>/g, ' ')
        .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const head = m ? m[3].replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"') : '';
      searchIndex.push({ t: pg.navTitle ?? pg.title, h: head, u: pg.out + (m ? `#${m[2]}` : ''), x: text.slice(0, 2500) });
    }
  }
}
for (const a of pendingAnchors) if (!idsByPage.get(a.to)?.has(a.id)) errors.push(`${a.from}: liên kết hỏng → ${a.href} (không có heading #${a.id} trong ${a.to})`);

// ── khung trang ───────────────────────────────────────────────────────────────
const order = navItems.filter((i) => pages.has(i.src)).map((i) => pages.get(i.src));
function navHtml(cur) {
  return cfg.nav.map((g) => `<h4>${escapeHtml(g.group)}</h4>` + g.items.filter((i) => pages.has(i.src)).map((i) => {
    const p = pages.get(i.src);
    return `<a href="${escapeHtml(rel(cur.out, p.out))}"${p === cur ? ' aria-current="page"' : ''}>${escapeHtml(i.title)}</a>`;
  }).join('')).join('');
}
function pageHtml(pg) {
  const toRoot = path.posix.relative(path.posix.dirname(pg.out), '.') || '.';
  const rootPrefix = toRoot === '.' ? '' : toRoot + '/';
  const idx = order.indexOf(pg), prev = idx > 0 ? order[idx - 1] : null, next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  const toc = pg.headings.filter((h) => h.level === 2 || h.level === 3).map((h) => `<a class="l${h.level}" href="#${escapeHtml(h.id)}">${escapeHtml(h.text)}</a>`).join('');
  const edit = repoUrl ? `<a class="edit" href="${escapeHtml(`${repoUrl}/edit/${branch}/${pg.src}`)}">✏️ Chỉnh sửa trang này trên GitHub</a>` : '';
  return `<!doctype html>
<html lang="${escapeHtml(cfg.lang)}" data-root="${escapeHtml(rootPrefix)}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(pg.title)} · ${escapeHtml(cfg.title)}</title>
<link rel="stylesheet" href="${rootPrefix}assets/style.css">
</head>
<body>
<header class="top">
  <button class="ic" id="navbtn" aria-label="Mở menu">☰</button>
  <a class="brand" href="${rootPrefix}index.html">${escapeHtml(cfg.title)}</a>
  <div class="searchbox"><input id="q" type="search" placeholder="Tìm trong tài liệu (nhấn /)" autocomplete="off" aria-label="Tìm kiếm"><div id="results" role="listbox"></div></div>
  <span class="grow"></span>
  <button class="ic" id="theme" aria-label="Đổi giao diện sáng/tối" title="Sáng / tối">🌓</button>
</header>
<div class="layout">
<nav class="side" aria-label="Mục lục tài liệu">${navHtml(pg)}</nav>
<main>
${pg.html}
${edit}
<div class="pager"><span>${prev ? `← <a href="${escapeHtml(rel(pg.out, prev.out))}">${escapeHtml(prev.navTitle)}</a>` : ''}</span><span>${next ? `<a href="${escapeHtml(rel(pg.out, next.out))}">${escapeHtml(next.navTitle)}</a> →` : ''}</span></div>
</main>
<aside class="toc" aria-label="Trong trang này">${toc}</aside>
</div>
<script src="${rootPrefix}assets/search-index.js"></script>
<script src="${rootPrefix}assets/app.js"></script>
</body></html>
`;
}

// ── ghi ra đĩa ────────────────────────────────────────────────────────────────
for (const n of [`Có ${pages.size} trang (${[...pages.values()].filter((p) => p.listed).length} trong menu)`]) notes.push(n);
if (deadLinks) notes.push(`${deadLinks} liên kết tới mã nguồn hiển thị dạng chữ thường vì chưa đặt repoUrl (scripts/docs-site/config.json hoặc biến DOCS_REPO_URL)`);
if (!errors.length) {
  fs.rmSync(OUT, { recursive: true, force: true });
  for (const pg of pages.values()) { const f = path.join(OUT, pg.out); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, pageHtml(pg)); }
  fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
  for (const a of ['style.css', 'app.js']) fs.copyFileSync(path.join(HERE, 'assets', a), path.join(OUT, 'assets', a));
  fs.writeFileSync(path.join(OUT, 'assets', 'search-index.js'), `window.__DOCS_INDEX=${JSON.stringify(searchIndex).replace(/</g, '\\u003c')};\n`);
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
  notes.push(`đã dựng ${posix(path.relative(ROOT, OUT))}/ (chỉ mục tìm kiếm: ${searchIndex.length} mục)`);
}
for (const n of notes) console.log('•', n);
for (const e of errors) console.log('✗', e);
if (errors.length) { console.log(`\nKẾT QUẢ: ${errors.length} lỗi — chưa dựng site.`); process.exit(1); }
console.log('\nKẾT QUẢ: đạt.');

// ── máy chủ xem thử ───────────────────────────────────────────────────────────
if (argv.includes('--serve')) {
  const port = Number(argVal('--port', '4173'));
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json' };
  http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(OUT, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
    if (!f.startsWith(OUT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  }).listen(port, () => console.log(`Xem thử: http://localhost:${port}/`));
}
