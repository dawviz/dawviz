---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "2.5. Thư viện parser độc lập (D-23)"
path: "2. KIẾN TRÚC KỸ THUẬT, LUỒNG DỮ LIỆU & ĐÁNH GIÁ KIẾN TRÚC > 2.5. Thư viện parser độc lập (D-23)"
chunk: 2-5-thu-vien-parser-doc-lap-d-23.md
source_lines: 223-238
source_sha1: d7467a1f28
ids: [ARC-04, D-23]
---
### 2.5. Thư viện parser độc lập (D-23)

Logic đọc file DAW nằm trong monorepo `packages/*`, không phụ thuộc giao diện:

| Package | Nội dung |
| :--- | :--- |
| `@dawviz/parser-core` | lỗi, giới hạn, giải nén streaming, ZIP, bộ quét XML, bản đồ tempo, dựng và xác thực AST, `compareAST` |
| `@dawviz/parser-midi` | `.mid` |
| `@dawviz/parser-als` | `.als`, `.alp` (`parseAlp`, `listAlp`) |
| `@dawviz/parser-rpp` | `.rpp` |
| `@dawviz/parser-dawproject` | `.dawproject` |
| `@dawviz/parser-binary` | parser nhị phân theo JSON schema |
| `@dawviz/parser` | `detectFormat`, `parseProject(name, buffer, options)` |

Ứng dụng nạp `dist/dawviz-parser.bundle.js` (một file ES module, vì module Worker không dùng được import map). Tuỳ chọn: `title`, `showMuted`, `tempoOverride`, `limits`, `schemas`, `files/resolveFile` (Reaper), `alsName/alsIndex` (`.alp`). Đầu ra: `{ast, warnings, info, format}`. Lõi thư viện không tính `chordTimeline`; việc này thuộc Parse & Analysis Worker (ARC-04). Chi tiết: `docs/parser/PARSER-SRS.md`, `PARSER-SDD.md`, `PARSER-TDD.md`; CLI `bin/dawparse.mjs`; trang kiểm thử `apps/spike-parser/`.
