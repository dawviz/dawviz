// So sánh hai AST (KPI-01 / AT-01): AST từ parser vs AST từ MIDI xuất ra bởi chính DAW.
import { PPQ } from './tempo.js';

/**
 * Dung sai mặc định = 1 tick của độ phân giải THÔ hơn trong hai nguồn (quy về 960).
 * Ví dụ MIDI tham chiếu 96 PPQ => 1 tick tham chiếu = 10 tick nội bộ. Ghi đè bằng opts.tolTicks.
 */
export function compareAST(a, b, opts = {}) {
  const ppqA = a.meta.sourcePPQ || PPQ, ppqB = b.meta.sourcePPQ || PPQ;
  const tol = opts.tolTicks ?? Math.max(1, Math.round(PPQ / Math.min(ppqA, ppqB)));
  const window = opts.matchWindow ?? PPQ * 2;
  const group = (ast) => { const m = new Map(); for (const t of ast.tracks) { if (opts.visibleOnly && !t.isVisible) continue; for (const n of t.notes) { let l = m.get(n.pitch); if (!l) m.set(n.pitch, (l = [])); l.push(n); } } for (const l of m.values()) l.sort((x, y) => x.startTick - y.startTick); return m; };
  const A = group(a), B = group(b);
  const r = { tolTicks: tol, notesA: 0, notesB: 0, matched: 0, startOutOfTol: 0, durOutOfTol: 0, maxStartDelta: 0, maxDurDelta: 0, onlyInA: 0, onlyInB: 0, samples: [] };
  for (const l of A.values()) r.notesA += l.length;
  for (const l of B.values()) r.notesB += l.length;
  const sample = (s) => { if (r.samples.length < 12) r.samples.push(s); };
  for (const pitch of new Set([...A.keys(), ...B.keys()])) {
    const la = A.get(pitch) || [], lb = B.get(pitch) || [];
    let i = 0, j = 0;
    while (i < la.length && j < lb.length) {
      const x = la[i], y = lb[j], ds = x.startTick - y.startTick;
      if (ds < -window) { r.onlyInA++; sample(`chỉ có ở A: pitch ${pitch} @${x.startTick}`); i++; continue; }
      if (ds > window) { r.onlyInB++; sample(`chỉ có ở B: pitch ${pitch} @${y.startTick}`); j++; continue; }
      const dd = x.durationTick - y.durationTick;
      r.matched++;
      r.maxStartDelta = Math.max(r.maxStartDelta, Math.abs(ds)); r.maxDurDelta = Math.max(r.maxDurDelta, Math.abs(dd));
      if (Math.abs(ds) > tol) { r.startOutOfTol++; sample(`pitch ${pitch}: start ${x.startTick} vs ${y.startTick}`); }
      if (Math.abs(dd) > tol) { r.durOutOfTol++; sample(`pitch ${pitch}: dur ${x.durationTick} vs ${y.durationTick} @${x.startTick}`); }
      i++; j++;
    }
    for (; i < la.length; i++) { r.onlyInA++; sample(`chỉ có ở A: pitch ${pitch} @${la[i].startTick}`); }
    for (; j < lb.length; j++) { r.onlyInB++; sample(`chỉ có ở B: pitch ${pitch} @${lb[j].startTick}`); }
  }
  const ta = a.tempoMap, tb = b.tempoMap;
  r.tempo = { pointsA: ta.length, pointsB: tb.length, firstBpmA: ta[0].bpm, firstBpmB: tb[0].bpm, durationDeltaSeconds: a.meta.totalDurationSeconds - b.meta.totalDurationSeconds };
  r.pass = r.notesA === r.notesB && r.onlyInA === 0 && r.onlyInB === 0 && r.startOutOfTol === 0 && r.durOutOfTol === 0;
  return r;
}
