import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createI18n } from '@dawviz/i18n';
import { describeProblem } from './problems.ts';

const i18n = createI18n({ locale: 'vi', catalogs: { en: { 'warn.WARN_X': 'EN {n}' }, vi: { 'warn.WARN_X': '{n, plural, one {# nốt} other {# nốt}} lạ' } } });
test('dịch theo mã, giữ thông điệp gốc làm chi tiết kỹ thuật', () => {
  const p = describeProblem(i18n, 'warning', 'WARN_X', 'raw message', { n: 3 });
  assert.equal(p.text, '3 nốt lạ'); assert.equal(p.technical, 'raw message');
});
test('mã chưa có bản dịch → dùng thông điệp gốc (không mất thông tin)', () => {
  const p = describeProblem(i18n, 'error', 'ERR_NEW', 'thông điệp gốc');
  assert.equal(p.text, 'thông điệp gốc'); assert.equal(p.technical, undefined);
});
