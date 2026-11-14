// Đọc và bước giá trị cho ô nhập số dùng chung (REQ-UI-15). Hàm thuần, không phụ thuộc DOM; không dùng eval/Function.
//
// Chấp nhận: số (`0.7`, `0,7`, `-3`, `.5`), đơn vị khai báo trước (`12px`, `50%`), phép tính `+ - * /` và ngoặc
// (`1920/2`, `(4+2)*3`), tương đối với giá trị hiện tại (`+=10`, `-=0.1`, `*=2`, `/=2`).
// Biểu thức đầy đủ (tiền tố `=`, REQ-GRAPHICS-13) không xử lý ở đây: trả lỗi `expr` để giao diện chuyển sang ô biểu thức.

export interface NumberSpec {
  /** Giới hạn cứng: nhập ngoài khoảng thì kẹp và báo `clamped`. Mặc định ±Infinity. */
  min?: number; max?: number;
  /** Bước của ↑/↓; Shift ×10, Alt ×0,1. Mặc định 1. */
  step?: number;
  /** Đơn vị hợp lệ và hệ số đổi về đơn vị gốc, ví dụ `{ px: 1 }` hoặc `{ '%': 0.01 }`. */
  units?: Record<string, number>;
}

export type ParseResult =
  | { ok: true; value: number; clamped: boolean }
  | { ok: false; reason: 'empty' | 'syntax' | 'unit' | 'nan' | 'expr'; at?: number };

const MAX_LEN = 64, MAX_DEPTH = 16;

/** Đọc chuỗi người dùng nhập; `current` dùng cho dạng tương đối `+=`/`-=`/`*=`/`/=`. */
export function parseNumberInput(text: string, current: number, spec: NumberSpec = {}): ParseResult {
  let s = text.trim();
  if (!s) return { ok: false, reason: 'empty' };
  if (s.length > MAX_LEN) return { ok: false, reason: 'syntax', at: MAX_LEN };
  if (s.startsWith('=')) return { ok: false, reason: 'expr' };

  let rel: string | null = null;
  const m = /^([+\-*/])=/.exec(s);
  if (m) { rel = m[1]; s = s.slice(2).trim(); }

  const r = evaluate(s, spec.units ?? {});
  if (!r.ok) return r;
  let v = r.value;
  if (rel === '+') v = current + v; else if (rel === '-') v = current - v;
  else if (rel === '*') v = current * v; else if (rel === '/') v = v === 0 ? NaN : current / v;
  if (!Number.isFinite(v)) return { ok: false, reason: 'nan' };
  return clamp(v, spec);
}

/** Bước bằng phím: dir = +1/-1; Shift ×10, Alt ×0,1. Kết quả làm tròn theo bước để tránh 0.30000000000000004. */
export function nudge(value: number, dir: 1 | -1, spec: NumberSpec = {}, mods: { shift?: boolean; alt?: boolean } = {}): number {
  const base = spec.step ?? 1;
  const step = base * (mods.shift ? 10 : 1) * (mods.alt ? 0.1 : 1);
  return clamp(roundTo(value + dir * step, step), spec).value as number;
}

/** Bề rộng (px) kéo để đi hết phạm vi mềm: phạm vi 0–1 bước 0,05 thì cứ ~10 px một bước. */
export const SCRUB_SPAN_PX = 200;

/**
 * Giá trị khi kéo trên ô (scrub): `px` là quãng con trỏ đã đi tính từ lúc bắt đầu (dương = tăng).
 * Có `range` (phạm vi mềm) thì kéo SCRUB_SPAN_PX px đi hết phạm vi; không có thì một bước mỗi px.
 * Shift ×10, Alt ×0,1 (bước làm tròn cũng nhỏ đi theo). Kết quả làm tròn theo bước rồi kẹp theo giới hạn cứng.
 */
export function scrubValue(start: number, px: number, spec: NumberSpec = {}, range?: [number, number], mods: { shift?: boolean; alt?: boolean } = {}): number {
  const step = spec.step ?? 1;
  const mult = (mods.shift ? 10 : 1) * (mods.alt ? 0.1 : 1);
  const perPx = range && range[1] > range[0] ? Math.max((range[1] - range[0]) / SCRUB_SPAN_PX, step / 10) : step;
  const unit = step * (mods.alt ? 0.1 : 1);
  const raw = start + px * perPx * mult;
  return clamp(roundTo(Math.round(raw / unit) * unit, unit), spec).value;
}

/** Hiển thị giá trị trong ô: số chữ số thập phân theo bước. */
export function formatNumber(value: number, step = 1): string {
  return value.toFixed(decimals(step));
}

function clamp(v: number, spec: NumberSpec): { ok: true; value: number; clamped: boolean } {
  const lo = spec.min ?? -Infinity, hi = spec.max ?? Infinity;
  const c = Math.min(hi, Math.max(lo, v));
  return { ok: true, value: c, clamped: c !== v };
}
function decimals(step: number): number {
  if (!Number.isFinite(step) || step <= 0) return 2;
  const s = String(step); const i = s.indexOf('.');
  return i < 0 ? 0 : Math.min(6, s.length - i - 1);
}
function roundTo(v: number, step: number): number {
  const d = decimals(step); return Number(v.toFixed(d));
}

// ───── Bộ đọc biểu thức số học nhỏ (đệ quy xuống), có giới hạn độ sâu ─────
type Ev = { ok: true; value: number } | { ok: false; reason: 'syntax' | 'unit' | 'nan'; at?: number };

function evaluate(src: string, units: Record<string, number>): Ev {
  let i = 0, depth = 0;
  const ws = () => { while (src[i] === ' ') i++; };
  const fail = (reason: 'syntax' | 'unit' = 'syntax'): Ev => ({ ok: false, reason, at: i });

  function number(): Ev {
    ws();
    const start = i;
    while (i < src.length && /[0-9.,]/.test(src[i])) i++;
    const raw = src.slice(start, i);
    if (!raw) return fail();
    // Dấu phẩy là dấu thập phân (kiểu Việt) khi chỉ có một dấu và không có dấu chấm.
    const norm = raw.includes('.') ? (raw.includes(',') ? null : raw) : raw.split(',').length === 2 ? raw.replace(',', '.') : raw.includes(',') ? null : raw;
    if (norm === null || !/^(\d+\.?\d*|\.\d+)$/.test(norm)) { i = start; return fail(); }
    let v = Number(norm);
    ws();
    const u = /^(%|[a-zA-Z]+)/.exec(src.slice(i));
    if (u) {
      const f = units[u[1]] ?? units[u[1].toLowerCase()];
      if (f === undefined) return fail('unit');
      v *= f; i += u[1].length;
    }
    return { ok: true, value: v };
  }
  function factor(): Ev {
    ws();
    if (src[i] === '-' || src[i] === '+') { const neg = src[i] === '-'; i++; const r = factor(); return r.ok ? { ok: true, value: neg ? -r.value : r.value } : r; }
    if (src[i] === '(') {
      if (++depth > MAX_DEPTH) return fail();
      i++; const r = expr(); if (!r.ok) return r; ws();
      if (src[i] !== ')') return fail();
      i++; depth--; return r;
    }
    return number();
  }
  function term(): Ev {
    let l = factor(); if (!l.ok) return l;
    for (;;) {
      ws(); const op = src[i];
      if (op !== '*' && op !== '/') return l;
      i++; const r = factor(); if (!r.ok) return r;
      l = { ok: true, value: op === '*' ? l.value * r.value : l.value / r.value };
    }
  }
  function expr(): Ev {
    let l = term(); if (!l.ok) return l;
    for (;;) {
      ws(); const op = src[i];
      if (op !== '+' && op !== '-') return l;
      i++; const r = term(); if (!r.ok) return r;
      l = { ok: true, value: op === '+' ? l.value + r.value : l.value - r.value };
    }
  }

  const r = expr(); ws();
  if (!r.ok) return r;
  if (i !== src.length) return fail();
  if (!Number.isFinite(r.value)) return { ok: false, reason: 'nan' };
  return r;
}
