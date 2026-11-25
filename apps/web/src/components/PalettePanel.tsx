// Bảng màu cho track (T-49, REQ-UI-11), ở mục Track của thẻ Xem trước (cả Cơ bản lẫn Nâng cao). Tạo bảng màu (thêm/sửa từng ô bằng
// ColorField), nhập từ chữ dán vào / tệp .gpl / JSON / biến CSS hoặc lấy màu track hiện tại, lưu theo trình duyệt (localStorage),
// rồi "Áp lần lượt cho track": track thứ i nhận màu thứ i (quay vòng khi ít màu hơn), cả bảng là một bước hoàn tác (lệnh applyTrackPalette).
import { useId, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { assignPalette, loadPalettes, MAX_PALETTE_COLORS, MAX_PALETTE_NAME, parsePalette, savePalettes, upsertPalette, type Palette } from '../lib/palette.ts';
import { ColorField } from './ColorField.tsx';
import { Select } from './Select.tsx';
import { Minus, Plus, Trash } from './Icons.tsx';

export interface PaletteTrack { id: string; name: string; color: string }

export function PalettePanel({ tracks, onApply }: { tracks: readonly PaletteTrack[]; onApply(colors: Record<string, string>): void }) {
  const { i18n } = useI18n();
  const ids = useId();
  const [saved, setSaved] = useState<Palette[]>(loadPalettes);
  const [selected, setSelected] = useState('');
  const [colors, setColors] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [status, setStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const setDraft = (next: string[], nextName = name) => { setColors(next.slice(0, MAX_PALETTE_COLORS)); setName(nextName); setSelected(''); };
  const read = (src: string) => {
    const r = parsePalette(src);
    if (!r.colors.length) { setStatus(i18n.t('web.palette.empty')); return; }
    setDraft(r.colors, r.name ?? name);
    setStatus(r.skipped ? i18n.t('web.palette.resultSkipped', { n: String(r.colors.length), skipped: String(r.skipped) }) : i18n.t('web.palette.result', { n: String(r.colors.length) }));
  };
  const pick = (n: string) => {
    if (!n) { setSelected(''); return; }
    const p = saved.find((x) => x.name === n); if (!p) return;
    setSelected(p.name); setColors(p.colors); setName(p.name); setStatus('');
  };
  const save = () => {
    const n = (name.trim() || i18n.t('web.palette.untitled', { n: String(saved.length + 1) })).slice(0, MAX_PALETTE_NAME);
    const next = upsertPalette(saved, { name: n, colors });
    setSaved(next); savePalettes(next); setSelected(n); setName(n);
    setStatus(i18n.t('web.palette.saveMsg', { name: n }));
  };
  const remove = () => {
    const next = saved.filter((p) => p.name !== selected);
    setSaved(next); savePalettes(next); setSelected('');
  };
  const apply = () => {
    onApply(assignPalette(tracks.map((t) => t.id), colors));
    setStatus(i18n.t('web.palette.applied', { n: String(colors.length), tracks: String(tracks.length) }));
  };

  return (
    <details data-testid="palette">
      <summary className="disclosure text-xs">{i18n.t('web.palette.open')}</summary>
      <div className="space-y-2 pt-1.5 text-xs">
        <div className="flex items-center gap-1">
          <Select aria-label={i18n.t('web.palette.saved')} value={selected} onChange={(e) => pick(e.target.value)} className="py-1 pl-2" wrapClassName="min-w-0 flex-1" data-testid="palette-saved">
            <option value="">{i18n.t('web.palette.draft')}</option>
            {saved.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </Select>
          {selected && (
            <button type="button" className="tog" aria-label={i18n.t('web.palette.delete', { name: selected })} title={i18n.t('web.palette.delete', { name: selected })} onClick={remove} data-testid="palette-delete">
              <Trash className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div role="group" aria-label={i18n.t('web.palette.colors')} className="flex flex-wrap items-center gap-x-1 gap-y-0.5" data-testid="palette-colors">
          {colors.length === 0 && <span className="text-muted">{i18n.t('web.palette.noColors')}</span>}
          {colors.map((c, i) => (
            <span key={i} className="grid h-6 w-6 place-items-center">
              <ColorField variant="swatch" label={`${i18n.t('web.palette.colors')} ${i + 1}`} value={c} onChange={(v) => { setColors((cs) => cs.map((x, k) => (k === i ? v : x))); setSelected(''); }} />
            </span>
          ))}
          <button type="button" className="tog" aria-label={i18n.t('web.palette.add')} title={i18n.t('web.palette.add')} disabled={colors.length >= MAX_PALETTE_COLORS}
            onClick={() => setDraft([...colors, colors[colors.length - 1] ?? '#808080'])} data-testid="palette-add"><Plus className="h-3.5 w-3.5" /></button>
          {colors.length > 0 && (
            <button type="button" className="tog" aria-label={i18n.t('web.palette.removeLast')} title={i18n.t('web.palette.removeLast')} onClick={() => setDraft(colors.slice(0, -1))}><Minus className="h-3.5 w-3.5" /></button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <input type="text" aria-label={i18n.t('web.palette.name')} placeholder={i18n.t('web.palette.name')} value={name} maxLength={MAX_PALETTE_NAME} onChange={(e) => setName(e.target.value)}
            className="field min-h-[var(--hit)] min-w-0 flex-1 px-1.5" data-testid="palette-name" />
          <button type="button" className="btn-ghost border border-control" disabled={!colors.length} onClick={save} data-testid="palette-save">{i18n.t('web.palette.save')}</button>
        </div>
        <button type="button" className="btn-ghost w-full border border-control" disabled={!colors.length || !tracks.length} onClick={apply} data-testid="palette-apply">{i18n.t('web.palette.apply')}</button>
        <label className="block text-muted" htmlFor={`${ids}-text`}>{i18n.t('web.palette.importLabel')}</label>
        <textarea id={`${ids}-text`} value={text} onChange={(e) => setText(e.target.value)} rows={3} spellCheck={false} placeholder="#ff6a2b, #4aa8f5, rgb(127 196 138)"
          className="field w-full resize-y px-1.5 font-mono text-[11px]" data-testid="palette-text"
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); read(text); } }} />
        <div className="flex flex-wrap gap-1">
          <button type="button" className="btn-ghost border border-control" disabled={!text.trim()} onClick={() => read(text)} data-testid="palette-read">{i18n.t('web.palette.read')}</button>
          <button type="button" className="btn-ghost border border-control" onClick={() => fileRef.current?.click()}>{i18n.t('web.palette.file')}</button>
          <input ref={fileRef} type="file" accept=".gpl,.json,.css,.txt,.hex,text/plain,application/json,text/css" className="hidden" tabIndex={-1} aria-hidden data-testid="palette-file"
            onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void f.text().then(read); }} />
          <button type="button" className="btn-ghost border border-control" disabled={!tracks.length} onClick={() => { setDraft(tracks.map((t) => t.color)); setStatus(''); }} data-testid="palette-from-tracks">{i18n.t('web.palette.fromTracks')}</button>
        </div>
        <p role="status" aria-live="polite" className={status ? 'text-muted' : 'sr-only'} data-testid="palette-status">{status}</p>
      </div>
    </details>
  );
}
