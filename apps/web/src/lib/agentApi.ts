// API cho AI agent (D-69 mục skill, T-113): `window.dawviz`, chỉ có khi mở app bằng đường dẫn có `?agent=1`. Dùng cho Claude in Chrome (công cụ chạy
// JavaScript của nó) và cho script Playwright của skill (skills/dawviz/scripts/dawviz.mjs). Mọi thay đổi đi qua đúng các lệnh có hoàn tác như khi người
// dùng bấm nút, nên người xem thấy và hoàn tác được. Giá trị trả về là JSON thuần (trừ tệp truyền vào). Không mạng, không lưu gì ngoài app.
//
// Khung (App.tsx) cấp `AgentHost`: các hàm của app đọc tại lúc gọi (qua ref), nên API không giữ trạng thái cũ.
import { sanitizeScene, type SceneDocument } from '@dawviz/render-core';

export const AGENT_API_VERSION = 1;
/** Có bật API không: chỉ khi URL có `agent=1`. */
export const agentEnabled = (search: string): boolean => new URLSearchParams(search).get('agent') === '1';

export interface AgentStatus {
  version: number;
  busy: boolean;
  project: { name: string; duration: number; tracks: { id: string; name: string; notes: number }[] } | null;
  audio: { name: string; duration: number } | null;
  tab: 'preview' | 'editor' | 'settings';
  t: number; playing: boolean;
  videoStyle: string;
  styles: string[];
  userPresets: { id: string; name: string }[];
  history: { canUndo: boolean; canRedo: boolean; undoLabel?: string };
  problems: string[];
}
export interface ExportOptions {
  resolution?: 720 | 1080 | 2160; fps?: 24 | 30 | 60; quality?: 'low' | 'medium' | 'high'; kind?: 'video' | 'png'; download?: boolean;
  /** Kích thước tuỳ ý (D-26; cả hai cùng có thì thay `resolution`): làm chẵn xuống, cạnh ngắn ≥ 128, cạnh dài ≤ 4096; khác tỉ lệ khung thì có viền màu nền. */
  width?: number; height?: number;
  /** Chỉ xuất đoạn Start→End (giây dự án). */
  range?: { start: number; end: number };
  /** Chỉ đưa các lớp gốc có id này vào lần xuất (T-55); vắng = mọi lớp. */
  layers?: string[];
}
export interface ExportResult { name: string; bytes: number; ms: number; mime: string }

export interface AgentHost {
  status(): AgentStatus;
  loadProject(files: File[]): Promise<void>;
  loadAudio(file: File): Promise<void>;
  scene(): SceneDocument;
  /** Mở scene như mở một preset (một bước hoàn tác). */
  openScene(scene: SceneDocument): void;
  addPreset(file: File): Promise<void>;
  pickStyle(id: string): void;
  pickPreset(id: string): void;
  seek(t: number): void; play(): void; pause(): void;
  setTab(tab: AgentStatus['tab']): void;
  undo(): void; redo(): void;
  /** Ảnh PNG (data URL) của khung tại `t`, bề rộng `width` px. */
  frame(t: number, width: number): Promise<string>;
  exportVideo(o: ExportOptions): Promise<{ blob: Blob | null; name: string; bytes: number; ms: number }>;
}

/** Tệp từ dữ liệu agent đưa vào: File thật, hoặc `{ name, base64 }` / `{ name, text }` (Playwright, công cụ JS không truyền được File). */
export type FileLike = File | { name: string; base64: string; type?: string } | { name: string; text: string; type?: string };
export function toFile(f: FileLike): File {
  if (typeof File !== 'undefined' && f instanceof File) return f;
  const o = f as { name: string; base64?: string; text?: string; type?: string };
  if (typeof o.text === 'string') return new File([o.text], o.name, { type: o.type ?? 'application/json' });
  const bin = atob(o.base64 ?? ''), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], o.name, { type: o.type ?? 'application/octet-stream' });
}

/** Blob → base64, từng đoạn 32 KB (tệp video lớn không làm tràn ngăn xếp của String.fromCharCode). */
async function blobToBase64(b: Blob): Promise<string> {
  const u8 = new Uint8Array(await b.arrayBuffer());
  let bin = '';
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode(...u8.subarray(i, i + 0x8000));
  return btoa(bin);
}

/** Kiểm một scene/preset mà không áp: cảnh báo (`WARN_*`) hoặc lỗi (`ERR_*`) như khi mở tệp. */
export function validateScene(json: unknown): { ok: true; warnings: { code: string; message: string; path?: string }[]; scene: SceneDocument } | { ok: false; error: { code: string; message: string; path?: string } } {
  try {
    const raw = typeof json === 'string' ? JSON.parse(json) : json;
    const r = sanitizeScene(raw);
    return { ok: true, scene: r.scene, warnings: r.warnings.map((w) => ({ code: w.code, message: w.message, path: (w.details as { path?: string } | undefined)?.path })) };
  } catch (e) {
    const x = e as { code?: string; message?: string; path?: string };
    return { ok: false, error: { code: x.code ?? (e instanceof SyntaxError ? 'ERR_PRESET_JSON' : 'ERR_PRESET_INVALID'), message: x.message ?? String(e), ...(x.path ? { path: x.path } : {}) } };
  }
}

/** Dựng đối tượng `window.dawviz` từ host. Hàm nào cũng async để agent gọi đồng nhất bằng `await`. */
export function createAgentApi(host: () => AgentHost) {
  let last: { blob: Blob; name: string } | null = null;
  const waitIdle = async (ms = 60000) => { const t0 = Date.now(); while (host().status().busy) { if (Date.now() - t0 > ms) throw new Error('timeout: project still loading'); await new Promise((r) => setTimeout(r, 100)); } };
  return Object.freeze({
    version: AGENT_API_VERSION,
    /** Trạng thái hiện tại (dự án, âm thanh, thẻ, vạch phát, phong cách, preset, lịch sử, cảnh báo đang hiện). */
    status: async () => host().status(),
    /** Nạp tệp dự án DAW (.als .alp .rpp .flp .dawproject .mid); tệp phụ (MIDI ngoài, schema) đi kèm sau. Chờ phân tích xong. */
    loadProject: async (main: FileLike, ...extras: FileLike[]) => { await host().loadProject([toFile(main), ...extras.map(toFile)]); await waitIdle(); return host().status(); },
    /** Nạp tệp âm thanh trộn sẵn (WAV, MP3, FLAC, OGG, M4A). */
    loadAudio: async (f: FileLike) => { await host().loadAudio(toFile(f)); return host().status(); },
    /** Scene đang dùng (JSON preset 0.8.0: lớp, precomp, keyframe, phase). */
    getScene: async () => JSON.parse(JSON.stringify(host().scene())) as SceneDocument,
    /** Kiểm một preset mà không áp. */
    validate: async (json: unknown) => validateScene(json),
    /** Áp một scene/preset (một bước hoàn tác; Ctrl+Z để quay lại). Trả cảnh báo; lỗi thì không đổi gì. */
    setScene: async (json: unknown) => { const v = validateScene(json); if (v.ok) host().openScene(v.scene); return v.ok ? { ok: true, warnings: v.warnings } : v; },
    /** Thêm preset vào cột Phong cách video (như nút +) và áp nó. */
    addPreset: async (json: unknown, name = 'agent-preset.json') => { await host().addPreset(new File([typeof json === 'string' ? json : JSON.stringify(json)], name, { type: 'application/json' })); return host().status(); },
    pickStyle: async (id: string) => { host().pickStyle(id); return host().status(); },
    pickPreset: async (id: string) => { host().pickPreset(id); return host().status(); },
    seek: async (t: number) => { host().seek(t); return host().status().t; },
    play: async () => { host().play(); }, pause: async () => { host().pause(); },
    setTab: async (tab: AgentStatus['tab']) => { host().setTab(tab); },
    undo: async () => { host().undo(); return host().status().history; }, redo: async () => { host().redo(); return host().status().history; },
    /** Ảnh PNG của khung tại `t` (giây), data URL; để agent tự nhìn kết quả. */
    frame: async (t?: number, width = 960) => host().frame(t ?? host().status().t, Math.max(64, Math.min(3840, Math.round(width)))),
    /**
     * Xuất video (hoặc chuỗi PNG) với cấu hình cho trước; không hỏi nơi lưu. `download` (mặc định true) tải tệp về như nút Tải về. Kết quả giữ lại để
     * lấy bằng `lastExport()`.
     */
    exportVideo: async (o: ExportOptions = {}): Promise<ExportResult> => {
      await waitIdle();
      const r = await host().exportVideo(o);
      if (!r.blob) throw new Error('export produced no file');
      last = { blob: r.blob, name: r.name };
      if (o.download !== false) { const a = document.createElement('a'); a.href = URL.createObjectURL(r.blob); a.download = r.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 60000); }
      return { name: r.name, bytes: r.bytes, ms: r.ms, mime: r.blob.type };
    },
    /** Tệp của lần xuất gần nhất, base64 (để script lưu mà không cần sự kiện tải về). */
    lastExport: async () => (last ? { name: last.name, mime: last.blob.type, base64: await blobToBase64(last.blob) } : null),
  });
}
export type DawvizApi = ReturnType<typeof createAgentApi>;
