---
doc: CUSTOMIZATION.md
doc_title: "Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng"
section: "8. Quyết định đề xuất"
path: "8. Quyết định đề xuất"
chunk: 8-quyet-dinh-de-xuat.md
source_lines: 192-203
source_sha1: 7e5b12f60b
ids: [AD-08, AD-09, AD-10, AD-11, AD-12, D-06, D-38, OI-16]
---
## 8. Quyết định đề xuất

| ID | Quyết định | Lý do |
|---|---|---|
| **AD-08** | Storyboard, template và preset là **dữ liệu JSON có schema**; v1 không chạy script của người dùng. | An toàn khi chia sẻ; kiểm được bằng CI; tất định |
| **AD-09** | Bộ easing gồm Penner (30), `cubicBezier`, `steps`, `spring` dạng công thức đóng và đường cong tự vẽ, đặt trong `motion.ts` của Render Core. | Phủ mọi đường cong thông dụng (kể cả của CSS); Preview và Export dùng chung |
| **AD-10** | Hạt **không trạng thái**: tính theo tuổi bằng PRNG có seed và chuyển động dạng đóng; không mô phỏng từng bước, không va chạm. | Giữ tua ngẫu nhiên và WYSIWYG (D-06) |
| **AD-11** | Morph chỉ giữa các hình cùng họ (chữ nhật bo góc ↔ tròn, đa giác cùng số đỉnh sau khi lấy mẫu lại). | Rẻ, tất định; morph SVG tự do để sau (OI-16) |
| **AD-12** | Tài nguyên định danh bằng SHA-256 nội dung, lưu IndexedDB, đóng gói vào Project Pack; SVG chỉ vẽ dạng ảnh. | Không trùng, xác minh được, chặn script trong SVG |

Ở cấp sản phẩm, những quyết định này được tóm thành **D-38** trong BRD.
