---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-EXPORT-05: Giao diện tiến độ và hủy"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) > REQ-EXPORT-05: Giao diện tiến độ và hủy"
chunk: req-export-05-giao-dien-tien-do-va-huy.md
source_lines: 752-754
source_sha1: 7ab053e2fc
ids: [REQ-EXPORT-05]
---
#### REQ-EXPORT-05: Giao diện tiến độ và hủy
Lớp phủ modal hiển thị: thanh tiến độ 0–100%, `Frame x / N`, tốc độ (FPS render, bội số thời gian thực, ví dụ `1.8x`), thời gian còn lại ước tính (ETR, làm mượt theo trung bình trượt). Nút **Hủy xuất**: gửi lệnh cho Export Worker, gọi `reset()`/`close()` các encoder, hủy luồng ghi (`abort()` để không để lại file dở), giải phóng bộ nhớ mà không làm sập tab. Hoàn thành thì hiển thị tên file, kích thước, thời gian xuất.
