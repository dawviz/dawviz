import '@testing-library/jest-dom/vitest';

// jsdom chưa có Blob.arrayBuffer()/text() (trình duyệt thật có): bù bằng FileReader để test nạp tệp chạy được.
const proto = Blob.prototype as unknown as Record<string, unknown>;
for (const [name, read] of [['arrayBuffer', 'readAsArrayBuffer'], ['text', 'readAsText']] as const) {
  if (typeof proto[name] !== 'function') {
    proto[name] = function (this: Blob) {
      return new Promise((resolve, reject) => {
        const r = new FileReader() as unknown as Record<string, any>;
        r.onload = () => resolve(r.result); r.onerror = () => reject(r.error); r[read](this);
      });
    };
  }
}

// jsdom không vẽ canvas: getContext trả null (SceneCanvas bỏ qua) thay vì in "Not implemented" mỗi khung.
HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];

// jsdom chưa có PointerEvent: fireEvent.pointerDown/Move rơi về Event trơn, mất clientX/pointerId. Bù bằng MouseEvent có thêm trường con trỏ.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventShim extends MouseEvent {
    pointerId: number; pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) { super(type, init); this.pointerId = init.pointerId ?? 0; this.pointerType = init.pointerType ?? ''; }
  }
  (window as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventShim;
}
