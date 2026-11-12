---
doc: COMMUNITY-CONTENT.md
doc_title: "Tài nguyên (assets) và bộ kiểu (presets) do cộng đồng đóng góp"
section: "6. Kế hoạch tách repo (T-16)"
path: "6. Kế hoạch tách repo (T-16)"
chunk: 6-ke-hoach-tach-repo-t-16.md
source_lines: 54-63
source_sha1: d3268bcf29
ids: []
---
## 6. Kế hoạch tách repo (T-16)

1. Tạo repo `dawviz-community` (giấy phép theo từng tài nguyên; mã công cụ Apache-2.0).
2. Chuyển `presets/` và `assets/`, thêm CI: kiểm schema, kích thước, có `LICENSE`, sinh `index.json` và băm.
3. Ứng dụng: màn hình "Thư viện" nạp `index.json` qua HTTPS, kiểm schema và băm trước khi dùng, hoạt động được khi ngoại tuyến (chỉ dùng bộ dựng sẵn).
4. Repo chính giữ lại `presets/` mẫu nhỏ để test chạy không cần mạng.

Quy trình kiểm duyệt (CI tự động, 2 người duyệt, phát hành theo băm, thu hồi) và mô hình bảo mật: xem [design/EXPRESSIONS.md](../../design/EXPRESSIONS.md) mục 5–6.

Các loại preset mới (`note-transition`, `easing`, `particle`, `theme`, `scene`), luồng "Chia sẻ thành preset" trong ứng dụng và tài nguyên của phiên: xem [design/CUSTOMIZATION.md](../../design/CUSTOMIZATION.md) mục 6.
