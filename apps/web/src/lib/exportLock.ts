// Mỗi lần chỉ một tab xuất video (Web Locks). Hai tab xuất cùng lúc tranh nhau bộ mã hoá (mỗi tab chậm đi nhiều) và nếu cùng
// chọn một tên tệp thì tab xong sau ghi đè tệp của tab kia mà không báo. Khoá tự nhả khi tab đóng hoặc bị treo; trình duyệt không có
// Web Locks thì không chặn gì (trả khoá giả).
export const EXPORT_LOCK = 'dawviz-export';
export interface ExportLock { release(): void }
type Locks = { request(name: string, opts: { ifAvailable: boolean }, cb: (lock: unknown) => Promise<void> | void): Promise<unknown>; query(): Promise<{ held?: { name?: string }[] }> };
const locks = (): Locks | undefined => (typeof navigator !== 'undefined' ? (navigator as unknown as { locks?: Locks }).locks : undefined);

/** Lấy khoá nếu chưa tab nào giữ; `null` nếu tab khác đang xuất. Gọi `release()` khi xong (mọi đường: xong, lỗi, huỷ, đóng hộp thoại). */
export function tryExportLock(): Promise<ExportLock | null> {
  const l = locks();
  if (!l) return Promise.resolve({ release() {} });
  return new Promise((resolve) => {
    l.request(EXPORT_LOCK, { ifAvailable: true }, (lock) => {
      if (!lock) { resolve(null); return; }
      return new Promise<void>((release) => resolve({ release: () => release() }));
    }).catch(() => resolve({ release() {} }));
  });
}

/** Có tab nào (kể cả tab này) đang giữ khoá xuất không; dùng để báo sớm trong hộp thoại. Không có Web Locks → false. */
export async function isExportBusy(): Promise<boolean> {
  try { return !!(await locks()?.query())?.held?.some((h) => h.name === EXPORT_LOCK); } catch { return false; }
}
