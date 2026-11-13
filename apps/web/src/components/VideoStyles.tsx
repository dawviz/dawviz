// Cột "Video styles" / "Phong cách video" (UI-DIRECTION 5.3): chọn phong cách của KHUNG VIDEO, không phải theme app (D-52).
// "Paper" (D-51) là phong cách mặc định; các bộ kiểu nốt dựng sẵn của Render Core đứng sau. Mỗi mục có ảnh thu nhỏ do Render Core vẽ (lib/thumbnails.ts).
import type { NoteStyle } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { radioKeys, radioTab } from '../lib/a11y.ts';
import { VIDEO_STYLES, videoStyleBase } from '../lib/videoScenes.ts';

export { VIDEO_STYLES, videoStyleBase };
/** Kiểu nốt hiện tại còn đúng như phong cách đã chọn không (để hiện "đã chỉnh"). */
export function isEdited(id: string, base: NoteStyle): boolean {
  const ref = videoStyleBase(id) as unknown as Record<string, unknown>;
  return Object.entries(base).some(([k, v]) => ref[k] !== v);
}

/** `thumb(id)` trả ảnh thu nhỏ (data URL) do Render Core vẽ từ dự án đang mở; vắng thì chỉ hiện chữ. */
const thumbW = 120;
export function VideoStyles({ value, edited, onPick, onUndo, thumb }: { value: string; edited: boolean; onPick(id: string): void; onUndo?(): void; thumb?(id: string): string | undefined }) {
  const { i18n } = useI18n();
  return (
    <nav aria-labelledby="styles-h" className="py-3">
      <h2 id="styles-h" className="px-4 pb-2 text-[15px] font-semibold text-fg">{i18n.t('web.styles.title')}</h2>
      <ul role="radiogroup" aria-labelledby="styles-h" data-testid="video-styles" onKeyDown={radioKeys}>
        {VIDEO_STYLES.map((id) => {
          const on = id === value, src = thumb?.(id);
          return (
            <li key={id}>
              <button type="button" role="radio" aria-checked={on} tabIndex={radioTab(on, id === VIDEO_STYLES[0], VIDEO_STYLES.includes(value))} onClick={() => onPick(id)}
                className={`relative flex w-full flex-col gap-1.5 py-2 pl-4 pr-3 text-left text-[13px] transition ${on ? 'bg-raised font-medium text-fg' : 'text-muted hover:bg-raised hover:text-fg'}`}>
                {on && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
                {src && <img src={src} alt="" aria-hidden width={thumbW} data-testid={`style-thumb-${id}`} className="block w-full border border-line" />}
                <span className="flex w-full items-baseline justify-between gap-2">
                  <span className="truncate">{i18n.t(`web.style.video.${id}`)}</span>
                  {on && edited && <span className="shrink-0 text-xs font-normal text-muted">{i18n.t('web.styles.edited')}</span>}
                </span>
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
