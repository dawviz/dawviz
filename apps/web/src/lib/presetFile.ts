// Mở/lưu preset .json (T-07, REQ-STORAGE-02, NFR-SEC-04). Phần kiểm lược đồ nằm ở Render Core (`sanitizeScene`);
// ở đây: kiểm cỡ tệp TRƯỚC khi đọc, đọc văn bản, JSON.parse (không eval), rồi chuyển cho sanitizeScene.
import { PRESET_LIMITS, SceneError, sanitizeScene, type SceneDocument, type SceneWarning } from '@dawviz/render-core';

export interface PresetResult { scene: SceneDocument; warnings: SceneWarning[]; fileName: string }

/** Đọc một tệp preset. Ném `SceneError` (ERR_PRESET_TOO_LARGE / ERR_PRESET_INVALID / ERR_SCHEMA_NEWER). */
export async function readPresetFile(file: Pick<File, 'name' | 'size' | 'text'>): Promise<PresetResult> {
  if (file.size > PRESET_LIMITS.maxBytes) throw new SceneError(`tệp ${file.size} byte vượt giới hạn ${PRESET_LIMITS.maxBytes}`, '$', 'ERR_PRESET_TOO_LARGE', { size: file.size, max: PRESET_LIMITS.maxBytes });
  return { ...parsePresetText(await file.text()), fileName: file.name };
}

export function parsePresetText(text: string): { scene: SceneDocument; warnings: SceneWarning[] } {
  if (text.length > PRESET_LIMITS.maxBytes) throw new SceneError(`preset dài ${text.length} ký tự vượt giới hạn`, '$', 'ERR_PRESET_TOO_LARGE', { size: text.length, max: PRESET_LIMITS.maxBytes });
  let raw: unknown;
  try { raw = JSON.parse(text.charCodeAt(0) === 0xfeff ? text.slice(1) : text); }
  catch (e) { throw new SceneError(`không phải JSON hợp lệ: ${(e as Error).message}`, '$'); }
  return sanitizeScene(raw);
}

export const serializePreset = (scene: SceneDocument): string => JSON.stringify(scene, null, 2) + '\n';

/** Tên tệp an toàn từ tên preset: chữ/số/gạch, tối đa 60 ký tự. */
export function presetFileName(name: string): string {
  const slug = name.normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).toLowerCase();
  return `${slug || 'preset'}.json`;
}

/** Tải xuống bằng Blob + liên kết (không cần quyền, chạy với CSP của ứng dụng). */
export function downloadPreset(scene: SceneDocument): void {
  const url = URL.createObjectURL(new Blob([serializePreset(scene)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url; a.download = presetFileName(scene.presetName); a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
