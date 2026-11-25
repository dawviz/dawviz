// Bậc hợp âm theo giọng (tham chiếu bảng phân tích nhạc, REFERENCE-VIDEOS video 3): "Ebmaj7/G" trong giọng Eb → "Imaj7/III".
// Hàm thuần trên tên hợp âm do hud.chordName sinh ra (ký hiệu tonal: gốc A–G kèm #/b, phần chất lượng, "/bass" khi đảo).
// Không dò hợp âm ở đây; giọng lấy từ scene.tonic hoặc keyAt (insight.ts). Dùng chung cho widget Degree, Vòng quãng năm và chỗ giữ {degree}.

const LETTER: Readonly<Record<string, number>> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** Số La Mã của 12 bậc nửa cung so với nốt chủ (bậc biến âm ghi kiểu thường gặp: ♭II, ♭III, ♯IV, ♭VI, ♭VII). */
export const ROMAN_DEGREES = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'] as const;
/** Cách viết bậc: SUFFIX = La Mã hoa + hậu tố chất lượng ("VIm7"); CASE = thứ/giảm viết thường, bỏ "m" ("vi7", "vii°"). */
export type RomanStyle = 'SUFFIX' | 'CASE';
export const ROMAN_STYLES: readonly RomanStyle[] = ['SUFFIX', 'CASE'];
/** Chức năng hoà âm theo bậc gốc: T (chủ), SD (hạ át), D (át). Bậc biến âm xếp theo cách dùng phổ biến trong nhạc pop. */
export type HarmonicFunction = 'T' | 'SD' | 'D';
const FUNCTION_OF: readonly HarmonicFunction[] = ['T', 'SD', 'SD', 'T', 'T', 'SD', 'D', 'D', 'SD', 'T', 'SD', 'D'];

const mod12 = (n: number) => ((n % 12) + 12) % 12;
/** Lớp cao độ của tên nốt ("C", "F#", "Bb", "C♯", "D♭"); null nếu không đọc được. */
export function pitchClassOf(name: string): number | null {
  const m = /^([A-G])([#b♯♭]*)$/.exec(name.trim());
  if (!m) return null;
  let pc = LETTER[m[1]];
  for (const c of m[2]) pc += c === '#' || c === '♯' ? 1 : -1;
  return mod12(pc);
}
export interface ParsedChord { root: number; quality: string; bass: number | null }
/** Tách tên hợp âm kiểu tonal: "C#m7b5/G" → gốc 1, chất lượng "m7b5", bass 7. Null nếu không đọc được gốc. */
export function parseChordName(name: string): ParsedChord | null {
  const m = /^([A-G](?:#|b|♯|♭)?)([^/]*)(?:\/([A-G](?:#|b|♯|♭)?))?$/.exec(name.trim());
  if (!m) return null;
  const root = pitchClassOf(m[1]); if (root === null) return null;
  const bass = m[3] ? pitchClassOf(m[3]) : null;
  return { root, quality: m[2], bass: bass === root ? null : bass };
}
/** Chất lượng gọn kiểu thường viết: tonal ghi trưởng là "M" ("CMadd9", "CM6") → bỏ "M" khi không phải maj7; giữ nguyên phần còn lại. */
const tidyQuality = (q: string) => q.replace(/^M(?=add|6|9|$)/, '').replace(/^Maj/, 'maj');
const isMinorLike = (q: string) => /^(m(?!aj)|dim|°|ø)/.test(q);

/** Bậc La Mã của một lớp cao độ so với nốt chủ. */
export const romanOf = (pc: number, tonic: number): string => ROMAN_DEGREES[mod12(pc - tonic)];
/**
 * Tên bậc của hợp âm theo giọng. SUFFIX (mặc định, như bảng phân tích tham chiếu): "Imaj7", "VIm7", "Vsus4", "I/III" (bass theo bậc).
 * CASE: "vi7", "ii", "vii°"…; bass vẫn là bậc hoa. Không đọc được tên → trả nguyên tên.
 */
export function chordDegree(name: string, tonic: number, style: RomanStyle = 'SUFFIX'): string {
  const c = parseChordName(name);
  if (!c) return name;
  let roman = romanOf(c.root, tonic), q = tidyQuality(c.quality);
  if (style === 'CASE' && isMinorLike(q)) {
    roman = roman.replace(/[IV]+/, (r) => r.toLowerCase());
    q = q.replace(/^m(?!aj)/, '').replace(/^dim/, '°');
  }
  return roman + q + (c.bass !== null ? '/' + romanOf(c.bass, tonic) : '');
}
/** Bậc viết bằng ASCII (b, #) khi cách ghi tên nốt chọn ASCII (P-12). */
export const romanAscii = (s: string): string => s.replace(/♭/g, 'b').replace(/♯/g, '#');
/** Chức năng hoà âm của hợp âm (theo bậc gốc); null nếu không đọc được tên. */
export function chordFunction(name: string, tonic: number): HarmonicFunction | null {
  const c = parseChordName(name);
  return c ? FUNCTION_OF[mod12(c.root - tonic)] : null;
}
