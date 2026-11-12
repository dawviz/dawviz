// Tiện ích âm nhạc dùng chung cho giao diện và widget (không phụ thuộc DOM).
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Tên nốt của số MIDI 0–127. Quy ước mặc định C4 = 60 (Yamaha dùng C3 = 60: truyền `middleCOctave = 3`).
 * Cách ghi tên đầy đủ (giáng, Do-Re-Mi, chọn quy ước) thuộc P-12/T-51; hàm này chỉ là mặc định.
 */
export function pitchName(pitch: number, middleCOctave = 4): string {
  const p = Math.round(pitch);
  if (!Number.isFinite(p) || p < 0 || p > 127) return '?';
  return SHARP[p % 12] + (Math.floor(p / 12) - 1 + (middleCOctave - 4));
}
