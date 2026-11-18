import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draftToOverride, readBpm, sanitizeDraft, emptyDraft, sourceNeedsTempo, type TempoDraft } from './tempoRows.ts';

const d = (unit: TempoDraft['unit'], ...rows: [string, string, string?][]): TempoDraft => ({ unit, rows: rows.map(([pos, bpm, sig]) => ({ pos, bpm, sig: sig ?? '' })) });

test('tempoRows: một dòng chỉ có BPM → số; dấu phẩy thập phân chấp nhận', () => {
  assert.deepEqual(draftToOverride(d('time', ['', '128'])), { ok: true, override: 128 });
  assert.deepEqual(draftToOverride(d('time', ['', '97,5'])), { ok: true, override: 97.5 });
  assert.equal(readBpm(' 120,25 '), 120.25);
});
test('tempoRows: nhiều dòng theo giây và m:ss; dấu nhịp giữ cho các dòng sau', () => {
  const r = draftToOverride(d('time', ['0', '120'], ['1:30', '90', '3/4']));
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.override, [{ bpm: 120, num: 4, den: 4, timeSeconds: 0 }, { bpm: 90, num: 3, den: 4, timeSeconds: 90 }]);
});
test('tempoRows: bar.beat của Reaper theo dấu nhịp (5.3.50 ở 4/4 = 16,5 + nốt đen)', () => {
  const r = draftToOverride(d('reaper', ['1.1.00', '120'], ['5.3.50', '100']));
  assert.equal(r.ok, true);
  if (r.ok && Array.isArray(r.override)) assert.equal(r.override[1].beat, 18.5);
});
test('tempoRows: lỗi chỉ ra đúng dòng và loại', () => {
  assert.deepEqual(draftToOverride(d('time', ['', 'x'])), { ok: false, row: 0, code: 'bpm' });
  assert.deepEqual(draftToOverride(d('time', ['0', '120'], ['', '5000'])).ok, false);
  const bad = draftToOverride(d('time', ['0', '120'], ['abc', '100']));
  assert.equal(bad.ok, false);
  if (!bad.ok) { assert.equal(bad.row, 1); assert.equal(bad.code, 'position'); }
  const sig = draftToOverride(d('time', ['0', '120', '4/5']));
  if (!sig.ok) assert.equal(sig.code, 'signature');
  assert.deepEqual(draftToOverride(emptyDraft()), { ok: false, row: 0, code: 'empty' });
});
test('tempoRows: sanitizeDraft chặn dữ liệu lạ; sourceNeedsTempo', () => {
  assert.deepEqual(sanitizeDraft(null), emptyDraft());
  assert.equal(sanitizeDraft({ unit: 'x', rows: [{ pos: 1, bpm: 2 }] }).unit, 'time');
  assert.equal(sanitizeDraft({ rows: new Array(200).fill({}) }).rows.length, 64);
  assert.equal(sourceNeedsTempo('fallback') && sourceNeedsTempo('midi-default'), true);
  assert.equal(sourceNeedsTempo('file') || sourceNeedsTempo('user'), false);
});
