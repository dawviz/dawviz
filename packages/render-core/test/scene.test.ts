// T-05: SceneDocument + renderFrame. Tất định ở Node (Technical Design §5.5), tỉ lệ pt → pixel, kiểm lược đồ preset.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseProject } from '@dawviz/parser';
import { buildIndex, defaultScene, sanitizeScene, renderFrame, layoutFrame, pianoRollWidget, tracksFor, pianoRollPitchRange,
  DEFAULT_BRIGHTNESS, SCENE_SCHEMA_VERSION, type Derived } from '../src/index.ts';

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
    { id: 'chord', type: 'CHORD_DETECTION', zIndex: 99, visible: true, layout: { x: 0, y: 0, width: 10, height: 10, rotation: 0 }, trackMappingMode: 'ALL', assignedTrackIndices: [], properties: {} },
  ];
  assert.deepEqual(layoutFrame(s, derived, ast, 3).map((x) => x.widget.id), ['b', 'a']);
  const { ctx, log } = recCtx();
  renderFrame(s, derived, ast, 3, { ctx, width: 1920, height: 1080 }, 1);
  assert.ok(log.includes('translate(960,0)') && log.includes('rect(0,0,960,540)') && log.filter((l) => l === 'clip()').length === 2);
});

test('Piano Roll: lookahead 3 s sau playhead ở 30% → cửa sổ 3/0.7 s; playhead và bàn phím nằm trong khung widget', async () => {
  const { ast, derived } = await load();
  const w = pianoRollWidget({ x: 0, y: 0, width: 1000, height: 500, rotation: 0 });
  const [{ prims }] = layoutFrame({ ...defaultScene(), widgets: [w] }, derived, ast, 10);
  const kb = w.properties.keyboard.width;
  const play = prims.find((p) => p.fill === '#ffffff' && p.h === 500 && p.w === 2)!;
  assert.ok(Math.abs(play.x + 1 - (kb + (1000 - kb) * 0.3)) < 1e-9);
  for (const p of prims) { assert.ok(p.y >= -1e-9 && p.y + p.h <= 500 + 1e-9); assert.ok(p.alpha > 0 && p.alpha <= 1); }
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
    schemaVersion: '0.3.0', presetName: 'Minimalist Cyberpunk Horizontal', author: 'System Default',
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
  assert.deepEqual(scene.widgets[1].properties, srsExample.widgets[1].properties); // widget chưa có renderer: giữ nguyên dữ liệu

  const bad = sanitizeScene({ schemaVersion: '0.3.1', junk: 1, canvas: { designWidth: 99999, backgroundColor: 'red' },
    widgets: [{ type: 'NOPE' }, { type: 'PIANO_ROLL', id: 'x', properties: { lookaheadSeconds: 'fast', orientation: 'VERTICAL', pitchMin: 90, pitchMax: 40 }, layout: { rotation: 15 } }, { type: 'PIANO_ROLL', id: 'x' }] });
  const codes = bad.warnings.map((w) => `${w.code}@${w.details.path}`);
  for (const c of ['WARN_PRESET_VERSION@$.schemaVersion', 'WARN_PRESET_VALUE@$.canvas.designWidth', 'WARN_PRESET_VALUE@$.canvas.backgroundColor', 'WARN_PRESET_WIDGET_UNKNOWN@$.widgets[0].type',
    'WARN_PRESET_VALUE@$.widgets[1].properties.lookaheadSeconds', 'WARN_PRESET_UNSUPPORTED@$.widgets[1].properties.orientation', 'WARN_PRESET_UNSUPPORTED@$.widgets[1].layout.rotation',
    'WARN_PRESET_VALUE@$.widgets[1].properties.pitchMin', 'WARN_PRESET_VALUE@$.widgets[2].id']) assert.ok(codes.includes(c), c);
  assert.equal(bad.scene.canvas.designWidth, 4096);
  assert.equal(bad.scene.schemaVersion, SCENE_SCHEMA_VERSION);
  assert.deepEqual(bad.scene.widgets.map((w) => w.id), ['x', 'x-2']);
  assert.ok(!('junk' in bad.scene));
  const p1: any = bad.scene.widgets[0].properties; assert.deepEqual([p1.pitchMin, p1.pitchMax, p1.lookaheadSeconds], [40, 90, 3]);

  for (const raw of [null, [], {}, { schemaVersion: '1.0.0', canvas: {} }, { schemaVersion: '0.3.0' }])
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
