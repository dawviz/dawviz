// Mục nào của inspector đang thu gọn (theo id mục, dùng chung Xem trước và Editor), nhớ qua localStorage (lib/prefs.ts).
// Kho nhỏ ngoài React để mọi InspectorSection cùng id đổi theo nhau.
import { useCallback, useSyncExternalStore } from 'react';
import { loadPref, savePref } from './prefs.ts';

const PREF = 'inspectorSections';
let closed: ReadonlySet<string> = new Set((loadPref<{ closed?: unknown }>(PREF, {}).closed as unknown[] | undefined ?? []).filter((x): x is string => typeof x === 'string'));
const subs = new Set<() => void>();

export function setSectionOpen(id: string, open: boolean): void {
  if (closed.has(id) === !open) return;
  const n = new Set(closed); if (open) n.delete(id); else n.add(id);
  closed = n; savePref(PREF, { closed: [...n] });
  subs.forEach((f) => f());
}
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

export function useSectionOpen(id: string): [boolean, (open: boolean) => void] {
  const open = useSyncExternalStore(subscribe, () => !closed.has(id), () => true);
  return [open, useCallback((o: boolean) => setSectionOpen(id, o), [id])];
}
