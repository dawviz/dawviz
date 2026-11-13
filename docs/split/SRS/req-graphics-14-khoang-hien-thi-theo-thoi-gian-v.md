---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-14: Khoảng hiển thị theo thời gian và theo track"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) > REQ-GRAPHICS-14: Khoảng hiển thị theo thời gian và theo track"
chunk: req-graphics-14-khoang-hien-thi-theo-thoi-gian-v.md
source_lines: 848-852
source_sha1: f3c5cc8778
ids: [P-04, P-09, P-10, REQ-GRAPHICS-09, REQ-GRAPHICS-14, REQ-UI-03, REQ-WIDGET-07]
---
#### REQ-GRAPHICS-14: Khoảng hiển thị theo thời gian và theo track
* **1.0:** mọi widget và phần tử cảnh có danh sách **khoảng hiển thị** (`from`–`to`), nhập bằng giây, `bar.beat` hoặc chọn **marker** của dự án (P-10); có thời gian hiện dần/ẩn dần và easing (REQ-GRAPHICS-09). Mặc định: hiện suốt bài. Kéo hai đầu khoảng trực tiếp trên timeline (REQ-UI-03).
* **Gán track:** widget dùng dữ liệu nốt (Piano Roll, Track Info, Live Trigger, Event Counter, bàn phím, P-04…P-09) chọn một, nhiều hoặc tất cả track. Có thể **đổi tập track theo khoảng thời gian** (ví dụ đoạn verse chỉ hiện piano, đoạn điệp khúc hiện thêm dây), khai báo như một khoảng hiển thị kèm danh sách track.
* Spectrum/waveform: khoảng hiển thị như trên; chọn nguồn audio theo REQ-WIDGET-07.
