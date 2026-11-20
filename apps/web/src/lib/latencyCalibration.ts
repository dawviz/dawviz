// Hiệu chỉnh độ trễ thiết bị bằng cách gõ theo nhịp (T-82). Hàm thuần: không đọc đồng hồ, không biết Web Audio.
//
// Bài đo: 110 BPM, nhịp 4/4, 4 ô đo (không có ô khởi động). Mỗi ô: kick – kick – tiếng phách 3 (âm sắc snare) – lặng; người dùng gõ vào PHÁCH 3.
// Mỗi lần gõ được quy về "giờ nghe được" trên trục AudioContext (cùng trục `heardContextTime` của đồng hồ chủ), nên
//   lệch = giờ-nghe-được-lúc-gõ − giờ-lên-lịch-của-snare.
// Dương: ứng dụng tin rằng mẫu đang nghe muộn hơn thực tế người dùng cảm nhận → hình đi trước tiếng → cần TRỪ độ lệch này khỏi giờ nghe được.
// Lệch gồm phần độ trễ thiết bị mà trình duyệt không báo, độ trễ của bàn phím/chuột, và thói quen gõ sớm/muộn của người gõ;
// ba phần này không tách riêng được nên kết quả là ước lượng; người dùng chỉnh tay thêm được (xem hồ sơ).

export const CAL = Object.freeze({
  bpm: 110, beatsPerBar: 4, warmupBars: 0, measuredBars: 4,
  /** Một lần gõ chỉ tính cho phách 3 nếu nằm trong [mốc − 250 ms, mốc + 450 ms]. */
  windowBeforeMs: 250, windowAfterMs: 450,
  /** Cần ít nhất ngần này lần đo hợp lệ (trên 4). */
  minValid: 3,
  /** Chênh giữa lần đo lớn nhất và nhỏ nhất vượt ngưỡng này (ms) thì cảnh báo không ổn định. */
  warnSpreadMs: 30,
});
export const BEAT_SEC = 60 / CAL.bpm;
export const BAR_SEC = BEAT_SEC * CAL.beatsPerBar;
/** Độ lệch thiết bị kẹp trong ±500 ms (cùng mức trần của độ trễ ước lượng ở masterClock.ts). */
export const DEVICE_OFFSET_LIMIT_MS = 500;
export const clampDeviceOffset = (ms: number): number => (Number.isFinite(ms) ? Math.round(Math.min(DEVICE_OFFSET_LIMIT_MS, Math.max(-DEVICE_OFFSET_LIMIT_MS, ms))) : 0);

export type ClickKind = 'kick' | 'snare';
export interface ClickEvent {
  /** Giờ AudioContext (giây) của tiếng này. */
  time: number; kind: ClickKind;
  /** Chỉ số ô (0 = ô khởi động) và phách (0–3) trong ô. */
  bar: number; beat: number;
  /** Phách 3 của ô đo: lần gõ vào đây được tính. */
  measured: boolean;
}

/** Lịch phát từ giờ `start` (giây): kick ở phách 1, 2; tiếng snare ở phách 3 (mốc đo); phách 4 lặng. Có `warmupBars > 0` thì các ô đầu có đủ tiếng nhưng không tính (hiện đặt 0). */
export function buildSchedule(start: number): { events: ClickEvent[]; snares: number[]; end: number } {
  const events: ClickEvent[] = [], snares: number[] = [];
  const bars = CAL.warmupBars + CAL.measuredBars;
  for (let bar = 0; bar < bars; bar++) {
    for (const [beat, kind] of [[0, 'kick'], [1, 'kick'], [2, 'snare']] as const) {
      const time = start + bar * BAR_SEC + beat * BEAT_SEC, measured = kind === 'snare' && bar >= CAL.warmupBars;
      events.push({ time, kind, bar, beat, measured });
      if (measured) snares.push(time);
    }
  }
  return { events, snares, end: start + bars * BAR_SEC };
}

/**
 * Với mỗi snare đo, chọn lần gõ gần nó nhất trong cửa sổ và trả độ lệch (ms) = gõ − snare; không có thì null.
 * Một lần gõ chỉ dùng cho một snare. Người dùng gõ thêm theo kick cũng được: lần gõ ngoài cửa sổ bị bỏ qua.
 * `taps` và `snares` cùng đơn vị giây trên trục giờ nghe được.
 */
export function matchTaps(snares: readonly number[], taps: readonly number[]): (number | null)[] {
  const used = new Set<number>();
  return snares.map((s) => {
    let best = -1, bestAbs = Infinity;
    taps.forEach((t, i) => {
      if (used.has(i)) return;
      const d = (t - s) * 1000;
      if (d < -CAL.windowBeforeMs || d > CAL.windowAfterMs) return;
      if (Math.abs(d) < bestAbs) { bestAbs = Math.abs(d); best = i; }
    });
    if (best < 0) return null;
    used.add(best);
    return Math.round((taps[best] - s) * 1e6) / 1e3; // ms, làm tròn 1 µs để tránh nhiễu dấu phẩy động
  });
}

export const median = (xs: readonly number[]): number => {
  const a = [...xs].sort((p, q) => p - q), n = a.length;
  return n === 0 ? NaN : n % 2 ? a[(n - 1) / 2] : (a[n / 2 - 1] + a[n / 2]) / 2;
};

export type CalibrationStatus = 'ok' | 'unstable' | 'tooFew';
export interface CalibrationResult {
  status: CalibrationStatus;
  /** Số lần đo hợp lệ trên tổng số ô đo. */
  valid: number; total: number;
  /** Trung vị các lần hợp lệ (ms, đã kẹp và làm tròn); null khi không đủ số lần (`tooFew`). */
  offsetMs: number | null;
  /** Chênh giữa lần đo lớn nhất và nhỏ nhất (ms); 0 nếu dưới 2 lần. */
  spreadMs: number;
  /** Từng lần đo (null = không gõ trong cửa sổ). */
  offsets: (number | null)[];
}
export function summarize(offsets: readonly (number | null)[]): CalibrationResult {
  const ok = offsets.filter((x): x is number => x !== null);
  const spread = ok.length > 1 ? Math.max(...ok) - Math.min(...ok) : 0;
  const base = { valid: ok.length, total: offsets.length, spreadMs: Math.round(spread * 10) / 10, offsets: [...offsets] };
  if (ok.length < CAL.minValid) return { ...base, status: 'tooFew', offsetMs: null };
  return { ...base, status: spread > CAL.warnSpreadMs ? 'unstable' : 'ok', offsetMs: clampDeviceOffset(median(ok)) };
}

// ───────────────────────────── hồ sơ thiết bị ─────────────────────────────
/** Hồ sơ độ trễ của một thiết bị (tai nghe, loa, giao diện âm thanh…). Chỉ có hiệu lực ở Xem trước trên máy này; không vào preset, Project Pack hay đường xuất. */
export interface DeviceProfile { id: string; name: string; offsetMs: number }
export interface DevicePrefs { profiles: DeviceProfile[]; activeId: string | null }
export const MAX_PROFILES = 16;
export const MAX_PROFILE_NAME = 40;
export const DEFAULT_DEVICE_PREFS: DevicePrefs = { profiles: [], activeId: null };

export const normalizeProfileName = (s: string): string => s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX_PROFILE_NAME);
const nameKey = (s: string) => normalizeProfileName(s).toLocaleLowerCase();

/** Đọc tuỳ chọn từ localStorage: bỏ mục sai, tên trùng, quá số lượng; `activeId` không còn hồ sơ thì về null. */
export function sanitizeDevicePrefs(raw: unknown): DevicePrefs {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as { profiles?: unknown; activeId?: unknown };
  const profiles: DeviceProfile[] = [], ids = new Set<string>(), names = new Set<string>();
  for (const p of Array.isArray(r.profiles) ? r.profiles : []) {
    if (profiles.length >= MAX_PROFILES) break;
    const q = (typeof p === 'object' && p !== null ? p : {}) as Partial<DeviceProfile>;
    const name = typeof q.name === 'string' ? normalizeProfileName(q.name) : '';
    if (typeof q.id !== 'string' || !q.id || q.id.length > 64 || ids.has(q.id) || !name || names.has(nameKey(name)) || typeof q.offsetMs !== 'number' || !Number.isFinite(q.offsetMs)) continue;
    ids.add(q.id); names.add(nameKey(name)); profiles.push({ id: q.id, name, offsetMs: clampDeviceOffset(q.offsetMs) });
  }
  return { profiles, activeId: typeof r.activeId === 'string' && ids.has(r.activeId) ? r.activeId : null };
}
/** Độ lệch đang áp (ms): của hồ sơ đang chọn, không chọn thì 0 (chỉ dùng độ trễ trình duyệt báo). */
export const activeOffsetMs = (p: DevicePrefs): number => p.profiles.find((x) => x.id === p.activeId)?.offsetMs ?? 0;

/** Tên chưa dùng: `base`, rồi `base 2`, `base 3`… (không phân biệt hoa/thường). */
export function uniqueProfileName(profiles: readonly DeviceProfile[], base: string, exceptId?: string): string {
  const taken = new Set(profiles.filter((p) => p.id !== exceptId).map((p) => nameKey(p.name)));
  const b = normalizeProfileName(base) || 'Device';
  let n = 1, out = b;
  while (taken.has(nameKey(out))) { n++; out = normalizeProfileName(`${b.slice(0, MAX_PROFILE_NAME - String(n).length - 1)} ${n}`); }
  return out;
}
/** Thêm hồ sơ (tên được làm duy nhất); đầy thì trả null. Hồ sơ mới thành hồ sơ đang chọn. */
export function addProfile(p: DevicePrefs, name: string, offsetMs: number, id: string): DevicePrefs | null {
  if (p.profiles.length >= MAX_PROFILES) return null;
  const prof = { id, name: uniqueProfileName(p.profiles, name), offsetMs: clampDeviceOffset(offsetMs) };
  return { profiles: [...p.profiles, prof], activeId: id };
}
export const updateProfile = (p: DevicePrefs, id: string, patch: Partial<Pick<DeviceProfile, 'name' | 'offsetMs'>>): DevicePrefs => ({
  ...p, profiles: p.profiles.map((x) => (x.id !== id ? x : {
    ...x, ...(patch.name !== undefined ? { name: uniqueProfileName(p.profiles, patch.name, id) } : {}), ...(patch.offsetMs !== undefined ? { offsetMs: clampDeviceOffset(patch.offsetMs) } : {}),
  })),
});
export const removeProfile = (p: DevicePrefs, id: string): DevicePrefs => ({ profiles: p.profiles.filter((x) => x.id !== id), activeId: p.activeId === id ? null : p.activeId });

// ── tệp JSON của một hồ sơ (chia sẻ giữa máy) ──
export const PROFILE_FORMAT = 'dawviz-device-latency';
export const MAX_PROFILE_FILE_BYTES = 4096;
export const serializeProfile = (p: Pick<DeviceProfile, 'name' | 'offsetMs'>): string =>
  JSON.stringify({ format: PROFILE_FORMAT, version: 1, name: normalizeProfileName(p.name), offsetMs: clampDeviceOffset(p.offsetMs) }, null, 2) + '\n';
export type ProfileParse = { ok: true; name: string; offsetMs: number } | { ok: false; reason: 'tooLarge' | 'json' | 'format' | 'version' | 'value' };
/** Đọc tệp hồ sơ: kiểm cỡ TRƯỚC khi parse, JSON.parse (không eval), kiểm định dạng/phiên bản/giá trị; không đọc trường lạ. */
export function parseProfile(text: string): ProfileParse {
  if (text.length > MAX_PROFILE_FILE_BYTES) return { ok: false, reason: 'tooLarge' };
  let raw: unknown;
  try { raw = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text); } catch { return { ok: false, reason: 'json' }; }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ok: false, reason: 'format' };
  const o = raw as Record<string, unknown>;
  if (o.format !== PROFILE_FORMAT) return { ok: false, reason: 'format' };
  if (o.version !== 1) return { ok: false, reason: 'version' };
  const name = typeof o.name === 'string' ? normalizeProfileName(o.name) : '';
  if (!name || typeof o.offsetMs !== 'number' || !Number.isFinite(o.offsetMs) || Math.abs(o.offsetMs) > DEVICE_OFFSET_LIMIT_MS) return { ok: false, reason: 'value' };
  return { ok: true, name, offsetMs: Math.round(o.offsetMs) };
}
