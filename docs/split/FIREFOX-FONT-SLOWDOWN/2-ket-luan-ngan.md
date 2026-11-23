---
doc: FIREFOX-FONT-SLOWDOWN.md
doc_title: "Firefox xuất chậm dần: điều tra và cách giảm nhẹ"
section: "2. Kết luận ngắn"
path: "2. Kết luận ngắn"
chunk: 2-ket-luan-ngan.md
source_lines: 15-27
source_sha1: dc64498938
ids: []
---
## 2. Kết luận ngắn

Trên Firefox (đã đo 154, Linux), **thời gian vẽ mỗi khung trong Worker tăng đều theo số khung đã vẽ** khi chữ dùng **phông web nạp bằng `FontFace` với nhiều mặt**. Mã hoá luôn ổn định (~2 ms/khung). Tốc độ tăng phụ thuộc **số mặt phông** đang nạp trong Worker, không phụ thuộc nội dung khung hình.

Số đo (Export Worker, 1080×1080, 30 fps, bài 150 s = 4 500 khung, Bản in, 15 track):

| | Chrome 157 | Firefox 154 |
|---|---|---|
| Trước khi sửa (6 mặt phông, gán `font` mỗi lần vẽ chữ) | ~16 s | **118,8 s**, vẽ 5 → 44 ms/khung |
| Sau khi sửa (2 mặt phông, chỉ gán `font` khi đổi) | **11,9 s** | **29,5 s**, vẽ 1,7 → 7,7 ms/khung |

Cơ chế bên trong Firefox **chưa rõ** (chưa mở được mã/nhật ký của Gecko); không có cách nào trong ứng dụng biết trước nó có xảy ra. Chưa báo lên Mozilla.
