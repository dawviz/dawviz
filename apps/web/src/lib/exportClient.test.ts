// T-09: client Export Worker với Worker giả.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ExportError, startExport, type ExportWorkerLike } from './exportClient.ts';
import type { ExportIn, ExportJob, ExportOut } from './exportProtocol.ts';

const job = { audio: { channels: [new Float32Array(4)], sampleRate: 48000, offsetMs: 0 } } as unknown as ExportJob;
const fake = () => {
  const sent: ExportIn[] = [];
  let transfer: Transferable[] | undefined;
  let terminated = 0;
  const w: ExportWorkerLike = {
    postMessage: (m, t) => { sent.push(m); transfer = t; },
    terminate: () => { terminated++; },
    onmessage: null, onerror: null,
  };
  const emit = (m: ExportOut) => w.onmessage!({ data: m });
  return { w, sent, emit, get transfer() { return transfer; }, get terminated() { return terminated; } };
};

test('startExport: gửi start kèm chuyển quyền buffer âm thanh, báo tiến độ, nhận done rồi terminate', async () => {
  const f = fake();
  const seen: number[] = [];
  const h = startExport(job, () => f.w, { onProgress: (p) => seen.push(p.fraction) });
  assert.equal(f.sent[0].type, 'start');
  assert.equal(f.transfer?.length, 1);
  f.emit({ type: 'progress', progress: { fraction: 0.5, frame: 5, total: 10, fps: 30, speed: 1, etrSec: 1 } });
  f.emit({ type: 'done', blob: null, bytes: 7, ms: 12 });
  assert.deepEqual(await h.result, { status: 'done', blob: null, bytes: 7, ms: 12 });
  assert.deepEqual(seen, [0.5]);
  assert.equal(f.terminated, 1);
});

test('startExport: chuyển tiếp số liệu (stats), ảnh thu nhỏ và báo cáo cuối của Worker', async () => {
  const f = fake();
  const got: unknown[] = [];
  const h = startExport(job, () => f.w, { onProgress: (p, st, thumb) => got.push([p.frame, st?.drawMs, thumb]) });
  const stats = { drawMs: 5, encodeMs: 2, drawFirstMs: null, slowing: false, fontFaces: 2, container: 'mp4', videoCodec: 'avc1.640028', audioCodec: null };
  const thumb = { width: 240 } as unknown as ImageBitmap;
  f.emit({ type: 'progress', progress: { fraction: 0.1, frame: 1, total: 10, fps: null, speed: null, etrSec: null }, stats, thumb });
  const report = { stats, series: [[1, 5]] as Array<[number, number]>, frames: 10, fps: 30, width: 8, height: 8, totalMs: 1000, bytes: 1 };
  f.emit({ type: 'done', blob: null, bytes: 1, ms: 5, report });
  assert.deepEqual(got, [[1, 5, thumb]]);
  assert.deepEqual(await h.result, { status: 'done', blob: null, bytes: 1, ms: 5, report });
});

test('startExport: Worker báo lỗi → ExportError mã ERR_EXPORT_FAILED và terminate', async () => {
  const f = fake();
  const h = startExport(job, () => f.w);
  f.emit({ type: 'error', code: 'ERR_EXPORT_FAILED', message: 'boom' });
  await assert.rejects(h.result, (e: unknown) => e instanceof ExportError && e.code === 'ERR_EXPORT_FAILED' && e.message === 'boom');
  assert.equal(f.terminated, 1);
});

test('startExport: Worker sập (onerror) cũng thành ExportError', async () => {
  const f = fake();
  const h = startExport(job, () => f.w);
  f.w.onerror!(new Error('crash'));
  await assert.rejects(h.result, ExportError);
});

test('cancel: gửi cancel; Worker báo cancelled thì xong; im lặng quá hạn thì terminate và coi là đã huỷ', async () => {
  const f = fake();
  const h = startExport(job, () => f.w, { cancelGraceMs: 10 });
  h.cancel();
  assert.deepEqual(f.sent[1], { type: 'cancel' });
  f.emit({ type: 'cancelled' });
  assert.deepEqual(await h.result, { status: 'cancelled' });
  const g = fake();
  const h2 = startExport(job, () => g.w, { cancelGraceMs: 10 });
  h2.cancel();
  assert.deepEqual(await h2.result, { status: 'cancelled' });
  assert.equal(g.terminated, 1);
});
