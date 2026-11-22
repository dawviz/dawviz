// Logic thuần của panel Timeline và keyframe (UI-DIRECTION 5.3, DESIGN.md "Timeline"): đổi toạ độ ↔ thời gian, thước, thu phóng quanh con trỏ,
// bắt dính, di chuyển/xoá nhiều keyframe, chọn bằng hộp, đi tới keyframe trước/sau. Không DOM; test ở timeline.test.ts.
import { MAX_ANIMATIONS, MAX_ANIM_KEYS, animatablePaths, compileTrack, isBinding, isKeyAnim, keyTimeSec, sampleTrack, type Key, type KeyAnimation, type KeyValue, type TempoPoint, type TimeCtx, type WidgetSpec } from '@dawviz/render-core';
import { sortKeys } from './animateFields.ts';

/** Chiều cao một hàng thuộc tính và hàng thước (px). Hàng = vùng bấm tối thiểu 24 px (DESIGN.md, 24-Pixel Hit Rule). */
export const ROW_H = 24, RULER_H = 28;
/** Thu phóng: px mỗi giây, lớn nhất (đủ để chỉnh từng khung 1/60 s). Nhỏ nhất là "vừa khung" (cả bài vừa bề rộng làn). */
export const MAX_PPS = 2400;
/** Bước lệch khi kéo dưới mức này (px) thì vẫn là nhấp, không phải kéo. */
export const DRAG_SLOP = 3;
/** Khoảng bắt dính (px trên màn hình). */
export const SNAP_PX = 6;
/** Hai mốc cách nhau dưới mức này (giây) coi là cùng một chỗ (keyframe "tại vạch phát"). */
export const SAME_TIME = 1 / 240;

const r3 = (x: number) => Math.round(x * 1000) / 1000;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const timeToX = (t: number, pps: number): number => t * pps;
export const xToTime = (x: number, pps: number, duration: number): number => clamp(x / pps, 0, Math.max(0, duration));

/** Thu phóng "vừa khung": cả bài nằm vừa bề rộng làn (thời lượng 0 → 100 px/s). */
export const fitPps = (laneWidth: number, duration: number): number => (duration > 0 && laneWidth > 0 ? Math.min(MAX_PPS, laneWidth / duration) : 100);
export const clampPps = (pps: number, fit: number): number => clamp(pps, Math.min(fit, MAX_PPS), MAX_PPS);

/** Thu phóng giữ nguyên thời điểm dưới con trỏ: trả px/s mới và vị trí cuộn mới. `anchorX` là toạ độ con trỏ tính từ mép trái phần làn đang thấy. */
export function zoomAround(pps: number, factor: number, anchorX: number, scrollLeft: number, fit: number): { pps: number; scrollLeft: number } {
  const next = clampPps(pps * factor, fit);
  const t = (scrollLeft + anchorX) / pps;
  return { pps: next, scrollLeft: Math.max(0, t * next - anchorX) };
}

const STEPS = [0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
/** Bước vạch chính của thước: bước nhỏ nhất mà hai nhãn cách nhau ít nhất `minPx`. */
export const rulerStep = (pps: number, minPx = 72): number => STEPS.find((s) => s * pps >= minPx) ?? STEPS[STEPS.length - 1];
/** Các mốc vạch chính trong [from, to] (giây), kể cả 0. */
export function rulerTicks(from: number, to: number, step: number): number[] {
  const out: number[] = [];
  const start = Math.max(0, Math.floor(from / step) * step);
  for (let i = 0, t = start; t <= to + 1e-9 && i < 2000; i++, t = start + i * step) out.push(r3(t));
  return out;
}
/** Nhãn thước: m:ss, thêm phần lẻ khi bước dưới 1 giây (đủ chữ số cho bước đó). */
export function rulerLabel(t: number, step: number): string {
  const dec = step >= 1 ? 0 : step >= 0.1 ? 1 : 2;
  const m = Math.floor(t / 60), s = t - m * 60;
  const ss = dec ? s.toFixed(dec).padStart(dec + 3, '0') : String(Math.floor(s + 1e-9)).padStart(2, '0');
  return `${m}:${ss}`;
}

/** Giây của từng keyframe (mốc theo nhạc đổi qua tempo map; mốc hỏng → NaN). */
export function keySecs(a: KeyAnimation, tempoMap: readonly TempoPoint[]): number[] {
  const ctx: TimeCtx = { tempoMap };
  return a.keys.map((k) => keyTimeSec(k.at, ctx));
}
/** Giá trị của hoạt hình keyframe tại `t` (đúng như Render Core vẽ). */
export function valueAt(a: KeyAnimation, t: number, tempoMap: readonly TempoPoint[]): KeyValue {
  return sampleTrack(compileTrack(a, { tempoMap }), t);
}
/** Mốc phách (giây) trong [0, duration]: đích bắt dính theo nhạc. Tối đa 20 000 mốc. */
export function beatTimes(tempoMap: readonly TempoPoint[], duration: number): number[] {
  const out: number[] = [];
  for (let b = 0; b < 20000; b++) { const t = keyTimeSec({ beat: b }, { tempoMap }); if (!Number.isFinite(t) || t > duration + 1e-9) break; out.push(t); }
  return out;
}

/** Bắt dính: đích gần nhất trong SNAP_PX px (theo thu phóng hiện tại); không có thì giữ nguyên. */
export function snapTime(t: number, targets: readonly number[], pps: number, tolPx = SNAP_PX): { t: number; snapped: boolean } {
  let best = t, d = tolPx / pps;
  for (const x of targets) { const e = Math.abs(x - t); if (e <= d) { d = e; best = x; } }
  return { t: best, snapped: best !== t };
}

/**
 * Dời các keyframe `idx` của một hoạt hình thêm `dt` giây (kẹp trong [0, duration]). Mốc theo nhạc bị dời trở thành mốc giây.
 * Trả hoạt hình mới đã sắp lại và chỉ số mới của đúng những keyframe đó (để giữ vùng chọn sau khi thứ tự đổi).
 */
export function moveKeys(a: KeyAnimation, idx: readonly number[], dt: number, duration: number, tempoMap: readonly TempoPoint[]): { anim: KeyAnimation; idx: number[] } {
  const secs = keySecs(a, tempoMap), pick = new Set(idx);
  const tagged = a.keys.map((k, i) => ({ k: pick.has(i) && Number.isFinite(secs[i]) ? { ...k, at: { sec: r3(clamp(secs[i] + dt, 0, Math.max(0, duration))) } } : k, i }));
  const sorted = sortKeys(tagged.map((x) => x.k));
  // sortKeys giữ thứ tự ổn định: ghép lại theo đối tượng để biết chỉ số mới
  const where = new Map(tagged.map((x) => [x.k, x.i]));
  const next: number[] = [];
  sorted.forEach((k, j) => { if (pick.has(where.get(k)!)) next.push(j); });
  return { anim: { ...a, keys: sorted }, idx: next };
}
/** Khoảng dời hợp lệ: kẹp `dt` để không keyframe nào ra ngoài [0, duration]. */
export function clampShift(times: readonly number[], dt: number, duration: number): number {
  const ok = times.filter(Number.isFinite);
  if (!ok.length) return dt;
  const lo = -Math.min(...ok), hi = Math.max(0, duration) - Math.max(...ok);
  return clamp(dt, Math.min(lo, 0), Math.max(hi, 0));
}
/** Bỏ nhiều keyframe; hết keyframe thì null (bỏ cả hoạt hình). */
export function removeKeys(a: KeyAnimation, idx: readonly number[]): KeyAnimation | null {
  const drop = new Set(idx), keys = a.keys.filter((_, i) => !drop.has(i));
  return keys.length ? { ...a, keys } : null;
}

/** Vùng chọn keyframe: khoá `đường dẫn#chỉ số`. */
export const keyRef = (path: string, i: number): string => `${path}#${i}`;
export function parseKeyRef(ref: string): { path: string; i: number } | null {
  const h = ref.lastIndexOf('#'); if (h < 0) return null;
  const i = Number(ref.slice(h + 1));
  return Number.isInteger(i) && i >= 0 ? { path: ref.slice(0, h), i } : null;
}
/** Nhóm vùng chọn theo thuộc tính: đường dẫn → chỉ số (tăng dần). */
export function groupRefs(refs: Iterable<string>): Map<string, number[]> {
  const m = new Map<string, number[]>();
  for (const r of refs) { const p = parseKeyRef(r); if (!p) continue; const a = m.get(p.path) ?? []; a.push(p.i); m.set(p.path, a); }
  for (const a of m.values()) a.sort((x, y) => x - y);
  return m;
}

/** Hàng có keyframe trong hộp chọn: hàng thứ `row` (từ 0), keyframe ở giây `times`. Hộp tính bằng hàng [r0, r1] và giây [t0, t1]. */
export function keysInBox(rows: readonly { path: string; times: readonly number[] }[], r0: number, r1: number, t0: number, t1: number): string[] {
  const [ra, rb] = r0 <= r1 ? [r0, r1] : [r1, r0], [ta, tb] = t0 <= t1 ? [t0, t1] : [t1, t0];
  const out: string[] = [];
  rows.forEach((row, r) => { if (r < ra || r > rb) return; row.times.forEach((t, i) => { if (t >= ta && t <= tb) out.push(keyRef(row.path, i)); }); });
  return out;
}

/** Keyframe trước/sau `t` (bỏ qua keyframe đúng tại `t`); không có thì null. */
export function prevKey(times: readonly number[], t: number): number | null {
  let best: number | null = null;
  for (const x of times) if (Number.isFinite(x) && x < t - SAME_TIME && (best === null || x > best)) best = x;
  return best;
}
export function nextKey(times: readonly number[], t: number): number | null {
  let best: number | null = null;
  for (const x of times) if (Number.isFinite(x) && x > t + SAME_TIME && (best === null || x < best)) best = x;
  return best;
}
/** Chỉ số keyframe nằm tại `t` (trong SAME_TIME), hoặc -1. */
export const keyAt = (times: readonly number[], t: number): number => times.findIndex((x) => Math.abs(x - t) <= SAME_TIME);

// ───────────── sao chép/dán keyframe (T-22) ─────────────
/** Keyframe đã sao chép: theo đường dẫn, thời điểm tương đối so với keyframe sớm nhất (giây), kèm giá trị và đường cong. */
export interface KeyClip { kind: Record<string, KeyAnimation['kind']>; keys: { path: string; dt: number; key: Key }[] }
/** Sao chép các keyframe `refs` (mốc nhạc đổi ra giây). Rỗng → null. */
export function copyKeys(animate: Readonly<Record<string, KeyAnimation>>, refs: readonly string[], tempoMap: readonly TempoPoint[]): KeyClip | null {
  const rows: { path: string; t: number; key: Key }[] = [];
  const kind: KeyClip['kind'] = {};
  for (const [path, idx] of groupRefs(refs)) {
    const a = animate[path]; if (!a) continue;
    const secs = keySecs(a, tempoMap);
    for (const i of idx) if (a.keys[i] && Number.isFinite(secs[i])) rows.push({ path, t: secs[i], key: a.keys[i] });
    kind[path] = a.kind;
  }
  if (!rows.length) return null;
  const t0 = Math.min(...rows.map((r) => r.t));
  return { kind, keys: rows.map((r) => ({ path: r.path, dt: r3(r.t - t0), key: JSON.parse(JSON.stringify(r.key)) as Key })) };
}
/**
 * Dán tại `t` (keyframe sớm nhất của bản sao rơi vào `t`, các keyframe khác giữ khoảng cách). Chỉ dán vào đường dẫn `allowed` (loại widget nhận);
 * keyframe trùng mốc (±1 ms) thì thay giá trị; vượt quá cuối bài thì bỏ. Trả thay đổi theo đường dẫn và các keyframe vừa dán (để chọn).
 */
export function pasteKeys(animate: Readonly<Record<string, KeyAnimation | undefined>>, clip: KeyClip, t: number, duration: number, allowed: (path: string) => boolean, maxKeys = 256): { changes: Record<string, KeyAnimation>; refs: string[]; skipped: number } {
  const changes: Record<string, KeyAnimation> = {};
  let skipped = 0;
  const placed: { path: string; sec: number }[] = [];
  for (const { path, dt, key } of clip.keys) {
    if (!allowed(path)) { skipped++; continue; }
    const sec = r3(t + dt);
    if (sec > Math.max(0, duration) + 1e-9 || sec < 0) { skipped++; continue; }
    const cur = changes[path] ?? animate[path] ?? { keys: [], ...(clip.kind[path] ? { kind: clip.kind[path] } : {}) };
    const k: Key = { ...key, at: { sec } };
    const i = cur.keys.findIndex((x) => 'sec' in x.at && Math.abs(x.at.sec - sec) < 0.001);
    if (i < 0 && cur.keys.length >= maxKeys) { skipped++; continue; }
    changes[path] = { ...cur, keys: i >= 0 ? cur.keys.map((x, j) => (j === i ? k : x)) : sortKeys([...cur.keys, k]) };
    placed.push({ path, sec });
  }
  const refs = placed.map(({ path, sec }) => keyRef(path, changes[path].keys.findIndex((x) => 'sec' in x.at && Math.abs(x.at.sec - sec) < 0.001)));
  return { changes, refs: [...new Set(refs)], skipped };
}
/** Bản sao trong phiên (dùng chung giữa các widget và giữa Danh sách/Đồ thị). */
let keyClip: KeyClip | null = null;
export const keyClipboard = { get: () => keyClip, set: (c: KeyClip | null) => { keyClip = c; } };
/** Dán vào một widget: chỉ đường dẫn loại widget nhận, không đè binding, không vượt trần số hoạt hình. */
export function pasteIntoWidget(w: Pick<WidgetSpec, 'type' | 'animate'>, clip: KeyClip, t: number, duration: number) {
  const paths = animatablePaths(w.type), cur = w.animate ?? {};
  let budget = MAX_ANIMATIONS - Object.keys(cur).length;
  const fresh = new Set<string>();
  const keyed: Record<string, KeyAnimation> = {};
  for (const [p, a] of Object.entries(cur)) if (isKeyAnim(a)) keyed[p] = a;
  return pasteKeys(keyed, clip, t, duration, (p) => {
    if (!paths.has(p) || (cur[p] && !isKeyAnim(cur[p]))) return false;
    if (cur[p] || fresh.has(p)) return true;
    if (budget <= 0) return false;
    budget--; fresh.add(p); return true;
  }, MAX_ANIM_KEYS);
}
