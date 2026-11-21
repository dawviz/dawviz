// Nét tay tất định (REQ-GRAPHICS-20): nhiễu băm từ (id phần tử, đỉnh, bước boil, seed). Không Math.random.

/** Băm 32-bit (kiểu murmur3 fmix) → số thực [-1, 1). */
export function hash01(a, b, c, d) {
  let h = (a * 0x9e3779b1) ^ (b * 0x85ebca77) ^ (c * 0xc2b2ae3d) ^ (d * 0x27d4eb2f);
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return ((h >>> 0) / 4294967296) * 2 - 1;
}

/**
 * Làm rung một đường: đoạn thẳng dài bị chia nhỏ và lệch vuông góc (đường kẻ khuông lượn nhẹ),
 * điểm điều khiển cong lệch ngẫu nhiên. amp tính bằng đơn vị VexFlow (1 = 1/10 khoảng dòng kẻ).
 */
export function roughPath(cmds, id, step, seed, amp) {
  const out = [];
  let px = 0, py = 0, v = 0;
  const n = (k) => hash01(id, v * 7 + k, step, seed) * amp;
  for (const c of cmds) {
    v++;
    switch (c[0]) {
      case 'M': px = c[1] + n(1) * 0.5; py = c[2] + n(2) * 0.5; out.push(['M', px, py]); break;
      case 'L': {
        const x = c[1] + n(1) * 0.5, y = c[2] + n(2) * 0.5, dx = x - px, dy = y - py, len = Math.hypot(dx, dy);
        const pieces = Math.min(12, Math.floor(len / 40));
        if (pieces >= 1) {
          // một đường cong bậc ba duy nhất lệch vuông góc ở 1/3 và 2/3: lượn nhẹ như tay kẻ
          const nx = -dy / (len || 1), ny = dx / (len || 1), w = Math.min(1.5, len / 80);
          const o1 = n(3) * w, o2 = n(4) * w;
          out.push(['C', px + dx / 3 + nx * o1, py + dy / 3 + ny * o1, px + (2 * dx) / 3 + nx * o2, py + (2 * dy) / 3 + ny * o2, x, y]);
        } else out.push(['L', x, y]);
        px = x; py = y; break;
      }
      case 'C': out.push(['C', c[1] + n(1), c[2] + n(2), c[3] + n(3), c[4] + n(4), c[5] + n(5) * 0.5, c[6] + n(6) * 0.5]); px = c[5]; py = c[6]; break;
      case 'Q': out.push(['Q', c[1] + n(1), c[2] + n(2), c[3] + n(3) * 0.5, c[4] + n(4) * 0.5]); px = c[3]; py = c[4]; break;
      default: out.push(c);
    }
  }
  return out;
}

/** Biến đổi affine nhỏ cho từng glyph: lệch, xoay, co giãn. Trả {dx, dy, rot, sc}. */
export function roughGlyph(id, gi, step, seed, amp) {
  return {
    dx: hash01(id, gi * 5 + 1, step, seed) * amp * 0.6,
    dy: hash01(id, gi * 5 + 2, step, seed) * amp * 0.6,
    rot: hash01(id, gi * 5 + 3, step, seed) * amp * 0.035,
    sc: 1 + hash01(id, gi * 5 + 4, step, seed) * amp * 0.025,
  };
}
