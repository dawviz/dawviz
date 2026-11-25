// Bố cục "đang thấy" của widget tại vạch phát (D-64): khi vị trí/cỡ/góc có keyframe hoặc chạy theo nhạc, khung chọn trên canvas và các ô X/Y/W/H/Xoay
// phải theo đúng chỗ widget đang được vẽ, không đứng yên ở bố cục tĩnh. Chỉ theo dõi đồng hồ phát khi có hoạt hình bố cục (không vẽ lại mỗi khung vô ích).
// Sửa trên khung/ô khi thuộc tính đang có keyframe thì đặt keyframe tại vạch phát (Editor.editLayouts, như After Effects).
import { useMemo, type ReactNode } from 'react';
import { resolveAnimated, tracksFor, type Derived, type SceneDocument, type UnifiedProjectAST, type WidgetLayout, type WidgetSpec } from '@dawviz/render-core';
import { usePlayback, type Playback } from '../lib/playback.ts';
import { EditorOverlay } from './EditorOverlay.tsx';
import { scaledLayout, unscalePatch } from '../lib/editorGeometry.ts';

export interface LiveCtx { ast: UnifiedProjectAST; derived: Derived; playback: Playback }
export const hasLayoutAnim = (w: WidgetSpec): boolean => !!w.animate && Object.keys(w.animate).some((p) => p.startsWith('layout.'));
/** Có bố cục hoặc tỉ lệ đang animate: khung chọn trên canvas phải đi theo. */
const hasFrameAnim = (w: WidgetSpec): boolean => !!w.animate && Object.keys(w.animate).some((p) => p.startsWith('layout.') || p === 'scale');

/** Bố cục của `w` tại `t` (chỉ phần layout.* được áp; thuộc tính khác giữ nguyên). */
export function layoutAt(w: WidgetSpec, ctx: Omit<LiveCtx, 'playback'>, canvas: SceneDocument['canvas'], t: number): WidgetLayout {
  if (!hasLayoutAnim(w)) return w.layout;
  return resolveAnimated(w, { ast: ctx.ast, derived: ctx.derived, tracks: tracksFor(w, ctx.derived.index, t), t }, canvas).widget.layout;
}

/** Render-prop: con nhận bố cục tại vạch phát của widget. */
export function LiveLayout({ w, ctx, canvas, children }: { w: WidgetSpec; ctx: LiveCtx; canvas: SceneDocument['canvas']; children(l: WidgetLayout): ReactNode }) {
  const on = hasLayoutAnim(w);
  const t = usePlayback(ctx.playback, (s) => (on ? s.t : 0));
  const l = useMemo(() => (on ? layoutAt(w, ctx, canvas, t) : w.layout), [on, w, ctx, canvas, t]);
  return <>{children(l)}</>;
}

/**
 * Lớp chỉnh sửa trên khung, với widget đang animate bố cục được đặt đúng chỗ tại vạch phát. `scale` đang animate: khung vẽ theo hình đã co giãn quanh
 * điểm neo (đúng thứ người dùng thấy); thay đổi trên khung được đổi ngược về bố cục gốc trước khi ghi (lib/editorGeometry.ts unscalePatch).
 */
export function LiveOverlay({ ctx, scene, onLayouts, ...rest }: { ctx: LiveCtx } & Parameters<typeof EditorOverlay>[0]) {
  const moving = useMemo(() => scene.widgets.some(hasFrameAnim), [scene]);
  const t = usePlayback(ctx.playback, (s) => (moving ? s.t : 0));
  const frames = useMemo(() => {
    const m = new Map<string, { layout: WidgetLayout; scale: number }>();
    if (moving) for (const w of scene.widgets) {
      if (!hasFrameAnim(w)) continue;
      const r = resolveAnimated(w, { ast: ctx.ast, derived: ctx.derived, tracks: tracksFor(w, ctx.derived.index, t), t }, scene.canvas);
      m.set(w.id, { layout: scaledLayout(r.widget.layout, r.scale), scale: r.scale });
    }
    return m;
  }, [moving, scene, ctx, t]);
  const shown = useMemo(() => (!frames.size ? scene : {
    ...scene, widgets: scene.widgets.map((w) => { const f = frames.get(w.id); return f ? { ...w, layout: f.layout } : w; }),
  }), [frames, scene]);
  const onShownLayouts = (p: Record<string, Partial<WidgetLayout>>) => onLayouts(Object.fromEntries(Object.entries(p).map(([id, patch]) => {
    const f = frames.get(id);
    return [id, f ? unscalePatch(f.layout, patch, f.scale) : patch];
  })));
  return <EditorOverlay scene={shown} onLayouts={onShownLayouts} {...rest} />;
}
