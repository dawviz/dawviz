---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-04: Live Note Trigger"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-04: Live Note Trigger"
chunk: req-widget-04-live-note-trigger.md
source_lines: 491-495
source_sha1: 77837e7134
ids: [REQ-WIDGET-04]
---
#### REQ-WIDGET-04: Live Note Trigger
* Lọc nốt thỏa `startTimeSeconds ≤ t < endTimeSeconds`; hiển thị tên nốt và lực gõ (ví dụ `B2 (Vel: 70)`).
* **Fade-out Tail**: nốt vừa kết thúc còn trong danh sách thêm 100–1000 ms (cấu hình được), độ trong suốt giảm dần về 0.
* Danh sách dài hơn số dòng hiển thị: sắp theo pitch giảm dần và cắt bớt, có thể hiện "+N".
