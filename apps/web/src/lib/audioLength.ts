// Cảnh báo lệch độ dài giữa tệp âm thanh và dự án (T-08, §6.2.6). Hàm thuần; ngưỡng là [PROVISIONAL] và không đối xứng:
// mix thường dài hơn dự án vài giây vì đuôi vang.
export const SHORT_ABS = 1, SHORT_REL = 0.02, LONG_ABS = 10, LONG_REL = 0.1;

export interface LengthCheck {
  kind: 'ok' | 'shorter' | 'longer';
  /** audio / dự án (độ dài tệp so với độ dài dự án, không tính offset); 0 nếu dự án rỗng. */
  ratio: number;
  /** audioEnd − projectEnd (giây, có tính offset). */
  delta: number;
}

export function audioLengthCheck(audioSec: number, projectSec: number, offsetSec = 0): LengthCheck {
  const ratio = projectSec > 0 ? audioSec / projectSec : 0;
  if (!(projectSec > 0) || !(audioSec > 0)) return { kind: 'ok', ratio, delta: 0 };
  const delta = offsetSec + audioSec - projectSec;
  if (delta < -Math.max(SHORT_ABS, SHORT_REL * projectSec)) return { kind: 'shorter', ratio, delta };
  if (delta > Math.max(LONG_ABS, LONG_REL * projectSec)) return { kind: 'longer', ratio, delta };
  return { kind: 'ok', ratio, delta };
}
