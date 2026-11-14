// T-09 (phần lõi thuần, chạy được không cần trình duyệt): kế hoạch xuất video theo SRS REQ-EXPORT-00/01/02/05/06 và
// Technical Design §7. Chưa có Worker, WebCodecs hay Mediabunny ở đây: những phần đó nhận kết quả của các hàm này.
import { exportSegments } from './audioMap.ts';

// ---------- Kích thước (REQ-EXPORT-00) ----------
export const MAX_EDGE = 4096;
export const MIN_SHORT_EDGE = 128;
export const FPS_CHOICES = [24, 30, 60] as const;
export type Fps = (typeof FPS_CHOICES)[number];
export type ResolutionClass = 720 | 1080 | 2160;

export type SizeNote = 'ROUNDED_EVEN' | 'SCALED_DOWN';
export interface Size {
  width: number;
  height: number;
  notes: SizeNote[];
}

const evenUp = (n: number): number => (n % 2 === 0 ? n : n + 1);
const evenDown = (n: number): number => (n % 2 === 0 ? n : n - 1);

/** Lớp độ phân giải theo cạnh ngắn: cạnh dài = round(cạnh ngắn × tỉ lệ) rồi làm chẵn (lên); > 4096 thì thu nhỏ đồng tỉ lệ. */
export function sizeForClass(aspectW: number, aspectH: number, cls: ResolutionClass): Size {
  if (!(aspectW > 0 && aspectH > 0)) throw new RangeError('aspect');
  const landscape = aspectW >= aspectH;
  const ratio = landscape ? aspectW / aspectH : aspectH / aspectW; // dài / ngắn, ≥ 1
  const notes: SizeNote[] = [];
  let short: number = cls;
  let long = Math.round(short * ratio);
  if (long > MAX_EDGE) {
    long = MAX_EDGE;
    short = Math.round(long / ratio);
    notes.push('SCALED_DOWN');
  }
  const longEven = evenUp(long);
  const shortEven = evenUp(short);
  if (longEven !== long || shortEven !== short) notes.push('ROUNDED_EVEN');
  // Làm chẵn lên có thể đẩy cạnh dài qua 4096 chỉ khi 4096 chẵn: không xảy ra.
  return landscape ? { width: longEven, height: shortEven, notes } : { width: shortEven, height: longEven, notes };
}

/** Kích thước tuỳ ý (D-26): số lẻ làm tròn xuống chẵn, cạnh ngắn ≥ 128, cạnh dài > 4096 thì thu nhỏ đồng tỉ lệ. Trả null nếu quá nhỏ. */
export function sizeFromCustom(w: number, h: number): Size | null {
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  const notes: SizeNote[] = [];
  let width = Math.floor(w);
  let height = Math.floor(h);
  const longest = Math.max(width, height);
  if (longest > MAX_EDGE) {
    const k = MAX_EDGE / longest;
    width = Math.floor(width * k);
    height = Math.floor(height * k);
    notes.push('SCALED_DOWN');
  }
  const ew = evenDown(width);
  const eh = evenDown(height);
  if (ew !== width || eh !== height) notes.push('ROUNDED_EVEN');
  if (Math.min(ew, eh) < MIN_SHORT_EDGE) return null;
  return { width: ew, height: eh, notes };
}

/** Đọc tỉ lệ `W:H`, `W/H` hoặc số thập phân (`21:9`, `2.39:1`, `1.91`) thành [rộng, cao]. */
export function parseAspect(text: string): [number, number] | null {
  const s = text.trim().replace(',', '.');
  const m = /^(\d+(?:\.\d+)?)\s*[:/x×]\s*(\d+(?:\.\d+)?)$/i.exec(s);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    return a > 0 && b > 0 ? [a, b] : null;
  }
  if (/^\d+(?:\.\d+)?$/.test(s)) {
    const r = Number(s);
    return r > 0 ? [r, 1] : null;
  }
  return null;
}

// ---------- Thời lượng, khung hình (REQ-EXPORT-00/01) ----------
export const TAIL_SECONDS = 2;

/** Cả bài: max(dự án, âm thanh) + 2 s. Đoạn Start→End: đúng độ dài đoạn. */
export function exportDuration(opts: { projectSec: number; audioSec?: number; range?: { start: number; end: number } }): { start: number; duration: number } {
  if (opts.range) {
    const start = Math.max(0, opts.range.start);
    return { start, duration: Math.max(0, opts.range.end - start) };
  }
  return { start: 0, duration: Math.max(opts.projectSec, opts.audioSec ?? 0) + TAIL_SECONDS };
}

/** N = ceil(Duration × FPS); sai số nhị phân không được làm thừa một khung (0,1 s × 30 = 3,0000000000000004). */
export const frameCount = (duration: number, fps: number): number => (duration > 0 ? Math.ceil(duration * fps - 1e-6) : 0);
export const frameTime = (start: number, k: number, fps: number): number => start + k / fps;
export const frameTimestampUs = (k: number, fps: number): number => Math.round((k * 1_000_000) / fps);
export const frameDurationUs = (fps: number): number => Math.round(1_000_000 / fps);
/** Khung khoá mỗi 2 giây. */
export const isKeyFrame = (k: number, fps: number): boolean => k % (2 * fps) === 0;

// ---------- Bitrate và dung lượng (REQ-EXPORT-00) ----------
export type Quality = 'low' | 'medium' | 'high';
export const QUALITY_FACTOR: Record<Quality, number> = { low: 0.5, medium: 1, high: 1.5 };
export const AUDIO_BITRATE = 128_000;
export const RAM_WARN_BYTES = 1024 ** 3;

export function videoBitrate(width: number, height: number, quality: Quality): number {
  const short = Math.min(width, height);
  const base = short <= 720 ? 6_000_000 : short <= 1080 ? 12_000_000 : 35_000_000;
  return Math.round(base * QUALITY_FACTOR[quality]);
}

export function estimateBytes(opts: { bitrate: number; duration: number; hasAudio: boolean }): number {
  return Math.round(((opts.bitrate + (opts.hasAudio ? AUDIO_BITRATE : 0)) * opts.duration) / 8);
}

// ---------- H.264: profile/level theo kích thước và FPS (SOI-05 [VERIFY]) ----------
// Mỗi dòng: [level_idc, tên, MaxMBPS, MaxFS] theo bảng A-1 của H.264.
const H264_LEVELS: ReadonlyArray<readonly [number, string, number, number]> = [
  [0x1e, '3.0', 40_500, 1_620],
  [0x1f, '3.1', 108_000, 3_600],
  [0x20, '3.2', 216_000, 5_120],
  [0x28, '4.0', 245_760, 8_192],
  [0x2a, '4.2', 522_240, 8_704],
  [0x32, '5.0', 589_824, 22_080],
  [0x33, '5.1', 983_040, 36_864],
  [0x34, '5.2', 2_073_600, 36_864],
];
const H264_PROFILES: ReadonlyArray<readonly [string, string]> = [
  ['64', 'High'],
  ['4d', 'Main'],
  ['42', 'Baseline'],
];

const hex2 = (n: number): string => n.toString(16).padStart(2, '0');

/** Chuỗi codec avc1 cần thử, từ profile cao xuống thấp; trong mỗi profile bắt đầu từ level nhỏ nhất đủ dùng rồi lên dần. Rỗng nếu vượt level 5.2. */
export function h264Candidates(width: number, height: number, fps: number): string[] {
  const mbs = Math.ceil(width / 16) * Math.ceil(height / 16);
  const mbps = mbs * fps;
  const fits = H264_LEVELS.filter(([, , maxMbps, maxFs]) => mbs <= maxFs && mbps <= maxMbps);
  const out: string[] = [];
  for (const [profile] of H264_PROFILES) for (const [idc] of fits) out.push(`avc1.${profile}00${hex2(idc)}`);
  return out;
}

// ---------- Bậc dự phòng codec (REQ-EXPORT-06) ----------
export const VP9_CODEC = 'vp09.00.10.08';
export const VP8_CODEC = 'vp8';
export const AAC_CODEC = 'mp4a.40.2';
export const OPUS_CODEC = 'opus';

export interface CodecProbe {
  video(config: { codec: string; width: number; height: number; framerate: number; bitrate: number }): Promise<boolean>;
  audio(config: { codec: string; sampleRate: number; numberOfChannels: number; bitrate: number }): Promise<boolean>;
}

export type TierNotice = 'NO_AAC_VIDEO_ONLY' | 'WEBM_NO_H264' | 'WEBM_NO_AUDIO';
export interface CodecChoice {
  tier: 1 | 2 | 3;
  container: 'mp4' | 'webm';
  videoCodec: string;
  audioCodec: string | null;
  notices: TierNotice[];
}

/**
 * Chọn bậc: 1 H.264 + AAC (MP4), 2 H.264 không tiếng (MP4), 3 VP9/VP8 + Opus (WebM), còn lại null = `ERR_NO_SUPPORTED_ENCODER`.
 * Dự án không có âm thanh thì bậc 1 chỉ cần H.264 (Silent AAC mặc định tắt, D-01).
 */
export async function chooseCodec(
  probe: CodecProbe,
  cfg: { width: number; height: number; fps: number; bitrate: number; hasAudio: boolean; sampleRate?: number; channels?: number },
): Promise<CodecChoice | null> {
  const video = { width: cfg.width, height: cfg.height, framerate: cfg.fps, bitrate: cfg.bitrate };
  const audioCfg = (codec: string) => ({ codec, sampleRate: cfg.sampleRate ?? 48_000, numberOfChannels: cfg.channels ?? 2, bitrate: AUDIO_BITRATE });
  const safe = async (p: Promise<boolean>): Promise<boolean> => {
    try {
      return await p;
    } catch {
      return false;
    }
  };

  let avc: string | null = null;
  for (const codec of h264Candidates(cfg.width, cfg.height, cfg.fps)) {
    if (await safe(probe.video({ codec, ...video }))) {
      avc = codec;
      break;
    }
  }
  if (avc) {
    if (!cfg.hasAudio) return { tier: 1, container: 'mp4', videoCodec: avc, audioCodec: null, notices: [] };
    if (await safe(probe.audio(audioCfg(AAC_CODEC)))) return { tier: 1, container: 'mp4', videoCodec: avc, audioCodec: AAC_CODEC, notices: [] };
    return { tier: 2, container: 'mp4', videoCodec: avc, audioCodec: null, notices: ['NO_AAC_VIDEO_ONLY'] };
  }

  for (const codec of [VP9_CODEC, VP8_CODEC]) {
    if (!(await safe(probe.video({ codec, ...video })))) continue;
    const notices: TierNotice[] = ['WEBM_NO_H264'];
    let audioCodec: string | null = null;
    if (cfg.hasAudio) {
      if (await safe(probe.audio(audioCfg(OPUS_CODEC)))) audioCodec = OPUS_CODEC;
      else notices.push('WEBM_NO_AUDIO');
    }
    return { tier: 3, container: 'webm', videoCodec: codec, audioCodec, notices };
  }
  return null;
}

// ---------- Pre-flight tổng hợp (REQ-EXPORT-00) ----------
export interface PreflightInput {
  width: number;
  height: number;
  fps: Fps;
  quality: Quality;
  duration: number;
  hasAudio: boolean;
  hasFileSystemAccess: boolean;
}
export type PreflightWarning = 'LARGE_IN_MEMORY' | 'HIGH_PIXEL_RATE';
export interface Preflight {
  frames: number;
  bitrate: number;
  bytes: number;
  warnings: PreflightWarning[];
}

export function preflight(i: PreflightInput): Preflight {
  const bitrate = videoBitrate(i.width, i.height, i.quality);
  const bytes = estimateBytes({ bitrate, duration: i.duration, hasAudio: i.hasAudio });
  const warnings: PreflightWarning[] = [];
  if (!i.hasFileSystemAccess && bytes > RAM_WARN_BYTES) warnings.push('LARGE_IN_MEMORY');
  return { frames: frameCount(i.duration, i.fps), bitrate, bytes, warnings };
}

// ---------- Kiểm soát dòng chảy (REQ-EXPORT-02) ----------
export const QUEUE_HIGH = 8;
export const QUEUE_LOW = 2;

/** Trễ hai ngưỡng: > 8 thì dừng sinh khung, chỉ chạy lại khi ≤ 2. Một bộ cho video, một bộ cho audio. */
export function createBackpressure(high = QUEUE_HIGH, low = QUEUE_LOW) {
  let paused = false;
  return {
    /** `true` nếu nên chờ sự kiện `dequeue` trước khi encode tiếp. */
    update(queueSize: number): boolean {
      if (paused) {
        if (queueSize <= low) paused = false;
      } else if (queueSize > high) paused = true;
      return paused;
    },
    get paused(): boolean {
      return paused;
    },
  };
}

// ---------- Tiến độ và ETR (REQ-EXPORT-05) ----------
export interface ProgressInfo {
  fraction: number;
  frame: number;
  total: number;
  /** khung/giây đang render (trung bình trượt) */
  fps: number | null;
  /** bội số thời gian thực, ví dụ 1,8 */
  speed: number | null;
  etrSec: number | null;
}

/** Trung bình trượt theo cửa sổ `windowMs`: ổn định hơn tốc độ tức thời nên ETR không nhảy. */
export function createProgress(total: number, videoFps: number, windowMs = 5000) {
  const samples: Array<{ t: number; k: number }> = [];
  return {
    update(k: number, nowMs: number): ProgressInfo {
      samples.push({ t: nowMs, k });
      while (samples.length > 2 && nowMs - samples[0].t > windowMs) samples.shift();
      const first = samples[0];
      const dt = (nowMs - first.t) / 1000;
      const rate = dt > 0 && k > first.k ? (k - first.k) / dt : null;
      return {
        fraction: total > 0 ? Math.min(1, k / total) : 1,
        frame: k,
        total,
        fps: rate,
        speed: rate === null ? null : rate / videoFps,
        etrSec: rate === null ? null : Math.max(0, (total - k) / rate),
      };
    },
  };
}

// ---------- Khối âm thanh 1 giây (Technical Design §7.1, REQ-EXPORT-03) ----------
export const AUDIO_BLOCK_SECONDS = 1;

/** Số mẫu và vị trí (mẫu, tính từ đầu khoảng xuất) của từng khối. Khối cuối ngắn hơn nếu khoảng không chia hết. */
export function audioBlocks(duration: number, sampleRate: number, blockSec = AUDIO_BLOCK_SECONDS): Array<{ start: number; length: number }> {
  const total = Math.round(duration * sampleRate);
  const size = Math.round(blockSec * sampleRate);
  const out: Array<{ start: number; length: number }> = [];
  for (let s = 0; s < total; s += size) out.push({ start: s, length: Math.min(size, total - s) });
  return out;
}

/**
 * Dựng một khối PCM cho khoảng xuất bắt đầu ở `rangeStart` (giây dự án): đoạn thiếu là im lặng, đoạn thừa bị cắt, theo
 * `Doc.audioOffsetMs`. Căn theo mẫu nguyên nên khối nối nhau không hở, không chồng. `channels` là dữ liệu của `AudioBuffer`.
 * Không đụng tới độ trễ thiết bị: xuất là offline (chỉnh 1, Technical Design §6.2.7).
 */
export function renderAudioBlock(
  channels: readonly Float32Array[],
  sampleRate: number,
  rangeStart: number,
  offsetMs: number,
  block: { start: number; length: number },
): Float32Array[] {
  const src0 = Math.round((rangeStart - offsetMs / 1000) * sampleRate) + block.start;
  return channels.map((ch) => {
    const out = new Float32Array(block.length);
    const lo = Math.max(0, -src0);
    const hi = Math.min(block.length, ch.length - src0);
    if (hi > lo) out.set(ch.subarray(src0 + lo, src0 + hi), lo);
    return out;
  });
}

/** Tổng thời lượng có tiếng thật trong khoảng xuất (để pre-flight báo "không có âm thanh trong đoạn này"). */
export function audibleSeconds(rangeStart: number, duration: number, offsetMs: number, bufferDuration: number): number {
  return exportSegments(rangeStart, rangeStart + duration, offsetMs, bufferDuration)
    .filter((s) => s.kind === 'audio')
    .reduce((a, s) => a + s.length, 0);
}

/**
 * Cắt phần AudioBuffer mà khoảng xuất thật sự dùng, để chuyển sang Worker (không gửi cả bài). Trả bản sao theo mẫu nguyên và
 * `offsetMs` mới sao cho `renderAudioBlock` trên bản cắt cho đúng từng mẫu như trên bản gốc. Null nếu khoảng không có tiếng.
 */
export function sliceAudioForRange(
  channels: readonly Float32Array[],
  sampleRate: number,
  rangeStart: number,
  duration: number,
  offsetMs: number,
): { channels: Float32Array[]; offsetMs: number } | null {
  const first = Math.round((rangeStart - offsetMs / 1000) * sampleRate);
  const last = first + Math.round(duration * sampleRate);
  const len = channels[0]?.length ?? 0;
  const lo = Math.max(0, first);
  const hi = Math.min(len, last);
  if (hi <= lo) return null;
  // Mẫu lo của bản gốc nằm ở thời gian dự án (lo / sr + offset); bản cắt bắt đầu ở đó.
  return { channels: channels.map((c) => c.slice(lo, hi)), offsetMs: (lo / sampleRate) * 1000 + offsetMs };
}
