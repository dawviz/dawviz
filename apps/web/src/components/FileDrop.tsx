// Khung thả/chọn tệp dự án (kèm .mid ngoài); hiệu ứng Framer Motion.
// `compact`: sau khi đã nạp dự án, khung thu lại thành một nút nhỏ ở thanh trên (vẫn nhận kéo thả) để khung xem trước lên đầu trang.
import { useRef, useState } from 'react';
import { Crop } from './Stage.tsx';
import { useI18n } from '../i18n/I18nProvider.tsx';

export interface Picked { main: File; extras: File[] }

const FORMATS = ['.als', '.alp', '.rpp', '.dawproject', '.mid'];

const UploadIcon = ({ className = '' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M12 15V4m0 0-4 4m4-4 4 4" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </svg>
);

/** `compact`: nút nhỏ ở thanh trên. `slim`: ô thả thu gọn một dòng, dùng khi bảng thiếu .mid đang hiện (hành động chính là nạp .mid, không phải chọn lại dự án). */
export function FileDrop({ onPick, busy, compact = false, slim = false }: { onPick(p: Picked): void; busy: boolean; compact?: boolean; slim?: boolean }) {
  const { i18n } = useI18n();
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const take = (list: FileList | null) => {
    if (!list || !list.length) return;
    const files = [...list];
    // Tệp .mid đi kèm một dự án khác (Reaper tham chiếu .mid ngoài) được coi là tệp phụ; nếu chỉ có một tệp thì nó là tệp chính.
    const main = files.find((f) => !/\.mid$/i.test(f.name)) ?? files[0];
    onPick({ main, extras: files.filter((f) => f !== main) });
  };

  const handlers = {
    role: 'button', tabIndex: 0, 'aria-busy': busy,
    onClick: () => input.current?.click(),
    // Space mặc định cuộn trang; ô thả tệp đóng vai nút nên chặn hành vi đó (như <button> gốc).
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setOver(true); },
    onDragLeave: () => setOver(false),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files); },
  } as const;
  const fileInput = (
    <input ref={input} type="file" multiple className="hidden" data-testid="file-input"
      accept=".als,.alp,.rpp,.dawproject,.mid,.midi" onChange={(e) => { take(e.target.files); e.target.value = ''; }} />
  );

  if (compact) {
    return (
      <div {...handlers} title={i18n.t('web.drop.title')}
        className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-1.5 text-[13px] transition ${over ? 'border-accent bg-accent/15 text-fg' : 'border-control bg-raised text-fg hover:border-line-strong'}`}>
        <UploadIcon className={`h-4 w-4 ${busy ? 'motion-safe:animate-pulse text-accent' : 'text-muted'}`} />
        <span className="whitespace-nowrap">{busy ? i18n.t('web.drop.busy') : i18n.t('web.open')}</span>
        {fileInput}
      </div>
    );
  }

  if (slim) {
    return (
      <div {...handlers} data-testid="file-drop"
        className={`flex cursor-pointer items-center justify-center gap-2 border border-dashed px-4 py-3 text-[13px] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${over ? 'border-accent bg-accent/10 text-fg' : 'border-control bg-surface text-muted hover:border-line-strong hover:text-fg'}`}>
        <UploadIcon className={`h-4 w-4 ${busy ? 'motion-safe:animate-pulse' : ''}`} />
        <span>{busy ? i18n.t('web.drop.busy') : i18n.t('web.drop.again')}</span>
        {fileInput}
      </div>
    );
  }

  // Màn đầu tiên dùng cùng ngôn ngữ với sân khấu: một tờ bản in thử chưa có gì (dấu cắt, dòng thông số), để ngay từ
  // giây đầu người dùng thấy đây là nơi video của họ sẽ hiện. Kéo thả vào đâu trên tờ cũng được; bấm để chọn tệp.
  return (
    <div className="space-y-2" data-testid="file-drop">
      <div className="flex justify-between gap-3 text-xs tabular-nums text-muted">
        <span>{i18n.t('web.drop.empty')}</span><span aria-hidden>{FORMATS.join(' · ')}</span>
      </div>
      <div className="relative">
        <Crop className="-left-5 -top-5" /><Crop className="-right-5 -top-5 -scale-x-100" />
        <Crop className="-bottom-5 -left-5 -scale-y-100" /><Crop className="-bottom-5 -right-5 -scale-100" />
        <div {...handlers}
          className={`group flex cursor-pointer flex-col items-center justify-center gap-3 border px-6 py-16 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-focus ${over ? 'border-accent bg-accent/10' : 'border-control bg-surface hover:border-line-strong'}`}>
          <UploadIcon className={`h-7 w-7 transition ${over ? 'text-accent' : 'text-muted group-hover:text-fg'} ${busy ? 'motion-safe:animate-pulse' : ''}`} />
          <p className="text-lg font-semibold tracking-tight text-fg">{busy ? i18n.t('web.drop.busy') : i18n.t('web.drop.title')}</p>
          <p className="max-w-md text-sm leading-relaxed text-muted">{i18n.t('web.drop.hint')}</p>
          <p className="max-w-md text-sm leading-relaxed text-muted">{i18n.t('web.drop.fl')}</p>
          {fileInput}
        </div>
      </div>
    </div>
  );
}
