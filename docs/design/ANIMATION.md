# Hiệu ứng chuyển động và xuất video: so sánh công cụ và quyết định

> Ghi lại phần tìm hiểu về cách làm hiệu ứng chuyển động cho đối tượng trên giao diện web rồi **xuất thành MP4/WebM**, đối chiếu với kiến trúc của DAW Visualizer và chốt hướng đi (AD-07, D-37). Nguồn của phần so sánh là bản tổng hợp do chủ dự án cung cấp ngày 2026-11-12; các nhận định về giấy phép và tính năng của từng thư viện **chưa được kiểm chứng độc lập** và phải xem lại trước khi dùng (mục 5).

## 1. Vấn đề cốt lõi

CSS transition/animation (kể cả Tailwind) và Framer Motion chạy theo **đồng hồ thời gian thực của trình duyệt**. Khi dựng video từng khung hình (frame-by-frame), cách này dễ giật, lệch nhịp và **không tua tới/lui chính xác** theo từng giây. Nguyên tắc đúng cho xuất video là: **hình ảnh là hàm thuần của thời gian `t`** (hoặc số khung hình `k`), không phụ thuộc đồng hồ.

Dự án đã đi theo nguyên tắc này từ đầu (ARC-01, AD-01, AD-03): Render Core là hàm thuần `layout(t)` + `draw(t)` trên Canvas, nên Preview và Export giống nhau và tua ngẫu nhiên được.

## 2. Các lựa chọn đã xét

| Công cụ | Cách điều khiển chuyển động | Hợp với bài toán xuất video? | Điểm cần cân nhắc với dự án |
|---|---|---|---|
| **Remotion** | Hook `useCurrentFrame()`, `interpolate()`, `spring()`; render qua FFmpeg tích hợp | Rất hợp cho video từ component React | Dựng theo DOM/React, chạy bằng trình duyệt không đầu; dự án đã có đường ống Canvas + WebCodecs trong Worker (Spike 1). **Kiểm tra giấy phép** (không phải giấy phép mã nguồn mở thông thường, có điều kiện cho công ty). |
| **GSAP** | Timeline, `seek(giây)` chính xác | Tốt nếu chụp từng khung bằng trình duyệt không đầu | Mạnh về dàn dựng chuỗi chuyển động trên DOM/SVG; **kiểm tra giấy phép** khi đưa vào repo Apache-2.0. |
| **Motion Canvas** | Generator TypeScript trên Canvas, xuất video sẵn | Rất hợp cho hoạt họa giải thích | Là một khung dựng riêng, khó ghép với Render Core hiện có. |
| **Framer Motion** | Chuyển động thời gian thực cho UI | Kém cho xuất video | Giữ cho **giao diện** (bảng, danh sách, hiện/ẩn), không dùng cho khung hình video (D-34). |
| **CSS/Tailwind** | Transition/animation của trình duyệt | Không dùng để điều khiển chuyển động video | Dùng để dựng layout, màu, chữ của giao diện. |

## 2.1 Điều rút ra

Lời khuyên "dùng Tailwind để dựng hình, không dùng CSS transition để điều khiển chuyển động khi xuất video" **đã đúng với kiến trúc hiện tại**: khung hình video vẽ bằng Canvas qua Render Core, Tailwind chỉ dùng cho giao diện ứng dụng. Điều dự án còn thiếu không phải một thư viện mới mà là **bộ hàm chuyển động tất định** nằm trong Render Core.

## 3. Quyết định

* **AD-07 / D-37:** Hiệu ứng của đối tượng trong khung hình video (xuất hiện, phát sáng khi nốt bắt đầu, tắt dần, chuyển cảnh giữa widget) được tính trong **Render Core** bằng hàm thuần của `t`: `interpolate(t, [t0, t1], [a, b], easing)`, các hàm easing, và `spring` dạng công thức đóng (không mô phỏng theo từng bước, nên cùng `t` luôn cho cùng giá trị và tua ngẫu nhiên được). Không đọc đồng hồ hệ thống, `Date`, `Math.random`, `requestAnimationFrame`.
* Framer Motion và CSS chỉ dùng cho **giao diện ứng dụng**, không nằm trong khung hình xuất.
* **Không** đưa Remotion, GSAP hay Motion Canvas vào lõi vào lúc này. Lý do: đã có đường ống Canvas/Worker/WebCodecs tất định; thêm khung dựng thứ hai làm hai nơi vẽ khác nhau (phá WYSIWYG, D-06); và giấy phép của một số thư viện cần xem trước.
* Nếu sau này cần chuyển cảnh phức tạp hoặc dàn dựng nhiều lớp, đánh giá lại bằng một Spike riêng, đo: độ khớp Preview↔Export, thời gian xuất, kích thước gói, giấy phép.

## 4. Việc cần làm (T-15)

1. `packages/render-core/src/motion.ts`: `clamp01`, `interpolate`, các easing (`linear`, `easeInOut`, `easeOutBack`, …), `spring` công thức đóng; test tất định (cùng `t` cùng kết quả, tua tới/lui bằng nhau).
2. Dùng thử ở nốt: hiệu ứng **xuất hiện** (phóng/làm mờ khi vào cửa sổ) và **bật sáng khi nốt bắt đầu** với thời gian tắt dần chỉnh được, đưa vào `NoteStyle`.
3. Test tĩnh quét mã nguồn Render Core tìm `Date`, `performance`, `Math.random`, `requestAnimationFrame` (đã nêu ở TECHNICAL-DESIGN mục 5.1, chưa làm).
4. Spike so sánh (tuỳ chọn) khi cần chuyển cảnh nâng cao.

Phần mở rộng (bộ easing đầy đủ, template chuyển cảnh nốt, hạt, storyboard) nằm ở [CUSTOMIZATION.md](CUSTOMIZATION.md) (AD-08…AD-12).

## 5. Việc cần xác minh trước khi dùng thư viện ngoài

* Giấy phép hiện hành của Remotion và GSAP, và việc phân phối kèm repo Apache-2.0 (không sao chép mã của họ vào repo; chỉ phụ thuộc qua npm nếu được phép).
* Hiệu năng và độ ổn định khi chụp từng khung trên trình duyệt không đầu so với đường ống Canvas/WebCodecs hiện có.
* Các tuyên bố trong bảng ở mục 2 về tính năng (ví dụ "không bao giờ rớt khung") là của nguồn tổng hợp, chưa đo trong dự án này.
