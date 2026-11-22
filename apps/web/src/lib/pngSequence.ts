// Xuất nền trong suốt (T-55, REQ-EXPORT-08): chuỗi PNG (kèm `.wav` nếu muốn) ghi vào thư mục (File System Access) hoặc gói `.zip`.
// Phần thuần: tên tệp, ước tính dung lượng cho pre-flight, mã hoá WAV 16 bit, đích ghi (zip passthrough — PNG đã nén, không nén lại — hoặc thư mục).
// Khả năng VP9 có kênh alpha chỉ được PHÁT HIỆN để báo (Chrome hiện không hỗ trợ, Firefox có); bản này xuất chuỗi PNG. Không DOM; test ở pngSequence.test.ts.
import { Zip, ZipPassThrough } from 'fflate';

/** Byte mỗi điểm ảnh ước tính của PNG khung HUD trong suốt (phần lớn trống nên nén tốt). Chỉ để pre-flight; số thật in sau khi xuất. */
export const PNG_BYTES_PER_PIXEL = 0.3;
/** Gói zip giữ cả trong bộ nhớ: trên mức này khuyên chọn thư mục. */
export const ZIP_WARN_BYTES = 1024 ** 3;

/** `tên_000001.png` (đếm từ 1, đủ chữ số cho cả chuỗi, tối thiểu 6). */
export function pngName(base: string, k: number, total: number): string {
  const w = Math.max(6, String(total).length);
  return `${base}_${String(k + 1).padStart(w, '0')}.png`;
}
/** Tên gốc an toàn cho tệp: bỏ ký tự cấm trên Windows/macOS, tối đa 80 ký tự. */
export const safeBase = (s: string): string => s.replace(/\.[^.]+$/, '').replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '_').trim().slice(0, 80) || 'dawviz';

export function estimatePngBytes(o: { width: number; height: number; frames: number; wavSeconds?: number; sampleRate?: number; channels?: number }): number {
  const png = o.width * o.height * PNG_BYTES_PER_PIXEL * o.frames;
  const wav = o.wavSeconds ? 44 + Math.round(o.wavSeconds * (o.sampleRate ?? 48000)) * (o.channels ?? 2) * 2 : 0;
  return Math.round(png + wav);
}

/** WAV PCM 16 bit little-endian, xen kẽ kênh, kẹp −1…1. */
export function wavBytes(channels: readonly Float32Array[], sampleRate: number): Uint8Array {
  const ch = Math.max(1, channels.length), n = channels.length ? Math.min(...channels.map((c) => c.length)) : 0, data = n * ch * 2;
  const buf = new ArrayBuffer(44 + data), v = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + data, true); str(8, 'WAVE'); str(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, ch, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * ch * 2, true); v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, data, true);
  let o = 44;
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const x = Math.max(-1, Math.min(1, channels[c]?.[i] ?? 0)); v.setInt16(o, x < 0 ? Math.round(x * 0x8000) : Math.round(x * 0x7fff), true); o += 2; }
  return new Uint8Array(buf);
}

/** Đích ghi chuỗi tệp. `finish` trả Blob zip (đích zip) hoặc null (đích thư mục: đã ghi xong từng tệp). */
export interface SequenceSink { write(name: string, bytes: Uint8Array): Promise<void>; finish(): Promise<Blob | null>; bytes(): number; cancel(): Promise<void> }
/** Gói zip phát luồng (fflate Zip + ZipPassThrough): PNG đã nén nên lưu nguyên, không tốn CPU nén lại. Các mảnh giữ trong bộ nhớ tới khi xong. */
export function zipSink(): SequenceSink {
  const parts: Uint8Array[] = [];
  let total = 0, err: Error | null = null, done: (() => void) | null = null;
  const zip = new Zip((e, chunk, final) => { if (e) { err = e; return; } parts.push(chunk); total += chunk.length; if (final) done?.(); });
  return {
    async write(name, bytes) {
      if (err) throw err;
      const f = new ZipPassThrough(name); zip.add(f); f.push(bytes, true);
    },
    async finish() {
      const end = new Promise<void>((ok) => { done = ok; });
      zip.end(); await end;
      if (err) throw err;
      return new Blob(parts as BlobPart[], { type: 'application/zip' });
    },
    bytes: () => total,
    async cancel() { zip.terminate(); parts.length = 0; },
  };
}
/** Thư mục do người dùng chọn (showDirectoryPicker): tay cầm clone được sang Worker. Ghi từng tệp ngay, không giữ trong bộ nhớ. */
export interface DirTarget { getFileHandle(name: string, o: { create: boolean }): Promise<{ createWritable(): Promise<{ write(d: Uint8Array): Promise<void>; close(): Promise<void>; abort?(): Promise<void> }> }> }
export function dirSink(dir: DirTarget): SequenceSink {
  let total = 0;
  return {
    async write(name, bytes) { const h = await dir.getFileHandle(name, { create: true }), w = await h.createWritable(); await w.write(bytes); await w.close(); total += bytes.length; },
    async finish() { return null; },
    bytes: () => total,
    async cancel() { /* tệp đã ghi giữ lại: người dùng tự xoá thư mục nếu muốn */ },
  };
}

/** Pre-flight của VP9 có alpha (chỉ phát hiện). `encoder` tiêm vào để test; vắng VideoEncoder → false. */
export async function vp9AlphaSupported(width: number, height: number, encoder?: { isConfigSupported(c: object): Promise<{ supported?: boolean }> }): Promise<boolean> {
  const E = encoder ?? (globalThis as { VideoEncoder?: { isConfigSupported(c: object): Promise<{ supported?: boolean }> } }).VideoEncoder;
  if (!E) return false;
  try { return !!(await E.isConfigSupported({ codec: 'vp09.00.10.08', width, height, alpha: 'keep', bitrate: 8_000_000 })).supported; } catch { return false; }
}
