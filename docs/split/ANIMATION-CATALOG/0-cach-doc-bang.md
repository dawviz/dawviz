---
doc: ANIMATION-CATALOG.md
doc_title: "Danh mục hiệu ứng chuyển động và đường cong nội suy"
section: "0. Cách đọc bảng"
path: "0. Cách đọc bảng"
chunk: 0-cach-doc-bang.md
source_lines: 7-18
source_sha1: 94903865f6
ids: [AD-07]
---
## 0. Cách đọc bảng

**Ưu tiên** (đã chốt, là phạm vi chính thức): `v1.0` = bản phát hành 1.0, `v1.1` = bản 1.1, `sau` = bản 1.2 trở đi.

**Kỹ thuật:**

* `C2D`: làm được bằng Canvas 2D hiện có.
* `GL`: cần shader WebGL2 (biến dạng điểm ảnh, xử lý toàn khung); chờ Spike T-27.
* `$`: tốn tài nguyên, cần giới hạn hoặc chất lượng giảm khi xem trước.

Mọi hiệu ứng phải giữ **tất định** (AD-07): là hàm của `t`; ngẫu nhiên dùng PRNG có seed; hiệu ứng "nhớ quá khứ" (vệt, tiếng vọng) được tính bằng cách lấy mẫu lại các thời điểm trước `t`, không giữ trạng thái giữa các khung.
