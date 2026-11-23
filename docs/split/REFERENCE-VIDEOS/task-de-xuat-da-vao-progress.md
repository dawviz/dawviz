---
doc: REFERENCE-VIDEOS.md
doc_title: "Video tham chiếu: ý tưởng, mức tái hiện và lộ trình"
section: "Task đề xuất (đã vào `PROGRESS`)"
path: "Task đề xuất (đã vào `PROGRESS`)"
chunk: task-de-xuat-da-vao-progress.md
source_lines: 80-91
source_sha1: 70b5971deb
ids: []
---
## Task đề xuất (đã vào `PROGRESS`)

| ID | Việc | Phụ thuộc |
|---|---|---|
| T-104 | Camera ảo và độ sâu: `depth` mỗi widget, parallax theo quỹ đạo camera (keyframe được), sau đó nghiêng phối cảnh. Đo chi phí ở Export Worker trước | spike nhỏ về chiếu phối cảnh trên Canvas 2D |
| T-105 | Stereo trong bộ phân tích âm thanh (L/R, mid/side) và widget Vectorscope | `audioFeatures.ts` |
| T-106 | Hậu kỳ: phản chiếu, mờ theo độ sâu, bloom; hạt mờ (bokeh) | T-104 (độ sâu) |
| T-107 | Widget Khung ô, Degree, Dots (video 3) | `KEY_SCALE`, `CHORD_DETECTION` |
| T-108 | Loudness (momentary/integrated/peak) và nhiều nguồn âm thanh (stems) | `audioFeatures.ts`, `audioEngine.ts` |
| T-109 | Đóng gói thêm Space Grotesk 300 (tiêu đề mảnh của video 1) và dải phím `[ C C# … ]` giữ ô cố định | — |

Gộp với việc "thống nhất khả năng keyframe cho mọi widget" đã bàn: mỗi hiệu ứng mới ở trên phải keyframe được ngay từ đầu.
