// Worker: toàn bộ việc parse chạy ở đây để không chặn giao diện (NFR-PERF). Không có logic parser trong app.
import { parseProject } from '@dawviz/parser';

export interface ParseRequest { id: number; name: string; buffer: ArrayBuffer; showMuted?: boolean; tempo?: number; files?: Record<string, ArrayBuffer> }
export type ParseResponse =
  | { id: number; ok: true; ast: Awaited<ReturnType<typeof parseProject>>['ast']; warnings: Awaited<ReturnType<typeof parseProject>>['warnings']; format: string; ms: number }
  | { id: number; ok: false; code: string; message: string; details?: Record<string, unknown> };

self.onmessage = async (e: MessageEvent<ParseRequest>) => {
  const { id, name, buffer, showMuted, tempo, files } = e.data;
  const t0 = performance.now();
  try {
    const options: Record<string, unknown> = { showMuted };
    if (tempo) options.tempoOverride = tempo;
    if (files && Object.keys(files).length) options.files = files;
    const r = await parseProject(name, buffer, options);
    (self as unknown as Worker).postMessage({ id, ok: true, ast: r.ast, warnings: r.warnings, format: r.format, ms: performance.now() - t0 } satisfies ParseResponse);
  } catch (err) {
    const x = err as { code?: string; message?: string; details?: Record<string, unknown> };
    (self as unknown as Worker).postMessage({ id, ok: false, code: x.code ?? 'ERR_UNKNOWN', message: x.message ?? String(err), details: x.details } satisfies ParseResponse);
  }
};
