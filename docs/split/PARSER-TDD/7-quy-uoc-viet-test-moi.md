---
doc: PARSER-TDD.md
doc_title: "TDD — Tài liệu kiểm thử: Thư viện parser DAW Visualizer"
section: "7. Quy ước viết test mới"
path: "7. Quy ước viết test mới"
chunk: 7-quy-uoc-viet-test-moi.md
source_lines: 90-96
source_sha1: 42e0660dc8
ids: []
---
## 7. Quy ước viết test mới
- Mỗi hành vi mới có ít nhất: ca đúng, ca biên, ca lỗi có `code`.
- Dùng oracle độc lập khi có công thức; không copy công thức từ code.
- Với định dạng chưa có file thật, dữ liệu tự dựng phải ghi rõ giả định ở comment và gắn nhãn [VERIFY] trong SRS.
- Khi thêm cảnh báo/lỗi: thêm vào SRS §4 và có test khẳng định mã.
- Cập nhật số test ở §3 khi thay đổi.
