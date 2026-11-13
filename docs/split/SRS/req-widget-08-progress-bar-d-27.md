---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-08: Progress Bar (D-27)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-08: Progress Bar (D-27)"
chunk: req-widget-08-progress-bar-d-27.md
source_lines: 602-607
source_sha1: ae88fa5f8b
ids: [D-27, REQ-EXPORT-00, REQ-GRAPHICS-05, REQ-WIDGET-08]
---
#### REQ-WIDGET-08: Progress Bar (D-27)
* Thanh tiến độ của bài nhạc, người dùng tự thêm vào Canvas (theo đề xuất Spike 2). Tiến độ `P = clamp((t − rangeStart) / (rangeEnd − rangeStart), 0, 1)`, trong đó khoảng là Export Range nếu có, không thì toàn bộ thời lượng (cùng định nghĩa thời lượng ở REQ-EXPORT-00). Khác `Progress` của Event Counter (theo số nốt).
* Hướng: *Horizontal* (mặc định) hoặc *Vertical*. Kiểu: thanh đầy, đường mảnh có đầu tròn, hoặc các đoạn theo Bar.
* Tuỳ chọn: màu nền/màu tiến độ, bo góc, độ dày, hiển thị `%`, hiển thị thời gian đã qua / còn lại (`mm:ss`), tuỳ chọn đánh dấu ranh giới đoạn hợp âm hoặc mốc Bar (mặc định tắt).
* Chỉ phụ thuộc `t` và khoảng thời gian, nên tất định cho Preview và Export (REQ-GRAPHICS-05). Không cần track gán. Thời lượng bằng 0 thì hiển thị 0%, không chia cho 0.
