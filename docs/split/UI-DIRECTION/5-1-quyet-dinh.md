---
doc: UI-DIRECTION.md
doc_title: "Định hướng hình ảnh: khung preview và giao diện web"
section: "5.1 Quyết định"
path: "5. Theme giao diện chỉ đổi màu (D-52) > 5.1 Quyết định"
chunk: 5-1-quyet-dinh.md
source_lines: 306-314
source_sha1: cae014d43d
ids: [NFR-SEC-05, REQ-UI-10]
---
### 5.1 Quyết định
Theme của **ứng dụng** (REQ-UI-10, theme cộng đồng ở 1.1) chỉ đổi **màu**, qua một bộ token cố định. Không đổi cỡ chữ, phông, khoảng cách, bo góc, bố cục hay từng component, và không nhận CSS tuỳ ý. Lý do:

- **An toàn:** CSS tuỳ ý ẩn hoặc giả được nút (che nút xuất thật, làm mờ cảnh báo), đi ngược NFR-SEC-05…07.
- **Tương phản:** mỗi theme được kiểm WCAG AA tự động trước khi áp.
- **Bền:** cập nhật giao diện không làm hỏng theme của người dùng; hướng dẫn và ảnh chụp tài liệu chỉ cần một bố cục.

**Phân biệt tên:** "Giao diện ứng dụng" (theme app, mục này) khác "Phong cách video" (preset `theme` của CUSTOMIZATION.md mục 6, ví dụ "Bản in"). Cột Presets ở thẻ Preview chỉ chứa phong cách video; theme app chọn ở Settings và nút sáng/tối trên thanh trên.
