---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-AUDIO-01: Âm thanh theo track (stem), bản 1.2"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-AUDIO-01: Âm thanh theo track (stem), bản 1.2"
chunk: req-audio-01-am-thanh-theo-track-stem-ban-1-2.md
source_lines: 534-546
source_sha1: 06736f0e5a
ids: [ERR_AUDIO_TOO_MANY, P-02, P-13, REQ-AUDIO-01, REQ-EXPORT-00, REQ-GRAPHICS-12, REQ-WIDGET-07, WARN_STEM_LENGTH, WARN_STEM_UNMATCHED]
---
#### REQ-AUDIO-01: Âm thanh theo track (stem), bản 1.2
Tệp dự án DAW chỉ chứa nốt, tempo, automation và **đường dẫn** tới sample/plugin, không chứa âm thanh đã trộn của từng track; một tệp mix chung cũng không tách ngược ra từng track được. Vì vậy mọi thứ cần **âm thanh của riêng một track** đòi người dùng **xuất (render) thêm tệp âm thanh cho track đó** từ DAW.

* **Cần stem:** spectrum, waveform, oscilloscope, meter của riêng một track; binding phản ứng theo âm thanh của một track (`track.audio.rms`, `track.audio.band(lo, hi)`, REQ-GRAPHICS-12/13). **Không cần stem:** mọi thứ dựa trên nốt và automation (Piano Roll, bàn phím, Live Trigger, Event Counter, hợp âm và giọng từ MIDI, độ sáng theo automation, P-02…P-13); widget âm thanh dùng tệp mix chung.
* **Định dạng:** như tệp mix (`.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a`; khả năng giải mã phụ thuộc trình duyệt). Khuyến nghị WAV hoặc FLAC; MP3 có độ trễ đệm đầu tệp của bộ mã hoá (encoder delay) nên có thể lệch vài chục ms.
* **Điều kiện tệp:** mọi stem và tệp mix xuất **từ cùng điểm bắt đầu dự án** (bar 1 hoặc vị trí 0) và cùng độ dài; không cắt khoảng lặng đầu (tắt "trim silence"); cùng tần số lấy mẫu là tốt nhất (khác nhau vẫn nhận, được chuyển đổi khi phân tích). Lệch độ dài quá 50 ms thì cảnh báo `WARN_STEM_LENGTH`; mỗi stem có thanh **offset** riêng ±10 s, bước 1 ms như REQ-WIDGET-07.
* **Ghép stem với track:** tự ghép theo tên tệp so với tên track (không phân biệt hoa thường; bỏ tiền tố số như `01 `, `03-`, `Track 3 - `; bỏ hậu tố như ` (stem)`); tệp không ghép được hiện trong danh sách chờ để **kéo thả** vào track (`WARN_STEM_UNMATCHED`). Một stem có thể gán cho nhiều track (ví dụ stem của nhóm/bus), một track có thể không có stem.
* **Phát và xuất:** có tệp mix thì phát và xuất bằng mix; stem mặc định **chỉ dùng để phân tích**, không phát, tránh âm thanh bị cộng đôi. Không có mix thì cho chọn "phát bằng tổng các stem" (cộng có hệ số, cảnh báo nguy cơ vượt 0 dBFS).
* **Bộ nhớ và hiệu năng:** giải mã từng stem theo khối trong Worker, tính sẵn bộ đệm phân tích dạng mono (đỉnh/RMS, FFT theo khung) rồi **giải phóng PCM** của stem (stem không phát). Giới hạn **[PROVISIONAL]**: tối đa 24 stem, tổng thời lượng stem ≤ 240 phút; vượt thì `ERR_AUDIO_TOO_MANY` kèm gợi ý gộp stem.
* **Lưu trữ:** bộ đệm phân tích (nhỏ) lưu trong phiên và Project Pack, nên mở lại dự án **không cần nạp lại stem**; tệp stem gốc lưu kèm Pack là tuỳ chọn (mặc định không, vì nặng). Nạp lại stem khi muốn đổi tham số phân tích (kích thước FFT, dải tần).
* **Hướng dẫn trong ứng dụng:** khi người dùng chọn một track làm nguồn cho widget âm thanh mà track chưa có stem, hiện thông báo kèm hướng dẫn xuất stem theo DAW nhận diện được từ tệp dự án (bằng ngôn ngữ đang chọn), ví dụ: Ableton Live: *File → Export Audio/Video → Rendered Track: All Individual Tracks*; Reaper: *File → Render → Source: Stems (selected tracks)*; FL Studio: xuất WAV với tuỳ chọn *Split mixer tracks*; Bitwig Studio, Studio One và DAW khác: chức năng xuất stem/track riêng của DAW. Pre-flight (REQ-EXPORT-00) báo widget nào đang thiếu stem.
* **Ngoài phạm vi:** tách nguồn bằng AI ngay trong trình duyệt (tự tách vocal/trống/bass từ tệp mix). Mô hình nặng và kết quả không tất định trên mọi máy; chỉ cân nhắc sau 1.2.
