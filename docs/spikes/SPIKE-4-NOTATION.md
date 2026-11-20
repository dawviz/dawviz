# Spike 4: bản nhạc (notation) bằng VexFlow, phát sáng từng nốt, nét tay

> Ngày 2026-11-20. **Trạng thái: kế hoạch, chưa chạy.** Mọi con số trong tài liệu này là mục tiêu hoặc ước lượng, chưa đo; chỗ nào cần dữ liệu thật đều ghi `[VERIFY]`. Kết quả từng mục S1…S5 sẽ được điền vào §6 khi làm xong, rồi mới chốt D-63 (hiện là *đề xuất*).
>
> Câu hỏi của chủ dự án: một video tham chiếu cho thấy bản nhạc (khuông đôi, tam liên, nối chùm, số ô nhịp) hiện trên nền, cả trang đổi màu và phát sáng theo "phase", nhưng nốt không sáng riêng. Muốn làm tốt hơn: **nốt đang phát (hoặc nốt mà playhead chạm tới) sáng và phóng to**, cho tuỳ biến tối đa (phông nhạc nguệch ngoạc, nét bút…), dùng **VexFlow**. Có cần spike không, có phải lượng tử hoá không, và làm sao để xuất video vẫn mượt?

## 1. Điều quan sát từ video tham chiếu (đoạn 1:49–2:10)

* Khuông đôi (khoá Sol, khoá Fa), hoá biểu giáng, nhịp 4/4, `♩=180`, số ô nhịp ở lề trái.
* Có tam liên (bracket + "3"), nốt móc nối chùm, dấu nối, dấu hoá, hợp âm dày, nốt lặng.
* Mỗi trang chỉ vài ô nhịp và đổi liên tục; màu và phát sáng của **cả trang** đổi theo phase (đỏ, hồng, xanh, trắng). Không có nốt nào sáng riêng.
* Bản nhạc có vẻ do người chép hoặc xuất từ phần mềm soạn nhạc, khác với nốt MIDI thô. Đây chỉ là nhận xét từ hình ảnh, không phải dữ liệu đã kiểm.

## 2. Hiện trạng liên quan trong repo

| Thực tế | Hệ quả |
|---|---|
| `Primitive` ở `packages/render-core/src/prims.ts` chỉ có `rect` và `text` | Cần primitive đường vẽ (path) và nhóm theo phần tử |
| Quy tắc 5 và 8 ([AI_CONTEXT §3](../../AI_CONTEXT.md)): Render Core tất định, không phụ thuộc mới trong `packages/*` | **VexFlow không được nằm trong render-core.** Phải tách bước "engrave" ra ngoài, Render Core chỉ vẽ dữ liệu thuần |
| Firefox xuất chậm dần khi nhiều mặt phông web trong Worker ([FIREFOX-FONT-SLOWDOWN](../design/FIREFOX-FONT-SLOWDOWN.md)) | Không nạp phông nhạc bằng `FontFace` trong Worker; dùng đường viền glyph (outline) |
| AST chưa có key signature (`meta` chỉ có tempo, nhịp…) | Phải ước lượng giọng và cho người dùng ghi đè |
| Chế độ Trang theo ô nhịp, `barStartSec`/`barPageAt` đã có (T-84) | Dùng lại cho lật trang bản nhạc |
| Phát sáng động `glow.ts` (D-50), easing ở `ANIMATION-CATALOG` | Dùng lại cho nốt sáng và phóng to |
| Chỉ mục nốt nhị phân `notes.ts` | Tra nốt đang phát theo `t` mà không cấp phát |

## 3. Kiến trúc đề xuất

```
AST (nốt, tempoMap, dấu nhịp)
   │  (1) Quantizer thuần, ngoài render-core          [REQ-NOTATION-01]
   ▼
ScoreModel: ô nhịp → giọng (voice) → sự kiện (nốt/hợp âm/lặng/tam liên), mỗi nốt giữ noteId + startTick THẬT
   │  (2) Engraver dùng VexFlow, RenderContext ghi lại lệnh vẽ   [S1]
   ▼
NotationLayout (JSON thuần, serialize được):
   pages[] → { staffLines, glyphs[{id, path, bbox}], beams, ties… }, mỗi phần tử có elementId = noteId hoặc nhóm tĩnh
   timeToX: bảng đơn điệu (thời gian thật → x) để nội suy giữa các nốt đã lượng tử hoá
   │  (3) Render Core vẽ dữ liệu này mỗi khung (hàm của t)       [REQ-WIDGET-09]
   ▼
Preview Canvas / Export Worker
```

Nguyên tắc:

1. **Lượng tử hoá chỉ để vẽ, không đổi thời điểm sáng.** Nốt sáng theo `startTick` thật; vị trí x của vạch phát nội suy qua `timeToX`. Nên lượng tử sai vẫn không làm lệch âm thanh.
2. **Engrave một lần, vẽ nhiều lần.** VexFlow chỉ chạy ở bước (2). Mỗi khung chỉ vẽ `NotationLayout`.
3. **Trang tĩnh cache thành bitmap, nốt đang sáng vẽ đè** (lớp động). Mất cache khi đổi màu/phase theo trang thì dựng lại; số trang giữ trong bộ nhớ có trần (LRU).
4. **Rung nét tất định:** nhiễu băm từ `(elementId, chỉ số đỉnh, floor(t·boilFps))`, không `Math.random`/`Date`.
5. **Phụ thuộc nằm ngoài `packages/render-core`**: `apps/web` hoặc package mới `@dawviz/notation`. Quyết định ở S1.
6. **Suy giảm có báo:** quá dày thì giảm giọng/độ phức tạp, báo `WARN_NOTATION_*`; cực đoan thì rơi về Piano Roll. Không bỏ thầm lặng (quy tắc 6).

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

## 5. Khả năng tuỳ biến dự kiến

| Nhóm | Tuỳ chọn |
|---|---|
| Nốt sáng | trạng thái sắp tới / đang ngân / đã qua, mỗi trạng thái có màu, độ đục, độ sáng; màu theo track hoặc theo phase; phóng to quanh tâm đầu nốt với easing (dùng lại ANIMATION-CATALOG) và thời gian vào/ra; glow |
| Playhead | tắt (chỉ nốt sáng), vạch theo ô nhịp, vạch mượt (dùng REQ-GRAPHICS-16) |
| Phông và nét | phông nhạc (kèm phông viết tay), nạp SMuFL, độ dày dòng kẻ, độ rung nét, kiểu rung (tĩnh/boil), tần số boil |
| Nội dung hiển thị | khoá, giọng, nhịp, số ô nhịp, `♩=`, tên nốt trong đầu nốt, ký hiệu hợp âm phía trên (nối widget Chord), dấu động từ velocity |
| Lượng tử hoá | độ chính xác (tự động, 1/8, 1/16, 1/32), tam liên bật/tắt, ngưỡng gộp hợp âm, nốt ngắn nhất, cách chia hai tay, giọng ghi đè |
| Trang | số ô nhịp mỗi trang, lật trang (cắt, mờ dần, trượt, nét bút quét), hiện trang sau trước, hoặc cuộn ngang |

## 6. Kết quả

*(chưa có; điền khi chạy xong từng spike. Dùng định dạng: kết luận, số đo, tệp dùng, quyết định.)*

## 7. Điều kiện chốt D-63

Có thể chốt khi: S1 đạt (hoặc có phương án thay đã chọn); S2 cho (a) = 0 trên ba tệp; S3 cho thấy không có hiện tượng chậm dần trên Firefox; giấy phép các phông định đóng gói đã kiểm. S4 và S5 có thể chốt sau, không chặn D-63 nhưng chặn bản phát hành chứa tính năng.

## 8. Việc kéo theo (không làm trong spike)

Trang hướng dẫn sử dụng (`docs/manual`, vi + en), chuỗi `locales/*.json`, mã cảnh báo vào Phụ lục A2 của SRS, `CREDITS.md`: làm cùng task triển khai (T-90…T-95 trong [PROGRESS](../../PROGRESS.md)) vì đến lúc đó mới có giao diện để mô tả (AI_CONTEXT 3a).
