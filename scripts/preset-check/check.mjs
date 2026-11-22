// Kiểm preset cộng đồng (T-31, EXPRESSIONS §6.2, COMMUNITY-CONTENT §3): hàm thuần `checkPreset` + CLI. Không cần mạng, không có secret: chạy được trong CI
// của repo cộng đồng ở chế độ chỉ đọc. Kiểm JSON, cỡ tệp, tên tệp, giấy phép SPDX (danh sách cho phép), bộ đọc preset không cảnh báo, MỌI biểu thức
// hợp lệ (@dawviz/expr), không có URL ngoài, và dựng thử N khung bằng Render Core để đo ngân sách bước biểu thức và thời gian (cảnh báo, không chặn).
// Gói .dawviz-preset.zip và tài nguyên (SVG, ảnh) kiểm ở bước T-24/T-21.
import path from 'node:path';
import { sanitizeScene, sanitizeStyle, DEFAULT_NOTE_STYLE, layoutFrame, buildIndex, buildSceneHud, compileExpr, animatablePaths, SceneError } from '../../packages/render-core/src/index.ts';

/** Giấy phép SPDX được nhận (COMMUNITY-CONTENT §3–4): phân phối lại được. */
export const ALLOWED_LICENSES = Object.freeze(['CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'MIT', 'Apache-2.0', 'OFL-1.1', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC']);
export const LIMITS = Object.freeze({ noteStyleBytes: 16 * 1024, sceneBytes: 1024 * 1024, frames: 60, frameMsWarn: 50 });
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*\.json$/;

/** AST tổng hợp nhỏ, tất định (4 track, 16 s) để dựng thử khung. */
export function sampleAst() {
  const tracks = [0, 1, 2, 3].map((k) => {
    const notes = [];
    for (let i = 0; i < 64; i++) { const st = i * 0.25 + k * 0.05, d = 0.2; notes.push({ id: `n${k}-${i}`, pitch: 48 + ((i * 7 + k * 5) % 36), pitchName: '', startTick: 0, durationTick: 0, endTick: 0, startTimeSeconds: st, durationSeconds: d, endTimeSeconds: st + d, velocity: 60 + ((i * 13) % 60) }); }
    return { id: `t${k}`, index: k, name: `Track ${k + 1}`, color: ['#4488ff', '#ff8844', '#44cc88', '#cc44aa'][k], isMuted: false, isVisible: true, notes, pitchRange: { min: 48, max: 84 } };
  });
  return { meta: { title: 'Preset check', totalDurationSeconds: 16, totalTicks: 0, internalPPQ: 960 }, tempoMap: [{ tick: 0, timeSeconds: 0, bpm: 120, timeSigNumerator: 4, timeSigDenominator: 4 }], tracks, chordTimeline: [] };
}

/** Mọi URL trong chuỗi của tài liệu (preset không được trỏ ra ngoài). */
function urls(v, out = []) {
  if (typeof v === 'string') { if (/\b(?:https?|ftp|data|javascript):/i.test(v)) out.push(v.slice(0, 80)); }
  else if (Array.isArray(v)) v.forEach((x) => urls(x, out));
  else if (v && typeof v === 'object') Object.values(v).forEach((x) => urls(x, out));
  return out;
}

/**
 * Kiểm một tệp preset. `opts.community` = bắt buộc `license` (preset dựng sẵn của ứng dụng không cần). `opts.now` = đồng hồ (ms) để đo thời gian khung.
 * Trả `{ ok, kind, errors[], warnings[], stats }`; lỗi chặn merge, cảnh báo để người duyệt xem.
 */
export function checkPreset(name, bytes, opts = {}) {
  const errors = [], warnings = [], stats = {};
  const base = path.basename(name);
  if (opts.community && !SLUG.test(base)) errors.push(`tên tệp "${base}" phải là slug chữ thường a-z0-9- và đuôi .json`);
  let raw;
  try { raw = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)); } catch (e) { return { ok: false, kind: 'unknown', errors: [`không phải JSON UTF-8 hợp lệ: ${e.message}`], warnings, stats }; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, kind: 'unknown', errors: ['preset phải là đối tượng JSON'], warnings, stats };
  const kind = raw.kind === 'note-style' ? 'note-style' : 'scene';
  const max = kind === 'note-style' ? LIMITS.noteStyleBytes : LIMITS.sceneBytes;
  if (bytes.length > max) errors.push(`tệp ${bytes.length} byte, vượt ${max}`);
  if (opts.community || raw.license !== undefined) {
    if (typeof raw.license !== 'string') errors.push('thiếu trường "license" (SPDX)');
    else if (!ALLOWED_LICENSES.includes(raw.license)) errors.push(`giấy phép "${raw.license}" không nằm trong danh sách cho phép: ${ALLOWED_LICENSES.join(', ')}`);
  }
  for (const u of urls(raw)) errors.push(`có URL ngoài: ${u}`);

  if (kind === 'note-style') {
    const style = raw.style && typeof raw.style === 'object' ? raw.style : null;
    if (!style) errors.push('thiếu "style"');
    else {
      const clean = sanitizeStyle({ ...DEFAULT_NOTE_STYLE, ...style });
      for (const [k, v] of Object.entries(style)) {
        if (!(k in DEFAULT_NOTE_STYLE)) warnings.push(`style.${k}: trường lạ, bị bỏ khi nạp`);
        else if (JSON.stringify(clean[k]) !== JSON.stringify(v)) warnings.push(`style.${k}: ${JSON.stringify(v)} ngoài miền, nạp thành ${JSON.stringify(clean[k])}`);
      }
    }
    return { ok: errors.length === 0, kind, errors, warnings, stats };
  }

  let scene;
  try { const r = sanitizeScene(raw); scene = r.scene; for (const w of r.warnings) (w.code === 'WARN_PRESET_UNSAFE_KEY' ? errors : warnings).push(`${w.code} ${w.details.path}: ${w.message}`); }
  catch (e) { return { ok: false, kind, errors: [...errors, e instanceof SceneError ? `${e.code}: ${e.message}` : String(e)], warnings, stats }; }
  // Biểu thức: bộ đọc preset đã bỏ biểu thức lỗi (kèm cảnh báo); ở đây biểu thức lỗi là LỖI chặn merge.
  let exprs = 0;
  (Array.isArray(raw.widgets) ? raw.widgets : []).forEach((w, i) => {
    if (!w || typeof w !== 'object' || !w.animate || typeof w.animate !== 'object') return;
    const kinds = animatablePaths(w.type);
    for (const [p, a] of Object.entries(w.animate)) {
      if (!a || typeof a.expr !== 'string') continue;
      exprs++;
      try { compileExpr(a.expr, kinds.get(p) ?? 'number'); } catch (e) { errors.push(`widgets[${i}].animate.${p}: biểu thức lỗi ${e.code ?? ''} ở ký tự ${e.pos ?? 0}: ${e.message}`); }
    }
  });
  stats.widgets = scene.widgets.length; stats.expressions = exprs;
  // Dựng thử khung: ngân sách bước biểu thức (tất định) và thời gian (chỉ cảnh báo, phụ thuộc máy CI).
  const ast = sampleAst(), index = buildIndex(ast.tracks, ast.meta.totalDurationSeconds);
  const issues = new Map();
  const derived = { index, brightness: {}, hud: buildSceneHud(scene, ast, index), fontsReady: true, onExprIssue: (x) => issues.set(`${x.widgetId}.${x.path}:${x.code}`, (issues.get(`${x.widgetId}.${x.path}:${x.code}`) ?? 0) + 1) };
  const now = opts.now, frames = opts.frames ?? LIMITS.frames;
  let worst = 0;
  for (let f = 0; f < frames; f++) {
    const t = (f / frames) * ast.meta.totalDurationSeconds, a = now ? now() : 0;
    try { layoutFrame(scene, derived, ast, t); } catch (e) { errors.push(`dựng khung t=${t.toFixed(2)} ném lỗi: ${e.message}`); break; }
    if (now) worst = Math.max(worst, now() - a);
  }
  for (const [k, n] of issues) (k.endsWith('ERR_EXPR_BUDGET') ? errors : warnings).push(`biểu thức ${k} (${n}/${frames} khung)`);
  if (now) { stats.worstFrameMs = Math.round(worst * 10) / 10; if (worst > LIMITS.frameMsWarn) warnings.push(`khung chậm nhất ${stats.worstFrameMs} ms (> ${LIMITS.frameMsWarn} ms trên máy CI)`); }
  return { ok: errors.length === 0, kind, errors, warnings, stats };
}
