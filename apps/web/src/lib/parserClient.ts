// Khách của Worker parse: parseInWorker() ghép id thông điệp với Promise; ParseFailure.
// Worker crash (hết bộ nhớ, lỗi nạp mô-đun…) -> mọi yêu cầu đang chờ bị từ chối với ERR_WORKER_CRASHED
// và Worker được tạo lại ở lần gọi sau, để giao diện không kẹt ở trạng thái "đang xử lý".
import type { ParseRequest, ParseResponse } from '../workers/parser.worker.ts';
import type { ExternalMidiInfo } from './externalMidi.ts';

export class ParseFailure extends Error {
  code: string;
  details?: Record<string, unknown>;
  /** REQ-UI-08: tình trạng .mid ngoài (kể cả khi parse thất bại vì thiếu chúng). */
  midi?: ExternalMidiInfo;
  // Không dùng "parameter property" (public code…) để chạy được với node --test (chế độ chỉ bỏ kiểu).
  constructor(code: string, message: string, details?: Record<string, unknown>) { super(message); this.code = code; this.details = details; }
}

type Ok = Extract<ParseResponse, { ok: true }>;
interface Pending { resolve: (r: Ok) => void; reject: (e: ParseFailure) => void }

/** Tối thiểu của Worker mà client cần (để test thay bằng Worker giả). */
export interface WorkerLike {
  onmessage: ((e: MessageEvent<ParseResponse>) => void) | null;
  onerror: ((e: ErrorEvent) => void) | null;
  onmessageerror?: ((e: MessageEvent) => void) | null;
  postMessage(msg: unknown, transfer?: Transferable[]): void;
  terminate(): void;
}

export function createParserClient(spawn: () => WorkerLike) {
  let worker: WorkerLike | null = null;
  let seq = 0;
  const pending = new Map<number, Pending>();

  const failAll = (message: string) => {
    const all = [...pending.values()]; pending.clear();
    for (const p of all) p.reject(new ParseFailure('ERR_WORKER_CRASHED', message));
  };

  function getWorker(): WorkerLike {
    if (worker) return worker;
    const w = spawn();
    w.onmessage = (e) => {
      const p = pending.get(e.data.id); if (!p) return; pending.delete(e.data.id);
      if (e.data.ok) p.resolve(e.data); else { const f = new ParseFailure(e.data.code, e.data.message, e.data.details); f.midi = e.data.midi; p.reject(f); }
    };
    const crash = (message: string) => {
      if (worker === w) worker = null;
      try { w.terminate(); } catch { /* đã chết */ }
      failAll(message);
    };
    w.onerror = (e) => { e.preventDefault?.(); crash(e.message || 'worker error'); };
    w.onmessageerror = () => crash('worker message could not be deserialized');
    worker = w;
    return w;
  }

  function parse(req: Omit<ParseRequest, 'id'>): Promise<Ok> {
    const id = ++seq;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      try { getWorker().postMessage({ ...req, id }, [req.buffer]); }
      catch (err) { pending.delete(id); reject(new ParseFailure('ERR_WORKER_CRASHED', String(err))); }
    });
  }

  return { parse, pendingCount: () => pending.size };
}

// Client thật (Worker + Trusted Types) nằm ở `parseInWorker.ts` để tệp này vẫn chạy được bằng node --test.

/**
 * Chỉ nhận kết quả của yêu cầu mới nhất (T-02): mỗi lần bắt đầu lấy một vé; kết quả về muộn của vé cũ bị bỏ qua.
 * Hàm thuần, không phụ thuộc React, để test bằng node --test.
 */
export function createLatestGate() {
  let current = 0;
  return {
    begin(): number { return ++current; },
    isLatest(ticket: number): boolean { return ticket === current; },
  };
}
