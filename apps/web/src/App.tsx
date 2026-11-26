// Thành phần gốc (T-70, UI-DIRECTION 5.3 cấu trúc D + A + E): thanh trên hai hàng, ba thẻ Preview / Editor / Settings.
// Thẻ Preview: cột "Video styles" | sân khấu "bản in thử" + thanh phát | inspector đánh số. Thẻ Editor: components/Editor.tsx (T-68).
// Giữ trạng thái tệp đã nạp. Mọi thay đổi người dùng làm (kiểu nốt, ghi đè theo track, phong cách video, độ sáng, ẩn/solo/thứ tự track,
// bố cục widget, mở preset) nằm trong store có hoàn tác (lib/store.ts, T-07). Đồng hồ phát nằm ở kho riêng (lib/playback.ts)
// nên thành phần này không vẽ lại mỗi khung hình. Không có logic vẽ ở đây: khung hình = renderFrame của Render Core.
import { Fragment, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { LayoutGroup, MotionConfig } from 'framer-motion';
import { MAX_FLAT_WIDGETS, cloneCompTree, type CompProps, type CompSpec, renderFrame, type RenderCtx, flatCount, flattenScene, compOf, validCompPath, visibilityAlpha, usesChordPlaceholder, widgetDefaults, DEFAULT_BRIGHTNESS, DEFAULT_KEYBOARD_STYLE, defaultStyleConfig, sanitizeBrightness, buildIndex, buildSceneHud, type AudioFeatures, type Derived, type SceneDocument, type BrightnessConfig, type NoteStyle, type StyleConfig, type KeyboardStyle, type UnifiedProjectAST, type WidgetSpec, DEFAULT_TEXT_STYLES, createWidget, duplicateWidget } from '@dawviz/render-core';
import type { ParseWarning } from '@dawviz/parser';
import { useI18n } from './i18n/I18nProvider.tsx';
import { LanguageSelect } from './components/LanguageSelect.tsx';
import { AppearanceSettings, ThemeToggle, useTheme } from './components/ThemeSelect.tsx';
import { FileDrop, type Picked } from './components/FileDrop.tsx';
import { Notices } from './components/Notices.tsx';
import { MissingMidiPanel } from './components/MissingMidiPanel.tsx';
import { TempoPanel } from './components/TempoPanel.tsx';
import { SchemaPanel } from './components/SchemaPanel.tsx';
import { sanitizeDraft, type TempoDraft, type TempoOverride } from './lib/tempoRows.ts';
import { SessionSettings, type SaveState } from './components/SessionSettings.tsx';
import { DeviceLatency } from './components/DeviceLatency.tsx';
import { BackgroundError, loadBackground, type BitmapLike } from './lib/backgroundImage.ts';
import { DEFAULT_DEVICE_PREFS, activeOffsetMs, sanitizeDevicePrefs, type DevicePrefs } from './lib/latencyCalibration.ts';
import { AUTOSAVE_DELAY_MS, createDebounced, createSaver, lazyDexieBackend, restoreWorkspace, type Backend } from './lib/workspaceStore.ts';
import { applyWorkspace, toWorkspaceJson } from './lib/docSnapshot.ts';
import { styleUseCounts } from './lib/textStyles.ts';
import { bytesOf, downloadBytes, packOf, sessionFromPack, snapshotOf, type SessionData, type SessionParts } from './lib/session.ts';
import { PACK_LIMITS, PackError } from './lib/projectPack.ts';
import { Crop, Stage } from './components/Stage.tsx';
import { Transport } from './components/Transport.tsx';
import { TrackPanel, TrackLayoutBar, DEFAULT_TRACK_LAYOUT, isShown, type TrackLayout } from './components/TrackPanel.tsx';
import { PalettePanel } from './components/PalettePanel.tsx';
import { ADVANCED_STYLE_KEYS, StylePanel } from './components/StylePanel.tsx';
import { TextPanel } from './components/TextPanel.tsx';
import { WidgetSettings, hasWidgetSettings } from './components/WidgetSettings.tsx';
import { advancedEdited } from './lib/widgetFields.ts';
import { textSlots } from './lib/textRef.ts';
import { VideoStyles, isEdited } from './components/VideoStyles.tsx';
import { NOTE_PRESETS, VIDEO_STYLES, noteStylePreset, pristineScene, sceneForStyle, videoStyleBase, videoStyleKeyboard, withoutTrackOverrides } from './lib/videoScenes.ts';
import { createStore, type History } from './lib/store.ts';
import * as Cmds from './lib/commands.ts';
import { projectLanes } from './lib/animateFields.ts';
import { AudioPanel } from './components/AudioPanel.tsx';
// Hộp thoại xuất chỉ cần khi bấm Xuất video: tách thành mảnh tải sau để bản đầu nhẹ hơn.
// Tải ExportDialog sớm khi rê/focus/chạm nút Xuất video (không tải export.worker: chỉ nạp khi hộp thoại mở).
const loadExportDialog = () => import('./components/ExportDialog.tsx').then((m) => ({ default: m.ExportDialog }));
const ExportDialog = lazy(loadExportDialog);
import { AudioLoadError, browserDeps, loadAudioAsset, type AudioAsset } from './lib/audioAsset.ts';
import { audioLengthCheck } from './lib/audioLength.ts';
import { peaksInWorker, spectrumInWorker } from './lib/audioWorkers.ts';
import { CUSTOM_STYLE, initialDoc, pianoOf, type Doc } from './lib/commands.ts';
import { liftCmd, pianoPathAt, viewDoc } from './lib/compLens.ts';
import { agentEnabled, createAgentApi, type AgentHost, type ExportOptions } from './lib/agentApi.ts';
import type { AutoExport } from './components/ExportDialog.tsx';
import { GestureContext, useStoreState } from './lib/storeReact.ts';
import { bindUndoKeys, shortcutLabels } from './lib/undoKeys.ts';
import { downloadPreset, presetFileName, readPresetFile } from './lib/presetFile.ts';
import { loadWorkspaceStyles, saveWorkspaceStyles } from './lib/workspaceStyles.ts';
import { addUserPreset, applyCollectionImport, planCollectionImport, loadUserPresets, matchUserPreset, removeUserPreset, saveUserPresets, type UserPreset } from './lib/userPresets.ts';
import { useFontsStatus } from './lib/fonts.ts';
import { projectKey, styleThumbnail } from './lib/thumbnails.ts';
import { NotationStatusContext, useNotation } from './lib/notation/useNotation.ts';
import { Facts, InspectorSection } from './components/Inspector.tsx';
import { Mark, PanelLeft, PanelRight } from './components/Icons.tsx';
import { PanelCollapse, Rail } from './components/PanelChrome.tsx';
import { Splitter } from './components/Splitter.tsx';
import { usePanelLayout, usePanelShortcuts } from './lib/usePanelLayout.ts';
import { HistoryMenu } from './components/HistoryMenu.tsx';
import { Editor, useWidgetNames, type EditorActions } from './components/Editor.tsx';
import { describeCommand, historyItems, type LabelCtx } from './lib/historyLabels.ts';
import { mergeExtras, missingMidiLevel, type ExternalMidiInfo } from './lib/externalMidi.ts';
import { loadPref, savePref } from './lib/prefs.ts';
import { usePref, DEFAULT_UI, sanitizeUi, type UiMode, type UiPrefs } from './lib/usePref.ts';
import { ConfirmDialog } from './components/ConfirmDialog.tsx';
import { SearchEmpty, SettingsSearchBox, SettingsSearchContext } from './components/SettingsSearch.tsx';
import { createPlayback, usePlayback } from './lib/playback.ts';
import { radioKeys, radioTab } from './lib/a11y.ts';
import { bindTransportKeys } from './lib/transportKeys.ts';
import { STAGE_CHROME, useStageWidth } from './lib/useStageWidth.ts';
import { formatClock } from './lib/timeFormat.ts';
import { describeProblem, type Problem } from './lib/problems.ts';
import { createLatestGate, ParseFailure } from './lib/parserClient.ts';
import { parseInWorker } from './lib/parseInWorker.ts';
import { AssetsContext, decodeImage, loadFontBytes, type SessionAsset } from './lib/assetsRuntime.ts';
import { acceptAsset, type AssetMeta } from './lib/sessionAssets.ts';
import { BUNDLED_FONTS } from '@dawviz/render-core';
import { buildCollectionPack, buildPresetPack, presetFileName as packFileName, readCollectionPack, readPresetPack, PresetPackError } from './lib/presetPack.ts';
import { EASE_LIBRARY_KEY, addSavedEase, parseEaseLibrary } from './lib/graphEditor.ts';
import { referencedAssets } from './lib/sessionAssets.ts';

interface Loaded { name: string; ast: UnifiedProjectAST; warnings: ParseWarning[]; format: string; ms: number }
type Tab = 'preview' | 'editor' | 'settings';
const TABS: readonly Tab[] = ['preview', 'editor', 'settings'];

/** Bố cục danh sách track mặc định (đích của ↺ ở thanh bố cục). */
const TRACK_LAYOUT_DEFAULT: TrackLayout = { ...DEFAULT_TRACK_LAYOUT, mode: 'list' };

export function App() {
  const { i18n } = useI18n();
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failure, setFailure] = useState<{ code: string; message: string; details?: Record<string, unknown> } | null>(null);
  // Lần chọn tệp gần nhất (để nạp thêm .mid mà không phải chọn lại dự án) và tình trạng .mid ngoài (REQ-UI-08).
  const [source, setSource] = useState<Picked | null>(null);
  const [midi, setMidi] = useState<ExternalMidiInfo | undefined>(undefined);
  // Store có hoàn tác. Thiết lập đã lưu (phong cách video, kiểu nốt, ghi đè theo track, bàn phím) nạp vào tài liệu ban đầu; lịch sử bắt đầu trống.
  // Lần đầu (chưa có tuỳ chọn lưu) kiểu nốt và bàn phím lấy theo phong cách mặc định "Paper" (D-51).
  const [store] = useState(() => {
    let d = initialDoc(sanitizeUi(loadPref<Partial<UiPrefs>>('ui', {})).videoStyle, { style: loadPref<Partial<StyleConfig>>('style', {}), keyboard: loadPref<Partial<KeyboardStyle>>('keyboard', {}) });
    // Tải lại trang: ô đang chọn quay lại đúng bản đã chỉnh dở (bố cục, dải cao độ...), không thêm bước vào lịch sử.
    const ups = loadUserPresets(), ws = loadWorkspaceStyles((t) => VIDEO_STYLES.includes(t) || ups.some((u) => u.id === t));
    if (ws.active) {
      const t = ws.active.tile, orig = ups.find((u) => u.id === t)?.scene;
      const cmd = VIDEO_STYLES.includes(t) ? Cmds.setVideoStyle(d, t, ws.active.scene) : orig ? Cmds.loadPreset(d, orig, ws.active.scene) : null;
      if (cmd) d = cmd.redo(d);
    }
    return createStore<Doc>(d);
  });
  const { doc, history } = useStoreState(store);
  const run = useCallback((make: (d: Doc) => ReturnType<typeof Cmds.toggleHidden>) => store.dispatch(make(store.get())), [store]);
  // Precomp đang mở ở Editor (D-69): đường dẫn id lớp COMP từ gốc vào trong. Editor làm việc trên khung nhìn của comp đó (lib/compLens.ts);
  // `erun` dựng lệnh trên khung nhìn rồi nâng về Doc thật. Đường dẫn hết hợp lệ (hoàn tác xoá lớp COMP) thì tự cắt.
  const [compPath, setCompPath] = useState<string[]>([]);
  const livePath = useMemo(() => validCompPath(doc.scene, compPath), [doc.scene, compPath]);
  const pathRef = useRef(livePath); pathRef.current = livePath;
  const edoc = useMemo(() => viewDoc(doc, livePath), [doc, livePath]);
  const [flatFull, setFlatFull] = useState(0);
  const erun = useCallback((make: (d: Doc) => ReturnType<typeof Cmds.toggleHidden>) => {
    const p = pathRef.current, cmd = liftCmd(make(viewDoc(store.get(), p)), p);
    // Trần số lớp sau khi trải precomp (render-core MAX_FLAT_WIDGETS): lệnh vượt trần thì không chạy, báo trên timeline.
    if (cmd && flatCount(cmd.redo(store.get()).scene) > MAX_FLAT_WIDGETS && flatCount(cmd.redo(store.get()).scene) > flatCount(store.get().scene)) { setFlatFull((n) => n + 1); return; }
    store.dispatch(cmd);
  }, [store]);
  const eget = useCallback(() => viewDoc(store.get(), pathRef.current), [store]);
  const gesture = useMemo(() => ({ begin: store.beginGesture, end: store.endGesture }), [store]);
  const playback = useRef(createPlayback()).current;
  // Thẻ Xem trước chỉnh nhanh Piano Roll ở gốc; gốc không có (đã gom vào precomp, D-69) thì Piano Roll của precomp đang hiện ở vạch phát.
  // Chỉ dò lại khi dừng/tua (không đổi đích giữa lúc phát).
  const pvT = usePlayback(playback, (s) => (s.playing ? null : Math.round(s.t * 4) / 4));
  const pvLast = useRef<string[]>([]);
  const pvPath = useMemo(() => { if (pvT === null) return pvLast.current; return (pvLast.current = pianoPathAt(doc.scene, pvT)); }, [doc.scene, pvT]);
  const pvRef = useRef(pvPath); pvRef.current = pvPath;
  /** Lệnh của Piano Roll ở thẻ Xem trước: dựng trên khung nhìn của precomp chứa nó (gốc thì như `run`). */
  const prun = useCallback((make: (d: Doc) => ReturnType<typeof Cmds.toggleHidden>) => { const p = pvRef.current; store.dispatch(liftCmd(make(viewDoc(store.get(), p)), p)); }, [store]);
  const piano = pianoOf(pvPath.length ? viewDoc(doc, pvPath).scene : doc.scene);
  const style: StyleConfig = useMemo(() => piano?.properties.noteStyle ?? defaultStyleConfig(), [piano]);
  const keyboard: KeyboardStyle = useMemo(() => piano?.properties.keyboard ?? { ...DEFAULT_KEYBOARD_STYLE }, [piano]);
  // Tuỳ chọn lưu theo trình duyệt (tiện lợi, không phải lịch sử): kiểu nốt/bàn phím của phong cách đang chọn. Scene mở từ preset không ghi đè chúng.
  useEffect(() => { if (piano && doc.videoStyle !== CUSTOM_STYLE) { savePref('style', piano.properties.noteStyle); savePref('keyboard', piano.properties.keyboard); } }, [piano, doc.videoStyle]);
  // REQ-UI-14: kiểu trình bày danh sách track là tuỳ chọn giao diện (không vào preset video).
  // Mặc định Danh sách: dòng track nằm ngay trong mục 03 của inspector (UI-DIRECTION 5.3); Lưới là lựa chọn thêm.
  const [trackLayout, setTrackLayout] = usePref<TrackLayout>('trackLayout', TRACK_LAYOUT_DEFAULT, (p) => ({
    mode: p.mode === 'grid' ? 'grid' : 'list',
    columns: p.columns === 'auto' || (typeof p.columns === 'number' && p.columns >= 1) ? p.columns : DEFAULT_TRACK_LAYOUT.columns,
  }));
  const [ui, setUi] = usePref('ui', DEFAULT_UI, sanitizeUi);
  const [device, setDevice] = usePref<DevicePrefs>('deviceLatency', DEFAULT_DEVICE_PREFS, sanitizeDevicePrefs);
  useEffect(() => { if (VIDEO_STYLES.includes(doc.videoStyle)) setUi((u) => (u.videoStyle === doc.videoStyle ? u : { ...u, videoStyle: doc.videoStyle })); }, [doc.videoStyle, setUi]);
  const [theme, setTheme] = useTheme();
  const [tab, setTab] = useState<Tab>('preview');
  const [exporting, setExporting] = useState(false);
  const advanced = ui.mode === 'advanced';
  // Tìm thiết lập (T-60): câu tìm dùng chung inspector Xem trước và bảng Thuộc tính Editor; không lưu.
  const [settingsQuery, setSettingsQuery] = useState('');
  const searchCtx = useMemo(() => ({ query: settingsQuery, setQuery: setSettingsQuery }), [settingsQuery]);
  const searching = settingsQuery.trim() !== '';

  // Đồng hồ phát ngoài React state (PROGRESS T-70): chỉ canvas, thanh phát và số đo đăng ký theo dõi.
  const deviceOffset = activeOffsetMs(device);
  useEffect(() => playback.setDeviceOffset(deviceOffset), [playback, deviceOffset]); // chỉ dời hình so với tiếng ở Xem trước (T-82)
  useEffect(() => () => playback.dispose(), [playback]);
  const duration = loaded?.ast.meta.totalDurationSeconds ?? 0;

  // T-08: tệp âm thanh mix là tài nguyên của phiên (không nằm trong Doc/lịch sử); offset thì thuộc dự án (Doc.audioOffsetMs, hoàn tác được).
  const [audio, setAudio] = useState<AudioAsset | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null); // tệp gốc: để lưu phiên/Project Pack (asset đã giải mã không ghi lại được)
  const [peaks, setPeaks] = useState<Float32Array | null>(null);
  // Ảnh nền của phiên (T-21): tệp gốc để lưu phiên/Project Pack, ImageBitmap để vẽ. Không nằm trong preset.
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgBitmap, setBgBitmap] = useState<BitmapLike | null>(null);
  const [bgBusy, setBgBusy] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);
  const bgGate = useRef(createLatestGate()).current;
  const onBackground = useCallback(async (file: File): Promise<boolean> => {
    const ticket = bgGate.begin(); setBgBusy(true); setBgError(null);
    try {
      const bmp = await loadBackground(file);
      if (!bgGate.isLatest(ticket)) { bmp.close?.(); return false; }
      setBgBitmap((old) => { old?.close?.(); return bmp; }); setBgFile(file); return true;
    } catch (e) {
      if (bgGate.isLatest(ticket)) setBgError((e as BackgroundError).code ?? 'ERR_ASSET_DECODE');
      return false;
    } finally { if (bgGate.isLatest(ticket)) setBgBusy(false); }
  }, [bgGate]);
  const dropBackground = useCallback(() => { bgGate.begin(); setBgBitmap((old) => { old?.close?.(); return null; }); setBgFile(null); setBgBusy(false); setBgError(null); }, [bgGate]);
  // Tài nguyên của phiên (T-21): ảnh/SVG cho widget Ảnh, phông người dùng cho kiểu chữ. Lưu cùng phiên và Project Pack, không nằm trong preset.
  const [assets, setAssets] = useState<SessionAsset[]>([]);
  const assetsRef = useRef(assets); assetsRef.current = assets;
  const addAsset = useCallback(async (file: File): Promise<AssetMeta> => {
    const bytes = await bytesOf(file);
    const { meta, added } = await acceptAsset(assetsRef.current.map((a) => a.meta), file.name, bytes);
    if (!added) return meta;
    let bitmap: ImageBitmap | undefined;
    if (meta.kind === 'font') await loadFontBytes(meta.family!, bytes, document.fonts, meta.name);
    else bitmap = await decodeImage(meta, bytes);
    setAssets((l) => (l.some((a) => a.meta.id === meta.id) ? (bitmap?.close(), l) : [...l, { meta, file, ...(bitmap ? { bitmap } : {}) }]));
    return meta;
  }, []);
  const removeAsset = useCallback((id: string) => setAssets((l) => { l.find((a) => a.meta.id === id)?.bitmap?.close(); return l.filter((a) => a.meta.id !== id); }), []);
  const exportPayload = useCallback(async () => {
    const l = assetsRef.current;
    const imgs = await Promise.all(l.filter((a) => a.bitmap).map(async (a) => [a.meta.id, await createImageBitmap(a.bitmap!)] as [string, ImageBitmap]));
    const fonts = await Promise.all(l.filter((a) => a.meta.family).map(async (a) => ({ family: a.meta.family!, bytes: await bytesOf(a.file) })));
    return { images: imgs, fonts };
  }, []);
  const assetsApi = useMemo(() => ({ list: assets.map((a) => a.meta), add: addAsset, remove: removeAsset, exportPayload }), [assets, addAsset, removeAsset, exportPayload]);
  const images = useMemo(() => new Map(assets.filter((a) => a.bitmap).map((a) => [a.meta.id, { image: a.bitmap!, width: a.bitmap!.width, height: a.bitmap!.height }])), [assets]);
  const fontSet = useMemo(() => { const fam = assets.filter((a) => a.meta.family).map((a) => a.meta.family!); return fam.length ? new Set([...BUNDLED_FONTS.map((f) => f.family), ...fam]) : undefined; }, [assets]);
  const [features, setFeatures] = useState<AudioFeatures | null>(null); // bảng phổ cho widget Audio Spectrum (T-53); null khi chưa có âm thanh hoặc đang tính
  const [audioBusy, setAudioBusy] = useState(false);
  const [audioError, setAudioError] = useState<{ code: string; message: string; details?: Record<string, unknown> } | null>(null);
  const audioGate = useRef(createLatestGate()).current;
  const offsetMs = doc.audioOffsetMs;
  // Độ dài phát = max(dự án, offset + âm thanh) để âm thanh dài hơn không bị cắt (TECHNICAL-DESIGN 6.2.4).
  const playDuration = Math.max(duration, audio ? Math.max(0, offsetMs / 1000 + audio.durationSec) : 0);
  useEffect(() => { playback.setDuration(playDuration); }, [playback, playDuration]);
  useEffect(() => { playback.setAudioOffset(offsetMs); }, [playback, offsetMs]);
  const dropAudio = useCallback(() => { audioGate.begin(); playback.attachAudio(null); setAudio(null); setAudioFile(null); setPeaks(null); setFeatures(null); setAudioBusy(false); }, [audioGate, playback]);
  const onLoadAudio = useCallback(async (file: File) => {
    const ticket = audioGate.begin();
    // Bỏ buffer cũ TRƯỚC khi giải mã tệp mới (đỉnh bộ nhớ, §6.2.1).
    playback.attachAudio(null); setAudio(null); setPeaks(null); setFeatures(null); setAudioError(null); setAudioBusy(true);
    try {
      const asset = await loadAudioAsset(file, browserDeps);
      if (!audioGate.isLatest(ticket)) return;
      setAudio(asset); setAudioFile(file); playback.attachAudio(asset.buffer);
      void peaksInWorker(asset.id, asset.buffer).then((p) => { if (audioGate.isLatest(ticket)) setPeaks(p); }).catch(() => {}); // không có sóng âm vẫn phát được
      void spectrumInWorker(asset.id, asset.buffer).then((f) => { if (audioGate.isLatest(ticket)) setFeatures(f); }).catch(() => {}); // không có phổ thì widget vẽ cột thấp nhất
    } catch (e) {
      if (!audioGate.isLatest(ticket)) return;
      const f = e as AudioLoadError;
      setAudioError({ code: f.code ?? 'ERR_AUDIO_DECODE', message: f.message, details: f.details });
    } finally { if (audioGate.isLatest(ticket)) setAudioBusy(false); }
  }, [audioGate, playback]);

  // REQ-UI-12: ẩn/hiện, solo và thứ tự track (thứ tự chỉ đổi ở Nâng cao). Lọc ở đây, Render Core không đổi.
  const view = useMemo(() => ({ hidden: new Set(doc.hidden) as ReadonlySet<string>, solo: new Set(doc.solo) as ReadonlySet<string> }), [doc.hidden, doc.solo]);
  const ordered = useMemo(() => {
    if (!loaded) return [];
    const byId = new Map(loaded.ast.tracks.map((t) => [t.id, t]));
    return doc.order.map((id) => byId.get(id)!).filter(Boolean);
  }, [loaded, doc.order]);
  // T-50: ẩn/hiện chỉ do Doc.hidden/solo quyết định. Track tắt tiếng trong DAW (isVisible=false từ parser) được đưa vào Doc.hidden khi nạp,
  // nên track nào đã qua lọc ở đây là hiện: đặt lại isVisible=true để widget vẽ nó (người dùng bật mắt cho track tắt tiếng thì track hiện).
  const renderAst = useMemo(() => (loaded ? { ...loaded.ast, tracks: ordered.filter((t) => isShown(t.id, view)).map((t) => (t.isVisible ? t : { ...t, isVisible: true })) } : null), [loaded, ordered, view]);
  // Khoá track (D-57, T-52): đặt ở làn Nhạc của timeline Editor; track khoá không đổi được ẩn/hiện, solo, màu, thứ tự, độ sáng. Trạng thái phiên (không vào preset, không hoàn tác).
  const [trackLocks, setTrackLocks] = useState<ReadonlySet<string>>(new Set());
  const locksRef = useRef(trackLocks); locksRef.current = trackLocks;
  const onLockTrack = useCallback((id: string) => setTrackLocks((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const free = (id: string) => !locksRef.current.has(id);
  const onToggleHidden = useCallback((id: string) => run((d) => (free(id) ? Cmds.toggleHidden(d, id) : null)), [run]);
  const onPaint = useCallback((kind: 'hide' | 'solo', id: string, on: boolean) => run((d) => (!free(id) ? null : kind === 'hide' ? Cmds.setHiddenOf(d, id, on) : Cmds.setSoloOf(d, id, on))), [run]);
  const onToggleSolo = useCallback((id: string) => run((d) => (free(id) ? Cmds.toggleSolo(d, id) : null)), [run]);
  const onMove = useCallback((id: string, to: number) => run((d) => (free(id) ? Cmds.moveTrack(d, id, to) : null)), [run]);
  const onToggleAllHidden = useCallback(() => run((d) => Cmds.toggleAllHidden(d, locksRef.current)), [run]);
  const onClearSolo = useCallback(() => run((d) => Cmds.clearSolo(d, locksRef.current)), [run]);
  const brightness = doc.brightness;

  // T-05: khung hình = renderFrame(scene, derived, ast, t). Scene nằm trong store (T-07): kiểu nốt, bàn phím, bố cục widget đều ở đây.
  const scene: SceneDocument = doc.scene;
  // Số chỗ dùng mỗi kiểu chữ trong cả dự án (gốc và mọi precomp), cho menu ⋯ của thanh Kiểu (T-126).
  const styleUses = useMemo(() => styleUseCounts(doc.scene), [doc.scene]);
  const styleEdited = doc.videoStyle !== CUSTOM_STYLE && isEdited(doc.videoStyle, style.base);
  const flat = useMemo(() => flattenScene(scene), [scene]); // precomp (D-69): widget trong comp cũng cần phông, hợp âm, bản nhạc
  const fonts = useFontsStatus(flat); // chưa nạp xong phông thì không vẽ khung có chữ (TECHNICAL-DESIGN 5.7)
  const index = useMemo(() => (renderAst ? buildIndex(renderAst.tracks, renderAst.meta.totalDurationSeconds) : null), [renderAst]);
  // Dò hợp âm là việc nặng của bước derived: dựng lại chỉ khi đổi dự án/track hiển thị/widget Chord (không phải mỗi lần kéo thanh trượt kiểu nốt).
  const chordSig = JSON.stringify(flat.widgets.filter((w) => w.type === 'CHORD_DETECTION' || usesChordPlaceholder(w)).map((w) => [w.id, w.trackMappingMode, w.assignedTrackIndices, w.trackRanges, (w.properties as { mode?: string }).mode, usesChordPlaceholder(w)]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hud = useMemo(() => (renderAst && index ? buildSceneHud(scene, renderAst, index) : undefined), [renderAst, index, chordSig]);
  // Bản nhạc (D-63): dựng trong Worker, theo widget; đổi màu/phóng to không dựng lại.
  const notation = useNotation(flat, renderAst, index, loaded ? projectKey(loaded.name, loaded.ast) : '');
  const derived: Derived | null = useMemo(() => (index ? { index, brightness, hud, fontsReady: fonts === 'ready', ...(notation.layouts.size ? { notation: notation.layouts } : {}), ...(features ? { audio: { features, offsetSec: offsetMs / 1000 } } : {}), ...(bgBitmap ? { background: { image: bgBitmap, width: bgBitmap.width, height: bgBitmap.height } } : {}), ...(images.size ? { images } : {}), ...(fontSet ? { fonts: fontSet } : {}) } : null), [index, brightness, hud, fonts, features, offsetMs, bgBitmap, notation.layouts, images, fontSet]);

  // Preset của người dùng (cột Video styles): lưu theo trình duyệt. `activeUser` = ô đang áp khi scene đã bị chỉnh nên không còn khớp từng chữ.
  const [userPresets, setUserPresets] = useState<UserPreset[]>(loadUserPresets);
  const [activeUser, setActiveUser] = useState<string | null>(() => { const t = loadWorkspaceStyles((x) => loadUserPresets().some((u) => u.id === x)).active?.tile; return t && !VIDEO_STYLES.includes(t) ? t : null; });
  useEffect(() => saveUserPresets(userPresets), [userPresets]);
  // Ô preset đang áp: scene khớp từng chữ với một preset đã lưu, hoặc ô vừa chọn nhưng đã chỉnh thêm. Phong cách dựng sẵn "đã chỉnh" tính trên cả scene (bố cục, dải cao độ...).
  const userMatch = doc.videoStyle === CUSTOM_STYLE ? matchUserPreset(userPresets, scene) : undefined;
  const userActiveId = doc.videoStyle !== CUSTOM_STYLE ? undefined : userMatch?.id ?? (userPresets.some((x) => x.id === activeUser) ? activeUser ?? undefined : undefined);
  const sceneEdited = useMemo(() => doc.videoStyle !== CUSTOM_STYLE && JSON.stringify(withoutTrackOverrides(pristineScene(doc.videoStyle))) !== JSON.stringify(withoutTrackOverrides(scene)), [doc.videoStyle, scene]);
  // Ô đang chọn (dựng sẵn hoặc của người dùng) và đã chỉnh so với bản gốc của nó chưa.
  const tileId = doc.videoStyle !== CUSTOM_STYLE ? doc.videoStyle : userActiveId;
  const tileEdited = doc.videoStyle !== CUSTOM_STYLE ? sceneEdited : !!userActiveId && !userMatch;
  // Ảnh thu nhỏ cột "Video styles": mỗi phong cách một khung nhỏ của dự án đang mở (Render Core, có bộ đệm). Cần phông xong cho scene có chữ.
  const pkey = loaded ? projectKey(loaded.name, loaded.ast) : '';
  const thumbs = useMemo(() => {
    const out: Record<string, string> = {};
    if (!loaded || fonts !== 'ready') return out;
    for (const id of VIDEO_STYLES) {
      const sc = sceneForStyle(id, { base: videoStyleBase(id), tracks: {} }, { enabled: videoStyleKeyboard(id) });
      const url = styleThumbnail(id, sc, loaded.ast, pkey, 240);
      if (url) out[id] = url;
    }
    for (const u of userPresets) { const url = styleThumbnail(u.id, u.scene, loaded.ast, pkey, 240); if (url) out[u.id] = url; }
    return out;
  }, [loaded, pkey, fonts, userPresets]);

  // T-02: chọn tệp mới khi tệp cũ đang parse -> chỉ kết quả của lần chọn mới nhất được áp dụng; busy chỉ tắt khi lần mới nhất xong.
  const gate = useRef(createLatestGate()).current;
  // `opts.keep`: phân tích lại cùng dự án vì đổi tempo/schema: giữ nguyên tài liệu (ẩn/solo, độ sáng, âm thanh, lịch sử), id track không đổi.
  // Không có `opts` (chọn tệp mới) thì xoá ghi đè tempo và schema của dự án cũ.
  const [tempo, setTempo] = useState<{ override: TempoOverride; draft: TempoDraft } | null>(null);
  const [schemas, setSchemas] = useState<{ name: string; schema: object }[]>([]);
  const [needsSchema, setNeedsSchema] = useState(false);
  const load = useCallback(async ({ main, extras }: Picked, opts?: { keep?: boolean; tempo?: TempoOverride | null; schemas?: { name: string; schema: object }[]; restore?: (ast: UnifiedProjectAST) => void }) => {
    const ticket = gate.begin();
    setBusy(true); setFailure(null); setSource({ main, extras }); setNeedsSchema(false);
    let ok = false;
    const sch = opts?.schemas ?? [];
    if (!opts) { setTempo(null); setSchemas([]); }
    try {
      const files: Record<string, ArrayBuffer> = {};
      for (const f of extras) files[f.name] = await f.arrayBuffer();
      const r = await parseInWorker({ name: main.name, buffer: await main.arrayBuffer(), files, ...(opts?.tempo != null ? { tempoOverride: opts.tempo } : {}), ...(sch.length ? { schemas: sch.map((x) => x.schema) } : {}) });
      if (!gate.isLatest(ticket)) return false;
      setLoaded({ name: main.name, ast: r.ast, warnings: r.warnings, format: r.format, ms: r.ms }); setMidi(r.midi);
      ok = true;
      if (opts?.keep) return true;
      // Nạp dự án mới: lịch sử hoàn tác bắt đầu trống (id track đổi nên lệnh cũ hết nghĩa). Scene và thiết lập đã lưu giữ nguyên trong store.
      dropAudio();
      if (opts?.restore) opts.restore(r.ast);
      // Track tắt tiếng trong DAW (isVisible=false) bắt đầu ở trạng thái ẩn; bật mắt ở bảng Track để hiện (T-50, REQ-UI-12).
      else store.reset({ ...store.get(), audioOffsetMs: 0, brightness: Object.fromEntries(r.ast.tracks.map((t) => [t.id, { ...DEFAULT_BRIGHTNESS } as BrightnessConfig])), order: r.ast.tracks.map((t) => t.id), hidden: r.ast.tracks.filter((t) => !t.isVisible).map((t) => t.id), solo: [] });
      setTrackLocks(new Set());
      playback.reset(r.ast.meta.totalDurationSeconds);
      setTab('preview');
    } catch (e) {
      if (!gate.isLatest(ticket)) return false;
      // Nạp lỗi khi đang mở một dự án: giữ dự án đó (không mất ẩn/hiện, solo, thứ tự), chỉ báo lỗi phía trên sân khấu.
      const f = e as ParseFailure; setMidi(f.midi);
      setFailure({ code: f.code ?? 'ERR_UNKNOWN', message: f.message, details: f.details });
      // Đuôi lạ hoặc nhị phân chưa hỗ trợ: mời nạp schema (probeProject.needs.schema). Lỗi từ chính schema đã nạp thì vẫn để người dùng đổi schema.
      setNeedsSchema(f.code === 'ERR_UNSUPPORTED_FORMAT' || f.code === 'ERR_SCHEMA_INVALID' || sch.length > 0);
      setLoaded((prev) => { if (!prev) playback.reset(0); return prev; });
    } finally { if (gate.isLatest(ticket)) setBusy(false); }
    return ok;
  }, [gate, playback, store, dropAudio]);
  const onPick = useCallback((p: Picked) => { void load(p); }, [load]);
  const reparse = useCallback((next: { tempo?: { override: TempoOverride; draft: TempoDraft } | null; schemas?: { name: string; schema: object }[] }) => {
    if (!source) return;
    const t = next.tempo === undefined ? tempo : next.tempo, sc = next.schemas ?? schemas;
    setTempo(t); setSchemas(sc);
    void load(source, { keep: !!loaded, tempo: t?.override ?? null, schemas: sc });
  }, [source, tempo, schemas, loaded, load]);

  // ── Phiên làm việc (T-10): tự lưu IndexedDB (REQ-STORAGE-01), mở lại phiên, Project Pack (REQ-STORAGE-03) ──
  const [sessionProblems, setSessionProblems] = useState<Problem[]>([]);
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' });
  const [missingFiles, setMissingFiles] = useState<string[]>([]);
  const backend = useMemo<Backend | null>(() => (typeof indexedDB === 'undefined' ? null : lazyDexieBackend()), []);
  const saver = useMemo(() => (backend ? createSaver(backend) : null), [backend]);
  const parts: SessionParts | null = useMemo(() => (loaded && source ? {
    title: loaded.ast.meta.title || loaded.name, source: source.main, extras: source.extras, schemas, tempo, scene: doc.scene,
    workspace: toWorkspaceJson(doc, tempo?.draft), audio: audioFile, audioOffsetMs: doc.audioOffsetMs, background: bgFile, assets: assets.map((a) => ({ meta: a.meta, file: a.file })),
  } : null), [loaded, source, schemas, tempo, doc, audioFile, bgFile, assets]);
  const debounced = useRef<ReturnType<typeof createDebounced<SessionParts>> | null>(null);
  useEffect(() => {
    if (!saver) return;
    const d = createDebounced<SessionParts>(async (p) => {
      try {
        const est = await navigator.storage?.estimate?.().catch(() => null);
        const r = await saver.save(await snapshotOf(p), est);
        setSaveState(r.ok ? (r.degraded ? { kind: 'degraded' } : { kind: 'saved', at: Date.now() }) : { kind: 'failed' });
      } catch { setSaveState({ kind: 'failed' }); }
    }, AUTOSAVE_DELAY_MS);
    debounced.current = d;
    return () => { void d.flush(); debounced.current = null; };
  }, [saver]);
  useEffect(() => { if (parts) debounced.current?.push(parts); }, [parts]);

  const openSession = useCallback(async (s: SessionData) => {
    setSessionProblems([]);
    setTempo(s.tempo); setSchemas(s.schemas);
    const ok = await load({ main: s.source, extras: s.extras }, { tempo: s.tempo?.override ?? null, schemas: s.schemas, restore: (ast) => {
      try {
        const a = applyWorkspace(store.get(), s.scene, s.workspace, ast.tracks.map((t) => t.id));
        store.reset(a.doc);
        setPresetProblems(a.warnings.map((w) => describeProblem(i18n, 'warning', w.code, w.message, w.details as Record<string, unknown>)));
        setPresetOpened(null);
      } catch (e) {
        const f = e as { code?: string; message?: string; details?: Record<string, unknown> };
        setSessionProblems([describeProblem(i18n, 'error', f.code?.startsWith('ERR_') ? f.code : 'ERR_PRESET_INVALID', f.message, f.details)]);
      }
    } });
    if (ok && s.audio) { await onLoadAudio(s.audio.file); }
    if (ok && s.background) { await onBackground(s.background); }
    if (ok) for (const f of s.assets ?? []) await addAsset(f).catch(() => { /* tài nguyên hỏng: bỏ, widget dùng nó báo thiếu ở pre-flight */ });
    return ok;
  }, [load, store, i18n, onLoadAudio, onBackground, addAsset]);

  // openSession đổi theo ngôn ngữ (i18n): giữ bản mới nhất trong ref để hiệu ứng khôi phục chỉ chạy một lần.
  const openRef = useRef(openSession); openRef.current = openSession;
  // Mở lại trang: dựng lại phiên từ kho nếu còn tệp dự án; thiếu Blob thì nêu tệp cần nạp lại. AST không lưu: luôn parse lại từ nguồn.
  useEffect(() => {
    if (!backend) return;
    let live = true;
    void (async () => {
      const r = await restoreWorkspace(backend);
      if (!live || !r) return;
      const src = r.blobs.find((b) => b.id === 'source');
      setMissingFiles(r.missing.map((m) => m.name));
      if (!src) return;
      const file = (b: { name: string; data: Uint8Array }) => new File([b.data.slice().buffer as ArrayBuffer], b.name);
      const ws = (r.state.workspace ?? {}) as { schemas?: unknown; tempoDraft?: unknown };
      const schemasIn = (Array.isArray(ws.schemas) ? ws.schemas : []).filter((x): x is { name: string; schema: object } => !!x && typeof (x as { schema?: unknown }).schema === 'object' && (x as { schema?: unknown }).schema !== null).slice(0, 8);
      const audioBlob = r.blobs.find((b) => b.id === 'audio'), bgBlob = r.blobs.find((b) => b.id === 'background');
      await openRef.current({
        source: file(src), extras: r.blobs.filter((b) => b.id.startsWith('extra:')).map(file), schemas: schemasIn,
        tempo: r.state.tempoOverride !== undefined ? { override: r.state.tempoOverride, draft: sanitizeDraft(ws.tempoDraft) } : null,
        scene: r.state.scene, workspace: r.state.workspace, ...(audioBlob ? { audio: { file: file(audioBlob), offsetMs: r.state.audioOffsetMs } } : {}), ...(bgBlob ? { background: file(bgBlob) } : {}),
        assets: r.blobs.filter((b) => b.id.startsWith('asset:')).map(file),
      });
    })().catch(() => { /* kho hỏng hoặc bị chặn: dùng như phiên mới */ });
    return () => { live = false; };
  }, [backend]);

  const onSavePack = useCallback(async () => { if (parts) downloadBytes(await packOf(parts, new Date()), `${presetFileName(parts.title).replace(/\.json$/, '')}.dawviz.zip`); }, [parts]);
  const onOpenPack = useCallback(async (file: File) => {
    try {
      if (file.size > PACK_LIMITS.maxFileBytes) throw new PackError('ERR_ARCHIVE_TOO_LARGE', `${file.size} > ${PACK_LIMITS.maxFileBytes}`);
      const { data, warnings } = await sessionFromPack(new Uint8Array(await file.arrayBuffer()));
      const ok = await openSession(data);
      if (ok) setSessionProblems((p) => [...p, ...warnings.map((w) => describeProblem(i18n, 'warning', w.code, w.message, w.details))]);
    } catch (e) {
      const f = e as { code?: string; message?: string; details?: Record<string, unknown> };
      setSessionProblems([describeProblem(i18n, 'error', f.code?.startsWith('ERR_') ? f.code : 'ERR_PACK_INVALID', f.message, f.details)]);
    }
  }, [openSession, i18n]);
  const onDiscard = useCallback(async () => { try { await backend?.clear(); saver?.reset(); setSaveState({ kind: 'idle' }); setMissingFiles([]); } catch { /* không xoá được: bỏ qua */ } }, [backend, saver]);
  // Dự án mẫu đi kèm bản demo (tự tạo, công khai): để người xem thử ngay không cần có sẵn tệp DAW.
  const onSample = useCallback(async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}samples/demo.rpp`);
      if (!res.ok) throw new Error(String(res.status));
      await onPick({ main: new File([await res.blob()], 'demo.rpp'), extras: [] });
    } catch { setFailure({ code: 'ERR_UNKNOWN', message: 'sample unavailable' }); }
  }, [onPick]);

  const midiLevel = missingMidiLevel(midi, !!failure);
  const addMidi = useCallback((files: File[]) => { if (source) void load({ main: source.main, extras: mergeExtras(source.extras, files) }, { tempo: tempo?.override ?? null, schemas }); }, [source, load, tempo, schemas]);

  const [presetProblems, setPresetProblems] = useState<Problem[]>([]);
  const [presetOpened, setPresetOpened] = useState<string | null>(null);
  const problems: Problem[] = useMemo(() => {
    const out: Problem[] = [];
    // Bảng "thiếu .mid" đã nói rõ hơn: không lặp lại cảnh báo từng item và lỗi "không có nốt" do thiếu tệp.
    const covered = (code: string) => !!midi?.missing.length && (code === 'WARN_RPP_EXTERNAL_MIDI' || code === 'ERR_NO_NOTES');
    if (failure && !covered(failure.code)) {
      const p = describeProblem(i18n, 'error', failure.code, failure.message, failure.details);
      out.push(loaded ? { ...p, text: `${i18n.t('web.failedKeep')} ${p.text}` } : p);
    }
    out.push(...presetProblems, ...sessionProblems);
    if (audioError) out.push(describeProblem(i18n, 'error', audioError.code, audioError.message, audioError.details));
    if (audio && loaded) {
      const c = audioLengthCheck(audio.durationSec, duration, offsetMs / 1000);
      if (c.kind !== 'ok') out.push(describeProblem(i18n, 'warning', 'WARN_AUDIO_LENGTH', undefined, {
        audio: formatClock(audio.durationSec), project: formatClock(duration), ratio: i18n.number(c.ratio, { maximumFractionDigits: 3 }),
        hint: i18n.t(`web.audio.lenHint.${c.kind}`),
      }));
    }
    for (const w of loaded?.warnings ?? []) if (!covered(w.code)) out.push(describeProblem(i18n, 'warning', w.code, w.message, w.details));
    return out;
  }, [failure, loaded, i18n, midi, presetProblems, sessionProblems, audioError, audio, duration, offsetMs]);

  const patchBrightness = useCallback((id: string, patch: Partial<BrightnessConfig>) => run((d) => {
    if (locksRef.current.has(id)) return null; // track đang khoá
    // Một trường được sửa thì giữ trường đó, đẩy trường đối diện (sàn/trần dB, min/max độ sáng).
    const keys = Object.keys(patch) as (keyof BrightnessConfig)[];
    return Cmds.patchBrightness(d, id, sanitizeBrightness({ ...d.brightness[id], ...patch }, keys.length === 1 ? keys[0] : undefined));
  }), [run]);
  const patchTrackStyle = useCallback((id: string, patch: Partial<NoteStyle> | null) => prun((d) => (locksRef.current.has(id) ? null : Cmds.patchTrackStyle(d, id, patch))), [prun]);
  // Đổi phong cách là một lệnh hoàn tác được. Nếu nó làm mất chỉnh tay (kiểu nốt hoặc bố cục) thì báo nhỏ, không chặn, cho tới khi tài liệu đổi tiếp.
  const shortcuts = useMemo(() => shortcutLabels(), []);
  // Nhãn lịch sử dựng lúc hiển thị (đổi ngôn ngữ thì đổi theo) và thông báo cho trình đọc màn hình sau mỗi lần hoàn tác/làm lại/nhảy bước.
  const widgetName = useWidgetNames(doc.scene.widgets);
  const labelCtx: LabelCtx = useMemo(() => ({ i18n, trackName: (id) => loaded?.ast.tracks.find((t) => t.id === id)?.name ?? id, widgetName }), [i18n, loaded, widgetName]);
  const stepLabel = useCallback((h: History<Doc>, position: number) => (position <= 0 ? i18n.t('web.hist.origin') : describeCommand(h.timeline[position - 1], labelCtx)), [i18n, labelCtx]);
  const [announce, setAnnounce] = useState({ n: 0, text: '' });
  const say = useCallback((text: string) => setAnnounce((a) => ({ n: a.n + 1, text })), []);
  const doUndo = useCallback(() => {
    const h = store.state().history; if (!h.canUndo) return;
    store.undo(); say(i18n.t('web.history.undone', { label: stepLabel(h, h.position) }));
  }, [store, i18n, stepLabel, say]);
  const doRedo = useCallback(() => {
    const h = store.state().history; if (!h.canRedo) return;
    store.redo(); say(i18n.t('web.history.redone', { label: describeCommand(h.timeline[h.position], labelCtx) }));
  }, [store, i18n, labelCtx, say]);
  const doJump = useCallback((position: number) => {
    store.jumpTo(position); say(i18n.t('web.history.arrived', { label: stepLabel(store.state().history, position) }));
  }, [store, i18n, stepLabel, say]);
  useEffect(() => bindUndoKeys(window, { undo: doUndo, redo: doRedo }), [doUndo, doRedo]);
  // Mỗi ô (phong cách dựng sẵn hoặc preset của người dùng) giữ bản chỉnh dở của riêng nó: rời ô thì cất bản đang chỉnh, trở lại thì lấy ra.
  // Muốn về nguyên gốc thì bấm × trên ô. Chỉ lưu trong phiên (kiểu nốt và bàn phím của phong cách đang chọn vẫn nhớ theo trình duyệt như trước).
  const [working, setWorking] = useState<Record<string, SceneDocument>>(() => loadWorkspaceStyles((t) => VIDEO_STYLES.includes(t) || loadUserPresets().some((u) => u.id === t)).working);
  // Nhớ theo trình duyệt (gộp ghi 400 ms để kéo ô số không ghi liên tục): các ô đã chỉnh dở và ô đang chọn kèm scene hiện tại.
  useEffect(() => {
    const id = setTimeout(() => saveWorkspaceStyles({ working, active: tileId ? { tile: tileId, scene } : null }), 400);
    return () => clearTimeout(id);
  }, [working, tileId, scene]);
  const originalOf = (tile: string): SceneDocument | undefined => (VIDEO_STYLES.includes(tile) ? pristineScene(tile) : userPresets.find((x) => x.id === tile)?.scene);
  const sameEdit = (tile: string, a: SceneDocument, b: SceneDocument) => JSON.stringify(VIDEO_STYLES.includes(tile) ? withoutTrackOverrides(a) : a) === JSON.stringify(VIDEO_STYLES.includes(tile) ? withoutTrackOverrides(b) : b);
  const stashCurrent = () => {
    if (!tileId) return;
    const orig = originalOf(tileId), cur = store.get().scene;
    if (!orig) return;
    setWorking((w) => { const n = { ...w }; if (sameEdit(tileId, cur, orig)) delete n[tileId]; else n[tileId] = cur; return n; });
  };
  const takeWorking = (tile: string) => { const w = working[tile]; if (w) setWorking((x) => { const n = { ...x }; delete n[tile]; return n; }); return w; };
  // Precomp tại vạch phát (D-69): scene gốc có lớp COMP đang hiện ở vạch phát thì ô phong cách/preset áp vào nội dung precomp trên cùng đó,
  // không thay cả scene. Không có precomp nào ở vạch phát thì áp cả scene như trước.
  const compAtPlayhead = (): { comp: string; name: string } | null => {
    const sc = store.get().scene; if (!sc.comps) return null;
    const t = playback.get().t, dur = index?.duration ?? 0;
    const hit = sc.widgets.map((w, i) => ({ w, i })).filter(({ w }) => compOf(w) && w.visible && visibilityAlpha(w.visibility, t, dur) > 0)
      .sort((a, b) => a.w.zIndex - b.w.zIndex || a.i - b.i).at(-1)?.w;
    const c = hit && compOf(hit); const spec = c && sc.comps[c.comp];
    return c && spec ? { comp: c.comp, name: hit!.name ?? spec.name } : null;
  };
  const applyToComp = (src: SceneDocument): boolean => {
    const at = compAtPlayhead(); if (!at) return false;
    run((d) => Cmds.applySceneToComp(d, at.comp, src)); say(i18n.t('web.comp.styleApplied', { name: at.name }));
    return true;
  };
  const pickVideoStyle = (id: string) => {
    if (applyToComp(sceneForStyle(id, { base: videoStyleBase(id), tracks: pianoOf(store.get().scene)?.properties.noteStyle.tracks ?? {} }, {}))) return;
    if (id === tileId) return;
    stashCurrent(); setActiveUser(null);
    store.dispatch(Cmds.setVideoStyle(store.get(), id, takeWorking(id)));
  };
  const pickNotePreset = (id: string) => run((d) => Cmds.applyNotePreset(d, noteStylePreset(id), id));

  // Preset .json: mở = một bước hoàn tác; cảnh báo WARN_PRESET_* và lỗi hiện cho người dùng (REQ-STORAGE-02).
  const onOpenPreset = useCallback(async (file: File) => {
    try {
      if (/\.zip$/i.test(file.name)) { await openPresetPack(file); return; }
      const r = await readPresetFile(file);
      stashCurrent();
      const added = addUserPreset(userPresets, r.scene.presetName || r.fileName.replace(/\.json$/i, ''), r.scene);
      setUserPresets(added.list); setActiveUser(added.preset.id);
      run((d) => Cmds.loadPreset(d, added.preset.scene));
      setPresetProblems(r.warnings.map((w) => describeProblem(i18n, 'warning', w.code, w.message, w.details as Record<string, unknown>)));
      setPresetOpened(r.scene.presetName || r.fileName);
    } catch (e) {
      const f = e as { code?: string; message?: string; details?: Record<string, unknown> };
      setPresetProblems([describeProblem(i18n, 'error', f.code?.startsWith('ERR_') ? f.code : 'ERR_PRESET_INVALID', f.message, f.details)]); setPresetOpened(null);
    }
  }, [run, i18n, userPresets, tileId, working]);
  // Gói .dawviz-preset.zip (T-24): tài nguyên vào phiên trước, rồi áp theo loại; luôn ghi "chưa kiểm duyệt".
  const [pendingCollection, setPendingCollection] = useState<{ plan: ReturnType<typeof planCollectionImport>; warn: Problem[]; name: string } | null>(null);
  const finishCollection = (plan: ReturnType<typeof planCollectionImport>, choices: Record<string, 'overwrite' | 'rename'>, name: string) => {
    const r = applyCollectionImport(userPresets, plan, choices);
    setUserPresets(r.list); setPendingCollection(null);
    setPresetOpened(null); setPresetStatus(i18n.t('web.collection.imported', { added: r.added.length, over: r.overwritten.length, same: plan.same }));
    void name;
  };
  // Bộ preset (T-111, D-66): thêm cả bộ vào cột Phong cách, KHÔNG áp lên bài. Trùng tên khác nội dung thì hỏi ghi đè hoặc đổi tên.
  const openCollection = async (bytes: Uint8Array) => {
    const r = await readCollectionPack(bytes);
    for (const a of r.assets) await addAsset(new File([a.bytes.slice().buffer as ArrayBuffer], a.name)).catch(() => { /* tài nguyên hỏng: pre-flight báo thiếu */ });
    const warn = r.warnings.map((w) => describeProblem(i18n, 'warning', w.code, w.message, w.details as Record<string, unknown>));
    const plan = planCollectionImport(userPresets, r.items);
    setPresetProblems(warn);
    if (plan.conflicts.length) { setPendingCollection({ plan, warn, name: r.info.name }); return; }
    finishCollection(plan, {}, r.info.name);
  };
  const openPresetPack = async (file: File) => {
    const bytes = await bytesOf(file);
    let r: Awaited<ReturnType<typeof readPresetPack>>;
    try { r = await readPresetPack(bytes); }
    catch (e) { if (e instanceof PresetPackError && e.details?.kind === 'collection') { await openCollection(bytes); return; } throw e; }
    for (const a of r.assets) await addAsset(new File([a.bytes.slice().buffer as ArrayBuffer], a.name)).catch(() => { /* tài nguyên hỏng: pre-flight báo thiếu */ });
    const warn = r.warnings.map((w) => describeProblem(i18n, 'warning', w.code, w.message, w.details as Record<string, unknown>));
    const p = r.payload;
    if (p.kind === 'scene') {
      stashCurrent();
      const added = addUserPreset(userPresets, r.info.name, { ...p.scene, presetName: r.info.name, author: r.info.author });
      setUserPresets(added.list); setActiveUser(added.preset.id);
      run((d) => Cmds.loadPreset(d, added.preset.scene));
      setPresetProblems(warn); setPresetOpened(null); setPresetStatus(i18n.t('web.preset.openedUnreviewed', { name: r.info.name }));
    } else if (p.kind === 'note-style') {
      prun((d) => { const pr = Cmds.pianoOf(d.scene); return pr ? Cmds.applyNotePreset(d, { ...pr.properties.noteStyle.base, ...p.style }) : null; });
      setPresetProblems([]); setPresetOpened(null); setPresetStatus(i18n.t('web.preset.noteStyleApplied', { name: r.info.name }));
    } else if (p.kind === 'easing') {
      try { localStorage.setItem(EASE_LIBRARY_KEY, JSON.stringify(addSavedEase(parseEaseLibrary(localStorage.getItem(EASE_LIBRARY_KEY)), r.info.name, p.bezier))); } catch { /* bộ nhớ bị chặn */ }
      setPresetProblems([]); setPresetOpened(null); setPresetStatus(i18n.t('web.preset.easingAdded', { name: r.info.name }));
    } else {
      run((d) => { const w = createWidget(d.scene, 'PARTICLES'); return Cmds.addWidget(d, { ...w, properties: { ...(w.properties as object), ...p.properties }, name: r.info.name.slice(0, 60) }); });
      setPresetProblems([]); setPresetOpened(null); setPresetStatus(i18n.t('web.preset.particleAdded', { name: r.info.name }));
    }
  };
  // "Chia sẻ thành preset" (T-24): khung hiện tại + ảnh widget Ảnh dùng + phông người dùng mà chữ dùng.
  const onSharePreset = async (info: { name: string; author: string; license: string; description: string }) => {
    const sc = store.get().scene, json = JSON.stringify(sc), used = new Set(referencedAssets(sc));
    const files = assetsRef.current.filter((a) => used.has(a.meta.id) || (a.meta.family && json.includes(JSON.stringify(a.meta.family))));
    const bytes = await buildPresetPack(info, { kind: 'scene', scene: { ...sc, presetName: info.name.trim().slice(0, 60) } }, await Promise.all(files.map(async (a) => ({ name: a.meta.name, bytes: await bytesOf(a.file) }))));
    downloadBytes(bytes, packFileName(info.name));
  };
  const [presetStatus, setPresetStatus] = useState<string | null>(null);
  const onPickUserPreset = (id: string) => {
    const pr = userPresets.find((x) => x.id === id); if (!pr) return;
    if (applyToComp(pr.scene)) return;
    if (id === tileId) return;
    stashCurrent(); setActiveUser(id); setPresetProblems([]); setPresetOpened(null);
    const w = takeWorking(id);
    run((d) => Cmds.loadPreset(d, pr.scene, w));
  };
  const onRevert = (id: string) => {
    setWorking((w) => { const n = { ...w }; delete n[id]; return n; });
    if (id !== tileId) return;
    if (VIDEO_STYLES.includes(id)) store.dispatch(Cmds.setVideoStyle(store.get(), id));
    else { const pr = userPresets.find((x) => x.id === id); if (pr) run((d) => Cmds.loadPreset(d, pr.scene)); }
  };
  // Nhân bản thành preset mới từ bản đang thấy của ô (kể cả phần đã chỉnh). Ô nguồn về nguyên gốc, phần chỉnh chuyển sang ô mới; ô nguồn đang chọn thì ô mới được chọn thay.
  const onDuplicate = (id: string) => {
    const src = userPresets.find((x) => x.id === id);
    const sc = (id === tileId ? store.get().scene : working[id]) ?? originalOf(id); if (!sc) return;
    const base = src ? src.name : i18n.t(`web.style.video.${id}`);
    const added = addUserPreset(userPresets, i18n.t('web.preset.copyName', { name: base }), sc);
    setUserPresets(added.list);
    setWorking((w) => { const n = { ...w }; delete n[id]; return n; });
    if (id === tileId) { setActiveUser(added.preset.id); setPresetProblems([]); setPresetOpened(added.preset.name); run((d) => Cmds.loadPreset(d, added.preset.scene)); }
  };
  const onDownloadTile = (id: string) => {
    const pr = userPresets.find((x) => x.id === id);
    const sc = (id === tileId ? store.get().scene : working[id]) ?? originalOf(id); if (!sc) return;
    downloadPreset({ ...sc, presetName: pr ? pr.name : i18n.t(`web.style.video.${id}`) });
  };
  // "Xuất bộ preset" (T-111): các preset đã lưu được chọn + ảnh/phông mà chúng dùng; không kèm mốc thời gian, không kèm tệp DAW.
  const onExportCollection = async (info: { name: string; author: string; license: string; description: string }, ids: string[]) => {
    const picked = ids.map((id) => userPresets.find((x) => x.id === id)).filter((x): x is UserPreset => !!x);
    const scenes = picked.map((u) => ({ ...(u.id === activeUser && tileId === CUSTOM_STYLE ? store.get().scene : working[u.id] ?? u.scene), presetName: u.name }));
    const json = JSON.stringify(scenes), used = new Set(scenes.flatMap((sc) => referencedAssets(sc)));
    const files = assetsRef.current.filter((a) => used.has(a.meta.id) || (a.meta.family && json.includes(JSON.stringify(a.meta.family))));
    const assets = await Promise.all(files.map(async (a) => ({ name: a.meta.name, bytes: await bytesOf(a.file) })));
    const bytes = picked.length === 1
      ? await buildPresetPack(info, { kind: 'scene', scene: { ...scenes[0], presetName: info.name.trim().slice(0, 60) } }, assets)
      : await buildCollectionPack(info, picked.map((u, i) => ({ name: u.name, description: '', scene: scenes[i] })), assets);
    downloadBytes(bytes, packFileName(info.name));
  };
  const onDeleteUserPreset = (id: string) => { setUserPresets((l) => removeUserPreset(l, id)); setActiveUser((a) => (a === id ? null : a)); setWorking((w) => { const n = { ...w }; delete n[id]; return n; }); };

  // Phím tắt kiểu DAW (Space phát/dừng, Home về đầu) ở thẻ Preview. Space chỉ thuộc về thanh phát khi nút/radio đang focus
  // do chuột; focus do bàn phím thì Space bấm nút như chuẩn; ô gõ chữ giữ nguyên (lib/transportKeys.ts).
  useEffect(() => (tab !== 'settings' && loaded ? bindTransportKeys(window, playback) : undefined), [tab, loaded, playback]);
  const editorActions: EditorActions = useMemo(() => ({
    layouts: (p) => erun((d) => Cmds.patchLayouts(d, p)),
    aspect: (a) => run((d) => Cmds.setAspect(d, a)),
    canvasSize: (w, h) => run((d) => Cmds.setCanvasSize(d, w, h)),
    visible: (id, v) => erun((d) => Cmds.setWidgetVisible(d, id, v)),
    parent: (id, p) => erun((d) => Cmds.setWidgetParent(d, id, p)),
    paintVisible: (id, v) => erun((d) => Cmds.paintWidgetVisible(d, id, v)),
    rename: (id, name) => erun((d) => Cmds.renameWidget(d, id, name)),
    allVisible: () => erun((d) => Cmds.toggleAllWidgetsVisible(d)),
    z: (id, where) => erun((d) => Cmds.reorderZ(d, id, where)),
    moveLayer: (id, to) => erun((d) => Cmds.moveLayer(d, id, to)),
    snapping: (p) => run((d) => Cmds.patchSnapping(d, p)),
    animate: (id, path, v, key) => erun((d) => Cmds.setWidgetAnimate(d, id, path, v, key)),
    animEdit: (edits, key) => erun((d) => Cmds.editWidgetAnimation(d, edits, key)),
    motion: (id, v, key) => erun((d) => Cmds.setWidgetMotion(d, id, v, key)),
    visibility: (id, v, key) => erun((d) => Cmds.setWidgetVisibility(d, id, v, key)),
    phases: (list, key) => run((d) => Cmds.setPhases(d, list, key)),
    tonic: (t) => run((d) => Cmds.setTonic(d, t)),
    noteNaming: (n) => run((d) => Cmds.setNoteNaming(d, n)),
    background: { pick: (f) => void onBackground(f), remove: dropBackground, spec: (p) => run((d) => Cmds.setBackgroundSpec(d, p)) },
    add: (type) => { const w = createWidget(eget().scene, type); erun((d) => Cmds.addWidget(d, w)); return w.id; },
    duplicate: (ids) => {
      let sc = eget().scene; const out: WidgetSpec[] = [], from: string[] = [];
      let comps: Record<string, CompSpec> = {};
      for (const id of ids) {
        const w = sc.widgets.find((x) => x.id === id); if (!w) continue;
        let c = duplicateWidget(sc, w);
        // Ctrl+D trên lớp precomp: bản ĐỘC LẬP (T-122), sao chép cả precomp và các precomp bên trong; vượt số precomp tối đa thì bỏ qua lớp đó.
        const src = compOf(w);
        if (src) {
          const k = cloneCompTree(sc, src.comp); if (!k) continue;
          comps = { ...comps, ...k.comps }; c = { ...c, properties: { ...(c.properties as CompProps), comp: k.root } };
          sc = { ...sc, comps: { ...(sc.comps ?? {}), ...k.comps } };
        }
        out.push(c); from.push(id); sc = { ...sc, widgets: [...sc.widgets, c] };
      }
      const d0 = eget(), refs: Record<string, Record<string, unknown>> = {};
      from.forEach((id, i) => { const src = d0.scene.widgets.find((x) => x.id === id); if (src && out[i]) refs[out[i].id] = d0.propsRef[id] ?? widgetDefaults(src.type); });
      erun((d) => Cmds.addWidgets(d, out, refs, comps)); return out.map((w) => w.id);
    },
    remove: (ids) => erun((d) => Cmds.removeWidgets(d, ids)),
    // Timeline lớp và precomp (D-69): khung nhìn đang mở; cỡ khung, phase, bắt dính... luôn là của scene gốc (run).
    layers: (kind, next, key) => erun((d) => Cmds.setLayers(d, kind, next, key)),
    renameComp: (comp, name) => run((d) => Cmds.renameComp(d, comp, name)),
    view: eget,
  }), [run, erun, eget, onBackground, dropBackground]);

  // Lane automation có trong dự án (nguồn phát sáng "automation", REQ-GRAPHICS-17).
  const laneChoices = useMemo(() => projectLanes(loaded?.ast.tracks ?? []), [loaded]);
  const lanes = useMemo(() => laneChoices.map((l) => l.id), [laneChoices]);

  // REQ-UI-13: ở Cơ bản, mục có phần nâng cao có nút "Thêm tuỳ chọn" (nhớ theo mục); chấm báo khi phần ẩn đang khác mặc định.
  // Tham chiếu của "đã chỉnh" và nút ↺: kiểu nốt của bộ dựng sẵn áp gần nhất (D-57).
  const ref = doc.lookRef;
  const lookEdited = ADVANCED_STYLE_KEYS.some((k) => style.base[k] !== ref[k]);
  const playheadRef = useMemo(() => (doc.videoStyle === CUSTOM_STYLE ? undefined : pianoOf(sceneForStyle(doc.videoStyle, { base: videoStyleBase(doc.videoStyle), tracks: {} }))?.properties.playheadPositionRatio), [doc.videoStyle]);
  const tracksEdited = Object.values(brightness).some((c) => c.source !== 'off') || (!!loaded && doc.order.some((id, i) => loaded.ast.tracks[i]?.id !== id));
  const more = (id: string, edited: boolean) => advanced ? undefined : {
    open: !!ui.more[id], edited, onToggle: () => setUi((u) => ({ ...u, more: { ...u.more, [id]: !u.more[id] } })),
  };
  const showAdv = (id: string) => advanced || !!ui.more[id] || searching; // đang tìm: hiện cả phần nâng cao để tìm thấy

  // Làn Nhạc của timeline Editor (T-127): cùng track, cùng lệnh với danh sách Track ở trên (một chỗ lưu, hai chỗ sửa).
  const trackEdit = useMemo(() => (loaded ? { tracks: ordered, view, overrides: style.tracks, onMove, onToggleHidden, onToggleSolo, onStyle: patchTrackStyle } : undefined),
    [loaded, ordered, view, style.tracks, onMove, onToggleHidden, onToggleSolo, patchTrackStyle]);
  const trackProps = loaded && {
    tracks: ordered, config: brightness, overrides: style.tracks, onChange: patchBrightness, onStyle: patchTrackStyle,
    playback, tempoMap: loaded.ast.tempoMap, layout: trackLayout, advanced: showAdv('tracks'), view,
    onToggleHidden, onToggleSolo, onMove, onToggleAllHidden, onClearSolo, onPaint, gesture, locked: trackLocks,
  };
  const tempoSource = (loaded?.ast.meta.tempoSource ?? 'file');
  const tempoText = (() => {
    const bpms = loaded?.ast.tempoMap.map((p) => p.bpm) ?? [];
    if (!bpms.length) return i18n.t('web.stage.noTempo');
    const f = (v: number) => i18n.number(v, { maximumFractionDigits: 2 });
    const lo = Math.min(...bpms), hi = Math.max(...bpms);
    const txt = lo === hi ? i18n.t('web.song.tempo.one', { bpm: f(lo) }) : i18n.t('web.song.tempo.range', { min: f(lo), max: f(hi) });
    return tempoSource === 'user' ? i18n.t('web.song.tempo.user', { tempo: txt }) : txt;
  })();

  // Chiều rộng khung xem trước theo chỗ còn lại thật trong vùng cuộn giữa (lib/useStageWidth.ts).
  const scrollerRef = useRef<HTMLDivElement>(null), stageRef = useRef<HTMLDivElement>(null);
  const pv = usePanelLayout(advanced, 'preview');
  usePanelShortcuts(pv, tab === 'preview' && !!loaded, false);
  const stageWidth = useStageWidth(scrollerRef, stageRef, {
    aspect: scene.canvas.designWidth / scene.canvas.designHeight,
    chrome: ui.proofFrame ? STAGE_CHROME.proof : STAGE_CHROME.plain, extra: 0, active: !!loaded,
  });
  const aboveStage = !!(midi && midiLevel) || problems.length > 0;
  const styleLabel = doc.videoStyle === CUSTOM_STYLE ? scene.presetName : `${i18n.t(`web.style.video.${doc.videoStyle}`)}${styleEdited ? ` (${i18n.t('web.styles.edited')})` : ''}`;

  // Inspector của Preview: Bài, Track (D-57). Mục Hình thức chỉ còn ở bảng Thuộc tính của Editor khi chọn Piano Roll
  // (chủ dự án chốt 2026-11-14): Preview giữ phong cách video, bài và track để chỉnh nhanh.
  // Các mục sau chỉ có ở bảng Thuộc tính của Editor: làm việc trên khung nhìn của precomp đang mở (edoc/erun, D-69).
  const epiano = pianoOf(edoc.scene);
  const estyle: StyleConfig = epiano?.properties.noteStyle ?? defaultStyleConfig();
  const ekeyboard: KeyboardStyle = epiano?.properties.keyboard ?? { ...DEFAULT_KEYBOARD_STYLE };
  const elookEdited = ADVANCED_STYLE_KEYS.some((k) => estyle.base[k] !== ref[k]);
  const epianoRef = epiano ? (edoc.propsRef[epiano.id] as Record<string, unknown> | undefined) : undefined;
  const lookSection = (n: number) => (
    <InspectorSection key="look" n={n} id="look" title={i18n.t('web.section.look')} more={more('look', elookEdited)}>
      {epiano
        ? <StylePanel style={estyle} keyboard={ekeyboard} onStyle={(n2) => erun((d) => Cmds.patchNoteStyle(d, n2.base))} onKeyboard={(n2) => erun((d) => Cmds.patchKeyboard(d, n2))} lanes={lanes} laneInfo={laneChoices} advanced={showAdv('look')} notePresets={NOTE_PRESETS} onNotePreset={(id) => erun((d) => Cmds.applyNotePreset(d, noteStylePreset(id), id))}
            pitchRange={{ value: Cmds.pitchRangeOf(epiano.properties), reference: epianoRef && typeof epianoRef.pitchRangeMode === 'string' ? { mode: epianoRef.pitchRangeMode as 'FIT_CONTENT' | 'CUSTOM', min: Number(epianoRef.pitchMin), max: Number(epianoRef.pitchMax) } : undefined, onChange: (v) => erun((d) => Cmds.setPitchRange(d, v)) }}
            reference={ref} keyboardRef={(edoc.propsRef[epiano.id] as { keyboard?: { enabled?: boolean } } | undefined)?.keyboard?.enabled}
            playhead={{ scrollMode: epiano.properties.scrollMode, scrollModeRef: epianoRef?.scrollMode as 'SCROLL' | 'PAGE' | undefined, onScrollMode: (m) => erun((d) => Cmds.setScrollMode(d, m)), visibleSeconds: epiano.properties.visibleSeconds, visibleSecondsRef: typeof epianoRef?.visibleSeconds === 'number' ? epianoRef.visibleSeconds : undefined, onVisibleSeconds: (v) => erun((d) => Cmds.setVisibleSeconds(d, v)), page: { unit: epiano.properties.pageUnit, bars: epiano.properties.pageBars, reveal: epiano.properties.revealAhead, unitRef: epianoRef?.pageUnit as 'SECONDS' | 'BARS' | undefined, barsRef: typeof epianoRef?.pageBars === 'number' ? epianoRef.pageBars : undefined, revealRef: typeof epianoRef?.revealAhead === 'number' ? epianoRef.revealAhead : undefined, onUnit: (u) => erun((d) => Cmds.setPageProp(d, 'pageUnit', u)), onBars: (n) => erun((d) => Cmds.setPageProp(d, 'pageBars', n)), onReveal: (s) => erun((d) => Cmds.setPageProp(d, 'revealAhead', s)) }, ratio: epiano.properties.playheadPositionRatio, visible: epiano.properties.playheadVisible, visibleRef: (edoc.propsRef[epiano.id] as { playheadVisible?: boolean } | undefined)?.playheadVisible, reference: playheadRef, onChange: (r) => erun((d) => Cmds.setPlayheadRatio(d, r)), onVisible: (v) => erun((d) => Cmds.setPlayheadVisible(d, v)) }} />
        : <p className="text-xs text-muted">{i18n.t('web.look.noPiano')}</p>}
    </InspectorSection>
  );
  // Mục "Chữ" (T-72): widget có chữ. Cơ bản/Nâng cao như mục Hình thức; "đã chỉnh nâng cao" = có ghi đè ngoài phần Cơ bản.
  const BASIC_TEXT = new Set(['styleId', 'font', 'size', 'color', 'weight', 'italic']);
  const textSection = (w: WidgetSpec, n: number, locked = false) => {
    const slots = textSlots(w.type);
    if (!slots.length) return null;
    const P = w.properties as Record<string, Record<string, unknown> | undefined>;
    const advEdited = slots.some((s) => Object.keys(P[s.field] ?? {}).some((k) => !BASIC_TEXT.has(k)));
    return (
      <InspectorSection key="text" n={n} id="text" title={i18n.t('web.section.text')} more={more('text', advEdited)}>
        <TextPanel widget={w} styles={scene.textStyles ?? DEFAULT_TEXT_STYLES} advanced={showAdv('text')} disabled={locked}
          onRef={(field, next, path) => erun((d) => Cmds.patchTextRef(d, w.id, field, next, path))}
          onStyles={(set, field, r, kind) => erun((d) => Cmds.setTextStyles(d, set, w.id, field, r, kind))} uses={styleUses}
          onRenameStyle={(id, name) => run((d) => Cmds.renameTextStyle(d, id, name))} onDeleteStyle={(id) => run((d) => Cmds.deleteTextStyle(d, id))}
          onProps={(patch) => erun((d) => Cmds.patchWidgetProps(d, w.id, patch))} reference={edoc.propsRef[w.id] ?? widgetDefaults(w.type)} />
      </InspectorSection>
    );
  };
  // Mục "Thiết lập" (T-68): thuộc tính riêng của widget chữ. "Đã chỉnh nâng cao" = thuộc tính chỉ có ở Nâng cao khác mặc định.
  const settingsSection = (w: WidgetSpec, n: number, locked = false) => {
    if (!hasWidgetSettings(w.type)) return null;
    const reference = edoc.propsRef[w.id] ?? widgetDefaults(w.type); // mốc ↺: bộ dựng sẵn áp gần nhất (widget mới: mặc định của loại)
    const edited = advancedEdited(w, w.properties as Record<string, unknown>, reference);
    return (
      <InspectorSection key="settings" n={n} id="settings" title={i18n.t('web.section.settings')} more={more('settings', edited)}>
        <WidgetSettings widget={w} advanced={showAdv('settings')} disabled={locked} reference={reference} onProps={(patch) => erun((d) => Cmds.patchWidgetProps(d, w.id, patch))}
          tracks={loaded?.ast.tracks.map((t) => ({ index: t.index, name: t.name }))} onTracks={(mode, idx) => erun((d) => Cmds.setWidgetTracks(d, w.id, mode, idx))} lanes={laneChoices} />
      </InspectorSection>
    );
  };
  const sections: Record<'song' | 'tracks', (n: number) => React.ReactNode> = loaded && trackProps ? {
    song: (n) => (
      <InspectorSection key="song" n={n} id="song" title={i18n.t('web.section.song')} more={audio ? more('song', offsetMs !== 0) : undefined}>
        <Facts rows={[
          [i18n.t('web.song.file'), <span title={loaded.name}>{loaded.name}</span>],
          ...(advanced ? [[i18n.t('web.song.format'), loaded.format] as [string, React.ReactNode]] : []),
          [i18n.t('web.song.length'), formatClock(duration)],
          [i18n.t('web.song.tempo'), tempoText],
          [i18n.t('web.song.tracks'), i18n.number(loaded.ast.tracks.length)],
          [i18n.t('web.song.notes'), i18n.number(loaded.ast.tracks.reduce((n2, t) => n2 + t.notes.length, 0))],
          ...(advanced ? [[i18n.t('web.song.read'), i18n.t('web.song.readValue', { ms: Math.round(loaded.ms) })] as [string, React.ReactNode]] : []),
        ]} />
        {(advanced || tempoSource !== 'file') && (() => {
          const panel = (
            <TempoPanel source={tempoSource} draft={tempo?.draft ?? null} overridden={!!tempo} busy={busy} advanced={advanced}
              onApply={(override, draft) => reparse({ tempo: { override, draft } })} onClear={() => reparse({ tempo: null })} />
          );
          // Nâng cao: chỉnh tempo là việc hiếm (tempo đã đọc đúng từ tệp) nên gập lại; tự mở khi thiếu tempo hoặc đã ghi đè. Cơ bản chỉ hiện khi thiếu tempo, không gập.
          return advanced
            ? <details key={`${loaded.name}:${tempo ? 1 : 0}`} open={tempoSource !== 'file' || !!tempo} data-testid="tempo-fold">
                <summary className="disclosure text-xs">{i18n.t('web.tempo.edit')}</summary>
                <div className="pt-2">{panel}</div>
              </details>
            : <Fragment key={`${loaded.name}:${tempo ? 1 : 0}`}>{panel}</Fragment>;
        })()}
        <AudioPanel audio={audio ? { name: audio.name, durationSec: audio.durationSec } : null} busy={audioBusy} offsetMs={offsetMs} showOffset={showAdv('song')}
          onLoad={onLoadAudio} onRemove={dropAudio} onOffset={(ms) => run((d) => Cmds.setAudioOffset(d, ms))} />
      </InspectorSection>
    ),
    tracks: (n) => (
      <InspectorSection key="tracks" n={n} id="tracks" title={`${i18n.t('web.section.tracks')} · ${i18n.number(loaded.ast.tracks.length)}`} more={more('tracks', tracksEdited)}>
        <TrackLayoutBar value={trackLayout} onChange={setTrackLayout} count={loaded.ast.tracks.length} reference={TRACK_LAYOUT_DEFAULT} />
        <PalettePanel tracks={ordered.map((tr) => ({ id: tr.id, name: tr.name, color: style.tracks[tr.id]?.customColor ?? tr.color }))} onApply={(colors) => prun((d) => Cmds.applyTrackPalette(d, colors))} />
        {trackLayout.mode === 'list' ? <TrackPanel {...trackProps} /> : <p className="text-xs text-muted">{i18n.t('web.tracks.gridBelow')}</p>}
      </InspectorSection>
    ),
  } : { song: () => null, tracks: () => null };
  const sectionOrder = ['song', 'tracks'] as const;

  // `relative` ở cả ba vùng cuộn: phần tử sr-only (position: absolute) bên trong phải neo vào vùng cuộn của nó,
  // nếu không nó thoát ra ngoài, làm cả trang cuộn theo và đẩy thanh trên đi.
  // Cột Phong cách video và inspector đổi cỡ/thu gọn được như ở Editor (D-64, lib/panelLayout.ts profile 'preview'); Ctrl+B / Ctrl+Alt+B.
  const pvHint = (name: string, open: boolean, keys: string) => `${i18n.t(open ? 'web.panel.collapse' : 'web.panel.open', { name })} (${keys})`;
  const preview = (
    <div ref={pv.ref} style={{ '--pv-l': `${pv.r.layers}px`, '--pv-r': `${pv.r.props}px` } as CSSProperties}
      className={`grid h-full min-h-0 max-lg:content-start max-lg:overflow-y-auto ${loaded ? 'lg:grid-cols-[var(--pv-l)_minmax(0,1fr)_var(--pv-r)]' : ''}`}>
      {loaded && (
        <div className="relative max-lg:order-2 lg:min-h-0">
          {!pv.r.open.layers ? (
            <Rail side="left" label={i18n.t('web.styles.title')} title={pvHint(i18n.t('web.styles.title'), false, 'Ctrl+B')} onOpen={() => pv.setOpen('layers', true)} testId="rail-styles" />
          ) : <>
            <aside id="preview-styles" className="relative h-full min-h-0 overflow-y-auto border-b border-line bg-surface max-lg:max-h-60 lg:border-b-0 lg:border-r">
              <VideoStyles value={doc.videoStyle} edited={tileEdited} onPick={pickVideoStyle} thumb={(id) => thumbs[id]}
                headerAction={<PanelCollapse label={pvHint(i18n.t('web.styles.title'), true, 'Ctrl+B')} icon={<PanelLeft className="h-3.5 w-3.5" />} onClick={() => pv.setOpen('layers', false)} testId="collapse-styles" />}
                presets={{ items: userPresets.map(({ id, name }) => ({ id, name })), active: userActiveId, dirty: Object.keys(working).filter((k) => k !== tileId), onPick: onPickUserPreset, onAddFile: (f) => void onOpenPreset(f),
                  onDownload: onDownloadTile, onDuplicate, onRevert, onDelete: onDeleteUserPreset, problems: [], status: presetOpened ? i18n.t('web.preset.opened', { name: presetOpened }) : presetStatus ?? undefined,
                  onShare: onSharePreset, onExportCollection, pendingCollection: pendingCollection ? { conflicts: pendingCollection.plan.conflicts.map((c) => c.name) } : null, onResolveCollection: (c: Record<string, 'overwrite' | 'rename'>) => { if (pendingCollection) finishCollection(pendingCollection.plan, c, pendingCollection.name); }, onCancelCollection: () => setPendingCollection(null), shareName: (activeUser ? userPresets.find((u) => u.id === activeUser)?.name : undefined) ?? i18n.t(`web.style.video.${doc.videoStyle}`) }} />
            </aside>
            <Splitter axis="x" grow={1} label={i18n.t('web.panel.resize', { name: i18n.t('web.styles.title') })} title={i18n.t('web.panel.resizeHint')} controls="preview-styles"
              value={pv.r.layers} min={pv.profile.limits.layers[0]} max={pv.profile.limits.layers[1]} onResize={(v) => pv.resize('layers', v)} onReset={() => pv.reset('layers')}
              onToggle={() => pv.setOpen('layers', false)} className="right-0 translate-x-1/2 max-lg:hidden" testId="split-styles" />
          </>}
        </div>
      )}
      <div ref={scrollerRef} className={`relative min-h-0 min-w-0 overflow-y-auto bg-page p-3 max-lg:order-1 max-lg:h-[75svh] lg:p-6 ${loaded ? 'lg:col-start-2' : ''}`}>
        <div className={`space-y-4 ${loaded ? '' : 'mx-auto max-w-2xl pt-10'}`}>
          {midi && midiLevel && <MissingMidiPanel info={midi} level={midiLevel} busy={busy} onAdd={addMidi} />}
          {needsSchema && source && <SchemaPanel schemas={schemas} busy={busy} onAdd={(schema) => reparse({ schemas: [...schemas, { name: String((schema as { name?: unknown; id?: unknown }).name ?? (schema as { id?: unknown }).id ?? 'schema').slice(0, 60), schema }] })} onRemove={(i) => reparse({ schemas: schemas.filter((_, k) => k !== i) })} />}
          {!loaded && <FileDrop proof={ui.proofFrame} onPick={onPick} busy={busy} slim={!!(midi && midiLevel)} onSample={onSample} />}
          <Notices problems={problems} basic={!advanced} />
        </div>
        {loaded && derived && renderAst && (
          <div ref={stageRef} className={aboveStage ? 'mt-4' : ''}>
            <Stage onAspect={(a) => run((d) => Cmds.setAspect(d, a))} scene={scene} derived={derived} ast={renderAst} playback={playback} proof={ui.proofFrame} width={stageWidth} fonts={fonts}
              styleName={styleLabel}>
              <Transport playback={playback} duration={playDuration} offsetMs={offsetMs} wave={audio && peaks ? { peaks, durationSec: audio.durationSec } : null} />
            </Stage>
          </div>
        )}
        {trackProps && trackLayout.mode === 'grid' && (
          <section aria-label={i18n.t('web.section.tracks')} className="mt-6"><TrackPanel {...trackProps} /></section>
        )}
      </div>
      {loaded && trackProps && (
        <div className="relative max-lg:order-3 lg:min-h-0">
          {!pv.r.open.props ? (
            <Rail side="right" label={i18n.t('web.inspector')} title={pvHint(i18n.t('web.inspector'), false, 'Ctrl+Alt+B')} onOpen={() => pv.setOpen('props', true)} testId="rail-inspector" />
          ) : <>
            <aside id="preview-inspector" aria-label={i18n.t('web.inspector')} className="relative flex h-full min-h-0 flex-col border-t border-line bg-surface max-lg:h-auto max-lg:overflow-visible lg:border-l lg:border-t-0" data-testid="inspector">
              <div className="flex h-8 shrink-0 items-center justify-between gap-2 border-b border-line pl-4 pr-2">
                <span className="truncate text-xs text-muted">{i18n.t('web.inspector')}</span>
                <PanelCollapse label={pvHint(i18n.t('web.inspector'), true, 'Ctrl+Alt+B')} icon={<PanelRight className="h-3.5 w-3.5" />} onClick={() => pv.setOpen('props', false)} testId="collapse-inspector" />
              </div>
              <SettingsSearchBox />
              <div className="relative min-h-0 flex-1 overflow-y-auto max-lg:flex-none max-lg:overflow-visible">
                {sectionOrder.map((id, i) => sections[id](i + 1))}
                <SearchEmpty />
              </div>
            </aside>
            <Splitter axis="x" grow={-1} label={i18n.t('web.panel.resize', { name: i18n.t('web.inspector') })} title={i18n.t('web.panel.resizeHint')} controls="preview-inspector"
              value={pv.r.props} min={pv.profile.limits.props[0]} max={pv.profile.limits.props[1]} onResize={(v) => pv.resize('props', v)} onReset={() => pv.reset('props')}
              onToggle={() => pv.setOpen('props', false)} className="left-0 max-lg:hidden" testId="split-inspector" />
          </>}
        </div>
      )}
    </div>
  );

  // ── API cho AI agent (`?agent=1`, lib/agentApi.ts): host đọc trạng thái mới nhất qua ref; xuất video qua hộp thoại Xuất ở chế độ tự động. ──
  const agent = useMemo(() => typeof location !== 'undefined' && agentEnabled(location.search), []);
  const [agentExport, setAgentExport] = useState<(ExportOptions & { onFinish: AutoExport['onFinish'] }) | null>(null);
  const hostRef = useRef<AgentHost | null>(null);
  hostRef.current = {
    status: () => ({
      version: 1, busy,
      project: loaded ? { name: loaded.name, duration, tracks: loaded.ast.tracks.map((t) => ({ id: t.id, name: t.name, notes: t.notes.length })) } : null,
      audio: audio && audioFile ? { name: audioFile.name, duration: audio.durationSec } : null,
      tab, t: playback.get().t, playing: playback.get().playing, videoStyle: doc.videoStyle, styles: [...VIDEO_STYLES],
      userPresets: userPresets.map(({ id, name }) => ({ id, name })),
      history: { canUndo: history.canUndo, canRedo: history.canRedo, ...(history.canUndo ? { undoLabel: stepLabel(history, history.position) } : {}) },
      problems: problems.map((p) => `${p.code}: ${p.text}`),
    }),
    loadProject: async (files) => { await load({ main: files[0], extras: files.slice(1) }); },
    loadAudio: (f) => onLoadAudio(f),
    scene: () => store.get().scene,
    openScene: (sc) => { setActiveUser(null); run((d) => Cmds.loadPreset(d, sc)); },
    addPreset: (f) => onOpenPreset(f),
    pickStyle: (id) => pickVideoStyle(id),
    pickPreset: (id) => onPickUserPreset(id),
    seek: (t) => playback.seek(t), play: () => { if (!playback.get().playing) playback.toggle(); }, pause: () => { if (playback.get().playing) playback.toggle(); },
    setTab: (t) => setTab(t), undo: doUndo, redo: doRedo,
    frame: async (t, width) => {
      if (!derived || !renderAst) throw new Error('no project loaded');
      const sc = store.get().scene, c = document.createElement('canvas'), k = width / sc.canvas.designWidth;
      c.width = width; c.height = Math.round(sc.canvas.designHeight * k);
      const g = c.getContext('2d'); if (!g) throw new Error('no 2d canvas');
      renderFrame(sc, derived, renderAst, t, { ctx: g as unknown as RenderCtx, width: c.width, height: c.height }, k);
      return c.toDataURL('image/png');
    },
    exportVideo: (o) => new Promise((ok, no) => {
      if (!derived || !renderAst) { no(new Error('no project loaded')); return; }
      setAgentExport({ ...o, onFinish: (r) => { setAgentExport(null); if ('error' in r) no(new Error(r.error)); else ok(r); } });
    }),
  };
  useEffect(() => {
    if (!agent) return;
    const w = window as unknown as { dawviz?: unknown };
    w.dawviz = createAgentApi(() => hostRef.current!);
    return () => { delete w.dawviz; };
  }, [agent]);

  return (
    <SettingsSearchContext.Provider value={searchCtx}><GestureContext.Provider value={gesture}><NotationStatusContext.Provider value={notation}><AssetsContext.Provider value={assetsApi}><MotionConfig reducedMotion="user"><LayoutGroup>
    <div className="flex h-screen min-h-0 flex-col">
      {agent && <div role="status" className="shrink-0 border-b border-guide/60 bg-guide/10 px-4 py-1 text-xs text-fg" data-testid="agent-banner">{i18n.t('web.agent.banner')}</div>}
      <TopBar tab={tab} onTab={setTab} fileName={loaded?.name} onExport={derived && renderAst ? () => setExporting(true) : undefined} mode={ui.mode} onMode={(mode) => setUi((u) => ({ ...u, mode, modeChosen: true }))}
        history={history} shortcuts={shortcuts} onUndo={doUndo} onRedo={doRedo} onJump={doJump} stepLabel={stepLabel} announce={announce}
        file={<FileDrop onPick={onPick} busy={busy} compact />} theme={<ThemeToggle pref={theme} onChange={setTheme} />} />
      <main className="min-h-0 flex-1">
        <div role="tabpanel" id="panel-preview" aria-labelledby="tab-preview" hidden={tab !== 'preview'} className="h-full">{preview}</div>
        <div role="tabpanel" id="panel-editor" aria-labelledby="tab-editor" hidden={tab !== 'editor'} className="h-full">
          <Editor proof={ui.proofFrame} styleName={styleLabel} scene={edoc.scene} root={scene} compPath={livePath} onCompPath={setCompPath} flatFull={flatFull} derived={derived} ast={renderAst} playback={playback} fonts={fonts} advanced={advanced} actions={editorActions} active={tab === 'editor'}
            layoutRef={edoc.layoutRef} trackLocks={trackLocks} onLockTrack={onLockTrack} trackEdit={trackEdit}
            widgetSections={(w, n, lk) => (w.type === 'PIANO_ROLL' ? [w.id === epiano?.id ? lookSection(n) : null, settingsSection(w, n + (w.id === epiano?.id ? 1 : 0), lk)] : hasWidgetSettings(w.type) ? [settingsSection(w, n, lk), textSection(w, n + 1, lk)] : [textSection(w, n, lk)])}
            transport={loaded ? <Transport playback={playback} duration={playDuration} offsetMs={offsetMs} wave={audio && peaks ? { peaks, durationSec: audio.durationSec } : null} /> : undefined} />
        </div>
        <div role="tabpanel" id="panel-settings" aria-labelledby="tab-settings" hidden={tab !== 'settings'} className="h-full overflow-y-auto bg-page">
          <div className="relative mx-auto max-w-3xl border-x border-line bg-surface lg:my-8 lg:border-y" data-testid="settings-sheet">
            {/* Cùng ngôn ngữ "bản in thử" với khung video: dấu cắt ở bốn góc tờ cài đặt, ngoài nội dung. */}
            {ui.proofFrame && <span aria-hidden className="max-lg:hidden"><Crop className="-left-5 -top-5" /><Crop className="-right-5 -top-5 -scale-x-100" /><Crop className="-bottom-5 -left-5 -scale-y-100" /><Crop className="-bottom-5 -right-5 -scale-100" /></span>}
            <InspectorSection n={1} id="appearance" title={i18n.t('web.settings.appearance')}>
              <AppearanceSettings pref={theme} onChange={setTheme} />
            </InspectorSection>
            <InspectorSection n={2} id="stage" title={i18n.t('web.settings.stage')}>
              <label className="flex items-start gap-2 text-[13px] text-fg">
                <input type="checkbox" className="mt-0.5" checked={ui.proofFrame} onChange={(e) => setUi((u) => ({ ...u, proofFrame: e.target.checked }))} data-testid="proof-toggle" />
                <span>{i18n.t('web.settings.proof')}</span>
              </label>
            </InspectorSection>
            <InspectorSection n={3} id="device-latency" title={i18n.t('web.latency.title')}>
              <DeviceLatency prefs={device} onChange={setDevice} />
            </InspectorSection>
            <InspectorSection n={4} id="session" title={i18n.t('web.session.title')}>
              <SessionSettings hasProject={!!parts} busy={busy} state={saveState} missing={missingFiles} onSavePack={() => void onSavePack()} onOpenPack={(f) => void onOpenPack(f)} onDiscard={() => void onDiscard()} />
            </InspectorSection>
          </div>
        </div>
      </main>
    </div>
    {exporting && derived && renderAst && <Suspense fallback={null}><ExportDialog scene={scene} ast={renderAst} derived={derived} audio={audio} offsetMs={offsetMs} projectSec={duration} fileName={loaded?.name ?? 'dawviz'} advanced={advanced} layerName={widgetName} styleId={doc.videoStyle} styleName={VIDEO_STYLES.includes(doc.videoStyle) ? i18n.t(`web.style.video.${doc.videoStyle}`) : undefined} onClose={() => setExporting(false)} /></Suspense>}
    {agentExport && derived && renderAst && <Suspense fallback={null}><ExportDialog scene={scene} ast={renderAst} derived={derived} audio={audio} offsetMs={offsetMs} projectSec={duration} fileName={loaded?.name ?? 'dawviz'} advanced={advanced} layerName={widgetName} styleId={doc.videoStyle} styleName={VIDEO_STYLES.includes(doc.videoStyle) ? i18n.t(`web.style.video.${doc.videoStyle}`) : undefined} onClose={() => agentExport.onFinish({ error: 'closed' })} auto={agentExport} /></Suspense>}
    {/* REQ-UI-13: lần đầu mở app thì hỏi Cơ bản hay Nâng cao (nhớ theo trình duyệt, không hỏi lại). Esc = Cơ bản. Không hỏi khi agent điều khiển (?agent=1). */}
    {!agent && !ui.modeChosen && <ConfirmDialog testId="mode-choice" title={i18n.t('web.modeChoice.title')} message={i18n.t('web.modeChoice.message')}
      cancelLabel={i18n.t('web.modeChoice.basic')} confirmLabel={i18n.t('web.modeChoice.advanced')}
      onCancel={() => setUi((u) => ({ ...u, mode: 'basic', modeChosen: true }))} onConfirm={() => setUi((u) => ({ ...u, mode: 'advanced', modeChosen: true }))} />}
    </LayoutGroup></MotionConfig></AssetsContext.Provider></NotationStatusContext.Provider></GestureContext.Provider></SettingsSearchContext.Provider>
  );
}

/** Thanh trên hai hàng (UI-DIRECTION 5.3). Hàng 1: dấu + tên, tệp đang mở; chế độ, mở tệp, xuất video, sáng/tối, ngôn ngữ.
 *  Hàng 2: ba thẻ, thẻ đang mở gạch chân màu nhấn; phím ←/→ chuyển thẻ (WAI-ARIA tabs, kích hoạt tự động). */
const prefetchExport = () => { void loadExportDialog(); };
function TopBar({ tab, onTab, fileName, onExport, mode, onMode, file, theme, history, shortcuts, onUndo, onRedo, onJump, stepLabel, announce }: { tab: Tab; onTab(t: Tab): void; fileName?: string; onExport?(): void; mode: UiMode; onMode(m: UiMode): void; file: React.ReactNode; theme: React.ReactNode; history: History<Doc>; shortcuts: { undo: string; redo: string }; onUndo(): void; onRedo(): void; onJump(position: number): void; stepLabel(h: History<Doc>, position: number): string; announce: { n: number; text: string } }) {
  const { i18n } = useI18n();
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : e.key === 'Home' ? -99 : e.key === 'End' ? 99 : 0;
    if (!d) return;
    e.preventDefault();
    const next = TABS[Math.max(0, Math.min(TABS.length - 1, Math.abs(d) === 99 ? (d > 0 ? TABS.length - 1 : 0) : TABS.indexOf(tab) + d))];
    onTab(next); document.getElementById(`tab-${next}`)?.focus();
  };
  return (
    <header className="shrink-0 border-b border-line bg-surface">
      <div className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 px-4 max-sm:py-1.5">
        <h1 className="flex shrink-0 items-center gap-2 text-[20px] font-semibold leading-none tracking-tight text-fg"><Mark className="h-12 w-12" />{i18n.t('web.title')}</h1>
        {fileName && <span className="hidden min-w-0 truncate text-[13px] text-muted md:block" title={fileName}><span className="text-faint" aria-hidden>/ </span>{fileName}</span>}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <div className="seg" role="radiogroup" aria-label={i18n.t('web.mode')} data-testid="mode-switch" onKeyDown={radioKeys}>
            {(['basic', 'advanced'] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} tabIndex={radioTab(mode === m)} onClick={() => onMode(m)}
                className="seg-btn">{i18n.t(`web.mode.${m}`)}</button>
            ))}
          </div>
          {file}
          {/* Chưa mở dự án thì chưa có gì để xuất: nút giữ chỗ cho bố cục ổn định và nói rõ vì sao chưa bấm được. */}
          <button type="button" disabled={!onExport} onClick={onExport} onPointerEnter={prefetchExport} onPointerDown={prefetchExport} onFocus={prefetchExport} aria-describedby={onExport ? undefined : 'export-why'} title={onExport ? undefined : i18n.t('web.export.needProject')}
            className="rounded border border-accent bg-accent px-3 py-1.5 text-[13px] font-semibold text-on-accent transition ring-offset-2 ring-offset-surface enabled:hover:ring-2 enabled:hover:ring-line-strong enabled:active:brightness-95 disabled:cursor-not-allowed disabled:opacity-60" data-testid="export">
            {i18n.t('web.export')}
          </button>
          {!onExport && <span id="export-why" className="sr-only">{i18n.t('web.export.needProject')}</span>}
          {theme}
          <LanguageSelect />
        </div>
      </div>
      <div className="flex gap-5 px-4">
        {/* Chỉ các thẻ nằm trong tablist (ARIA: tablist chỉ chứa tab); Hoàn tác/Làm lại là anh em bên cạnh. */}
        <div className="flex gap-5" role="tablist" aria-label={i18n.t('web.tabs')}>
        {TABS.map((t) => (
          <button key={t} id={`tab-${t}`} type="button" role="tab" aria-selected={tab === t} aria-controls={`panel-${t}`} tabIndex={tab === t ? 0 : -1}
            onClick={() => onTab(t)} onKeyDown={onKey}
            className={`-mb-px border-b-2 py-2 text-[13px] transition ${tab === t ? 'border-accent font-medium text-fg' : 'border-transparent text-muted hover:text-fg'}`}>
            {i18n.t(`web.tab.${t}`)}
          </button>
        ))}
        </div>
        {/* Hoàn tác / Làm lại ở hàng 2, căn phải: hàng 1 đã đủ chỗ cho chế độ, mở tệp, xuất, giao diện, ngôn ngữ ở 1024 px. */}
        <div className="ml-auto py-1">
          <HistoryMenu history={history} items={historyItems(history, (i) => stepLabel(history, i + 1), i18n.t('web.hist.origin'))}
            undoName={i18n.t('web.undo.label', { shortcut: shortcuts.undo })} undoTitle={history.canUndo ? i18n.t('web.undo.labelWith', { action: stepLabel(history, history.position), shortcut: shortcuts.undo }) : i18n.t('web.undo.label', { shortcut: shortcuts.undo })}
            redoName={i18n.t('web.redo.label', { shortcut: shortcuts.redo })} redoTitle={history.canRedo ? i18n.t('web.redo.labelWith', { action: stepLabel(history, history.position + 1), shortcut: shortcuts.redo }) : i18n.t('web.redo.label', { shortcut: shortcuts.redo })}
            onUndo={onUndo} onRedo={onRedo} onJump={onJump} />
          <span key={announce.n} role="status" aria-live="polite" className="sr-only" data-testid="history-announce">{announce.text}</span>
        </div>
      </div>
    </header>
  );
}
