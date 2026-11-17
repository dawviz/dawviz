// T-09: thông điệp giữa giao diện và Export Worker (Technical Design §7.1, REQ-EXPORT-07).
import type { Derived, SceneDocument, UnifiedProjectAST } from '@dawviz/render-core';
import type { CodecChoice, ProgressInfo } from './exportPlan.ts';
import type { ExportReport, ExportStats } from './exportStats.ts';

export interface ExportJob {
  ast: UnifiedProjectAST;
  scene: SceneDocument;
  brightness: Derived['brightness'];
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  choice: CodecChoice;
  /** tên phong cách video (chỉ để ghi vào báo cáo chẩn đoán) */
  style?: string;
  /** giây dự án của khung 0 và độ dài */
  start: number;
  duration: number;
  /** PCM đã cắt theo khoảng xuất (sliceAudioForRange); thiếu thì video không tiếng */
  audio?: { channels: Float32Array[]; sampleRate: number; offsetMs: number };
}
/** Tay cầm tệp từ showSaveFilePicker: clone được sang Worker (FileSystemWritableFileStream thì KHÔNG, Chrome ném DataCloneError). */
export interface FileTarget { createWritable(): Promise<WritableStream<{ type: 'write'; data: Uint8Array; position: number }>> }
export type ExportIn =
  | { type: 'start'; job: ExportJob; file?: FileTarget }
  | { type: 'cancel' };
export type ExportOut =
  /** `stats` mỗi lần báo; `thumb` (ảnh thu nhỏ khung đang vẽ, ~2 lần/giây) khi có. */
  | { type: 'progress'; progress: ProgressInfo; stats?: ExportStats; thumb?: ImageBitmap }
  | { type: 'done'; blob: Blob | null; bytes: number; ms: number; report?: ExportReport }
  | { type: 'cancelled' }
  | { type: 'error'; code: 'ERR_EXPORT_FAILED'; message: string };
