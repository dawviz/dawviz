---
doc: SPIKE-4-NOTATION.md
doc_title: "Spike 4: bản nhạc (notation) bằng VexFlow, phát sáng từng nốt, nét tay"
section: "6. Kết quả"
path: "6. Kết quả"
chunk: 6-ket-qua.md
source_lines: 75-126
source_sha1: c33d54141a
ids: [WARN_NOTATION_KEY_GUESS, WARN_NOTATION_OFFGRID]
---
## 6. Kết quả

### S1: đạt

* VexFlow 5.6.0 (MIT) chạy trong Node không DOM, không `FontFace`: chỉ cần `Element.setTextMeasurementCanvas` với canvas đo giả. VexFlow 5 vẽ glyph bằng `fillText` (phông SMuFL), nên `RecordingContext` đổi mỗi ký tự thành tham chiếu glyph, còn đường (dòng kẻ, thân, móc nối, dấu nối) giữ nguyên lệnh.
* Mọi phần tử gán được chủ: bọc `Element.drawWithStyle` để biết phần tử đang vẽ; dấu hoá, chấm, cờ, đầu nốt truy về `StaveNote` qua `getNote()`. Thân của nốt có móc nối do `Beam` vẽ nên thuộc phần tĩnh (đổi màu theo trang, không phóng to).
* So ảnh (bản mẫu 2 khuông, 2 ô, có liên ba, móc nối, dấu nối, hợp âm, dấu hoá, lặng, tempo): **IoU 0,986 (Chromium), 0,983 (Firefox), chỉ 20–23 điểm ảnh lệch mạnh**, đều ở chữ "=180" (khác hinting). Số đo bằng fontkit trong Node khớp số đo của trình duyệt.
* Phông có sẵn trong VexFlow 5.6: Bravura, Petaluma, Gonville, Academico (+ đậm), Petaluma Script (**không có** Leland như ghi ở kế hoạch). Giấy phép: Bravura, Petaluma, Petaluma Script, Academico là SIL OFL 1.1 của Steinberg (có Reserved Font Name); Gonville không giữ bản quyền.
* Kích thước: `vexflow/core` 0,5 MB (bản đủ phông 1,3 MB). Bảng glyph sinh sẵn (377 glyph, 5 phông) 300 KB mã nguồn. Worker Bản nhạc sau build 817 KB, chỉ tải khi có widget; bundle chính không chứa VexFlow.

### S2: đạt tiêu chí (a); chất lượng đọc phụ thuộc cách thu nhạc

Thiết lập mặc định (móc kép, liên ba bật, ưu tiên đơn giản 1, 2 bè):

| Tệp | Nốt | Ô | Lỗi cấu trúc | Đúng lưới | Lệch TB / max | Phách liên ba | Lượng tử |
|---|---:|---:|---:|---:|---|---:|---:|
| `big roar.flp` | 1.168 | 128 | 0 | 100% | 0 / 0 ms | 0 | 7 ms |
| `fun song.flp` | 440 | 88 | 0 | 97,7% | 0,7 / 59 ms | 0 | 1 ms |
| `Oboe_MIDI_001.mid` | 1.696 | 83 | 0 | 94,6% | 1,6 / 63 ms | 73 | 7 ms |
| `Promise.flp` (12 track guitar/bass) | 6.885 | 99 | 0 | 66,8% | 10,1 / 108 ms | 32 | 13 ms |
| `BigProject4.rpp` (chơi lệch lưới) | 3.147 | 56 | 0 | 61,6% | 4,4 / 63 ms | 239 | 10 ms |
| MAESTRO Bach BWV 865 | 3.010 | 159 | 0 | 2,3% | 20,8 / 78 ms | 455 | 14 ms |
| MAESTRO Chopin Op. 9/2 | 1.498 | 111 | 0 | 2,0% | 22,9 / 78 ms | 206 | 6 ms |

* VexFlow dựng mọi ô ở chế độ `Voice.Mode.STRICT` không lỗi trên cả 7 tệp, sau ba sửa phát hiện nhờ spike: lặng cả ô ở nhịp khác 4/4 (dấu lặng tròn của VexFlow luôn tính 4 phách → đặt số tick bằng cả ô), nhóm liên ba có lặng ẩn (chỉ đổi tick, không vẽ ngoặc), cách viết nốt tự nhiên ngoài âm giai.
* Đọc ảnh: tệp DAW đúng lưới đọc tốt; `BigProject4` (lệch lưới) đúng cấu trúc nhưng rối (nhiều liên ba và dấu nối giả), đỡ hẳn khi chọn móc kép + tắt liên ba + ưu tiên đơn giản 3 (đúng lưới 59,8%, lệch TB 9,3 ms); nhiều track guitar dồn vào khuông piano thì rối (người dùng nên chọn track).
* **Nhạc chơi tự do (MAESTRO) không viết đúng nhịp được**: tệp có tempo cố định 120 BPM không liên quan tới phách thật, chỉ 2% nốt rơi vào lưới. Cần dò phách (beat tracking), ngoài phạm vi bản đầu → cảnh báo `WARN_NOTATION_OFFGRID` khi dưới 30% nốt đúng lưới (từ 50 nốt).
* Giọng (Krumhansl–Schmuckler, trọng số độ dài): Bach La thứ đúng; Chopin Mi giáng trưởng ra đúng 3 dấu giáng nhưng nhầm điệu thức (Đô thứ). Hoá biểu vẫn đúng nên bản nhạc không sai; có cảnh báo `WARN_NOTATION_KEY_GUESS` khi độ tin cậy < 0,05.
* Dựng cả bài trong ứng dụng (lượng tử + engrave): 49 ms (`fun song`) đến 287 ms (`BigProject4`, 25 trang). JSON layout 0,25–1,3 MB.

### S3: đạt

Layout `BigProject4` (dày nhất), 1920×1080, 30 fps, 4.500 khung, Export-like Worker (`OffscreenCanvas` + `VideoFrame`), ms/khung trung bình (300 khung đầu → 300 khung cuối):

| | Không cache, không sáng | Không cache, Quầng | Không cache, Mềm (`shadowBlur`) | Cache bitmap, Quầng |
|---|---|---|---|---|
| Chromium 159 | 2,25 (1,51 → 2,43) | 2,82 | 3,17 | 2,16 |
| Firefox 159 | 5,40 (4,32 → 5,34) | 5,82 | 8,48 | 5,25 |

Không có hiện tượng chậm dần kiểu lỗi phông (5 → 44 ms): chênh đầu/cuối là do mật độ nốt thay đổi theo bài. Cache bitmap chỉ lợi ~10% nên chưa làm. Mặc định **Quầng**; **Mềm** là tuỳ chọn (ghi rõ "chậm hơn"). Xuất thử trong ứng dụng (Chromium, 1080×1080, bài 21 s có widget Bản nhạc): 1,9–2,1 s.

### S4: đạt với phông có sẵn

* Petaluma (+ Petaluma Script cho chữ) cho bản nhạc viết tay đọc rõ.
* Nét run: dời đỉnh và điểm điều khiển, đoạn thẳng dài thành đường cong lượn nhẹ, glyph lệch/xoay/co nhỏ. Mức 1,2 gần như không thấy, mức 3 rõ kiểu kẻ tay mà vẫn đọc tốt. Dựng lại cả trang có nét run ~1,2 ms (luồng chính), nên boil 8–12 lần/giây không đáng kể.
* **Chưa thử**: nạp phông SMuFL của người dùng (cần thêm glyph vào bảng lúc chạy) → để lại T-94.

### S5: đạt

* Dàn tự động theo bề rộng (độ rộng tối thiểu từng ô từ `Formatter.preCalculateMinTotalWidth`, kéo giãn đều cả hàng) và chế độ N ô mỗi hàng / M hàng mỗi trang. Hai khuông chung một `Formatter` mỗi ô nên thẳng hàng. Đổi nhịp giữa bài có ký hiệu nhịp mới.
* Còn: không có 8va (nốt rất cao/thấp ra nhiều dòng kẻ phụ); đầu nốt giọng 2 đôi khi chạm giọng 1; dấu nối qua hàng vẽ thành nửa dấu nối.
