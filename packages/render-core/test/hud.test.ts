// T-69: sáu widget chữ. Tất định, số đếm khớp tính tay, định dạng đúng ví dụ trong SRS.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layoutFrame, sanitizeScene, SCENE_SCHEMA_VERSION, formatTemplate, groupDigits, clockMs, fitText, measureText, buildBarGrid, barPosAt, chordTimeline, buildHud, buildSceneHud,
  WIDGET_RENDERERS, type SceneDocument, type TextPrim, type Primitive } from '../src/index.ts';
import { synthAst, derivedOf } from './helpers.ts';

const sceneWith = (type: string, properties: object, layout = { x: 0, y: 0, width: 600, height: 120 }): SceneDocument => {
  const { scene, warnings } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'w', type, layout, properties }] });
  assert.deepEqual(warnings, []); return scene;
};
const prims = (scene: SceneDocument, t: number, ast = synthAst()) => layoutFrame(scene, derivedOf(ast), ast, t)[0].prims;
const texts = (p: Primitive[]) => p.filter((x): x is TextPrim => x.kind === 'text').map((x) => x.text);

test('mẫu chữ, chia nhóm, đồng hồ', () => {
  assert.equal(formatTemplate('Num played notes: {played}/{total} ({pct})', { played: 1271, total: 1917, pct: '66.30%' }), 'Num played notes: 1271/1917 (66.30%)');
  assert.equal(formatTemplate('{x} {played}', { played: 1 }), '{x} 1');
  assert.equal(groupDigits([1, 35, 83], [3, 2, 3]), '001 35 083');
  assert.equal(groupDigits([37, 6, 93], [3, 2, 3]), '037 06 093');
  assert.equal(groupDigits([12345, 1], [3, 2]), '12345 01'); // số lớn không bị cắt
  assert.equal(clockMs(95), '1:35'); assert.equal(clockMs(154), '2:34'); assert.equal(clockMs(-5), '0:00');
});

test('đo chữ: fitText cắt bằng "…" và không bao giờ vượt khung; ký tự ngoài bảng có độ rộng dự phòng', () => {
  const s = 'The quick brown fox jumps over the lazy dog';
  for (const max of [0, 10, 50, 120, 400]) {
    const r = fitText(s, max, 'Space Grotesk', 20, 400);
    assert.ok(measureText(r, 'Space Grotesk', 20, 400) <= max + 1e-6, `max ${max}`);
  }
  assert.equal(fitText('Hi', 400, 'Space Grotesk', 20, 400), 'Hi');
  assert.ok(measureText('日本語', 'x', 20, 400) === 60 && measureText('é', 'x', 20, 400) > 0); // CJK 1 em/ký tự; tiếng Việt có trong bảng
  assert.ok(measureText('ệ', 'x', 20, 700) > 0 && measureText('😀', 'x', 20, 400) === 20);
});

test('BarGrid: 4/4, 6/8, đổi nhịp giữa bài (bar bắt đầu tại điểm đổi), đổi tempo không ngắt ô nhịp', () => {
  const g = buildBarGrid([{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }]);
  assert.deepEqual([barPosAt(g, 0).bar, barPosAt(g, 0).beat, barPosAt(g, 0).sub], [1, 1, 0]);
  const p = barPosAt(g, 2.75); // 5,5 beat: bar 2, beat 2, nửa beat = 480 tick
  assert.deepEqual([p.bar, p.beat, p.sub, p.beatPhase, p.barPhase], [2, 2, 480, 0.5, 0.375]);
  // 6/8 từ tick 3840 (đúng đầu bar 2): một beat = 480 tick, 6 beat mỗi ô nhịp
  const g2 = buildBarGrid([{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }, { tick: 3840, timeSeconds: 2, bpm: 120, timeSigNumerator: 6, timeSigDenominator: 8 }]);
  const q = barPosAt(g2, 2 + 0.25 * 7 * 1); // 7 nốt móc = 3360 tick: bar 2 của 6/8 = (1 bar × 2880) + 480 → bar 3 beat 2
  assert.deepEqual([q.bar, q.beat, q.num, q.den], [3, 2, 6, 8]);
  // đổi tempo giữa ô nhịp 4/4: không bắt đầu bar mới
  const g3 = buildBarGrid([{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }, { tick: 960, timeSeconds: 0.5, bpm: 60 }]);
  assert.equal(barPosAt(g3, 0.5 + 1).bar, 1); assert.equal(barPosAt(g3, 0.5 + 1).beat, 3); // 1 s ở 60 BPM = 1 beat nữa sau beat 2
});

test('Time & Bar: "001 35 083" và hai vạch tiến độ', () => {
  const ast = synthAst({ duration: 200, tracks: [{ name: 'a', color: '#fff', notes: [[60, 0, 1, 90]] }] });
  const sc = sceneWith('TIME_BAR', {});
  const out = prims(sc, 95.083, ast);
  assert.equal(texts(out)[0], '001 35 083');
  assert.ok(texts(out).includes('time') && texts(out).includes('beat'));
  assert.equal(out.filter((p) => p.kind === 'rect').length, 4 - 0); // 2 vạch × (rãnh + phần đã đầy)
  const clock = sceneWith('TIME_BAR', { time: { format: 'clock' }, beat: { format: 'bbs' }, showBars: false });
  // 95,083 s ở 120 BPM = 190,166 beat: bar 48, beat 3, sub = 0,166 × 960 ≈ 159
  assert.deepEqual(texts(prims(clock, 95.083, ast)).filter((x) => /\d/.test(x)), ['01:35.083', '48.3.159']);
});

test('Event Counter: Played/Total/% khớp tính tay; Total=0 không chia cho 0; số thập phân chỉnh được', () => {
  const ast = synthAst(); // 12 nốt; bắt đầu tại 0 (4 nốt hợp âm + lead 0,25 s) ...
  const all = ast.tracks.flatMap((t) => t.notes);
  const sc = sceneWith('EVENT_COUNTER', { decimals: 1 });
  for (const t of [0, 0.3, 1.2, 2.6, 4]) {
    const played = all.filter((n) => n.startTimeSeconds <= t).length;
    assert.equal(texts(prims(sc, t, ast))[0], `Num played notes: ${played}/${all.length} (${(played / all.length * 100).toFixed(1)}%)`, `t=${t}`);
  }
  const empty = synthAst({ tracks: [{ name: 'e', color: '#fff', notes: [[60, 0, 1, 90]] }] }); empty.tracks[0].notes = [];
  assert.equal(texts(prims(sceneWith('EVENT_COUNTER', {}), 1, empty))[0], 'Num played notes: 0/0 (0.00%)');
  const tempo = sceneWith('EVENT_COUNTER', { lines: { played: { enabled: false }, tempo: { enabled: true } } });
  assert.deepEqual(texts(prims(tempo, 1, ast)), ['Tempo: 120 BPM']);
});

test('Live Note Trigger: danh sách dọc, một dòng ngang kèm hậu tố track, đuôi mờ dần, "+N"', () => {
  const ast = synthAst();
  const list = sceneWith('LIVE_TRIGGER', { tailMs: 0 });
  const names = texts(prims(list, 0.3, ast)); // pitch giảm dần: 76 (E5) rồi 62 (D4), 59, 56, 52
  assert.deepEqual(names, ['Note: E5 (Vel: 90)', 'Note: D4 (Vel: 76)', 'Note: B3 (Vel: 78)', 'Note: G#3 (Vel: 80)', 'Note: E3 (Vel: 82)']);
  const inline = sceneWith('LIVE_TRIGGER', { mode: 'inline', align: 'left', showTrack: true, tailMs: 0 }, { x: 0, y: 0, width: 2000, height: 30 });
  const line = prims(inline, 0.3, ast) as TextPrim[];
  assert.equal(line.every((p) => p.y === line[0].y), true); // cùng một dòng
  assert.equal(line.at(-1)!.text, '< Lead, Chords');
  assert.ok(line.every((p, i) => i === 0 || p.x > line[i - 1].x));
  // quá hẹp: bỏ nốt thấp nhất, thêm +N, không bao giờ rộng hơn khung
  const narrow = sceneWith('LIVE_TRIGGER', { mode: 'inline', align: 'right', tailMs: 0 }, { x: 0, y: 0, width: 260, height: 30 });
  const nl = prims(narrow, 0.3, ast) as TextPrim[];
  assert.ok(nl.at(-1)!.text.startsWith('+')); assert.ok(nl.every((p) => p.x >= 0));
  // đuôi mờ: nốt Lead 0.25–0.5 s; ở t = 0.55 với đuôi 300 ms còn alpha ≈ 0,83
  const tail = sceneWith('LIVE_TRIGGER', { tailMs: 300, mode: 'list' });
  const fading = (prims(tail, 0.55, ast) as TextPrim[]).find((p) => p.text.includes('E5'))!;
  assert.ok(Math.abs(fading.alpha - (1 - 0.05 / 0.3)) < 1e-9);
  assert.equal((prims(tail, 0.9, ast) as TextPrim[]).find((p) => p.text.includes('E5')), undefined);
});

test('Chord Detection: E7/G#, danh sách nốt kèm tên khi bật, N.C. khi không nhận diện', () => {
  // G#2 E3 D4 E4 G#4 B4 trong 0–2 s, rồi một nốt C4 lẻ
  const ast = synthAst({ tracks: [{ name: 'k', color: '#fff', notes: [[44, 0, 4, 80], [52, 0, 4, 80], [62, 0, 4, 80], [64, 0, 4, 80], [68, 0, 4, 80], [71, 0, 4, 80], [60, 4, 2, 80]] }] });
  const plain = sceneWith('CHORD_DETECTION', {});
  assert.deepEqual(texts(prims(plain, 0.2, ast)), ['E7/G#']);
  assert.deepEqual(texts(prims(sceneWith('CHORD_DETECTION', { alwaysShowNotes: true }), 0.2, ast)), ['E7/G#', 'Notes: G#2 E3 D4 E4 G#4 B4']);
  assert.deepEqual(texts(prims(plain, 2.2, ast)), ['N.C.']);   // một nốt: không phải hợp âm
  assert.deepEqual(texts(prims(plain, 9, ast)), []);           // không có nốt
  assert.deepEqual(texts(prims(sceneWith('CHORD_DETECTION', { unrecognized: 'notes' }), 2.2, ast)), ['Notes: C4']);
  const idx = derivedOf(ast).index, hud = buildHud(ast, idx);
  assert.equal(chordTimeline(hud, idx.tracks), chordTimeline(hud, idx.tracks)); // đệm theo nhóm track
  assert.equal(chordTimeline(hud, idx.tracks)[0].name, 'E7/G#');
});

test('Track Info và Progress Bar', () => {
  const ast = synthAst({ duration: 154 });
  assert.deepEqual(texts(prims(sceneWith('TRACK_INFO', {}), 0, ast)), ['Demo Song', 'Demo Artist']);
  assert.deepEqual(texts(prims(sceneWith('TRACK_INFO', { titleText: 'Mine', artistText: '' }), 0, ast)), ['Mine', 'Demo Artist']);
  const pb = sceneWith('PROGRESS_BAR', {}, { x: 0, y: 0, width: 1000, height: 32 });
  const out = prims(pb, 95, ast);
  const bar = out.find((p) => p.kind === 'rect')!; assert.ok(Math.abs((bar as any).w - 1000 * 95 / 154) < 1e-9); assert.equal(texts(out)[0], '1:35 / 2:34');
  const zero = synthAst({ duration: 0 }); zero.meta.totalDurationSeconds = 0;
  assert.equal(prims(pb, 5, zero).filter((p) => p.kind === 'rect').length, 0); // Duration 0 → 0%
});

test('tất định cho từng widget: cùng (scene, t) → cùng danh sách, không phụ thuộc thứ tự gọi', () => {
  const ast = synthAst();
  for (const type of ['TRACK_INFO', 'EVENT_COUNTER', 'LIVE_TRIGGER', 'TIME_BAR', 'CHORD_DETECTION', 'PROGRESS_BAR']) {
    assert.ok(WIDGET_RENDERERS[type as keyof typeof WIDGET_RENDERERS], type);
    const sc = sceneWith(type, type === 'LIVE_TRIGGER' ? { mode: 'inline', showTrack: true } : type === 'CHORD_DETECTION' ? { alwaysShowNotes: true } : {});
    const d = derivedOf(ast), direct = JSON.stringify(layoutFrame(sc, d, ast, 1.7));
    for (const t of [0, 4.2, 0.4, 9, 1.7]) layoutFrame(sc, d, ast, t);
    assert.equal(JSON.stringify(layoutFrame(sc, derivedOf(ast), ast, 1.7)), direct, type);
    assert.equal(JSON.stringify(layoutFrame(sc, d, ast, 1.7)), direct, type);
  }
});

test('sanitizeScene: chỗ giữ lạ → cảnh báo, chữ giữ nguyên; giá trị sai về mặc định', () => {
  const r = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ type: 'EVENT_COUNTER', id: 'e', properties: { decimals: 9, style: { size: 'big', color: 'red' }, lines: { played: { template: 'x {bogus}' } } } }] });
  const paths = r.warnings.map((w) => w.details.path);
  for (const p of ['$.widgets[0].properties.decimals', '$.widgets[0].properties.style.size', '$.widgets[0].properties.style.color', '$.widgets[0].properties.lines.played.template']) assert.ok(paths.includes(p), p);
  assert.equal((r.scene.widgets[0].properties as any).lines.played.template, 'x {bogus}');
  assert.equal((r.scene.widgets[0].properties as any).decimals, 4);
});

test('hợp âm dò ở bước derived (buildSceneHud); vẽ khung chỉ đọc bảng đã dựng và không dò lại', () => {
  const ast = synthAst({ tracks: [{ name: 'k', color: '#fff', notes: [[44, 0, 4, 80], [52, 0, 4, 80], [62, 0, 4, 80], [64, 0, 4, 80], [68, 0, 4, 80], [71, 0, 4, 80]] }] });
  const sc = sceneWith('CHORD_DETECTION', {});
  const d = derivedOf(ast);
  const hud = buildSceneHud(sc, ast, d.index);
  assert.equal(hud.chords.size, 1);                                  // dựng sẵn cho nhóm track của widget
  const before = [...hud.chords.values()][0];
  const out = layoutFrame(sc, { ...d, hud }, ast, 0.2)[0].prims;
  assert.deepEqual(texts(out), ['E7/G#']);
  assert.equal([...hud.chords.values()][0], before); assert.equal(hud.chords.size, 1);   // vẽ không thêm, không đổi bảng
  // hud dựng KHÔNG kèm nhóm track của widget (chordGroups rỗng): vẽ không tự dò, chỉ thấy rỗng
  const bare = buildHud(ast, d.index);
  assert.deepEqual(texts(layoutFrame(sc, { ...d, hud: bare }, ast, 0.2)[0].prims), []);
  assert.equal(bare.chords.size, 0);
});

test('@tonaljs/chord-detect ghim đúng một phiên bản và chỉ hud.ts import nó', async () => {
  const fs = await import('node:fs'); const url = (p: string) => new URL(p, import.meta.url);
  const pkg = JSON.parse(fs.readFileSync(url('../package.json'), 'utf8'));
  assert.match(pkg.dependencies['@tonaljs/chord-detect'], /^\d+\.\d+\.\d+$/);   // không ^ ~ *
  const importers = fs.readdirSync(url('../src/')).filter((f) => f.endsWith('.ts') && /@tonaljs\//.test(fs.readFileSync(url(`../src/${f}`), 'utf8')));
  assert.deepEqual(importers, ['hud.ts']);
});

test('hợp âm C + track trống → C: kênh 10 và track Drums bị loại khỏi nhận diện', () => {
  const chord: [number, number, number, number][] = [[60, 0, 4, 80], [64, 0, 4, 80], [67, 0, 4, 80]];
  const drums: [number, number, number, number][] = [[36, 0, 4, 100], [38, 0, 4, 100], [42, 0, 4, 100], [49, 0, 4, 100]];
  const sc = sceneWith('CHORD_DETECTION', {});
  const name = (ast: ReturnType<typeof synthAst>) => texts(layoutFrame(sc, derivedOf(ast), ast, 0.2)[0].prims);
  // (a) track riêng tên "Drums"
  assert.deepEqual(name(synthAst({ tracks: [{ name: 'Piano', color: '#fff', notes: chord }, { name: 'Drums', color: '#000', notes: drums }] })), ['C']);
  // (b) trống nằm chung track với hợp âm nhưng ở kênh MIDI 10 (chỉ số 9), tên track không gợi ý
  const mixed = synthAst({ tracks: [{ name: 'Track 1', color: '#fff', notes: [...chord, ...drums] }] });
  mixed.tracks[0].notes.forEach((n, i) => { n.channel = i < chord.length ? 0 : 9; });
  assert.deepEqual(name(mixed), ['C']);
  // đối chứng: bỏ cả hai dấu hiệu thì trống lọt vào và không còn là "C"
  mixed.tracks[0].notes.forEach((n) => { delete n.channel; });
  assert.notDeepEqual(name(mixed), ['C']);
});

test('Chord Strike: gom nốt lệch ≤ 30 ms, giữ tên đến lần dập kế; nốt giai điệu đơn không cắt; hết nốt cuối thì thôi', () => {
  // C (0 s, lệch 20 ms) dài 0,25 s; nốt E5 đơn ở 0,5 s; Am ở 1 s; im lặng 1,5–3 s; G ở 3–3,5 s.
  const ast = synthAst({ tracks: [{ name: 'Piano', color: '#fff', notes: [[60, 0, 0.5, 80], [64, 0.04, 0.5, 80], [67, 0, 0.5, 80], [76, 1, 0.5, 90], [57, 2, 1, 80], [60, 2, 1, 80], [64, 2, 1, 80], [55, 6, 1, 80], [59, 6, 1, 80], [62, 6, 1, 80]] }] });
  const strike = sceneWith('CHORD_DETECTION', { mode: 'strike' }), sus = sceneWith('CHORD_DETECTION', {});
  assert.deepEqual(texts(prims(strike, 0.1, ast)), ['C']);
  assert.deepEqual(texts(prims(sus, 0.4, ast)), []);          // Sustained: hết nốt là hết tên
  assert.deepEqual(texts(prims(strike, 0.4, ast)), ['C']);    // Strike: giữ tên dù nốt đã nhả
  assert.deepEqual(texts(prims(strike, 0.6, ast)), ['C']);    // nốt E5 đơn không phải lần dập hợp âm
  assert.deepEqual(texts(prims(strike, 1.2, ast)), ['Am']);
  assert.deepEqual(texts(prims(strike, 2, ast)), ['Am']);     // SRS: giữ đến lần dập kế, kể cả qua khoảng lặng
  assert.deepEqual(texts(prims(strike, 3.2, ast)), ['G']);
  assert.deepEqual(texts(prims(strike, 5, ast)), []);         // sau nốt cuối
  // nốt lệch quá 30 ms thuộc lần dập khác; một nốt đơn không thành lần dập
  const idx = derivedOf(ast).index, hud = buildHud(ast, idx);
  assert.notEqual(chordTimeline(hud, idx.tracks, 'strike'), chordTimeline(hud, idx.tracks, 'sustained')); // đệm theo chế độ
  const late = synthAst({ tracks: [{ name: 'k', color: '#fff', notes: [[60, 0, 2, 80], [64, 0, 2, 80], [67, 0.1, 2, 80]] }] });
  const li = derivedOf(late).index;
  assert.deepEqual(chordTimeline(buildHud(late, li), li.tracks, 'strike').map((s) => s.pitches), [[60, 64]]);
  // mode lạ → cảnh báo, về sustained
  const r = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ type: 'CHORD_DETECTION', id: 'c', properties: { mode: 'arp' } }] });
  assert.equal((r.scene.widgets[0].properties as any).mode, 'sustained');
  assert.ok(r.warnings.some((w) => w.details.path === '$.widgets[0].properties.mode'));
});

test('buildSceneHud dựng hợp âm theo chế độ của từng widget', () => {
  const ast = synthAst();
  const { scene } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, widgets: [{ id: 'a', type: 'CHORD_DETECTION', properties: { mode: 'strike' } }, { id: 'b', type: 'CHORD_DETECTION', properties: {} }] });
  const hud = buildSceneHud(scene, ast, derivedOf(ast).index);
  assert.deepEqual([...hud.chords.keys()].map((k) => k.split(':')[0]).sort(), ['strike', 'sustained']);
});
