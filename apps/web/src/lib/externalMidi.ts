// REQ-UI-08: tóm tắt tình trạng file .mid ngoài mà dự án Reaper tham chiếu. Hàm thuần; cách so tên lấy từ parser
// (`externalMidiKey`) để giao diện và parser không bao giờ lệch nhau.

export interface ExternalMidiInfo {
  /** Mọi file .mid dự án tham chiếu (tên không kèm thư mục). */
  referenced: string[];
  /** File còn thiếu theo kết quả parse (nguồn sự thật: cảnh báo/lỗi của parser). */
  missing: string[];
  /** File người dùng đã nạp nhưng không khớp tên nào được tham chiếu (thường do đổi tên). */
  unused: string[];
}

export function summarizeExternalMidi(referenced: string[], provided: string[], missing: string[], key: (n: string) => string): ExternalMidiInfo {
  const uniq = (a: string[]) => [...new Set(a.filter(Boolean))];
  const refKeys = new Set(referenced.map(key));
  return {
    referenced: uniq(referenced),
    missing: uniq(missing),
    unused: uniq(provided.filter((p) => /\.midi?$/i.test(p) && !refKeys.has(key(p)))),
  };
}

/** Gộp tệp phụ mới vào tệp phụ cũ; trùng tên thì tệp mới thay tệp cũ. */
export function mergeExtras<T extends { name: string }>(old: T[], added: T[]): T[] {
  const m = new Map(old.map((f) => [f.name, f]));
  for (const f of added) m.set(f.name, f);
  return [...m.values()];
}

/** Có cần hiện bảng "thiếu file .mid" không, và mức độ (lỗi: không có nốt nào; cảnh báo: chỉ vài track trống). */
export function missingMidiLevel(info: ExternalMidiInfo | undefined, failed: boolean): 'error' | 'warning' | null {
  if (!info || (!info.missing.length && !info.unused.length)) return null;
  return failed && info.missing.length ? 'error' : 'warning';
}
