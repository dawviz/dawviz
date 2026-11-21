// S1: chạy VexFlow trong Node (không DOM, không FontFace), ghi display list ra out/s1-layout.json.
import { writeFileSync, mkdirSync } from 'node:fs';
import * as VF from 'vexflow';
import { RecordingContext, patchElementFrames, drawFramed } from './lib/recordingContext.mjs';
import { fakeMeasureCanvas, glyphOutline } from './lib/fonts.mjs';
import { drawSample } from './lib/sampleScore.mjs';

VF.Element.setTextMeasurementCanvas(fakeMeasureCanvas());
patchElementFrames();

const t0 = performance.now();
const ctx = new RecordingContext();
const size = drawSample(VF, ctx, { frame: (el) => drawFramed(ctx, el) });
const t1 = performance.now();

// Bảng glyph dùng chung: mỗi (font, gid) một đường viền, đơn vị em.
const glyphs = {};
for (const it of ctx.items) if (it.t === 'glyphs') for (const g of it.glyphs) {
  const k = g.f + '#' + g.g;
  glyphs[k] ??= glyphOutline(g.f, g.g);
}
const layout = { size, items: ctx.items, glyphs, unsupported: ctx.unsupported };
mkdirSync('out', { recursive: true });
const json = JSON.stringify(layout);
writeFileSync('out/s1-layout.json', json);

const owners = new Set(ctx.items.map((i) => i.owner).filter(Boolean));
const cats = {};
for (const i of ctx.items) cats[i.cat + (i.owner ? '*' : '')] = (cats[i.cat + (i.owner ? '*' : '')] || 0) + 1;
console.log(JSON.stringify({
  engraveMs: +(t1 - t0).toFixed(1), items: ctx.items.length, glyphKinds: Object.keys(glyphs).length,
  bytes: json.length, owners: [...owners].sort(), categories: cats, unsupported: ctx.unsupported,
}, null, 1));
