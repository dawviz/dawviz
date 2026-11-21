// Đo chữ và tra glyph cho engraver Bản nhạc bằng bảng sinh sẵn (notationFonts.generated.ts): không FontFace, không DOM,
// giống nhau ở mọi trình duyệt và trong Node (test). Đơn vị đo: px như Canvas 2D (cỡ "30pt" = 40 px).
import type { PathData } from '@dawviz/render-core';
import { NOTATION_FONTS, type FontRec, type GlyphRec } from './notationFonts.generated.ts';

export interface ParsedFont { sizePx: number; families: string[]; weight: string; style: string }

/** Chuỗi CSS font kiểu "italic bold 30pt Bravura,Academico". */
export function parseCssFont(css: string): ParsedFont {
  const m = /^\s*(?:(italic|normal|oblique)\s+)?(?:(bold|normal|[1-9]00)\s+)?([\d.]+)(pt|px)\s+(.+)$/.exec(css);
  if (!m) return { sizePx: 13.33, families: ['Academico'], weight: 'normal', style: 'normal' };
  const size = parseFloat(m[3]);
  return { style: m[1] || 'normal', weight: m[2] || 'normal', sizePx: m[4] === 'pt' ? (size * 4) / 3 : size, families: m[5].split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')) };
}

/** Phông đầu tiên trong danh sách có glyph cho ký tự (như trình duyệt dò dự phòng); cuối cùng là Academico. */
export function pickGlyph(families: readonly string[], cp: number): { font: string; rec: GlyphRec } | null {
  for (const f of [...families, 'Academico']) {
    const font: FontRec | undefined = NOTATION_FONTS[f];
    const rec = font?.glyphs[cp];
    if (rec) return { font: f, rec };
  }
  return null;
}

export interface PlacedGlyph { font: string; cp: number; x: number; y: number; size: number }
/** Bố trí chữ: mỗi ký tự một glyph, cách nhau theo advance (không kerning: đo và vẽ cùng một luật). `missing` đếm ký tự không có trong bảng. */
export function layoutText(css: string, text: string, x0: number, y0: number, missing?: Set<number>): PlacedGlyph[] {
  const f = parseCssFont(css), out: PlacedGlyph[] = [];
  let x = x0;
  for (const ch of text) {
    const cp = ch.codePointAt(0)!;
    const g = pickGlyph(f.families, cp);
    if (!g) { missing?.add(cp); continue; }
    out.push({ font: g.font, cp, x, y: y0, size: f.sizePx });
    x += (g.rec[0] / 1000) * f.sizePx;
  }
  return out;
}

/** measureText tương đương Canvas 2D. */
export function measureText(css: string, text: string) {
  const f = parseCssFont(css);
  let x = 0, minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, asc = 0, desc = 0;
  for (const ch of text) {
    const g = pickGlyph(f.families, ch.codePointAt(0)!);
    if (!g) continue;
    const s = f.sizePx / 1000, r = g.rec;
    if (r[3] > r[1]) { minX = Math.min(minX, x + r[1] * s); maxX = Math.max(maxX, x + r[3] * s); minY = Math.min(minY, r[2] * s); maxY = Math.max(maxY, r[4] * s); }
    const fr = NOTATION_FONTS[g.font];
    asc = Math.max(asc, fr.asc * s); desc = Math.max(desc, fr.desc * s);
    x += r[0] * s;
  }
  if (!isFinite(minX)) { minX = 0; maxX = 0; minY = 0; maxY = 0; }
  return {
    width: x, actualBoundingBoxLeft: -minX, actualBoundingBoxRight: maxX, actualBoundingBoxAscent: maxY, actualBoundingBoxDescent: -minY,
    fontBoundingBoxAscent: asc, fontBoundingBoxDescent: desc, emHeightAscent: asc, emHeightDescent: desc, hangingBaseline: 0, alphabeticBaseline: 0, ideographicBaseline: 0,
  };
}

/** Canvas giả cho VexFlow `Element.setTextMeasurementCanvas`. */
export function measureCanvas() {
  const ctx = { font: '10pt Academico', measureText(this: { font: string }, t: string) { return measureText(this.font, t); } };
  return { getContext: () => ctx };
}

/** Đường viền glyph (đơn vị em, y xuống dưới) từ bảng (nghìn em). */
export function glyphPath(font: string, cp: number): PathData {
  const rec = NOTATION_FONTS[font]?.glyphs[cp];
  if (!rec) return [];
  const src = rec[5], out: number[] = [];
  for (let i = 0; i < src.length;) {
    const op = src[i++], n = op === 0 || op === 1 ? 2 : op === 2 ? 6 : op === 3 ? 4 : 0;
    out.push(op);
    for (let k = 0; k < n; k++) out.push(src[i++] / 1000);
  }
  return out;
}
