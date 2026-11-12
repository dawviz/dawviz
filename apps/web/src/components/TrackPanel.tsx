// Danh sách track và cấu hình nguồn độ sáng theo track.
import { AnimatePresence, motion } from 'framer-motion';
import type { ProjectTrack, BrightnessConfig, BrightnessSource, NoteStyle } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';

const SOURCES: BrightnessSource[] = ['volume', 'static', 'pan', 'mute', 'off'];
const EXPERIMENTAL = new Set<BrightnessSource>(['pan', 'mute']); // chiều pan / nghĩa mute chưa kiểm (SOI-19)

export function TrackPanel({ tracks, config, overrides, onChange, onStyle }: { tracks: ProjectTrack[]; config: Record<string, BrightnessConfig>; overrides: Record<string, Partial<NoteStyle>>; onChange(id: string, patch: Partial<BrightnessConfig>): void; onStyle(id: string, patch: Partial<NoteStyle> | null): void }) {
  const { i18n } = useI18n();
  return (
    <ul className="space-y-2">
      <AnimatePresence initial={false}>
        {tracks.map((tr) => {
          const c = config[tr.id];
          return (
            <motion.li key={tr.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              className="rounded-xl border border-ink-700 bg-ink-900 p-3">
              <div className="flex items-center gap-2">
                <input type="color" aria-label={`${i18n.t('web.track.color')}: ${tr.name}`} className="h-5 w-5 cursor-pointer rounded-full border-0 bg-transparent p-0"
                  value={overrides[tr.id]?.customColor ?? tr.color} onChange={(e) => onStyle(tr.id, { colorMode: 'custom', customColor: e.target.value })} />
                <span className="flex-1 truncate font-medium" title={tr.name}>{tr.name}</span>
                <span className="text-xs text-ink-300">{i18n.t('web.track.notes', { n: tr.notes.length })}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-300">
                <label className="flex min-w-0 items-center gap-1">
                  <span>{i18n.t('web.brightness.source')}</span>
                  <select value={c.source} onChange={(e) => onChange(tr.id, { source: e.target.value as BrightnessSource })}
                    className="min-w-0 max-w-[10rem] rounded border border-ink-700 bg-ink-950 px-1.5 py-0.5 text-ink-100">
                    {SOURCES.map((s) => <option key={s} value={s}>{i18n.t(`web.brightness.${s}`)}{EXPERIMENTAL.has(s) ? ` (${i18n.t('web.experimental')})` : ''}</option>)}
                  </select>
                </label>
                {overrides[tr.id] && <button type="button" className="underline" onClick={() => onStyle(tr.id, null)}>{i18n.t('web.track.colorReset')}</button>}
                <label className="flex items-center gap-1">
                  <input type="checkbox" checked={c.invert} onChange={(e) => onChange(tr.id, { invert: e.target.checked })} />
                  <span>{i18n.t('web.brightness.invert')}</span>
                </label>
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
