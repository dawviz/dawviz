// Thanh phát (UI-DIRECTION 5.3): lùi / phát / tới bằng biểu tượng, thanh tua, thời gian m:ss.mmm tô màu nhấn khi đang phát.
// Theo dõi kho đồng hồ trực tiếp nên chỉ thanh này vẽ lại mỗi khung hình. Sóng âm trên thanh tua chờ nạp audio (chưa có).
import { useI18n } from '../i18n/I18nProvider.tsx';
import { usePlayback, type Playback } from '../lib/playback.ts';
import { formatClock } from '../lib/timeFormat.ts';
import { Back, Forward, Pause, Play, ToStart } from './Icons.tsx';

const STEP = 5;
const iconBtn = 'grid h-8 w-8 shrink-0 place-items-center rounded text-muted transition hover:bg-raised hover:text-fg';

export function Transport({ playback, duration }: { playback: Playback; duration: number }) {
  const { i18n } = useI18n();
  const t = usePlayback(playback, (s) => s.t);
  const playing = usePlayback(playback, (s) => s.playing);
  const label = playing ? i18n.t('web.pause') : i18n.t('web.play');
  const hint = (l: string, key: string) => i18n.t('web.shortcut', { label: l, key: i18n.t(key) });
  const pct = duration > 0 ? (t / duration) * 100 : 0;
  return (
    <div className="flex items-center gap-2 px-3 py-2" data-testid="transport">
      <button type="button" className={iconBtn} onClick={() => playback.seek(0)} aria-label={i18n.t('web.toStart')} aria-keyshortcuts="Home" title={hint(i18n.t('web.toStart'), 'web.key.home')}><ToStart /></button>
      <button type="button" className={iconBtn} onClick={() => playback.nudge(-STEP)} aria-label={i18n.t('web.back')} title={i18n.t('web.back')}><Back /></button>
      <button type="button" onClick={() => playback.toggle()} aria-label={label} aria-keyshortcuts="Space" title={hint(label, 'web.key.space')}
        className="grid h-9 w-9 shrink-0 place-items-center rounded bg-fg text-page transition hover:ring-1 hover:ring-line-strong hover:ring-offset-2 hover:ring-offset-surface active:scale-95">
        {playing ? <Pause /> : <Play />}
      </button>
      <button type="button" className={iconBtn} onClick={() => playback.nudge(STEP)} aria-label={i18n.t('web.forward')} title={i18n.t('web.forward')}><Forward /></button>
      <span className={`ml-1 w-[4.75rem] shrink-0 text-right text-[13px] font-medium tabular-nums ${playing ? 'text-accent' : 'text-fg'}`} data-testid="transport-time">{formatClock(t)}</span>
      <input aria-label={i18n.t('web.seek')} aria-valuetext={formatClock(t)} type="range" min={0} max={duration} step={0.01} value={t}
        style={{ '--p': `${pct}%` } as React.CSSProperties}
        onChange={(e) => playback.seek(Number(e.target.value))} className="min-w-0 flex-1" />
      <span className="w-[4.75rem] shrink-0 text-[13px] tabular-nums text-muted">{formatClock(duration)}</span>
    </div>
  );
}
