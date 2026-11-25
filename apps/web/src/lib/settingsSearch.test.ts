// Tìm thiết lập (T-60): so khớp không phân biệt hoa/thường và dấu, đủ mọi từ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterByQuery, foldText, matchesQuery, queryTerms } from './settingsSearch.ts';
import { WIDGET_FIELDS } from './widgetFields.ts';

test('foldText: bỏ dấu tiếng Việt, đ → d, chữ thường, gộp khoảng trắng', () => {
  assert.equal(foldText('  Độ   Dày Viền '), 'do day vien');
  assert.equal(foldText('Màu đã phát'), 'mau da phat');
  assert.deepEqual(queryTerms('   '), []);
});

test('matchesQuery: rỗng luôn khớp; mọi từ phải có mặt, thứ tự bất kỳ; không dấu vẫn khớp', () => {
  assert.ok(matchesQuery('Màu thanh', ''));
  assert.ok(matchesQuery('Màu thanh', 'mau'));
  assert.ok(matchesQuery('Màu thanh', 'THANH màu'));
  assert.ok(!matchesQuery('Màu thanh', 'mau vien'));
  assert.ok(matchesQuery('Bar colour', 'col'));
});

test('filterByQuery trên WIDGET_FIELDS: tìm cả ô nâng cao (adv), theo nhãn', () => {
  const fields = WIDGET_FIELDS.TIME_BAR!;
  const label = (f: (typeof fields)[number]) => f.label;
  const hits = filterByQuery(fields, label, 'barcolor');
  assert.deepEqual(hits.map((f) => f.label), ['barColor']);
  assert.ok(hits[0].adv, 'ô khớp là ô nâng cao: ở Cơ bản vẫn tìm thấy');
  assert.equal(filterByQuery(fields, label, '').length, fields.length);
});
