// Cách viết cao độ theo giọng (REQ-NOTATION-01): pc → chữ cái + dấu hoá. Hàm thuần, dùng chung cho engraver và test.

export const MAJOR_KEY_NAMES = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'] as const;
export const MINOR_KEY_NAMES = ['Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#'] as const;
const LETTERS = ['c', 'd', 'e', 'f', 'g', 'a', 'b'] as const;
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];

export interface Spelled { letter: number; acc: number }

/** Tên giọng kiểu VexFlow ("Eb", "C#m"). fifths −7…7. */
export function keyName(fifths: number, mode: 'major' | 'minor'): string {
  const f = Math.max(-7, Math.min(7, Math.round(fifths)));
  return mode === 'major' ? MAJOR_KEY_NAMES[f + 7] : MINOR_KEY_NAMES[f + 7] + 'm';
}

/**
 * Bảng pc → cách viết. Nốt trong âm giai theo hoá biểu; nốt ngoài âm giai: tự nhiên nếu có, không thì thăng (giọng thăng/không dấu)
 * hoặc giáng (giọng giáng). Giọng thứ: bậc 7 nâng luôn viết bằng chữ cái dưới chủ âm (Đô thăng trong Rê thứ, Fa kép trong Son thăng thứ).
 */
export function spellingTable(fifths: number, mode: 'major' | 'minor'): Spelled[] {
  const f = Math.max(-7, Math.min(7, Math.round(fifths)));
  const keyAcc = new Array(7).fill(0);
  const sharpOrder = [3, 0, 4, 1, 5, 2, 6], flatOrder = [6, 2, 5, 1, 4, 0, 3];
  if (f > 0) for (let i = 0; i < f; i++) keyAcc[sharpOrder[i]] = 1;
  if (f < 0) for (let i = 0; i < -f; i++) keyAcc[flatOrder[i]] = -1;
  const table: (Spelled | null)[] = new Array(12).fill(null);
  for (let l = 0; l < 7; l++) table[(LETTER_PC[l] + keyAcc[l] + 12) % 12] = { letter: l, acc: keyAcc[l] };
  if (mode === 'minor') {
    const tonicName = MINOR_KEY_NAMES[f + 7], tonicLetter = LETTERS.indexOf(tonicName[0].toLowerCase() as typeof LETTERS[number]);
    const majorTonicPc = ((f * 7) % 12 + 12) % 12, tonicPc = (majorTonicPc + 9) % 12, lt = (tonicPc + 11) % 12;
    if (!table[lt]) { const l = (tonicLetter + 6) % 7; table[lt] = { letter: l, acc: ((lt - LETTER_PC[l] + 18) % 12) - 6 }; }
  }
  for (let pc = 0; pc < 12; pc++) if (!table[pc]) {
    const nat = LETTER_PC.indexOf(pc);
    if (nat >= 0) { table[pc] = { letter: nat, acc: 0 }; continue; }
    table[pc] = f >= 0 ? { letter: LETTER_PC.indexOf((pc + 11) % 12), acc: 1 } : { letter: LETTER_PC.indexOf((pc + 1) % 12), acc: -1 };
  }
  return table as Spelled[];
}

/** Khoá nốt kiểu VexFlow: "c#/4", "fx" viết "f##". Quãng tám theo chữ cái (Si thăng 4 = Đô 5 về âm). */
export function vexKey(pitch: number, table: readonly Spelled[]): string {
  const sp = table[((pitch % 12) + 12) % 12];
  const octave = Math.floor((pitch - sp.acc) / 12) - 1;
  const acc = sp.acc === 1 ? '#' : sp.acc === -1 ? 'b' : sp.acc === 2 ? '##' : sp.acc === -2 ? 'bb' : '';
  return `${LETTERS[sp.letter]}${acc}/${octave}`;
}
