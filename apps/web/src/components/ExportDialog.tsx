// Hộp thoại Xuất video (T-09, REQ-EXPORT-00/05/06). Chọn cỡ/FPS/chất lượng → tóm tắt pre-flight (kích thước thực, dung lượng,
// định dạng sẽ dùng, cảnh báo) → xuất trong Export Worker với tiến độ và nút Hủy. Phần tính toán ở lib/exportPlan.ts.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Derived, SceneDocument, UnifiedProjectAST } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import type { AudioAsset } from '../lib/audioAsset.ts';
import { startExport, type ExportHandle } from '../lib/exportClient.ts';
import type { FileTarget } from '../lib/exportProtocol.ts';
import { AUDIO_LABEL, CONTAINER_EXT, CONTAINER_LABEL, CONTAINER_MIME, FPS_CHOICES, VIDEO_LABEL, autoChoice, detectSupport, exportDuration, manualChoice, normalizeSelection, optionsFor, preflight, sizeForClass, sliceAudioForRange, usableContainers, type AudioId, type CodecChoice, type CodecProbe, type ContainerId, type Fps, type ProgressInfo, type Quality, type ResolutionClass, type Selection, type Support, type VideoId } from '../lib/exportPlan.ts';
import { downsample, formatExportReport, type ExportReport, type ExportStats } from '../lib/exportStats.ts';
import { isExportBusy, tryExportLock, type ExportLock } from '../lib/exportLock.ts';
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
type SaveHandle = FileTarget;
type SavePicker = (o: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<SaveHandle>;

const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
const baseOf = (n: string) => (n.replace(/\.[^.]+$/, '') || 'dawviz').replace(/[\\/:*?"<>|]+/g, '_');

export function ExportDialog({ scene, ast, derived, audio, offsetMs, projectSec, fileName, advanced = false, styleId, styleName, onClose }: {
  styleId?: string; styleName?: string; scene: SceneDocument; ast: UnifiedProjectAST; derived: Derived; audio: AudioAsset | null; offsetMs: number; projectSec: number; fileName: string; advanced?: boolean; onClose(): void;
}) {
  const { i18n } = useI18n();
  const [cls, setCls] = useState<ResolutionClass>(1080);
  const [fps, setFps] = useState<Fps>(30);
  const [quality, setQuality] = useState<Quality>('medium');
  const [phase, setPhase] = useState<Phase>('setup');
  const [progress, setProgress] = useState<ProgressInfo | null>(null);
  const [support, setSupport] = useState<Support | 'checking'>('checking');
  const [sel, setSel] = useState<Selection>({ container: 'mp4', video: 'avc', audio: 'aac' });
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<ExportStats | null>(null);
  const [finalReport, setFinalReport] = useState<ExportReport | null>(null);
  const [copiedRun, setCopiedRun] = useState(false);
  const thumbCanvas = useRef<HTMLCanvasElement>(null);
  const points = useRef<Array<[number, number]>>([]);
  const startedAt = useRef(0);
  const lastProgress = useRef<ProgressInfo | null>(null);
  const exportLock = useRef<ExportLock | null>(null);
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
    setSupport('checking');
    detectSupport(browserProbe, { width: size.width, height: size.height, fps, bitrate: pre.bitrate, sampleRate: audio?.buffer.sampleRate, channels: audio?.buffer.numberOfChannels })
      .then((x) => live && setSupport(x), () => live && setSupport({ video: {}, audio: new Set() }));
    return () => { live = false; };
  }, [size, fps, pre.bitrate, audio]);
  // Cơ bản: tự chọn theo thứ tự ưu tiên. Nâng cao: ba ô phụ thuộc nhau; lựa chọn luôn được đưa về trạng thái hợp lệ với định dạng đang chọn.
  const effSel = useMemo(() => (support === 'checking' ? null : normalizeSelection(sel, support, !!audio)), [support, sel, audio]);
  const choice: CodecChoice | null | 'checking' = useMemo(() => {
    if (support === 'checking') return 'checking';
    return advanced ? manualChoice(support, sel, !!audio) : autoChoice(support, !!audio);
  }, [support, sel, advanced, audio]);
  // Báo sớm khi tab khác đang xuất (kiểm lại mỗi 2 giây khi đang ở màn cấu hình).
  useEffect(() => {
    if (phase === 'running' || phase === 'done') return;
    let live = true;
    const tick = () => { void isExportBusy().then((b) => { if (live) setBusy(b); }); };
    tick();
    const id = window.setInterval(tick, 2000);
    return () => { live = false; window.clearInterval(id); };
  }, [phase]);

  useEffect(() => { startBtn.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && phase !== 'running') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, onClose]);
  // Dừng Worker và nhả khoá màn hình nếu đóng hộp thoại giữa chừng; thu hồi URL tải về.
  useEffect(() => () => { handle.current?.cancel(); void lock.current?.release(); exportLock.current?.release(); }, []);
  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url); }, [result]);

  const QUALITY_LABEL: Record<Quality, string> = { low: i18n.t('web.export.quality.low'), medium: i18n.t('web.export.quality.medium'), high: i18n.t('web.export.quality.high') };
  const notes: string[] = [];
  const NOTE: Record<string, string> = {
    ROUNDED_EVEN: i18n.t('web.export.note.ROUNDED_EVEN'), SCALED_DOWN: i18n.t('web.export.note.SCALED_DOWN'),
    NO_AUDIO_ENCODER: i18n.t('web.export.note.NO_AUDIO_ENCODER'), WEBM_NO_H264: i18n.t('web.export.note.WEBM_NO_H264'),
    AUDIO_FALLBACK: choice && choice !== 'checking' && choice.audioCodec ? i18n.t('web.export.note.AUDIO_FALLBACK', { codec: AUDIO_LABEL[choice.audioCodec] }) : '',
    LARGE_IN_MEMORY: i18n.t('web.export.note.LARGE_IN_MEMORY'), SAVE_AFTER: i18n.t('web.export.note.SAVE_AFTER'),
  };
  for (const n of size.notes) notes.push(NOTE[n]);
  if (choice && choice !== 'checking') for (const n of choice.notices) notes.push(NOTE[n]);
  for (const w of pre.warnings) notes.push(NOTE[w]);
  if (!hasFsa) notes.push(NOTE.SAVE_AFTER);

  const format = choice && choice !== 'checking'
    ? `${CONTAINER_LABEL[choice.container]} · ${VIDEO_LABEL[choice.video]}${choice.audioCodec ? ` + ${AUDIO_LABEL[choice.audioCodec]}` : ''}`
    : null;

  const start = async () => {
    if (!choice || choice === 'checking') return;
    setError(null);
    // Một tab xuất mỗi lần: lấy khoá trước khi hỏi nơi lưu để không bắt người dùng chọn tệp rồi mới báo bận.
    const got = await tryExportLock();
    if (!got) { setBusy(true); return; }
    exportLock.current = got;
    const freeLock = () => { exportLock.current?.release(); exportLock.current = null; };
    const ext = CONTAINER_EXT[choice.container];
    const suggestedName = `${baseOf(fileName)}.${ext}`;
    let file: SaveHandle | undefined;
    if (hasFsa) {
      try {
        file = await (window as unknown as { showSaveFilePicker: SavePicker }).showSaveFilePicker({ suggestedName, types: [{ description: ext.toUpperCase(), accept: { [CONTAINER_MIME[choice.container]]: [`.${ext}`] } }] });
      } catch (e) { if ((e as DOMException)?.name === 'AbortError') { freeLock(); return; } file = undefined; }
    }
    const slice = audio && choice.audioCodec
      ? sliceAudioForRange(Array.from({ length: audio.buffer.numberOfChannels }, (_, c) => audio.buffer.getChannelData(c)), audio.buffer.sampleRate, range.start, range.duration, offsetMs)
      : null;
    setPhase('running'); setProgress(null); setStats(null); setFinalReport(null); setCopiedRun(false); points.current = []; startedAt.current = performance.now(); lastProgress.current = null;
    try { lock.current = await (navigator as unknown as { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { lock.current = null; }
    // Ảnh nền: bản sao riêng cho Worker (bản của Xem trước vẫn dùng tiếp, vì chuyển quyền sở hữu sẽ làm nó rỗng).
    let background: NonNullable<typeof derived.background> | undefined;
    try { if (derived.background) background = { image: await createImageBitmap(derived.background.image as ImageBitmap), width: derived.background.width, height: derived.background.height }; } catch { background = undefined; }
    let h: ExportHandle;
    try { h = startExport({
      ast, scene, brightness: derived.brightness, spectrum: derived.audio, background, width: size.width, height: size.height, fps, bitrate: pre.bitrate, choice,
      start: range.start, duration: range.duration, style: styleId,
      audio: slice ? { channels: slice.channels, sampleRate: audio!.buffer.sampleRate, offsetMs: slice.offsetMs } : undefined,
    }, makeExportWorker, {
      file,
      onProgress: (p, st, thumb) => {
        setProgress(p); lastProgress.current = p;
        if (st) { setStats(st); points.current.push([p.frame, st.drawMs]); }
        if (thumb) { const c = thumbCanvas.current; if (c) { c.width = thumb.width; c.height = thumb.height; c.getContext('2d')?.drawImage(thumb, 0, 0); } thumb.close(); }
      },
    });
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); setPhase('error'); void lock.current?.release(); lock.current = null; freeLock(); return; }
    handle.current = h;
    try {
      const r = await h.result;
      if (r.status === 'cancelled') { setPhase('setup'); return; }
      setResult({ url: r.blob ? URL.createObjectURL(r.blob) : null, name: suggestedName, bytes: r.bytes, ms: r.ms });
      setFinalReport(r.report ?? null);
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e)); setPhase('error');
    } finally { handle.current = null; void lock.current?.release(); lock.current = null; freeLock(); }
  };

  /** Báo cáo chẩn đoán lần xuất: cuối lần xuất lấy từ Worker; giữa chừng dựng tạm từ số liệu mới nhất. */
  const exportReportText = (): string | null => {
    const env = { userAgent: navigator.userAgent, cores: navigator.hardwareConcurrency ?? null, appVersion: pkg.version };
    if (finalReport) return formatExportReport(finalReport, env);
    const p = lastProgress.current;
    if (!stats || !p) return null;
    return formatExportReport({ stats, series: downsample(points.current), frames: p.frame, fps, width: size.width, height: size.height, totalMs: performance.now() - startedAt.current, bytes: 0, style: styleId }, env);
  };
  const copyExportReport = () => { const t = exportReportText(); if (t) void navigator.clipboard?.writeText(t).then(() => setCopiedRun(true), () => {}); };
  const pill = [styleName, `${size.width}×${size.height}`, `${fps} fps`, format].filter(Boolean).join(' · ');

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
            {advanced && support !== 'checking' && effSel && (
              <div className="grid grid-cols-[7rem_1fr] items-center gap-2 text-[13px]" data-testid="export-format-pickers">
                <label htmlFor="exp-container" className="text-muted">{i18n.t('web.export.container')}</label>
                <Select id="exp-container" value={effSel.container} onChange={(e) => setSel({ ...effSel, container: e.target.value as ContainerId })}>
                  {usableContainers(support).map((c) => <option key={c} value={c}>{CONTAINER_LABEL[c]}</option>)}
                </Select>
                <label htmlFor="exp-vcodec" className="text-muted">{i18n.t('web.export.videoCodec')}</label>
                <Select id="exp-vcodec" value={effSel.video} onChange={(e) => setSel({ ...effSel, video: e.target.value as VideoId })}>
                  {optionsFor(effSel.container, support).videos.map((v) => <option key={v} value={v}>{VIDEO_LABEL[v]}</option>)}
                </Select>
                <label htmlFor="exp-acodec" className="text-muted">{i18n.t('web.export.audioCodec')}</label>
                <Select id="exp-acodec" value={effSel.audio} disabled={!audio} onChange={(e) => setSel({ ...effSel, audio: e.target.value as AudioId | 'none' })}>
                  {audio ? optionsFor(effSel.container, support).audios.map((a) => <option key={a} value={a}>{AUDIO_LABEL[a]}</option>) : null}
                  <option value="none">{i18n.t('web.export.audioNone')}</option>
                </Select>
              </div>
            )}
            <p className="text-[13px] tabular-nums text-muted" data-testid="export-summary">
              {i18n.t('web.export.summary', { width: String(size.width), height: String(size.height), fps: String(fps), duration: mmss(range.duration), frames: i18n.number(pre.frames), size: mb(pre.bytes) })}
            </p>
            <p className="text-[13px]" aria-live="polite">
              {choice === 'checking' ? i18n.t('web.export.checking') : unsupported ? '' : i18n.t('web.export.format', { format: format ?? '' })}
            </p>
            {busy && <p role="alert" className="text-[13px] text-warning" data-testid="export-busy">{i18n.t('web.export.busy')}</p>}
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
          <div className="space-y-3">
            <div className="relative overflow-hidden rounded border border-line bg-raised">
              <canvas ref={thumbCanvas} className="block h-auto w-full" aria-label={i18n.t('web.export.preview')} role="img" data-testid="export-thumb" />
              <span className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-12px)] truncate rounded-full bg-black/65 px-2 py-0.5 text-[11px] text-white" data-testid="export-pill">{pill}</span>
            </div>
            <div className="space-y-2" aria-live="polite">
              <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((progress?.fraction ?? 0) * 100)} aria-label={i18n.t('web.export.running')} className="h-2 w-full overflow-hidden rounded bg-raised">
                <div className="h-full bg-accent" style={{ width: `${(progress?.fraction ?? 0) * 100}%` }} />
              </div>
              <p className="text-[13px] tabular-nums text-muted">
                {progress ? `${Math.round(progress.fraction * 100)}% · ${i18n.t('web.export.frame', { frame: i18n.number(progress.frame), total: i18n.number(progress.total) })}` : i18n.t('web.export.running')}
                {progress?.etrSec != null && ` · ${i18n.t('web.export.etr', { time: mmss(progress.etrSec) })}`}
              </p>
            </div>
            <details className="text-[13px]" data-testid="export-details">
              <summary className="disclosure cursor-pointer text-muted">{i18n.t('web.export.details')}</summary>
              <dl className="mt-2 grid grid-cols-[6.5rem_1fr] gap-x-2 gap-y-1 font-mono text-[12px] tabular-nums">
                <dt className="text-muted">{i18n.t('web.export.stat.speed')}</dt>
                <dd>{progress?.fps != null ? i18n.t('web.export.stat.speedValue', { fps: i18n.number(progress.fps, { maximumFractionDigits: 1 }), speed: i18n.number(progress.speed ?? 0, { maximumFractionDigits: 2 }) }) : '—'}</dd>
                <dt className="text-muted">{i18n.t('web.export.stat.time')}</dt>
                <dd className={stats?.slowing ? 'text-warning' : ''}>{stats ? i18n.t('web.export.stat.timeValue', { draw: i18n.number(stats.drawMs, { maximumFractionDigits: 1 }), encode: i18n.number(stats.encodeMs, { maximumFractionDigits: 1 }) }) : '—'}</dd>
                <dt className="text-muted">{i18n.t('web.export.stat.resources')}</dt>
                <dd>{stats ? i18n.t('web.export.stat.fonts', { n: String(stats.fontFaces) }) : '—'}</dd>
                <dt className="text-muted">{i18n.t('web.export.stat.codec')}</dt>
                <dd className="break-all">{stats ? `${stats.container} · ${stats.videoCodec} · ${stats.audioCodec ?? i18n.t('web.export.audioNone')}` : '—'}</dd>
              </dl>
              {stats?.slowing && <p role="status" className="mt-2 text-warning" data-testid="export-slowing">{i18n.t('web.export.stat.slowing', { first: i18n.number(stats.drawFirstMs ?? 0, { maximumFractionDigits: 1 }), now: i18n.number(stats.drawMs, { maximumFractionDigits: 1 }) })}</p>}
              <button type="button" className="btn-ghost mt-2 border border-control" disabled={!stats} onClick={copyExportReport} data-testid="export-copy-report">{copiedRun ? i18n.t('web.export.diagnose.copied') : i18n.t('web.export.copyReport')}</button>
            </details>
          </div>
        )}

        {phase === 'done' && result && (
          <div className="space-y-2 text-[13px]" aria-live="polite">
            <p>{i18n.t('web.export.done', { name: result.name, size: mb(result.bytes), seconds: i18n.number(result.ms / 1000, { maximumFractionDigits: 1 }) })}</p>
            {result.url
              ? <a className="inline-block rounded border border-accent px-3 py-1.5 font-medium text-accent" href={result.url} download={result.name} data-testid="export-download">{i18n.t('web.export.download')}</a>
              : <p className="text-muted">{i18n.t('web.export.saved')}</p>}
            {finalReport && <button type="button" className="btn-ghost block border border-control" onClick={copyExportReport} data-testid="export-copy-report">{copiedRun ? i18n.t('web.export.diagnose.copied') : i18n.t('web.export.copyReport')}</button>}
          </div>
        )}

        <div className="flex justify-end gap-2">
          {phase === 'running'
            ? <button type="button" className="btn-ghost border border-control" onClick={() => handle.current?.cancel()} data-testid="export-cancel">{i18n.t('web.export.cancel')}</button>
            : <>
                <button type="button" className="btn-ghost border border-control" onClick={onClose} data-testid="export-close">{i18n.t('web.export.close')}</button>
                {phase !== 'done' && <button ref={startBtn} type="button" disabled={choice === 'checking' || unsupported || busy} onClick={() => void start()}
                  className="rounded border border-accent px-3 py-1.5 text-[13px] font-medium text-accent disabled:cursor-not-allowed disabled:opacity-50" data-testid="export-start">{i18n.t('web.export.start')}</button>}
              </>}
        </div>
      </div>
    </div>
  );
}
