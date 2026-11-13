// Cầu nối React cho store có hoàn tác: `useStoreState` (useSyncExternalStore) và ngữ cảnh cử chỉ cho thanh trượt (T-07).
import { createContext, useContext, useEffect, useRef, useSyncExternalStore } from 'react';
import type { Store, StoreState } from './store.ts';

export function useStoreState<D>(store: Store<D>): StoreState<D> {
  return useSyncExternalStore(store.subscribe, store.state, store.state);
}

/** Một cử chỉ kéo = một bước hoàn tác. Mặc định là no-op để thành phần dùng được ngoài App (test, storybook). */
export interface Gesture { begin(): void; end(): void }
export const GestureContext = createContext<Gesture>({ begin() {}, end() {} });

/** Cho thanh trượt: `onPointerDown` mở cử chỉ, đóng ở pointerup/pointercancel bất kể con trỏ thả ở đâu (cũng đóng khi rời ô hoặc gỡ thành phần). */
export function useGesturePointer(): { onPointerDown(): void; onBlur(): void } {
  const g = useContext(GestureContext);
  const open = useRef(false), off = useRef<(() => void) | null>(null);
  const end = () => { off.current?.(); off.current = null; if (open.current) { open.current = false; g.end(); } };
  useEffect(() => end, []); // eslint-disable-line react-hooks/exhaustive-deps
  return {
    onPointerDown() {
      if (open.current) return;
      open.current = true; g.begin();
      const up = () => end();
      window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
      off.current = () => { window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); };
    },
    onBlur: end,
  };
}
