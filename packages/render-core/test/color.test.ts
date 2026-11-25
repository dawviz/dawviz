// T-49 (REQ-UI-11): màu có alpha #rrggbbaa đi qua sanitize, keyframe OKLab và các chỗ tự tách kênh màu; preset cũ #rrggbb không đổi hình.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  HEX_COLOR, isHexColor, parseHexRgba, rgbaOf, mixHexRgb, hexAlpha, parseHex, shade, sanitizeStyle, DEFAULT_NOTE_STYLE, mixColor, sanitizeScene, defaultScene,
  renderFrame, spectrumPrims, DEFAULT_SPECTRUM, SCENE_SCHEMA_VERSION, compileTrack, sampleTrack, notationInkFor, type RectPrim, type SceneDocument,
} from '../src/index.ts';
import { synthAst, derivedOf, recCtx } from './helpers.ts';

test('HEX_COLOR nhận #rrggbb và #rrggbbaa, từ chối dạng khác', () => {
  for (const ok of ['#ff0000', '#FF000080', '#00000000']) assert.ok(HEX_COLOR.test(ok) && isHexColor(ok), ok);
  for (const bad of ['#f00', '#f008', 'ff0000', '#ff00000', '#gg0000', 'red', '', 1]) assert.ok(!isHexColor(bad), String(bad));
});

test('parseHexRgba, hexAlpha, rgbaOf: tách kênh và nhân alpha', () => {
  assert.deepEqual(parseHexRgba('#ff8000'), [255, 128, 0, 1]);
  assert.deepEqual(parseHexRgba('#ff800080'), [255, 128, 0, 128 / 255]);
  assert.equal(parseHexRgba('đỏ'), null);
  assert.equal(hexAlpha('#ff0000'), 1); assert.equal(hexAlpha('#ff000000'), 0);
  assert.equal(rgbaOf('#102030', 0.5), 'rgba(16,32,48,0.5)');
  assert.equal(rgbaOf('#10203080', 1), `rgba(16,32,48,${128 / 255})`);
  assert.equal(rgbaOf('#10203080', 0.5), `rgba(16,32,48,${0.5 * 128 / 255})`);
  assert.deepEqual(parseHex('#11223344'), [0x11, 0x22, 0x33]);
});

test('mixHexRgb: mã 6 chữ số cho kết quả như cách trộn cũ; có alpha thì nội suy cả alpha', () => {
  const old = (a: string, b: string, k: number) => { const p = (h: string, s: number) => parseInt(h.slice(s, s + 2), 16); const c = (s: number) => Math.round(p(a, s) + (p(b, s) - p(a, s)) * k).toString(16).padStart(2, '0'); return `#${c(1)}${c(3)}${c(5)}`; };
  for (const k of [0, 0.25, 0.5, 0.77, 1]) assert.equal(mixHexRgb('#123456', '#fedcba', k), old('#123456', '#fedcba', k));
  assert.equal(mixHexRgb('#00000000', '#ffffffff', 0.5), '#80808080');
  assert.equal(mixHexRgb('#000000', '#ffffff00', 1), '#ffffff00');
});

test('shade giữ alpha; mã không alpha như cũ', () => {
  assert.equal(shade('#808080', 0.5), '#c0c0c0');
  assert.equal(shade('#80808040', 0.5), '#c0c0c040');
});

test('sanitizeStyle nhận #rrggbbaa cho màu nốt, viền và màu theo trạng thái; mã sai về mặc định', () => {
  const s = sanitizeStyle({ ...DEFAULT_NOTE_STYLE, customColor: '#ff000080', borderColor: '#00ff0040', activeColor: '#0000ffcc' });
  assert.equal(s.customColor, '#ff000080'); assert.equal(s.borderColor, '#00ff0040'); assert.equal(s.activeColor, '#0000ffcc');
  assert.equal(sanitizeStyle({ ...DEFAULT_NOTE_STYLE, customColor: '#ff00008' }).customColor, DEFAULT_NOTE_STYLE.customColor);
  assert.equal(sanitizeStyle({ ...DEFAULT_NOTE_STYLE, customColor: '#123456' }).customColor, '#123456');
});

test('sanitizeScene: màu widget nhận #rrggbbaa không cảnh báo; nền khung hình vẫn chỉ #rrggbb', () => {
  const raw = {
    schemaVersion: SCENE_SCHEMA_VERSION, canvas: { backgroundColor: '#11223380' },
    widgets: [
      { type: 'AUDIO_SPECTRUM', properties: { color: '#ff000080', colorB: '#00ff00' } },
      { type: 'TEXT', properties: { text: 'x', style: { styleId: 'title', color: '#ffffff80' } } },
    ],
  };
  const { scene, warnings } = sanitizeScene(raw);
  const sp = scene.widgets[0].properties as any, tx = scene.widgets[1].properties as any;
  assert.equal(sp.color, '#ff000080'); assert.equal(sp.colorB, '#00ff00');
  assert.equal(tx.style.color, '#ffffff80');
  assert.equal(scene.canvas.backgroundColor, '#0c0e16');
  assert.ok(warnings.some((w) => (w.details as any)?.path === '$.canvas.backgroundColor'));
  assert.ok(!warnings.some((w) => String((w.details as any)?.path).includes('widgets')), JSON.stringify(warnings));
});

test('keyframe màu: nhận #rrggbbaa, nội suy alpha trong OKLab; hai mã đục cho mã 6 chữ số', () => {
  assert.equal(mixColor('#ff000000', '#ff0000ff', 0.5).slice(0, 7), '#ff0000');
  assert.equal(mixColor('#ff000000', '#ff0000ff', 0.5).length, 9);
  assert.equal(mixColor('#ff0000', '#0000ff', 0.5).length, 7);
  const tr = compileTrack({ kind: 'color', keys: [{ at: { sec: 0 }, value: '#ffffff00' }, { at: { sec: 1 }, value: '#ffffffff' }] }, { tempoMap: [] } as any);
  const mid = sampleTrack(tr, 0.5) as string;
  assert.match(mid, /^#ffffff[0-9a-f]{2}$/); assert.ok(Math.abs(parseInt(mid.slice(7), 16) - 128) <= 1);
  const raw = { schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ type: 'AUDIO_SPECTRUM', properties: {}, animate: { color: { kind: 'color', keys: [{ at: { sec: 0 }, value: '#ff000080' }, { at: { sec: 1 }, value: '#00ff00' }] } } }] };
  const { scene, warnings } = sanitizeScene(raw);
  assert.equal((scene.widgets[0] as any).animate.color.keys[0].value, '#ff000080', JSON.stringify(warnings));
});

test('vẽ: màu nốt #rrggbbaa đi thẳng vào fillStyle; scene mã 6 chữ số vẽ y như trước', () => {
  const ast = synthAst(), d = derivedOf(ast);
  const base = defaultScene();
  const withAlpha = JSON.parse(JSON.stringify(base)) as SceneDocument;
  (withAlpha.widgets[0].properties as any).noteStyle.tracks = { t0: { colorMode: 'custom', customColor: '#ff000080' } };
  const sc = sanitizeScene(withAlpha).scene;
  assert.equal((sc.widgets[0].properties as any).noteStyle.tracks.t0.customColor, '#ff000080');
  const a = recCtx(); renderFrame(sc, d, ast, 0.6, { ctx: a.ctx, width: 960, height: 540 }, 0.5);
  assert.ok(a.log.includes('fillStyle=#ff000080'), 'nốt track 0 vẽ bằng mã có alpha');
  const b1 = recCtx(), b2 = recCtx();
  renderFrame(base, d, ast, 0.6, { ctx: b1.ctx, width: 960, height: 540 }, 0.5);
  renderFrame(sanitizeScene(JSON.parse(JSON.stringify(base))).scene, d, ast, 0.6, { ctx: b2.ctx, width: 960, height: 540 }, 0.5);
  assert.deepEqual(b2.log, b1.log);
});

test('phổ GRADIENT giữ alpha; nền có alpha không đổi màu mực Bản nhạc', () => {
  const lv = Float64Array.from({ length: 8 }, () => 0.5);
  const g = spectrumPrims({ ...DEFAULT_SPECTRUM, bars: 8, colorMode: 'GRADIENT', color: '#00000000', colorB: '#ffffffff' }, 400, 200, lv) as RectPrim[];
  assert.equal(g[0].fill, '#00000000'); assert.equal(g[7].fill, '#ffffffff');
  assert.deepEqual(notationInkFor('#ffffff80'), notationInkFor('#ffffff'));
});
