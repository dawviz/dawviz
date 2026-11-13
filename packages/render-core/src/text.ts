// Chữ trong Render Core (TECHNICAL-DESIGN 5.7): đo bằng bảng FONT_METRICS (thuần, chạy ở Node), mẫu chữ, chia nhóm số.
// Không DOM, không measureText: cùng (văn bản, phông, cỡ) → cùng độ rộng ở Preview, Export Worker và test.
import { FONT_METRICS_DATA } from './fontMetrics.generated.ts';

/** Hàm đo truyền vào layout (điều kiện 4): độ rộng của `text` tính bằng pt. Phông người dùng nạp thay hàm này bằng bảng của họ. */
export type Measure = (text: string, font: string, size: number, weight: number) => number;

const WEIGHTS = Object.keys(FONT_METRICS_DATA.weights).map(Number).sort((a, b) => a - b);
const UPM = FONT_METRICS_DATA.unitsPerEm;
/** Độ rộng dự phòng (em) cho ký tự ngoài bảng: chữ CJK/emoji rộng 1 em, còn lại 0,6 em. Chỉ là ước lượng; bước vẽ vẫn cắt theo khung. */
export function fallbackEm(cp: number): number {
  if ((cp >= 0x2e80 && cp <= 0xffef) || cp >= 0x1f000) return 1;
  if (cp >= 0x0300 && cp <= 0x036f) return 0; // dấu kết hợp
  return 0.6;
}
const nearestWeight = (w: number) => WEIGHTS.reduce((b, x) => (Math.abs(x - w) < Math.abs(b - w) ? x : b), WEIGHTS[0]);

/** Đo bằng FONT_METRICS (Space Grotesk, chưa kerning). Họ phông khác dùng cùng bảng như ước lượng. */
export const measureText: Measure = (text, _font, size, weight) => {
  const table = FONT_METRICS_DATA.weights[String(nearestWeight(weight)) as '400'] as Readonly<Record<string, number>>;
  let sum = 0;
  for (const ch of text) { const cp = ch.codePointAt(0)!; sum += (table[cp] ?? fallbackEm(cp) * UPM); }
  return (sum / UPM) * size;
};

/** Cắt chữ cho vừa `maxWidth`, thêm "…" nếu cắt. Thuần theo `measure`. */
export function fitText(text: string, maxWidth: number, font: string, size: number, weight: number, measure: Measure = measureText): string {
  if (!(maxWidth > 0)) return '';
  const EPS = 1e-6; // chữ vừa khít khung (tổng các đoạn bằng đúng bề rộng) không bị cắt oan vì sai số dấu phẩy động
  if (measure(text, font, size, weight) <= maxWidth + EPS) return text;
  const chars = [...text];
  let lo = 0, hi = chars.length; // lớn nhất n sao cho chars[0..n] + "…" vừa
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (measure(chars.slice(0, mid).join('').trimEnd() + '…', font, size, weight) <= maxWidth + EPS) lo = mid; else hi = mid - 1;
  }
  return lo === 0 ? '' : chars.slice(0, lo).join('').trimEnd() + '…';
}

/** Thay `{tên}` bằng giá trị; chỗ giữ lạ được giữ nguyên chữ. */
export function formatTemplate(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{([A-Za-z]+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}
/** Các tên chỗ giữ trong mẫu mà `known` không có (để cảnh báo khi đọc preset). */
export function unknownPlaceholders(template: string, known: readonly string[]): string[] {
  return [...template.matchAll(/\{([A-Za-z]+)\}/g)].map((m) => m[1]).filter((k) => !known.includes(k));
}

/** Số nguyên không âm, đệm 0 đến `width` chữ số (số lớn hơn thì giữ đủ chữ số). */
export const pad = (n: number, width: number) => String(Math.max(0, Math.floor(n))).padStart(width, '0');
/** Chia nhóm có số 0 đứng đầu: groupDigits([1, 35, 83], [3, 2, 3]) = "001 35 083". */
export function groupDigits(parts: readonly number[], widths: readonly number[]): string {
  return parts.map((p, i) => pad(p, widths[i] ?? 2)).join(' ');
}
/** Số thập phân với `d` chữ số, dấu chấm (chữ trong video không theo ngôn ngữ ứng dụng). */
export const fixed = (v: number, d: number) => (Number.isFinite(v) ? v : 0).toFixed(Math.max(0, Math.min(4, d)));
/** m:ss (phút không đệm 0). */
export function clockMs(sec: number): string {
  const s = Math.max(0, Math.floor(Number.isFinite(sec) ? sec : 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
