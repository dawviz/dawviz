// Kiểm tra máy cho người thử (Spike 1, T-09): dò hỗ trợ codec và THỬ MÃ HOÁ THẬT vài khung/vài giây, vì `isConfigSupported` có thể
// báo được mà encoder vẫn lỗi (đã gặp với AAC 64 kbps trên một laptop). Báo cáo chỉ chứa thông tin trình duyệt/máy, không có tên tệp
// hay nội dung dự án. Chạy trong trình duyệt (cần WebCodecs); phần trình bày thuần ở `formatReport`.

export interface ProbeLine { name: string; supported: boolean | null; encode: 'ok' | 'fail' | 'skipped'; detail?: string; ms?: number }
export interface EnvInfo { userAgent: string; cores: number | null; memoryGb: number | null; fileSystemAccess: boolean; wakeLock: boolean; offscreenCanvas: boolean }

export function formatReport(env: EnvInfo, lines: ProbeLine[], appVersion: string): string {
  const row = (l: ProbeLine) => `- ${l.name}: ${l.supported === null ? 'n/a' : l.supported ? 'supported' : 'NOT supported'}; encode ${l.encode}${l.ms != null ? ` (${Math.round(l.ms)} ms)` : ''}${l.detail ? ` — ${l.detail}` : ''}`;
  return [
    `DAW Visualizer ${appVersion} — environment check`,
    `User agent: ${env.userAgent}`,
    `Cores: ${env.cores ?? 'n/a'}; memory (GB, approx): ${env.memoryGb ?? 'n/a'}`,
    `File System Access: ${env.fileSystemAccess}; Wake Lock: ${env.wakeLock}; OffscreenCanvas: ${env.offscreenCanvas}`,
    '',
    ...lines.map(row),
  ].join('\n');
}

async function tryVideo(codec: string, w: number, h: number): Promise<ProbeLine> {
  const name = `video ${codec} ${w}x${h}`;
  if (typeof VideoEncoder === 'undefined') return { name, supported: null, encode: 'skipped', detail: 'WebCodecs missing' };
  const cfg = { codec, width: w, height: h, framerate: 30, bitrate: 4_000_000 };
  let supported = false;
  try { supported = !!(await VideoEncoder.isConfigSupported(cfg)).supported; } catch (e) { return { name, supported: null, encode: 'fail', detail: String(e) }; }
  if (!supported) return { name, supported, encode: 'skipped' };
  const t0 = performance.now();
  try {
    let chunks = 0, err: unknown = null;
    const enc = new VideoEncoder({ output: () => { chunks++; }, error: (e) => { err = e; } });
    enc.configure(cfg);
    const c = new OffscreenCanvas(w, h); const g = c.getContext('2d')!;
    for (let i = 0; i < 30; i++) {
      g.fillStyle = `hsl(${i * 12},70%,50%)`; g.fillRect(0, 0, w, h);
      const f = new VideoFrame(c, { timestamp: Math.round(i * 1e6 / 30), duration: 33_333 });
      enc.encode(f, { keyFrame: i === 0 }); f.close();
    }
    await enc.flush(); enc.close();
    if (err) throw err;
    return { name, supported, encode: chunks > 0 ? 'ok' : 'fail', detail: chunks > 0 ? `${chunks} packets` : 'no output', ms: performance.now() - t0 };
  } catch (e) { return { name, supported, encode: 'fail', detail: String(e), ms: performance.now() - t0 }; }
}

async function tryAudio(codec: string, bitrate: number): Promise<ProbeLine> {
  const name = `audio ${codec} ${bitrate / 1000} kbps stereo 48 kHz`;
  if (typeof AudioEncoder === 'undefined') return { name, supported: null, encode: 'skipped', detail: 'WebCodecs missing' };
  const cfg = { codec, sampleRate: 48_000, numberOfChannels: 2, bitrate };
  let supported = false;
  try { supported = !!(await AudioEncoder.isConfigSupported(cfg)).supported; } catch (e) { return { name, supported: null, encode: 'fail', detail: String(e) }; }
  if (!supported) return { name, supported, encode: 'skipped' };
  const t0 = performance.now();
  try {
    let chunks = 0, err: unknown = null;
    const enc = new AudioEncoder({ output: () => { chunks++; }, error: (e) => { err = e; } });
    enc.configure(cfg);
    const n = 48_000, data = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) data[i] = Math.sin((2 * Math.PI * 440 * i) / 48_000) * 0.3;
    for (let i = 0; i < n; i++) data[n + i] = data[i];
    const a = new AudioData({ format: 'f32-planar', sampleRate: 48_000, numberOfFrames: n, numberOfChannels: 2, timestamp: 0, data });
    enc.encode(a); a.close();
    await enc.flush(); enc.close();
    if (err) throw err;
    return { name, supported, encode: chunks > 0 ? 'ok' : 'fail', detail: chunks > 0 ? `${chunks} packets` : 'no output', ms: performance.now() - t0 };
  } catch (e) { return { name, supported, encode: 'fail', detail: String(e), ms: performance.now() - t0 }; }
}

export async function runDiagnostics(appVersion: string): Promise<string> {
  const nav = navigator as Navigator & { deviceMemory?: number; wakeLock?: unknown };
  const env: EnvInfo = {
    userAgent: nav.userAgent, cores: nav.hardwareConcurrency ?? null, memoryGb: nav.deviceMemory ?? null,
    fileSystemAccess: 'showSaveFilePicker' in window, wakeLock: !!nav.wakeLock, offscreenCanvas: typeof OffscreenCanvas !== 'undefined',
  };
  const lines: ProbeLine[] = [];
  for (const [codec, w, h] of [['avc1.640028', 1920, 1080], ['avc1.64002a', 1920, 1080], ['vp09.00.10.08', 1920, 1080], ['vp8', 1280, 720]] as const) lines.push(await tryVideo(codec, w, h));
  for (const [codec, br] of [['mp4a.40.2', 64_000], ['mp4a.40.2', 128_000], ['opus', 128_000]] as const) lines.push(await tryAudio(codec, br));
  return formatReport(env, lines, appVersion);
}
