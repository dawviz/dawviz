---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "3.1 Chung (core)"
path: "3. Yêu cầu chức năng > 3.1 Chung (core)"
chunk: 3-1-chung-core.md
source_lines: 26-32
source_sha1: dd04828ada
ids: [REQ-CORE-01, REQ-CORE-02, REQ-CORE-03, REQ-CORE-04, REQ-CORE-05]
---
### 3.1 Chung (core)
- **REQ-CORE-01** Một điểm vào `parseProject(name, buffer, options)` trả `{ast, warnings, info, format}`; mỗi package cũng dùng được riêng.
- **REQ-CORE-02** Nhận dạng định dạng bằng đuôi **và** magic bytes (`detectFormat`); đuôi lạ mà là ZIP thì dò nội dung (`project.xml` → dawproject, `*.als` → alp).
- **REQ-CORE-03** Không có biểu thức/mã do file cung cấp được thực thi (không eval).
- **REQ-CORE-04** Mọi lỗi là `DawParseError` có `code` ổn định và `details` tùy chọn; cảnh báo là `{code, message, details?}`.
- **REQ-CORE-05** Thư viện chạy được ở Node ≥ 18, trình duyệt và module Worker; có bản bundle một file ES module.
