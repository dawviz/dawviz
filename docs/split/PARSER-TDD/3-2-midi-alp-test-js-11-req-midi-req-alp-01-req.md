---
doc: PARSER-TDD.md
doc_title: "TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer"
section: "3.2 `midi-alp.test.js` (11) — REQ-MIDI-*, REQ-ALP-01, REQ-CMP-01"
path: "3. Danh mục test (77 test, 8 file) > 3.2 `midi-alp.test.js` (11) — REQ-MIDI-*, REQ-ALP-01, REQ-CMP-01"
chunk: 3-2-midi-alp-test-js-11-req-midi-req-alp-01-req.md
source_lines: 44-46
source_sha1: b369a49402
ids: [REQ-ALP-01, REQ-CMP-01]
---
### 3.2 `midi-alp.test.js` (11) — REQ-MIDI-*, REQ-ALP-01, REQ-CMP-01
PPQ 480→960 + tempo đổi + nhịp 3/4 + thời gian giây; running status + vận tốc 0; format 0 tách kênh + `midi-default` + override; nốt treo, file cụt, SMPTE, rác, không nốt; so sánh 960 vs 96 PPQ; ALP chọn `.als` chính bỏ Backup/MACOSX; ALP với `.als` XML thuần; ALP lỗi (không `.als`, zip-slip, bom, rác); **ALP `pl-a`** dựng giống file thật (header + 2 `.als` gzip + manifest + đuôi sample chứa magic gzip giả): mặc định chọn file lớn nhất, `alsName`/`alsIndex`, `alsName` sai → lỗi; ALP `pl-a` cụt/mất manifest/bom.
