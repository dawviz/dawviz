// Bản chỉnh dở của từng ô trong cột Video styles, nhớ theo trình duyệt (localStorage) để tải lại trang không mất.
// `working`: ô KHÔNG đang chọn nhưng đã chỉnh; `active`: ô đang chọn kèm scene đang chỉnh. Mọi scene qua `sanitizeScene` khi nạp.
import { sanitizeScene, type SceneDocument } from '@dawviz/render-core';
import { loadPref, savePref } from './prefs.ts';

export interface WorkspaceStyles { working: Record<string, SceneDocument>; active: { tile: string; scene: SceneDocument } | null }
const KEY = 'workspaceStyles';
const MAX_TILES = 40;

const clean = (raw: unknown): SceneDocument | null => { try { return sanitizeScene(raw).scene; } catch { return null; } };

/** `valid(tile)`: ô còn tồn tại (preset đã xoá thì bỏ bản chỉnh dở của nó). */
export function loadWorkspaceStyles(valid: (tile: string) => boolean): WorkspaceStyles {
  const raw = loadPref<{ working?: unknown; active?: unknown }>(KEY, {});
  const working: Record<string, SceneDocument> = {};
  if (raw.working && typeof raw.working === 'object' && !Array.isArray(raw.working)) {
    for (const [tile, sc] of Object.entries(raw.working as Record<string, unknown>).slice(0, MAX_TILES)) {
      const s = valid(tile) ? clean(sc) : null; if (s) working[tile] = s;
    }
  }
  const a = raw.active as { tile?: unknown; scene?: unknown } | undefined;
  const scene = a && typeof a.tile === 'string' && valid(a.tile) ? clean(a.scene) : null;
  return { working, active: scene ? { tile: a!.tile as string, scene } : null };
}
export const saveWorkspaceStyles = (w: WorkspaceStyles) => savePref(KEY, w);
