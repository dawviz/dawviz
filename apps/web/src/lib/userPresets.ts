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

// ───── Nhập bộ preset (T-111, D-66): trùng tên khác nội dung thì HỎI người dùng ghi đè hoặc đổi tên, không tự quyết ─────
export type ConflictChoice = 'overwrite' | 'rename';
export interface CollectionImportPlan {
  /** Mục chưa có: thêm thẳng. */
  fresh: { name: string; scene: SceneDocument }[];
  /** Mục trùng tên với preset có sẵn nhưng khác nội dung: cần người dùng chọn. */
  conflicts: { name: string; scene: SceneDocument }[];
  /** Số mục trùng cả tên lẫn nội dung (không làm gì). */
  same: number;
}
export function planCollectionImport(list: UserPreset[], items: readonly { name: string; scene: SceneDocument }[]): CollectionImportPlan {
  const plan: CollectionImportPlan = { fresh: [], conflicts: [], same: 0 };
  for (const it of items) {
    const name = cleanPresetName(it.name), have = list.find((p) => p.name === name);
    if (!have) plan.fresh.push({ name, scene: it.scene });
    else if (sameScene(have.scene, { ...it.scene, presetName: name })) plan.same++;
    else plan.conflicts.push({ name, scene: it.scene });
  }
  return plan;
}
/** Tên chưa dùng: `Tên (2)`, `Tên (3)`… (cắt gốc để vẫn trong 60 ký tự). */
export function uniquePresetName(taken: ReadonlySet<string>, name: string): string {
  if (!taken.has(name)) return name;
  for (let i = 2; ; i++) { const suffix = ` (${i})`, c = `${name.slice(0, NAME_MAX - suffix.length)}${suffix}`; if (!taken.has(c)) return c; }
}
/**
 * Áp kế hoạch: `fresh` thêm vào; mỗi mục xung đột theo `choices[tên]` (thiếu lựa chọn = rename, không bao giờ ghi đè khi chưa được chọn rõ).
 * Ghi đè giữ nguyên id của preset cũ (ô đang chọn vẫn là ô đó). Đầy `MAX_USER_PRESETS` thì bỏ mục cũ nhất, như `addUserPreset`.
 */
export function applyCollectionImport(list: UserPreset[], plan: CollectionImportPlan, choices: Readonly<Record<string, ConflictChoice>>): { list: UserPreset[]; added: UserPreset[]; overwritten: UserPreset[] } {
  let out = list.slice(); const added: UserPreset[] = [], overwritten: UserPreset[] = [];
  const taken = new Set(out.map((p) => p.name));
  for (const it of plan.fresh) { const name = uniquePresetName(taken, it.name); taken.add(name); const p = { id: newId(), name, scene: { ...it.scene, presetName: name } }; out.push(p); added.push(p); }
  for (const it of plan.conflicts) {
    if (choices[it.name] === 'overwrite') {
      const i = out.findIndex((p) => p.name === it.name);
      if (i >= 0) { const p = { ...out[i], scene: { ...it.scene, presetName: it.name } }; out[i] = p; overwritten.push(p); continue; }
    }
    const name = uniquePresetName(taken, it.name); taken.add(name);
    const p = { id: newId(), name, scene: { ...it.scene, presetName: name } }; out.push(p); added.push(p);
  }
  if (out.length > MAX_USER_PRESETS) out = out.slice(-MAX_USER_PRESETS);
  return { list: out, added, overwritten };
}
