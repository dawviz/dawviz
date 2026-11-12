---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-01: Piano Roll"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-01: Piano Roll"
chunk: req-widget-01-piano-roll.md
source_lines: 474-481
source_sha1: 77837e7134
ids: [NFR-PERF-02, REQ-WIDGET-01]
---
#### REQ-WIDGET-01: Piano Roll
* **Hướng cuộn**: *Horizontal* (mặc định): nốt chạy phải sang trái, Playhead thẳng đứng tại `playheadPositionRatio` (mặc định 30% từ mép trái). *Vertical*: nốt rơi từ trên xuống, Playhead nằm ngang (mặc định 75% từ mép trên).
* **Đa track**: gán một hoặc nhiều track; mỗi track vẽ bằng `track.color`.
* **Thanh nốt**: hình chữ nhật bo góc, độ dài tỉ lệ với `durationSeconds`; vẽ nốt đang phát sáng hơn nốt chưa phát.
* **Pitch Range**: *Fit to Content* (mặc định) lấy min/max pitch của track được gán; *Custom Octave Range* cho chọn khoảng (ví dụ C2–C6), nốt ngoài khoảng bị cắt.
* **Lookahead**: 1.0 đến 8.0 giây (mặc định 3.0).
* **Hiệu năng**: chỉ vẽ nốt giao với cửa sổ thời gian hiển thị (tìm bằng chỉ mục theo `startTick`), không duyệt toàn bộ nốt mỗi khung (NFR-PERF-02).
