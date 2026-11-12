---
doc: SDD.md
doc_title: "TÀI LIỆU THIẾT KẾ PHẦN MỀM (SDD) — ỨNG DỤNG DAW VISUALIZER"
section: "5. Quyết định thiết kế của ứng dụng"
path: "5. Quyết định thiết kế của ứng dụng"
chunk: 5-quyet-dinh-thiet-ke-cua-ung-dung.md
source_lines: 55-66
source_sha1: b1d59a382a
ids: [AD-01, AD-02, AD-03, AD-04, AD-05, AD-06, AD-07, SOI-19]
---
## 5. Quyết định thiết kế của ứng dụng

| Mã | Quyết định | Lý do |
|---|---|---|
| **AD-01** | Render Core là hàm thuần, ngoài React | Dùng chung Preview/Export, test bằng Node, chạy trong Worker |
| **AD-02** | Trạng thái toàn cục nhỏ dùng `useState`/`useReducer`; chưa thêm thư viện state | Mới có ít trạng thái; thêm khi M2 (widget, preset) cần |
| **AD-03** | `t` là số duy nhất điều khiển hình ảnh; `rate`, loop chỉ ảnh hưởng cách `t` tiến | Tất định, dễ test, dễ xuất video theo khung |
| **AD-04** | Danh mục ngôn ngữ import tĩnh trong M1 | Ít ngôn ngữ; chuyển `import.meta.glob` khi cộng đồng thêm bản dịch |
| **AD-05** | Pan/mute là nguồn độ sáng "thử nghiệm", gắn nhãn trong giao diện | Chiều pan và nghĩa giá trị mute chưa kiểm (SOI-19) |
| **AD-06** | Tailwind v3 (cấu hình PostCSS) | Ổn định, tài liệu nhiều; xem lại khi chuyển Tailwind v4 |
| **AD-07** | Hiệu ứng chuyển động trong khung hình xuất là hàm thuần của `t` nằm trong Render Core (`interpolate`, easing, `spring` công thức đóng); Framer Motion/CSS chỉ cho giao diện; chưa đưa Remotion/GSAP/Motion Canvas vào lõi | Tua ngẫu nhiên và Preview=Export; không thêm khung dựng thứ hai; xem [ANIMATION.md](../../design/ANIMATION.md) |
