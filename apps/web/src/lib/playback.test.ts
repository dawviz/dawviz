import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayback } from './playback.ts';
import { bpmAt, formatClock } from './timeFormat.ts';

function fakeFrame() {
  let now = 0, next = 1; const q = new Map<number, (n: number) => void>();
  return {
    frame: { request: (cb: (n: number) => void) => { q.set(next, cb); return next++; }, cancel: (id: number) => void q.delete(id), now: () => now },
    step(ms: number) { now += ms; const cbs = [...q.values()]; q.clear(); cbs.forEach((cb) => cb(now)); },
    pending: () => q.size,
  };
}

test('playback: phát tiến theo khung hình, dừng ở cuối, chỉ báo khi đổi; huỷ vòng khi dừng', () => {
  const f = fakeFrame(); const p = createPlayback(f.frame);
  let calls = 0; p.subscribe(() => calls++);
  p.reset(1);
  p.toggle(); assert.equal(p.get().playing, true); assert.equal(f.pending(), 1);
  f.step(250); assert.equal(Math.round(p.get().t * 1000), 250);
  f.step(1000); assert.equal(p.get().t, 1); assert.equal(p.get().playing, false); assert.equal(f.pending(), 0);
  const before = calls; p.seek(1); assert.equal(calls, before, 'không đổi thì không báo');
  p.toggle(); assert.equal(p.get().t, 0, 'phát lại từ đầu khi đang ở cuối');
  p.toggle(); assert.equal(f.pending(), 0);
});

test('playback: nudge kẹp trong [0, thời lượng]; reset quay về đầu và dừng', () => {
  const f = fakeFrame(); const p = createPlayback(f.frame);
  p.reset(10); p.nudge(-5); assert.equal(p.get().t, 0);
  p.nudge(7); assert.equal(p.get().t, 7); p.nudge(5); assert.equal(p.get().t, 10);
  p.toggle(); p.reset(3); assert.deepEqual([p.get().t, p.get().playing], [0, false]);
});

test('timeFormat: m:ss.mmm và BPM tại vị trí phát', () => {
  assert.equal(formatClock(95.0834), '1:35.083');
  assert.equal(formatClock(0), '0:00.000');
  assert.equal(formatClock(-1), '0:00.000');
  assert.equal(formatClock(600.5), '10:00.500');
  const map = [{ tick: 0, timeSeconds: 0, bpm: 120 }, { tick: 960, timeSeconds: 2, bpm: 90 }];
  assert.equal(bpmAt(map, 1.9), 120); assert.equal(bpmAt(map, 2), 90); assert.equal(bpmAt([], 1), null);
});
