---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-02: Bắt dính thông minh"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-02: Bắt dính thông minh"
chunk: req-graphics-02-bat-dinh-thong-minh.md
source_lines: 413-418
source_sha1: 06736f0e5a
ids: [REQ-GRAPHICS-02]
---
#### REQ-GRAPHICS-02: Bắt dính thông minh
* **Lưới**: bước 8 pt hoặc 16 pt, bật/tắt được; làm tròn (x, y) về bội số ô lưới khi kéo.
* **Smart Guides**: ngưỡng ≤ 5 pt theo hệ tọa độ logic, so cạnh trái/giữa/phải và cạnh trên/giữa/dưới với widget khác và mép canvas. Khi chạm ngưỡng thì hút vào và vẽ đường gióng nét đứt màu `#FF5500`. Hỗ trợ khoảng cách đều (Equal Spacing) khi có 3 đối tượng thẳng hàng.
* **Phím tắt**: giữ `Alt` tắt tạm bắt dính; giữ `Shift` khóa theo trục; phím mũi tên dịch 1 pt, `Shift` + mũi tên dịch 10 pt.
* Bắt dính chỉ là thao tác chỉnh sửa; không ảnh hưởng dữ liệu layout đã lưu.
