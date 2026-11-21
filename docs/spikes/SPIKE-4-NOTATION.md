# Spike 4: bản nhạc (notation) bằng VexFlow, phát sáng từng nốt, nét tay

> Kế hoạch 2026-11-20, chạy và triển khai 2026-11-21. **Trạng thái: S1–S5 đã chạy; S1, S2 (tiêu chí a), S3, S4 (phông có sẵn), S5 đạt → D-63 chốt và đã triển khai (T-90…T-95).** Còn lại ghi ở §8 và OI-20.
>
> Câu hỏi của chủ dự án: một video tham chiếu cho thấy bản nhạc (khuông đôi, tam liên, nối chùm, số ô nhịp) hiện trên nền, cả trang đổi màu và phát sáng theo "phase", nhưng nốt không sáng riêng. Muốn làm tốt hơn: **nốt đang phát (hoặc nốt mà playhead chạm tới) sáng và phóng to**, cho tuỳ biến tối đa (phông nhạc nguệch ngoạc, nét bút…), dùng **VexFlow**. Có cần spike không, có phải lượng tử hoá không, và làm sao để xuất video vẫn mượt?

## 1. Điều quan sát từ video tham chiếu (đoạn 1:49–2:10)

* Khuông đôi (khoá Sol, khoá Fa), hoá biểu giáng, nhịp 4/4, `♩=180`, số ô nhịp ở lề trái.
* Có tam liên (bracket + "3"), nốt móc nối chùm, dấu nối, dấu hoá, hợp âm dày, nốt lặng.
* Mỗi trang chỉ vài ô nhịp và đổi liên tục; màu và phát sáng của **cả trang** đổi theo phase (đỏ, hồng, xanh, trắng). Không có nốt nào sáng riêng.
* Bản nhạc có vẻ do người chép hoặc xuất từ phần mềm soạn nhạc, khác với nốt MIDI thô. Đây chỉ là nhận xét từ hình ảnh, không phải dữ liệu đã kiểm.

## 2. Hiện trạng liên quan trong repo (trước spike)

| Thực tế | Hệ quả |
|---|---|
| `Primitive` chỉ có `rect` và `text` | Cần primitive đường vẽ: đã thêm `PathPrim` (`kind: 'path'`) |
| Quy tắc 5 và 8 ([AI_CONTEXT §3](../../AI_CONTEXT.md)): Render Core tất định, không phụ thuộc mới trong `packages/*` | VexFlow chỉ nằm ở `apps/web` (Worker); phần thuần (lượng tử, cách viết cao độ, kiểu layout, renderer) ở Render Core |
| Firefox xuất chậm dần khi nhiều mặt phông web trong Worker ([FIREFOX-FONT-SLOWDOWN](../design/FIREFOX-FONT-SLOWDOWN.md)) | Không `FontFace` nào cho bản nhạc: đo và vẽ glyph bằng bảng sinh sẵn |
| AST chưa có key signature | Giọng ước lượng ở bước lượng tử (dữ liệu dẫn xuất), người dùng ghi đè; AST không đổi |
| Trang theo ô nhịp (T-84), phát sáng (D-50), easing | Dùng lại ý tưởng; widget có lật trang và phóng to riêng |

## 3. Kiến trúc (sau spike)

```
AST (nốt, tempoMap, dấu nhịp)
  │ ① quantize()            packages/render-core/src/notation/quantize.ts   (thuần, tất định)
  ▼
ScoreModel: ô → khuông → giọng → sự kiện (nốt/hợp âm/lặng/lặng ẩn/liên ba), mỗi nốt giữ noteId; giọng ước lượng
  │ ② engrave()             apps/web/src/lib/notation/engrave.ts (VexFlow 5.6 core, trong notation.worker.ts)
  │    RecordingContext ghi lệnh vẽ theo phần tử; đo chữ bằng bảng glyph sinh sẵn (notationFonts.generated.ts)
  ▼
NotationLayout (JSON thuần): trang → phần tử (đường/dãy glyph, chủ = nốt), chủ → giây thật, hàng → mốc thời gian→x, bảng đường viền glyph
  │ ③ notationRenderer      packages/render-core/src/notation/widget.ts + draw.ts (mỗi khung, hàm của t)
  ▼
Preview Canvas / Export Worker (nhận cùng NotationLayout qua job.notation)
```

Nguyên tắc (đã giữ khi làm):

1. **Lượng tử hoá chỉ để vẽ.** Nốt sáng theo giây thật của nốt AST (`owner.on/off`); vạch phát nội suy qua mốc thời gian → x đơn điệu. Lượng tử sai không làm lệch tiếng.
2. **Engrave một lần, vẽ nhiều lần.** Worker dựng, bộ đệm theo khoá (dự án + tempo + tập track + thuộc tính ảnh hưởng bản dựng). Đổi màu/phóng to/nét tay không dựng lại.
3. **Không phông web khi vẽ.** Glyph là đường viền (Path2D đệm theo glyph). Đo chữ lúc dàn trang cũng từ cùng bảng nên mọi trình duyệt dàn như nhau và Preview = Export.
4. **Nét tay tất định**: nhiễu băm `(id phần tử, đỉnh, floor(t·boilFps), seed)`.
5. **Suy giảm có báo** bằng mã cảnh báo (`WARN_NOTATION_*`), không bỏ thầm lặng.

Điều chỉnh so với kế hoạch: (a) **không cache bitmap trang** ở bản đầu: S3 cho thấy vẽ thẳng đã đủ nhanh, và bitmap phải dựng lại khi widget xoay/đổi cỡ; (b) **không tự rơi về Piano Roll**: chỉ cảnh báo, người dùng tự chọn; (c) đo chữ bằng **bảng sinh sẵn** thay vì fontkit lúc chạy (fontkit chỉ dùng ở script sinh); (d) Gonville/Petaluma **dự phòng sang Bravura** cho glyph thiếu (Gonville không có số liên ba và nốt của ký hiệu tempo).

## 4. Các spike (câu hỏi và cách làm)

Mã spike là mã thử riêng (commit `1ae4887`; đã xoá khỏi cây thư mục khi widget thành chính thức, xem `git show 1ae4887`). Công cụ còn dùng được nằm ở `scripts/notation/` (đo lưới, lượng tử hoá, e2e và xuất trong ứng dụng thật); dữ liệu thử ở thư mục data của scripts/notation (bị bỏ khỏi git). Dữ liệu: tệp mẫu trong `test/fixtures` (kể cả `third-party/`, không commit) và 2 bài của bộ MAESTRO v3 (Google Magenta, **CC BY-NC-SA 4.0**, chỉ dùng để đo, không phân phối lại): Chopin Nocturne Op. 9 No. 2, Bach WTC I Prelude và Fugue La thứ BWV 865.

* **S1** VexFlow ngoài DOM + `RenderContext` ghi lại → display list; so ảnh với VexFlow vẽ thật bằng phông web.
* **S2** Lượng tử hoá trên tệp thật: lỗi cấu trúc, % đúng lưới, sai số, thời gian; đọc ảnh.
* **S3** Hiệu năng trong Worker + `VideoFrame` (như Export), 1920×1080, 4.500 khung, Chromium và Firefox, ba kiểu phát sáng, có/không cache bitmap.
* **S4** Phông viết tay (Petaluma), nét tay tĩnh và boil.
* **S5** Dàn trang tự động và N ô/trang, căn hai khuông.

## 5. Khả năng tuỳ biến (đã làm)

| Nhóm | Tuỳ chọn |
|---|---|
| Nốt sáng | màu nốt sắp tới / đang ngân / đã qua và độ đục; màu theo track; phóng to **Nảy** hoặc **Giữ khi ngân**, độ lớn và thời gian; quầng sáng **Quầng** (nhanh) hoặc **Mềm** (`shadowBlur`), độ rộng |
| Sáng cả bản nhạc (thêm sau spike, T-96) | tắt / luôn sáng / nhấp theo phách, ô nhịp hoặc giây; kiểu Thở, Loé, Bật tắt; lặp mỗi N; độ sáng, mức thấp nhất, màu |
| Độ đục (thêm sau spike) | cả bản nhạc; khuông và ký hiệu tĩnh; nốt sắp tới / đã qua |
| Vạch phát | không / vạch, màu, độ dày |
| Phông và nét | In (Bravura), Viết tay (Petaluma + Petaluma Script), Cổ điển (Gonville); nét run tay, số lần đổi mỗi giây, hạt giống |
| Nội dung | số ô nhịp (kèm cỡ chữ), ghi tempo; giọng tự đoán hoặc tự đặt (hoá biểu, giọng thứ) |
| Lượng tử | nốt ngắn nhất (8/16/32), liên ba, ưu tiên nhịp đơn giản, số bè mỗi khuông, điểm chia hai tay |
| Trang | số ô mỗi hàng (0 = tự dàn), số hàng mỗi trang, vị trí trong khung, mờ dần khi sang trang |

Chưa làm: ký hiệu hợp âm phía trên khuông, tên nốt trong đầu nốt, dấu động theo velocity, 8va, cuộn ngang, chuyển trang kiểu nét bút quét, nạp phông SMuFL của người dùng (§8).

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

## 7. Quyết định

D-63 chốt (BRD §7): làm widget Bản nhạc theo kiến trúc §3 ở bản phát hành kế tiếp. Tiêu chí ở kế hoạch: S1 đạt, S2 (a) = 0 trên mọi tệp, S3 không chậm dần trên Firefox, giấy phép phông đã đọc và chốt (§8).

## 8. Còn lại

* ~~Giấy phép~~ **chốt 2026-11-21 (chủ dự án, OI-20 (a))**: không cần hỏi thêm Steinberg. OFL 1.1 cho phép chuyển glyph thành đường vẽ và nhúng vào phần mềm; Reserved Font Name chỉ cấm đặt tên bản dẫn xuất trùng tên gốc, và giao diện gọi theo kiểu ("In", "Viết tay", "Cổ điển"). Ghi công ở CREDITS. Bản build phát hành mang văn bản giấy phép: `dist/fonts/OFL-SMuFL-Steinberg.txt` (OFL + dòng bản quyền Steinberg) và `dist/THIRD-PARTY-NOTICES.txt` (giấy phép của mọi gói chạy trong ứng dụng, sinh bởi `scripts/gen-third-party.mjs` sau `vite build`); `packages/render-core/test/fonts.test.ts` kiểm tệp OFL có dòng bản quyền.
* **Mã spike** đã chuyển thành chính thức khi widget hoàn tất (2026-11-21): phần engrave/vẽ nay là `apps/web/src/lib/notation/` và `packages/render-core/src/notation/`; công cụ đo còn lại ở `scripts/notation/` (README ghi cách chạy và cách tải MAESTRO); bản thử cũ (so ảnh S1, trang đo S3, engraver S5) xoá khỏi cây thư mục nhưng giữ trong lịch sử git (`git show 1ae4887`). Kết quả chạy và dữ liệu MAESTRO không commit.
* Dò phách cho nhạc chơi tự do; ký hiệu hợp âm, tên nốt, dấu động, 8va, cuộn ngang; nạp phông SMuFL người dùng; nhận diện điệu thức tốt hơn (trưởng/thứ cùng hoá biểu).
