import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CSP, CSP_DIRECTIVES } from './csp.ts';
import { isSameOriginScript, WORKER_POLICY } from './trustedTypes.ts';

test('csp: đủ chỉ thị NFR-SEC-03/06, không unsafe-inline/unsafe-eval, không nguồn ngoài', () => {
  const m = new Map(CSP_DIRECTIVES);
  assert.equal(m.get('script-src'), "'self' 'wasm-unsafe-eval'");
  assert.equal(m.get('style-src'), "'self'");
  assert.equal(m.get('object-src'), "'none'");
  assert.equal(m.get('require-trusted-types-for'), "'script'");
  assert.equal(m.get('trusted-types'), WORKER_POLICY);
  assert.ok(!/unsafe-inline|'unsafe-eval'|https?:/.test(CSP));
});
test('trustedTypes: chỉ nhận script cùng origin', () => {
  const base = 'https://app.example/dawviz/';
  assert.ok(isSameOriginScript('/assets/parser.worker-x.js', base));
  assert.ok(isSameOriginScript('assets/w.js', base));
  assert.ok(isSameOriginScript('blob:https://app.example/1234', base));
  assert.ok(!isSameOriginScript('https://evil.example/w.js', base));
  assert.ok(!isSameOriginScript('data:text/javascript,alert(1)', base));
  assert.ok(!isSameOriginScript('javascript:alert(1)', base));
  assert.ok(!isSameOriginScript('blob:https://evil.example/1', base));
});
test('csp: theme-boot.js là script ngoài cùng origin (được script-src \'self\' cho chạy), không có script nội tuyến', async () => {
  const { readFileSync } = await import('node:fs');
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length >= 2);
  for (const [, attrs, body] of scripts) {
    const src = /\bsrc="([^"]+)"/.exec(attrs)?.[1];
    assert.ok(src, `script nội tuyến bị CSP chặn: ${body.slice(0, 40)}`);
    assert.equal(body.trim(), '');
    assert.ok(src.startsWith('/') && !src.startsWith('//'), `script phải cùng origin: ${src}`);
  }
  const boot = scripts.find(([, a]) => a.includes('src="/theme-boot.js"'));
  assert.ok(boot, 'index.html phải nạp /theme-boot.js');
  assert.ok(!/\btype="module"/.test(boot[1]), 'theme-boot.js chạy đồng bộ trong <head> để áp theme trước lần vẽ đầu');
  assert.ok(html.indexOf('theme-boot.js') < html.indexOf('</head>'));
  // Tệp phải nằm trong public/ để Vite chép nguyên vào bản build, và không dùng sink bị Trusted Types/CSP chặn.
  const code = readFileSync(new URL('../../public/theme-boot.js', import.meta.url), 'utf8');
  assert.ok(!/\beval\s*\(|new\s+Function|innerHTML|outerHTML|document\.write|insertAdjacentHTML|\.style\s*=|setAttribute\(\s*['"]style/.test(code));
});
test('csp: media-src cho phép blob: (dò thời lượng tệp âm thanh, T-08) và không có nguồn ngoài', () => {
  const m = new Map(CSP_DIRECTIVES).get('media-src')!;
  assert.match(m, /(^|\s)blob:/); assert.match(m, /'self'/); assert.ok(!/https?:|\*/.test(m));
});
