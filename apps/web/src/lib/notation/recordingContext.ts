// RenderContext của VexFlow ghi lại lệnh vẽ thành NotationItem (dữ liệu thuần), gắn mỗi phần tử với "chủ" là nốt đang vẽ.
// Chữ/glyph thành tham chiếu glyph (bảng sinh sẵn) để Render Core vẽ bằng đường viền: không cần phông web khi vẽ khung.
import { Element, RenderContext, StaveNote } from 'vexflow/core';
import type { NotationItem, PathData } from '@dawviz/render-core';
import { glyphPath, layoutText, measureText } from './glyphTable.ts';

const r2 = (n: number) => Math.round(n * 100) / 100;
type FontInfoLike = { family?: string; size?: string | number; weight?: string | number; style?: string };

export class RecordingContext extends RenderContext {
  items: NotationItem[] = [];
  /** Bảng glyph dùng trong bản dựng (chỉ số ↔ "phông:mã"). */
  glyphs: PathData[] = [];
  missing = new Set<number>();
  private glyphIndex = new Map<string, number>();
  private path: number[] = [];
  private st = { fill: '#000', stroke: '#000', lineWidth: 1, cap: 0 as 0 | 1 | 2, font: '10pt Academico' };
  private stack: typeof this.st[] = [];
  private frames: Element[] = [];
  /** id StaveNote → chỉ số chủ trong layout.owners. */
  ownerOf: (id: string) => number = () => -1;

  pushFrame(el: Element) { this.frames.push(el); }
  popFrame() { this.frames.pop(); }
  private owner(): number {
    for (let i = this.frames.length - 1; i >= 0; i--) {
      const el = this.frames[i] as Element & { getNote?: () => unknown };
      if (el instanceof StaveNote) return this.ownerOf(el.getAttribute('id'));
      let n: unknown = null;
      try { n = typeof el.getNote === 'function' ? el.getNote() : null; } catch { n = null; }
      if (n instanceof StaveNote) return this.ownerOf(n.getAttribute('id'));
    }
    return -1;
  }
  private emit(it: Omit<NotationItem, 'o'>) { this.items.push({ o: this.owner(), ...it }); }
  private glyph(font: string, cp: number): number {
    const k = font + ':' + cp;
    let i = this.glyphIndex.get(k);
    if (i === undefined) { i = this.glyphs.length; this.glyphs.push(glyphPath(font, cp)); this.glyphIndex.set(k, i); }
    return i;
  }

  clear() {}
  setFillStyle(s: string) { this.st.fill = String(s); return this; }
  setBackgroundFillStyle() { return this; }
  setStrokeStyle(s: string) { this.st.stroke = String(s); return this; }
  setShadowColor() { return this; }
  setShadowBlur() { return this; }
  setLineWidth(w: number) { this.st.lineWidth = w; return this; }
  setLineCap(c: CanvasLineCap) { this.st.cap = c === 'round' ? 1 : c === 'square' ? 2 : 0; return this; }
  setLineDash() { return this; }
  scale() { return this; }
  resize() { return this; }
  set fillStyle(s: string | CanvasGradient | CanvasPattern) { this.st.fill = String(s); }
  get fillStyle(): string { return this.st.fill; }
  set strokeStyle(s: string | CanvasGradient | CanvasPattern) { this.st.stroke = String(s); }
  get strokeStyle(): string { return this.st.stroke; }
  setFont(f?: string | FontInfoLike, size?: string | number, weight?: string | number, style?: string) {
    if (typeof f === 'string' && size === undefined) { this.st.font = f; return this; }
    const info: FontInfoLike = typeof f === 'object' && f ? f : { family: f as string | undefined, size, weight, style };
    let sz = info.size ?? 10; if (typeof sz === 'number') sz = sz + 'pt';
    const w = info.weight && info.weight !== 'normal' ? info.weight + ' ' : '', it = info.style && info.style !== 'normal' ? info.style + ' ' : '';
    this.st.font = `${it}${w}${sz} ${info.family ?? 'Academico'}`;
    return this;
  }
  getFont() { return this.st.font; }
  save() { this.stack.push({ ...this.st }); return this; }
  restore() { const s = this.stack.pop(); if (s) this.st = s; return this; }
  beginPath() { this.path = []; return this; }
  moveTo(x: number, y: number) { this.path.push(0, r2(x), r2(y)); return this; }
  lineTo(x: number, y: number) { this.path.push(1, r2(x), r2(y)); return this; }
  bezierCurveTo(a: number, b: number, c: number, d: number, x: number, y: number) { this.path.push(2, r2(a), r2(b), r2(c), r2(d), r2(x), r2(y)); return this; }
  quadraticCurveTo(a: number, b: number, x: number, y: number) { this.path.push(3, r2(a), r2(b), r2(x), r2(y)); return this; }
  arc(x: number, y: number, r: number, a0: number, a1: number, ccw: boolean) { this.path.push(5, r2(x), r2(y), r2(r), a0, a1, ccw ? 1 : 0); return this; }
  closePath() { this.path.push(4); return this; }
  rect(x: number, y: number, w: number, h: number) { this.path.push(0, r2(x), r2(y), 1, r2(x + w), r2(y), 1, r2(x + w), r2(y + h), 1, r2(x), r2(y + h), 4); return this; }
  fill() { if (this.path.length) this.emit({ k: 0, d: this.path.slice() }); return this; }
  stroke() { if (this.path.length) this.emit({ k: 1, d: this.path.slice(), lw: r2(this.st.lineWidth), ...(this.st.cap ? { cap: this.st.cap } : {}) }); return this; }
  fillRect(x: number, y: number, w: number, h: number) { this.emit({ k: 0, d: [0, r2(x), r2(y), 1, r2(x + w), r2(y), 1, r2(x + w), r2(y + h), 1, r2(x), r2(y + h), 4] }); return this; }
  clearRect() { return this; }
  pointerRect() { return this; }
  fillText(text: string, x: number, y: number) {
    if (!text) return this;
    const g: number[] = [];
    for (const p of layoutText(this.st.font, String(text), x, y, this.missing)) g.push(this.glyph(p.font, p.cp), r2(p.x), r2(p.y), r2(p.size));
    if (g.length) this.emit({ k: 2, g });
    return this;
  }
  measureText(text: string) {
    const m = measureText(this.st.font, String(text));
    return { x: 0, y: -m.fontBoundingBoxAscent, width: m.width, height: m.fontBoundingBoxAscent + m.fontBoundingBoxDescent };
  }
  openGroup() { return undefined; }
  closeGroup() {}
  openRotation() {}
  closeRotation() {}
  add() {}
}

let patched = false;
/** Bọc Element.drawWithStyle để biết phần tử nào đang vẽ (gán chủ nốt cho dấu hoá, chấm, cờ…). Gọi một lần. */
export function patchElementFrames(): void {
  if (patched) return;
  patched = true;
  const proto = Element.prototype as Element & { drawWithStyle(): Element };
  const orig = proto.drawWithStyle;
  proto.drawWithStyle = function (this: Element) {
    let ctx: unknown;
    try { ctx = this.getContext(); } catch { ctx = undefined; }
    const rec = ctx instanceof RecordingContext ? ctx : null;
    rec?.pushFrame(this);
    try { return orig.call(this); } finally { rec?.popFrame(); }
  };
}

/** Vẽ một phần tử được gọi draw() trực tiếp (khuông, đường nối khuông) trong khung của nó. */
export function drawFramed(ctx: RecordingContext, el: Element & { setContext(c: RenderContext): unknown; draw(): unknown }): void {
  el.setContext(ctx);
  ctx.pushFrame(el);
  try { el.draw(); } finally { ctx.popFrame(); }
}
