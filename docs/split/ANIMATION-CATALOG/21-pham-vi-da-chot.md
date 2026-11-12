---
doc: ANIMATION-CATALOG.md
doc_title: "Danh mục hiệu ứng chuyển động và đường cong nội suy"
section: "21. Phạm vi đã chốt"
path: "21. Phạm vi đã chốt"
chunk: 21-pham-vi-da-chot.md
source_lines: 309-313
source_sha1: 94903865f6
ids: []
---
## 21. Phạm vi đã chốt

* **v1.0** khoảng **70 mục** đánh dấu `v1.0` ở trên. Hầu hết là `C2D`, tái sử dụng chung một bộ máy: keyframe + easing (§1–5), transform/reveal (§6–7), hiệu ứng thủ tục (§10), text animator (§13), chuyển cảnh cơ bản (§14), camera 2D (§15) và hiệu ứng âm nhạc (§18).
* **v1.1:** thêm các mục `GL` sau khi Spike WebGL2 (T-27) chốt, cùng TCB, roving keyframe, speed ramp, time remap.
* Mỗi hiệu ứng đặt sẵn là **một preset** (`kind: "effect"`) dựng từ cùng một mô hình (keyframe, modifier, biểu thức). Không viết mã riêng cho từng hiệu ứng khi tránh được. Nhờ vậy cộng đồng tự tạo hiệu ứng mới mà không cần sửa ứng dụng.
