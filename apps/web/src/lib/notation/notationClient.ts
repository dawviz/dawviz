// Client dựng bản nhạc: một Worker dùng lại, yêu cầu theo khoá (notationKey), bộ đệm nhỏ theo khoá. Worker tiêm vào để test.
import type { NotationLayout } from '@dawviz/render-core';
import type { NotationRequest } from './key.ts';

export interface NotationWorkerLike {
  postMessage(msg: unknown): void;
  terminate(): void;
  onmessage: ((e: { data: { id: number; layout?: NotationLayout; error?: string } }) => void) | null;
  onerror: ((e: unknown) => void) | null;
}

export const NOTATION_CACHE_SIZE = 6;

export function createNotationClient(makeWorker: () => NotationWorkerLike) {
  let worker: NotationWorkerLike | null = null, seq = 0;
  const pending = new Map<number, { resolve: (l: NotationLayout) => void; reject: (e: Error) => void }>();
  const cache = new Map<string, Promise<NotationLayout>>();
  const ensure = () => {
    if (worker) return worker;
    const w = makeWorker();
    w.onmessage = (e) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      if (e.data.layout) p.resolve(e.data.layout); else p.reject(new Error(e.data.error ?? 'notation worker failed'));
    };
    w.onerror = () => { // Worker hỏng: từ chối mọi yêu cầu đang chờ, lần sau tạo Worker mới
      for (const p of pending.values()) p.reject(new Error('ERR_WORKER_CRASHED'));
      pending.clear(); w.terminate(); worker = null;
    };
    return (worker = w);
  };
  return {
    /** Bản dựng cho khoá; cùng khoá thì dùng lại (kể cả đang dựng). Lỗi thì bỏ khỏi bộ đệm để lần sau thử lại. */
    get(key: string, req: NotationRequest): Promise<NotationLayout> {
      const hit = cache.get(key);
      if (hit) { cache.delete(key); cache.set(key, hit); return hit; }
      const id = ++seq;
      const pr = new Promise<NotationLayout>((resolve, reject) => { pending.set(id, { resolve, reject }); ensure().postMessage({ id, req }); });
      cache.set(key, pr);
      pr.catch(() => cache.delete(key));
      while (cache.size > NOTATION_CACHE_SIZE) cache.delete(cache.keys().next().value!);
      return pr;
    },
    dispose() { worker?.terminate(); worker = null; pending.clear(); cache.clear(); },
  };
}
