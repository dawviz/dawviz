// T-08: ánh xạ thời gian dự án ↔ tệp âm thanh; xuất không phụ thuộc độ trễ thiết bị (chỉnh 1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clampOffsetMs, exportSegments, mapToBuffer, planSegment, OFFSET_LIMIT_MS } from './audioMap.ts';
import { heardContextTime, readClock } from './masterClock.ts';

test('mapToBuffer: offset dương = âm thanh trễ, âm = sớm và cắt phần trước mốc 0', () => {
  assert.equal(mapToBuffer(1, 0), 1);
  assert.equal(mapToBuffer(1, 120), 1 - 0.12);
  assert.ok(mapToBuffer(0.05, 120) < 0, 'chưa tới đầu tệp');
  assert.equal(mapToBuffer(0, -80), 0.08, 't = 0 ứng với giây 0,08 của tệp: 80 ms đầu bị cắt');
});

test('clampOffsetMs: kẹp ±10 s, làm tròn 1 ms, không hữu hạn → 0', () => {
  assert.equal(clampOffsetMs(99999), OFFSET_LIMIT_MS);
  assert.equal(clampOffsetMs(-99999), -OFFSET_LIMIT_MS);
  assert.equal(clampOffsetMs(12.6), 13);
  assert.equal(clampOffsetMs(NaN), 0);
});

test('planSegment: offset dương dời tiếng vào trễ; offset âm bỏ phần đầu tệp; ngoài tệp → null', () => {
  const near = (a: number | undefined, b: number) => assert.ok(a !== undefined && Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
  let s = planSegment(0, 12, 500, 10)!; near(s.delay, 0.5); near(s.bufferStart, 0); near(s.length, 10);
  s = planSegment(0, 12, -500, 10)!; near(s.delay, 0); near(s.bufferStart, 0.5); near(s.length, 9.5);
  s = planSegment(3, 12, 500, 10)!; near(s.delay, 0); near(s.bufferStart, 2.5); near(s.length, 7.5);
  s = planSegment(0, 4, 0, 10)!; near(s.length, 4);
  assert.equal(planSegment(11, 12, 0, 10), null, 'sau cuối tệp');
  assert.equal(planSegment(0, 0.3, 500, 10), null, 'trước đầu tệp');
});

test('exportSegments: chêm im lặng ở phần thiếu, cắt phần thừa', () => {
  assert.deepEqual(exportSegments(0, 12, 500, 10), [
    { kind: 'silence', at: 0, length: 0.5 }, { kind: 'audio', at: 0.5, length: 10, bufferStart: 0 }, { kind: 'silence', at: 10.5, length: 1.5 },
  ]);
  assert.deepEqual(exportSegments(0, 5, -500, 10), [{ kind: 'audio', at: 0, length: 5, bufferStart: 0.5 }], 'offset âm: phần trước mốc 0 bị cắt');
  assert.deepEqual(exportSegments(20, 25, 0, 10), [{ kind: 'silence', at: 0, length: 5 }]);
  assert.deepEqual(exportSegments(5, 5, 0, 10), []);
});

test('xuất KHÔNG phụ thuộc độ trễ thiết bị: audioMap không biết độ trễ, kế hoạch xuất giống từng bit với mọi cấu hình độ trễ', () => {
  const src = readFileSync(new URL('./audioMap.ts', import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
  assert.ok(!/latency/i.test(src), 'audioMap.ts không được nhắc tới độ trễ');
  assert.ok(!/masterClock|audioEngine/.test(src), 'audioMap.ts không được import đồng hồ xem trước');
  const plans = [0, 0.01, 0.12, 0.5].map((L) => {
    // Đồng hồ xem trước đổi theo L (nhánh dự phòng)…
    const heard = heardContextTime({ currentTime: 10, running: true }, 0, L);
    assert.equal(heard, 10 - L);
    void readClock({ t0: 0, s0: 0, rate: 1 }, heard, 100, null);
    // …còn kế hoạch xuất thì không có tham số nào để L chen vào.
    return JSON.stringify(exportSegments(2, 9, 120, 6.5));
  });
  assert.equal(new Set(plans).size, 1);
  assert.equal(exportSegments.length, 4); assert.equal(planSegment.length, 4); assert.equal(mapToBuffer.length, 2);
});
