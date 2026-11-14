// Kiểu primitive và hợp đồng widget (tách khỏi render.ts để widget và renderFrame không import vòng).
import type { TimelineIndex, TrackIndex } from './notes.ts';
import type { BrightnessConfig } from './brightness.ts';
import type { UnifiedProjectAST } from './types.ts';
import type { WidgetSpec, WidgetType } from './scene.ts';
import type { HudData } from './hud.ts';
import type { Measure } from './text.ts';
import type { RichText, TextStyleSet } from './typography.ts';

/** Dữ liệu dẫn xuất: tính một lần ngoài vòng vẽ (Technical Design §4). */
export interface Derived {
  index: TimelineIndex; brightness: Record<string, BrightnessConfig>;
  /** Số đếm tích luỹ và lưới ô nhịp cho các widget chữ (buildHud). Vắng thì dựng một lần rồi đệm (hudOf). */
  hud?: HudData;
  /** false = phông chưa nạp xong: renderFrame bỏ qua mọi primitive chữ (vắng = sẵn sàng). */
  fontsReady?: boolean;
  /** Hàm đo chữ cho layout; vắng thì dùng FONT_METRICS (TECHNICAL-DESIGN 5.7). */
  measure?: Measure;
}

export interface RectPrim {
  kind: 'rect';
  x: number; y: number; w: number; h: number;
  fill: string; alpha: number;      // alpha đã gộp độ sáng × độ đục, 0..1
  radius: number;                   // 0 = góc vuông
  glowColor: string; glowBlur: number; // glowBlur 0 = không phát sáng
  stroke: string; strokeWidth: number; // strokeWidth 0 = không viền
}
/** Chữ một dòng. `y` là đường baseline; `x` là điểm neo theo `align`. */
export interface TextPrim {
  kind: 'text'; text: string; x: number; y: number;
  font: string; size: number; weight: number; align: 'left' | 'center' | 'right';
  color: string; alpha: number;
  maxWidth?: number;                // layout đã cắt bằng bảng đo; bước vẽ truyền tiếp cho fillText để không bao giờ tràn
  /** T-72: chữ có thuộc tính Canvas 2D không làm đồng nhất (tracking, chữ số đều, gạch, viền, gradient, bóng, nền, nhiều kiểu):
   *  Render Core tự vẽ theo vị trí đã dàn; `text`/`x`/`size`… vẫn điền để đọc/kiểm. Vắng = một lệnh fillText như trước. */
  rich?: RichText;
}
/** Hình học thuần, đơn vị pt trong toạ độ widget. */
export type Primitive = RectPrim | TextPrim;

export interface LayoutCtx {
  ast: UnifiedProjectAST; derived: Derived; tracks: TrackIndex[]; measure: Measure;
  /** Bộ kiểu chữ của scene (REQ-GRAPHICS-18); vắng = DEFAULT_TEXT_STYLES. */
  textStyles?: TextStyleSet;
}

export interface WidgetRenderer<P = unknown> {
  type: WidgetType;
  /** Thuần: cùng (ctx, spec, t) → cùng danh sách. Toạ độ pt, gốc ở góc trên trái widget. */
  layout(ctx: LayoutCtx, spec: WidgetSpec<P>, t: number): Primitive[];
}
