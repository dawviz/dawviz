// Tìm thiết lập (REQ-UI-13, T-60): so khớp chữ người dùng gõ với nhãn đã dịch của mục/ô thiết lập. Hàm thuần, không DOM.
// Không phân biệt hoa/thường và dấu tiếng Việt ("mau" khớp "Màu", "do day" khớp "Độ dày"); nhiều từ thì phải khớp đủ mọi từ, theo thứ tự bất kỳ.

/** Chữ thường, bỏ dấu (NFD + bỏ dấu kết hợp, đ → d), gộp khoảng trắng. */
export function foldText(s: string): string {
  return s.normalize('NFD').replace(/\p{M}+/gu, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/\s+/g, ' ').trim();
}
/** Các từ của câu tìm (đã gập). Rỗng = không tìm. */
export const queryTerms = (q: string): string[] => foldText(q).split(' ').filter(Boolean);
/** `text` có chứa đủ mọi từ của `q` không. Câu tìm rỗng thì luôn khớp. */
export function matchesQuery(text: string, q: string): boolean {
  const terms = queryTerms(q);
  if (!terms.length) return true;
  const t = foldText(text);
  return terms.every((w) => t.includes(w));
}
/** Lọc danh sách theo nhãn; câu tìm rỗng thì giữ nguyên. */
export function filterByQuery<T>(items: readonly T[], label: (x: T) => string, q: string): T[] {
  return queryTerms(q).length ? items.filter((x) => matchesQuery(label(x), q)) : [...items];
}
