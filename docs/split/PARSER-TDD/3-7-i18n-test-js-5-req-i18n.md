---
doc: PARSER-TDD.md
doc_title: "TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer"
section: "3.7 `i18n.test.js` (5) — REQ-I18N-*"
path: "3. Danh mục test (77 test, 8 file) > 3.7 `i18n.test.js` (5) — REQ-I18N-*"
chunk: 3-7-i18n-test-js-5-req-i18n.md
source_lines: 63-65
source_sha1: 714e1ad5ed
ids: []
---
### 3.7 `i18n.test.js` (5) — REQ-I18N-*
`t()`: nội suy, số nhiều (`one`/`other`/`=0`, định dạng số theo locale), dự phòng `vi-VN → vi → en → khoá`, `onMissing`; `matchLocale`/`localeChain`/`dirOf` (rtl); `parseMessage`/`describeMessage` bắt chuỗi sai (ngoặc, thiếu `other`); **danh mục thật của repo qua `check-i18n`** (đủ khoá, tham số khớp, khoá dùng trong mã có mặt, các mã lỗi chính có bản dịch); `check-i18n` bắt đúng các lỗi hay gặp của cộng tác viên (sai tên tham số, thiếu `other`, thiếu/thừa khoá, chuỗi rỗng, `partial` được thiếu khoá, locale chưa vào `index.json`, nhánh số nhiều không tồn tại trong ngôn ngữ).
