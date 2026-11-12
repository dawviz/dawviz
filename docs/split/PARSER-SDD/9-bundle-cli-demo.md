---
doc: PARSER-SDD.md
doc_title: "SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer"
section: "9. Bundle, CLI, demo"
path: "9. Bundle, CLI, demo"
chunk: 9-bundle-cli-demo.md
source_lines: 103-107
source_sha1: dbb03a72c8
ids: []
---
## 9. Bundle, CLI, demo
- `scripts/bundle.mjs`: gộp các module thành **một** file ES (`dist/dawviz-parser.bundle.js`) vì module Worker không dùng được import map. Mỗi module bọc trong IIFE; `import {…} from` thành destructuring từ module phụ thuộc; `export *` gộp bằng `Object.assign`. Chỉ hỗ trợ import tương đối và `@dawviz/*`; cú pháp import/export khác phải sửa bundler.
- `bin/dawparse.mjs`: CLI (xem README).
- `apps/parser-lab`: trang demo + Worker nạp bundle, không chứa logic parser. Luồng: chọn file → Worker `probe` → hiện/ẩn ô `.mid` ngoài, ô schema, bộ chọn `.als` (`.alp`) → phân tích; thông báo màu vàng khi thiếu file cần; dòng nhập mốc BPM chuyển kiểu gõ qua Worker bằng `parsePositionText`.
