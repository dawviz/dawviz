// Export Worker (T-09, REQ-EXPORT-07): dựng derived từ ast + scene, vẽ từng khung bằng renderFrame lên OffscreenCanvas,
// mã hoá qua Mediabunny. Huỷ: đặt cờ, vòng xuất dừng ở khung kế và đóng đích ghi (không để lại tệp dở).
import { buildIndex, buildSceneHud, charsOfScene, ensureFonts, needsFonts, renderFrame, requiredFonts, type Derived, type FontFaceSpec, type RenderCtx } from '@dawviz/render-core';
import { ExportCancelled, runExport } from '../lib/exportEngine.ts';
import { createExportOutput } from '../lib/exportOutput.ts';
import type { ExportIn, ExportJob, ExportOut } from '../lib/exportProtocol.ts';
import { createStats, type ExportStats } from '../lib/exportStats.ts';

const REPORT_EVERY_MS = 250; // gói số liệu cho giao diện ~4 lần/giây, không phải mỗi khung
const THUMB_EVERY_MS = 500, THUMB_WIDTH = 240;

const post = (m: ExportOut, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(m, transfer);
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
  // Chỉ nạp dải ký tự thật sự dùng: Firefox chậm dần theo số mặt phông trong Worker (docs/design/FIREFOX-FONT-SLOWDOWN.md).
  const faces = needsFonts(scene) ? requiredFonts(scene, charsOfScene(scene, ast)) : [];
  if (needsFonts(scene)) await ensureFonts(faces, loadFont);
  const index = buildIndex(ast.tracks, ast.meta.totalDurationSeconds);
  const derived: Derived = { index, brightness: job.brightness, hud: buildSceneHud(scene, ast, index), fontsReady: true };

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  const scale = width / scene.canvas.designWidth;
  const stream = file ? await file.createWritable() : undefined; // tạo ở đây (không ở luồng chính): luồng ghi không chuyển qua Worker được
  const out = createExportOutput({
    choice: job.choice, canvas, fps: job.fps, bitrate: job.bitrate, file: stream,
    audio: job.audio && job.choice.audioCodec ? { sampleRate: job.audio.sampleRate, channels: job.audio.channels.length, bitrate: 128_000 } : undefined,
  });
  const stats = createStats();
  let last: ExportStats | null = null, lastThumb = -Infinity;
  const base = { fontFaces: faces.length, container: job.choice.container, videoCodec: job.choice.videoCodec, audioCodec: job.choice.audioCodec };
  const statsNow = (frame: number): ExportStats => { const sn = stats.snapshot(frame); return (last = { ...sn, ...base }); };
  const timedVideo = { add: async (ts: number, dur: number, o: { keyFrame: boolean }) => { const t = performance.now(); await out.video.add(ts, dur, o); stats.addEncode(performance.now() - t); } };
  try {
    await out.start();
    await runExport({
      fps: job.fps, start: job.start, duration: job.duration, signal: flag, video: timedVideo,
      audio: out.audio && job.audio ? { sink: out.audio, input: job.audio } : undefined,
      draw: (t) => { const t0 = performance.now(); renderFrame(scene, derived, ast, t, { ctx: ctx as unknown as RenderCtx, width, height }, scale); stats.addDraw(performance.now() - t0); },
      progressEveryMs: REPORT_EVERY_MS,
      onProgress: (progress) => {
        const st = statsNow(progress.frame), now = performance.now();
        if (now - lastThumb < THUMB_EVERY_MS) { post({ type: 'progress', progress, stats: st }); return; }
        lastThumb = now;
        // Ảnh thu nhỏ chụp ngay lúc gọi (đồng bộ), nên đúng khung vừa mã hoá dù khung kế sắp vẽ đè lên canvas.
        createImageBitmap(canvas, { resizeWidth: THUMB_WIDTH, resizeHeight: Math.max(1, Math.round((THUMB_WIDTH * height) / width)), resizeQuality: 'low' })
          .then((thumb) => post({ type: 'progress', progress, stats: st, thumb }, [thumb]), () => post({ type: 'progress', progress, stats: st }));
      },
    });
    const blob = await out.finalize();
    const totalMs = performance.now() - t0, frames = Math.round(job.duration * job.fps), bytes = blob?.size ?? out.bytes();
    const finalStats: ExportStats = last ?? { ...stats.snapshot(frames), ...base };
    post({ type: 'done', blob, bytes, ms: totalMs, report: { stats: finalStats, series: stats.series(), frames, fps: job.fps, width, height, totalMs, bytes, style: job.style } });
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
