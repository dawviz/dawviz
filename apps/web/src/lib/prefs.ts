// Lưu tuỳ chọn người dùng vào localStorage (tiện lợi cho từng trình duyệt; mọi truy cập đều có try/catch, thiếu thì dùng mặc định).
const KEY = 'dawviz.prefs.v1.';
export function loadPref<T extends object>(name: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(KEY + name);
    if (!raw) return fallback;
    const v = JSON.parse(raw);
    return v && typeof v === 'object' && !Array.isArray(v) ? v as T : fallback;
  } catch { return fallback; }
}
export function savePref(name: string, value: unknown): void {
  try { globalThis.localStorage?.setItem(KEY + name, JSON.stringify(value)); } catch { /* chế độ riêng tư hoặc đầy bộ nhớ: bỏ qua */ }
}
