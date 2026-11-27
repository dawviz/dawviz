---
doc: WIDGET-REVAMP.md
doc_title: "Tu sửa widget và mở rộng sáng tạo (đợt 2026-11-26)"
section: "7. Thứ tự làm và cách chia PR"
path: "7. Thứ tự làm và cách chia PR"
chunk: 7-thu-tu-lam-va-cach-chia-pr.md
source_lines: 206-218
source_sha1: faa5b53b06
ids: [D-77, D-78]
---
## 7. Thứ tự làm và cách chia PR

Mỗi dòng là một PR nhỏ vào `main` (DCO, CI xanh), xoá nhánh sau khi gộp:

1. Tài liệu này + nhật ký quyết định (PR tài liệu).
2. T-128, T-131, T-129 (phần dải cao độ), T-130: sửa nhỏ, độc lập.
3. T-124 khung nhóm thuộc tính + quy tắc A, rồi T-125 rà từng widget (có thể 2–3 PR theo nhóm widget).
4. T-127 Timeline track + hoạt hình đổi thứ tự.
5. T-126 kiểu chữ.
6. T-132 Bản nhạc (zoom, viết tay, xoá).
7. T-134 Hình + cắt nét, T-137 Gắn nhạc nhanh, T-135 Bút/Cọ, T-136 Mặt nạ, T-138 menu Thêm theo nhóm: mỗi cái một PR, theo thứ tự này (Hình trước vì Bút và Mặt nạ cần nó).
8. (thêm 2026-11-27) T-139 Lưới nốt (D-77): một PR mã kèm bước chuyển preset cũ. T-138 hộp thoại Chữ (D-78) làm được trước T-134…T-137 nếu muốn menu gọn sớm.
