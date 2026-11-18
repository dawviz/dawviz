// Đổi tên lớp (widget) trong danh sách Lớp: chuẩn hoá, kiểm độ dài và trùng tên. Hàm thuần.
import { MAX_WIDGET_NAME, normalizeWidgetName, widgetNameKey } from '@dawviz/render-core';

export type LayerNameCheck =
  | { ok: true; value: string | null }                 // value null = xoá tên riêng, quay về tên theo loại
  | { ok: false; reason: 'tooLong' | 'duplicate'; name: string };

/**
 * Kiểm tên mới cho lớp `id`. `display(id)` là tên đang hiển thị của một lớp (tên riêng hoặc tên theo loại).
 * Trống → xoá tên riêng. Trùng với lớp khác (không phân biệt hoa/thường) → không nhận; chỗ gọi giữ tên cũ và báo lý do.
 */
export function checkLayerName(raw: string, id: string, ids: readonly string[], display: (id: string) => string): LayerNameCheck {
  const name = normalizeWidgetName(raw);
  if (!name) return { ok: true, value: null };
  if (name.length > MAX_WIDGET_NAME) return { ok: false, reason: 'tooLong', name };
  const key = widgetNameKey(name);
  if (ids.some((o) => o !== id && widgetNameKey(display(o)) === key)) return { ok: false, reason: 'duplicate', name };
  return { ok: true, value: name };
}
