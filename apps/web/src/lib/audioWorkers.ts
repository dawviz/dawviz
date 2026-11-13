// Tạo Worker sóng âm qua chính sách Trusted Types (NFR-SEC-06), như parseInWorker.ts.
import workerUrl from '../workers/audioPeaks.worker.ts?worker&url';
import { peaksFor, type PeaksWorkerLike } from './peaksClient.ts';
import { trustedWorkerURL } from './trustedTypes.ts';
import type { PcmBuffer } from './audioAsset.ts';

export const peaksInWorker = (id: string, buf: PcmBuffer) =>
  peaksFor(id, buf, () => new Worker(trustedWorkerURL(workerUrl) as string, { type: 'module' }) as unknown as PeaksWorkerLike);
