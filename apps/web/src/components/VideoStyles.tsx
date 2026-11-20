// Cột "Video styles" / "Phong cách video" (UI-DIRECTION 5.3): chọn phong cách của KHUNG VIDEO, không phải theme app (D-52).
// "Paper" (D-51) là phong cách mặc định; các bộ kiểu nốt dựng sẵn của Render Core đứng sau. Mỗi mục có ảnh thu nhỏ do Render Core vẽ (lib/thumbnails.ts).
import { useRef } from 'react';
import type { NoteStyle } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { radioKeys, radioTab } from '../lib/a11y.ts';
import { VIDEO_STYLES, videoStyleBase } from '../lib/videoScenes.ts';
import { Notices } from './Notices.tsx';
import { Close, Download, Duplicate, Trash } from './Icons.tsx';
import type { Problem } from '../lib/problems.ts';

export { VIDEO_STYLES, videoStyleBase };
/** Kiểu nốt hiện tại còn đúng như phong cách đã chọn không (để hiện "đã chỉnh"). */
export function isEdited(id: string, base: NoteStyle): boolean {
  const ref = videoStyleBase(id) as unknown as Record<string, unknown>;
  return Object.entries(base).some(([k, v]) => ref[k] !== v);
}

/** `thumb(id)` trả ảnh thu nhỏ (data URL) do Render Core vẽ từ dự án đang mở; vắng thì chỉ hiện chữ. */
const thumbW = 120;
/** Cột phong cách + preset của người dùng. Mỗi ô (dựng sẵn hay của người dùng) giữ bản chỉnh dở của riêng nó khi bạn chuyển sang ô khác. */
export interface UserPresets {
  items: { id: string; name: string }[];
  /** Ô preset của người dùng đang áp, nếu có. */
  active?: string;
  /** Ô KHÔNG đang chọn nhưng còn bản chỉnh dở (hiện nhãn "đã chỉnh" và nút về gốc). */
  dirty: string[];
  onPick(id: string): void;
  /** Dấu cộng: nạp một tệp .json thành preset mới (và áp luôn). */
  onAddFile(file: File): void;
  /** Tải xuống tệp .json của ô, đúng như đang thấy (kể cả phần đã chỉnh). */
  onDownload(id: string): void;
  /** Nhân bản bản đang thấy của ô (kể cả phần đã chỉnh) thành preset mới của người dùng; ô nguồn về nguyên gốc. */
  onDuplicate(id: string): void;
  /** Bỏ mọi chỉnh sửa, về bản gốc của ô. */
  onRevert(id: string): void;
  /** Xoá hẳn ô preset của người dùng (phong cách dựng sẵn không có nút này). */
  onDelete(id: string): void;
  problems: Problem[];
  status?: string;
}
const act = 'flex h-6 w-6 items-center justify-center rounded border border-control bg-surface text-fg shadow-sm transition hover:border-line-strong';
/** `edited`: ô đang chọn đã được chỉnh so với bản gốc. */
export function VideoStyles({ value, edited, onPick, thumb, presets }: { value: string; edited: boolean; onPick(id: string): void; thumb?(id: string): string | undefined; presets?: UserPresets }) {
  const { i18n } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const users = presets?.items ?? [];
  const selected = VIDEO_STYLES.includes(value) ? value : presets?.active;
  const first = VIDEO_STYLES[0];
  const tile = (id: string, label: string, pick: () => void, on: boolean, isEdited: boolean, removable: boolean) => {
    const src = thumb?.(id);
    return (
      <li key={id} className="group relative" data-testid={removable ? `user-preset-${id}` : undefined}>
        <button type="button" role="radio" aria-checked={on} tabIndex={radioTab(on, id === first, selected !== undefined)} onClick={pick}
          className={`relative flex w-full flex-col gap-1.5 py-2 pl-4 pr-3 text-left text-[13px] transition ${on ? 'bg-raised font-medium text-fg' : 'text-muted hover:bg-raised hover:text-fg'}`}>
          {on && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
          {src && <img src={src} alt="" aria-hidden width={thumbW} data-testid={`style-thumb-${id}`} className="block aspect-video w-full border border-line object-cover" />}
          <span className="flex w-full items-baseline justify-between gap-2">
            <span className="truncate">{label}</span>
            {isEdited && <span className="shrink-0 text-xs font-normal text-muted" data-testid={`edited-${id}`}>{i18n.t('web.styles.edited')}</span>}
          </span>
        </button>
        {presets && (
          <span className="absolute right-4 top-3 flex gap-1 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
            <button type="button" className={act} onClick={() => presets.onDownload(id)} aria-label={i18n.t('web.preset.download', { name: label })} title={i18n.t('web.preset.download', { name: label })} data-testid={`preset-download-${id}`}><Download className="h-3.5 w-3.5" /></button>
            <button type="button" className={act} onClick={() => presets.onDuplicate(id)} aria-label={i18n.t('web.preset.duplicate', { name: label })} title={i18n.t('web.preset.duplicate', { name: label })} data-testid={`preset-duplicate-${id}`}><Duplicate className="h-3.5 w-3.5" /></button>
            {isEdited && <button type="button" className={act} onClick={() => presets.onRevert(id)} aria-label={i18n.t('web.preset.revert', { name: label })} title={i18n.t('web.preset.revert', { name: label })} data-testid={`preset-revert-${id}`}><Close className="h-3.5 w-3.5" /></button>}
            {removable && <button type="button" className={act} onClick={() => presets.onDelete(id)} aria-label={i18n.t('web.preset.delete', { name: label })} title={i18n.t('web.preset.delete', { name: label })} data-testid={`preset-delete-${id}`}><Trash className="h-3.5 w-3.5" /></button>}
          </span>
        )}
      </li>
    );
  };
  const dirty = new Set(presets?.dirty ?? []);
  return (
    <nav aria-labelledby="styles-h" className="py-3">
      <h2 id="styles-h" className="px-4 pb-2 text-[15px] font-semibold text-fg">{i18n.t('web.styles.title')}</h2>
      <ul role="radiogroup" aria-labelledby="styles-h" data-testid="video-styles" onKeyDown={radioKeys}>
        {VIDEO_STYLES.map((id) => tile(id, i18n.t(`web.style.video.${id}`), () => onPick(id), id === selected, id === selected ? edited : dirty.has(id), false))}
        {users.map((u) => tile(u.id, u.name, () => presets!.onPick(u.id), u.id === selected, u.id === selected ? edited : dirty.has(u.id), true))}
      </ul>
      {presets && (
        <div className="space-y-2 px-4 pt-2">
          <button type="button" onClick={() => input.current?.click()} data-testid="preset-add" aria-label={i18n.t('web.preset.add')} title={i18n.t('web.preset.add')}
            className="flex aspect-video w-full flex-col items-center justify-center gap-1 rounded border border-dashed border-line-strong px-2 text-center text-muted transition hover:border-accent hover:text-fg">
            <span aria-hidden className="text-2xl leading-none">+</span>
            <span className="text-xs leading-tight">{i18n.t('web.preset.add')}</span>
          </button>
          <input ref={input} type="file" accept=".json,application/json" className="hidden" tabIndex={-1} data-testid="preset-input"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) presets.onAddFile(f); }} />
          <div role="status" className="text-xs text-muted" data-testid="preset-status">{presets.status ?? ''}</div>
          <Notices problems={presets.problems} basic={false} />
        </div>
      )}
    </nav>
  );
}
