// Preset do người dùng thêm (mở từ tệp .json hoặc "Lưu thành preset" từ phong cách đang chỉnh): lưu theo trình duyệt (localStorage),
// hiện thành ô trong cột "Video styles". Mỗi scene qua `sanitizeScene` khi nạp lại nên dữ liệu hỏng không làm sập giao diện (NFR-SEC-04).
import { sanitizeScene, type SceneDocument } from '@dawviz/render-core';
import { loadPref, savePref } from './prefs.ts';

export interface UserPreset { id: string; name: string; scene: SceneDocument }
export const MAX_USER_PRESETS = 24;
const NAME_MAX = 60;

export const cleanPresetName = (s: string, fallback = 'Preset') => s.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX) || fallback;
const newId = () => `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const sameScene = (a: SceneDocument, b: SceneDocument) => JSON.stringify(a) === JSON.stringify(b);

export function loadUserPresets(): UserPreset[] {
  const raw = loadPref<{ items?: unknown }>('userPresets', {}).items;
  if (!Array.isArray(raw)) return [];
  const out: UserPreset[] = [];
  for (const it of raw.slice(0, MAX_USER_PRESETS)) {
    const o = it as { id?: unknown; name?: unknown; scene?: unknown };
    if (typeof o?.id !== 'string' || typeof o.name !== 'string') continue;
    try { out.push({ id: o.id.slice(0, 40), name: cleanPresetName(o.name), scene: sanitizeScene(o.scene).scene }); } catch { /* bỏ mục hỏng */ }
  }
  return out;
}
export const saveUserPresets = (items: UserPreset[]) => savePref('userPresets', { items });

/** Thêm một preset; cùng tên và cùng nội dung với mục có sẵn thì dùng lại mục đó. Đầy thì bỏ mục cũ nhất. */
export function addUserPreset(list: UserPreset[], name: string, scene: SceneDocument): { list: UserPreset[]; preset: UserPreset } {
  const nm = cleanPresetName(name);
  const dup = list.find((p) => p.name === nm && sameScene(p.scene, scene));
  if (dup) return { list, preset: dup };
  const preset = { id: newId(), name: nm, scene: { ...scene, presetName: nm } };
  return { list: [...list, preset].slice(-MAX_USER_PRESETS), preset };
}
export const removeUserPreset = (list: UserPreset[], id: string) => list.filter((p) => p.id !== id);
/** Preset có scene đúng bằng scene hiện tại (để đánh dấu ô đang chọn), nếu có. */
export const matchUserPreset = (list: UserPreset[], scene: SceneDocument) => list.find((p) => sameScene(p.scene, scene));
