// Khoảng hiển thị theo thời gian của widget và phase của bài (T-81, SRS REQ-GRAPHICS-14). Hàm thuần, không phụ thuộc DOM/AST.
// Đơn vị: giây của dòng thời gian dự án (cùng `t` của renderFrame).

/** Một khoảng hiện: từ `from` tới `to` (giây); `to = null` = tới hết bài. */
export interface TimeRange { from: number; to: number | null }
/** Danh sách khoảng hiện + thời gian hiện dần/ẩn dần. Vắng ở widget = hiện suốt bài. Danh sách rỗng = không bao giờ hiện. */
export interface WidgetVisibility { ranges: TimeRange[]; fadeIn: number; fadeOut: number }
/** Một phase của bài: bắt đầu tại `start` giây, kéo dài tới phase kế (phase cuối: tới hết bài). */
export interface Phase { name: string; start: number }

export const MAX_RANGES = 32;
export const MAX_PHASES = 64;
export const MAX_PHASE_NAME = 60;
export const MAX_FADE = 30;

const smooth = (x: number) => { const c = Math.min(1, Math.max(0, x)); return c * c * (3 - 2 * c); };

/**
 * Độ đục (0..1) của widget tại `t`: lớn nhất trong các khoảng. Trong khoảng [from, to]: hiện dần trong `fadeIn` giây đầu,
 * ẩn dần trong `fadeOut` giây cuối (tổng hai thời gian vượt độ dài khoảng thì co theo tỉ lệ); đường cong làm mượt (smoothstep).
 * `to` là mốc cuối: tại `t >= to` đã ẩn hẳn; `fadeIn = 0` thì bật ngay tại `from`.
 */
export function visibilityAlpha(v: WidgetVisibility | undefined, t: number, duration: number): number {
  if (!v) return 1;
  let best = 0;
  for (const r of v.ranges) {
    const to = r.to ?? Math.max(duration, r.from);
    if (!(t >= r.from && t < to)) continue;
    const len = to - r.from, sum = v.fadeIn + v.fadeOut, k = sum > len && sum > 0 ? len / sum : 1;
    const fi = v.fadeIn * k, fo = v.fadeOut * k;
    const a = Math.min(fi > 0 ? smooth((t - r.from) / fi) : 1, fo > 0 ? smooth((to - t) / fo) : 1);
    if (a > best) best = a;
  }
  return best;
}

/** Phase đang diễn ra tại `t`: chỉ số trong danh sách đã sắp theo `start`, hoặc −1 khi chưa tới phase đầu. */
export function phaseIndexAt(phases: readonly Phase[] | undefined, t: number): number {
  if (!phases?.length) return -1;
  let lo = 0, hi = phases.length - 1, r = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (phases[m].start <= t) { r = m; lo = m + 1; } else hi = m - 1; }
  return r;
}

export interface PhaseInfo {
  /** Tên phase đang diễn ra ('' khi chưa tới phase đầu hoặc không có phase). */
  name: string;
  /** Tên phase kế tiếp ('' nếu là phase cuối). */
  next: string;
  /** Thời gian đã qua trong phase (giây). Trước phase đầu: 0. */
  elapsed: number;
  /** Thời gian còn tới khi phase kế bắt đầu (phase cuối: tới hết bài; trước phase đầu: tới khi phase đầu bắt đầu). */
  remaining: number;
  /** Chỉ số phase (1 = phase đầu), 0 khi chưa tới. */
  index: number;
}
export function phaseInfoAt(phases: readonly Phase[] | undefined, t: number, duration: number): PhaseInfo {
  const i = phaseIndexAt(phases, t);
  if (!phases?.length) return { name: '', next: '', elapsed: 0, remaining: Math.max(0, duration - t), index: 0 };
  if (i < 0) return { name: '', next: phases[0].name, elapsed: 0, remaining: Math.max(0, phases[0].start - t), index: 0 };
  const nx = phases[i + 1];
  return { name: phases[i].name, next: nx?.name ?? '', elapsed: Math.max(0, t - phases[i].start), remaining: Math.max(0, (nx ? nx.start : duration) - t), index: i + 1 };
}
