---
doc: FIREFOX-FONT-SLOWDOWN.md
doc_title: "Firefox xuất chậm dần: điều tra và cách giảm nhẹ"
section: "4. Điều thật sự quyết định"
path: "4. Điều thật sự quyết định"
chunk: 4-dieu-that-su-quyet-dinh.md
source_lines: 41-55
source_sha1: dc64498938
ids: []
---
## 4. Điều thật sự quyết định

| Thí nghiệm | Kết quả (ms/khung theo từng 300 khung) |
|---|---|
| Không vẽ chữ (`fontsReady=false`) | phẳng 2,7–2,9 |
| Có chữ, 6 mặt phông | 5 → 19,5 (tăng) |
| Thay họ phông bằng `sans-serif` (vẫn 63 lần gán `font`/khung) | phẳng 3,1–3,6 |
| Không bao giờ gán `ctx.font` | phẳng 3,1–3,2 |
| Chỉ nạp 1 mặt phông | phẳng 2,9–3,5 |
| Chỉ nạp 2 mặt (latin 400, 700) | 3,8 → 6,6 (tăng nhẹ) |
| 6 mặt nhưng chỉ gán `font` khi đổi (63 → 10 lần/khung) | 4,7 → 11,6 (tăng chậm hơn) |
| Tạo Worker mới **trong cùng tiến trình Firefox**, ba lần nối tiếp | mỗi lần lại bắt đầu ~4–5 ms rồi tăng y hệt: **Worker mới reset được** |

Hai cách giảm nhẹ độc lập, đều bám vào "càng ít mặt phông và càng ít lần gán `font` càng tốt". Cảnh mặc định (không chữ phức tạp) không bị.
