// Thanh phát/tạm dừng/tua và đồng hồ thời gian.
import { useI18n } from '../i18n/I18nProvider.tsx';

export function Transport({ t, duration, playing, onToggle, onSeek }: { t: number; duration: number; playing: boolean; onToggle(): void; onSeek(t: number): void }) {
  const { i18n } = useI18n();
  return (
    <div className="flex items-center gap-4 rounded-xl bg-ink-900 px-4 py-3">
      <button type="button" onClick={onToggle}
        className="w-24 rounded-lg bg-accent-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-400">
        {playing ? i18n.t('web.pause') : i18n.t('web.play')}
      </button>
      <input aria-label={i18n.t('web.seek')} type="range" min={0} max={duration} step={0.01} value={t}
        onChange={(e) => onSeek(Number(e.target.value))} className="flex-1 accent-accent-500" />
      <span className="w-28 text-right font-mono text-sm tabular-nums text-ink-300">{i18n.duration(t)} / {i18n.duration(duration)}</span>
    </div>
  );
}
