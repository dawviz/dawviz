/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { CSP } from './src/lib/csp.ts';

// NFR-SEC-03/06: CSP bằng thẻ meta, chỉ khi build (dev server của Vite cần script/style nội tuyến cho HMR).
const csp = { name: 'dawviz-csp', apply: 'build' as const, transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' as const }] };

export default defineConfig({
  plugins: [react(), csp],
  worker: { format: 'es' },
  server: { fs: { allow: ['../..'] } }, // cho phép đọc locales/ và packages/ ở gốc monorepo
  test: { environment: 'jsdom', globals: true, setupFiles: ['./test/setup.ts'], include: ['test/**/*.test.tsx'] },
});
