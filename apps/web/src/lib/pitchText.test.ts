import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePitch } from './pitchText.ts';

test('parsePitch: tên nốt, dấu thăng/giáng, số MIDI; sai thì null', () => {
  assert.equal(parsePitch('C4'), 60); assert.equal(parsePitch('c#3'), 49); assert.equal(parsePitch('Db2'), 37); assert.equal(parsePitch(' A0 '), 21);
  assert.equal(parsePitch('C-1'), 0); assert.equal(parsePitch('G9'), 127); assert.equal(parsePitch('60'), 60);
  for (const bad of ['', 'H3', 'C', 'C10', 'G#9', '128', 'C4x']) assert.equal(parsePitch(bad), null, bad);
});
