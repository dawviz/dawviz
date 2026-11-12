---
doc: PARSER-SDD.md
doc_title: "SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer"
section: "7. Package `binary` (REQ-BIN-*)"
path: "7. Package `binary` (REQ-BIN-*)"
chunk: 7-package-binary-req-bin.md
source_lines: 89-95
source_sha1: dbb03a72c8
ids: []
---
## 7. Package `binary` (REQ-BIN-*)
Ba lớp:
1. **Biểu thức**: tokenizer → parser đệ quy (`ternary → logic → … → postfix`) cho cây `lit/id/mem/idx/un/bin/if/call`; cache theo chuỗi nguồn; `evalNode` trừ ngân sách mỗi nút; định danh tra qua chuỗi scope (`Object.hasOwn`), `parent`, `root`, `$index/$pos/$remaining/$item`. Định danh không biết → `undefined` (an toàn).
2. **Đọc nhị phân**: `readValue`/`readStruct` đệ quy theo schema; mỗi đọc kiểm `pos + size ≤ end` của vùng hiện tại; `length` tạo vùng con; `array` có `count|size|until` và chống phần tử không tiến con trỏ; `offset/peek/align/when/assert/switch`.
3. **Ánh xạ**: `parseBinaryWithSchema` chạy `readBinary` rồi duyệt `ast.tempo`/`ast.tracks` (`each/as/filter`) → `buildAST`. `timeUnit: ticks` chia `ppq`; `beats` nhân 960.
`validateSchema` kiểm toàn bộ schema trước khi đọc (tên, kiểu, biên dịch mọi biểu thức).
