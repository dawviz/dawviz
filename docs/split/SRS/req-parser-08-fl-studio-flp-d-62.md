---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-PARSER-08: FL Studio (`.flp`, D-62)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) > REQ-PARSER-08: FL Studio (`.flp`, D-62)"
chunk: req-parser-08-fl-studio-flp-d-62.md
source_lines: 335-346
source_sha1: 73016ec8ed
ids: [D-62, ERR_AST_INVALID, ERR_NO_NOTES, OI-19, REQ-PARSER-08, WARN_FLP_CLIPS_SKIPPED, WARN_TEMPO_FALLBACK, WARN_TEMPO_RAMP, WARN_TEMPO_SHAPE]
---
#### REQ-PARSER-08: FL Studio (`.flp`, D-62)
**[ĐÃ KIỂM]** trên một tệp FL 12.3 (7,6 MB; số nốt từng kênh khớp bộ giải mã độc lập) và trên tệp tổng hợp (60 byte/clip của FL ≥ 20.99, `.flp` dạng ZIP). Báo cáo: `docs/spikes/SPIKE-3-FLP.md`.

* Nhận bằng đuôi `.flp` + magic `FLhd`; cũng nhận `.flp` là ZIP (lấy `.flp` bên trong). Thực hiện bằng schema JSON dựng sẵn `schemas/flp.schema.json`; schema người dùng nạp được ưu tiên.
* Dòng sự kiện TLV; **không giải mã plugin** (khối `212`/`213` bị bỏ qua). Phiên bản dưới 12 → `ERR_AST_INVALID` nêu cần ≥ 12.
* **Track = kênh Channel Rack** (không phải làn Playlist); tên kênh, bật/tắt (kênh tắt thành track tắt tiếng). Kênh âm thanh và automation bị bỏ (không có nốt); kênh Layer vẫn là track.
* **Nốt** = nốt của Pattern đặt trên Playlist của arrangement đầu; vị trí = vị trí clip + vị trí nốt − `startoffset`; nốt ngoài `[startoffset, startoffset+độ dài clip)` bị bỏ, độ dài nốt cắt ở cuối clip; clip tắt tiếng bỏ. Cao độ = khoá FL (C5 = 60, kẹp 0–127). PPQ từ header (thường 96) quy về 960.
* **Tempo** = một điểm (tempo đầu); thiếu → `WARN_TEMPO_FALLBACK`. Nhịp từ sự kiện nhịp. Clip automation **tempo** (đích `0x4000`/`5`) được đọc thành điểm tempo: `bpm = 60 + 120·v`, đoạn thẳng/giữ chính xác, đoạn dốc lấy mẫu mỗi nửa beat (`WARN_TEMPO_RAMP`), đoạn cong xấp xỉ thẳng (`WARN_TEMPO_SHAPE`). Có clip âm thanh hoặc automation khác trên Playlist → `WARN_FLP_CLIPS_SKIPPED`. Không có clip Pattern → `ERR_NO_NOTES`.
* **Automation (T-76):** clip automation trên Playlist nhắm tới **âm lượng hoặc pan** của kênh hoặc của insert mixer thành lane `volume`/`pan` của track (insert gắn vào mọi kênh đi qua nó; FL 25 gắn theo tên). Volume insert = `(e^(3v) − 1)/(e^2,4 − 1)` (đã kiểm 5 mức dB), volume kênh = `(v/0,8)³` [VERIFY], pan = `2v−1` **[VERIFY]**. Tham số plugin, mute, tempo… chưa đọc, báo `WARN_FLP_CLIPS_SKIPPED`.
* **FL 25 và 26** khác FL 12: sự kiện `172` dài 3 byte; clip Playlist 80 byte (FL 25) và 88 byte (FL 26). Đã kiểm trên tệp thật 12.3, 20.8, 21.2.1, 24.1.2, 25.2.3, 25.2.5, 26.1.6, 26.1.7, 26.1.99.
* **Giới hạn đã biết [VERIFY]:** clip kéo dài hơn pattern không lặp nội dung (khớp FL qua ảnh Playlist; chưa biết nơi FL lưu độ dài pattern); đoạn cong của automation tempo xấp xỉ bằng đoạn thẳng (công thức chưa biết); nhiều arrangement chỉ lấy cái đầu; FL 22–23 và đúng ranh giới 20.99 chưa có tệp thật (OI-19).
