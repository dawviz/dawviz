// Hộp thoại Chữ (D-78, T-138): mục **Chữ** của menu Thêm mở hộp thoại này. Bên trái là các mẫu (Ô chữ điền sẵn chỗ giữ; widget chữ có phần vẽ riêng),
// bên phải là ảnh xem trước của mẫu đang rê chuột hoặc đang có tiêu điểm, vẽ bằng Render Core trên dự án mẫu (lib/textTemplates.ts). Bấm một lần là thêm.
// Esc hoặc nút đóng: không thêm gì. Tab xoay vòng trong hộp; đóng xong trả tiêu điểm về chỗ cũ (như ConfirmDialog).
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { SceneDocument } from '@dawviz/render-core';
import { useI18n } from '../i18n/I18nProvider.tsx';
import { TEXT_TEMPLATES, previewOf, type TextTemplate } from '../lib/textTemplates.ts';
import { SceneCanvas } from './SceneCanvas.tsx';
import { Close } from './Icons.tsx';

/** Tên hiện của một mẫu: mẫu Ô chữ có khoá riêng, widget có phần vẽ riêng dùng tên mô tả phần vẽ đó. */
export const templateLabelKey = (tpl: TextTemplate) => `web.textTpl.${tpl.id}`;

export function TextDialog({ scene, fontsReady, onPick, onClose }: { scene: SceneDocument; fontsReady: boolean; onPick(tpl: TextTemplate): void; onClose(): void }) {
  const { i18n } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState<TextTemplate>(TEXT_TEMPLATES[0]);
  const preview = useMemo(() => previewOf(shown, scene), [shown, scene]);
  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    box.current?.querySelector<HTMLButtonElement>('[data-template]')?.focus();
    return () => { back?.focus?.(); };
  }, []);
  const keys = (e: KeyboardEvent) => {
    e.stopPropagation(); // phím trong hộp thoại không tới phím tắt của Editor (Delete, Ctrl+A…)
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onClose(); return; }
    const all = [...(box.current?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? [])];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const items = all.filter((b) => b.dataset.template), i = items.indexOf(document.activeElement as HTMLElement);
      if (i < 0) return;
      e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
      return;
    }
    if (e.key !== 'Tab' || !all.length) return;
    const first = all[0], last = all[all.length - 1], at = document.activeElement;
    if (e.shiftKey && at === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && at === last) { e.preventDefault(); first.focus(); }
  };
  const group = (g: TextTemplate['group']) => (
    <section aria-labelledby={`text-dlg-${g}`} className="space-y-1">
      <h3 id={`text-dlg-${g}`} className="text-[11px] font-semibold text-muted">{i18n.t(`web.textDlg.${g}`)}</h3>
      <ul className="space-y-px">
        {TEXT_TEMPLATES.filter((t) => t.group === g).map((t) => (
          <li key={t.id}>
            <button type="button" data-template={t.id} data-testid={`text-tpl-${t.id}`} aria-describedby="text-dlg-preview-name"
              className={`flex min-h-[var(--hit)] w-full items-center rounded-sm px-2 text-left text-xs text-fg hover:bg-raised focus:bg-raised focus:outline-none focus-visible:ring-1 focus-visible:ring-focus ${shown.id === t.id ? 'bg-raised' : ''}`}
              onMouseEnter={(e) => e.currentTarget.focus()} onFocus={() => setShown(t)} onClick={() => onPick(t)}>
              {i18n.t(templateLabelKey(t))}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" data-testid="text-dialog" onKeyDown={keys}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="text-dlg-title" className="flex max-h-full w-full max-w-2xl flex-col gap-3 rounded border border-line bg-surface p-5 text-fg">
        <div className="flex items-center justify-between gap-2">
          <h2 id="text-dlg-title" className="text-[16px] font-semibold">{i18n.t('web.textDlg.title')}</h2>
          <button type="button" className="tog" aria-label={i18n.t('web.textDlg.close')} title={i18n.t('web.textDlg.close')} onClick={onClose} data-testid="text-dialog-close"><Close className="h-3.5 w-3.5" /></button>
        </div>
        <div className="grid min-h-0 grid-cols-[minmax(0,13rem)_minmax(0,1fr)] gap-4">
          <div className="min-h-0 space-y-3 overflow-y-auto pr-1">{group('box')}{group('drawn')}</div>
          <figure className="min-w-0 space-y-2" data-testid="text-dialog-preview">
            <div className="overflow-hidden rounded border border-line">
              <SceneCanvas scene={preview.scene} derived={preview.derived} ast={preview.ast} t={preview.t} blocked={!fontsReady} />
            </div>
            <figcaption id="text-dlg-preview-name" className="text-xs text-muted">{i18n.t(templateLabelKey(shown))}</figcaption>
          </figure>
        </div>
      </div>
    </div>
  );
}
