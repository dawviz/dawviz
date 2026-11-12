---
doc: ANIMATION.md
doc_title: "Hiệu ứng chuyển động và xuất video: so sánh công cụ và quyết định"
section: "2.1 Điều rút ra"
path: "2.1 Điều rút ra"
chunk: 2-1-dieu-rut-ra.md
source_lines: 21-24
source_sha1: 60e6f9e591
ids: []
---
## 2.1 Điều rút ra

Lời khuyên "dùng Tailwind để dựng hình, không dùng CSS transition để điều khiển chuyển động khi xuất video" **đã đúng với kiến trúc hiện tại**: khung hình video vẽ bằng Canvas qua Render Core, Tailwind chỉ dùng cho giao diện ứng dụng. Điều dự án còn thiếu không phải một thư viện mới mà là **bộ hàm chuyển động tất định** nằm trong Render Core.
