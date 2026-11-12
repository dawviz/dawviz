// Quy tắc tạo anchor (id) cho heading, giống GitHub: chữ thường, bỏ ký tự đặc biệt/emoji, khoảng trắng → '-'. Dùng chung cho sync-docs và docs site.
export const stripInline = (t) => t.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[`*~]/g, '').trim();
export const slug = (text) => stripInline(text).toLowerCase().replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '').replace(/\s/g, '-');
/** Trả hàm cấp id duy nhất trong một trang: lần trùng thứ n thêm hậu tố -n. */
export function uniqueSlugger() {
  const seen = new Map();
  return (text) => { const a = slug(text), n = seen.get(a) ?? 0; seen.set(a, n + 1); return n ? `${a}-${n}` : a; };
}
