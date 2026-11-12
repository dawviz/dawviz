---
doc: EXPRESSIONS.md
doc_title: "Biểu thức người dùng, mô hình bảo mật và kiểm duyệt cộng đồng"
section: "6. Kiểm duyệt template và preset qua cộng đồng (AD-15)"
path: "6. Kiểm duyệt template và preset qua cộng đồng (AD-15)"
chunk: 6-kiem-duyet-template-va-preset-qua-cong-dong-ad.md
source_lines: 135-186
source_sha1: 19ec9a9aa3
ids: [AD-15, D-42, D-43, NFR-SEC-01]
---
## 6. Kiểm duyệt template và preset qua cộng đồng (AD-15)

### 6.1 Ba mức tin cậy hiển thị trong ứng dụng

| Mức | Nguồn | Hiển thị |
|---|---|---|
| **Dựng sẵn** | Đi kèm ứng dụng | Không nhãn |
| **Cộng đồng đã duyệt** | Từ `index.json` của repo cộng đồng, đúng băm | Nhãn "Đã duyệt" + tác giả + giấy phép + người duyệt |
| **Tự nạp** | Người dùng kéo tệp vào | Nhãn "Chưa kiểm duyệt" và ghi rõ nguồn. Vẫn an toàn nhờ §3–§5; nhãn chỉ báo chất lượng và giấy phép chưa được kiểm |

### 6.2 Luồng đóng góp

```text
Người dùng: "Chia sẻ thành preset" → gói .dawviz-preset.zip
   ↓ pull request (hoặc issue theo mẫu, người duy trì chuyển thành PR)
CI tự động (không có secret, quyền chỉ đọc):
   • JSON Schema, kích thước, tên tệp, giấy phép SPDX trong danh sách cho phép
   • Phân tích MỌI biểu thức bằng @dawviz/expr: hợp lệ, trong giới hạn §3.4
   • Đo ngân sách: dựng N khung bằng Render Core trong Node, phải dưới ngưỡng thời gian và bước tính
   • Tài nguyên: kiểm magic bytes, kích thước ảnh, SVG không có <script>, on*=, <foreignObject>, href ngoài
   • Không trùng băm với tài nguyên có sẵn; không có URL ngoài
   • Sinh ảnh/GIF xem trước gắn vào PR để người duyệt nhìn thấy kết quả thật
   ↓
Duyệt bởi kiểm duyệt viên cộng đồng (D-43): 2 phê duyệt từ đội reviewers (đội dưới 3 người: 1 reviewer + 1 maintainer); không tự duyệt
   • chất lượng, hoạt động đúng như mô tả, không phản cảm
   • giấy phép và nguồn tài nguyên hợp lệ
   • với người đóng góp lần đầu: GitHub yêu cầu người duy trì bấm cho chạy Actions
   ↓ merge vào main
CI phát hành: sinh index.json (băm SHA-256 từng tệp), gắn tag phiên bản
   ↓
CI của ứng dụng kéo tag đã duyệt vào site (cùng origin), ứng dụng kiểm băm khi cài
```

### 6.3 Sau khi phát hành

* **Bất biến:** mỗi phiên bản preset cố định theo băm. Sửa preset là tạo phiên bản mới và phải qua duyệt lại.
* **Báo cáo:** nút "Báo cáo preset" trong ứng dụng mở issue theo mẫu (không gửi dữ liệu tự động, giữ NFR-SEC-01).
* **Thu hồi:** `index.json` có danh sách `revoked` (băm và lý do). Ứng dụng ẩn preset bị thu hồi khỏi thư viện và báo cho người đã cài, nhưng không xoá dự án của họ.
* **Quy tắc ứng xử** và **danh sách kiểm cho người duyệt** đặt trong repo cộng đồng.

### 6.4 Kiểm duyệt viên cộng đồng (D-43)

| Việc | Quy tắc |
|---|---|
| Trở thành reviewer | Có ít nhất 3 đóng góp đã được merge, được một reviewer hoặc maintainer đề cử trong issue công khai, maintainer chấp thuận; được thêm vào đội `reviewers` của tổ chức GitHub và nhận nhãn "Kiểm duyệt viên" |
| Quyền | Phê duyệt PR preset, tài nguyên, bản dịch. **Không** duyệt thay đổi CI, workflow, schema, `@dawviz/expr` (chỉ maintainer, CODEOWNERS) |
| Số phê duyệt | 2 reviewer; khi đội dưới 3 người: 1 reviewer + 1 maintainer. Không ai tự duyệt PR của mình (GitHub chặn sẵn) |
| Lĩnh vực | Có thể gán nhãn chuyên môn (preset, bản dịch theo ngôn ngữ, tài nguyên) để PR được giao đúng người |
| Thu hồi | Không hoạt động 6 tháng thì chuyển sang danh dự; duyệt sai nghiêm trọng hoặc vi phạm quy tắc ứng xử thì maintainer thu hồi quyền ngay |
| Minh bạch | Mọi phê duyệt nằm công khai trên PR; ứng dụng hiện tên người duyệt cạnh preset |
| Xác nhận quyền đóng góp | Mọi commit có `Signed-off-by` (DCO, D-42); CI kiểm |
