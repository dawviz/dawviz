---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "5.7 Primitive chữ và nạp phông 🟢 (T-69, SRS REQ-WIDGET-02)"
path: "5. Render Core (chi tiết) 🟢 Scene, Piano Roll; ⚪ widget còn lại > 5.7 Primitive chữ và nạp phông 🟢 (T-69, SRS REQ-WIDGET-02)"
chunk: 5-7-primitive-chu-va-nap-phong-t-69-srs-req-widg.md
source_lines: 167-192
source_sha1: 89531c2f60
ids: [ERR_FONT_LOAD, NFR-SEC-03, REQ-STORAGE-05, REQ-WIDGET-02]
---
### 5.7 Primitive chữ và nạp phông 🟢 (T-69, SRS REQ-WIDGET-02)
**Primitive.** Thêm vào `Primitive` một kiểu `text`; `layout` của widget trả về, `drawPrimitives` vẽ, giống `rect` (không widget nào tự gọi `fillText`):

```ts
interface TextPrim {
  kind: 'text'; text: string;
  x: number; y: number;                       // pt logic; y là đường baseline
  font: string;                               // họ phông trong bảng FONTS của preset, ví dụ "Space Grotesk"
  size: number; weight: number;               // pt logic, 100–900
  align: 'left' | 'center' | 'right';
  color: string; alpha: number;
  maxWidth?: number;                          // layout đã cắt bằng bảng đo; bước vẽ truyền tiếp cho fillText để không bao giờ tràn
}
```
- Vẽ: `ctx.font = `${weight} ${size}px "${font}", sans-serif``, `textAlign = align`, `textBaseline = 'alphabetic'`, `fillStyle`, `globalAlpha`. Kích thước nhân `scale` bởi `setTransform` như mọi primitive, nên không tự nhân lại. `fontKerning = 'none'` và `textRendering = 'geometricPrecision'` (không có dòng sau thì Chromium làm tròn độ rộng ký tự, lệch bảng đo ~1%) đặt cùng chỗ cho Canvas và OffscreenCanvas. Chữ số của đồng hồ chưa dùng `tabular-nums`; nhãn đặt cạnh số dùng bề rộng chữ số rộng nhất nên không nhảy.
- **Đo chữ.** Phần `layout` là hàm thuần chạy ở Node nên không có `measureText`. Mọi quyết định phụ thuộc bề rộng (căn phải, `maxWidth`, kiểu một dòng ngang của Live Trigger) dùng **căn lề của canvas** (`textAlign`) và việc cắt chữ nằm ở bước vẽ; riêng chỗ cần biết bề rộng để xếp nhiều đoạn trên một dòng thì layout dùng bảng bề rộng ký tự của phông (`FONT_METRICS`, sinh bằng `scripts/gen-font-metrics.mjs` từ tệp phông đóng gói, `packages/render-core/src/fontMetrics.generated.ts`) chứ không gọi `measureText`. Nhờ đó cùng `(scene, t)` ra cùng chuỗi lệnh vẽ ở mọi môi trường.
- **Quyết định đo chữ (chủ dự án duyệt 2026-11-13).** Dùng bảng `FONT_METRICS` với năm điều kiện: (1) bảng **sinh tự động** bằng script đọc chính tệp phông đã đóng gói (thư viện đọc phông chỉ là phụ thuộc lúc phát triển), kèm mã băm tệp phông; test so mã băm, đổi phông mà quên sinh lại bảng thì đỏ. (2) **Bỏ kerning khi vẽ** (`ctx.fontKerning = 'none'`) để đo khớp vẽ, nên bảng không cần cặp kerning. (3) Bảng phủ Latin cơ bản và Latin mở rộng (gồm tiếng Việt); ký tự ngoài bảng ước lượng bằng một độ rộng dự phòng, và bước vẽ vẫn cắt chữ/thêm "…" theo khung widget để không bao giờ tràn. (4) `layout` nhận hàm đo truyền vào `measure(text, font, size)`, mặc định dựa trên `FONT_METRICS`; phông người dùng nạp (REQ-STORAGE-05) chỉ cần sinh bảng lúc nạp. (5) Test đối chiếu trên trình duyệt thật: `FONT_METRICS` so với `measureText` trên vài chuỗi (Latin, tiếng Việt, chữ số), lệch ≤ 1 pt; chỉ chạy khi có Chromium. Thêm test: preset cũ thiếu tuỳ chọn "luôn hiện danh sách nốt" vẽ y như trước.
- **Nguồn chữ.** Chuỗi trong primitive đến từ mẫu chữ của preset (`properties.template`…) và dữ liệu dự án, không từ `locales/` (The Two Worlds Rule). Hàm định dạng (`formatTemplate`, `groupDigits`) là hàm thuần trong `packages/render-core/src/text.ts`.

**Nạp phông.**
- Phông gói theo ứng dụng: `apps/web/public/fonts/SpaceGrotesk-*.woff2` (OFL, kèm `OFL-SpaceGrotesk.txt`; phông giao diện Inter đi qua `@fontsource-variable/inter` vào `dist/assets`, giấy phép kèm `OFL-Inter.txt` ở cùng thư mục `fonts/`; cả hai chép vào `dist/fonts/`), phục vụ cùng origin nên khớp CSP `font-src 'self'` (NFR-SEC-03); không `@font-face` từ CDN, không `data:` cho phông chính.
- Render Core không tự tải. Cung cấp `FontRegistry` (`packages/render-core/src/fonts.ts`): `ensureFonts(specs, loader): Promise<void>` nhận danh sách `{family, weight, url}` mà scene cần (`requiredFonts(scene)` thuần, sắp ổn định), gọi `new FontFace(family, `url(...)`, {weight})`, `await face.load()`, rồi thêm vào `document.fonts` (Preview) hoặc `self.fonts` (Worker). `loader` được truyền vào để cùng một mã dùng cho cả hai nơi và để test bằng loader giả.
- **Cổng khung đầu.** `renderFrame` nhận `derived.fontsReady?: boolean`. Khi `fontsReady = false`, `renderFrame` **bỏ qua mọi primitive `text`**; ứng dụng (`useFontsStatus`, `SceneCanvas blocked`) còn **không vẽ cả khung** và hiện trạng thái chờ/lỗi (`needsFonts(scene)` cho biết có cần chờ); **Export không bắt đầu** khi `ensureFonts` chưa xong hoặc bị lỗi (báo `ERR_FONT_LOAD`, không xuất bằng phông dự phòng). Preview vẽ lại khi `ensureFonts` kết thúc.
- **Export Worker (M3).** Worker nhận `requiredFonts(scene)` cùng thông điệp `start`, tự gọi `ensureFonts` với `self.fonts` (Spike 1: `FontFace` trong Worker hoạt động) và chỉ gửi `ready` về UI khi xong; khung 0 chỉ được vẽ sau `ready`. Phông người dùng nạp (REQ-STORAGE-05) dùng cùng đường, tệp truyền bằng `ArrayBuffer`.
- **Ảnh thu nhỏ phong cách.** Cùng `renderFrame` với `scale` nhỏ, `t` cố định theo preset (`thumbnail.t`), chờ `ensureFonts`; kết quả đệm theo khoá `(presetId, projectKey, width, height)`; vẽ lên `OffscreenCanvas` rồi `convertToBlob`, nên không phụ thuộc giao diện.
