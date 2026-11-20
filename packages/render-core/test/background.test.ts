// T-21: ảnh nền: cách đặt vào khung, vẽ trước widget, làm tối, và preset chỉ nhớ cách đặt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultScene, placeImage, renderFrame, sanitizeScene, SCENE_SCHEMA_VERSION, DEFAULT_BACKGROUND } from '../src/index.ts';
import { derivedOf, recCtx, synthAst } from './helpers.ts';

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

test('placeImage COVER: phủ kín khung, cắt phần thừa ở giữa (ảnh rộng cắt hai bên, ảnh cao cắt trên dưới)', () => {
  const wide = placeImage('COVER', 2000, 500, 1000, 500);       // ảnh 4:1 vào khung 2:1 → cắt ngang
  near(wide.sw, 1000); near(wide.sh, 500); near(wide.sx, 500); near(wide.sy, 0); assert.deepEqual([wide.dx, wide.dy, wide.dw, wide.dh], [0, 0, 1000, 500]);
  const tall = placeImage('COVER', 500, 1000, 1000, 500);
  near(tall.sw, 500); near(tall.sh, 250); near(tall.sx, 0); near(tall.sy, 375);
});
test('placeImage CONTAIN: nằm gọn, giữa khung, nguyên ảnh; STRETCH: kéo đúng khung; ảnh rỗng → không vẽ', () => {
  const c = placeImage('CONTAIN', 2000, 500, 1000, 500); assert.deepEqual([c.sx, c.sy, c.sw, c.sh], [0, 0, 2000, 500]); near(c.dw, 1000); near(c.dh, 250); near(c.dx, 0); near(c.dy, 125);
  const s = placeImage('STRETCH', 123, 45, 1000, 500); assert.deepEqual([s.dx, s.dy, s.dw, s.dh], [0, 0, 1000, 500]);
  assert.equal(placeImage('COVER', 0, 10, 100, 100).dw, 0);
});

const draw = (scene = defaultScene(), bg?: { image: unknown; width: number; height: number }) => {
  const ast = synthAst({ duration: 2 }), { ctx, log } = recCtx();
  renderFrame({ ...scene, widgets: [] }, derivedOf(ast, bg ? { background: bg } : {}), ast, 0, { ctx, width: 1920, height: 1080 }, 1);
  return log;
};
test('renderFrame: ảnh vẽ ngay sau màu nền, trước widget; không có ảnh thì không gọi drawImage; mặc định phủ kín không làm tối', () => {
  assert.ok(!draw().some((l) => l.startsWith('drawImage')));
  const log = draw(defaultScene(), { image: 'IMG', width: 3840, height: 1080 });
  const i = log.findIndex((l) => l.startsWith('drawImage')); assert.ok(i > log.findIndex((l) => l.startsWith('fillRect(0,0,1920,1080)')));
  assert.equal(log[i], 'drawImage(IMG,960,0,1920,1080,0,0,1920,1080)'); // ảnh 3840×1080 vào khung 1920×1080: cắt đều hai bên
  assert.equal(log.filter((l) => l.startsWith('fillRect(0,0,1920,1080)')).length, 1, 'không tô đen khi dim = 0');
});
test('opacity 0 thì không vẽ ảnh; dim > 0 thì tô đen phủ khung', () => {
  const sc = defaultScene(); sc.canvas.backgroundImage = { ...DEFAULT_BACKGROUND, opacity: 0, dim: 0.5 };
  const log = draw(sc, { image: 'IMG', width: 100, height: 100 });
  assert.ok(!log.some((l) => l.startsWith('drawImage'))); assert.equal(log.filter((l) => l.startsWith('fillRect(0,0,1920,1080)')).length, 2);
});

test('sanitizeScene: backgroundImage hợp lệ giữ, sai thì kẹp/mặc định kèm cảnh báo; ảnh nhúng trong preset bị bỏ', () => {
  const mk = (canvas: object) => sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas, widgets: [] });
  assert.deepEqual(mk({ backgroundImage: { fit: 'CONTAIN', opacity: 0.4, dim: 0.25 } }).scene.canvas.backgroundImage, { fit: 'CONTAIN', opacity: 0.4, dim: 0.25 });
  const bad = mk({ backgroundImage: { fit: 'WEIRD', opacity: 9, dim: -1 } }); assert.deepEqual(bad.scene.canvas.backgroundImage, DEFAULT_BACKGROUND); assert.ok(bad.warnings.length >= 3);
  assert.equal(mk({}).scene.canvas.backgroundImage, undefined);
  const emb = mk({ backgroundImageData: 'data:image/png;base64,AAAA' }); assert.equal(emb.scene.canvas.backgroundImageData, null); assert.ok(emb.warnings.some((w) => w.details.path === '$.canvas.backgroundImageData'));
});
