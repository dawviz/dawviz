// Vị trí menu thả xuống (T-114): mặc định mở xuống dưới nút; thiếu chỗ phía dưới mà phía trên rộng hơn thì lật lên, và luôn giới hạn chiều cao
// để không thò ra ngoài cửa sổ (menu cuộn trong khung). Dùng cho mọi menu tự dựng (ô chọn gốc <select> do trình duyệt tự đặt vị trí).
import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';

export interface MenuPlacement {
  up: boolean; maxHeight: number | undefined;
  /** Chỉ khi `fixed`: vị trí theo cửa sổ (`position: fixed`), để menu không bị cắt bởi vùng cuộn (`overflow`) của cha. Dùng với createPortal. */
  style?: CSSProperties;
}
const MARGIN = 8, GAP = 4;

/** Phép tính thuần để kiểm thử: `below`/`above` = chỗ trống (px) dưới/trên nút; `natural` = chiều cao cần của menu. */
export function placeMenu(natural: number, below: number, above: number): MenuPlacement {
  const up = natural > below && above > below;
  const room = Math.max(0, Math.floor((up ? above : below) - MARGIN - GAP));
  return { up, maxHeight: natural > room ? room : undefined };
}

/**
 * `menu`: phần tử menu (đã vẽ). `anchor`: nút/khung neo (mặc định cha của menu). `fixed`: đặt theo cửa sổ (nên dựng menu bằng createPortal vào `document.body`
 * để thoát khỏi vùng cuộn/cắt của cha; menu `absolute` lật lên trong vùng cuộn sẽ bị cắt mất). Tính lại khi mở và khi đổi cỡ cửa sổ.
 */
export function useMenuPlacement(open: boolean, menu: RefObject<HTMLElement | null>, opts: { anchor?: RefObject<HTMLElement | null>; fixed?: boolean } = {}): MenuPlacement {
  const [p, setP] = useState<MenuPlacement>({ up: false, maxHeight: undefined });
  const { anchor, fixed } = opts;
  useLayoutEffect(() => {
    if (!open) return;
    const calc = () => {
      const el = menu.current, host = anchor?.current ?? el?.parentElement; if (!el || !host) return;
      const prev = el.style.maxHeight; el.style.maxHeight = ''; // chiều cao theo lớp CSS của menu (không tính giới hạn ta đặt lần trước)
      const natural = el.offsetHeight, w = el.offsetWidth, r = host.getBoundingClientRect();
      el.style.maxHeight = prev;
      const next: MenuPlacement = placeMenu(natural, window.innerHeight - r.bottom, r.top);
      if (fixed) {
        const left = Math.max(MARGIN, Math.min(r.left, window.innerWidth - w - MARGIN));
        next.style = { position: 'fixed', left, ...(next.up ? { bottom: window.innerHeight - r.top + GAP } : { top: r.bottom + GAP }), ...(next.maxHeight !== undefined ? { maxHeight: next.maxHeight } : {}) };
      }
      setP((c) => (c.up === next.up && c.maxHeight === next.maxHeight && JSON.stringify(c.style) === JSON.stringify(next.style) ? c : next));
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [open, menu, anchor, fixed]);
  return p;
}
