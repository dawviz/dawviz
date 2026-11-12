import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeExternalMidi, mergeExtras, missingMidiLevel } from './externalMidi.ts';
import { externalMidiKey } from '../../../../packages/rpp/src/rpp.js';

test('externalMidi: tệp nạp sai tên được chỉ ra; khớp không phân biệt hoa/thường và khoảng trắng ≡ gạch dưới', () => {
  const r = summarizeExternalMidi(['Oboe MIDI 001.mid'], ['oboe_midi_001.MID', 'drums.mid', 'cover.png'], [], externalMidiKey);
  assert.deepEqual(r.unused, ['drums.mid']);
  assert.deepEqual(r.missing, []);
});
test('externalMidi: gộp tệp phụ theo tên, mức độ bảng thông báo', () => {
  assert.deepEqual(mergeExtras([{ name: 'a.mid', v: 1 }], [{ name: 'a.mid', v: 2 }, { name: 'b.mid', v: 3 }]).map((f) => f.v), [2, 3]);
  const info = { referenced: ['a.mid'], missing: ['a.mid'], unused: [] };
  assert.equal(missingMidiLevel(info, true), 'error');
  assert.equal(missingMidiLevel(info, false), 'warning');
  assert.equal(missingMidiLevel({ referenced: ['a.mid'], missing: [], unused: [] }, false), null);
  assert.equal(missingMidiLevel(undefined, true), null);
});
