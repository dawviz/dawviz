// Bố cục panel đổi cỡ của thẻ Editor (UI-DIRECTION 5.3, DESIGN.md "Panel đổi cỡ"): cột Lớp, cột Thiết lập, panel Timeline ở đáy
// và cột cây thuộc tính trong Timeline. Logic thuần: giới hạn, kẹp theo cỡ cửa sổ, đọc lại dữ liệu đã lưu. Không DOM; test ở panelLayout.test.ts.

export type PanelId = 'layers' | 'props' | 'timeline' | 'tree';
export type CollapsibleId = 'layers' | 'props' | 'timeline';
export interface PanelLayout {
  /** Cỡ (px) khi mở: bề rộng của layers/props/tree, chiều cao của timeline. */
  size: Record<PanelId, number>;
  /** Thu gọn. `timeline` chưa có giá trị = theo chế độ (Cơ bản thu gọn, Nâng cao mở). */
  collapsed: { layers: boolean; props: boolean; timeline?: boolean };
}

export const PANEL_LIMITS: Readonly<Record<PanelId, readonly [number, number]>> = {
  layers: [160, 400], props: [272, 560], timeline: [140, 640], tree: [248, 480],
};
export const DEFAULT_LAYOUT: PanelLayout = { size: { layers: 224, props: 336, timeline: 220, tree: 300 }, collapsed: { layers: false, props: false } };
/** Cỡ khi thu gọn: dải dọc chứa nút mở (cột) và thanh tiêu đề (timeline). */
export const RAIL = 36, TIMELINE_BAR = 36;
/** Sân khấu luôn còn tối thiểu chừng này (px) để khung preview không bị bóp mất. */
export const STAGE_MIN = { width: 360, height: 420 } as const;

const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.round(Math.min(hi, Math.max(lo, v)));
const num = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

/** Đọc bố cục đã lưu; trường thiếu hoặc sai lấy mặc định, số ngoài giới hạn bị kẹp. */
export function parseLayout(raw: unknown): PanelLayout {
  const o = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {};
  const s = o.size && typeof o.size === 'object' ? o.size as Record<string, unknown> : {};
  const c = o.collapsed && typeof o.collapsed === 'object' ? o.collapsed as Record<string, unknown> : {};
  const size = Object.fromEntries((Object.keys(PANEL_LIMITS) as PanelId[]).map((k) => [k, num(s[k]) ? clamp(s[k] as number, PANEL_LIMITS[k]) : DEFAULT_LAYOUT.size[k]])) as Record<PanelId, number>;
  return {
    size,
    collapsed: { layers: c.layers === true, props: c.props === true, ...(typeof c.timeline === 'boolean' ? { timeline: c.timeline } : {}) },
  };
}

/** Đặt cỡ một panel (kẹp trong giới hạn của nó). */
export const setSize = (l: PanelLayout, id: PanelId, v: number): PanelLayout => ({ ...l, size: { ...l.size, [id]: clamp(v, PANEL_LIMITS[id]) } });
export const toggle = (l: PanelLayout, id: CollapsibleId, open: boolean): PanelLayout => ({ ...l, collapsed: { ...l.collapsed, [id]: !open } });
export const resetSize = (l: PanelLayout, id: PanelId): PanelLayout => setSize(l, id, DEFAULT_LAYOUT.size[id]);

export interface Resolved { layers: number; props: number; timeline: number; tree: number; open: Record<CollapsibleId, boolean> }
/**
 * Cỡ thật để vẽ trong khung `view` (px): panel thu gọn còn dải RAIL/TIMELINE_BAR; nếu cửa sổ hẹp tới mức sân khấu dưới STAGE_MIN thì
 * hai cột bị thu bớt (cột lớn hơn chịu trước, không xuống dưới giới hạn dưới), timeline thấp bớt. Không ghi đè cỡ người dùng đã lưu.
 */
export function resolveLayout(l: PanelLayout, view: { width: number; height: number }, advanced: boolean): Resolved {
  const open = { layers: !l.collapsed.layers, props: !l.collapsed.props, timeline: l.collapsed.timeline === undefined ? advanced : !l.collapsed.timeline };
  let layers = open.layers ? l.size.layers : RAIL, props = open.props ? l.size.props : RAIL;
  let over = layers + props + STAGE_MIN.width - view.width;
  for (const k of (props >= layers ? ['props', 'layers'] : ['layers', 'props']) as ('props' | 'layers')[]) {
    if (over <= 0 || !open[k]) continue;
    const cur = k === 'props' ? props : layers, give = Math.min(over, cur - PANEL_LIMITS[k][0]);
    if (k === 'props') props -= give; else layers -= give;
    over -= give;
  }
  const maxT = Math.max(PANEL_LIMITS.timeline[0], view.height - STAGE_MIN.height);
  const timeline = open.timeline ? Math.min(l.size.timeline, maxT) : TIMELINE_BAR;
  return { layers, props, timeline, tree: l.size.tree, open };
}
