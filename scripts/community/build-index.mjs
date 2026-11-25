// T-16: sinh `index.json` (danh mục có băm SHA-256) cho presets/ và assets/, kiểm từng preset bằng preset-check (--community).
// Dùng: node scripts/community/build-index.mjs [--root <thư mục gốc>] [--out <tệp>] [--check]
//   (không có --out: in ra stdout; --check: thoát mã 1 nếu --out không khớp nội dung sinh ra)
// Cùng script này chạy trong repo `dawviz-community` sau khi tách (root = gốc repo đó).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkPreset, ALLOWED_LICENSES } from '../preset-check/check.mjs';

const MAX_ASSET_BYTES = 2 * 1024 * 1024;
const ASSET_EXT = /\.(woff2|woff|ttf|otf|png|jpe?g|webp|svg)$/i;
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const slug = /^[a-z0-9][a-z0-9-]*$/;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

/** @returns {{ index: object, errors: string[] }} Hàm thuần theo hệ tệp: không ghi gì. */
export function buildIndex(root) {
  const errors = [], entries = [];
  const rel = (f) => path.relative(root, f).split(path.sep).join('/');
  for (const f of walk(path.join(root, 'presets')).sort()) {
    if (!f.endsWith('.json') || rel(f).startsWith('presets/schema/') || rel(f).startsWith('presets/examples/') || rel(f) === 'presets/index.json') continue;
    const bytes = fs.readFileSync(f);
    const name = path.basename(f, '.json');
    if (!slug.test(name)) errors.push(rel(f) + ': tên tệp phải là slug a-z0-9-');
    const r = checkPreset(rel(f), bytes, { community: true });
    if (!r.ok) errors.push(...r.errors.map((e) => rel(f) + ': ' + e));
    let json = {}; try { json = JSON.parse(bytes.toString('utf8')); } catch { /* đã báo ở checkPreset */ }
    entries.push({ path: rel(f), kind: r.kind, name: json.name ?? json.presetName ?? name, author: json.author ?? null, license: json.license ?? null, bytes: bytes.length, sha256: sha256(bytes) });
  }
  // Tài nguyên: mỗi thư mục assets/<fonts|backgrounds>/<slug>/ có meta.json (license SPDX) và tệp dữ liệu.
  for (const group of ['fonts', 'backgrounds']) {
    const dir = path.join(root, 'assets', group);
    if (!fs.existsSync(dir)) continue;
    for (const d of fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
      const base = path.join(dir, d.name);
      const metaFile = path.join(base, 'meta.json');
      if (!slug.test(d.name)) errors.push(rel(base) + ': tên thư mục phải là slug a-z0-9-');
      if (!fs.existsSync(metaFile)) { errors.push(rel(base) + ': thiếu meta.json'); continue; }
      let meta = {}; try { meta = JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch { errors.push(rel(metaFile) + ': JSON hỏng'); continue; }
      if (!ALLOWED_LICENSES.includes(meta.license)) errors.push(rel(metaFile) + ': giấy phép "' + meta.license + '" không nằm trong danh sách cho phép');
      if (!meta.author || !meta.source) errors.push(rel(metaFile) + ': cần "author" và "source"');
      if (!fs.existsSync(path.join(base, 'LICENSE')) && !meta.license) errors.push(rel(base) + ': thiếu LICENSE');
      const files = walk(base).filter((f) => ASSET_EXT.test(f));
      if (!files.length) errors.push(rel(base) + ': không có tệp dữ liệu');
      for (const f of files.sort()) {
        const bytes = fs.readFileSync(f);
        if (bytes.length > MAX_ASSET_BYTES) errors.push(rel(f) + ': vượt ' + MAX_ASSET_BYTES + ' byte');
        entries.push({ path: rel(f), kind: group === 'fonts' ? 'font' : 'background', name: meta.name ?? d.name, author: meta.author ?? null, license: meta.license ?? null, credit: meta.credit ?? null, bytes: bytes.length, sha256: sha256(bytes) });
      }
    }
  }
  return { index: { format: 'dawviz-community-index', formatVersion: 1, entries }, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const a = process.argv.slice(2), val = (k) => (a.includes(k) ? a[a.indexOf(k) + 1] : undefined);
  const root = path.resolve(val('--root') ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'));
  const out = val('--out');
  const { index, errors } = buildIndex(root);
  if (errors.length) { for (const e of errors) console.error('lỗi: ' + e); process.exit(1); }
  const text = JSON.stringify(index, null, 2) + '\n';
  if (a.includes('--check')) {
    if (!out || !fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== text) { console.error('index.json cũ hoặc thiếu: chạy lại build-index.mjs --out ' + (out ?? '<tệp>')); process.exit(1); }
    console.log('index.json khớp (' + index.entries.length + ' mục).');
  } else if (out) { fs.writeFileSync(out, text); console.log('Đã ghi ' + out + ' (' + index.entries.length + ' mục).'); }
  else process.stdout.write(text);
}
