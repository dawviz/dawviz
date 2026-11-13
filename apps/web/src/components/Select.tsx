// Ô chọn dùng chung: <select> gốc của trình duyệt (bàn phím, trình đọc màn hình giữ nguyên) bọc trong khung vẽ mũi tên
// bằng mask + currentColor, nên mũi tên đổi màu theo theme như mọi chữ khác (D-52), không dùng ảnh có mã màu cứng.
// `wrapClassName` cho bố cục (flex-1, min-w-0…); `className` cho chính ô chọn (padding, truncate…).
import type { SelectHTMLAttributes } from 'react';

export function Select({ wrapClassName = '', className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement> & { wrapClassName?: string }) {
  return (
    <span className={`select-wrap ${wrapClassName}`}>
      <select {...props} className={`field ${className}`} />
    </span>
  );
}
