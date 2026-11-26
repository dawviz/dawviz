---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-01: Piano Roll"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-01: Piano Roll"
chunk: req-widget-01-piano-roll.md
source_lines: 582-593
source_sha1: fee32c2554
ids: [D-15, NFR-PERF-02, REQ-GRAPHICS-09, REQ-GRAPHICS-15, REQ-WIDGET-01]
---
#### REQ-WIDGET-01: Piano Roll
* **Hướng cuộn**: *Horizontal* (mặc định): nốt chạy phải sang trái, Playhead thẳng đứng tại `playheadPositionRatio` (mặc định 30% từ mép trái). *Vertical*: nốt rơi từ trên xuống, Playhead nằm ngang (mặc định 75% từ mép trên).
  * **Góc tự do (bổ sung tài liệu v1.1, bản phát hành 1.0):** ngoài 4 hướng, chọn **góc dòng chảy** bất kỳ 0–360° (bắt dính mỗi 15° khi kéo, giữ Shift để tự do; nhập số). Quy ước: 0° = nốt chạy từ phải sang trái (mặc định), 90° = nốt rơi từ trên xuống. Toàn bộ làn nốt, vạch phát và bàn phím xoay theo; làn tự kéo dài để phủ kín khung widget ở mọi góc (không lộ góc trống); tên nốt trên phím có tuỳ chọn luôn đứng thẳng. Đây là thuộc tính bên trong Piano Roll nên không phụ thuộc D-15 (xoay khung widget); góc có keyframe được từ REQ-GRAPHICS-09. Nghiêng trong không gian 3D là REQ-GRAPHICS-15 (1.1).
* **Đa track**: gán một hoặc nhiều track; mỗi track vẽ bằng `track.color`.
* **Thanh nốt**: hình chữ nhật bo góc, độ dài tỉ lệ với `durationSeconds`; vẽ nốt đang phát sáng hơn nốt chưa phát.
* **Pitch Range**: *Custom Octave Range* (mặc định, 21–108 = A0–C8, đủ 88 phím) cho chọn khoảng (ví dụ C2–C6), nốt ngoài khoảng bị cắt; *Fit to Content* lấy min/max pitch của track được gán (±1 bán cung). Giao diện nhập khoảng bằng tên nốt (C1, C#3), tệp JSON lưu số MIDI (`pitchMin`, `pitchMax`).
* **Scroll Mode**: *Scroll* (mặc định) nốt cuộn qua vạch phát cố định; *Page* nốt đứng yên theo trang dài `visibleSeconds`, vạch phát chạy ngang rồi sang trang mới, nốt qua biên trang bị cắt ở mép trang.
* **Lookahead**: 1.0 đến 8.0 giây (mặc định 3.0).
* **Đã làm (T-59, 2026-11-25):** `flowAngle` 0–360° (nhập số; bắt dính 15° khi kéo chưa có), `flowMirror` lật trục cao độ (90° + lật = nốt rơi, nốt trầm bên trái), `labelsUpright` (tên nốt và số ô nhịp đứng thẳng hoặc xoay theo làn). Làn dựng trong hệ toạ độ riêng rồi xoay quanh tâm khung; kích thước làn = hộp bao của khung đã xoay ngược nên phủ kín khung ở mọi góc; tỉ lệ thời gian và vị trí vạch phát tính trên đoạn trục thời gian qua tâm nằm trong khung (ở 0° đúng như trước); bàn phím kéo dài từ mép làn tới vạch phát. Preset cũ ghi `orientation: VERTICAL` đọc thành 90°. Ở góc không bội 90° mà bật bàn phím, phần lớn bàn phím nằm ngoài khung; mũi tên vạch phát ở đầu làn cũng ra ngoài khung khi độ dài = 1.
* **Lưới ô nhịp (2026-11-25):** `grid.bars` (vạch đầu ô nhịp), `grid.beats` (vạch phách, độ đục ×0,45), `grid.numbers` (số ô nhịp nhỏ ở đầu mỗi ô), `grid.color`, `grid.opacity`; theo lưới ô nhịp của bài (`gridLinesIn` trên `BarGrid`) nên đúng khi đổi tempo/nhịp; vẽ dưới nốt và dưới bàn phím.
* **Hiệu năng**: chỉ vẽ nốt giao với cửa sổ thời gian hiển thị (tìm bằng chỉ mục theo `startTick`), không duyệt toàn bộ nốt mỗi khung (NFR-PERF-02).
