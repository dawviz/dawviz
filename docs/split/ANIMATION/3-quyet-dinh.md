---
doc: ANIMATION.md
doc_title: "Hiệu ứng chuyển động và xuất video: so sánh công cụ và quyết định"
section: "3. Quyết định"
path: "3. Quyết định"
chunk: 3-quyet-dinh.md
source_lines: 25-31
source_sha1: 60e6f9e591
ids: [AD-07, D-06, D-37]
---
## 3. Quyết định

* **AD-07 / D-37:** Hiệu ứng của đối tượng trong khung hình video (xuất hiện, phát sáng khi nốt bắt đầu, tắt dần, chuyển cảnh giữa widget) được tính trong **Render Core** bằng hàm thuần của `t`: `interpolate(t, [t0, t1], [a, b], easing)`, các hàm easing, và `spring` dạng công thức đóng (không mô phỏng theo từng bước, nên cùng `t` luôn cho cùng giá trị và tua ngẫu nhiên được). Không đọc đồng hồ hệ thống, `Date`, `Math.random`, `requestAnimationFrame`.
* Framer Motion và CSS chỉ dùng cho **giao diện ứng dụng**, không nằm trong khung hình xuất.
* **Không** đưa Remotion, GSAP hay Motion Canvas vào lõi vào lúc này. Lý do: đã có đường ống Canvas/Worker/WebCodecs tất định; thêm khung dựng thứ hai làm hai nơi vẽ khác nhau (phá WYSIWYG, D-06); và giấy phép của một số thư viện cần xem trước.
* Nếu sau này cần chuyển cảnh phức tạp hoặc dàn dựng nhiều lớp, đánh giá lại bằng một Spike riêng, đo: độ khớp Preview↔Export, thời gian xuất, kích thước gói, giấy phép.
