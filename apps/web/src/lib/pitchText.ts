// Đọc/ghi tên nốt cho ô "Dải cao độ" (C1, C#3, Db2). Tệp JSON vẫn lưu số MIDI (pitchMin/pitchMax); chỉ giao diện dùng tên nốt.
// Quy ước C4 = 60 (cùng `pitchName` của Render Core).
const SEMI: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "C4" → 60, "c#3" → 49, "Db2" → 37, "60" → 60. Ngoài 0–127 hoặc sai cú pháp → null. */
export function parsePitch(text: string): number | null {
  const s = text.trim().replace(/♯/g, '#').replace(/♭/g, 'b');
  if (/^\d{1,3}$/.test(s)) { const n = Number(s); return n <= 127 ? n : null; }
  const m = /^([A-Ga-g])([#b]?)(-?\d)$/.exec(s);
  if (!m) return null;
  const p = SEMI[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return p >= 0 && p <= 127 ? p : null;
}
