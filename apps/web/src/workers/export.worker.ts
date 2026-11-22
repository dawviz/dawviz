// Export Worker (T-09, REQ-EXPORT-07): dựng derived từ ast + scene, vẽ từng khung bằng renderFrame lên OffscreenCanvas,
// mã hoá qua Mediabunny. Huỷ: đặt cờ, vòng xuất dừng ở khung kế và đóng đích ghi (không để lại tệp dở).
import { buildIndex, buildSceneHud, charsOfScene, ensureFonts, needsFonts, renderFrame, requiredFonts, type Derived, type FontFaceSpec, type RenderCtx } from '@dawviz/render-core';
import { ExportCancelled, runExport } from '../lib/exportEngine.ts';
import { createExportOutput } from '../lib/exportOutput.ts';
import type { ExportIn, ExportJob, ExportOut } from '../lib/exportProtocol.ts';
import { createStats, type ExportStats } from '../lib/exportStats.ts';
import { dirSink, pngName, wavBytes, zipSink, type DirTarget } from '../lib/pngSequence.ts';
import { frameCount } from '../lib/exportPlan.ts';

const REPORT_EVERY_MS = 250; // gói số liệu cho giao diện ~4 lần/giây, không phải mỗi khung
const THUMB_EVERY_MS = 500, THUMB_WIDTH = 240;

const post = (m: ExportOut, transfer: Transferable[] = []) => (self as unknown as Worker).postMessage(m, transfer);
const flag = { aborted: false };

const loadFont = async (spec: FontFaceSpec) => {
  const face = new FontFace(spec.family, `url(${import.meta.env.BASE_URL}fonts/${spec.file})`, { weight: String(spec.weight), unicodeRange: spec.unicodeRange });
  await face.load();
  (self as unknown as { fonts: FontFaceSet }).fonts.add(face);
};

/**
 * Chuỗi PNG (T-55): cùng vòng khung với video (runExport), nhưng mỗi khung thành một tệp PNG có kênh trong suốt, ghi vào thư mục người dùng chọn
 * hoặc gói `.zip`. Âm thanh (nếu chọn) ghi thành một tệp `.wav` cùng khoảng xuất.
 */
async function runPng(job: ExportJob, dir: DirTarget | undefined, c: { scene: ExportJob['scene']; ast: ExportJob['ast']; derived: Derived; canvas: OffscreenCanvas; ctx: OffscreenCanvasRenderingContext2D; scale: number; faces: number; t0: number }) {
  const png = job.png!, { width, height } = job, total = frameCount(job.duration, job.fps);
  const sink = dir ? dirSink(dir) : zipSink(), stats = createStats();
  const opts = { transparent: png.transparent, ...(png.layers ? { layers: new Set(png.layers) } : {}) };
  let k = 0, last: ExportStats | null = null;
  const base = { fontFaces: c.faces, container: 'png', videoCodec: 'png', audioCodec: png.wav && job.audio ? 'wav' : null } as unknown as Pick<ExportStats, 'fontFaces' | 'container' | 'videoCodec' | 'audioCodec'>;
  try {
    await runExport({
      fps: job.fps, start: job.start, duration: job.duration, signal: flag,
      draw: (t, i) => { k = i; const a = performance.now(); renderFrame(c.scene, c.derived, c.ast, t, { ctx: c.ctx as unknown as RenderCtx, width, height }, c.scale, undefined, opts); stats.addDraw(performance.now() - a); },
      video: { add: async () => { const a = performance.now(); const blob = await c.canvas.convertToBlob({ type: 'image/png' }); await sink.write(pngName(png.base, k, total), new Uint8Array(await blob.arrayBuffer())); stats.addEncode(performance.now() - a); } },
      progressEveryMs: REPORT_EVERY_MS,
      onProgress: (progress) => { last = { ...stats.snapshot(progress.frame), ...base }; post({ type: 'progress', progress, stats: last }); },
    });
    if (png.wav && job.audio) await sink.write(`${png.base}.wav`, wavBytes(job.audio.channels, job.audio.sampleRate));
    const blob = await sink.finish(), ms = performance.now() - c.t0, bytes = blob?.size ?? sink.bytes();
    post({ type: 'done', blob, bytes, ms, report: { stats: last ?? { ...stats.snapshot(total), ...base }, series: stats.series(), frames: total, fps: job.fps, width, height, totalMs: ms, bytes, style: job.style } });
  } catch (e) { await sink.cancel().catch(() => {}); throw e; }
}

async function run(job: ExportJob, file: Extract<ExportIn, { type: 'start' }>['file'], dir?: DirTarget) {
  const t0 = performance.now();
  const { scene, ast, width, height } = job;
  // Phông phải sẵn sàng trước khung đầu (TECHNICAL-DESIGN 5.7); thiếu thì lỗi, không xuất khung chữ bằng phông dự phòng.
  // Chỉ nạp dải ký tự thật sự dùng: Firefox chậm dần theo số mặt phông trong Worker (docs/design/FIREFOX-FONT-SLOWDOWN.md).
  const faces = needsFonts(scene) ? requiredFonts(scene, charsOfScene(scene, ast)) : [];
  if (needsFonts(scene)) await ensureFonts(faces, loadFont);
  const index = buildIndex(ast.tracks, ast.meta.totalDurationSeconds);
  const derived: Derived = { index, brightness: job.brightness, hud: buildSceneHud(scene, ast, index), fontsReady: true, ...(job.spectrum ? { audio: job.spectrum } : {}), ...(job.background ? { background: job.background } : {}), ...(job.notation?.length ? { notation: new Map(job.notation) } : {}) };

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');
  const scale = width / scene.canvas.designWidth;
  if (job.png) return runPng(job, dir, { scene, ast, derived, canvas, ctx, scale, faces: faces.length, t0 });
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
  run(e.data.job, e.data.file, e.data.dir).catch((err) => {
    if (err instanceof ExportCancelled) post({ type: 'cancelled' });
    else post({ type: 'error', code: 'ERR_EXPORT_FAILED', message: err instanceof Error ? err.message : String(err) });
  });
};
