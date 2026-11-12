---
doc: ANIMATION-CATALOG.md
doc_title: "Danh mục hiệu ứng chuyển động và đường cong nội suy"
section: "2. Thư viện easing đặt sẵn"
path: "2. Thư viện easing đặt sẵn"
chunk: 2-thu-vien-easing-dat-san.md
source_lines: 38-56
source_sha1: 94903865f6
ids: [AD-13]
---
## 2. Thư viện easing đặt sẵn

| Nhóm | Thành phần | Ưu tiên |
|---|---|---|
| Easy Ease | Ease In, Ease Out, Ease In-Out với **influence** chỉnh được (mặc định khoảng 33%) | v1.0 |
| Đa thức Penner | `Sine`, `Quad`, `Cubic`, `Quart`, `Quint`, `Expo`, `Circ` × In/Out/InOut | v1.0 |
| "Động" Penner | `Back` (lấy đà/vượt quá, chỉnh **overshoot**), `Elastic` (chỉnh **amplitude**, **period**), `Bounce` (chỉnh số lần nảy, độ nảy) | v1.0 |
| Biến thể đảo | Out-In (nhanh–chậm–nhanh) cho mọi nhóm | v1.1 |
| CSS | `ease`, `ease-in`, `ease-out`, `ease-in-out`, `cubic-bezier(x1,y1,x2,y2)` | v1.0 |
| CSS `steps()` | `steps(n, jump-start / jump-end / jump-none / jump-both)` | v1.0 |
| CSS `linear()` | Đường gấp khúc nhiều điểm dừng (xấp xỉ mọi đường cong, kể cả spring) | v1.1 |
| Smoothstep | `smoothstep`, `smootherstep` | v1.0 |
| Spring vật lý | Theo `stiffness`, `damping`, `mass`, `velocity` ban đầu; hoặc kiểu thân thiện **duration + bounce** | v1.0 |
| Inertia / Decay | Giảm dần theo hàm mũ (ném rồi trôi chậm lại) | v1.1 |
| Anticipate | Lùi nhẹ trước khi đi (khác `Back` ở chỗ chỉ lấy đà đầu) | v1.1 |
| Exponential / Logarithmic | Hợp cho tần số, zoom, âm lượng (cảm nhận theo tỉ lệ) | v1.1 |
| Đường cong tự vẽ | Nhiều điểm điều khiển, nội suy monotone | v1.0 |
| Đường cong từ biểu thức | `ease = expr(x)` (AD-13) | v1.1 |
