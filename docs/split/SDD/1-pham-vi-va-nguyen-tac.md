---
doc: SDD.md
doc_title: "TÀI LIỆU THIẾT KẾ PHẦN MỀM (SDD) — ỨNG DỤNG DAW VISUALIZER"
section: "1. Phạm vi và nguyên tắc"
path: "1. Phạm vi và nguyên tắc"
chunk: 1-pham-vi-va-nguyen-tac.md
source_lines: 5-11
source_sha1: b1d59a382a
ids: [ARC-01, NFR-PERF-05, NFR-SEC-01, REQ-GRAPHICS-05]
---
## 1. Phạm vi và nguyên tắc

- Ứng dụng chạy hoàn toàn trong trình duyệt, không backend (NFR-SEC-01). Dữ liệu người dùng ở lại trên máy.
- **Khung hình là hàm của thời gian:** `frame = f(AST, cấu hình, t)` (ARC-01, REQ-GRAPHICS-05). Không có trạng thái ẩn trong lúc vẽ, nên Preview và Export giống nhau và tua ngẫu nhiên tức thì (NFR-PERF-05).
- Tách ba tầng: **dữ liệu** (parser, AST) → **hiển thị** (Render Core, thuần) → **giao diện** (React). Mỗi tầng chỉ biết tầng bên trái.
- Mọi chuỗi hiển thị qua i18n theo mã (REQ-I18N); lỗi/cảnh báo của thư viện dịch theo `code`, thông điệp gốc chỉ là chi tiết kỹ thuật.
