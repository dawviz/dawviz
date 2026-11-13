// Hàm dùng chung cho test T-69: AST tổng hợp nhỏ (tất định, không tệp ngoài) và ctx giả ghi lệnh vẽ.
import type { Derived, UnifiedProjectAST, ProjectTrack, ASTNote } from '../src/index.ts';
import { buildIndex, DEFAULT_BRIGHTNESS } from '../src/index.ts';

/** Tempo 120 BPM, 4/4 (đen = 0,5 s). Nốt: [pitch, startBeat, lenBeats, velocity]. */
export function synthAst(opts: { tracks?: { name: string; color: string; notes: [number, number, number, number][] }[]; tempoMap?: UnifiedProjectAST['tempoMap']; title?: string; artist?: string; duration?: number } = {}): UnifiedProjectAST {
  const tracks = opts.tracks ?? [
    { name: 'Chords', color: '#4488ff', notes: [[52, 0, 4, 82], [56, 0, 4, 80], [59, 0, 4, 78], [62, 0, 4, 76], [48, 4, 2, 70], [55, 4, 2, 70], [60, 4, 2, 70]] },
    { name: 'Lead', color: '#ff8844', notes: [[76, 0.5, 0.5, 90], [79, 1.5, 0.5, 95], [72, 2, 1, 85], [84, 4.5, 0.5, 100], [81, 5, 1, 88]] },
  ];
  const tempoMap = opts.tempoMap ?? [{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }];
  const out: ProjectTrack[] = tracks.map((tr, i) => {
    const notes: ASTNote[] = tr.notes.map(([pitch, sb, lb, velocity], k) => ({ id: `t${i}n${k}`, pitch, velocity, startTick: Math.round(sb * 960), endTick: Math.round((sb + lb) * 960), startTimeSeconds: sb * 0.5, endTimeSeconds: (sb + lb) * 0.5 }));
    return { id: `t${i}`, index: i, name: tr.name, color: tr.color, isMuted: false, isVisible: true, notes, pitchRange: { min: Math.min(...tr.notes.map((n) => n[0])), max: Math.max(...tr.notes.map((n) => n[0])) } };
  });
  const end = opts.duration ?? Math.max(...out.flatMap((t) => t.notes.map((n) => n.endTimeSeconds)), 1);
  return { meta: { title: opts.title ?? 'Demo Song', artist: opts.artist ?? 'Demo Artist', totalDurationSeconds: end, totalTicks: Math.round(end * 2 * 960), internalPPQ: 960 }, tempoMap, tracks: out };
}
export const derivedOf = (ast: UnifiedProjectAST, extra: Partial<Derived> = {}): Derived =>
  ({ index: buildIndex(ast.tracks, ast.meta.totalDurationSeconds), brightness: Object.fromEntries(ast.tracks.map((t) => [t.id, { ...DEFAULT_BRIGHTNESS }])), ...extra });

/** Ctx giả ghi mọi lệnh vẽ thành chuỗi (số làm tròn 4 chữ số). */
export function recCtx() {
  const log: string[] = []; const st: Record<string, unknown> = { globalAlpha: 1, fillStyle: '', strokeStyle: '', lineWidth: 1, shadowColor: '', shadowBlur: 0 };
  const f = (n: unknown) => (typeof n === 'number' ? Number(n.toFixed(4)) : n);
  const ctx: any = new Proxy({}, {
    get: (_, k: string) => (k in st ? st[k] : (...a: unknown[]) => { log.push(`${k}(${a.map(f).join(',')})`); }),
    set: (_, k: string, v) => { st[k] = v; log.push(`${k}=${f(v)}`); return true; },
  });
  return { ctx, log };
}
