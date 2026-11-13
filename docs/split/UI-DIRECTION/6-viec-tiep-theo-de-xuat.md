---
doc: UI-DIRECTION.md
doc_title: "Định hướng hình ảnh: khung preview và giao diện web"
section: "6. Việc tiếp theo đề xuất"
path: "6. Việc tiếp theo đề xuất"
chunk: 6-viec-tiep-theo-de-xuat.md
source_lines: 371-377
source_sha1: eb55f9ce9a
ids: [REQ-EXPORT-00, REQ-UI-06, REQ-UI-07, REQ-UI-13, REQ-UI-15]
---
## 6. Việc tiếp theo đề xuất

1. **Vòng 3: các màn chưa có ảnh**, sinh bằng cấu trúc đã chọn: trạng thái rỗng (chưa mở file), hộp chọn Cơ bản/Nâng cao lần đầu (REQ-UI-13), cảnh báo khi nạp và hỏi file `.mid` thiếu (REQ-UI-07, 08), ô tempo khi file thiếu tempo (REQ-UI-06), hộp xuất video và tiến trình xuất (REQ-EXPORT-00), Settings → Giao diện (chọn bảng màu, xem trước tương phản).
2. **Cột Presets có ảnh thu nhỏ:** mỗi phong cách video hiện một khung nhỏ do chính Render Core vẽ từ dự án đang mở (ý từ bảng preset của ChatGPT), không dùng ảnh minh hoạ.
3. **Đặt tên trong giao diện:** thống nhất "Played / Upcoming" (đã phát / sắp tới) cho màu nốt; khoá (lock) chỉ có ở danh sách lớp của Editor, không có ở dòng track của Preview; mọi thanh trượt có ô số (REQ-UI-15).
4. **Dựng token trước khi dựng màn:** chuyển `apps/web/src/index.css` sang bộ token 5.2, làm theme sáng/tối mặc định, rồi mới dựng lại bố cục theo 5.3 (T-70).
