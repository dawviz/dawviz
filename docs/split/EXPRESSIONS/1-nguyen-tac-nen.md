---
doc: EXPRESSIONS.md
doc_title: "Biểu thức người dùng, mô hình bảo mật và kiểm duyệt cộng đồng"
section: "1. Nguyên tắc nền"
path: "1. Nguyên tắc nền"
chunk: 1-nguyen-tac-nen.md
source_lines: 5-10
source_sha1: 19ec9a9aa3
ids: [AD-08]
---
## 1. Nguyên tắc nền

1. **An toàn không được phụ thuộc vào người duyệt.** Người duyệt có thể sơ suất hoặc bị lừa. Thiết kế phải đảm bảo một preset **dù độc hại đến đâu cũng không làm hại được** máy người dùng. Kiểm duyệt cộng đồng chỉ để đảm bảo chất lượng, giấy phép và nội dung phù hợp, là lớp bảo vệ thêm chứ không phải lớp duy nhất.
2. **Preset là dữ liệu, không phải mã** (AD-08). Biểu thức cũng là dữ liệu: một chuỗi được phân tích bởi trình thông dịch của chính dự án, **không bao giờ** được chuyển thành JavaScript để chạy.
3. **Không có quyền nào để lạm dụng.** Ngôn ngữ biểu thức không có cách chạm vào mạng, DOM, bộ nhớ trình duyệt, tệp hay đồng hồ. Ngôn ngữ đó chỉ tính ra số.
