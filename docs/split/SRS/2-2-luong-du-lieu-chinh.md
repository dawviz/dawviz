---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "2.2. Luồng dữ liệu chính"
path: "2. KIẾN TRÚC KỸ THUẬT, LUỒNG DỮ LIỆU & ĐÁNH GIÁ KIẾN TRÚC > 2.2. Luồng dữ liệu chính"
chunk: 2-2-luong-du-lieu-chinh.md
source_lines: 184-191
source_sha1: 6c3a823de0
ids: [REQ-AST-01, REQ-EXPORT-00, REQ-EXPORT-01, REQ-EXPORT-04, REQ-GRAPHICS-04, REQ-PARSER-00, REQ-STORAGE-01, REQ-UI-01, REQ-WIDGET-06, REQ-WIDGET-07]
---
### 2.2. Luồng dữ liệu chính

1. **Nạp**: kéo thả file; kiểm tra kích thước, định dạng (REQ-UI-01); chuyển cho Parse Worker (REQ-PARSER-00).
2. **Phân tích**: parser xuất `UnifiedProjectAST` và qua bước xác thực (REQ-AST-01); lỗi trả mã `ERR_*`.
3. **Tiền xử lý** (trong Worker): tính `ChordTimeline` (REQ-WIDGET-06), phân tích audio nếu có (REQ-WIDGET-07), áp preset mặc định (REQ-GRAPHICS-04).
4. **Thiết kế**: chỉnh bố cục ở Edit Mode, xem ở Preview Mode; tự động lưu (REQ-STORAGE-01).
5. **Xuất**: Pre-flight (REQ-EXPORT-00) → Export Worker dựng khung bằng Render Core (REQ-EXPORT-01) → mã hóa → ghép container → tải về (REQ-EXPORT-04).
