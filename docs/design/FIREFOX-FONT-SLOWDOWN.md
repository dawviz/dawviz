# Firefox xuất chậm dần: điều tra và cách giảm nhẹ

> Ghi lại 2026-11-18 để lần sau không phải điều tra lại. Liên quan: [TECHNICAL-DESIGN §5.7 và §7.4](TECHNICAL-DESIGN.md), T-09 trong [PROGRESS](../../PROGRESS.md).

## 1. Triệu chứng (do người thử báo, Linux, cùng một máy 22 lõi)

| Trình duyệt | Bài 2:32, 1080×1080, phong cách Bản in | Ghi chú |
|---|---|---|
| Edge (Windows) | bình thường | không có vấn đề |
| Chrome (Linux) | 45 s | |
| Firefox (Linux) | **501 s** | CPU gần như rảnh (chỉ một lõi bận) |

Không phải "Firefox lưu vào bộ nhớ rồi mới ghi đĩa" như đã đoán ban đầu: việc đó chỉ làm hộp thoại hỏi nơi lưu sau khi xong, không liên quan tốc độ.

## 2. Kết luận ngắn

Trên Firefox (đã đo 154, Linux), **thời gian vẽ mỗi khung trong Worker tăng đều theo số khung đã vẽ** khi chữ dùng **phông web nạp bằng `FontFace` với nhiều mặt**. Mã hoá luôn ổn định (~2 ms/khung). Tốc độ tăng phụ thuộc **số mặt phông** đang nạp trong Worker, không phụ thuộc nội dung khung hình.

Số đo (Export Worker, 1080×1080, 30 fps, bài 150 s = 4 500 khung, Bản in, 15 track):

| | Chrome 157 | Firefox 154 |
|---|---|---|
| Trước khi sửa (6 mặt phông, gán `font` mỗi lần vẽ chữ) | ~16 s | **118,8 s**, vẽ 5 → 44 ms/khung |
| Sau khi sửa (2 mặt phông, chỉ gán `font` khi đổi) | **11,9 s** | **29,5 s**, vẽ 1,7 → 7,7 ms/khung |

Cơ chế bên trong Firefox **chưa rõ** (chưa mở được mã/nhật ký của Gecko); không có cách nào trong ứng dụng biết trước nó có xảy ra. Chưa báo lên Mozilla.

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

## 5. Đã làm (2026-11-18)

1. `requiredFonts(scene, chars)` ([fonts.ts](../../packages/render-core/src/fonts.ts)): Export Worker chỉ nạp dải ký tự (latin / latin-ext / vietnamese) thật sự phủ các ký tự sẽ vẽ (`charsOfScene`: tên bài, nghệ sĩ, tên track, mọi chuỗi trong thuộc tính widget). Văn bản ASCII chỉ cần 2 mặt thay vì 6. Preview vẫn nạp đủ vì tên track có thể đổi khi đang xem. Ký tự không dải nào phủ vẫn rơi về phông dự phòng như trước.
2. `drawPrimitives` chỉ gán `ctx.font` khi khác giá trị đang đặt, theo dõi cả `save/restore` của chữ rich ([render.ts](../../packages/render-core/src/render.ts), `DrawEnv.font`). Lệnh vẽ khác giữ nguyên: golden `paper-1x1` chỉ khác ở các lệnh `font=` (16 → 11 ở mốc đầu), kiểm bằng so sánh sau khi bỏ các dòng `font=`.
3. Ngăn **Chi tiết kỹ thuật** trong hộp thoại xuất (tốc độ, thời gian vẽ/mã hoá mỗi khung, số mặt phông, codec; cảnh báo vàng khi vẽ chậm dần) và nút **Sao chép báo cáo xuất** (đường cong thời gian vẽ theo khung, để lần sau người thử gửi số liệu thay vì mô tả). Quy tắc "vẽ chậm dần": từ khung 300, trung bình 30 khung gần nhất gấp ≥ 3 lần 30 khung đầu và hơn ≥ 6 ms ([exportStats.ts](../../apps/web/src/lib/exportStats.ts)).

Còn lại sau khi sửa vẫn có tăng nhẹ (1,7 → 7,7 ms trong bài 150 s): chấp nhận được, chưa làm gì thêm.

## 6. Chưa làm

- **Chia việc vẽ cho nhiều Worker** (đề xuất A): mỗi đoạn ~300 khung một Worker mới (không kịp chậm đi), chuyển `VideoFrame` sang Worker mã hoá để xếp lại thứ tự. Dự đoán 10–15 s cho bài 150 s trên Firefox và nhanh hơn trên mọi trình duyệt (hiện chỉ một lõi vẽ). Cái giá: làm lại Export Worker, xếp lại thứ tự khung, kiểm soát bộ nhớ (mỗi khung 1080² ≈ 4,6 MB), huỷ/lỗi. Chỉ làm nếu người thử vẫn phàn nàn sau bản này.
- **Preview trên Firefox** (canvas luồng chính, `document.fonts`, 6 mặt): chưa kiểm có chậm dần khi phát lâu không.
- Cơ chế bên trong Firefox, báo lỗi lên Mozilla.
- Gộp ba dải thành một mặt phông mỗi độ đậm, hoặc dùng phông biến thiên (một mặt cho mọi độ đậm): sẽ còn 1–2 mặt cho cả tiếng Việt, nhưng cần tệp phông mới (kho chưa có Space Grotesk biến thiên; thêm gói là quyết định phụ thuộc mới).

## 7. Cách đo lại (để khỏi mất thời gian dựng lại)

Dựng một trang thử trong `apps/web/.bench/` (đừng commit) chạy chính `workers/export.worker.ts` hoặc bản sao có bấm giờ, dự án mẫu `test/fixtures/Reaper/BigProject4.rpp` chia thành 15 track, `sceneForStyle('paper', …)`, `start = 20`, `duration = 150`, rồi `vite --port 5199`. Báo số về một server HTTP nhỏ trên cổng khác bằng `fetch` (POST).

- **Chrome:** `google-chrome --headless=new --remote-debugging-port=… --user-data-dir=…`, mở trang qua `/json/new` và đọc `document.title` bằng CDP (`ws` đã có trong `node_modules`).
- **Firefox (snap):** `firefox --headless --no-remote --new-instance --profile <thư mục>`. Thư mục hồ sơ phải nằm trong `~/snap/firefox/common/` (snap bị giới hạn quyền, `/tmp` không dùng được). **Mỗi lần chạy dùng hồ sơ mới**: dùng lại thì Firefox khôi phục phiên và mở lại URL cũ (đã gây nhầm kết quả).
- Bấm giờ riêng `renderFrame` (vẽ) và `await video.add` (mã hoá), báo theo cửa sổ 300 khung. Chỉ nhìn trung bình toàn bài sẽ **không thấy** xu hướng tăng.
- Bẫy khi viết script điều khiển: `pkill -f` / `pgrep -f` khớp cả dòng lệnh của chính shell chứa mẫu đó và giết nó (mã thoát 144); chạy lâu thì dùng `setsid` + tệp kết quả, không chờ trong lệnh tiền cảnh; hai lần chạy dùng chung cổng nhận kết quả sẽ lẫn.
