// T-82: bộ chạy bài đo với AudioContext giả (tất định). Đo trên thiết bị thật phải thử tay.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCalibration, LEAD, type CalCtx, type CalSource } from './calibrationRunner.ts';
import { BAR_SEC, BEAT_SEC } from './latencyCalibration.ts';
import { synthKick, synthSnare } from './calibrationSounds.ts';

class Ctx implements CalCtx {
  currentTime = 0; state = 'suspended'; sampleRate = 48000; destination = {}; baseLatency = 0.01; outputLatency = 0.04;
  started: { when: number; len: number }[] = []; closed = false;
  getOutputTimestamp: CalCtx['getOutputTimestamp'] | undefined;
  async resume() { this.state = 'running'; }
  async close() { this.closed = true; }
  createBuffer(_c: number, length: number) { const d = new Float32Array(length); return { getChannelData: () => d }; }
  createBufferSource(): CalSource {
    const self = this; const s = { buffer: null as { getChannelData(c: number): Float32Array } | null, connect() {}, disconnect() {}, stop() {}, start(when: number) { self.started.push({ when, len: s.buffer!.getChannelData(0).length }); } };
    return s as unknown as CalSource;
  }
}
/** Đồng hồ giả: performance.now = currentTime × 1000 (cùng gốc), getOutputTimestamp trả giờ nghe được = currentTime − 0,05. */
function rig(opts: { stamp?: boolean } = {}) {
  const ctx = new Ctx();
  const now = () => ctx.currentTime * 1000;
  if (opts.stamp !== false) ctx.getOutputTimestamp = () => ({ contextTime: ctx.currentTime - 0.05, performanceTime: now() });
  const cal = createCalibration({ createContext: () => ctx, now });
  return { ctx, cal, now };
}

test('âm thanh tổng hợp: tất định, bắt đầu ở đỉnh, hữu hạn, trong [−1; 1]', () => {
  for (const f of [synthKick, synthSnare]) {
    const a = f(48000), b = f(48000);
    assert.deepEqual(a, b); assert.ok(a.length > 4000 && a.length < 12000);
    assert.ok(Math.abs(a[0]) >= 0.8 || Math.abs(a[1]) >= 0.8 || Math.abs(a[0]) > 0.5, 'đỉnh ngay đầu');
    assert.ok(a.every((x) => Number.isFinite(x) && Math.abs(x) <= 1));
  }
});

test('lên lịch đủ 12 tiếng (8 kick, 4 phách 3) bắt đầu sau đệm LEAD; chưa chạy thì tap bị từ chối', async () => {
  const { ctx, cal } = rig();
  assert.equal(cal.tap(0), false);
  await cal.start();
  assert.equal(ctx.started.length, 12);
  assert.equal(ctx.started[0].when, LEAD); assert.equal(cal.status().phase, 'running');
  assert.equal(ctx.started.filter((e) => e.len === synthSnare(48000).length).length, 4);
  assert.ok(Math.abs(ctx.started[2].when - (LEAD + 2 * BEAT_SEC)) < 1e-9);
});

/** Người gõ lý tưởng: gõ khi tiếng snare ĐƯỢC NGHE (currentTime = giờ snare + 0,05 độ trễ) cộng `bias` giây. */
async function play(taps: (snare: number) => number | null, opts: { stamp?: boolean } = {}) {
  const { ctx, cal } = rig(opts); await cal.start();
  const snares = [0, 1, 2, 3].map((b) => LEAD + b * BAR_SEC + 2 * BEAT_SEC);
  for (const s of snares) { const at = taps(s); if (at !== null) { ctx.currentTime = at; assert.equal(cal.tap(ctx.currentTime * 1000), true); } }
  ctx.currentTime = LEAD + 4 * BAR_SEC - 0.01; assert.equal(cal.poll(), null, 'chưa hết bài');
  ctx.currentTime = LEAD + 4 * BAR_SEC + 0.01; const r = cal.poll();
  return { r, ctx, cal };
}

test('người gõ chuẩn: gõ đúng lúc nghe được → lệch ≈ 0; trễ 20 ms → +20 ms', async () => {
  const a = await play((s) => s + 0.05); // nghe được tại s + độ trễ báo 0,05
  assert.equal(a.r!.status, 'ok'); assert.equal(a.r!.offsetMs, 0); assert.equal(a.r!.valid, 4);
  const b = await play((s) => s + 0.05 + 0.02);
  assert.equal(b.r!.offsetMs, 20); assert.equal(b.cal.status().phase, 'done'); assert.equal(b.ctx.closed, true);
});

test('độ trễ thật lớn hơn độ trễ trình duyệt báo: phần dư là độ lệch cần bù', async () => {
  const { r } = await play((s) => s + 0.05 + 0.12); // thiết bị Bluetooth: trình duyệt báo 50 ms nhưng thật 170 ms
  assert.equal(r!.offsetMs, 120); assert.equal(r!.spreadMs, 0);
});

test('thiếu lần gõ: 3 lần vẫn đủ, 2 lần thì không; gõ ngoài cửa sổ không tính', async () => {
  let i = 0;
  const three = await play((s) => (i++ === 1 ? null : s + 0.05 + 0.01));
  assert.equal(three.r!.status, 'ok'); assert.equal(three.r!.valid, 3);
  i = 0; const two = await play((s) => (i++ % 2 ? null : s + 0.05));
  assert.equal(two.r!.status, 'tooFew'); assert.equal(two.r!.offsetMs, null);
  const far = await play((s) => s + 0.05 + 0.6); // trễ 600 ms: ngoài +450
  assert.equal(far.r!.valid, 0);
});

test('không có getOutputTimestamp: dùng currentTime − độ trễ, bù độ trễ xử lý sự kiện', async () => {
  const { ctx, cal } = rig({ stamp: false }); await cal.start();
  const s = LEAD + 2 * BEAT_SEC;
  ctx.currentTime = s + 0.05 + 0.03 + 0.01;   // sự kiện xảy ra lúc nghe được = s + 0,03; đến lúc xử lý đã muộn 10 ms
  assert.equal(cal.tap((ctx.currentTime - 0.01) * 1000), true);
  ctx.currentTime = LEAD + 4 * BAR_SEC + 0.01;
  const r = cal.poll()!;
  assert.equal(r.offsets[0], 30); assert.equal(r.status, 'tooFew');
});

test('trạng thái theo ô; abort dừng và đóng ngữ cảnh', async () => {
  const { ctx, cal } = rig(); await cal.start();
  ctx.currentTime = 0.1; assert.equal(cal.status().bar, -1);
  ctx.currentTime = LEAD + 0.1; assert.equal(cal.status().bar, 0);
  ctx.currentTime = LEAD + 2.5 * BAR_SEC; assert.equal(cal.status().bar, 2);
  ctx.currentTime = LEAD + 3.9 * BAR_SEC; assert.equal(cal.status().bar, 3);
  cal.abort(); assert.equal(cal.status().phase, 'idle'); assert.equal(ctx.closed, true); assert.equal(cal.result(), null);
});

test('AudioContext lỗi → failed, không ném', async () => {
  const cal = createCalibration({ createContext: () => { throw new Error('no audio'); }, now: () => 0 });
  await cal.start(); assert.equal(cal.status().phase, 'failed');
});
