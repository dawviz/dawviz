// Phần khung dùng chung của panel đổi cỡ (Editor và Xem trước, DESIGN.md "Dải panel thu gọn"): nút thu gọn và dải mỏng của panel đã thu gọn.
import type { ReactNode } from 'react';
import { PanelLeft, PanelRight } from './Icons.tsx';

/** Nút thu gọn panel (chỉ biểu tượng; tên và phím tắt ở chú thích). */
export function PanelCollapse({ label, icon, onClick, testId }: { label: string; icon: ReactNode; onClick(): void; testId: string }) {
  return <button type="button" className="tog" aria-label={label} title={label} onClick={onClick} data-testid={testId}>{icon}</button>;
}

/** Dải mỏng của panel đã thu gọn: cả dải là một nút mở lại, tên panel chạy dọc (dưới 1024 px: một hàng ngang). */
export function Rail({ side, label, title, onOpen, testId }: { side: 'left' | 'right'; label: string; title: string; onOpen(): void; testId: string }) {
  const Icon = side === 'left' ? PanelLeft : PanelRight;
  return (
    <button type="button" onClick={onOpen} title={title} aria-label={title} data-testid={testId}
      className={`flex h-full w-full items-center gap-2 border-line bg-surface px-3 py-2 text-xs text-muted transition hover:bg-raised hover:text-fg max-lg:border-y lg:flex-col lg:px-0 lg:py-3 ${side === 'left' ? 'lg:border-r' : 'lg:border-l'}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="lg:[writing-mode:vertical-rl]">{label}</span>
    </button>
  );
}
