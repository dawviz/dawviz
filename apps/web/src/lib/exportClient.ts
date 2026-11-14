// Client của Export Worker (T-09): một lần xuất = một Worker; huỷ = gửi cancel rồi chờ Worker báo, quá hạn thì terminate.
// Worker tiêm vào (`makeWorker`) để test; bản thật ở lib/exportWorker.ts (Trusted Types).
import type { ExportIn, ExportJob, ExportOut } from './exportProtocol.ts';
import type { ProgressInfo } from './exportPlan.ts';

export interface ExportWorkerLike {
  postMessage(msg: ExportIn, transfer?: Transferable[]): void;
  terminate(): void;
  onmessage: ((e: { data: ExportOut }) => void) | null;
  onerror: ((e: unknown) => void) | null;
}
export type ExportResult = { status: 'done'; blob: Blob | null; bytes: number; ms: number } | { status: 'cancelled' };
export class ExportError extends Error {
  readonly code = 'ERR_EXPORT_FAILED';
}
export interface ExportHandle {
  result: Promise<ExportResult>;
  cancel(): void;
}

export function startExport(
  job: ExportJob,
  makeWorker: () => ExportWorkerLike,
  opts: { file?: WritableStream<{ type: 'write'; data: Uint8Array; position: number }>; onProgress?: (p: ProgressInfo) => void; cancelGraceMs?: number } = {},
): ExportHandle {
  const w = makeWorker();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let finish: (r: ExportResult) => void = () => {};
  const result = new Promise<ExportResult>((resolve, reject) => {
    const end = () => { if (timer) clearTimeout(timer); w.terminate(); };
    finish = (r) => { end(); resolve(r); };
    w.onmessage = (e) => {
      const m = e.data;
      if (m.type === 'progress') opts.onProgress?.(m.progress);
      else if (m.type === 'done') finish({ status: 'done', blob: m.blob, bytes: m.bytes, ms: m.ms });
      else if (m.type === 'cancelled') finish({ status: 'cancelled' });
      else { end(); reject(Object.assign(new ExportError(m.message), {})); }
    };
    w.onerror = (e) => { end(); reject(new ExportError(e instanceof Error ? e.message : 'worker crashed')); };
  });
  const transfer: Transferable[] = [];
  if (opts.file) transfer.push(opts.file as unknown as Transferable);
  if (job.audio) transfer.push(...job.audio.channels.map((c) => c.buffer as ArrayBuffer));
  w.postMessage({ type: 'start', job, file: opts.file }, transfer);
  return {
    result,
    cancel() {
      w.postMessage({ type: 'cancel' });
      // Worker đang chờ encoder thì có thể không thấy cờ ngay; quá hạn thì dừng hẳn (đích ghi do Worker đã bị bỏ).
      timer = setTimeout(() => finish({ status: 'cancelled' }), opts.cancelGraceMs ?? 5000);
    },
  };
}
