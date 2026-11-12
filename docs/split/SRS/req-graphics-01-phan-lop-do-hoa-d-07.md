---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-01: Phân lớp đồ họa (D-07)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-01: Phân lớp đồ họa (D-07)"
chunk: req-graphics-01-phan-lop-do-hoa-d-07.md
source_lines: 407-412
source_sha1: d7467a1f28
ids: [D-07, REQ-GRAPHICS-01]
---
#### REQ-GRAPHICS-01: Phân lớp đồ họa (D-07)
1. **Nền cố định**: màu nền hoặc ảnh nền (phủ kín, chế độ cover).
2. **Widget tự do (1..N)**: mỗi widget có `zIndex` nguyên riêng; có Bring to Front / Send to Back.
3. **Playhead**: thuộc Piano Roll, vẽ đè lên thanh nốt nhưng nằm dưới widget có `zIndex` cao hơn Piano Roll.
4. **Lớp tương tác cố định**: khung chọn, điểm neo, đường gióng. Chỉ có ở Edit Mode; ẩn hoàn toàn ở Preview Mode và khi xuất.
