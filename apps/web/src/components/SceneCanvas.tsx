// Canvas xem trước: chỉ lo kích thước điểm ảnh/DPR và gọi renderFrame (T-05). Mọi bố cục và vẽ nằm ở Render Core,
// nên Preview và Export (M3) cho cùng khung hình; khác nhau duy nhất ở target và scale (SRS REQ-GRAPHICS-05).
import { useEffect, useRef, useState } from 'react';
import { renderFrame, type Derived, type RenderCtx, type SceneDocument, type UnifiedProjectAST } from '@dawviz/render-core';

export function SceneCanvas({ scene, derived, ast, t }: { scene: SceneDocument; derived: Derived; ast: UnifiedProjectAST; t: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [cssWidth, setCssWidth] = useState(0);
  useEffect(() => {
    const c = ref.current; if (!c || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setCssWidth(c.clientWidth));
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  const { designWidth: W, designHeight: H } = scene.canvas;
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const pw = Math.max(1, Math.round(c.clientWidth * dpr)), ph = Math.max(1, Math.round(pw * H / W));
    if (c.width !== pw || c.height !== ph) { c.width = pw; c.height = ph; }
    const ctx = c.getContext('2d'); if (!ctx) return;
    renderFrame(scene, derived, ast, t, { ctx: ctx as unknown as RenderCtx, width: pw, height: ph }, pw / W);
  }, [scene, derived, ast, t, cssWidth, W, H]);

  return <canvas ref={ref} data-testid="scene-canvas" className="block w-full rounded-xl" style={{ aspectRatio: `${W} / ${H}` }} />;
}
