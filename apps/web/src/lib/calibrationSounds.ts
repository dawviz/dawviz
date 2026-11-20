// Tiếng kick và snare tổng hợp cho bài đo độ trễ (T-82). Hàm thuần, tất định (không Math.random): cùng tần số lấy mẫu → cùng mẫu.
// Cả hai bắt đầu bằng đỉnh ngay mẫu đầu (không hiện dần) để mốc cảm nhận trùng mốc lên lịch.

/** Kick: sin quét từ 150 Hz xuống 50 Hz, tắt theo hàm mũ, ~180 ms. */
export function synthKick(sampleRate: number): Float32Array {
  const n = Math.round(sampleRate * 0.18), out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate, f = 50 + 100 * Math.exp(-t * 35);
    phase += 2 * Math.PI * f / sampleRate;
    out[i] = 0.9 * Math.exp(-t * 14) * Math.sin(phase + Math.PI / 2); // pha +π/2: bắt đầu ở đỉnh
  }
  return out;
}
/** Snare: nhiễu trắng (LCG cố định) trộn âm 190 Hz, tắt nhanh, ~140 ms. Sắc hơn kick để dễ nghe ra phách 3. */
export function synthSnare(sampleRate: number): Float32Array {
  const n = Math.round(sampleRate * 0.14), out = new Float32Array(n);
  let seed = 0x2545f491;
  for (let i = 0; i < n; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = (seed / 0xffffffff) * 2 - 1, t = i / sampleRate;
    out[i] = 0.85 * Math.exp(-t * 28) * (0.75 * noise + 0.25 * Math.cos(2 * Math.PI * 190 * t));
  }
  out[0] = Math.sign(out[0] || 1) * 0.85; // mẫu đầu ở đỉnh, dù nhiễu rơi ở đâu
  return out;
}
