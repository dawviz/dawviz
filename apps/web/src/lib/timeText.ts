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

/**
 * Như ô số thường (`parseNumberInput`): nhận phép tính `+ - * /` và ngoặc giữa các giá trị thời gian
 * (`1:30+15`, `(2:00-0:10)/2`) và dạng tương đối với giá trị hiện tại (`+=10`, `-=0:05`, `*=2`, `/=2`).
 * Mỗi toán hạng đọc theo `parseTime` (giây hoặc `m:ss`); `*`/`/` dùng số thuần làm hệ số. Kết quả < 0 hoặc không hữu hạn → null.
 */
export function parseTimeInput(text: string, current: number | null): number | null {
  let s = text.trim();
  if (!s || s.length > 64) return null;
  let rel: string | null = null;
  const m = /^([+\-*/])=/.exec(s);
  if (m) { rel = m[1]; s = s.slice(2).trim(); if (!s) return null; }
  const plain = parseTime(s);
  let v = plain ?? evalTimeExpr(s);
  if (v === null) return null;
  if (rel) {
    if (current === null) return null;
    v = rel === '+' ? current + v : rel === '-' ? current - v : rel === '*' ? current * v : v === 0 ? NaN : current / v;
  }
  return Number.isFinite(v) && v >= 0 ? v : null;
}

function evalTimeExpr(src: string): number | null {
  let i = 0, depth = 0;
  const ws = () => { while (src[i] === ' ') i++; };
  const lit = (): number | null => {
    ws();
    const r = /^\d+(?::\d+){0,2}(?:[.,]\d+)?|^[.,]\d+/.exec(src.slice(i));
    if (!r) return null;
    i += r[0].length;
    return r[0].includes(':') ? parseTime(r[0]) : Number(r[0].replace(',', '.'));
  };
  const factor = (): number | null => {
    ws();
    if (src[i] === '-') { i++; const r = factor(); return r === null ? null : -r; }
    if (src[i] === '(') {
      if (++depth > 16) return null;
      i++; const r = expr(); ws();
      if (r === null || src[i] !== ')') return null;
      i++; depth--; return r;
    }
    return lit();
  };
  const term = (): number | null => {
    let l = factor(); if (l === null) return null;
    for (;;) {
      ws(); const op = src[i];
      if (op !== '*' && op !== '/') return l;
      i++; const r = factor(); if (r === null) return null;
      l = op === '*' ? l * r : l / r;
    }
  };
  const expr = (): number | null => {
    let l = term(); if (l === null) return null;
    for (;;) {
      ws(); const op = src[i];
      if (op !== '+' && op !== '-') return l;
      i++; const r = term(); if (r === null) return null;
      l = op === '+' ? l + r : l - r;
    }
  };
  const r = expr(); ws();
  return r !== null && i === src.length && Number.isFinite(r) ? r : null;
}
