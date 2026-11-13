// Thành phần gốc (T-70, UI-DIRECTION 5.3 cấu trúc D + A + E): thanh trên hai hàng, ba thẻ Preview / Editor / Settings.
// Thẻ Preview: cột "Video styles" | sân khấu "bản in thử" + thanh phát | inspector đánh số. Editor và Settings mới là khung.
// Giữ trạng thái tệp đã nạp, kiểu nốt, độ sáng, ẩn/hiện/solo/thứ tự track; đồng hồ phát nằm ở kho riêng (lib/playback.ts)
// nên thành phần này không vẽ lại mỗi khung hình. Không có logic vẽ ở đây: khung hình = renderFrame của Render Core.
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { LayoutGroup, MotionConfig } from 'framer-motion';
import { DEFAULT_BRIGHTNESS, DEFAULT_KEYBOARD_STYLE, sanitizeBrightness, buildIndex, buildSceneHud, type Derived, type SceneDocument, type BrightnessConfig, type NoteStyle, type StyleConfig, type KeyboardStyle, type UnifiedProjectAST } from '@dawviz/render-core';
import type { ParseWarning } from '@dawviz/parser';
import { useI18n } from './i18n/I18nProvider.tsx';
import { LanguageSelect } from './components/LanguageSelect.tsx';
import { AppearanceSettings, ThemeToggle, useTheme } from './components/ThemeSelect.tsx';
import { FileDrop, type Picked } from './components/FileDrop.tsx';
import { Notices } from './components/Notices.tsx';
import { MissingMidiPanel } from './components/MissingMidiPanel.tsx';
import { Stage } from './components/Stage.tsx';
import { Transport } from './components/Transport.tsx';
import { TrackPanel, TrackLayoutBar, DEFAULT_TRACK_LAYOUT, isShown, type TrackLayout } from './components/TrackPanel.tsx';
import { ADVANCED_STYLE_KEYS, StylePanel } from './components/StylePanel.tsx';
import { VideoStyles, isEdited } from './components/VideoStyles.tsx';
import { NOTE_PRESETS, VIDEO_STYLES, noteStylePreset, sceneForStyle, videoStyleBase, videoStyleKeyboard } from './lib/videoScenes.ts';
import { useFontsStatus } from './lib/fonts.ts';
import { projectKey, styleThumbnail } from './lib/thumbnails.ts';
import { Facts, InspectorSection } from './components/Inspector.tsx';
import { Mark } from './components/Icons.tsx';
import { mergeExtras, missingMidiLevel, type ExternalMidiInfo } from './lib/externalMidi.ts';
import { loadPref, savePref } from './lib/prefs.ts';
import { usePref, DEFAULT_UI, sanitizeUi, type UiMode, type UiPrefs } from './lib/usePref.ts';
import { createPlayback } from './lib/playback.ts';
import { radioKeys, radioTab } from './lib/a11y.ts';
import { bindTransportKeys } from './lib/transportKeys.ts';
import { STAGE_CHROME, STAGE_WEDGE, useStageWidth } from './lib/useStageWidth.ts';
import { formatClock } from './lib/timeFormat.ts';
import { describeProblem, type Problem } from './lib/problems.ts';
import { createLatestGate, ParseFailure } from './lib/parserClient.ts';
import { parseInWorker } from './lib/parseInWorker.ts';

interface Loaded { name: string; ast: UnifiedProjectAST; warnings: ParseWarning[]; format: string; ms: number }
type Tab = 'preview' | 'editor' | 'settings';
const TABS: readonly Tab[] = ['preview', 'editor', 'settings'];

export function App() {
  const { i18n } = useI18n();
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failure, setFailure] = useState<{ code: string; message: string; details?: Record<string, unknown> } | null>(null);
  // Lần chọn tệp gần nhất (để nạp thêm .mid mà không phải chọn lại dự án) và tình trạng .mid ngoài (REQ-UI-08).
  const [source, setSource] = useState<Picked | null>(null);
  const [midi, setMidi] = useState<ExternalMidiInfo | undefined>(undefined);
  const [brightness, setBrightness] = useState<Record<string, BrightnessConfig>>({});
  // Lần đầu (chưa có tuỳ chọn lưu) kiểu nốt và bàn phím lấy theo phong cách mặc định "Paper" (D-51), không phải mặc định cũ.
  const firstStyle = sanitizeUi(loadPref<Partial<UiPrefs>>('ui', {})).videoStyle;
  const [style, setStyle] = useState<StyleConfig>(() => { const s = loadPref<Partial<StyleConfig>>('style', {}); return { base: { ...videoStyleBase(firstStyle), ...(s.base ?? {}) }, tracks: s.tracks ?? {} }; });
  const [keyboard, setKeyboard] = useState<KeyboardStyle>(() => ({ ...DEFAULT_KEYBOARD_STYLE, enabled: videoStyleKeyboard(firstStyle), ...loadPref<Partial<KeyboardStyle>>('keyboard', {}) }));
  useEffect(() => savePref('style', style), [style]);
  useEffect(() => savePref('keyboard', keyboard), [keyboard]);
  // REQ-UI-14: kiểu trình bày danh sách track là tuỳ chọn giao diện (không vào preset video).
  // Mặc định Danh sách: dòng track nằm ngay trong mục 03 của inspector (UI-DIRECTION 5.3); Lưới là lựa chọn thêm.
  const [trackLayout, setTrackLayout] = usePref<TrackLayout>('trackLayout', { ...DEFAULT_TRACK_LAYOUT, mode: 'list' }, (p) => ({
    mode: p.mode === 'grid' ? 'grid' : 'list',
    columns: p.columns === 'auto' || (typeof p.columns === 'number' && p.columns >= 1) ? p.columns : DEFAULT_TRACK_LAYOUT.columns,
  }));
  const [ui, setUi] = usePref('ui', DEFAULT_UI, sanitizeUi);
  const [theme, setTheme] = useTheme();
  const [tab, setTab] = useState<Tab>('preview');
  const advanced = ui.mode === 'advanced';

  // Đồng hồ phát ngoài React state (PROGRESS T-70): chỉ canvas, thanh phát và số đo đăng ký theo dõi.
  const playback = useRef(createPlayback()).current;
  useEffect(() => () => playback.dispose(), [playback]);
  const duration = loaded?.ast.meta.totalDurationSeconds ?? 0;

  // REQ-UI-12: ẩn/hiện, solo và thứ tự track (thứ tự chỉ đổi ở Nâng cao). Lọc ở đây, Render Core không đổi.
  const [order, setOrder] = useState<string[]>([]);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const [solo, setSolo] = useState<ReadonlySet<string>>(new Set());
  const view = useMemo(() => ({ hidden, solo }), [hidden, solo]);
  const ordered = useMemo(() => {
    if (!loaded) return [];
    const byId = new Map(loaded.ast.tracks.map((t) => [t.id, t]));
    return order.map((id) => byId.get(id)!).filter(Boolean);
  }, [loaded, order]);
  const renderAst = useMemo(() => (loaded ? { ...loaded.ast, tracks: ordered.filter((t) => isShown(t.id, view)) } : null), [loaded, ordered, view]);
  const toggleIn = (set: (f: (s: ReadonlySet<string>) => ReadonlySet<string>) => void) => (id: string) =>
    set((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const onMove = useCallback((id: string, to: number) => setOrder((o) => {
    const from = o.indexOf(id); const dest = Math.max(0, Math.min(o.length - 1, to));
    if (from < 0 || from === dest) return o;
    const n = [...o]; n.splice(from, 1); n.splice(dest, 0, id); return n;
  }), []);

  // T-05: khung hình = renderFrame(scene, derived, ast, t). Kiểu nốt và bàn phím ghép vào Piano Roll của scene mặc định;
  // T-07 sẽ đưa scene vào store có hoàn tác và Preset.
  const scene: SceneDocument = useMemo(() => sceneForStyle(ui.videoStyle, style, keyboard), [ui.videoStyle, style, keyboard]);
  const fonts = useFontsStatus(scene); // chưa nạp xong phông thì không vẽ khung có chữ (TECHNICAL-DESIGN 5.7)
  const index = useMemo(() => (renderAst ? buildIndex(renderAst.tracks, renderAst.meta.totalDurationSeconds) : null), [renderAst]);
  // Dò hợp âm là việc nặng của bước derived: dựng lại chỉ khi đổi dự án/track hiển thị/widget Chord (không phải mỗi lần kéo thanh trượt kiểu nốt).
  const chordSig = JSON.stringify(scene.widgets.filter((w) => w.type === 'CHORD_DETECTION').map((w) => [w.trackMappingMode, w.assignedTrackIndices]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const hud = useMemo(() => (renderAst && index ? buildSceneHud(scene, renderAst, index) : undefined), [renderAst, index, chordSig]);
  const derived: Derived | null = useMemo(() => (index ? { index, brightness, hud, fontsReady: fonts === 'ready' } : null), [index, brightness, hud, fonts]);

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
    return out;
  }, [loaded, pkey, fonts]);

  // T-02: chọn tệp mới khi tệp cũ đang parse -> chỉ kết quả của lần chọn mới nhất được áp dụng; busy chỉ tắt khi lần mới nhất xong.
  const gate = useRef(createLatestGate()).current;
  const onPick = useCallback(async ({ main, extras }: Picked) => {
    const ticket = gate.begin();
    setBusy(true); setFailure(null); setSource({ main, extras });
    try {
      const files: Record<string, ArrayBuffer> = {};
      for (const f of extras) files[f.name] = await f.arrayBuffer();
      const r = await parseInWorker({ name: main.name, buffer: await main.arrayBuffer(), files });
      if (!gate.isLatest(ticket)) return;
      setLoaded({ name: main.name, ast: r.ast, warnings: r.warnings, format: r.format, ms: r.ms }); setMidi(r.midi);
      setBrightness(Object.fromEntries(r.ast.tracks.map((t) => [t.id, { ...DEFAULT_BRIGHTNESS } as BrightnessConfig])));
      setOrder(r.ast.tracks.map((t) => t.id)); setHidden(new Set()); setSolo(new Set());
      playback.reset(r.ast.meta.totalDurationSeconds);
      setTab('preview');
    } catch (e) {
      if (!gate.isLatest(ticket)) return;
      // Nạp lỗi khi đang mở một dự án: giữ dự án đó (không mất ẩn/hiện, solo, thứ tự), chỉ báo lỗi phía trên sân khấu.
      const f = e as ParseFailure; setMidi(f.midi);
      setFailure({ code: f.code ?? 'ERR_UNKNOWN', message: f.message, details: f.details });
      setLoaded((prev) => { if (!prev) playback.reset(0); return prev; });
    } finally { if (gate.isLatest(ticket)) setBusy(false); }
  }, [gate, playback]);

  const midiLevel = missingMidiLevel(midi, !!failure);
  const addMidi = useCallback((files: File[]) => { if (source) void onPick({ main: source.main, extras: mergeExtras(source.extras, files) }); }, [source, onPick]);

  const problems: Problem[] = useMemo(() => {
    const out: Problem[] = [];
    // Bảng "thiếu .mid" đã nói rõ hơn: không lặp lại cảnh báo từng item và lỗi "không có nốt" do thiếu tệp.
    const covered = (code: string) => !!midi?.missing.length && (code === 'WARN_RPP_EXTERNAL_MIDI' || code === 'ERR_NO_NOTES');
    if (failure && !covered(failure.code)) {
      const p = describeProblem(i18n, 'error', failure.code, failure.message, failure.details);
      out.push(loaded ? { ...p, text: `${i18n.t('web.failedKeep')} ${p.text}` } : p);
    }
    for (const w of loaded?.warnings ?? []) if (!covered(w.code)) out.push(describeProblem(i18n, 'warning', w.code, w.message, w.details));
    return out;
  }, [failure, loaded, i18n, midi]);

  const patchBrightness = useCallback((id: string, patch: Partial<BrightnessConfig>) =>
    setBrightness((b) => {
      // Một trường được sửa thì giữ trường đó, đẩy trường đối diện (sàn/trần dB, min/max độ sáng).
      const keys = Object.keys(patch) as (keyof BrightnessConfig)[];
      return { ...b, [id]: sanitizeBrightness({ ...b[id], ...patch }, keys.length === 1 ? keys[0] : undefined) };
    }), []);
  const patchTrackStyle = useCallback((id: string, patch: Partial<NoteStyle> | null) =>
    setStyle((s) => {
      const tracks = { ...s.tracks };
      if (patch === null) delete tracks[id]; else tracks[id] = { ...tracks[id], ...patch };
      return { ...s, tracks };
    }), []);
  // Thay phong cách khi đang có chỉnh sửa: giữ bản cũ để hoàn tác ngay tại cột Video styles (chờ store hoàn tác T-07).
  const [styleUndo, setStyleUndo] = useState<{ base: NoteStyle; id: string; applied: NoteStyle } | null>(null);
  const pickVideoStyle = (id: string) => {
    const applied = videoStyleBase(id);
    setStyleUndo(isEdited(ui.videoStyle, style.base) ? { base: style.base, id: ui.videoStyle, applied } : null);
    setStyle((s) => ({ ...s, base: applied })); setKeyboard((k) => ({ ...k, enabled: videoStyleKeyboard(id) })); setUi((u) => ({ ...u, videoStyle: id }));
  };
  const pickNotePreset = (id: string) => setStyle((s) => ({ ...s, base: noteStylePreset(id) }));
  const undoStyle = styleUndo && styleUndo.applied === style.base ? () => {
    setStyle((s) => ({ ...s, base: styleUndo.base })); setUi((u) => ({ ...u, videoStyle: styleUndo.id })); setStyleUndo(null);
  } : undefined;

  // Phím tắt kiểu DAW (Space phát/dừng, Home về đầu) ở thẻ Preview. Space chỉ thuộc về thanh phát khi nút/radio đang focus
  // do chuột; focus do bàn phím thì Space bấm nút như chuẩn; ô gõ chữ giữ nguyên (lib/transportKeys.ts).
  useEffect(() => (tab === 'preview' && loaded ? bindTransportKeys(window, playback) : undefined), [tab, loaded, playback]);

  // Lane automation có trong dự án (nguồn phát sáng "automation", REQ-GRAPHICS-17).
  const lanes = useMemo(() => [...new Set((loaded?.ast.tracks ?? []).flatMap((tr) => Object.entries(tr.automation ?? {}).filter(([, l]) => l?.points.length).map(([k]) => k)))], [loaded]);

  // REQ-UI-13: ở Cơ bản, mục có phần nâng cao có nút "Thêm tuỳ chọn" (nhớ theo mục); chấm báo khi phần ẩn đang khác mặc định.
  const ref = videoStyleBase(ui.videoStyle);
  const lookEdited = ADVANCED_STYLE_KEYS.some((k) => style.base[k] !== ref[k]);
  const tracksEdited = Object.values(brightness).some((c) => c.source !== 'off') || (!!loaded && order.some((id, i) => loaded.ast.tracks[i]?.id !== id));
  const more = (id: string, edited: boolean) => advanced ? undefined : {
    open: !!ui.more[id], edited, onToggle: () => setUi((u) => ({ ...u, more: { ...u.more, [id]: !u.more[id] } })),
  };
  const showAdv = (id: string) => advanced || !!ui.more[id];

  const trackProps = loaded && {
    tracks: ordered, config: brightness, overrides: style.tracks, onChange: patchBrightness, onStyle: patchTrackStyle,
    playback, tempoMap: loaded.ast.tempoMap, layout: trackLayout, advanced: showAdv('tracks'), view,
    onToggleHidden: toggleIn(setHidden), onToggleSolo: toggleIn(setSolo), onMove,
  };
  const tempoText = (() => {
    const bpms = loaded?.ast.tempoMap.map((p) => p.bpm) ?? [];
    if (!bpms.length) return i18n.t('web.stage.noTempo');
    const f = (v: number) => i18n.number(v, { maximumFractionDigits: 2 });
    const lo = Math.min(...bpms), hi = Math.max(...bpms);
    return lo === hi ? i18n.t('web.song.tempo.one', { bpm: f(lo) }) : i18n.t('web.song.tempo.range', { min: f(lo), max: f(hi) });
  })();

  // Chiều rộng khung xem trước theo chỗ còn lại thật trong vùng cuộn giữa (lib/useStageWidth.ts).
  const scrollerRef = useRef<HTMLDivElement>(null), stageRef = useRef<HTMLDivElement>(null);
  const stageWidth = useStageWidth(scrollerRef, stageRef, {
    aspect: scene.canvas.designWidth / scene.canvas.designHeight,
    chrome: ui.proofFrame ? STAGE_CHROME.proof : STAGE_CHROME.plain, extra: ui.proofFrame ? STAGE_WEDGE : 0, active: !!loaded,
  });
  const aboveStage = !!(midi && midiLevel) || problems.length > 0;

  // Các mục của inspector. Cơ bản: Bài, Track, Hình thức (ẩn/hiện, solo là việc hay làm nhất của người làm beat);
  // Nâng cao: Bài, Hình thức, Track. Số mục đánh theo vị trí.
  const sections: Record<'song' | 'look' | 'tracks', (n: number) => React.ReactNode> = loaded && trackProps ? {
    song: (n) => (
      <InspectorSection key="song" n={n} id="song" title={i18n.t('web.section.song')}>
        <Facts rows={[
          [i18n.t('web.song.file'), <span title={loaded.name}>{loaded.name}</span>],
          ...(advanced ? [[i18n.t('web.song.format'), loaded.format] as [string, React.ReactNode]] : []),
          [i18n.t('web.song.length'), formatClock(duration)],
          [i18n.t('web.song.tempo'), tempoText],
          [i18n.t('web.song.tracks'), i18n.number(loaded.ast.tracks.length)],
          [i18n.t('web.song.notes'), i18n.number(loaded.ast.tracks.reduce((n2, t) => n2 + t.notes.length, 0))],
          ...(advanced ? [[i18n.t('web.song.read'), i18n.t('web.song.readValue', { ms: Math.round(loaded.ms) })] as [string, React.ReactNode]] : []),
        ]} />
      </InspectorSection>
    ),
    look: (n) => (
      <InspectorSection key="look" n={n} id="look" title={i18n.t('web.section.look')} more={more('look', lookEdited)}>
        <StylePanel style={style} keyboard={keyboard} onStyle={setStyle} onKeyboard={setKeyboard} lanes={lanes} advanced={showAdv('look')} notePresets={NOTE_PRESETS} onNotePreset={pickNotePreset} />
      </InspectorSection>
    ),
    tracks: (n) => (
      <InspectorSection key="tracks" n={n} id="tracks" title={`${i18n.t('web.section.tracks')} · ${i18n.number(loaded.ast.tracks.length)}`} more={more('tracks', tracksEdited)}>
        <TrackLayoutBar value={trackLayout} onChange={setTrackLayout} count={loaded.ast.tracks.length} />
        {trackLayout.mode === 'list' ? <TrackPanel {...trackProps} /> : <p className="text-xs text-muted">{i18n.t('web.tracks.gridBelow')}</p>}
      </InspectorSection>
    ),
  } : { song: () => null, look: () => null, tracks: () => null };
  const sectionOrder = ['song', 'look', 'tracks'] as const;

  // `relative` ở cả ba vùng cuộn: phần tử sr-only (position: absolute) bên trong phải neo vào vùng cuộn của nó,
  // nếu không nó thoát ra ngoài, làm cả trang cuộn theo và đẩy thanh trên đi.
  const preview = (
    <div className={`grid h-full min-h-0 ${loaded ? 'lg:grid-cols-[10.5rem_minmax(0,1fr)_20rem] min-[1440px]:grid-cols-[10.5rem_minmax(0,1fr)_22rem]' : ''}`}>
      {loaded && (
        <aside className="relative min-h-0 overflow-y-auto border-b border-line bg-surface lg:border-b-0 lg:border-r">
          <VideoStyles value={ui.videoStyle} edited={isEdited(ui.videoStyle, style.base)} onPick={pickVideoStyle} onUndo={undoStyle} thumb={(id) => thumbs[id]} />
        </aside>
      )}
      <div ref={scrollerRef} className="relative min-h-0 min-w-0 overflow-y-auto bg-page p-6">
        <div className={`space-y-4 ${loaded ? '' : 'mx-auto max-w-2xl pt-10'}`}>
          {midi && midiLevel && <MissingMidiPanel info={midi} level={midiLevel} busy={busy} onAdd={addMidi} />}
          {!loaded && <FileDrop onPick={onPick} busy={busy} slim={!!(midi && midiLevel)} />}
          <Notices problems={problems} basic={!advanced} />
        </div>
        {loaded && derived && renderAst && (
          <div ref={stageRef} className={aboveStage ? 'mt-4' : ''}>
            <Stage scene={scene} derived={derived} ast={renderAst} playback={playback} proof={ui.proofFrame} width={stageWidth} fonts={fonts}
              styleName={`${i18n.t(`web.style.video.${ui.videoStyle}`)}${isEdited(ui.videoStyle, style.base) ? ` (${i18n.t('web.styles.edited')})` : ''}`}>
              <Transport playback={playback} duration={duration} />
            </Stage>
          </div>
        )}
        {trackProps && trackLayout.mode === 'grid' && (
          <section aria-label={i18n.t('web.section.tracks')} className="mt-6"><TrackPanel {...trackProps} /></section>
        )}
      </div>
      {loaded && trackProps && (
        <aside aria-label={i18n.t('web.inspector')} className="relative min-h-0 overflow-y-auto border-t border-line bg-surface lg:border-l lg:border-t-0" data-testid="inspector">
          {sectionOrder.map((id, i) => sections[id](i + 1))}
        </aside>
      )}
    </div>
  );

  return (
    <MotionConfig reducedMotion="user"><LayoutGroup>
    <div className="flex h-screen min-h-0 flex-col">
      <TopBar tab={tab} onTab={setTab} fileName={loaded?.name} mode={ui.mode} onMode={(mode) => setUi((u) => ({ ...u, mode }))}
        file={<FileDrop onPick={onPick} busy={busy} compact />} theme={<ThemeToggle pref={theme} onChange={setTheme} />} />
      <main className="min-h-0 flex-1">
        <div role="tabpanel" id="panel-preview" aria-labelledby="tab-preview" hidden={tab !== 'preview'} className="h-full">{preview}</div>
        <div role="tabpanel" id="panel-editor" aria-labelledby="tab-editor" hidden={tab !== 'editor'} className="h-full overflow-y-auto bg-page">
          <div className="mx-auto max-w-3xl px-6 py-8">
            <h2 className="text-[15px] font-semibold text-fg">{i18n.t('web.editor.title')}</h2>
            <p className="mt-2 text-[13px] text-muted">{i18n.t('web.editor.soon')}</p>
          </div>
        </div>
        <div role="tabpanel" id="panel-settings" aria-labelledby="tab-settings" hidden={tab !== 'settings'} className="h-full overflow-y-auto bg-page">
          <div className="mx-auto max-w-3xl border-x border-line bg-surface lg:my-8 lg:border-y">
            <InspectorSection n={1} id="appearance" title={i18n.t('web.settings.appearance')}>
              <AppearanceSettings pref={theme} onChange={setTheme} />
            </InspectorSection>
            <InspectorSection n={2} id="stage" title={i18n.t('web.settings.stage')}>
              <label className="flex items-start gap-2 text-[13px] text-fg">
                <input type="checkbox" className="mt-0.5" checked={ui.proofFrame} onChange={(e) => setUi((u) => ({ ...u, proofFrame: e.target.checked }))} data-testid="proof-toggle" />
                <span>{i18n.t('web.settings.proof')}<span className="mt-0.5 block text-xs text-muted">{i18n.t('web.settings.proofHint')}</span></span>
              </label>
            </InspectorSection>
          </div>
        </div>
      </main>
    </div>
    </LayoutGroup></MotionConfig>
  );
}

/** Thanh trên hai hàng (UI-DIRECTION 5.3). Hàng 1: dấu + tên, tệp đang mở; chế độ, mở tệp, xuất video, sáng/tối, ngôn ngữ.
 *  Hàng 2: ba thẻ, thẻ đang mở gạch chân màu nhấn; phím ←/→ chuyển thẻ (WAI-ARIA tabs, kích hoạt tự động). */
function TopBar({ tab, onTab, fileName, mode, onMode, file, theme }: { tab: Tab; onTab(t: Tab): void; fileName?: string; mode: UiMode; onMode(m: UiMode): void; file: React.ReactNode; theme: React.ReactNode }) {
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
      <div className="flex h-12 items-center gap-3 px-4">
        <h1 className="flex shrink-0 items-center gap-2 text-[20px] font-semibold leading-none tracking-tight text-fg"><Mark className="h-5 w-5" />{i18n.t('web.title')}</h1>
        {fileName && <span className="hidden min-w-0 truncate text-[13px] text-muted md:block" title={fileName}><span className="text-faint" aria-hidden>/ </span>{fileName}</span>}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="seg" role="radiogroup" aria-label={i18n.t('web.mode')} data-testid="mode-switch" onKeyDown={radioKeys}>
            {(['basic', 'advanced'] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} tabIndex={radioTab(mode === m)} onClick={() => onMode(m)}
                className="seg-btn">{i18n.t(`web.mode.${m}`)}</button>
            ))}
          </div>
          {file}
          {/* Xuất video chưa có (M3): nút vẫn ở đúng chỗ để bố cục ổn định, nhưng nói rõ vì sao chưa bấm được. */}
          <button type="button" aria-disabled="true" aria-describedby="export-why" title={i18n.t('web.export.unavailable')}
            className="cursor-not-allowed rounded border border-accent px-3 py-1.5 text-[13px] font-medium text-accent" data-testid="export">
            {i18n.t('web.export')}
          </button>
          <span id="export-why" className="sr-only">{i18n.t('web.export.unavailable')}</span>
          {theme}
          <LanguageSelect />
        </div>
      </div>
      <div className="flex gap-5 px-4" role="tablist" aria-label={i18n.t('web.tabs')}>
        {TABS.map((t) => (
          <button key={t} id={`tab-${t}`} type="button" role="tab" aria-selected={tab === t} aria-controls={`panel-${t}`} tabIndex={tab === t ? 0 : -1}
            onClick={() => onTab(t)} onKeyDown={onKey}
            className={`-mb-px border-b-2 py-2 text-[13px] transition ${tab === t ? 'border-accent font-medium text-fg' : 'border-transparent text-muted hover:text-fg'}`}>
            {i18n.t(`web.tab.${t}`)}
          </button>
        ))}
      </div>
    </header>
  );
}
