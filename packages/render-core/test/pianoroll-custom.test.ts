// T-58 (vạch phát tuỳ chỉnh), T-51 (bàn phím: hình dạng, màu phím nhấn, thang âm, tên nốt), lưới ô nhịp, T-59 (góc chảy tự do) của Piano Roll.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { synthAst, derivedOf } from './helpers.ts';
import {
  pianoRollRenderer, pianoRollWidget, pianoRollLane, playheadPrims, keyboardScaleAt, flowFrame, flowPoint, flowRect, gridLinesIn, buildBarGrid,
  sanitizeScene, SCENE_SCHEMA_VERSION, DEFAULT_PIANO_ROLL, layoutFrame, scalePitchClasses, buildIndex,
  type PianoRollProps, type Primitive, type RectPrim, type TextPrim, type WidgetSpec,
} from '../src/index.ts';
import { measureText } from '../src/text.ts';

const ast = synthAst();
const derived = derivedOf(ast);
const W = 800, H = 400;
const roll = (props: Partial<PianoRollProps> = {}, size: [number, number] = [W, H]) => pianoRollWidget({ x: 0, y: 0, width: size[0], height: size[1], rotation: 0 }, { pitchRangeMode: 'CUSTOM', pitchMin: 48, pitchMax: 84, ...props });
const lay = (w: WidgetSpec<PianoRollProps>, t: number, d = derived) => pianoRollRenderer.layout({ ast, derived: d, tracks: d.index.tracks, measure: measureText }, w, t);
const rects = (ps: Primitive[]) => ps.filter((p): p is RectPrim => p.kind === 'rect');
const texts = (ps: Primitive[]) => ps.filter((p): p is TextPrim => p.kind === 'text');

test('mặc định: trường mới không đổi chuỗi hình (vạch phát LINE một hình chữ nhật, không lưới, không nhãn, góc 0)', () => {
  const p = roll({ keyboard: { ...DEFAULT_PIANO_ROLL.keyboard, enabled: false } });
  const out = lay(p, 1);
  assert.equal(texts(out).length, 0);
  const ph = rects(out).filter((r) => r.fill === '#ffffff' && r.h === H);
  assert.equal(ph.length, 1); assert.equal(ph[0].x, W * 0.3 - 1); assert.equal(ph[0].w, 2); assert.equal(ph[0].rotation, undefined);
  // tài liệu cũ thiếu các trường mới vẽ y hệt
  const old = { ...p, properties: { ...p.properties } } as any;
  for (const k of ['flowAngle', 'flowMirror', 'labelsUpright', 'playheadStyle', 'playheadArrows', 'playheadLength', 'playheadGlow', 'playheadHit', 'playheadHitMs', 'grid']) delete old.properties[k];
  assert.deepEqual(lay(old, 1), out);
});

test('preset: trường mới tuỳ chọn, giá trị sai về mặc định kèm cảnh báo; vòng lưu/đọc ổn định', () => {
  const raw = (props: object) => ({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'p', type: 'PIANO_ROLL', layout: { x: 0, y: 0, width: 100, height: 100 }, properties: props }] });
  const a = sanitizeScene(raw({}));
  const pa = a.scene.widgets[0].properties as PianoRollProps;
  assert.deepEqual(a.warnings, []);
  assert.deepEqual([pa.flowAngle, pa.playheadStyle, pa.playheadHit, pa.grid.bars, pa.keyboard.labels, pa.keyboard.scale, pa.keyboard.shape], [0, 'LINE', 'OFF', false, 'NONE', 'OFF', 'FLAT']);
  const b = sanitizeScene(raw({ flowAngle: -90, playheadStyle: 'ZIGZAG', playheadLength: 3, grid: { bars: true, color: 'red' }, keyboard: { labels: 'WHITE', scale: 'DORIAN' } }));
  const pb = b.scene.widgets[0].properties as PianoRollProps;
  assert.equal(pb.flowAngle, 270); assert.equal(pb.playheadStyle, 'LINE'); assert.equal(pb.playheadLength, 1);
  assert.equal(pb.grid.bars, true); assert.equal(pb.grid.color, '#ffffff'); assert.equal(pb.keyboard.labels, 'WHITE'); assert.equal(pb.keyboard.scale, 'OFF');
  const paths = b.warnings.map((w) => w.details.path);
  for (const s of ['playheadStyle', 'playheadLength', 'grid.color', 'keyboard.scale']) assert.ok(paths.includes(`$.widgets[0].properties.${s}`), s);
  assert.deepEqual(sanitizeScene(JSON.parse(JSON.stringify(b.scene))).scene, b.scene);
});

test('gridLinesIn: đầu ô nhịp và phách theo tempo/nhịp; đổi tempo và nhịp giữa bài vẫn đúng', () => {
  const g = buildBarGrid([{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }]);
  assert.deepEqual(gridLinesIn(g, 0, 4.1, false).map((l) => [l.sec, l.bar]), [[0, 1], [2, 2], [4, 3]]);
  assert.deepEqual(gridLinesIn(g, 1.9, 3, true).map((l) => [l.sec, l.bar, l.beat]), [[2, 2, 1], [2.5, 2, 2], [3, 2, 3]]);
  assert.deepEqual(gridLinesIn(g, -3, -1, true), []);
  // 4/4 120 BPM tới ô 3 (4 s), rồi 3/4 60 BPM: ô 3 dài 3 s
  const g2 = buildBarGrid([{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }, { tick: 7680, timeSeconds: 4, bpm: 60, timeSigNumerator: 3, timeSigDenominator: 4 }]);
  assert.deepEqual(gridLinesIn(g2, 3.5, 10.5, false).map((l) => [l.sec, l.bar]), [[4, 3], [7, 4], [10, 5]]);
  assert.deepEqual(gridLinesIn(g2, 4, 6.5, true).map((l) => l.sec), [4, 5, 6]);
});

test('lưới ô nhịp trên Piano Roll: vạch ô nhịp đúng vị trí theo thời gian, vạch phách mờ hơn, số ô nhịp ở đầu ô; dưới nốt', () => {
  const p = roll({ visibleSeconds: 4, playheadPositionRatio: 0.25, keyboard: { ...DEFAULT_PIANO_ROLL.keyboard, enabled: false }, grid: { bars: true, beats: true, numbers: true, color: '#abcdef', opacity: 0.4 } });
  const out = lay(p, 1); // cửa sổ [0, 4] s, 200 pt/giây
  const lines = rects(out).filter((r) => r.fill === '#abcdef');
  const bar = lines.filter((r) => r.alpha === 0.4), beat = lines.filter((r) => r.alpha < 0.4);
  assert.deepEqual(bar.map((r) => r.x + 0.5), [0, 400, 800]);
  assert.equal(beat.length, 6); assert.ok(beat.every((r) => Math.abs(r.alpha - 0.18) < 1e-9));
  assert.deepEqual(texts(out).map((x) => [x.text, x.x, x.align]), [['1', 4, 'left'], ['2', 404, 'left'], ['3', 804, 'left']]);
  const firstNote = out.findIndex((x) => x.kind === 'rect' && x.fill !== '#abcdef');
  assert.ok(out.findIndex((x) => x.kind === 'rect' && x.fill === '#abcdef') < firstNote, 'lưới vẽ trước nốt');
});

test('vạch phát (T-58): nét đứt, dải, gradient, mũi tên, độ dài; phản ứng khi nốt chạm tắt dần theo thời gian', () => {
  const base = { playheadColor: '#ffffff', playheadWidth: 4, playheadArrows: false, playheadLength: 1, playheadGlow: 0, playheadHit: 'OFF' as const };
  const dashed = playheadPrims({ ...base, playheadStyle: 'DASHED' }, 100, 400, 400, { k: 0, color: null });
  assert.ok(dashed.length > 10); assert.ok(dashed.every((r) => r.x === 98 && r.w === 4 && r.h <= 12));
  const band = playheadPrims({ ...base, playheadStyle: 'BAND' }, 100, 400, 400, { k: 0, color: null });
  assert.deepEqual(band.map((r) => [r.w, r.alpha]), [[4, 0.35], [1, 1]]);
  const grad = playheadPrims({ ...base, playheadStyle: 'GRADIENT' }, 100, 400, 400, { k: 0, color: null });
  assert.equal(grad.length, 6); assert.ok(grad[0].w > grad[5].w); assert.ok(grad.every((r) => Math.abs(r.x + r.w / 2 - 100) < 1e-9));
  const half = playheadPrims({ ...base, playheadStyle: 'LINE', playheadLength: 0.5, playheadArrows: true }, 100, 400, 400, { k: 0, color: null });
  assert.deepEqual([half[0].y, half[0].h], [100, 200]);
  const arrows = half.slice(1); assert.ok(arrows.length >= 8);
  assert.ok(arrows.every((r) => r.y >= 100 - 1e-9 && r.y + r.h <= 300 + 1e-9), 'mũi tên nằm trong đoạn vạch, chỉ vào trong');
  const glow = playheadPrims({ ...base, playheadStyle: 'LINE', playheadGlow: 0.5 }, 100, 400, 400, { k: 0, color: null });
  assert.equal(glow[0].glowBlur, 12);
  const swell = playheadPrims({ ...base, playheadStyle: 'LINE', playheadHit: 'SWELL' }, 100, 400, 400, { k: 0.5, color: '#ff0000' });
  assert.equal(swell[0].w, 8);
  const flash = playheadPrims({ ...base, playheadStyle: 'LINE', playheadHit: 'FLASH' }, 100, 400, 400, { k: 1, color: '#ff0000' });
  assert.notEqual(flash[0].fill, '#ffffff'); assert.ok(flash[0].glowBlur > 0);
  // qua renderer: nốt Lead (76) bắt đầu ở 0,25 s, velocity 90 → ngay sau đó vạch dày hơn, 1 s sau trở lại bình thường
  const p = roll({ keyboard: { ...DEFAULT_PIANO_ROLL.keyboard, enabled: false }, playheadHit: 'SWELL', playheadHitMs: 200, playheadWidth: 2 });
  const ph = (t: number) => rects(lay(p, t)).filter((r) => r.fill === '#ffffff' && r.h === H)[0].w;
  assert.ok(ph(0.3) > 2.5); assert.equal(ph(1.6), 2); assert.equal(ph(0.3), ph(0.3));
});

test('bàn phím (T-51): bo góc, màu phím nhấn một màu, tên nốt chỉ C / phím trắng / mọi phím theo cách ghi và quy ước C3/C4', () => {
  const kb = { ...DEFAULT_PIANO_ROLL.keyboard, enabled: true, width: 80 };
  const plain = lay(roll({ keyboard: kb }), 0.1);
  const round = lay(roll({ keyboard: { ...kb, shape: 'ROUNDED' } }), 0.1);
  assert.ok(rects(round).some((r) => r.radius > 0) && !rects(plain).some((r) => r.radius > 0 && r.x < 80 && r.fill === kb.whiteColor));
  const solo = lay(roll({ keyboard: { ...kb, useTrackColor: false, pressedColor: '#123456' } }), 0.1); // Chords 52/56/59/62 đang vang
  assert.equal(rects(solo).filter((r) => r.fill === '#123456').length, 4);
  const cOnly = texts(lay(roll({ keyboard: { ...kb, labels: 'C' } }), 0.1));
  assert.deepEqual(cOnly.map((x) => x.text), ['C3', 'C4', 'C5', 'C6']);
  const rowH = H / 37;
  // vị trí tất định: tâm hàng C4 (60) + 0,35 cỡ chữ; tâm ngang ở đầu phím gần vạch phát
  const c4 = cOnly.find((x) => x.text === 'C4')!;
  assert.ok(Math.abs(c4.y - ((84 - 60) * rowH + rowH / 2 + c4.size * 0.35)) < 1e-9); assert.ok(Math.abs(c4.x - (80 - 80 * 0.19)) < 1e-9); assert.equal(c4.align, 'center');
  const yamaha = texts(lay(roll({ keyboard: { ...kb, labels: 'C' } }), 0.1, { ...derived, naming: { system: 'SOLFEGE', accidental: 'SHARP', ascii: false, middleC: 3 } }));
  assert.deepEqual(yamaha.map((x) => x.text), ['Do2', 'Do3', 'Do4', 'Do5']);
  assert.equal(texts(lay(roll({ keyboard: { ...kb, labels: 'WHITE' } }), 0.1)).length, 22);
  assert.equal(texts(lay(roll({ keyboard: { ...kb, labels: 'ALL', labelOctave: false } }), 0.1)).length, 37);
  assert.deepEqual(texts(lay(roll({ keyboard: { ...kb, labels: 'ACTIVE' } }), 0.1)).map((x) => x.text).sort(), ['D4', 'E3', 'G♯3', 'B3'].sort());
  // chữ quá nhỏ (dải rộng trên widget thấp) thì không vẽ
  assert.equal(texts(lay(roll({ keyboard: { ...kb, labels: 'ALL' }, pitchMin: 21, pitchMax: 108 }, [W, 200]), 0.1)).length, 0);
});

test('đánh dấu thang âm: theo nốt chủ của scene (trưởng/thứ), hoặc giọng nhận diện; tắt = không tô', () => {
  assert.deepEqual([...scalePitchClasses(0, false)].sort((a, b) => a - b), [0, 2, 4, 5, 7, 9, 11]);
  assert.deepEqual([...scalePitchClasses(9, true)].sort((a, b) => a - b), [0, 2, 4, 5, 7, 9, 11]);
  const tracks = derived.index.tracks;
  assert.equal(keyboardScaleAt('OFF', 0, tracks, 1), null);
  assert.deepEqual([...keyboardScaleAt('MINOR', 2, tracks, 1)!.pcs].sort((a, b) => a - b), [0, 2, 4, 5, 7, 9, 10]);
  // C major thuần: nhận diện được giọng có tập lớp cao độ của Đô trưởng (hoặc La thứ)
  const cmaj = synthAst({ tracks: [{ name: 'P', color: '#888888', notes: [[60, 0, 1, 90], [62, 1, 1, 90], [64, 2, 1, 90], [65, 3, 1, 90], [67, 4, 1, 90], [69, 5, 1, 90], [71, 6, 1, 90], [72, 7, 1, 90], [60, 8, 2, 90], [67, 8, 2, 90], [64, 8, 2, 90]] }] });
  const idx = buildIndex(cmaj.tracks, cmaj.meta.totalDurationSeconds);
  const auto = keyboardScaleAt('AUTO', undefined, idx.tracks, 5)!;
  assert.deepEqual([...auto.pcs].sort((a, b) => a - b), [0, 2, 4, 5, 7, 9, 11]);
  // nốt chủ A đặt tay + AUTO: chọn La thứ (trùng giọng nhận diện), không phải La trưởng
  assert.deepEqual([...keyboardScaleAt('AUTO', 9, idx.tracks, 5)!.pcs].sort((a, b) => a - b), [0, 2, 4, 5, 7, 9, 11]);
  const kb = { ...DEFAULT_PIANO_ROLL.keyboard, enabled: true, scale: 'MAJOR' as const, scaleColor: '#00ff00', scaleOpacity: 0.3 };
  const marks = rects(lay(roll({ keyboard: kb }), 3, { ...derived, tonic: 0 })).filter((r) => r.fill === '#00ff00');
  assert.ok(marks.length > 15 && marks.length <= 22); // phím thuộc Đô trưởng trong 48–84 trừ phím đang nhấn
  assert.ok(marks.some((r) => Math.abs(r.alpha - 0.54) < 1e-9), 'phím nốt chủ đậm hơn');
});

test('góc chảy (T-59): làn phủ kín khung ở mọi góc; 90° nốt rơi xuống, vạch phát nằm ngang; nhãn đứng thẳng hoặc xoay theo làn', () => {
  const f0 = flowFrame(W, H, 0); assert.equal(f0.identity, true); assert.deepEqual(flowPoint(f0, 10, 20), { x: 10, y: 20 });
  const f90 = flowFrame(W, H, 90); assert.deepEqual([f90.Lw, f90.Lh, f90.span, f90.pitchSpan], [H, W, H, W]);
  for (const a of [0, 15, 30, 45, 60, 90, 135, 180, 200, 270, 315, 359]) {
    const f = flowFrame(W, H, a);
    // bốn góc khung, đổi ngược về toạ độ làn, đều nằm trong làn
    for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H]]) {
      const dx = x - W / 2, dy = y - H / 2, u = dx * f.c + dy * f.s + f.Lw / 2, v = -dx * f.s + dy * f.c + f.Lh / 2;
      assert.ok(u >= -1e-6 && u <= f.Lw + 1e-6 && v >= -1e-6 && v <= f.Lh + 1e-6, `góc ${a}: (${x},${y}) ngoài làn`);
    }
  }
  // 90°: tương lai ở phía trên (nốt rơi xuống); 180°: nốt chạy từ trái sang phải
  const up = flowPoint(f90, f90.Lw, f90.Lh / 2), down = flowPoint(f90, 0, f90.Lh / 2);
  assert.ok(up.y < down.y && Math.abs(up.x - down.x) < 1e-9);
  const f180 = flowFrame(W, H, 180); assert.ok(flowPoint(f180, f180.Lw, 0).x < flowPoint(f180, 0, 0).x);
  // lật cao độ: 90° + lật → nốt trầm (v lớn) ở bên trái
  const fm = flowFrame(W, H, 90, true); assert.ok(flowPoint(fm, 0, fm.Lh).x < flowPoint(fm, 0, 0).x);
  assert.deepEqual(flowRect(f90, { kind: 'rect', x: 0, y: 0, w: 10, h: 2, fill: '#fff', alpha: 1, radius: 0, glowColor: '', glowBlur: 0, stroke: '', strokeWidth: 0 }).w, 2);
  // renderer 90°: vạch phát nằm ngang, ở 70% chiều cao (vị trí 30% tính từ dưới lên)
  const p = roll({ flowAngle: 90, keyboard: { ...DEFAULT_PIANO_ROLL.keyboard, enabled: false } });
  const ph = rects(lay(p, 1)).find((r) => r.fill === '#ffffff' && r.w === W)!;
  assert.ok(ph && ph.h === 2 && Math.abs(ph.y + 1 - H * 0.7) < 1e-9);
  // góc tự do: hình xoay quanh tâm; bàn phím bật thì nhãn đứng thẳng (không xoay) hoặc xoay theo làn
  const kb = { ...DEFAULT_PIANO_ROLL.keyboard, enabled: true, labels: 'C' as const };
  const at = lay(roll({ flowAngle: 30, keyboard: kb }), 1);
  assert.ok(rects(at).some((r) => r.rotation === 150));
  assert.ok(texts(at).every((x) => x.rotation === undefined));
  assert.ok(texts(lay(roll({ flowAngle: 30, keyboard: kb, labelsUpright: false }), 1)).every((x) => x.rotation === -30));
});

test('góc chảy: tua tới/lui cho cùng khung (hàm thuần của t); hạt NOTE xuất phát đúng chỗ nốt chạm vạch phát đã xoay', () => {
  const p = roll({ flowAngle: 135, grid: { bars: true, beats: true, numbers: true, color: '#ffffff', opacity: 0.3 }, keyboard: { ...DEFAULT_PIANO_ROLL.keyboard, enabled: true, labels: 'WHITE' } });
  const fwd = [0.2, 1.1, 2.3].map((t) => lay(p, t)), back = [2.3, 1.1, 0.2].map((t) => lay(p, t)).reverse();
  assert.deepEqual(fwd, back);
  // điểm phát hạt = điểm (vạch phát, tâm hàng cao độ) của làn, đổi sang khung
  const w = { ...p, layout: { ...p.layout, x: 10, y: 20 } };
  const scene = { schemaVersion: SCENE_SCHEMA_VERSION, presetName: '', author: '', canvas: { aspectRatio: '16:9', designWidth: 1920, designHeight: 1080, backgroundColor: '#000000', backgroundImageData: null, snapping: { gridEnabled: false, gridSize: 8, smartGuidesEnabled: false } },
    widgets: [w, { id: 'pt', type: 'PARTICLES', zIndex: 20, visible: true, layout: { x: 0, y: 0, width: 1920, height: 1080, rotation: 0, anchor: { x: 0.5, y: 0.5 } }, trackMappingMode: 'ALL', assignedTrackIndices: [], properties: {} }] } as any;
  let seen: { x: number; y: number } | null = null;
  const probe = { ...pianoRollRenderer, type: 'PARTICLES', layout: (c: any) => { seen = c.emitter(60, 1); return []; } } as any;
  layoutFrame(scene, derived, ast, 1, { PIANO_ROLL: pianoRollRenderer, PARTICLES: probe } as any);
  const L = pianoRollLane(p.properties, W, H, 1), rowH = L.f.Lh / 37, m = flowPoint(L.f, L.playU, (84 - 60) * rowH + rowH / 2);
  assert.ok(seen && Math.abs(seen!.x - (10 + m.x)) < 1e-9 && Math.abs(seen!.y - (20 + m.y)) < 1e-9);
});
