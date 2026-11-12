---
doc: PARSER-SDD.md
doc_title: "SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer"
section: "1. Kiến trúc tổng thể"
path: "1. Kiến trúc tổng thể"
chunk: 1-kien-truc-tong-the.md
source_lines: 5-24
source_sha1: dbb03a72c8
ids: [REQ-AST-01, REQ-TEMPO-01, REQ-TEMPO-02]
---
## 1. Kiến trúc tổng thể

Monorepo npm workspaces, ES module thuần, không phụ thuộc ngoài. Mỗi định dạng là một package; mọi package phụ thuộc `core`; package `parser` ghép tất cả.

```
            @dawviz/parser  (detectFormat, parseProject)
   ┌───────┬───────┬────────┬────────────┬────────┐
  midi    als/alp  rpp   dawproject    binary
   └───────┴───────┴────────┴────────────┴────────┘
                    @dawviz/parser-core
  errors · limits · bytes · zip · xml · tempo · ast · compare
```

Nguyên tắc:
1. **Một cửa ra**: mọi parser tạo dữ liệu thô rồi gọi `buildAST` (core/ast.js) — nơi duy nhất kiểm tra bất biến và tính thời gian giây. (REQ-AST-01..03)
2. **Tick là sự thật**: parser tự chịu trách nhiệm ra tick@960; giây chỉ do `tempoMap` suy ra. (REQ-TEMPO-01)
3. **Không đoán ngầm**: thiếu thông tin → cảnh báo + cờ (`tempoSource`), không âm thầm bịa. (REQ-TEMPO-02)
4. **Đầu vào là kẻ thù**: giới hạn tài nguyên ở mọi tầng (byte, tỉ lệ, độ sâu, số nút, số nốt, ngân sách phép tính). (REQ-LIM-*)
5. **Bất đồng bộ chỉ ở nơi cần** (giải nén dùng `DecompressionStream`); phần còn lại đồng bộ để dễ test.
