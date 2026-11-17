// Khoá xuất giữa các tab (Web Locks). Node không có navigator.locks nên dựng bản giả đúng nghĩa `ifAvailable`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EXPORT_LOCK, isExportBusy, tryExportLock } from './exportLock.ts';

function fakeLocks() {
  const held = new Set<string>();
  return {
    held,
    request: async (name: string, _o: { ifAvailable: boolean }, cb: (lock: unknown) => Promise<void> | void) => {
      if (held.has(name)) return cb(null);
      held.add(name);
      try { return await cb({ name }); } finally { held.delete(name); }
    },
    query: async () => ({ held: [...held].map((name) => ({ name })) }),
  };
}
const withLocks = async (locks: unknown, fn: () => Promise<void>) => {
  const g = globalThis as { navigator?: unknown };
  const old = Object.getOwnPropertyDescriptor(g, 'navigator');
  Object.defineProperty(g, 'navigator', { value: { locks }, configurable: true });
  try { await fn(); } finally { if (old) Object.defineProperty(g, 'navigator', old); else delete g.navigator; }
};

test('khoá xuất: tab đầu lấy được, tab thứ hai bị từ chối cho tới khi tab đầu nhả', async () => {
  const l = fakeLocks();
  await withLocks(l, async () => {
    assert.equal(await isExportBusy(), false);
    const a = await tryExportLock();
    assert.ok(a);
    assert.equal(await isExportBusy(), true);
    assert.equal(await tryExportLock(), null, 'tab khác đang xuất');
    a!.release();
    await new Promise((r) => setTimeout(r, 0));
    assert.equal(l.held.has(EXPORT_LOCK), false);
    const b = await tryExportLock();
    assert.ok(b);
    b!.release();
  });
});

test('không có Web Locks: không chặn (khoá giả), không báo bận', async () => {
  await withLocks(undefined, async () => {
    assert.equal(await isExportBusy(), false);
    const a = await tryExportLock();
    assert.ok(a);
    a.release();
  });
});
