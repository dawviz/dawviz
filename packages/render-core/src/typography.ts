// T-72 (SRS REQ-GRAPHICS-18, D-58): kiểu chữ cho mọi chữ trong video. Thuần, không DOM: đo bằng `Measure` (bảng FONT_METRICS),
// nên Preview, Export Worker và test cho cùng vị trí ký tự. Ba lớp:
//   1. Mô hình: `TextStyle` (đủ thuộc tính phân kỳ 1.0), bộ kiểu dựng sẵn có tên (`TextStyleSet`), ghi đè theo chữ (`TextRef`).
//   2. Dàn chữ: đoạn nhiều kiểu (`TextSpan`) → các run đã đặt vị trí (tracking, chữ số đều bề rộng, tỉ lệ ngang, chỉ số trên/dưới,
//      chữ hoa nhỏ), tràn khung (cắt "…", tự thu nhỏ có cỡ tối thiểu, để tràn), xuống dòng có số dòng tối đa.
//   3. Primitive: chữ "thường" (chỉ phông/cỡ/độ đậm/màu) vẫn là TextPrim cũ, vẽ bằng một lệnh fillText như trước T-72;
//      chữ có thuộc tính Canvas 2D không làm đồng nhất được thì mang `rich` và do Render Core tự vẽ (render.ts).
import { fitText, type Measure } from './text.ts';
import type { TextPrim } from './prims.ts';

// ───────────────────────────── mô hình ─────────────────────────────
export type Align = 'left' | 'center' | 'right';
export type TextCase = 'none' | 'upper' | 'lower' | 'title' | 'smallCaps';
export type TextScript = 'none' | 'super' | 'sub';
export type TextOverflow = 'ellipsis' | 'shrink' | 'visible';
export interface GradientStop { at: number; color: string }
/** Gradient trải trên hộp của cả dòng chữ. `angle` (độ): 0 = trái → phải, 90 = trên → dưới. Radial: tâm hộp, bán kính nửa đường chéo. */
export interface TextGradient { kind: 'linear' | 'radial'; angle: number; stops: GradientStop[] }
/** Viền chữ. `outside`: chỉ nửa ngoài nét (vẽ dày gấp đôi dưới phần tô). Nằm trong nét: 1.1 (cùng nhiều lớp viền). */
export interface TextStroke { width: number; color: string; position: 'center' | 'outside'; join: 'miter' | 'round' | 'bevel'; over: boolean }
/** Đổ bóng: `angle` là hướng bóng đổ (độ, 0 = sang phải, 90 = xuống dưới), `distance`/`blur` theo pt. Khoảng cách 0 = phát sáng ngoài. */
export interface TextShadow { enabled: boolean; color: string; opacity: number; distance: number; angle: number; blur: number }
/** Hộp nền sau từng dòng chữ (đọc rõ trên nền phức tạp). */
export interface TextBackground { enabled: boolean; color: string; opacity: number; padX: number; padY: number; radius: number }

/** Đầy đủ thuộc tính chữ của phân kỳ 1.0 (REQ-GRAPHICS-18). Đơn vị: pt theo khung thiết kế. */
export interface TextStyle {
  font: string; weight: number; italic: boolean; size: number;
  /** Tỉ lệ ngang/dọc riêng của chữ (1 = 100%). */
  scaleX: number; scaleY: number;
  /** Dịch đường chân chữ, pt, dương = lên trên. */
  baselineShift: number; script: TextScript;
  underline: boolean; strike: boolean;
  /** Độ dày đường gạch (0 = tự theo cỡ chữ) và màu ('' = theo màu chữ). */
  decoThickness: number; decoColor: string;
  textCase: TextCase;
  /** Giãn chữ theo phần nghìn em (như tracking của AE/Photoshop). */
  tracking: number;
  /** Khoảng cách dòng khi chữ xuống dòng (bội số cỡ chữ). */
  leading: number;
  color: string; gradient: TextGradient | null; opacity: number;
  stroke: TextStroke; shadow: TextShadow; background: TextBackground;
  /** Chữ số đều bề rộng (tabular): số không nhảy khi đổi giá trị. */
  tabularNums: boolean;
  overflow: TextOverflow; minSize: number;
  wrap: boolean; maxLines: number;
}
export interface NamedTextStyle extends TextStyle { name: string }
export type TextStyleSet = Readonly<Record<string, NamedTextStyle>>;

type Nested = 'stroke' | 'shadow' | 'background';
/** Ghi đè của một chữ: `styleId` chọn kiểu trong bộ; thuộc tính nào có mặt thì thay thuộc tính đó (đối tượng con gộp một cấp). */
export type TextRef = { styleId?: string } & Partial<Omit<TextStyle, Nested>> & { [K in Nested]?: Partial<TextStyle[K]> };
/** Một đoạn chữ trong dòng; `style` ghi đè lên kiểu của cả dòng (định dạng từng đoạn). */
export interface TextSpan { text: string; style?: TextRef }

export const NO_STROKE: Readonly<TextStroke> = Object.freeze({ width: 0, color: '#000000', position: 'center', join: 'round', over: false });
export const NO_SHADOW: Readonly<TextShadow> = Object.freeze({ enabled: false, color: '#000000', opacity: 0.5, distance: 4, angle: 45, blur: 6 });
export const NO_BACKGROUND: Readonly<TextBackground> = Object.freeze({ enabled: false, color: '#000000', opacity: 0.6, padX: 8, padY: 4, radius: 4 });

/** Phông của kiểu gốc = `DEFAULT_FONT` trong fonts.ts (không import để tránh vòng fonts ↔ typography khi khởi tạo; test so hai giá trị). */
export const TEXT_DEFAULT_FONT = 'Space Grotesk';
/** Kiểu gốc: mọi thuộc tính nâng cao ở trạng thái "không có hiệu ứng". */
export const BASE_TEXT_STYLE: Readonly<TextStyle> = Object.freeze({
  font: TEXT_DEFAULT_FONT, weight: 400, italic: false, size: 18, scaleX: 1, scaleY: 1, baselineShift: 0, script: 'none',
  underline: false, strike: false, decoThickness: 0, decoColor: '', textCase: 'none', tracking: 0, leading: 1.2,
  color: '#111111', gradient: null, opacity: 1, stroke: { ...NO_STROKE }, shadow: { ...NO_SHADOW }, background: { ...NO_BACKGROUND },
  tabularNums: false, overflow: 'ellipsis', minSize: 6, wrap: false, maxLines: 1,
});
const named = (name: string, o: Partial<TextStyle>): NamedTextStyle => ({ ...cloneStyle({ ...BASE_TEXT_STYLE, ...o }), name });
/**
 * Bộ kiểu dựng sẵn (mặc định của mọi preset; preset thêm/sửa kiểu trong `scene.textStyles`). Giá trị trùng mặc định chữ của
 * từng widget trước T-72, nên preset cũ vẽ như cũ; khác duy nhất: số đếm và đồng hồ bật chữ số đều bề rộng (REQ-GRAPHICS-18).
 */
export const DEFAULT_TEXT_STYLES: TextStyleSet = Object.freeze({
  title: named('Title', { size: 72, weight: 700, color: '#111111' }),
  subtitle: named('Subtitle', { size: 28, weight: 400, color: '#111111' }),
  heading: named('Heading', { size: 34, weight: 700, color: '#111111' }),
  body: named('Body', { size: 17, weight: 400, color: '#777777' }),
  caption: named('Caption', { size: 15, weight: 400, color: '#888888' }),
  label: named('Small label', { size: 11, weight: 400, color: '#999999' }),
  counter: named('Counter', { size: 22, weight: 400, color: '#777777', tabularNums: true }),
  clock: named('Clock', { size: 18, weight: 400, color: '#777777', tabularNums: true }),
  tiny: named('Tiny', { size: 7, weight: 400, color: '#BBBBBB', tabularNums: true }),
});

export function cloneStyle<T extends TextStyle>(s: T): T {
  return { ...s, stroke: { ...s.stroke }, shadow: { ...s.shadow }, background: { ...s.background },
    gradient: s.gradient ? { ...s.gradient, stops: s.gradient.stops.map((x) => ({ ...x })) } : null };
}
const NESTED: readonly Nested[] = ['stroke', 'shadow', 'background'];
/** Gộp ghi đè lên kiểu (không sửa đầu vào). */
export function applyOverride(base: TextStyle, o: TextRef | undefined): TextStyle {
  const out = cloneStyle(base) as TextStyle & { name?: string };
  delete out.name;
  if (!o) return out;
  for (const [k, v] of Object.entries(o)) {
    if (k === 'styleId' || v === undefined) continue;
    if ((NESTED as readonly string[]).includes(k)) Object.assign(out[k as Nested], v);
    else if (k === 'gradient') out.gradient = v ? { ...(v as TextGradient), stops: (v as TextGradient).stops.map((x) => ({ ...x })) } : null;
    else (out as unknown as Record<string, unknown>)[k] = v;
  }
  return out;
}
/** Kiểu thật của một chữ: kiểu `ref.styleId` (vắng hoặc không có trong bộ → `fallbackId`) + ghi đè của chữ. */
export function resolveTextStyle(ref: TextRef | undefined, set: TextStyleSet = DEFAULT_TEXT_STYLES, fallbackId = 'body'): TextStyle {
  const base = (ref?.styleId && set[ref.styleId]) || set[fallbackId] || DEFAULT_TEXT_STYLES[fallbackId] || BASE_TEXT_STYLE;
  return applyOverride(base, ref);
}

// ── sửa kiểu (cho Editor; thuần, trả bản mới) ──
/** Thuộc tính chữ đang ghi đè (không tính `styleId`). Dùng cho chấm "đã sửa" và nút ↺ (REQ-UI-15). */
export const overriddenKeys = (ref: TextRef | undefined): string[] => Object.keys(ref ?? {}).filter((k) => k !== 'styleId' && (ref as Record<string, unknown>)[k] !== undefined);
/** Bỏ ghi đè của một thuộc tính (↺ về kiểu dựng sẵn); không đối số `key` thì bỏ hết, chỉ giữ `styleId`. */
export function resetOverride(ref: TextRef | undefined, key?: keyof TextRef): TextRef {
  if (!ref) return {};
  if (key === undefined) return ref.styleId ? { styleId: ref.styleId } : {};
  const { [key]: _drop, ...rest } = ref; return rest;
}
/** "Lưu thành kiểu mới": kiểu thật hiện tại của chữ thành kiểu `id` trong bộ; chữ trỏ về kiểu đó, hết ghi đè. */
export function saveAsTextStyle(set: TextStyleSet, ref: TextRef | undefined, fallbackId: string, id: string, name: string): { set: TextStyleSet; ref: TextRef } {
  return { set: { ...set, [id]: { ...cloneStyle(resolveTextStyle(ref, set, fallbackId)), name } }, ref: { styleId: id } };
}
/** "Cập nhật kiểu": đẩy ghi đè của chữ vào kiểu nó đang dùng (mọi chữ dùng kiểu đó đổi theo); chữ hết ghi đè. */
export function updateTextStyleFromRef(set: TextStyleSet, ref: TextRef | undefined, fallbackId: string): { set: TextStyleSet; ref: TextRef } {
  const id = ref?.styleId && set[ref.styleId] ? ref.styleId : fallbackId;
  const cur = set[id] ?? { ...BASE_TEXT_STYLE, name: id };
  return { set: { ...set, [id]: { ...cloneStyle(resolveTextStyle(ref, set, fallbackId)), name: cur.name } }, ref: ref?.styleId ? { styleId: ref.styleId } : {} };
}

// ───────────────────────────── dàn chữ ─────────────────────────────
/** Tỉ lệ so với cỡ chữ: phần trên/dưới baseline của hộp chữ (nền chữ, gradient), vị trí gạch chân/gạch ngang. */
export const TEXT_METRICS = Object.freeze({ ascent: 0.92, descent: 0.26, underline: 0.13, strike: 0.3, decoThickness: 0.06, scriptScale: 0.6, superShift: 0.35, subShift: 0.15, smallCapsScale: 0.78, italicSkew: 0.21 });
const ELLIPSIS = '…';

/** Một run đã đặt: cùng kiểu, vị trí tính bằng pt. `dx` so với mép trái dòng; `xs` (nếu có) là vị trí từng cụm ký tự so với `dx`. */
export interface PlacedRun {
  text: string; dx: number; width: number;
  font: string; size: number; weight: number; italic: boolean; scaleX: number; scaleY: number;
  /** Dịch lên trên của baseline (pt). */
  shift: number;
  /** Vẽ từng cụm ký tự tại `xs[i]` (tracking hoặc chữ số đều bề rộng); vắng = vẽ cả chuỗi một lệnh. */
  clusters?: string[]; xs?: number[];
  color: string; gradient: TextGradient | null; stroke: TextStroke;
  underline: boolean; strike: boolean; decoThickness: number; decoColor: string;
}
/** Phần vẽ riêng của chữ "giàu": mọi thứ bước vẽ cần, không phải đo lại. */
export interface RichText {
  /** Mép trái của dòng (pt, toạ độ widget), bề rộng, phần trên/dưới baseline. */
  left: number; width: number; ascent: number; descent: number;
  runs: PlacedRun[];
  opacity: number; shadow: TextShadow; background: TextBackground;
}

interface Piece { text: string; st: TextStyle; small: boolean }
const isMark = /\p{M}/u;
/** Tách cụm ký tự (ký tự gốc + dấu kết hợp) sau khi chuẩn hoá NFC, để vẽ từng cụm mà dấu tiếng Việt không rời chữ. */
export function clusters(s: string): string[] {
  const out: string[] = [];
  for (const ch of s.normalize('NFC')) { if (out.length && isMark.test(ch)) out[out.length - 1] += ch; else out.push(ch); }
  return out;
}
/** Đổi hoa/thường; chữ hoa nhỏ tách thành đoạn chữ thường (vẽ hoa, nhỏ hơn) và đoạn còn lại. */
function casePieces(text: string, st: TextStyle): Piece[] {
  const c = st.textCase;
  if (c === 'upper') return [{ text: text.toUpperCase(), st, small: false }];
  if (c === 'lower') return [{ text: text.toLowerCase(), st, small: false }];
  if (c === 'title') return [{ text: text.replace(/(^|[\s\-(/"'“])(\p{Ll})/gu, (_m, a: string, b: string) => a + b.toUpperCase()), st, small: false }];
  if (c !== 'smallCaps') return [{ text, st, small: false }];
  const out: Piece[] = [];
  for (const m of text.matchAll(/(\p{Ll}+)|([^\p{Ll}]+)/gu)) out.push(m[1] ? { text: m[1].toUpperCase(), st, small: true } : { text: m[2], st, small: false });
  return out;
}
const DIGIT = /^\d$/;

/** Dàn một dòng (không cắt). `factor` nhân mọi cỡ chữ (tự thu nhỏ). Trả run đặt từ x = 0 và bề rộng dòng (không tính tracking sau ký tự cuối). */
export function typesetLine(spans: readonly { text: string; st: TextStyle }[], measure: Measure, factor = 1): { runs: PlacedRun[]; width: number; ascent: number; descent: number } {
  const runs: PlacedRun[] = [];
  let x = 0, lastTrack = 0, ascent = 0, descent = 0;
  for (const sp of spans) for (const pc of casePieces(sp.text, sp.st)) {
    if (!pc.text) continue;
    const st = pc.st, M = TEXT_METRICS;
    const size = st.size * factor * (st.script === 'none' ? 1 : M.scriptScale) * (pc.small ? M.smallCapsScale : 1);
    const shift = st.baselineShift * factor + (st.script === 'super' ? st.size * factor * M.superShift : st.script === 'sub' ? -st.size * factor * M.subShift : 0);
    const track = (st.tracking / 1000) * st.size * factor;
    const cl = clusters(pc.text);
    const hasDigit = st.tabularNums && cl.some((c) => DIGIT.test(c));
    let cell = 0;
    if (hasDigit) for (let d = 0; d < 10; d++) cell = Math.max(cell, measure(String(d), st.font, size, st.weight));
    const perCluster = track !== 0 || hasDigit;
    let width: number, xs: number[] | undefined, groups = cl;
    // Chỉ chữ số đều bề rộng, không tracking: đoạn không phải chữ số vẽ liền một lệnh, chỉ chữ số đặt vào ô riêng.
    if (hasDigit && track === 0) { groups = []; for (const c of cl) { const last = groups.length - 1; if (!DIGIT.test(c) && last >= 0 && !DIGIT.test(groups[last])) groups[last] += c; else groups.push(c); } }
    if (!perCluster) width = measure(cl.join(''), st.font, size, st.weight) * st.scaleX;
    else {
      xs = []; let cx = 0;
      for (const c of groups) {
        const adv = measure(c, st.font, size, st.weight);
        if (hasDigit && DIGIT.test(c)) { xs.push(cx + (cell - adv) / 2 * st.scaleX); cx += cell * st.scaleX; }
        else { xs.push(cx); cx += adv * st.scaleX; }
        cx += track;
      }
      width = cx;
    }
    lastTrack = perCluster ? track : 0;
    runs.push({ text: cl.join(''), dx: x, width, font: st.font, size, weight: st.weight, italic: st.italic, scaleX: st.scaleX, scaleY: st.scaleY, shift,
      ...(perCluster ? { clusters: groups, xs } : {}), color: st.color, gradient: st.gradient, stroke: { ...st.stroke, width: st.stroke.width * factor },
      underline: st.underline, strike: st.strike, decoThickness: st.decoThickness * factor, decoColor: st.decoColor });
    x += width;
    ascent = Math.max(ascent, size * M.ascent * st.scaleY + shift);
    descent = Math.max(descent, size * M.descent * st.scaleY - shift);
  }
  if (runs.length && lastTrack) runs[runs.length - 1].width -= lastTrack; // run cuối: bỏ khoảng giãn sau ký tự cuối (gạch chân không thò ra)
  return { runs, width: Math.max(0, x - lastTrack), ascent, descent };
}

type Resolved = { text: string; st: TextStyle }[];
const resolveSpans = (spans: readonly TextSpan[], base: TextStyle, set: TextStyleSet): Resolved =>
  spans.filter((s) => s.text).map((s) => ({ text: s.text, st: s.style ? (s.style.styleId ? resolveTextStyle(s.style, set) : applyOverride(base, s.style)) : base }));
/** Cắt còn `n` cụm ký tự đầu (bỏ khoảng trắng cuối) rồi thêm "…" theo kiểu của đoạn cuối còn lại. */
function truncate(sp: Resolved, n: number): Resolved {
  const out: Resolved = []; let left = n;
  for (const s of sp) { if (left <= 0) break; const cl = clusters(s.text); out.push({ text: cl.slice(0, left).join(''), st: s.st }); left -= cl.length; }
  while (out.length && !out[out.length - 1].text.trimEnd()) out.pop();
  if (!out.length) return [];
  const last = out[out.length - 1]; last.text = last.text.trimEnd() + ELLIPSIS;
  return out;
}
const countClusters = (sp: Resolved) => sp.reduce((s, x) => s + clusters(x.text).length, 0);
const EPS = 1e-6;

/** Dàn một dòng vừa `maxWidth` theo `overflow` của kiểu dòng. null = không còn gì để vẽ. */
export function fitLine(sp: Resolved, base: TextStyle, maxWidth: number, measure: Measure): { spans: Resolved; factor: number; line: ReturnType<typeof typesetLine> } | null {
  let factor = 1, line = typesetLine(sp, measure, 1);
  if (!Number.isFinite(maxWidth) || line.width <= maxWidth + EPS || base.overflow === 'visible') return line.runs.length ? { spans: sp, factor, line } : null;
  if (!(maxWidth > 0)) return null;
  if (base.overflow === 'shrink') {
    const minF = Math.min(1, base.minSize / base.size);
    factor = Math.max(minF, maxWidth / line.width);
    line = typesetLine(sp, measure, factor);
    if (line.width <= maxWidth + EPS) return { spans: sp, factor, line };
  }
  let lo = 0, hi = countClusters(sp); // lớn nhất n sao cho n cụm đầu + "…" vừa
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (typesetLine(truncate(sp, mid), measure, factor).width <= maxWidth + EPS) lo = mid; else hi = mid - 1; }
  const cut = truncate(sp, lo);
  if (!cut.length) return null;
  return { spans: cut, factor, line: typesetLine(cut, measure, factor) };
}

/** Chia đoạn thành các dòng theo khoảng trắng (từ quá dài thì để fitLine cắt). */
function wrapLines(sp: Resolved, maxWidth: number, measure: Measure): Resolved[] {
  const words: Resolved[] = []; let cur: Resolved = [];
  for (const s of sp) for (const part of s.text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) { if (cur.length) words.push(cur); words.push([{ text: ' ', st: s.st }]); cur = []; }
    else cur.push({ text: part, st: s.st });
  }
  if (cur.length) words.push(cur);
  const lines: Resolved[] = []; let line: Resolved = [];
  const join = (a: Resolved, b: Resolved) => [...a, ...b];
  for (const wd of words) {
    const space = wd.length === 1 && wd[0].text === ' ';
    if (space) { if (line.length) line = join(line, wd); continue; }
    const next = join(line, wd);
    if (line.length && typesetLine(next, measure).width > maxWidth + EPS) { while (line.length && line[line.length - 1].text === ' ') line.pop(); lines.push(line); line = wd; }
    else line = next;
  }
  while (line.length && line[line.length - 1].text === ' ') line.pop();
  if (line.length) lines.push(line);
  return lines;
}

const isPlainStyle = (s: TextStyle) => !s.italic && s.scaleX === 1 && s.scaleY === 1 && s.baselineShift === 0 && s.script === 'none' && !s.underline && !s.strike &&
  s.textCase === 'none' && s.tracking === 0 && !s.gradient && s.opacity === 1 && !(s.stroke.width > 0) && !s.shadow.enabled && !s.background.enabled;
const sameLook = (a: TextStyle, b: TextStyle) => a.font === b.font && a.size === b.size && a.weight === b.weight && a.color === b.color && JSON.stringify(a) === JSON.stringify(b);

/**
 * Chữ → primitive. `spans` là các đoạn (một chuỗi = một đoạn), `ref` là kiểu của cả chữ, `fallbackId` kiểu mặc định của chỗ chữ đó trong
 * widget. `x` là điểm neo theo `align`, `y` là baseline dòng đầu. Trả các dòng (nhiều dòng khi kiểu bật xuống dòng) và bước tiến dọc.
 */
export function textPrims(content: string | readonly TextSpan[], style: TextStyle, x: number, y: number, align: Align, maxWidth: number,
  measure: Measure, alpha = 1, set: TextStyleSet = DEFAULT_TEXT_STYLES): { prims: TextPrim[]; height: number } {
  const spans = typeof content === 'string' ? [{ text: content }] : content;
  const sp = resolveSpans(spans, style, set);
  if (!sp.length) return { prims: [], height: 0 };
  const lineStep = style.size * style.leading;
  // Chữ thường: một đoạn (hoặc các đoạn cùng dáng), không hiệu ứng, không có chữ số cần căn ô → đúng đường vẽ trước T-72.
  const allSame = sp.every((s) => sameLook(s.st, sp[0].st));
  const text = sp.map((s) => s.text).join('');
  const needsCells = style.tabularNums && /\d/.test(text);
  if (allSame && isPlainStyle(sp[0].st) && !style.wrap && !needsCells && style.overflow !== 'shrink') {
    const st = sp[0].st, fin = Number.isFinite(maxWidth);
    const fitted = fin && style.overflow === 'ellipsis' ? fitText(text, maxWidth, st.font, st.size, st.weight, measure) : text;
    if (!fitted) return { prims: [], height: 0 };
    return { prims: [{ kind: 'text', text: fitted, x, y, font: st.font, size: st.size, weight: st.weight, align, color: st.color, alpha, maxWidth: fin && style.overflow === 'ellipsis' ? maxWidth : undefined }], height: lineStep };
  }
  const lines = style.wrap && Number.isFinite(maxWidth) ? wrapLines(sp, maxWidth, measure) : [sp];
  const maxLines = style.wrap ? Math.max(1, Math.round(style.maxLines)) : 1;
  if (lines.length > maxLines) { // dòng cuối được giữ phần còn lại để fitLine cắt "…"
    const rest = lines.slice(maxLines - 1).flatMap((l, i) => (i ? [{ text: ' ', st: l[0].st }, ...l] : l));
    lines.splice(maxLines - 1, lines.length, rest);
  }
  const prims: TextPrim[] = [];
  lines.forEach((ln, i) => {
    const f = fitLine(ln, style, maxWidth, measure);
    if (!f) return;
    const { line } = f, by = y + i * lineStep;
    const left = align === 'left' ? x : align === 'center' ? x - line.width / 2 : x - line.width;
    prims.push({ kind: 'text', text: line.runs.map((r) => r.text).join(''), x, y: by, font: style.font, size: style.size * f.factor, weight: style.weight, align, color: style.color, alpha,
      rich: { left, width: line.width, ascent: line.ascent, descent: line.descent, runs: line.runs, opacity: style.opacity,
        shadow: { ...style.shadow, distance: style.shadow.distance * f.factor, blur: style.shadow.blur * f.factor }, background: { ...style.background } } });
  });
  return { prims, height: Math.max(1, lines.length) * lineStep };
}
/** Bề rộng chữ khi dàn trên một dòng không cắt (để đặt các phần cạnh nhau). */
export function textWidth(content: string | readonly TextSpan[], style: TextStyle, measure: Measure, set: TextStyleSet = DEFAULT_TEXT_STYLES): number {
  const spans = typeof content === 'string' ? [{ text: content }] : content;
  return typesetLine(resolveSpans(spans, style, set), measure).width;
}

/** Mẫu chữ → các đoạn: chữ cố định theo kiểu dòng, giá trị của chỗ giữ theo `valueStyle` (vắng/rỗng = cùng kiểu). Chỗ giữ lạ giữ nguyên chữ. */
export function templateSpans(template: string, values: Readonly<Record<string, string | number>>, valueStyle?: TextRef): TextSpan[] {
  const vs = valueStyle && overriddenKeys(valueStyle).length + (valueStyle.styleId ? 1 : 0) > 0 ? valueStyle : undefined;
  const out: TextSpan[] = []; let last = 0;
  for (const m of template.matchAll(/\{([A-Za-z]+)\}/g)) {
    if (!(m[1] in values)) continue;
    if (m.index! > last) out.push({ text: template.slice(last, m.index) });
    out.push(vs ? { text: String(values[m[1]]), style: vs } : { text: String(values[m[1]]) });
    last = m.index! + m[0].length;
  }
  if (last < template.length) out.push({ text: template.slice(last) });
  // gộp các đoạn liền nhau cùng kiểu
  const merged: TextSpan[] = [];
  for (const s of out) { const p = merged[merged.length - 1]; if (p && p.style === s.style) p.text += s.text; else merged.push({ ...s }); }
  return merged;
}
