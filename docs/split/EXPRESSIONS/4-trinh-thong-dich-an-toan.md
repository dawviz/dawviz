---
doc: EXPRESSIONS.md
doc_title: "Biểu thức người dùng, mô hình bảo mật và kiểm duyệt cộng đồng"
section: "4. Trình thông dịch an toàn"
path: "4. Trình thông dịch an toàn"
chunk: 4-trinh-thong-dich-an-toan.md
source_lines: 95-121
source_sha1: 19ec9a9aa3
ids: []
---
## 4. Trình thông dịch an toàn

```text
chuỗi nguồn
  → Tokenizer (viết tay; chỉ nhận ký tự hợp lệ; từ chối Unicode lạ, ký tự điều khiển)
  → Parser Pratt (viết tay; dựng cây cú pháp; áp giới hạn §3.4)
  → Kiểm tra ngữ nghĩa (tên biến và hàm có trong danh sách trắng, đúng số và kiểu tham số)
  → "Biên dịch" thành cây closure TypeScript (KHÔNG sinh chuỗi JavaScript)
  → Đánh giá trong Worker vẽ, có bộ đếm bước
```

Quy tắc cài đặt (kiểm bằng test tĩnh và review):

1. **Cấm** `eval`, `new Function`, `Function.prototype.constructor`, `setTimeout(chuỗi)`, `with`, `import()` động, `Proxy` và `Reflect` trong mã trình thông dịch. Một test quét mã nguồn `packages/expr` tìm các từ này, giống test quét `Date`/`Math.random` của Render Core.
2. Bảng biến và bảng hàm là `Map` (hoặc `Object.create(null)`), **không** phải đối tượng thường, nên tra cứu không bao giờ chạm tới prototype.
3. Hàm có sẵn là hàm thuần, nhận số và trả số; mọi đối số được kiểm kiểu.
4. Không có đường nào từ biểu thức tới đối tượng JavaScript của ứng dụng: biểu thức chỉ nhận **bản chụp số** của dữ liệu (`note.velocity = 96`), không nhận chính đối tượng nốt.
5. Phân tích một lần khi nạp hoặc sửa; mỗi khung chỉ chạy cây closure, đủ nhanh cho hàng chục nghìn lần đánh giá.
6. Package mới `@dawviz/expr`: zero-dependency như parser (quy tắc 8 của AI_CONTEXT), dùng chung cho ứng dụng, Worker xuất và CI cộng đồng.

**Kiểm thử bắt buộc:**

* **Bộ tấn công mẫu:** `constructor`, `__proto__`, `prototype`, `this`, `globalThis`, `window`, `self`, `import`, chuỗi Unicode lẫn lộn (`ｃonstructor`), ký tự điều khiển, chuỗi siêu dài, lồng siêu sâu, `1/0`, số mũ khổng lồ. Mọi mẫu phải bị từ chối khi phân tích hoặc trả giá trị dự phòng.
* **Fuzz có seed:** sinh ngẫu nhiên hàng trăm nghìn biểu thức hợp lệ và không hợp lệ. Trình thông dịch không được ném lỗi ngoài `ExprError{code}`, không treo, không vượt ngân sách.
* **Tất định:** cùng biểu thức và cùng đầu vào cho cùng kết quả, ở Node và trình duyệt.
* **Đối chứng:** các biểu thức số học so với kết quả tính bằng tay.
