---
doc: PARSER-TDD.md
doc_title: "TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer"
section: "3.5 `binary.test.js` (9) — REQ-BIN-*"
path: "3. Danh mục test (77 test, 8 file) > 3.5 `binary.test.js` (9) — REQ-BIN-*"
chunk: 3-5-binary-test-js-9-req-bin.md
source_lines: 54-56
source_sha1: 714e1ad5ed
ids: []
---
### 3.5 `binary.test.js` (9) — REQ-BIN-*
Schema demo parse đúng + `matchSchema`; không tempo → fallback + cảnh báo; file cụt / magic sai / version sai; `count` 0xFFFFFFFF; schema độc (version, tên cấm, kiểu lạ, biểu thức `process.exit`, `constructor…`, `eval`, `__proto__`, thiếu `ast`); `maxNotes` và mảng không tiến con trỏ; công cụ cấu trúc (switch/when/offset/peek).
