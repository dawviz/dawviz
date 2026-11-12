// Canvas Piano Roll: chỉ lo kích thước/DPR, gọi Render Core theo thời điểm t.
import { useEffect, useMemo, useRef } from 'react';
import { buildIndex, layoutPianoRoll, layoutKeyboard, drawPianoRoll, drawKeyboard, DEFAULT_KEYBOARD_STYLE, type UnifiedProjectAST, type BrightnessConfig, type StyleConfig, type KeyboardStyle } from '@dawviz/render-core';

const WINDOW_SECONDS = 8, PLAYHEAD_RATIO = 0.25;

/** Vẽ khung hình tại thời điểm `t`. Toàn bộ bố cục/vẽ nằm ở Render Core; component chỉ lo canvas và DPR. */
export function PianoRollCanvas({ ast, t, brightness, style, keyboard, height = 360 }: { ast: UnifiedProjectAST; t: number; brightness: Record<string, BrightnessConfig>; style: StyleConfig; keyboard: KeyboardStyle; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const index = useMemo(() => buildIndex(ast.tracks, ast.meta.totalDurationSeconds), [ast]);
  const [pitchMin, pitchMax] = useMemo(() => {
    let lo = 127, hi = 0;
    for (const tr of ast.tracks) if (tr.isVisible) { lo = Math.min(lo, tr.pitchRange.min); hi = Math.max(hi, tr.pitchRange.max); }
    return lo > hi ? [48, 84] : [Math.max(0, lo - 1), Math.min(127, hi + 1)];
  }, [ast]);

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth, h = height;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
    const ctx = c.getContext('2d'); if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const left = keyboard.enabled ? Math.min(keyboard.width, w * 0.4) : 0;
    const rects = layoutPianoRoll(index, ast.tempoMap, t, { width: w, height: h, windowSeconds: WINDOW_SECONDS, playheadRatio: PLAYHEAD_RATIO, pitchMin, pitchMax, brightness, style, left });
    drawPianoRoll(ctx, rects, { width: w, height: h, background: '#0c0e16', playheadX: left + (w - left) * PLAYHEAD_RATIO });
    if (keyboard.enabled) {
      const ks = { ...DEFAULT_KEYBOARD_STYLE, ...keyboard, width: left };
      drawKeyboard(ctx, layoutKeyboard(index, t, { height: h, pitchMin, pitchMax, style: ks, noteStyle: style }), { width: left, height: h, whiteColor: ks.whiteColor });
    }
  }, [ast, index, t, brightness, style, keyboard, pitchMin, pitchMax, height]);

  return <canvas ref={ref} data-testid="piano-roll" className="w-full rounded-xl" style={{ height }} />;
}
