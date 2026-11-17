---
doc: FIREFOX-FONT-SLOWDOWN.md
doc_title: "Firefox xuất chậm dần: điều tra và cách giảm nhẹ"
section: "1. Triệu chứng (do người thử báo, Linux, cùng một máy 22 lõi)"
path: "1. Triệu chứng (do người thử báo, Linux, cùng một máy 22 lõi)"
chunk: 1-trieu-chung-do-nguoi-thu-bao-linux-cung-mot-ma.md
source_lines: 5-14
source_sha1: a549031f0a
ids: []
---
## 1. Triệu chứng (do người thử báo, Linux, cùng một máy 22 lõi)

| Trình duyệt | Bài 2:32, 1080×1080, phong cách Bản in | Ghi chú |
|---|---|---|
| Edge (Windows) | bình thường | không có vấn đề |
| Chrome (Linux) | 45 s | |
| Firefox (Linux) | **501 s** | CPU gần như rảnh (chỉ một lõi bận) |

Không phải "Firefox lưu vào bộ nhớ rồi mới ghi đĩa" như đã đoán ban đầu: việc đó chỉ làm hộp thoại hỏi nơi lưu sau khi xong, không liên quan tốc độ.
