---
doc: WIDGET-REVAMP.md
doc_title: "Tu sửa widget và mở rộng sáng tạo (đợt 2026-11-26)"
section: "6. Cụm việc nhỏ của đợt này (T-127…T-133)"
path: "6. Cụm việc nhỏ của đợt này (T-127…T-133)"
chunk: 6-cum-viec-nho-cua-dot-nay-t-127-t-133.md
source_lines: 194-205
source_sha1: 878ee1f0a2
ids: []
---
## 6. Cụm việc nhỏ của đợt này (T-127…T-133)

| Task | Thiết kế |
|---|---|
| **T-127** Track trên Timeline và hoạt hình đổi thứ tự | Làn **Nhạc** của Timeline (thẻ Chỉnh sửa) làm được như danh sách Track của Xem trước: kéo tay nắm 6 chấm đổi thứ tự, ô màu đổi màu track (bộ chọn màu dùng chung), mắt/S để ẩn/solo, khoá như hiện có. Đổi thứ tự lớp hoặc track: các hàng trượt tới chỗ mới (FLIP, 150 ms, tắt khi người dùng chọn giảm chuyển động) thay vì nhảy. |
| **T-128** Khung phát không tràn | Hộp điều khiển dưới sân khấu (ảnh chụp ở 9:16/1:1): số thời gian dùng cột có bề rộng theo nội dung (`tabular-nums`, `min-width: max-content`), thanh tua co lại trước; dưới 360 px thì thời gian tổng xuống dòng dưới thanh tua. |
| **T-129** Piano Roll | Ô Nốt thấp nhất/cao nhất kéo lên xuống như ô số (đơn vị nửa cung, vẫn hiện tên nốt), cho phép toàn dải 0–127. Màu nốt: Một màu / Theo track / Theo cao độ / Theo cường độ, hai chế độ sau dùng **dải màu hai đầu** chỉnh được. Màu từng track chỉnh ngay trên làn Nhạc của Timeline (T-127), cùng dữ liệu với màu track ở Xem trước (một chỗ lưu, hai chỗ sửa). |
| **T-130** Đỉnh phổ tần | Nhóm **Đỉnh** (công tắc): kiểu đỉnh Vạch/Chấm, thời gian giữ trước khi rơi, rơi có gia tốc (giống ảnh tham chiếu: chấm lơ lửng trên cột). Tất định: đỉnh tính lại từ lịch sử biên độ trong cửa sổ trước `t` (không giữ trạng thái giữa các khung). |
| **T-131** Bậc hợp âm | Chữ trong khối: **Đầu / Giữa / Cuối**. Khi khối dài hơn phần đang thấy, chữ dính mép trái vùng thấy và đi theo tới cuối khối rồi mới bị đẩy ra (như tên clip trong DAW). |
| **T-132** Bản nhạc | (1) Phóng to khi phát: `zoom` = 1 là tắt (quy tắc 1), ô phụ ẩn. (2) **Viết tay từng nốt** theo video tham chiếu `7RgccbtYL_o` (một khuông chạy ngang, nốt "được viết" khi tới lượt): chế độ hiện `WRITE`, mỗi glyph lộ dần theo hướng viết trong `writeMs` bằng vùng cắt hình chữ nhật (glyph là hình tô, không có thứ tự nét), kết hợp nét tay `rough` đã có. (3) **Xoá**: `erase` = Không / Sau N ô nhịp / Ngẫu nhiên, số nốt xoá chỉnh được, ngẫu nhiên tất định theo `seed` (băm id nốt + seed, không dùng `Math.random`), kiểu xoá mờ dần hoặc lau (biến mất từ phải sang trái). Khuông chạy liên tục (thay vì trang) là bước sau, cần đo lại dựng VexFlow trong Worker cho một hệ rất dài. |
| **T-133** Làm đẹp Notes/Degree/Dots | Theo video tham chiếu 3: lưới mảnh hơn, nhãn hàng ngoài khung, khối bậc hợp âm hai tầng (bậc lớn, chi tiết nhỏ) và dải chức năng T/S/D, chấm có kích thước theo cường độ. Làm sau T-124 để dùng nhóm thuộc tính mới. |
