# Spike 5: đo hiệu năng và xét đề xuất chuyển phần tính toán sang Rust/WASM

> Ngày 2026-11-22. Chủ dự án đưa một đề xuất: chuyển phân tích âm thanh, parser và phần tính toán của Render Core sang Rust/WASM (giảm GC, dùng SIMD, Struct-of-Arrays), và yêu cầu **đo trước khi quyết**. Kết quả dẫn tới D-65 (**đề xuất, chờ chủ dự án duyệt**). Số liệu cũng là phần đo trên máy này của T-27.

## 1. Kết luận

* **Chưa nên dùng WASM cho 1.0.** Ở mọi cảnh đã đo, phần WASM thay được (`layoutFrame`: tính toạ độ, hạt, nội suy) chỉ chiếm **5–25%** thời gian khung. Phần còn lại là vẽ Canvas 2D và GPU, mà WASM không vẽ được. Kể cả khi phần tính toán giảm về 0, các cảnh vượt 16,7 ms vẫn vượt.
* **GC không phải vấn đề ở cảnh thực tế.** Đo bằng CDP tracing: GC nhỏ dài nhất **2,5 ms**, GC lớn dài nhất **4,2 ms**, trung bình **0,05 ms/khung**. Mức 5–20 ms mà đề xuất giả định chỉ chạm tới (9,8 ms) ở cảnh cực đoan 500.000 nốt kèm 5.000 hạt.
* **Phân tích âm thanh từng chậm thật, nhưng do lỗi thuật toán chứ không do JS.** 75% thời gian nằm ở chỗ dồn bộ đệm sau *mỗi* khung, tức chi phí gần O(n²). Đã sửa bằng JS (dồn thưa + FFT thực cỡ N/2): **nhanh hơn 5,9 lần**, bảng kết quả giống hệt từng ô. Bài 10 phút trên Chrome giảm từ khoảng 11 s xuống **1,85 s**.
* **Parser chạy một lần khi mở tệp:** ≤ 266 ms (Node) cho tệp thật lớn nhất trong bộ thử. Không đáng chuyển.
* **Nếu sau này cần nhanh hơn, ưu tiên phần vẽ** (gom lệnh vẽ theo màu, giảm `shadowBlur`, hoặc WebGL2 như T-27/T-36 đã dự kiến), không ưu tiên WASM cho phần tính toán.

## 2. Môi trường đo (thật, không giả lập)

| | |
|---|---|
| Máy | Linux, 22 luồng CPU, 30 GB RAM, Intel Arc Graphics (Meteor Lake) |
| Chrome | 157 (bản cài trên máy), **có giao diện**, ANGLE trên OpenGL ES 3.2 của GPU thật |
| Firefox | 159 (Playwright), có giao diện, WebGL2 trên GPU thật. Bộ đếm giờ làm tròn 1 ms nên chỉ dùng để so chiều hướng |
| Khung | 1920×1080, `scale` 1 (như xuất 1080p) |
| Công cụ | [`scripts/perf/run.mjs`](../../scripts/perf/run.mjs) + [`frame-bench.ts`](../../scripts/perf/frame-bench.ts): parser của repo đọc tệp, Render Core chính thức dựng và vẽ |

Ba con số cho mỗi khung: **layout** = `layoutFrame` (thuần tính toán, đúng phần đề xuất muốn đưa sang WASM); **render** = `renderFrame` (tính + phát lệnh vẽ); **render+sync** = `renderFrame` rồi `getImageData` 1 px, buộc GPU vẽ xong (gần với Export, vì Export đọc khung ra `VideoFrame`). Số liệu chỉ đúng cho máy này, không khẳng định cho máy khác.

## 3. Số đo khung hình (Chrome, GPU thật)

Dự án thật `TRANCECRAFTER_37.flp` (20 MB, 28 track, **33.487 nốt**, 880 s), 600 khung mỗi cảnh, đơn vị ms (p50 / p95):

| Cảnh | Primitive/khung | layout | render | render+sync | Khung > 16,7 ms |
|---|---|---|---|---|---|
| Piano Roll mặc định | 270 | 0,1 / 0,3 | 0,2 / 0,3 | 0,8 / 0,9 | 1/600 |
| + phát sáng 0,8 mọi nốt | 270 | 0,1 / 0,2 | 0,2 / 0,3 | 1,7 / 2,0 | 1/600 |
| + Hạt 1.500 | 506 | 0,1 / 0,2 | 0,4 / 0,5 | 1,6 / 1,8 | 0/600 |
| + Hạt 5.000 | 1.065 | 0,1 / 0,3 | 0,8 / 0,9 | 3,6 / 4,1 | 2/600 |
| Đủ 21 loại widget | 4.713 | 1,0 / 1,5 | 1,8 / 2,2 | 4,5 / 5,5 | 2/600 |
| 3 × đủ 21 loại widget (61 widget) | 13.598 | 2,5 / 3,9 | 5,4 / 6,6 | 12,0 / 13,6 | 5/600 |

Cảnh cực đoan: chép track thành **502.305 nốt** (420 track; trần AST là 500.000), 60 khung:

| Cảnh | Primitive/khung | layout | render | render+sync |
|---|---|---|---|---|
| Piano Roll | 2.239 | 1,4 / 1,9 | 2,4 / 3,0 | 5,4 / 7,6 |
| + phát sáng | 2.239 | 1,4 / 1,9 | 3,1 / 3,8 | **20,3** / 21,6 |
| + Hạt 5.000 | 7.239 | 1,9 / 2,6 | 7,8 / 8,7 | **27,4** / 31,5 |
| Đủ 21 loại widget | 8.289 | 3,6 / 4,9 | 7,0 / 8,1 | **17,5** / 20,7 |
| 3 × đủ 21 loại widget | 20.390 | 7,8 / 10,1 | 16,0 / 17,9 | **37,2** / 45,5 |

Dựng dữ liệu dẫn xuất (một lần mỗi dự án × scene, không theo khung): `buildIndex` 13–21 ms, `buildSceneHud` 33 ms; riêng cảnh có widget Hợp âm trên 502 nghìn nốt mất 595–605 ms.

Firefox (300 khung, dự án 33.487 nốt; ms làm tròn): layout 0–4, render+sync 3 (Piano Roll), 21 (Hạt 5.000), 14 (đủ widget), 21 (61 widget). Firefox vẽ chậm hơn Chrome rõ rệt ở cảnh nhiều hạt, nhưng phần layout vẫn nhỏ.

**Đọc bảng:** ở mọi dòng, layout ≤ 25% của render+sync. Những cảnh vượt ngân sách 16,7 ms đều vượt vì phần vẽ: phát sáng (`shadowBlur`), nhiều hạt, hàng chục nghìn primitive.

## 4. GC (CDP tracing, Chrome)

| Cảnh | Số khung | GC nhỏ (số lần / tổng / dài nhất) | GC lớn (số lần / tổng / dài nhất) |
|---|---|---|---|
| Đủ 21 loại widget, 33.487 nốt | ≈ 1.830 | 102 / 78,6 ms / **2,5 ms** | 8 / 19,0 ms / **4,2 ms** |
| Hạt 5.000, 502.305 nốt | ≈ 630 | 88 / 88,9 ms / **9,8 ms** (4 lần > 4 ms) | 1 / 4,4 ms / 4,5 ms |

Cảnh thực tế không có lần dừng nào gây khựng thấy được. Ở cảnh cực đoan, cách sửa rẻ hơn WASM là giảm cấp phát trong `particlePrims`/`layoutPianoRoll` (dùng lại mảng, không tạo đối tượng tạm), nếu sau này đo thấy cần.

## 5. Phân tích âm thanh và sóng âm

| Việc | Trước | Sau | Ghi chú |
|---|---|---|---|
| Phổ 1 phút, Node 24 | 1.176–1.476 ms | **250 ms** (×5,9) | bảng `spectrum`/`peak`/`rms` giống hệt từng ô (0/768.128 ô khác) |
| Phổ 10 phút, Chrome 157 | ≈ 11 s (1,1 s/phút) | **1,85 s** | Worker, không chặn giao diện |
| Phổ 10 phút, Firefox 159 | n/a | **2,4 s** | |
| Sóng âm 20 phút stereo, Node | 508 ms | không đổi | tuyến tính, không cần sửa |

Nguyên nhân (đo bằng `--cpu-prof`): `trim()` gọi `copyWithin` sau mỗi khung, chép lại cả khối còn lại (958 ms trên tổng 1,3 s). Cách sửa ở [`audioFeatures.ts`](../../packages/render-core/src/audioFeatures.ts):

1. Chỉ dồn bộ đệm khi phần bỏ đi ≥ nửa phần đang giữ (mỗi mẫu bị chép O(1) lần).
2. FFT thực 2048 mẫu qua FFT phức 1024 điểm, rồi tách phổ chẵn/lẻ.
3. Bảng đảo bit và hệ số xoay tính một lần cho mỗi cỡ.

Test mới so với cách tính tham chiếu (FFT phức đủ cỡ, `hypot`) trên tín hiệu nhiễu, và kiểm kết quả không đổi khi chia khối 1 / 333 / 4.096 / 50.000 mẫu.

## 6. Từng mục của đề xuất

| Mục đề xuất | Số đo | Đánh giá |
|---|---|---|
| Âm thanh (FFT, dải log, đỉnh) | 1,1 s/phút → 0,18–0,25 s/phút sau khi sửa JS | WASM SIMD có thể nhanh thêm khoảng 2 lần nữa, nhưng việc này chạy một lần trong Worker; không đáng thêm chuỗi công cụ Rust |
| Parser (inflate, XML, TLV, `.rpp`) | ≤ 266 ms một lần (tệp 4 MB nén); FLP 20 MB 188 ms | Không đáng |
| Render Core: layout Piano Roll, hạt, nội suy | 0,1–2,5 ms/khung (thực tế); ≤ 7,8 ms (cực đoan) | Không giải quyết được nút thắt là vẽ; thêm chi phí chép mảng qua lại JS↔WASM |
| GC | ≤ 4,2 ms (thực tế) | Không cần WASM; giảm cấp phát trong JS nếu cần |
| Lượng tử hoá, lý thuyết nhạc, snap, hit-test | không nằm trên đường nóng | Không đáng |
| `@dawviz/expr` viết bằng Rust | chưa có | Trái AD-13 (package zero-dependency, chạy được trong Node test và Worker không cần bước build riêng). Biểu thức chỉ là cây closure nhỏ mỗi khung |

Chi phí nếu dùng WASM: Rust + target `wasm32` cho CI cả Linux và Windows, bước build mới cho `packages/*` (hiện là TS/JS chạy thẳng bằng `node --test`), mã tất định phải giữ khớp bit giữa hai cách cài (Preview ↔ Export), và tăng cỡ tải về.

## 6b. Xuất thật (bổ sung 2026-11-22, G8)

Đo vẽ + mã hoá H.264 1080p60 bằng `VideoEncoder` (`run.mjs --encode`): Chrome 64–200 khung/giây với dự án 33.487 nốt, 33–102 ở 502.305 nốt; Firefox 33–85. Bảng đầy đủ ở [CUSTOMIZATION §7](../design/CUSTOMIZATION.md). Kết luận không đổi: nút thắt là vẽ, không phải tính toán.

## 7. Bước tiếp theo đề xuất (chưa làm)

* Phần vẽ: gom `fillRect` theo màu/độ đục (một `Path2D` mỗi nhóm), thay `shadowBlur` bằng ảnh phát sáng dựng sẵn khi vượt ngân sách (CUSTOMIZATION §7 đã ghi), WebGL2 cho nốt và hạt (Spike riêng như T-27/T-36).
* Đo lại trên ít nhất một máy khác (máy yếu, Windows hoặc macOS) trước khi chốt giới hạn ở CUSTOMIZATION §7 (T-27 yêu cầu 2 máy).
* `buildSceneHud` với widget Hợp âm trên tệp rất lớn (≈ 600 ms): chạy một lần, nhưng nếu người dùng thêm widget Hợp âm trên tệp lớn thì có thể thấy giật nhẹ một lần.
