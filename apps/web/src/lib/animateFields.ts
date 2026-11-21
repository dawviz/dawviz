// Logic thuần của mục "Hoạt hình" (T-22): danh sách thuộc tính animate được của một widget (nhãn, giới hạn, giá trị tĩnh hiện tại),
// tạo hoạt hình mới và sửa từng keyframe. Không DOM; test ở animateFields.test.ts.
import { BIND_SOURCES, animatablePaths, isBinding, type Animation, type Binding, type BindSource, type Key, type KeyAnimation, type WidgetSpec, type WidgetType } from '@dawviz/render-core';
import { WIDGET_FIELDS } from './widgetFields.ts';

export type PathKind = 'number' | 'color';
export interface AnimField { path: string; kind: PathKind; /** Khoá con của `web.ws.*` (thuộc tính widget) hoặc `web.anim.prop.*` (bố cục, độ đục). */ labelKey: string; min: number; max: number; step: number; range?: [number, number] }
const LAYOUT: Record<string, Omit<AnimField, 'path' | 'kind'>> = {
  'layout.x': { labelKey: 'web.anim.prop.x', min: -4096, max: 8192, step: 1, range: [-1000, 3000] },
  'layout.y': { labelKey: 'web.anim.prop.y', min: -4096, max: 8192, step: 1, range: [-1000, 3000] },
  'layout.width': { labelKey: 'web.anim.prop.width', min: 1, max: 16384, step: 1, range: [1, 3000] },
  'layout.height': { labelKey: 'web.anim.prop.height', min: 1, max: 16384, step: 1, range: [1, 3000] },
  'layout.rotation': { labelKey: 'web.anim.prop.rotation', min: -360, max: 360, step: 1, range: [-180, 180] },
  opacity: { labelKey: 'web.anim.prop.opacity', min: 0, max: 1, step: 0.05 },
};
/** Thuộc tính animate được của loại widget, theo thứ tự: bố cục, độ đục, rồi thuộc tính của widget (nhãn lấy từ bảng Thiết lập nếu có). */
export function animFields(type: WidgetType): AnimField[] {
  const fields = WIDGET_FIELDS[type] ?? [];
  return [...animatablePaths(type)].map(([path, kind]) => {
    if (LAYOUT[path]) return { path, kind, ...LAYOUT[path] };
    const f = fields.find((x) => x.path.join('.') === path);
    return { path, kind, labelKey: f ? `web.ws.${f.label}` : '', min: f?.num?.min ?? -100000, max: f?.num?.max ?? 100000, step: f?.num?.step ?? 1, range: f?.num?.range };
  });
}
const getIn = (o: unknown, path: readonly string[]): unknown => { let v = o; for (const k of path) { if (typeof v !== 'object' || v === null) return undefined; v = (v as Record<string, unknown>)[k]; } return v; };
/** Giá trị tĩnh hiện tại của thuộc tính (điểm xuất phát của hoạt hình mới). */
export function staticValue(w: Pick<WidgetSpec, 'layout' | 'properties'>, path: string): number | string {
  if (path === 'opacity') return 1;
  const v = path.startsWith('layout.') ? getIn(w.layout, [path.slice(7)]) : getIn(w.properties, path.split('.'));
  return typeof v === 'number' || typeof v === 'string' ? v : 0;
}
const r3 = (x: number) => Math.round(x * 1000) / 1000;
/** Hoạt hình mới: một keyframe tại `t` giữ đúng giá trị hiện tại (chưa đổi hình gì); người dùng thêm keyframe sau. */
export const newKeyAnimation = (w: Pick<WidgetSpec, 'layout' | 'properties'>, path: string, t: number): KeyAnimation => ({ keys: [{ at: { sec: r3(Math.max(0, t)) }, value: staticValue(w, path) }] });

export const SOURCE_RANGE: Record<BindSource, [number, number]> = {
  'beat.phase': [0, 1], 'bar.phase': [0, 1], progress: [0, 1], 'notes.count': [0, 8], 'notes.velocity': [0, 127], 'note.hit': [0, 1], 'track.volume': [0, 1], 'track.pan': [0, 1], 'audio.level': [0, 1],
};
/** Binding mới: nguồn đi từ đầu tới cuối thang của nó; thuộc tính chạy từ giá trị hiện tại tới một giá trị khác (số: +20% miền; màu: trắng). */
export function newBinding(w: Pick<WidgetSpec, 'layout' | 'properties'>, f: AnimField, source: BindSource = 'note.hit'): Binding {
  const cur = staticValue(w, f.path), from = SOURCE_RANGE[source];
  if (f.kind === 'color') return { bind: source, from: [...from], to: [String(cur), '#ffffff'] };
  const a = Number(cur), b = Math.min(f.max, a + (f.max - f.min) * 0.2) === a ? Math.max(f.min, a - (f.max - f.min) * 0.2) : Math.min(f.max, a + (f.max - f.min) * 0.2);
  return { bind: source, from: [...from], to: [a, r3(b)] };
}
/** Đổi nguồn của binding: thang `from` theo nguồn mới. */
export const withSource = (b: Binding, source: BindSource): Binding => ({ ...b, bind: source, from: [...SOURCE_RANGE[source]] });

// ── keyframe ──
export const sortKeys = (keys: Key[]): Key[] => keys.map((k, i) => ({ k, i })).sort((a, b) => ((a.k.at as { sec?: number }).sec ?? 1e9) - ((b.k.at as { sec?: number }).sec ?? 1e9) || a.i - b.i).map((x) => x.k);
/** Thêm keyframe tại `t` (giây). Giá trị: nếu đã có keyframe trước đó lấy giá trị của nó, không thì giá trị tĩnh. Trùng mốc → thay giá trị keyframe đó. */
export function addKey(a: KeyAnimation, t: number, value: number | string): KeyAnimation {
  const sec = r3(Math.max(0, t)), i = a.keys.findIndex((k) => 'sec' in k.at && Math.abs(k.at.sec - sec) < 0.001);
  if (i >= 0) return { ...a, keys: a.keys.map((k, j) => (j === i ? { ...k, value } : k)) };
  return { ...a, keys: sortKeys([...a.keys, { at: { sec }, value }]) };
}
export const setKey = (a: KeyAnimation, i: number, patch: Partial<Key>): KeyAnimation => ({ ...a, keys: sortKeys(a.keys.map((k, j) => (j === i ? { ...k, ...patch } : k))) });
/** Bỏ keyframe thứ i; hết keyframe thì trả null (bỏ cả hoạt hình). */
export function removeKey(a: KeyAnimation, i: number): KeyAnimation | null { const keys = a.keys.filter((_, j) => j !== i); return keys.length ? { ...a, keys } : null; }
/** Mô tả mốc của keyframe không phải giây (chỉ đọc trong giao diện). */
export function keyTimeText(at: Key['at']): string { return 'sec' in at ? '' : 'tick' in at ? `tick ${at.tick}` : 'bar' in at ? `bar ${at.bar}.${at.beat ?? 1}` : `beat ${at.beat}`; }
export const isKeyAnimation = (a: Animation): a is KeyAnimation => !isBinding(a);
export const SOURCES = BIND_SOURCES;
