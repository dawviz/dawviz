---
doc: WIDGET-REVAMP.md
doc_title: "Tu sửa widget và mở rộng sáng tạo (đợt 2026-11-26)"
section: "3. Kiểu chữ dùng chung (D-73, T-126)"
path: "3. Kiểu chữ dùng chung (D-73, T-126)"
chunk: 3-kieu-chu-dung-chung-d-73-t-126.md
source_lines: 77-91
source_sha1: 5eb561ef37
ids: [D-73, REQ-GRAPHICS-18]
---
## 3. Kiểu chữ dùng chung (D-73, T-126)

### 3.1 Hiện trạng

Kiểu chữ đã là của dự án (`scene.textStyles`, REQ-GRAPHICS-18) và mọi widget chữ trong dự án đều chọn được. Cái khó là giao diện: nút **Lưu thành kiểu mới / Cập nhật kiểu / Bỏ thay đổi** nằm cuối mục Chữ và chỉ hiện ở Nâng cao; hai nút sau bị mờ mà không nói vì sao; **Cập nhật kiểu** đổi mọi chỗ dùng kiểu đó mà không cho biết là bao nhiêu chỗ; không đổi tên, không xoá được; không mang kiểu sang dự án khác.

### 3.2 Thiết kế

- **Thanh Kiểu chữ ở đầu mục Chữ, cả Cơ bản và Nâng cao:** `[Kiểu: Tiêu đề ▾] [•] [⋯]`. Chấm • hiện khi chỗ chữ đang có thay đổi so với kiểu (giống "Paragraph style +" của InDesign/Photoshop); rê chuột: "Đã sửa N thuộc tính so với kiểu".
- **Menu ⋯:** Lưu thành kiểu mới…; Cập nhật kiểu "Tiêu đề" (đổi N chỗ dùng); Bỏ thay đổi; Đổi tên…; Xoá kiểu (chỗ đang dùng chuyển về kiểu gốc của chỗ đó, có hoàn tác); Lưu vào thư viện của tôi.
- **Thư viện của tôi** (giữa các dự án): lưu `localStorage` (tối đa 64 kiểu), hiện thành một nhóm riêng trong danh sách Kiểu. Chọn một kiểu từ thư viện thì **sao chép** nó vào `scene.textStyles`, nên preset vẫn tự đủ (gửi preset cho người khác không phụ thuộc máy mình). Phông người dùng nạp: kiểu nhớ tên họ phông; máy khác thiếu phông thì báo như hiện nay ("thiếu phông").
- Mọi thao tác là lệnh có hoàn tác (`commands.ts`).

Trả lời câu hỏi của chủ dự án: kiểu chữ dùng được **trong cùng dự án** (đã có, làm dễ thấy hơn) **và giữa các dự án** (thư viện của tôi).
