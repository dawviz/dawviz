---
doc: CUSTOMIZATION.md
doc_title: "Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng"
section: "7. Hiệu năng và giới hạn"
path: "7. Hiệu năng và giới hạn"
chunk: 7-hieu-nang-va-gioi-han.md
source_lines: 180-190
source_sha1: 85632d9161
ids: []
---
## 7. Hiệu năng và giới hạn

| Hạng mục | Giới hạn đề xuất v1 (đo lại ở T-27) |
|---|---|
| Hạt sống cùng lúc | 5.000 khi xem trước, 20.000 khi xuất (xuất không cần thời gian thực) |
| Phần tử trong một cảnh | 500 |
| Keyframe trong một thuộc tính | 10.000 |
| `shadowBlur` (phát sáng) | Tốn nhất trên Canvas 2D; khi vượt ngân sách thì dùng ảnh phát sáng dựng sẵn thay cho blur |

Canvas 2D đủ cho v1. Nếu đo thấy không đạt 60 fps xem trước, bước tiếp theo là vẽ hạt và nốt bằng WebGL2 trong cùng Render Core. Thay đổi này cần một Spike riêng và test so sánh ảnh Preview↔Export.
