// T-53: widget Audio Spectrum: mức theo thời gian, hình học LINE (xoay mọi góc) và CIRCLE, làm mượt, sanitize, vẽ có xoay.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMono, layoutFrame, sanitizeScene, SCENE_SCHEMA_VERSION, renderFrame, DEFAULT_SPECTRUM, spectrumLevels, spectrumPrims, poolBands, smoothedBands,
  type RectPrim, type SceneDocument, type SpectrumProps } from '../src/index.ts';
import { synthAst, derivedOf, recCtx } from './helpers.ts';

const SR = 48000;
// 0–1 s: sin 200 Hz; 1–2 s: sin 4 kHz; 2–3 s: im lặng.
const sig = Float32Array.from({ length: SR * 3 }, (_, i) => (i < SR ? 0.5 * Math.sin(2 * Math.PI * 200 * i / SR) : i < 2 * SR ? 0.5 * Math.sin(2 * Math.PI * 4000 * i / SR) : 0));
const features = analyzeMono(sig, SR);
const audio = { features, offsetSec: 0 };
const P = (o: Partial<SpectrumProps> = {}): SpectrumProps => ({ ...DEFAULT_SPECTRUM, bars: 32, attackMs: 0, releaseMs: 0, ...o });
const peakBar = (l: ArrayLike<number>) => { let k = 0; for (let i = 1; i < l.length; i++) if (l[i] > l[k]) k = i; return k; };

test('mức theo thời gian: 200 Hz ở cột thấp, 4 kHz ở cột cao, im lặng thì 0; không có âm thanh thì 0', () => {
  const a = spectrumLevels(P(), audio, 0.5), b = spectrumLevels(P(), audio, 1.5), c = spectrumLevels(P(), audio, 2.5);
  assert.ok(peakBar(a) < peakBar(b)); assert.ok(a[peakBar(a)] > 0.6 && b[peakBar(b)] > 0.6);
  assert.ok(c.every((v) => v === 0)); assert.ok(spectrumLevels(P(), undefined, 0.5).every((v) => v === 0));
  assert.ok(spectrumLevels(P(), audio, -1).every((v) => v === 0), 't âm → 0');
});

test('offset âm thanh dời mốc đọc: offset +1 s thì 200 Hz xuất hiện ở t = 1,5', () => {
  const l = spectrumLevels(P(), { features, offsetSec: 1 }, 1.5);
  assert.ok(Math.abs(peakBar(l) - peakBar(spectrumLevels(P(), audio, 0.5))) <= 0);
});

test('làm mượt: release dài thì mức sau khi tắt giảm dần; attack/release 0 thì bám tức thì', () => {
  const fast = spectrumLevels(P({ releaseMs: 0 }), audio, 2.1), slow = spectrumLevels(P({ releaseMs: 800 }), audio, 2.1);
  const k = peakBar(spectrumLevels(P(), audio, 1.5));
  assert.ok(slow[k] > fast[k] + 0.1, `${slow[k]} vs ${fast[k]}`);
  const t0 = smoothedBands(features, 0, 50, 200); assert.equal(t0.length, features.bands); assert.ok(smoothedBands(features, -1, 1, 1).every((v) => v === 0));
});

test('poolBands: gộp lấy lớn nhất, khoảng hẹp thì nội suy, cắt dải tần', () => {
  const bands = Float64Array.from({ length: 128 }, (_, i) => (i === 64 ? 200 : 0));
  const full = poolBands(bands, features, 16, features.minHz, features.maxHz); assert.equal(Math.max(...full), 200); assert.equal(peakBar(full), 8);
  const narrow = poolBands(bands, features, 256, features.minHz, features.maxHz); assert.equal(narrow.length, 256); assert.ok(narrow.every(Number.isFinite));
  const hiOnly = poolBands(bands, features, 8, 8000, 16000); assert.equal(Math.max(...hiOnly), 0);
});

const W = 800, H = 400;
test('LINE góc 0: cột đều nhau trên một đường ngang, mọc lên, cả hình nằm quanh tâm khung, không xoay', () => {
  const lv = new Float64Array(32).fill(1);
  const r = spectrumPrims(P({ shape: 'LINE', length: 640, thickness: 100, barWidth: 0.5 }), W, H, lv) as RectPrim[];
  assert.equal(r.length, 32); assert.ok(r.every((x) => x.rotation === undefined && x.h === 100 && Math.abs(x.w - 10) < 1e-9));
  assert.ok(Math.abs((r[0].x + r[0].w / 2) - (W / 2 - 320 + 10)) < 1e-9); assert.ok(Math.abs(r[1].x - r[0].x - 20) < 1e-9);
  assert.ok(Math.abs(r[0].y - (H / 2 - 50)) < 1e-9, 'khối cao 100 nằm giữa khung');
  const quiet = spectrumPrims(P({ minLen: 4 }), W, H, new Float64Array(32)) as RectPrim[]; assert.ok(quiet.every((x) => x.h === 4));
});

test('LINE xoay mọi góc: góc 90° đặt đường theo chiều dọc, cột mang đúng góc xoay; 360° ≡ 0°', () => {
  const lv = new Float64Array(32).fill(0.5);
  const v = spectrumPrims(P({ angle: 90, length: 320 }), W, H, lv) as RectPrim[];
  assert.ok(v.every((x) => x.rotation === 90));
  const cx = v.map((x) => x.x + x.w / 2), cy = v.map((x) => x.y + x.h / 2);
  assert.ok(Math.max(...cx) - Math.min(...cx) < 1e-6 + 100, 'cột thẳng hàng dọc (lệch ngang chỉ do chiều cao cột)');
  assert.ok(cy[31] - cy[0] > 290 && cy[31] > cy[0], 'tần số tăng dần từ trên xuống dưới');
  const a = spectrumPrims(P({ angle: 0 }), W, H, lv), b = spectrumPrims(P({ angle: 0 }), W, H, lv); assert.deepEqual(a, b);
  const rot45 = spectrumPrims(P({ angle: 45 }), W, H, lv) as RectPrim[]; assert.ok(rot45.every((x) => x.rotation === 45));
});

test('LINE: mirror mọc hai phía quanh đường, reverse đảo chiều tần số, GRADIENT đổi màu theo tần số', () => {
  const lv = Float64Array.from({ length: 32 }, (_, i) => (i === 0 ? 1 : 0.2));
  const m = spectrumPrims(P({ mirror: true, thickness: 100 }), W, H, lv) as RectPrim[];
  assert.ok(Math.abs(m[0].y + m[0].h / 2 - H / 2) < 1e-9, 'tâm cột trùng đường nền');
  const r = spectrumPrims(P({ reverse: true, thickness: 100 }), W, H, lv) as RectPrim[]; assert.ok(r[31].h > r[0].h);
  const g = spectrumPrims(P({ colorMode: 'GRADIENT', color: '#000000', colorB: '#ffffff' }), W, H, lv) as RectPrim[];
  assert.equal(g[0].fill, '#000000'); assert.equal(g[31].fill, '#ffffff'); assert.notEqual(g[10].fill, g[20].fill);
});

test('CIRCLE: cột toả quanh tâm, cột đầu ở đỉnh (startAngle 0), góc xoay tăng theo chiều kim đồng hồ, bán kính trong giữ nguyên', () => {
  const lv = new Float64Array(32).fill(1);
  const c = spectrumPrims(P({ shape: 'CIRCLE', radius: 100, thickness: 50 }), W, H, lv) as RectPrim[];
  assert.equal(c.length, 32);
  c.forEach((x, j) => {
    const phi = (j + 0.5) / 32 * 360; assert.ok(Math.abs((x.rotation ?? 0) - phi) < 1e-9);
    const mx = x.x + x.w / 2 - W / 2, my = x.y + x.h / 2 - H / 2; assert.ok(Math.abs(Math.hypot(mx, my) - 125) < 1e-6, 'tâm cột cách tâm 100 + 25');
  });
  assert.ok(c[0].y + c[0].h / 2 < H / 2 && Math.abs(c[0].x + c[0].w / 2 - W / 2) < 30, 'cột đầu gần đỉnh');
  const s = spectrumPrims(P({ shape: 'CIRCLE', startAngle: 90 }), W, H, lv) as RectPrim[]; assert.ok(Math.abs((s[0].rotation ?? 0) - (90 + 360 / 64)) < 1e-9);
});

test('CIRCLE mirror: hai nửa vòng đối xứng nhau theo trục dọc', () => {
  const lv = Float64Array.from({ length: 32 }, (_, i) => i / 31);
  const c = spectrumPrims(P({ shape: 'CIRCLE', mirror: true, thickness: 100 }), W, H, lv) as RectPrim[];
  for (let j = 0; j < 16; j++) assert.ok(Math.abs(c[j].h - c[31 - j].h) < 1e-9, `cột ${j}`);
});

test('sanitizeScene: mặc định, kẹp số, minHz ≥ maxHz và ceilDb ≤ floorDb quay về mặc định kèm cảnh báo; góc chuẩn hoá', () => {
  const mk = (properties: object) => sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 's', type: 'AUDIO_SPECTRUM', layout: {}, properties }] });
  const ok = mk({}); assert.deepEqual(ok.warnings, []); assert.deepEqual(ok.scene.widgets[0].properties, DEFAULT_SPECTRUM);
  const bad = mk({ bars: 9999, shape: 'SPIRAL', minHz: 9000, maxHz: 100, floorDb: -20, ceilDb: -30, angle: 540, color: 'red' });
  const p = bad.scene.widgets[0].properties as SpectrumProps;
  assert.equal(p.bars, 256); // REQ-WIDGET-07: 8–256 cột assert.equal(p.shape, 'LINE'); assert.equal(p.minHz, DEFAULT_SPECTRUM.minHz); assert.equal(p.ceilDb, DEFAULT_SPECTRUM.ceilDb); assert.equal(p.color, DEFAULT_SPECTRUM.color);
  assert.ok(p.angle > -180 && p.angle <= 180); assert.ok(bad.warnings.length >= 4);
});

const sceneOf = (props: object): SceneDocument => sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 's', type: 'AUDIO_SPECTRUM', layout: { x: 0, y: 0, width: 800, height: 400 }, properties: props }] }).scene;

test('layoutFrame: có âm thanh thì cột cao theo mức; chưa có âm thanh thì cột thấp nhất; tất định', () => {
  const ast = synthAst({ duration: 3 }), sc = sceneOf({ bars: 32, attackMs: 0, releaseMs: 0 });
  const withAudio = layoutFrame(sc, derivedOf(ast, { audio }), ast, 0.5)[0].prims as RectPrim[];
  const none = layoutFrame(sc, derivedOf(ast), ast, 0.5)[0].prims as RectPrim[];
  assert.ok(Math.max(...withAudio.map((x) => x.h)) > Math.max(...none.map((x) => x.h)) + 50); assert.ok(none.every((x) => x.h === DEFAULT_SPECTRUM.minLen));
  assert.deepEqual(layoutFrame(sc, derivedOf(ast, { audio }), ast, 0.5)[0].prims, withAudio);
});

test('vẽ: cột xoay dùng translate/rotate quanh tâm rồi save/restore, cột không xoay thì fillRect thẳng', () => {
  const ast = synthAst({ duration: 3 }), d = derivedOf(ast, { audio });
  const a = recCtx(); renderFrame(sceneOf({ bars: 8, angle: 0 }), d, ast, 0.5, { ctx: a.ctx, width: 800, height: 400 }, 1);
  assert.ok(!a.log.some((l) => l.startsWith('rotate(')));
  const b = recCtx(); renderFrame(sceneOf({ bars: 8, angle: 30 }), d, ast, 0.5, { ctx: b.ctx, width: 800, height: 400 }, 1);
  assert.equal(b.log.filter((l) => l.startsWith('rotate(')).length, 8); assert.ok(b.log.some((l) => /^rotate\(0\.5236\)/.test(l)));
  assert.equal(b.log.filter((l) => l === 'save()').length, b.log.filter((l) => l === 'restore()').length);
});

test('T-53 kiểu khác: vùng/đường/chấm theo phổ; dao động ký từ bảng dạng sóng; sóng âm cả bài có phần đã phát; đồng hồ đỉnh/RMS; tất định', async () => {
  const { styledPrims, scopeSamples, waveformColumns, meterLevels, peakCaps, scaleEdge, SPECTRUM_STYLES } = await import('../src/index.ts');
  // bảng dạng sóng: có, ~4 kHz, chia khối không đổi kết quả
  assert.ok(features.scope && features.scope.length > 11000 && Math.abs(features.scopeRate! - 4000) < 1);
  const sc = scopeSamples(P({ scopeMs: 10 }), audio, 0.5);
  assert.equal(sc.length, 40); assert.ok(Math.max(...sc) > 0.3 && Math.min(...sc) < -0.3); // sin 200 Hz biên độ 0,5
  assert.ok(scopeSamples(P(), audio, 2.5).every((v) => v === 0)); // im lặng
  const cols = waveformColumns(features, 30);
  assert.ok(cols[5] > 0.3 && cols[25] === 0); assert.equal(waveformColumns(features, 30), cols); // đệm
  const m = meterLevels(P({ floorDb: -60, ceilDb: 0 }), audio, 0.5);
  assert.ok(m.peak > m.rms && m.rms > 0 && m.hold >= m.peak);
  assert.ok(meterLevels(P({ floorDb: -60, ceilDb: 0 }), audio, 2.8).hold > 0); // giữ đỉnh ~1,5 s sau khi tắt
  assert.ok(peakCaps(P({ peakCap: true }), audio, 2.2).some((v) => v > 0)); // chấm đỉnh còn rơi sau khi im
  // thang tần số
  assert.equal(scaleEdge('LINEAR', 100, 1100, 1, 2), 600); assert.ok(Math.abs(scaleEdge('LOG', 100, 10000, 1, 2) - 1000) < 1e-9);
  const melMid = scaleEdge('MEL', 100, 10000, 1, 2); assert.ok(melMid > 1000 && melMid < 5050);
  for (const style of SPECTRUM_STYLES) for (const shape of ['LINE', 'CIRCLE'] as const) for (const mirror of [false, true]) {
    const p = P({ style, shape, mirror, peakCap: true }), a = styledPrims(p, 800, 300, audio, 0.6), b = styledPrims(p, 800, 300, audio, 0.6);
    assert.deepEqual(a, b, `${style}/${shape}`);
    assert.ok(a.length > 0, `${style}/${shape}/${mirror} không vẽ gì`);
    for (const q of a) if (q.kind === 'rect') for (const v of [q.x, q.y, q.w, q.h]) assert.ok(Number.isFinite(v), `${style}/${shape}`);
    else if (q.kind === 'path') assert.ok(q.item.d!.every(Number.isFinite), `${style}/${shape}`);
    // không có âm thanh: không ném
    styledPrims(p, 800, 300, undefined, 0.6);
  }
  // sóng âm cả bài: phần đã phát đổi màu theo t
  const wf = (t: number) => styledPrims(P({ style: 'WAVEFORM', playedColor: '#ff0000' }), 800, 300, audio, t).filter((q) => q.kind === 'rect' && q.fill === '#ff0000').length;
  assert.ok(wf(0.3) < wf(2.5));
});

test('T-130 đỉnh phổ: mặc định đúng như trước; giữ peakHold giây rồi mới rơi; gia tốc làm rơi nhanh dần; tua tới/lui cùng kết quả', async () => {
  const { peakCaps, peakDrop, frameAt, u8ToDb } = await import('../src/index.ts');
  // bản sao thuật toán trước T-130 (rơi đều capFall, cửa sổ 1,5 s): mặc định phải ra đúng từng số
  const legacy = (p: SpectrumProps, t: number) => {
    const out = new Float64Array(p.bars), ft = features, f = frameAt(ft, t);
    if (f < 0) return out;
    const K = Math.min(f, Math.round(1.5 / ft.hop)), lo = p.floorDb, hi = Math.max(p.ceilDb, lo + 1), row = new Float64Array(ft.bands);
    for (let k = 0; k <= K; k++) {
      for (let b = 0; b < ft.bands; b++) row[b] = ft.spectrum[(f - k) * ft.bands + b];
      const pooled = poolBands(row, ft, p.bars, p.minHz, p.maxHz, p.scale), drop = p.capFall * k * ft.hop;
      for (let j = 0; j < p.bars; j++) { const v = (pooled[j] <= 0 ? 0 : Math.min(1, Math.max(0, (u8ToDb(pooled[j]) - lo) / (hi - lo)))) - drop; if (v > out[j]) out[j] = v; }
    }
    return out;
  };
  for (const capFall of [0.1, 0.6, 3]) for (const t of [0, 0.3, 1.2, 1.99, 2.05, 2.4, 2.9]) assert.deepEqual(peakCaps(P({ peakCap: true, capFall }), audio, t), legacy(P({ capFall }), t), `capFall ${capFall} t ${t}`);
  // quãng rơi: đứng yên peakHold giây, rồi đều (gia tốc 0) hoặc nhanh dần
  assert.equal(peakDrop({ capFall: 0.6, peakHold: 0.5, peakGravity: 0 }, 0.5), 0);
  assert.ok(Math.abs(peakDrop({ capFall: 0.6, peakHold: 0.5, peakGravity: 0 }, 0.8) - 0.18) < 1e-12);
  assert.ok(Math.abs(peakDrop({ capFall: 0.6, peakHold: 0, peakGravity: 2 }, 0.5) - (0.3 + 0.25)) < 1e-12);
  // tín hiệu 4 kHz tắt ở 2 s: cột cao nhất của đoạn đó
  const k = peakBar(spectrumLevels(P(), audio, 1.5)), L = peakCaps(P({ peakCap: true }), audio, 1.99)[k];
  assert.ok(L > 0.6);
  const held = (t: number) => peakCaps(P({ peakCap: true, peakHold: 0.5 }), audio, t)[k];
  assert.ok(Math.abs(held(2.2) - L) < 0.03 && Math.abs(held(2.45) - L) < 0.03, `giữ: ${held(2.2)} ${held(2.45)} vs ${L}`);
  assert.ok(peakCaps(P({ peakCap: true }), audio, 2.45)[k] < L - 0.2, 'không giữ thì đã rơi');
  assert.ok(Math.abs(held(2.8) - (L - 0.6 * 0.3)) < 0.03, `sau khi giữ rơi đều: ${held(2.8)}`);
  // gia tốc: rơi nhanh dần (mỗi 0,1 s rơi nhiều hơn 0,1 s trước), và thấp hơn rơi đều
  const g = (t: number) => peakCaps(P({ peakCap: true, peakGravity: 4 }), audio, t)[k];
  const d1 = g(2.1) - g(2.2), d2 = g(2.2) - g(2.3);
  assert.ok(d1 > 0 && d2 > d1 + 0.02, `${d1} ${d2}`);
  assert.ok(g(2.3) < peakCaps(P({ peakCap: true }), audio, 2.3)[k] - 0.1);
  // tua tới, tua lui, nhảy cóc: cùng giá trị tại cùng t (không giữ trạng thái giữa các khung)
  const p = P({ peakCap: true, peakHold: 0.3, peakGravity: 3 }), ts = [0.2, 0.9, 1.4, 1.98, 2.1, 2.35, 2.7];
  const fwd = ts.map((t) => peakCaps(p, audio, t)), back = [...ts].reverse().map((t) => peakCaps(p, audio, t)).reverse();
  const jump = [3, 0, 5, 1, 6, 2, 4].map((i) => [i, peakCaps(p, audio, ts[i])] as const);
  assert.deepEqual(back, fwd); for (const [i, v] of jump) assert.deepEqual(v, fwd[i]);
});

test('T-130 vẽ đỉnh: Vạch như trước, Chấm là chấm tròn lơ lửng; màu đỉnh; kiểu Chấm cũng có đỉnh; cả hình Thẳng và Tròn', async () => {
  const { styledPrims, spectrumPrims: sp } = await import('../src/index.ts');
  const N = 32, t = 2.2, caps = (o: Partial<SpectrumProps>) => (styledPrims(P({ peakCap: true, ...o }), 800, 300, audio, t) as RectPrim[]).slice(N);
  for (const shape of ['LINE', 'CIRCLE'] as const) {
    const base = sp(P({ shape }), 800, 300, spectrumLevels(P({ shape }), audio, t));
    const all = styledPrims(P({ peakCap: true, shape }), 800, 300, audio, t) as RectPrim[];
    assert.deepEqual(all.slice(0, N), base, 'cột không đổi');
    const line = all.slice(N);
    assert.ok(line.length > 0 && line.every((q) => q.h === 2 && q.radius === 0 && q.fill === DEFAULT_SPECTRUM.color), `${shape}: vạch mặc định`);
    const dots = caps({ shape, peakStyle: 'DOT', peakColor: '#ff0000' });
    assert.equal(dots.length, line.length);
    assert.ok(dots.every((q) => q.w === q.h && q.radius === q.w / 2 && q.fill === '#ff0000' && !q.rotation), `${shape}: chấm tròn màu đỉnh`);
  }
  // LINE góc 0: chấm nằm trên vạch (y nhỏ hơn) vì lơ lửng cách đỉnh nửa đường kính
  const ln = caps({}), dt = caps({ peakStyle: 'DOT' });
  assert.ok(dt.every((q, i) => q.y + q.h / 2 < ln[i].y + ln[i].h / 2));
  // kiểu Chấm (DOTS) cũng vẽ đỉnh khi bật; tắt thì không
  const dotsOn = styledPrims(P({ style: 'DOTS', peakCap: true }), 800, 300, audio, t), dotsOff = styledPrims(P({ style: 'DOTS' }), 800, 300, audio, t);
  assert.equal(dotsOff.length, N); assert.ok(dotsOn.length > N);
});

test('T-130 sanitize: hình đỉnh, giữ, gia tốc, màu đỉnh (rỗng = theo cột)', () => {
  const mk = (properties: object) => sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 's', type: 'AUDIO_SPECTRUM', layout: {}, properties }] });
  const ok = mk({ peakStyle: 'DOT', peakHold: 0.4, peakGravity: 3, peakColor: '#ff8800' });
  assert.deepEqual(ok.warnings, []); assert.deepEqual(ok.scene.widgets[0].properties, { ...DEFAULT_SPECTRUM, peakStyle: 'DOT', peakHold: 0.4, peakGravity: 3, peakColor: '#ff8800' });
  const bad = mk({ peakStyle: 'STAR', peakHold: 99, peakGravity: -1, peakColor: 'red' }), p = bad.scene.widgets[0].properties as SpectrumProps;
  assert.equal(p.peakStyle, 'LINE'); assert.equal(p.peakHold, 5); assert.equal(p.peakGravity, 0); assert.equal(p.peakColor, '');
  assert.ok(bad.warnings.length >= 4);
});
