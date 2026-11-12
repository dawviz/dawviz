---
doc: ANIMATION.md
doc_title: "Hiệu ứng chuyển động và xuất video: so sánh công cụ và quyết định"
section: "2. Các lựa chọn đã xét"
path: "2. Các lựa chọn đã xét"
chunk: 2-cac-lua-chon-da-xet.md
source_lines: 11-20
source_sha1: 60e6f9e591
ids: [D-34]
---
## 2. Các lựa chọn đã xét

| Công cụ | Cách điều khiển chuyển động | Hợp với bài toán xuất video? | Điểm cần cân nhắc với dự án |
|---|---|---|---|
| **Remotion** | Hook `useCurrentFrame()`, `interpolate()`, `spring()`; render qua FFmpeg tích hợp | Rất hợp cho video từ component React | Dựng theo DOM/React, chạy bằng trình duyệt không đầu; dự án đã có đường ống Canvas + WebCodecs trong Worker (Spike 1). **Kiểm tra giấy phép** (không phải giấy phép mã nguồn mở thông thường, có điều kiện cho công ty). |
| **GSAP** | Timeline, `seek(giây)` chính xác | Tốt nếu chụp từng khung bằng trình duyệt không đầu | Mạnh về dàn dựng chuỗi chuyển động trên DOM/SVG; **kiểm tra giấy phép** khi đưa vào repo Apache-2.0. |
| **Motion Canvas** | Generator TypeScript trên Canvas, xuất video sẵn | Rất hợp cho hoạt họa giải thích | Là một khung dựng riêng, khó ghép với Render Core hiện có. |
| **Framer Motion** | Chuyển động thời gian thực cho UI | Kém cho xuất video | Giữ cho **giao diện** (bảng, danh sách, hiện/ẩn), không dùng cho khung hình video (D-34). |
| **CSS/Tailwind** | Transition/animation của trình duyệt | Không dùng để điều khiển chuyển động video | Dùng để dựng layout, màu, chữ của giao diện. |
