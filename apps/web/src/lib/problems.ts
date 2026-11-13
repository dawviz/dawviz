// Lỗi/cảnh báo của thư viện → chuỗi đã dịch theo mã (REQ-I18N-04). Thông điệp gốc của thư viện chỉ là "chi tiết kỹ thuật".
import type { I18n } from '@dawviz/i18n';

export interface Problem { kind: 'error' | 'warning'; code: string; text: string; technical?: string; cosmetic?: boolean }

/** Cảnh báo KHÔNG làm đổi hình người dùng thấy: chỉ là xấp xỉ đường cong automation, automation chưa đọc (độ sáng nền mặc định
 *  là đều nhau, không dùng automation), thông tin xác nhận (tempo đọc từ tệp, tempo do chính người dùng ghi đè),
 *  thiếu metadata, chưa có dấu nhịp (chưa có widget Bar.Beat), nốt dài 0 được kéo thành 1 tick. Ở chế độ Cơ bản chúng gộp vào một
 *  dòng thu gọn không màu vàng. Mã không có trong danh sách này mặc định được coi là CÓ thể đổi hình (an toàn hơn). */
export const COSMETIC_WARNINGS: ReadonlySet<string> = new Set([
  'WARN_RPP_ENVELOPE_SHAPE_APPROX', 'WARN_RPP_ENVELOPES_IGNORED', 'WARN_TEMPO_AUTOMATION', 'WARN_TEMPO_OVERRIDDEN',
  'WARN_DAWPROJECT_NO_METADATA', 'WARN_TIMESIG_DEFAULT', 'WARN_ZERO_LENGTH_NOTES',
]);

const flat = (d?: Record<string, unknown>) => {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d ?? {})) o[k] = Array.isArray(v) ? v.join(', ') : v;
  return o;
};

export function describeProblem(i18n: Pick<I18n, 'has' | 't'>, kind: 'error' | 'warning', code: string, message?: string, details?: Record<string, unknown>): Problem {
  const key = `${kind === 'error' ? 'errors' : 'warn'}.${code}`;
  const text = i18n.has(key) ? i18n.t(key, flat(details)) : (message ?? code);
  const p: Problem = { kind, code, text, technical: message && message !== text ? message : undefined };
  if (kind === 'warning' && COSMETIC_WARNINGS.has(code)) p.cosmetic = true;
  return p;
}
