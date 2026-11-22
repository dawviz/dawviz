// T-09: thông điệp giữa giao diện và Export Worker (Technical Design §7.1, REQ-EXPORT-07).
import type { BackgroundImage, Derived, DerivedAudio, NotationLayout, SceneDocument, UnifiedProjectAST } from '@dawviz/render-core';
import type { CodecChoice, ProgressInfo } from './exportPlan.ts';
import type { ExportReport, ExportStats } from './exportStats.ts';
import type { DirTarget } from './pngSequence.ts';

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
  /** Bảng phổ đã tính ở Xem trước (T-53) + offset âm thanh của dự án: Export vẽ widget Audio Spectrum từ đúng bảng đó (Preview = Export). Vắng = chưa có âm thanh. */
  spectrum?: DerivedAudio;
  /** Ảnh nền của phiên (T-21): ImageBitmap riêng cho lần xuất này, được chuyển (transfer) sang Worker. */
  background?: BackgroundImage;
  /** Bản nhạc đã dựng ở Xem trước theo id widget Bản nhạc (D-63): Export vẽ đúng bản đó (Preview = Export). */
  notation?: [string, NotationLayout][];
  /** Xuất chuỗi PNG (T-55): `base` tên gốc, `wav` kèm âm thanh, `transparent` bỏ nền, `layers` chỉ các widget này. Vắng = xuất video. */
  png?: { base: string; wav: boolean; transparent: boolean; layers?: string[] };
  /** Tài nguyên của phiên (T-21): bitmap ảnh theo `sha256:…` (chuyển sang Worker) và phông người dùng (byte). */
  images?: [string, ImageBitmap][];
  userFonts?: { family: string; bytes: Uint8Array }[];
}
/** Tay cầm tệp từ showSaveFilePicker: clone được sang Worker (FileSystemWritableFileStream thì KHÔNG, Chrome ném DataCloneError). */
export interface FileTarget { createWritable(): Promise<WritableStream<{ type: 'write'; data: Uint8Array; position: number }>> }
export type ExportIn =
  | { type: 'start'; job: ExportJob; file?: FileTarget; dir?: DirTarget }
  | { type: 'cancel' };
export type ExportOut =
  /** `stats` mỗi lần báo; `thumb` (ảnh thu nhỏ khung đang vẽ, ~2 lần/giây) khi có. */
  | { type: 'progress'; progress: ProgressInfo; stats?: ExportStats; thumb?: ImageBitmap }
  | { type: 'done'; blob: Blob | null; bytes: number; ms: number; report?: ExportReport }
  | { type: 'cancelled' }
  | { type: 'error'; code: 'ERR_EXPORT_FAILED'; message: string };
