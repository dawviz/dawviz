---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-11: Hạt không trạng thái"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) > REQ-GRAPHICS-11: Hạt không trạng thái"
chunk: req-graphics-11-hat-khong-trang-thai.md
source_lines: 919-922
source_sha1: 34fd2a9134
ids: [REQ-GRAPHICS-11]
---
#### REQ-GRAPHICS-11: Hạt không trạng thái
* **1.0:** PRNG có seed, chuyển động dạng đóng (trọng lực, lực cản), nhiễu tất định; nguồn phát theo nốt (`hit`, `sustain`, `exit`), vạch phát, nhịp, môi trường; hình hạt cơ bản và ảnh; hoà trộn cộng sáng; giới hạn số hạt (CUSTOMIZATION §7). **1.1:** attractor, sub-emitter, vệt hạt.
* **Hiện trạng (T-86, 2026-11-20):** widget `PARTICLES` — nguồn phát theo nốt (`hit`), hạt không trạng thái: mỗi nốt bắt đầu trong `life` giây gần nhất sinh `perNote` hạt (nhiều hơn khi nốt mạnh), băm số nguyên từ `(seed, id nốt, chỉ số hạt)`, vị trí là hàm đóng của tuổi (vận tốc đầu có góc/độ toả/biến thiên, trọng lực), cỡ nội suy, mờ dần; tối đa `maxParticles` (bỏ hạt của nốt cũ nhất). **T-89 (2026-11-20):** thêm nguồn phát **`NOTE`** ("Tại nốt, chỗ chạm vạch phát"): hạt xuất phát tại điểm nốt chạm vạch phát của Piano Roll đầu tiên đang hiện (ngang theo vạch phát lúc nốt bắt đầu, kể cả chế độ Trang; cao theo hàng cao độ của nốt); nốt ngoài tầm Piano Roll không sinh hạt; không có Piano Roll thì như "Giữa". Tính trong Render Core nên Preview = Export. Ở chế độ này hạt vẽ trong toạ độ khung video, **không dời/xoay/cắt theo khung widget**; không có Piano Roll thì không có hạt; chưa tính xoay của Piano Roll. **Ở thẻ Chỉnh sửa, khung của widget Hạt bị ẩn khi bật "Tại nốt"** (không vẽ khung, không chọn/quét chọn/bắt dính/tay nắm trên khung hình; chọn qua danh sách Lớp). Chưa có: nguồn vạch phát/nhịp/môi trường độc lập, lực cản, nhiễu, ảnh làm hình hạt, hoà trộn cộng sáng, `sustain`/`exit`; các đề xuất kiểu Ember còn lại (preset, hình sao/tim, ảnh người dùng làm hạt, cộng sáng) ghi ở ANIMATION-CATALOG §17.1 cho bản sau, kèm **bộ preset hạt dựng sẵn (lửa/tia lửa, khói/sương, tuyết, bokeh)**: hệ hạt đã chỉnh tay được nhưng người dùng chưa biết đặt thông số nào cho ra kiểu nào.
