// T-72 (SRS REQ-GRAPHICS-18): kiểu chữ dựng sẵn + ghi đè, dàn chữ (tracking, chữ số đều, tràn khung, xuống dòng, hoa/thường,
// nhiều đoạn), lược đồ preset, và lệnh vẽ của chữ tự vẽ (viền, gạch, gradient, bóng theo scale/xoay). Tất định, không trình duyệt.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TEXT_STYLES, BASE_TEXT_STYLE, TEXT_DEFAULT_FONT, DEFAULT_FONT, BUNDLED_FONTS, BUNDLED_TEXT_FAMILIES, SCENE_SCHEMA_VERSION, TEXT_METRICS,
  resolveTextStyle, applyOverride, overriddenKeys, resetOverride, saveAsTextStyle, updateTextStyleFromRef,
  textPrims, textWidth, templateSpans, chordSpans, clusters, measureText, sanitizeScene, layoutFrame, renderFrame, drawPrimitives, fontFamiliesOf, defaultScene,
  type TextStyle, type TextPrim, type SceneDocument,
} from '../src/index.ts';
import { synthAst, derivedOf, recCtx } from './helpers.ts';

const st = (o: Partial<TextStyle> = {}): TextStyle => applyOverride({ ...BASE_TEXT_STYLE, size: 20 }, o as never);
const one = (s: string, o: Partial<TextStyle> = {}, max = Infinity, align: 'left' | 'center' | 'right' = 'left') => textPrims(s, st(o), 0, 20, align, max, measureText).prims;
const sceneWith = (type: string, properties: object, extra: object = {}) => {
  const r = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, ...extra, widgets: [{ id: 'w', type, layout: { x: 0, y: 0, width: 600, height: 200 }, properties }] });
  return r;
};

test('bộ kiểu dựng sẵn: phông gốc trùng fonts.ts; số đếm/đồng hồ bật chữ số đều bề rộng; giá trị trùng mặc định chữ trước T-72', () => {
  assert.equal(TEXT_DEFAULT_FONT, DEFAULT_FONT);
  for (const id of ['counter', 'clock', 'tiny']) assert.equal(DEFAULT_TEXT_STYLES[id].tabularNums, true, id);
  assert.deepEqual([DEFAULT_TEXT_STYLES.title.size, DEFAULT_TEXT_STYLES.title.weight, DEFAULT_TEXT_STYLES.title.color], [72, 700, '#111111']);
  assert.ok(Object.isFrozen(DEFAULT_TEXT_STYLES));
});

test('ghi đè: chỉ thuộc tính có mặt thay kiểu; đối tượng con gộp một cấp; ↺ bỏ ghi đè; styleId lạ → kiểu mặc định của chỗ chữ', () => {
  const r = resolveTextStyle({ styleId: 'heading', color: '#ff0000', stroke: { width: 2 } }, DEFAULT_TEXT_STYLES, 'body');
  assert.deepEqual([r.size, r.weight, r.color, r.stroke.width, r.stroke.color], [34, 700, '#ff0000', 2, '#000000']);
  assert.equal(resolveTextStyle({ styleId: 'nope' }, DEFAULT_TEXT_STYLES, 'label').size, 11);
  assert.equal(resolveTextStyle(undefined, DEFAULT_TEXT_STYLES, 'clock').size, 18);
  assert.equal('name' in r, false);
  assert.deepEqual(overriddenKeys({ styleId: 'x', size: 3, color: '#000000' }).sort(), ['color', 'size']);
  assert.deepEqual(resetOverride({ styleId: 'x', size: 3, color: '#000000' }, 'size'), { styleId: 'x', color: '#000000' });
  assert.deepEqual(resetOverride({ styleId: 'x', size: 3 }), { styleId: 'x' });
  // không sửa bộ dựng sẵn
  assert.equal(DEFAULT_TEXT_STYLES.heading.stroke.width, 0);
});

test('Lưu thành kiểu mới / Cập nhật kiểu: chữ hết ghi đè, mọi chữ dùng kiểu đó đổi theo', () => {
  const ref = { styleId: 'body', weight: 700, underline: true };
  const a = saveAsTextStyle(DEFAULT_TEXT_STYLES, ref, 'body', 'emph', 'Nhấn mạnh');
  assert.deepEqual(a.ref, { styleId: 'emph' });
  assert.deepEqual([a.set.emph.name, a.set.emph.weight, a.set.emph.underline, a.set.emph.size], ['Nhấn mạnh', 700, true, 17]);
  assert.equal(a.set.body.weight, 400);
  const b = updateTextStyleFromRef(DEFAULT_TEXT_STYLES, ref, 'body');
  assert.deepEqual(b.ref, { styleId: 'body' });
  assert.deepEqual([b.set.body.weight, b.set.body.name], [700, 'Body']);
  assert.equal(resolveTextStyle({ styleId: 'body' }, b.set).underline, true); // chữ khác dùng "body" đổi theo
});

test('chữ thường giữ đúng đường vẽ cũ (một fillText, không rich); thuộc tính nâng cao chuyển sang tự vẽ', () => {
  const p = one('Hello', {}, 400)[0];
  assert.equal(p.rich, undefined); assert.equal(p.maxWidth, 400); assert.equal(p.text, 'Hello');
  for (const o of [{ underline: true }, { tracking: 50 }, { italic: true }, { textCase: 'upper' as const }, { opacity: 0.5 }, { scaleX: 1.2 }]) assert.ok(one('Hello', o)[0].rich, JSON.stringify(o));
  assert.equal(one('Hi 2', { tabularNums: true })[0].rich !== undefined, true);
  assert.equal(one('Hi', { tabularNums: true })[0].rich, undefined); // không có chữ số: không cần căn ô
});

test('chữ số đều bề rộng: "111" rộng bằng "888"; số nằm giữa ô; tắt thì khác nhau', () => {
  const w = (s: string, tab: boolean) => textWidth(s, st({ tabularNums: tab }), measureText);
  assert.ok(Math.abs(w('111', true) - w('888', true)) < 1e-9);
  assert.ok(w('111', false) < w('888', false));
  const r = one('1', { tabularNums: true })[0].rich!.runs[0];
  let cell = 0; for (let d = 0; d < 10; d++) cell = Math.max(cell, measureText(String(d), TEXT_DEFAULT_FONT, 20, 400));
  assert.ok(Math.abs(r.xs![0] - (cell - measureText('1', TEXT_DEFAULT_FONT, 20, 400)) / 2) < 1e-9);
  // phần không phải chữ số vẽ liền
  assert.deepEqual(one('Tempo: 120', { tabularNums: true })[0].rich!.runs[0].clusters, ['Tempo: ', '1', '2', '0']);
});

test('tracking: thêm (tracking/1000 × cỡ) sau mỗi ký tự trừ ký tự cuối; tỉ lệ ngang nhân bề rộng', () => {
  const base = textWidth('ABCD', st(), measureText);
  assert.ok(Math.abs(textWidth('ABCD', st({ tracking: 100 }), measureText) - (base + 3 * 2)) < 1e-9);
  assert.ok(Math.abs(textWidth('ABCD', st({ scaleX: 1.5 }), measureText) - base * 1.5) < 1e-9);
  const run = one('ABCD', { tracking: 100, underline: true })[0].rich!.runs[0];
  assert.ok(Math.abs(run.width - (base + 3 * 2)) < 1e-9); // gạch chân dừng ở ký tự cuối
});

test('căn lề: left/center/right đặt mép trái dòng đúng theo bề rộng đã dàn', () => {
  const o = { underline: true };
  const w = textWidth('Hello', st(o), measureText);
  for (const [a, left] of [['left', 0], ['center', -w / 2], ['right', -w]] as const) assert.ok(Math.abs(one('Hello', o, Infinity, a)[0].rich!.left - left) < 1e-9, a);
});

test('tràn khung: cắt "…" không bao giờ vượt khung; tự thu nhỏ vừa khít, chạm cỡ tối thiểu thì cắt; để tràn giữ nguyên', () => {
  const s = 'The quick brown fox jumps over the lazy dog';
  const full = textWidth(s, st(), measureText);
  for (const max of [30, 80, 200]) {
    const e = one(s, { underline: true }, max)[0];
    assert.ok(e.rich!.width <= max + 1e-6 && e.text.endsWith('…'), `ellipsis ${max}`);
  }
  const k = one(s, { overflow: 'shrink', minSize: 4 }, full / 2)[0];
  assert.ok(Math.abs(k.size - 10) < 1e-6 && Math.abs(k.rich!.width - full / 2) < 1e-6 && k.text === s);
  const m = one(s, { overflow: 'shrink', minSize: 15 }, full / 2)[0];
  assert.ok(m.size === 15 && m.text.endsWith('…') && m.rich!.width <= full / 2 + 1e-6);
  const v = one(s, { overflow: 'visible', underline: true }, 50)[0];
  assert.equal(v.text, s);
  assert.deepEqual(one(s, { underline: true }, 0), []);
});

test('xuống dòng: chia theo từ, số dòng tối đa, dòng cuối cắt "…"; bước dọc = cỡ × leading', () => {
  const s = 'one two three four five six seven eight nine ten';
  const r = textPrims(s, st({ wrap: true, maxLines: 3, leading: 1.5 }), 0, 20, 'left', 120, measureText);
  assert.equal(r.prims.length, 3);
  assert.ok(r.prims.every((p) => p.rich!.width <= 120 + 1e-6));
  assert.deepEqual(r.prims.map((p) => p.y), [20, 50, 80]);
  assert.ok(r.prims[2].text.endsWith('…'));
  assert.equal(r.height, 3 * 30);
  const short = textPrims('one two', st({ wrap: true, maxLines: 3 }), 0, 20, 'left', 400, measureText);
  assert.equal(short.prims.length, 1);
});

test('hoa/thường: upper, lower, title; chữ hoa nhỏ tách đoạn chữ thường thành hoa cỡ nhỏ hơn', () => {
  assert.equal(one('hello world', { textCase: 'upper' })[0].text, 'HELLO WORLD');
  assert.equal(one('Hello World', { textCase: 'lower' })[0].text, 'hello world');
  assert.equal(one('đêm nay trăng sáng', { textCase: 'title' })[0].text, 'Đêm Nay Trăng Sáng');
  const sc = one('Ab', { textCase: 'smallCaps' })[0].rich!.runs;
  assert.deepEqual(sc.map((r) => [r.text, r.size]), [['A', 20], ['B', 20 * TEXT_METRICS.smallCapsScale]]);
});

test('chỉ số trên/dưới và dịch baseline; cụm ký tự tiếng Việt (dấu kết hợp) không bị tách', () => {
  const sup = one('x', { script: 'super' })[0].rich!.runs[0];
  assert.deepEqual([sup.size, sup.shift], [20 * TEXT_METRICS.scriptScale, 20 * TEXT_METRICS.superShift]);
  assert.equal(one('x', { baselineShift: 5, underline: true })[0].rich!.runs[0].shift, 5);
  assert.deepEqual(clusters('ếa'), ['ế', 'a']); // NFC gộp
  assert.deepEqual(clusters('x\u0301\u0323'), ['x\u0301\u0323'.normalize('NFC')]); // không có dạng gộp sẵn: dấu dính chữ gốc
});

test('định dạng từng đoạn: giá trị trong mẫu theo valueStyle; bass của hợp âm theo bassStyle; đoạn cùng kiểu gộp', () => {
  const sp = templateSpans('Notes: {notes} {x}', { notes: 'C E G' }, { weight: 700 });
  assert.deepEqual(sp.map((s) => [s.text, s.style?.weight]), [['Notes: ', undefined], ['C E G', 700], [' {x}', undefined]]);
  assert.deepEqual(templateSpans('Notes: {notes}', { notes: 'C' }, {}), [{ text: 'Notes: C' }]);
  assert.deepEqual(chordSpans('E7/G#', { opacity: 0.5 }).map((s) => s.text), ['E7', '/G#']);
  assert.deepEqual(chordSpans('E7/G#', {}), [{ text: 'E7/G#' }]);
  const p = textPrims(chordSpans('E7/G#', { color: '#888888' }), st(), 0, 20, 'left', Infinity, measureText).prims[0];
  assert.deepEqual(p.rich!.runs.map((r) => [r.text, r.color]), [['E7', '#111111'], ['/G#', '#888888']]);
  assert.ok(Math.abs(p.rich!.runs[1].dx - measureText('E7', TEXT_DEFAULT_FONT, 20, 400)) < 1e-9);
});

test('widget Chord: bassStyle và notesValueStyle qua preset; layout tất định', () => {
  const ast = synthAst({ tracks: [{ name: 'k', color: '#fff', notes: [[44, 0, 4, 80], [52, 0, 4, 80], [62, 0, 4, 80], [64, 0, 4, 80], [68, 0, 4, 80], [71, 0, 4, 80]] }] });
  const { scene, warnings } = sceneWith('CHORD_DETECTION', { alwaysShowNotes: true, bassStyle: { color: '#AAAAAA' }, notesValueStyle: { weight: 700 } });
  assert.deepEqual(warnings, []);
  const prims = layoutFrame(scene, derivedOf(ast), ast, 0.5)[0].prims as TextPrim[];
  assert.equal(prims[0].text, 'E7/G#');
  assert.deepEqual(prims[0].rich!.runs.map((r) => r.color), ['#111111', '#AAAAAA']);
  assert.deepEqual(prims[1].rich!.runs.map((r) => r.weight), [400, 700]);
  assert.deepEqual(layoutFrame(scene, derivedOf(ast), ast, 0.5), layoutFrame(scene, derivedOf(ast), ast, 0.5));
});

test('preset: textStyles gộp với bộ dựng sẵn, kiểu sai bị bỏ có cảnh báo; chữ cũ {font,size,weight,color} là ghi đè; vòng lưu/đọc ổn định', () => {
  const r = sceneWith('TRACK_INFO', { titleStyle: { styleId: 'brand', size: 'big', gradient: { stops: [{ at: 0, color: '#ff0000' }] } }, artistStyle: { styleId: 'ghost' } }, {
    textStyles: { brand: { name: 'Thương hiệu', size: 60, italic: true, shadow: { enabled: true, blur: 999 } }, title: { color: '#222222' }, '1bad': {}, junk: 5 },
  });
  const paths = r.warnings.map((w) => w.details.path);
  for (const p of ['$.textStyles.1bad', '$.textStyles.junk', '$.textStyles.brand.shadow.blur', '$.widgets[0].properties.titleStyle.size',
    '$.widgets[0].properties.titleStyle.gradient', '$.widgets[0].properties.artistStyle.styleId']) assert.ok(paths.includes(p), p);
  const ts = r.scene.textStyles!;
  assert.deepEqual([ts.brand.name, ts.brand.size, ts.brand.italic, ts.brand.shadow.blur, ts.brand.shadow.enabled], ['Thương hiệu', 60, true, 100, true]);
  assert.deepEqual([ts.title.color, ts.title.size, ts.counter.tabularNums], ['#222222', 72, true]);
  const props: any = r.scene.widgets[0].properties;
  assert.deepEqual(props.titleStyle, { styleId: 'brand' }); // size/gradient sai bị bỏ, không thành giá trị mặc định
  assert.deepEqual(props.artistStyle, {});
  const again = sanitizeScene(JSON.parse(JSON.stringify(r.scene)));
  assert.deepEqual(again.warnings, []); assert.deepEqual(again.scene, r.scene);
  const old = sceneWith('TRACK_INFO', { titleStyle: { font: 'Space Grotesk', size: 50, weight: 400, color: '#123456' } });
  assert.deepEqual(old.warnings, []);
  assert.deepEqual((old.scene.widgets[0].properties as any).titleStyle, { font: 'Space Grotesk', size: 50, weight: 400, color: '#123456' });
});

test('phông cần nạp: phông của kiểu đang được chữ dùng; scene không có chữ thì không cần phông', () => {
  const { scene } = sceneWith('TRACK_INFO', { titleStyle: { styleId: 'brand' } }, { textStyles: { brand: { font: 'Inter' } } });
  assert.deepEqual(fontFamiliesOf(scene), ['Inter', 'Space Grotesk']); // tên bài: Inter (kiểu brand); nghệ sĩ: subtitle
  const { scene: s2 } = sceneWith('TRACK_INFO', {}, { textStyles: { brand: { font: 'Inter' } } });
  assert.deepEqual(fontFamiliesOf(s2), ['Space Grotesk']); // kiểu có nhưng không chữ nào dùng
  assert.deepEqual(fontFamiliesOf(defaultScene()), []);
});

// ── vẽ ──
const drawOne = (p: TextPrim, env = { scale: 1, rotation: 0 }) => { const { ctx, log } = recCtx(); drawPrimitives(ctx, [p], env); return log; };

test('vẽ: viền dưới phần tô (mặc định) hoặc trên; viền ngoài dày gấp đôi và luôn dưới; gạch chân/gạch ngang là fillRect đúng bề rộng run', () => {
  const p = one('Hi', { stroke: { width: 3, color: '#00ff00', position: 'center', join: 'round', over: false }, underline: true, strike: true })[0];
  const log = drawOne(p);
  const iS = log.findIndex((l) => l.startsWith('strokeText')), iF = log.findIndex((l) => l.startsWith('fillText'));
  assert.ok(iS >= 0 && iS < iF && log.includes('lineWidth=3') && log.includes('lineJoin=round') && log.includes('strokeStyle=#00ff00'));
  const over = drawOne(one('Hi', { stroke: { width: 3, color: '#00ff00', position: 'center', join: 'round', over: true } })[0]);
  assert.ok(over.findIndex((l) => l.startsWith('fillText')) < over.findIndex((l) => l.startsWith('strokeText')));
  const out = drawOne(one('Hi', { stroke: { width: 3, color: '#00ff00', position: 'outside', join: 'miter', over: true } })[0]);
  assert.ok(out.includes('lineWidth=6') && out.findIndex((l) => l.startsWith('strokeText')) < out.findIndex((l) => l.startsWith('fillText')));
  const w = Number(p.rich!.runs[0].width.toFixed(4));
  const rects = log.filter((l) => l.startsWith('fillRect('));
  assert.equal(rects.length, 2);
  assert.ok(rects.every((r) => r.split(',')[2] === String(w)));
});

test('vẽ: gradient tạo trên hộp dòng với đủ điểm màu; nghiêng là phép xiên; tỉ lệ là scale; độ đục nhân alpha', () => {
  const g = { kind: 'linear' as const, angle: 0, stops: [{ at: 0, color: '#ff0000' }, { at: 1, color: '#0000ff' }] };
  const log = drawOne(one('Hello', { gradient: g, italic: true, scaleY: 2, opacity: 0.5 })[0]);
  assert.ok(log.some((l) => l.startsWith('createLinearGradient(')));
  assert.equal(log.filter((l) => l.includes('.addColorStop(')).length, 2);
  assert.ok(log.includes(`transform(1,0,${-TEXT_METRICS.italicSkew},1,0,0)`) && log.includes('scale(1,2)') && log.includes('globalAlpha=0.5'));
  assert.ok(drawOne(one('Hello', { gradient: { ...g, kind: 'radial' } })[0]).some((l) => l.startsWith('createRadialGradient(')));
});

test('vẽ: nền chữ là hộp bo góc quanh dòng, vẽ trước chữ, độ đục riêng', () => {
  const p = one('Hi', { background: { enabled: true, color: '#000000', opacity: 0.4, padX: 10, padY: 5, radius: 6 } })[0];
  const log = drawOne(p);
  const iBg = log.indexOf('fillStyle=#000000'), iTxt = log.findIndex((l) => l.startsWith('fillText'));
  assert.ok(iBg >= 0 && iBg < iTxt && log.includes('globalAlpha=0.4') && log.some((l) => l.startsWith('arcTo(')));
});

test('vẽ: bóng đổ quy ra điểm ảnh thiết bị theo scale và góc xoay của widget (Preview = Export ở mọi độ phân giải)', () => {
  const sh = { enabled: true, color: '#000000', opacity: 0.5, distance: 10, angle: 0, blur: 4 };
  const p = one('Hi', { shadow: sh })[0];
  const val = (log: string[], k: string) => Number(log.find((l) => l.startsWith(`${k}=`) && l !== `${k}=0`)!.split('=')[1]);
  const a = drawOne(p, { scale: 2, rotation: 0 });
  assert.equal(val(a, 'shadowBlur'), 8);
  assert.ok(Math.abs(val(a, 'shadowOffsetX') - 2 * (10 - 1e5)) < 1e-3);
  assert.ok(a.includes('shadowColor=rgba(0,0,0,0.5)'));
  const b = drawOne(p, { scale: 1, rotation: 90 }); // xoay 90°: vector (10 − FAR, 0) thành (0, 10 − FAR)
  assert.ok(Math.abs(val(b, 'shadowOffsetY') - (10 - 1e5)) < 1e-3);
  // bản sao cho bóng nằm xa ngoài khung, bản thật vẽ sau, bóng tắt trước khi vẽ bản thật
  const iReset = a.lastIndexOf('shadowBlur=0'), iLastFill = a.map((l) => l.startsWith('fillText')).lastIndexOf(true);
  assert.ok(a.some((l) => l.startsWith('translate(100000')) && iReset < iLastFill);
});

test('renderFrame: chữ giàu trong widget xoay vẫn tất định; phông chưa nạp thì không vẽ chữ giàu', () => {
  const ast = synthAst();
  const { scene } = sceneWith('TIME_BAR', { style: { styleId: 'clock', shadow: { enabled: true }, underline: true } });
  (scene as SceneDocument).widgets[0].layout.rotation = 30;
  const run = (ready?: boolean) => { const { ctx, log } = recCtx(); renderFrame(scene, derivedOf(ast, { fontsReady: ready }), ast, 1.25, { ctx, width: 960, height: 540 }, 0.5); return log; };
  assert.deepEqual(run(), run());
  assert.ok(run().some((l) => l.startsWith('shadowOffsetX=')));
  assert.ok(!run(false).some((l) => l.startsWith('fillText') || l.startsWith('strokeText')));
});

test('phông không có sẵn: cảnh báo một lần mỗi họ khi mở preset, tên giữ nguyên trong scene, vẽ bằng phông mặc định', () => {
  assert.deepEqual([...BUNDLED_TEXT_FAMILIES], [...new Set(BUNDLED_FONTS.map((f) => f.family))]);
  const r = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, textStyles: { brand: { font: 'Inter' } },
    widgets: [{ id: 'w', type: 'TRACK_INFO', layout: { x: 0, y: 0, width: 600, height: 200 }, properties: { titleStyle: { styleId: 'brand' }, artistStyle: { font: 'Inter' } } }] });
  const miss = r.warnings.filter((w) => w.code === 'WARN_PRESET_FONT_MISSING');
  assert.deepEqual(miss.map((w) => [w.details.path, w.details.value, w.details.to]), [['$.textStyles.brand.font', 'Inter', TEXT_DEFAULT_FONT]]);
  assert.equal(r.scene.textStyles!.brand.font, 'Inter');
  assert.equal(sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, textStyles: { brand: { font: 'Inter' } }, widgets: [] }, { fonts: ['Space Grotesk', 'Inter'] }).warnings.length, 0);
  const ast = synthAst();
  const prims = layoutFrame(r.scene, derivedOf(ast), ast, 0)[0].prims as TextPrim[];
  assert.ok(prims.length === 2 && prims.every((p) => p.font === TEXT_DEFAULT_FONT));
  const withInter = layoutFrame(r.scene, derivedOf(ast, { fonts: new Set(['Space Grotesk', 'Inter']) }), ast, 0)[0].prims as TextPrim[];
  assert.deepEqual(withInter.map((p) => p.font), ['Inter', 'Inter']); // phông người dùng nạp (sau này): vẽ đúng phông đó
});
