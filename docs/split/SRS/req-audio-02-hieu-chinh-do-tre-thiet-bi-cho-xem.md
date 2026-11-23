---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-AUDIO-02: Hiệu chỉnh độ trễ thiết bị cho Xem trước (T-82)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-AUDIO-02: Hiệu chỉnh độ trễ thiết bị cho Xem trước (T-82)"
chunk: req-audio-02-hieu-chinh-do-tre-thiet-bi-cho-xem.md
source_lines: 643-650
source_sha1: ba41c8b27f
ids: [REQ-AUDIO-02]
---
#### REQ-AUDIO-02: Hiệu chỉnh độ trễ thiết bị cho Xem trước (T-82)
Trình duyệt chỉ ước lượng độ trễ đầu ra (`baseLatency`, `outputLatency`, `getOutputTimestamp`) và thường sai ở tai nghe không dây hoặc giao diện âm thanh ngoài. Người dùng đo bù bằng cách **gõ theo nhịp**; kết quả chỉ làm hình khớp tiếng ở Xem trước **trên máy này**.
* **Bài đo:** 110 BPM, nhịp 4/4: 4 ô đo, không có ô khởi động; mỗi ô là kick, kick, một tiếng snare ở phách 3, lặng; người dùng gõ vào phách 3 (nút hoặc Space/Enter). Tiếng tổng hợp, mẫu đầu ở đỉnh (không hiện dần) để mốc nghe trùng mốc lên lịch.
* **Tính:** mỗi lần gõ được quy về giờ nghe được trên trục `AudioContext` (cùng `heardContextTime` của đồng hồ chủ); lệch = giờ nghe được lúc gõ − giờ phách 3. Chỉ lần gõ trong cửa sổ [−250 ms, +450 ms] quanh phách 3 được tính (gõ thêm theo kick không sao); mỗi lần gõ chỉ dùng cho một phách 3. **Kết quả = trung vị** các ô hợp lệ, cần **≥ 3/4 ô**; chênh lớn–nhỏ nhất > 30 ms thì cảnh báo không ổn định. Lệch dương = hình đi trước tiếng, nên **trừ** khỏi giờ nghe được; kẹp ±500 ms. Kết quả gồm độ trễ thiết bị mà trình duyệt không báo, độ trễ bàn phím/chuột và thói quen gõ sớm/muộn của người gõ (không tách riêng được), nên là ước lượng; người dùng chỉnh tay thêm được.
* **Hồ sơ thiết bị:** có tên (≤ 40 ký tự, không trùng), tối đa 16, người dùng **tự chọn** (không tự nhận diện thiết bị); lưu theo trình duyệt (`localStorage`); xuất/nhập tệp JSON `dawviz-device-latency` (≤ 4 KB, kiểm cỡ trước khi đọc, `JSON.parse`, trường lạ bị bỏ). Không chọn hồ sơ = 0 (chỉ theo ước lượng của trình duyệt).
* **Tách biệt:** độ lệch thiết bị **không** nằm trong `audioOffsetMs`, preset, Project Pack hay đường xuất; không đổi lịch phát âm thanh, chỉ đổi giờ nghe được khi đọc đồng hồ (TECHNICAL-DESIGN §6.2.2).
* **Chưa làm:** chế độ nháy hình (đo bằng mắt thay vì tai), tự gợi ý hồ sơ theo thiết bị đang cắm.
