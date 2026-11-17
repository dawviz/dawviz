---
doc: FIREFOX-FONT-SLOWDOWN.md
doc_title: "Firefox xuất chậm dần: điều tra và cách giảm nhẹ"
section: "3. Đã loại trừ (mỗi mục là một thí nghiệm riêng, Firefox)"
path: "3. Đã loại trừ (mỗi mục là một thí nghiệm riêng, Firefox)"
chunk: 3-da-loai-tru-moi-muc-la-mot-thi-nghiem-rieng-fi.md
source_lines: 28-40
source_sha1: a549031f0a
ids: []
---
## 3. Đã loại trừ (mỗi mục là một thí nghiệm riêng, Firefox)

| Nghi ngờ | Cách thử | Kết quả |
|---|---|---|
| Bộ mã hoá / Mediabunny | vẽ + `createImageBitmap(canvas)` rồi `close()`, không mã hoá | vẫn tăng (4,8 → 19,4 ms) |
| Âm thanh (Opus) | có/không âm thanh | không đổi |
| Rò rỉ bộ nhớ | đo RSS tiến trình Firefox | phẳng ~500 MB |
| Nội dung khung (số primitive, thời điểm `t`) | vẽ lặp một `t` cố định | vẫn tăng y hệt; primitive ~130–300 |
| JS bố cục (`layoutFrame`) | bấm giờ riêng | hằng 0,4–0,5 ms |
| Trạng thái canvas | `ctx.reset()`, `canvas.width = canvas.width`, tạo `OffscreenCanvas` mới mỗi 100/300 khung | không giúp |
| Bóng đổ, viền chữ, `maxWidth`, `textRendering`/`fontKerning` | vô hiệu hoá từng cái qua `Proxy` của ctx | không đổi (cảnh Bản in cũng không dùng bóng/viền) |
| Nạp lại `FontFace` định kỳ | `fonts.delete` + nạp mới mỗi 300 khung | không giúp |
