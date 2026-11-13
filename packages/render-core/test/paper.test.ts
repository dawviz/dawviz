// T-69: preset "Paper" 1:1. sanitizeScene đọc được không cảnh báo; chuỗi lệnh vẽ mẫu (golden) ở vài mốc t; tất định.
// Cập nhật golden: UPDATE_GOLDEN=1 node --test packages/render-core/test/paper.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { sanitizeScene, renderFrame, layoutFrame, SCENE_SCHEMA_VERSION } from '../src/index.ts';
import { synthAst, derivedOf, recCtx } from './helpers.ts';

const PRESET = new URL('../../../presets/scene/paper-1x1.json', import.meta.url);
const GOLDEN = new URL('./golden/paper-1x1.json', import.meta.url);
const T = [0, 0.75, 2.6, 4.4];
const raw = () => JSON.parse(fs.readFileSync(PRESET, 'utf8'));

test('paper-1x1: sanitizeScene đọc không cảnh báo, vòng lưu → đọc lại không đổi, đủ widget theo bảng 1.2', () => {
  const { scene, warnings } = sanitizeScene(raw());
  assert.deepEqual(warnings, []);
  assert.equal(scene.schemaVersion, SCENE_SCHEMA_VERSION);
  assert.deepEqual([scene.canvas.designWidth, scene.canvas.designHeight, scene.canvas.backgroundColor, scene.canvas.aspectRatio], [1080, 1080, '#FFFFFF', '1:1']);
  assert.deepEqual(scene.widgets.map((w) => w.type), ['PIANO_ROLL', 'TRACK_INFO', 'EVENT_COUNTER', 'LIVE_TRIGGER', 'TIME_BAR', 'CHORD_DETECTION', 'PROGRESS_BAR']);
  assert.deepEqual(sanitizeScene(JSON.parse(JSON.stringify(scene))).scene, scene);
  const pr: any = scene.widgets[0].properties;
  assert.deepEqual([pr.noteStyle.base.playedColor, pr.noteStyle.base.upcomingColor, pr.playheadColor, pr.playheadPositionRatio], ['#383838', '#C4C4C4', '#E06666', 0.84]);
  for (const w of scene.widgets) assert.ok(w.layout.x >= 0 && w.layout.y >= 0 && w.layout.x + w.layout.width <= 1080 && w.layout.y + w.layout.height <= 1080, `${w.id} nằm ngoài khung`);
});

test('paper-1x1 và paper-16x9: không dùng tên, bài hay nhận diện của kênh tham chiếu', () => {
  for (const f of ['paper-1x1.json', 'paper-16x9.json']) {
    const text = fs.readFileSync(new URL(`../../../presets/scene/${f}`, import.meta.url), 'utf8').toLowerCase();
    for (const word of ['usagin', 'last dice']) assert.ok(!text.includes(word), `${f}: ${word}`);
  }
});

test('paper-16x9: đọc không cảnh báo, mọi widget nằm trong khung, vùng nốt ≈ 65% bề rộng, tất định', () => {
  const r16 = JSON.parse(fs.readFileSync(new URL('../../../presets/scene/paper-16x9.json', import.meta.url), 'utf8'));
  const { scene, warnings } = sanitizeScene(r16);
  assert.deepEqual(warnings, []);
  assert.deepEqual([scene.canvas.designWidth, scene.canvas.designHeight, scene.canvas.aspectRatio], [1920, 1080, '16:9']);
  assert.deepEqual(scene.widgets.map((w) => w.type), sanitizeScene(raw()).scene.widgets.map((w) => w.type));
  for (const w of scene.widgets) assert.ok(w.layout.x >= 0 && w.layout.y >= 0 && w.layout.x + w.layout.width <= 1920 && w.layout.y + w.layout.height <= 1080, `${w.id} nằm ngoài khung`);
  assert.ok(Math.abs(scene.widgets[0].layout.width / 1920 - 0.65) < 0.01);
  const ast = synthAst({ duration: 6 }), d = derivedOf(ast, { fontsReady: true });
  const once = (t: number) => { const { ctx, log } = recCtx(); renderFrame(scene, d, ast, t, { ctx, width: 1920, height: 1080 }, 1); return log.join('\n'); };
  const a = once(2.6); once(0); assert.equal(once(2.6), a); assert.ok(a.includes('fillText(Demo Song'));
});

test('paper-1x1: nốt có ba màu theo trạng thái (đã phát đậm, sắp tới nhạt)', () => {
  const { scene } = sanitizeScene(raw()), ast = synthAst(), d = derivedOf(ast);
  const rects = layoutFrame(scene, d, ast, 0.75)[0].prims.filter((p: any) => p.kind === 'rect' && p.w > 1 && p.h < 40) as any[];
  const colors = new Set(rects.map((r) => r.fill));
  assert.ok(colors.has('#383838') && colors.has('#C4C4C4'), [...colors].join());
});

test('paper-1x1: chuỗi lệnh vẽ khớp golden ở các mốc t; vẽ lại cho cùng kết quả', () => {
  const { scene } = sanitizeScene(raw()), ast = synthAst({ duration: 6 });
  const d = derivedOf(ast, { fontsReady: true });
  const frame = (t: number) => { const { ctx, log } = recCtx(); renderFrame(scene, d, ast, t, { ctx, width: 1080, height: 1080 }, 1); return log; };
  const got: Record<string, string[]> = Object.fromEntries(T.map((t) => [String(t), frame(t)]));
  for (const t of [...T].reverse()) assert.deepEqual(frame(t), got[String(t)], `t=${t} không tất định`);
  if (process.env.UPDATE_GOLDEN) { fs.writeFileSync(GOLDEN, JSON.stringify(got, null, 0).replace(/\],"/g, '],\n"') + '\n'); return; }
  const want = JSON.parse(fs.readFileSync(GOLDEN, 'utf8')) as Record<string, string[]>;
  for (const t of T) assert.deepEqual(got[String(t)], want[String(t)], `t=${t} lệch golden (chạy UPDATE_GOLDEN=1 nếu thay đổi là chủ ý)`);
});

test('paper-1x1: ở t = 2,6 s có đủ chữ của sáu widget, lấy từ mẫu của preset', () => {
  const { scene } = sanitizeScene(raw()), ast = synthAst({ duration: 6 }), d = derivedOf(ast);
  const all = layoutFrame(scene, d, ast, 2.6).flatMap((f) => f.prims).filter((p: any) => p.kind === 'text').map((p: any) => p.text);
  for (const s of ['Demo Song', 'Demo Artist']) assert.ok(all.includes(s), s);
  assert.ok(all.some((s) => /^Num played notes: \d+\/12 \(\d+\.\d\d%\)$/.test(s)), all.join(' | '));
  assert.ok(all.some((s) => /^\d{3} \d{2} \d{3}$/.test(s)) && all.includes('time') && all.includes('beat'));
  assert.ok(all.includes('0:02 / 0:06'));
});
