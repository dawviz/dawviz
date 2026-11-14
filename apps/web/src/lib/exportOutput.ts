// T-09: adapter Mediabunny (MuxerAdapter, Technical Design §7.2, REQ-EXPORT-04). Chỉ chạy được trong trình duyệt có WebCodecs;
// phần tính toán nằm ở exportPlan.ts/exportEngine.ts. Mediabunny tự giữ VideoEncoder/AudioEncoder và chờ hàng đợi trong `add()`.
import { AudioSample, AudioSampleSource, BufferTarget, CanvasSource, Mp4OutputFormat, Output, StreamTarget, WebMOutputFormat } from 'mediabunny';
import type { AudioSink, VideoSink } from './exportEngine.ts';
import type { CodecChoice } from './exportPlan.ts';

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
  /** Huỷ: không để lại tệp dở. */
  cancel(): Promise<void>;
}

const videoCodecName = (s: string) => (s.startsWith('avc1') ? 'avc' : s.startsWith('vp09') ? 'vp9' : 'vp8') as 'avc' | 'vp9' | 'vp8';

export function createExportOutput(cfg: OutputConfig): ExportOutput {
  const { choice } = cfg;
  const buffer = cfg.file ? null : new BufferTarget();
  const target = buffer ?? new StreamTarget(cfg.file!, { chunked: true });
  const format = choice.container === 'mp4' ? new Mp4OutputFormat({ fastStart: 'in-memory' }) : new WebMOutputFormat();
  const output = new Output({ format, target });

  const videoSource = new CanvasSource(cfg.canvas, {
    codec: videoCodecName(choice.videoCodec),
    bitrate: cfg.bitrate,
    fullCodecString: choice.videoCodec.startsWith('avc1') ? choice.videoCodec : undefined,
    keyFrameInterval: 2,
  });
  output.addVideoTrack(videoSource, { frameRate: cfg.fps });
  const video: VideoSink = { add: (ts, dur, o) => videoSource.add(ts, dur, { keyFrame: o.keyFrame }) };

  let audio: AudioSink | undefined;
  if (choice.audioCodec && cfg.audio) {
    const a = cfg.audio;
    const src = new AudioSampleSource({ codec: choice.audioCodec === 'opus' ? 'opus' : 'aac', bitrate: a.bitrate });
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
      return buffer ? new Blob([buffer.buffer!], { type: choice.container === 'mp4' ? 'video/mp4' : 'video/webm' }) : null;
    },
    cancel: async () => {
      await output.cancel();
      if (cfg.file) await cfg.file.abort().catch(() => {});
    },
  };
}
