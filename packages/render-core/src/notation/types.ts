// NotationLayout (D-63, Technical Design §5.11): bản nhạc đã dàn trang, dữ liệu thuần (JSON/structured clone được).
// Engraver (VexFlow, ở apps/web) sinh ra một lần; Render Core chỉ đọc để vẽ theo t. Toạ độ: đơn vị VexFlow (10 = một khoảng dòng kẻ).

/** Lệnh đường vẽ nén thành mảng số: [op, ...args]* với op 0 = M x y, 1 = L x y, 2 = C x1 y1 x2 y2 x y, 3 = Q x1 y1 x y, 4 = Z, 5 = A x y r a0 a1 ccw. */
export type PathData = number[];
export const PATH_ARGS = [2, 2, 6, 4, 0, 5] as const;

/** Một phần tử vẽ. `o` = chỉ số chủ (nốt) trong `owners`, −1 = phần tĩnh (khuông, khoá, móc nối…).
 *  k = 0 tô đường, 1 nét đường, 2 dãy glyph (g = [glyph, x, y, size]* với glyph là chỉ số trong `glyphs`).
 *  `w` (T-132): phần tĩnh gắn với một nốt về thời gian (gạch nối móc, dấu nối, ngoặc liên ba): chỉ số chủ quyết định lúc viết/xoá; màu vẫn như phần tĩnh. */
export interface NotationItem { o: number; k: 0 | 1 | 2; d?: PathData; lw?: number; cap?: 0 | 1 | 2; g?: number[]; w?: number }
/** Chủ của một nhóm phần tử: một hợp âm/nốt của bản nhạc, nối về nốt AST để sáng đúng lúc (giây thật, không lượng tử). */
export interface NotationOwner {
  notes: string[];
  /** Giây bắt đầu/kết thúc thật (min/max của các nốt). */
  on: number; off: number;
  /** false = đoạn nối tiếp sau dấu nối (không nhấp phóng to khi vào). */
  head: boolean;
  /** T-132: dấu lặng (`notes` rỗng). Vẽ như phần tĩnh (không sáng, không đổi màu); chỉ dùng để viết/xoá đúng lúc. */
  rest?: boolean;
  /** Tâm phóng to (đơn vị trang). */
  cx: number; cy: number;
  /** Chỉ số track (ProjectTrack.index) của nốt đầu tiên: cho màu theo track. */
  track: number;
}
/** Một hàng (system) của trang: phạm vi dọc và mốc thời gian → x (đơn điệu) cho vạch phát. */
export interface NotationSystem { y0: number; y1: number; start: number; end: number; at: number[]; ax: number[] }
export interface NotationPage { start: number; end: number; height: number; firstBar: number; lastBar: number; items: NotationItem[]; systems: NotationSystem[] }
export interface NotationWarning { code: string; message: string; details?: Record<string, unknown> }
export interface NotationLayout {
  version: 1;
  /** Bề rộng trang (đơn vị VexFlow) và chiều cao trang lớn nhất (để tỉ lệ ổn định khi lật trang). */
  width: number; maxHeight: number;
  pages: NotationPage[];
  owners: NotationOwner[];
  /** Đường viền glyph, đơn vị 1 em, gốc ở điểm đặt chữ, y xuống dưới. */
  glyphs: PathData[];
  key: { fifths: number; mode: 'major' | 'minor'; confidence: number; estimated: boolean };
  stats: { measures: number; notes: number; exactOnsets: number; meanOnsetErr: number; engraveMs: number };
  warnings: NotationWarning[];
}

/** Trang chứa thời điểm t (tìm nhị phân theo `start`). */
export function pageIndexAt(layout: NotationLayout, t: number): number {
  const p = layout.pages;
  if (!p.length) return -1;
  let lo = 0, hi = p.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (p[m].start <= t) lo = m; else hi = m - 1; }
  return lo;
}

const prefix = new WeakMap<NotationSystem, Float64Array>();
/** Tích phân của systemX từ at[0] tới t (đơn vị trang × giây); ngoài khoảng mốc x giữ nguyên ở hai đầu. */
function systemXIntegral(s: NotationSystem, t: number): number {
  const at = s.at, ax = s.ax, n = at.length;
  if (!n) return 0;
  let P = prefix.get(s);
  if (!P) { P = new Float64Array(n); for (let i = 1; i < n; i++) P[i] = P[i - 1] + (at[i] - at[i - 1]) * (ax[i] + ax[i - 1]) / 2; prefix.set(s, P); }
  if (t <= at[0]) return (t - at[0]) * ax[0];
  if (t >= at[n - 1]) return P[n - 1] + (t - at[n - 1]) * ax[n - 1];
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (at[m] <= t) lo = m; else hi = m; }
  return P[lo] + (t - at[lo]) * (ax[lo] + systemX(s, t)) / 2;
}
/**
 * x trung bình của vạch phát trong cửa sổ [t − h, t + h] (tính đúng bằng tích phân, không lấy mẫu). Dùng cho chế độ Cuộn: systemX đi theo từng nốt nên
 * tốc độ cuộn nhảy vọt ở vạch nhịp và chỗ nốt thưa (đo trên bài thật: 100 → 2100 đơn vị/giây); làm trơn thì tốc độ liên tục, nốt tới vạch phát lệch rất ít.
 */
export function systemXSmooth(s: NotationSystem, t: number, h: number): number {
  if (!(h > 0)) return systemX(s, t);
  return (systemXIntegral(s, t + h) - systemXIntegral(s, t - h)) / (2 * h);
}

const extents = new WeakMap<object, readonly [number, number]>();
/** Khoảng dọc thật của phần tử trong trang (đơn vị trang): nốt có dòng kẻ phụ, móc, số ô nhịp… có thể vượt ra ngoài [0, page.height]. */
function itemSpanY(it: NotationItem, glyphs: readonly PathData[]): readonly [number, number] {
  let s = extents.get(it);
  if (s) return s;
  let y0 = Infinity, y1 = -Infinity;
  const pathY = (d: PathData, oy: number, k: number) => {
    for (let i = 0; i < d.length;) {
      const op = d[i], n = PATH_ARGS[op] ?? 0;
      if (op === 5) { y0 = Math.min(y0, oy + (d[i + 2] - d[i + 3]) * k); y1 = Math.max(y1, oy + (d[i + 2] + d[i + 3]) * k); }
      else for (let j = 2; j <= n; j += 2) { const y = oy + d[i + j] * k; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      i += 1 + n;
    }
  };
  if (it.k === 2) { const g = it.g ?? []; for (let j = 0; j + 3 < g.length; j += 4) pathY(glyphs[g[j]] ?? [], g[j + 2], g[j + 3]); }
  else pathY(it.d ?? [], 0, 1);
  const pad = it.k === 1 ? (it.lw ?? 1) / 2 + 1 : 1;
  s = y0 <= y1 ? [y0 - pad, y1 + pad] : [Infinity, -Infinity];
  extents.set(it, s);
  return s;
}
/** Khoảng dọc của cả bản dựng (mọi trang), không hẹp hơn [0, maxHeight]. Đệm theo layout. */
export function layoutExtentY(lay: NotationLayout): readonly [number, number] {
  let s = extents.get(lay);
  if (s) return s;
  let y0 = 0, y1 = lay.maxHeight;
  for (const p of lay.pages) for (const it of p.items) { const [a, b] = itemSpanY(it, lay.glyphs); if (a < y0) y0 = a; if (b > y1) y1 = b; }
  s = [y0, y1];
  extents.set(lay, s);
  return s;
}

/** x của vạch phát trong một hàng tại t (nội suy tuyến tính giữa các mốc). */
export function systemX(s: NotationSystem, t: number): number {
  const at = s.at, ax = s.ax, n = at.length;
  if (!n) return 0;
  if (t <= at[0]) return ax[0];
  if (t >= at[n - 1]) return ax[n - 1];
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (at[m] <= t) lo = m; else hi = m; }
  const d = at[hi] - at[lo];
  return d > 0 ? ax[lo] + (ax[hi] - ax[lo]) * ((t - at[lo]) / d) : ax[hi];
}
