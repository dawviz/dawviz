---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-05: Time & Bar Counter"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-05: Time & Bar Counter"
chunk: req-widget-05-time-bar-counter.md
source_lines: 549-554
source_sha1: c62aee35b6
ids: [REQ-WIDGET-05]
---
#### REQ-WIDGET-05: Time & Bar Counter
* **Đồng hồ thực**: `mm:ss.sss`.
* **Đồng hồ nhạc**: `Bar : Beat : Sub-Tick`, Bar bắt đầu từ 1 (ví dụ `1.1.000`).
* Một beat dài `960 × 4 / denominator` tick (4/4 → 960; 6/8 → 480). Sub-Tick là phần tick lẻ trong beat.
* Tra cứu bằng TempoMap; đúng cả khi số chỉ nhịp đổi giữa bài. Nốt/Bar bắt đầu ở điểm đổi nhịp.
