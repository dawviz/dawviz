// Logic thuần của Graph Editor cơ bản (T-33, ANIMATION-CATALOG §3, DESIGN.md "Graph Editor"): lấy mẫu đồ thị giá trị và đồ thị tốc độ,
// đổi qua lại giữa cubic-bezier của một đoạn và vận tốc/ảnh hưởng kiểu After Effects, toạ độ tay cầm trên đồ thị giá trị, bắt dính giá trị tròn,
// thư viện easing (lưu trong localStorage) và clipboard easing. Không DOM; test ở graphEditor.test.ts.
//
// Mô hình: easing của đoạn A → B nằm ở keyframe CUỐI đoạn (`B.ease`, như Render Core: `eases[i + 1]`); cách đi của đoạn nằm ở keyframe ĐẦU (`A.interp`).
// Vận tốc ra của A và vận tốc vào của B đều thuộc đoạn A → B. Với đoạn dài h giây, đổi giá trị dv:
//   ảnh hưởng ra = x1, vận tốc ra = (y1 / x1) · dv / h;   ảnh hưởng vào = 1 − x2, vận tốc vào = ((1 − y2) / (1 − x2)) · dv / h.
import { compileTrack, sampleTrack, trackSpeed, type EaseSpec, type Key, type KeyAnimation, type TempoPoint } from '@dawviz/render-core';
import { bezierOf, clampBezier, sameEase, Y_RANGE, type Bezier } from './easeCurve.ts';
import { keySecs } from './timeline.ts';

const r3 = (x: number) => Math.round(x * 1000) / 1000;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Chế độ đồ thị: giá trị theo thời gian, hoặc tốc độ (độ lớn đạo hàm, đơn vị/giây). */
export type GraphMode = 'value' | 'speed';
/** Ảnh hưởng nhỏ nhất (%) để tay cầm không chồng lên keyframe (đường cong vẫn là hàm của thời gian). */
export const MIN_INFLUENCE = 0.1;

/** Chỉ số keyframe theo thứ tự thời gian (mốc hỏng bỏ ra ngoài). */
export function timeOrder(a: KeyAnimation, tempoMap: readonly TempoPoint[]): { i: number; t: number }[] {
  const secs = keySecs(a, tempoMap);
  return secs.map((t, i) => ({ i, t })).filter((x) => Number.isFinite(x.t)).sort((p, q) => p.t - q.t || p.i - q.i);
}

/** Đồ thị đọc được: chỉ thuộc tính số hoặc góc, có ít nhất 1 keyframe. Màu thì không có trục giá trị. */
export const graphable = (a: KeyAnimation | null | undefined): a is KeyAnimation => !!a && a.kind !== 'color' && a.keys.length > 0 && typeof a.keys[0].value === 'number';

/** Lấy mẫu đều trên [t0, t1] (n + 1 điểm): giá trị hoặc tốc độ đúng như Render Core tính. */
export function sampleGraph(a: KeyAnimation, tempoMap: readonly TempoPoint[], t0: number, t1: number, n: number, mode: GraphMode): [number, number][] {
  const ct = compileTrack(a, { tempoMap }), out: [number, number][] = [];
  const steps = Math.max(1, Math.floor(n));
  for (let k = 0; k <= steps; k++) {
    const t = t0 + ((t1 - t0) * k) / steps;
    out.push([t, mode === 'value' ? (sampleTrack(ct, t) as number) : Math.abs(trackSpeed(ct, t))]);
  }
  return out;
}

/** Khung nhìn trục giá trị: chứa mọi mẫu và mọi điểm thêm (tay cầm), lề 10%; khoảng rỗng → ±1 quanh giá trị. */
export function valueRange(samples: readonly [number, number][], extra: readonly number[] = [], zeroBased = false): [number, number] {
  let lo = zeroBased ? 0 : Infinity, hi = -Infinity;
  for (const [, v] of samples) { if (v < lo) lo = v; if (v > hi) hi = v; }
  for (const v of extra) { if (v < lo) lo = v; if (v > hi) hi = v; }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (hi - lo < 1e-9) return [lo - 1, hi + 1];
  const pad = (hi - lo) * 0.1;
  return [zeroBased ? Math.min(0, lo) : lo - pad, hi + pad];
}

/** Vạch chia "đẹp" cho trục giá trị: bước 1/2/5 × 10^k sao cho có khoảng `target` vạch. */
export function niceTicks(lo: number, hi: number, target = 5): number[] {
  const span = hi - lo;
  if (!(span > 0)) return [lo];
  const raw = span / Math.max(1, target), p = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 5, 10].map((m) => m * p).find((s) => s >= raw) ?? 10 * p;
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step, i = 0; v <= hi + step * 1e-9 && i < 100; v += step, i++) out.push(Math.round(v / step) * step);
  return out;
}

/** Bắt dính giá trị tròn: bước vạch chia của trục và nửa bước; trong `tol` (đơn vị giá trị) thì bắt. */
export function snapValue(v: number, tickStep: number, tol: number): { v: number; snapped: boolean } {
  if (!(tickStep > 0)) return { v, snapped: false };
  for (const s of [tickStep, tickStep / 2]) { const r = Math.round(v / s) * s; if (Math.abs(r - v) <= tol) return { v: r3(r), snapped: true }; }
  return { v, snapped: false };
}
/** Bước vạch chia của một dãy vạch (0 nếu ít hơn 2 vạch). */
export const tickStep = (ticks: readonly number[]): number => (ticks.length > 1 ? ticks[1] - ticks[0] : 0);

/** Một đoạn A → B (theo thứ tự thời gian): chỉ số trong `keys`, thời điểm, giá trị. */
export interface Segment { a: number; b: number; ta: number; tb: number; va: number; vb: number }
export function segments(a: KeyAnimation, tempoMap: readonly TempoPoint[]): Segment[] {
  const ord = timeOrder(a, tempoMap), out: Segment[] = [];
  for (let k = 0; k + 1 < ord.length; k++) {
    const A = ord[k], B = ord[k + 1];
    out.push({ a: A.i, b: B.i, ta: A.t, tb: B.t, va: a.keys[A.i].value as number, vb: a.keys[B.i].value as number });
  }
  return out;
}
/** Đoạn có bezier chỉnh được: đi "đều" (không giữ, không cong mượt tự động) và easing biểu diễn được bằng bezier. */
export function segmentBezier(a: KeyAnimation, s: Segment): Bezier | null {
  const A = a.keys[s.a], B = a.keys[s.b];
  if (A.interp === 'hold' || A.interp === 'smooth') return null;
  return bezierOf(B.ease);
}

/**
 * Độ dốc chuẩn hoá ở đầu/cuối bezier (1 = như đi đều). Tay cầm trùng keyframe (x = 0) thì độ dốc do tay cầm kia quyết định:
 * dy/dx của bezier lập phương tại 0 khi P1 = P0 là (P2 − P0) theo hướng; đường thẳng [0,0,1,1] cho đúng 1.
 */
export function startSlope(bz: Bezier): number {
  if (bz[0] > 1e-9) return bz[1] / bz[0];
  if (Math.abs(bz[1]) > 1e-9) return 0; // tay cầm thẳng đứng: không biểu diễn được bằng số hữu hạn; coi như đứng yên
  return bz[2] > 1e-9 ? bz[3] / bz[2] : 1;
}
export function endSlope(bz: Bezier): number {
  if (1 - bz[2] > 1e-9) return (1 - bz[3]) / (1 - bz[2]);
  if (Math.abs(1 - bz[3]) > 1e-9) return 0;
  return bz[0] < 1 - 1e-9 ? (1 - bz[1]) / (1 - bz[0]) : 1;
}

/** Vận tốc và ảnh hưởng của một keyframe (đơn vị/giây, 0..1). `null` = phía đó không có đoạn hoặc đoạn không chỉnh được bằng bezier. */
export interface KeyVelocity { inVel: number | null; inInf: number | null; outVel: number | null; outInf: number | null }
export function keyVelocity(a: KeyAnimation, tempoMap: readonly TempoPoint[], keyIndex: number): KeyVelocity {
  const segs = segments(a, tempoMap), res: KeyVelocity = { inVel: null, inInf: null, outVel: null, outInf: null };
  for (const s of segs) {
    const bz = segmentBezier(a, s); if (!bz) continue;
    const h = s.tb - s.ta, dv = s.vb - s.va, rate = h > 0 ? dv / h : 0;
    if (s.a === keyIndex) { res.outInf = bz[0]; res.outVel = startSlope(bz) * rate; }
    if (s.b === keyIndex) { res.inInf = 1 - bz[2]; res.inVel = endSlope(bz) * rate; }
  }
  for (const k of ['inVel', 'outVel'] as const) if (res[k] !== null) res[k] = r3(res[k]!);
  for (const k of ['inInf', 'outInf'] as const) if (res[k] !== null) res[k] = r3(res[k]!);
  return res;
}

/** Bezier của đoạn khi đặt vận tốc/ảnh hưởng ở một đầu. Đoạn không đổi giá trị (dv = 0) thì vận tốc khác 0 không biểu diễn được: giữ y. */
export function bezierWith(bz: Bezier, s: Segment, side: 'out' | 'in', vel: number | null, inf: number | null): Bezier {
  const h = s.tb - s.ta, dv = s.vb - s.va, rate = h > 0 ? dv / h : 0, b: number[] = [...bz];
  if (side === 'out') {
    const x = inf === null ? b[0] : clamp(inf, MIN_INFLUENCE, 1);
    const v = vel === null ? startSlope(bz) * rate : vel;
    b[0] = x; if (rate !== 0) b[1] = (v / rate) * x;
  } else {
    const w = inf === null ? 1 - b[2] : clamp(inf, MIN_INFLUENCE, 1);
    const v = vel === null ? endSlope(bz) * rate : vel;
    b[2] = 1 - w; if (rate !== 0) b[3] = 1 - (v / rate) * w;
  }
  return clampBezier(b);
}

/**
 * Đặt vận tốc/ảnh hưởng vào hoặc ra của keyframe `keyIndex` (giá trị `null` = giữ nguyên). Đoạn đang giữ/cong mượt/easing không phải bezier
 * được đổi sang "đều" + bezier tương đương (gần nhất có thể) trước khi đặt. Không có đoạn phía đó → trả nguyên.
 */
export function setVelocity(a: KeyAnimation, tempoMap: readonly TempoPoint[], keyIndex: number, side: 'in' | 'out', vel: number | null, inf: number | null): KeyAnimation {
  const s = segments(a, tempoMap).find((x) => (side === 'out' ? x.a === keyIndex : x.b === keyIndex));
  if (!s) return a;
  const bz = bezierWith(segmentBezier(a, s) ?? [0.33, 0, 0.67, 1], s, side, vel, inf);
  return setSegmentBezier(a, s, bz);
}
/** Gán bezier cho đoạn (easing ở keyframe cuối; keyframe đầu đi "đều"). */
export function setSegmentBezier(a: KeyAnimation, s: Segment, bz: Bezier): KeyAnimation {
  const keys = a.keys.map((k, i): Key => {
    if (i === s.b) return { ...k, ease: { cubicBezier: [...bz] as Bezier } };
    if (i === s.a && (k.interp === 'hold' || k.interp === 'smooth')) { const { interp: _i, ...rest } = k; return rest; }
    return k;
  });
  return { ...a, keys };
}

/** Toạ độ (giây, giá trị) của hai tay cầm của đoạn trên đồ thị giá trị. */
export function handlePoints(s: Segment, bz: Bezier): [[number, number], [number, number]] {
  const h = s.tb - s.ta, dv = s.vb - s.va;
  return [[s.ta + bz[0] * h, s.va + bz[1] * dv], [s.ta + bz[2] * h, s.va + bz[3] * dv]];
}
/** Tay cầm kéo tới điểm (giây, giá trị) trên đồ thị giá trị → bezier mới (x kẹp 0..1; y theo dv, kẹp miền Y_RANGE; dv = 0 thì giữ y). */
export function bezierFromHandle(bz: Bezier, s: Segment, which: 0 | 1, t: number, v: number): Bezier {
  const h = s.tb - s.ta, dv = s.vb - s.va, b: number[] = [...bz];
  const x = h > 0 ? (t - s.ta) / h : b[which * 2];
  b[which * 2] = x;
  if (Math.abs(dv) > 1e-12) b[which * 2 + 1] = clamp((v - s.va) / dv, Y_RANGE[0], Y_RANGE[1]);
  return clampBezier(b);
}

// ───────────── clipboard và thư viện easing ─────────────
/** Easing đã sao chép (trong phiên, không lưu): áp cho mọi đoạn kết thúc ở keyframe đang chọn. */
let clip: EaseSpec | undefined | null = null;
export const easeClipboard = {
  get: (): EaseSpec | undefined | null => clip,
  set: (e: EaseSpec | undefined) => { clip = e === undefined ? 'linear' : JSON.parse(JSON.stringify(e)) as EaseSpec; },
  clear: () => { clip = null; },
};

/** Đường cong người dùng lưu (thư viện easing, ANIMATION-CATALOG §3). Chỉ bezier: hình thu nhỏ và đường cong đúng như Render Core vẽ. */
export interface SavedEase { name: string; bezier: Bezier }
export const EASE_LIBRARY_KEY = 'dawviz.easeLibrary.v1';
export const MAX_SAVED_EASES = 32, MAX_EASE_NAME = 40;
export function parseEaseLibrary(raw: string | null): SavedEase[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    const out: SavedEase[] = [];
    for (const x of v) {
      if (!x || typeof x.name !== 'string' || !Array.isArray(x.bezier) || x.bezier.length !== 4 || !x.bezier.every((n: unknown) => typeof n === 'number' && Number.isFinite(n))) continue;
      const name = x.name.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_EASE_NAME);
      if (name && !out.some((o) => o.name === name)) out.push({ name, bezier: clampBezier(x.bezier) });
      if (out.length >= MAX_SAVED_EASES) break;
    }
    return out;
  } catch { return []; }
}
/** Thêm (hoặc thay đường cong cùng tên). Đầy thì bỏ cái cũ nhất. */
export function addSavedEase(lib: readonly SavedEase[], name: string, bezier: Bezier): SavedEase[] {
  const n = name.replace(/\s+/g, ' ').trim().slice(0, MAX_EASE_NAME);
  if (!n) return [...lib];
  const rest = lib.filter((x) => x.name !== n);
  return [...rest, { name: n, bezier: clampBezier(bezier) }].slice(-MAX_SAVED_EASES);
}
/** Tên mặc định chưa trùng: "Đường cong 1", "Đường cong 2"… (`base` đã dịch). */
export function nextEaseName(lib: readonly SavedEase[], base: string): string {
  for (let i = 1; ; i++) { const n = `${base} ${i}`; if (!lib.some((x) => x.name === n)) return n; }
}

/** Áp một easing cho các đoạn kết thúc ở keyframe `idx` (dán easing, chọn từ thư viện). Keyframe đầu của đoạn thôi giữ/cong mượt. */
export function applyEase(a: KeyAnimation, tempoMap: readonly TempoPoint[], idx: readonly number[], ease: EaseSpec | undefined): KeyAnimation {
  const pick = new Set(idx), segs = segments(a, tempoMap).filter((s) => pick.has(s.b));
  if (!segs.length) return a;
  const starts = new Set(segs.map((s) => s.a)), ends = new Set(segs.map((s) => s.b));
  const keys = a.keys.map((k, i): Key => {
    let x = k;
    if (ends.has(i)) { const { ease: _e, ...rest } = x; x = ease === undefined || ease === 'linear' ? rest : { ...rest, ease: JSON.parse(JSON.stringify(ease)) as EaseSpec }; }
    if (starts.has(i) && (x.interp === 'hold' || x.interp === 'smooth')) { const { interp: _i, ...rest } = x; x = rest; }
    return x;
  });
  return { ...a, keys };
}
/** Easing chung của các đoạn kết thúc ở `idx` (để sao chép): một giá trị nếu giống nhau, 'mixed' nếu khác, undefined nếu không có đoạn. */
export function easeOfKeys(a: KeyAnimation, tempoMap: readonly TempoPoint[], idx: readonly number[]): EaseSpec | 'linear' | 'mixed' | undefined {
  const pick = new Set(idx), segs = segments(a, tempoMap).filter((s) => pick.has(s.b));
  if (!segs.length) return undefined;
  const es = segs.map((s) => a.keys[s.b].ease ?? 'linear');
  return es.every((e) => sameEase(e, es[0])) ? es[0] : 'mixed';
}
