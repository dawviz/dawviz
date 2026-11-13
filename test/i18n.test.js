import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createI18n, matchLocale, localeChain, dirOf, parseMessage, describeMessage } from '@dawviz/i18n';

const catalogs = {
  en: { a: 'Hello {name}', n: '{count, plural, one {# file} other {# files}}', only: 'only en', z: '{n, plural, =0 {none} one {one} other {many #}}' },
  vi: { a: 'Xin chào {name}', n: '{count} tệp' },
  'pt-BR': { a: 'Olá {name}' },
};

test('t(): nội suy, số nhiều, dự phòng theo chuỗi locale → en → khoá', () => {
  const missing = [];
  const i = createI18n({ locale: 'vi-VN', fallback: 'en', catalogs, onMissing: (k, l, from) => missing.push([k, l, from]) });
  assert.equal(i.t('a', { name: 'An' }), 'Xin chào An');
  assert.equal(i.t('n', { count: 1200 }), '1.200 tệp');
  assert.equal(i.t('only'), 'only en'); assert.deepEqual(missing[0], ['only', 'vi-VN', 'en']);
  assert.equal(i.t('không.có'), 'không.có');
  assert.equal(i.t('a'), 'Xin chào {name}'); // thiếu tham số: giữ nguyên chỗ trống nhìn thấy được
  i.setLocale('en');
  assert.equal(i.t('n', { count: 1 }), '1 file'); assert.equal(i.t('n', { count: 1234 }), '1,234 files');
  assert.equal(i.t('z', { n: 0 }), 'none'); assert.equal(i.t('z', { n: 1 }), 'one'); assert.equal(i.t('z', { n: 5 }), 'many 5');
  i.setLocale('pt-BR'); assert.equal(i.t('a', { name: 'Ana' }), 'Olá Ana'); assert.equal(i.t('n', { count: 2 }), '2 files');
  assert.ok(i.has('a') && !i.has('zzz'));
});

test('matchLocale / localeChain / dirOf', () => {
  assert.deepEqual(localeChain('zh_Hant_TW'), ['zh-Hant-TW', 'zh-Hant', 'zh']);
  assert.equal(matchLocale(['fr-CA', 'vi-VN', 'en'], ['en', 'vi']), 'vi');
  assert.equal(matchLocale(['pt-PT'], ['en', 'pt-BR']), 'en'); // chưa có pt (chỉ có pt-BR): rơi về mặc định
  assert.equal(matchLocale(['PT-br'], ['en', 'pt-BR']), 'pt-BR');
  assert.equal(matchLocale([], ['vi'], 'vi'), 'vi');
  assert.equal(dirOf('ar-EG'), 'rtl'); assert.equal(dirOf('he'), 'rtl'); assert.equal(dirOf('vi'), 'ltr');
});

test('parseMessage/describeMessage: báo lỗi chuỗi sai, liệt kê tham số', () => {
  assert.deepEqual(describeMessage('{a} và {b, plural, one {# x {c}} other {# y}}'), { args: ['a', 'b', 'c'], plural: true });
  for (const bad of ['{chưa đóng', '{n, plural, one {x}}', '{n, plural, few {x} other {y}', '{ 1+1 }']) assert.throws(() => parseMessage(bad), bad);
  assert.deepEqual(parseMessage('không tham số'), ['không tham số']);
});

test('Danh mục thật của repo hợp lệ (en nguồn, vi đủ khoá, tham số khớp, khoá dùng trong mã có mặt)', () => {
  const r = spawnSync('node', ['scripts/check-i18n.mjs', '--quiet'], { cwd: path.join(import.meta.dirname, '..'), encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const dir = path.join(import.meta.dirname, '..', 'locales');
  const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.json'), 'utf8')), vi = JSON.parse(fs.readFileSync(path.join(dir, 'vi.json'), 'utf8'));
  for (const code of ['ERR_NO_NOTES', 'ERR_UNSUPPORTED_FORMAT', 'ERR_ARCHIVE_INVALID']) assert.ok(en[`errors.${code}`] && vi[`errors.${code}`], code);
});

test('check-i18n bắt lỗi thường gặp của cộng tác viên', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'loc-'));
  const w = (n, o) => fs.writeFileSync(path.join(tmp, n), JSON.stringify(o));
  const meta = (code, status = 'complete', dir = 'ltr', name = code) => ({ '@meta': { code, name, dir, status } });
  w('index.json', { source: 'en', locales: [{ code: 'en', name: 'en' }, { code: 'xx', name: 'xx' }, { code: 'yy', name: 'yy' }] });
  w('en.json', { ...meta('en', 'source'), a: 'Hi {name}', b: '{n, plural, one {# a} other {# b}}', c: 'plain' });
  w('xx.json', { ...meta('xx'), a: 'Chào {ten}', b: '{n, plural, one {# a}}', extra: 'x' }); // sai tên tham số, thiếu other, thiếu khoá c, khoá thừa
  w('yy.json', { ...meta('yy', 'partial'), a: 'Salut {name}', c: '' }); // partial được thiếu khoá, nhưng chuỗi rỗng là lỗi
  const run = (...a) => spawnSync('node', ['scripts/check-i18n.mjs', '--dir', tmp, ...a], { cwd: path.join(import.meta.dirname, '..'), encoding: 'utf8' });
  const r = run(); assert.equal(r.status, 1);
  const out = r.stderr;
  assert.match(out, /\[xx\] a: tham số/); assert.match(out, /\[xx\] b: thiếu nhánh "other"/); assert.match(out, /\[xx\] thiếu khoá: c/); assert.match(out, /\[xx\] khoá thừa.*extra/);
  assert.match(out, /\[yy\] c: chuỗi rỗng/); assert.doesNotMatch(out, /\[yy\] thiếu khoá/);
  // locale chưa liệt kê trong index.json
  w('zz.json', { ...meta('zz'), a: 'x' }); assert.match(run().stderr, /zz\.json chưa được thêm/);
  // nhánh số nhiều không tồn tại trong ngôn ngữ (vi chỉ có "other")
  w('index.json', { source: 'en', locales: [{ code: 'en', name: 'en' }, { code: 'vi', name: 'vi' }] });
  fs.rmSync(path.join(tmp, 'zz.json')); fs.rmSync(path.join(tmp, 'xx.json')); fs.rmSync(path.join(tmp, 'yy.json'));
  w('vi.json', { ...meta('vi'), a: 'Chào {name}', b: '{n, plural, one {# a} other {# b}}', c: 'thường' });
  assert.match(run().stderr, /nhánh số nhiều "one" không tồn tại trong vi/);
  void execFileSync;
});

test('check-i18n: khoá đang dùng nhưng thiếu trong locales/ là LỖI, kể cả khi viết trong biểu thức điều kiện hay bảng tra (tái hiện lỗi T-07)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'loc-'));
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'src-'));
  const w = (n, o) => fs.writeFileSync(path.join(tmp, n), JSON.stringify(o));
  const meta = (code, status) => ({ '@meta': { code, name: code, dir: 'ltr', status } });
  w('index.json', { source: 'en', locales: [{ code: 'en', name: 'en' }, { code: 'vi', name: 'vi' }] });
  const cat = { web: ['web.undo.label', 'web.redo.label', 'web.undo', 'web.redo', 'web.cmd.a', 'web.cmd.b'] };
  const body = Object.fromEntries(cat.web.map((k) => [k, k]));
  w('en.json', { ...meta('en', 'source'), ...body }); w('vi.json', { ...meta('vi', 'complete'), ...body });
  const run = () => spawnSync('node', ['scripts/check-i18n.mjs', '--dir', tmp, '--src', src], { cwd: path.join(import.meta.dirname, '..'), encoding: 'utf8' });
  // đúng hết, gồm khoá trong biểu thức điều kiện, bảng tra, tiền tố động, chuỗi trong chú thích: đạt
  fs.writeFileSync(path.join(src, 'ok.tsx'), "const a = t(kind === 'undo' ? 'web.undo.label' : 'web.redo.label');\nconst m = { undo: 'web.undo', redo: 'web.redo' };\nt(`web.cmd.${x}`); // 'web.khong.ton.tai' chỉ nằm trong chú thích\nconst url = 'http://example.com/web.js';\n");
  let r = run(); assert.equal(r.status, 0, r.stdout + r.stderr);
  // viết sai tên khoá trong biểu thức điều kiện (đúng kiểu lỗi đã lọt): phải là LỖI, không chỉ cảnh báo
  fs.writeFileSync(path.join(src, 'bad.tsx'), "const a = t(kind === 'undo' ? 'web.undo.label' : 'web.redo.lable');\n");
  r = run(); assert.equal(r.status, 1); assert.match(r.stderr, /LỖI.*khoá dùng trong mã nguồn nhưng chưa có: web\.redo\.lable \(.*bad\.tsx\)/);
  // khoá gọi trực tiếp t('...') thiếu: vẫn là lỗi
  fs.writeFileSync(path.join(src, 'bad.tsx'), "t('web.preset.open');\n");
  r = run(); assert.equal(r.status, 1); assert.match(r.stderr, /web\.preset\.open/);
  // khoá trong bảng tra của một tệp khác nhóm (không bắt đầu bằng nhóm của danh mục) không bị coi là khoá
  fs.writeFileSync(path.join(src, 'bad.tsx'), "const f = 'index.html'; const v = 'react.dom';\n");
  r = run(); assert.equal(r.status, 0, r.stdout + r.stderr);
});
