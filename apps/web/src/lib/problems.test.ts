import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createI18n } from '@dawviz/i18n';
import { COSMETIC_WARNINGS, describeProblem } from './problems.ts';

const i18n = createI18n({ locale: 'vi', catalogs: { en: { 'warn.WARN_X': 'EN {n}' }, vi: { 'warn.WARN_X': '{n, plural, one {# nốt} other {# nốt}} lạ' } } });
test('dịch theo mã, giữ thông điệp gốc làm chi tiết kỹ thuật', () => {
  const p = describeProblem(i18n, 'warning', 'WARN_X', 'raw message', { n: 3 });
  assert.equal(p.text, '3 nốt lạ'); assert.equal(p.technical, 'raw message');
});
test('mã chưa có bản dịch → dùng thông điệp gốc (không mất thông tin)', () => {
  const p = describeProblem(i18n, 'error', 'ERR_NEW', 'thông điệp gốc');
  assert.equal(p.text, 'thông điệp gốc'); assert.equal(p.technical, undefined);
});
test('cảnh báo không đổi hình được đánh dấu; mã lạ và mã có thể đổi hình thì không; lỗi không bao giờ', () => {
  assert.equal(describeProblem(i18n, 'warning', 'WARN_RPP_ENVELOPE_SHAPE_APPROX', 'x').cosmetic, true);
  assert.equal(describeProblem(i18n, 'warning', 'WARN_TEMPO_FALLBACK', 'x').cosmetic, undefined);   // đổi nhịp: phải thấy
  assert.equal(describeProblem(i18n, 'warning', 'WARN_NEW_UNKNOWN', 'x').cosmetic, undefined);
  assert.equal(describeProblem(i18n, 'error', 'WARN_RPP_ENVELOPE_SHAPE_APPROX', 'x').cosmetic, undefined);
  for (const c of ['WARN_TEMPO_FALLBACK', 'WARN_TEMPO_MIDI_DEFAULT', 'WARN_RPP_EXTERNAL_MIDI', 'WARN_RPP_MUTED_ITEMS', 'WARN_CLIP_SKIPPED']) assert.ok(!COSMETIC_WARNINGS.has(c), c);
});
