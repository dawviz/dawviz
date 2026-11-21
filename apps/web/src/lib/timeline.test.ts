import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { KeyAnimation, TempoPoint } from '@dawviz/render-core';
import {
  MAX_PPS, beatTimes, clampPps, clampShift, fitPps, groupRefs, keyAt, keyRef, keySecs, keysInBox, moveKeys, nextKey, parseKeyRef, prevKey,
  removeKeys, rulerLabel, rulerStep, rulerTicks, snapTime, timeToX, valueAt, xToTime, zoomAround,
} from './timeline.ts';

const TEMPO: TempoPoint[] = [{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }]; // 1 phách = 0,5 s
const anim = (...secs: number[]): KeyAnimation => ({ keys: secs.map((s, i) => ({ at: { sec: s }, value: i * 10 })) });

test('toạ độ ↔ thời gian: đi lại khớp, kẹp trong [0, thời lượng]', () => {
  assert.equal(timeToX(2.5, 100), 250);
  assert.equal(xToTime(250, 100, 10), 2.5);
  assert.equal(xToTime(-40, 100, 10), 0);
  assert.equal(xToTime(5000, 100, 10), 10);
  for (const t of [0, 0.123, 7.5, 10]) assert.ok(Math.abs(xToTime(timeToX(t, 37.3), 37.3, 10) - t) < 1e-9);
});

test('thu phóng: vừa khung, kẹp, giữ thời điểm dưới con trỏ', () => {
  assert.equal(fitPps(1000, 100), 10);
  assert.equal(fitPps(1000, 0), 100);
  assert.equal(clampPps(1, 10), 10, 'không nhỏ hơn vừa khung');
  assert.equal(clampPps(1e9, 10), MAX_PPS);
  const z = zoomAround(10, 2, 300, 200, 10); // t dưới con trỏ = (200 + 300) / 10 = 50 s
  assert.equal(z.pps, 20);
  assert.ok(Math.abs((z.scrollLeft + 300) / z.pps - 50) < 1e-9);
  assert.equal(zoomAround(10, 0.1, 100, 0, 10).scrollLeft, 0, 'không cuộn âm');
});

test('thước: bước theo thu phóng, mốc và nhãn', () => {
  assert.equal(rulerStep(10), 10); // 10 px/s → 10 s = 100 px ≥ 72
  assert.equal(rulerStep(1000), 0.1);
  assert.deepEqual(rulerTicks(0, 2, 0.5), [0, 0.5, 1, 1.5, 2]);
  assert.deepEqual(rulerTicks(3.2, 5, 1), [3, 4, 5]);
  assert.equal(rulerLabel(75, 5), '1:15');
  assert.equal(rulerLabel(1.5, 0.5), '0:01.5');
  assert.equal(rulerLabel(0.25, 0.05), '0:00.25');
});

test('mốc keyframe theo nhạc đổi ra giây; giá trị tại t đúng như Render Core', () => {
  const a: KeyAnimation = { keys: [{ at: { sec: 0 }, value: 0 }, { at: { beat: 4 }, value: 100 }] };
  assert.deepEqual(keySecs(a, TEMPO), [0, 2]);
  assert.equal(valueAt(a, 1, TEMPO), 50);
  assert.deepEqual(beatTimes(TEMPO, 2), [0, 0.5, 1, 1.5, 2]);
});

test('bắt dính: đích gần nhất trong 6 px, xa hơn thì giữ', () => {
  assert.deepEqual(snapTime(1.04, [1, 2], 100), { t: 1, snapped: true }); // 4 px
  assert.deepEqual(snapTime(1.1, [1, 2], 100), { t: 1.1, snapped: false }); // 10 px
  assert.equal(snapTime(1.02, [1, 1.03], 100).t, 1.03, 'chọn đích gần nhất');
});

test('moveKeys: dời nhiều keyframe, sắp lại, trả đúng chỉ số mới; kẹp biên', () => {
  const a = anim(0, 1, 2, 3);
  const m = moveKeys(a, [0], 2.5, 10, TEMPO); // keyframe 0 (giá trị 0) nhảy qua 1 và 2
  assert.deepEqual(m.anim.keys.map((k) => (k.at as { sec: number }).sec), [1, 2, 2.5, 3]);
  assert.deepEqual(m.idx, [2]);
  assert.equal(m.anim.keys[2].value, 0, 'đúng keyframe đã dời');
  const two = moveKeys(a, [1, 2], -0.5, 10, TEMPO);
  assert.deepEqual(two.anim.keys.map((k) => (k.at as { sec: number }).sec), [0, 0.5, 1.5, 3]);
  assert.deepEqual(two.idx, [1, 2]);
  assert.equal((moveKeys(a, [3], 50, 10, TEMPO).anim.keys[3].at as { sec: number }).sec, 10);
  const music = moveKeys({ keys: [{ at: { beat: 2 }, value: 1 }] }, [0], 0.25, 10, TEMPO);
  assert.deepEqual(music.anim.keys[0].at, { sec: 1.25 }, 'mốc theo nhạc bị dời thành mốc giây');
  assert.equal(clampShift([1, 3], -5, 10), -1);
  assert.equal(clampShift([1, 3], 20, 10), 7);
  assert.equal(clampShift([1, 3], 0.5, 10), 0.5);
});

test('removeKeys: bỏ nhiều; hết thì null', () => {
  assert.deepEqual(removeKeys(anim(0, 1, 2), [0, 2])!.keys.map((k) => k.value), [10]);
  assert.equal(removeKeys(anim(0, 1), [0, 1]), null);
});

test('vùng chọn: khoá, nhóm theo thuộc tính, chọn bằng hộp', () => {
  assert.equal(keyRef('lines.played.x', 3), 'lines.played.x#3');
  assert.deepEqual(parseKeyRef('lines.played.x#3'), { path: 'lines.played.x', i: 3 });
  assert.equal(parseKeyRef('rác'), null);
  assert.deepEqual([...groupRefs(['a#2', 'b#0', 'a#0'])], [['a', [0, 2]], ['b', [0]]]);
  const rows = [{ path: 'a', times: [0, 1, 2] }, { path: 'b', times: [0.5, 1.5] }, { path: 'c', times: [1] }];
  assert.deepEqual(keysInBox(rows, 1, 0, 2.2, 0.9), ['a#1', 'a#2', 'b#1'], 'hộp kéo ngược chiều vẫn đúng');
});

test('đi tới keyframe trước/sau, keyframe tại vạch phát', () => {
  const ts = [0, 1, 2];
  assert.equal(prevKey(ts, 1), 0);
  assert.equal(nextKey(ts, 1), 2);
  assert.equal(prevKey(ts, 0), null);
  assert.equal(nextKey(ts, 2), null);
  assert.equal(keyAt(ts, 1.001), 1);
  assert.equal(keyAt(ts, 1.5), -1);
});
