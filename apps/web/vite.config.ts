/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: { format: 'es' },
  server: { fs: { allow: ['../..'] } }, // cho phép đọc locales/ và packages/ ở gốc monorepo
  test: { environment: 'jsdom', globals: true, setupFiles: ['./test/setup.ts'], include: ['test/**/*.test.tsx'] },
});
