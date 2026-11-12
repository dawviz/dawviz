// Worker: toàn bộ việc parse chạy ở đây để không chặn giao diện (NFR-PERF). Không có logic parser trong app.
import { parseProject, probeProject, externalMidiKey } from '@dawviz/parser';
import { summarizeExternalMidi, type ExternalMidiInfo } from '../lib/externalMidi.ts';

export interface ParseRequest { id: number; name: string; buffer: ArrayBuffer; showMuted?: boolean; tempo?: number; files?: Record<string, ArrayBuffer> }
export type ParseResponse =
  | { id: number; ok: true; midi?: ExternalMidiInfo; ast: Awaited<ReturnType<typeof parseProject>>['ast']; warnings: Awaited<ReturnType<typeof parseProject>>['warnings']; format: string; ms: number }
  | { id: number; ok: false; midi?: ExternalMidiInfo; code: string; message: string; details?: Record<string, unknown> };

self.onmessage = async (e: MessageEvent<ParseRequest>) => {
  const { id, name, buffer, showMuted, tempo, files } = e.data;
  const t0 = performance.now();
  // REQ-UI-08: biết trước dự án tham chiếu .mid ngoài nào để giao diện báo thiếu và chỉ ra tệp nạp nhầm tên.
  let referenced: string[] = [];
  try { referenced = probeProject(name, buffer).needs.externalMidi ?? []; } catch { /* parseProject sẽ báo lỗi chi tiết */ }
  const provided = Object.keys(files ?? {});
  const midi = (missing: string[]) => (referenced.length || provided.length ? summarizeExternalMidi(referenced, provided, missing, externalMidiKey) : undefined);
  try {
    const options: Record<string, unknown> = { showMuted };
    if (tempo) options.tempoOverride = tempo;
    if (files && Object.keys(files).length) options.files = files;
    const r = await parseProject(name, buffer, options);
    (self as unknown as Worker).postMessage({ id, ok: true, midi: midi(r.warnings.filter((w) => w.code === 'WARN_RPP_EXTERNAL_MIDI').map((w) => String((w.details as { file?: string } | undefined)?.file ?? ''))), ast: r.ast, warnings: r.warnings, format: r.format, ms: performance.now() - t0 } satisfies ParseResponse);
  } catch (err) {
    const x = err as { code?: string; message?: string; details?: Record<string, unknown> };
    (self as unknown as Worker).postMessage({ id, ok: false, midi: midi(Array.isArray(x.details?.missingFiles) ? (x.details!.missingFiles as string[]) : []), code: x.code ?? 'ERR_UNKNOWN', message: x.message ?? String(err), details: x.details } satisfies ParseResponse);
  }
};
