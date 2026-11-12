---
doc: SPIKE-2-PARSER.md
doc_title: "Spike 2: Parser và Unified AST"
section: "5. Trạng thái hiện tại (tài liệu v1.1)"
path: "5. Trạng thái hiện tại (tài liệu v1.1)"
chunk: 5-trang-thai-hien-tai-tai-lieu-v1-1.md
source_lines: 32-41
source_sha1: 715868848b
ids: [D-23, D-24, D-27, D-29, D-31, D-45, OI-01, REQ-PARSER-07, REQ-WIDGET-08, WARN_TEMPO_FALLBACK]
---
## 5. Trạng thái hiện tại (tài liệu v1.1)

| Điểm trong báo cáo | Hiện nay | Ghi ở |
|---|---|---|
| Chỉ `.mid` được kiểm | ✅ Đã kiểm `.als` (Live 9.1, 12.4), `.alp`, `.rpp` (Reaper 7.85, đối chiếu số đo trong Reaper), `.dawproject` (ví dụ chính thức Bitwig 5.0), nhị phân theo schema; **66 test** | PARSER-TDD; PROGRESS mục 1 |
| Còn thiếu tệp mẫu đa dạng | 🔄 Chương trình tệp mẫu | BRD OI-01, D-45 |
| Dump cây cấu trúc | ✅ Thay bằng **inventory** (`alsInventory`, inventory DAWproject): liệt kê đường dẫn thật trong tệp; nút "List structure (inventory)" trong `apps/parser-lab` | PARSER-SDD; `apps/parser-lab/index.html` |
| Fallback 120 BPM ngầm | ✅ Không đoán ngầm: `WARN_TEMPO_FALLBACK` + **ghi đè tempo theo mốc** (giây, beat, `Bar.Beat`) và dấu nhịp; giao diện nhập ghi đè ở M4 | BRD D-24, D-29, D-31; SRS REQ-PARSER-07 |
| Tách thư viện riêng | ✅ Các gói `@dawviz/parser-*` zero-dependency, có bundle một tệp và CLI `dawparse` | BRD D-23; SRS §2.5; `packages/README.md` |
| Widget Progress Bar | ✅ Thuộc 8 widget cốt lõi | BRD D-27; SRS REQ-WIDGET-08 |
