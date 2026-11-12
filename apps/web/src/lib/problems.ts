// Lỗi/cảnh báo của thư viện → chuỗi đã dịch theo mã (REQ-I18N-04). Thông điệp gốc của thư viện chỉ là "chi tiết kỹ thuật".
import type { I18n } from '@dawviz/i18n';

export interface Problem { kind: 'error' | 'warning'; code: string; text: string; technical?: string }

const flat = (d?: Record<string, unknown>) => {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(d ?? {})) o[k] = Array.isArray(v) ? v.join(', ') : v;
  return o;
};

export function describeProblem(i18n: Pick<I18n, 'has' | 't'>, kind: 'error' | 'warning', code: string, message?: string, details?: Record<string, unknown>): Problem {
  const key = `${kind === 'error' ? 'errors' : 'warn'}.${code}`;
  const text = i18n.has(key) ? i18n.t(key, flat(details)) : (message ?? code);
  return { kind, code, text, technical: message && message !== text ? message : undefined };
}
