// Trusted Types (NFR-SEC-06): trang chạy với `require-trusted-types-for 'script'`, nên mọi URL script (Worker) phải đi qua
// một chính sách có tên khai báo trong CSP (`trusted-types dawviz-worker`). Chính sách chỉ nhận URL cùng origin.
export const WORKER_POLICY = 'dawviz-worker';

/** Hàm thuần: URL `u` (tương đối hoặc tuyệt đối) có cùng origin với `base` và dùng http(s)/blob không. */
export function isSameOriginScript(u: string, base: string): boolean {
  try {
    const url = new URL(u, base), b = new URL(base);
    if (url.protocol === 'blob:') return new URL(url.pathname).origin === b.origin;
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin === b.origin;
  } catch { return false; }
}

interface TTPolicy { createScriptURL(u: string): unknown }
let policy: TTPolicy | null | undefined;

/** Trả TrustedScriptURL khi trình duyệt có Trusted Types, nếu không trả chuỗi đã kiểm. Ném lỗi nếu URL khác origin. */
export function trustedWorkerURL(u: string): unknown {
  const base = globalThis.location?.href ?? 'http://localhost/';
  if (!isSameOriginScript(u, base)) throw new Error(`Worker URL bị chặn (khác origin): ${u}`);
  if (policy === undefined) {
    const tt = (globalThis as { trustedTypes?: { createPolicy(n: string, r: { createScriptURL(u: string): string }): TTPolicy } }).trustedTypes;
    policy = tt ? tt.createPolicy(WORKER_POLICY, { createScriptURL: (x) => { if (!isSameOriginScript(x, base)) throw new TypeError('blocked'); return x; } }) : null;
  }
  return policy ? policy.createScriptURL(u) : u;
}
