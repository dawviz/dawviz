// RenderContext ghi lại lệnh vẽ của VexFlow thành display list thuần (JSON), nhóm theo phần tử.
// Chữ/glyph được đổi thành tham chiếu glyph (font, gid, vị trí, cỡ) để vẽ bằng đường viền: không cần FontFace.
import { RenderContext, Element, StaveNote, Note } from 'vexflow';
import { parseCssFont, layoutGlyphs, measureText } from './fonts.mjs';

const r2 = (n) => Math.round(n * 100) / 100;

export class RecordingContext extends RenderContext {
  constructor() {
    super();
    this.items = [];
    this.path = [];
    this.state = { fill: '#000', stroke: '#000', lineWidth: 1, lineCap: 'butt', dash: [], font: '10pt Academico', sx: 1, sy: 1 };
    this.stack = [];
    this.frames = []; // khung phần tử đang vẽ (do patchElementFrames đẩy vào)
    this.unsupported = {};
  }
  // ---- khung phần tử ----
  pushFrame(el) { this.frames.push(el); }
  popFrame() { this.frames.pop(); }
  owner() {
    for (let i = this.frames.length - 1; i >= 0; i--) {
      const el = this.frames[i];
      if (el instanceof StaveNote) return el.getAttribute('id');
      const n = typeof el.getNote === 'function' ? safe(() => el.getNote()) : null;
      if (n instanceof StaveNote) return n.getAttribute('id');
    }
    return null;
  }
  category() {
    const el = this.frames[this.frames.length - 1];
    return el ? el.getCategory?.() ?? el.constructor.name : 'Stave';
  }
  emit(item) {
    item.owner = this.owner();
    item.cat = this.category();
    this.items.push(item);
  }
  note(name) { this.unsupported[name] = (this.unsupported[name] || 0) + 1; }
  // ---- trạng thái ----
  clear() {}
  setFillStyle(s) { this.state.fill = String(s); return this; }
  setBackgroundFillStyle() { return this; }
  setStrokeStyle(s) { this.state.stroke = String(s); return this; }
  setShadowColor() { return this; }
  setShadowBlur() { return this; }
  setLineWidth(w) { this.state.lineWidth = w; return this; }
  setLineCap(c) { this.state.lineCap = c; return this; }
  setLineDash(d) { this.state.dash = d; return this; }
  scale(x, y) { this.state.sx *= x; this.state.sy *= y; return this; }
  resize() { return this; }
  set fillStyle(s) { this.state.fill = String(s); }
  get fillStyle() { return this.state.fill; }
  set strokeStyle(s) { this.state.stroke = String(s); }
  get strokeStyle() { return this.state.stroke; }
  setFont(f, size, weight, style) {
    if (typeof f === 'string' && size === undefined) this.state.font = f;
    else {
      const info = typeof f === 'object' ? f : { family: f, size, weight, style };
      const fam = info.family ?? 'Academico';
      let sz = info.size ?? 10; if (typeof sz === 'number') sz = sz + 'pt';
      const w = info.weight && info.weight !== 'normal' ? info.weight + ' ' : '';
      const st = info.style && info.style !== 'normal' ? info.style + ' ' : '';
      this.state.font = `${st}${w}${sz} ${fam}`;
    }
    return this;
  }
  getFont() { return this.state.font; }
  save() { this.stack.push({ ...this.state, dash: [...this.state.dash] }); return this; }
  restore() { if (this.stack.length) this.state = this.stack.pop(); return this; }
  // ---- hình ----
  X(x) { return r2(x * this.state.sx); }
  Y(y) { return r2(y * this.state.sy); }
  beginPath() { this.path = []; return this; }
  moveTo(x, y) { this.path.push(['M', this.X(x), this.Y(y)]); return this; }
  lineTo(x, y) { this.path.push(['L', this.X(x), this.Y(y)]); return this; }
  bezierCurveTo(a, b, c, d, x, y) { this.path.push(['C', this.X(a), this.Y(b), this.X(c), this.Y(d), this.X(x), this.Y(y)]); return this; }
  quadraticCurveTo(a, b, x, y) { this.path.push(['Q', this.X(a), this.Y(b), this.X(x), this.Y(y)]); return this; }
  arc(x, y, r, a0, a1, ccw) { this.path.push(['A', this.X(x), this.Y(y), r2(r * this.state.sx), a0, a1, ccw ? 1 : 0]); return this; }
  closePath() { this.path.push(['Z']); return this; }
  rect(x, y, w, h) { this.path.push(['M', this.X(x), this.Y(y)], ['L', this.X(x + w), this.Y(y)], ['L', this.X(x + w), this.Y(y + h)], ['L', this.X(x), this.Y(y + h)], ['Z']); return this; }
  fill() { this.emit({ t: 'path', d: this.path.slice(), fill: this.state.fill }); return this; }
  stroke() { this.emit({ t: 'path', d: this.path.slice(), stroke: this.state.stroke, lw: r2(this.state.lineWidth * this.state.sx), cap: this.state.lineCap, dash: this.state.dash.length ? this.state.dash : undefined }); return this; }
  fillRect(x, y, w, h) { this.emit({ t: 'path', d: [['M', this.X(x), this.Y(y)], ['L', this.X(x + w), this.Y(y)], ['L', this.X(x + w), this.Y(y + h)], ['L', this.X(x), this.Y(y + h)], ['Z']], fill: this.state.fill }); return this; }
  clearRect() { return this; }
  pointerRect() { return this; }
  fillText(text, x, y) {
    if (!text) return this;
    const gl = layoutGlyphs(this.state.font, String(text), x, y).map((g) => ({ f: g.font, g: g.gid, x: this.X(g.x), y: this.Y(g.y), s: r2(g.size * this.state.sx) }));
    if (gl.length) this.emit({ t: 'glyphs', glyphs: gl, fill: this.state.fill });
    return this;
  }
  measureText(text) {
    const m = measureText(this.state.font, String(text));
    return { x: 0, y: -m.fontBoundingBoxAscent, width: m.width, height: m.fontBoundingBoxAscent + m.fontBoundingBoxDescent };
  }
  openGroup() { return undefined; }
  closeGroup() {}
  openRotation() { this.note('openRotation'); }
  closeRotation() {}
  add() {}
}

function safe(f) { try { return f(); } catch { return null; } }

/** Bọc Element.drawWithStyle để biết phần tử nào đang vẽ (gán nốt chủ cho dấu hoá, chấm, cờ…). */
export function patchElementFrames() {
  if (Element.prototype.__framesPatched) return;
  const orig = Element.prototype.drawWithStyle;
  Element.prototype.drawWithStyle = function () {
    const ctx = this.getContext?.();
    const rec = ctx instanceof RecordingContext ? ctx : null;
    rec?.pushFrame(this);
    try { return orig.call(this); } finally { rec?.popFrame(); }
  };
  Element.prototype.__framesPatched = true;
}

/** Vẽ một phần tử trong khung của nó (cho các phần tử được gọi draw() trực tiếp: stave, connector…). */
export function drawFramed(ctx, el) {
  el.setContext(ctx);
  ctx.pushFrame(el);
  try { el.draw(); } finally { ctx.popFrame(); }
}

export { parseCssFont };
