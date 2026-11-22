// Trang đo thời gian khung hình (T-27, SPIKE-5). Tách layoutFrame (tính toán thuần) với renderFrame (tính + vẽ Canvas 2D) và đồng bộ GPU (getImageData 1 px).
import {
  buildIndex, buildSceneHud, layoutFrame, renderFrame, defaultScene, createWidget, ADDABLE_WIDGETS, DEFAULT_BRIGHTNESS,
  type SceneDocument, type Derived, type WidgetSpec,
} from '../../packages/render-core/src/index.ts';
import { analyzeMono } from '../../packages/render-core/src/audioFeatures.ts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ast = any;
const q = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const stats = (a: number[]) => ({ p50: +q(a, 0.5).toFixed(2), p95: +q(a, 0.95).toFixed(2), p99: +q(a, 0.99).toFixed(2), max: +Math.max(...a).toFixed(2), over16: a.filter((x) => x > 16.67).length, n: a.length });

function replicate(ast: Ast, times: number): Ast {
  const tracks = [];
  for (let k = 0; k < times; k++) for (const t of ast.tracks) tracks.push({ ...t, id: `${t.id}-r${k}`, index: tracks.length, notes: t.notes.map((n: any, j: number) => ({ ...n, id: `${n.id}-r${k}-${j}` })) });
  return { ...ast, tracks };
}

function scenes(ast: Ast): Record<string, SceneDocument> {
  const base = () => defaultScene('16:9');
  const pr = (s: SceneDocument) => s.widgets[0] as WidgetSpec<any>;
  const glow = base(); pr(glow).properties.noteStyle.base.glow = 0.8; pr(glow).properties.noteStyle.base.glowActiveOnly = false;
  const parts = (max: number, perNote: number) => { const s = base(); const p = createWidget(s, 'PARTICLES'); p.layout = { ...p.layout, x: 0, y: 0, width: 1920, height: 1080 }; Object.assign(p.properties as any, { maxParticles: max, perNote, originX: 'NOTE' }); s.widgets.push(p); return s; };
  const many = base();
  for (const ty of ADDABLE_WIDGETS) { if (ty === 'NOTATION' || ty === 'PIANO_ROLL') continue; many.widgets.push(createWidget(many, ty)); }
  const manyX3 = base();
  for (let r = 0; r < 3; r++) for (const ty of ADDABLE_WIDGETS) { if (ty === 'NOTATION' || ty === 'PIANO_ROLL') continue; manyX3.widgets.push(createWidget(manyX3, ty)); }
  void ast;
  return { pianoRoll: base(), glow, particles1500: parts(1500, 6), particles5000: parts(5000, 20), allWidgets: many, allWidgetsX3: manyX3 };
}

/** Dữ liệu dẫn xuất như App/Export Worker dựng (một lần cho mỗi dự án × scene); trả kèm thời gian từng bước. */
function derivedFor(scene: SceneDocument, ast: Ast): { derived: Derived; indexMs: number; hudMs: number } {
  let a = performance.now();
  const index = buildIndex(ast.tracks, ast.meta.totalDurationSeconds);
  const indexMs = performance.now() - a; a = performance.now();
  const hud = buildSceneHud(scene, ast, index);
  const hudMs = performance.now() - a;
  return { derived: { index, brightness: Object.fromEntries(ast.tracks.map((t: any) => [t.id, { ...DEFAULT_BRIGHTNESS }])), hud, fontsReady: true }, indexMs: Math.round(indexMs), hudMs: Math.round(hudMs) };
}

async function runOne(name: string, ast: Ast, scene: SceneDocument, frames: number, t0: number) {
  const { derived, indexMs, hudMs } = derivedFor(scene, ast);
  const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 1080; document.body.replaceChildren(cv);
  const g = cv.getContext('2d')!;
  // khung đầu (đệm lười) rồi khởi động JIT
  const a0 = performance.now(); layoutFrame(scene, derived, ast, t0); const firstMs = Math.round(performance.now() - a0);
  for (let i = 0; i < 30; i++) renderFrame(scene, derived, ast, t0 + i / 60, { ctx: g as any, width: 1920, height: 1080 }, 1);
  const lay: number[] = [], full: number[] = [], sync: number[] = [], prims: number[] = [];
  for (let i = 0; i < frames; i++) { const t = t0 + i / 60; const a = performance.now(); const out = layoutFrame(scene, derived, ast, t); lay.push(performance.now() - a); prims.push(out.reduce((s, w) => s + w.prims.length, 0)); }
  for (let i = 0; i < frames; i++) { const t = t0 + i / 60; const a = performance.now(); renderFrame(scene, derived, ast, t, { ctx: g as any, width: 1920, height: 1080 }, 1); full.push(performance.now() - a); }
  for (let i = 0; i < frames; i++) { const t = t0 + i / 60; const a = performance.now(); renderFrame(scene, derived, ast, t, { ctx: g as any, width: 1920, height: 1080 }, 1); g.getImageData(0, 0, 1, 1); sync.push(performance.now() - a); }
  return { name, indexMs, hudMs, firstMs, layout: stats(lay), render: stats(full), renderSync: stats(sync), primsAvg: Math.round(prims.reduce((a, b) => a + b, 0) / prims.length), primsMax: Math.max(...prims) };
}

async function main() {
  const p = new URLSearchParams(location.search);
  const file = p.get('ast')!, rep = +(p.get('rep') ?? '1'), only = p.get('only'), frames = +(p.get('frames') ?? '600'), t0 = +(p.get('t0') ?? '30');
  let ast: Ast = await (await fetch(file)).json();
  if (rep > 1) ast = replicate(ast, rep);
  const notes = ast.tracks.reduce((s: number, t: any) => s + t.notes.length, 0);
  const res: any[] = [];
  const sc = scenes(ast);
  for (const [k, s] of Object.entries(sc)) { if (only && !only.split(',').includes(k)) continue; res.push(await runOne(k, ast, s, frames, t0)); }
  let audio: any = null;
  if (p.get('audio')) {
    const sec = +p.get('audio')!, sr = 48000, n = sec * sr, mono = new Float32Array(n);
    for (let i = 0; i < n; i++) mono[i] = Math.sin(i * 0.031) * 0.5 + Math.sin(i * 0.0071 + (i % 997) * 1e-3) * 0.3;
    const a = performance.now(); analyzeMono(mono, sr); audio = { seconds: sec, analyzeMs: Math.round(performance.now() - a) };
  }
  (window as any).__result = { file, rep, notes, tracks: ast.tracks.length, res, audio };
}
main().catch((e) => { (window as any).__result = { error: String(e?.stack ?? e) }; });
