// Trạng thái bố cục panel của thẻ Editor: đọc/ghi localStorage (lib/prefs.ts), đo vùng Editor để kẹp cỡ theo cửa sổ (lib/panelLayout.ts).
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { loadPref, savePref } from './prefs.ts';
import { parseLayout, resetSize, resolveLayout, setSize, toggle, type CollapsibleId, type PanelId, type PanelLayout, type Resolved } from './panelLayout.ts';

const PREF = 'editorPanels';

export interface PanelLayoutApi {
  ref: RefObject<HTMLDivElement>;
  layout: PanelLayout;
  r: Resolved;
  resize(id: PanelId, px: number): void;
  reset(id: PanelId): void;
  setOpen(id: CollapsibleId, open: boolean): void;
}

export function usePanelLayout(advanced: boolean): PanelLayoutApi {
  const [layout, setLayout] = useState<PanelLayout>(() => parseLayout(loadPref(PREF, {})));
  useEffect(() => { savePref(PREF, layout); }, [layout]);
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setView((v) => (v.width === el.clientWidth && v.height === el.clientHeight ? v : { width: el.clientWidth, height: el.clientHeight })));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Chưa đo được (jsdom, thẻ đang ẩn): coi như rộng vô hạn, giữ đúng cỡ đã lưu.
  const r = resolveLayout(layout, view.width > 0 ? view : { width: 1e6, height: 1e6 }, advanced);
  const resize = useCallback((id: PanelId, px: number) => setLayout((l) => setSize(l, id, px)), []);
  const reset = useCallback((id: PanelId) => setLayout((l) => resetSize(l, id)), []);
  const setOpen = useCallback((id: CollapsibleId, open: boolean) => setLayout((l) => toggle(l, id, open)), []);
  return { ref, layout, r, resize, reset, setOpen };
}
