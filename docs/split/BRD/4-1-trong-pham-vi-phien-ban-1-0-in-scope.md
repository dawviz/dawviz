---
doc: BRD.md
doc_title: "TÀI LIỆU YÊU CẦU NGHIỆP VỤ (BUSINESS REQUIREMENTS DOCUMENT - BRD)"
section: "4.1. Trong phạm vi phiên bản 1.0 (In-Scope)"
path: "4. PHẠM VI DỰ ÁN (PROJECT SCOPE) > 4.1. Trong phạm vi phiên bản 1.0 (In-Scope)"
chunk: 4-1-trong-pham-vi-phien-ban-1-0-in-scope.md
source_lines: 104-130
source_sha1: 60738ffb3a
ids: [BR-09, D-01, D-03, D-04, D-05, D-24, D-26, D-27, D-28, D-29, D-30, D-31, D-33, SOI-12]
---
### 4.1. Trong phạm vi phiên bản 1.0 (In-Scope)
* **Định dạng đầu vào:**
  * Ableton Live: `.als` (XML thuần **hoặc** Gzip XML, nhận bằng magic bytes) và `.alp` (gói Live Pack định dạng `pl-a`: nhiều `.als` nén gzip + manifest JSON + sample; người dùng chọn `.als` trong gói sau khi nạp; **[ĐÃ KIỂM]** trên Live 9.1 và Live 12.4). Chỉ đọc Arrangement.
  * Cockos Reaper (`.rpp` — văn bản có cấu trúc thẻ lồng nhau); MIDI nhúng, nhiều take, loop, pooled, tempo envelope **[ĐÃ KIỂM]** trên 2 dự án thật (Reaper 7.85); `.mid` ngoài được nạp kèm.
  * DAWproject (`.dawproject` — ZIP chứa XML; do Bitwig Studio và PreSonus Studio One xuất). Thay cho `.bwproject` (D-03).
  * Standard MIDI File (`.mid`, format 0/1).
  * Parser khai báo tùy chỉnh (Declarative JSON Schema do người dùng nạp). **Nguồn nhị phân** đã có engine (schema v1, biểu thức an toàn, không `eval`); nguồn XML/JSON khai báo: chưa triển khai (D-28, SOI-12).
  * Người dùng có thể **ghi đè tempo theo mốc** (giây hoặc beat) và nhập nhiều mốc BPM; không còn mặc định 120 BPM ngầm (D-24, D-29).
  * Audio đính kèm tùy chọn: `.wav`, `.mp3`, `.ogg`, `.flac`, `.m4a`. Khả năng giải mã thực tế phụ thuộc trình duyệt; nếu không giải mã được, hiển thị thông báo rõ ràng.
* **Canvas & Layout Engine:**
  * Canvas 2D hỗ trợ nhiều tỉ lệ khung (16:9, 9:16, 1:1, tùy biến); xuất ở 720p, 1080p, 4K hoặc **kích thước rộng × cao nhập tuỳ ý** (làm tròn số chẵn, cạnh dài ≤ 4096 px; D-26).
  * Snapping theo lưới và Smart Guides; tách Edit Mode và Preview Mode.
  * Ảnh nền, màu nền và font chữ tùy chỉnh.
  * Preset dựng sẵn (dọc 9:16, ngang 16:9, vuông 1:1).
* **Bộ Widget cốt lõi (8 widget):** Track Info, Piano Roll, Event Counter, Live Trigger, Time & Bar Counter, Chord Detection, Audio Spectrum/Meter, **Progress Bar** (D-27).
* **Lưu trữ & Chia sẻ:** auto-save vào IndexedDB (gồm cả file dự án và audio); xuất/nhập Preset `.json`; xuất/nhập Project Pack `.zip`.
* **Xuất video ngoại tuyến:**
  * WebCodecs API + Mediabunny (thay `mp4-muxer` đã deprecated, D-04) để xuất MP4.
  * Chọn đoạn xuất (Export Range), độ phân giải, FPS, chất lượng; có thanh tiến độ và nút hủy.
  * Cơ chế dự phòng codec theo khả năng của trình duyệt (D-05).
  * Khi không có audio nạp kèm, mặc định xuất MP4 **video-only**; track Silent AAC là công tắc tuỳ chọn, mặc định TẮT (D-01 sửa theo Spike 1).
  * Tên file ghi được chốt (gồm rộng×cao, fps) trước khi bắt đầu render, kể cả khi ghi thẳng xuống đĩa (D-26).
* **Nền tảng:** trình duyệt desktop. Chromium (Chrome/Edge/Brave/Opera) trên Windows và macOS là nền tảng kiểm thử chính; các trình duyệt khác chạy theo khả năng phát hiện được (D-05).
* **Đa ngôn ngữ (BR-09, D-30):** xây từ đầu bằng từ điển JSON (`locales/`); bản đầu có Tiếng Anh (gốc) và Tiếng Việt, cộng đồng đóng góp ngôn ngữ khác theo `docs/I18N.md`; phạm vi gồm giao diện, thông báo lỗi/cảnh báo (dịch theo mã), văn bản trên canvas và video xuất ra (cần font đủ glyph), và thiết lập cách ghi tên nốt/hợp âm riêng.
* **Độ sáng track theo automation** (D-33): mặc định theo âm lượng, người dùng đổi nguồn/đảo chiều/ngưỡng.
* **Ghi đè tempo** có dấu nhịp (4/4, 3/4, 6/8, 12/8...) và nhập mốc theo giây, `Bar.Beat.%` (Reaper) hay `Bar.Beat.Sixteenth` (Ableton/Bitwig/Cubase) (D-31).
