// Đường tự động hoá (automation) của track: âm lượng, pan, mute. Dùng cho hiệu ứng như "track sáng hơn khi âm lượng to hơn" (SRS REQ-GRAPHICS-06).
//
// Lane = { kind: 'volume'|'pan'|'mute', points: [{ tick, timeSeconds, value, shape, tension? }] } (đã sắp theo tick)
//   volume: value = hệ số khuếch đại tuyến tính (1 = 0 dB), nội suy trong không gian "fader" p = gain^0.22 (Reaper: fader = gain^p; p = 0,22 khớp các số đo bezier/shape, sai số ≤ 1,1 dB)
//   pan   : value trong [-1, 1] như file ghi; chiều âm/dương của từng DAW chưa kiểm [VERIFY]
//   mute  : value thô như file ghi; nghĩa của giá trị cao/thấp chưa kiểm [VERIFY]
// shape (Reaper): 0 tuyến tính, 1 bậc thang (giữ), 2 chậm đầu-cuối, 3 nhanh đầu, 4 nhanh cuối, 5 bezier bậc ba theo tension (xem bezier()).

export const FADER_EXP = 0.22;
export const gainToDb = (g) => (g > 1e-6 ? 20 * Math.log10(g) : -120);
export const dbToGain = (db) => 10 ** (db / 20);
const smooth = (a) => a * a * (3 - 2 * a);
/**
 * Bezier bậc ba của Reaper (shape 5), theo schwa (Cockos) tại https://forum.cockos.com/showthread.php?t=177451 (post #7):
 * điểm cuối (0,1)→(1,−1): tension 0 → điểm điều khiển (0,25; 0,5), (0,75; −0,5) [= đường thẳng]; tension −1 → (0,−1), (0,−1);
 * tension +1 → (1,1), (1,1); các mức khác nội suy tuyến tính giữa ba trạng thái. Ở đây viết theo tiến độ (x, y ∈ [0,1], y = 0 tại điểm đầu).
 * Chỉ tension của ĐIỂM ĐẦU đoạn có tác dụng. Đã đối chiếu số đo Reaper (bezier1/2/3.RPP, automation.rpp; tension −0,65…+0,9): sai số ≤ 1,2 dB.
 * CHƯA làm: ràng buộc thẳng hàng khi tension = 0 giữa các đoạn bezier liền kề (schwa, post #9).
 */
function bezier(a, tension) {
  const t = Math.max(-1, Math.min(1, tension || 0)), s = Math.abs(t);
  const [x1, y1, x2, y2] = t >= 0
    ? [0.25 + 0.75 * s, 0.25 - 0.25 * s, 0.75 + 0.25 * s, 0.75 - 0.75 * s]
    : [0.25 - 0.25 * s, 0.25 + 0.75 * s, 0.75 - 0.75 * s, 0.75 + 0.25 * s];
  const X = (u) => 3 * (1 - u) * (1 - u) * u * x1 + 3 * (1 - u) * u * u * x2 + u * u * u;
  let lo = 0, hi = 1;
  for (let i = 0; i < 40; i++) { const u = (lo + hi) / 2; if (X(u) < a) lo = u; else hi = u; }
  const u = (lo + hi) / 2;
  return 3 * (1 - u) * (1 - u) * u * y1 + 3 * (1 - u) * u * u * y2 + u * u * u;
}

/** Hệ số dạng đường cong (0..1) cho đoạn bắt đầu bằng điểm có `shape`/`tension`. */
export function shapeCurve(a, shape, tension = 0) {
  switch (shape) {
    case 1: return 0;
    case 2: return smooth(a);
    case 3: return 1 - (1 - a) ** 3; // fast start (đã kiểm với automation.rpp: sai số ≤ 0,6 dB)
    case 4: return a ** 3; // fast end
    case 5: return bezier(a, tension);
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
