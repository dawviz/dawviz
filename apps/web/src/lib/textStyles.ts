// Kiểu chữ dùng chung (T-126, D-73, WIDGET-REVAMP §3): đếm chỗ dùng, đổi tên, xoá kiểu, và "Thư viện của tôi" (kiểu mang giữa các dự án,
// lưu localStorage). Hàm thuần trên SceneDocument / mảng thư viện; lệnh có hoàn tác ở lib/commands.ts, giao diện ở components/TextPanel.tsx.
import { BASE_TEXT_STYLE, DEFAULT_TEXT_STYLES, TEXT_FIELDS, applyOverride, cloneStyle, type SceneDocument, type TextRef, type TextStyle, type TextStyleSet, type WidgetSpec } from '@dawviz/render-core';
import { newStyleId } from './textRef.ts';
import { loadPref, savePref } from './prefs.ts';

/** Trần số kiểu chữ của một dự án (render-core bỏ kiểu thứ 65 trở đi khi đọc preset). */
export const MAX_TEXT_STYLES = 64;
/** Trần số kiểu trong Thư viện của tôi. */
export const MAX_LIBRARY = 64;
/** Độ dài tên kiểu tối đa (như render-core khi đọc preset). */
export const MAX_STYLE_NAME = 60;

/** Kiểu dựng sẵn (không xoá được; đổi tên được). */
export const isBuiltinStyle = (id: string) => Object.prototype.hasOwnProperty.call(DEFAULT_TEXT_STYLES, id);

type Obj = Record<string, unknown>;
const fieldsOf = (w: WidgetSpec) => (TEXT_FIELDS as Record<string, Record<string, string | null>>)[w.type];
/** Mọi danh sách widget của dự án: gốc và từng precomp. */
const widgetLists = (s: SceneDocument): readonly (readonly WidgetSpec[])[] => [s.widgets, ...Object.values(s.comps ?? {}).map((c) => c.widgets)];

/**
 * Số chỗ chữ dùng mỗi kiểu trong cả dự án (widget ở gốc và trong mọi precomp). Một dòng chữ dùng kiểu `styleId` của nó, hoặc kiểu gốc
 * của chỗ đó khi chưa chọn (cũng đổi theo khi kiểu đó được cập nhật); một đoạn chỉ tính khi có `styleId` riêng.
 */
export function styleUseCounts(scene: SceneDocument): Record<string, number> {
  const set = scene.textStyles ?? DEFAULT_TEXT_STYLES, out: Record<string, number> = {};
  for (const list of widgetLists(scene)) for (const w of list) {
    const fields = fieldsOf(w); if (!fields) continue;
    const P = (w.properties ?? {}) as Obj;
    for (const [f, fallback] of Object.entries(fields)) {
      const sid = (P[f] as TextRef | undefined)?.styleId;
      const id = sid && set[sid] ? sid : fallback;
      if (id) out[id] = (out[id] ?? 0) + 1;
    }
  }
  return out;
}

/** Đổi tên một kiểu. null = không có kiểu đó, tên rỗng hoặc không đổi. */
export function renameTextStyle(set: TextStyleSet, id: string, name: string): TextStyleSet | null {
  const cur = set[id], next = name.trim().slice(0, MAX_STYLE_NAME);
  if (!cur || !next || next === cur.name) return null;
  return { ...set, [id]: { ...cur, name: next } };
}

/**
 * Xoá kiểu người dùng tạo: bỏ khỏi `textStyles`; mọi chỗ chữ đang chọn kiểu đó (gốc và precomp) bỏ `styleId`, tức về kiểu gốc của chỗ đó,
 * vẫn giữ các ghi đè khác. null = kiểu dựng sẵn hoặc không có.
 */
export function deleteTextStyle(scene: SceneDocument, id: string): Pick<SceneDocument, 'textStyles' | 'widgets' | 'comps'> | null {
  const set = scene.textStyles;
  if (isBuiltinStyle(id) || !set?.[id]) return null;
  const { [id]: _gone, ...rest } = set;
  const fix = (list: readonly WidgetSpec[]): WidgetSpec[] => list.map((w) => {
    const fields = fieldsOf(w); if (!fields) return w;
    const P = (w.properties ?? {}) as Obj; let props: Obj | null = null;
    for (const f of Object.keys(fields)) {
      const ref = P[f] as TextRef | undefined;
      if (ref?.styleId !== id) continue;
      const { styleId: _s, ...r } = ref;
      (props ??= { ...P })[f] = r;
    }
    return props ? { ...w, properties: props } as WidgetSpec : w;
  });
  const comps = scene.comps ? Object.fromEntries(Object.entries(scene.comps).map(([k, c]) => [k, { ...c, widgets: fix(c.widgets) }])) : undefined;
  return { textStyles: rest, widgets: fix(scene.widgets), comps };
}

// ── Thư viện của tôi ──
export interface LibraryStyle { id: string; name: string; style: TextStyle }

/** Kiểu đọc từ localStorage: chỉ nhận trường có trong TextStyle và đúng loại giá trị; thiếu thì theo kiểu nền. */
function cleanStyle(raw: unknown): TextStyle {
  const base = BASE_TEXT_STYLE as unknown as Obj, o: Obj = {};
  if (raw && typeof raw === 'object') for (const [k, v] of Object.entries(raw as Obj)) {
    if (k === 'name' || !(k in base)) continue;
    const b = base[k];
    if (k === 'gradient') { if (v === null || (v && typeof v === 'object' && Array.isArray((v as Obj).stops) && ((v as Obj).stops as unknown[]).length >= 2)) o[k] = v; continue; }
    if (b && typeof b === 'object') {
      if (!v || typeof v !== 'object') continue;
      o[k] = Object.fromEntries(Object.entries(v as Obj).filter(([kk, vv]) => kk in (b as Obj) && typeof vv === typeof (b as Obj)[kk]));
    } else if (typeof v === typeof b && (typeof v !== 'number' || Number.isFinite(v))) o[k] = v;
  }
  return applyOverride(BASE_TEXT_STYLE, o as TextRef);
}
/** Thư viện hợp lệ từ dữ liệu bất kỳ (tệp hỏng, bản cũ): bỏ mục sai, id trùng, quá MAX_LIBRARY. */
export function sanitizeLibrary(raw: unknown): LibraryStyle[] {
  const out: LibraryStyle[] = [], ids = new Set<string>();
  if (!Array.isArray(raw)) return out;
  for (const it of raw) {
    if (out.length >= MAX_LIBRARY) break;
    if (!it || typeof it !== 'object') continue;
    const { id, name, style } = it as Obj;
    if (typeof id !== 'string' || !id || ids.has(id) || typeof name !== 'string' || !name.trim()) continue;
    ids.add(id); out.push({ id, name: name.trim().slice(0, MAX_STYLE_NAME), style: cleanStyle(style) });
  }
  return out;
}
/**
 * Lưu một kiểu vào thư viện. Đã có kiểu cùng tên thì thay nội dung (giữ id, giữ chỗ); chưa có thì thêm cuối.
 * null = tên rỗng hoặc thư viện đã đủ MAX_LIBRARY kiểu.
 */
export function addToLibrary(lib: readonly LibraryStyle[], name: string, style: TextStyle): LibraryStyle[] | null {
  const n = name.trim().slice(0, MAX_STYLE_NAME);
  if (!n) return null;
  const st = cloneStyle(style) as TextStyle & { name?: string }; delete st.name;
  const at = lib.findIndex((x) => x.name === n);
  if (at >= 0) return lib.map((x, i) => (i === at ? { ...x, style: st } : x));
  if (lib.length >= MAX_LIBRARY) return null;
  const taken = Object.fromEntries(lib.map((x) => [x.id, true])) as unknown as TextStyleSet;
  return [...lib, { id: newStyleId(taken, n), name: n, style: st }];
}
export const removeFromLibrary = (lib: readonly LibraryStyle[], id: string): LibraryStyle[] => lib.filter((x) => x.id !== id);

/**
 * Chép một kiểu từ thư viện vào bộ kiểu của dự án (preset tự đủ, không phụ thuộc máy này): id mới không trùng, tên giữ nguyên.
 * null = dự án đã đủ MAX_TEXT_STYLES kiểu.
 */
export function copyFromLibrary(set: TextStyleSet, item: LibraryStyle): { set: TextStyleSet; id: string } | null {
  if (Object.keys(set).length >= MAX_TEXT_STYLES) return null;
  const id = newStyleId(set, item.name);
  return { set: { ...set, [id]: { ...cloneStyle(item.style), name: item.name } }, id };
}

const LIB_PREF = 'textStyleLibrary';
export const loadLibrary = (): LibraryStyle[] => sanitizeLibrary(loadPref<{ items?: unknown }>(LIB_PREF, {}).items);
export const saveLibrary = (lib: readonly LibraryStyle[]): void => savePref(LIB_PREF, { items: lib });
