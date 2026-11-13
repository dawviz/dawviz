// T-08: đồng hồ chủ với AudioContext giả: phát, dừng, tua, lặp, offset âm/dương, bù độ trễ, getOutputTimestamp, rearm, chuyển chế độ không nhảy.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioEngine, type AudioContextLike, type EngineDeps, type SourceLike } from './audioEngine.ts';
import { createPlayback } from './playback.ts';

class FakeCtx implements AudioContextLike {
  currentTime = 0; state = 'running'; destination = {}; baseLatency: number | undefined = 0.01; outputLatency: number | undefined = 0.04;
  sources: (SourceLike & { starts: number[][]; stops: (number | undefined)[] })[] = [];
  listeners = new Map<string, Set<() => void>>();
  stamp: (() => { contextTime: number; performanceTime: number }) | null = null;
  getOutputTimestamp?: () => { contextTime: number; performanceTime: number };
  resumed = 0;
  resume() { this.resumed++; this.state = 'running'; return Promise.resolve(); }
  createBufferSource() {
    const s = { buffer: null as unknown, onended: null as (() => void) | null, starts: [] as number[][], stops: [] as (number | undefined)[],
      connect() {}, disconnect() {}, start(w: number, o: number, d: number) { s.starts.push([w, o, d]); }, stop(w?: number) { s.stops.push(w); } };
    this.sources.push(s); return s;
  }
  createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  addEventListener(t: string, fn: () => void) { (this.listeners.get(t) ?? this.listeners.set(t, new Set()).get(t)!).add(fn); }
  removeEventListener(t: string, fn: () => void) { this.listeners.get(t)?.delete(fn); }
  emit(t: string) { this.listeners.get(t)?.forEach((f) => f()); }
}

function rig(opts: { stamp?: boolean } = {}) {
  let now = 0, next = 1; const q = new Map<number, (n: number) => void>();
  const ctx = new FakeCtx();
  if (opts.stamp) ctx.getOutputTimestamp = () => ({ contextTime: ctx.currentTime - (ctx.baseLatency ?? 0) - (ctx.outputLatency ?? 0), performanceTime: now });
  let pump: (() => void) | null = null; let device: (() => void) | null = null;
  const deps: EngineDeps = {
    createContext: () => ctx, now: () => now,
    setInterval: (fn) => { pump = fn; return 1; }, clearInterval: () => { pump = null; },
    onDeviceChange: (fn) => { device = fn; return () => { device = null; }; },
  };
  const engine = createAudioEngine(deps);
  const p = createPlayback({ request: (cb) => { q.set(next, cb); return next++; }, cancel: (id) => void q.delete(id), now: () => now }, engine);
  const step = (ms: number) => { now += ms; ctx.currentTime += ms / 1000; const cbs = [...q.values()]; q.clear(); cbs.forEach((cb) => cb(now)); pump?.(); };
  return { ctx, p, engine, step, device: () => device?.(), now: () => now };
}
const buf = (d: number) => ({ duration: d });
const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('phát: t đứng yên đúng bằng đệm khởi động + độ trễ rồi chạy theo AudioContext; AudioContext được resume trong lúc phát', () => {
  const r = rig(); r.p.reset(30); r.p.attachAudio(buf(20));
  r.p.toggle(); assert.equal(r.p.get().playing, true);
  const src = r.ctx.sources[0]; assert.deepEqual(src.starts[0], [0.03, 0, 20]);
  r.step(50); near(r.p.get().t, 0);                 // cur 0.05: nghe được = 0 < s0 0.03
  r.step(30); near(r.p.get().t, 0);                 // cur 0.08: heard = 0.03 = s0
  r.step(1000); near(r.p.get().t, 1.0);             // cur 1.08
});
test('bù độ trễ: outputLatency thiếu → 0; độ trễ kẹp 0,5 s', () => {
  const a = rig(); a.ctx.outputLatency = undefined; a.ctx.baseLatency = 0.02; a.p.reset(30); a.p.attachAudio(buf(20)); a.p.toggle();
  a.step(1030); near(a.p.get().t, 1.0 - 0.02 + 0, 1e-6);   // cur 1.03; heard 1.01; s0 0.03 → 0.98
  const b = rig(); b.ctx.outputLatency = 5; b.p.reset(30); b.p.attachAudio(buf(20)); b.p.toggle();
  b.step(1000); near(b.p.get().t, 1.0 - 0.5 - 0.03 + 0, 1e-6);
});
test('getOutputTimestamp: nội suy theo khung, độ trễ nằm sẵn trong mốc (không trừ hai lần)', () => {
  const r = rig({ stamp: true }); r.p.reset(30); r.p.attachAudio(buf(20)); r.p.toggle();
  r.step(1000); // cur 1.0; contextTime nghe được = 1.0 − 0.05 = 0.95; trừ s0 0.03 → 0.92
  near(r.p.get().t, 0.92);
  const stampless = rig(); stampless.p.reset(30); stampless.p.attachAudio(buf(20)); stampless.p.toggle(); stampless.step(1000);
  near(stampless.p.get().t, 0.92, 1e-6); // hai nhánh cho cùng kết quả khi độ trễ ước lượng khớp
});
test('dừng: t giữ đúng vị trí nghe được, nguồn bị dừng; phát tiếp từ đó', () => {
  const r = rig(); r.p.reset(30); r.p.attachAudio(buf(20)); r.p.toggle(); r.step(2030); // t ≈ 1.98
  const t = r.p.get().t; r.p.toggle();
  assert.equal(r.p.get().playing, false); near(r.p.get().t, t, 0.02);
  assert.ok(r.ctx.sources[0].stops.length > 0, 'nguồn đã dừng');
  r.step(500); near(r.p.get().t, t, 0.02);
  r.p.toggle(); const last = r.ctx.sources.at(-1)!; near(last.starts[0][1], r.p.get().t, 0.03);
});
test('tua khi đang phát: nguồn cũ dừng, nguồn mới từ vị trí mới, t chạy tiếp từ đó; tua nhiều lần', () => {
  const r = rig(); r.p.reset(30); r.p.attachAudio(buf(20)); r.p.toggle(); r.step(1000);
  for (const target of [10, 3, 15.5]) {
    r.p.seek(target); near(r.p.get().t, target);
    const s = r.ctx.sources.at(-1)!; near(s.starts[0][1], target);
    r.step(80 + 1000); near(r.p.get().t, target + 1.0 - 0.0, 1e-6);   // 80 ms qua độ trễ+đệm, rồi 1 s
  }
  assert.ok(r.ctx.sources.slice(0, -1).every((s) => s.stops.length > 0));
});
test('tua khi dừng: chỉ đổi t, không tạo nguồn', () => {
  const r = rig(); r.p.reset(30); r.p.attachAudio(buf(20)); r.p.seek(7); assert.equal(r.p.get().t, 7); assert.equal(r.ctx.sources.length, 0);
});
test('offset dương: tiếng vào trễ; offset âm: cắt phần đầu tệp; offset đổi khi đang phát thì neo lại tại t', () => {
  const a = rig(); a.p.reset(30); a.p.attachAudio(buf(10)); a.p.setAudioOffset(500); a.p.toggle();
  near(a.ctx.sources[0].starts[0][0], 0.53); near(a.ctx.sources[0].starts[0][1], 0); near(a.ctx.sources[0].starts[0][2], 10);
  const b = rig(); b.p.reset(30); b.p.attachAudio(buf(10)); b.p.setAudioOffset(-500); b.p.toggle();
  near(b.ctx.sources[0].starts[0][0], 0.03); near(b.ctx.sources[0].starts[0][1], 0.5); near(b.ctx.sources[0].starts[0][2], 9.5);
  b.step(2030); const t = b.p.get().t; b.p.setAudioOffset(200);
  near(b.p.get().t, t, 0.02);                       // hình không nhảy
  const s = b.ctx.sources.at(-1)!; near(s.starts[0][1], t - 0.2, 0.03);  // buffer = t − offset
});
test('lặp: nguồn kế đặt trước trên trục ngữ cảnh; t quay lại đầu vòng', () => {
  const r = rig(); r.p.reset(10); r.p.attachAudio(buf(10)); r.p.setLoop({ start: 1, end: 2 }); r.p.seek(1.5); r.p.toggle();
  near(r.ctx.sources[0].starts[0][0], 0.03);  near(r.ctx.sources[0].starts[0][1], 1.5); near(r.ctx.sources[0].starts[0][2], 0.5);
  const loops = r.ctx.sources.slice(1); assert.ok(loops.length >= 2, 'đã đặt trước nhiều vòng');
  near(loops[0].starts[0][0], 0.53); near(loops[0].starts[0][1], 1); near(loops[0].starts[0][2], 1);
  near(loops[1].starts[0][0], 1.53);
  r.step(1000 + 80); // đã phát 1,0 s từ 1,5 → qua cuối vòng (2) 0,5 s trước, nay ở 1,5
  near(r.p.get().t, 1.5, 1e-6);
  for (let i = 0; i < 12; i++) r.step(500); // pump đặt thêm vòng
  assert.ok(r.ctx.sources.length > 5);
  assert.equal(r.p.get().playing, true);
});
test('hết bài không lặp: dừng ở duration', () => {
  const r = rig(); r.p.reset(2); r.p.attachAudio(buf(10)); r.p.toggle(); r.step(3000);
  assert.equal(r.p.get().playing, false); assert.equal(r.p.get().t, 2);
});
test('không dùng AudioContext khi chưa có âm thanh: đồng hồ cũ theo khung hình', () => {
  const r = rig(); r.p.reset(5); r.p.toggle(); r.step(250); near(r.p.get().t, 0.25); assert.equal(r.ctx.sources.length, 0);
});
test('chuyển chế độ khi đang phát: nạp âm thanh không nhảy t; gỡ âm thanh không nhảy t', () => {
  const r = rig(); r.p.reset(30); r.p.toggle(); r.step(1000); r.step(1000);
  const before = r.p.get().t; near(before, 2.0);
  r.p.attachAudio(buf(20));
  near(r.p.get().t, before, 1e-9);                   // ngay lúc chuyển
  r.step(10); assert.ok(r.p.get().t >= before - 1e-9 && r.p.get().t - before < 0.02, 'không lùi, không nhảy');
  r.step(1000); const mid = r.p.get().t; assert.ok(mid > before);
  r.p.attachAudio(null);                             // gỡ khi đang phát
  const after = r.p.get().t; assert.ok(Math.abs(after - mid) < 0.02);
  r.step(1000); near(r.p.get().t - after, 1.0, 1e-6);   // quay về performance.now
  assert.equal(r.p.get().playing, true);
});
test('chuyển chế độ khi đang dừng: giữ nguyên t', () => {
  const r = rig(); r.p.reset(30); r.p.seek(4.25); r.p.attachAudio(buf(20)); assert.equal(r.p.get().t, 4.25); r.p.attachAudio(null); assert.equal(r.p.get().t, 4.25);
});
test('rearm khi sinkchange: hình không nhảy, độ trễ lấy lại (nhánh dự phòng)', () => {
  const r = rig(); r.p.reset(30); r.p.attachAudio(buf(20)); r.p.toggle(); r.step(2030);
  const before = r.p.get().t;
  r.ctx.outputLatency = 0.2; r.ctx.emit('sinkchange');
  near(r.p.get().t, before, 0.02);
  const s = r.ctx.sources.at(-1)!; near(s.starts[0][1], before, 0.03);
  r.step(100); near(r.p.get().t, before, 0.02);     // 0,03 đệm + 0,21 độ trễ mới: còn đứng yên
  r.step(1000); near(r.p.get().t, before + 1.1 - 0.24 + 0, 0.05);
});
test('rearm khi devicechange và khi AudioContext chạy tiếp (statechange → running)', () => {
  const r = rig(); r.p.reset(30); r.p.attachAudio(buf(20)); r.p.toggle(); r.step(1030);
  const n0 = r.ctx.sources.length; r.device(); assert.ok(r.ctx.sources.length > n0, 'devicechange neo lại');
  const n1 = r.ctx.sources.length; r.ctx.emit('statechange'); assert.ok(r.ctx.sources.length > n1, 'chạy tiếp neo lại');
});
test('AudioContext bị treo khi đang phát → dừng giữ t; đang dừng thì rearm chỉ lấy lại độ trễ', () => {
  const r = rig(); r.p.reset(30); r.p.attachAudio(buf(20)); r.p.toggle(); r.step(1030); const t = r.p.get().t;
  r.ctx.state = 'suspended'; r.ctx.emit('statechange');
  assert.equal(r.p.get().playing, false); near(r.p.get().t, t, 0.05);
  const n = r.ctx.sources.length; r.ctx.emit('sinkchange'); assert.equal(r.ctx.sources.length, n);
});
test('tab ẩn: không có khung hình, quay lại thì t tính lại từ đồng hồ chủ, không cộng dồn', () => {
  const r = rig(); r.p.reset(60); r.p.attachAudio(buf(50)); r.p.toggle(); r.step(500);
  r.ctx.currentTime += 20; // 20 s trôi qua khi tab ẩn, rAF không chạy; getOutputTimestamp không có
  r.step(16); near(r.p.get().t, 20.516 - 0.08, 1e-6); // = giờ nghe được − s0, không cộng dồn dt
});
test('t không lùi trong một đoạn liên tục khi mốc thời gian nhiễu (nhánh getOutputTimestamp)', () => {
  const r = rig({ stamp: true }); r.p.reset(30); r.p.attachAudio(buf(20)); r.p.toggle(); r.step(1000);
  const t1 = r.p.get().t; r.ctx.currentTime -= 0.01; r.step(0); assert.ok(r.p.get().t >= t1 - 1e-12);
});
