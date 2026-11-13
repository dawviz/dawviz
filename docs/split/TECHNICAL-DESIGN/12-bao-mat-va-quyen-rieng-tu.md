---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "12. Bảo mật và quyền riêng tư"
path: "12. Bảo mật và quyền riêng tư"
chunk: 12-bao-mat-va-quyen-rieng-tu.md
source_lines: 278-280
source_sha1: 7d1c483e31
ids: [OI-07]
---
## 12. Bảo mật và quyền riêng tư
Không backend, không telemetry; tệp người dùng không rời máy. Không `eval`/`new Function` (ô nhập số dùng bộ đọc viết tay, `lib/numberInput.ts`). **CSP + Trusted Types 🟢** (T-30, 2026-11-12): chính sách ở `apps/web/src/lib/csp.ts`, chèn thẻ `meta` khi build; Worker tạo qua chính sách `dawviz-worker` chỉ nhận URL cùng origin (`lib/trustedTypes.ts`); `npm run dev` không có CSP (HMR cần script nội tuyến). Đọc XML/ZIP có trần (xem mục 3). Preset và pack nhập vào được kiểm schema và giới hạn kích thước. Font/ảnh nạp qua `FontFace`/`createImageBitmap`, không chèn HTML từ dữ liệu người dùng (chuỗi tên track luôn render dạng văn bản; trong canvas là `fillText`). Giấy phép font/thư viện: OI-07.
