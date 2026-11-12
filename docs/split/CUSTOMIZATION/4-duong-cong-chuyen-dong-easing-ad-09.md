---
doc: CUSTOMIZATION.md
doc_title: "Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng"
section: "4. Đường cong chuyển động (easing) (AD-09)"
path: "4. Đường cong chuyển động (easing) (AD-09)"
chunk: 4-duong-cong-chuyen-dong-easing-ad-09.md
source_lines: 113-128
source_sha1: 7e5b12f60b
ids: [AD-09]
---
## 4. Đường cong chuyển động (easing) (AD-09)

`packages/render-core/src/motion.ts` (T-15, mở rộng ở T-17). Mọi easing là hàm thuần `f: [0,1] → ℝ` với `f(0)=0` và `f(1)=1` (riêng `back`, `elastic` và `spring` được phép vượt quá biên).

| Nhóm | Hàm |
|---|---|
| Cơ bản | `linear`, `step` (`steps(n, start|end)`), `hold` |
| Penner (In / Out / InOut) | `Sine`, `Quad`, `Cubic`, `Quart`, `Quint`, `Expo`, `Circ`, `Back`, `Elastic`, `Bounce` → 30 hàm, cộng `easeOutElasticHalf` và `easeOutElasticQuarter` |
| CSS | `cubicBezier(x1, y1, x2, y2)`: giải `x(s)=t` bằng Newton, dự phòng chia đôi khi không hội tụ, cố định số vòng lặp để kết quả tất định |
| Vật lý | `spring({ stiffness, damping, mass })` dạng **công thức đóng** (dưới tắt, tắt tới hạn, quá tắt), chuẩn hoá để kết thúc ở 1 |
| Tự vẽ | `curve([[x, y], …])`: các điểm điều khiển, nội suy Catmull-Rom đơn điệu theo `x` |

**Giao diện đồ thị:** khung vẽ đường cong có các nút kéo (giống trình soạn cubic-bezier của trình duyệt), một chấm chạy thử, danh sách dựng sẵn và ô nhập số. Đường cong lưu thành preset `kind: "easing"`.

**Test:** biên `f(0)`/`f(1)`, tính đơn điệu khi được cam kết, `cubicBezier(0,0,1,1)` ≡ `linear`, và cùng đầu vào luôn cho cùng giá trị khi chạy nhiều lần.
