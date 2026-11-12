---
doc: PUBLISHING.md
doc_title: "Xuất bản lần đầu lên GitHub"
section: "1. Giấy phép đã chọn và lý do"
path: "1. Giấy phép đã chọn và lý do"
chunk: 1-giay-phep-da-chon-va-ly-do.md
source_lines: 5-22
source_sha1: 02fa1bd49a
ids: [OI-07]
---
## 1. Giấy phép đã chọn và lý do

Repo dùng **Apache License 2.0** cho mã, tài liệu và bản dịch (tệp `LICENSE` ở gốc). Đây là khuyến nghị kỹ thuật, không phải tư vấn pháp lý.

| Lý do chọn Apache-2.0 | Ghi chú |
|---|---|
| Cho phép dùng, sửa, nhúng vào sản phẩm thương mại; hợp với thư viện parser muốn được dùng rộng | Khác với GPL/AGPL buộc mã dẫn xuất phải mở |
| Có **điều khoản cấp quyền sáng chế** (và chấm dứt quyền nếu kiện về sáng chế) | Hợp với lĩnh vực định dạng tệp và codec video, nơi có rủi ro sáng chế; MIT không có điều này |
| **Điều 5**: đóng góp được hiểu là cấp phép theo cùng giấy phép, không cần ký CLA | Dễ cho cộng đồng dịch và đóng góp |
| Một giấy phép duy nhất cho cả mã, tài liệu, bản dịch | Tránh trộn nhiều giấy phép (ví dụ thêm CC BY cho tài liệu) |

Phương án khác: **MIT** (ngắn hơn, không có điều khoản sáng chế); **AGPL-3.0** nếu bạn muốn ngăn người khác lấy mã làm dịch vụ web đóng nguồn (đổi lại ít doanh nghiệp dám dùng thư viện parser); **MPL-2.0** là mức giữa (chỉ tệp sửa đổi phải mở). Khi đã có người đóng góp thì rất khó đổi giấy phép, nên chọn trước khi công khai.

Cần làm thêm:
- **Thư viện bên thứ ba:** kiểm tra giấy phép từng thư viện sẽ dùng (React, Framer Motion, Dexie, fflate, Mediabunny, @tonaljs/chord-detect, font đóng gói) tương thích với Apache-2.0 (OI-07). Phần lớn là MIT/Apache; riêng thư viện có giấy phép copyleft yếu (như MPL-2.0) vẫn dùng được nhưng cần giữ nguyên thông báo của họ.
- **Tệp mẫu `test/fixtures`:** chỉ `BigProject*.rpp` (do chủ repo tự tạo) được commit; tệp bên thứ ba nằm ở `test/fixtures/third-party/` (gitignore, test tự bỏ qua khi thiếu). Xem `test/fixtures/README.md` trước khi thêm tệp mẫu.
- Tên chủ sở hữu bản quyền: README ghi "DAW Visualizer contributors"; có thể thay bằng tên bạn/tổ chức.
