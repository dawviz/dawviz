---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-02: Bắt dính thông minh"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-02: Bắt dính thông minh"
chunk: req-graphics-02-bat-dinh-thong-minh.md
source_lines: 420-426
source_sha1: 45be2554f6
ids: [D-57, REQ-GRAPHICS-02]
---
#### REQ-GRAPHICS-02: Bắt dính thông minh
* **Lưới**: bước 8 pt hoặc 16 pt, bật/tắt được; làm tròn (x, y) về bội số ô lưới khi kéo.
* **Smart Guides**: ngưỡng ≤ 5 pt theo hệ tọa độ logic, so cạnh trái/giữa/phải và cạnh trên/giữa/dưới với widget khác và mép canvas. Khi chạm ngưỡng thì hút vào và vẽ đường gióng nét đứt màu token `guide` của giao diện ứng dụng (mặc định `#008C9E`, khác tông mọi màu nhấn; xem `docs/design/UI-DIRECTION.md` mục 5.4). Đường gióng là lớp phủ của Edit Mode, không bao giờ vào video xuất. Hỗ trợ khoảng cách đều (Equal Spacing) khi có 3 đối tượng thẳng hàng.
* **Đổi cỡ (D-57):** cạnh hoặc góc đang kéo hút vào mép/tâm khung và cạnh/tâm widget khác theo cùng ngưỡng, có đường gióng; không có đích thì làm tròn theo lưới. Chỉ áp khi góc xoay là bội số của 90° (ở góc xiên cạnh không thẳng trục, hút theo khung bao làm méo widget). Giữ `Shift` (giữ tỉ lệ) thì chỉ hút một trục, trục gần đích hơn. Khi đổi cỡ, `Alt` là co giãn quanh tâm nên tắt tạm bắt dính bằng `Ctrl`/`⌘`.
* **Phím tắt**: giữ `Alt` tắt tạm bắt dính khi kéo (khi đổi cỡ là `Ctrl`/`⌘`, xem trên); giữ `Shift` khóa theo trục; phím mũi tên dịch 1 pt, `Shift` + mũi tên dịch 10 pt.
* Bắt dính chỉ là thao tác chỉnh sửa; không ảnh hưởng dữ liệu layout đã lưu.
