// So sánh hai hoạt hình để nhãn lịch sử nói đúng điều đã đổi (D-64): thêm/xoá/dời keyframe, đổi giá trị, đường cong, cách đi tiếp, lặp,
// bật/tắt hoặc đổi cách thay đổi (keyframe ↔ theo nhạc). Thuần, không i18n; nhãn dựng ở historyLabels.ts. Test: animDiff.test.ts.
import { isBinding, isExpr, isKeyAnim, type Animation, type Key, type KeyAnimation, type KeyValue } from '@dawviz/render-core';

export type AnimChange =
  | { kind: 'start' | 'stop' | 'toKeys' | 'toBind' | 'toExpr' | 'bind' | 'expr' | 'loop'; path: string }
  | { kind: 'add' | 'remove'; path: string; at: Key['at']; value: KeyValue }
  | { kind: 'move'; path: string; at: Key['at']; to: Key['at'] }
  | { kind: 'value'; path: string; at: Key['at']; from: KeyValue; to: KeyValue }
  | { kind: 'curve' | 'interp'; path: string; at: Key['at'] };

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const keyOf = (k: Key) => JSON.stringify(k.at);

function diffKeys(path: string, a: KeyAnimation, b: KeyAnimation, out: AnimChange[]): void {
  const am = new Map(a.keys.map((k) => [keyOf(k), k])), bm = new Map(b.keys.map((k) => [keyOf(k), k]));
  const added = b.keys.filter((k) => !am.has(keyOf(k))), removed = a.keys.filter((k) => !bm.has(keyOf(k)));
  // một keyframe biến mất và một xuất hiện với cùng giá trị/đường cong = đã dời
  if (added.length === 1 && removed.length === 1 && same(added[0].value, removed[0].value) && same(added[0].ease, removed[0].ease) && same(added[0].interp, removed[0].interp)) {
    out.push({ kind: 'move', path, at: removed[0].at, to: added[0].at });
  } else {
    for (const k of removed) out.push({ kind: 'remove', path, at: k.at, value: k.value });
    for (const k of added) out.push({ kind: 'add', path, at: k.at, value: k.value });
  }
  for (const [id, k] of bm) {
    const o = am.get(id); if (!o) continue;
    if (!same(o.value, k.value)) out.push({ kind: 'value', path, at: k.at, from: o.value, to: k.value });
    if (!same(o.ease, k.ease)) out.push({ kind: 'curve', path, at: k.at });
    if (!same(o.interp, k.interp)) out.push({ kind: 'interp', path, at: k.at });
  }
  if ((a.loop ?? 'NONE') !== (b.loop ?? 'NONE')) out.push({ kind: 'loop', path });
}

/** Mọi thay đổi giữa hai bảng `animate` (đường dẫn → hoạt hình), theo thứ tự đường dẫn. */
export function diffAnimate(before: Record<string, Animation> | undefined, after: Record<string, Animation> | undefined): AnimChange[] {
  const a = before ?? {}, b = after ?? {}, out: AnimChange[] = [];
  for (const path of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) {
    const x = a[path], y = b[path];
    if (!x && y) out.push({ kind: 'start', path });
    else if (x && !y) out.push({ kind: 'stop', path });
    else if (x && y) {
      const mode = (a: Animation) => (isBinding(a) ? 'bind' : isExpr(a) ? 'expr' : 'keys');
      if (mode(x) !== mode(y)) out.push({ kind: mode(y) === 'bind' ? 'toBind' : mode(y) === 'expr' ? 'toExpr' : 'toKeys', path });
      else if (mode(x) === 'bind') { if (!same(x, y)) out.push({ kind: 'bind', path }); }
      else if (mode(x) === 'expr') { if (!same(x, y)) out.push({ kind: 'expr', path }); }
      else diffKeys(path, x as KeyAnimation, y as KeyAnimation, out);
    }
  }
  return out;
}
