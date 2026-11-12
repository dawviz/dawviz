---
doc: ANIMATION.md
doc_title: "Hiệu ứng chuyển động và xuất video: so sánh công cụ và quyết định"
section: "1. Vấn đề cốt lõi"
path: "1. Vấn đề cốt lõi"
chunk: 1-van-de-cot-loi.md
source_lines: 5-10
source_sha1: 60e6f9e591
ids: [AD-01, AD-03, ARC-01]
---
## 1. Vấn đề cốt lõi

CSS transition/animation (kể cả Tailwind) và Framer Motion chạy theo **đồng hồ thời gian thực của trình duyệt**. Khi dựng video từng khung hình (frame-by-frame), cách này dễ giật, lệch nhịp và **không tua tới/lui chính xác** theo từng giây. Nguyên tắc đúng cho xuất video là: **hình ảnh là hàm thuần của thời gian `t`** (hoặc số khung hình `k`), không phụ thuộc đồng hồ.

Dự án đã đi theo nguyên tắc này từ đầu (ARC-01, AD-01, AD-03): Render Core là hàm thuần `layout(t)` + `draw(t)` trên Canvas, nên Preview và Export giống nhau và tua ngẫu nhiên được.
