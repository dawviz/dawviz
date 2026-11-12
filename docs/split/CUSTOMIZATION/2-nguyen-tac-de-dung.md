---
doc: CUSTOMIZATION.md
doc_title: "Tùy biến tối đa: storyboard, chuyển cảnh nốt, đường cong easing, hạt, tài nguyên và preset cộng đồng"
section: "2. Nguyên tắc dễ dùng"
path: "2. Nguyên tắc dễ dùng"
chunk: 2-nguyen-tac-de-dung.md
source_lines: 15-34
source_sha1: 7e5b12f60b
ids: []
---
## 2. Nguyên tắc dễ dùng

Storyboard viết bằng lệnh (kiểu osu!: mỗi dòng một lệnh `F`, `M`, `S`… kèm mili-giây và số hiệu easing) rất mạnh nhưng khó: phải viết tay hoặc viết script sinh ra hàng nghìn dòng. DAW Visualizer nhắm **nhiều khả năng hơn nhưng ít công sức hơn**, theo bốn tầng; người dùng dừng ở tầng nào cũng có kết quả đẹp:

| Tầng | Người dùng làm gì | Ví dụ |
|---|---|---|
| 1. Chọn | Bấm một theme hoặc preset | "Neon rơi", "Mưa hạt", "Tối giản" |
| 2. Chỉnh | Thanh trượt và ô màu cho những gì đang thấy | độ dày nốt, hướng rơi, số hạt, đường cong easing chọn từ danh sách |
| 3. Dàn dựng | Timeline: kéo keyframe, gắn thuộc tính vào dữ liệu nhạc | logo hiện ở điệp khúc, nền nháy theo nhịp, màu đổi theo độ mạnh nốt |
| 4. Nâng cao | Đồ thị giá trị/tốc độ, easing tự vẽ, biểu thức ([EXPRESSIONS](../../design/EXPRESSIONS.md)) | đường cong riêng, `0.5 + note.velocity/127 * sin(beat.phase*TAU)` |

Các quy tắc giữ cho việc tùy biến dễ:

* **Sinh từ dữ liệu nhạc trước, keyframe tay sau.** Template theo nốt (mục 3.2) và bindings (mục 3.3) làm phần lớn công việc; người dùng không phải đặt keyframe cho từng nốt.
* **Thời gian theo nhạc** (`bar.beat`) là mặc định, có bắt dính vào nhịp; đổi tempo thì cảnh vẫn khớp.
* **Xem trước tức thì** khi kéo bất kỳ thanh trượt hay keyframe nào; tua tự do vì khung hình là hàm của `t`.
* **Mọi thứ đều lưu được thành preset** và áp lên dự án khác với một cú bấm.
* **Hoàn tác mọi thao tác** (T-07); không có thao tác phá huỷ không quay lại được.
* Tên hiệu ứng và easing hiển thị bằng chữ dễ hiểu kèm hình động minh hoạ nhỏ, không bắt người dùng nhớ tên kỹ thuật.
