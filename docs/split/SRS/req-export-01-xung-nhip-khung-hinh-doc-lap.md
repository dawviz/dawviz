---
doc: SRS.md
doc_title: "ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION - SRS)"
section: "REQ-EXPORT-01: Xung nhịp khung hình độc lập"
path: "3. YÊU CẦU CHỨC NĂNG CHI TIẾT (FUNCTIONAL REQUIREMENTS) > 3.6. Đường ống xuất video ngoại tuyến (BR-06, BR-07) > REQ-EXPORT-01: Xung nhịp khung hình độc lập"
chunk: req-export-01-xung-nhip-khung-hinh-doc-lap.md
source_lines: 732-737
source_sha1: 3d043a49c8
ids: [REQ-EXPORT-01, REQ-GRAPHICS-05]
---
#### REQ-EXPORT-01: Xung nhịp khung hình độc lập
* Không dùng `requestAnimationFrame` hay đồng hồ phát audio. Bước `Δt = 1/FPS`; tại khung `k`: `t_k = start + k × Δt`.
* Mỗi khung: gọi Render Core với `t_k` (REQ-GRAPHICS-05) lên `OffscreenCanvas` ở độ phân giải thực; tạo `VideoFrame` với `timestamp = Math.round(k × 1,000,000 / FPS)` µs và `duration` tương ứng; `encode(frame)`; **phải** `frame.close()` ngay sau đó.
* Chỉ định khung khóa (keyframe) mỗi 2 giây.
* Số khung `N = ceil(Duration × FPS)`.
