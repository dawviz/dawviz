// Client parse thật: tạo Worker từ URL do Vite sinh, qua chính sách Trusted Types (NFR-SEC-06).
import workerUrl from '../workers/parser.worker.ts?worker&url';
import { createParserClient, type WorkerLike } from './parserClient.ts';
import { trustedWorkerURL } from './trustedTypes.ts';

const client = createParserClient(() =>
  new Worker(trustedWorkerURL(workerUrl) as string, { type: 'module' }) as unknown as WorkerLike);

export const parseInWorker = client.parse;
