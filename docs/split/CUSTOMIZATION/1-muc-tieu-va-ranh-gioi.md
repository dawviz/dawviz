---
doc: CUSTOMIZATION.md
doc_title: "Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng"
section: "1. Mục tiêu và ranh giới"
path: "1. Mục tiêu và ranh giới"
chunk: 1-muc-tieu-va-ranh-gioi.md
source_lines: 5-14
source_sha1: e3b1cd1a13
ids: [AD-07, AD-08, ARC-01, D-06]
---
## 1. Mục tiêu và ranh giới

**Mục tiêu.** Mọi thứ nhìn thấy trong khung hình đều chỉnh được: hình dạng và kiểu nốt, cách nốt xuất hiện, chạm vạch phát và biến mất, đường cong chuyển động, hạt, ảnh, chữ, lớp phủ, và dàn dựng theo thời gian bài nhạc. Người dùng lưu thành preset, chia sẻ và đóng góp cho cộng đồng mà không cần sửa mã.

**Ranh giới cố định (không đổi vì tùy biến):**

1. **Tất định** (ARC-01, D-06, AD-07): khung hình là hàm thuần của `(scene, ast, assets, t)`. Không có trạng thái tích luỹ giữa các khung, nên tua tới/lui và xuất video luôn khớp Preview.
2. **Chỉ dữ liệu, không mã** (AD-08): storyboard, preset và template là JSON được kiểm bằng schema. Không chạy script của người dùng trong v1. Chia sẻ preset vì vậy an toàn.
3. **Ngân sách hiệu năng có giới hạn cứng** (mục 7): ví dụ số hạt tối đa, kích thước ảnh. Vượt giới hạn thì kẹp lại và báo cảnh báo, không làm treo trình duyệt.
