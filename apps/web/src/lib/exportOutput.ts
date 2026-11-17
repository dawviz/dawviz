// T-09: adapter Mediabunny (MuxerAdapter, Technical Design §7.2, REQ-EXPORT-04). Chỉ chạy được trong trình duyệt có WebCodecs;
// phần tính toán nằm ở exportPlan.ts/exportEngine.ts. Mediabunny tự giữ VideoEncoder/AudioEncoder và chờ hàng đợi trong `add()`.
import { AudioSample, AudioSampleSource, BufferTarget, CanvasSource, MkvOutputFormat, MovOutputFormat, Mp4OutputFormat, Output, StreamTarget, WebMOutputFormat } from 'mediabunny';
import type { AudioSink, VideoSink } from './exportEngine.ts';
import { CONTAINER_MIME, type CodecChoice } from './exportPlan.ts';

export interface OutputConfig {
  choice: CodecChoice;
  canvas: OffscreenCanvas;
  fps: number;
  bitrate: number;
  /** Có thì ghi thẳng vào tệp (File System Access); không thì gom trong bộ nhớ và trả Blob. */
  file?: WritableStream<{ type: 'write'; data: Uint8Array; position: number }>;
  audio?: { sampleRate: number; channels: number; bitrate: number };
}
export interface ExportOutput {
  video: VideoSink;
  audio?: AudioSink;
  start(): Promise<void>;
  /** Ghi nốt và đóng. Trả Blob nếu ghi trong bộ nhớ. */
  finalize(): Promise<Blob | null>;
  /** Số byte của tệp kết quả (đủ cho cả đường ghi thẳng đĩa, nơi không có Blob). Đúng sau `finalize()`. */
  bytes(): number;
  /** Huỷ: không để lại tệp dở. */
  cancel(): Promise<void>;
}


export function createExportOutput(cfg: OutputConfig): ExportOutput {
  const { choice } = cfg;
  const buffer = cfg.file ? null : new BufferTarget();
  // Đếm byte đi qua luồng ghi (kích thước tệp = vị trí cuối lớn nhất): hộp thoại báo đúng dung lượng khi ghi thẳng xuống đĩa.
  let written = 0;
  const counted = cfg.file ? (() => {
    const w = cfg.file.getWriter();
    return new WritableStream<{ type: 'write'; data: Uint8Array; position: number }>({
      write: (c) => { written = Math.max(written, c.position + c.data.byteLength); return w.write(c); },
      close: () => w.close(), abort: (r) => w.abort(r),
    });
  })() : null;
  const target = buffer ?? new StreamTarget(counted!, { chunked: true });
  const format = choice.container === 'mp4' ? new Mp4OutputFormat({ fastStart: 'in-memory' }) : choice.container === 'mov' ? new MovOutputFormat({ fastStart: 'in-memory' }) : choice.container === 'mkv' ? new MkvOutputFormat() : new WebMOutputFormat();
  const output = new Output({ format, target });

  const videoSource = new CanvasSource(cfg.canvas, {
    codec: choice.video,
    bitrate: cfg.bitrate,
    fullCodecString: choice.video === 'vp8' ? undefined : choice.videoCodec,
    keyFrameInterval: 2,
  });
  output.addVideoTrack(videoSource, { frameRate: cfg.fps });
  const video: VideoSink = { add: (ts, dur, o) => videoSource.add(ts, dur, { keyFrame: o.keyFrame }) };

  let audio: AudioSink | undefined;
  if (choice.audioCodec && cfg.audio) {
    const a = cfg.audio;
    const src = new AudioSampleSource({ codec: choice.audioCodec === 'pcm' ? 'pcm-s16' : choice.audioCodec, ...(choice.audioCodec === 'pcm' ? {} : { bitrate: a.bitrate }) } as ConstructorParameters<typeof AudioSampleSource>[0]);
    output.addAudioTrack(src);
    audio = {
      add: async (planar, sampleRate, timestamp) => {
        const length = planar[0].length;
        const data = new Float32Array(length * planar.length);
        planar.forEach((ch, i) => data.set(ch, i * length));
        const sample = new AudioSample({ data, format: 'f32-planar', numberOfChannels: planar.length, sampleRate, timestamp });
        try { await src.add(sample); } finally { sample.close(); }
      },
    };
  }

  return {
    video,
    audio,
    start: () => output.start(),
    finalize: async () => {
      await output.finalize();
      return buffer ? new Blob([buffer.buffer!], { type: CONTAINER_MIME[choice.container] }) : null;
    },
    bytes: () => (buffer?.buffer ? buffer.buffer.byteLength : written),
    cancel: async () => {
      await output.cancel();
      if (counted && !counted.locked) await counted.abort().catch(() => {});
      else if (cfg.file && !cfg.file.locked) await cfg.file.abort().catch(() => {});
    },
  };
}
