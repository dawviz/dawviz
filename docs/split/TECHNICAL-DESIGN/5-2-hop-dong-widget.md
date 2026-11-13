---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "5.2 Hợp đồng widget 🟢"
path: "5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.2 Hợp đồng widget 🟢"
chunk: 5-2-hop-dong-widget.md
source_lines: 131-142
source_sha1: e5d905cf74
ids: []
---
### 5.2 Hợp đồng widget 🟢
Xem mục "Lệch so với phác thảo" ở 5.1.

```ts
interface WidgetRenderer<P> {
  type: WidgetType;
  layout(ctx: LayoutCtx, spec: WidgetSpec<P>, t: number): Primitive[]   // thuần, đơn vị pt logic, test bằng Node
  draw(g: Ctx2D, prims: Primitive[], scale: number): void               // chỉ vẽ, không tính nghiệp vụ
}
```
Thêm widget mới = thêm một `WidgetRenderer` + schema thuộc tính + khung cấu hình ở UI; không đụng `renderFrame`.
