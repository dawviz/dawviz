// Worker dựng bản nhạc qua chính sách Trusted Types (NFR-SEC-06), như audioWorkers.ts.
import url from '../../workers/notation.worker.ts?worker&url';
import { trustedWorkerURL } from '../trustedTypes.ts';
import { createNotationClient, type NotationWorkerLike } from './notationClient.ts';

export const notationClient = createNotationClient(() => new Worker(trustedWorkerURL(url) as string, { type: 'module' }) as unknown as NotationWorkerLike);
