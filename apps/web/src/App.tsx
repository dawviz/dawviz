// Thành phần gốc: giữ trạng thái tệp đã nạp, đồng hồ phát, cấu hình độ sáng; nối Worker parse với giao diện.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DEFAULT_BRIGHTNESS, DEFAULT_KEYBOARD_STYLE, defaultStyleConfig, type BrightnessConfig, type NoteStyle, type StyleConfig, type KeyboardStyle, type UnifiedProjectAST } from '@dawviz/render-core';
import { useI18n } from './i18n/I18nProvider.tsx';
import { LanguageSelect } from './components/LanguageSelect.tsx';
import { FileDrop, type Picked } from './components/FileDrop.tsx';
import { Notices } from './components/Notices.tsx';
import { PianoRollCanvas } from './components/PianoRollCanvas.tsx';
import { Transport } from './components/Transport.tsx';
import { TrackPanel } from './components/TrackPanel.tsx';
import { StylePanel } from './components/StylePanel.tsx';
import { loadPref, savePref } from './lib/prefs.ts';
import { advance, initialClock, seek, togglePlay, type ClockState } from './lib/clock.ts';
import { describeProblem, type Problem } from './lib/problems.ts';
import { createLatestGate, parseInWorker, ParseFailure } from './lib/parserClient.ts';
import type { ParseWarning } from '@dawviz/parser';

interface Loaded { name: string; ast: UnifiedProjectAST; warnings: ParseWarning[]; format: string; ms: number }

export function App() {
  const { i18n } = useI18n();
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [failure, setFailure] = useState<{ code: string; message: string; details?: Record<string, unknown> } | null>(null);
  const [clock, setClock] = useState<ClockState>(initialClock);
  const [brightness, setBrightness] = useState<Record<string, BrightnessConfig>>({});
  const [style, setStyle] = useState<StyleConfig>(() => { const s = loadPref<Partial<StyleConfig>>('style', {}); return { base: { ...defaultStyleConfig().base, ...(s.base ?? {}) }, tracks: s.tracks ?? {} }; });
  const [keyboard, setKeyboard] = useState<KeyboardStyle>(() => ({ ...DEFAULT_KEYBOARD_STYLE, ...loadPref<Partial<KeyboardStyle>>('keyboard', {}) }));
  useEffect(() => savePref('style', style), [style]);
  useEffect(() => savePref('keyboard', keyboard), [keyboard]);
  const duration = loaded?.ast.meta.totalDurationSeconds ?? 0;

  // T-02: chọn tệp mới khi tệp cũ đang parse -> chỉ kết quả của lần chọn mới nhất được áp dụng; busy chỉ tắt khi lần mới nhất xong.
  const gate = useRef(createLatestGate()).current;
  const onPick = useCallback(async ({ main, extras }: Picked) => {
    const ticket = gate.begin();
    setBusy(true); setFailure(null);
    try {
      const files: Record<string, ArrayBuffer> = {};
      for (const f of extras) files[f.name] = await f.arrayBuffer();
      const r = await parseInWorker({ name: main.name, buffer: await main.arrayBuffer(), files });
      if (!gate.isLatest(ticket)) return;
      setLoaded({ name: main.name, ast: r.ast, warnings: r.warnings, format: r.format, ms: r.ms });
      setBrightness(Object.fromEntries(r.ast.tracks.map((t) => [t.id, { ...DEFAULT_BRIGHTNESS } as BrightnessConfig])));
      setClock(initialClock);
    } catch (e) {
      if (!gate.isLatest(ticket)) return;
      const f = e as ParseFailure; setLoaded(null);
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

  const problems: Problem[] = useMemo(() => {
    const out: Problem[] = [];
    if (failure) out.push(describeProblem(i18n, 'error', failure.code, failure.message, failure.details));
    for (const w of loaded?.warnings ?? []) out.push(describeProblem(i18n, 'warning', w.code, w.message, w.details));
    return out;
  }, [failure, loaded, i18n]);

  const patchBrightness = useCallback((id: string, patch: Partial<BrightnessConfig>) =>
    setBrightness((b) => ({ ...b, [id]: { ...b[id], ...patch } })), []);

  const patchTrackStyle = useCallback((id: string, patch: Partial<NoteStyle> | null) =>
    setStyle((s) => {
      const tracks = { ...s.tracks };
      if (patch === null) delete tracks[id]; else tracks[id] = { ...tracks[id], ...patch };
      return { ...s, tracks };
    }), []);

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 p-4 sm:p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{i18n.t('web.title')}</h1>
        <LanguageSelect />
      </header>

      <FileDrop onPick={onPick} busy={busy} />
      <Notices problems={problems} />

      <AnimatePresence>
        {loaded && (
          <motion.main key={loaded.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid gap-4 lg:grid-cols-[1fr_20rem]">
            <section className="space-y-3">
              <p className="text-sm text-ink-300">
                {i18n.t('web.loaded', { name: loaded.name, format: loaded.format, ms: Math.round(loaded.ms), tracks: loaded.ast.tracks.length })}
              </p>
              <PianoRollCanvas ast={loaded.ast} t={clock.t} brightness={brightness} style={style} keyboard={keyboard} />
              <Transport t={clock.t} duration={duration} playing={clock.playing}
                onToggle={() => setClock((s) => togglePlay(s, duration))} onSeek={(t) => setClock((s) => seek(s, t, duration))} />
            </section>
            <aside className="space-y-4">
              <StylePanel style={style} keyboard={keyboard} onStyle={setStyle} onKeyboard={setKeyboard} />
              <h2 className="mb-2 text-sm font-medium text-ink-300">{i18n.t('web.tracks')}</h2>
              <TrackPanel tracks={loaded.ast.tracks} config={brightness} overrides={style.tracks} onChange={patchBrightness} onStyle={patchTrackStyle} />
            </aside>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
