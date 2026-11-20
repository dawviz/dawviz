// Đọc/ghi thời gian người dùng gõ cho khoảng hiển thị và phase (T-81): "90", "90.5", "1:30", "1:30.25", "1:02:03".
// Hàm thuần. Dấu phẩy thập phân cũng được ("1:30,5"). Không nhận số âm.

/** Chuỗi → giây, hoặc null nếu không đọc được. */
export function parseTime(text: string): number | null {
  const s = text.trim().replace(',', '.');
  if (!s) return null;
  const parts = s.split(':');
  if (parts.length > 3) return null;
  let total = 0;
  for (let i = 0; i < parts.length; i++) {
    const last = i === parts.length - 1;
    if (!(last ? /^\d+(\.\d{1,3})?$/ : /^\d+$/).test(parts[i])) return null;
    if (i > 0 && !last && Number(parts[i]) > 59) return null;
    if (i > 0 && last && Number(parts[i]) >= 60) return null;
    total = total * 60 + Number(parts[i]);
  }
  return total;
}

/** Giây → `m:ss`, thêm phần lẻ (tối đa 3 chữ số, bỏ số 0 cuối) khi có; từ 1 giờ: `h:mm:ss`. */
export function formatTime(sec: number): string {
  const ms = Math.round(Math.max(0, Number.isFinite(sec) ? sec : 0) * 1000);
  const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60, r = ms % 1000;
  const frac = r ? `.${String(r).padStart(3, '0').replace(/0+$/, '')}` : '';
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}${frac}` : `${m}:${String(s).padStart(2, '0')}${frac}`;
}
