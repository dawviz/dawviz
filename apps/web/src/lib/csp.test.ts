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
