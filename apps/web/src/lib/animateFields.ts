// Logic thuần của mục "Hoạt hình" (T-22): danh sách thuộc tính animate được của một widget (nhãn, giới hạn, giá trị tĩnh hiện tại),
// tạo hoạt hình mới và sửa từng keyframe. Không DOM; test ở animateFields.test.ts.
import type { I18n } from '@dawviz/i18n';
import { BIND_SOURCES, bindLaneId, laneBindSource, animatablePaths, isBinding, isKeyAnim, type AnimKind, type Animation, type Binding, type BindSource, type Key, type KeyAnimation, type KeyValue, type WidgetSpec, type WidgetType } from '@dawviz/render-core';
import { WIDGET_FIELDS } from './widgetFields.ts';

/** `bool`/`choice` animate theo bậc (giữ rồi đổi tại keyframe). */
export type PathKind = AnimKind;
export interface AnimField { path: string; kind: PathKind; /** Khoá con của `web.ws.*` (thuộc tính widget) hoặc `web.anim.prop.*` (bố cục, độ đục). */ labelKey: string; min: number; max: number; step: number; range?: [number, number];
  /** Lựa chọn (kiểu `choice`) và tiền tố khoá nhãn của từng giá trị, lấy từ bảng Thiết lập nếu có. */ options?: readonly (string | number)[]; optionPrefix?: string }
const LAYOUT: Record<string, Omit<AnimField, 'path' | 'kind'>> = {
  'layout.x': { labelKey: 'web.anim.prop.x', min: -4096, max: 8192, step: 1, range: [-1000, 3000] },
  'layout.y': { labelKey: 'web.anim.prop.y', min: -4096, max: 8192, step: 1, range: [-1000, 3000] },
  'layout.width': { labelKey: 'web.anim.prop.width', min: 1, max: 16384, step: 1, range: [1, 3000] },
  'layout.height': { labelKey: 'web.anim.prop.height', min: 1, max: 16384, step: 1, range: [1, 3000] },
  'layout.rotation': { labelKey: 'web.anim.prop.rotation', min: -360, max: 360, step: 1, range: [-180, 180] },
  opacity: { labelKey: 'web.anim.prop.opacity', min: 0, max: 1, step: 0.05 },
  scale: { labelKey: 'web.anim.prop.scale', min: 0, max: 2000, step: 1, range: [0, 400] },
};
/** Piano Roll không có bảng Thiết lập chung (WIDGET_FIELDS): nhãn `web.anim.pr.<đường dẫn>` và giới hạn của các đường dẫn số (PIANO_PATHS). */
const PIANO_NUM: Record<string, { min: number; max: number; step: number }> = {
  'visibleSeconds': { min: 0.5, max: 60, step: 0.1 },
  'playheadPositionRatio': { min: 0.05, max: 0.95, step: 0.01 },
  'playheadWidth': { min: 0, max: 40, step: 0.5 },
  'keyboard.width': { min: 8, max: 400, step: 1 },
  'flowAngle': { min: 0, max: 360, step: 1 },
  'playheadLength': { min: 0.05, max: 1, step: 0.05 },
  'playheadGlow': { min: 0, max: 1, step: 0.05 },
  'grid.opacity': { min: 0, max: 1, step: 0.05 },
  'keyboard.scaleOpacity': { min: 0, max: 1, step: 0.05 },
  'keyboard.blackLength': { min: 0.3, max: 0.9, step: 0.02 },
  'keyboard.pressDepth': { min: 0, max: 1, step: 0.05 },
  'noteStyle.base.opacity': { min: 0, max: 1, step: 0.05 },
  'noteStyle.base.inactiveOpacity': { min: 0, max: 1, step: 0.05 },
  'noteStyle.base.cornerRadius': { min: 0, max: 999, step: 1 },
  'noteStyle.base.heightScale': { min: 0.1, max: 1.5, step: 0.05 },
  'noteStyle.base.glow': { min: 0, max: 1, step: 0.05 },
  'noteStyle.base.glowRadius': { min: 0, max: 64, step: 1 },
  'noteStyle.base.borderWidth': { min: 0, max: 8, step: 0.5 },
  'noteStyle.base.glowMin': { min: 0, max: 1, step: 0.05 },
  'noteStyle.base.glowMax': { min: 0, max: 1, step: 0.05 },
  'noteStyle.base.glowRelease': { min: 0, max: 4, step: 0.05 },
};
const PIANO_CHOICES: Record<string, readonly string[]> = { 'noteStyle.base.colorMode': ['track', 'custom', 'pitch', 'velocity'] };
/** Thuộc tính animate được của loại widget, theo thứ tự: bố cục, độ đục, rồi thuộc tính của widget (nhãn lấy từ bảng Thiết lập nếu có). */
export function animFields(type: WidgetType): AnimField[] {
  const fields = WIDGET_FIELDS[type] ?? [];
  // Bật/tắt và lựa chọn chỉ hiện khi bảng Thiết lập có ô tương ứng (có nhãn): mã kiểu chữ nội bộ, căn lề phụ… không làm rối Timeline. Preset vẫn đọc được mọi đường dẫn.
  const shown = (path: string, kind: PathKind) => type === 'PIANO_ROLL' || (kind !== 'bool' && kind !== 'choice') || fields.some((x) => x.path.join('.') === path);
  return [...animatablePaths(type)].filter(([path, kind]) => shown(path, kind)).map(([path, kind]) => {
    if (LAYOUT[path]) return { path, kind, ...LAYOUT[path] };
    if (type === 'PIANO_ROLL') return { path, kind, labelKey: `web.anim.pr.${path}`, ...(PIANO_NUM[path] ?? { min: 0, max: 1, step: 1 }), ...(PIANO_CHOICES[path] ? { options: PIANO_CHOICES[path], optionPrefix: 'web.style.mode.' } : {}) };
    const f = fields.find((x) => x.path.join('.') === path);
    return { path, kind, labelKey: f ? `web.ws.${f.label}` : '', min: f?.num?.min ?? -100000, max: f?.num?.max ?? 100000, step: f?.num?.step ?? 1, range: f?.num?.range,
      ...(kind === 'choice' && f?.options ? { options: f.options, optionPrefix: f.prefix } : {}) };
  });
}
const getIn = (o: unknown, path: readonly string[]): unknown => { let v = o; for (const k of path) { if (typeof v !== 'object' || v === null) return undefined; v = (v as Record<string, unknown>)[k]; } return v; };
/** Giá trị tĩnh hiện tại của thuộc tính (điểm xuất phát của hoạt hình mới). */
export function staticValue(w: Pick<WidgetSpec, 'layout' | 'properties'>, path: string): KeyValue {
  if (path === 'opacity') return 1;
  if (path === 'scale') return 100; // % (100 = nguyên cỡ)
  const v = path.startsWith('layout.') ? getIn(w.layout, [path.slice(7)]) : getIn(w.properties, path.split('.'));
  if (v === '' && path === 'auraColor') return String(getIn(w.properties, ['activeColor']) ?? '#ffb347'); // '' = theo màu từng nét: keyframe cần một màu cụ thể để đi từ đó
  return typeof v === 'number' || typeof v === 'string' || typeof v === 'boolean' ? v : 0;
}
const r3 = (x: number) => Math.round(x * 1000) / 1000;
/** Hoạt hình mới: một keyframe tại `t` giữ đúng giá trị hiện tại (chưa đổi hình gì); người dùng thêm keyframe sau. */
export const newKeyAnimation = (w: Pick<WidgetSpec, 'layout' | 'properties'>, path: string, t: number): KeyAnimation => {
  const value = staticValue(w, path);
  const discrete = typeof value === 'boolean' || (typeof value === 'string' && !/^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value));
  return { keys: [{ at: { sec: r3(Math.max(0, t)) }, value }], ...(discrete ? { kind: 'discrete' as const } : {}) };
};

export const SOURCE_RANGE: Record<typeof BIND_SOURCES[number], [number, number]> = {
  'beat.phase': [0, 1], 'bar.phase': [0, 1], progress: [0, 1], 'notes.count': [0, 8], 'notes.velocity': [0, 127], 'note.hit': [0, 1], 'track.volume': [0, 1], 'track.pan': [0, 1], 'audio.level': [0, 1],
};
/** Binding mới: nguồn đi từ đầu tới cuối thang của nó; thuộc tính chạy từ giá trị hiện tại tới một giá trị khác (số: +20% miền; màu: trắng). */
export function newBinding(w: Pick<WidgetSpec, 'layout' | 'properties'>, f: AnimField, source: BindSource = 'note.hit'): Binding {
  const cur = staticValue(w, f.path), from = sourceRange(source);
  if (f.kind === 'color') return { bind: source, from: [...from], to: [String(cur), '#ffffff'] };
  const a = Number(cur), b = Math.min(f.max, a + (f.max - f.min) * 0.2) === a ? Math.max(f.min, a - (f.max - f.min) * 0.2) : Math.min(f.max, a + (f.max - f.min) * 0.2);
  return { bind: source, from: [...from], to: [a, r3(b)] };
}
/** Đổi nguồn của binding: thang `from` theo nguồn mới. */
export const withSource = (b: Binding, source: BindSource): Binding => ({ ...b, bind: source, from: [...sourceRange(source)] });
/** Thang của một nguồn: lane automation theo id (`track.automation.<id>`) luôn 0..1. */
export const sourceRange = (s: BindSource): readonly [number, number] => SOURCE_RANGE[s as typeof BIND_SOURCES[number]] ?? [0, 1];

// ── lane automation của dự án (T-66): danh sách chọn theo tên ──
export interface LaneChoice { id: string; name: string }
type LaneTrack = { automation?: Record<string, { name?: string; points: unknown[] } | undefined> };
const laneRank = (id: string) => (id === 'volume' ? 0 : id === 'pan' ? 1 : id === 'mute' ? 2 : /^cc\d+$/.test(id) ? 3 + Number(id.slice(2)) / 1000 : id === 'pitchBend' ? 4 : 5);
/** Lane có điểm trong các track (không trùng id; tên lấy từ track đầu tiên có lane đó), xếp: âm lượng, pan, mute, CC theo số, pitch bend, còn lại theo tên. */
export function projectLanes(tracks: readonly LaneTrack[]): LaneChoice[] {
  const out = new Map<string, LaneChoice>();
  for (const tr of tracks) for (const [id, l] of Object.entries(tr.automation ?? {})) if (l?.points.length && !out.has(id)) out.set(id, { id, name: l.name ?? id });
  return [...out.values()].sort((a, b) => laneRank(a.id) - laneRank(b.id) || a.name.localeCompare(b.name));
}
/** Tên lane cho người dùng: lane có sẵn của ứng dụng (âm lượng, pan, mute) theo bản dịch; lane khác theo tên trong dự án ("Mod Wheel (CC1)"). */
export const laneLabel = (i18n: Pick<I18n, 'has' | 't'>, id: string, lanes: readonly LaneChoice[] = []): string =>
  (i18n.has(`web.glow.lane.${id}`) ? i18n.t(`web.glow.lane.${id}`) : lanes.find((l) => l.id === id)?.name ?? id);
/** Nguồn binding chọn được: 9 nguồn cố định + mỗi lane của dự án (trừ âm lượng/pan đã có nguồn riêng) + nguồn đang dùng nếu dự án không có. */
export function bindSourcesFor(lanes: readonly LaneChoice[], current?: BindSource): BindSource[] {
  const out: BindSource[] = [...BIND_SOURCES, ...lanes.filter((l) => l.id !== 'volume' && l.id !== 'pan').map((l) => laneBindSource(l.id))];
  if (current && !out.includes(current)) out.push(current);
  return out;
}
/** Nhãn của nguồn binding: nguồn cố định theo bản dịch; lane theo tên lane ("Lane: Mod Wheel (CC1)"). */
export function sourceLabel(i18n: Pick<I18n, 'has' | 't'>, s: BindSource, lanes: readonly LaneChoice[] = []): string {
  const id = bindLaneId(s);
  if (id === null) return i18n.t(`web.anim.src.${s}`);
  const known = lanes.some((l) => l.id === id);
  return i18n.t(known ? 'web.anim.src.lane' : 'web.anim.src.laneAbsent', { name: laneLabel(i18n, id, lanes) });
}

// ── keyframe ──
export const sortKeys = (keys: Key[]): Key[] => keys.map((k, i) => ({ k, i })).sort((a, b) => ((a.k.at as { sec?: number }).sec ?? 1e9) - ((b.k.at as { sec?: number }).sec ?? 1e9) || a.i - b.i).map((x) => x.k);
/** Thêm keyframe tại `t` (giây). Giá trị: nếu đã có keyframe trước đó lấy giá trị của nó, không thì giá trị tĩnh. Trùng mốc → thay giá trị keyframe đó. */
export function addKey(a: KeyAnimation, t: number, value: KeyValue): KeyAnimation {
  const sec = r3(Math.max(0, t)), i = a.keys.findIndex((k) => 'sec' in k.at && Math.abs(k.at.sec - sec) < 0.001);
  if (i >= 0) return { ...a, keys: a.keys.map((k, j) => (j === i ? { ...k, value } : k)) };
  return { ...a, keys: sortKeys([...a.keys, { at: { sec }, value }]) };
}
export const setKey = (a: KeyAnimation, i: number, patch: Partial<Key>): KeyAnimation => ({ ...a, keys: sortKeys(a.keys.map((k, j) => (j === i ? { ...k, ...patch } : k))) });
/** Bỏ keyframe thứ i; hết keyframe thì trả null (bỏ cả hoạt hình). */
export function removeKey(a: KeyAnimation, i: number): KeyAnimation | null { const keys = a.keys.filter((_, j) => j !== i); return keys.length ? { ...a, keys } : null; }
/** Mô tả mốc của keyframe không phải giây (chỉ đọc trong giao diện). */
export function keyTimeText(at: Key['at']): string { return 'sec' in at ? '' : 'tick' in at ? `tick ${at.tick}` : 'bar' in at ? `bar ${at.bar}.${at.beat ?? 1}` : `beat ${at.beat}`; }
export const isKeyAnimation = (a: Animation): a is KeyAnimation => isKeyAnim(a);
export const SOURCES = BIND_SOURCES;
