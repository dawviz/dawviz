#!/usr/bin/env node
// Sinh apps/web/src/lib/notation/notationFonts.generated.ts (D-63): số đo + đường viền của TẬP CON glyph mà engraver Bản nhạc dùng,
// lấy từ phông SMuFL nhúng trong VexFlow (Bravura, Petaluma, Gonville: nhạc; Academico, Petaluma Script: chữ). Engraver đo và vẽ bằng bảng này,
// nên không cần FontFace hay fontkit lúc chạy, và mọi trình duyệt dàn trang giống nhau.
// Giấy phép phông: SIL OFL 1.1 (Steinberg) cho Bravura/Petaluma/Academico/Petaluma Script; Gonville không giữ bản quyền. Xem CREDITS.md.
// Chạy: node scripts/gen-notation-fonts.mjs   (cần npm install; dùng fontkit của devDependencies gốc)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as fontkit from 'fontkit';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const vf = path.join(root, 'node_modules/vexflow/build/esm/src');
const load = async (f, name) => (await import(pathToFileURL(path.join(vf, 'fonts', f)).href))[name];
const { Glyphs } = await import(pathToFileURL(path.join(vf, 'glyphs.js')).href);
const decode = (u) => fontkit.create(Buffer.from(u.slice(u.indexOf(',') + 1), 'base64'));

// Glyph nhạc engraver có thể vẽ (theo tên SMuFL trong bảng Glyphs của VexFlow). Thêm tính năng mới → thêm mẫu ở đây và chạy lại.
const MUSIC = /^(notehead(Black|Half|Whole|DoubleWhole)|rest(Whole|Half|Quarter|8th|16th|32nd|64th|DoubleWhole|HBar.*|WholeLegerLine|HalfLegerLine)|flag(8th|16th|32nd|64th)(Up|Down)|accidental(Sharp|Flat|Natural|DoubleSharp|DoubleFlat)|[gfc]Clef(Change)?|timeSig([0-9]|Common|CutCommon|Plus)|tuplet[0-9]|tupletColon|augmentationDot|brace|metNote(Whole|Half|Quarter|8th|16th)(Up)?|metAugmentationDot)$/;
const TEXT = Array.from({ length: 95 }, (_, i) => 32 + i).concat([0x2013, 0x2014, 0x2019, 0x2026, 0x00a0]);

const FONTS = [
  ['Bravura', 'bravura.js', 'Bravura', 'music'],
  ['Petaluma', 'petaluma.js', 'Petaluma', 'music'],
  ['Gonville', 'gonville.js', 'Gonville', 'music'],
  ['Academico', 'academico.js', 'Academico', 'text'],
  ['Petaluma Script', 'petalumascript.js', 'PetalumaScript', 'text'],
];

const musicCps = [...new Set(Object.entries(Glyphs).filter(([k]) => MUSIC.test(k)).map(([, v]) => v.codePointAt(0)))].sort((a, b) => a - b);
const OP = { moveTo: 0, lineTo: 1, bezierCurveTo: 2, quadraticCurveTo: 3, closePath: 4 };
const out = {};
let total = 0;
for (const [key, file, exp, kind] of FONTS) {
  const font = decode(await load(file, exp));
  const u = font.unitsPerEm, q = (n) => Math.round((n / u) * 1000); // nghìn em, số nguyên
  const glyphs = {};
  for (const cp of kind === 'music' ? musicCps : TEXT) {
    if (!font.hasGlyphForCodePoint(cp)) continue;
    const g = font.glyphForCodePoint(cp), bb = g.bbox, d = [];
    for (const c of g.path.commands) {
      d.push(OP[c.command]);
      for (let i = 0; i < c.args.length; i += 2) d.push(q(c.args[i]), -q(c.args[i + 1])); // y xuống dưới
    }
    const empty = !isFinite(bb.minX) || bb.maxX <= bb.minX;
    glyphs[cp] = [q(g.advanceWidth), empty ? 0 : q(bb.minX), empty ? 0 : q(bb.minY), empty ? 0 : q(bb.maxX), empty ? 0 : q(bb.maxY), d];
  }
  out[key] = { asc: q(font.ascent), desc: q(-font.descent), glyphs };
  total += Object.keys(glyphs).length;
}

const target = path.join(root, 'apps/web/src/lib/notation/notationFonts.generated.ts');
const body = `// SINH TỰ ĐỘNG bởi scripts/gen-notation-fonts.mjs: đừng sửa tay. ${total} glyph.
// Đơn vị: nghìn em. Mỗi glyph: [advance, minX, minY, maxX, maxY, path] (minY/maxY theo trục y lên; path y xuống, op 0 M,1 L,2 C,3 Q,4 Z).
// Đường viền dẫn xuất từ phông SMuFL nhúng trong VexFlow 5.6: Bravura, Petaluma, Academico, Petaluma Script © Steinberg Media Technologies GmbH,
// SIL Open Font License 1.1 (https://openfontlicense.org); Gonville (Simon Tatham, không giữ bản quyền). Xem CREDITS.md.
export type GlyphRec = [number, number, number, number, number, number[]];
export interface FontRec { asc: number; desc: number; glyphs: Record<number, GlyphRec> }
export const NOTATION_FONTS: Record<string, FontRec> = ${JSON.stringify(out)};
`;
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, body);
console.log(`${path.relative(root, target)}: ${total} glyph, ${(body.length / 1024).toFixed(0)} KB`);
