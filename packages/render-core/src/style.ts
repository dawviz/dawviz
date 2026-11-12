// Kiểu dáng nốt và bàn phím (SRS REQ-GRAPHICS-07). Dữ liệu thuần, tuần tự hoá được (sau này lưu vào Preset/Pack).
// Kiểu có hai tầng: mặc định toàn cục + ghi đè theo track (chỉ cần khai báo trường khác mặc định).
export type ColorMode = 'track' | 'custom' | 'pitch' | 'velocity';
export interface NoteStyle {
  colorMode: ColorMode;
  customColor: string;      // dùng khi colorMode = 'custom' (#rrggbb)
  opacity: number;          // 0..1, độ đục cơ bản của nốt (nhân với độ sáng theo automation)
  inactiveOpacity: number;  // 0..1, hệ số nhân khi nốt chưa/đã qua playhead (nốt đang phát = 1)
  cornerRadius: number;     // px; bị kẹp ở nửa chiều cao nốt (rất lớn = viên thuốc)
  heightScale: number;      // 0.1..1.5, độ dày nốt so với một hàng cao độ
  glow: number;             // 0..1, cường độ phát sáng; 0 = tắt
  glowRadius: number;       // px, bán kính toả sáng tối đa
  glowActiveOnly: boolean;  // chỉ nốt đang phát mới sáng
  borderWidth: number;      // px; 0 = không viền
  borderColor: string;      // '' = tự lấy màu nốt sáng hơn
}
export interface StyleConfig { base: NoteStyle; tracks: Record<string, Partial<NoteStyle>> }
export interface KeyboardStyle { enabled: boolean; width: number; whiteColor: string; blackColor: string; useTrackColor: boolean }

export const DEFAULT_NOTE_STYLE: Readonly<NoteStyle> = Object.freeze({
  colorMode: 'track', customColor: '#7cc4ff', opacity: 1, inactiveOpacity: 0.85, cornerRadius: 3, heightScale: 0.8,
  glow: 0.5, glowRadius: 12, glowActiveOnly: true, borderWidth: 0, borderColor: '',
});
export const DEFAULT_KEYBOARD_STYLE: Readonly<KeyboardStyle> = Object.freeze({
  enabled: true, width: 64, whiteColor: '#e8eaf2', blackColor: '#14161f', useTrackColor: true,
});
export const defaultStyleConfig = (): StyleConfig => ({ base: { ...DEFAULT_NOTE_STYLE }, tracks: {} });

/** Bộ kiểu dựng sẵn (người dùng chọn rồi chỉnh tiếp). */
export const STYLE_PRESETS: Readonly<Record<string, Partial<NoteStyle>>> = Object.freeze({
  neon: { cornerRadius: 4, heightScale: 0.7, glow: 0.9, glowRadius: 18, glowActiveOnly: false, inactiveOpacity: 0.7 },
  soft: { cornerRadius: 999, heightScale: 0.6, glow: 0.35, glowRadius: 10, glowActiveOnly: true, inactiveOpacity: 0.8 },
  flat: { cornerRadius: 0, heightScale: 1, glow: 0, glowRadius: 0, borderWidth: 0, inactiveOpacity: 0.85 },
  outline: { cornerRadius: 3, heightScale: 0.8, glow: 0.3, opacity: 0.35, borderWidth: 1.5, inactiveOpacity: 1 },
});

const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
/** Chuẩn hoá về miền hợp lệ (giá trị lạ từ UI/preset không làm sập vẽ). */
export function sanitizeStyle(s: NoteStyle): NoteStyle {
  const hex = (c: string, d: string) => (/^#[0-9a-f]{6}$/i.test(c) ? c : d);
  return {
    colorMode: (['track', 'custom', 'pitch', 'velocity'] as const).includes(s.colorMode) ? s.colorMode : 'track',
    customColor: hex(s.customColor, DEFAULT_NOTE_STYLE.customColor),
    opacity: clamp(s.opacity, 0, 1), inactiveOpacity: clamp(s.inactiveOpacity, 0, 1),
    cornerRadius: clamp(s.cornerRadius, 0, 999), heightScale: clamp(s.heightScale, 0.1, 1.5),
    glow: clamp(s.glow, 0, 1), glowRadius: clamp(s.glowRadius, 0, 64), glowActiveOnly: !!s.glowActiveOnly,
    borderWidth: clamp(s.borderWidth, 0, 8), borderColor: s.borderColor && /^#[0-9a-f]{6}$/i.test(s.borderColor) ? s.borderColor : '',
  };
}
export const resolveNoteStyle = (cfg: StyleConfig | undefined, trackId: string): NoteStyle =>
  sanitizeStyle({ ...DEFAULT_NOTE_STYLE, ...(cfg?.base ?? {}), ...(cfg?.tracks[trackId] ?? {}) });

// ---- màu
export function parseHex(c: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim()); if (!m) return [255, 255, 255];
  const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const toHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
/** Trộn `c` về phía trắng (k>0) hoặc đen (k<0), |k| ≤ 1. */
export function shade(c: string, k: number): string {
  const [r, g, b] = parseHex(c), t = k >= 0 ? 255 : 0, a = Math.abs(clamp(k, -1, 1));
  return toHex(r + (t - r) * a, g + (t - g) * a, b + (t - b) * a);
}
function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l), f = (n: number) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return toHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
/** Màu nốt theo chế độ màu. 'pitch': mỗi lớp cao độ (C..B) một sắc; 'velocity': nốt mạnh sáng hơn. */
export function noteColor(style: NoteStyle, trackColor: string, pitch: number, velocity: number): string {
  switch (style.colorMode) {
    case 'custom': return style.customColor;
    case 'pitch': return hslToHex(((pitch % 12) + 12) % 12 * 30, 0.8, 0.6);
    case 'velocity': return shade(trackColor, (clamp(velocity, 0, 127) / 127 - 0.6) * 0.9);
    default: return trackColor;
  }
}
