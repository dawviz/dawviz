---
doc: CUSTOMIZATION.md
doc_title: "Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng"
section: "10. Khả thi"
path: "10. Khả thi"
chunk: 10-kha-thi.md
source_lines: 214-232
source_sha1: 252b907188
ids: [D-40]
---
## 10. Khả thi

**Khả thi.** Kiến trúc hiện tại (khung hình là hàm thuần của `t`, Render Core tách khỏi giao diện, preset là JSON có schema) là nền đúng cho toàn bộ hướng này. Không cần đổi kiến trúc, chỉ mở rộng Render Core và thêm giao diện soạn.

| Phần | Độ khó | Ước lượng (ngày làm việc, agent và người phản hồi nhanh) | Rủi ro chính |
|---|---|---|---|
| Easing và trình soạn đồ thị (T-17) | Thấp | 2–3 | Không đáng kể |
| Template chuyển cảnh nốt và hướng cuộn (T-18) | Trung bình | 4–6 | Cần mắt người duyệt hình |
| Morph cùng họ hình (T-19) | Trung bình | 2–3 | Đa giác lấy mẫu lại |
| Hạt không trạng thái (T-20) | Trung bình | 4–6 | Hiệu năng `shadowBlur` và số hạt |
| Tài nguyên của phiên (T-21) | Trung bình | 3–5 | Phông trong Worker xuất; hạn mức IndexedDB |
| Storyboard: timeline, keyframe, bindings (T-22, T-23) | **Cao** | 10–15 | Trải nghiệm soạn thảo, undo/redo, hiệu năng timeline |
| Preset mới và chia sẻ (T-24) | Thấp–Trung bình | 3–4 | Di trú lược đồ |
| Thư viện cộng đồng (T-16, T-25) | Trung bình | 4–6 | Quy trình duyệt và giấy phép (con người, không phải mã) |
| Đo hiệu năng và quyết định WebGL (T-27) | Trung bình | 2–4 | Phụ thuộc phần cứng |
| **Tổng** | | **khoảng 34–52 ngày ≈ 7–10 tuần**, cộng thêm vào lịch v1.0 (khoảng 7 tuần) | |

**Đã chốt (D-40, BRD §4.4):** bản 1.0 gồm easing, template nốt, morph cùng họ, hạt, tài nguyên phiên, mô hình storyboard và preset mới; bản 1.1 gồm trình soạn storyboard đầy đủ và thư viện cộng đồng; morph SVG tự do ở 1.2. Ước lượng ở bảng trên đã được gộp vào lịch tổng ở PROGRESS §5. Mô hình dữ liệu ở mục 3 được thiết kế ngay từ T-05 để không phải đổi lược đồ về sau.
