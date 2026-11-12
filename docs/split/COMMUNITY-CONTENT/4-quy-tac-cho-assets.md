---
doc: COMMUNITY-CONTENT.md
doc_title: "Tài nguyên (assets) và bộ kiểu (presets) do cộng đồng đóng góp"
section: "4. Quy tắc cho assets"
path: "4. Quy tắc cho assets"
chunk: 4-quy-tac-cho-assets.md
source_lines: 41-47
source_sha1: d3268bcf29
ids: []
---
## 4. Quy tắc cho assets

* Chỉ nhận tệp **bạn có quyền phân phối**: tự tạo, hoặc giấy phép cho phép phân phối lại (CC0, CC-BY, OFL cho phông, MIT/Apache). **Không nhận** tệp không rõ nguồn.
* Mỗi tài nguyên nằm trong thư mục riêng có `LICENSE` (hoặc dòng SPDX trong `meta.json`), `meta.json` ghi tên, tác giả, nguồn, giấy phép, và (với CC-BY) dòng ghi công cần hiển thị.
* Ưu tiên tệp nhỏ (ảnh nền ≤ 2 MB, phông WOFF2).
* Phông chữ ngoài repo (người dùng tự nạp) vẫn dùng được; xem REQ-GRAPHICS cho việc nạp phông trước khi xuất.
