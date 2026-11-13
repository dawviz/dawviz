---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-07: Audio Spectrum & Meter (D-10, ARC-03, ARC-06)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-07: Audio Spectrum & Meter (D-10, ARC-03, ARC-06)"
chunk: req-widget-07-audio-spectrum-meter-d-10-arc-03-a.md
source_lines: 578-590
source_sha1: 0fd28ef586
ids: [ARC-03, ARC-06, D-10, D-54, ERR_AUDIO_DECODE, ERR_AUDIO_TOO_LONG, REQ-AUDIO-01, REQ-GRAPHICS-03, REQ-WIDGET-07]
---
#### REQ-WIDGET-07: Audio Spectrum & Meter (D-10, ARC-03, ARC-06)
* Hoạt động khi nạp audio hợp lệ (`.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a`). Trình duyệt không giải mã được thì báo `ERR_AUDIO_DECODE` và vẫn cho tiếp tục không có audio.
* **Giới hạn bộ nhớ** **[PROVISIONAL]**: thời lượng audio giải mã tối đa 20 phút; vượt thì `ERR_AUDIO_TOO_LONG`. Cache phân tích (đỉnh/RMS, FFT) lưu dạng mono; PCM stereo chỉ giữ cho phát/mã hóa và nên giải mã theo khối.
* **Offset**: thanh trượt ±10.0 giây, bước 1 ms.
* **FFT tất định**: tự cài FFT (cửa sổ Hann, kích thước 2048 **[PROVISIONAL]**) tính từ PCM tại thời điểm `t`; Preview không dùng `AnalyserNode` để Export cho cùng kết quả.
* **Kiểu hiển thị**: Frequency Bars (16–128 cột, thang log hoặc tuyến tính), Mirrored Spectrum, Oscilloscope, Peak & Crest Factor Meter (dBFS đỉnh và tỉ số đỉnh/RMS).
* **Hướng cột (sửa v1.2, D-54, bản 1.0):** cột mọc **lên, xuống, sang trái, sang phải**, hoặc **đối xứng** quanh trục giữa ngang hay dọc; trục tần số chạy theo chiều còn lại (đảo được). Đây là thuộc tính bên trong widget, nên spectrum dựng đứng dọc mép khung không cần xoay khung; mọi góc khác dùng xoay widget (REQ-GRAPHICS-03). Áp cho Bars, Mirrored, Line/Area, Dots, Waveform tổng quan và Meter; Oscilloscope dùng cùng trục.
* Khi chưa có audio nhưng widget vẫn được đặt: áp dụng quy tắc trạng thái rỗng ở đầu mục 3.4.
* **Tuỳ chỉnh hình dạng (bổ sung v1.1 tài liệu):**
  * **1.0:** kiểu Bars, Mirrored, Line/Area (đường phổ liền), Dots, Oscilloscope (dạng sóng tức thời), **Waveform tổng quan** (toàn bài, có vạch phát và phần đã phát tô màu khác), Peak/RMS Meter. Tham số: số cột 8–256, thang tần số log/tuyến tính/mel, dải tần (ví dụ 30 Hz–16 kHz), độ rộng và khe cột, bo góc, hướng (theo mục "Hướng cột" ở trên), làm mượt theo thời gian (attack/release ms, tính tất định từ PCM, không mô phỏng), chấm đỉnh rơi chậm (peak cap), màu đơn / gradient theo tần số / gradient theo biên độ, độ đục, phát sáng.
  * **1.1:** dạng **tròn/radial** (cột toả quanh tâm, có thể đặt ảnh hoặc logo ở giữa), xoắn ốc, đường cong tuỳ vẽ làm "đường nền" cho cột chạy theo; hình cột là sprite người dùng nạp; mọi tham số gắn được keyframe/biểu thức (ví dụ bán kính đập theo kick).
* **Nguồn âm thanh:** 1.0 dùng một tệp audio tổng (mix). Hiện spectrum, waveform hay meter **riêng cho từng track** cần âm thanh tách track (stem) do người dùng xuất từ DAW: xem **REQ-AUDIO-01** (bản 1.2). Widget chọn nguồn là tệp tổng hoặc stem của track nào.
