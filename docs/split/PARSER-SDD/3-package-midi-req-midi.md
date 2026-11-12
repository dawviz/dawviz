---
doc: PARSER-SDD.md
doc_title: "SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer"
section: "3. Package `midi` (REQ-MIDI-*)"
path: "3. Package `midi` (REQ-MIDI-*)"
chunk: 3-package-midi-req-midi.md
source_lines: 61-64
source_sha1: dbb03a72c8
ids: []
---
## 3. Package `midi` (REQ-MIDI-*)
`readSmf(u8, warnings)` đọc thô (tick theo PPQ nguồn): chunk `MThd`/`MTrk`, VLQ có chốt 4 byte, running status, meta `0x51` (tempo), `0x58` (nhịp), `0x03` (tên track), `0x2F`; ghép nốt theo khóa `(kênh<<8)|pitch`. `parseMidi` quy đổi `k = 960/division`, tách format 0 theo kênh, dựng tempo (hoặc `midi-default`).
`readSmf` được Reaper dùng lại để đọc `.mid` ngoài.
