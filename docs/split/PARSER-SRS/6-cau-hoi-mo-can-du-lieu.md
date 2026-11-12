---
doc: PARSER-SRS.md
doc_title: "SRS — Đặc tả yêu cầu: Thư viện parser DAW Visualizer"
section: "6. Câu hỏi mở / cần dữ liệu"
path: "6. Câu hỏi mở / cần dữ liệu"
chunk: 6-cau-hoi-mo-can-du-lieu.md
source_lines: 131-133
source_sha1: dd04828ada
ids: [KPI-01, OI-01, OI-02, OI-03, OI-04, OI-05, OI-06]
---
## 6. Câu hỏi mở / cần dữ liệu
- OI-01 (đã giải quyết một phần: 2 dự án Reaper thật có MIDI nhúng và 1 dự án có `.mid` ngoài thật; `IGNTEMPO 1` đã có dự án thật (BigProject4b), thiếu đối chứng độc lập từng nốt; còn thiếu envelope cong; HASDATA ≠ QN đã xử lý bằng guard clause, không cần mẫu); OI-02 `.dawproject` xuất thật từ Bitwig; OI-03 clip Ableton có `StartRelative ≠ 0`; OI-04 cặp (dự án, MIDI xuất từ DAW) cho KPI-01; OI-05 file `.bwproject` mẫu; OI-06 nhịp Ableton ≠ 4/4 để xác nhận công thức enum.
