---
doc: SPIKE-4-NOTATION.md
doc_title: "Spike 4: bản nhạc (notation) bằng VexFlow, phát sáng từng nốt, nét tay"
section: "5. Khả năng tuỳ biến dự kiến"
path: "5. Khả năng tuỳ biến dự kiến"
chunk: 5-kha-nang-tuy-bien-du-kien.md
source_lines: 91-101
source_sha1: 226588bac5
ids: [REQ-GRAPHICS-16]
---
## 5. Khả năng tuỳ biến dự kiến

| Nhóm | Tuỳ chọn |
|---|---|
| Nốt sáng | trạng thái sắp tới / đang ngân / đã qua, mỗi trạng thái có màu, độ đục, độ sáng; màu theo track hoặc theo phase; phóng to quanh tâm đầu nốt với easing (dùng lại ANIMATION-CATALOG) và thời gian vào/ra; glow |
| Playhead | tắt (chỉ nốt sáng), vạch theo ô nhịp, vạch mượt (dùng REQ-GRAPHICS-16) |
| Phông và nét | phông nhạc (kèm phông viết tay), nạp SMuFL, độ dày dòng kẻ, độ rung nét, kiểu rung (tĩnh/boil), tần số boil |
| Nội dung hiển thị | khoá, giọng, nhịp, số ô nhịp, `♩=`, tên nốt trong đầu nốt, ký hiệu hợp âm phía trên (nối widget Chord), dấu động từ velocity |
| Lượng tử hoá | độ chính xác (tự động, 1/8, 1/16, 1/32), tam liên bật/tắt, ngưỡng gộp hợp âm, nốt ngắn nhất, cách chia hai tay, giọng ghi đè |
| Trang | số ô nhịp mỗi trang, lật trang (cắt, mờ dần, trượt, nét bút quét), hiện trang sau trước, hoặc cuộn ngang |
