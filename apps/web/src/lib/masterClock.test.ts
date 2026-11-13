// T-08: toán đồng hồ chủ (thuần).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deviceLatency, heardContextTime, normalizeStart, readClock, rebase, validLoop, validStamp, MAX_LATENCY } from './masterClock.ts';

const A = { t0: 2, s0: 10, rate: 1 };
test('readClock: đứng yên trước s0, tiến theo giờ nguồn, dừng ở cuối', () => {
  assert.equal(readClock(A, 9, 100, null).t, 2);
  assert.equal(readClock(A, 13, 100, null).t, 5);
  assert.deepEqual(readClock(A, 200, 20, null), { t: 20, ended: true });
  assert.equal(readClock({ ...A, rate: 2 }, 13, 100, null).t, 8);
});
test('readClock: lặp quay lại đầu vòng; t0 trước vòng vẫn chạy tới cuối vòng rồi mới lặp', () => {
  const loop = { start: 4, end: 6 };
  assert.equal(readClock({ t0: 0, s0: 0, rate: 1 }, 5, 100, loop).t, 5);
  assert.equal(readClock({ t0: 0, s0: 0, rate: 1 }, 6.5, 100, loop).t, 4.5);
  assert.equal(readClock({ t0: 0, s0: 0, rate: 1 }, 9, 100, loop).t, 5);
  assert.equal(readClock({ t0: 0, s0: 0, rate: 1 }, 9, 100, loop).ended, false);
});
test('validLoop / normalizeStart', () => {
  assert.equal(validLoop({ start: 1, end: 1.01 }, 10), false);
  assert.equal(validLoop({ start: 1, end: 3 }, 10), true);
  assert.equal(validLoop({ start: 1, end: 30 }, 10), false);
  assert.equal(normalizeStart(7, 10, { start: 1, end: 3 }), 1, 'bắt đầu sau cuối vòng → đầu vòng');
  assert.equal(normalizeStart(-3, 10, null), 0); assert.equal(normalizeStart(30, 10, null), 10);
});
test('rebase: neo lại tại đúng t đang đọc, không nhảy', () => {
  const b = rebase(A, 13, 100, null, 50);
  assert.equal(b.t0, 5); assert.equal(b.s0, 50);
  assert.equal(readClock(b, 50, 100, null).t, readClock(A, 13, 100, null).t);
});
test('deviceLatency: tổng base+output, thiếu → 0, kẹp [0; 0,5]', () => {
  assert.ok(Math.abs(deviceLatency({ baseLatency: 0.01, outputLatency: 0.04 }) - 0.05) < 1e-12);
  assert.equal(deviceLatency({ baseLatency: 0.01 }), 0.01);
  assert.equal(deviceLatency({}), 0);
  assert.equal(deviceLatency({ baseLatency: 0.4, outputLatency: 0.9 }), MAX_LATENCY);
  assert.equal(deviceLatency({ baseLatency: -1, outputLatency: NaN }), 0);
});
test('heardContextTime: dự phòng = currentTime − độ trễ', () => {
  assert.equal(heardContextTime({ currentTime: 5, running: true }, 123, 0.05), 4.95);
});
test('heardContextTime: có getOutputTimestamp thì nội suy theo khung và KHÔNG trừ độ trễ lần hai', () => {
  const c = { currentTime: 5, running: true, stamp: { contextTime: 4.9, performanceTime: 1000 } };
  assert.ok(Math.abs(heardContextTime(c, 1016, 0.2) - 4.916) < 1e-9, 'sau 16 ms khung → +0,016 s');
  assert.ok(Math.abs(heardContextTime(c, 1000, 9) - 4.9) < 1e-12, 'độ trễ truyền vào bị bỏ qua');
});
test('heardContextTime: cặp mốc không hợp lệ hoặc chưa chạy → dự phòng', () => {
  for (const stamp of [{ contextTime: 0, performanceTime: 0 }, { contextTime: NaN, performanceTime: 5 }, {}, null, undefined]) {
    assert.equal(validStamp(stamp as never), false);
    assert.equal(heardContextTime({ currentTime: 5, running: true, stamp }, 1000, 0.05), 4.95);
  }
  assert.equal(heardContextTime({ currentTime: 5, running: false, stamp: { contextTime: 4.9, performanceTime: 1000 } }, 1000, 0.05), 4.95);
});
