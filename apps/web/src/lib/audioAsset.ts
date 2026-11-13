// Nạp tệp âm thanh mix (T-08, §6.2.1). Thứ tự kiểm: kích thước → thời lượng từ metadata → giải mã → thời lượng thật.
// Mọi lỗi dự đoán được có mã (ERR_FILE_TOO_LARGE, ERR_AUDIO_TOO_LONG, ERR_AUDIO_DECODE); phần phụ thuộc trình duyệt tiêm vào để test.
import { AUDIO_SAMPLE_RATE, MAX_AUDIO_BYTES, MAX_AUDIO_SECONDS, MAX_UNKNOWN_DURATION_BYTES, hasAudioExtension } from './audioLimits.ts';

export type AudioErrorCode = 'ERR_FILE_TOO_LARGE' | 'ERR_AUDIO_TOO_LONG' | 'ERR_AUDIO_DECODE';
export class AudioLoadError extends Error {
  readonly code: AudioErrorCode;
  readonly details: Record<string, unknown>;
  constructor(code: AudioErrorCode, message: string, details: Record<string, unknown> = {}) { super(message); this.name = 'AudioLoadError'; this.code = code; this.details = details; }
}

/** Phần của AudioBuffer mà ứng dụng cần. */
export interface PcmBuffer {
  duration: number; sampleRate: number; numberOfChannels: number; length: number;
  getChannelData(channel: number): Float32Array;
}
export interface AudioAsset {
  /** SHA-256 của byte tệp (hex); khoá bộ đệm sóng âm, định danh tài nguyên phiên (REQ-STORAGE-05). */
  id: string;
  name: string;
  /** Tham chiếu tệp (Blob trỏ tới đĩa) để đóng gói Project Pack sau này; byte nén không được giữ trong RAM. */
  file: File;
  buffer: PcmBuffer;
  durationSec: number;
}

export interface LoadDeps {
  /** Thời lượng (giây) từ metadata, không giải mã; null nếu không biết (Infinity/NaN/lỗi/quá hạn). */
  probeDuration(file: File): Promise<number | null>;
  /** Giải mã về 48 kHz. Nhận ArrayBuffer (sẽ bị chuyển quyền sở hữu). */
  decode(data: ArrayBuffer): Promise<PcmBuffer>;
  sha256(data: ArrayBuffer): Promise<string>;
}

export async function loadAudioAsset(file: File, deps: LoadDeps): Promise<AudioAsset> {
  if (file.size === 0) throw new AudioLoadError('ERR_AUDIO_DECODE', 'empty file', { reason: 'empty' });
  if (file.size > MAX_AUDIO_BYTES) throw new AudioLoadError('ERR_FILE_TOO_LARGE', 'audio file too large', { size: file.size, max: MAX_AUDIO_BYTES });
  if (!hasAudioExtension(file.name)) throw new AudioLoadError('ERR_AUDIO_DECODE', 'unsupported extension', { reason: 'format' });
  const probed = await deps.probeDuration(file).catch(() => null);
  const known = probed !== null && Number.isFinite(probed) && probed > 0;
  if (known && probed > MAX_AUDIO_SECONDS) throw new AudioLoadError('ERR_AUDIO_TOO_LONG', 'audio too long', { seconds: Math.round(probed), max: MAX_AUDIO_SECONDS });
  // Không biết độ dài: giải mã rồi mới kiểm, nhưng chỉ khi tệp đủ nhỏ để chắc chắn không vượt bộ nhớ.
  if (!known && file.size > MAX_UNKNOWN_DURATION_BYTES) throw new AudioLoadError('ERR_AUDIO_TOO_LONG', 'duration unknown and file too large to decode safely', { reason: 'unknown', size: file.size, max: MAX_UNKNOWN_DURATION_BYTES });
  let data: ArrayBuffer, id: string, buffer: PcmBuffer;
  try {
    data = await file.arrayBuffer();
    id = await deps.sha256(data);
    buffer = await deps.decode(data);
  } catch (e) {
    throw new AudioLoadError('ERR_AUDIO_DECODE', e instanceof Error ? e.message : String(e), { reason: 'decode' });
  }
  if (!(buffer.duration > 0) || buffer.length === 0) throw new AudioLoadError('ERR_AUDIO_DECODE', 'decoded audio is empty', { reason: 'empty' });
  if (buffer.duration > MAX_AUDIO_SECONDS) throw new AudioLoadError('ERR_AUDIO_TOO_LONG', 'audio too long', { seconds: Math.round(buffer.duration), max: MAX_AUDIO_SECONDS });
  return { id, name: file.name, file, buffer, durationSec: buffer.duration };
}

// ── phụ thuộc thật của trình duyệt ──
const PROBE_TIMEOUT_MS = 5000;
export const browserDeps: LoadDeps = {
  probeDuration(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const el = new Audio();
      let done = false;
      const finish = (v: number | null) => { if (done) return; done = true; clearTimeout(timer); el.removeAttribute('src'); el.load(); URL.revokeObjectURL(url); resolve(v); };
      const timer = setTimeout(() => finish(null), PROBE_TIMEOUT_MS);
      el.preload = 'metadata';
      el.onloadedmetadata = () => finish(Number.isFinite(el.duration) ? el.duration : null);
      el.onerror = () => finish(null);
      el.src = url;
    });
  },
  // OfflineAudioContext: không dính chính sách autoplay; sampleRate cố định nên kết quả đã ở 48 kHz (khớp REQ-EXPORT-03).
  decode: (data) => new OfflineAudioContext(2, 1, AUDIO_SAMPLE_RATE).decodeAudioData(data),
  async sha256(data) {
    const h = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
    return Array.from(h, (b) => b.toString(16).padStart(2, '0')).join('');
  },
};
