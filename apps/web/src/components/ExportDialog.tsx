// Hộp thoại Xuất video (T-09, REQ-EXPORT-00/05/06). Chọn cỡ/FPS/chất lượng → tóm tắt pre-flight (kích thước thực, dung lượng,
// định dạng sẽ dùng, cảnh báo) → xuất trong Export Worker với tiến độ và nút Hủy. Phần tính toán ở lib/exportPlan.ts.
import { useEffect, useMemo, useRef, useState } from 'react';
import { flattenScene, type Derived, type SceneDocument, type UnifiedProjectAST } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import type { AudioAsset } from '../lib/audioAsset.ts';
import { startExport, type ExportHandle } from '../lib/exportClient.ts';
import { ZIP_WARN_BYTES, estimatePngBytes, safeBase, vp9AlphaSupported, type DirTarget } from '../lib/pngSequence.ts';
import { radioKeys } from '../lib/a11y.ts';
import { useAssets, type ExportAssets } from '../lib/assetsRuntime.ts';
import { missingAssets } from '../lib/sessionAssets.ts';
import type { FileTarget } from '../lib/exportProtocol.ts';
import { AUDIO_LABEL, CONTAINER_EXT, CONTAINER_LABEL, CONTAINER_MIME, FPS_CHOICES, MAX_EDGE, MIN_SHORT_EDGE, VIDEO_LABEL, autoChoice, detectSupport, exportBaseName, exportDuration, fitRect, heightForWidth, manualChoice, normalizeRange, normalizeSelection, optionsFor, preflight, sizeForClass, sizeFromCustom, sliceAudioForRange, usableContainers, widthForHeight, type AudioId, type CodecChoice, type CodecProbe, type ContainerId, type Fps, type ProgressInfo, type Quality, type ResolutionClass, type Selection, type Support, type VideoId } from '../lib/exportPlan.ts';
import { downsample, formatExportReport, type ExportReport, type ExportStats } from '../lib/exportStats.ts';
import { isExportBusy, tryExportLock, type ExportLock } from '../lib/exportLock.ts';
import { makeExportWorker } from '../lib/exportWorker.ts';
import { runDiagnostics } from '../lib/exportDiagnostics.ts';
import pkg from '../../package.json';
import { Select } from './Select.tsx';
import { NumberField } from './NumberField.tsx';
import { TimeField } from './TimeField.tsx';

const CLASSES: ResolutionClass[] = [720, 1080, 2160];
/** Ô Kích thước: ba mốc hoặc "Tuỳ chỉnh" (rộng × cao, D-26). */
type SizeChoice = ResolutionClass | 'custom';
const PX = { min: 2, max: 8192, step: 2, units: { px: 1 } };
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

/** Xuất do agent điều khiển (`?agent=1`, lib/agentApi.ts): cấu hình đặt sẵn, tự bắt đầu khi đã dò xong bộ mã hoá, không hỏi nơi lưu, báo kết quả qua `onFinish`. */
export interface AutoExport {
  resolution?: ResolutionClass; fps?: Fps; quality?: Quality; kind?: 'video' | 'png';
  /** Kích thước tuỳ ý (cả hai cùng có thì thay `resolution`). */
  width?: number; height?: number;
  /** Chỉ xuất đoạn này (giây dự án). */
  range?: { start: number; end: number };
  /** Chỉ đưa các lớp gốc này vào lần xuất (id lớp). */
  layers?: string[];
  onFinish(r: { blob: Blob | null; name: string; bytes: number; ms: number } | { error: string }): void }
export function ExportDialog({ scene, ast, derived, audio, offsetMs, projectSec, fileName, advanced = false, styleId, styleName, onClose, auto, layerName }: {
  /** Tên hiển thị của lớp (như cột lớp ở Timeline); vắng thì tên riêng hoặc loại widget. */
  layerName?(id: string): string;
  styleId?: string; styleName?: string; scene: SceneDocument; ast: UnifiedProjectAST; derived: Derived; audio: AudioAsset | null; offsetMs: number; projectSec: number; fileName: string; advanced?: boolean; onClose(): void; auto?: AutoExport;
}) {
  const { i18n } = useI18n();
  const assetsApi = useAssets();
  const { designWidth: DW, designHeight: DH } = scene.canvas;
  const autoCustom = !!(auto?.width && auto?.height);
  const [cls, setCls] = useState<SizeChoice>(autoCustom ? 'custom' : auto?.resolution ?? 1080);
  // Kích thước tuỳ ý (D-26): rộng × cao; "giữ tỉ lệ" thì sửa một ô, ô kia tự tính theo tỉ lệ khung video.
  const [custom, setCustom] = useState(() => (autoCustom ? { w: auto!.width!, h: auto!.height! } : { w: sizeForClass(DW, DH, 1080).width, h: sizeForClass(DW, DH, 1080).height }));
  const [keepRatio, setKeepRatio] = useState(!autoCustom);
  // Đoạn xuất Start→End (D-10); `end` null = tới hết bài.
  const [part, setPart] = useState(!!auto?.range);
  const [rStart, setRStart] = useState(auto?.range?.start ?? 0);
  const [rEnd, setREnd] = useState<number | null>(auto?.range?.end ?? null);
  // Chọn lớp cho lần xuất này (T-55): lớp gốc bị bỏ ra; mặc định không bỏ lớp nào.
  const roots = useMemo(() => [...scene.widgets].sort((a, b) => b.zIndex - a.zIndex), [scene]);
  const [excluded, setExcluded] = useState<ReadonlySet<string>>(() => new Set(auto?.layers ? scene.widgets.filter((w) => !auto.layers!.includes(w.id)).map((w) => w.id) : []));
  const [fps, setFps] = useState<Fps>(auto?.fps ?? 30);
  const [quality, setQuality] = useState<Quality>(auto?.quality ?? 'medium');
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
  // T-55: video hoặc chuỗi PNG trong suốt (+ .wav). VP9 có alpha chỉ phát hiện để báo.
  const [kind, setKind] = useState<'video' | 'png'>(auto?.kind ?? 'video');
  const [wav, setWav] = useState(true);
  const [vp9Alpha, setVp9Alpha] = useState<boolean | null>(null);

  const customSize = useMemo(() => (cls === 'custom' ? sizeFromCustom(custom.w, custom.h) : null), [cls, custom]);
  const tooSmall = cls === 'custom' && !customSize;
  // Kích thước quá nhỏ: vẫn cần một kích thước để tính ước tính, nhưng nút Bắt đầu bị khoá.
  const size = useMemo(() => customSize ?? sizeForClass(DW, DH, cls === 'custom' ? 720 : cls), [customSize, DW, DH, cls]);
  const letterbox = !fitRect(DW, DH, size.width, size.height).fits;
  const whole = useMemo(() => exportDuration({ projectSec, audioSec: audio ? Math.max(0, offsetMs / 1000 + audio.durationSec) : 0 }), [projectSec, audio, offsetMs]);
  const span = useMemo(() => normalizeRange({ start: rStart, end: rEnd ?? whole.duration }, whole.duration, 1 / fps), [rStart, rEnd, whole, fps]);
  const range = useMemo(() => (part ? exportDuration({ projectSec, range: span }) : whole), [part, projectSec, span, whole]);
  const rangeBad = part && !span.ok;
  const layers = excluded.size ? roots.filter((w) => !excluded.has(w.id)).map((w) => w.id) : undefined;
  const noLayers = !!layers && layers.length === 0;
  const invalid = tooSmall || rangeBad || noLayers;
  const lname = (w: (typeof roots)[number]) => layerName?.(w.id) ?? w.name ?? (i18n.has(`web.widget.${w.type}`) ? i18n.t(`web.widget.${w.type}`) : w.type);
  // Tên tệp chốt trước khi render (D-26): tên dự án + rộng×cao + fps (+ đoạn).
  const outBase = exportBaseName(baseOf(fileName), { width: size.width, height: size.height, fps, range: part ? span : null });
  const pngBase = exportBaseName(safeBase(baseOf(fileName)), { width: size.width, height: size.height, fps, range: part ? span : null });
  // Bản nhạc còn đang viết (D-63): chưa cho xuất, nếu không widget sẽ trống trong video.
  const notationPending = flattenScene(scene).widgets.some((w) => w.type === 'NOTATION' && w.visible && !derived.notation?.has(w.id));
  // Agent: không hỏi nơi lưu (không có người bấm hộp thoại của hệ điều hành); kết quả về dạng Blob.
  const hasFsa = !auto && typeof window !== 'undefined' && 'showSaveFilePicker' in window;
  const pre = useMemo(() => preflight({ width: size.width, height: size.height, fps, quality, duration: range.duration, hasAudio: !!audio, hasFileSystemAccess: hasFsa }), [size, fps, quality, range, audio, hasFsa]);

  const hasDirPicker = !auto && typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  const pngBytes = useMemo(() => estimatePngBytes({ width: size.width, height: size.height, frames: pre.frames, ...(audio && wav ? { wavSeconds: range.duration, sampleRate: audio.buffer.sampleRate, channels: audio.buffer.numberOfChannels } : {}) }), [size, pre.frames, audio, wav, range]);
  const probeDelay = useRef(0); // lần dò đầu chạy ngay; các lần sau (đổi cỡ, fps…) chờ 200 ms
  // Kéo/gõ cỡ xuất sinh nhiều giá trị liên tiếp: chờ 200 ms rồi mới dò bộ mã hoá, và giữ kết quả cũ trong lúc dò (không nháy về 'đang kiểm' làm các ô định dạng giật).
  useEffect(() => { let live = true; const id = setTimeout(() => void vp9AlphaSupported(size.width, size.height).then((v) => live && setVp9Alpha(v)), probeDelay.current); return () => { live = false; clearTimeout(id); }; }, [size]);
  useEffect(() => {
    let live = true;
    const id = setTimeout(() => {
      probeDelay.current = 200;
      detectSupport(browserProbe, { width: size.width, height: size.height, fps, bitrate: pre.bitrate, sampleRate: audio?.buffer.sampleRate, channels: audio?.buffer.numberOfChannels })
        .then((x) => live && setSupport(x), () => live && setSupport({ video: {}, audio: new Set() }));
    }, probeDelay.current);
    return () => { live = false; clearTimeout(id); };
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
  // Agent: bắt đầu ngay khi đã biết bộ mã hoá (và Bản nhạc đã viết xong); không có bộ mã hoá nào thì báo lỗi.
  const autoStarted = useRef(false);
  useEffect(() => {
    if (!auto || autoStarted.current || phase !== 'setup') return;
    if (kind === 'video' && choice === 'checking') return;
    if (notationPending) return;
    autoStarted.current = true;
    if (invalid) { auto.onFinish({ error: tooSmall ? 'invalid size: short side must be at least 128 px' : rangeBad ? 'invalid range: end must be after start' : 'no layers selected' }); return; }
    if (kind === 'video' && !choice) { auto.onFinish({ error: 'unsupported: no video encoder for this size/fps in this browser' }); return; }
    void start();
  }); // eslint-disable-line react-hooks/exhaustive-deps
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
  // Ghi chú về kích thước và tài nguyên: đúng cho cả video lẫn chuỗi PNG.
  const common: string[] = size.notes.map((n) => NOTE[n]);
  if (letterbox) common.push(i18n.t('web.export.note.LETTERBOX'));
  if (choice && choice !== 'checking') for (const n of choice.notices) notes.push(NOTE[n]);
  for (const w of pre.warnings) notes.push(NOTE[w]);
  // Pre-flight tài nguyên (T-21): ảnh widget dùng mà phiên chưa có thì báo trước khi xuất.
  const missing = missingAssets(scene, new Set(derived.images?.keys() ?? []));
  if (missing.length) common.push(i18n.t('web.export.note.MISSING_ASSETS', { n: missing.length }));
  // Lỗi chặn xuất (nút Bắt đầu bị khoá): nói rõ vì sao.
  const blockers = [tooSmall && i18n.t('web.export.note.TOO_SMALL', { min: MIN_SHORT_EDGE, max: MAX_EDGE }), rangeBad && i18n.t('web.export.note.RANGE_EMPTY'), noLayers && i18n.t('web.export.note.NO_LAYERS')].filter(Boolean) as string[];
  if (!hasFsa) notes.push(NOTE.SAVE_AFTER);

  const format = choice && choice !== 'checking'
    ? `${CONTAINER_LABEL[choice.container]} · ${VIDEO_LABEL[choice.video]}${choice.audioCodec ? ` + ${AUDIO_LABEL[choice.audioCodec]}` : ''}`
    : null;

  const start = async () => {
    if (kind === 'video' && (!choice || choice === 'checking')) return;
    if (invalid) return;
    // Chuỗi PNG không cần bộ mã hoá video: giữ chỗ để thông điệp đủ trường (Worker bỏ qua).
    const codec: CodecChoice = choice && choice !== 'checking' ? choice : { container: 'mp4', video: 'avc', videoCodec: 'png', audioCodec: null, notices: [] };
    setError(null);
    // Một tab xuất mỗi lần: lấy khoá trước khi hỏi nơi lưu để không bắt người dùng chọn tệp rồi mới báo bận.
    const got = await tryExportLock();
    if (!got) { setBusy(true); return; }
    exportLock.current = got;
    const freeLock = () => { exportLock.current?.release(); exportLock.current = null; };
    const isPng = kind === 'png', base = pngBase;
    const ext = isPng ? 'zip' : CONTAINER_EXT[codec.container];
    const suggestedName = `${isPng ? pngBase : outBase}.${ext}`;
    let file: SaveHandle | undefined;
    let dir: DirTarget | undefined;
    if (isPng && hasDirPicker) {
      try { dir = await (window as unknown as { showDirectoryPicker(o: object): Promise<DirTarget> }).showDirectoryPicker({ id: 'dawviz-png', mode: 'readwrite' }); }
      catch (e) { if ((e as DOMException)?.name === 'AbortError') { freeLock(); return; } dir = undefined; }
    } else if (!isPng && hasFsa) {
      try {
        file = await (window as unknown as { showSaveFilePicker: SavePicker }).showSaveFilePicker({ suggestedName, types: [{ description: ext.toUpperCase(), accept: { [CONTAINER_MIME[codec.container]]: [`.${ext}`] } }] });
      } catch (e) { if ((e as DOMException)?.name === 'AbortError') { freeLock(); return; } file = undefined; }
    }
    const slice = audio && (isPng ? wav : codec.audioCodec)
      ? sliceAudioForRange(Array.from({ length: audio.buffer.numberOfChannels }, (_, c) => audio.buffer.getChannelData(c)), audio.buffer.sampleRate, range.start, range.duration, offsetMs)
      : null;
    setPhase('running'); setProgress(null); setStats(null); setFinalReport(null); setCopiedRun(false); points.current = []; startedAt.current = performance.now(); lastProgress.current = null;
    try { lock.current = await (navigator as unknown as { wakeLock?: { request(t: 'screen'): Promise<{ release(): Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { lock.current = null; }
    // Ảnh nền: bản sao riêng cho Worker (bản của Xem trước vẫn dùng tiếp, vì chuyển quyền sở hữu sẽ làm nó rỗng).
    let background: NonNullable<typeof derived.background> | undefined;
    try { if (derived.background) background = { image: await createImageBitmap(derived.background.image as ImageBitmap), width: derived.background.width, height: derived.background.height }; } catch { background = undefined; }
    let payload: ExportAssets = { images: [], fonts: [] };
    try { payload = await assetsApi.exportPayload(); } catch { /* thiếu tài nguyên: pre-flight đã báo, vẫn xuất phần còn lại */ }
    let h: ExportHandle;
    try { h = startExport({
      ...(payload.images.length ? { images: payload.images } : {}), ...(payload.fonts.length ? { userFonts: payload.fonts } : {}),
      ast, scene, brightness: derived.brightness, spectrum: derived.audio, background, ...(derived.notation?.size ? { notation: [...derived.notation] } : {}), width: size.width, height: size.height, fps, bitrate: pre.bitrate, choice: codec,
      start: range.start, duration: range.duration, style: styleId, ...(layers ? { layers } : {}),
      audio: slice ? { channels: slice.channels, sampleRate: audio!.buffer.sampleRate, offsetMs: slice.offsetMs } : undefined,
      ...(isPng ? { png: { base, wav: !!slice, transparent: true } } : {}),
    }, makeExportWorker, {
      file, ...(dir ? { dir } : {}),
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
      if (r.status === 'cancelled') { setPhase('setup'); auto?.onFinish({ error: 'cancelled' }); return; }
      setResult({ url: r.blob ? URL.createObjectURL(r.blob) : null, name: isPng && !r.blob ? i18n.t('web.export.png.folder') : suggestedName, bytes: r.bytes, ms: r.ms });
      auto?.onFinish({ blob: r.blob ?? null, name: suggestedName, bytes: r.bytes, ms: r.ms });
      setFinalReport(r.report ?? null);
      setPhase('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e)); setPhase('error');
      auto?.onFinish({ error: e instanceof Error ? e.message : String(e) });
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
            <div className="seg w-full" role="radiogroup" aria-label={i18n.t('web.export.kind')} onKeyDown={radioKeys} data-testid="export-kind">
              {(['video', 'png'] as const).map((k) => <button key={k} type="button" role="radio" aria-checked={kind === k} tabIndex={kind === k ? 0 : -1} className="seg-btn flex-1" onClick={() => setKind(k)} data-testid={`export-kind-${k}`}>{i18n.t(`web.export.kind.${k}`)}</button>)}
            </div>
            <div className="grid grid-cols-[7rem_1fr] items-center gap-2 text-[13px]">
              <label htmlFor="exp-size" className="text-muted">{i18n.t('web.export.size')}</label>
              <Select id="exp-size" value={cls} onChange={(e) => { const v = e.target.value; if (v === 'custom') { setCustom({ w: size.width, h: size.height }); setCls('custom'); } else setCls(Number(v) as ResolutionClass); }}>
                {CLASSES.map((c) => <option key={c} value={c}>{CLASS_LABEL[c]}</option>)}
                <option value="custom">{i18n.t('web.export.size.custom')}</option>
              </Select>
              {cls === 'custom' && <>
                <span aria-hidden />
                <div className="space-y-1.5" data-testid="export-custom">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
                    <NumberField label={i18n.t('web.export.width')} value={custom.w} spec={PX} range={[MIN_SHORT_EDGE, MAX_EDGE]} onChange={(w) => setCustom((c) => ({ w, h: keepRatio ? heightForWidth(w, DW, DH) : c.h }))} />
                    <span aria-hidden className="text-muted">×</span>
                    <NumberField label={i18n.t('web.export.height')} value={custom.h} spec={PX} range={[MIN_SHORT_EDGE, MAX_EDGE]} onChange={(h) => setCustom((c) => ({ w: keepRatio ? widthForHeight(h, DW, DH) : c.w, h }))} />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-muted">
                    <input type="checkbox" checked={keepRatio} onChange={(e) => { setKeepRatio(e.target.checked); if (e.target.checked) setCustom((c) => ({ w: c.w, h: heightForWidth(c.w, DW, DH) })); }} data-testid="export-keep-ratio" />{i18n.t('web.export.keepRatio')}
                  </label>
                </div>
              </>}
              <label htmlFor="exp-fps" className="text-muted">{i18n.t('web.export.fps')}</label>
              <Select id="exp-fps" value={fps} onChange={(e) => setFps(Number(e.target.value) as Fps)}>{FPS_CHOICES.map((f) => <option key={f} value={f}>{f}</option>)}</Select>
              <span className="text-muted" id="exp-range-l">{i18n.t('web.export.range')}</span>
              <div className="seg w-full" role="radiogroup" aria-labelledby="exp-range-l" onKeyDown={radioKeys} data-testid="export-range">
                {([false, true] as const).map((p) => <button key={String(p)} type="button" role="radio" aria-checked={part === p} tabIndex={part === p ? 0 : -1} className="seg-btn flex-1" onClick={() => setPart(p)} data-testid={`export-range-${p ? 'part' : 'all'}`}>{i18n.t(p ? 'web.export.range.part' : 'web.export.range.all')}</button>)}
              </div>
              {part && <>
                <span aria-hidden />
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5" data-testid="export-range-fields">
                  <TimeField id="export-range-start" label={i18n.t('web.export.range.start')} value={span.start} max={whole.duration} onChange={(v) => setRStart(v ?? 0)} />
                  <span aria-hidden className="text-muted">→</span>
                  <TimeField id="export-range-end" label={i18n.t('web.export.range.end')} value={span.end} max={whole.duration} onChange={(v) => setREnd(v)} />
                </div>
              </>}
              {kind === 'video' && <>
              <label htmlFor="exp-q" className="text-muted">{i18n.t('web.export.quality')}</label>
              <Select id="exp-q" value={quality} onChange={(e) => setQuality(e.target.value as Quality)}>
                {QUALITIES.map((q) => <option key={q} value={q}>{QUALITY_LABEL[q]}</option>)}
              </Select>
              </>}
            </div>
            {kind === 'png' && (
              <div className="space-y-1.5 text-[13px]" data-testid="export-png">
                <label className="flex items-center gap-2"><input type="checkbox" checked={wav && !!audio} disabled={!audio} onChange={(e) => setWav(e.target.checked)} data-testid="export-png-wav" />{i18n.t('web.export.png.wav')}</label>
                <p className="tabular-nums text-muted" data-testid="export-png-summary">{i18n.t('web.export.png.summary', { frames: i18n.number(pre.frames), size: mb(pngBytes), where: i18n.t(hasDirPicker ? 'web.export.png.toFolder' : 'web.export.png.toZip') })}</p>
                {!hasDirPicker && pngBytes > ZIP_WARN_BYTES && <p role="alert" className="text-warning" data-testid="export-png-big">{i18n.t('web.export.png.big')}</p>}
                <p className="text-muted" data-testid="export-vp9-alpha">{vp9Alpha === null ? '' : i18n.t(vp9Alpha ? 'web.export.png.alphaYes' : 'web.export.png.alphaNo')}</p>
              </div>
            )}
            {(advanced || kind === 'png') && roots.length > 1 && (
              <details className="text-[13px]" data-testid="export-layers">
                <summary className="disclosure cursor-pointer text-muted">{i18n.t('web.export.layers', { n: roots.length - excluded.size, total: roots.length })}</summary>
                <div className="mt-1.5 space-y-0.5">
                  <button type="button" className="hit text-xs text-muted underline-offset-2 hover:text-fg hover:underline disabled:opacity-40" disabled={!excluded.size} onClick={() => setExcluded(new Set())} data-testid="export-layers-all">{i18n.t('web.export.layers.all')}</button>
                  <ul className="max-h-40 space-y-0.5 overflow-y-auto">
                    {roots.map((w) => (
                      <li key={w.id}>
                        <label className="flex min-h-[var(--hit)] items-center gap-2 text-xs text-muted">
                          <input type="checkbox" checked={!excluded.has(w.id)} onChange={(e) => setExcluded((s) => { const n = new Set(s); if (e.target.checked) n.delete(w.id); else n.add(w.id); return n; })} data-testid={`export-layer-${w.id}`} />
                          <span className="min-w-0 truncate text-fg">{lname(w)}</span>
                          {!w.visible && <span className="text-faint">{i18n.t('web.export.layers.hidden')}</span>}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            )}
            {kind === 'video' && advanced && support !== 'checking' && effSel && (
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
            {kind === 'video' && <p className="text-[13px] tabular-nums text-muted" data-testid="export-summary">
              {i18n.t('web.export.summary', { width: String(size.width), height: String(size.height), fps: String(fps), duration: mmss(range.duration), frames: i18n.number(pre.frames), size: mb(pre.bytes) })}
            </p>}
            <p className="text-[13px]" aria-live="polite">
              {kind === 'png' ? i18n.t('web.export.format', { format: `PNG ${i18n.t('web.export.png.alpha')}${audio && wav ? ' + WAV' : ''}` }) : choice === 'checking' ? i18n.t('web.export.checking') : unsupported ? '' : i18n.t('web.export.format', { format: format ?? '' })}
            </p>
            <p className="break-all text-[13px] text-muted" data-testid="export-filename">{i18n.t('web.export.fileName', { name: kind === 'png' ? (hasDirPicker ? `${pngBase}_000001.png…` : `${pngBase}.zip`) : `${outBase}.${choice && choice !== 'checking' ? CONTAINER_EXT[choice.container] : CONTAINER_EXT[sel.container]}` }) }</p>
            {blockers.length > 0 && <ul role="alert" className="space-y-1 text-[13px] text-danger" data-testid="export-blockers">{blockers.map((n) => <li key={n}>{n}</li>)}</ul>}
            {common.length > 0 && <ul className="space-y-1 text-[13px] text-warning" data-testid="export-notes">{common.map((n, i) => <li key={i}>{n}</li>)}</ul>}
            {busy && <p role="alert" className="text-[13px] text-warning" data-testid="export-busy">{i18n.t('web.export.busy')}</p>}
            {notationPending && <p role="status" className="text-[13px] text-warning" data-testid="export-notation-pending">{i18n.t('web.export.notationPending')}</p>}
            {kind === 'video' && unsupported && <p role="alert" className="text-[13px] text-danger">{i18n.t('errors.ERR_NO_SUPPORTED_ENCODER')}</p>}
            {kind === 'video' && notes.length > 0 && <ul className="space-y-1 text-[13px] text-warning">{notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
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
                {phase !== 'done' && <button ref={startBtn} type="button" disabled={(kind === 'video' && (choice === 'checking' || unsupported)) || busy || notationPending || invalid} onClick={() => void start()}
                  className="rounded border border-accent px-3 py-1.5 text-[13px] font-medium text-accent disabled:cursor-not-allowed disabled:opacity-50" data-testid="export-start">{i18n.t('web.export.start')}</button>}
              </>}
        </div>
      </div>
    </div>
  );
}
