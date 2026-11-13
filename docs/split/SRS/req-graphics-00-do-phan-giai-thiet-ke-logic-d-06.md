---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-00: Độ phân giải thiết kế logic (D-06)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-00: Độ phân giải thiết kế logic (D-06)"
chunk: req-graphics-00-do-phan-giai-thiet-ke-logic-d-06.md
source_lines: 403-407
source_sha1: f0e666678e
ids: [D-06, REQ-GRAPHICS-00]
---
#### REQ-GRAPHICS-00: Độ phân giải thiết kế logic (D-06)
* 16:9: 1920 × 1080 pt; 9:16: 1080 × 1920 pt; 1:1: 1080 × 1080 pt; tùy biến: người dùng nhập kích thước logic cơ sở (W_base, H_base), mỗi cạnh 256–4096 pt.
* Khi xuất, hệ số co giãn `S = W_export / W_base` (ví dụ 3840 / 1920 = 2.0). Nét vẽ, cỡ chữ, bo góc, tọa độ (x, y, w, h) đều nhân `S`.
* Làm tròn tọa độ vẽ ở bước cuối (pixel), không làm tròn khi lưu layout.
