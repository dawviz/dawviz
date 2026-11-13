// Cột "Video styles" / "Phong cách video" (UI-DIRECTION 5.3): chọn phong cách của KHUNG VIDEO, không phải theme app (D-52).
// Hiện là các bộ kiểu nốt dựng sẵn của Render Core; preset "Bản in" (D-51) và ảnh thu nhỏ do Render Core vẽ sẽ thêm sau.
import { DEFAULT_NOTE_STYLE, STYLE_PRESETS, type NoteStyle } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { radioKeys, radioTab } from '../lib/a11y.ts';

export const VIDEO_STYLES = ['default', ...Object.keys(STYLE_PRESETS)];
export function videoStyleBase(id: string): NoteStyle { return { ...DEFAULT_NOTE_STYLE, ...(STYLE_PRESETS[id] ?? {}) }; }
/** Kiểu nốt hiện tại còn đúng như phong cách đã chọn không (để hiện "đã chỉnh"). */
export function isEdited(id: string, base: NoteStyle): boolean {
  const ref = videoStyleBase(id) as unknown as Record<string, unknown>;
  return Object.entries(base).some(([k, v]) => ref[k] !== v);
}

export function VideoStyles({ value, edited, onPick, onUndo }: { value: string; edited: boolean; onPick(id: string): void; onUndo?(): void }) {
  const { i18n } = useI18n();
  return (
    <nav aria-labelledby="styles-h" className="py-3">
      <h2 id="styles-h" className="px-4 pb-2 text-[15px] font-semibold text-fg">{i18n.t('web.styles.title')}</h2>
      <ul role="radiogroup" aria-labelledby="styles-h" data-testid="video-styles" onKeyDown={radioKeys}>
        {VIDEO_STYLES.map((id) => {
          const on = id === value;
          return (
            <li key={id}>
              <button type="button" role="radio" aria-checked={on} tabIndex={radioTab(on, id === VIDEO_STYLES[0], VIDEO_STYLES.includes(value))} onClick={() => onPick(id)}
                className={`relative flex w-full items-baseline justify-between gap-2 py-1.5 pl-4 pr-3 text-left text-[13px] transition ${on ? 'bg-raised font-medium text-fg' : 'text-muted hover:bg-raised hover:text-fg'}`}>
                {on && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-line-strong" />}
                <span className="truncate">{i18n.t(`web.style.preset.${id}`)}</span>
                {on && edited && <span className="shrink-0 text-xs font-normal text-muted">{i18n.t('web.styles.edited')}</span>}
              </button>
            </li>
          );
        })}
      </ul>
      {onUndo && (
        <p role="status" className="mx-4 mt-3 border-t border-line pt-2 text-xs text-muted" data-testid="style-undo">
          {i18n.t('web.styles.replaced')}{' '}
          <button type="button" className="font-medium text-fg underline decoration-line-strong/40 underline-offset-2 hover:decoration-line-strong" onClick={onUndo}>{i18n.t('web.styles.undo')}</button>
        </p>
      )}
    </nav>
  );
}
