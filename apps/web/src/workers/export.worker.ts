// Export Worker (T-09, REQ-EXPORT-07): dựng derived từ ast + scene, vẽ từng khung bằng renderFrame lên OffscreenCanvas,
// mã hoá qua Mediabunny. Huỷ: đặt cờ, vòng xuất dừng ở khung kế và đóng đích ghi (không để lại tệp dở).
import { buildIndex, buildSceneHud, ensureFonts, needsFonts, renderFrame, requiredFonts, type Derived, type FontFaceSpec, type RenderCtx } from '@dawviz/render-core';
import { ExportCancelled, runExport } from '../lib/exportEngine.ts';
import { createExportOutput } from '../lib/exportOutput.ts';
import type { ExportIn, ExportJob, ExportOut } from '../lib/exportProtocol.ts';

const post = (m: ExportOut) => (self as unknown as Worker).postMessage(m);
const flag = { aborted: false };

const loadFont = async (spec: FontFaceSpec) => {
  const face = new FontFace(spec.family, `url(${import.meta.env.BASE_URL}fonts/${spec.file})`, { weight: String(spec.weight), unicodeRange: spec.unicodeRange });
  await face.load();
  (self as unknown as { fonts: FontFaceSet }).fonts.add(face);
};

async function run(job: ExportJob, file: Extract<ExportIn, { type: 'start' }>['file']) {
  const t0 = performance.now();
  const { scene, ast, width, height } = job;
  // Phông phải sẵn sàng trước khung đầu (TECHNICAL-DESIGN 5.7); thiếu thì lỗi, không xuất khung chữ bằng phông dự phòng.
  if (needsFonts(scene)) await ensureFonts(requiredFonts(scene), loadFont);
  const index = buildIndex(ast.tracks, ast.meta.totalDurationSeconds);
  const derived: Derived = { index, brightness: job.brightness, hud: buildSceneHud(scene, ast, index), fontsReady: true };

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  const scale = width / scene.canvas.designWidth;
  const out = createExportOutput({
    choice: job.choice, canvas, fps: job.fps, bitrate: job.bitrate, file,
    audio: job.audio && job.choice.audioCodec ? { sampleRate: job.audio.sampleRate, channels: job.audio.channels.length, bitrate: 128_000 } : undefined,
  });
  try {
    await out.start();
    await runExport({
      fps: job.fps, start: job.start, duration: job.duration, signal: flag, video: out.video,
      audio: out.audio && job.audio ? { sink: out.audio, input: job.audio } : undefined,
      draw: (t) => renderFrame(scene, derived, ast, t, { ctx: ctx as unknown as RenderCtx, width, height }, scale),
      onProgress: (progress) => post({ type: 'progress', progress }),
    });
    const blob = await out.finalize();
    post({ type: 'done', blob, bytes: blob?.size ?? 0, ms: performance.now() - t0 });
  } catch (e) {
    await out.cancel().catch(() => {});
    throw e;
  }
}

self.onmessage = (e: MessageEvent<ExportIn>) => {
  if (e.data.type === 'cancel') { flag.aborted = true; return; }
  flag.aborted = false;
  run(e.data.job, e.data.file).catch((err) => {
    if (err instanceof ExportCancelled) post({ type: 'cancelled' });
    else post({ type: 'error', code: 'ERR_EXPORT_FAILED', message: err instanceof Error ? err.message : String(err) });
  });
};
