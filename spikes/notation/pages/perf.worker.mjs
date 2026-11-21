// S3: đo thời gian vẽ khung bản nhạc trong Worker (OffscreenCanvas + VideoFrame như Export Worker).
import { makePathCache, drawItem } from '/lib/player.mjs';

self.onmessage = async ({ data }) => {
  const { layout: lay, W, H, fps, frames, cache: useCache, glow, start } = data;
  const S = Math.min(W / lay.width, 1.6);
  const canvas = new OffscreenCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const paths = makePathCache();
  const BASE = '#cfd6e6', PLAYED = '#6b7488', ACTIVE = '#ffb347';
  const L = (p) => ({ ...lay, items: p.items });
  const pageAt = (t) => { let lo = 0, hi = lay.pages.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (lay.pages[m].start <= t) lo = m; else hi = m - 1; } return lo; };
  // chỉ mục phần tử theo chủ nốt cho từng trang
  const ownerItems = lay.pages.map((p) => { const m = new Map(); p.items.forEach((it) => { if (it.owner) (m.get(it.owner) ?? m.set(it.owner, []).get(it.owner)).push(it); }); return m; });
  const pageOwners = ownerItems.map((m) => [...m.keys()].map((id) => ({ id, ...lay.owners[id] })).sort((a, b) => a.on - b.on));
  const bitmaps = new Map(); // page → {base, played}
  const bmp = (pi) => {
    if (bitmaps.has(pi)) return bitmaps.get(pi);
    const mk = (color) => { const c = new OffscreenCanvas(W, H); const x = c.getContext('2d'); x.scale(S, S); for (const it of lay.pages[pi].items) drawItem(x, L(lay.pages[pi]), paths, it, color); return c; };
    const v = { base: mk(BASE), played: mk(PLAYED) };
    bitmaps.set(pi, v);
    if (bitmaps.size > 3) bitmaps.delete(bitmaps.keys().next().value);
    return v;
  };
  const xAt = (sys, t) => { const a = sys.anchors; if (t <= a[0].sec) return a[0].x; for (let i = 1; i < a.length; i++) if (t < a[i].sec) { const p = a[i - 1], q = a[i]; return p.x + (q.x - p.x) * (t - p.sec) / (q.sec - p.sec || 1); } return a[a.length - 1].x; };

  const times = [];
  let bitmapMs = 0;
  for (let k = 0; k < frames; k++) {
    const t = start + k / fps;
    const t0 = performance.now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0d0f14'; ctx.fillRect(0, 0, W, H);
    const pi = pageAt(t), page = lay.pages[pi];
    if (useCache) {
      const tb = performance.now(); const b = bmp(pi); bitmapMs += performance.now() - tb;
      ctx.drawImage(b.base, 0, 0);
      // phần đã phát: các hàng trước + phần trái vạch phát của hàng hiện tại
      for (const sys of page.systems) {
        const x = t >= sys.end ? lay.width : t <= sys.start ? 0 : xAt(sys, t);
        if (x <= 0) continue;
        ctx.save(); ctx.beginPath(); ctx.rect(0, sys.y0 * S, x * S, (sys.y1 - sys.y0) * S); ctx.clip(); ctx.drawImage(b.played, 0, 0); ctx.restore();
      }
    } else {
      ctx.save(); ctx.scale(S, S);
      for (const it of page.items) { const o = it.owner && lay.owners[it.owner]; drawItem(ctx, L(page), paths, it, o ? (t >= o.off ? PLAYED : BASE) : BASE); }
      ctx.restore();
    }
    // nốt đang phát: phóng to + phát sáng
    ctx.save(); ctx.scale(S, S);
    for (const o of pageOwners[pi]) {
      if (o.on > t) break;
      if (t >= o.off) continue;
      const age = t - o.on, pulse = o.head ? 1 + 0.35 * Math.exp(-age * 6) : 1;
      const tf = { scale: pulse, cx: o.cx, cy: o.cy };
      for (const it of ownerItems[pi].get(o.id)) {
        if (glow === 'shadow') { ctx.shadowColor = ACTIVE; ctx.shadowBlur = 12 * S; drawItem(ctx, L(page), paths, it, ACTIVE, tf); ctx.shadowBlur = 0; }
        else if (glow === 'halo') { ctx.globalAlpha = 0.35; ctx.lineWidth = 3; ctx.lineJoin = 'round'; haloItem(ctx, L(page), paths, it, ACTIVE, tf); ctx.globalAlpha = 1; drawItem(ctx, L(page), paths, it, ACTIVE, tf); }
        else drawItem(ctx, L(page), paths, it, ACTIVE, tf);
      }
    }
    ctx.restore();
    const vf = new VideoFrame(canvas, { timestamp: Math.round(k * 1e6 / fps) });
    vf.close();
    times.push(performance.now() - t0);
  }
  const avg = (a) => a.reduce((x, y) => x + y, 0) / a.length;
  const sorted = [...times].sort((a, b) => a - b);
  postMessage({ first300: +avg(times.slice(0, 300)).toFixed(2), last300: +avg(times.slice(-300)).toFixed(2), mean: +avg(times).toFixed(2), p95: +sorted[Math.floor(sorted.length * 0.95)].toFixed(2), max: +sorted[sorted.length - 1].toFixed(1), bitmapMs: +bitmapMs.toFixed(0) });
};

// quầng sáng: tô viền dày quanh đường viền (glyph) hoặc nét dày hơn (đường)
function haloItem(ctx, layout, cache, it, color, tf) {
  if (tf && tf.scale !== 1) { ctx.save(); ctx.translate(tf.cx, tf.cy); ctx.scale(tf.scale, tf.scale); ctx.translate(-tf.cx, -tf.cy); }
  ctx.strokeStyle = color;
  if (it.t === 'path') { const lw = ctx.lineWidth; ctx.lineWidth = (it.lw ?? 1) + 4; ctx.stroke(cache.item(it)); ctx.lineWidth = lw; }
  else for (const g of it.glyphs) { const p = cache.glyph(layout, g.f + '#' + g.g); ctx.save(); ctx.translate(g.x, g.y); ctx.scale(g.s, g.s); ctx.lineWidth = 4 / g.s; ctx.stroke(p); ctx.restore(); }
  if (tf && tf.scale !== 1) ctx.restore();
}
