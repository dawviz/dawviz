// Chính sách CSP của ứng dụng (NFR-SEC-03 + NFR-SEC-06). Chèn vào index.html lúc build bằng plugin trong vite.config.ts.
// Không chèn ở `npm run dev` vì Vite dev cần <style> và script nội tuyến (HMR); kiểm CSP bằng `npm run build && npm run preview`.
import { WORKER_POLICY } from './trustedTypes.ts';

export const CSP_DIRECTIVES: ReadonlyArray<readonly [string, string]> = [
  ['default-src', "'self'"],
  ['script-src', "'self' 'wasm-unsafe-eval'"],
  ['worker-src', "'self' blob:"],
  ['img-src', "'self' data: blob:"],
  ['media-src', "'self' blob:"],
  ['font-src', "'self' data: blob:"],
  ['style-src', "'self'"],
  ['connect-src', "'self'"],
  ['object-src', "'none'"],
  ['base-uri', "'none'"],
  ['form-action', "'none'"],
  ['require-trusted-types-for', "'script'"],
  ['trusted-types', WORKER_POLICY],
];

export const CSP = CSP_DIRECTIVES.map(([k, v]) => `${k} ${v}`).join('; ');
