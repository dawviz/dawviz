---
doc: EXPRESSIONS.md
doc_title: "Biểu thức người dùng, mô hình bảo mật và kiểm duyệt cộng đồng"
section: "5. Phòng thủ nhiều lớp cho ứng dụng (AD-14)"
path: "5. Phòng thủ nhiều lớp cho ứng dụng (AD-14)"
chunk: 5-phong-thu-nhieu-lop-cho-ung-dung-ad-14.md
source_lines: 122-134
source_sha1: 19ec9a9aa3
ids: [AD-14, D-41, NFR-SEC-01, NFR-SEC-03]
---
## 5. Phòng thủ nhiều lớp cho ứng dụng (AD-14)

| Lớp | Việc làm | Chặn |
|---|---|---|
| CSP | Thêm thẻ `<meta http-equiv="Content-Security-Policy">` theo NFR-SEC-03 vào `apps/web/index.html` (hiện **chưa có**). Giữ `connect-src 'self'`, không `unsafe-eval`, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`. GitHub Pages không đặt được header nên dùng thẻ `meta` | M1, M2, M5, M6 |
| Trusted Types | `require-trusted-types-for 'script'` trong CSP: trình duyệt Chromium từ chối mọi gán `innerHTML` chưa qua chính sách | M6 |
| Origin riêng | **Đã chốt (D-41):** host ở tổ chức GitHub riêng cho dự án (`<tổ-chức>.github.io`); có thể trỏ tên miền riêng sau. Không host ở `tên-cá-nhân.github.io/dawviz` | M10 |
| Thư viện cộng đồng cùng origin | CI dựng site sẽ kéo bản đã duyệt của repo `dawviz-community` (theo tag) vào chính site, nên ứng dụng chỉ tải `index.json` từ `'self'`. Không cần mở `connect-src` ra ngoài, giữ NFR-SEC-01 | M1, M2 |
| Worker và watchdog | Đánh giá biểu thức và vẽ trong Worker. Nếu một khung quá 2 giây, luồng chính huỷ Worker, tắt biểu thức của phần tử gây lỗi và báo người dùng | M3, M4 |
| Kiểm khi nạp | Preset qua JSON Schema, bỏ khoá cấm, giới hạn kích thước; gói `.zip` qua giới hạn giải nén của parser-core; ảnh kiểm kích thước trước khi giải mã; SVG chỉ vẽ dạng ảnh | M6, M7, M8, M9 |
| Không URL ngoài | Lược đồ preset không có trường URL; tài nguyên tham chiếu bằng `asset:sha256-…` | M2 |
| Chuỗi cung ứng | `npm ci`; Dependabot; ghim Actions theo SHA; `permissions:` tối thiểu; không dùng `pull_request_target` cho PR từ fork; CODEOWNERS cho `.github/`, `scripts/`, `packages/expr/` | M11 |
