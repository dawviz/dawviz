---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-03: Trường xoay widget (D-15)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-03: Trường xoay widget (D-15)"
chunk: req-graphics-03-truong-xoay-widget-d-15.md
source_lines: 419-421
source_sha1: baed28c4a6
ids: [D-15, D-47, REQ-GRAPHICS-03, REQ-GRAPHICS-15]
---
#### REQ-GRAPHICS-03: Trường xoay widget (D-15)
Mọi widget có trường `layout.rotation` (độ). Ở v1.0 giá trị khóa là 0, ẩn điểm xoay. Preset nhập vào có `rotation ≠ 0` bị đưa về 0 kèm cảnh báo. **Cập nhật tài liệu v1.1 (D-47):** từ bản phát hành **1.1**, `rotation` trở thành `rotateZ` trong biến đổi 3D của REQ-GRAPHICS-15 và chỉnh được; bắt dính tắt với phần tử đã xoay.
