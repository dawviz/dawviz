// Theme giao diện ứng dụng (REQ-UI-10, D-52): chỉ đổi màu qua bộ token cố định (UI-DIRECTION mục 5.2, 5.4).
// Giá trị của theme dựng sẵn nằm trong src/index.css (nguồn duy nhất); tệp này lo lựa chọn của người dùng, áp lên <html>
// và kiểm tương phản AA (dùng cho test của theme dựng sẵn và, ở 1.1, cho theme cộng đồng trước khi áp).
// Theme không bao giờ chạm khung video: canvas do Render Core vẽ theo preset.

/** Bộ token màu của một theme (UI-DIRECTION 5.2). Không có token nào khác được nhận. */
export const THEME_TOKENS = [
  'bg', 'surface', 'surface-raised', 'line', 'line-control', 'line-strong',
  'text', 'text-muted', 'text-faint',
  'accent', 'accent-text', 'focus', 'selection',
  'danger', 'warning', 'success',
  'scrub-played', 'scrub-rest', 'waveform', 'guide',
] as const;
export type ThemeToken = (typeof THEME_TOKENS)[number];
export type ThemeColors = Record<ThemeToken, string>;

export type ThemeMode = 'light' | 'dark' | 'system';
export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'];
export const PALETTES = ['studio', 'print', 'brass', 'riso'] as const;
export type Palette = (typeof PALETTES)[number];

export interface ThemePref { mode: ThemeMode; palette: Palette }
/** Tối là mặc định hiện nay (REQ-UI-10); Studio cam là bảng màu mặc định (D-53). */
export const DEFAULT_THEME: ThemePref = { mode: 'dark', palette: 'studio' };
/** Khoá localStorage; public/theme-boot.js đọc đúng khoá này để áp theme trước lần vẽ đầu. */
export const THEME_STORAGE_KEY = 'dawviz.prefs.v1.theme';

export function sanitizeThemePref(v: unknown): ThemePref {
  const o = (v && typeof v === 'object' ? v : {}) as Partial<ThemePref>;
  return {
    mode: THEME_MODES.includes(o.mode as ThemeMode) ? (o.mode as ThemeMode) : DEFAULT_THEME.mode,
    palette: PALETTES.includes(o.palette as Palette) ? (o.palette as Palette) : DEFAULT_THEME.palette,
  };
}

export function resolveMode(mode: ThemeMode, systemDark: boolean): 'light' | 'dark' {
  return mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
}

/** Áp lên phần tử gốc bằng thuộc tính (không chèn style nội tuyến, hợp CSP `style-src 'self'`). */
export function applyTheme(root: HTMLElement, pref: ThemePref, systemDark: boolean): void {
  root.dataset.theme = resolveMode(pref.mode, systemDark);
  root.dataset.palette = pref.palette;
}

// ---- Tương phản WCAG 2.x ----

function channels(color: string): [number, number, number] | null {
  const s = color.trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(s);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)) as [number, number, number];
  const rgb = /^(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})$/.exec(s); // dạng "r g b" của biến CSS
  if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  return null;
}

function luminance(color: string): number {
  const c = channels(color);
  if (!c) throw new Error(`màu không hợp lệ: ${color}`);
  const [r, g, b] = c.map((v) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export interface ContrastFailure { fg: ThemeToken; bg: ThemeToken | string; ratio: number; need: number }

/** Nền khung video mà đường gióng phải nổi lên: preset "Bản in" (D-51) và nền khung mặc định của Render Core. */
export const VIDEO_GROUNDS = ['#FFFFFF', '#0C0E16'] as const;

/** Các cặp phải đạt (UI-DIRECTION 5.2 và quy tắc AA 5.4). `selection` là nền chữ được chọn nên kiểm với `text`. */
const RULES: ReadonlyArray<{ fg: ThemeToken; on: readonly ThemeToken[]; need: number }> = [
  ...(['text', 'text-muted', 'text-faint', 'accent', 'danger', 'warning', 'success'] as const)
    .map((fg) => ({ fg, on: ['bg', 'surface', 'surface-raised'] as const, need: 4.5 })),
  { fg: 'accent-text', on: ['accent'], need: 4.5 },
  { fg: 'text', on: ['selection'], need: 4.5 },
  // Nút bật/tắt đang bật (nút Lặp): biểu tượng màu nhấn trên nền selection (biểu tượng nên cần 3:1).
  { fg: 'accent', on: ['selection'], need: 3 },
  // `line-strong` là vòng hover của nút chính (vẽ cách nút 2 px, nằm trên nền).
  ...(['line-control', 'line-strong', 'focus', 'scrub-played', 'scrub-rest'] as const)
    .map((fg) => ({ fg, on: ['bg', 'surface', 'surface-raised'] as const, need: 3 })),
];

/** Trạng thái tô nhạt dùng trong giao diện (`bg-<tint>/<alpha>` của Tailwind, phủ lên một nền).
 *  Mỗi luật kiểm `fg` trên màu tô đã trộn với từng nền `bg`, `surface`, `surface-raised`.
 *  Đây là danh sách trắng: test quét mã nguồn và báo đỏ khi component dùng một kiểu tô nhạt chưa có luật ở đây.
 *  Làm nhạt nút nhấn (`accent/90`) bị cấm: chữ trắng trên Đồng sáng chỉ còn 4,39–4,45:1; hover dùng vòng `line-strong`. */
export interface StateRule { state: string; fg: ThemeToken; tint: ThemeToken; alpha: number; need: number }
export const STATE_RULES: readonly StateRule[] = [
  { state: 'chọn hoặc kéo thả (accent/15)', fg: 'text', tint: 'accent', alpha: 0.15, need: 4.5 },
  { state: 'vùng thả đang trên (accent/10)', fg: 'text', tint: 'accent', alpha: 0.1, need: 4.5 },
  { state: 'vùng thả đang trên (accent/10)', fg: 'text-muted', tint: 'accent', alpha: 0.1, need: 4.5 },
  { state: 'biểu tượng vùng thả (accent/10)', fg: 'accent', tint: 'accent', alpha: 0.1, need: 3 },
  ...(['danger', 'warning'] as const).flatMap((tint) => [
    { state: `thông báo (${tint}/10)`, fg: 'text' as const, tint, alpha: 0.1, need: 4.5 },
    { state: `thông báo (${tint}/10)`, fg: 'text-muted' as const, tint, alpha: 0.1, need: 4.5 },
    { state: `biểu tượng thông báo (${tint}/10)`, fg: tint, tint, alpha: 0.1, need: 3 },
  ]),
];

export function mix(tint: string, ground: string, alpha: number): string {
  const a = channels(tint), b = channels(ground);
  if (!a || !b) throw new Error(`màu không hợp lệ: ${tint} / ${ground}`);
  return a.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha))).join(' ');
}

/** Trả về mọi cặp trượt; mảng rỗng là theme đạt. Theme thiếu token hoặc có token lạ thì ném lỗi (không áp một phần). */
export function checkTheme(colors: Record<string, string>): ContrastFailure[] {
  const extra = Object.keys(colors).filter((k) => !(THEME_TOKENS as readonly string[]).includes(k));
  const missing = THEME_TOKENS.filter((k) => !(k in colors));
  if (extra.length || missing.length) throw new Error(`token không hợp lệ: thừa [${extra.join(', ')}], thiếu [${missing.join(', ')}]`);
  const out: ContrastFailure[] = [];
  for (const r of RULES) for (const bg of r.on) {
    const ratio = contrast(colors[r.fg], colors[bg]);
    if (ratio < r.need) out.push({ fg: r.fg, bg, ratio, need: r.need });
  }
  for (const r of STATE_RULES) for (const ground of ['bg', 'surface', 'surface-raised'] as const) {
    const ratio = contrast(colors[r.fg], mix(colors[r.tint], colors[ground], r.alpha));
    if (ratio < r.need) out.push({ fg: r.fg, bg: `${r.tint}/${Math.round(r.alpha * 100)} trên ${ground} (${r.state})`, ratio, need: r.need });
  }
  // Đường gióng vẽ trên khung video, không trên nền app: kiểm với nền "Bản in" và nền khung tối mặc định (D-55).
  for (const ground of VIDEO_GROUNDS) {
    const ratio = contrast(colors.guide, ground);
    if (ratio < 3) out.push({ fg: 'guide', bg: ground, ratio, need: 3 });
  }
  return out;
}
