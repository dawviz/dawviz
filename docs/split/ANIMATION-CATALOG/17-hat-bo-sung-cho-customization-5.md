---
doc: ANIMATION-CATALOG.md
doc_title: "Danh mục hiệu ứng chuyển động và đường cong nội suy"
section: "17. Hạt (bổ sung cho CUSTOMIZATION §5)"
path: "17. Hạt (bổ sung cho CUSTOMIZATION §5)"
chunk: 17-hat-bo-sung-cho-customization-5.md
source_lines: 259-284
source_sha1: a8563147e6
ids: [REQ-STORAGE-05]
---
## 17. Hạt (bổ sung cho CUSTOMIZATION §5)

| Tính năng | Ưu tiên | Kỹ thuật |
|---|---|---|
| Hình nguồn phát: điểm, đường, vòng, hình chữ nhật, theo nốt, theo chữ | v1.0 | C2D |
| Lực: trọng lực, cản, gió, nhiễu | v1.0 | C2D |
| Hút/đẩy về điểm (attractor/repeller) dạng đóng | v1.1 | C2D |
| Sub-emitter (hạt chết sinh hạt mới, ví dụ pháo hoa) | v1.1 | C2D $ |
| Vệt cho hạt | v1.1 | C2D $ |
| Hạt là ảnh hoặc sprite sheet | v1.0 | C2D |
| Hoà trộn cộng sáng | v1.0 | C2D |

### 17.1 Hạt kiểu Ember (tham chiếu LyricWulf, **đề xuất cho bản sau**, chưa làm)

Tham chiếu: Ember (Piano Visualizer của LyricWulf) cho chọn nhiều loại hạt ngoài lửa và nạp ảnh riêng làm hạt. Phần đã có ở T-89: nguồn phát **tại nốt chạm vạch phát** (`originX: NOTE`). **Ghi chú 2026-11-20:** hệ hạt hiện tại đã đủ sâu để chỉnh tay ra tia lửa/tàn lửa (công thức trong hướng dẫn `03-chinh-sua`, mục Hạt), nhưng người dùng chưa biết chỉnh thông số nào cho ra từng kiểu, nên **bộ preset dựng sẵn vẫn cần cho bản sau**. Phần dưới là đề xuất, gom theo độ khó:

| Đề xuất | Ghi chú kỹ thuật (giữ tính tất định) | Phụ thuộc |
|---|---|---|
| Bộ preset hạt dựng sẵn: Lửa/tàn lửa/tia lửa, Khói/sương, Tuyết/mưa/bong bóng, Bụi/bokeh/đốm sáng | chỉ là bộ giá trị `ParticleProps` (+ vài trường mới), áp bằng một cú bấm rồi vẫn chỉnh tay được; khói/sương/tuyết cần thêm hình hạt/ảnh mềm (các dòng dưới) mới đẹp, hạt tròn thuần chỉ gần đúng; công thức tia lửa trong hướng dẫn là điểm xuất phát | preset `particle` riêng (T-20) |
| Hình hạt: sao, tim, nốt nhạc, tam giác (ngoài tròn/vuông) | thêm giá trị `shape`; vẽ bằng path cố định, không ảnh | RectPrim → thêm loại primitive path |
| Hoà trộn cộng sáng (additive) | `globalCompositeOperation: 'lighter'` theo widget; xuất video cùng cách | primitive có `blend` |
| Lực cản, nhiễu tất định, xoay (spin) của hạt | cản: dạng đóng `v·e^(−k·age)`; nhiễu: băm theo (seed, nốt, k, ô thời gian) | — |
| Cỡ/độ đục theo đường cong thay vì tuyến tính | dùng bộ easing sẵn có (CUSTOMIZATION §3) | easing (T-17) |
| **Ảnh người dùng làm hạt** (PNG nền trong suốt; JPG với "đen = trong suốt") | nạp như tài nguyên phiên (REQ-STORAGE-05), tối đa cỡ ảnh, vẽ qua `drawImage` nên cần primitive ảnh; ảnh nằm trong Project Pack, không nằm trong preset | T-21 (SVG/sprite sheet), `ImageBitmap` sang Worker xuất |
| Nguồn phát khác: vạch phát liên tục theo nhịp, theo nốt đang giữ (`sustain`), khi nốt kết thúc (`exit`) | chọn `emitter` theo loại; nguồn "vạch phát" không cần nốt | — |
