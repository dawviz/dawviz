---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-07: Audio Spectrum & Meter (D-10, ARC-03, ARC-06)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-07: Audio Spectrum & Meter (D-10, ARC-03, ARC-06)"
chunk: req-widget-07-audio-spectrum-meter-d-10-arc-03-a.md
source_lines: 629-642
source_sha1: 49d4aaf8cd
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
* **Hiện trạng (T-53, 2026-11-20): một widget, hai hình dạng.** Thay vì nhiều widget riêng (cột dọc, đối xứng…), `AUDIO_SPECTRUM` có thuộc tính `shape`: **LINE** (cột xếp theo một đường, `angle` −360…360° = hướng đường, `length` và `thickness` = chiều dài đường và độ cao cột, `mirror` = mọc hai phía) và **CIRCLE** (cột toả quanh tâm, `radius`, `thickness`, `startAngle`, `mirror` = đối xứng trái phải). Chung: 8–128 cột, dải tần (thang log), đảo chiều, gradient theo tần số, bo góc, attack/release tất định, sàn/trần dB, độ đục, phát sáng. Phân tích: FFT cơ số 2 tự cài, Hann 2048, mỗi 10 ms một khung, 128 dải log 30 Hz–16 kHz lượng tử 8 bit (−80…0 dBFS) cùng đỉnh/RMS; tính một lần ở Worker khi nạp âm thanh, **cùng một bảng** dùng cho Xem trước và Export (gửi kèm lệnh xuất). Hình chữ nhật xoay là primitive mới (`RectPrim.rotation`). **Cập nhật 2026-11-22 (G6):** thêm `style` Bars/Area/Line/Dots/Oscilloscope/Waveform tổng quan/Meter, thang Log/Tuyến tính/Mel, chấm đỉnh rơi chậm, 8–256 cột; Oscilloscope đọc bảng dạng sóng thu nhỏ (~4 kHz) tính cùng phân tích. **Chưa làm:** xoắn ốc (1.1), nguồn stem (REQ-AUDIO-01).
* **Nguồn âm thanh:** 1.0 dùng một tệp audio tổng (mix). Hiện spectrum, waveform hay meter **riêng cho từng track** cần âm thanh tách track (stem) do người dùng xuất từ DAW: xem **REQ-AUDIO-01** (bản 1.2). Widget chọn nguồn là tệp tổng hoặc stem của track nào.
