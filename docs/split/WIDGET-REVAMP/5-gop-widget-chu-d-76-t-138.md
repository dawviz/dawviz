---
doc: WIDGET-REVAMP.md
doc_title: "Tu sửa widget và mở rộng sáng tạo (đợt 2026-11-26)"
section: "5. Gộp widget chữ (D-76, T-138)"
path: "5. Gộp widget chữ (D-76, T-138)"
chunk: 5-gop-widget-chu-d-76-t-138.md
source_lines: 156-166
source_sha1: 5eb561ef37
ids: [AD-08, D-76]
---
## 5. Gộp widget chữ (D-76, T-138)

**Không xoá loại widget nào** (preset cũ phải mở được, AD-08). Thay đổi ở cách **thêm**:

1. Menu **Thêm** chia nhóm: **Chữ** · **Nốt nhạc** (Piano Roll, Bản nhạc, Nốt đang phát…) · **Phân tích** · **Âm thanh** (Phổ tần, Âm lượng…) · **Hình và ảnh** (Hình, Ảnh, Hạt).
2. Nhóm **Chữ** chỉ còn **một mục "Chữ"** mở ra danh sách mẫu: Tiêu đề và nghệ sĩ, Đếm nốt, Thời gian và phách, Tempo, Giọng, Đoạn, Hợp âm, Lời… Mỗi mẫu là một **Ô chữ** (`TEXT`) điền sẵn chữ có chỗ giữ (`{title}`, `{artist}`, `{played}/{total}`, `{bpm}`, `{key}`, `{section}`, `{chord}`…, xem [hướng dẫn 08](../../manual/08-cho-giu.md)) và kiểu chữ phù hợp.
3. Widget chữ có phần vẽ riêng mà Ô chữ không làm được (Thời gian có thanh, Nốt đang phát có đuôi mờ, Hợp âm có dòng nốt, Lời có chữ chưa hát) vẫn là widget riêng nhưng nằm trong cùng nhóm **Chữ** của menu.
4. Widget chữ cũ có lệnh **Chuyển thành Ô chữ** khi chuyển được mà không mất gì (Tên bài và nghệ sĩ, Đếm sự kiện, Tempo, Giọng, Đoạn): cùng vị trí, thời gian, hoạt hình, kiểu chữ.

Người mới vẫn chỉ thấy một mục "Chữ" với các mẫu có tên dễ hiểu; người quen sửa thẳng chữ có chỗ giữ.
