---
doc: ANIMATION-CATALOG.md
doc_title: "Danh mục hiệu ứng chuyển động và đường cong nội suy"
section: "1. Kiểu nội suy keyframe (theo thời gian)"
path: "1. Kiểu nội suy keyframe (theo thời gian)"
chunk: 1-kieu-noi-suy-keyframe-theo-thoi-gian.md
source_lines: 19-37
source_sha1: 194f6b631f
ids: []
---
## 1. Kiểu nội suy keyframe (theo thời gian)

Quyết định giá trị thay đổi **thế nào** giữa hai keyframe.

| Kiểu | Mô tả | Ưu tiên |
|---|---|---|
| Hold / Constant / Step | Giữ nguyên giá trị rồi nhảy ở keyframe sau | v1.0 |
| Linear | Tốc độ đều | v1.0 |
| Bezier (tay cầm tự do) | Mỗi keyframe có tay cầm vào/ra chỉnh độc lập | v1.0 |
| Continuous / Aligned Bezier | Tay cầm vào và ra luôn thẳng hàng, đường cong mượt qua keyframe | v1.0 |
| Auto Bezier | Tự tính tay cầm cho mượt | v1.0 |
| Auto Clamped | Như Auto nhưng không vượt quá giá trị của hai keyframe lân cận (không overshoot) | v1.0 |
| Vector | Tay cầm chỉ thẳng về keyframe kề bên (góc nhọn có kiểm soát) | v1.1 |
| TCB (Kochanek–Bartels) | Ba tham số Tension, Continuity, Bias thay cho tay cầm | v1.1 |
| Catmull-Rom / Smooth | Đường cong mượt đi qua mọi keyframe, không cần tay cầm | v1.0 |
| Monotone cubic | Mượt mà không bao giờ vượt quá (hợp cho độ mờ, âm lượng) | v1.0 |
| Roving keyframe | Keyframe giữa tự trượt thời gian để **tốc độ không đổi** qua nhiều điểm | v1.1 |
| Separate dimensions | Tách `x`, `y` (và `z`) thành các đường cong riêng | v1.0 |
