---
doc: TDD.md
doc_title: "TÀI LIỆU THIẾT KẾ KIỂM THỬ (TDD = Test Design Document) — ỨNG DỤNG DAW VISUALIZER"
section: "TÀI LIỆU THIẾT KẾ KIỂM THỬ (TDD = Test Design Document) — ỨNG DỤNG DAW VISUALIZER (mở đầu)"
path: "TÀI LIỆU THIẾT KẾ KIỂM THỬ (TDD = Test Design Document) — ỨNG DỤNG DAW VISUALIZER (mở đầu)"
chunk: tai-lieu-thiet-ke-kiem-thu-tdd-test-design-docum.md
source_lines: 1-6
source_sha1: 21a6598042
ids: []
---
# TÀI LIỆU THIẾT KẾ KIỂM THỬ (TDD = Test Design Document) — ỨNG DỤNG DAW VISUALIZER

> **Lưu ý tên gọi:** "TDD" ở đây là *Test Design Document* (tài liệu mô tả chiến lược và danh mục test), **không** bắt buộc dự án phải làm theo phương pháp *Test-Driven Development* (viết test trước rồi mới viết mã). Khuyến nghị thực tế: làm test-first cho các hàm thuần (parser, Render Core, `snap`, `clock`), còn giao diện thì viết test sau khi bố cục ổn định. Thiết kế kỹ thuật chi tiết nằm ở `TECHNICAL-DESIGN.md`.

> Phiên bản tài liệu: 1.1 (2026-11-12: đồng bộ BRD/SRS v1.1; phạm vi bản phát hành ở BRD §4.4, tùy biến và biểu thức ở `CUSTOMIZATION.md`, `ANIMATION-CATALOG.md`, `EXPRESSIONS.md`) · Đối chiếu `docs/product/SRS.md` và `docs/design/SDD.md`. Test của thư viện parser: `docs/parser/PARSER-TDD.md` (66 test).
