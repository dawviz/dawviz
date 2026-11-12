---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-03: Event Counter"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-03: Event Counter"
chunk: req-widget-03-event-counter.md
source_lines: 486-490
source_sha1: 77837e7134
ids: [REQ-WIDGET-03]
---
#### REQ-WIDGET-03: Event Counter
* "Event" là một Note-On; hợp âm 4 nốt cùng lúc tính 4 Events.
* Trường hiển thị (bật/tắt riêng): **Played Notes** (số nốt có `startTimeSeconds ≤ t`), **Total Notes** (nốt của các track đang hiển thị), **Progress** `P = Played / Total × 100%`, **Tempo hiện tại** (BPM).
* `Total = 0` thì hiển thị 0 và `0%`, không chia cho 0.
