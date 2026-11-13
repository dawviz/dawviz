---
doc: UI-DIRECTION.md
doc_title: "Định hướng hình ảnh: khung preview và giao diện web"
section: "Định hướng hình ảnh: khung preview và giao diện web (mở đầu)"
path: "Định hướng hình ảnh: khung preview và giao diện web (mở đầu)"
chunk: dinh-huong-hinh-anh-khung-preview-va-giao-dien-w.md
source_lines: 1-20
source_sha1: a66e3a3c8c
ids: [D-51, D-52, D-53, D-54, D-55, REQ-GRAPHICS-02, REQ-UI-10, REQ-UI-13]
---
# Định hướng hình ảnh: khung preview và giao diện web

| Phiên bản | Ngày | Nội dung |
| :--- | :--- | :--- |
| v0.1 | 2026-11-13 | Chốt hướng khung preview theo ảnh tham chiếu "usagin" (D-51). Chẩn đoán vì sao giao diện web hiện trông "AI slop". Bộ prompt sinh ảnh để thử các hướng giao diện web; **chưa chọn hướng web**. |
| v0.2 | 2026-11-13 | Ghi kết quả vòng 1 (ChatGPT 4 khung, Gemini Swiss sáng). Chốt khung bố cục: ba thẻ Preview / Editor / Settings, cách sắp Cơ bản/Nâng cao theo REQ-UI-13 (mục 3.7). Bộ prompt vòng 2 cho 6 phong cách, dùng kèm tệp đính kèm, mỗi phong cách có cả theme sáng và tối (mục 3.8). |
| v0.3 | 2026-11-13 | Ghi kết quả vòng 2 (6 phong cách × 4 khung, Gemini; bảng preset của ChatGPT). Chốt: theme giao diện **chỉ đổi màu** qua bộ token cố định (D-52, mục 5). Hệ quả: 6 phong cách gộp thành **một cấu trúc + nhiều bảng màu**; đề xuất cấu trúc và vòng 3 (mục 5.3, 6). |
| v0.6 | 2026-11-13 | Chốt giá trị nhóm trạng thái khi làm T-48 (`danger`, `warning`, `success`, `selection`) và các token dẫn xuất (`focus`, `scrub-played`, `scrub-rest`, `waveform`), mục 5.4. Giá trị nằm trong `apps/web/src/index.css`; test đọc tệp đó và kiểm AA cho 4 bảng màu × sáng/tối. |
| v0.5 | 2026-11-13 | Kiểm tương phản AA bảng 5.4 và chỉnh chỗ trượt: `text-faint` đạt 4,5:1, thêm token `line-control` (viền điều khiển, 3:1), làm đậm `accent` sáng của Studio cam, Đồng, Riso hồng để đặt được trên `bg`. Ba quy tắc AA (mục 5.4). `guide` đổi sang xanh mòng két `#008C9E`, khác tông mọi màu nhấn (sửa SRS REQ-GRAPHICS-02). Quyết định: BRD D-55. |
| v0.4 | 2026-11-13 | **Chốt cấu trúc giao diện web D + A + E** (D-53, mục 5.3) và bảng màu dựng sẵn (mục 5.4). Ghi nguyên tắc sản phẩm "sức mạnh của trình dựng thật, mặc định đơn giản" (D-54, mục 7): xoay tự do mọi widget từ 1.0, spectrum đổi hướng cột. |

Tài liệu này có hai phần tách bạch:

- **Khung preview** (video người dùng xuất ra, vẽ bằng Render Core): **đã chốt hướng** ở mục 1.
- **Giao diện web** (thanh trên, bảng chỉnh, danh sách track bao quanh preview): **đang thử**. Mục 3 là bộ prompt; mục 4 là nhật ký thử và chỗ ghi hướng được chọn.

Hai phần không được lẫn vào nhau: theme web (REQ-UI-10) không đổi khung video, và preset khung video không đổi theme web.

---
