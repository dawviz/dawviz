// Thành phần gốc: giữ trạng thái tệp đã nạp, đồng hồ phát, cấu hình độ sáng; nối Worker parse với giao diện.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig, motion } from 'framer-motion';
import { DEFAULT_BRIGHTNESS, DEFAULT_KEYBOARD_STYLE, defaultStyleConfig, sanitizeBrightness, buildIndex, defaultScene, type Derived, type PianoRollProps, type SceneDocument, type WidgetSpec, type BrightnessConfig, type NoteStyle, type StyleConfig, type KeyboardStyle, type UnifiedProjectAST } from '@dawviz/render-core';
import { useI18n } from './i18n/I18nProvider.tsx';
import { LanguageSelect } from './components/LanguageSelect.tsx';
import { ThemeSelect } from './components/ThemeSelect.tsx';
import { FileDrop, type Picked } from './components/FileDrop.tsx';
import { Notices } from './components/Notices.tsx';
import { MissingMidiPanel } from './components/MissingMidiPanel.tsx';
import { mergeExtras, missingMidiLevel, type ExternalMidiInfo } from './lib/externalMidi.ts';
import { SceneCanvas } from './components/SceneCanvas.tsx';
import { Transport } from './components/Transport.tsx';
import { TrackPanel, TrackLayoutBar, DEFAULT_TRACK_LAYOUT, type TrackLayout } from './components/TrackPanel.tsx';
import { StylePanel } from './components/StylePanel.tsx';
import { loadPref, savePref } from './lib/prefs.ts';
import { advance, initialClock, seek, togglePlay, type ClockState } from './lib/clock.ts';
import { describeProblem, type Problem } from './lib/problems.ts';
import { createLatestGate, ParseFailure } from './lib/parserClient.ts';
import { parseInWorker } from './lib/parseInWorker.ts';
import type { ParseWarning } from '@dawviz/parser';

interface Loaded { name: string; ast: UnifiedProjectAST; warnings: ParseWarning[]; format: string; ms: number }

export function App() {
  const { i18n } = useI18n();
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failure, setFailure] = useState<{ code: string; message: string; details?: Record<string, unknown> } | null>(null);
  // Lần chọn tệp gần nhất (để nạp thêm .mid mà không phải chọn lại dự án) và tình trạng .mid ngoài (REQ-UI-08).
  const [source, setSource] = useState<Picked | null>(null);
  const [midi, setMidi] = useState<ExternalMidiInfo | undefined>(undefined);
  const [clock, setClock] = useState<ClockState>(initialClock);
  const [brightness, setBrightness] = useState<Record<string, BrightnessConfig>>({});
  const [style, setStyle] = useState<StyleConfig>(() => { const s = loadPref<Partial<StyleConfig>>('style', {}); return { base: { ...defaultStyleConfig().base, ...(s.base ?? {}) }, tracks: s.tracks ?? {} }; });
  const [keyboard, setKeyboard] = useState<KeyboardStyle>(() => ({ ...DEFAULT_KEYBOARD_STYLE, ...loadPref<Partial<KeyboardStyle>>('keyboard', {}) }));
  useEffect(() => savePref('style', style), [style]);
  useEffect(() => savePref('keyboard', keyboard), [keyboard]);
  // REQ-UI-14: kiểu trình bày danh sách track là tuỳ chọn giao diện (không vào preset video).
  const [trackLayout, setTrackLayout] = useState<TrackLayout>(() => {
    const p = loadPref<Partial<TrackLayout>>('trackLayout', {});
    const mode = p.mode === 'list' ? 'list' : 'grid';
    const columns = p.columns === 'auto' || (typeof p.columns === 'number' && p.columns >= 1) ? p.columns : DEFAULT_TRACK_LAYOUT.columns;
    return { mode, columns };
  });
  useEffect(() => savePref('trackLayout', trackLayout), [trackLayout]);
  const duration = loaded?.ast.meta.totalDurationSeconds ?? 0;

  // T-05: khung hình = renderFrame(scene, derived, ast, t). Kiểu nốt và bàn phím hiện vẫn chỉnh ở bảng bên phải và được
  // ghép vào Piano Roll của scene mặc định; T-07 sẽ đưa scene vào store có hoàn tác và Preset.
  const scene: SceneDocument = useMemo(() => {
    const s = defaultScene();
    const w = s.widgets[0] as WidgetSpec<PianoRollProps>;
    w.properties = { ...w.properties, noteStyle: style, keyboard: { ...w.properties.keyboard, enabled: keyboard.enabled } };
    return s;
  }, [style, keyboard]);
  const index = useMemo(() => (loaded ? buildIndex(loaded.ast.tracks, loaded.ast.meta.totalDurationSeconds) : null), [loaded]);
  const derived: Derived | null = useMemo(() => (index ? { index, brightness } : null), [index, brightness]);

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
      setClock(initialClock);
    } catch (e) {
      if (!gate.isLatest(ticket)) return;
      const f = e as ParseFailure; setLoaded(null); setMidi(f.midi);
      setFailure({ code: f.code ?? 'ERR_UNKNOWN', message: f.message, details: f.details });
    } finally { if (gate.isLatest(ticket)) setBusy(false); }
  }, [gate]);

  // Vòng lặp phát: chỉ cập nhật số t; mọi thứ nhìn thấy là hàm của t.
  const last = useRef(0);
  useEffect(() => {
    if (!clock.playing) return;
    let raf = 0; last.current = performance.now();
    const tick = (now: number) => {
      const dt = (now - last.current) / 1000; last.current = now;
      setClock((s) => advance(s, dt, duration));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clock.playing, duration]);

  const midiLevel = missingMidiLevel(midi, !!failure);
  const addMidi = useCallback((files: File[]) => { if (source) void onPick({ main: source.main, extras: mergeExtras(source.extras, files) }); }, [source, onPick]);

  const problems: Problem[] = useMemo(() => {
    const out: Problem[] = [];
    // Bảng "thiếu .mid" đã nói rõ hơn: không lặp lại cảnh báo từng item và lỗi "không có nốt" do thiếu tệp.
    const covered = (code: string) => !!midi?.missing.length && (code === 'WARN_RPP_EXTERNAL_MIDI' || code === 'ERR_NO_NOTES');
    if (failure && !covered(failure.code)) out.push(describeProblem(i18n, 'error', failure.code, failure.message, failure.details));
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

  // Lane automation có trong dự án (nguồn phát sáng "automation", REQ-GRAPHICS-17).
  const lanes = useMemo(() => [...new Set((loaded?.ast.tracks ?? []).flatMap((tr) => Object.entries(tr.automation ?? {}).filter(([, l]) => l?.points.length).map(([k]) => k)))], [loaded]);
  const tracksSection = loaded && (
    <section aria-labelledby="tracks-h" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="tracks-h" className="panel-title flex items-center gap-2">{i18n.t('web.tracks')} <span className="rounded border border-line bg-page px-1.5 py-px text-[10px] tabular-nums text-fg">{loaded.ast.tracks.length}</span></h2>
        <TrackLayoutBar value={trackLayout} onChange={setTrackLayout} count={loaded.ast.tracks.length} />
      </div>
      <TrackPanel tracks={loaded.ast.tracks} config={brightness} overrides={style.tracks} onChange={patchBrightness} onStyle={patchTrackStyle} t={clock.t} tempoMap={loaded.ast.tempoMap} layout={trackLayout} />
    </section>
  );

  return (
    <MotionConfig reducedMotion="user"><LayoutGroup>
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <h1 className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-fg">
            <Logo />{i18n.t('web.title')}
          </h1>
          {loaded && <span className="hidden min-w-0 truncate text-xs text-muted md:block" title={loaded.name}>
            <span className="text-faint">/</span> <span className="text-fg">{loaded.name}</span>
          </span>}
          <div className="ml-auto flex items-center gap-3">
            {loaded && <FileDrop onPick={onPick} busy={busy} compact />}
            <ThemeSelect />
            <LanguageSelect />
          </div>
        </div>
      </header>

    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 sm:p-6">
      {!loaded && <FileDrop onPick={onPick} busy={busy} />}
      {midi && midiLevel && <MissingMidiPanel info={midi} level={midiLevel} busy={busy} onAdd={addMidi} />}
      <Notices problems={problems} />

      <AnimatePresence>
        {loaded && (
          <motion.main key={loaded.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
            {/* Khung xem trước chỉ "dính" khi danh sách track nằm ở cột phải; ở chế độ lưới, thẻ track nằm bên dưới nên không được che. */}
            <section className={`min-w-0 ${trackLayout.mode === 'list' ? 'lg:sticky lg:top-[4.5rem]' : ''}`}>
              {/* "Sân khấu": khung hình + thanh phát là một khối, để khung xem trước tách khỏi nền trang. */}
              <div className="overflow-hidden rounded-md border border-line bg-surface">
                <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 text-xs text-muted">
                  <span className="truncate">{i18n.t('web.loaded', { name: loaded.name, format: loaded.format, ms: Math.round(loaded.ms), tracks: loaded.ast.tracks.length })}</span>
                  <span className="shrink-0 rounded border border-line px-1.5 py-px text-[10px] tabular-nums text-muted">{scene.canvas.designWidth}×{scene.canvas.designHeight}</span>
                </div>
                <div className="bg-page">
                  {derived && <SceneCanvas scene={scene} derived={derived} ast={loaded.ast} t={clock.t} />}
                </div>
                <div className="border-t border-line">
                  <Transport t={clock.t} duration={duration} playing={clock.playing}
                    onToggle={() => setClock((s) => togglePlay(s, duration))} onSeek={(t) => setClock((s) => seek(s, t, duration))} />
                </div>
              </div>
            </section>
            <aside className={`min-w-0 space-y-4 ${trackLayout.mode === 'list' ? 'lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-1 lg:sticky lg:top-[4.5rem]' : ''}`}>
              <StylePanel style={style} keyboard={keyboard} onStyle={setStyle} onKeyboard={setKeyboard} lanes={lanes} />
              {trackLayout.mode === 'list' && tracksSection}
            </aside>
            {trackLayout.mode === 'grid' && <div className="min-w-0 pt-2 lg:col-span-2">{tracksSection}</div>}
          </motion.main>
        )}
      </AnimatePresence>
    </div>
    </div>
    </LayoutGroup></MotionConfig>
  );
}

/** Biểu tượng ứng dụng: vài thanh nốt lệch nhau, gợi piano roll. */
function Logo() {
  return (
    <span aria-hidden className="grid h-7 w-7 place-items-center rounded bg-accent">
      <svg viewBox="0 0 16 16" className="h-4 w-4 text-on-accent"><g fill="currentColor"><rect x="2" y="3" width="6" height="2" rx="1" /><rect x="6" y="7" width="8" height="2" rx="1" /><rect x="3" y="11" width="5" height="2" rx="1" /></g></svg>
    </span>
  );
}
