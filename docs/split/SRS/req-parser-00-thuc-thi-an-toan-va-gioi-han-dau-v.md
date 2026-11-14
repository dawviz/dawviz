---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-PARSER-00: Thực thi an toàn và giới hạn đầu vào (R-05, R-09)"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.1. Phân hệ phân tích tệp dự án (BR-01, BR-08) > REQ-PARSER-00: Thực thi an toàn và giới hạn đầu vào (R-05, R-09)"
chunk: req-parser-00-thuc-thi-an-toan-va-gioi-han-dau-v.md
source_lines: 260-268
source_sha1: f4f69f9f7d
ids: [ERR_ARCHIVE_INVALID, ERR_ARCHIVE_TOO_LARGE, ERR_FILE_TOO_LARGE, ERR_NO_SUPPORTED_ENV, ERR_PARSER_TIMEOUT, REQ-PARSER-00]
---
#### REQ-PARSER-00: Thực thi an toàn và giới hạn đầu vào (R-05, R-09)
* Parser phải chạy trong Web Worker, không chạm DOM trang chính và không có kết nối mạng.
* Giới hạn tệp nạp **[PROVISIONAL]**: dự án/nén ≤ 100 MB; audio ≤ 300 MB. Vượt thì báo `ERR_FILE_TOO_LARGE` trước khi đọc nội dung. Gói `.alp` chứa sample nên thường lớn (mẫu thật 65 MB); thư viện chỉ giải nén các `.als`, không đụng tới sample.
* Chống zip-bomb **[PROVISIONAL]**: tỉ lệ giải nén ≤ 1:30; tổng kích thước giải nén ≤ **300 MB** (hạ từ 500 MB vì giới hạn độ dài chuỗi của V8 khi giải mã UTF-8); số entry ZIP ≤ 20,000. Vượt thì `worker.terminate()` và báo `ERR_ARCHIVE_TOO_LARGE`. Việc giải nén phải đếm byte khi đang giải, không tin kích thước khai báo trong header.
* Độ sâu lồng XML/JSON ≤ 64 cấp; số nút XML ≤ 5,000,000; số dòng `.rpp` ≤ 5,000,000; schema nhị phân: ≤ 5,000,000 nút, sâu ≤ 64 **[PROVISIONAL]**.
* XML: không mở rộng DOCTYPE/entity (chống XXE, billion laughs). Giải nén dùng `DecompressionStream`; không hỗ trợ ZIP64 và entry mã hóa (báo `ERR_ARCHIVE_INVALID`). Môi trường thiếu `DecompressionStream` báo `ERR_NO_SUPPORTED_ENV`. **[ĐÃ KIỂM]** bằng test gzip-bomb, zip-bomb, zip-slip, XXE (docs/TDD.md).
* Timeout 10 giây; quá hạn thì ngắt Worker và báo `ERR_PARSER_TIMEOUT`.
* Với ZIP (`.dawproject`, Project Pack): từ chối đường dẫn chứa `..`, đường dẫn tuyệt đối hoặc ký tự điều khiển (chống zip-slip) và báo `ERR_ARCHIVE_INVALID`.
