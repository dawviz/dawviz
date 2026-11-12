---
doc: PARSER-SDD.md
doc_title: "SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer"
section: "11. Mở rộng"
path: "11. Mở rộng"
chunk: 11-mo-rong.md
source_lines: 124-127
source_sha1: dbb03a72c8
ids: []
---
## 11. Mở rộng
- **Thêm định dạng mới**: tạo `packages/<fmt>`; viết `parse<Fmt>(buffer, options)` trả `{ast, warnings, info}` bằng cách gọi `buildAST`; export trong `index.js`; thêm vào `SUPPORTED` và `detectFormat`/`parseProject` ở `packages/parser`; thêm test và mục SRS.
- **Thêm trường AST**: sửa `buildAST`, `assertAstInvariants` (test/helpers.mjs), SRS §3.4, README.
- **Thêm cảnh báo/lỗi**: dùng `warn`/`fail` trong code và cập nhật bảng SRS §4.
