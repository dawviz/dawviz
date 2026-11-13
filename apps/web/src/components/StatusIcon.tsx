// Biểu tượng trạng thái cho lỗi và cảnh báo. Bắt buộc đi kèm màu danger/warning (DESIGN.md "Danger-Is-Not-Accent"):
// với bảng màu Bản in đỏ hoặc Đồng, màu nhấn gần tông với danger/warning, nên không được để màu tự nói.
export function StatusIcon({ kind, className = 'h-4 w-4' }: { kind: 'error' | 'warning'; className?: string }) {
  return kind === 'error' ? (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={className} aria-hidden>
      <circle cx="8" cy="8" r="6.25" /><path d="M8 4.75v3.75M8 11.1v.15" />
    </svg>
  ) : (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M8 2.1 14.4 13.4H1.6Z" /><path d="M8 6.5v3M8 11.6v.1" />
    </svg>
  );
}
