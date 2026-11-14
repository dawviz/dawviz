---
doc: UI-DIRECTION.md
doc_title: "Định hướng hình ảnh: khung preview và giao diện web"
section: "3.7 Khung bố cục chung (từ vòng 1, dùng cho vòng 2)"
path: "3. Bộ prompt sinh ảnh giao diện web > 3.7 Khung bố cục chung (từ vòng 1, dùng cho vòng 2)"
chunk: 3-7-khung-bo-cuc-chung-tu-vong-1-dung-cho-vong-2.md
source_lines: 160-177
source_sha1: 4b6c40ad59
ids: [REQ-UI-13]
---
### 3.7 Khung bố cục chung (từ vòng 1, dùng cho vòng 2)
Ảnh 4 khung của ChatGPT cho bố cục ưng ý nhất; giữ lại làm **khung chung**, chỉ đổi phong cách:

- **Thanh trên:** biểu tượng + "DAW Visualizer"; ba thẻ **Preview / Editor / Settings**; bên phải: công tắc **Basic | Advanced**, nút "Open file", nút chính "Export video", nút đổi theme sáng/tối, "EN".
- **Cột trái hẹp:** danh sách preset (Paper đang chọn, Dark, Minimal, Neon, Calm).
- **Giữa:** sân khấu preview (khung video), dưới là thanh phát: lùi, phát, tới, thanh tua có sóng âm mờ, "1:35 / 2:34".
- **Cột phải:** bảng chỉnh (inspector).

**Cơ bản / Nâng cao: theo REQ-UI-13, gộp cả ba ý đã bàn:**

1. **Công tắc ở thanh trên** đổi cả giao diện giữa hai chế độ (REQ-UI-13 đã quy định).
2. **Ở thẻ Preview, Nâng cao mở rộng ngay tại chỗ:** cùng bố cục, inspector có thêm mục và thêm dòng (mỗi mục đánh số, gập/mở được, cuộn riêng). Ở Cơ bản, mỗi mục có nút "More options" để mở phần nâng cao của riêng mục đó mà không đổi cả giao diện (REQ-UI-13 "Mở từng bảng").
3. **Thẻ Editor** là chỗ của những thứ quá nhiều để nhét vào inspector: chỉnh bố cục widget trên khung (khung chọn, đường gióng), danh sách lớp, thuộc tính widget, timeline có làn track, làn hợp âm và keyframe. Ở Cơ bản, Editor chỉ còn kéo thả widget và chọn preset bố cục (đúng bảng phân bổ REQ-UI-13: "Widget và bố cục", "Hiệu ứng và storyboard").

**Settings** chứa theme, ngôn ngữ, chế độ mặc định, mặc định xuất; không cần sinh ảnh ở vòng 2.

Đây là đề xuất cho vòng 2; chốt khi chọn được phong cách.
