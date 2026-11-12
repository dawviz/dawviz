---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-16: Thanh phát (playhead) tuỳ chỉnh"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-16: Thanh phát (playhead) tuỳ chỉnh"
chunk: req-graphics-16-thanh-phat-playhead-tuy-chinh.md
source_lines: 419-428
source_sha1: 06736f0e5a
ids: [REQ-GRAPHICS-09, REQ-GRAPHICS-11, REQ-GRAPHICS-16, REQ-STORAGE-05, REQ-UI-11, REQ-WIDGET-01]
---
#### REQ-GRAPHICS-16: Thanh phát (playhead) tuỳ chỉnh
Vạch đánh dấu thời điểm đang phát trên Piano Roll (và các widget có trục thời gian). Mặc định giữ như hiện tại: một vạch dọc mảnh.
* **1.0:**
  * Hiện/ẩn; **vị trí** dọc theo trục chảy (0–100%, mặc định 25–30%) và lệch thêm theo px.
  * **Kiểu:** vạch liền, nét đứt, chấm; vạch đôi; **dải** (vùng sáng có độ rộng); dải mờ dần hai bên (gradient); có hoặc không có **đầu mũi tên/tam giác** ở hai đầu.
  * **Độ dày** 0,5–40 px; **độ dài** cả khung hoặc một phần (%) căn giữa/đầu/cuối; **màu** qua bộ chọn màu chung (REQ-UI-11, có alpha) hoặc theo màu track của nốt đang chạm; **phát sáng** (cường độ, bán kính); bo đầu.
  * **Phản ứng khi nốt chạm vạch:** nhấp sáng hoặc phình độ dày trong một khoảng ngắn (ms), mức theo velocity; có thể tắt.
  * Thứ tự lớp: trên hoặc dưới nốt. Vạch luôn vuông góc với hướng chảy (kể cả góc tự do của REQ-WIDGET-01).
* **1.1:** vạch là **ảnh/sprite** người dùng nạp (REQ-STORAGE-05); mọi thuộc tính gắn keyframe, binding, biểu thức (REQ-GRAPHICS-09…13), ví dụ độ dày đập theo kick; bộ phát hạt đặt tại vạch (REQ-GRAPHICS-11); preset `playhead` chia sẻ được.
