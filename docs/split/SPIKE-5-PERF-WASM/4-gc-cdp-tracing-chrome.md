---
doc: SPIKE-5-PERF-WASM.md
doc_title: "Spike 5: đo hiệu năng và xét đề xuất chuyển phần tính toán sang Rust/WASM"
section: "4. GC (CDP tracing, Chrome)"
path: "4. GC (CDP tracing, Chrome)"
chunk: 4-gc-cdp-tracing-chrome.md
source_lines: 54-62
source_sha1: 53acc77056
ids: []
---
## 4. GC (CDP tracing, Chrome)

| Cảnh | Số khung | GC nhỏ (số lần / tổng / dài nhất) | GC lớn (số lần / tổng / dài nhất) |
|---|---|---|---|
| Đủ 21 loại widget, 33.487 nốt | ≈ 1.830 | 102 / 78,6 ms / **2,5 ms** | 8 / 19,0 ms / **4,2 ms** |
| Hạt 5.000, 502.305 nốt | ≈ 630 | 88 / 88,9 ms / **9,8 ms** (4 lần > 4 ms) | 1 / 4,4 ms / 4,5 ms |

Cảnh thực tế không có lần dừng nào gây khựng thấy được. Ở cảnh cực đoan, cách sửa rẻ hơn WASM là giảm cấp phát trong `particlePrims`/`layoutPianoRoll` (dùng lại mảng, không tạo đối tượng tạm), nếu sau này đo thấy cần.
