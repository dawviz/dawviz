// Các gói parser/i18n viết bằng JavaScript (JSDoc); khai báo vừa đủ để app gõ kiểu.
declare module '@dawviz/parser' {
  import type { UnifiedProjectAST } from '@dawviz/render-core';
  export interface ParseWarning { code: string; message: string; details?: Record<string, unknown> }
  export interface ParseResult { ast: UnifiedProjectAST; warnings: ParseWarning[]; format: string; info?: unknown }
  export function parseProject(name: string, buffer: ArrayBuffer | Uint8Array, options?: Record<string, unknown>): Promise<ParseResult>;
  export function probeProject(name: string, buffer: ArrayBuffer | Uint8Array, options?: Record<string, unknown>): { format: string | null; needs: { externalMidi: string[]; schema: boolean }; code?: string; message?: string };
  /** Khoá so tên .mid ngoài (không phân biệt hoa/thường, khoảng trắng ≡ gạch dưới) — cùng quy tắc parser dùng khi ghép tệp. */
  export function externalMidiKey(name: string): string;
  export const SUPPORTED: unknown[];
}
declare module '@dawviz/i18n' {
  export interface I18n { locale: string; dir: 'ltr' | 'rtl'; setLocale(l: string): void; has(key: string): boolean; t(key: string, params?: Record<string, unknown>): string; number(n: number, o?: Intl.NumberFormatOptions): string; duration(sec: number): string }
  export function createI18n(o: { locale?: string; fallback?: string; catalogs?: Record<string, Record<string, string>>; onMissing?: (k: string, l: string, used?: string) => void }): I18n;
  export function matchLocale(wanted: string | readonly string[], available: string[], fallback?: string): string;
}
