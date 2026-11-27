// Cột "Video styles" / "Phong cách video" (UI-DIRECTION 5.3): chọn phong cách của KHUNG VIDEO, không phải theme app (D-52).
// "Paper" (D-51) là phong cách mặc định; các bộ kiểu nốt dựng sẵn của Render Core đứng sau. Mỗi mục có ảnh thu nhỏ do Render Core vẽ (lib/thumbnails.ts).
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';
import { PRESET_LICENSES } from '../lib/presetPack.ts';
import { Select } from './Select.tsx';
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
  /** "Chia sẻ thành preset" (T-24): đóng gói khung hiện tại thành `.dawviz-preset.zip`. Vắng = ẩn nút. */
  onShare?(info: { name: string; author: string; license: string; description: string }): Promise<void>;
  /** Tên gợi ý cho gói (tên preset đang chọn). */
  shareName?: string;
  /** Tải xuống tệp .json của ô, đúng như đang thấy (kể cả phần đã chỉnh). */
  onDownload(id: string): void;
  /** Nhân bản bản đang thấy của ô (kể cả phần đã chỉnh) thành preset mới của người dùng; ô nguồn về nguyên gốc. */
  onDuplicate(id: string): void;
  /** Bỏ mọi chỉnh sửa, về bản gốc của ô. */
  onRevert(id: string): void;
  /** Xoá hẳn ô preset của người dùng (phong cách dựng sẵn không có nút này). */
  onDelete(id: string): void;
  /** "Xuất bộ preset" (T-111, D-66 kiểu A): đóng gói các preset đã chọn (không mốc thời gian, không tệp DAW). Vắng = ẩn nút. */
  onExportCollection?(info: { name: string; author: string; license: string; description: string }, ids: string[]): Promise<void>;
  /** Bộ preset đang chờ người dùng quyết định các tên trùng (ghi đè hoặc đổi tên). */
  pendingCollection?: { conflicts: string[] } | null;
  onResolveCollection?(choices: Record<string, 'overwrite' | 'rename'>): void;
  onCancelCollection?(): void;
  problems: Problem[];
  status?: string;
}
const act = 'flex h-6 w-6 items-center justify-center rounded border border-control bg-surface text-fg shadow-sm transition hover:border-line-strong';
/** `edited`: ô đang chọn đã được chỉnh so với bản gốc. */
export function VideoStyles({ value, edited, onPick, thumb, presets, headerAction }: { value: string; edited: boolean; onPick(id: string): void; thumb?(id: string): string | undefined; presets?: UserPresets; /** Nút ở cuối hàng tiêu đề (vd. thu gọn cột). */ headerAction?: ReactNode }) {
  const { i18n } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const users = presets?.items ?? [];
  const selected = VIDEO_STYLES.includes(value) ? value : presets?.active;
  const first = VIDEO_STYLES[0];
  const tile = (id: string, label: string, pick: () => void, on: boolean, isEdited: boolean, removable: boolean) => {
    const src = thumb?.(id);
    return (
      <li key={id} role="none" className="group relative" data-testid={removable ? `user-preset-${id}` : undefined}>
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
      <div className="flex items-start justify-between gap-1 pb-2 pl-4 pr-2">
        <h2 id="styles-h" className="min-w-0 break-words text-[15px] font-semibold leading-tight text-fg">{i18n.t('web.styles.title')}</h2>
        {headerAction}
      </div>
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
          <PastePreset onAdd={presets.onAddFile} />
          {presets.onShare && <SharePreset onShare={presets.onShare} defaultName={presets.shareName ?? ''} />}
          {presets.onExportCollection && <ExportCollection items={presets.items} onExport={presets.onExportCollection} />}
          {presets.pendingCollection && presets.onResolveCollection && presets.onCancelCollection && <CollectionConflicts conflicts={presets.pendingCollection.conflicts} onResolve={presets.onResolveCollection} onCancel={presets.onCancelCollection} />}
          <input ref={input} type="file" accept=".json,application/json,.zip,application/zip" className="hidden" tabIndex={-1} data-testid="preset-input"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) presets.onAddFile(f); }} />
          <div role="status" className="text-xs text-muted" data-testid="preset-status">{presets.status ?? ''}</div>
          <Notices problems={presets.problems} basic={false} />
        </div>
      )}
    </nav>
  );
}

/**
 * "Chia sẻ thành preset" (T-24, CUSTOMIZATION §6.2): biểu mẫu tại chỗ (tên, tác giả, giấy phép SPDX bắt buộc, mô tả) rồi tải gói `.dawviz-preset.zip`
 * gồm khung hiện tại và ảnh/phông nó dùng. Tác giả nhớ cho lần sau (localStorage), không gửi đi đâu.
 */
function SharePreset({ onShare, defaultName }: { onShare(info: { name: string; author: string; license: string; description: string }): Promise<void>; defaultName: string }) {
  const { i18n } = useI18n();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState(defaultName), [author, setAuthor] = useState(() => { try { return localStorage.getItem(AUTHOR_KEY) ?? ''; } catch { return ''; } });
  const [license, setLicense] = useState('CC-BY-4.0'), [description, setDescription] = useState('');
  const field = 'field w-full text-xs';
  if (!open) return <button type="button" className="btn-ghost w-full border border-control" onClick={() => { setName(defaultName); setErr(null); setOpen(true); }} data-testid="preset-share">{i18n.t('web.share.open')}</button>;
  const submit = async () => {
    if (!name.trim() || !author.trim()) { setErr('missing'); return; }
    setBusy(true); setErr(null);
    try { try { localStorage.setItem(AUTHOR_KEY, author.trim()); } catch { /* không lưu được: bỏ qua */ } await onShare({ name, author, license, description }); setOpen(false); }
    catch (e) { setErr((e as { code?: string }).code ?? 'ERR_PRESET_INVALID'); }
    finally { setBusy(false); }
  };
  return (
    <form className="space-y-2 rounded border border-line p-2" onSubmit={(e) => { e.preventDefault(); void submit(); }} aria-label={i18n.t('web.share.title')} data-testid="preset-share-form">
      <p className="text-xs font-medium text-fg">{i18n.t('web.share.title')}</p>
      <label className="block space-y-0.5 text-xs text-muted">{i18n.t('web.share.name')}<input className={field} value={name} maxLength={60} required onChange={(e) => setName(e.target.value)} data-testid="share-name" /></label>
      <label className="block space-y-0.5 text-xs text-muted">{i18n.t('web.share.author')}<input className={field} value={author} maxLength={60} required onChange={(e) => setAuthor(e.target.value)} data-testid="share-author" /></label>
      <label className="block space-y-0.5 text-xs text-muted">{i18n.t('web.share.license')}
        <Select value={license} onChange={(e) => setLicense(e.target.value)} wrapClassName="w-full" data-testid="share-license">{PRESET_LICENSES.map((l) => <option key={l} value={l}>{l}</option>)}</Select>
      </label>
      <label className="block space-y-0.5 text-xs text-muted">{i18n.t('web.share.description')}<textarea className={field} rows={2} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} data-testid="share-description" /></label>
      {err && <p role="alert" className="text-xs text-danger" data-testid="share-error">{err === 'missing' ? i18n.t('web.share.missing') : i18n.t(`errors.${err}`)}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-ghost flex-1 border border-control" disabled={busy} title=".dawviz-preset.zip" data-testid="share-download">{i18n.t('web.share.download')}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{i18n.t('web.share.cancel')}</button>
      </div>
    </form>
  );
}
const AUTHOR_KEY = 'dawviz.share.author';

/**
 * "Xuất bộ preset" (T-111, D-66 kiểu A): chọn các preset đã lưu rồi tải một gói. Không kèm mốc thời gian của dự án và không kèm tệp DAW.
 * Chọn đúng một preset thì ra gói một preset như "Chia sẻ thành preset".
 */
function ExportCollection({ items, onExport }: { items: { id: string; name: string }[]; onExport(info: { name: string; author: string; license: string; description: string }, ids: string[]): Promise<void> }) {
  const { i18n } = useI18n();
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [err, setErr] = useState<string | null>(null);
  const [picked, setPicked] = useState<Set<string>>(() => new Set(items.map((x) => x.id)));
  const [name, setName] = useState(''), [author, setAuthor] = useState(() => { try { return localStorage.getItem(AUTHOR_KEY) ?? ''; } catch { return ''; } });
  const [license, setLicense] = useState('CC-BY-4.0'), [description, setDescription] = useState('');
  const field = 'field w-full text-xs';
  if (!open) return <button type="button" className="btn-ghost w-full border border-control" onClick={() => { setPicked(new Set(items.map((x) => x.id))); setErr(null); setOpen(true); }} data-testid="collection-open">{i18n.t('web.collection.open')}</button>;
  const ids = items.filter((x) => picked.has(x.id)).map((x) => x.id);
  const submit = async () => {
    if (!ids.length) { setErr('none'); return; }
    if (!name.trim() || !author.trim()) { setErr('missing'); return; }
    setBusy(true); setErr(null);
    try { try { localStorage.setItem(AUTHOR_KEY, author.trim()); } catch { /* không lưu được: bỏ qua */ } await onExport({ name, author, license, description }, ids); setOpen(false); }
    catch (e) { setErr((e as { code?: string }).code ?? 'ERR_PRESET_INVALID'); }
    finally { setBusy(false); }
  };
  return (
    <form className="space-y-2 rounded border border-line p-2" onSubmit={(e) => { e.preventDefault(); void submit(); }} aria-label={i18n.t('web.collection.title')} data-testid="collection-form">
      <p className="text-xs font-medium text-fg">{i18n.t('web.collection.title')}</p>
      {items.length === 0 ? <p className="text-xs text-muted" data-testid="collection-empty">{i18n.t('web.collection.empty')}</p> : (
        <fieldset className="space-y-1">
          <legend className="text-xs text-muted">{i18n.t('web.collection.pick')}</legend>
          {items.map((x) => (
            <label key={x.id} className="flex items-center gap-2 text-xs text-fg">
              <input type="checkbox" checked={picked.has(x.id)} onChange={(e) => setPicked((p) => { const n = new Set(p); if (e.target.checked) n.add(x.id); else n.delete(x.id); return n; })} data-testid={`collection-pick-${x.id}`} />
              <span className="truncate">{x.name}</span>
            </label>
          ))}
          <p className="text-xs text-muted">{i18n.t('web.collection.hint')}</p>
        </fieldset>
      )}
      <label className="block space-y-0.5 text-xs text-muted">{i18n.t('web.share.name')}<input className={field} value={name} maxLength={60} required onChange={(e) => setName(e.target.value)} data-testid="collection-name" /></label>
      <label className="block space-y-0.5 text-xs text-muted">{i18n.t('web.share.author')}<input className={field} value={author} maxLength={60} required onChange={(e) => setAuthor(e.target.value)} data-testid="collection-author" /></label>
      <label className="block space-y-0.5 text-xs text-muted">{i18n.t('web.share.license')}
        <Select value={license} onChange={(e) => setLicense(e.target.value)} wrapClassName="w-full" data-testid="collection-license">{PRESET_LICENSES.map((l) => <option key={l} value={l}>{l}</option>)}</Select>
      </label>
      <label className="block space-y-0.5 text-xs text-muted">{i18n.t('web.share.description')}<textarea className={field} rows={2} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} data-testid="collection-description" /></label>
      {err && <p role="alert" className="text-xs text-danger" data-testid="collection-error">{err === 'missing' ? i18n.t('web.share.missing') : err === 'none' ? i18n.t('web.collection.none') : i18n.t(`errors.${err}`)}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-ghost flex-1 border border-control" disabled={busy || items.length === 0} title=".dawviz-preset.zip" data-testid="collection-download">{i18n.t('web.collection.download')}</button>
        <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{i18n.t('web.collection.cancel')}</button>
      </div>
    </form>
  );
}

/** Tên trùng khi nhập bộ preset (D-66): người dùng chọn ghi đè hoặc đổi tên cho từng preset; mặc định chưa chọn gì thì không có lựa chọn nào bị áp thầm lặng (đổi tên). */
function CollectionConflicts({ conflicts, onResolve, onCancel }: { conflicts: string[]; onResolve(c: Record<string, 'overwrite' | 'rename'>): void; onCancel(): void }) {
  const { i18n } = useI18n();
  const [choice, setChoice] = useState<Record<string, 'overwrite' | 'rename'>>(() => Object.fromEntries(conflicts.map((c) => [c, 'rename' as const])));
  return (
    <form className="space-y-2 rounded border border-line p-2" onSubmit={(e) => { e.preventDefault(); onResolve(choice); }} aria-label={i18n.t('web.collection.conflictTitle')} data-testid="collection-conflicts">
      <p className="text-xs font-medium text-fg">{i18n.t('web.collection.conflictTitle')}</p>
      <p className="text-xs text-muted">{i18n.t('web.collection.conflictHint')}</p>
      {conflicts.map((c, i) => (
        <fieldset key={c} className="space-y-1">
          <legend className="truncate text-xs text-fg">{c}</legend>
          {(['rename', 'overwrite'] as const).map((v) => (
            <label key={v} className="mr-3 inline-flex items-center gap-1 text-xs text-muted">
              <input type="radio" name={`conflict-${i}`} checked={choice[c] === v} onChange={() => setChoice((x) => ({ ...x, [c]: v }))} data-testid={`conflict-${v}-${i}`} />{i18n.t(`web.collection.${v}`)}
            </label>
          ))}
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-ghost flex-1 border border-control" data-testid="collection-apply">{i18n.t('web.collection.apply')}</button>
        <button type="button" className="btn-ghost" onClick={onCancel} data-testid="collection-cancel">{i18n.t('web.collection.cancel')}</button>
      </div>
    </form>
  );
}

/**
 * "Dán preset" (D-69, skill cho AI agent cách 1): dán thẳng nội dung JSON mà chatbot trả về, không phải lưu thành tệp. Đi đúng đường của nút +
 * (cùng bộ kiểm, cùng cảnh báo/lỗi), nên tệp dán và tệp chọn cho kết quả như nhau.
 */
function PastePreset({ onAdd }: { onAdd(f: File): void }) {
  const { i18n } = useI18n();
  const [open, setOpen] = useState(false), [text, setText] = useState('');
  if (!open) return <button type="button" className="btn-ghost w-full border border-control" onClick={() => setOpen(true)} data-testid="preset-paste-open">{i18n.t('web.preset.paste')}</button>;
  const submit = () => {
    const t = text.trim(); if (!t) return;
    onAdd(new File([t], 'pasted-preset.json', { type: 'application/json' }));
    setText(''); setOpen(false);
  };
  return (
    <div className="space-y-1.5" data-testid="preset-paste">
      <label className="block text-xs text-muted" htmlFor="preset-paste-text">{i18n.t('web.preset.pasteLabel')}</label>
      <textarea id="preset-paste-text" value={text} onChange={(e) => setText(e.target.value)} rows={5} spellCheck={false} autoFocus
        className="field w-full resize-y font-mono text-[11px]" placeholder='{ "schemaVersion": "0.9.0", … }' data-testid="preset-paste-text"
        onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } }} />
      <div className="flex gap-1.5">
        <button type="button" className="btn-ghost flex-1 border border-control" disabled={!text.trim()} onClick={submit} data-testid="preset-paste-add">{i18n.t('web.preset.pasteAdd')}</button>
        <button type="button" className="btn-ghost border border-control" onClick={() => { setText(''); setOpen(false); }}>{i18n.t('web.preset.pasteCancel')}</button>
      </div>
    </div>
  );
}
