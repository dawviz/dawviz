// T-35: text animator cơ bản của Ô chữ — tách phần tử (cụm NFC), thứ tự lệch, tiến độ, gõ chữ, đếm số, đọc preset, tất định.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { countUpText, elementProgress, layoutFrame, ranks, sanitizeScene, splitLine, SCENE_SCHEMA_VERSION, DEFAULT_TEXT_ANIMATOR, type TextPrim } from '../src/index.ts';
import { synthAst, derivedOf } from './helpers.ts';

const ast = synthAst({ duration: 20 });
const box = (text: string, animator: object, extra: object = {}) => sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'tx', type: 'TEXT', layout: { x: 0, y: 0, width: 800, height: 200 }, properties: { text, animator: { enabled: true, ...animator }, ...extra } }] });
const texts = (sc: ReturnType<typeof box>['scene'], t: number) => layoutFrame(sc, derivedOf(ast), ast, t)[0]?.prims.filter((p): p is TextPrim => p.kind === 'text') ?? [];

test('splitLine: ký tự theo cụm (dấu tiếng Việt không rời chữ), từ giữ khoảng trắng sau, dòng nguyên; đoạn trước để đo vị trí', () => {
  const ch = splitLine([{ text: 'Việt nam' }], 'char');
  assert.deepEqual(ch.map((e) => e.spans[0].text), ['V', 'i', 'ệ', 't', ' ', 'n', 'a', 'm']);
  assert.equal(ch[4].visible, false); assert.equal(ch[5].before.map((b) => b.text).join(''), 'Việt ');
  assert.deepEqual(splitLine([{ text: 'một hai  ba' }], 'word').map((e) => e.spans[0].text), ['một ', 'hai  ', 'ba']);
  assert.equal(splitLine([{ text: 'a b' }], 'line').length, 1);
  const styled = splitLine([{ text: 'ab' }, { text: 'c', style: { styleId: 'value' } }], 'char');
  assert.deepEqual(styled[2].spans[0].style, { styleId: 'value' }); assert.equal(styled[2].before.map((b) => b.text).join(''), 'ab');
});

test('thứ tự lệch: xuôi, ngược, từ giữa ra, ngẫu nhiên tất định (hoán vị)', () => {
  assert.deepEqual(ranks(5, 'forward', 1), [0, 1, 2, 3, 4]);
  assert.deepEqual(ranks(5, 'backward', 1), [4, 3, 2, 1, 0]);
  assert.deepEqual(ranks(5, 'center', 1), [3, 1, 0, 2, 4]);
  const r = ranks(20, 'random', 7);
  assert.deepEqual([...r].sort((a, b) => a - b), Array.from({ length: 20 }, (_, i) => i));
  assert.deepEqual(ranks(20, 'random', 7), r); assert.notDeepEqual(ranks(20, 'random', 8), r);
});

test('tiến độ phần tử: lệch theo lượt, kẹp 0..1, thời lượng 0 = bật ngay; đếm số giữ số chữ số thập phân', () => {
  assert.equal(elementProgress(0.05, 2, 0.4, 0.1, 'linear'), 0);
  assert.equal(elementProgress(0.4, 2, 0.4, 0.1, 'linear'), 0.5);
  assert.equal(elementProgress(9, 2, 0.4, 0.1, 'linear'), 1);
  assert.equal(elementProgress(0.19, 2, 0, 0.1, 'linear'), 0); assert.equal(elementProgress(0.2, 2, 0, 0.1, 'linear'), 1);
  assert.equal(countUpText('BPM 128, 3.50 s, 7,25', 0.5), 'BPM 64, 1.75 s, 3,63');
  assert.equal(countUpText('không số', 0.3), 'không số');
});

test('gõ chữ: ký tự hiện dần theo thời gian; vị trí từng ký tự khớp chữ không hiệu ứng khi đã hiện hết', () => {
  const sc = box('Hello', { effect: 'typewriter', unit: 'char', stagger: 0.1, start: 1 }).scene;
  assert.equal(texts(sc, 0.5).length, 0);
  assert.equal(texts(sc, 1.25).map((p) => p.text).join(''), 'Hel');
  const full = texts(sc, 3);
  assert.equal(full.map((p) => p.text).join(''), 'Hello');
  for (let i = 1; i < full.length; i++) assert.ok(full[i].x > full[i - 1].x, 'ký tự sau nằm bên phải');
});

test('hiện dần/trồi lên/bật ra: độ đục, dời, cỡ chạy theo tiến độ; xong thì như chữ thường; tất định', () => {
  const fade = box('AB', { effect: 'fade', unit: 'char', duration: 1, stagger: 0, ease: 'linear' }).scene;
  assert.deepEqual(texts(fade, 0.5).map((p) => Math.round(p.alpha * 100) / 100), [0.5, 0.5]);
  const rise = box('AB', { effect: 'rise', unit: 'line', duration: 1, ease: 'linear' }).scene;
  const y0 = texts(rise, 5)[0].y, y1 = texts(rise, 0.5)[0].y;
  assert.ok(Math.abs(y1 - y0 - 12) < 1e-9, `${y1 - y0}`);
  const pop = box('AB', { effect: 'pop', unit: 'line', duration: 1, ease: 'linear' }).scene;
  assert.ok(texts(pop, 0.5)[0].size < texts(pop, 5)[0].size);
  const out = box('AB', { effect: 'fade', unit: 'char', duration: 1, stagger: 0, ease: 'linear', direction: 'out' }).scene;
  assert.equal(texts(out, 0).length, 2); assert.equal(texts(out, 5).length, 0);
  assert.deepEqual(texts(fade, 0.73), texts(fade, 0.73));
});

test('đếm số; tuỳ chỉnh màu "từ"; tắt animator thì như cũ; đọc preset kẹp giá trị và lấy mặc định', () => {
  const cnt = box('Score 100', { effect: 'fade', unit: 'line', countUp: true, duration: 2, stagger: 0, ease: 'linear' }).scene;
  assert.equal(texts(cnt, 1)[0].text, 'Score 50');
  const col = box('A', { effect: 'custom', unit: 'line', duration: 1, ease: 'linear', fromOpacity: 1, fromColor: '#ff0000' }).scene;
  assert.notEqual(texts(col, 0)[0].color, texts(col, 5)[0].color);
  const off = box('A', { enabled: false }).scene, plain = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'tx', type: 'TEXT', layout: { x: 0, y: 0, width: 800, height: 200 }, properties: { text: 'A' } }] }).scene;
  assert.deepEqual(texts(off, 1), texts(plain, 1));
  const r = box('A', { effect: 'nope', duration: -3, stagger: 99, fromColor: 'red' });
  const a = (r.scene.widgets[0].properties as { animator: typeof DEFAULT_TEXT_ANIMATOR }).animator;
  assert.equal(a.effect, DEFAULT_TEXT_ANIMATOR.effect); assert.equal(a.duration, 0); assert.equal(a.stagger, 10); assert.equal(a.fromColor, '');
  assert.ok(r.warnings.length >= 3);
});
