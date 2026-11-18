---
doc: SPIKE-3-FLP.md
doc_title: "Spike 3: đọc `.flp` (FL Studio) bằng JSON schema"
section: "7. Phương án đã cân nhắc"
path: "7. Phương án đã cân nhắc"
chunk: 7-phuong-an-da-can-nhac.md
source_lines: 94-101
source_sha1: 8c83939972
ids: [D-28]
---
## 7. Phương án đã cân nhắc

| Phương án | Nhận xét |
|---|---|
| **Giữ JSON schema (đã chọn)** | Một engine cho mọi định dạng nhị phân; người dùng ghi đè được schema (`options.schemas` ưu tiên hơn bản dựng sẵn) để vá khi FL đổi cấu trúc; kiểm toán an toàn một chỗ; đo được nhanh |
| Viết `packages/flp` bằng JS thuần | Nhanh hơn một chút và dễ viết tuần tự, nhưng thêm một package có trạng thái riêng, mất khả năng vá bằng JSON, và không chứng minh được engine tổng quát (D-28) |
| Đổi biểu diễn schema sang mô tả khác (ví dụ kiểu Kaitai) | Không cần: TLV vừa đủ; chi phí đổi cú pháp lớn hơn lợi ích |
