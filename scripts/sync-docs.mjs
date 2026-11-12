#!/usr/bin/env node
// Đồng bộ "hệ thống ngữ cảnh AI" của repo và kiểm tra liên kết. Không phụ thuộc thư viện ngoài (Node >= 18; split dùng python3).
//
//   node scripts/sync-docs.mjs                 sinh lại SKELETON.md, khối mục lục trong AI_CONTEXT.md, docs/split/HEADINGS.md rồi kiểm tra
//   node scripts/sync-docs.mjs --check         không ghi gì; exit 1 nếu file sinh ra đã cũ, có liên kết hỏng hoặc tài liệu bị bỏ quên
//   node scripts/sync-docs.mjs --find "từ khóa"  in liên kết (đường dẫn + #heading) tới mảnh/heading khớp, để dán vào tài liệu
//   --strict   coi cảnh báo (thiếu mô tả đầu tệp, ID không có trong tài liệu) là lỗi
//   --no-split không chạy lại scripts/split_doc.py (dùng docs/split sẵn có)
//
// Quy ước:
//  * SKELETON.md: sinh hoàn toàn từ mã nguồn (packages/*/src, apps/*/src; bin/ và scripts/ chỉ liệt kê tóm tắt).
//  * AI_CONTEXT.md: phần viết tay giữ nguyên; chỉ thay khối giữa <!-- sync:begin docs-index --> và <!-- sync:end docs-index -->.
//  * Liên kết kiểm tra: [text](đường/dẫn.md#heading) trong các tệp .md gốc, README, docs/ (không kể docs/split);
//    đường dẫn trong `backtick` ở 4 tệp lõi (AI_CONTEXT, ARCHITECTURE, SKELETON, PROGRESS) phải tồn tại.
//  * docs/ được commit (công khai). Nếu vì lý do nào đó vắng docs/ (bản cắt gọn) thì các kiểm tra phụ thuộc docs được bỏ qua và báo rõ.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { slug, stripInline } from './docs-site/slug.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const argVal = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const CHECK = args.has('--check'), STRICT = args.has('--strict');
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

const errors = [], warnings = [], notes = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m);

// ───────────────────────────── slug / heading (quy tắc anchor kiểu GitHub) ─────────────────────────────
/** Danh sách heading { level, text, anchor } của một tệp markdown (bỏ khối code; anchor trùng thêm -1, -2…). */
function headingsOf(file) {
  const out = [], seen = new Map(); let fence = null;
  for (const line of read(file).split(/\r?\n/)) {
    const f = line.match(/^\s*(```+|~~~+)/);
    if (f) { fence = fence === f[1][0] ? null : (fence ?? f[1][0]); continue; }
    if (fence) continue;
    const m = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (!m) continue;
    let a = slug(m[2]); const n = seen.get(a) ?? 0; seen.set(a, n + 1); if (n) a += `-${n}`;
    out.push({ level: m[1].length, text: stripInline(m[2]), anchor: a });
  }
  return out;
}
const anchorCache = new Map();
const anchorsOf = (file) => { if (!anchorCache.has(file)) anchorCache.set(file, new Set(headingsOf(file).map((h) => h.anchor))); return anchorCache.get(file); };

// ───────────────────────────── cấu hình quét ─────────────────────────────
const SRC_DIRS = [];
for (const top of ['packages', 'apps']) {
  const d = path.join(ROOT, top); if (!exists(d)) continue;
  for (const n of fs.readdirSync(d).sort()) { const s = path.join(d, n, 'src'); if (exists(s) && fs.statSync(s).isDirectory()) SRC_DIRS.push(s); }
}
const TOOL_DIRS = ['bin', 'scripts'].map((d) => path.join(ROOT, d)).filter(exists);
const CODE_EXT = /\.(mjs|js|ts|tsx)$/;
const TREE_IGNORE = new Set(['node_modules', 'dist', '.git', '.vite', 'coverage', 'dist-docs', 'package-lock.json', '__pycache__']);
const TREE_COLLAPSE = new Map([['docs', 'tài liệu; xem AI_CONTEXT.md'], ['fixtures', 'tệp mẫu'], ['schemas', null]]);
const DIR_NOTES = {
  'apps/web': 'ứng dụng React (Vite, Tailwind, Framer Motion)', 'apps/parser-lab': 'trang thử parser (HTML + Worker)',
  'packages/core': '@dawviz/parser-core: lỗi, giới hạn, ZIP/XML, tempo, AST, automation', 'packages/midi': '@dawviz/parser-midi: .mid',
  'packages/als': '@dawviz/parser-als: .als/.alp', 'packages/rpp': '@dawviz/parser-rpp: Reaper .rpp', 'packages/dawproject': '@dawviz/parser-dawproject',
  'packages/binary': '@dawviz/parser-binary: nhị phân theo JSON schema', 'packages/parser': '@dawviz/parser: cổng vào (detect/probe/parse)',
  'packages/i18n': '@dawviz/i18n', 'packages/render-core': '@dawviz/render-core: khung hình = hàm của t', locales: 'danh mục ngôn ngữ', test: 'test của thư viện parser',
};

// ───────────────────────────── trích xuất chữ ký ─────────────────────────────
const clip = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const oneLine = (s) => s.replace(/\s+/g, ' ').trim();

function fileSummary(src) {
  const lines = src.split(/\r?\n/); let i = 0;
  while (i < lines.length && (!lines[i].trim() || lines[i].startsWith('#!') || /^\s*\/\/\/\s*<reference/.test(lines[i]))) i++;
  const first = lines[i] ?? '';
  const parts = [];
  if (first.trim().startsWith('//')) {
    for (; i < lines.length && lines[i].trim().startsWith('//'); i++) { const t = lines[i].replace(/^\s*\/\/+\s?/, '').trim(); if (t) parts.push(t); if (parts.length >= 1) break; }
  } else if (first.trim().startsWith('/*')) {
    const blk = []; for (; i < lines.length; i++) { blk.push(lines[i]); if (lines[i].includes('*/')) break; }
    const t = blk.join(' ').replace(/\/\*+|\*+\//g, ' ').replace(/\s\*\s/g, ' ').trim(); if (t) parts.push(t);
  }
  return parts.length ? clip(oneLine(parts[0]), 180) : null;
}
/** Gom đến khi ngoặc tròn cân bằng (tối đa 14 dòng), trả { text, endLine }. */
function balanced(lines, start, fromCol = 0) {
  let depth = 0, started = false, text = '';
  for (let i = start; i < Math.min(lines.length, start + 14); i++) {
    const part = i === start ? lines[i].slice(fromCol) : lines[i];
    for (const ch of part) { if (ch === '(') { depth++; started = true; } else if (ch === ')') depth--; }
    text += (text ? ' ' : '') + part.trim();
    if (started && depth <= 0) return { text, endLine: i };
    if (!started && /[;{=]/.test(part)) return { text, endLine: i };
  }
  return { text, endLine: start };
}
const docAbove = (lines, i) => {
  let k = i - 1; if (k < 0) return '';
  const l = lines[k].trim();
  if (l.startsWith('//')) { const buf = []; while (k >= 0 && lines[k].trim().startsWith('//')) { buf.unshift(lines[k].replace(/^\s*\/\/+\s?/, '').trim()); k--; } return clip(oneLine(buf.join(' ')), 110); }
  if (l.endsWith('*/')) { const buf = []; while (k >= 0) { buf.unshift(lines[k]); if (lines[k].includes('/**') || lines[k].includes('/*')) break; k--; }
    return clip(oneLine(buf.join(' ').replace(/\/\*+|\*+\//g, ' ').replace(/\s\*\s/g, ' ').replace(/@\w+.*$/, '')), 110); }
  return '';
};
function signatures(src) {
  const lines = src.split(/\r?\n/), out = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    let m;
    if ((m = l.match(/^export\s+(?:default\s+)?(async\s+)?function\s*(\*?)\s*([A-Za-z0-9_$]*)\s*(<[^>(]*>)?\s*\(/))) {
      const col = l.indexOf('(', l.indexOf('function')); const { text, endLine } = balanced(lines, i, col);
      const open = text.indexOf('(');
      let depth = 0, close = -1; for (let k = open; k < text.length; k++) { if (text[k] === '(') depth++; else if (text[k] === ')') { depth--; if (depth === 0) { close = k; break; } } }
      const params = oneLine(text.slice(open, close + 1));
      const tail = text.slice(close + 1); const rt = tail.match(/^\s*:\s*([^{;]+?)\s*(?:\{|;|$)/);
      out.push({ sig: `${m[1] ? 'async ' : ''}function${m[2]} ${m[3] || 'default'}${m[4] || ''}${params}${rt ? ': ' + oneLine(rt[1]) : ''}`, doc: docAbove(lines, i) }); i = endLine; continue;
    }
    if ((m = l.match(/^export\s+(?:abstract\s+)?class\s+([A-Za-z0-9_$]+)(\s+extends\s+[A-Za-z0-9_$.]+)?/))) {
      out.push({ sig: `class ${m[1]}${m[2] || ''}`, doc: docAbove(lines, i) });
      // phương thức công khai (thụt 2 ô, không bắt đầu bằng _ hoặc #), dừng ở dấu } cột 0
      for (let k = i + 1; k < lines.length && !/^\}/.test(lines[k]); k++) {
        const mm = lines[k].match(/^ {2}(static\s+|async\s+|get\s+|set\s+)*([A-Za-z][A-Za-z0-9_$]*)\s*\(/);
        if (mm && !['if', 'for', 'while', 'switch', 'catch', 'return'].includes(mm[2])) {
          const { text, endLine } = balanced(lines, k, lines[k].indexOf('(')); const o = text.indexOf('('); let d = 0, c = -1;
          for (let q = o; q < text.length; q++) { if (text[q] === '(') d++; else if (text[q] === ')') { d--; if (!d) { c = q; break; } } }
          out.push({ sig: `  ${(mm[1] || '').trim() ? mm[1].trim() + ' ' : ''}${mm[2]}${c > 0 ? oneLine(text.slice(o, c + 1)) : '()'}`, doc: '' }); k = endLine;
        }
      }
      continue;
    }
    if ((m = l.match(/^export\s+(?:declare\s+)?(interface|type|enum)\s+([A-Za-z0-9_$]+)/))) { out.push({ sig: `${m[1]} ${m[2]}`, doc: docAbove(lines, i) }); continue; }
    if ((m = l.match(/^export\s+(const|let|var)\s+([A-Za-z0-9_$]+)\s*(?::[^=]+)?=\s*(async\s+)?(\(|[A-Za-z0-9_$]+\s*=>)/))) {
      let sig;
      if (m[4] === '(') { const { text, endLine } = balanced(lines, i, l.indexOf('=')); const open = text.indexOf('('); let d = 0, close = -1;
        for (let k = open; k < text.length; k++) { if (text[k] === '(') d++; else if (text[k] === ')') { d--; if (!d) { close = k; break; } } }
        sig = /^\s*(?::[^=]+)?=>/.test(text.slice(close + 1)) || /=>/.test(text.slice(close + 1, close + 40)) ? `${m[3] ? 'async ' : ''}const ${m[2]} = ${oneLine(text.slice(open, close + 1))} =>` : `const ${m[2]}`; i = endLine; }
      else sig = `${m[3] ? 'async ' : ''}const ${m[2]} = ${m[4]}`;
      out.push({ sig, doc: docAbove(lines, i) }); continue;
    }
    if ((m = l.match(/^export\s+(const|let|var)\s+([A-Za-z0-9_$]+)/))) { out.push({ sig: `${m[1]} ${m[2]}`, doc: docAbove(lines, i) }); continue; }
    if ((m = l.match(/^export\s*\*\s*from\s*['"]([^'"]+)['"]/))) { out.push({ sig: `re-export * from '${m[1]}'`, doc: '' }); continue; }
    if ((m = l.match(/^export\s*\{([^}]*)\}\s*(?:from\s*['"]([^'"]+)['"])?/))) { out.push({ sig: `re-export { ${oneLine(m[1])} }${m[2] ? ` from '${m[2]}'` : ''}`, doc: '' }); continue; }
  }
  return out;
}

// ───────────────────────────── SKELETON.md ─────────────────────────────
function walkFiles(dir, pred) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (TREE_IGNORE.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkFiles(p, pred)); else if (pred(p)) out.push(p);
  }
  return out;
}
function tree(dir, prefix = '', depth = 0) {
  const out = [];
  const ents = fs.readdirSync(dir, { withFileTypes: true }).filter((e) => !TREE_IGNORE.has(e.name) && !e.name.startsWith('.')).sort((a, b) => (b.isDirectory() - a.isDirectory()) || a.name.localeCompare(b.name));
  ents.forEach((e, i) => {
    const last = i === ents.length - 1, p = path.join(dir, e.name), r = rel(p);
    const branch = prefix + (last ? '└─ ' : '├─ '), next = prefix + (last ? '   ' : '│  ');
    const note = DIR_NOTES[r];
    if (e.isDirectory()) {
      if (TREE_COLLAPSE.has(e.name)) { const c = TREE_COLLAPSE.get(e.name); out.push(`${branch}${e.name}/` + (c ? `   # ${c}` : '')); return; }
      out.push(`${branch}${e.name}/` + (note ? `   # ${note}` : '')); out.push(...tree(p, next, depth + 1));
    } else out.push(`${branch}${e.name}`);
  });
  return out;
}
function buildSkeleton() {
  const L = [];
  L.push('# SKELETON — cấu trúc mã nguồn', '',
    '> **Sinh tự động** bởi `node scripts/sync-docs.mjs` — không sửa tay (mọi chỉnh sửa sẽ bị ghi đè). Quét `packages/*/src`, `apps/*/src` (chữ ký công khai) và `bin/`, `scripts/` (tóm tắt). Mô tả mỗi tệp lấy từ **dòng chú thích đầu tệp**; mô tả mỗi hàm lấy từ chú thích ngay phía trên. Thiếu thì thêm vào mã rồi chạy lại.', '',
    '## 1. Cây thư mục', '', '```text', 'dawviz/', ...tree(ROOT), '```', '');
  L.push('## 2. Mã nguồn và chữ ký công khai', '');
  let total = 0, noSummary = [];
  for (const dir of SRC_DIRS) {
    const files = walkFiles(dir, (p) => CODE_EXT.test(p) && !/\.d\.ts$/.test(p) && !/\.test\./.test(p));
    const pkg = rel(path.dirname(dir));
    L.push(`### ${pkg}${DIR_NOTES[pkg] ? ` — ${DIR_NOTES[pkg]}` : ''}`, '');
    for (const f of files) {
      const src = read(f), sum = fileSummary(src), sigs = signatures(src); total += sigs.length;
      if (!sum) noSummary.push(rel(f));
      L.push(`#### \`${rel(f)}\``, '', sum ?? '*(chưa có mô tả đầu tệp)*', '');
      if (sigs.length) { L.push('```text'); for (const s of sigs) L.push(s.sig + (s.doc ? `   // ${s.doc}` : '')); L.push('```', ''); }
    }
  }
  L.push('## 3. Công cụ dòng lệnh và script', '');
  for (const dir of TOOL_DIRS) for (const f of walkFiles(dir, (p) => /\.(mjs|js|py|ts)$/.test(p))) {
    const src = read(f); let sum = fileSummary(src);
    if (!sum && f.endsWith('.py')) { const m = src.match(/^(?:#!.*\n)?\s*(?:"""|''')\s*([^\n]+)/); if (m) sum = clip(oneLine(m[1]), 180); }
    if (!sum) noSummary.push(rel(f));
    L.push(`- \`${rel(f)}\` — ${sum ?? '*(chưa có mô tả đầu tệp)*'}`);
  }
  L.push('', '## 4. Tệp test', '');
  const tests = [...SRC_DIRS.map((d) => path.dirname(d)), path.join(ROOT, 'test')].filter(exists)
    .flatMap((d) => walkFiles(d, (p) => /\.test\.(js|mjs|ts|tsx)$/.test(p)));
  for (const t of [...new Set(tests)].sort()) L.push(`- \`${rel(t)}\``);
  L.push('', `<!-- ${SRC_DIRS.length} thư mục src, ${total} ký hiệu công khai -->`, '');
  for (const f of noSummary) warn(`thiếu mô tả đầu tệp: ${f}`);
  return L.join('\n');
}

// ───────────────────────────── split docs + mục lục ─────────────────────────────
const SPLIT = path.join(ROOT, 'docs', 'split');
function runSplit() {
  if (args.has('--no-split') || CHECK) return;
  try { execFileSync('python3', [path.join(ROOT, 'scripts', 'split_doc.py')], { stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (e) { warn(`không chạy được split_doc.py (${(e.stderr?.toString() || e.message).split('\n')[0]}); dùng docs/split sẵn có nếu có`); }
}
function loadIndex() {
  const f = path.join(SPLIT, 'index.json'); if (!exists(f)) return null;
  return JSON.parse(read(f));
}
function docSources() { // mọi .md dưới docs/, trừ split/ và README
  const d = path.join(ROOT, 'docs'); if (!exists(d)) return [];
  return walkFiles(d, (p) => p.endsWith('.md') && !p.startsWith(SPLIT + path.sep)).filter((p) => rel(p) !== 'docs/README.md');
}
function buildDocsIndex(index) {
  const L = [];
  const stems = Object.keys(index.docs);
  L.push(`Có ${stems.length} tài liệu, ${stems.reduce((n, k) => n + index.docs[k].chunks.length, 0)} mảnh. Mỗi mục là **một tệp nhỏ**; chỉ mở mảnh cần dùng. Mọi heading (kể cả cấp thấp) và neo \`#…\`: [docs/split/HEADINGS.md](docs/split/HEADINGS.md). Tìm nhanh: \`node scripts/sync-docs.mjs --find "từ khóa"\`.`, '');
  for (const [name, d] of Object.entries(index.docs)) {
    const stem = name.replace(/\.md$/, '');
    L.push(`### ${name} — ${d.title}`, '', `Nguồn: \`${sourceOf(name)}\` · [thứ tự đọc](docs/split/${stem}/_index.md)`, '');
    for (const c of d.chunks) L.push(`- [${c.path.length ? c.path.join(' › ') : c.title}](docs/split/${c.file}) · ${(c.chars / 1000).toFixed(1)}k`);
    L.push('');
  }
  return L.join('\n');
}
const sourceOf = (name) => { const hit = docSources().find((p) => path.basename(p) === name); return hit ? rel(hit) : `docs/…/${name}`; };

function buildHeadings(index) {
  const L = ['# Mục lục heading của các mảnh tài liệu', '', '> Sinh tự động bởi `scripts/sync-docs.mjs`. Dùng để trỏ đúng `mảnh#heading`. Không sửa tay.', ''];
  for (const [name, d] of Object.entries(index.docs)) {
    L.push(`## ${name}`, '');
    for (const c of d.chunks) {
      const f = path.join(SPLIT, c.file); if (!exists(f)) continue;
      const hs = headingsOf(f);
      L.push(`- [${c.title}](${c.file})`);
      for (const h of hs) if (h.level >= 2) L.push(`${'  '.repeat(Math.max(1, h.level - 1))}- [${h.text}](${c.file}#${h.anchor})`);
    }
    L.push('');
  }
  return L.join('\n');
}

const BEGIN = '<!-- sync:begin docs-index -->', END = '<!-- sync:end docs-index -->';
function withBlock(ctx, block) {
  const a = ctx.indexOf(BEGIN), b = ctx.indexOf(END);
  if (a < 0 || b < 0 || b < a) { err(`AI_CONTEXT.md thiếu cặp dấu ${BEGIN} … ${END}`); return ctx; }
  return ctx.slice(0, a + BEGIN.length) + '\n<!-- Khối này do scripts/sync-docs.mjs sinh ra; đừng sửa tay. -->\n\n' + block + '\n' + ctx.slice(b);
}

// ───────────────────────────── kiểm tra liên kết ─────────────────────────────
const CORE = ['AI_CONTEXT.md', 'ARCHITECTURE.md', 'SKELETON.md', 'PROGRESS.md'];
const TOP_DIRS = /^(packages|apps|docs|scripts|bin|locales|schemas|test)\//;
const GENERATED_OK = /^(dist|node_modules|docs\/split)\b/;
function stripCode(text) { // bỏ khối code nhưng giữ số dòng
  let fence = null;
  return text.split('\n').map((l) => { const f = l.match(/^\s*(```+|~~~+)/); if (f) { fence = fence === f[1][0] ? null : (fence ?? f[1][0]); return ''; } return fence ? '' : l; }).join('\n');
}
let skippedDocLinks = 0;
const skipMissingDoc = (abs) => { if (!haveDocs && rel(abs).startsWith('docs/')) { skippedDocLinks++; return true; } return false; };
function checkLinks(file, { backticks }) {
  const text = read(file), plain = stripCode(text), r = rel(file);
  const lines = plain.split('\n');
  lines.forEach((line, i) => {
    const noInline = line.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length));
    for (const m of noInline.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const target = m[1]; if (/^(https?:|mailto:|data:)/.test(target)) continue;
      const [p, frag] = target.split('#');
      const abs = p ? path.resolve(path.dirname(file), decodeURI(p)) : file;
      if (!exists(abs)) { if (skipMissingDoc(abs)) continue; err(`${r}:${i + 1}: liên kết hỏng → ${target} (không có tệp)`); continue; }
      if (frag && abs.endsWith('.md') && fs.statSync(abs).isFile() && !anchorsOf(abs).has(decodeURIComponent(frag))) {
        const cand = [...anchorsOf(abs)].filter((a) => a.includes(frag.slice(0, 12)) || frag.includes(a.slice(0, 12))).slice(0, 2);
        err(`${r}:${i + 1}: liên kết hỏng → ${target} (không có heading này)${cand.length ? `; gần giống: #${cand.join(', #')}` : ''}`);
      }
    }
    if (backticks) for (const m of line.matchAll(/`([^`\s]+)`/g)) {
      let p = m[1].replace(/[:#]\d.*$/, '').replace(/[,.;)]+$/, '');
      if (!TOP_DIRS.test(p) || /[*<>{}$|]/.test(p) || GENERATED_OK.test(p) || /(^|\/)third-party(\/|$)/.test(p)) continue; // third-party/: thư mục bị .gitignore, có thể vắng mặt
      if (!exists(path.join(ROOT, p))) { if (skipMissingDoc(path.join(ROOT, p))) continue; err(`${r}:${i + 1}: đường dẫn trong \`${m[1]}\` không tồn tại`); }
    }
  });
}
function checkIds(index) {
  const known = new Set(Object.keys(index.ids));
  for (const name of CORE) {
    const f = path.join(ROOT, name); if (!exists(f) || name === 'SKELETON.md') continue;
    const ids = new Set(stripCode(read(f)).match(/\b(?:REQ-[A-Z0-9]+-\d+|PD-\d+|AD-\d+|OI-\d+|SOI-\d+|AT-\d+|NFR-[A-Z]+-\d+|ARC-\d+|KPI-\d+|BR-\d+|D-\d+)\b/g) ?? []);
    for (const id of ids) if (!known.has(id) && !/^AD-/.test(id)) warn(`${name}: ID ${id} không xuất hiện trong tài liệu đã tách`);
  }
}

// ───────────────────────────── --find ─────────────────────────────
const fold = (s) => s.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/g, 'd');
function cmdFind(q, index) {
  if (!index) { console.error('Chưa có docs/split (chạy python3 scripts/split_doc.py hoặc node scripts/sync-docs.mjs).'); process.exit(1); }
  const needle = fold(q); let n = 0;
  for (const [name, d] of Object.entries(index.docs)) for (const c of d.chunks) {
    const f = path.join(SPLIT, c.file); const hs = exists(f) ? headingsOf(f) : [];
    const hit = fold([c.title, ...c.path].join(' ')).includes(needle) || c.ids.some((i) => fold(i) === needle);
    if (hit) { console.log(`[${c.title}](docs/split/${c.file}#${hs[0]?.anchor ?? ''})   — ${name}`); n++; }
    for (const h of hs.slice(1)) if (fold(h.text).includes(needle)) { console.log(`[${h.text}](docs/split/${c.file}#${h.anchor})   — ${name} › ${c.title}`); n++; }
  }
  if (!n) console.log('(không có kết quả)');
}

// ───────────────────────────── chạy ─────────────────────────────
function writeOrCompare(file, content, label) {
  const cur = exists(file) ? read(file) : null;
  if (cur === content) return;
  if (CHECK) err(`${label} đã cũ so với mã/tài liệu → chạy: node scripts/sync-docs.mjs`);
  else { fs.writeFileSync(file, content); notes.push(`đã cập nhật ${rel(file)}`); }
}

if (argVal('--find')) { cmdFind(argVal('--find'), loadIndex()); process.exit(0); }

runSplit();
const index = loadIndex();
const haveDocs = !!index && docSources().length > 0;
if (!haveDocs) notes.push('Không có docs/ (bản cắt gọn?): bỏ qua mục lục AI_CONTEXT, HEADINGS và các kiểm tra phụ thuộc docs.');

// 1) SKELETON.md
writeOrCompare(path.join(ROOT, 'SKELETON.md'), buildSkeleton(), 'SKELETON.md');

if (haveDocs) {
  // 2) mục lục tài liệu trong AI_CONTEXT.md + HEADINGS.md
  const ctxFile = path.join(ROOT, 'AI_CONTEXT.md');
  if (exists(ctxFile)) writeOrCompare(ctxFile, withBlock(read(ctxFile), buildDocsIndex(index)), 'khối mục lục trong AI_CONTEXT.md');
  else err('thiếu AI_CONTEXT.md');
  writeOrCompare(path.join(SPLIT, 'HEADINGS.md'), buildHeadings(index) + '\n', 'docs/split/HEADINGS.md');

  // 3) tài liệu bị bỏ quên / mảnh không tồn tại
  const indexed = new Set(Object.keys(index.docs));
  for (const p of docSources()) if (!indexed.has(path.basename(p))) err(`tài liệu chưa được index: ${rel(p)} → thêm vào DEFAULT_DOCS trong scripts/split_doc.py`);
  for (const [name, d] of Object.entries(index.docs)) for (const c of d.chunks) if (!exists(path.join(SPLIT, c.file))) err(`${name}: mảnh ${c.file} có trong index.json nhưng không có tệp`);
  const onDisk = new Set(Object.values(index.docs).flatMap((d) => d.chunks.map((c) => c.file)));
  for (const f of walkFiles(SPLIT, (p) => p.endsWith('.md'))) {
    const r = path.relative(SPLIT, f).split(path.sep).join('/');
    if (/(^|\/)_index\.md$/.test(r) || r === 'INDEX.md' || r === 'HEADINGS.md') continue;
    if (!onDisk.has(r)) err(`mảnh mồ côi (không có trong index.json): docs/split/${r} → chạy lại split_doc.py`);
  }
  checkIds(index);
}

// 4) liên kết
const mdFiles = [...CORE.map((n) => path.join(ROOT, n)), path.join(ROOT, 'README.md'), path.join(ROOT, 'CONTRIBUTING.md'), path.join(ROOT, 'packages', 'README.md'), path.join(ROOT, 'docs', 'README.md'), path.join(ROOT, 'docs', 'I18N.md')]
  .filter(exists);
for (const f of mdFiles) checkLinks(f, { backticks: CORE.includes(rel(f)) });
if (haveDocs) for (const f of docSources()) checkLinks(f, { backticks: false });
for (const n of CORE) if (!exists(path.join(ROOT, n))) err(`thiếu tệp lõi ${n}`);
// mọi tệp lõi phải được AI_CONTEXT nhắc tới
if (exists(path.join(ROOT, 'AI_CONTEXT.md'))) {
  const ctx = read(path.join(ROOT, 'AI_CONTEXT.md'));
  for (const n of CORE.slice(1)) if (!ctx.includes(`](${n}`)) warn(`AI_CONTEXT.md chưa liên kết tới ${n}`);
}

// ───────────────────────────── báo cáo ─────────────────────────────
if (skippedDocLinks) notes.push(`bỏ qua ${skippedDocLinks} liên kết vào docs/ (không có tài liệu trong bản này)`);
for (const n of notes) console.log('•', n);
for (const w of warnings) console.log(STRICT ? '✗' : '⚠', w);
for (const e of errors) console.log('✗', e);
const bad = errors.length + (STRICT ? warnings.length : 0);
console.log(bad ? `\nKẾT QUẢ: ${errors.length} lỗi, ${warnings.length} cảnh báo.` : `\nKẾT QUẢ: đạt (${warnings.length} cảnh báo).`);
process.exit(bad ? 1 : 0);
