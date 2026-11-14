---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "Phụ lục A: Mã lỗi"
path: "9. PHỤ LỤC > Phụ lục A: Mã lỗi"
chunk: phu-luc-a-ma-loi.md
source_lines: 1146-1168
source_sha1: 46410b6da3
ids: [ERR_ARCHIVE_INVALID, ERR_ARCHIVE_TOO_LARGE, ERR_AST_INVALID, ERR_AST_TOO_LARGE, ERR_AUDIO_DECODE, ERR_AUDIO_TOO_LONG, ERR_AUDIO_TOO_MANY, ERR_EXPORT_FAILED, ERR_FILE_TOO_LARGE, ERR_NO_NOTES, ERR_NO_SUPPORTED_ENCODER, ERR_NO_SUPPORTED_ENV, ERR_PARSER_TIMEOUT, ERR_PRESET_INVALID, ERR_PRESET_TOO_LARGE, ERR_SCHEMA_INVALID, ERR_SCHEMA_NEWER, ERR_UNSUPPORTED_FORMAT, NFR-SEC-04, REQ-AUDIO-01]
---
### Phụ lục A: Mã lỗi

| Mã | Điều kiện | Gợi ý cho người dùng |
| :--- | :--- | :--- |
| `ERR_FILE_TOO_LARGE` | File vượt giới hạn kích thước | Cắt/đơn giản hóa dự án hoặc xuất MIDI. |
| `ERR_ARCHIVE_TOO_LARGE` | Giải nén vượt 300 MB, tỉ lệ > 1:30 hoặc quá nhiều entry ZIP | Kiểm tra file; có thể là file lỗi hoặc độc hại. |
| `ERR_ARCHIVE_INVALID` | ZIP hỏng hoặc có đường dẫn không hợp lệ | Xuất lại file từ DAW/ứng dụng. |
| `ERR_PARSER_TIMEOUT` | Phân tích quá 10 giây | Thử file nhỏ hơn hoặc xuất MIDI. |
| `ERR_UNSUPPORTED_FORMAT` | Định dạng *chưa hỗ trợ* (`.flp`, `.bwproject`, MIDI SMPTE), nội dung không khớp đuôi file hoặc không khớp magic của schema | Làm theo hướng dẫn trong màn hình nhập file. |
| `ERR_AST_INVALID` | Dữ liệu sau phân tích không hợp lệ | Báo lỗi kèm vị trí; thử xuất MIDI. |
| `ERR_AST_TOO_LARGE` | Quá 500,000 nốt | Tách đoạn hoặc bỏ bớt track. |
| `ERR_NO_NOTES` | Không có nốt nào sau khi lọc (kèm lý do nếu có: chỉ có clip Session View; chỉ tham chiếu `.mid` ngoài chưa nạp) | Bật hiển thị track ẩn, chọn `.als` khác trong gói, nạp `.mid` đi kèm hoặc chọn file khác. |
| `ERR_SCHEMA_INVALID` | Schema nhị phân sai hoặc thiếu mục `ast` | Sửa schema theo `schemas/README.md`. |
| `ERR_NO_SUPPORTED_ENV` | Môi trường thiếu `DecompressionStream` | Dùng Chrome/Edge bản mới. |
| `ERR_AUDIO_DECODE` | Trình duyệt không giải mã được audio | Đổi sang `.wav`/`.mp3`; vẫn có thể tiếp tục không audio. |
| `ERR_AUDIO_TOO_LONG` | Audio dài hơn giới hạn giải mã | Cắt ngắn audio. |
| `ERR_AUDIO_TOO_MANY` | Số stem hoặc tổng thời lượng stem vượt giới hạn (REQ-AUDIO-01) | Gộp bớt stem (theo nhóm nhạc cụ) hoặc chỉ nạp stem của track cần hiện. |
| `ERR_PRESET_INVALID` | Preset hỏng hoặc sai lược đồ: không phải JSON, không phải đối tượng, thiếu `schemaVersion`/`canvas`, phiên bản quá cũ (< 0.3), vượt giới hạn độ sâu (12), số nút (20 000), widget (64), độ dài chuỗi (4096) hoặc mảng (1024) | Dùng preset khác. |
| `ERR_PRESET_TOO_LARGE` | Tệp preset lớn hơn 1 MiB (kiểm trước khi đọc, NFR-SEC-04) | Dùng preset nhỏ hơn. |
| `ERR_SCHEMA_NEWER` | Dữ liệu từ phiên bản mới hơn (preset: phiên bản chính.phụ lớn hơn 0.4) | Cập nhật ứng dụng. |
| `ERR_NO_SUPPORTED_ENCODER` | Không có bộ mã hóa phù hợp (Tier 4) | Dùng Chrome/Edge bản mới trên Windows/macOS. |
| `ERR_EXPORT_FAILED` | Export Worker lỗi bất ngờ | Thử lại; hạ độ phân giải hoặc dùng Export Range. |
