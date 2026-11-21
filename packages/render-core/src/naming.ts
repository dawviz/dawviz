// Cách ghi tên nốt và hợp âm dùng chung cho mọi widget (P-12, REQ-I18N-08). Hàm thuần.
// Không có `scene.noteNaming` thì các widget giữ cách ghi cũ (không đổi preset cũ); có thì mọi widget có tên nốt đi qua đây.
// Hệ ghi tên: chữ cái (C D E), solfège cố định (Do Re Mi), Đức (H thay B, B thay B♭, Cis, Es…). Chữ Nhật (ハニホ) cần phông của người dùng nên chưa có sẵn.
export const NAMING_SYSTEMS = ['LETTER', 'SOLFEGE', 'GERMAN'] as const;
export type NamingSystem = typeof NAMING_SYSTEMS[number];
export interface NoteNaming {
  system: NamingSystem;
  /** Nốt đen của 12 cao độ ghi bằng dấu thăng hay giáng (C♯ hay D♭). */
  accidental: 'SHARP' | 'FLAT';
  /** Dấu hoá ghi `#`/`b` (ASCII) thay vì `♯`/`♭` (phông cần có ký tự này). */
  ascii: boolean;
  /** Quốc tế: C4 = nốt 60 (mặc định); `3` là quy ước Yamaha (C3 = 60). */
  middleC: 3 | 4;
}
export const DEFAULT_NAMING: Readonly<NoteNaming> = Object.freeze({ system: 'LETTER', accidental: 'SHARP', ascii: false, middleC: 4 });

const TABLE: Record<NamingSystem, { sharp: readonly string[]; flat: readonly string[] }> = {
  LETTER: { sharp: ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'], flat: ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'] },
  SOLFEGE: { sharp: ['Do', 'Do♯', 'Re', 'Re♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'], flat: ['Do', 'Re♭', 'Re', 'Mi♭', 'Mi', 'Fa', 'Sol♭', 'Sol', 'La♭', 'La', 'Si♭', 'Si'] },
  GERMAN: { sharp: ['C', 'Cis', 'D', 'Dis', 'E', 'F', 'Fis', 'G', 'Gis', 'A', 'Ais', 'H'], flat: ['C', 'Des', 'D', 'Es', 'E', 'F', 'Ges', 'G', 'As', 'A', 'B', 'H'] },
};
const ascii = (s: string) => s.replace(/♯/g, '#').replace(/♭/g, 'b');

/** Tên lớp cao độ (0 = C … 11 = B). */
export function pitchClassNameFor(pc: number, n: NoteNaming): string {
  const i = ((Math.round(pc) % 12) + 12) % 12, s = TABLE[n.system][n.accidental === 'FLAT' ? 'flat' : 'sharp'][i];
  return n.ascii ? ascii(s) : s;
}
/** Tên nốt MIDI kèm số quãng tám, theo quy ước C4 = 60 (hoặc C3 = 60). Ngoài 0–127 → "?". */
export function noteNameFor(pitch: number, n: NoteNaming): string {
  const p = Math.round(pitch);
  if (!Number.isFinite(p) || p < 0 || p > 127) return '?';
  return pitchClassNameFor(p, n) + (Math.floor(p / 12) - 1 + (n.middleC - 4));
}
const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const rootPc = (letter: string, acc: string) => (((LETTER_PC[letter] + (acc === '#' || acc === '♯' ? 1 : acc === 'b' || acc === '♭' ? -1 : 0)) % 12) + 12) % 12;
/** Tên hợp âm kiểu tonal ("Cmaj7", "E7/G#", "Bbm") → cùng hợp âm theo cách ghi đã chọn: đổi gốc và bass, giữ phần chất lượng. */
export function chordNameFor(name: string, n: NoteNaming): string {
  const m = /^([A-G])([#b♯♭]?)([^/]*)(?:\/([A-G])([#b♯♭]?))?$/.exec(name);
  if (!m) return name;
  const root = pitchClassNameFor(rootPc(m[1], m[2]), n), bass = m[4] ? '/' + pitchClassNameFor(rootPc(m[4], m[5] ?? ''), n) : '';
  return root + m[3] + bass;
}
