import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_LAYOUT, PANEL_LIMITS, RAIL, STAGE_MIN, TIMELINE_BAR, parseLayout, resetSize, resolveLayout, setSize, toggle } from './panelLayout.ts';

test('parseLayout: dữ liệu hỏng hoặc thiếu → mặc định; số ngoài giới hạn bị kẹp', () => {
  assert.deepEqual(parseLayout(null), DEFAULT_LAYOUT);
  assert.deepEqual(parseLayout('rác'), DEFAULT_LAYOUT);
  const l = parseLayout({ size: { layers: 9999, props: -5, timeline: 'x', tree: 320 }, collapsed: { layers: true, props: 'yes', timeline: false } });
  assert.equal(l.size.layers, PANEL_LIMITS.layers[1]);
  assert.equal(l.size.props, PANEL_LIMITS.props[0]);
  assert.equal(l.size.timeline, DEFAULT_LAYOUT.size.timeline);
  assert.equal(l.size.tree, 320);
  assert.deepEqual(l.collapsed, { layers: true, props: false, timeline: false });
  assert.equal('timeline' in parseLayout({ collapsed: {} }).collapsed, false, 'timeline chưa chọn thì để theo chế độ');
});

test('setSize / resetSize / toggle', () => {
  assert.equal(setSize(DEFAULT_LAYOUT, 'tree', 10).size.tree, PANEL_LIMITS.tree[0]);
  assert.equal(setSize(DEFAULT_LAYOUT, 'layers', 250.6).size.layers, 251);
  assert.equal(resetSize(setSize(DEFAULT_LAYOUT, 'props', 500), 'props').size.props, DEFAULT_LAYOUT.size.props);
  const t = toggle(DEFAULT_LAYOUT, 'timeline', true);
  assert.equal(t.collapsed.timeline, false);
  assert.equal(toggle(t, 'layers', false).collapsed.layers, true);
});

test('resolveLayout: timeline theo chế độ khi chưa chọn; thu gọn còn dải mỏng', () => {
  const big = { width: 1600, height: 900 };
  assert.equal(resolveLayout(DEFAULT_LAYOUT, big, false).open.timeline, false);
  assert.equal(resolveLayout(DEFAULT_LAYOUT, big, false).timeline, TIMELINE_BAR);
  assert.equal(resolveLayout(DEFAULT_LAYOUT, big, true).timeline, DEFAULT_LAYOUT.size.timeline);
  const closed = toggle(toggle(DEFAULT_LAYOUT, 'layers', false), 'props', false);
  const r = resolveLayout(closed, big, true);
  assert.equal(r.layers, RAIL); assert.equal(r.props, RAIL);
});

test('resolveLayout: cửa sổ hẹp thu cột lớn hơn trước, sân khấu giữ STAGE_MIN, không xuống dưới giới hạn', () => {
  const l = setSize(setSize(DEFAULT_LAYOUT, 'layers', 300), 'props', 500);
  const r = resolveLayout(l, { width: 1100, height: 800 }, true);
  assert.equal(r.layers + r.props + STAGE_MIN.width, 1100);
  assert.ok(r.props < 500 && r.layers === 300, 'cột Thiết lập (lớn hơn) chịu trước');
  const tiny = resolveLayout(l, { width: 600, height: 300 }, true);
  assert.equal(tiny.layers, PANEL_LIMITS.layers[0]); assert.equal(tiny.props, PANEL_LIMITS.props[0]);
  assert.equal(tiny.timeline, PANEL_LIMITS.timeline[0], 'timeline thấp bớt nhưng không dưới giới hạn');
  assert.equal(resolveLayout(l, { width: 1600, height: 900 }, true).props, 500, 'cửa sổ đủ rộng: giữ cỡ đã lưu');
});
