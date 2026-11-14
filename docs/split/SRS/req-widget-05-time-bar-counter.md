---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-05: Time & Bar Counter"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-05: Time & Bar Counter"
chunk: req-widget-05-time-bar-counter.md
source_lines: 580-589
source_sha1: 45be2554f6
ids: [REQ-AST-01, REQ-WIDGET-05]
---
#### REQ-WIDGET-05: Time & Bar Counter
* **Đồng hồ thực**: `mm:ss.sss`.
* **Đồng hồ nhạc**: `Bar : Beat : Sub-Tick`, Bar bắt đầu từ 1 (ví dụ `1.1.000`).
* Một beat dài `960 × 4 / denominator` tick (4/4 → 960; 6/8 → 480). Sub-Tick là phần tick lẻ trong beat.
* Tra cứu bằng TempoMap; đúng cả khi số chỉ nhịp đổi giữa bài. Nốt/Bar bắt đầu ở điểm đổi nhịp.
* **Định dạng chia nhóm (bổ sung T-69):** ngoài hai dạng trên, chọn dạng **chia nhóm có số 0 đứng đầu**: thời gian `mm ss mmm` hoặc nhạc `Bar Beat Sub` thành các nhóm rộng cố định cách nhau một khoảng trắng; độ rộng từng nhóm chỉnh được, mặc định 3. Ví dụ đồng hồ thực `001 35 083` (phút 001, giây 35, mili giây 083) và đồng hồ nhạc `037 06 093` (Bar 037, Beat 06, Sub 093). Số lớn hơn độ rộng nhóm thì hiện đủ chữ số, không cắt.
* **Chú thích nhỏ:** mỗi đồng hồ có thể có nhãn chữ nhỏ (mặc định `time`, `beat`, mẫu chữ tự sửa) đặt trên-phải của số, cỡ chữ riêng; tắt được.
* **Thanh tiến độ trong beat/bar:** mỗi đồng hồ nhạc có thể kèm hai vạch mảnh: vạch **beat** đầy dần từ 0 đến 1 trong beat hiện tại, vạch **bar** đầy dần trong ô nhịp hiện tại (`phần beat / số beat mỗi ô`). Độ dài, độ dày, màu nền và màu tiến độ chỉnh được; tắt được. Tất cả chỉ phụ thuộc `t` và `tempoMap`, nên tất định.
* **Dữ liệu dấu nhịp:** lấy từ `tempoMap[i].timeSigNumerator/timeSigDenominator` của AST (REQ-AST-01); không cần trường mới. Dự án không có dấu nhịp thì mặc định 4/4 (`makeTempoMap`). Tính trước bảng ranh giới Bar theo tick một lần khi nạp AST để tra bằng tìm nhị phân.
