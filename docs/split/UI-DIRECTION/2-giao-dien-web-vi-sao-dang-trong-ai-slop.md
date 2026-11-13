---
doc: UI-DIRECTION.md
doc_title: "Định hướng hình ảnh: khung preview và giao diện web"
section: "2. Giao diện web: vì sao đang trông \"AI slop\""
path: "2. Giao diện web: vì sao đang trông \"AI slop\""
chunk: 2-giao-dien-web-vi-sao-dang-trong-ai-slop.md
source_lines: 58-77
source_sha1: a66e3a3c8c
ids: []
---
## 2. Giao diện web: vì sao đang trông "AI slop"

Sau đợt chỉnh 2026-11-12, giao diện đã gọn và đồng bộ hơn, nhưng vẫn là **mẫu mặc định của dashboard do AI sinh**: nền xanh đen, màu nhấn xanh dương điện tử, thẻ bo góc có bóng xếp lưới đều, nút viên thuốc, phông Inter, phát sáng. Không có gì sai, nhưng cũng **không có quyết định nào mang tính riêng**, nên mắt nhận ra ngay "mẫu chung".

Điểm chung của các ảnh tham chiếu ưng ý (hai ảnh từ impeccable: Verex, Alphabet Storm):

| Đặc điểm | Ở tham chiếu | Ở giao diện hiện tại |
| :--- | :--- | :--- |
| Giọng chữ | Một phông display rất mạnh (cao hẹp in hoa, hoặc grotesk siêu đậm) + nhãn nhỏ in hoa giãn chữ hoặc mono | Một phông Inter cho mọi thứ |
| Màu | Đơn sắc + đúng một màu nhấn có ý nghĩa (đồng, đen mực) | Xanh dương cho mọi thứ tương tác |
| Phân vùng | Đường kẻ mảnh 1 px, cột, đánh số mục 01–05 | Thẻ nổi có bóng |
| Nhân vật chính | Nội dung (áo choàng, chữ thành bão) chiếm phần lớn khung | Preview chỉ là một ô trong lưới |
| Trang trí | Có nghĩa: số liệu kỹ thuật, chú thích, đường dẫn chỉ | Phát sáng, bo góc, không mang thông tin |

Hai ảnh sinh bằng Gemini có ý hay (đồng trên đen; bản sáng kiểu "field notes"; đặt dải thông tin dưới sân khấu) nhưng **quá nhiều hộp và nhãn `[IN HOA TRONG NGOẶC]`**, chữ bị méo, nên chỉ dùng để lấy màu và bố cục, không chép nguyên.

**Hệ quả cho prompt:** mỗi hướng phải nêu rõ (1) một phông display, (2) đúng một màu nhấn, (3) cách phân vùng không dùng thẻ bóng đổ, (4) preview "Bản in" trắng là nhân vật chính.

---
