// Kiểu dáng nốt và bàn phím (SRS REQ-GRAPHICS-07). Dữ liệu thuần, tuần tự hoá được (sau này lưu vào Preset/Pack).
// Kiểu có hai tầng: mặc định toàn cục + ghi đè theo track (chỉ cần khai báo trường khác mặc định).
import { alphaSuffix, hexAlpha, isHexColor, parseHexRgba } from './color.ts';
export type ColorMode = 'track' | 'custom' | 'pitch' | 'velocity';
export type GlowMode = 'uniform' | 'dynamic';
export type GlowSource = 'velocity' | 'pitch' | 'pan' | 'fade' | 'automation';
/** Cách đọc pan: 'lr' = trái yếu → phải mạnh; 'spread' = càng lệch khỏi giữa càng mạnh (giữa = yếu nhất). */
export type GlowPanMode = 'lr' | 'spread';
export const GLOW_SOURCES: readonly GlowSource[] = ['velocity', 'pitch', 'pan', 'fade', 'automation'];
export interface NoteStyle {
  colorMode: ColorMode;
  customColor: string;      // dùng khi colorMode = 'custom' (#rrggbb hoặc #rrggbbaa)
  opacity: number;          // 0..1, độ đục cơ bản của nốt (nhân với độ sáng theo automation)
  inactiveOpacity: number;  // 0..1, hệ số nhân khi nốt chưa/đã qua playhead (nốt đang phát = 1)
  cornerRadius: number;     // px; bị kẹp ở nửa chiều cao nốt (rất lớn = viên thuốc)
  heightScale: number;      // 0.1..1.5, độ dày nốt so với một hàng cao độ
  glow: number;             // 0..1, cường độ phát sáng; 0 = tắt
  glowRadius: number;       // px, bán kính toả sáng tối đa
  glowActiveOnly: boolean;  // chỉ nốt đang phát mới sáng
  // Phát sáng động (REQ-GRAPHICS-17): 'uniform' = mọi nốt sáng như nhau (mặc định); 'dynamic' = cường độ theo glowSource.
  glowMode: GlowMode;
  glowSource: GlowSource;
  glowPanMode: GlowPanMode; // dùng khi glowSource = 'pan' (và lane pan khi glowSource = 'automation')
  glowLane: string;         // tên lane automation khi glowSource = 'automation' ('volume' | 'pan' | 'mute' | lane tham số plugin sau này)
  glowMin: number;          // 0..1, cường độ khi giá trị nguồn thấp nhất
  glowMax: number;          // 0..1, cường độ khi giá trị nguồn cao nhất
  glowInvert: boolean;      // đảo chiều nguồn
  glowRelease: number;      // giây, phát sáng tắt dần sau khi nốt kết thúc (0 = tắt ngay)
  borderWidth: number;      // px; 0 = không viền
  borderColor: string;      // '' = tự lấy màu nốt sáng hơn
  // Màu theo trạng thái nốt (REQ-GRAPHICS-07, T-69). null = giữ hành vi cũ (màu theo colorMode, trạng thái chỉ đổi độ đục).
  playedColor: string | null;   // nốt đã phát: end ≤ t
  activeColor: string | null;   // nốt đang phát: start ≤ t < end
  upcomingColor: string | null; // nốt sắp tới: start > t
  // Dải màu hai đầu cho chế độ 'pitch' / 'velocity' (T-129). '' cả hai = giữ cách tô cũ (bánh xe sắc theo lớp cao độ / màu track sáng tối).
  // Đặt ít nhất một đầu: nốt trộn từ gradientFrom (nốt thấp nhất của dải cao độ đang hiện / cường độ 0) tới gradientTo (nốt cao nhất / cường độ 127);
  // đầu còn rỗng lấy màu track.
  gradientFrom: string;
  gradientTo: string;
}
export interface StyleConfig { base: NoteStyle; tracks: Record<string, Partial<NoteStyle>> }
export interface KeyboardStyle {
  enabled: boolean; width: number; whiteColor: string; blackColor: string;
  /** Phím đang nhấn lấy màu nốt (theo track/chế độ màu của nốt); tắt thì dùng `pressedColor`. */
  useTrackColor: boolean;
  // ---- T-51 (REQ-GRAPHICS-07): mọi trường dưới đây tuỳ chọn trong preset, vắng = mặc định (vẽ như trước).
  /** Hình dạng phím: phẳng (mặc định, như trước) hoặc bo góc có khe giữa các phím. */
  shape: KeyboardShape;
  /** Màu phím nhấn khi `useTrackColor` tắt. */
  pressedColor: string;
  /** Đánh dấu thang âm: OFF; AUTO = giọng nhận diện (keyAt, P-04), có `scene.tonic` thì giữ nốt chủ đó và chọn trưởng/thứ khớp hơn; MAJOR/MINOR = thang trưởng/thứ tự nhiên của nốt chủ (`scene.tonic`, chưa đặt thì nốt chủ nhận diện). */
  scale: KeyboardScale;
  scaleColor: string;
  /** 0..1, độ đục lớp tô thang âm (phím nốt chủ đậm hơn). */
  scaleOpacity: number;
  /** Tên nốt trên phím (P-12, theo `scene.noteNaming`): không, chỉ phím C, mọi phím trắng, mọi phím, chỉ phím đang nhấn. */
  labels: KeyLabelMode;
  /** Ghi số quãng tám (quy ước C3/C4 theo `noteNaming.middleC`). */
  labelOctave: boolean;
  /** '' = tự chọn (chữ tối trên phím trắng, sáng trên phím đen). */
  labelColor: string;
}
export const KEYBOARD_SHAPES = ['FLAT', 'ROUNDED'] as const;
export type KeyboardShape = typeof KEYBOARD_SHAPES[number];
export const KEYBOARD_SCALES = ['OFF', 'AUTO', 'MAJOR', 'MINOR'] as const;
export type KeyboardScale = typeof KEYBOARD_SCALES[number];
export const KEY_LABEL_MODES = ['NONE', 'C', 'WHITE', 'ALL', 'ACTIVE'] as const;
export type KeyLabelMode = typeof KEY_LABEL_MODES[number];

// ---- Vạch phát tuỳ chỉnh (T-58, REQ-GRAPHICS-16 phần 1.0) và lưới ô nhịp của Piano Roll.
export const PLAYHEAD_STYLES = ['LINE', 'DASHED', 'BAND', 'GRADIENT'] as const;
export type PlayheadStyle = typeof PLAYHEAD_STYLES[number];
export const PLAYHEAD_HITS = ['OFF', 'FLASH', 'SWELL'] as const;
export type PlayheadHit = typeof PLAYHEAD_HITS[number];
/** Lưới ô nhịp trên Piano Roll: vạch đầu ô nhịp, vạch phách mờ, số ô nhịp nhỏ ở đầu mỗi ô. Mặc định tắt hết (vẽ như trước). */
export interface RollGrid { bars: boolean; beats: boolean; numbers: boolean; color: string; opacity: number }
export const DEFAULT_ROLL_GRID: Readonly<RollGrid> = Object.freeze({ bars: false, beats: false, numbers: false, color: '#ffffff', opacity: 0.25 });

export const DEFAULT_NOTE_STYLE: Readonly<NoteStyle> = Object.freeze({
  colorMode: 'track', customColor: '#7cc4ff', opacity: 1, inactiveOpacity: 0.85, cornerRadius: 3, heightScale: 0.8,
  glow: 0.5, glowRadius: 12, glowActiveOnly: true, borderWidth: 0, borderColor: '',
  glowMode: 'uniform', glowSource: 'velocity', glowPanMode: 'lr', glowLane: 'volume', glowMin: 0.15, glowMax: 1, glowInvert: false, glowRelease: 0,
  playedColor: null, activeColor: null, upcomingColor: null, gradientFrom: '', gradientTo: '',
});
export const DEFAULT_KEYBOARD_STYLE: Readonly<KeyboardStyle> = Object.freeze({
  enabled: true, width: 64, whiteColor: '#e8eaf2', blackColor: '#14161f', useTrackColor: true,
  shape: 'FLAT', pressedColor: '#7cc4ff', scale: 'OFF', scaleColor: '#f5c542', scaleOpacity: 0.35, labels: 'NONE', labelOctave: true, labelColor: '',
});
export const defaultStyleConfig = (): StyleConfig => ({ base: { ...DEFAULT_NOTE_STYLE }, tracks: {} });

/** Bộ kiểu dựng sẵn (người dùng chọn rồi chỉnh tiếp). */
export const STYLE_PRESETS: Readonly<Record<string, Partial<NoteStyle>>> = Object.freeze({
  neon: { cornerRadius: 4, heightScale: 0.7, glow: 0.9, glowRadius: 18, glowActiveOnly: false, inactiveOpacity: 0.7 },
  soft: { cornerRadius: 999, heightScale: 0.6, glow: 0.35, glowRadius: 10, glowActiveOnly: true, inactiveOpacity: 0.8 },
  flat: { cornerRadius: 0, heightScale: 1, glow: 0, glowRadius: 0, borderWidth: 0, inactiveOpacity: 0.85 },
  outline: { cornerRadius: 3, heightScale: 0.8, glow: 0.3, opacity: 0.35, borderWidth: 1.5, inactiveOpacity: 1 },
});

const num = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? v : d); // trường mới có thể vắng trong preset/tuỳ chọn cũ
const clamp = (v: number, lo: number, hi: number) => (Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
const optHex = (c: unknown): string | null => (isHexColor(c) ? c : null); // vắng hoặc sai định dạng → null; nhận #rrggbbaa (T-49)
/** Chuẩn hoá về miền hợp lệ (giá trị lạ từ UI/preset không làm sập vẽ). */
export function sanitizeStyle(s: NoteStyle): NoteStyle {
  const hex = (c: string, d: string) => (isHexColor(c) ? c : d);
  return {
    colorMode: (['track', 'custom', 'pitch', 'velocity'] as const).includes(s.colorMode) ? s.colorMode : 'track',
    customColor: hex(s.customColor, DEFAULT_NOTE_STYLE.customColor),
    opacity: clamp(s.opacity, 0, 1), inactiveOpacity: clamp(s.inactiveOpacity, 0, 1),
    cornerRadius: clamp(s.cornerRadius, 0, 999), heightScale: clamp(s.heightScale, 0.1, 1.5),
    glow: clamp(s.glow, 0, 1), glowRadius: clamp(s.glowRadius, 0, 64), glowActiveOnly: !!s.glowActiveOnly,
    borderWidth: clamp(s.borderWidth, 0, 8), borderColor: isHexColor(s.borderColor) ? s.borderColor : '',
    glowMode: s.glowMode === 'dynamic' ? 'dynamic' : 'uniform',
    glowSource: GLOW_SOURCES.includes(s.glowSource) ? s.glowSource : DEFAULT_NOTE_STYLE.glowSource,
    glowPanMode: s.glowPanMode === 'spread' ? 'spread' : 'lr',
    glowLane: typeof s.glowLane === 'string' && /^[\w.:-]{1,64}$/.test(s.glowLane) ? s.glowLane : DEFAULT_NOTE_STYLE.glowLane, // cùng quy tắc isLaneId (glow.ts)
    glowMin: clamp(num(s.glowMin, DEFAULT_NOTE_STYLE.glowMin), 0, 1), glowMax: clamp(num(s.glowMax, DEFAULT_NOTE_STYLE.glowMax), 0, 1),
    glowInvert: !!s.glowInvert, glowRelease: clamp(num(s.glowRelease, 0), 0, 4),
    playedColor: optHex(s.playedColor), activeColor: optHex(s.activeColor), upcomingColor: optHex(s.upcomingColor),
    gradientFrom: isHexColor(s.gradientFrom) ? s.gradientFrom : '', gradientTo: isHexColor(s.gradientTo) ? s.gradientTo : '',
  };
}
export const resolveNoteStyle = (cfg: StyleConfig | undefined, trackId: string): NoteStyle =>
  sanitizeStyle({ ...DEFAULT_NOTE_STYLE, ...(cfg?.base ?? {}), ...(cfg?.tracks[trackId] ?? {}) });

// ---- màu
/** `#rrggbb` / `#rrggbbaa` → [r, g, b] (bỏ alpha; lấy alpha bằng `parseHexRgba`). Sai định dạng → trắng. */
export function parseHex(c: string): [number, number, number] {
  const v = parseHexRgba(c); return v ? [v[0], v[1], v[2]] : [255, 255, 255];
}
export const toHex = (r: number, g: number, b: number) => '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
/** Trộn `c` về phía trắng (k>0) hoặc đen (k<0), |k| ≤ 1. Giữ alpha của `c`. */
export function shade(c: string, k: number): string {
  const [r, g, b] = parseHex(c), t = k >= 0 ? 255 : 0, a = Math.abs(clamp(k, -1, 1));
  return toHex(r + (t - r) * a, g + (t - g) * a, b + (t - b) * a) + alphaSuffix(hexAlpha(c));
}
function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l), f = (n: number) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return toHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
/** Màu nốt theo chế độ màu. 'pitch': mỗi lớp cao độ (C..B) một sắc; 'velocity': nốt mạnh sáng hơn.
 *  Có dải màu (gradientFrom/gradientTo, T-129) thì hai chế độ đó trộn tuyến tính giữa hai đầu: cao độ theo `range`
 *  (dải cao độ đang hiện, mặc định 0–127), cường độ theo 0–127. */
export function noteColor(style: NoteStyle, trackColor: string, pitch: number, velocity: number, range?: readonly [number, number]): string {
  const grad = (k: number) => mixHex(style.gradientFrom || trackColor, style.gradientTo || trackColor, k);
  const hasGrad = !!(style.gradientFrom || style.gradientTo);
  switch (style.colorMode) {
    case 'custom': return style.customColor;
    case 'pitch': {
      if (!hasGrad) return hslToHex(((pitch % 12) + 12) % 12 * 30, 0.8, 0.6);
      const lo = range ? Math.min(range[0], range[1]) : 0, hi = range ? Math.max(range[0], range[1]) : 127;
      return grad(hi > lo ? (pitch - lo) / (hi - lo) : 1);
    }
    case 'velocity': return hasGrad ? grad(clamp(velocity, 0, 127) / 127) : shade(trackColor, (clamp(velocity, 0, 127) / 127 - 0.6) * 0.9);
    default: return trackColor;
  }
}

/** Trộn hai màu #rrggbb, k = 0 → a, 1 → b. */
export function mixHex(a: string, b: string, k: number): string {
  const [r1, g1, b1] = parseHex(a), [r2, g2, b2] = parseHex(b), u = clamp(k, 0, 1);
  return toHex(r1 + (r2 - r1) * u, g1 + (g2 - g1) * u, b1 + (b2 - b1) * u);
}
const MAJOR_STEPS = [0, 2, 4, 5, 7, 9, 11], MINOR_STEPS = [0, 2, 3, 5, 7, 8, 10];
/** Tập lớp cao độ của thang trưởng / thứ tự nhiên trên nốt chủ `tonic` (0 = C). */
export function scalePitchClasses(tonic: number, minor: boolean): Set<number> {
  const t = ((Math.round(tonic) % 12) + 12) % 12;
  return new Set((minor ? MINOR_STEPS : MAJOR_STEPS).map((s) => (t + s) % 12));
}

export type NoteState = 'played' | 'active' | 'upcoming';
/** Trạng thái nốt tại t. Biên: start = t là đang phát; end = t là đã phát. */
export const noteState = (start: number, end: number, t: number): NoteState => (t >= end ? 'played' : t >= start ? 'active' : 'upcoming');
/** Màu theo trạng thái nếu đã đặt; không thì màu theo chế độ màu (hành vi cũ). */
export function stateColor(style: NoteStyle, state: NoteState, fallback: string): string {
  return (state === 'played' ? style.playedColor : state === 'active' ? style.activeColor : style.upcomingColor) ?? fallback;
}
