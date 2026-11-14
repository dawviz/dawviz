// T-05: SceneDocument + renderFrame. Tất định ở Node (Technical Design §5.5), tỉ lệ pt → pixel, kiểm lược đồ preset.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseProject } from '@dawviz/parser';
import { DEFAULT_CHORD, buildIndex, defaultScene, sanitizeScene, renderFrame, layoutFrame, pianoRollWidget, tracksFor, pianoRollPitchRange,
  DEFAULT_BRIGHTNESS, SCENE_SCHEMA_VERSION, pianoRollGeometry, layoutPianoRoll, layoutKeyboard, type Derived, type Primitive, type RectPrim } from '../src/index.ts';

const fixtures = new URL('../../../test/fixtures/', import.meta.url);
const load = async () => {
  const { ast } = await parseProject('BigProject4b.rpp', fs.readFileSync(new URL('BigProject4b.rpp', fixtures)), {});
  const derived: Derived = { index: buildIndex(ast.tracks, ast.meta.totalDurationSeconds), brightness: Object.fromEntries(ast.tracks.map((t: any) => [t.id, { ...DEFAULT_BRIGHTNESS }])) };
  return { ast, derived };
};

/** Ctx giả ghi mọi lệnh vẽ thành chuỗi (số làm tròn 4 chữ số) để so sánh tất định. */
function recCtx() {
  const log: string[] = []; const st: Record<string, unknown> = { globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1, shadowColor: '', shadowBlur: 0 };
  const f = (n: number) => Number(n.toFixed(4));
  const call = (name: string) => (...a: number[]) => { log.push(`${name}(${a.map(f).join(',')})`); };
  const ctx: any = new Proxy({}, {
    get: (_, k: string) => (k in st ? st[k] : call(k)),
    set: (_, k: string, v) => { st[k] = v; log.push(`${k}=${typeof v === 'number' ? f(v) : v}`); return true; },
  });
  return { ctx, log };
}

test('renderFrame: cùng (scene, t) → cùng chuỗi lệnh vẽ; tua thẳng tới t giống đi qua nhiều t khác trước đó', async () => {
  const { ast, derived } = await load();
  const scene = defaultScene();
  const once = (t: number) => { const { ctx, log } = recCtx(); renderFrame(scene, derived, ast, t, { ctx, width: 1920, height: 1080 }, 1); return log.join('\n'); };
  const direct = once(12.34);
  for (const t of [0, 5, 30, 12.3, 99]) once(t);   // "phát" qua các khung khác
  assert.equal(once(12.34), direct);
  assert.ok(direct.includes('fill') || direct.includes('fillRect'));
  assert.notEqual(once(12.34), once(40));
});

test('renderFrame: scale nhân mọi kích thước (3840 px = 2 × 1920 pt); nền phủ đủ khung thiết kế', async () => {
  const { ast, derived } = await load();
  const { ctx, log } = recCtx();
  renderFrame(defaultScene(), derived, ast, 3, { ctx, width: 3840, height: 2160 }, 2);
  assert.ok(log.includes('clearRect(0,0,3840,2160)'));
  assert.ok(log.includes('setTransform(2,0,0,2,0,0)'));
  assert.ok(log.includes('fillRect(0,0,1920,1080)'));
});

test('layoutFrame: sắp theo zIndex, widget ẩn và widget chưa có renderer bị bỏ qua; mỗi widget cắt theo khung', async () => {
  const { ast, derived } = await load();
  const s = defaultScene();
  s.widgets = [
    pianoRollWidget({ x: 0, y: 0, width: 960, height: 540, rotation: 0 }, {}, 'a'),
    { ...pianoRollWidget({ x: 960, y: 0, width: 960, height: 540, rotation: 0 }, {}, 'b'), zIndex: 5 },
    { ...pianoRollWidget({ x: 0, y: 540, width: 960, height: 540, rotation: 0 }, {}, 'c'), visible: false },
    { id: 'spectrum', type: 'AUDIO_SPECTRUM', zIndex: 99, visible: true, layout: { x: 0, y: 0, width: 10, height: 10, rotation: 0 }, trackMappingMode: 'ALL', assignedTrackIndices: [], properties: {} },
  ];
  assert.deepEqual(layoutFrame(s, derived, ast, 3).map((x) => x.widget.id), ['b', 'a']);
  const { ctx, log } = recCtx();
  renderFrame(s, derived, ast, 3, { ctx, width: 1920, height: 1080 }, 1);
  assert.ok(log.includes('translate(960,0)') && log.includes('rect(0,0,960,540)') && log.filter((l) => l === 'clip()').length === 2);
});

test('Piano Roll: tỉ lệ thời gian cố định (width / visibleSeconds), không đổi theo vị trí vạch phát hay bàn phím; bàn phím bật → vạch ở mép bàn phím (T-71)', async () => {
  const { ast, derived } = await load();
  const w = pianoRollWidget({ x: 0, y: 0, width: 1000, height: 500, rotation: 0 });
  const playOf = (prims: Primitive[]) => prims.find((p) => p.kind === 'rect' && p.fill === '#ffffff' && p.h === 500 && p.w === 2) as RectPrim | undefined;
  const props = (kbOn: boolean, ratio: number, extra = {}) => ({ ...w, properties: { ...w.properties, ...extra, playheadPositionRatio: ratio, keyboard: { ...w.properties.keyboard, enabled: kbOn } } });
  const noteW = (spec: typeof w) => (layoutFrame({ ...defaultScene(), widgets: [spec] }, derived, ast, 10)[0].prims as RectPrim[]).filter((p) => p.h < 500 && p.w > 2).map((p) => Math.round(p.w * 1e6) / 1e6).sort((a, b) => a - b);
  const pxPerSec = 1000 / w.properties.visibleSeconds;
  const kb = w.properties.keyboard.width;
  for (const [kbOn, ratio] of [[false, 0.3], [false, 0.8], [true, 0.3], [true, 0.9]] as const) {
    const g = pianoRollGeometry(props(kbOn, ratio).properties, 1000);
    assert.equal(g.pxPerSec, pxPerSec, `kb ${kbOn} ratio ${ratio}`);
    assert.equal(g.playX, kbOn ? kb : 1000 * ratio);
    const [{ prims }] = layoutFrame({ ...defaultScene(), widgets: [props(kbOn, ratio)] }, derived, ast, 10);
    assert.ok(Math.abs(playOf(prims)!.x + 1 - g.playX) < 1e-9);
    for (const p of prims) { assert.ok(p.y >= -1e-9 && p.y + p.h <= 500 + 1e-9); assert.ok(p.alpha > 0 && p.alpha <= 1); }
  }
  // cùng một nốt có cùng bề rộng dù dời vạch phát (lấy nốt chung bằng cửa sổ rộng để cả hai vị trí đều thấy đủ)
  const wide = { visibleSeconds: 60 };
  const a = noteW(props(false, 0.3, wide)), b = noteW(props(false, 0.7, wide));
  assert.ok(a.length > 0 && Math.max(...a) === Math.max(...b));
  // ẩn vạch phát: không còn nét vạch, nốt giữ nguyên
  const hidden = props(false, 0.3, { playheadVisible: false });
  assert.equal(playOf(layoutFrame({ ...defaultScene(), widgets: [hidden] }, derived, ast, 10)[0].prims), undefined);
  assert.deepEqual(noteW(hidden), noteW(props(false, 0.3)));
});

test('sanitizeScene: thiếu visibleSeconds → lấy lookahead / (1 − ratio) như cách tính cũ; có thì kẹp 0,5–60; playheadVisible mặc định true', () => {
  const mk = (props: object) => sanitizeScene({ ...defaultScene(), widgets: [{ ...pianoRollWidget({ x: 0, y: 0, width: 100, height: 100, rotation: 0 }), properties: props }] }).scene.widgets[0].properties as any;
  assert.equal(mk({ lookaheadSeconds: 1, playheadPositionRatio: 0.84 }).visibleSeconds, 6.25); // làm tròn 1e-6
  assert.equal(mk({ visibleSeconds: 100 }).visibleSeconds, 60);
  assert.equal(mk({}).playheadVisible, true);
  assert.equal(mk({ playheadVisible: false }).playheadVisible, false);
});

test('layoutPianoRoll: nốt đang phát nằm sau cùng (vẽ đè lên nốt chưa phát và đã phát), thứ tự trong mỗi nhóm giữ nguyên (T-71)', () => {
  const mk = (id: string, start: number, end: number, pitch = 60) => ({ id, pitch, velocity: 100, startTick: 0, durationTick: 0, startTimeSeconds: start, endTimeSeconds: end });
  // nốt dài A đang phát; B chưa phát nằm trùng hàng, xếp TRƯỚC A trong track sau; C đã phát
  const track = (id: string, notes: ReturnType<typeof mk>[]) => ({ id, name: id, color: '#ff0000', isVisible: true, isMuted: false, pitchRange: { min: 60, max: 60 }, notes, automation: [] }) as any;
  const tracks = [track('t1', [mk('C', 0, 1), mk('A', 1, 9)]), track('t2', [mk('B', 6, 8)])];
  const index = buildIndex(tracks, 10);
  const rects = layoutPianoRoll(index, [{ tick: 0, bpm: 120 } as any], 5, { width: 1000, height: 100, windowSeconds: 10, playheadRatio: 0.5, pitchMin: 59, pitchMax: 61 });
  // D-56: t2 vẽ trước (ưu tiên thấp hơn) rồi t1; nốt đang phát vẫn sau cùng
  assert.deepEqual(rects.map((r) => [r.id, r.active]), [['B', false], ['C', false], ['A', true]]);
});

test('D-56: track đứng trước trong danh sách vẽ đè lên track sau; bàn phím lấy màu track đứng trước khi trùng phím', () => {
  const mk = (id: string) => ({ id, pitch: 60, velocity: 100, startTick: 0, durationTick: 0, startTimeSeconds: 1, endTimeSeconds: 3 });
  const track = (id: string, color: string) => ({ id, name: id, color, isVisible: true, isMuted: false, pitchRange: { min: 60, max: 60 }, notes: [mk(id + '-n')], automation: [] }) as any;
  const opts = { width: 1000, height: 100, windowSeconds: 10, playheadRatio: 0.5, pitchMin: 59, pitchMax: 61 };
  const tempo = [{ tick: 0, bpm: 120 } as any];
  const piano = buildIndex([track('piano', '#ff0000'), track('violin', '#00ff00')], 10);
  const violinFirst = buildIndex([track('violin', '#00ff00'), track('piano', '#ff0000')], 10);
  for (const t of [0, 2]) { // chưa phát và đang phát: track đầu danh sách luôn ở cuối mảng (vẽ sau cùng)
    assert.deepEqual(layoutPianoRoll(piano, tempo, t, opts).map((r) => r.trackId), ['violin', 'piano'], `t=${t}`);
    assert.deepEqual(layoutPianoRoll(violinFirst, tempo, t, opts).map((r) => r.trackId), ['piano', 'violin'], `t=${t}`);
  }
  const key = (idx: typeof piano) => layoutKeyboard(idx, 2, { height: 100, pitchMin: 59, pitchMax: 61 }).find((k) => k.pitch === 60)!.color;
  assert.equal(key(piano), '#ff0000');
  assert.equal(key(violinFirst), '#00ff00');
});

test('tracksFor + tầm cao độ: MANUAL theo chỉ số track; FIT_CONTENT ±1; CUSTOM giữ nguyên; rỗng → C3–C6', async () => {
  const { derived } = await load();
  const w = pianoRollWidget({ x: 0, y: 0, width: 10, height: 10, rotation: 0 });
  assert.equal(tracksFor({ ...w, trackMappingMode: 'MANUAL', assignedTrackIndices: [99] }, derived.index).length, 0);
  assert.equal(tracksFor(w, derived.index).length, derived.index.tracks.length);
  assert.deepEqual(pianoRollPitchRange(w.properties, derived.index.tracks), [20, 106]);
  assert.deepEqual(pianoRollPitchRange({ ...w.properties, pitchRangeMode: 'CUSTOM', pitchMin: 36, pitchMax: 72 }, []), [36, 72]);
  assert.deepEqual(pianoRollPitchRange(w.properties, []), [48, 84]);
});

test('sanitizeScene: preset mẫu trong SRS đọc được; trường lạ bị bỏ, giá trị sai về mặc định kèm cảnh báo; hỏng → ERR_PRESET_INVALID', () => {
  const srsExample = {
    schemaVersion: SCENE_SCHEMA_VERSION, presetName: 'Minimalist Cyberpunk Horizontal', author: 'System Default',
    canvas: { aspectRatio: '16:9', designWidth: 1920, designHeight: 1080, backgroundColor: '#0d0f12', backgroundImageData: null, snapping: { gridEnabled: true, gridSize: 8, smartGuidesEnabled: true } },
    widgets: [
      { id: 'piano-roll-main', type: 'PIANO_ROLL', zIndex: 10, layout: { x: 120, y: 300, width: 1680, height: 450, rotation: 0 }, trackMappingMode: 'AUTO_ASSIGN_FIRST_MELODIC', assignedTrackIndices: [0],
        properties: { orientation: 'HORIZONTAL', pitchRangeMode: 'FIT_CONTENT', lookaheadSeconds: 3.5, playheadPositionRatio: 0.3, noteBorderRadius: 4 } },
      { id: 'chord-hud', type: 'CHORD_DETECTION', zIndex: 20, layout: { x: 1400, y: 800, width: 400, height: 180, rotation: 0 }, properties: { detectionMode: 'SUSTAINED', displaySlashChord: true, fontSize: 48, fontFamily: 'Inter' } },
    ],
  };
  const { scene, warnings } = sanitizeScene(srsExample);
  assert.deepEqual(warnings, []);
  assert.equal(scene.widgets.length, 2);
  const pr: any = scene.widgets[0].properties;
  assert.equal(pr.lookaheadSeconds, 3.5); assert.equal(pr.noteStyle.base.cornerRadius, 4);
  // Chord Detection nay có renderer (T-69): khoá cũ của ví dụ SRS không còn nghĩa nên bị bỏ (không cảnh báo), thuộc tính mới lấy mặc định.
  const ch: any = scene.widgets[1].properties; assert.deepEqual(ch, DEFAULT_CHORD); assert.ok(!('detectionMode' in ch));
  const spec = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ type: 'AUDIO_SPECTRUM', properties: { bars: 64 } }] }); // widget chưa có renderer: giữ nguyên dữ liệu
  assert.deepEqual(spec.scene.widgets[0].properties, { bars: 64 });

  const bad = sanitizeScene({ schemaVersion: '0.5.1', junk: 1, canvas: { designWidth: 99999, backgroundColor: 'red' },
    widgets: [{ type: 'NOPE' }, { type: 'PIANO_ROLL', id: 'x', properties: { lookaheadSeconds: 'fast', orientation: 'VERTICAL', pitchMin: 90, pitchMax: 40 }, layout: { rotation: 15 } }, { type: 'PIANO_ROLL', id: 'x' }] });
  const codes = bad.warnings.map((w) => `${w.code}@${w.details.path}`);
  for (const c of ['WARN_PRESET_VERSION@$.schemaVersion', 'WARN_PRESET_VALUE@$.canvas.designWidth', 'WARN_PRESET_VALUE@$.canvas.backgroundColor', 'WARN_PRESET_WIDGET_UNKNOWN@$.widgets[0].type',
    'WARN_PRESET_VALUE@$.widgets[1].properties.lookaheadSeconds', 'WARN_PRESET_UNSUPPORTED@$.widgets[1].properties.orientation',
    'WARN_PRESET_VALUE@$.widgets[1].properties.pitchMin', 'WARN_PRESET_VALUE@$.widgets[2].id']) assert.ok(codes.includes(c), c);
  assert.equal(bad.scene.canvas.designWidth, 4096);
  assert.equal(bad.scene.schemaVersion, SCENE_SCHEMA_VERSION);
  assert.deepEqual(bad.scene.widgets.map((w) => w.id), ['x', 'x-2']);
  assert.ok(!('junk' in bad.scene));
  assert.ok(!codes.some((c) => c.endsWith('.layout.rotation'))); assert.equal(bad.scene.widgets[0].layout.rotation, 15); // T-68: xoay vẽ được, không còn đặt về 0
  const p1: any = bad.scene.widgets[0].properties; assert.deepEqual([p1.pitchMin, p1.pitchMax, p1.lookaheadSeconds], [40, 90, 3]);

  for (const raw of [null, [], {}, { schemaVersion: 'abc', canvas: {} }, { schemaVersion: '0.2.0', canvas: {} }, { schemaVersion: '0.3.0' }])
    assert.throws(() => sanitizeScene(raw), (e: any) => e.code === 'ERR_PRESET_INVALID');
  // vòng lặp lưu → đọc lại không đổi
  assert.deepEqual(sanitizeScene(JSON.parse(JSON.stringify(scene))).scene, scene);
});

test('Render Core không dùng đồng hồ, số ngẫu nhiên hay vòng lặp khung của trình duyệt (tất định, Technical Design §5.1)', () => {
  const dir = new URL('../src/', import.meta.url);
  const banned = /\b(Date\s*[.(]|new Date\b|performance\.|Math\.random|requestAnimationFrame|setTimeout|setInterval)/;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.ts')) continue;
    const code = fs.readFileSync(new URL(f, dir), 'utf8').split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*'));
    const hit = code.findIndex((l) => banned.test(l.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, '')));
    assert.equal(hit, -1, `${path.basename(f)}:${hit + 1} dùng API không tất định`);
  }
});
