// TempoMap (D-08): tick là nguồn sự thật, giây là giá trị suy ra. PPQ nội bộ = 960.
export const PPQ = 960;

/** points: [{tick, bpm, num?, den?}] -> TempoPoint[] có timeSeconds. Điểm trùng tick: điểm sau thắng. */
export function makeTempoMap(points) {
  const pts = [...points].sort((a, b) => a.tick - b.tick);
  if (pts.length && pts[0].tick !== 0) pts.unshift({ ...pts[0], tick: 0 });
  const out = [];
  for (const p of pts) {
    const q = { tick: p.tick, bpm: p.bpm, num: p.num || 4, den: p.den || 4 };
    if (out.length && out[out.length - 1].tick === q.tick) out[out.length - 1] = q; else out.push(q);
  }
  let t = 0;
  return out.map((p, i) => {
    if (i > 0) { const q = out[i - 1]; t += ((p.tick - q.tick) / PPQ) * (60 / q.bpm); }
    return { tick: p.tick, timeSeconds: t, bpm: p.bpm, timeSigNumerator: p.num, timeSigDenominator: p.den };
  });
}

function find(map, key, v) {
  let lo = 0, hi = map.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (map[mid][key] <= v) lo = mid; else hi = mid - 1; }
  return map[lo];
}
export const tickToSec = (map, tick) => { const p = find(map, 'tick', tick); return p.timeSeconds + ((tick - p.tick) / PPQ) * (60 / p.bpm); };
/** Trả số thực (không làm tròn); nơi gọi tự Math.round. */
export const secToTick = (map, sec) => { const p = find(map, 'timeSeconds', sec); return p.tick + ((sec - p.timeSeconds) * p.bpm / 60) * PPQ; };

/** Gộp điểm tempo và điểm nhịp (time signature) độc lập thành các điểm {tick,bpm,num,den}. */
export function mergeTempoAndSig(tempos, sigs, defaults = { bpm: 120, num: 4, den: 4 }) {
  const T = [...tempos].sort((a, b) => a.tick - b.tick), S = [...sigs].sort((a, b) => a.tick - b.tick);
  const ticks = [...new Set([0, ...T.map((x) => x.tick), ...S.map((x) => x.tick)])].sort((a, b) => a - b);
  const last = (arr, tk) => { let r; for (const x of arr) { if (x.tick <= tk) r = x; else break; } return r; };
  return ticks.map((tk) => {
    const t = last(T, tk) || (T[0] ? { bpm: T[0].bpm } : null), s = last(S, tk) || S[0];
    return { tick: tk, bpm: t ? t.bpm : defaults.bpm, num: s ? s.num : defaults.num, den: s ? s.den : defaults.den };
  });
}

/** Xấp xỉ dốc tempo tuyến tính (b0 -> b1 trong [t0,t1) tick) bằng các bậc. Nguồn khai báo dốc mới dùng (SRS REQ-AST-01). */
export function rampToSteps(t0, b0, t1, b1, stepTicks = PPQ / 2, maxSteps = 256) {
  const span = t1 - t0;
  const n = Math.max(1, Math.min(maxSteps, Math.ceil(span / stepTicks)));
  const out = [];
  for (let k = 0; k < n; k++) {
    const tk = Math.round(t0 + (span * k) / n);
    out.push({ tick: tk, bpm: b0 + (b1 - b0) * ((k + 0.5) / n) });
  }
  return out;
}
