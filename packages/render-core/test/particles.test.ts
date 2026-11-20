// T-20: hạt không trạng thái: băm tất định, vị trí dạng đóng theo tuổi, giới hạn số hạt, sanitize, qua layoutFrame.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PARTICLES, buildIndex, hash32, layoutFrame, particlePrims, sanitizeScene, SCENE_SCHEMA_VERSION, strHash, unit, type ParticleProps, type RectPrim } from '../src/index.ts';
import { derivedOf, synthAst } from './helpers.ts';

const near = (a: number, b: number, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} ≠ ${b}`);
const ast = (notes: [number, number, number, number][]) => synthAst({ tracks: [{ name: 'a', color: '#ff0000', notes }, { name: 'b', color: '#0000ff', notes: [] }], duration: 20 });
const prims = (a: ReturnType<typeof ast>, props: Partial<ParticleProps>, t: number, W = 1000, H = 500) =>
  particlePrims({ ...DEFAULT_PARTICLES, ...props }, W, H, t, buildIndex(a.tracks, 20).tracks) as RectPrim[];
/** Một hạt, không ngẫu nhiên, để tính tay. */
const FLAT: Partial<ParticleProps> = { perNote: 1, velocityScale: false, spread: 0, speedSpread: 0, gravity: 0, angle: 0, speed: 100, sizeStart: 10, sizeEnd: 10, originX: 'CENTER', originY: 1, life: 2, fade: false, opacity: 1, glow: 0 };

test('băm: tất định, trong [0,1), phân bố không lệch hẳn; strHash ổn định', () => {
  assert.equal(hash32(1, 2, 3), hash32(1, 2, 3)); assert.notEqual(hash32(1, 2, 3), hash32(1, 2, 4)); assert.notEqual(hash32(1, 2, 3), hash32(2, 1, 3));
  let sum = 0; for (let i = 0; i < 5000; i++) { const u = unit(7, i, 3); assert.ok(u >= 0 && u < 1); sum += u; }
  assert.ok(Math.abs(sum / 5000 - 0.5) < 0.02); assert.equal(strHash('t0n5'), strHash('t0n5')); assert.notEqual(strHash('t0n5'), strHash('t0n6'));
});

test('vị trí dạng đóng: bay lên với tốc độ không đổi; tuổi 0,5 s ở 100 pt/s → lên 50 pt từ đáy', () => {
  const a = ast([[60, 0, 1, 100]]);                                         // nốt bắt đầu ở 0 s
  const p = prims(a, FLAT, 0.5); assert.equal(p.length, 1);
  near(p[0].x + 5, 500); near(p[0].y + 5, 500 - 50); assert.equal(p[0].w, 10); assert.equal(p[0].fill, '#ff0000'); assert.equal(p[0].radius, 5);
  const q = prims(a, FLAT, 1.5); near(q[0].y + 5, 500 - 150);
});

test('trọng lực: y thêm ½·g·tuổi²; góc 90° bay sang phải', () => {
  const a = ast([[60, 0, 1, 100]]);
  near(prims(a, { ...FLAT, speed: 0, gravity: 200 }, 1)[0].y + 5, 500 + 0.5 * 200 * 1);
  const r = prims(a, { ...FLAT, angle: 90 }, 1)[0]; near(r.x + 5, 500 + 100); near(r.y + 5, 500);
});

test('tuổi thọ và mờ dần: chưa tới nốt thì không có, hết tuổi thì mất; mờ tuyến tính; kích thước nội suy', () => {
  const a = ast([[60, 1, 1, 100]]);                                        // bắt đầu ở 0,5 s
  assert.equal(prims(a, FLAT, 0.4).length, 0); assert.equal(prims(a, FLAT, 0.5).length, 1); assert.equal(prims(a, FLAT, 2.49).length, 1); assert.equal(prims(a, FLAT, 2.5).length, 0);
  const f = prims(a, { ...FLAT, fade: true, opacity: 0.8, sizeStart: 20, sizeEnd: 0 }, 1.5); near(f[0].alpha, 0.4); near(f[0].w, 10);
  assert.equal(prims(a, FLAT, -1).length, 0);
});

test('"ngẫu nhiên" ổn định: cùng t cho cùng khung, không phụ thuộc đã vẽ t nào trước; đổi seed thì đổi; mọi hạt của một nốt khác nhau', () => {
  const a = ast([[60, 0, 1, 100], [64, 1, 1, 90]]), P = { ...DEFAULT_PARTICLES, perNote: 8 };
  const first = prims(a, P, 1.3); prims(a, P, 0.2); prims(a, P, 9);
  assert.deepEqual(prims(a, P, 1.3), first);
  assert.notDeepEqual(prims(a, { ...P, seed: 2 }, 1.3), first);
  assert.ok(new Set(first.slice(0, 8).map((r) => `${r.x.toFixed(3)},${r.y.toFixed(3)}`)).size === 8);
});

test('perNote và velocityScale: nốt mạnh sinh nhiều hơn; luôn ≥ 1 hạt', () => {
  const a = ast([[60, 0, 1, 127], [62, 0, 1, 1]]);
  const n = (vel: boolean) => prims(a, { ...FLAT, perNote: 10, velocityScale: vel, originX: 'PITCH' }, 0.1).length;
  assert.equal(n(false), 20); assert.equal(n(true), 10 + 3);               // 127 → 10; 1 → round(10·(0,3+0,7/127)) = 3
});

test('giới hạn số hạt: giữ hạt của nốt MỚI nhất', () => {
  const notes: [number, number, number, number][] = Array.from({ length: 30 }, (_, i) => [60 + (i % 12), i * 0.2, 0.1, 100]); // mỗi 0,1 s
  const a = ast(notes), p = prims(a, { ...FLAT, perNote: 4, maxParticles: 50, life: 5, originX: 'PITCH', pitchMin: 60, pitchMax: 71 }, 2.9);
  assert.equal(p.length, 50);
  const many = prims(a, { ...FLAT, perNote: 4, maxParticles: 4000, life: 5 }, 2.9).length; assert.ok(many > 50);
});

test('màu: theo track hoặc một màu; vị trí ngang theo cao độ; rải đều trong bề rộng', () => {
  const a = ast([[21, 0, 1, 100], [108, 0, 1, 100]]);
  const byPitch = prims(a, { ...FLAT, originX: 'PITCH' }, 0).map((r) => Math.round(r.x + 5)).sort((x, y) => x - y); assert.deepEqual(byPitch, [0, 1000]);
  assert.ok(prims(a, { ...FLAT, colorMode: 'SOLID', color: '#00ff00' }, 0).every((r) => r.fill === '#00ff00'));
  const sp = prims(a, { ...FLAT, perNote: 24, velocityScale: false, originX: 'SPREAD' }, 0); assert.ok(sp.every((r) => r.x + 5 >= 0 && r.x + 5 <= 1000)); assert.ok(Math.max(...sp.map((r) => r.x)) - Math.min(...sp.map((r) => r.x)) > 300);
});

test('sanitizeScene + layoutFrame: mặc định, kẹp số, pitchMin ≥ pitchMax về mặc định; widget vẽ qua layoutFrame', () => {
  const mk = (properties: object) => sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'p', type: 'PARTICLES', layout: { x: 0, y: 0, width: 600, height: 300 }, properties }] });
  const ok = mk({}); assert.deepEqual(ok.warnings, []); assert.deepEqual(ok.scene.widgets[0].properties, DEFAULT_PARTICLES);
  const bad = mk({ perNote: 999, life: 0, pitchMin: 90, pitchMax: 20, shape: 'STAR', color: 'red' }); const q = bad.scene.widgets[0].properties as ParticleProps;
  assert.equal(q.perNote, 24); assert.equal(q.life, 0.2); assert.equal(q.pitchMin, DEFAULT_PARTICLES.pitchMin); assert.equal(q.shape, 'CIRCLE'); assert.ok(bad.warnings.length >= 4);
  const a = ast([[60, 0, 1, 100]]), fr = layoutFrame(ok.scene, derivedOf(a), a, 0.5)[0];
  assert.ok(fr.prims.length >= 1 && fr.prims.every((r) => r.kind === 'rect'));
});
