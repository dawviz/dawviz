// T-09: thông điệp giữa giao diện và Export Worker (Technical Design §7.1, REQ-EXPORT-07).
import type { Derived, SceneDocument, UnifiedProjectAST } from '@dawviz/render-core';
import type { CodecChoice, ProgressInfo } from './exportPlan.ts';

export interface ExportJob {
  ast: UnifiedProjectAST;
  scene: SceneDocument;
  brightness: Derived['brightness'];
  width: number;
  height: number;
  fps: number;
  bitrate: number;
  choice: CodecChoice;
  /** giây dự án của khung 0 và độ dài */
  start: number;
  duration: number;
  /** PCM đã cắt theo khoảng xuất (sliceAudioForRange); thiếu thì video không tiếng */
  audio?: { channels: Float32Array[]; sampleRate: number; offsetMs: number };
}
export type ExportIn =
  | { type: 'start'; job: ExportJob; file?: WritableStream<{ type: 'write'; data: Uint8Array; position: number }> }
  | { type: 'cancel' };
export type ExportOut =
  | { type: 'progress'; progress: ProgressInfo }
  | { type: 'done'; blob: Blob | null; bytes: number; ms: number }
  | { type: 'cancelled' }
  | { type: 'error'; code: 'ERR_EXPORT_FAILED'; message: string };
