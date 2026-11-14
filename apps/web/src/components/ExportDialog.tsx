// Hộp thoại Xuất video (T-09, REQ-EXPORT-00/05/06). Chọn cỡ/FPS/chất lượng → tóm tắt pre-flight (kích thước thực, dung lượng,
// định dạng sẽ dùng, cảnh báo) → xuất trong Export Worker với tiến độ và nút Hủy. Phần tính toán ở lib/exportPlan.ts.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Derived, SceneDocument, UnifiedProjectAST } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import type { AudioAsset } from '../lib/audioAsset.ts';
import { startExport, type ExportHandle } from '../lib/exportClient.ts';
import { chooseCodec, exportDuration, preflight, sizeForClass, sliceAudioForRange, type CodecChoice, type CodecProbe, type Fps, type ProgressInfo, type Quality, type ResolutionClass, FPS_CHOICES } from '../lib/exportPlan.ts';
import { makeExportWorker } from '../lib/exportWorker.ts';
import { runDiagnostics } from '../lib/exportDiagnostics.ts';
import pkg from '../../package.json';
import { Select } from './Select.tsx';

const CLASSES: ResolutionClass[] = [720, 1080, 2160];
const CLASS_LABEL: Record<ResolutionClass, string> = { 720: '720p', 1080: '1080p', 2160: '4K' };
const QUALITIES: Quality[] = ['low', 'medium', 'high'];

/** Dò hỗ trợ thật của trình duyệt; không có WebCodecs thì mọi cấu hình đều "không hỗ trợ". */
export const browserProbe: CodecProbe = {
  video: async (c) => typeof VideoEncoder !== 'undefined' && !!(await VideoEncoder.isConfigSupported(c)).supported,
  audio: async (c) => typeof AudioEncoder !== 'undefined' && !!(await AudioEncoder.isConfigSupported(c)).supported,
};

type Phase = 'setup' | 'running' | 'done' | 'error';
interface SaveHandle { createWritable(): Promise<WritableStream<{ type: 'write'; data: Uint8Array; position: number }>> }
type SavePicker = (o: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<SaveHandle>;

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
const baseOf = (n: string) => (n.replace(/\.[^.]+$/, '') || 'dawviz').replace(/[\\/:*?"<>|]+/g, '_');

export function ExportDialog({ scene, ast, derived, audio, offsetMs, projectSec, fileName, onClose }: {
  scene: SceneDocument; ast: UnifiedProjectAST; derived: Derived; audio: AudioAsset | null; offsetMs: number; projectSec: number; fileName: string; onClose(): void;
}) {
  const { i18n } = useI18n();
  const [cls, setCls] = useState<ResolutionClass>(1080);
  const [fps, setFps] = useState<Fps>(30);
  const [quality, setQuality] = useState<Quality>('medium');
  const [phase, setPhase] = useState<Phase>('setup');
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [choice, setChoice] = useState<CodecChoice | null | 'checking'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string | null; name: string; bytes: number; ms: number } | null>(null);
  const handle = useRef<ExportHandle | null>(null);
  const lock = useRef<{ release(): Promise<void> } | null>(null);
  const startBtn = useRef<HTMLButtonElement>(null);
  const [report, setReport] = useState<string | 'running' | null>(null);
  const [copied, setCopied] = useState(false);

  const size = useMemo(() => sizeForClass(scene.canvas.designWidth, scene.canvas.designHeight, cls), [scene, cls]);
  const range = useMemo(() => exportDuration({ projectSec, audioSec: audio ? Math.max(0, offsetMs / 1000 + audio.durationSec) : 0 }), [projectSec, audio, offsetMs]);
  const hasFsa = typeof window !== 'undefined' && 'showSaveFilePicker' in window;
  const pre = useMemo(() => preflight({ width: size.width, height: size.height, fps, quality, duration: range.duration, hasAudio: !!audio, hasFileSystemAccess: hasFsa }), [size, fps, quality, range, audio, hasFsa]);

  useEffect(() => {
    let live = true;
    setChoice('checking');
    chooseCodec(browserProbe, { width: size.width, height: size.height, fps, bitrate: pre.bitrate, hasAudio: !!audio, sampleRate: audio?.buffer.sampleRate, channels: audio?.buffer.numberOfChannels })
      .then((c) => live && setChoice(c), () => live && setChoice(null));
    return () => { live = false; };
  }, [size, fps, pre.bitrate, audio]);

  useEffect(() => { startBtn.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && phase !== 'running') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, onClose]);
  // Dừng Worker và nhả khoá màn hình nếu đóng hộp thoại giữa chừng; thu hồi URL tải về.
  useEffect(() => () => { handle.current?.cancel(); void lock.current?.release(); }, []);
  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  const QUALITY_LABEL: Record<Quality, string> = { low: i18n.t('web.export.quality.low'), medium: i18n.t('web.export.quality.medium'), high: i18n.t('web.export.quality.high') };
  const notes: string[] = [];
  const NOTE: Record<string, string> = {
    ROUNDED_EVEN: i18n.t('web.export.note.ROUNDED_EVEN'), SCALED_DOWN: i18n.t('web.export.note.SCALED_DOWN'),
    NO_AAC_VIDEO_ONLY: i18n.t('web.export.note.NO_AAC_VIDEO_ONLY'), WEBM_NO_H264: i18n.t('web.export.note.WEBM_NO_H264'), WEBM_NO_AUDIO: i18n.t('web.export.note.WEBM_NO_AUDIO'),
    LARGE_IN_MEMORY: i18n.t('web.export.note.LARGE_IN_MEMORY'),
  };
  for (const n of size.notes) notes.push(NOTE[n]);
  if (choice && choice !== 'checking') for (const n of choice.notices) notes.push(NOTE[n]);
  for (const w of pre.warnings) notes.push(NOTE[w]);

  const format = choice && choice !== 'checking'
    ? (choice.container === 'mp4' ? `MP4 · H.264${choice.audioCodec ? ' + AAC' : ''}` : `WebM · ${choice.videoCodec.startsWith('vp09') ? 'VP9' : 'VP8'}${choice.audioCodec ? ' + Opus' : ''}`)
    : null;

  const start = async () => {
    if (!choice || choice === 'checking') return;
    setError(null);
    const ext = choice.container;
    const suggestedName = `${baseOf(fileName)}.${ext}`;
    let file: Awaited<ReturnType<SaveHandle['createWritable']>> | undefined;
    if (hasFsa) {
      try {
        const h = await (window as unknown as { showSaveFilePicker: SavePicker }).showSaveFilePicker({ suggestedName, types: [{ description: ext.toUpperCase(), accept: { [ext === 'mp4' ? 'video/mp4' : 'video/webm']: [`.${ext}`] } }] });
        file = await h.createWritable();
      } catch (e) { if ((e as DOMException)?.name === 'AbortError') return; file = undefined; }
    }
    const slice = audio && choice.audioCodec
      ? sliceAudioForRange(Array.from({ length: audio.buffer.numberOfChannels }, (_, c) => audio.buffer.getChannelData(c)), audio.buffer.sampleRate, range.start, range.duration, offsetMs)
      : null;
    setPhase('running'); setProgress(null);
    try { lock.current = await (navigator as unknown as { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { lock.current = null; }
    const h = startExport({
      ast, scene, brightness: derived.brightness, width: size.width, height: size.height, fps, bitrate: pre.bitrate, choice,
      start: range.start, duration: range.duration,
      audio: slice ? { channels: slice.channels, sampleRate: audio!.buffer.sampleRate, offsetMs: slice.offsetMs } : undefined,
    }, makeExportWorker, { file, onProgress: setProgress });
    handle.current = h;
    try {
      const r = await h.result;
      if (r.status === 'cancelled') { setPhase('setup'); return; }
      setResult({ url: r.blob ? URL.createObjectURL(r.blob) : null, name: suggestedName, bytes: r.bytes, ms: r.ms });
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e)); setPhase('error');
    } finally { handle.current = null; void lock.current?.release(); lock.current = null; }
  };

  const mb = (b: number) => i18n.number(b / 1e6, { maximumFractionDigits: 1 });
  const unsupported = choice === null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" data-testid="export-dialog">
      <div role="dialog" aria-modal="true" aria-labelledby="export-title" className="w-full max-w-md space-y-4 rounded border border-line bg-surface p-5 text-fg">
        <h2 id="export-title" className="text-[16px] font-semibold">{i18n.t('web.export.title')}</h2>

        {phase !== 'running' && phase !== 'done' && (
          <div className="space-y-3">
            <div className="grid grid-cols-[7rem_1fr] items-center gap-2 text-[13px]">
              <label htmlFor="exp-size" className="text-muted">{i18n.t('web.export.size')}</label>
              <Select id="exp-size" value={cls} onChange={(e) => setCls(Number(e.target.value) as ResolutionClass)}>{CLASSES.map((c) => <option key={c} value={c}>{CLASS_LABEL[c]}</option>)}</Select>
              <label htmlFor="exp-fps" className="text-muted">{i18n.t('web.export.fps')}</label>
              <Select id="exp-fps" value={fps} onChange={(e) => setFps(Number(e.target.value) as Fps)}>{FPS_CHOICES.map((f) => <option key={f} value={f}>{f}</option>)}</Select>
              <label htmlFor="exp-q" className="text-muted">{i18n.t('web.export.quality')}</label>
              <Select id="exp-q" value={quality} onChange={(e) => setQuality(e.target.value as Quality)}>
                {QUALITIES.map((q) => <option key={q} value={q}>{QUALITY_LABEL[q]}</option>)}
              </Select>
            </div>
            <p className="text-[13px] tabular-nums text-muted" data-testid="export-summary">
              {i18n.t('web.export.summary', { width: String(size.width), height: String(size.height), fps: String(fps), duration: mmss(range.duration), frames: i18n.number(pre.frames), size: mb(pre.bytes) })}
            </p>
            <p className="text-[13px]" aria-live="polite">
              {choice === 'checking' ? i18n.t('web.export.checking') : unsupported ? '' : i18n.t('web.export.format', { format: format ?? '' })}
            </p>
            {unsupported && <p role="alert" className="text-[13px] text-danger">{i18n.t('errors.ERR_NO_SUPPORTED_ENCODER')}</p>}
            {notes.length > 0 && <ul className="space-y-1 text-[13px] text-warning">{notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
            <div className="space-y-2">
              <button type="button" className="btn-ghost border border-control" disabled={report === 'running'} data-testid="export-diagnose"
                onClick={() => { setReport('running'); setCopied(false); runDiagnostics(pkg.version).then(setReport, (e) => setReport(`Diagnostics failed: ${e}`)); }}>
                {report === 'running' ? i18n.t('web.export.diagnose.running') : i18n.t('web.export.diagnose')}
              </button>
              {report && report !== 'running' && (
                <div className="space-y-1.5">
                  <textarea readOnly rows={7} value={report} aria-label={i18n.t('web.export.diagnose.report')} data-testid="export-report" className="field w-full font-mono text-[12px]" />
                  <div className="flex items-center gap-2">
                    <button type="button" className="btn-ghost border border-control" onClick={() => { void navigator.clipboard?.writeText(report).then(() => setCopied(true), () => {}); }}>{copied ? i18n.t('web.export.diagnose.copied') : i18n.t('web.export.diagnose.copy')}</button>
                    <a className="text-[13px] text-accent underline" href="https://github.com/dawviz/dawviz/issues/new?template=test-result.yml" target="_blank" rel="noopener noreferrer">{i18n.t('web.export.diagnose.send')}</a>
                  </div>
                </div>
              )}
            </div>
            {phase === 'error' && <p role="alert" className="text-[13px] text-danger">{i18n.t('errors.ERR_EXPORT_FAILED')}{error ? ` (${error})` : ''}</p>}
          </div>
        )}

        {phase === 'running' && (
          <div className="space-y-2" aria-live="polite">
            <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((progress?.fraction ?? 0) * 100)} aria-label={i18n.t('web.export.running')} className="h-2 w-full overflow-hidden rounded bg-raised">
              <div className="h-full bg-accent" style={{ width: `${(progress?.fraction ?? 0) * 100}%` }} />
            </div>
            <p className="text-[13px] tabular-nums text-muted">
              {progress ? i18n.t('web.export.frame', { frame: i18n.number(progress.frame), total: i18n.number(progress.total) }) : i18n.t('web.export.running')}
              {progress?.speed != null && ` · ${i18n.t('web.export.speed', { speed: i18n.number(progress.speed, { maximumFractionDigits: 1 }) })}`}
              {progress?.etrSec != null && ` · ${i18n.t('web.export.etr', { time: mmss(progress.etrSec) })}`}
            </p>
          </div>
        )}

        {phase === 'done' && result && (
          <div className="space-y-2 text-[13px]" aria-live="polite">
            <p>{i18n.t('web.export.done', { name: result.name, size: mb(result.bytes), seconds: i18n.number(result.ms / 1000, { maximumFractionDigits: 1 }) })}</p>
            {result.url
              ? <a className="inline-block rounded border border-accent px-3 py-1.5 font-medium text-accent" href={result.url} download={result.name} data-testid="export-download">{i18n.t('web.export.download')}</a>
              : <p className="text-muted">{i18n.t('web.export.saved')}</p>}
          </div>
        )}

        <div className="flex justify-end gap-2">
          {phase === 'running'
            ? <button type="button" className="btn-ghost border border-control" onClick={() => handle.current?.cancel()} data-testid="export-cancel">{i18n.t('web.export.cancel')}</button>
            : <>
                <button type="button" className="btn-ghost border border-control" onClick={onClose} data-testid="export-close">{i18n.t('web.export.close')}</button>
                {phase !== 'done' && <button ref={startBtn} type="button" disabled={choice === 'checking' || unsupported} onClick={() => void start()}
                  className="rounded border border-accent px-3 py-1.5 text-[13px] font-medium text-accent disabled:cursor-not-allowed disabled:opacity-50" data-testid="export-start">{i18n.t('web.export.start')}</button>}
              </>}
        </div>
      </div>
    </div>
  );
}
