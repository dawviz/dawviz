import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPref, savePref } from './prefs.ts';

test('prefs: không có localStorage → trả mặc định, ghi không ném lỗi', () => {
  assert.deepEqual(loadPref('x', { a: 1 }), { a: 1 });
  assert.doesNotThrow(() => savePref('x', { a: 2 }));
});
test('prefs: lưu rồi đọc lại; JSON hỏng hoặc không phải object → mặc định', () => {
  const mem = new Map<string, string>();
  (globalThis as any).localStorage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
  try {
    savePref('s', { a: 2 }); assert.deepEqual(loadPref('s', { a: 1 }), { a: 2 });
    mem.set('dawviz.prefs.v1.s', '{hỏng'); assert.deepEqual(loadPref('s', { a: 1 }), { a: 1 });
    mem.set('dawviz.prefs.v1.s', '[1]'); assert.deepEqual(loadPref('s', { a: 1 }), { a: 1 });
  } finally { delete (globalThis as any).localStorage; }
});
