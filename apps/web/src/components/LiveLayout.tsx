// Bố cục "đang thấy" của widget tại vạch phát (D-64): khi vị trí/cỡ/góc có keyframe hoặc chạy theo nhạc, khung chọn trên canvas và các ô X/Y/W/H/Xoay
// phải theo đúng chỗ widget đang được vẽ, không đứng yên ở bố cục tĩnh. Chỉ theo dõi đồng hồ phát khi có hoạt hình bố cục (không vẽ lại mỗi khung vô ích).
// Sửa trên khung/ô khi thuộc tính đang có keyframe thì đặt keyframe tại vạch phát (Editor.editLayouts, như After Effects).
import { useMemo, type ReactNode } from 'react';
import { resolveAnimated, tracksFor, type Derived, type SceneDocument, type UnifiedProjectAST, type WidgetLayout, type WidgetSpec } from '@dawviz/render-core';
import { usePlayback, type Playback } from '../lib/playback.ts';
import { EditorOverlay } from './EditorOverlay.tsx';

export interface LiveCtx { ast: UnifiedProjectAST; derived: Derived; playback: Playback }
export const hasLayoutAnim = (w: WidgetSpec): boolean => !!w.animate && Object.keys(w.animate).some((p) => p.startsWith('layout.'));

/** Bố cục của `w` tại `t` (chỉ phần layout.* được áp; thuộc tính khác giữ nguyên). */
export function layoutAt(w: WidgetSpec, ctx: Omit<LiveCtx, 'playback'>, canvas: SceneDocument['canvas'], t: number): WidgetLayout {
  if (!hasLayoutAnim(w)) return w.layout;
  return resolveAnimated(w, { ast: ctx.ast, derived: ctx.derived, tracks: tracksFor(w, ctx.derived.index), t }, canvas).widget.layout;
}

/** Render-prop: con nhận bố cục tại vạch phát của widget. */
export function LiveLayout({ w, ctx, canvas, children }: { w: WidgetSpec; ctx: LiveCtx; canvas: SceneDocument['canvas']; children(l: WidgetLayout): ReactNode }) {
  const on = hasLayoutAnim(w);
  const t = usePlayback(ctx.playback, (s) => (on ? s.t : 0));
  const l = useMemo(() => (on ? layoutAt(w, ctx, canvas, t) : w.layout), [on, w, ctx, canvas, t]);
  return <>{children(l)}</>;
}

/** Lớp chỉnh sửa trên khung, với widget đang animate bố cục được đặt đúng chỗ tại vạch phát. */
export function LiveOverlay({ ctx, scene, ...rest }: { ctx: LiveCtx } & Parameters<typeof EditorOverlay>[0]) {
  const moving = useMemo(() => scene.widgets.some(hasLayoutAnim), [scene]);
  const t = usePlayback(ctx.playback, (s) => (moving ? s.t : 0));
  const shown = useMemo(() => (!moving ? scene : {
    ...scene,
    widgets: scene.widgets.map((w) => { const l = layoutAt(w, ctx, scene.canvas, t); return l === w.layout ? w : { ...w, layout: l }; }),
  }), [moving, scene, ctx, t]);
  return <EditorOverlay scene={shown} {...rest} />;
}
