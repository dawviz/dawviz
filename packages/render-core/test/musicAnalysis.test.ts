// T-83: nhóm nhịp (móc kép), bậc bass theo nốt chủ, độ dài theo phân số nốt đen, lớp cao độ; qua chỗ giữ trong ô chữ.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildIndex, degreeName, formatUnits, ioiSixteenths, layoutFrame, pitchClassName, quarterFraction, recentOnsets, sanitizeScene, SCENE_SCHEMA_VERSION, type TextPrim } from '../src/index.ts';
import { derivedOf, synthAst } from './helpers.ts';

// Tempo 120 (1 beat = 0,5 s), PPQ 960. Bass 3-3-2 móc kép: beat 0, 0.75, 1.5 rồi 2 (cách nhau 3, 3, 2 móc kép).
const ast = () => synthAst({ tracks: [
  { name: 'Bass', color: '#44f', notes: [[36, 0, 0.5, 90], [36, 0.75, 0.5, 90], [41, 1.5, 0.25, 90], [37, 2, 1.5, 90]] },
  { name: 'Keys', color: '#f84', notes: [[64, 0, 2, 70], [67, 0, 2, 70], [72, 2, 1, 70]] },
], duration: 4 });
const tracksOf = (a = ast()) => buildIndex(a.tracks, 4).tracks;

test('recentOnsets: gộp nốt cùng tick (hợp âm, nhiều track), nốt thấp nhất là bass, lấy các thời điểm gần nhất', () => {
  const o = recentOnsets(tracksOf(), 10);
  assert.deepEqual(o.map((x) => x.tick), [0, 720, 1440, 1920]);
  assert.deepEqual(o.map((x) => x.bass), [36, 36, 41, 37]);               // tick 0: Bass 36 thấp hơn Keys 64, 67
  assert.equal(o[0].len, 1920);                                          // nốt dài nhất tại tick 0 là Keys (2 beat)
  assert.deepEqual(recentOnsets(tracksOf(), 10, 2).map((x) => x.tick), [1440, 1920]);
  assert.deepEqual(recentOnsets(tracksOf(), 0.5).map((x) => x.tick), [0, 720], 'chỉ tới t');
  assert.deepEqual(recentOnsets(tracksOf(), -1), []);
});

test('ioiSixteenths: 3-3-2 móc kép; lệch lưới giữ một chữ số thập phân', () => {
  const o = recentOnsets(tracksOf(), 10);
  assert.deepEqual(ioiSixteenths(o, 960), [3, 3, 2]);
  assert.equal(formatUnits(3), '3'); assert.equal(formatUnits(2.97), '3'); assert.equal(formatUnits(2.5), '2.5'); assert.equal(formatUnits(1.33), '1.3');
  assert.deepEqual(ioiSixteenths([{ tick: 0, time: 0, bass: 0, len: 0 }], 960), []);
});

test('bậc theo nốt chủ và tên lớp cao độ', () => {
  assert.deepEqual([36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47].map((p) => degreeName(p, 0)), ['1', '♭2', '2', '♭3', '3', '4', '♭5', '5', '♭6', '6', '♭7', '7']);
  assert.equal(degreeName(41, 5), '1'); assert.equal(degreeName(40, 5), '7'); assert.equal(degreeName(2, 11), '♭3'); // qua biên octave, nốt chủ B
  assert.equal(pitchClassName(61), 'C♯'); assert.equal(pitchClassName(-1), 'B');
});

test('quarterFraction: mẫu số thường gặp, rút gọn; số lẻ → thập phân', () => {
  const f = (t: number) => quarterFraction(t, 960);
  assert.equal(f(960), '1'); assert.equal(f(480), '1/2'); assert.equal(f(240), '1/4'); assert.equal(f(120), '1/8'); assert.equal(f(1440), '3/2'); assert.equal(f(720), '3/4');
  assert.equal(f(320), '1/3'); assert.equal(f(3840), '4'); assert.equal(f(60), '1/16'); assert.equal(f(0), '0'); assert.equal(f(7), '0.01'); assert.equal(quarterFraction(100, 0), '0');
});

const textAt = (text: string, t: number, tonic?: number): string => {
  const { scene, warnings } = sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, ...(tonic === undefined ? {} : { tonic }),
    widgets: [{ id: 'w', type: 'TEXT', layout: { x: 0, y: 0, width: 800, height: 100 }, properties: { text } }] });
  assert.deepEqual(warnings, []);
  const a = ast(); return layoutFrame(scene, derivedOf(a), a, t)[0].prims.filter((p): p is TextPrim => p.kind === 'text').map((p) => p.text).join('|');
};

test('chỗ giữ trong ô chữ: {rhythm}, {bass} (bậc khi có nốt chủ, tên nốt khi chưa), {lengths}, {pitch_classes}', () => {
  assert.equal(textAt('{rhythm: }', 1.2), '3 3 2');                                    // t=1,2 s: sau 4 thời điểm (beat 2 = 1,0 s)
  assert.equal(textAt('{rhythm: }', 0.2), '');                                         // mới 1 thời điểm: chưa có khoảng
  assert.equal(textAt('{rhythm: }', 0.4), '3');
  assert.equal(textAt('{bass: → }', 1.2, 0), '1 → 1 → 4 → ♭2');
  assert.equal(textAt('{bass: → }', 1.2, 5), '5 → 5 → 1 → ♭6');                     // nốt chủ F
  assert.equal(textAt('{bass: → }', 1.2), 'C2 → C2 → F2 → C#2');                     // chưa đặt nốt chủ
  assert.equal(textAt('{lengths: + }', 1.2), '2 + 1/2 + 1/4 + 3/2');
  assert.equal(textAt('{pitch_classes: }', 0.1), 'C E G');
  assert.equal(textAt('{pitch_classes: }', 1.2), 'C♯ C');                               // bass C♯ (37) thấp hơn Keys C (72)
});

test('sanitize: nốt chủ phải 0–11 (kẹp), vắng thì bỏ', () => {
  const s = (tonic: unknown) => sanitizeScene({ schemaVersion: SCENE_SCHEMA_VERSION, canvas: {}, tonic, widgets: [] });
  assert.equal(s(7).scene.tonic, 7); assert.equal(s(99).scene.tonic, 11); assert.equal(s('x').scene.tonic, undefined); assert.equal(s(undefined).scene.tonic, undefined);
});
