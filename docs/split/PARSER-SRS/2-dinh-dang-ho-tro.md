---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "2. Định dạng hỗ trợ"
path: "2. Định dạng hỗ trợ"
chunk: 2-dinh-dang-ho-tro.md
source_lines: 12-23
source_sha1: dd04828ada
ids: [REQ-FMT-01, REQ-FMT-02, REQ-FMT-03, REQ-FMT-04, REQ-FMT-05, REQ-FMT-06, REQ-FMT-07]
---
## 2. Định dạng hỗ trợ

| ID | Định dạng | Mô tả | Trạng thái |
|---|---|---|---|
| REQ-FMT-01 | `.als` | Ableton Live; XML thuần **hoặc** Gzip XML, nhận bằng magic bytes, không dựa đuôi | DONE (file thật Live 9 và 12) |
| REQ-FMT-02 | `.alp` | Ableton Live Pack định dạng thật `pl-a` (các `.als` gzip + manifest JSON + sample); vẫn nhận biến thể ZIP | DONE (file thật Live 9.1, 65 MB) |
| REQ-FMT-03 | `.rpp` | Reaper; MIDI nhúng, take, loop, pooled, tempo envelope, `.mid` ngoài | DONE cho MIDI nhúng/take/loop/pooled/SOFFS (2 dự án thật Reaper 7.85, khớp oracle độc lập) và `.mid` ngoài (BigProject3 + Oboe_MIDI_001.mid, 3147 nốt khớp); VERIFY: IGNTEMPO=1 trong dự án thật, envelope cong; HASDATA chỉ nhận QN (PPQ động, đã kiểm 480 và 960) |
| REQ-FMT-04 | `.dawproject` | ZIP + `project.xml` (+ `metadata.xml`) | PARTIAL (chỉ có ví dụ chính thức) |
| REQ-FMT-05 | `.mid`/`.midi` | Standard MIDI File 0/1/2 | DONE |
| REQ-FMT-06 | binary theo schema | JSON schema mô tả byte → AST (cho `.bwproject` khi có mẫu) | DONE (schema demo); `.bwproject` TODO |
| REQ-FMT-07 | `.flp`, `.bwproject` (không schema) | Báo "chưa hỗ trợ" kèm hướng dẫn (xuất MIDI / xuất `.dawproject`) | DONE |
