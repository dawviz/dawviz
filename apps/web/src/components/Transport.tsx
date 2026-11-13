// Thanh phát/tạm dừng/tua và đồng hồ thời gian.
import { useI18n } from '../i18n/I18nProvider.tsx';

const PlayIcon = () => <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden><path fill="currentColor" d="M5 3.4v9.2c0 .6.7 1 1.2.6l7-4.6a.75.75 0 0 0 0-1.2l-7-4.6c-.5-.4-1.2 0-1.2.6Z" /></svg>;
const PauseIcon = () => <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden><rect x="3.5" y="3" width="3" height="10" rx="1" fill="currentColor" /><rect x="9.5" y="3" width="3" height="10" rx="1" fill="currentColor" /></svg>;

export function Transport({ t, duration, playing, onToggle, onSeek }: { t: number; duration: number; playing: boolean; onToggle(): void; onSeek(t: number): void }) {
  const { i18n } = useI18n();
  const label = playing ? i18n.t('web.pause') : i18n.t('web.play');
  const pct = duration > 0 ? (t / duration) * 100 : 0;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <button type="button" onClick={onToggle} aria-label={label} title={label}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-500 text-ink-950 shadow-[0_0_0_4px_rgb(var(--accent-500)/0.15)] transition hover:bg-accent-400 active:scale-95">
        {playing ? <PauseIcon /> : <PlayIcon />}
      </button>
      <span className="w-12 shrink-0 text-right text-xs font-medium tabular-nums text-ink-100">{i18n.duration(t)}</span>
      <input aria-label={i18n.t('web.seek')} type="range" min={0} max={duration} step={0.01} value={t}
        style={{ '--p': `${pct}%` } as React.CSSProperties}
        onChange={(e) => onSeek(Number(e.target.value))} className="min-w-0 flex-1" />
      <span className="w-12 shrink-0 text-xs tabular-nums text-ink-300">{i18n.duration(duration)}</span>
    </div>
  );
}
