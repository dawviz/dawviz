---
doc: SPIKE-5-PERF-WASM.md
doc_title: "Spike 5: đo hiệu năng và xét đề xuất chuyển phần tính toán sang Rust/WASM"
section: "6b. Xuất thật (bổ sung 2026-11-22, G8)"
path: "6b. Xuất thật (bổ sung 2026-11-22, G8)"
chunk: 6b-xuat-that-bo-sung-2026-11-22-g8.md
source_lines: 93-96
source_sha1: 53acc77056
ids: []
---
## 6b. Xuất thật (bổ sung 2026-11-22, G8)

Đo vẽ + mã hoá H.264 1080p60 bằng `VideoEncoder` (`run.mjs --encode`): Chrome 64–200 khung/giây với dự án 33.487 nốt, 33–102 ở 502.305 nốt; Firefox 33–85. Bảng đầy đủ ở [CUSTOMIZATION §7](../../design/CUSTOMIZATION.md). Kết luận không đổi: nút thắt là vẽ, không phải tính toán.
