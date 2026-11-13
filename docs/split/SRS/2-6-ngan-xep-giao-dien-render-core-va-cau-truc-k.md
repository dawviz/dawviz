---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "2.6. Ngăn xếp giao diện, Render Core và cấu trúc kho mã (D-34, D-35, D-36)"
path: "2. KIẾN TRÚC KỸ THUẬT, LUỒNG DỮ LIỆU & ĐÁNH GIÁ KIẾN TRÚC > 2.6. Ngăn xếp giao diện, Render Core và cấu trúc kho mã (D-34, D-35, D-36)"
chunk: 2-6-ngan-xep-giao-dien-render-core-va-cau-truc-k.md
source_lines: 244-254
source_sha1: 0fd28ef586
ids: [AT-05, D-34, D-35, D-36]
---
### 2.6. Ngăn xếp giao diện, Render Core và cấu trúc kho mã (D-34, D-35, D-36)

* **Phân lớp:** `@dawviz/parser-*` (JS) → AST → `@dawviz/render-core` (TS, hàm thuần `layout(AST, cấu hình, t)` rồi `draw(ctx, ...)`) → `apps/web` (React). Render Core không biết React; giao diện chỉ giữ trạng thái (tệp, cấu hình, đồng hồ `t`) và gọi Render Core. Preview (Canvas trong trang) và Export (OffscreenCanvas trong Worker) gọi **cùng** hàm vẽ, nên khớp khung hình (AT-05).
* **Worker:** phân tích dự án chạy trong Web Worker; giao diện nhận AST và danh sách cảnh báo/lỗi theo mã rồi dịch (REQ-I18N-04).
* **Chuyển động:** Framer Motion chỉ cho phần giao diện (khung thả file, thông báo, danh sách track). Mọi chuyển động trong khung hình video là hàm của `t` do Render Core tính, không phụ thuộc đồng hồ giao diện.
* **Kiểm thử:** Render Core và logic thuần kiểm bằng `node --test` (không cần trình duyệt); thành phần giao diện bằng Vitest + Testing Library; kiểm tra cuối trong Chrome thật. Chi tiết trong `docs/design/TDD.md`.
* **Kho mã:** monorepo (D-35); `docs/` chứa BRD/SRS (sản phẩm), SDD/TDD (ứng dụng) và `parser/` (thư viện parser); `npm run docs:split` sinh các mảnh nhỏ cho AI tham chiếu.


---
