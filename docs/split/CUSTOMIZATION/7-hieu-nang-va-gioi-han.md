---
doc: CUSTOMIZATION.md
doc_title: "Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng"
section: "7. Hiệu năng và giới hạn"
path: "7. Hiệu năng và giới hạn"
chunk: 7-hieu-nang-va-gioi-han.md
source_lines: 181-206
source_sha1: 32d290c14b
ids: []
---
## 7. Hiệu năng và giới hạn

| Hạng mục | Giới hạn đề xuất v1 (đo lại ở T-27; cập nhật theo máy 1, 2026-11-22) |
|---|---|
| Hạt sống cùng lúc | 5.000 khi xem trước, 20.000 khi xuất (xuất không cần thời gian thực). Máy 1: 5.000 hạt đạt 60 fps trên Chrome (3,6 ms) nhưng **vượt ngân sách trên Firefox** (21 ms); mặc định 1.500 giữ nguyên |
| Phần tử trong một cảnh | **64** (đề xuất hạ từ 500, **chờ chủ dự án duyệt**; trùng trần widget của preset `PRESET_LIMITS.maxWidgets`). Máy 1: 61 widget 12 ms (Chrome) / 22 ms (Firefox) |
| Keyframe trong một thuộc tính | 10.000 |
| `shadowBlur` (phát sáng) | Tốn nhất trên Canvas 2D; khi vượt ngân sách thì dùng ảnh phát sáng dựng sẵn thay cho blur |

**Số đo trên một máy (T-27, 2026-11-22, [SPIKE-5](../../spikes/SPIKE-5-PERF-WASM.md)):** Chrome có GPU, 1080p, dự án 33.487 nốt: Piano Roll 0,8 ms/khung, thêm 5.000 hạt 3,6 ms, đủ 21 loại widget 4,5 ms, 61 widget 12 ms (p50, gồm cả đồng bộ GPU). Ở 502.305 nốt (trần AST): phát sáng mọi nốt 20 ms, 5.000 hạt 27 ms, 61 widget 37 ms; phần tính toán chỉ 5–25% thời gian, còn lại là vẽ. 

**Xuất thật (vẽ + mã hoá H.264 1080p60 bằng VideoEncoder, `node scripts/perf/run.mjs <tệp> --encode`), máy 1:**

| Cảnh | Chrome 157, 33.487 nốt | Chrome, 502.305 nốt | Firefox 159, 33.487 nốt |
|---|---|---|---|
| Piano Roll | 200 khung/giây | 102 | 85 |
| + phát sáng mọi nốt | 178 | 43 | 76 |
| + 1.500 hạt | 178 | — | 49 |
| + 5.000 hạt | 130 | 33 | 34 |
| Đủ 21 loại widget | 117 | 50 | 41 |
| 61 widget | 64 | — | 33 |

Mọi cảnh thực tế xuất **nhanh hơn thời gian thực** của video 60 fps trên Chrome; cảnh cực đoan (trần AST + phát sáng/hạt) và Firefox nhiều hạt xuống 33–43 khung/giây (chậm hơn thời gian thực, vẫn xuất được). **Đề xuất:** chưa cần Spike WebGL2 cho 1.0 trên loại máy này; khi phát sáng bật với hơn khoảng 2.000 nốt trên khung cùng lúc thì nên dùng ảnh phát sáng dựng sẵn (dòng `shadowBlur` ở bảng trên). Các số chỉ đúng cho máy 1 (Intel Arc, 22 luồng); T-27 vẫn cần một máy thứ hai (máy yếu, Windows hoặc macOS) trước khi chốt.

Canvas 2D đủ cho v1. Nếu đo thấy không đạt 60 fps xem trước, bước tiếp theo là vẽ hạt và nốt bằng WebGL2 trong cùng Render Core. Thay đổi này cần một Spike riêng và test so sánh ảnh Preview↔Export.
