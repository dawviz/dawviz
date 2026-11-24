// Trạng thái bố cục panel (thẻ Editor và thẻ Xem trước): đọc/ghi localStorage (lib/prefs.ts), đo vùng của thẻ để kẹp cỡ theo cửa sổ (lib/panelLayout.ts).
// Phím tắt dùng chung (như VS Code): Ctrl/⌘+B cột trái, Ctrl/⌘+Alt+B cột phải, Ctrl/⌘+J Timeline (chỉ thẻ Editor).
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { loadPref, savePref } from './prefs.ts';
import { isTextEntry } from './a11y.ts';
import { PROFILES, parseLayout, resetSize, resolveLayout, setSize, toggle, type CollapsibleId, type PanelId, type PanelLayout, type Profile, type Resolved } from './panelLayout.ts';

const PREF = { editor: 'editorPanels', preview: 'previewPanels' } as const;

export interface PanelLayoutApi {
  ref: RefObject<HTMLDivElement>;
  layout: PanelLayout;
  r: Resolved;
  profile: Profile;
  resize(id: PanelId, px: number): void;
  reset(id: PanelId): void;
  setOpen(id: CollapsibleId, open: boolean): void;
}

export function usePanelLayout(advanced: boolean, which: 'editor' | 'preview' = 'editor'): PanelLayoutApi {
  const pf = PROFILES[which];
  const [layout, setLayout] = useState<PanelLayout>(() => parseLayout(loadPref(PREF[which], {}), pf));
  useEffect(() => { savePref(PREF[which], layout); }, [layout, which]);
  const ref = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current; if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setView((v) => (v.width === el.clientWidth && v.height === el.clientHeight ? v : { width: el.clientWidth, height: el.clientHeight })));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Chưa đo được (jsdom, thẻ đang ẩn): coi như rộng vô hạn, giữ đúng cỡ đã lưu.
  const r = resolveLayout(layout, view.width > 0 ? view : { width: 1e6, height: 1e6 }, advanced, pf);
  const resize = useCallback((id: PanelId, px: number) => setLayout((l) => setSize(l, id, px, pf)), [pf]);
  const reset = useCallback((id: PanelId) => setLayout((l) => resetSize(l, id, pf)), [pf]);
  const setOpen = useCallback((id: CollapsibleId, open: boolean) => setLayout((l) => toggle(l, id, open)), []);
  return { ref, layout, r, profile: pf, resize, reset, setOpen };
}

/** Phím tắt thu gọn/mở panel khi thẻ đang mở và không gõ chữ. `timeline` = có panel Timeline (thẻ Editor); `left` = có cột trái (Ctrl/⌘+B;
 *  thẻ Editor không còn cột Lớp từ D-69: cột lớp nằm trong Timeline). */
export function usePanelShortcuts(panels: PanelLayoutApi, active: boolean, timeline: boolean, left = true): void {
  const live = useRef(panels); live.current = panels;
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || isTextEntry(e.target)) return;
      const p = live.current;
      const id: CollapsibleId | null = e.code === 'KeyB' ? (e.altKey ? 'props' : left ? 'layers' : null) : e.code === 'KeyJ' && !e.altKey && timeline ? 'timeline' : null;
      if (!id) return;
      e.preventDefault();
      p.setOpen(id, !p.r.open[id]);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [active, timeline, left]);
}
