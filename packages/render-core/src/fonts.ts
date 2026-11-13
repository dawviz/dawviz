// Danh sách phông Render Core cần và cách nạp trước khung đầu (TECHNICAL-DESIGN 5.7). Render Core không tự tải:
// `ensureFonts` nhận `loader`, nên cùng mã chạy ở Preview (document.fonts) và Export Worker (self.fonts).
import type { SceneDocument } from './scene.ts';

export interface FontFaceSpec { family: string; weight: number; file: string; unicodeRange: string }
const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';
const VIET = 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB';
export const DEFAULT_FONT = 'Space Grotesk';
/** Phông đóng gói cùng ứng dụng (OFL, tự host; CSP font-src 'self'). `file` tính từ thư mục phông của ứng dụng. */
export const BUNDLED_FONTS: readonly FontFaceSpec[] = [400, 700].flatMap((weight) => ([['latin', LATIN], ['latin-ext', LATIN_EXT], ['vietnamese', VIET]] as const)
  .map(([s, unicodeRange]) => ({ family: DEFAULT_FONT, weight, file: `space-grotesk-${s}-${weight}-normal.woff2`, unicodeRange })));

/** Họ phông mà scene dùng (widget chữ ẩn cũng tính để không giật khi bật). Thứ tự ổn định. */
export function fontFamiliesOf(scene: SceneDocument): string[] {
  const out = new Set<string>();
  const walk = (v: unknown) => { if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (k === 'font' && typeof x === 'string') out.add(x); else walk(x); } };
  for (const w of scene.widgets) walk(w.properties);
  return [...out].sort();
}
/** Mặt phông cần nạp cho scene (chỉ họ đóng gói; họ khác là phông hệ thống/người dùng nạp riêng). */
export function requiredFonts(scene: SceneDocument): FontFaceSpec[] {
  const fam = new Set(fontFamiliesOf(scene));
  return BUNDLED_FONTS.filter((f) => fam.has(f.family));
}
/** Scene có vẽ chữ không (để biết có cần chờ phông). */
export const needsFonts = (scene: SceneDocument) => scene.widgets.some((w) => w.visible && ['TRACK_INFO', 'EVENT_COUNTER', 'LIVE_TRIGGER', 'TIME_BAR', 'CHORD_DETECTION', 'PROGRESS_BAR'].includes(w.type));

export class FontLoadError extends Error { code = 'ERR_FONT_LOAD'; constructor(message: string) { super(message); } }
/** Nạp một mặt phông; ném khi thất bại. Preview/Worker tự cài (FontFace + fonts.add). */
export type FontLoader = (spec: FontFaceSpec) => Promise<void>;
/** Nạp tất cả; xong mới trả về. Một mặt lỗi thì ném FontLoadError (Export không bắt đầu, không xuất bằng phông dự phòng). */
export async function ensureFonts(specs: readonly FontFaceSpec[], loader: FontLoader): Promise<void> {
  try { await Promise.all(specs.map((s) => loader(s))); }
  catch (e) { throw new FontLoadError(`không nạp được phông: ${e instanceof Error ? e.message : String(e)}`); }
}
