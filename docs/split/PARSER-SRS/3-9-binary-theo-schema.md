---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "3.9 Binary theo schema"
path: "3. Yêu cầu chức năng > 3.9 Binary theo schema"
chunk: 3-9-binary-theo-schema.md
source_lines: 101-106
source_sha1: dd04828ada
ids: [ERR_SCHEMA_INVALID, ERR_UNSUPPORTED_FORMAT, REQ-BIN-01, REQ-BIN-02, REQ-BIN-03, REQ-BIN-04]
---
### 3.9 Binary theo schema
- **REQ-BIN-01** Schema JSON `schemaVersion: 1` mô tả cấu trúc byte và mục `ast` ánh xạ (xem `schemas/README.md`).
- **REQ-BIN-02** Mọi đọc byte bị chặn trong vùng hợp lệ; `count`/`length` không hợp lệ hoặc quá lớn → lỗi, không cấp phát theo giá trị trong file.
- **REQ-BIN-03** Biểu thức do bộ phân tích riêng đánh giá; hàm trắng `min max floor ceil round abs len beatsToTicks clamp`; tên `__proto__`, `constructor`, `prototype` bị cấm; có ngân sách phép tính (5e7), nút, độ sâu.
- **REQ-BIN-04** Schema sai → `ERR_SCHEMA_INVALID`; file không khớp `magic` → `ERR_UNSUPPORTED_FORMAT`; schema được chọn theo `extensions` + `magic`.
