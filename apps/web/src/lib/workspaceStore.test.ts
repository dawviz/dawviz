import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSaver, createDebounced, restoreWorkspace, blobSignature, freeBytes, isQuotaError, CURRENT_ID, type Backend, type BlobWrite, type StoredBlob, type WorkspaceState, type Snapshot } from './workspaceStore.ts';

function memory(opts: { failWith?: () => unknown } = {}) {
  let state: WorkspaceState | null = null, blobs: StoredBlob[] = [];
  const calls: BlobWrite[] = [];
  const b: Backend & { calls: BlobWrite[]; blobs: () => StoredBlob[]; failWith?: () => unknown } = {
    calls, blobs: () => blobs, failWith: opts.failWith,
    async load() { return state ? { state, blobs } : null; },
    async save(s, w) {
      calls.push(w);
      const err = b.failWith?.(); // giao dịch: lỗi thì không đổi gì
      if (err && w !== 'keep' && w !== null) throw err;
      if (w !== 'keep') blobs = w ?? [];
      state = s;
    },
    async clear() { state = null; blobs = []; },
  };
  return b;
}
const blob = (id: string, n: number): StoredBlob => ({ id, name: `${id}.bin`, size: n, data: new Uint8Array(n) });
const snap = (blobs: StoredBlob[], extra: Partial<Snapshot> = {}): Snapshot => ({ title: 't', audioOffsetMs: 0, scene: { a: 1 }, workspace: {}, blobs, ...extra });
const quota = () => Object.assign(new Error('full'), { name: 'QuotaExceededError' });

test('saver: lần đầu ghi Blob; lần sau Blob không đổi thì chỉ ghi JSON ("keep")', async () => {
  const be = memory(); const s = createSaver(be, () => 1);
  const bl = [blob('source', 10), blob('audio', 20)];
  assert.deepEqual(await s.save(snap(bl), { quota: 1e9, usage: 0 }), { ok: true, degraded: false, wroteBlobs: true });
  assert.deepEqual(await s.save(snap(bl, { scene: { a: 2 } }), { quota: 1e9, usage: 0 }), { ok: true, degraded: false, wroteBlobs: false });
  assert.deepEqual(be.calls.map((c) => (Array.isArray(c) ? c.length : c)), [2, 'keep']);
  assert.equal(be.blobs().length, 2);
  const r = await restoreWorkspace(be);
  assert.deepEqual((r!.state.scene), { a: 2 });
  assert.deepEqual(r!.missing, []);
});

test('saver: còn trống < 50 MB thì chỉ lưu JSON và báo degraded; phiên sau biết Blob nào cần nạp lại', async () => {
  const be = memory(); const s = createSaver(be);
  const r = await s.save(snap([blob('source', 100)]), { quota: 100e6, usage: 70e6 });
  assert.deepEqual(r, { ok: true, degraded: true, wroteBlobs: false });
  const back = await restoreWorkspace(be);
  assert.equal(back!.blobs.length, 0);
  assert.deepEqual(back!.missing.map((m) => m.id), ['source']);
  // lần ghi JSON kế tiếp vẫn báo degraded và không thử ghi Blob lại
  assert.equal((await s.save(snap([blob('source', 100)]), { quota: 100e6, usage: 70e6 })).degraded, true);
  assert.deepEqual(be.calls, [null, 'keep']);
});

test('saver: QuotaExceededError khi ghi Blob thì thử lại chỉ với JSON, không mất bản trước', async () => {
  const be = memory(); const s = createSaver(be);
  await s.save(snap([blob('source', 5)]), null); // bản hợp lệ trước
  be.failWith = quota;
  const r = await s.save(snap([blob('source', 5), blob('audio', 9)], { scene: { a: 3 } }), null);
  assert.deepEqual(r, { ok: true, degraded: true, wroteBlobs: false });
  const back = await restoreWorkspace(be);
  assert.deepEqual(back!.state.scene, { a: 3 });
  assert.deepEqual(back!.missing.map((m) => m.id).sort(), ['audio', 'source']);
});

test('saver: lỗi khác thì ok=false và bản trước còn nguyên', async () => {
  const be = memory(); const s = createSaver(be);
  await s.save(snap([blob('source', 5)], { scene: { v: 1 } }), null);
  be.failWith = () => new Error('boom');
  const r = await s.save(snap([blob('source', 5), blob('audio', 1)], { scene: { v: 2 } }), null);
  assert.equal(r.ok, false);
  assert.deepEqual((await restoreWorkspace(be))!.state.scene, { v: 1 });
});

test('restore: bản lưu rỗng, hỏng hoặc phiên bản chính mới hơn thì coi như không có', async () => {
  const be = memory();
  assert.equal(await restoreWorkspace(be), null);
  await createSaver(be).save(snap([]), null);
  assert.ok(await restoreWorkspace(be));
  const bad: Backend = { load: async () => { throw new Error('idb'); }, save: async () => {}, clear: async () => {} };
  assert.equal(await restoreWorkspace(bad), null);
  const newer: Backend = { ...be, load: async () => ({ state: { id: CURRENT_ID, schemaVersion: '9.0.0', savedAt: 0, title: '', blobs: [], audioOffsetMs: 0, scene: {}, workspace: {} }, blobs: [] }) };
  assert.equal(await restoreWorkspace(newer), null);
});

test('tiện ích: chữ ký Blob không phụ thuộc thứ tự, freeBytes, isQuotaError', () => {
  assert.equal(blobSignature([{ id: 'a', name: 'x', size: 1 }, { id: 'b', name: 'y', size: 2 }]), blobSignature([{ id: 'b', name: 'y', size: 2 }, { id: 'a', name: 'x', size: 1 }]));
  assert.equal(freeBytes({ quota: 100, usage: 30 }), 70);
  assert.equal(freeBytes({ quota: 10, usage: 30 }), 0);
  assert.equal(freeBytes(undefined), Infinity);
  assert.equal(isQuotaError(quota()), true);
  assert.equal(isQuotaError({ inner: { name: 'QuotaExceededError' } }), true);
  assert.equal(isQuotaError(new Error('x')), false);
});

test('debounce: gộp nhiều lần đẩy thành một lần ghi sau 500 ms kể từ lần cuối; flush ghi ngay; cancel bỏ', () => {
  const fns: { fn: () => void; ms: number; id: number }[] = []; let id = 0;
  const timers = { set: (fn: () => void, ms: number) => { fns.push({ fn, ms, id: ++id }); return id; }, clear: (h: unknown) => { const i = fns.findIndex((f) => f.id === h); if (i >= 0) fns.splice(i, 1); } };
  const out: number[] = [];
  const d = createDebounced<number>((v) => { out.push(v); }, 500, timers);
  d.push(1); d.push(2); d.push(3);
  assert.equal(fns.length, 1); assert.equal(fns[0].ms, 500); assert.equal(d.pending, true);
  fns.shift()!.fn();
  assert.deepEqual(out, [3]); assert.equal(d.pending, false);
  d.push(4); d.flush();
  assert.deepEqual(out, [3, 4]);
  d.push(5); d.cancel(); assert.equal(fns.length, 0); assert.deepEqual(out, [3, 4]);
});

test('lazyDexieBackend: tạo backend không nạp Dexie; lỗi nạp/IndexedDB nổi lên ở lần gọi đầu', async () => {
  const { lazyDexieBackend } = await import('./workspaceStore.ts');
  const b = lazyDexieBackend('test-lazy');
  assert.equal(typeof b.load, 'function');
  // node không có indexedDB: lần gọi đầu phải từ chối (để restoreWorkspace bắt và báo), không treo.
  await assert.rejects(b.load());
});
