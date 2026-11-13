---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-WIDGET-02: Track Info"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.4. Đặc tả 8 widget HUD (BR-02, BR-03, BR-04) > REQ-WIDGET-02: Track Info"
chunk: req-widget-02-track-info.md
source_lines: 539-543
source_sha1: 0b10d2a1a5
ids: [NFR-SEC-03, REQ-WIDGET-02, REQ-WIDGET-03]
---
#### REQ-WIDGET-02: Track Info
* Hiển thị `title`, `artist` từ `AST.meta`; người dùng sửa nội dung trong Inspector mà không đổi file gốc (giá trị sửa lưu trong Document).
* Tùy biến: font (có sẵn hoặc người dùng nạp), cỡ chữ, màu, độ đậm, căn lề trái/giữa/phải, **hai dòng riêng** (tiêu đề và nghệ sĩ, mỗi dòng có cỡ/độ đậm/màu riêng; dòng rỗng thì không vẽ).
* **Phông và nguồn chữ của video (bổ sung T-69):** phông mặc định của preset là **Space Grotesk** (giấy phép OFL), **tự host** cùng ứng dụng (CSP chỉ cho `font-src 'self'`, NFR-SEC-03); không dùng CDN. Phông phải được nạp xong bằng `FontFace.load()` **trước khung đầu tiên**, ở Preview lẫn Export Worker; chưa nạp xong thì **không vẽ khung có chữ** (khung hiển thị trạng thái chờ chứ không vẽ bằng phông dự phòng). Chữ trong video lấy từ **mẫu chữ trong preset** (REQ-WIDGET-03…06) và dữ liệu dự án, **không** lấy từ từ điển giao diện `locales/` của ứng dụng (khung video là sản phẩm xuất, không thuộc theme/ngôn ngữ ứng dụng; xem REQ-I18N-07 cho chữ viết ngoài Latin).
