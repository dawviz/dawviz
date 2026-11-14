---
doc: TECHNICAL-DESIGN.md
doc_title: "THIẾT KẾ KỸ THUẬT CHI TIẾT (TECHNICAL DESIGN) — DAW VISUALIZER"
section: "6.2.6 Cảnh báo lệch độ dài"
path: "6. Ứng dụng web và phát lại 🟡 > 6.2 Phát lại và âm thanh 🟢 (T-08, đã duyệt kèm 8 chỉnh) > 6.2.6 Cảnh báo lệch độ dài"
chunk: 6-2-6-canh-bao-lech-do-dai.md
source_lines: 285-290
source_sha1: 03d31db5d8
ids: [REQ-PARSER-07, WARN_AUDIO_LENGTH]
---
#### 6.2.6 Cảnh báo lệch độ dài
- Hàm thuần `audioLengthCheck(audioSec, projectSec, offsetSec)` so `audioEnd = offset + audioSec` với `projectSec` (độ dài dự án = kết thúc nốt cuối + đuôi theo parser). Mix thường **dài hơn** vài giây vì đuôi vang, nên ngưỡng không đối xứng [PROVISIONAL]:
  - **Ngắn hơn** dự án quá `max(1 s; 2 %)`, hoặc **dài hơn** quá `max(10 s; 10 %)` → cảnh báo `WARN_AUDIO_LENGTH` (mã mới, sẽ thêm vào Phụ lục A SRS và `locales/`).
  - Thông báo hiện **tỉ lệ** `audio / dự án` và gợi ý: tỉ lệ gần hằng số (ví dụ 0,94) thường do **tempo sai** (kiểm ghi đè tempo ở REQ-PARSER-07); chênh lớn bất kỳ thì **có thể chọn nhầm tệp**; chênh nhỏ cố định thì thử offset.
- Không chặn gì; vào mục cảnh báo hiện có (`Notices`), tự biến mất khi đổi offset/tệp làm hết lệch. Dài hơn trần 20 phút là lỗi riêng (§6.2.1).
