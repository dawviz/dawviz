---
doc: PARSER-TDD.md
doc_title: "TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer"
section: "3.6 `detect-bundle.test.js` (4) — REQ-CORE-02, REQ-CORE-05"
path: "3. Danh mục test (77 test, 8 file) > 3.6 `detect-bundle.test.js` (4) — REQ-CORE-02, REQ-CORE-05"
chunk: 3-6-detect-bundle-test-js-4-req-core-02-req-core.md
source_lines: 60-62
source_sha1: 714e1ad5ed
ids: [REQ-CORE-02, REQ-CORE-05]
---
### 3.6 `detect-bundle.test.js` (4) — REQ-CORE-02, REQ-CORE-05
`detectFormat` theo đuôi + magic + hướng dẫn bwproject, nhận `.flp` dựng sẵn; `probeProject` (cần `.mid` ngoài / schema);  `parseProject` điều phối + schema đăng ký; **bundle** dựng xong chạy và `deepEqual` với bản nguồn trên Demo.als.
