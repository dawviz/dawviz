---
doc: PARSER-TDD.md
doc_title: "TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer"
section: "3.5b `flp.test.js` (8, 1 tự bỏ qua khi thiếu tệp thật) — REQ-FMT-08, REQ-BIN-05/06"
path: "3. Danh mục test (77 test, 8 file) > 3.5b `flp.test.js` (8, 1 tự bỏ qua khi thiếu tệp thật) — REQ-FMT-08, REQ-BIN-05/06"
chunk: 3-5b-flp-test-js-8-1-tu-bo-qua-khi-thieu-tep-tha.md
source_lines: 57-59
source_sha1: b369a49402
ids: [REQ-BIN-05, REQ-FMT-08, WARN_FLP_CLIPS_SKIPPED]
---
### 3.5b `flp.test.js` (8, 1 tự bỏ qua khi thiếu tệp thật) — REQ-FMT-08, REQ-BIN-05/06
FLP tổng hợp do `test/helpers.mjs` dựng (`flp`, `flpEv`, `flpNote`, `flpClip`): ánh xạ pattern→playlist (tick ×10, clip lặp, clip tắt, cắt cuối clip, `startoffset`, tên kênh không bị tên khe mixer đè); clip âm thanh + `WARN_FLP_CLIPS_SKIPPED` + tên dự phòng từ mẫu (cả bố cục clip 60 byte); phiên bản < 12, tệp cụt, blob khai khống, sai magic, không clip; `.flp` dạng ZIP; `probeProject`/ưu tiên schema người dùng; module dựng sẵn khớp JSON. Tệp thật `big roar.flp` (không commit, tự bỏ qua khi thiếu): 128 BPM, 7 kênh, 2.150 nốt, < 2 s. `binary.test.js` có thêm hai test engine (`$last`, `index`, `inner`, `warnings`, `splitNum`, `basename`).
