// T-02 + worker crash: client Worker giả, chạy bằng node --test (không cần trình duyệt).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLatestGate, createParserClient, ParseFailure, type WorkerLike } from './parserClient.ts';

class FakeWorker implements WorkerLike {
  onmessage: WorkerLike['onmessage'] = null;
  onerror: WorkerLike['onerror'] = null;
  onmessageerror: WorkerLike['onmessageerror'] = null;
  sent: { id: number; name: string }[] = [];
  terminated = false;
  postMessage(msg: unknown) { this.sent.push(msg as { id: number; name: string }); }
  terminate() { this.terminated = true; }
  reply(id: number, ok = true) {
    const data = ok ? { id, ok: true, ast: { name: `ast${id}` }, warnings: [], format: 'midi', ms: 1 } : { id, ok: false, code: 'ERR_NO_NOTES', message: 'x' };
    this.onmessage?.({ data } as MessageEvent);
  }
  crash() { this.onerror?.({ message: 'boom', preventDefault() {} } as unknown as ErrorEvent); }
}

const req = (name: string) => ({ name, buffer: new ArrayBuffer(4) });

test('latest gate: kết quả về muộn của lần chọn cũ bị bỏ qua', () => {
  const g = createLatestGate();
  const a = g.begin(), b = g.begin();
  assert.equal(g.isLatest(a), false);
  assert.equal(g.isLatest(b), true);
});

test('client: ghép phản hồi theo id, kể cả khi trả lời đảo thứ tự', async () => {
  const w = new FakeWorker();
  const c = createParserClient(() => w);
  const p1 = c.parse(req('a.mid')), p2 = c.parse(req('b.mid'));
  w.reply(w.sent[1].id); w.reply(w.sent[0].id, false);
  assert.equal(((await p2).ast as unknown as { name: string }).name, `ast${w.sent[1].id}`);
  await assert.rejects(p1, (e: ParseFailure) => e.code === 'ERR_NO_NOTES');
  assert.equal(c.pendingCount(), 0);
});

test('client: worker crash từ chối mọi yêu cầu đang chờ và lần sau tạo worker mới', async () => {
  const workers: FakeWorker[] = [];
  const c = createParserClient(() => { const w = new FakeWorker(); workers.push(w); return w; });
  const p1 = c.parse(req('a.rpp')), p2 = c.parse(req('b.rpp'));
  workers[0].crash();
  await assert.rejects(p1, (e: ParseFailure) => e.code === 'ERR_WORKER_CRASHED');
  await assert.rejects(p2, (e: ParseFailure) => e.code === 'ERR_WORKER_CRASHED');
  assert.equal(workers[0].terminated, true);
  const p3 = c.parse(req('c.mid'));
  assert.equal(workers.length, 2);
  workers[1].reply(workers[1].sent[0].id);
  await p3;
});
