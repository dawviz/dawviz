// Các dòng của Timeline (DESIGN.md "Timeline"): một dòng có thể gắn nhiều đường dẫn hoạt hình (Vị trí = layout.x + layout.y, như After Effects),
// keyframe cùng thời điểm của các đường dẫn đó hiện thành MỘT hình thoi. Nhóm "Biến đổi": Vị trí, Tỉ lệ, Xoay, Độ đục; Rộng/Cao chỉ hiện
// khi đã animate (preset cũ). Nhóm "Thuộc tính widget": mỗi thuộc tính số/màu một dòng. Không DOM; test ở timelineRows.test.ts.
import type { Animation, WidgetType } from '@dawviz/render-core';
import { animFields, type AnimField } from './animateFields.ts';
import { SAME_TIME, keyRef } from './timeline.ts';

export type GroupId = 'transform' | 'props';
export interface RowDef {
  /** Khoá ổn định của dòng (vùng chọn `sel.row` lưu khoá này). Dòng một đường dẫn: chính đường dẫn đó. */
  id: string;
  group: GroupId;
  /** Khoá i18n của nhãn dòng (ngắn). */
  labelKey: string;
  paths: string[];
  fields: AnimField[];
}

const TRANSFORM: { id: string; labelKey: string; paths: string[]; legacy?: boolean }[] = [
  { id: 'position', labelKey: 'web.timeline.row.position', paths: ['layout.x', 'layout.y'] },
  { id: 'scale', labelKey: 'web.timeline.row.scale', paths: ['scale'] },
  { id: 'layout.rotation', labelKey: 'web.timeline.row.rotation', paths: ['layout.rotation'] },
  { id: 'opacity', labelKey: 'web.timeline.row.opacity', paths: ['opacity'] },
  { id: 'layout.width', labelKey: 'web.timeline.row.width', paths: ['layout.width'], legacy: true },
  { id: 'layout.height', labelKey: 'web.timeline.row.height', paths: ['layout.height'], legacy: true },
];
const IN_TRANSFORM = new Set(TRANSFORM.flatMap((r) => r.paths));

/** Dòng của một loại widget theo thứ tự hiện; `animate` để quyết định có hiện dòng Rộng/Cao (chỉ khi đã animate). */
export function timelineRows(type: WidgetType, animate: Readonly<Record<string, Animation>> = {}): RowDef[] {
  const fields = animFields(type), by = new Map(fields.map((f) => [f.path, f]));
  const out: RowDef[] = [];
  for (const r of TRANSFORM) {
    if (!r.paths.every((p) => by.has(p))) continue;
    if (r.legacy && !r.paths.some((p) => animate[p])) continue;
    out.push({ id: r.id, group: 'transform', labelKey: r.labelKey, paths: r.paths, fields: r.paths.map((p) => by.get(p)!) });
  }
  for (const f of fields) if (!IN_TRANSFORM.has(f.path)) out.push({ id: f.path, group: 'props', labelKey: f.labelKey, paths: [f.path], fields: [f] });
  return out;
}
/** Dòng chứa đường dẫn `path` (vd. layout.y → dòng Vị trí). */
export const rowOfPath = (rows: readonly RowDef[], path: string): RowDef | undefined => rows.find((r) => r.paths.includes(path));

export interface VKey {
  /** Thời điểm (giây) của hình thoi. */
  t: number;
  /** Keyframe thật gộp vào hình thoi này (`đường dẫn#chỉ số`). */
  refs: string[];
}
/** Gộp keyframe của các đường dẫn trong một dòng thành hình thoi: keyframe cách nhau ≤ SAME_TIME là một hình thoi. */
export function rowKeys(row: RowDef, times: ReadonlyMap<string, readonly number[]>): VKey[] {
  const all: { t: number; ref: string }[] = [];
  for (const p of row.paths) (times.get(p) ?? []).forEach((t, i) => { if (Number.isFinite(t)) all.push({ t, ref: keyRef(p, i) }); });
  all.sort((a, b) => a.t - b.t);
  const out: VKey[] = [];
  for (const k of all) {
    const last = out[out.length - 1];
    if (last && k.t - last.t <= SAME_TIME && !last.refs.some((r) => r.split('#')[0] === k.ref.split('#')[0])) last.refs.push(k.ref);
    else out.push({ t: k.t, refs: [k.ref] });
  }
  return out;
}

/** Số hình thoi người dùng thấy trong tập keyframe đang chọn (x+y cùng thời điểm của dòng Vị trí chỉ tính một). */
export function visibleKeyCount(rows: readonly RowDef[], picked: readonly { path: string; t: number }[]): number {
  let n = 0;
  for (const row of rows) {
    const times = new Map<string, number[]>();
    for (const p of picked) if (row.paths.includes(p.path)) (times.get(p.path) ?? times.set(p.path, []).get(p.path)!).push(p.t);
    for (const ts of times.values()) ts.sort((a, b) => a - b);
    if (times.size) n += rowKeys(row, times).length;
  }
  return n;
}
