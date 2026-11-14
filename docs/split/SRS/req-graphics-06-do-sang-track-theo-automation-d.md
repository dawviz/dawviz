---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-06: Độ sáng track theo automation (D-33)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-06: Độ sáng track theo automation (D-33)"
chunk: req-graphics-06-do-sang-track-theo-automation-d.md
source_lines: 451-462
source_sha1: 45be2554f6
ids: [D-33, D-50, P-01, P-09, REQ-GRAPHICS-06, REQ-GRAPHICS-07, REQ-GRAPHICS-12, REQ-GRAPHICS-13, REQ-GRAPHICS-17, SOI-18, SOI-19]
---
#### REQ-GRAPHICS-06: Độ sáng track theo automation (D-33)
* Mỗi track có **Nguồn độ sáng**: **`tắt` = đều nhau (mặc định từ 2026-11-12, D-50)**, `volume`, `pan`, `mute` hoặc `mức fader tĩnh`; chọn riêng từng track hoặc áp cho tất cả. Người dùng quyết định sáng hơn hay tối hơn khi âm lượng lớn: có công tắc **đảo chiều**.
* **Sửa 2026-11-12 (D-50):** trong giao diện mục này gọi là **"Độ sáng nền"** và mặc định là **đều nhau**: mọi nốt cùng độ sáng, không theo automation. Độ sáng nền tác động lên độ đục của nốt **suốt thời gian** (kể cả nốt chưa tới). Muốn nốt **phát sáng khi thanh phát chạm** theo velocity, cao độ, pan, fade hay automation thì dùng REQ-GRAPHICS-17; hai cơ chế độc lập và có thể dùng cùng lúc.
* **Volume**: `B(t) = lerp(minB, maxB, volumeToUnit(gain(t), floorDb, ceilDb))`, mặc định `floorDb = −36 dB`, `ceilDb = 0 dB`, `minB = 0,25`, `maxB = 1`; các giá trị này chỉnh được. Giá trị trên `ceilDb` (ví dụ +3 dB) kẹp ở sáng nhất.
* **Đảo chiều**: mặc định giá trị nguồn càng lớn thì càng sáng (âm lượng to → sáng). Bật đảo chiều thì ngược lại (âm lượng to → tối), tức `k = 1 − u` thay cho `k = u` trong công thức trên. Hữu ích khi muốn track đang "lùi" (fade out) nổi bật hơn, hoặc làm hiệu ứng tối dần khi nhạc dồn lên.
* **Phân biệt với cường độ nốt (velocity):** độ sáng ở đây lấy theo **automation của cả track** (fader, pan, mute trong DAW) và thay đổi theo thời gian. Độ mạnh của **từng nốt** (velocity 0–127) là chuyện khác: chọn ở chế độ màu `velocity` của kiểu nốt (REQ-GRAPHICS-07) hoặc gắn vào bất kỳ thuộc tính nào qua binding `note.velocity` (REQ-GRAPHICS-12) và biểu thức (REQ-GRAPHICS-13).
* **Pan / Mute**: dùng lane tương ứng; pan theo độ lệch khỏi giữa, mute sáng/tối theo trạng thái. Chiều pan và nghĩa giá trị mute chưa kiểm (SOI-19), nên hai nguồn này đánh dấu thử nghiệm.
* **Mức fader tĩnh**: dùng `track.mix.volumeDb` khi track không có envelope. Track không có dữ liệu nguồn thì `B = 1` (hình ảnh không đổi).
* Độ sáng áp lên màu nốt/nền của Piano Roll, Live Trigger, Track Info và các widget P-01, P-09; cách áp (đổi độ sáng HSL, độ mờ, hoặc cả hai) tuỳ widget.
* Tất định: `B` chỉ phụ thuộc `t`, automation và cấu hình (tính bằng `sampleLane`/`volumeToUnit` của thư viện); làm mượt tuỳ chọn bằng cửa sổ thời gian cố định, không phụ thuộc tốc độ khung. Lưu trong Preset và Project Pack.
* Nguồn khác Reaper (Ableton, Bitwig, DAWproject): `B = 1` cho tới khi parser đọc được automation (SOI-18).
