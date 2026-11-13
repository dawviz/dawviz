---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-04: Live Note Trigger"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-04: Live Note Trigger"
chunk: req-widget-04-live-note-trigger.md
source_lines: 551-557
source_sha1: f3c5cc8778
ids: [REQ-WIDGET-04]
---
#### REQ-WIDGET-04: Live Note Trigger
* Lọc nốt thỏa `startTimeSeconds ≤ t < endTimeSeconds`; hiển thị tên nốt và lực gõ (ví dụ `B2 (Vel: 70)`).
* **Fade-out Tail**: nốt vừa kết thúc còn trong danh sách thêm 100–1000 ms (cấu hình được), độ trong suốt giảm dần về 0.
* Danh sách dài hơn số dòng hiển thị: sắp theo pitch giảm dần và cắt bớt, có thể hiện "+N".
* **Kiểu hiển thị (bổ sung T-69):** *Danh sách dọc* (mặc định, như trên) hoặc **một dòng ngang**: các nốt đang phát nối trên một dòng, cách nhau bằng khoảng trắng, ví dụ `Note: E3 (Vel: 82)   Note: E4 (Vel: 80)`; mẫu chữ của từng nốt tự sửa được (`Note: {name} (Vel: {velocity})`). Dòng quá rộng so với khung widget thì cắt bớt nốt thấp nhất và hiện `+N`. Căn lề trái/giữa/phải theo khung.
* **Hậu tố tên track:** tuỳ chọn thêm tên track cuối dòng hoặc cuối mỗi nốt, ví dụ `< Track 1`; tên lấy từ `track.name`, chỉ hiện track có nốt đang phát; mẫu hậu tố tự sửa (`< {track}`).
