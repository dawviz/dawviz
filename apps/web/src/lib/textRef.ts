// Ghi đè kiểu chữ của một chỗ chữ trong widget (T-72, REQ-GRAPHICS-18): đọc/đặt/bỏ theo đường dẫn `size`, `stroke.width`…
// Hàm thuần cho mục "Chữ" của bảng Thuộc tính. Một thuộc tính có mặt trong TextRef = đang ghi đè; bỏ đi = theo kiểu (↺).
import { TEXT_FIELDS, TEXT_SPAN_OF, applyOverride, resolveTextStyle, type TextRef, type TextStyle, type TextStyleSet, type WidgetType } from '@dawviz/render-core';

export type TextPath = string; // 'size' | 'stroke.width' | 'gradient' …

type Obj = Record<string, unknown>;
const split = (p: TextPath) => p.split('.') as [string] | [string, string];

/** Giá trị đang ghi đè ở `path` (undefined = theo kiểu). */
export function getOverride(ref: TextRef | undefined, path: TextPath): unknown {
  const [a, b] = split(path); const v = (ref as Obj | undefined)?.[a];
  return b === undefined ? v : (v as Obj | undefined)?.[b];
}
export const isOverridden = (ref: TextRef | undefined, path: TextPath) => getOverride(ref, path) !== undefined;
/** Đặt ghi đè; đối tượng con (stroke/shadow/background) chỉ giữ trường đã đặt. */
export function setOverride(ref: TextRef | undefined, path: TextPath, value: unknown): TextRef {
  const [a, b] = split(path), out: Obj = { ...(ref ?? {}) };
  if (b === undefined) out[a] = value;
  else out[a] = { ...((out[a] as Obj | undefined) ?? {}), [b]: value };
  return out as TextRef;
}
/** Bỏ ghi đè (↺); đối tượng con rỗng thì bỏ luôn. */
export function clearOverride(ref: TextRef | undefined, path: TextPath): TextRef {
  const [a, b] = split(path), out: Obj = { ...(ref ?? {}) };
  if (b === undefined) delete out[a];
  else if (out[a]) { const sub = { ...(out[a] as Obj) }; delete sub[b]; if (Object.keys(sub).length) out[a] = sub; else delete out[a]; }
  return out as TextRef;
}
/** Giá trị thật ở `path` của một kiểu đã gộp. */
export function valueAt(st: TextStyle, path: TextPath): unknown {
  const [a, b] = split(path); const v = (st as unknown as Obj)[a];
  return b === undefined ? v : (v as Obj)[b];
}

export interface TextSlot {
  /** Tên trường trong `properties` của widget. */
  field: string;
  /** Trường của dòng chứa đoạn này (chỉ có ở ghi đè một đoạn: con số trong mẫu, phần bass…). */
  parent?: string;
  /** Kiểu mặc định của chỗ chữ (dòng); đoạn thì theo dòng cha. */
  fallbackId: string;
}
/** Các chỗ chữ của một loại widget, theo thứ tự hiển thị. */
export function textSlots(type: WidgetType): TextSlot[] {
  const fields = (TEXT_FIELDS as Record<string, Record<string, string | null>>)[type];
  if (!fields) return [];
  const spans = (TEXT_SPAN_OF as Record<string, Record<string, string>>)[type] ?? {};
  return Object.entries(fields).map(([field, id]) => (id ? { field, fallbackId: id } : { field, parent: spans[field], fallbackId: fields[spans[field]] ?? 'body' }));
}
/**
 * Kiểu tham chiếu của chỗ chữ (đích của ↺) và kiểu thật đang vẽ. Dòng: tham chiếu = kiểu `styleId` (hoặc mặc định) không ghi đè.
 * Đoạn: tham chiếu = kiểu thật của dòng cha (đoạn không ghi đè thì giống hệt dòng).
 */
export function slotStyles(props: Obj, slot: TextSlot, set: TextStyleSet): { base: TextStyle; resolved: TextStyle; ref: TextRef } {
  const ref = (props[slot.field] ?? {}) as TextRef;
  if (slot.parent) {
    const base = resolveTextStyle(props[slot.parent] as TextRef | undefined, set, slot.fallbackId);
    return { base, resolved: applyOverride(base, ref), ref };
  }
  const base = resolveTextStyle(ref.styleId ? { styleId: ref.styleId } : undefined, set, slot.fallbackId);
  return { base, resolved: resolveTextStyle(ref, set, slot.fallbackId), ref };
}
/** Số thuộc tính đang ghi đè (không tính `styleId`). */
export const overrideCount = (ref: TextRef | undefined) => Object.keys(ref ?? {}).filter((k) => k !== 'styleId').length;

/** Id kiểu mới từ tên (chữ Latin, số, gạch), không trùng id có sẵn. */
export function newStyleId(styles: TextStyleSet, name: string): string {
  const base = (name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().replace(/^[^a-z]+/, '') || 'style').slice(0, 24);
  let id = base, i = 2;
  while (styles[id]) id = `${base}-${i++}`;
  return id;
}
