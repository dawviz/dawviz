---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "2. Định dạng hỗ trợ"
path: "2. Định dạng hỗ trợ"
chunk: 2-dinh-dang-ho-tro.md
source_lines: 12-24
source_sha1: a0c8f4a7bd
ids: [REQ-FMT-01, REQ-FMT-02, REQ-FMT-03, REQ-FMT-04, REQ-FMT-05, REQ-FMT-06, REQ-FMT-07, REQ-FMT-08]
---
## 2. Định dạng hỗ trợ

| ID | Định dạng | Mô tả | Trạng thái |
|---|---|---|---|
| REQ-FMT-01 | `.als` | Ableton Live; XML thuần **hoặc** Gzip XML, nhận bằng magic bytes, không dựa đuôi | DONE (file thật Live 9 và 12) |
| REQ-FMT-02 | `.alp` | Ableton Live Pack định dạng thật `pl-a` (các `.als` gzip + manifest JSON + sample); vẫn nhận biến thể ZIP | DONE (file thật Live 9.1, 65 MB) |
| REQ-FMT-03 | `.rpp` | Reaper; MIDI nhúng, take, loop, pooled, tempo envelope, `.mid` ngoài | DONE cho MIDI nhúng/take/loop/pooled/SOFFS tính bằng giây (đã kiểm với test120bpm/test90bpm; 2 dự án thật Reaper 7.85, khớp oracle độc lập) và `.mid` ngoài (BigProject3 + Oboe_MIDI_001.mid, 3147 nốt khớp); VERIFY: IGNTEMPO=1 trong dự án thật; envelope shape 2–5 đã kiểm (bezier theo công thức schwa); HASDATA chỉ nhận QN (PPQ động, đã kiểm 480 và 960) |
| REQ-FMT-04 | `.dawproject` | ZIP + `project.xml` (+ `metadata.xml`) | PARTIAL (chỉ có ví dụ chính thức) |
| REQ-FMT-05 | `.mid`/`.midi` | Standard MIDI File 0/1/2 | DONE |
| REQ-FMT-06 | binary theo schema | JSON schema mô tả byte → AST (cho `.bwproject` khi có mẫu) | DONE (schema demo); `.bwproject` TODO |
| REQ-FMT-07 | `.bwproject` (không schema); `.flp` sai magic | Báo "chưa hỗ trợ"/sai nội dung kèm hướng dẫn (xuất `.dawproject`) | DONE |
| REQ-FMT-08 | `.flp` | FL Studio ≥ 12 (cả dạng ZIP): schema dựng sẵn `schemas/flp.schema.json`; track = kênh, nốt = nốt Pattern trên Playlist; tick @PPQ header → 960 | DONE (9 tệp thật: FL 12.3, 20.8, 21.2.1, 24.1.2, 25.2.3, 25.2.5, 26.1.6, 26.1.7, 26.1.99; kèm automation volume/pan của track; FL 22–23 và ranh giới 20.99 chưa có tệp thật **[VERIFY]**) |
