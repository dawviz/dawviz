import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advance, seek, togglePlay, initialClock } from './clock.ts';

test('advance: chỉ chạy khi playing, dừng ở cuối, loop quay lại đầu', () => {
  assert.equal(advance(initialClock, 1, 10).t, 0);
  const p = { ...initialClock, playing: true };
  assert.equal(advance(p, 1.5, 10).t, 1.5);
  assert.deepEqual(advance({ ...p, t: 9.5 }, 1, 10), { t: 10, playing: false, rate: 1 });
  assert.ok(Math.abs(advance({ ...p, t: 9.5 }, 1, 10, true).t - 0.5) < 1e-9);
  assert.equal(advance({ ...p, rate: 2 }, 1, 10).t, 2);
});
test('seek kẹp [0, duration]; togglePlay ở cuối thì phát lại từ đầu', () => {
  assert.equal(seek(initialClock, -5, 10).t, 0);
  assert.equal(seek(initialClock, 99, 10).t, 10);
  const s = togglePlay({ t: 10, playing: false, rate: 1 }, 10);
  assert.equal(s.t, 0); assert.equal(s.playing, true);
  assert.equal(togglePlay(s, 10).playing, false);
});
