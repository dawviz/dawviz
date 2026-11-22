import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ADDABLE_WIDGETS } from '@dawviz/render-core';
import { rowKeys, rowOfPath, timelineRows, visibleKeyCount } from './timelineRows.ts';

test('timelineRows: nhóm Biến đổi = Vị trí (x+y), Tỉ lệ, Xoay, Độ đục; Rộng/Cao chỉ khi đã animate', () => {
  for (const type of [...ADDABLE_WIDGETS, 'PIANO_ROLL' as const]) {
    const r = timelineRows(type).filter((x) => x.group === 'transform');
    assert.deepEqual(r.map((x) => x.id), ['position', 'scale', 'layout.rotation', 'opacity'], type);
    assert.deepEqual(r[0].paths, ['layout.x', 'layout.y']);
  }
  const legacy = timelineRows('TIME_BAR', { 'layout.width': { keys: [{ at: { sec: 0 }, value: 10 }] } });
  assert.ok(legacy.some((x) => x.id === 'layout.width') && !legacy.some((x) => x.id === 'layout.height'));
  const props = timelineRows('TIME_BAR').filter((x) => x.group === 'props');
  assert.ok(props.length > 0 && props.every((x) => x.paths.length === 1 && x.id === x.paths[0]));
  const pr = timelineRows('PIANO_ROLL').filter((x) => x.group === 'props').map((x) => x.id);
  assert.ok(pr.includes('visibleSeconds') && pr.includes('noteStyle.base.glow') && !pr.includes('pitchMin')); // Piano Roll: danh sách đường dẫn riêng
  assert.equal(rowOfPath(timelineRows('TIME_BAR'), 'layout.y')!.id, 'position');
});

test('rowKeys: keyframe x và y cùng thời điểm thành một hình thoi; lệch thời điểm thì riêng', () => {
  const row = timelineRows('TIME_BAR')[0];
  const times = new Map([['layout.x', [0, 1, 3]], ['layout.y', [0, 2, 3.0001]]]);
  const v = rowKeys(row, times);
  assert.deepEqual(v.map((k) => k.t), [0, 1, 2, 3]);
  assert.deepEqual(v[0].refs.sort(), ['layout.x#0', 'layout.y#0']);
  assert.deepEqual(v[3].refs.sort(), ['layout.x#2', 'layout.y#2']);
  // hai keyframe cùng đường dẫn sát nhau không bị gộp
  assert.equal(rowKeys(timelineRows('TIME_BAR')[2], new Map([['layout.rotation', [1, 1.001]]])).length, 2);
});

test('visibleKeyCount: đếm hình thoi thấy được, không đếm x và y riêng', () => {
  const rows = timelineRows('TIME_BAR');
  const picked = [{ path: 'layout.x', t: 0 }, { path: 'layout.y', t: 0 }, { path: 'scale', t: 0 }, { path: 'layout.rotation', t: 0 }, { path: 'opacity', t: 0 }];
  assert.equal(visibleKeyCount(rows, picked), 4);
  assert.equal(visibleKeyCount(rows, [{ path: 'layout.x', t: 0 }, { path: 'layout.y', t: 2 }]), 2);
});
