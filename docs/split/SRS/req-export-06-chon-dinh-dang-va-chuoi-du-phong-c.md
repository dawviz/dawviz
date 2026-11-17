---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-EXPORT-06: Chọn định dạng và chuỗi dự phòng codec (D-05, D-61, R-06)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) > REQ-EXPORT-06: Chọn định dạng và chuỗi dự phòng codec (D-05, D-61, R-06)"
chunk: req-export-06-chon-dinh-dang-va-chuoi-du-phong-c.md
source_lines: 788-814
source_sha1: 38e49d98aa
ids: [D-05, D-61, ERR_NO_SUPPORTED_ENCODER, KPI-03, REQ-EXPORT-06]
---
#### REQ-EXPORT-06: Chọn định dạng và chuỗi dự phòng codec (D-05, D-61, R-06)

Máy nào cũng được dò thật (`isConfigSupported`, lỗi coi như không hỗ trợ) cho từng codec video (H.264, H.265, VP9, AV1, VP8) và âm thanh (AAC, Opus, MP3, FLAC; PCM chạy bằng bộ ghi của Mediabunny nên luôn có). Chỉ tổ hợp phổ biến, chạy được ở trình phát và phần mềm dựng thông dụng, được đưa ra:

| Định dạng | Video | Âm thanh (thứ tự ưu tiên) |
|---|---|---|
| MP4 | H.264, H.265, VP9, AV1 | AAC, MP3, Opus, FLAC |
| WebM | VP9, AV1, VP8 | Opus |
| MOV | H.264, H.265 | AAC, MP3, PCM |
| MKV | H.264, H.265, VP9, AV1, VP8 | AAC, Opus, MP3, FLAC, PCM |

**Chế độ Cơ bản (tự chọn, hạ dần):**

```text
Video thử lần lượt: H.264 (MP4) → VP9 (WebM) → AV1 (WebM) → VP8 (WebM)      [H.265 không tự chọn]
Âm thanh trong định dạng đã chọn, theo thứ tự ưu tiên của bảng trên:
  MP4:  AAC → MP3 → Opus → FLAC       WebM: Opus
Không còn codec âm thanh nào → xuất không tiếng, báo rõ.   PCM không tự chọn (tệp rất lớn).
Không có encoder video nào → ERR_NO_SUPPORTED_ENCODER.
```

Thiếu AAC thì **hạ dần trong cùng MP4** (không bỏ tiếng, không bỏ sang WebM chỉ vì thế) và hộp thoại báo codec âm thanh đang dùng. Thiếu H.264 thì WebM kèm thông báo. Dự án không có âm thanh thì không cần codec âm thanh.

**Chế độ Nâng cao (ba ô thả xuống phụ thuộc nhau):** *Định dạng tệp* → *Codec video* → *Codec âm thanh*. Mỗi ô chỉ liệt kê lựa chọn vừa hợp định dạng ở ô trước vừa được máy này mã hoá; định dạng không có codec video nào dùng được thì ẩn. Đổi định dạng thì giữ codec cũ nếu còn hợp, không thì lấy codec đầu danh sách. "Không có âm thanh" là lựa chọn có chủ ý (không báo). Dự án không có âm thanh thì ô âm thanh bị khoá.

KPI-03 chỉ áp dụng cho H.264 + AAC (MP4). Mọi kết quả khác mặc định được thông báo rõ trong hộp thoại.
