#!/usr/bin/env node
// Sinh bảng độ rộng ký tự (FONT_METRICS) từ CHÍNH các tệp phông đã đóng gói trong apps/web/public/fonts
// (TECHNICAL-DESIGN 5.7, điều kiện 1). Chỉ là công cụ lúc phát triển: dùng fontkit (devDependency).
// Dùng:  node scripts/gen-font-metrics.mjs         ghi packages/render-core/src/fontMetrics.generated.ts
// Không kerning, không ligature: khi vẽ đặt ctx.fontKerning = 'none' để đo khớp vẽ (điều kiện 2).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import * as fontkit from 'fontkit';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'apps/web/public/fonts');
const OUT = path.join(ROOT, 'packages/render-core/src/fontMetrics.generated.ts');
const FAMILY = 'Space Grotesk', WEIGHTS = [400, 700], SUBSETS = ['latin', 'latin-ext', 'vietnamese'];

const files = {}, weights = {};
let upm = 0;
for (const w of WEIGHTS) {
  const widths = {};
  for (const s of SUBSETS) {
    const name = `space-grotesk-${s}-${w}-normal.woff2`, buf = fs.readFileSync(path.join(DIR, name));
    files[name] = crypto.createHash('sha256').update(buf).digest('hex');
    const font = fontkit.create(buf);
    upm = font.unitsPerEm;
    for (const cp of font.characterSet) {
      if (cp in widths) continue; // subset đứng trước thắng (latin trước)
      widths[cp] = font.glyphForCodePoint(cp).advanceWidth;
    }
  }
  weights[w] = widths;
}
const body = `// TỆP SINH TỰ ĐỘNG bởi scripts/gen-font-metrics.mjs — không sửa tay. Sinh lại khi đổi tệp phông (test so mã băm).
// Độ rộng tiến (advance) theo đơn vị của phông (unitsPerEm), chưa kerning.
export const FONT_METRICS_DATA = ${JSON.stringify({ family: FAMILY, unitsPerEm: upm, files, weights })} as const;
`;
fs.writeFileSync(OUT, body);
console.log(`đã ghi ${path.relative(ROOT, OUT)}: ${Object.values(weights).map((w) => Object.keys(w).length).join(' + ')} ký tự, unitsPerEm ${upm}`);
