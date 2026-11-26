---
doc: WIDGET-REVAMP.md
doc_title: "Tu sửa widget và mở rộng sáng tạo (đợt 2026-11-26)"
section: "2. Ẩn hẳn thuộc tính không áp dụng (D-72, T-125)"
path: "2. Ẩn hẳn thuộc tính không áp dụng (D-72, T-125)"
chunk: 2-an-han-thuoc-tinh-khong-ap-dung-d-72-t-125.md
source_lines: 71-76
source_sha1: 5eb561ef37
ids: [D-72]
---
## 2. Ẩn hẳn thuộc tính không áp dụng (D-72, T-125)

Ô không có tác dụng với lựa chọn hiện tại (ví dụ ô của Phổ tần dạng Thẳng khi đang chọn Tròn) **ẩn hẳn**, không làm mờ. Lý do: cột phải đã dài; ô mờ vẫn chiếm chỗ và vẫn bị hỏi "sao chỉnh không đổi". Giá trị ẩn vẫn giữ trong preset (đổi lại hình dạng là có lại). Ngoại lệ như quy tắc 2: ô có hoạt hình vẫn hiện.

Cách kiểm: mỗi `when` mới kèm một test Render Core chứng minh thuộc tính đó **không** đổi chuỗi hình trong trường hợp bị ẩn (đổi giá trị, so `layoutFrame` trước/sau), để `when` không giấu nhầm ô có tác dụng.
