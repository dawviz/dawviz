---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-GRAPHICS-11: Hạt không trạng thái"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.8. Tùy biến, hiệu ứng và biểu thức (D-38, D-39, D-40) > REQ-GRAPHICS-11: Hạt không trạng thái"
chunk: req-graphics-11-hat-khong-trang-thai.md
source_lines: 889-892
source_sha1: 06902f4c4f
ids: [REQ-GRAPHICS-11]
---
#### REQ-GRAPHICS-11: Hạt không trạng thái
* **1.0:** PRNG có seed, chuyển động dạng đóng (trọng lực, lực cản), nhiễu tất định; nguồn phát theo nốt (`hit`, `sustain`, `exit`), vạch phát, nhịp, môi trường; hình hạt cơ bản và ảnh; hoà trộn cộng sáng; giới hạn số hạt (CUSTOMIZATION §7). **1.1:** attractor, sub-emitter, vệt hạt.
* **Hiện trạng (T-86, 2026-11-20):** widget `PARTICLES` — nguồn phát theo nốt (`hit`), hạt không trạng thái: mỗi nốt bắt đầu trong `life` giây gần nhất sinh `perNote` hạt (nhiều hơn khi nốt mạnh), băm số nguyên từ `(seed, id nốt, chỉ số hạt)`, vị trí là hàm đóng của tuổi (vận tốc đầu có góc/độ toả/biến thiên, trọng lực), cỡ nội suy, mờ dần; tối đa `maxParticles` (bỏ hạt của nốt cũ nhất). Chưa có: vạch phát/nhịp/môi trường làm nguồn, lực cản, nhiễu, ảnh làm hình hạt, hoà trộn cộng sáng, `sustain`/`exit`.
