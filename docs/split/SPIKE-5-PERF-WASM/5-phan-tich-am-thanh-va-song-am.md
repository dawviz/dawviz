---
doc: SPIKE-5-PERF-WASM.md
doc_title: "Spike 5: đo hiệu năng và xét đề xuất chuyển phần tính toán sang Rust/WASM"
section: "5. Phân tích âm thanh và sóng âm"
path: "5. Phân tích âm thanh và sóng âm"
chunk: 5-phan-tich-am-thanh-va-song-am.md
source_lines: 63-79
source_sha1: aac793689f
ids: []
---
## 5. Phân tích âm thanh và sóng âm

| Việc | Trước | Sau | Ghi chú |
|---|---|---|---|
| Phổ 1 phút, Node 24 | 1.176–1.476 ms | **250 ms** (×5,9) | bảng `spectrum`/`peak`/`rms` giống hệt từng ô (0/768.128 ô khác) |
| Phổ 10 phút, Chrome 157 | ≈ 11 s (1,1 s/phút) | **1,85 s** | Worker, không chặn giao diện |
| Phổ 10 phút, Firefox 159 | n/a | **2,4 s** | |
| Sóng âm 20 phút stereo, Node | 508 ms | không đổi | tuyến tính, không cần sửa |

Nguyên nhân (đo bằng `--cpu-prof`): `trim()` gọi `copyWithin` sau mỗi khung, chép lại cả khối còn lại (958 ms trên tổng 1,3 s). Cách sửa ở [`audioFeatures.ts`](../../../packages/render-core/src/audioFeatures.ts):

1. Chỉ dồn bộ đệm khi phần bỏ đi ≥ nửa phần đang giữ (mỗi mẫu bị chép O(1) lần).
2. FFT thực 2048 mẫu qua FFT phức 1024 điểm, rồi tách phổ chẵn/lẻ.
3. Bảng đảo bit và hệ số xoay tính một lần cho mỗi cỡ.

Test mới so với cách tính tham chiếu (FFT phức đủ cỡ, `hypot`) trên tín hiệu nhiễu, và kiểm kết quả không đổi khi chia khối 1 / 333 / 4.096 / 50.000 mẫu.
