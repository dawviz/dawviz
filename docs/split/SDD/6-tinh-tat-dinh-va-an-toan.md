---
doc: SDD.md
doc_title: "TÀI LIỆU THIẾT KẾ PHẦN MỀM (SDD) — ỨNG DỤNG DAW VISUALIZER"
section: "6. Tính tất định và an toàn"
path: "6. Tính tất định và an toàn"
chunk: 6-tinh-tat-dinh-va-an-toan.md
source_lines: 67-72
source_sha1: b1d59a382a
ids: []
---
## 6. Tính tất định và an toàn

- Không dùng `Math.random`, `Date.now` hay `performance.now` trong Render Core.
- Không `eval`; tệp người dùng chỉ được parser đọc trong Worker; giới hạn kích thước và độ sâu do parser áp dụng (xem PARSER-SRS).
- `localStorage` luôn bọc try/catch và ứng dụng chạy đúng khi không có nó.
