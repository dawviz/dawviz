---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-06: Độ sáng track theo automation (D-33)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-GRAPHICS-06: Độ sáng track theo automation (D-33)"
chunk: req-graphics-06-do-sang-track-theo-automation-d.md
source_lines: 427-435
source_sha1: 6c3a823de0
ids: [D-33, P-01, P-09, REQ-GRAPHICS-06, SOI-18, SOI-19]
---
#### REQ-GRAPHICS-06: Độ sáng track theo automation (D-33)
* Mỗi track có **Nguồn độ sáng**: `volume` (**mặc định**), `pan`, `mute`, `mức fader tĩnh` hoặc `tắt`; chọn riêng từng track hoặc áp cho tất cả. Người dùng quyết định sáng hơn hay tối hơn khi âm lượng lớn: có công tắc **đảo chiều**.
* **Volume**: `B(t) = lerp(minB, maxB, volumeToUnit(gain(t), floorDb, ceilDb))`, mặc định `floorDb = −36 dB`, `ceilDb = 0 dB`, `minB = 0,25`, `maxB = 1`; các giá trị này chỉnh được. Giá trị trên `ceilDb` (ví dụ +3 dB) kẹp ở sáng nhất.
* **Pan / Mute**: dùng lane tương ứng; pan theo độ lệch khỏi giữa, mute sáng/tối theo trạng thái. Chiều pan và nghĩa giá trị mute chưa kiểm (SOI-19), nên hai nguồn này đánh dấu thử nghiệm.
* **Mức fader tĩnh**: dùng `track.mix.volumeDb` khi track không có envelope. Track không có dữ liệu nguồn thì `B = 1` (hình ảnh không đổi).
* Độ sáng áp lên màu nốt/nền của Piano Roll, Live Trigger, Track Info và các widget P-01, P-09; cách áp (đổi độ sáng HSL, độ mờ, hoặc cả hai) tuỳ widget.
* Tất định: `B` chỉ phụ thuộc `t`, automation và cấu hình (tính bằng `sampleLane`/`volumeToUnit` của thư viện); làm mượt tuỳ chọn bằng cửa sổ thời gian cố định, không phụ thuộc tốc độ khung. Lưu trong Preset và Project Pack.
* Nguồn khác Reaper (Ableton, Bitwig, DAWproject): `B = 1` cho tới khi parser đọc được automation (SOI-18).
