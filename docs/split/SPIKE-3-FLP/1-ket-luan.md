---
doc: SPIKE-3-FLP.md
doc_title: "Spike 3: đọc `.flp` (FL Studio) bằng JSON schema"
section: "1. Kết luận"
path: "1. Kết luận"
chunk: 1-ket-luan.md
source_lines: 5-11
source_sha1: 8c83939972
ids: [ERR_AST_TOO_LARGE]
---
## 1. Kết luận

* **Làm được, bằng JSON.** Schema dựng sẵn [`schemas/flp.schema.json`](../../../schemas/flp.schema.json) (khoảng 150 dòng) đọc dòng sự kiện TLV và ánh xạ sang Unified AST; không có mã riêng cho FL Studio trong `packages/*`.
* **Hiệu năng tốt.** Tệp thật `big roar.flp` (7,6 MB, FL 12.3, 6.871 sự kiện, 2.150 nốt hiển thị): **đọc cấu trúc 9–38 ms, cả `parseProject` khoảng 50 ms**. Tệp tổng hợp 100.000 nốt: 210 ms. Vượt trần 500.000 nốt thì báo `ERR_AST_TOO_LARGE` trong dưới 1 giây.
* **Đúng.** Số nốt từng kênh khớp 100% với bộ giải mã viết tay độc lập (790, 44, 32, 410, 302, 410, 162 = 2.150).
* **Không cần định dạng khác.** Phần JSON không đủ nằm ở bước *ánh xạ sang AST* chứ không ở bước đọc TLV; đã bổ sung bốn tính năng chung (mục 3), không riêng cho FL.
