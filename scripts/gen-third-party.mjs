// Gom giấy phép của mọi gói chạy trong ứng dụng web (dependencies của apps/web, đệ quy; bỏ @dawviz/* và @types/*)
// thành apps/web/dist/THIRD-PARTY-NOTICES.txt, chạy sau `vite build`. Bản build phát hành nhờ đó mang đủ văn bản
// MIT / Apache / MPL / OFL mà các giấy phép yêu cầu đi kèm bản sao. Gói nào thiếu tệp giấy phép thì dừng build.
// Giấy phép phông gói theo ứng dụng nằm cạnh phông ở dist/fonts/OFL-*.txt (Vite chép từ apps/web/public/fonts).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const web = path.join(root, 'apps/web');
const out = process.argv[2] ?? path.join(web, 'dist/THIRD-PARTY-NOTICES.txt');
const skip = (name) => name.startsWith('@dawviz/') || name.startsWith('@types/');

function pkgDir(name, fromDir) {
  const req = createRequire(path.join(fromDir, 'package.json'));
  let dir = path.dirname(req.resolve(name, { paths: [fromDir] }));
  while (!fs.existsSync(path.join(dir, 'package.json')) || JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')).name !== name) {
    const up = path.dirname(dir);
    if (up === dir) throw new Error(`không tìm thấy package.json của ${name}`);
    dir = up;
  }
  return dir;
}
function resolveDir(name, fromDir) {
  for (let d = fromDir; ; d = path.dirname(d)) {   // node_modules gần nhất trước, như Node
    const cand = path.join(d, 'node_modules', name, 'package.json');
    if (fs.existsSync(cand)) return path.dirname(cand);
    if (path.dirname(d) === d) return pkgDir(name, fromDir);
  }
}

const seen = new Map();
const missing = [];
(function walk(deps, fromDir) {
  for (const name of Object.keys(deps ?? {}).sort()) {
    if (skip(name)) continue;
    const dir = resolveDir(name, fromDir);
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    const key = `${name}@${pkg.version}`;
    if (seen.has(key)) continue;
    const files = fs.readdirSync(dir).filter((f) => /^(licen[cs]e|copying|notice)(\.(md|txt))?$/i.test(f)).sort();
    if (!files.some((f) => !/^notice/i.test(f))) missing.push(key);
    seen.set(key, { name, version: pkg.version, license: pkg.license ?? '?', homepage: pkg.homepage ?? pkg.repository?.url ?? pkg.repository ?? '', texts: files.map((f) => [f, fs.readFileSync(path.join(dir, f), 'utf8').trim()]) });
    walk(pkg.dependencies, dir);
  }
})(JSON.parse(fs.readFileSync(path.join(web, 'package.json'), 'utf8')).dependencies, web);

// T-40 / OI-07: giấy phép của mọi gói đi kèm bản build phải nằm trong danh sách cho phép (không copyleft mạnh). Gói mới có giấy phép khác thì build dừng
// để người quyết định xem xét rồi thêm vào ALLOWED; SPDX dạng "(A OR B)" đạt nếu có MỘT vế được phép.
const ALLOWED = new Set(['MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0', '0BSD', 'MPL-2.0', 'Unlicense', 'CC0-1.0', 'BlueOak-1.0.0', 'Zlib', 'OFL-1.1']);
const okLicense = (spdx) => String(spdx).replace(/[()]/g, ' ').split(/\s+(?:OR|AND)\s+/i).map((x) => x.trim()).some((x) => ALLOWED.has(x));
const forbidden = [...seen.values()].filter((p) => !okLicense(p.license)).map((p) => `${p.name}@${p.version} (${p.license})`);
if (forbidden.length) { console.error(`gen-third-party: giấy phép ngoài danh sách cho phép (scripts/gen-third-party.mjs, ALLOWED): ${forbidden.join(', ')}`); process.exit(1); }

if (missing.length) { console.error(`gen-third-party: thiếu tệp giấy phép: ${missing.join(', ')}`); process.exit(1); }

const list = [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
const bar = '='.repeat(72);
const body = [
  'DAW Visualizer: third-party software in this build',
  '',
  'Font licences (Space Grotesk, Inter, and the SMuFL glyph data of the sheet music widget from Bravura,',
  'Petaluma, Petaluma Script and Academico, (c) Steinberg Media Technologies GmbH) are in fonts/OFL-*.txt.',
  '',
  ...list.map((p) => `- ${p.name} ${p.version} (${p.license})`),
  '',
  ...list.flatMap((p) => [bar, `${p.name} ${p.version} (${p.license})${p.homepage ? `\n${String(p.homepage).replace(/^git\+/, '')}` : ''}`, bar, ...p.texts.flatMap(([f, t]) => [`--- ${f}`, t, '']), '']),
].join('\n');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, body + '\n');
console.log(`gen-third-party: ${list.length} gói → ${path.relative(root, out)}`);
