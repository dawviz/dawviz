---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-08: Hiệu ứng chuyển động tất định (D-37)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-08: Hiệu ứng chuyển động tất định (D-37)"
chunk: req-graphics-08-hieu-ung-chuyen-dong-tat-dinh-d.md
source_lines: 475-479
source_sha1: f0e666678e
ids: [D-37, REQ-GRAPHICS-08]
---
#### REQ-GRAPHICS-08: Hiệu ứng chuyển động tất định (D-37)
* Hiệu ứng của đối tượng (xuất hiện, bật sáng khi nốt bắt đầu, tắt dần, chuyển cảnh) là **hàm thuần của `t`** và cấu hình, tính trong Render Core; cùng `t` luôn cho cùng giá trị, tua tới/lui không để lại trạng thái.
* Thời lượng và đường cong (easing) chỉnh được và lưu trong Preset.
* Giao diện ứng dụng được dùng CSS/Framer Motion, nhưng khung hình xuất **không** phụ thuộc chúng.
