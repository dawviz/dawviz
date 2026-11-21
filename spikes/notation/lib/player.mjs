// Vẽ display list (NotationLayout) lên Canvas 2D bằng Path2D. Đây là nguyên mẫu của phần vẽ trong Render Core.
// style(item) → {color, alpha, scale, ox, oy} hoặc null (dùng mặc định). Không cấp phát Path2D lặp lại: cache theo khoá.

export function makePathCache() {
  const glyph = new Map();
  const items = new WeakMap();
  return {
    glyph(layout, key) {
      let p = glyph.get(key);
      if (!p) { p = toPath2D(layout.glyphs[key]); glyph.set(key, p); }
      return p;
    },
    item(it) {
      let p = items.get(it);
      if (!p) { p = toPath2D(it.d); items.set(it, p); }
      return p;
    },
  };
}

export function toPath2D(cmds) {
  const p = new Path2D();
  for (const c of cmds) {
    switch (c[0]) {
      case 'M': p.moveTo(c[1], c[2]); break;
      case 'L': p.lineTo(c[1], c[2]); break;
      case 'C': p.bezierCurveTo(c[1], c[2], c[3], c[4], c[5], c[6]); break;
      case 'Q': p.quadraticCurveTo(c[1], c[2], c[3], c[4]); break;
      case 'A': p.arc(c[1], c[2], c[3], c[4], c[5], !!c[6]); break;
      case 'Z': p.closePath(); break;
    }
  }
  return p;
}

/** Vẽ một phần tử. tf = {scale, cx, cy} phóng quanh tâm (cx, cy); color ghi đè màu. */
export function drawItem(ctx, layout, cache, it, color, tf) {
  if (tf && tf.scale !== 1) {
    ctx.save();
    ctx.translate(tf.cx, tf.cy); ctx.scale(tf.scale, tf.scale); ctx.translate(-tf.cx, -tf.cy);
  }
  if (it.t === 'path') {
    const p = cache.item(it);
    if (it.fill !== undefined) { ctx.fillStyle = color ?? '#000'; ctx.fill(p); }
    if (it.stroke !== undefined) {
      ctx.strokeStyle = color ?? '#000'; ctx.lineWidth = it.lw ?? 1; ctx.lineCap = it.cap ?? 'butt';
      ctx.setLineDash(it.dash ?? []); ctx.stroke(p);
    }
  } else {
    ctx.fillStyle = color ?? '#000';
    for (const g of it.glyphs) {
      const p = cache.glyph(layout, g.f + '#' + g.g);
      ctx.save(); ctx.translate(g.x, g.y); ctx.scale(g.s, g.s); ctx.fill(p); ctx.restore();
    }
  }
  if (tf && tf.scale !== 1) ctx.restore();
}

/** Hộp bao (thô) của một phần tử, dùng để lấy tâm phóng to. */
export function itemBBox(layout, it) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x, y) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; };
  if (it.t === 'path') {
    for (const c of it.d) if (c[0] === 'A') { add(c[1] - c[3], c[2] - c[3]); add(c[1] + c[3], c[2] + c[3]); } else for (let i = 1; i + 1 < c.length; i += 2) add(c[i], c[i + 1]);
  } else for (const g of it.glyphs) {
    for (const c of layout.glyphs[g.f + '#' + g.g]) for (let i = 1; i + 1 < c.length; i += 2) add(g.x + c[i] * g.s, g.y + c[i + 1] * g.s);
  }
  return { x0, y0, x1, y1 };
}

export function drawLayout(ctx, layout, cache, styleOf = () => null) {
  for (const it of layout.items) {
    const st = styleOf(it);
    drawItem(ctx, layout, cache, it, st?.color, st?.tf);
  }
}
