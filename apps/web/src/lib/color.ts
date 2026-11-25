// Đọc và ghi mã màu cho bộ chọn màu dùng chung (T-49, REQ-UI-11). Hàm thuần, không DOM.
// Nhận: HEX (#rgb, #rgba, #rrggbb, #rrggbbaa; không có # thì 6/8 ký tự), 0xRRGGBB[AA], số nguyên 0xRRGGBB viết thập phân (16711680),
// rgb()/rgba(), bộ số "255, 0, 0" / "1.0, 0, 0" (có thể thêm alpha), hsl()/hsla(), hsv()/hsb(), oklch(), tên màu CSS.
// Xuất: mã chuẩn chữ thường #rrggbb, hoặc #rrggbbaa khi có alpha (đúng dạng Render Core lưu).

/** r, g, b: 0..255 (số thực được); a: 0..1. */
export interface Rgba { r: number; g: number; b: number; a: number }
export interface Hsva { h: number; s: number; v: number; a: number } // h 0..360, s/v 0..1
export type ColorFormat = 'hex' | 'rgb' | 'hsl' | 'hsv';
export const COLOR_FORMATS: readonly ColorFormat[] = ['hex', 'rgb', 'hsl', 'hsv'];

// 148 tên màu CSS (CSS Color 4) + transparent.
const NAMED_SRC = 'aliceblue f0f8ff antiquewhite faebd7 aqua 00ffff aquamarine 7fffd4 azure f0ffff beige f5f5dc bisque ffe4c4 black 000000 blanchedalmond ffebcd blue 0000ff blueviolet 8a2be2 brown a52a2a burlywood deb887 cadetblue 5f9ea0 chartreuse 7fff00 chocolate d2691e coral ff7f50 cornflowerblue 6495ed cornsilk fff8dc crimson dc143c cyan 00ffff darkblue 00008b darkcyan 008b8b darkgoldenrod b8860b darkgray a9a9a9 darkgreen 006400 darkgrey a9a9a9 darkkhaki bdb76b darkmagenta 8b008b darkolivegreen 556b2f darkorange ff8c00 darkorchid 9932cc darkred 8b0000 darksalmon e9967a darkseagreen 8fbc8f darkslateblue 483d8b darkslategray 2f4f4f darkslategrey 2f4f4f darkturquoise 00ced1 darkviolet 9400d3 deeppink ff1493 deepskyblue 00bfff dimgray 696969 dimgrey 696969 dodgerblue 1e90ff firebrick b22222 floralwhite fffaf0 forestgreen 228b22 fuchsia ff00ff gainsboro dcdcdc ghostwhite f8f8ff gold ffd700 goldenrod daa520 gray 808080 green 008000 greenyellow adff2f grey 808080 honeydew f0fff0 hotpink ff69b4 indianred cd5c5c indigo 4b0082 ivory fffff0 khaki f0e68c lavender e6e6fa lavenderblush fff0f5 lawngreen 7cfc00 lemonchiffon fffacd lightblue add8e6 lightcoral f08080 lightcyan e0ffff lightgoldenrodyellow fafad2 lightgray d3d3d3 lightgreen 90ee90 lightgrey d3d3d3 lightpink ffb6c1 lightsalmon ffa07a lightseagreen 20b2aa lightskyblue 87cefa lightslategray 778899 lightslategrey 778899 lightsteelblue b0c4de lightyellow ffffe0 lime 00ff00 limegreen 32cd32 linen faf0e6 magenta ff00ff maroon 800000 mediumaquamarine 66cdaa mediumblue 0000cd mediumorchid ba55d3 mediumpurple 9370db mediumseagreen 3cb371 mediumslateblue 7b68ee mediumspringgreen 00fa9a mediumturquoise 48d1cc mediumvioletred c71585 midnightblue 191970 mintcream f5fffa mistyrose ffe4e1 moccasin ffe4b5 navajowhite ffdead navy 000080 oldlace fdf5e6 olive 808000 olivedrab 6b8e23 orange ffa500 orangered ff4500 orchid da70d6 palegoldenrod eee8aa palegreen 98fb98 paleturquoise afeeee palevioletred db7093 papayawhip ffefd5 peachpuff ffdab9 peru cd853f pink ffc0cb plum dda0dd powderblue b0e0e6 purple 800080 rebeccapurple 663399 red ff0000 rosybrown bc8f8f royalblue 4169e1 saddlebrown 8b4513 salmon fa8072 sandybrown f4a460 seagreen 2e8b57 seashell fff5ee sienna a0522d silver c0c0c0 skyblue 87ceeb slateblue 6a5acd slategray 708090 slategrey 708090 snow fffafa springgreen 00ff7f steelblue 4682b4 tan d2b48c teal 008080 thistle d8bfd8 tomato ff6347 turquoise 40e0d0 violet ee82ee wheat f5deb3 white ffffff whitesmoke f5f5f5 yellow ffff00 yellowgreen 9acd32';
const NAMED: ReadonlyMap<string, string> = (() => { const t = NAMED_SRC.split(' '), m = new Map<string, string>(); for (let i = 0; i < t.length; i += 2) m.set(t[i], t[i + 1]); return m; })();
export const CSS_COLOR_NAMES: readonly string[] = [...NAMED.keys()];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const fin = (...v: number[]) => v.every(Number.isFinite);

function fromHexDigits(h: string): Rgba | null {
  if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6 && h.length !== 8) return null;
  const n = parseInt(h.slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1 };
}
const fromInt = (n: number): Rgba | null => (Number.isInteger(n) && n >= 0 && n <= 0xffffff ? { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 } : null);

/** Một số có thể kèm %: `pct` = giá trị ứng với 100%. Không có % thì trả nguyên số. */
function num(tok: string | undefined, pct: number): number {
  if (tok === undefined) return NaN;
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(%)?$/.exec(tok);
  if (!m) return NaN;
  const v = Number(m[1]);
  return m[2] ? (v / 100) * pct : v;
}
/** Góc: số trơn = độ; nhận deg, grad, rad, turn. */
function angle(tok: string | undefined): number {
  if (tok === undefined) return NaN;
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+))(deg|grad|rad|turn)?$/.exec(tok);
  if (!m) return NaN;
  const v = Number(m[1]), u = m[2];
  const deg = u === 'grad' ? v * 0.9 : u === 'rad' ? (v * 180) / Math.PI : u === 'turn' ? v * 360 : v;
  return ((deg % 360) + 360) % 360;
}
/** Alpha: số 0..1 hoặc phần trăm; vắng = 1. */
const alphaOf = (tok: string | undefined): number => (tok === undefined ? 1 : clamp(num(tok, 1), 0, 1));
/** Phần trăm dạng số trơn (hsl(0, 100, 50)) hoặc có %: về 0..1. */
const unit = (tok: string | undefined): number => { const v = num(tok, 100); return clamp(v / 100, 0, 1); };

/** Tách đối số của hàm màu: theo dấu phẩy hoặc khoảng trắng; `/` tách alpha (cú pháp mới). */
function args(body: string): string[] | null {
  const [main, slashAlpha, extra] = body.split('/').map((s) => s.trim());
  if (extra !== undefined) return null;
  const parts = main.split(/\s*,\s*|\s+/).filter(Boolean);
  if (slashAlpha !== undefined) { if (!slashAlpha || parts.length !== 3) return null; parts.push(slashAlpha); }
  return parts.length === 3 || parts.length === 4 ? parts : null;
}

export function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const f = (n: number) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const a = s * Math.min(l, 1 - l), f = (n: number) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}
export function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d > 0) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [((h * 60) + 360) % 360, mx === 0 ? 0 : d / mx, mx];
}
export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const [h, , v] = rgbToHsv(r, g, b), mn = Math.min(r, g, b) / 255, l = (v + mn) / 2;
  const s = l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l);
  return [h, s, l];
}
/** oklch → sRGB 0..255 (ngoài gam màu thì kẹp từng kênh). */
export function oklchToRgb(L: number, C: number, H: number): [number, number, number] {
  const a = C * Math.cos((H * Math.PI) / 180), b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const g = (x: number) => { const c = clamp(x, 0, 1); return (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055) * 255; };
  return [g(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), g(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), g(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)];
}
const rgba = ([r, g, b]: [number, number, number], a: number): Rgba => ({ r: clamp(r, 0, 255), g: clamp(g, 0, 255), b: clamp(b, 0, 255), a });

/** Đọc một mã màu ở mọi định dạng hỗ trợ; không đọc được → null. */
export function parseColor(input: string): Rgba | null {
  if (typeof input !== 'string') return null;
  const s = input.trim().toLowerCase().replace(/;$/, '').trim();
  if (!s || s.length > 200) return null;
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  const named = NAMED.get(s); if (named) return fromHexDigits(named);
  let m = /^#([0-9a-f]{3,8})$/.exec(s);
  if (m) return fromHexDigits(m[1]);
  m = /^0x([0-9a-f]{1,8})$/.exec(s);
  if (m) return m[1].length === 8 ? fromHexDigits(m[1]) : fromInt(parseInt(m[1], 16));
  // Không có #: 6 ký tự (kể cả toàn chữ số) là HEX; 8 hoặc 3–4 ký tự là HEX khi có chữ a–f; số thập phân còn lại là số nguyên 0xRRGGBB.
  if (/^[0-9a-f]{6}$/.test(s) || (/^[0-9a-f]{3,4}$|^[0-9a-f]{8}$/.test(s) && /[a-f]/.test(s))) return fromHexDigits(s);
  if (/^\d+$/.test(s)) return fromInt(Number(s));
  m = /^([a-z]+)\((.*)\)$/.exec(s);
  if (m) {
    const fn = m[1], p = args(m[2]); if (!p) return null;
    const a = alphaOf(p[3]);
    if (fn === 'rgb' || fn === 'rgba') {
      const v = [num(p[0], 255), num(p[1], 255), num(p[2], 255)] as [number, number, number];
      return fin(...v, a) ? rgba(v, a) : null;
    }
    if (fn === 'hsl' || fn === 'hsla') {
      const h = angle(p[0]), sat = unit(p[1]), l = unit(p[2]);
      return fin(h, sat, l, a) ? rgba(hslToRgb(h, sat, l), a) : null;
    }
    if (fn === 'hsv' || fn === 'hsva' || fn === 'hsb' || fn === 'hsba') {
      const h = angle(p[0]), sat = unit(p[1]), v = unit(p[2]);
      return fin(h, sat, v, a) ? rgba(hsvToRgb(h, sat, v), a) : null;
    }
    if (fn === 'oklch') {
      const L = clamp(num(p[0], 1), 0, 1), C = Math.max(0, num(p[1], 0.4)), H = angle(p[2]);
      return fin(L, C, H, a) ? rgba(oklchToRgb(L, C, H), a) : null;
    }
    return null;
  }
  // Bộ số thập phân: "255, 0, 0", "255 0 0", "1.0, 0, 0" (có dấu chấm và mọi kênh ≤ 1 → thang 0..1), có thể thêm alpha.
  if (/^[\d.\s,%]+$/.test(s)) {
    const p = s.split(/\s*,\s*|\s+/).filter(Boolean);
    if (p.length !== 3 && p.length !== 4) return null;
    const v = p.slice(0, 3).map((t) => num(t, 255));
    if (!fin(...v)) return null;
    const unitScale = p.slice(0, 3).some((t) => t.includes('.')) && v.every((x) => x <= 1);
    const ch = unitScale ? v.map((x) => x * 255) : v;
    if (ch.some((x) => x > 255)) return null;
    let a = 1;
    if (p[3] !== undefined) { const x = num(p[3], 1); if (!Number.isFinite(x)) return null; a = clamp(x > 1 && !unitScale ? x / 255 : x, 0, 1); }
    return rgba(ch as [number, number, number], a);
  }
  return null;
}

const h2 = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
/** Mã chuẩn: `#rrggbb`, hoặc `#rrggbbaa` khi `alpha` và màu không đục hẳn. */
export function toHex(c: Rgba, alpha = true): string {
  const ab = Math.round(clamp(c.a, 0, 1) * 255);
  return `#${h2(c.r)}${h2(c.g)}${h2(c.b)}${alpha && ab < 255 ? h2(ab) : ''}`;
}
/** Đọc rồi xuất mã chuẩn; không đọc được → null. `alpha: false` bỏ alpha (ô chỉ nhận màu đục). */
export function normalizeColor(input: string, alpha = true): string | null {
  const c = parseColor(input); return c ? toHex(c, alpha) : null;
}
/** Hai mã có cùng màu không (không phân biệt hoa thường, #rgb = #rrggbb, alpha ff = không alpha). */
export function sameColor(a: string, b: string): boolean {
  const x = normalizeColor(a), y = normalizeColor(b); return x !== null && x === y;
}

const r0 = (v: number) => Math.round(v);
const aText = (a: number) => String(Math.round(a * 100) / 100);
/** Chuỗi hiển thị theo cách đang chọn (HEX in hoa cho dễ đọc; các dạng khác theo cú pháp CSS mới). */
export function formatColor(c: Rgba, f: ColorFormat, alpha = true): string {
  const a = alpha ? Math.round(clamp(c.a, 0, 1) * 255) / 255 : 1, tail = a < 1 ? ` / ${aText(a)}` : '';
  switch (f) {
    case 'rgb': return `rgb(${r0(c.r)} ${r0(c.g)} ${r0(c.b)}${tail})`;
    case 'hsl': { const [h, s, l] = rgbToHsl(c.r, c.g, c.b); return `hsl(${r0(h) % 360} ${r0(s * 100)}% ${r0(l * 100)}%${tail})`; }
    case 'hsv': { const [h, s, v] = rgbToHsv(c.r, c.g, c.b); return `hsv(${r0(h) % 360} ${r0(s * 100)}% ${r0(v * 100)}%${tail})`; }
    default: return toHex(c, alpha).toUpperCase();
  }
}
/** Rgba ↔ Hsva (bảng chọn làm việc trên HSV để vùng S/V và thanh hue không nhảy khi màu xám). */
export function toHsva(c: Rgba): Hsva { const [h, s, v] = rgbToHsv(c.r, c.g, c.b); return { h, s, v, a: c.a }; }
export function fromHsva(c: Hsva): Rgba { const [r, g, b] = hsvToRgb(c.h, c.s, c.v); return { r, g, b, a: c.a }; }
