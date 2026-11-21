// Đo chữ và lấy đường viền glyph bằng fontkit, không cần FontFace/DOM.
// Dùng chính tệp phông nhúng trong VexFlow (data URL woff2) nên số đo khớp phông mà trình duyệt sẽ dùng.
import * as fontkit from 'fontkit';
import { Bravura } from '../node_modules/vexflow/build/esm/src/fonts/bravura.js';
import { Academico } from '../node_modules/vexflow/build/esm/src/fonts/academico.js';
import { AcademicoBold } from '../node_modules/vexflow/build/esm/src/fonts/academicobold.js';
import { Gonville } from '../node_modules/vexflow/build/esm/src/fonts/gonville.js';
import { Petaluma } from '../node_modules/vexflow/build/esm/src/fonts/petaluma.js';
import { PetalumaScript } from '../node_modules/vexflow/build/esm/src/fonts/petalumascript.js';

const fromDataUrl = (u) => Buffer.from(u.slice(u.indexOf(',') + 1), 'base64');

export const FONT_DATA = {
  Bravura, Academico, 'Academico Bold': AcademicoBold, Gonville, Petaluma, 'Petaluma Script': PetalumaScript,
};

const cache = new Map();
export function getFont(name) {
  if (!cache.has(name)) {
    const data = FONT_DATA[name];
    cache.set(name, data ? fontkit.create(fromDataUrl(data)) : null);
  }
  return cache.get(name);
}

/** Phân tích chuỗi CSS font kiểu "italic bold 30pt Bravura,Academico" → {sizePx, families, weight, style}. */
export function parseCssFont(css) {
  const m = /^\s*(?:(italic|normal|oblique)\s+)?(?:(bold|normal|[1-9]00)\s+)?([\d.]+)(pt|px)\s+(.+)$/.exec(css);
  if (!m) throw new Error('font không đọc được: ' + css);
  const size = parseFloat(m[3]);
  const sizePx = m[4] === 'pt' ? (size * 4) / 3 : size;
  const families = m[5].split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
  return { style: m[1] || 'normal', weight: m[2] || 'normal', sizePx, families };
}

/** Chọn phông cho một ký tự: phông đầu tiên trong danh sách có glyph (như trình duyệt dò dự phòng). */
export function pickFont(families, weight, cp) {
  for (const f of families) {
    const name = weight === 'bold' && getFont(f + ' Bold') ? f + ' Bold' : f;
    const font = getFont(name);
    if (font && font.hasGlyphForCodePoint(cp)) return { name, font };
  }
  return null;
}

/** Chia chuỗi thành các đoạn cùng phông. */
export function runs(css, text) {
  const { families, weight, sizePx } = parseCssFont(css);
  const out = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    const p = pickFont(families, weight, cp) ?? pickFont(['Academico'], weight, cp);
    if (!p) continue;
    const last = out[out.length - 1];
    if (last && last.name === p.name) last.text += ch;
    else out.push({ name: p.name, font: p.font, text: ch });
  }
  return { sizePx, runs: out };
}

/** measureText tương đương Canvas 2D (đơn vị px). */
export function measureText(css, text) {
  const { sizePx, runs: rs } = runs(css, text);
  let x = 0, minX = Infinity, maxX = -Infinity, maxY = -Infinity, minY = Infinity, fAsc = 0, fDesc = 0;
  for (const r of rs) {
    const s = sizePx / r.font.unitsPerEm;
    const lay = r.font.layout(r.text);
    for (let i = 0; i < lay.glyphs.length; i++) {
      const g = lay.glyphs[i], pos = lay.positions[i];
      const bb = g.bbox;
      if (isFinite(bb.minX) && bb.maxX > bb.minX) {
        minX = Math.min(minX, x + (bb.minX + pos.xOffset) * s);
        maxX = Math.max(maxX, x + (bb.maxX + pos.xOffset) * s);
        minY = Math.min(minY, (bb.minY + pos.yOffset) * s);
        maxY = Math.max(maxY, (bb.maxY + pos.yOffset) * s);
      }
      x += pos.xAdvance * s;
    }
    fAsc = Math.max(fAsc, r.font.ascent * s);
    fDesc = Math.max(fDesc, -r.font.descent * s);
  }
  if (!isFinite(minX)) { minX = 0; maxX = 0; minY = 0; maxY = 0; }
  return {
    width: x,
    actualBoundingBoxLeft: -minX, actualBoundingBoxRight: maxX,
    actualBoundingBoxAscent: maxY, actualBoundingBoxDescent: -minY,
    fontBoundingBoxAscent: fAsc, fontBoundingBoxDescent: fDesc,
    emHeightAscent: fAsc, emHeightDescent: fDesc,
    hangingBaseline: 0, alphabeticBaseline: 0, ideographicBaseline: 0,
  };
}

/** Canvas giả cho Element.setTextMeasurementCanvas. */
export function fakeMeasureCanvas() {
  const ctx = { font: '10px Academico', measureText(t) { return measureText(this.font, t); } };
  return { getContext: () => ctx };
}

/** Đường viền một glyph (đơn vị phông, y lên trên) → lệnh path đơn vị 1 em, y xuống dưới. */
const glyphCache = new Map();
export function glyphOutline(fontName, glyphId) {
  const key = fontName + '#' + glyphId;
  let v = glyphCache.get(key);
  if (!v) {
    const font = getFont(fontName);
    const g = font.getGlyph(glyphId);
    const u = font.unitsPerEm;
    const cmds = [];
    const r = (n) => Math.round((n / u) * 1e5) / 1e5;
    for (const c of g.path.commands) {
      const a = c.args;
      switch (c.command) {
        case 'moveTo': cmds.push(['M', r(a[0]), r(-a[1])]); break;
        case 'lineTo': cmds.push(['L', r(a[0]), r(-a[1])]); break;
        case 'quadraticCurveTo': cmds.push(['Q', r(a[0]), r(-a[1]), r(a[2]), r(-a[3])]); break;
        case 'bezierCurveTo': cmds.push(['C', r(a[0]), r(-a[1]), r(a[2]), r(-a[3]), r(a[4]), r(-a[5])]); break;
        case 'closePath': cmds.push(['Z']); break;
      }
    }
    v = cmds;
    glyphCache.set(key, v);
  }
  return v;
}

/** Bố trí chữ thành danh sách glyph {font, gid, x, y, size} (px). */
export function layoutGlyphs(css, text, x0, y0) {
  const { sizePx, runs: rs } = runs(css, text);
  const out = [];
  let x = x0;
  for (const r of rs) {
    const s = sizePx / r.font.unitsPerEm;
    const lay = r.font.layout(r.text);
    for (let i = 0; i < lay.glyphs.length; i++) {
      const pos = lay.positions[i];
      out.push({ font: r.name, gid: lay.glyphs[i].id, x: x + pos.xOffset * s, y: y0 - pos.yOffset * s, size: sizePx });
      x += pos.xAdvance * s;
    }
  }
  return out;
}
