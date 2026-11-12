---
doc: PARSER-SDD.md
doc_title: "SDD — Thiết kế phần mềm: Thư viện parser DAW Visualizer"
section: "6. Package `dawproject` (REQ-DAWP-*)"
path: "6. Package `dawproject` (REQ-DAWP-*)"
chunk: 6-package-dawproject-req-dawp.md
source_lines: 86-88
source_sha1: dbb03a72c8
ids: []
---
## 6. Package `dawproject` (REQ-DAWP-*)
`parseDawproject` (ZIP) → `parseDawprojectXml`: tempo gốc + tự động hóa; thu `Structure/Track` có `notes`; duyệt `Arrangement/Lanes` đệ quy với ngữ cảnh `{origin, unit, lo, hi, trackId}`. `placeClip` xử lý `playStart`, loop (`loopStart/loopEnd`), clip lồng; `conv()` đổi delta (beats→tick hoặc seconds→tick qua tempoMap). Ghi chú: `vel ≤ 1` coi là chuẩn hóa nhân 127.
