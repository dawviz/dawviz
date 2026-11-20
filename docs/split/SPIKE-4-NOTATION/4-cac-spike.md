---
doc: SPIKE-4-NOTATION.md
doc_title: "Spike 4: bản nhạc (notation) bằng VexFlow, phát sáng từng nốt, nét tay"
section: "4. Các spike"
path: "4. Các spike"
chunk: 4-cac-spike.md
source_lines: 52-90
source_sha1: 226588bac5
ids: [REQ-STORAGE-05]
---
## 4. Các spike

Mỗi spike có câu hỏi, cách làm, tiêu chí đạt và cái gì xảy ra nếu hỏng.

### S1. VexFlow ngoài DOM và display list

* **Câu hỏi:** VexFlow 5 có chạy được trong Web Worker/Node (không DOM) không? Tự viết `RenderContext` ghi lại lệnh vẽ (đường, đường nét, văn bản) nhóm theo `id` phần tử, rồi serialize ra JSON, có đủ để dựng lại ảnh đúng không?
* **Cách làm:** viết ví dụ 2 khuông, 2 ô nhịp (có tam liên, nối chùm, dấu nối, hợp âm); chạy một lần với context SVG làm chuẩn, một lần với context ghi lại; vẽ lại bằng `Path2D` và so ảnh.
* **Kiểm kèm:** kích thước bản build; cách VexFlow nạp phông nhạc (và có chuyển được glyph thành đường viền không); giấy phép từng phông (ghi `CREDITS.md`); các phông có sẵn trong VexFlow 5 (Bravura, Petaluma, Leland…) `[VERIFY]`.
* **Đạt:** ảnh dựng lại khớp ảnh chuẩn (sai khác dưới 1 px ở 1080p), mọi nốt có `id` truy ngược được.
* **Nếu hỏng:** đánh giá **Verovio** (WASM, có timemap, tự dàn trang, nhưng nặng và giấy phép có thể là LGPL `[VERIFY]`) hoặc OpenSheetMusicDisplay (dựng trên VexFlow, đọc MusicXML).

### S2. Chất lượng lượng tử hoá

* **Câu hỏi:** trên tệp thật, bộ lượng tử hoá cho ra bản nhạc dùng được đến mức nào?
* **Dữ liệu:** `big roar.flp`, `BigProject*.rpp`, một MIDI chơi tay (không click) `[VERIFY: cần tệp được phép dùng]`.
* **Thuật toán thử:** với mỗi ô nhịp, chọn lưới (1/8, 1/16, 1/32, tam liên, ngũ liên tuỳ chọn) bằng điểm = sai số thời gian + phạt độ phức tạp; chia nốt qua vạch nhịp bằng dấu nối; tách giá trị chấm; lấp nốt lặng; nối chùm theo phách; gộp hợp âm trong ngưỡng ms; chia hai tay theo cao độ (có thể theo track); cắt nốt chồng trong cùng giọng; ước lượng giọng bằng Krumhansl–Schmuckler và chọn cách viết dấu hoá theo giọng.
* **Đo:** (a) số ô nhịp có tổng giá trị nốt khác độ dài ô (phải là 0); (b) % nốt đúng lưới không cần xấp xỉ; (c) thời gian chạy toàn bài; (d) số ô phải rơi về cảnh báo.
* **Đạt:** (a) = 0 trên cả ba tệp; tệp DAW đã lượng tử (b) cao; MIDI chơi tay đọc được ở chế độ độ chính xác thấp. Ngưỡng cụ thể chốt sau lần chạy đầu.
* **Nếu hỏng:** cho người dùng chọn độ chính xác thủ công và/hoặc nhập MusicXML (hướng 1.2).

### S3. Hiệu năng và xuất video

* **Câu hỏi:** trang tĩnh cache + lớp động có đủ nhanh ở 1080p, đặc biệt trên Firefox?
* **Cách làm:** đo `renderFrame` với trang piano dày (hàng trăm nốt/trang, hợp âm 6 nốt), trong Export Worker, Chrome và Firefox, 4.500 khung (cùng cách đo ở FIREFOX-FONT-SLOWDOWN); so ba cách phát sáng: `shadowBlur`, sprite glow dựng sẵn, nét chồng lớp.
* **Đạt:** thời gian vẽ/khung không tăng theo số khung đã vẽ; mục tiêu ≲ 5 ms/khung ở trang dày (ước lượng, chốt lại sau đo); bộ nhớ không tăng tuyến tính khi xuất 90 s.

### S4. Nét tay và phông tuỳ biến

* **Câu hỏi:** rung nét tất định có đọc rõ không, có "boil" ổn định không, và có nạp được phông SMuFL của người dùng không?
* **Cách làm:** áp nhiễu giá trị (seeded) lên đỉnh và điểm điều khiển của display list: các mức "rung tĩnh" (mỗi phần tử một độ lệch cố định) và "boil" (đổi theo bước 8–12 fps); thử Petaluma và một phông SMuFL ngoài; đường nạp: tệp phông + siêu dữ liệu glyph → đường viền, lưu như tài nguyên phiên (REQ-STORAGE-05).
* **Đạt:** chữ nhạc đọc rõ ở 1080p và 720p; cùng `t` ra cùng ảnh (hash khung trùng nhau giữa hai lần chạy và giữa Preview/Export).

### S5. Dàn trang

* **Câu hỏi:** tự dàn bao nhiêu ô nhịp mỗi hàng, căn thẳng hai khuông, xuống dòng, ra sao khi VexFlow không tự dàn trang?
* **Cách làm:** `Formatter` chung cho cả hai khuông, đo chiều rộng tối thiểu từng ô, nhồi vào chiều rộng trang; chế độ "N ô nhịp mỗi trang" (như video) và "một hàng cuộn ngang".
* **Đạt:** không nốt chồng nốt ở các tệp mẫu; ô có tổng nốt sai không làm `Formatter` ném lỗi (dùng chế độ mềm của `Voice` hoặc chặn từ bước lượng tử).
