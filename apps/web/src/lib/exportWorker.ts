// Tạo Export Worker qua chính sách Trusted Types (NFR-SEC-06), như audioWorkers.ts.
import workerUrl from '../workers/export.worker.ts?worker&url';
import { trustedWorkerURL } from './trustedTypes.ts';
import type { ExportWorkerLike } from './exportClient.ts';

export const makeExportWorker = (): ExportWorkerLike => new Worker(trustedWorkerURL(workerUrl) as string, { type: 'module' }) as unknown as ExportWorkerLike;
