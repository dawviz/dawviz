// Thanh phát (UI-DIRECTION 5.3): lùi / phát / tới bằng biểu tượng, thanh tua, thời gian m:ss.mmm tô màu nhấn khi đang phát.
// Theo dõi kho đồng hồ trực tiếp nên chỉ thanh này vẽ lại mỗi khung hình. Sóng âm (T-08) là SVG nằm trên thanh tua: vạch muted cho cả bài,
// vạch nhấn cho phần đã phát (clip-path theo t); màu theo theme nhờ currentColor, tính lại chỉ khi đổi đỉnh/offset/độ dài.
import { useMemo, useRef, useState } from 'react';
import { parseTime } from '../lib/timeText.ts';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { usePlayback, usePlaybackLoop, type Playback } from '../lib/playback.ts';
import { peaksPath, placePeaks } from '../lib/audioPeaks.ts';
import { formatClock } from '../lib/timeFormat.ts';
import { Back, Forward, Pause, Play, Repeat, ToStart } from './Icons.tsx';

const STEP = 5, WAVE_COLS = 600, WAVE_H = 24;
export interface WaveData { peaks: Float32Array; durationSec: number }
const iconBtn = 'grid h-8 w-8 shrink-0 place-items-center rounded text-muted transition hover:bg-raised hover:text-fg';

export function Transport({ playback, duration, wave, offsetMs = 0 }: { playback: Playback; duration: number; wave?: WaveData | null; offsetMs?: number }) {
  const { i18n } = useI18n();
  const t = usePlayback(playback, (s) => s.t);
  const playing = usePlayback(playback, (s) => s.playing);
  const label = playing ? i18n.t('web.pause') : i18n.t('web.play');
  const hint = (l: string, key: string) => i18n.t('web.shortcut', { label: l, key: i18n.t(key) });
  const looping = usePlaybackLoop(playback);
  const loopSpec = playback.getLoop();
  const loop = loopSpec === 'all' ? { start: 0, end: duration } : loopSpec;
  const loopLabel = looping ? i18n.t('web.loop.on') : i18n.t('web.loop.off');
  const path = useMemo(() => (wave && duration > 0 ? peaksPath(placePeaks(wave.peaks, wave.durationSec, offsetMs / 1000, duration, WAVE_COLS), WAVE_H) : ''), [wave, duration, offsetMs]);
  const pct = duration > 0 ? (t / duration) * 100 : 0;
  return (
    <div className="tp" data-testid="transport">
      <div className="tp-in">
        <div className="tp-btns">
          <button type="button" className={iconBtn} onClick={() => playback.seek(0)} aria-label={i18n.t('web.toStart')} aria-keyshortcuts="Home" title={hint(i18n.t('web.toStart'), 'web.key.home')}><ToStart /></button>
          <button type="button" className={iconBtn} onClick={() => playback.nudge(-STEP)} aria-label={i18n.t('web.back')} title={i18n.t('web.back')}><Back /></button>
          <button type="button" onClick={() => playback.toggle()} aria-label={label} aria-keyshortcuts="Space" title={hint(label, 'web.key.space')}
            className="grid h-9 w-9 shrink-0 place-items-center rounded bg-fg text-page transition hover:ring-1 hover:ring-line-strong hover:ring-offset-2 hover:ring-offset-surface active:scale-95">
            {playing ? <Pause /> : <Play />}
          </button>
          <button type="button" className={iconBtn} onClick={() => playback.nudge(STEP)} aria-label={i18n.t('web.forward')} title={i18n.t('web.forward')}><Forward /></button>
        </div>
        {/* Thời gian hiện tại, thanh tua, độ dài bài luôn đi cùng nhau; khung hẹp thì cả cụm xuống hàng hai (index.css, .tp). */}
        <div className="tp-seek">
          <ClockField t={t} duration={duration} playing={playing} label={i18n.t('web.seekTo')} onSeek={(v) => playback.seek(v)} />
          <div className="relative min-w-[6rem] flex-1">
            <input aria-label={i18n.t('web.seek')} aria-valuetext={formatClock(t)} type="range" min={0} max={duration} step={0.01} value={t}
              style={{ '--p': `${pct}%` } as React.CSSProperties}
              onChange={(e) => playback.seek(Number(e.target.value))} className="block w-full min-w-0" />
            {loop && duration > 0 && (
              <span aria-hidden data-testid="loop-region" className="pointer-events-none absolute top-1/2 h-6 -translate-y-1/2 rounded-sm bg-accent/15"
                style={{ left: `${(loop.start / duration) * 100}%`, width: `${((loop.end - loop.start) / duration) * 100}%` }} />
            )}
            {path && (
              <svg viewBox={`0 0 ${WAVE_COLS} ${WAVE_H}`} preserveAspectRatio="none" aria-hidden data-testid="waveform"
                className="pointer-events-none absolute inset-x-0 top-1/2 h-6 w-full -translate-y-1/2 text-muted">
                <path d={path} stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" opacity="0.55" />
                <g className="text-accent" style={{ clipPath: `inset(0 ${100 - pct}% 0 0)` }}><path d={path} stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" fill="none" /></g>
              </svg>
            )}
          </div>
          <span className="w-[4.75rem] shrink-0 text-right text-[13px] tabular-nums text-muted" data-testid="transport-duration">{formatClock(duration)}</span>
        </div>
        <button type="button" className={`${iconBtn} btn-toggle tp-loop`} aria-pressed={looping} aria-label={i18n.t('web.loop')} title={loopLabel}
          onClick={() => playback.setLoop(looping ? null : 'all')} data-testid="loop"><Repeat /></button>
      </div>
    </div>
  );
}

/**
 * Thời gian hiện tại, gõ được như ô thời gian của Editor: nhấp vào, gõ `1:30`, `90.5`, `1:02:03`… rồi Enter (hoặc rời ô) để tua tới đó;
 * Esc huỷ. Không sửa thì ô chạy theo đồng hồ như chữ thường. Gõ sai hoặc vượt độ dài bài: viền báo lỗi, giữ chỗ cũ.
 */
function ClockField({ t, duration, playing, label, onSeek }: { t: number; duration: number; playing: boolean; label: string; onSeek(v: number): void }) {
  const [text, setTextState] = useState<string | null>(null); // null = không sửa: hiện đồng hồ
  const [bad, setBad] = useState(false);
  const cur = useRef<string | null>(null), fresh = useRef(false); // bản mới nhất cho onBlur (blur có thể chạy ngay trong cùng sự kiện, trước khi vẽ lại)
  const setText = (v: string | null) => { cur.current = v; setTextState(v); };
  /** Áp chuỗi đang sửa: hợp lệ thì tua và thôi sửa (true); sai thì báo lỗi, vẫn đang sửa (false). */
  const commit = (): boolean => {
    const s = cur.current;
    if (s === null) return true;
    const v = parseTime(s);
    if (v === null || v > duration + 1e-9) { setBad(true); return false; }
    setText(null); setBad(false); onSeek(v); return true;
  };
  const cancel = () => { setText(null); setBad(false); };
  return (
    <input type="text" inputMode="decimal" autoComplete="off" spellCheck={false} aria-label={label} title={label} aria-invalid={bad || undefined} data-testid="transport-time"
      value={text ?? formatClock(t)}
      // Chọn sẵn cả chuỗi để gõ đè ngay; lần nhả chuột đầu sau khi nhấp vào không được bỏ vùng chọn đó.
      onFocus={(e) => { setText(formatClock(t)); setBad(false); e.target.select(); fresh.current = true; }}
      onMouseUp={(e) => { if (fresh.current) { e.preventDefault(); fresh.current = false; } }}
      onChange={(e) => { setText(e.target.value); setBad(false); }}
      onBlur={() => { if (cur.current !== null && !commit()) cancel(); }} // rời ô với chuỗi sai: bỏ, không tua
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); if (commit()) e.currentTarget.blur(); }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel(); e.currentTarget.blur(); }
      }}
      className={`w-[5.25rem] shrink-0 rounded border bg-transparent px-1 py-0.5 text-[13px] font-medium tabular-nums outline-none transition hover:border-control focus:border-focus focus:bg-raised ${bad ? 'border-danger' : 'border-transparent'} ${playing && text === null ? 'text-accent' : 'text-fg'}`} />
  );
}
