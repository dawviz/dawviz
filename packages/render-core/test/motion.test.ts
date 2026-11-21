// T-15/T-17 easing và T-32 keyframe: biên, đơn điệu, tất định, mốc nhạc, màu OKLab, lặp.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EASINGS, EASING_NAMES, cubicBezier, spring, steps, curve, hold, parseEase, interpolate, compileTrack, sampleTrack, trackSpeed, mixColor, mixAngle, barBeatToTick, buildBarGrid, hexToLab, labToHex } from '../src/index.ts';

const near = (a: number, b: number, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} ≉ ${b}`);

test('easing: 30 hàm Penner + linear + 2 elastic osu!, f(0) = 0 và f(1) = 1, hữu hạn trên [0,1]', () => {
  assert.equal(EASING_NAMES.length, 1 + 30 + 2);
  for (const name of EASING_NAMES) {
    const f = EASINGS[name]; assert.equal(f(0), 0, name); assert.equal(f(1), 1, name);
    for (let i = 0; i <= 100; i++) assert.ok(Number.isFinite(f(i / 100)), `${name}(${i / 100})`);
  }
  near(EASINGS.easeInQuad(0.5), 0.25); near(EASINGS.easeOutQuad(0.5), 0.75); near(EASINGS.easeInOutCubic(0.5), 0.5); near(EASINGS.easeOutBounce(0.5), 0.765625);
  assert.ok(EASINGS.easeOutBack(0.8) > 1, 'back vọt quá 1 rồi về'); assert.ok(EASINGS.easeInBack(0.2) < 0);
});

test('easing: các nhóm In/Out đơn điệu khi cam kết (sine, quad…quint, expo, circ)', () => {
  for (const base of ['Sine', 'Quad', 'Cubic', 'Quart', 'Quint', 'Expo', 'Circ'])
    for (const dir of ['In', 'Out', 'InOut']) {
      const f = EASINGS[`ease${dir}${base}`]; let prev = -1;
      for (let i = 0; i <= 200; i++) { const y = f(i / 200); assert.ok(y >= prev - 1e-12, `${dir}${base} @${i}`); prev = y; }
    }
});

test('cubicBezier: (0,0,1,1) ≡ linear, ease CSS khớp số tham chiếu, tất định', () => {
  const lin = cubicBezier(0, 0, 1, 1); for (let i = 0; i <= 20; i++) near(lin(i / 20), i / 20, 1e-5);
  const ease = cubicBezier(0.25, 0.1, 0.25, 1);
  near(ease(0.5), 0.8024, 1e-3); // giá trị của `ease` trong CSS tại 0,5
  assert.equal(ease(0), 0); assert.equal(ease(1), 1);
  const a = [0.1, 0.33, 0.9].map(ease), b = [0.1, 0.33, 0.9].map(ease); assert.deepEqual(a, b);
  assert.ok(Number.isFinite(cubicBezier(0.9, -3, 0.1, 4)(0.4))); // điều khiển cực đoan vẫn hữu hạn
});

test('steps / hold / spring / curve', () => {
  const s = steps(4); assert.deepEqual([0, 0.24, 0.25, 0.74, 0.99, 1].map(s), [0, 0, 0.25, 0.5, 0.75, 1]);
  assert.deepEqual([0, 0.01, 0.5, 1].map(steps(2, 'start')), [0, 0.5, 0.5, 1]);
  assert.deepEqual([0, 0.5, 0.99, 1].map(hold), [0, 0, 0, 1]);
  for (const sp of [{ stiffness: 100, damping: 10 }, { stiffness: 100, damping: 20 }, { stiffness: 100, damping: 60 }, { stiffness: 300, damping: 5, mass: 2 }]) {
    const f = spring(sp); assert.equal(f(0), 0); assert.equal(f(1), 1);
    for (let i = 0; i <= 100; i++) assert.ok(Number.isFinite(f(i / 100)));
  }
  assert.ok(Math.max(...Array.from({ length: 101 }, (_, i) => spring({ damping: 4 })(i / 100))) > 1, 'dưới tắt: vọt quá 1');
  assert.ok(Math.max(...Array.from({ length: 101 }, (_, i) => spring({ damping: 80 })(i / 100))) <= 1 + 1e-9, 'quá tắt: không vọt');
  const c = curve([[0, 0], [0.5, 0.9], [1, 1]]); near(c(0.5), 0.9); assert.equal(c(0), 0); assert.equal(c(1), 1);
  let prev = -1; for (let i = 0; i <= 100; i++) { const y = c(i / 100); assert.ok(y >= prev - 1e-12 && y <= 1 + 1e-9); prev = y; } // đơn điệu, không vọt
  assert.equal(curve([])(0.5), 0.5); // chỉ có đầu/cuối → đường thẳng
});

test('parseEase: tên, đối tượng, và đầu vào sai về linear kèm ok=false', () => {
  assert.equal(parseEase('easeInQuad').fn(0.5), 0.25); assert.equal(parseEase(undefined).ok, true); assert.equal(parseEase('hold').fn(0.5), 0);
  near(parseEase({ cubicBezier: [0, 0, 1, 1] }).fn(0.3), 0.3, 1e-5); assert.equal(parseEase({ steps: 2 }).fn(0.6), 0.5); assert.equal(parseEase({ steps: [2, 'start'] }).fn(0.1), 0.5);
  assert.equal(parseEase({ spring: { damping: 10 } }).fn(1), 1); assert.equal(parseEase({ curve: [[0.5, 0.2]] }).ok, true);
  for (const bad of ['khongco', 7, { cubicBezier: [1, 2] }, { curve: [[1]] }, { x: 1 }, { cubicBezier: [0, 0, 'a', 1] }]) { const r = parseEase(bad); assert.equal(r.ok, false); assert.equal(r.fn(0.3), 0.3); }
});

test('interpolate: kiểu Remotion, kẹp hoặc kéo dài ngoài biên, easing', () => {
  assert.equal(interpolate(5, [0, 10], [0, 100]), 50); assert.equal(interpolate(-5, [0, 10], [0, 100]), 0); assert.equal(interpolate(15, [0, 10], [0, 100]), 100);
  assert.equal(interpolate(15, [0, 10], [0, 100], { extrapolateRight: 'extend' }), 150); assert.equal(interpolate(5, [0, 10], [0, 100], { ease: 'easeInQuad' }), 25);
  assert.equal(interpolate(15, [0, 10, 20], [0, 100, 0]), 50); assert.equal(interpolate(3, [], []), 0); assert.equal(interpolate(NaN, [0, 1], [0, 1]), 0);
});

const tempo = [{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }];
const ctx = { tempoMap: tempo };

test('keyframe: mốc theo giây, beat, tick và bar.beat quy về cùng giây (120 BPM: 1 beat = 0,5 s)', () => {
  const ct = compileTrack({ keys: [{ at: { sec: 0 }, value: 0 }, { at: { beat: 4 }, value: 10 }, { at: { bar: 3, beat: 1 }, value: 20 }, { at: { tick: 960 * 12 }, value: 30 }] }, ctx);
  assert.deepEqual(ct.times, [0, 2, 4, 6]);
  assert.equal(sampleTrack(ct, 1), 5); assert.equal(sampleTrack(ct, 3), 15); assert.equal(sampleTrack(ct, 5), 25);
  assert.equal(sampleTrack(ct, -1), 0, 'trước keyframe đầu giữ nguyên'); assert.equal(sampleTrack(ct, 100), 30, 'sau keyframe cuối giữ nguyên');
});

test('keyframe: bar.beat đúng khi đổi nhịp 4/4 → 3/4 giữa bài; đổi tempo thì cảnh vẫn khớp nhạc', () => {
  const map = [{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }, { tick: 3840, timeSeconds: 2, bpm: 60, timeSigNumerator: 3, timeSigDenominator: 4 }];
  const g = buildBarGrid(map);
  assert.equal(barBeatToTick(g, 2, 1), 3840); assert.equal(barBeatToTick(g, 3, 1), 3840 + 3 * 960); assert.equal(barBeatToTick(g, 3, 2), 3840 + 4 * 960);
  const ct = compileTrack({ keys: [{ at: { bar: 3, beat: 1 }, value: 1 }] }, { tempoMap: map, grid: g });
  assert.equal(ct.times[0], 2 + 3); // 3 beat ở 60 BPM sau giây thứ 2
  const slow = compileTrack({ keys: [{ at: { beat: 4 }, value: 1 }] }, { tempoMap: [{ ...tempo[0], bpm: 60 }] }); assert.equal(slow.times[0], 4);
});

test('keyframe: easing của keyframe áp cho đoạn đi tới nó; hold; smooth đơn điệu', () => {
  const e = compileTrack({ keys: [{ at: { sec: 0 }, value: 0 }, { at: { sec: 2 }, value: 100, ease: 'easeInQuad' }] }, ctx); assert.equal(sampleTrack(e, 1), 25);
  const h = compileTrack({ keys: [{ at: { sec: 0 }, value: 1, interp: 'hold' }, { at: { sec: 2 }, value: 5 }] }, ctx); assert.equal(sampleTrack(h, 1.99), 1); assert.equal(sampleTrack(h, 2), 5);
  const s = compileTrack({ keys: [0, 1, 2, 3].map((k, i) => ({ at: { sec: k }, value: [0, 10, 11, 30][i], interp: 'smooth' as const })) }, ctx);
  let prev = -1; for (let i = 0; i <= 300; i++) { const v = sampleTrack(s, i / 100) as number; assert.ok(v >= prev - 1e-9, `smooth @${i}`); assert.ok(v <= 30 + 1e-9); prev = v; }
  assert.equal(sampleTrack(s, 1), 10); assert.equal(sampleTrack(s, 3), 30);
  const jump = compileTrack({ keys: [{ at: { sec: 1 }, value: 0 }, { at: { sec: 1 }, value: 9 }] }, ctx); assert.equal(sampleTrack(jump, 1), 9, 'hai keyframe cùng mốc: nhảy bậc, lấy cái sau');
});

test('keyframe: lặp CYCLE, PINGPONG, OFFSET', () => {
  const keys = [{ at: { sec: 0 }, value: 0 }, { at: { sec: 2 }, value: 10 }];
  const c = compileTrack({ keys, loop: 'CYCLE' }, ctx), p = compileTrack({ keys, loop: 'PINGPONG' }, ctx), o = compileTrack({ keys, loop: 'OFFSET' }, ctx);
  assert.equal(sampleTrack(c, 3), 5); assert.equal(sampleTrack(c, 4.5), 2.5); assert.equal(sampleTrack(p, 3), 5); assert.equal(sampleTrack(p, 3.5), 2.5); assert.equal(sampleTrack(p, 2.5), 7.5); assert.equal(sampleTrack(p, 4.5), 2.5);
  assert.equal(sampleTrack(o, 3), 15); assert.equal(sampleTrack(o, 5), 25);
  assert.equal(sampleTrack(compileTrack({ keys }, ctx), 3), 10, 'không lặp: giữ giá trị cuối');
});

test('keyframe: màu nội suy trong OKLab (không xỉn ở giữa), góc đi đường ngắn, hex khứ hồi', () => {
  for (const h of ['#000000', '#ffffff', '#ff0000', '#3366cc', '#12345678']) assert.equal(labToHex(hexToLab(h)!), h);
  const mid = mixColor('#ff0000', '#00ff00', 0.5);
  assert.equal(mixColor('#ff0000', '#00ff00', 0), '#ff0000'); assert.equal(mixColor('#ff0000', '#00ff00', 1), '#00ff00');
  const [r, g] = [parseInt(mid.slice(1, 3), 16), parseInt(mid.slice(3, 5), 16)]; assert.ok(r > 150 && g > 150, `OKLab giữ độ sáng: ${mid}`); // RGB tuyến tính cho (128,128,0) xỉn hơn
  assert.equal(mixColor('xyz', '#ffffff', 0.5), 'xyz');
  const ct = compileTrack({ keys: [{ at: { sec: 0 }, value: '#000000' }, { at: { sec: 1 }, value: '#ffffff' }] }, ctx); assert.equal(ct.kind, 'color');
  assert.equal(sampleTrack(ct, 2), '#ffffff'); assert.equal(sampleTrack(ct, 0), '#000000');
  assert.equal(mixAngle(350, 10, 0.5), 360); assert.equal(mixAngle(10, 350, 0.5), 0);
  const ang = compileTrack({ keys: [{ at: { sec: 0 }, value: 350 }, { at: { sec: 2 }, value: 10 }], kind: 'angle' }, ctx); assert.equal(sampleTrack(ang, 1), 360);
});

test('keyframe: dữ liệu hỏng bị bỏ kèm cảnh báo, không bao giờ ném; track rỗng có giá trị mặc định', () => {
  const ct = compileTrack({ keys: [{ at: { sec: -1 }, value: 1 }, { at: { sec: 1 }, value: NaN }, { at: { sec: 2 }, value: 5, ease: 'lạ' }, { at: {} as never, value: 3 }, null as never] }, ctx);
  assert.deepEqual(ct.times, [2]); assert.ok(ct.warnings.length >= 4); assert.equal(sampleTrack(ct, 0), 5);
  assert.equal(sampleTrack(compileTrack({ keys: [] }, ctx), 3), 0); assert.equal(sampleTrack(compileTrack(undefined as never, ctx), 3), 0);
  assert.equal(sampleTrack(compileTrack({ keys: [], kind: 'color' }, ctx), 3), '#000000');
});

test('keyframe: tốc độ (speed graph) và tất định khi lấy mẫu nhiều lần theo thứ tự bất kỳ', () => {
  const ct = compileTrack({ keys: [{ at: { sec: 0 }, value: 0 }, { at: { sec: 2 }, value: 10 }] }, ctx);
  near(trackSpeed(ct, 1), 5, 1e-6); assert.equal(trackSpeed(compileTrack({ keys: [{ at: { sec: 0 }, value: '#000000' }] }, ctx), 1), 0);
  const ts = [0.3, 1.7, 0.3, 5, 1.7]; const a = ts.map((t) => sampleTrack(ct, t)), b = [...ts].reverse().map((t) => sampleTrack(ct, t)).reverse(); assert.deepEqual(a, b);
});
