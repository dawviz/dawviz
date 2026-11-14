// T-09: vòng xuất khung hình (Technical Design §7.1). Không biết gì về WebCodecs/Mediabunny/canvas: nhận `draw`, `video`, `audio`
// qua giao diện nên chạy được và test được bằng node. Adapter thật: lib/exportOutput.ts; Worker: workers/export.worker.ts.
import { AUDIO_BLOCK_SECONDS, audioBlocks, createProgress, frameCount, frameDurationUs, frameTime, frameTimestampUs, isKeyFrame, renderAudioBlock, type ProgressInfo } from './exportPlan.ts';

export class ExportCancelled extends Error {
  constructor() { super('export cancelled'); this.name = 'ExportCancelled'; }
}

export interface VideoSink {
  /** Mã hoá khung hiện đang ở canvas. Trả về khi encoder còn chỗ (cơ chế dòng chảy REQ-EXPORT-02 nằm ở đây). */
  add(timestampSec: number, durationSec: number, opts: { keyFrame: boolean }): Promise<void>;
}
export interface AudioSink {
  add(planar: Float32Array[], sampleRate: number, timestampSec: number): Promise<void>;
}
export interface AudioInput {
  channels: readonly Float32Array[];
  sampleRate: number;
  offsetMs: number;
}
export interface EngineOptions {
  fps: number;
  /** thời điểm dự án của khung 0 */
  start: number;
  duration: number;
  /** vẽ khung ở thời điểm dự án `t` lên canvas của VideoSink */
  draw(t: number, k: number): void;
  video: VideoSink;
  audio?: { sink: AudioSink; input: AudioInput };
  signal?: { readonly aborted: boolean };
  onProgress?(p: ProgressInfo): void;
  now?(): number;
  /** khoảng tối thiểu giữa hai lần báo tiến độ (ms) */
  progressEveryMs?: number;
}

/**
 * Với khung k: nếu k rơi đúng đầu một khối 1 s thì đẩy khối âm thanh tương ứng trước (âm thanh dẫn trước 1 s để muxer không phải
 * giữ lâu), rồi vẽ và mã hoá khung. Mẫu đầu của âm thanh có timestamp 0 trùng khung đầu (REQ-EXPORT-03). Trả số khung đã xuất.
 */
export async function runExport(o: EngineOptions): Promise<number> {
  const total = frameCount(o.duration, o.fps);
  const now = o.now ?? (() => performance.now());
  const every = o.progressEveryMs ?? 100;
  const prog = createProgress(total, o.fps);
  const blocks = o.audio ? audioBlocks(o.duration, o.audio.input.sampleRate, AUDIO_BLOCK_SECONDS) : [];
  let nextBlock = 0;
  const check = () => { if (o.signal?.aborted) throw new ExportCancelled(); };
  const pushBlock = async () => {
    const a = o.audio!;
    const b = blocks[nextBlock++];
    const planar = renderAudioBlock(a.input.channels, a.input.sampleRate, o.start, a.input.offsetMs, b);
    await a.sink.add(planar, a.input.sampleRate, b.start / a.input.sampleRate);
  };
  const framesPerBlock = Math.round(o.fps * AUDIO_BLOCK_SECONDS);
  let lastReport = -Infinity;

  for (let k = 0; k < total; k++) {
    check();
    if (o.audio && k % framesPerBlock === 0 && nextBlock < blocks.length) await pushBlock();
    o.draw(frameTime(o.start, k, o.fps), k);
    await o.video.add(frameTimestampUs(k, o.fps) / 1e6, frameDurationUs(o.fps) / 1e6, { keyFrame: isKeyFrame(k, o.fps) });
    const n = now();
    if (o.onProgress && n - lastReport >= every) { lastReport = n; o.onProgress(prog.update(k + 1, n)); }
  }
  while (o.audio && nextBlock < blocks.length) { check(); await pushBlock(); }
  check();
  o.onProgress?.(prog.update(total, now()));
  return total;
}
