#!/usr/bin/env node
// Kiểm tra danh mục ngôn ngữ trong locales/ (dùng cho cộng tác viên và CI). Xem docs/I18N.md.
//   node scripts/check-i18n.mjs            kiểm tra tất cả
//   node scripts/check-i18n.mjs vi         chỉ một ngôn ngữ
//   node scripts/check-i18n.mjs --quiet    chỉ in lỗi
//   node scripts/check-i18n.mjs --dir đường_dẫn   kiểm thư mục locales khác
// Thoát 1 nếu có lỗi. Ngôn ngữ có @meta.status = "partial" được phép thiếu khoá (chuỗi dự phòng tiếng Anh sẽ dùng).
import fs from 'node:fs';
import path from 'node:path';
import { describeMessage } from '../packages/i18n/src/index.js';

const root = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const di = args.indexOf('--dir');
const dir = di >= 0 ? path.resolve(args.splice(di, 2)[1]) : path.join(root, 'locales'); // --dir: kiểm thư mục khác (dùng trong test)
const quiet = args.includes('--quiet');
const only = args.filter((a) => !a.startsWith('--'));
const errors = [], warns = [];
const err = (loc, m) => errors.push(`[${loc}] ${m}`);
const warn = (loc, m) => warns.push(`[${loc}] ${m}`);

const readJson = (file, loc) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { err(loc, `JSON không hợp lệ: ${e.message}`); return null; } };
const manifest = readJson(path.join(dir, 'index.json'), 'index');
if (!manifest) { console.error(errors.join('\n')); process.exit(1); }
const source = manifest.source || 'en';
const codes = manifest.locales.map((l) => l.code);
if (!codes.includes(source)) err('index', `ngôn ngữ nguồn "${source}" không có trong danh sách`);
for (const f of fs.readdirSync(dir)) if (f.endsWith('.json') && f !== 'index.json' && !codes.includes(f.slice(0, -5))) err('index', `${f} chưa được thêm vào locales/index.json`);

const BCP47 = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;
const cats = {};
const load = (code) => { const f = path.join(dir, `${code}.json`); if (!fs.existsSync(f)) { err(code, `thiếu file locales/${code}.json`); return null; } return readJson(f, code); };
const src = load(source);
const srcKeys = src ? Object.keys(src).filter((k) => k !== '@meta') : [];
const srcInfo = {};
for (const k of srcKeys) { try { srcInfo[k] = describeMessage(src[k]); } catch (e) { err(source, `${k}: ${e.message}`); } }

const stats = [];
for (const { code } of manifest.locales) {
  if (only.length && !only.includes(code)) continue;
  if (!BCP47.test(code)) err(code, 'mã ngôn ngữ phải theo BCP 47 (vi, pt-BR, zh-Hant...)');
  const cat = code === source ? src : load(code); if (!cat) continue;
  const meta = cat['@meta'] || {};
  if (meta.code !== code) err(code, `@meta.code ("${meta.code}") phải bằng tên file`);
  if (!meta.name) err(code, '@meta.name (tên ngôn ngữ viết bằng chính ngôn ngữ đó) bị thiếu');
  if (!['ltr', 'rtl'].includes(meta.dir)) err(code, '@meta.dir phải là "ltr" hoặc "rtl"');
  if (!['source', 'complete', 'partial'].includes(meta.status)) err(code, '@meta.status phải là source | complete | partial');
  const mname = manifest.locales.find((l) => l.code === code)?.name;
  if (mname && meta.name && mname !== meta.name) warn(code, `tên trong index.json ("${mname}") khác @meta.name ("${meta.name}")`);
  let plural; try { plural = new Intl.PluralRules(code).resolvedOptions().pluralCategories; } catch { err(code, 'trình chạy Node không nhận locale này (Intl)'); plural = ['other']; }
  let have = 0, same = 0;
  for (const k of srcKeys) {
    if (!(k in cat)) { if (meta.status === 'complete') err(code, `thiếu khoá: ${k}`); else warn(code, `chưa dịch (dùng tiếng ${source}): ${k}`); continue; }
    const v = cat[k];
    if (typeof v !== 'string') { err(code, `${k}: giá trị phải là chuỗi`); continue; }
    if (!v.trim()) { err(code, `${k}: chuỗi rỗng (xoá khoá nếu chưa dịch)`); continue; }
    have++;
    if (code !== source && v === src[k]) same++;
    let d; try { d = describeMessage(v); } catch (e) { err(code, `${k}: ${e.message}`); continue; }
    const s = srcInfo[k];
    if (s && JSON.stringify(d.args) !== JSON.stringify(s.args)) err(code, `${k}: tham số {${d.args}} khác bản gốc {${s.args}}`);
    if (d.plural) { // mỗi nhánh dùng phải là loại hợp lệ của ngôn ngữ này
      const used = [...v.matchAll(/(?:^|[\s{}])(zero|one|two|few|many)\s*\{/g)].map((m) => m[1]);
      for (const u of used) if (!plural.includes(u)) err(code, `${k}: nhánh số nhiều "${u}" không tồn tại trong ${code} (có: ${plural.join(', ')})`);
      const missing = plural.filter((p) => p !== 'other' && !used.includes(p));
      if (missing.length && code !== source) warn(code, `${k}: nên có nhánh số nhiều ${missing.join(', ')}`);
    }
  }
  for (const k of Object.keys(cat)) if (k !== '@meta' && !(k in src)) err(code, `khoá thừa (không có trong ${source}): ${k}`);
  stats.push({ code, pct: srcKeys.length ? Math.round((have / srcKeys.length) * 100) : 100, same });
}

// khoá dùng trong mã nguồn phải có trong bản gốc
const used = new Set(), dynamic = new Set(), literal = new Set();
const scan = (file) => {
  const s = fs.readFileSync(file, 'utf8');
  for (const m of s.matchAll(/data-i18n(?:-[a-z]+)?="([\w.]+)"/g)) used.add(m[1]);
  for (const m of s.matchAll(/\b(?:t|has)\(\s*'([\w.]+)'/g)) { if (m[1].endsWith('.')) dynamic.add(m[1]); else used.add(m[1]); } // 'errors.' + code → tiền tố động
  for (const m of s.matchAll(/\bt\(\s*'([\w.]+)'\s*\+/g)) dynamic.add(m[1]);
  for (const m of s.matchAll(/['"]([A-Za-z]\w*(?:\.\w+)+)['"]/g)) literal.add(m[1]); // khoá viết trực tiếp, vd t(c ? 'a.b' : 'a.c')
  for (const m of s.matchAll(/\bt\(\s*`([\w.]+)\$\{/g)) dynamic.add(m[1]);
};
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name === 'node_modules' || e.name === 'dist') continue; const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(html|js|mjs|ts|tsx)$/.test(e.name)) scan(p); } };
if (di < 0) walk(path.join(root, 'apps')); // chỉ đối chiếu mã nguồn khi kiểm thư mục locales của repo
for (const k of used) if (!(k in (src || {}))) err(source, `khoá dùng trong mã nguồn nhưng chưa có: ${k}`);
for (const k of srcKeys) if (!used.has(k) && !literal.has(k) && ![...dynamic].some((p) => k.startsWith(p))) warn(source, `khoá không còn được dùng: ${k}`);

if (!quiet) { for (const w of warns) console.log('cảnh báo', w); for (const s of stats) console.log(`${s.code}: ${s.pct}% khoá${s.same ? `, ${s.same} chuỗi giống bản gốc` : ''}`); }
for (const e of errors) console.error('LỖI', e);
console.log(errors.length ? `${errors.length} lỗi` : 'danh mục ngôn ngữ hợp lệ');
process.exit(errors.length ? 1 : 0);
