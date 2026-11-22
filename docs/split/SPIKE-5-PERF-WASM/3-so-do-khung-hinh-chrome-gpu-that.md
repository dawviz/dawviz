---
doc: SPIKE-5-PERF-WASM.md
doc_title: "Spike 5: đo hiệu năng và xét đề xuất chuyển phần tính toán sang Rust/WASM"
section: "3. Số đo khung hình (Chrome, GPU thật)"
path: "3. Số đo khung hình (Chrome, GPU thật)"
chunk: 3-so-do-khung-hinh-chrome-gpu-that.md
source_lines: 25-53
source_sha1: aac793689f
ids: []
---
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
