// Chiều rộng khung xem trước (px), tính theo chỗ còn lại thực sự trong vùng cuộn giữa: khung + dòng thông số + thanh phát
// vừa vặn trong chiều cao còn lại, không để dải trống phía dưới và không dùng công thức theo 100vh.
import { useLayoutEffect, useState, type RefObject } from 'react';

/** Chiều cao cố định (px) của phần quanh canvas trong khối sân khấu: dòng thông số, dòng thời gian, khoảng cách, thanh phát. */
export const STAGE_CHROME = { proof: 112, plain: 64 } as const;
/** Bề rộng thêm bên phải khi có dải xám: khe 16 px + dải 10 px. */
export const STAGE_WEDGE = 26;
const MIN_WIDTH = 280;

/** Hàm thuần: rộng nhất sao cho khối sân khấu vừa cả chiều ngang lẫn chiều dọc. */
export function fitStageWidth(o: { availW: number; availH: number; aspect: number; chrome: number; extra: number }): number {
  const byWidth = o.availW - o.extra;
  const byHeight = (o.availH - o.chrome) * o.aspect;
  return Math.max(MIN_WIDTH, Math.floor(Math.min(byWidth, byHeight)));
}

/** `stage` là phần tử bọc khối sân khấu; chỗ còn lại theo chiều dọc = phần vùng cuộn dưới mép trên của nó
 *  (tự tính đúng khi phía trên có thông báo, bảng thiếu .mid…). Vùng cuộn phải là offsetParent (position: relative). */
export function useStageWidth(scroller: RefObject<HTMLElement>, stage: RefObject<HTMLElement>, o: { aspect: number; chrome: number; extra: number; active: boolean; fallback?: number }): number {
  const [width, setWidth] = useState(o.fallback ?? 640);
  useLayoutEffect(() => {
    const sc = scroller.current, st = stage.current;
    if (!o.active || !sc || !st) return;
    const measure = () => {
      if (!sc.clientHeight) return; // thẻ đang ẩn: giữ giá trị cũ
      const cs = getComputedStyle(sc);
      const padL = parseFloat(cs.paddingLeft) || 0, padR = parseFloat(cs.paddingRight) || 0, padB = parseFloat(cs.paddingBottom) || 0;
      setWidth(fitStageWidth({ availW: sc.clientWidth - padL - padR, availH: sc.clientHeight - st.offsetTop - padB, aspect: o.aspect, chrome: o.chrome, extra: o.extra }));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(sc);
    for (const el of Array.from(sc.children)) ro.observe(el);
    return () => ro.disconnect();
  }, [scroller, stage, o.active, o.aspect, o.chrome, o.extra]);
  return width;
}
