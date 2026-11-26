---
doc: WIDGET-REVAMP.md
doc_title: "Tu sửa widget và mở rộng sáng tạo (đợt 2026-11-26)"
section: "0. Mục tiêu một câu"
path: "0. Mục tiêu một câu"
chunk: 0-muc-tieu-mot-cau.md
source_lines: 5-18
source_sha1: f0d5abcfcb
ids: [AD-07, AD-08, D-71, D-74, D-75]
---
## 0. Mục tiêu một câu

**Widget đơn giản cho người mới, chỉnh sâu theo nhóm cho người quen, và một bộ công cụ nhỏ (Hình, Bút, Mặt nạ, Gắn nhạc nhanh) để người dùng nâng cao tự dựng thứ mà không widget nào làm sẵn**, thay vì cứ thêm ô vào cột bên phải của từng widget.

Ba tầng, mỗi tầng chỉ thêm, không bắt buộc:

| Tầng | Ai dùng | Thấy gì |
|---|---|---|
| 1. Widget dựng sẵn (Cơ bản) | Người mới | Vài ô chính của mỗi widget; nhóm phụ ẩn sau **Thêm tuỳ chọn** |
| 2. Nhóm thuộc tính (Nâng cao) | Người quen | Mọi thuộc tính, gom theo nhóm có tiêu đề, gấp được; nhóm có công tắc thì tắt là gọn (D-71) |
| 3. Sáng tạo tự do (Chỉnh sửa) | Người dùng nâng cao | Lớp Hình, Bút/Cọ, Mặt nạ, **Gắn nhạc nhanh** cho bất kỳ thuộc tính nào (D-74, D-75) |

Tầng 3 không cần widget mới cho từng ý tưởng: "thanh tiến độ" là một hình chữ nhật có **Cắt nét** gắn vào **Tiến độ bài**; "mắt nhân vật đổi màu theo phách" là một hình vẽ bằng Bút có **Màu tô** gắn vào **Phách**. Mọi thứ vẫn là dữ liệu preset (AD-08), tất định (AD-07), và chạy qua cùng máy keyframe/binding/biểu thức đã có (T-99, T-29).
