---
doc: CUSTOMIZATION.md
doc_title: "Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng"
section: "7. Hiệu năng và giới hạn"
path: "7. Hiệu năng và giới hạn"
chunk: 7-hieu-nang-va-gioi-han.md
source_lines: 181-193
source_sha1: 2e38933ae5
ids: []
---
## 7. Hiệu năng và giới hạn

| Hạng mục | Giới hạn đề xuất v1 (đo lại ở T-27) |
|---|---|
| Hạt sống cùng lúc | 5.000 khi xem trước, 20.000 khi xuất (xuất không cần thời gian thực) |
| Phần tử trong một cảnh | 500 |
| Keyframe trong một thuộc tính | 10.000 |
| `shadowBlur` (phát sáng) | Tốn nhất trên Canvas 2D; khi vượt ngân sách thì dùng ảnh phát sáng dựng sẵn thay cho blur |

**Số đo trên một máy (T-27, 2026-11-22, [SPIKE-5](../../spikes/SPIKE-5-PERF-WASM.md)):** Chrome có GPU, 1080p, dự án 33.487 nốt: Piano Roll 0,8 ms/khung, thêm 5.000 hạt 3,6 ms, đủ 21 loại widget 4,5 ms, 61 widget 12 ms (p50, gồm cả đồng bộ GPU). Ở 502.305 nốt (trần AST): phát sáng mọi nốt 20 ms, 5.000 hạt 27 ms, 61 widget 37 ms; phần tính toán chỉ 5–25% thời gian, còn lại là vẽ. Các giới hạn trong bảng chưa đổi: T-27 cần đo thêm ít nhất một máy nữa.

Canvas 2D đủ cho v1. Nếu đo thấy không đạt 60 fps xem trước, bước tiếp theo là vẽ hạt và nốt bằng WebGL2 trong cùng Render Core. Thay đổi này cần một Spike riêng và test so sánh ảnh Preview↔Export.
