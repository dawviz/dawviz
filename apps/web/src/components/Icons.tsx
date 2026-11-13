// Biểu tượng vẽ tay bằng SVG, một nét 1,5 trên lưới 16 (không dùng ký tự Unicode hay phông biểu tượng).
// Luôn aria-hidden: nghĩa nằm ở nhãn của nút chứa biểu tượng.
type P = { className?: string };
const S = ({ className = 'h-4 w-4', children }: P & { children: React.ReactNode }) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>{children}</svg>
);

export const ChevronRight = (p: P) => <S {...p}><path d="M6 3.5 10.5 8 6 12.5" /></S>;
/** Đồng hồ có mũi tên quay ngược: lịch sử chỉnh sửa. */
export const HistoryIcon = (p: P) => <S {...p}><path d="M2.5 3v3h3" /><path d="M2.7 8.5A5.5 5.5 0 1 0 4.1 4.4L2.5 6" /><path d="M8 5v3l2 1.2" /></S>;
export const Info = (p: P) => <S {...p}><circle cx="8" cy="8" r="6.25" /><path d="M8 7.25v4M8 4.75v.1" /></S>;
export const Eye = (p: P) => <S {...p}><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" /><circle cx="8" cy="8" r="2" /></S>;
export const EyeOff = (p: P) => <S {...p}><path d="M6.2 3.8A6.6 6.6 0 0 1 8 3.5C12 3.5 14.5 8 14.5 8a12 12 0 0 1-1.7 2.2M9.6 11.9a6 6 0 0 1-1.6.6C4 12.5 1.5 8 1.5 8a12 12 0 0 1 2.7-3.1" /><path d="m2 2 12 12" /></S>;
export const Grip = (p: P) => (
  <svg viewBox="0 0 16 16" className={p.className ?? 'h-4 w-4'} aria-hidden fill="currentColor">
    {[4.5, 8, 11.5].flatMap((y) => [6, 10].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.1" />))}
  </svg>
);
export const ToStart = (p: P) => <S {...p}><path d="M4 3.5v9M11.5 4 7.5 8l4 4" /></S>;
export const Back = (p: P) => <S {...p}><path d="M8 4 4 8l4 4M12.5 4l-4 4 4 4" /></S>;
export const Forward = (p: P) => <S {...p}><path d="m8 4 4 4-4 4M3.5 4l4 4-4 4" /></S>;
export const Play = ({ className = 'h-4 w-4' }: P) => <svg viewBox="0 0 16 16" className={className} aria-hidden><path fill="currentColor" d="M5 3.4v9.2c0 .6.7 1 1.2.6l7-4.6a.75.75 0 0 0 0-1.2l-7-4.6c-.5-.4-1.2 0-1.2.6Z" /></svg>;
export const Pause = ({ className = 'h-4 w-4' }: P) => <svg viewBox="0 0 16 16" className={className} aria-hidden><rect x="3.5" y="3" width="3" height="10" rx="1" fill="currentColor" /><rect x="9.5" y="3" width="3" height="10" rx="1" fill="currentColor" /></svg>;
export const Undo = (p: P) => <S {...p}><path d="M5.5 3 2.5 6l3 3" /><path d="M3 6h6.5a3.5 3.5 0 0 1 0 7H6" /></S>;
export const Redo = (p: P) => <S {...p}><path d="m10.5 3 3 3-3 3" /><path d="M13 6H6.5a3.5 3.5 0 0 0 0 7H10" /></S>;
export const Sun = (p: P) => <S {...p}><circle cx="8" cy="8" r="2.75" /><path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" /></S>;
export const Moon = (p: P) => <S {...p}><path d="M13.2 9.6A5.5 5.5 0 0 1 6.4 2.8a5.5 5.5 0 1 0 6.8 6.8Z" /></S>;
export const Upload = (p: P) => <S {...p}><path d="M8 10.5V2.5m0 0L5.25 5.25M8 2.5l2.75 2.75" /><path d="M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2" /></S>;
/** Dấu ứng dụng: ba thanh nốt lệch nhau gợi piano roll. Dùng màu chữ, không dùng màu nhấn. */
export const Mark = ({ className = 'h-4 w-4' }: P) => (
  <svg viewBox="0 0 16 16" className={className} aria-hidden fill="currentColor"><rect x="2" y="3" width="6" height="2" rx=".5" /><rect x="6" y="7" width="8" height="2" rx=".5" /><rect x="3" y="11" width="5" height="2" rx=".5" /></svg>
);
