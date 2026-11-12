---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "3.2 Giới hạn và an toàn (REQ-PARSER-00)"
path: "3. Yêu cầu chức năng > 3.2 Giới hạn và an toàn (REQ-PARSER-00)"
chunk: 3-2-gioi-han-va-an-toan-req-parser-00.md
source_lines: 33-39
source_sha1: dd04828ada
ids: [ERR_ARCHIVE_INVALID, ERR_AST_TOO_LARGE, REQ-LIM-01, REQ-LIM-02, REQ-LIM-03, REQ-LIM-04, REQ-LIM-05, REQ-PARSER-00]
---
### 3.2 Giới hạn và an toàn (REQ-PARSER-00)
- **REQ-LIM-01** Mặc định (ghi đè qua `options.limits`): `maxFileBytes` 100e6; `maxUnzippedBytes` 300e6; `maxRatio` 30; `maxXmlDepth` 64; `maxXmlNodes` 5e6; `maxNotes` 500000; `maxZipEntries` 20000; `maxRppLines` 5e6; `maxBinaryNodes` 5e6; `maxBinaryDepth` 64.
- **REQ-LIM-02** Giải nén theo luồng, đếm byte thật, dừng ngay khi vượt `maxUnzippedBytes` hoặc `maxRatio` (không tin kích thước khai báo).
- **REQ-LIM-03** ZIP: chặn đường dẫn thoát (`..`, tuyệt đối), chỉ giải nén entry cần dùng, không hỗ trợ ZIP64/mã hóa (báo `ERR_ARCHIVE_INVALID`).
- **REQ-LIM-04** XML: không mở rộng DOCTYPE/entity (chống XXE, billion laughs); giới hạn độ sâu và số nút.
- **REQ-LIM-05** Vượt `maxNotes` → `ERR_AST_TOO_LARGE`, kể cả khi mở rộng loop.
