// Đường tự động hoá (automation) của track: âm lượng, pan, mute. Dùng cho hiệu ứng như "track sáng hơn khi âm lượng to hơn" (SRS REQ-GRAPHICS-06).
//
// Lane = { kind: 'volume'|'pan'|'mute', points: [{ tick, timeSeconds, value, shape, tension? }] } (đã sắp theo tick)
//   volume: value = hệ số khuếch đại tuyến tính (1 = 0 dB), nội suy trong không gian "fader" p = gain^0.25 (xấp xỉ khớp 2 số đo trong Reaper: sai số ≤ 0,3 dB) [VERIFY]
//   pan   : value trong [-1, 1] như file ghi; chiều âm/dương của từng DAW chưa kiểm [VERIFY]
//   mute  : value thô như file ghi; nghĩa của giá trị cao/thấp chưa kiểm [VERIFY]
// shape (Reaper): 0 tuyến tính, 1 bậc thang (giữ), 2 chậm đầu-cuối, 3 nhanh đầu, 4 nhanh cuối, 5 bezier (xấp xỉ bằng đường cong mượt theo tension).

export const FADER_EXP = 0.25;
export const gainToDb = (g) => (g > 1e-6 ? 20 * Math.log10(g) : -120);
export const dbToGain = (db) => 10 ** (db / 20);
const smooth = (a) => a * a * (3 - 2 * a);

/** Hệ số dạng đường cong (0..1) cho đoạn bắt đầu bằng điểm có `shape`/`tension`. */
export function shapeCurve(a, shape, tension = 0) {
  switch (shape) {
    case 1: return 0;
    case 2: return smooth(a);
    case 3: return 1 - (1 - a) * (1 - a);
    case 4: return a * a;
    case 5: { const k = Math.min(1, Math.abs(tension) || 0.5); return a + (smooth(a) - a) * k; }
    default: return a;
  }
}

/** Giá trị của lane tại `tick` (miền thô của lane: gain tuyến tính / pan / mute). Trước điểm đầu và sau điểm cuối giữ nguyên giá trị biên. */
export function sampleLane(lane, tick) {
  const p = lane?.points;
  if (!p || !p.length) return undefined;
  if (tick <= p[0].tick) return p[0].value;
  const last = p[p.length - 1];
  if (tick >= last.tick) return last.value;
  let lo = 0, hi = p.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (p[mid].tick <= tick) lo = mid; else hi = mid; }
  const a = p[lo], b = p[hi];
  if (a.shape === 1) return a.value;
  const t = shapeCurve((tick - a.tick) / (b.tick - a.tick), a.shape, a.tension);
  if (lane.kind === 'volume') { // nội suy trong không gian fader
    const fa = a.value ** FADER_EXP, fb = b.value ** FADER_EXP;
    return (fa + (fb - fa) * t) ** (1 / FADER_EXP);
  }
  return a.value + (b.value - a.value) * t;
}

/**
 * Đổi âm lượng (gain tuyến tính) thành độ sáng 0..1 để ứng dụng dùng: dB ≤ floorDb → 0, ≥ ceilDb → 1, tuyến tính theo dB ở giữa.
 * Mặc định floor −36 dB, ceil 0 dB; người dùng có thể đổi (và đảo chiều bằng minBrightness/maxBrightness ở phía ứng dụng).
 */
export function volumeToUnit(gain, { floorDb = -36, ceilDb = 0 } = {}) {
  const db = gainToDb(gain);
  return Math.min(1, Math.max(0, (db - floorDb) / (ceilDb - floorDb)));
}
