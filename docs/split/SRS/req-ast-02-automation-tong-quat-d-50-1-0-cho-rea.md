---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-AST-02: Automation tổng quát (D-50; 1.0 cho Reaper track + MIDI CC, các nguồn khác theo tệp mẫu)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.3. Đồ họa Canvas, hệ tọa độ & bắt dính (BR-02) > REQ-AST-02: Automation tổng quát (D-50; 1.0 cho Reaper track + MIDI CC, các nguồn khác theo tệp mẫu)"
chunk: req-ast-02-automation-tong-quat-d-50-1-0-cho-rea.md
source_lines: 513-525
source_sha1: 0fd28ef586
ids: [D-50, REQ-AST-02, REQ-AUDIO-01, REQ-GRAPHICS-06, REQ-GRAPHICS-13, REQ-GRAPHICS-17, SOI-18]
---
#### REQ-AST-02: Automation tổng quát (D-50; 1.0 cho Reaper track + MIDI CC, các nguồn khác theo tệp mẫu)
Automation phải điều khiển được **mọi thuộc tính số** của khung hình (phát sáng, kích thước, màu, vị trí, tham số hiệu ứng…), **miễn là DAW hoặc plugin lưu automation đó trong tệp dự án**.

* **Lược đồ:** ngoài `automation.volume/pan/mute` hiện có (giữ để tương thích), `ProjectTrack.automation` nhận **lane tuỳ ý** theo khoá `id`. Mỗi lane có `kind`: `volume` | `pan` | `mute` | `send` | `plugin` | `midi-cc` | `pitch-bend` | `other`; nhãn `name` hiển thị; với `plugin` thêm `plugin: { name, vendor? }` và `param: { name, index? }`; tuỳ chọn `range: { min, max, unit? }` để chuẩn hoá. Điểm giữ dạng `{ tick, timeSeconds, value, shape, tension? }` như cũ.
* **Chuẩn hoá về 0..1** (dùng chung cho REQ-GRAPHICS-17 và bindings): `volume` theo dB trong [−36, 0] (như REQ-GRAPHICS-06); `pan` −1..1 → 0..1; `mute` 0/1; `midi-cc` `value / 127`; `pitch-bend` −8192..8191 → 0..1; `plugin` và `other` dùng `range` nếu có, không thì coi giá trị đã ở 0..1 (Reaper và DAWproject lưu tham số plugin dạng chuẩn hoá) **[VERIFY]**.
* **Nguồn theo DAW** (trạng thái):
  * Reaper: `VOLENV2/PANENV2/MUTEENV` của track **đã đọc**; envelope tham số FX `PARMENV` và send `AUXVOLENV` **chưa đọc** **[VERIFY]**; envelope trong item/take chưa đọc (SOI-18).
  * `.mid`: Control Change (CC1 mod wheel, CC7, CC10, CC11, CC64…) và pitch bend thành lane `midi-cc`/`pitch-bend` **chưa đọc** (làm được ngay, không cần tệp mẫu đặc biệt).
  * Ableton `.als`: `AutomationEnvelopes` ghép `PointeeId` với tham số mixer/thiết bị **chưa đọc** **[VERIFY]** (SOI-18).
  * DAWproject: `<Points target=…>` theo tham số **chưa đọc** **[VERIFY]** (SOI-18).
* **Giới hạn:** điều chế bên trong plugin (LFO, envelope nội bộ của synth) không được lưu thành automation trong tệp dự án, nên không đọc được; người dùng cần ghi nó thành automation trong DAW hoặc nạp stem (REQ-AUDIO-01).
* **Dùng automation cho thuộc tính khác:** qua bindings (`{ "bind": "track.automation.<id>", … }`, CUSTOMIZATION §3.3) và biểu thức (REQ-GRAPHICS-13). Giao diện liệt kê lane theo tên đọc được (ví dụ "Serum · Filter Cutoff"); lane không có trong dự án đang mở được đánh dấu.
