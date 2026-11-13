---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-PARSER-06: Ableton Live Pack (`.alp`)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) > REQ-PARSER-06: Ableton Live Pack (`.alp`)"
chunk: req-parser-06-ableton-live-pack-alp.md
source_lines: 330-337
source_sha1: 7ab053e2fc
ids: [ERR_ARCHIVE_INVALID, REQ-PARSER-00, REQ-PARSER-06, REQ-UI-07, WARN_ALP_MULTIPLE_ALS]
---
#### REQ-PARSER-06: Ableton Live Pack (`.alp`)
**[ĐÃ KIỂM]** trên một `.alp` thật (Live 9.1, 65 MB, 3 file `.als`). Giả định của v0.2 rằng `.alp` là ZIP **không đúng** với mẫu này.

* Nhận dạng bằng magic `pl-a` (4 byte đầu). Cấu trúc: 12 byte header (`pl-a`, u32 LE, u32 = 0) → N luồng gzip nối liền, mỗi luồng là một `.als` → manifest JSON `{"original_path","als":[{"current_path","original_path"}],"creator_id","version"}` (N phần tử, đúng thứ tự) → dữ liệu sample (FLAC…), không đọc.
* Ranh giới luồng gzip được xác định bằng cách thử các ứng viên (`1F 8B 08`) đến khi giải nén hợp lệ và khớp ISIZE; tổng byte giải nén chịu giới hạn của REQ-PARSER-00. Thiếu/hỏng manifest, thiếu luồng: `ERR_ARCHIVE_INVALID`. File 65 MB xử lý ≈ 0,15 giây.
* Gói có thể chứa nhiều `.als`. Thư viện cung cấp `listAlp(buffer)` (tên, kích thước, BPM, danh sách track kèm số nốt, lỗi nếu có) để giao diện cho người dùng chọn (REQ-UI-07); `parseAlp` nhận `alsName`/`alsIndex`, mặc định chọn `.als` lớn nhất và báo `WARN_ALP_MULTIPLE_ALS`.
* Vẫn nhận gói ZIP chứa `.als` (bỏ `Backup/`, `__MACOSX/`) phòng biến thể khác.
